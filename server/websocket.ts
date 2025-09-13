import type { Server } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import type { Notification } from "@shared/schema";

// Simple hub to manage notification websocket connections
let wss: WebSocketServer | undefined;

// For basic heartbeat to detect broken connections
function heartbeat(this: WebSocket & { isAlive?: boolean }) {
  this.isAlive = true;
}

// Broadcast a single notification to all clients
export function broadcastNotification(note: Notification) {
  if (!wss) return;
  const msg = JSON.stringify({ type: "notification", data: note });
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      try {
        client.send(msg);
      } catch {
        // ignore individual client errors
      }
    }
  }
}

// Initialize WebSocket server and attach to HTTP upgrade
export function initNotificationsWebSocketServer(server: Server) {
  if (wss) return wss;

  const PgSession = connectPgSimple(session);
  const sessionParser = session({
    secret: process.env.SESSION_SECRET || "lisbonlovesme-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 2,
      sameSite: "lax",
    },
    name: "connect.sid",
  });

  wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { url } = req;
    if (!url || !url.startsWith("/api/notifications/ws")) {
      return; // Not our path; let other handlers manage or default close
    }

    // Parse session for auth check
    sessionParser(req as any, {} as any, () => {
      const isAuthed = (req as any).session?.isAuthenticated;
      const isAdmin = (req as any).session?.isAdmin || (req as any).session?.user?.isAdmin;
      if (!isAuthed || !isAdmin) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        try { socket.destroy(); } catch {}
        return;
      }

      wss!.handleUpgrade(req, socket as any, head, (ws) => {
        wss!.emit("connection", ws, req);
      });
    });
  });

  // Manage connections
  wss.on("connection", (ws: WebSocket) => {
    (ws as any).isAlive = true;
    ws.on("pong", heartbeat);

    ws.on("message", (_data) => {
      // No-op: this channel is currently server->client broadcast only
    });

    ws.on("close", () => {
      // connection cleaned up automatically by ws
    });
  });

  // Heartbeat ping to keep proxies from killing idle connections
  const interval = setInterval(() => {
    if (!wss) return;
    for (const ws of wss.clients) {
      const sock = ws as WebSocket & { isAlive?: boolean };
      if (sock.isAlive === false) {
        try { sock.terminate(); } catch {}
        continue;
      }
      sock.isAlive = false;
      try { sock.ping(); } catch {}
    }
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

