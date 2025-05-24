import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { sendBookingConfirmationEmail } from "./email";
import { exportDatabase } from "./utils/export-database";
import { upload, handleUploadErrors, getUploadedFileUrl } from "./utils/image-upload";
import path from "path";
import fs from "fs";

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
      
      if (!reason) {
        return res.status(400).json({ message: "Refund reason is required" });
      }
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      if (booking.paymentStatus !== "paid") {
        return res.status(400).json({ 
          message: "Only paid bookings can be refunded" 
        });
      }
      
      // If we have Stripe integration
      if (booking.stripePaymentIntentId) {
        try {
          // In a real implementation, we would call Stripe's API to process the refund
          // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
          // await stripe.refunds.create({
          //   payment_intent: booking.stripePaymentIntentId,
          //   reason: 'requested_by_customer'
          // });
          
          // For now, we'll just update the status
          console.log(`Refund would be processed for payment: ${booking.stripePaymentIntentId}`);
        } catch (stripeError) {
          console.error("Stripe refund error:", stripeError);
          return res.status(500).json({ 
            message: "Failed to process refund with payment provider" 
          });
        }
      }
      
      // Update booking status
      const updatedBooking = await storage.updatePaymentStatus(
        bookingId, 
        "refunded",
        booking.stripePaymentIntentId
      );
      
      // In a complete implementation, we would also:
      // 1. Log the refund with reason and admin who processed it
      // 2. Send email confirmation to the customer
      // 3. Update availability to increase available spots
      
      res.json({ 
        message: "Refund processed successfully", 
        booking: updatedBooking 
      });
    } catch (error) {
      console.error("Error processing refund:", error);
      res.status(500).json({ message: "Failed to process refund" });
    }
  });
  // Admin authentication routes - Simple hardcoded auth for demo
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Basic admin authentication
      if (username === "admin" && password === "lisbonlovesme123") {
        if (req.session) {
          req.session.isAuthenticated = true;
          req.session.isAdmin = true;
          req.session.user = { id: 1, username: "admin", isAdmin: true };
        }
        return res.status(200).json({ success: true });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: "Invalid username or password" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "An error occurred during login" 
      });
    }
  });

  app.get("/api/admin/session", (req: Request, res: Response) => {
    if (req.session && req.session.isAuthenticated && req.session.isAdmin) {
      return res.status(200).json({ 
        authenticated: true,
        user: req.session.user 
      });
    }
    
    return res.status(401).json({ 
      authenticated: false,
      message: "Not authenticated" 
    });
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Error logging out" 
          });
        }
        
        res.status(200).json({ success: true });
      });
    } else {
      res.status(200).json({ success: true });
    }
  });
  
  // Tours API endpoints - specific routes first
  app.get("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      if (isNaN(tourId)) {
        return res.status(400).json({ message: "Invalid tour ID" });
      }
      
      const tour = await storage.getTour(tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ message: "Failed to fetch tour" });
    }
  });

  app.get("/api/tours", async (req: Request, res: Response) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });
  
  // Create a new tour
  app.post("/api/tours", async (req: Request, res: Response) => {
    try {
      // Convert price from decimal format (45.00) to cents (4500) if needed
      const tourData = {
        ...req.body,
        price: typeof req.body.price === 'string' 
          ? Math.round(parseFloat(req.body.price) * 100) 
          : req.body.price
      };
      
      const newTour = await storage.createTour(tourData);
      res.status(201).json(newTour);
    } catch (error: any) {
      console.error("Error creating tour:", error);
      res.status(500).json({ message: error.message || "Failed to create tour" });
    }
  });
  
  // Update an existing tour
  app.put("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      if (isNaN(tourId)) {
        return res.status(400).json({ message: "Invalid tour ID" });
      }
      
      // Convert price from decimal format (45.00) to cents (4500) if needed
      const tourData = {
        ...req.body,
        price: typeof req.body.price === 'string' 
          ? Math.round(parseFloat(req.body.price) * 100) 
          : req.body.price
      };
      
      const updatedTour = await storage.updateTour(tourId, tourData);
      if (!updatedTour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error: any) {
      console.error("Error updating tour:", error);
      res.status(500).json({ message: error.message || "Failed to update tour" });
    }
  });
  
  // Delete a tour
  app.delete("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const tourId = parseInt(req.params.id);
      if (isNaN(tourId)) {
        return res.status(400).json({ message: "Invalid tour ID" });
      }
      
      const success = await storage.deleteTour(tourId);
      if (!success) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ message: error.message || "Failed to delete tour" });
    }
  });

  // Testimonials API endpoints
  app.get("/api/testimonials", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      const includeUnapproved = req.query.includeUnapproved === "true";
      
      // Only admins can see unapproved testimonials
      const approvedOnly = !(includeUnapproved && req.session && req.session.isAdmin);
      const testimonials = await storage.getTestimonials(tourId, approvedOnly);
      
      res.json(testimonials);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Availabilities API endpoints
  app.get("/api/availabilities", async (req: Request, res: Response) => {
    try {
      const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
      
      // Get all availabilities
      const availabilities = await storage.getAvailabilities(tourId);
      
      // Get all closed days
      const closedDays = await storage.getClosedDays();
      
      // Filter out availabilities on closed days
      const filteredAvailabilities = availabilities.filter(availability => {
        // Check if this date is in the closed days list (exact string match)
        return !closedDays.some(closedDay => closedDay.date === availability.date);
      });
      
      res.json(filteredAvailabilities);
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      res.status(500).json({ message: "Failed to fetch availabilities" });
    }
  });

  // Closed days API endpoints
  app.get("/api/closed-days", async (req: Request, res: Response) => {
    try {
      const closedDays = await storage.getClosedDays();
      res.json(closedDays);
    } catch (error: any) {
      console.error("Error fetching closed days:", error);
      res.status(500).json({ message: "Failed to fetch closed days" });
    }
  });

  app.post("/api/closed-days", async (req: Request, res: Response) => {
    try {
      // For this demo, we'll bypass authentication for closed days management
      // In a production environment, you'd want proper authentication here

      const { date, reason } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Date is required" });
      }
      
      const closedDay = await storage.addClosedDay(date, reason);
      res.status(201).json(closedDay);
    } catch (error: any) {
      console.error("Error adding closed day:", error);
      res.status(500).json({ message: error.message || "Failed to add closed day" });
    }
  });
  
  app.delete("/api/closed-days/:date", async (req: Request, res: Response) => {
    try {
      // For this demo, we'll bypass authentication for closed days management
      // In a production environment, you'd want proper authentication here

      const { date } = req.params;
      const result = await storage.removeClosedDay(date);
      
      if (result) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Closed day not found" });
      }
    } catch (error: any) {
      console.error("Error removing closed day:", error);
      res.status(500).json({ message: error.message || "Failed to remove closed day" });
    }
  });
  
  // Admin settings API endpoints
  app.get("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      // For demo purposes, we'll bypass admin authentication checks
      // In a production environment, proper authentication would be required

      const settings = await storage.getAdminSettings();
      res.json(settings);
    } catch (error: any) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: error.message || "Failed to fetch admin settings" });
    }
  });
  
  app.put("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      // For demo purposes, we'll bypass admin authentication checks
      // In a production environment, proper authentication would be required

      const { autoCloseDay } = req.body;
      const settings = await storage.updateAdminSettings({ autoCloseDay });
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating admin settings:", error);
      res.status(500).json({ message: error.message || "Failed to update admin settings" });
    }
  });

  // Booking API endpoints with confirmation emails and auto close day feature
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      console.log("Creating booking with data:", req.body);
      
      // Create the booking (simplified to avoid hanging)
      const booking = await storage.createBooking(req.body);
      console.log("Booking created successfully:", booking);
      
      // Immediately return success while email and auto-close run asynchronously
      res.status(201).json(booking);
      
      // Process email and auto-close asynchronously to avoid blocking
      setTimeout(async () => {
        try {
          // Get the tour and availability details for the email
          const tour = await storage.getTour(booking.tourId);
          const availability = await storage.getAvailability(booking.availabilityId);
          
          if (tour && availability) {
            // Format the total amount as a currency string (convert from cents to euros)
            const totalAmount = (booking.totalAmount / 100).toFixed(2);
            
            // Generate booking confirmation details for both email and console output
            const formattedDate = new Date(availability.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            // Meeting point (safely handle missing property)
            const meetingPoint = "Belém Tower entrance, near the river side";
            
            // Create a visually appealing console-based booking confirmation
            const bookingConfirmation = `
╔══════════════════════════════════════════════════════════════════╗
║                    LISBONLOVESME BOOKING CONFIRMATION            ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Dear ${booking.customerFirstName} ${booking.customerLastName},                                 ║
║                                                                  ║
║  Your booking has been confirmed!                                ║
║                                                                  ║
║  BOOKING REFERENCE: ${booking.bookingReference}                                 ║
║  TOUR: ${tour.name}                                        ║
║  DATE: ${formattedDate}                                    ║
║  TIME: ${availability.time}                                              ║
║  PARTICIPANTS: ${booking.numberOfParticipants}                                             ║
║  TOTAL AMOUNT: €${totalAmount}                                        ║
║                                                                  ║
║  MEETING POINT:                                                  ║
║  ${meetingPoint}                                        ║
║                                                                  ║
║  Please arrive 15 minutes before the tour starts.                ║
║  Bring comfortable walking shoes, water, and sun protection.     ║
║  Your tour guide will be holding a "Lisbonlovesme" sign.         ║
║                                                                  ║
║  For any questions, contact us at info@lisbonlovesme.com         ║
║  or +351 21 123 4567.                                            ║
║                                                                  ║
║  We look forward to showing you the best of Lisbon!              ║
║                                                                  ║
║  Best regards,                                                   ║
║  Lisbonlovesme Team                                              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

            // Display the booking confirmation in the console
            console.log(bookingConfirmation);
            
            // Also attempt to send via email
            try {
              // Send confirmation email with better error handling
              await sendBookingConfirmationEmail({
                to: booking.customerEmail,
                name: `${booking.customerFirstName} ${booking.customerLastName}`,
                bookingReference: booking.bookingReference,
                tourName: tour.name,
                date: availability.date,
                time: availability.time,
                participants: booking.numberOfParticipants,
                totalAmount: totalAmount,
                meetingPoint: meetingPoint,
                duration: 2 // Default to 2 hours
              });
              
              console.log(`Confirmation email successfully sent to ${booking.customerEmail}`);
            } catch (emailError: any) {
              console.error("Failed to send confirmation email:", emailError);
              if (emailError.response) {
                console.error("SendGrid API error:", emailError.response.body);
              }
            }
          } else {
            console.error("Missing tour or availability data for email:", { 
              tourFound: !!tour, 
              availabilityFound: !!availability 
            });
          }
          
          // Handle auto-close day feature
          const isAutoCloseEnabled = await storage.getAutoCloseDaySetting();
          if (isAutoCloseEnabled && availability) {
            await storage.addClosedDay(
              availability.date, 
              `Automatically closed due to booking #${booking.id}`
            );
            console.log(`Date ${availability.date} automatically closed after booking`);
          }
        } catch (error: any) {
          // Non-critical errors with email or auto-close shouldn't fail the booking process
          console.error("Email or auto-close process failed but booking was successful:", error);
          if (error.stack) {
            console.error("Error stack:", error.stack);
          }
        }
      }, 0);
      
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
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(exportPath)}"`);
      
      // Send the file directly instead of streaming
      fs.readFile(exportPath, (err, data) => {
        if (err) {
          console.error("Error reading export file:", err);
          return res.status(500).json({ message: "Error reading export file" });
        }
        
        // Log success and send file
        console.log(`Sending file: ${exportPath} (${data.length} bytes)`);
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