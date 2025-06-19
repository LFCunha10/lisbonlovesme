import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import migrateData from "./migrate-data";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { createAdminUserIfNotExists } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from public directory
app.use("/uploads", express.static("public/uploads"));

// Set up session management
const MemoryStoreSession = MemoryStore(session);
app.use(
  session({
    secret: "lisbonlovesme-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // 24 hours
    }),
    cookie: {
      secure: false, // set to true if using https
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
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

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

app.use(express.json());

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

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
  const port = 5001;
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    log('SIGINT received, shutting down gracefully');
    server.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use. Attempting to restart...`);
      setTimeout(() => {
        server.close();
        server.listen({ port, host: "0.0.0.0" }, () => {
          log(`serving on port ${port}`);
        });
      }, 1000);
    } else {
      log(`Server error: ${err.message}`);
      throw err;
    }
  });

  server.listen({ port, host: "0.0.0.0" }, () => {
    log(`serving on port ${port}`);
  });
})();
