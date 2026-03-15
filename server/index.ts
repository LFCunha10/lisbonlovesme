import dotenv from "dotenv";
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import migrateData from "./migrate-data";
import { createAdminUserIfNotExists } from "./auth";
import fs from "fs";
import { resolveUploadDir } from "./utils/uploads-path";
import { createHelmetMiddleware, createCorsOptions } from "./security";
import { createSessionMiddleware } from "./session";
import { toErrorResponse } from "./http";
import { validateApiKeyConfiguration } from "./api-keys";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.disable("x-powered-by");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cors(createCorsOptions()));

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

app.use(createHelmetMiddleware());
app.use(createSessionMiddleware());
validateApiKeyConfiguration();

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
    const { status, message } = toErrorResponse(err);
    log(`Unhandled error: ${message}`);
    res.status(status).json({ message });
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
