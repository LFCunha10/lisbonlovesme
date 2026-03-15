import session, { type SessionData, type SessionOptions } from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

export type SessionUser = {
  id: number;
  username: string;
  isAdmin: boolean;
};

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    user?: SessionUser;
    csrfToken?: string;
  }
}

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = "connect.sid";
const DEVELOPMENT_SESSION_SECRET = "lisbonlovesme-session-secret";

function getSessionSecret(): string {
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
    secure: isProduction,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2,
  };
}

export function createSessionMiddleware() {
  const PgSession = connectPgSimple(session);

  return session({
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    cookie: getSessionCookieOptions(),
    name: SESSION_COOKIE_NAME,
  });
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
