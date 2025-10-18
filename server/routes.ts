import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { sendBookingConfirmationEmail, sendRequestConfirmationEmail, sendReviewRequestEmail, sendBookingRequestNotification, sendContactFormNotification, verifyEmailTransport, sendTestEmail } from "./emailService.js";
import { autoTranslateTourContent, translateField } from "./translation-service.js";
import { exportDatabase } from "./utils/export-database-complete";
import { upload, handleUploadErrors, getUploadedFileUrl, getImageStoredFilePath } from "./utils/image-upload";
import { uploadDocument, handleDocumentUploadErrors, getStoredFilePath } from "./utils/document-upload";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./auth";
import { getClientIp, parseUserAgent, geolocateIp, reverseGeocode } from "./utils/visit-utils";
import { createNotificationAndPush } from "./notificationService";
import { getLocalizedText } from "./utils/tour-utils.js";
import csurf from "csurf";
import bcrypt from "bcryptjs";
import { initNotificationsWebSocketServer } from "./websocket";
import type { DiscountCode } from "@shared/schema";
import { resolveUploadDir } from "./utils/uploads-path";

// Session augmentation for custom session properties
declare module "express-session" {
  interface SessionData {
    isAuthenticated: boolean;
    isAdmin: boolean;
    user?: {
      id: number;
      username: string;
      isAdmin: boolean;
    };
  }
}

// Create a new Stripe instance with your secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

