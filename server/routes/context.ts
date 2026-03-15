import type { Request, RequestHandler } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { hasAuthenticatedAdminSession } from "../auth";
import { requireAdminAccess, requestHasApiKeyScope } from "../api-keys";
import { createRateLimiter } from "../security";
import { normalizeCardDisplayFlag } from "../utils/card-display";
import { parseDurationHours } from "@shared/duration";
import type { Gallery, Tour } from "@shared/schema";

export type MultilingualValue = {
  en: string;
  pt: string;
  ru: string;
};

export type RouteContext = {
  stripe?: Stripe;
  adminReadGuards: readonly RequestHandler[];
  adminMutationGuards: readonly RequestHandler[];
  loginRateLimiter: RequestHandler;
  contactRateLimiter: RequestHandler;
  bookingRateLimiter: RequestHandler;
  testimonialRateLimiter: RequestHandler;
  visitRateLimiter: RequestHandler;
  deviceRegistrationRateLimiter: RequestHandler;
  isAdminRequest(req: Request): boolean;
  sanitizeBookingForReview(booking: { id: number; tourId: number; bookingReference: string }): {
    id: number;
    tourId: number;
    bookingReference: string;
  };
  getTourMap(): Promise<Map<number, Tour>>;
  getVisibleGalleryImages(images: Gallery[], req: Request): Gallery[];
  logUnexpectedRouteError(label: string, error: unknown, status: number): void;
  toML(value: unknown): MultilingualValue;
  toDurationHours(value: unknown): number;
  toChildrenPolicy(value: unknown): "not_allowed" | "allowed" | "allowed_above_12";
  toConductedBy(value: unknown): "walking" | "electric_mercedes_benz_car";
  toCardDisplay(value: unknown): boolean;
};

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

export function createRouteContext(): RouteContext {
  const adminReadGuards = [requireAdminAccess({ requiredScope: "admin:read" })] as const;
  const adminMutationGuards = [
    requireAdminAccess({ requiredScope: "admin:write", requireCsrfForSession: true }),
  ] as const;

  return {
    stripe,
    adminReadGuards,
    adminMutationGuards,
    loginRateLimiter: createRateLimiter({
      keyPrefix: "admin-login",
      windowMs: 15 * 60 * 1000,
      max: 10,
    }),
    contactRateLimiter: createRateLimiter({
      keyPrefix: "contact",
      windowMs: 15 * 60 * 1000,
      max: 15,
    }),
    bookingRateLimiter: createRateLimiter({
      keyPrefix: "booking",
      windowMs: 15 * 60 * 1000,
      max: 20,
    }),
    testimonialRateLimiter: createRateLimiter({
      keyPrefix: "testimonial",
      windowMs: 15 * 60 * 1000,
      max: 20,
    }),
    visitRateLimiter: createRateLimiter({
      keyPrefix: "visit",
      windowMs: 60 * 1000,
      max: 60,
    }),
    deviceRegistrationRateLimiter: createRateLimiter({
      keyPrefix: "device-registration",
      windowMs: 15 * 60 * 1000,
      max: 30,
    }),
    isAdminRequest(req) {
      return hasAuthenticatedAdminSession(req) || requestHasApiKeyScope(req, "admin:read");
    },
    sanitizeBookingForReview(booking) {
      return {
        id: booking.id,
        tourId: booking.tourId,
        bookingReference: booking.bookingReference,
      };
    },
    async getTourMap() {
      const tours = await storage.getAllTours();
      return new Map(tours.map((tour) => [tour.id, tour]));
    },
    getVisibleGalleryImages(images, req) {
      if (this.isAdminRequest(req)) {
        return images;
      }

      return images.filter((image) => image.isActive);
    },
    logUnexpectedRouteError(label, error, status) {
      if (status >= 500) {
        console.error(label, error);
      }
    },
    toML(value) {
      if (!value) {
        return { en: "", pt: "", ru: "" };
      }
      if (typeof value === "string") {
        return { en: value, pt: value, ru: value };
      }
      const source = value as Record<string, string>;
      return {
        en: typeof source.en === "string" ? source.en : "",
        pt: typeof source.pt === "string" ? source.pt : typeof source.en === "string" ? source.en : "",
        ru: typeof source.ru === "string" ? source.ru : typeof source.en === "string" ? source.en : "",
      };
    },
    toDurationHours(value) {
      return parseDurationHours(value, 1);
    },
    toChildrenPolicy(value) {
      if (value === "not_allowed" || value === "allowed_above_12") {
        return value;
      }
      return "allowed";
    },
    toConductedBy(value) {
      if (value === "electric_mercedes_benz_car") {
        return value;
      }
      return "walking";
    },
    toCardDisplay(value) {
      return normalizeCardDisplayFlag(value);
    },
  };
}
