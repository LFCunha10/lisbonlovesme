import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import {
  sendBookingConfirmationEmail,
  sendBookingRequestNotification,
  sendRequestConfirmationEmail,
  sendReviewRequestEmail,
} from "../emailService.js";
import { createNotificationAndPush } from "../notificationService";
import { getLocalizedText } from "../utils/tour-utils.js";
import { formatDurationHours } from "@shared/duration";
import { createAppError, parseWithSchema, toErrorResponse } from "../http";
import {
  adminRequestUpdateSchema,
  bookingSchema,
  discountValidationSchema,
} from "../schemas";
import type { RouteContext } from "./context";

export function createBookingsRouter(context: RouteContext) {
  const router = Router();

  router.get("/api/admin/payments", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const [bookings, tours, availabilities] = await Promise.all([
        storage.getBookings(),
        storage.getAllTours(),
        storage.getAvailabilities(),
      ]);

      const tourMap = new Map(tours.map((tour) => [tour.id, tour]));
      const availabilityMap = new Map(availabilities.map((availability) => [availability.id, availability]));
      const enrichedBookings = bookings.map((booking) => {
        const tour = tourMap.get(booking.tourId);
        const availability = availabilityMap.get(booking.availabilityId);

        return {
          ...booking,
          tourName: tour?.name || "Unknown Tour",
          date: availability?.date || "",
          time: availability?.time || "",
        };
      });

      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments data" });
    }
  });

  router.get("/api/admin/discounts", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const items = await storage.getDiscountCodes();
      res.json(items);
    } catch (error: any) {
      console.error("Fetch discounts failed:", error);
      res.status(500).json({ message: error?.message || "Failed to fetch discount codes" });
    }
  });

  router.post("/api/admin/discounts", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { code, name, category, value, validUntil, usageLimit, oneTime } = req.body || {};
      if (!code || !name || !category || typeof value !== "number") {
        return res.status(400).json({ message: "code, name, category and numeric value are required" });
      }

      const normalized: any = {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        category: String(category).trim(),
        value: Number(value),
      };
      if (validUntil) normalized.validUntil = new Date(validUntil);
      const limit = oneTime ? 1 : usageLimit ? Number(usageLimit) : undefined;
      if (limit !== undefined) {
        normalized.usageLimit = limit;
      }

      const created = await storage.createDiscountCode(normalized);
      res.status(201).json(created);
    } catch (error: any) {
      console.error("Create discount failed:", error);
      res.status(500).json({ message: error?.message || "Failed to create discount code" });
    }
  });

  router.delete("/api/admin/discounts/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const ok = await storage.deleteDiscountCode(id);
      res.json({ success: ok });
    } catch (error: any) {
      console.error("Delete discount failed:", error);
      res.status(500).json({ message: error?.message || "Failed to delete discount code" });
    }
  });

  router.post("/api/discounts/validate", async (req: Request, res: Response) => {
    try {
      const { code, tourId, numberOfParticipants } = parseWithSchema(discountValidationSchema, req.body);
      const tour = await storage.getTour(tourId);
      if (!tour) {
        return res.status(404).json({ valid: false, reason: "Tour not found" });
      }

      const discountCode = await storage.getDiscountCodeByCode(code.trim().toUpperCase());
      if (!discountCode || discountCode.isActive === false) {
        return res.status(404).json({ valid: false, reason: "Invalid code" });
      }

      const now = new Date();
      if (discountCode.validUntil && new Date(discountCode.validUntil) < now) {
        return res.status(400).json({ valid: false, reason: "Code expired" });
      }
      if (discountCode.usageLimit && discountCode.usedCount && discountCode.usedCount >= discountCode.usageLimit) {
        return res.status(400).json({ valid: false, reason: "Usage limit reached" });
      }

      const originalAmount = tour.priceType === "per_group" ? tour.price : numberOfParticipants * tour.price;
      let discountAmount = 0;
      if (discountCode.category === "percentage") {
        discountAmount = Math.floor(originalAmount * (discountCode.value / 100));
      } else if (discountCode.category === "fixed_value") {
        discountAmount = Math.min(discountCode.value, originalAmount);
      } else if (discountCode.category === "free_tour") {
        if (tour.priceType !== "per_person") {
          return res.status(400).json({ valid: false, reason: "Free tour code only valid for per-person tours" });
        }
        const freePeople = Math.max(0, Math.min(discountCode.value, numberOfParticipants));
        discountAmount = freePeople * tour.price;
      } else {
        return res.status(400).json({ valid: false, reason: "Unsupported code category" });
      }

      res.json({
        valid: true,
        code: discountCode.code,
        name: discountCode.name,
        category: discountCode.category,
        value: discountCode.value,
        originalAmount,
        discountAmount,
        totalAmount: Math.max(0, originalAmount - discountAmount),
      });
    } catch (error: any) {
      console.error("Validate discount failed:", error);
      res.status(500).json({ valid: false, reason: error?.message || "Internal error" });
    }
  });

  router.post("/api/admin/refund/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { reason } = req.body;

      if (!context.stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (!booking.stripePaymentIntentId) {
        return res.status(400).json({ message: "No payment intent found for this booking" });
      }

      const refund = await context.stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        reason: "requested_by_customer",
      });

      const updatedBooking = await storage.updatePaymentStatus(bookingId, "refunded");
      const additionalInfo = (booking.additionalInfo as any) || {};
      additionalInfo.refundReason = reason;
      additionalInfo.refundDate = new Date().toISOString();
      additionalInfo.refundId = refund.id;
      await storage.updateBooking(bookingId, {
        additionalInfo: additionalInfo as any,
      });

      res.json({ message: "Refund processed successfully", booking: updatedBooking });
    } catch (error: any) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: error.message || "Failed to process refund" });
    }
  });

  router.post("/api/send-booking-email", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    const { to, name, bookingReference, tourName, date, time, participants, totalAmount, meetingPoint, duration } = req.body;

    try {
      await sendBookingConfirmationEmail({
        to,
        name,
        bookingReference,
        tourName,
        date,
        time,
        participants,
        totalAmount,
        meetingPoint,
        duration,
        language: req.body.language || "en",
      });

      res.status(200).json({ success: true });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      const errorMessage =
        emailError instanceof Error
          ? emailError.message
          : typeof emailError === "string"
            ? emailError
            : JSON.stringify(emailError);

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  router.post("/api/send-request-email", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    const { to, name, bookingReference, tourName, date, time, participants, totalAmount, meetingPoint, duration } = req.body;

    try {
      await sendRequestConfirmationEmail({
        to,
        name,
        bookingReference,
        tourName,
        date,
        time,
        participants,
        totalAmount,
        meetingPoint,
        duration,
      });

      res.status(200).json({ success: true });
    } catch (emailError) {
      console.error("Email send error:", emailError);
      const errorMessage =
        emailError instanceof Error
          ? emailError.message
          : typeof emailError === "string"
            ? emailError
            : JSON.stringify(emailError);

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  router.post("/api/send-review-email/:bookingId", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(parseInt(req.params.bookingId));
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      const tour = await storage.getTour(booking.tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }

      const baseUrl = req.headers.origin || "https://your-domain.com";
      await sendReviewRequestEmail({
        to: booking.customerEmail,
        customerName: booking.customerFirstName,
        bookingReference: booking.bookingReference,
        tourName: getLocalizedText(tour.name, booking.language || "en"),
        baseUrl,
      });

      res.json({ message: "Review request email sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending review email: " + error.message });
    }
  });

  router.get("/api/bookings", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  router.get("/api/admin/bookings", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  router.post("/api/test-review-email", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const { email, customerName } = req.body;
      const baseUrl = req.headers.origin || req.headers.host || "https://your-domain.replit.app";

      await sendReviewRequestEmail({
        to: email,
        customerName: customerName || "Valued Customer",
        bookingReference: "TEST-" + Date.now(),
        tourName: "Alfama Historical Walking Tour",
        baseUrl,
      });

      res.json({
        message: "Test review email sent successfully!",
        sentTo: email,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending test email: " + error.message });
    }
  });

  router.get("/api/bookings/reference/:reference", async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBookingByReference(req.params.reference);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(context.sanitizeBookingForReview(booking));
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching booking: " + error.message });
    }
  });

  router.get("/api/admin/requests", ...context.adminReadGuards, async (_req: Request, res: Response) => {
    try {
      const [bookings, tourMap] = await Promise.all([storage.getBookings(), context.getTourMap()]);
      const requests = bookings
        .filter((booking) => ["requested", "confirmed", "cancelled"].includes(booking.paymentStatus || ""))
        .map((booking) => ({
          ...booking,
          additionalInfo:
            typeof booking.additionalInfo === "string"
              ? JSON.parse(booking.additionalInfo)
              : booking.additionalInfo ?? null,
        }));

      const requestsWithTours = requests.map((request) => {
        const tour = tourMap.get(request.tourId);
        return {
          ...request,
          tour: tour ? { name: tour.name, duration: tour.duration } : null,
        };
      });

      res.json(requestsWithTours);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  router.put("/api/admin/requests/:id", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const updateData = parseWithSchema(adminRequestUpdateSchema, req.body);
      const updatedBooking = await storage.updateBooking(bookingId, updateData);
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking request not found" });
      }

      res.json(updatedBooking);
    } catch (error: any) {
      console.error("Error updating booking request:", error);
      res.status(500).json({ message: "Failed to update booking request", error: error?.message || String(error) });
    }
  });

  router.post("/api/admin/requests/:id/confirm", ...context.adminMutationGuards, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking request not found" });
      }

      const tour = await storage.getTour(booking.tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }

      const additionalInfo =
        typeof booking.additionalInfo === "string" ? JSON.parse(booking.additionalInfo) : booking.additionalInfo ?? {};

      const confirmationDate = booking.confirmedDate || additionalInfo?.date;
      const confirmationTime = booking.confirmedTime || additionalInfo?.time;
      const meetingPoint = booking.confirmedMeetingPoint || booking.meetingPoint;
      const adminNotes = booking.adminNotes || "-";

      if (!confirmationDate || !confirmationTime || !meetingPoint) {
        return res.status(400).json({
          message: "Confirmation date, time, and meeting point are required before sending confirmation email.",
        });
      }

      const timeValid = /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(confirmationTime));
      const dateValid = !Number.isNaN(new Date(String(confirmationDate)).getTime());
      if (!timeValid || !dateValid) {
        return res.status(400).json({
          message: "Invalid confirmation date/time format. Expected date parseable by server and time as HH:mm.",
        });
      }

      await sendBookingConfirmationEmail({
        to: booking.customerEmail,
        name: `${booking.customerFirstName} ${booking.customerLastName}`,
        bookingReference: booking.bookingReference,
        tourName: getLocalizedText(tour.name, booking.language || "en"),
        date: confirmationDate,
        time: confirmationTime,
        participants: booking.numberOfParticipants,
        totalAmount: `€${(booking.totalAmount / 100).toFixed(2)}`,
        originalAmount: (booking as any).additionalInfo?.pricing?.originalAmount
          ? `${(Number((booking as any).additionalInfo.pricing.originalAmount) / 100).toFixed(2)}`
          : undefined,
        discountAmount: (booking as any).additionalInfo?.pricing?.discount?.appliedAmount
          ? `${(Number((booking as any).additionalInfo.pricing.discount.appliedAmount) / 100).toFixed(2)}`
          : undefined,
        discountCode: (booking as any).additionalInfo?.pricing?.discount?.code,
        meetingPoint,
        duration: formatDurationHours(tour.duration, booking.language || "en"),
        adminNotes,
        language: booking.language || "en",
      });

      await storage.updateBooking(bookingId, { paymentStatus: "confirmed" });
      res.json({ message: "Confirmation email sent successfully" });
    } catch (error: any) {
      console.error("Error sending confirmation email:", error);
      res.status(500).json({ message: error?.message || "Failed to send confirmation email" });
    }
  });

  router.post("/api/bookings", context.bookingRateLimiter, async (req: Request, res: Response) => {
    try {
      const body = parseWithSchema(bookingSchema, req.body);
      const tour = await storage.getTour(body.tourId);
      if (!tour || !tour.isActive) {
        return res.status(404).json({ success: false, message: "Tour not found" });
      }

      const availabilityBeforeBooking = await storage.getAvailability(body.availabilityId);
      if (!availabilityBeforeBooking) {
        return res.status(404).json({ success: false, message: "Availability not found" });
      }

      const participants = body.numberOfParticipants;
      if (participants > availabilityBeforeBooking.spotsLeft) {
        return res.status(409).json({ success: false, message: "Not enough spots available" });
      }

      const closedDay = await storage.getClosedDay(availabilityBeforeBooking.date);
      if (closedDay) {
        return res.status(409).json({ success: false, message: "Selected date is not available" });
      }

      const originalAmount = tour.priceType === "per_group" ? tour.price : participants * tour.price;
      let discountInfo: any = undefined;
      let discountAmount = 0;
      const discountCodeRaw = body.discountCode ? body.discountCode.trim().toUpperCase() : undefined;
      if (discountCodeRaw) {
        const discountCode = await storage.getDiscountCodeByCode(discountCodeRaw);
        const now = new Date();
        if (
          discountCode &&
          discountCode.isActive !== false &&
          (!discountCode.validUntil || new Date(discountCode.validUntil) >= now) &&
          (!discountCode.usageLimit || (discountCode.usedCount || 0) < discountCode.usageLimit)
        ) {
          if (discountCode.category === "percentage") {
            discountAmount = Math.floor(originalAmount * (discountCode.value / 100));
          } else if (discountCode.category === "fixed_value") {
            discountAmount = Math.min(discountCode.value, originalAmount);
          } else if (discountCode.category === "free_tour" && tour.priceType === "per_person") {
            const freePeople = Math.max(0, Math.min(discountCode.value, participants));
            discountAmount = freePeople * tour.price;
          }

          if (discountAmount > 0) {
            discountInfo = {
              code: discountCode.code,
              name: discountCode.name,
              category: discountCode.category,
              value: discountCode.value,
              appliedAmount: discountAmount,
            };
          }
        }
      }

      const totalAmountComputed = Math.max(0, originalAmount - (discountAmount || 0));
      const bookingData = {
        ...body,
        specialRequests: body.specialRequests ?? null,
        totalAmount: totalAmountComputed,
        paymentStatus: "requested",
        language: body.language ?? "en",
        stripePaymentIntentId: null,
        meetingPoint: null,
        confirmedDate: null,
        confirmedTime: null,
        confirmedMeetingPoint: null,
        adminNotes: null,
        additionalInfo: {
          ...(body.additionalInfo || {}),
          pricing: {
            originalAmount,
            discount: discountInfo || null,
            finalAmount: totalAmountComputed,
          },
        },
      };

      const { booking, availability: reservedAvailability } = await storage.createBookingReservation(bookingData);
      const spotsRemaining = reservedAvailability.spotsLeft;
      const autoCloseSetting = await storage.getAutoCloseDaySetting();

      if (autoCloseSetting) {
        await storage.addClosedDay(availabilityBeforeBooking.date, "Auto-closed due to booking");
      }
      if (spotsRemaining <= 0) {
        await storage.addClosedDay(availabilityBeforeBooking.date, "Closed due to lack of spots");
      }

      try {
        if (discountInfo) {
          const discountCode = await storage.getDiscountCodeByCode(discountInfo.code);
          if (discountCode) {
            await storage.incrementDiscountUsage(discountCode.id);
          }
        }
      } catch (error) {
        console.error("Failed to increment discount usage:", error);
      }

      try {
        const bookedTour = await storage.getTour(booking.tourId);
        if (bookedTour) {
          await sendRequestConfirmationEmail({
            to: booking.customerEmail,
            name: `${booking.customerFirstName} ${booking.customerLastName}`,
            bookingReference: booking.bookingReference,
            tourName: getLocalizedText(bookedTour.name, booking.language || "en"),
            date: reservedAvailability.date,
            time: reservedAvailability.time,
            participants: booking.numberOfParticipants,
            totalAmount: (booking.totalAmount / 100).toFixed(2),
            originalAmount: (originalAmount / 100).toFixed(2),
            discountAmount: ((discountAmount || 0) / 100).toFixed(2),
            discountCode: discountInfo?.code,
            meetingPoint: booking.meetingPoint || "To be announced",
            duration: formatDurationHours(bookedTour.duration, booking.language || "en"),
            language: booking.language || "en",
          });

          await sendBookingRequestNotification({
            customerName: `${booking.customerFirstName} ${booking.customerLastName}`,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            tourName: getLocalizedText(bookedTour.name, booking.language || "en"),
            date: reservedAvailability.date,
            time: reservedAvailability.time,
            participants: booking.numberOfParticipants,
            specialRequests: booking.specialRequests ?? undefined,
            bookingReference: booking.bookingReference,
            language: booking.language || "en",
            originalAmount: (originalAmount / 100).toFixed(2),
            discountAmount: ((discountAmount || 0) / 100).toFixed(2),
            discountCode: discountInfo?.code,
            totalAmount: (totalAmountComputed / 100).toFixed(2),
          });
        }
      } catch (emailError) {
        console.error("Failed to send emails:", emailError);
      }

      try {
        await createNotificationAndPush({
          type: "booking",
          title: "New Booking Request",
          body: `${booking.customerFirstName} ${booking.customerLastName} · ${booking.numberOfParticipants} people`,
          payload: { id: booking.id, bookingReference: booking.bookingReference, tourId: booking.tourId },
        });
      } catch (notificationError) {
        console.error("Failed to create booking notification:", notificationError);
      }

      return res.status(201).json({
        success: true,
        ...booking,
      });
    } catch (error: any) {
      const { status, message } = toErrorResponse(error, "Failed to create booking");
      context.logUnexpectedRouteError("Error creating booking:", error, status);
      return res.status(status).json({
        success: false,
        message,
      });
    }
  });

  return router;
}