function generateRandomString(x: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < x; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

const csrfProtection = csurf({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}) as RequestHandler;

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper to coerce legacy strings to multilingual objects
  const toML = (v: any): { en: string; pt: string; ru: string } => {
    if (!v) return { en: '', pt: '', ru: '' };
    if (typeof v === 'string') return { en: v, pt: v, ru: v };
    const src = v as Record<string, string>;
    return {
      en: typeof src?.en === 'string' ? src.en : '',
      pt: typeof src?.pt === 'string' ? src.pt : (typeof src?.en === 'string' ? src.en : ''),
      ru: typeof src?.ru === 'string' ? src.ru : (typeof src?.en === 'string' ? src.en : ''),
    };
  };

  // CSRF protection
  app.get("/api/csrf-token", csrfProtection, (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Expose authenticated admin user route
  app.get("/api/admin/me", async (req: Request, res: Response) => {
    if (!req.session?.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(req.session.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      isAdmin: user.isAdmin
    });
  });

app.post("/api/admin/create-user", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      isAdmin: true
    });

    res.status(201).json({ message: "Admin user created", user: { id: newUser.id, username: newUser.username } });
  } catch (err: any) {
    console.error("Create user error:", err);
    res.status(500).json({ message: err.message || "Failed to create user" });
  }
});

  // Payment management routes
  app.get("/api/admin/payments", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // Get all bookings with payment info
      const bookings = await storage.getBookings();
      
      // Enrich with tour data
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const tour = await storage.getTour(booking.tourId);
          const availability = await storage.getAvailability(booking.availabilityId);
          
          return {
            ...booking,
            tourName: tour?.name || "Unknown Tour",
            date: availability?.date || "",
            time: availability?.time || "",
          };
        })
      );
      
      res.json(enrichedBookings);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments data" });
    }
  });

  // Admin: Discount codes CRUD
  app.get("/api/admin/discounts", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const items = await storage.getDiscountCodes();
      res.json(items);
    } catch (e: any) {
      console.error('Fetch discounts failed:', e);
      res.status(500).json({ message: e?.message || 'Failed to fetch discount codes' });
    }
  });

  app.post("/api/admin/discounts", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { code, name, category, value, validUntil, usageLimit, oneTime } = req.body || {};
      if (!code || !name || !category || typeof value !== 'number') {
        return res.status(400).json({ message: 'code, name, category and numeric value are required' });
      }
      const normalized: any = {
        code: String(code).trim().toUpperCase(),
        name: String(name).trim(),
        category: String(category).trim(),
        value: Number(value),
      };
      if (validUntil) normalized.validUntil = new Date(validUntil);
      const limit = oneTime ? 1 : (usageLimit ? Number(usageLimit) : undefined);
      if (limit !== undefined) normalized.usageLimit = limit;
      const created = await storage.createDiscountCode(normalized);
      res.status(201).json(created);
    } catch (e: any) {
      console.error('Create discount failed:', e);
      res.status(500).json({ message: e?.message || 'Failed to create discount code' });
    }
  });

  app.delete("/api/admin/discounts/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (!id) return res.status(400).json({ message: 'Invalid id' });
      const ok = await storage.deleteDiscountCode(id);
      res.json({ success: ok });
    } catch (e: any) {
      console.error('Delete discount failed:', e);
      res.status(500).json({ message: e?.message || 'Failed to delete discount code' });
    }
  });

  // Public: validate discount code and compute totals
  app.post("/api/discounts/validate", async (req: Request, res: Response) => {
    try {
      const { code, tourId, numberOfParticipants } = req.body || {};
      if (!code || !tourId || !numberOfParticipants) {
        return res.status(400).json({ valid: false, reason: 'Missing code, tourId or participants' });
      }
      const tour = await storage.getTour(parseInt(tourId));
      if (!tour) return res.status(404).json({ valid: false, reason: 'Tour not found' });
      const dc = await storage.getDiscountCodeByCode(String(code).trim().toUpperCase());
      if (!dc || dc.isActive === false) return res.status(404).json({ valid: false, reason: 'Invalid code' });
      const now = new Date();
      if (dc.validUntil && new Date(dc.validUntil) < now) {
        return res.status(400).json({ valid: false, reason: 'Code expired' });
      }
      if (dc.usageLimit && dc.usedCount && dc.usedCount >= dc.usageLimit) {
        return res.status(400).json({ valid: false, reason: 'Usage limit reached' });
      }
      const participants = parseInt(numberOfParticipants);
      const originalAmount = tour.priceType === 'per_group' ? tour.price : (participants * tour.price);
      let discountAmount = 0;
      const category = dc.category;
      if (category === 'percentage') {
        discountAmount = Math.floor(originalAmount * (dc.value / 100));
      } else if (category === 'fixed_value') {
        discountAmount = Math.min(dc.value, originalAmount);
      } else if (category === 'free_tour') {
        if (tour.priceType !== 'per_person') {
          return res.status(400).json({ valid: false, reason: 'Free tour code only valid for per-person tours' });
        }
        const freePeople = Math.max(0, Math.min(dc.value, participants));
        discountAmount = freePeople * tour.price;
      } else {
        return res.status(400).json({ valid: false, reason: 'Unsupported code category' });
      }
      const totalAmount = Math.max(0, originalAmount - discountAmount);
      return res.json({
        valid: true,
        code: dc.code,
        name: dc.name,
        category: dc.category,
        value: dc.value,
        originalAmount,
        discountAmount,
        totalAmount,
      });
    } catch (e: any) {
      console.error('Validate discount failed:', e);
      res.status(500).json({ valid: false, reason: e?.message || 'Internal error' });
    }
  });

  app.post("/api/admin/refund/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Check if booking has a payment intent
      if (!booking.stripePaymentIntentId) {
        return res.status(400).json({ message: "No payment intent found for this booking" });
      }
      
      // Process refund through Stripe
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        reason: "requested_by_customer",
      });
      
      // Update booking status
      const updatedBooking = await storage.updatePaymentStatus(bookingId, "refunded");
      
      // Add reason to additional info
      const additionalInfo = booking.additionalInfo as any || {};
      additionalInfo.refundReason = reason;
      additionalInfo.refundDate = new Date().toISOString();
      additionalInfo.refundId = refund.id;
      
      await storage.updateBooking(bookingId, { 
        additionalInfo: additionalInfo as any
      });
      
      res.json({ message: "Refund processed successfully", booking: updatedBooking });
    } catch (error: any) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: error.message || "Failed to process refund" });
    }
  });

  //Send Booking Confirmation email
  app.post('/api/send-booking-email', async (req, res) => {
    const { to, name, bookingReference,  tourName, date, time, participants, totalAmount, meetingPoint, duration} = req.body;
    
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
          language: req.body.language || 'en'
        });
        
        res.status(200).json({ success: true});
    } catch (emailError) {
      console.error('Email send error:', emailError);
      const errorMessage =
        emailError instanceof Error
          ? emailError.message
          : typeof emailError === 'string'
            ? emailError
            : JSON.stringify(emailError);

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
      // Non-blocking failure
    }
  });

   //Send request confirmation email
   app.post('/api/send-request-email', async (req, res) => {
    const { to, name, bookingReference,  tourName, date, time, participants, totalAmount, meetingPoint, duration} = req.body;
    
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
          duration
        });
        
        res.status(200).json({ success: true});
    } catch (emailError) {
      console.error('Email send error:', emailError);
      const errorMessage =
        emailError instanceof Error
          ? emailError.message
          : typeof emailError === 'string'
            ? emailError
            : JSON.stringify(emailError);

      res.status(500).json({
        success: false,
        error: errorMessage,
      });
      // Non-blocking failure
    }
  });

  // Authentication routes
  app.post("/api/admin/login", csrfProtection, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Try to get the user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if password matches
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user is admin
      if (!user.isAdmin) {
        return res.status(403).json({ message: "You do not have admin privileges" });
      }
      
      // Set session data
      req.session.isAuthenticated = true;
      req.session.isAdmin = true;
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: true
      };
      
      
      
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          isAdmin: true
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "An error occurred during login" });
    }
  });
  
  app.get("/api/admin/session", (req: Request, res: Response) => {
    if (req.session?.isAuthenticated && req.session?.user?.isAdmin) {
      res.json({
        isAuthenticated: true,
        isAdmin: true,
        user: req.session.user,
      });
    } else {
      res.json({
        isAuthenticated: false,
        isAdmin: false,
      });
    }
  });
  
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }

        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: "lax"
        });

        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.status(200).json({ message: "No session to destroy" });
    }
  });

  // Tour routes
  app.get("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      const tour = await storage.getTour(tourId);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      // Get related testimonials
      const testimonials = await storage.getTestimonials(tourId, true);
      
      res.json({ ...tour, testimonials });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve tour" });
    }
  });
  
  app.get("/api/tours", async (req: Request, res: Response) => {
    try {
      const includeAll = req.query.all === '1' || req.query.all === 'true';
      const tours = includeAll ? await storage.getAllTours() : await storage.getTours();
      res.json(tours);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve tours" });
    }
  });
  
  app.post("/api/tours", async (req: Request, res: Response) => {
    try {
      const b = req.body || {};
      // sanitize + normalize payload to expected DB shape
      const payload: any = {
        name: toML(b.name),
        shortDescription: b.shortDescription ? toML(b.shortDescription) : { en: '', pt: '', ru: '' },
        description: toML(b.description),
        imageUrl: b.imageUrl,
        duration: toML(b.duration),
        maxGroupSize: b.maxGroupSize,
        difficulty: toML(b.difficulty),
        price: b.price,
        priceType: b.priceType || 'per_person',
        badge: b.badge ? toML(b.badge) : { en: '', pt: '', ru: '' },
        badgeColor: b.badgeColor ?? null,
        isActive: b.isActive ?? true,
      };
      const tour = await storage.createTour(payload);
      res.status(201).json(tour);
    } catch (error: any) {
      console.error('Create tour error:', error);
      res.status(500).json({ message: error.message || "Failed to create tour" });
    }
  });

  // Auto-translate tour content endpoint
  app.post("/api/tours/auto-translate", async (req: Request, res: Response) => {
    try {
      const { name, shortDescription, description, duration, difficulty, badge } = req.body;
      
      if (!name || !description || !duration || !difficulty) {
        return res.status(400).json({ 
          message: "Name, description, duration, and difficulty are required for translation" 
        });
      }

      const translations = await autoTranslateTourContent({
        name,
        shortDescription: shortDescription || '',
        description,
        duration,
        difficulty,
        badge: badge || ''
      });

      res.json(translations);
    } catch (error: any) {
      console.error("Auto-translation error:", error);
      res.status(500).json({ 
        message: error.message || "Failed to auto-translate content" 
      });
    }
  });

  // Translate single field endpoint
  app.post("/api/translate-tour", async (req: Request, res: Response) => {
    try {
      const { sourceData, sourceLang, targetLangs } = req.body;
      
      if (!sourceData || !sourceLang || !targetLangs) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { TranslationService } = await import('./translation-api.js');
      const translations = await TranslationService.translateTourFields(
        sourceData,
        sourceLang,
        targetLangs
      );

      res.json({ translations });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/translate-field", async (req: Request, res: Response) => {
    try {
      const { text, sourceLang, targetLang } = req.body;
      
      if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Import translation service
      const { TranslationService } = await import('./translation-api.js');
      const translatedText = await TranslationService.translateText(text, targetLang, sourceLang);

      res.json({ 
        translatedText,
        sourceLang,
        targetLang 
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/translate-field-old", async (req: Request, res: Response) => {
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
        message: error.message || "Failed to translate field" 
      });
    }
  });
  
  app.put("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      const b = req.body || {};

      // Build a partial update with only provided fields, normalized
      const update: any = {};
      if (b.name !== undefined) update.name = toML(b.name);
      if (b.shortDescription !== undefined) update.shortDescription = toML(b.shortDescription);
      if (b.description !== undefined) update.description = toML(b.description);
      if (b.imageUrl !== undefined) update.imageUrl = b.imageUrl;
      if (b.duration !== undefined) update.duration = toML(b.duration);
      if (b.maxGroupSize !== undefined) update.maxGroupSize = b.maxGroupSize;
      if (b.difficulty !== undefined) update.difficulty = toML(b.difficulty);
      if (b.price !== undefined) update.price = b.price;
      if (b.priceType !== undefined) update.priceType = b.priceType;
      if (b.badge !== undefined) update.badge = toML(b.badge);
      if (b.badgeColor !== undefined) update.badgeColor = b.badgeColor;
      if (b.isActive !== undefined) update.isActive = b.isActive;

      const updatedTour = await storage.updateTour(tourId, update);
      if (!updatedTour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      res.json(updatedTour);
    } catch (error: any) {
      console.error('Update tour error:', error);
      res.status(500).json({ message: error.message || "Failed to update tour" });
    }
  });
  
  app.delete("/api/tours/:id", async (req: Request, res: Response) => {
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
  
  // Send review request email
  app.post("/api/send-review-email/:bookingId", async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;
      const booking = await storage.getBooking(parseInt(bookingId));
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const tour = await storage.getTour(booking.tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      const baseUrl = req.headers.origin || 'https://your-domain.com';
      
      await sendReviewRequestEmail({
        to: booking.customerEmail,
        customerName: booking.customerFirstName,
        bookingReference: booking.bookingReference,
        tourName: getLocalizedText(tour.name, booking.language || 'en'),
        baseUrl: baseUrl
      });
      
      res.json({ message: "Review request email sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending review email: " + error.message });
    }
  });

  app.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      const approvedOnly = req.query.approvedOnly !== 'false'; // Default to true
      
      const testimonials = await storage.getTestimonials(tourId, approvedOnly);
      res.json(testimonials);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve testimonials" });
    }
  });

  // Submit new testimonial/review
  app.post("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const testimonial = await storage.createTestimonial({
        ...req.body,
        isApproved: false,
      });
      // Push notification for new review
      try {
        await createNotificationAndPush({
          type: 'review',
          title: 'New Review Submitted',
          body: `${testimonial.customerName} · ⭐️ ${testimonial.rating}`,
          payload: { id: testimonial.id, tourId: testimonial.tourId }
        });
      } catch (e) {
        console.error('Failed to create review notification:', e);
      }
      res.json(testimonial);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating testimonial: " + error.message });
    }
  });

  // Approve testimonial
  app.put("/api/testimonials/:id/approve", async (req: Request, res: Response) => {
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

  // Get all bookings (for calendar display)
  app.get("/api/bookings", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  // Get admin bookings (for review management)
  app.get("/api/admin/bookings", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching bookings: " + error.message });
    }
  });

  // Test endpoint to send review email
  app.post("/api/test-review-email", async (req: Request, res: Response) => {
    try {
      const { email, customerName } = req.body;
      const baseUrl = req.headers.origin || req.headers.host || 'https://your-domain.replit.app';
      
      await sendReviewRequestEmail({
        to: email,
        customerName: customerName || 'Valued Customer',
        bookingReference: 'TEST-' + Date.now(),
        tourName: 'Alfama Historical Walking Tour',
        baseUrl: baseUrl
      });
      
      res.json({ 
        message: "Test review email sent successfully!",
        sentTo: email
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending test email: " + error.message });
    }
  });
  
  // Availability management routes
  app.get("/api/availabilities", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      const availabilities = await storage.getAvailabilities(tourId);
      
      // Filter out availabilities for closed days
      const filteredAvailabilities = [];
      for (const availability of availabilities) {
        const isClosed = await storage.isDateClosed(availability.date);
        if (!isClosed) {
          filteredAvailabilities.push(availability);
        }
      }
      
      res.json(filteredAvailabilities);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve availabilities" });
    }
  });

  app.get("/api/availabilities/:tourId", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.tourId);
      const availabilities = await storage.getAvailabilities(tourId);
      
      // Filter out availabilities for closed days
      const filteredAvailabilities = [];
      for (const availability of availabilities) {
        const isClosed = await storage.isDateClosed(availability.date);
        if (!isClosed) {
          filteredAvailabilities.push(availability);
        }
      }
      
      res.json(filteredAvailabilities);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve availabilities" });
    }
  });
  
  app.post("/api/availabilities", async (req: Request, res: Response) => {
    try {
      const availability = await storage.createAvailability(req.body);
      res.status(201).json(availability);
    } catch (error: any) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: error.message || "Failed to create availability" });
    }
  });

  app.put("/api/availabilities/:id", async (req: Request, res: Response) => {
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

  app.delete("/api/availabilities/:id", async (req: Request, res: Response) => {
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

  // Closed days routes
  app.get("/api/closed-days", async (req: Request, res: Response) => {
    try {
      const closedDays = await storage.getClosedDays();
      res.json(closedDays);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve closed days" });
    }
  });
  
  app.post("/api/closed-days", async (req: Request, res: Response) => {
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
  
  app.delete("/api/closed-days/:date", async (req: Request, res: Response) => {
    try {
      const date = req.params.date;
      const success = await storage.removeClosedDay(date);
      
      if (!success) {
        return res.status(404).json({ message: "Closed day not found" });
      }
      
      res.json({ message: "Closed day removed successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to remove closed day" });
    }
  });
  
  // Admin settings routes
  app.get("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAdminSettings();
      res.json(settings || {});
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve admin settings" });
    }
  });
  
  app.put("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.updateAdminSettings(req.body);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update admin settings" });
    }
  });
  
  // Booking route - fixed for better reliability
  // Get booking by reference (for review page)
  app.get("/api/bookings/reference/:reference", async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      const booking = await storage.getBookingByReference(reference);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching booking: " + error.message });
    }
  });

  // Get booking requests (admin only)
  app.get("/api/admin/requests", async (req: Request, res: Response) => {
    try {
      const bookings = await storage.getBookings();
      // Include tour information and parse additional info
      const requests = bookings
        .filter(booking => booking.paymentStatus === "requested" || booking.paymentStatus === "confirmed" || booking.paymentStatus === "cancelled")
        .map(booking => ({
          ...booking,
          additionalInfo: typeof booking.additionalInfo === "string"
            ? JSON.parse(booking.additionalInfo)
            : booking.additionalInfo ?? null
        }));
      
      // Get tour details for each request
      const requestsWithTours = await Promise.all(
        requests.map(async (request) => {
          const tour = await storage.getTour(request.tourId);
          return {
            ...request,
            tour: tour ? { name: tour.name, duration: tour.duration } : null
          };
        })
      );
      
      res.json(requestsWithTours);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      res.status(500).json({ message: "Failed to fetch booking requests" });
    }
  });

  // Update booking request status (admin only)
  app.put("/api/admin/requests/:id", async (req: Request, res: Response) => {
    try {
      const bookingId = parseInt(req.params.id);
      const updateData = req.body;
      
      
      
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

  // Send confirmation email for booking request (admin only)
  app.post("/api/admin/requests/:id/confirm", async (req: Request, res: Response) => {
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
      
      const additionalInfo = typeof booking.additionalInfo === 'string'
        ? JSON.parse(booking.additionalInfo)
        : booking.additionalInfo ?? {};

      // Use confirmed details if available, otherwise use original request details
      const confirmationDate = booking.confirmedDate || additionalInfo?.date || 'TBD';
      const confirmationTime = booking.confirmedTime || additionalInfo?.time || 'TBD';
      const meetingPoint = booking.confirmedMeetingPoint || booking.meetingPoint || 'TBD';
      const adminNotes = booking.adminNotes || '-';
      
      await sendBookingConfirmationEmail({
        to: booking.customerEmail,
        name: `${booking.customerFirstName} ${booking.customerLastName}`,
        bookingReference: booking.bookingReference,
        tourName: getLocalizedText(tour.name, booking.language || 'en'),
        date: confirmationDate,
        time: confirmationTime,
        participants: booking.numberOfParticipants,
        totalAmount: `€${(booking.totalAmount / 100).toFixed(2)}`,
        originalAmount: (booking as any).additionalInfo?.pricing?.originalAmount ? `${(Number((booking as any).additionalInfo.pricing.originalAmount) / 100).toFixed(2)}` : undefined,
        discountAmount: (booking as any).additionalInfo?.pricing?.discount?.appliedAmount ? `${(Number((booking as any).additionalInfo.pricing.discount.appliedAmount) / 100).toFixed(2)}` : undefined,
        discountCode: (booking as any).additionalInfo?.pricing?.discount?.code,
        meetingPoint: meetingPoint,
        duration: getLocalizedText(tour.duration, booking.language || 'en') ?? undefined,
        adminNotes: adminNotes,
        language: booking.language || 'en'
      });
      
      // Update booking status to confirmed
      await storage.updateBooking(bookingId, { paymentStatus: "confirmed" });
      
      res.json({ message: "Confirmation email sent successfully" });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      res.status(500).json({ message: "Failed to send confirmation email" });
    }
  });

  app.post("/api/bookings", async (req: Request, res: Response) => {


  try {
    // 1. Normalize inputs and compute totals server-side
    const body = req.body || {};
    const tour = await storage.getTour(parseInt(body.tourId));
    if (!tour) {
      return res.status(404).json({ success: false, message: "Tour not found" });
    }
    const participants = parseInt(body.numberOfParticipants);
    const originalAmount = tour.priceType === 'per_group' ? tour.price : (participants * tour.price);
    let discountInfo: any = undefined;
    let discountAmount = 0;
    const discountCodeRaw = body.discountCode ? String(body.discountCode).trim().toUpperCase() : undefined;
    if (discountCodeRaw) {
      const dc = await storage.getDiscountCodeByCode(discountCodeRaw);
      const now = new Date();
      if (dc && dc.isActive !== false && (!dc.validUntil || new Date(dc.validUntil) >= now) && (!dc.usageLimit || (dc.usedCount || 0) < dc.usageLimit)) {
        if (dc.category === 'percentage') {
          discountAmount = Math.floor(originalAmount * (dc.value / 100));
        } else if (dc.category === 'fixed_value') {
          discountAmount = Math.min(dc.value, originalAmount);
        } else if (dc.category === 'free_tour') {
          if (tour.priceType === 'per_person') {
            const freePeople = Math.max(0, Math.min(dc.value, participants));
            discountAmount = freePeople * tour.price;
          }
        }
        if (discountAmount > 0) {
          discountInfo = { code: dc.code, name: dc.name, category: dc.category, value: dc.value, appliedAmount: discountAmount };
        }
      }
    }
    const totalAmountComputed = Math.max(0, originalAmount - (discountAmount || 0));

    // 2. Insert booking with requested status and computed totals
    const bookingData = {
      ...body,
      totalAmount: totalAmountComputed,
      paymentStatus: "requested",
      bookingReference: `LT-${generateRandomString(7)}`,
      additionalInfo: {
        ...(body.additionalInfo || {}),
        pricing: {
          originalAmount,
          discount: discountInfo || null,
          finalAmount: totalAmountComputed,
        },
      },
    };
    const booking = await storage.createBooking(bookingData);

    // 2. Fetch availability
    const availability = await storage.getAvailability(booking.availabilityId);
    if (!availability) {
      return res.status(404).json({ success: false, message: "Availability not found" });
    }

    // 3. Update spots left
    const spotsRemaining = Math.max(0, availability.spotsLeft - booking.numberOfParticipants);
    await storage.updateAvailability(availability.id, { spotsLeft: spotsRemaining });
    

    // 4. Auto-close day if needed
   
    const autoCloseSetting = await storage.getAutoCloseDaySetting();
    
    if (autoCloseSetting) {
      await storage.addClosedDay(availability.date, "Auto-closed due to booking");
      
    }
    if (spotsRemaining <= 0) {
      await storage.addClosedDay(availability.date, "Closed due to lack of spots");
      
    }
 
   

    // 3b. Increment discount usage counter if applied
    try {
      if (discountInfo) {
        const dc = await storage.getDiscountCodeByCode(discountInfo.code);
        if (dc) await storage.incrementDiscountUsage(dc.id);
      }
    } catch (e) {
      console.error('Failed to increment discount usage:', e);
    }

    // 4. Send notification emails
    try {
      const tour = await storage.getTour(booking.tourId);
      if (tour) {
        // Send customer request confirmation
        await sendRequestConfirmationEmail({
          to: booking.customerEmail,
          name: `${booking.customerFirstName} ${booking.customerLastName}`,
          bookingReference: booking.bookingReference,
          tourName: getLocalizedText(tour.name, booking.language || 'en'),
          date: availability.date,
          time: availability.time,
          participants: booking.numberOfParticipants,
          totalAmount: (booking.totalAmount / 100).toFixed(2),
          originalAmount: (originalAmount / 100).toFixed(2),
          discountAmount: ((discountAmount || 0) / 100).toFixed(2),
          discountCode: discountInfo?.code,
          meetingPoint: booking.meetingPoint || "To be announced",
          duration: getLocalizedText(tour.duration, booking.language || 'en') ?? undefined,
          language: booking.language || 'en'
        });
        
        // Send admin notification
        await sendBookingRequestNotification({
          customerName: `${booking.customerFirstName} ${booking.customerLastName}`,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          tourName: getLocalizedText(tour.name, booking.language || 'en'),
          date: availability.date,
          time: availability.time,
          participants: booking.numberOfParticipants,
          specialRequests: booking.specialRequests ?? undefined,
          bookingReference: booking.bookingReference,
          language: booking.language || 'en',
          originalAmount: (originalAmount / 100).toFixed(2),
          discountAmount: ((discountAmount || 0) / 100).toFixed(2),
          discountCode: discountInfo?.code,
          totalAmount: (totalAmountComputed / 100).toFixed(2)
        });
        
        
      }
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // Non-blocking failure
    }

    // 6. Notify admin app
    try {
      await createNotificationAndPush({
        type: 'booking',
        title: 'New Booking Request',
        body: `${booking.customerFirstName} ${booking.customerLastName} · ${booking.numberOfParticipants} people`,
        payload: { id: booking.id, bookingReference: booking.bookingReference, tourId: booking.tourId },
      });
    } catch (e) {
      console.error('Failed to create booking notification:', e);
    }

    // 7. Respond to client
    return res.status(201).json({
      success: true,
      ...booking
    });

  } catch (error: any) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create booking"
    });
  }
});

  // Contact form endpoint
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message, language } = req.body;
      
      if (!name || !email || !message) {
        return res.status(400).json({ message: "Name, email, and message are required" });
      }
      
      // Use the existing sendContactFormNotification function
      await sendContactFormNotification({
        name,
        email,
        subject: subject || "General Inquiry",
        message,
        language: language || 'en'
      });
      // Persist message for admin app
      try {
        const saved = await storage.createContactMessage({
          name,
          email,
          subject: subject || null,
          message,
        } as any);
        // Create an in-app notification and optional push
        await createNotificationAndPush({
          type: 'contact',
          title: 'New Contact Message',
          body: `${name} sent a message`,
          payload: { id: saved.id, email, subject },
        });
      } catch (e) {
        console.error('Failed to save contact message:', e);
      }
      
      res.status(200).json({
        success: true,
        message: "Message sent successfully"
      });
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to send message" 
      });
    }
  });

  // Device registration for push notifications
  app.post("/api/notifications/device", async (req: Request, res: Response) => {
    try {
      const { platform, token } = req.body || {};
      if (!platform || !token) {
        return res.status(400).json({ message: 'platform and token are required' });
      }
      const dev = await storage.registerDevice(platform, token);
      res.json({ ok: true, device: { id: dev.id, platform: dev.platform, isActive: dev.isActive } });
    } catch (e: any) {
      console.error('Device register failed:', e);
      res.status(500).json({ message: e?.message || 'Failed to register device' });
    }
  });

  // List notifications (admin)
  app.get("/api/notifications", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
    const items = await storage.getNotifications(Math.min(limit, 100), offset);

    const shaped = items.map((n: any) => {
      const bodyRaw = n.body;
      let bodyObj: any | undefined;

      if (typeof bodyRaw === 'string') {
        try { bodyObj = JSON.parse(bodyRaw); } catch { bodyObj = undefined; }
      } else if (bodyRaw && typeof bodyRaw === 'object') {
        bodyObj = bodyRaw;
      }

      if (!bodyObj) {
        const title = n.title || 'Notification';
        const whenIso: string | undefined = n.payload?.when || (n.createdAt ? new Date(n.createdAt).toISOString() : undefined);
        const whenDate = whenIso ? new Date(whenIso) : new Date();
        const dateString = new Intl.DateTimeFormat('pt-PT', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Europe/Lisbon',
        }).format(whenDate);
        let location = n.payload?.location || '';
        if (!location && typeof bodyRaw === 'string' && bodyRaw.includes('·')) {
          const parts = bodyRaw.split('·').map((s: string) => s.trim());
          if (parts.length >= 1 && parts[0] && parts[0].toLowerCase() !== 'unknown location') {
            location = parts[0];
          }
        }
        const device = n.payload?.device || {};
        bodyObj = { title, dateString, location, device };
      }

      // Ensure shape and include ok flag
      if (bodyObj && typeof bodyObj === 'object' && bodyObj !== null) {
        bodyObj = { ok: true, ...bodyObj };
      }

      // Replace body with structured object; include bodyRaw for backwards compatibility
      const { body, ...rest } = n;
      return { ...rest, body: bodyObj, bodyRaw };
    });

    
    res.json(shaped);
  });

  // Mark notification read
  app.patch("/api/notifications/:id/read", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const read = req.body?.read !== false;
    const ok = await storage.markNotificationRead(id, read);
    res.json({ ok });
  });

  // Visit tracking endpoint
  app.post("/api/track-visit", async (req: Request, res: Response) => {
    try {
      const ip = getClientIp(req);
      const ua = (req.headers['user-agent'] || '') as string;
      const device = parseUserAgent(ua);
      const geo = await geolocateIp(ip);
      const when = new Date().toISOString();
      const title = 'New Site Visit';
      let location = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');

      // If the client provided precise coordinates, prefer them
      let loc = geo.loc;
      const coords = (req.body && (req.body.coords || req.body.coordinates)) as { lat?: number; lon?: number; lng?: number; accuracy?: number } | undefined;
      const latRaw = (req.body && (req.body.lat ?? req.body.latitude)) as number | undefined;
      const lonRaw = (req.body && (req.body.lon ?? req.body.lng ?? req.body.longitude)) as number | undefined;
      const lat = typeof coords?.lat === 'number' ? coords!.lat : latRaw;
      const lon = typeof (coords as any)?.lon === 'number' ? (coords as any).lon : (typeof (coords as any)?.lng === 'number' ? (coords as any).lng : lonRaw);
      if (typeof lat === 'number' && typeof lon === 'number') {
        loc = `${lat},${lon}`;
        if (!location) {
          try {
            const rev = await reverseGeocode(lat, lon);
            if (rev.location) location = rev.location;
          } catch {
            // ignore reverse geocode errors
          }
        }
      }

      const body = `${location || 'Unknown location'} · ${device.deviceType || ''} · ${when}`;
      await createNotificationAndPush({
        type: 'visit',
        title,
        body,
        payload: {
          ip: geo.ip,
          location,
          loc,
          device,
          when,
          path: req.body?.path || null,
          referrer: req.body?.referrer || null,
        }
      });
      res.json({ ok: true });
    } catch (e: any) {
      console.error('track-visit failed:', e);
      res.status(500).json({ ok: false, message: e?.message || 'Failed to track visit' });
    }
  });

  // Admin: list contact messages
  app.get("/api/admin/messages", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const limit = req.query.limit ? parseInt(String(req.query.limit)) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset)) : 0;
    const items = await storage.getContactMessages(Math.min(limit, 100), offset);
    res.json(items);
  });

  app.patch("/api/admin/messages/:id/read", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const read = req.body?.read !== false;
    const ok = await storage.markContactMessageRead(id, read);
    res.json({ ok });
  });

  // === ARTICLE MANAGEMENT ROUTES ===
  // Articles routes
  app.get("/api/articles", async (req: Request, res: Response) => {
    try {
      const parentId = req.query.parentId ? parseInt(req.query.parentId as string) : undefined;
      const published = req.query.published === 'true';
      
      let articles = await storage.getArticles();
      if (published) {
        articles = articles.filter(a => a.isPublished);
      }
      if (parentId !== undefined) {
        articles = articles.filter(a => a.parentId === parentId);
      }
      
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching articles: " + error.message });
    }
  });

  app.get("/api/articles/tree", async (req: Request, res: Response) => {
    try {
      const published = req.query.published === 'true';
      let articles;
      if (published) {
        const allArticles = await storage.getArticles();
        articles = allArticles.filter(a => a.isPublished);
      } else {
        articles = await storage.getArticleTree();
      }
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article tree: " + error.message });
    }
  });

  app.get("/api/articles/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article: " + error.message });
    }
  });

  app.get("/api/articles/slug/:slug", async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const article = await storage.getArticleBySlug(slug);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching article: " + error.message });
    }
  });

  app.post("/api/articles", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const article = await storage.createArticle(req.body);
      res.status(201).json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error creating article: " + error.message });
    }
  });

  app.put("/api/articles/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.updateArticle(id, req.body);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: "Error updating article: " + error.message });
    }
  });

  app.delete("/api/articles/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteArticle(id);
      
      if (success) {
        res.json({ message: "Article deleted successfully" });
      } else {
        res.status(404).json({ message: "Article not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting article: " + error.message });
    }
  });

  // Image Upload Endpoint
  app.post("/api/upload-image", upload.single('image'), handleUploadErrors, (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }
      
      // Generate the URL for the uploaded file
      const imageUrl = getUploadedFileUrl(req.file.filename);
      
      res.status(200).json({
        message: "Image uploaded successfully",
        imageUrl: imageUrl
      });
    } catch (error: any) {
      console.error("Image upload error:", error);
      res.status(500).json({ message: error.message || "Image upload failed" });
    }
  });

  // Export Database Endpoint
  app.get("/api/export-database", async (req: Request, res: Response) => {
    try {
      
      
      // Create export directory if it doesn't exist
      const exportDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Generate the export file
      const exportPath = await exportDatabase();
      
      // Check if file exists and is readable
      if (!fs.existsSync(exportPath)) {
        throw new Error(`Export file does not exist at ${exportPath}`);
      }
      
      // Set appropriate headers for the response
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(exportPath)}"`);
      
      // Read the export file as a full SQL file with schema and data
      fs.readFile(exportPath, 'utf8', (err, data) => {
        if (err) {
          console.error("Error reading export file:", err);
          return res.status(500).json({ message: "Error reading export file" });
        }
        
        // Just send the complete SQL file that already contains schema and data
        
        res.send(data);
      });
    } catch (error: any) {
      console.error("Database export failed:", error);
      res.status(500).json({ message: error.message || "Database export failed" });
    }
  });

  // Gallery routes
  app.get("/api/gallery", async (req: Request, res: Response) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve gallery images" });
    }
  });

  app.post("/api/gallery", async (req: Request, res: Response) => {
    try {
      const image = await storage.createGalleryImage({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      res.status(201).json(image);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create gallery image" });
    }
  });

  app.put("/api/gallery/:id", async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);
      const image = await storage.updateGalleryImage(imageId, req.body);
      
      if (!image) {
        return res.status(404).json({ message: "Gallery image not found" });
      }
      
      res.json(image);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update gallery image" });
    }
  });

  app.delete("/api/gallery/:id", async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);

      // Fetch record first to know its file path
      const existing = await storage.getGalleryImage(imageId);
      if (!existing) {
        return res.status(404).json({ message: "Gallery image not found" });
      }

      const success = await storage.deleteGalleryImage(imageId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete gallery image" });
      }

      // If the image is stored locally under /uploads, remove the file from disk
      try {
        const url = existing.imageUrl || "";
        if (typeof url === 'string' && url.startsWith('/uploads/')) {
          const withoutQuery = url.split('?')[0].split('#')[0];
          const filename = withoutQuery.replace(/^\/uploads\//, '');
          const filePath = getImageStoredFilePath(filename);
          if (filePath && require('fs').existsSync(filePath)) {
            require('fs').unlinkSync(filePath);
          }
        }
      } catch (e) {
        console.warn('Failed to delete gallery image file from disk:', e);
      }

      res.json({ message: "Gallery image deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete gallery image" });
    }
  });

  app.post("/api/gallery/reorder", async (req: Request, res: Response) => {
    try {
      const { imageIds } = req.body;
      const success = await storage.reorderGalleryImages(imageIds);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to reorder images" });
      }
      
      res.json({ message: "Images reordered successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to reorder gallery images" });
    }
  });

  // Email diagnostics (admin only)
  app.get("/api/admin/email/verify", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    const ok = await verifyEmailTransport();
    res.json({ ok });
  });

  app.post("/api/admin/email/test", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const to = req.body?.to as string | undefined;
      await sendTestEmail(to);
      res.json({ ok: true, to: to || process.env.ADMIN_EMAIL || process.env.EMAIL_USER });
    } catch (err: any) {
      console.error('Email test failed:', err);
      res.status(500).json({ ok: false, message: err?.message || 'Email test failed' });
    }
  });

  // Admin: storage diagnostics
  app.get("/api/admin/storage/diagnostics", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const dir = resolveUploadDir();
      const exists = fs.existsSync(dir);
      const stats = exists ? fs.statSync(dir) : undefined;
      const isDirectory = !!stats?.isDirectory();
      const readable = (() => { try { fs.accessSync(dir, fs.constants.R_OK); return true; } catch { return false; } })();
      const writable = (() => { try { fs.accessSync(dir, fs.constants.W_OK); return true; } catch { return false; } })();

      let fileCount = 0;
      let totalBytes = 0;
      const examples: { name: string; size: number }[] = [];

      if (exists && isDirectory) {
        const walk = (p: string) => {
          const entries = fs.readdirSync(p, { withFileTypes: true });
          for (const e of entries) {
            const full = path.join(p, e.name);
            if (e.isDirectory()) walk(full);
            else if (e.isFile()) {
              try {
                const s = fs.statSync(full);
                fileCount += 1;
                totalBytes += s.size;
                if (examples.length < 10) {
                  examples.push({ name: path.relative(dir, full), size: s.size });
                }
              } catch {}
            }
          }
        };
        walk(dir);
      }

      res.json({
        uploadDir: dir,
        exists,
        isDirectory,
        readable,
        writable,
        fileCount,
        totalBytes,
        examples,
      });
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'Failed to compute storage diagnostics' });
    }
  });

  // Admin: delete a file within the uploads directory (by relative name)
  app.post("/api/admin/storage/delete", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const dir = resolveUploadDir();
      const nameRaw = (req.body?.name || '').toString();
      if (!nameRaw) return res.status(400).json({ message: 'Missing file name' });

      // Prevent traversal and absolute paths
      if (nameRaw.startsWith('/') || nameRaw.includes('..')) {
        return res.status(400).json({ message: 'Invalid file name' });
      }

      const abs = path.resolve(dir, nameRaw);
      // Ensure target is inside uploads dir
      if (!abs.startsWith(path.resolve(dir) + path.sep) && path.resolve(dir) !== abs) {
        return res.status(400).json({ message: 'Path outside uploads directory' });
      }

      if (!fs.existsSync(abs)) return res.status(404).json({ message: 'File not found' });
      const st = fs.statSync(abs);
      if (!st.isFile()) return res.status(400).json({ message: 'Not a file' });

      fs.unlinkSync(abs);
      res.json({ ok: true, name: nameRaw });
    } catch (err: any) {
      console.error('Delete storage file failed:', err);
      res.status(500).json({ message: err?.message || 'Failed to delete file' });
    }
  });

  // Documents management (admin only)
  const RESERVED_SLUGS = new Set([
    'admin','api','uploads','assets','static','images','img','tours','tour','articles','article','book','review','gallery',
    // Front-end pages that should not be treated as document slugs
    '3-day-guide-book'
  ]);

  app.get("/api/documents", isAuthenticated, isAdmin, async (_req: Request, res: Response) => {
    try {
      const docs = await storage.getDocuments();
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'Failed to list documents' });
    }
  });

  app.post(
    "/api/documents",
    isAuthenticated,
    isAdmin,
    uploadDocument.single('file'),
    handleDocumentUploadErrors,
    async (req: Request, res: Response) => {
      try {
        const slugRaw = (req.body?.slug || '').toString();
        const title = (req.body?.title || '').toString() || null;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!slugRaw) return res.status(400).json({ message: 'Slug is required' });

        const slug = slugRaw
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\-\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

        if (!slug) return res.status(400).json({ message: 'Invalid slug' });
        if (RESERVED_SLUGS.has(slug)) return res.status(400).json({ message: 'Slug is reserved' });

        const existing = await storage.getDocumentBySlug(slug);
        if (existing) return res.status(409).json({ message: 'Slug already in use' });

        const doc = await storage.createDocument({
          slug,
          title: title as any,
          originalFilename: req.file.originalname,
          storedFilename: req.file.filename,
          mimeType: req.file.mimetype,
          size: req.file.size,
        } as any);

        res.status(201).json(doc);
      } catch (err: any) {
        console.error('Create document failed:', err);
        res.status(500).json({ message: err?.message || 'Failed to create document' });
      }
    }
  );

  app.delete("/api/documents/:id", isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const doc = await storage.getDocument(id);
      if (!doc) return res.status(404).json({ message: 'Document not found' });

      // Attempt to remove file from disk
      try {
        const p = getStoredFilePath(doc.storedFilename);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) {
        console.warn('Failed to delete stored file:', e);
      }

      await storage.deleteDocument(id);
      res.json({ message: 'Document deleted' });
    } catch (err: any) {
      res.status(500).json({ message: err?.message || 'Failed to delete document' });
    }
  });

  // Public route: serve document by slug, if exists
  app.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = req.params.slug;
      // Do not handle known prefixes (they are handled elsewhere)
      if (RESERVED_SLUGS.has(slug)) return next();

      const doc = await storage.getDocumentBySlug(slug);
      if (!doc) return next();

      const filePath = getStoredFilePath(doc.storedFilename);
      if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      // Force download with a friendly filename
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalFilename.replace(/"/g, '')}"`);
      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  });

  // Create an HTTP server and attach WebSocket notifications endpoint
  const httpServer = createServer(app);
  initNotificationsWebSocketServer(httpServer);

  return httpServer;
}
