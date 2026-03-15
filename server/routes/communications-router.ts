import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { requireScopedApiKey } from "../api-keys";
import { sendContactFormNotification } from "../emailService.js";
import { getClientIp, geolocateIp, parseUserAgent, reverseGeocode } from "../utils/visit-utils";
import { createNotificationAndPush } from "../notificationService";
import { parseWithSchema, toErrorResponse } from "../http";
import { contactSchema, deviceRegistrationSchema } from "../schemas";
import type { RouteContext } from "./context";

export function createCommunicationsRouter(context: RouteContext) {
  const router = Router();

  router.post("/api/contact", context.contactRateLimiter, async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message, language } = parseWithSchema(contactSchema, req.body);

      await sendContactFormNotification({
        name,
        email,
        subject: subject || "General Inquiry",
        message,
        language: language || "en",
      });

      try {
        const saved = await storage.createContactMessage({
          name,
          email,
          subject: subject || null,
          message,
        } as any);
        await createNotificationAndPush({
          type: "contact",
          title: "New Contact Message",
          body: `${name} sent a message`,
          payload: { id: saved.id, email, subject },
        });
      } catch (error) {
        console.error("Failed to save contact message:", error);
      }

      res.status(200).json({
        success: true,
        message: "Message sent successfully",
      });
    } catch (error: any) {
      const { status, message } = toErrorResponse(error, "Failed to send message");
      context.logUnexpectedRouteError("Error sending contact form:", error, status);
      res.status(status).json({
        success: false,
        message,
      });
    }
  });

  router.post(
    "/api/notifications/device",
    context.deviceRegistrationRateLimiter,
    requireScopedApiKey("push:register", { allowAdminSession: true }),
    async (req: Request, res: Response) => {
      try {
        const { platform, token } = parseWithSchema(deviceRegistrationSchema, req.body);
        const dev = await storage.registerDevice(platform, token);
        res.json({ ok: true, device: { id: dev.id, platform: dev.platform, isActive: dev.isActive } });
      } catch (error: any) {
        const { status, message } = toErrorResponse(error, "Failed to register device");
        context.logUnexpectedRouteError("Device register failed:", error, status);
        res.status(status).json({ message });
      }
    },
  );

  router.get("/api/notifications", ...context.adminReadGuards, async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
    const items = await storage.getNotifications(Math.min(limit, 100), offset);

    const shaped = items.map((notification: any) => {
      const bodyRaw = notification.body;
      let bodyObj: any | undefined;

      if (typeof bodyRaw === "string") {
        try {
          bodyObj = JSON.parse(bodyRaw);
        } catch {
          bodyObj = undefined;
        }
      } else if (bodyRaw && typeof bodyRaw === "object") {
        bodyObj = bodyRaw;
      }

      if (!bodyObj) {
        const title = notification.title || "Notification";
        const whenIso: string | undefined =
          notification.payload?.when || (notification.createdAt ? new Date(notification.createdAt).toISOString() : undefined);
        const whenDate = whenIso ? new Date(whenIso) : new Date();
        const dateString = new Intl.DateTimeFormat("pt-PT", {
          dateStyle: "full",
          timeStyle: "short",
          timeZone: "Europe/Lisbon",
        }).format(whenDate);
        let location = notification.payload?.location || "";
        if (!location && typeof bodyRaw === "string" && bodyRaw.includes("·")) {
          const parts = bodyRaw.split("·").map((part: string) => part.trim());
          if (parts.length >= 1 && parts[0] && parts[0].toLowerCase() !== "unknown location") {
            location = parts[0];
          }
        }
        const device = notification.payload?.device || {};
        bodyObj = { title, dateString, location, device };
      }

      if (bodyObj && typeof bodyObj === "object" && bodyObj !== null) {
        bodyObj = { ok: true, ...bodyObj };
      }

      const { body, ...rest } = notification;
      return { ...rest, body: bodyObj, bodyRaw };
    });

    res.json(shaped);
  });

  router.patch("/api/notifications/:id/read", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const read = req.body?.read !== false;
    const ok = await storage.markNotificationRead(id, read);
    res.json({ ok });
  });

  router.post("/api/track-visit", context.visitRateLimiter, async (req: Request, res: Response) => {
    try {
      const ip = getClientIp(req);
      const userAgent = (req.headers["user-agent"] || "") as string;
      const device = parseUserAgent(userAgent);
      const geo = await geolocateIp(ip);
      const when = new Date().toISOString();
      let location = [geo.city, geo.region, geo.country].filter(Boolean).join(", ");
      let loc = geo.loc;

      const coords = (req.body && (req.body.coords || req.body.coordinates)) as
        | { lat?: number; lon?: number; lng?: number; accuracy?: number }
        | undefined;
      const latRaw = (req.body && (req.body.lat ?? req.body.latitude)) as number | undefined;
      const lonRaw = (req.body && (req.body.lon ?? req.body.lng ?? req.body.longitude)) as number | undefined;
      const lat = typeof coords?.lat === "number" ? coords.lat : latRaw;
      const lon =
        typeof (coords as any)?.lon === "number"
          ? (coords as any).lon
          : typeof (coords as any)?.lng === "number"
            ? (coords as any).lng
            : lonRaw;

      if (typeof lat === "number" && typeof lon === "number") {
        loc = `${lat},${lon}`;
        if (!location) {
          try {
            const reverse = await reverseGeocode(lat, lon);
            if (reverse.location) {
              location = reverse.location;
            }
          } catch {
            // Ignore reverse geocode failures.
          }
        }
      }

      await createNotificationAndPush({
        type: "visit",
        title: "New Site Visit",
        body: `${location || "Unknown location"} · ${device.deviceType || ""} · ${when}`,
        payload: {
          ip: geo.ip,
          location,
          loc,
          device,
          when,
          path: req.body?.path || null,
          referrer: req.body?.referrer || null,
        },
      });
      res.json({ ok: true });
    } catch (error: any) {
      console.error("track-visit failed:", error);
      res.status(500).json({ ok: false, message: error?.message || "Failed to track visit" });
    }
  });

  router.get("/api/admin/messages", ...context.adminReadGuards, async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
    const items = await storage.getContactMessages(Math.min(limit, 100), offset);
    res.json(items);
  });

  router.patch("/api/admin/messages/:id/read", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const read = req.body?.read !== false;
    const ok = await storage.markContactMessageRead(id, read);
    res.json({ ok });
  });

  return router;
}
