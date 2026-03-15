import type { Express } from "express";
import { createServer, type Server } from "http";
import { initNotificationsWebSocketServer } from "./websocket";
import { createRouteContext } from "./routes/context";
import { createAuthRouter } from "./routes/auth-router";
import { createToursRouter } from "./routes/tours-router";
import { createBookingsRouter } from "./routes/bookings-router";
import { createCommunicationsRouter } from "./routes/communications-router";
import { createAdminContentRouter } from "./routes/admin-content-router";
import { createFilesRouter } from "./routes/files-router";

export async function registerRoutes(app: Express): Promise<Server> {
  const context = createRouteContext();

  app.use(createAuthRouter(context));
  app.use(createToursRouter(context));
  app.use(createBookingsRouter(context));
  app.use(createCommunicationsRouter(context));
  app.use(createAdminContentRouter(context));
  app.use(createFilesRouter(context));

  const httpServer = createServer(app);
  initNotificationsWebSocketServer(httpServer);
  return httpServer;
}
