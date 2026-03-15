import crypto from "node:crypto";
import type { CorsOptions } from "cors";
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

export function isCorsOriginAllowed(origin: string | undefined, allowedOrigins: Set<string>): boolean {
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

  return false;
}

export function createCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (isCorsOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
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
  res.cookie(csrfCookieName, token, {
    httpOnly: false,
    secure: isProduction,
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
