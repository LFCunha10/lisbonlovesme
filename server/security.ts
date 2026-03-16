import crypto from "node:crypto";
import type { CorsOptionsDelegate } from "cors";
import type { Request, RequestHandler, Response } from "express";
import helmet from "helmet";

const isProduction = process.env.NODE_ENV === "production";
const csrfCookieName = "csrfToken";
const localhostHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function getAllowedOrigins(): Set<string> {
  return new Set(
    (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return (protocol === "http:" || protocol === "https:") && localhostHostnames.has(hostname);
  } catch {
    return false;
  }
}

function normalizeForwardedProtocol(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const protocol = value.split(",")[0]?.trim().toLowerCase();
  if (protocol === "http" || protocol === "https") {
    return `${protocol}:`;
  }

  return null;
}

function getRequestOriginCandidates(req: Request): string[] {
  const hosts = [req.get("x-forwarded-host"), req.get("host")].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );
  const protocols = [normalizeForwardedProtocol(req.get("x-forwarded-proto")), req.protocol ? `${req.protocol}:` : null]
    .filter((value): value is string => Boolean(value));

  const candidates = new Set<string>();
  for (const protocol of protocols) {
    for (const host of hosts) {
      candidates.add(`${protocol}//${host}`);
    }
  }

  return Array.from(candidates);
}

export function isSameOriginRequest(origin: string, req: Request): boolean {
  try {
    const requestedOrigin = new URL(origin);
    return getRequestOriginCandidates(req).some((candidate) => {
      try {
        const expectedOrigin = new URL(candidate);
        return (
          expectedOrigin.protocol === requestedOrigin.protocol &&
          expectedOrigin.host === requestedOrigin.host
        );
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function isCorsOriginAllowed(
  origin: string | undefined,
  allowedOrigins: Set<string>,
  req?: Request,
): boolean {
  if (!origin) {
    return true;
  }

  if (!isProduction) {
    return true;
  }

  if (allowedOrigins.has(origin)) {
    return true;
  }

  if (isLocalhostOrigin(origin)) {
    return true;
  }

  if (req && isSameOriginRequest(origin, req)) {
    return true;
  }

  return false;
}

export function createCorsOptions(): CorsOptionsDelegate<Request> {
  const allowedOrigins = getAllowedOrigins();

  return (req, callback) => {
    const origin = req.get("origin") ?? undefined;
    if (isCorsOriginAllowed(origin, allowedOrigins, req)) {
      callback(null, {
        origin: true,
        credentials: true,
      });
      return;
    }

    callback(new Error("Origin is not allowed by CORS"), {
      origin: false,
      credentials: true,
    });
  };
}

export function createHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: isProduction
          ? ["'self'"]
          : ["'self'", "https://replit.com", "'unsafe-eval'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        connectSrc: isProduction
          ? ["'self'", "https:", "wss:"]
          : ["'self'", "https:", "http:", "ws:", "wss:"],
        frameSrc: isProduction ? ["'self'"] : ["'self'", "https://replit.com"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getSessionCsrfToken(req: Request): string {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  return req.session.csrfToken;
}

function setCsrfCookie(req: Request, res: Response, token: string) {
  const secureRequest =
    req.secure ||
    normalizeForwardedProtocol(req.get("x-forwarded-proto")) === "https:";

  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: isProduction ? secureRequest : false,
    sameSite: "lax",
    path: "/",
  });
}

export function issueCsrfToken(req: Request, res: Response): string {
  const token = getSessionCsrfToken(req);
  setCsrfCookie(req, res, token);
  return token;
}

export const csrfTokenHandler: RequestHandler = (req, res) => {
  res.set("Cache-Control", "no-store");
  res.vary("Cookie");
  res.json({ csrfToken: issueCsrfToken(req, res) });
};

export const requireCsrf: RequestHandler = (req, res, next) => {
  const expectedToken = req.session.csrfToken;
  const receivedToken =
    req.get("x-csrf-token") ??
    req.get("csrf-token") ??
    (typeof req.body?.csrfToken === "string" ? req.body.csrfToken : undefined);

  if (!expectedToken || !receivedToken || !safeEqual(expectedToken, receivedToken)) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }

  next();
};

type RateLimiterOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

type RateLimiterEntry = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimiterOptions): RequestHandler {
  const cache = new Map<string, RateLimiterEntry>();
  const { windowMs, max, keyPrefix = "global" } = options;

  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip}`;
    const currentEntry = cache.get(key);

    if (!currentEntry || currentEntry.resetAt <= now) {
      cache.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return next();
    }

    if (currentEntry.count >= max) {
      const retryAfterSeconds = Math.ceil((currentEntry.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    currentEntry.count += 1;
    cache.set(key, currentEntry);
    next();
  };
}
