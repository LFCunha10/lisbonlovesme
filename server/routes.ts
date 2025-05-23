import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { sendBookingConfirmationEmail } from "./email";

// Create a new Stripe instance with your secret key
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}