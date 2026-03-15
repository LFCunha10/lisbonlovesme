import session, { type SessionData } from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { getSessionCookieName, getSessionCookieOptions, getSessionSecret } from "./session-config";

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

export function createSessionMiddleware() {
  const PgSession = connectPgSimple(session);
  const sessionCookieName = getSessionCookieName();

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
    name: sessionCookieName,
  });
}
