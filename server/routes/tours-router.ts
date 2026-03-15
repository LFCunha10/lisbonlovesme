import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { autoTranslateTourContent, translateField } from "../translation-service.js";
import { createNotificationAndPush } from "../notificationService";
import { createAppError, parseWithSchema, toErrorResponse } from "../http";
import { testimonialSchema } from "../schemas";
import type { RouteContext } from "./context";

export function createToursRouter(context: RouteContext) {
  const router = Router();

  router.get("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      const tour = await storage.getTour(tourId);

      if (!tour || (!tour.isActive && !context.isAdminRequest(req))) {
        return res.status(404).json({ message: "Tour not found" });
      }

      const testimonials = await storage.getTestimonials(tourId, true);
      res.json({ ...tour, testimonials });
    } catch (error) {
      const { status, message } = toErrorResponse(error, "Failed to retrieve tour");
      res.status(status).json({ message });
    }
  });

  router.get("/api/tours", async (req: Request, res: Response) => {
    try {
      const includeAll = req.query.all === "1" || req.query.all === "true";
      if (includeAll && !context.isAdminRequest(req)) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }
      const tours = includeAll ? await storage.getAllTours() : await storage.getTours();
      res.json(tours);
    } catch (error) {
      const { status, message } = toErrorResponse(error, "Failed to retrieve tours");
      res.status(status).json({ message });
    }
  });

  router.post("/api/tours", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const payload: any = {
        name: context.toML(body.name),
        shortDescription: body.shortDescription ? context.toML(body.shortDescription) : { en: "", pt: "", ru: "" },
        description: context.toML(body.description),
        imageUrl: body.imageUrl,
        duration: context.toDurationHours(body.duration),
        displayDurationInCard: context.toCardDisplay(body.displayDurationInCard),
        displayGroupSizeInCard: context.toCardDisplay(body.displayGroupSizeInCard),
        displayChildrenInCard: context.toCardDisplay(body.displayChildrenInCard),
        displayConductedByInCard: context.toCardDisplay(body.displayConductedByInCard),
        displayDifficultyInCard: context.toCardDisplay(body.displayDifficultyInCard),
        childrenPolicy: context.toChildrenPolicy(body.childrenPolicy),
        conductedBy: context.toConductedBy(body.conductedBy),
        maxGroupSize: body.maxGroupSize,
        difficulty: context.toML(body.difficulty),
        price: body.price,
        priceType: body.priceType || "per_person",
        badge: body.badge ? context.toML(body.badge) : { en: "", pt: "", ru: "" },
        badgeColor: body.badgeColor ?? null,
        isActive: body.isActive ?? true,
      };
      const tour = await storage.createTour(payload);
      res.status(201).json(tour);
    } catch (error: any) {
      console.error("Create tour error:", error);
      res.status(500).json({ message: error.message || "Failed to create tour" });
    }
  });

  router.post("/api/tours/auto-translate", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { name, shortDescription, description, duration, difficulty, badge } = req.body;
      if (!name || !description || !duration || !difficulty) {
        return res.status(400).json({
          message: "Name, description, duration, and difficulty are required for translation",
        });
      }

      const translations = await autoTranslateTourContent({
        name,
        shortDescription: shortDescription || "",
        description,
        duration,
        difficulty,
        badge: badge || "",
      });

      res.json(translations);
    } catch (error: any) {
      console.error("Auto-translation error:", error);
      res.status(500).json({
        message: error.message || "Failed to auto-translate content",
      });
    }
  });

  router.post("/api/translate-tour", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { sourceData, sourceLang, targetLangs } = req.body;
      if (!sourceData || !sourceLang || !targetLangs) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { TranslationService } = await import("../translation-api.js");
      const translations = await TranslationService.translateTourFields(sourceData, sourceLang, targetLangs);
      res.json({ translations });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  router.post("/api/translate-field", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { TranslationService } = await import("../translation-api.js");
      const translatedText = await TranslationService.translateText(text, targetLang, sourceLang);
      res.json({
        translatedText,
        sourceLang,
        targetLang,
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  router.post("/api/translate-field-old", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required for translation" });
      }

      const translations = await translateField(text);
      res.json(translations);
    } catch (error: any) {
      console.error("Field translation error:", error);
      res.status(500).json({
        message: error.message || "Failed to translate field",
      });
    }
  });

  router.put("/api/tours/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      const body = req.body || {};
      const update: any = {};

      if (body.name !== undefined) update.name = context.toML(body.name);
      if (body.shortDescription !== undefined) update.shortDescription = context.toML(body.shortDescription);
      if (body.description !== undefined) update.description = context.toML(body.description);
      if (body.imageUrl !== undefined) update.imageUrl = body.imageUrl;
      if (body.duration !== undefined) update.duration = context.toDurationHours(body.duration);
      if (body.displayDurationInCard !== undefined) update.displayDurationInCard = context.toCardDisplay(body.displayDurationInCard);
      if (body.displayGroupSizeInCard !== undefined) update.displayGroupSizeInCard = context.toCardDisplay(body.displayGroupSizeInCard);
      if (body.displayChildrenInCard !== undefined) update.displayChildrenInCard = context.toCardDisplay(body.displayChildrenInCard);
      if (body.displayConductedByInCard !== undefined) update.displayConductedByInCard = context.toCardDisplay(body.displayConductedByInCard);
      if (body.displayDifficultyInCard !== undefined) update.displayDifficultyInCard = context.toCardDisplay(body.displayDifficultyInCard);
      if (body.childrenPolicy !== undefined) update.childrenPolicy = context.toChildrenPolicy(body.childrenPolicy);
      if (body.conductedBy !== undefined) update.conductedBy = context.toConductedBy(body.conductedBy);
      if (body.maxGroupSize !== undefined) update.maxGroupSize = body.maxGroupSize;
      if (body.difficulty !== undefined) update.difficulty = context.toML(body.difficulty);
      if (body.price !== undefined) update.price = body.price;
      if (body.priceType !== undefined) update.priceType = body.priceType;
      if (body.badge !== undefined) update.badge = context.toML(body.badge);
      if (body.badgeColor !== undefined) update.badgeColor = body.badgeColor;
      if (body.isActive !== undefined) update.isActive = body.isActive;

      const updatedTour = await storage.updateTour(tourId, update);
      if (!updatedTour) {
        return res.status(404).json({ message: "Tour not found" });
      }

      res.json(updatedTour);
    } catch (error: any) {
      console.error("Update tour error:", error);
      res.status(500).json({ message: error.message || "Failed to update tour" });
    }
  });

  router.delete("/api/tours/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      const success = await storage.deleteTour(tourId);
      if (!success) {
        return res.status(404).json({ message: "Tour not found" });
      }

      res.json({ message: "Tour deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete tour" });
    }
  });

  router.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      const approvedOnly = req.query.approvedOnly !== "false";

      if (!approvedOnly && !context.isAdminRequest(req)) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const testimonials = await storage.getTestimonials(tourId, approvedOnly);
      res.json(testimonials);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve testimonials" });
    }
  });

  router.post("/api/testimonials", context.testimonialRateLimiter, async (req: Request, res: Response) => {
    try {
      const payload = parseWithSchema(testimonialSchema, req.body);
      if (payload.bookingReference) {
        const booking = await storage.getBookingByReference(payload.bookingReference);
        if (!booking || booking.tourId !== payload.tourId) {
          throw createAppError(400, "Booking reference does not match this tour");
        }
      }

      const testimonial = await storage.createTestimonial(payload);
      try {
        await createNotificationAndPush({
          type: "review",
          title: "New Review Submitted",
          body: `${testimonial.customerName} · ⭐️ ${testimonial.rating}`,
          payload: { id: testimonial.id, tourId: testimonial.tourId },
        });
      } catch (notificationError) {
        console.error("Failed to create review notification:", notificationError);
      }
      res.json(testimonial);
    } catch (error: any) {
      const { status, message } = toErrorResponse(error, "Error creating testimonial");
      context.logUnexpectedRouteError("Create testimonial error:", error, status);
      res.status(status).json({ message });
    }
  });

  router.put("/api/testimonials/:id/approve", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const testimonial = await storage.approveTestimonial(parseInt(req.params.id));
      if (!testimonial) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      res.json(testimonial);
    } catch (error: any) {
      res.status(500).json({ message: "Error approving testimonial: " + error.message });
    }
  });

  router.get("/api/availabilities", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      const [availabilities, closedDays] = await Promise.all([
        storage.getAvailabilities(tourId),
        storage.getClosedDays(),
      ]);

      const closedDateSet = new Set(closedDays.map((entry) => entry.date));
      res.json(availabilities.filter((availability) => !closedDateSet.has(availability.date)));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve availabilities" });
    }
  });

  router.get("/api/availabilities/:tourId", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.tourId);
      const [availabilities, closedDays] = await Promise.all([
        storage.getAvailabilities(tourId),
        storage.getClosedDays(),
      ]);

      const closedDateSet = new Set(closedDays.map((entry) => entry.date));
      res.json(availabilities.filter((availability) => !closedDateSet.has(availability.date)));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve availabilities" });
    }
  });

  router.post("/api/availabilities", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const availability = await storage.createAvailability(req.body);
      res.status(201).json(availability);
    } catch (error: any) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: error.message || "Failed to create availability" });
    }
  });

  router.put("/api/availabilities/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const availability = await storage.updateAvailability(id, req.body);
      if (!availability) {
        return res.status(404).json({ message: "Availability not found" });
      }

      res.json(availability);
    } catch (error: any) {
      console.error("Error updating availability:", error);
      res.status(500).json({ message: error.message || "Failed to update availability" });
    }
  });

  router.delete("/api/availabilities/bulk", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { ids } = req.body ?? {};
      if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "number" || Number.isNaN(id))) {
        return res.status(400).json({ message: "A list of availability IDs is required" });
      }

      const deletedCount = await storage.deleteAvailabilities(ids);
      if (deletedCount === 0) {
        return res.status(404).json({ message: "No availabilities were deleted" });
      }

      res.json({ message: "Availabilities deleted successfully", deletedCount });
    } catch (error: any) {
      console.error("Error bulk deleting availabilities:", error);
      res.status(500).json({ message: error.message || "Failed to delete availabilities" });
    }
  });

  router.delete("/api/availabilities/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAvailability(id);
      if (!success) {
        return res.status(404).json({ message: "Availability not found" });
      }

      res.json({ message: "Availability deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: error.message || "Failed to delete availability" });
    }
  });

  router.get("/api/closed-days", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const closedDays = await storage.getClosedDays();
      res.json(closedDays);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve closed days" });
    }
  });

  router.post("/api/closed-days", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { date, reason } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }

      const closedDay = await storage.addClosedDay(date, reason);
      res.status(201).json(closedDay);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to add closed day" });
    }
  });

  router.delete("/api/closed-days/:date", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const success = await storage.removeClosedDay(req.params.date);
      if (!success) {
        return res.status(404).json({ message: "Closed day not found" });
      }

      res.json({ message: "Closed day removed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to remove closed day" });
    }
  });

  return router;
}
