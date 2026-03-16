import type { SessionOptions } from "express-session";

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = "connect.sid";
const DEVELOPMENT_SESSION_SECRET = "lisbonlovesme-session-secret";

export function getSessionSecret(): string {
  const configuredSecret = process.env.SESSION_SECRET?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (isProduction) {
    throw new Error("SESSION_SECRET must be configured in production.");
  }

  return DEVELOPMENT_SESSION_SECRET;
}

export function getSessionCookieOptions(): SessionOptions["cookie"] {
  return {
    httpOnly: true,
    secure: isProduction ? "auto" : false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
