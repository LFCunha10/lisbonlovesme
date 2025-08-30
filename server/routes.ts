import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { sendBookingConfirmationEmail, sendRequestConfirmationEmail, sendReviewRequestEmail, sendBookingRequestNotification, sendContactFormNotification } from "./emailService.js";
import { autoTranslateTourContent, translateField } from "./translation-service.js";
import { exportDatabase } from "./utils/export-database-complete";
import { upload, handleUploadErrors, getUploadedFileUrl } from "./utils/image-upload";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./auth";
import { getLocalizedText } from "./utils/tour-utils.js";
import csrf from "csurf";
import bcrypt from "bcryptjs";

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
const csrfProtection = csrf({ cookie: true });

export async function registerRoutes(app: Express): Promise<Server> {
  
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

  app.get("/api/csrf-token", csrfProtection, (req: Request, res: Response) => {
    res.cookie("csrfToken", req.csrfToken(), {
      httpOnly: false,
      secure: true,
      sameSite: "lax"
    });
    res.json({ csrfToken: req.csrfToken() });
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
        console.log("Confirmation email sent successfully");
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
        console.log("Confirmation email sent successfully");
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
  app.post("/api/admin/login", async (req: Request, res: Response) => {
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
      
      // Set session data with regeneration
      if (req.session) {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Failed to regenerate session" });
          }

          console.log("Session after regenerate:", req.sessionID);

          req.session.isAuthenticated = true;
          req.session.isAdmin = !!user.isAdmin;
          req.session.user = {
            id: user.id,
            username: user.username,
            isAdmin: !!user.isAdmin
          };

          console.log("Session set:", req.session);
          console.log("Session user now:", req.session.user);

          res.json({
            message: "Login successful"
          });
        });
        return;
      }
      return res.status(500).json({ message: "Session not available" });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "An error occurred during login" });
    }
  });
  
  app.get("/api/admin/session", (req: Request, res: Response) => {
    if (req.session && req.session.isAuthenticated && req.session.isAdmin) {
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
  
  app.post("/api/admin/logout", csrfProtection, (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Logout error:", err);
          return res.status(500).json({ message: "Failed to logout" });
        }

        res.clearCookie("connect.sid", {
          path: "/",
          httpOnly: true,
          secure: false,
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
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to retrieve tours" });
    }
  });
  
  app.post("/api/tours", async (req: Request, res: Response) => {
    try {
      const tour = await storage.createTour({
        ...req.body,
        shortDescription: req.body.shortDescription ?? null,
        isActive: req.body.isActive ?? null,
      });
      res.status(201).json(tour);
    } catch (error: any) {
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
      const updatedTour = await storage.updateTour(tourId, req.body);
      
      if (!updatedTour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error: any) {
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
      
      console.log("Updating booking request:", bookingId, updateData);
      
      const updatedBooking = await storage.updateBooking(bookingId, updateData);
      
      if (!updatedBooking) {
        return res.status(404).json({ message: "Booking request not found" });
      }
      
      console.log("Booking request updated successfully:", updatedBooking);
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
  console.log("Starting booking creation with data:", req.body);

  try {
    // 1. Insert booking with requested status
    const bookingData = {
      ...req.body,
      paymentStatus: "requested", // Override to use request-based workflow
      bookingReference: `LT-${generateRandomString(7)}`
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
    console.log("Availability updated successfully!!!");

    // 4. Auto-close day if needed
   
    const autoCloseSetting = await storage.getAutoCloseDaySetting();
    console.log("Auto-close setting: ", autoCloseSetting);
    if (autoCloseSetting) {
      await storage.addClosedDay(availability.date, "Auto-closed due to booking");
      console.log(`Day ${availability.date} auto-closed due to booking`);
    }
    if (spotsRemaining <= 0) {
      await storage.addClosedDay(availability.date, "Closed due to lack of spots");
      console.log(`Day ${availability.date} Closed due to lack of spots`);
    }
 
   

    // 5. Send notification emails
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
          language: booking.language || 'en'
        });
        
        console.log("Emails sent successfully");
      }
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // Non-blocking failure
    }

    // 6. Respond to client
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
      console.log("Starting database export...");
      
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
        console.log(`Sending complete database export (${data.length} bytes)`);
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
      const success = await storage.deleteGalleryImage(imageId);
      
      if (!success) {
        return res.status(404).json({ message: "Gallery image not found" });
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

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
