import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction, type RequestHandler } from "express";
import path from "path";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import migrateData from "./migrate-data";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { createAdminUserIfNotExists } from "./auth";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { pool } from "./db";
import fs from "fs";
import { resolveUploadDir } from "./utils/uploads-path";

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(
  cors({
    origin: true, // Allow all origins in development and production
    credentials: true,
  })
);

// Serve uploaded files from a consistent directory (supports persistent volumes)
const UPLOAD_DIR = resolveUploadDir();
app.use("/uploads", express.static(UPLOAD_DIR));
// Log for troubleshooting in Render
try {
  const canWrite = (() => {
    try { fs.accessSync(UPLOAD_DIR, fs.constants.W_OK); return true; } catch { return false; }
  })();
  log(`Uploads directory: ${UPLOAD_DIR} (writable=${canWrite})`);
} catch {}

app.use(cookieParser());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "https://replit.com", "'unsafe-eval'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:"],
      frameSrc: ["'self'", "https://replit.com"]
    }
  })
);

const PgSession = connectPgSimple(session);
app.use(
  session({
    secret: process.env.SESSION_SECRET || "lisbonlovesme-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      sameSite: "lax"
    },
    name: 'connect.sid'
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  next();
});

// Initialize Passport

(async () => {
  // Create admin user if not exists
  await createAdminUserIfNotExists();
  // Migrate sample data to the database
  try {
    await migrateData();
    log("Database migration completed successfully");
  } catch (error) {
    log("Database migration error: " + error);
    // Continue with server startup even if migration fails
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5001
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || 5001;
  server.listen(
    {
      port,
      host: '0.0.0.0',
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
