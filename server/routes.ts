import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { sendBookingConfirmationEmail } from "./email";
import { exportDatabase } from "./utils/export-database-complete";
import { upload, handleUploadErrors, getUploadedFileUrl } from "./utils/image-upload";
import path from "path";
import fs from "fs";
import { isAuthenticated, isAdmin } from "./auth";

// Create a new Stripe instance with your secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
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
      const bcrypt = require('bcrypt');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Check if user is admin
      if (!user.isAdmin) {
        return res.status(403).json({ message: "You do not have admin privileges" });
      }
      
      // Set session data
      if (req.session) {
        req.session.isAuthenticated = true;
        req.session.isAdmin = user.isAdmin;
        req.session.user = { id: user.id, username: user.username };
      }
      
      res.json({ 
        message: "Login successful",
        user: { id: user.id, username: user.username, isAdmin: user.isAdmin }
      });
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
  
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to logout" });
        }
        
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Not logged in" });
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
      const tour = await storage.createTour(req.body);
      res.status(201).json(tour);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create tour" });
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
  
  // Booking routes
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      const booking = await storage.createBooking(req.body);
      
      // Check if we should auto-close the day
      const autoCloseSetting = await storage.getAutoCloseDaySetting();
      if (autoCloseSetting) {
        const availability = await storage.getAvailability(booking.availabilityId);
        if (availability) {
          await storage.addClosedDay(availability.date, "Auto-closed due to booking");
        }
      }
      
      // Send confirmation email
      try {
        const tour = await storage.getTour(booking.tourId);
        const availability = await storage.getAvailability(booking.availabilityId);
        
        if (tour && availability) {
          await sendBookingConfirmationEmail({
            to: booking.customerEmail,
            name: `${booking.customerFirstName} ${booking.customerLastName}`,
            bookingReference: booking.bookingReference,
            tourName: tour.name,
            date: availability.date,
            time: availability.time,
            participants: booking.numberOfParticipants,
            totalAmount: (booking.totalAmount / 100).toFixed(2),
            meetingPoint: booking.meetingPoint || "To be announced",
            duration: parseInt(tour.duration)
          });
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Continue with the booking process even if email fails
      }
      
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: error.message || "Failed to create booking" });
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

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}