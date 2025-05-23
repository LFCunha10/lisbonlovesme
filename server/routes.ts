import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";

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
  
  // Tours API endpoints
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
      
      // Debug: Log the closed days
      console.log("Closed days:", closedDays);
      
      // Filter out availabilities on closed days with consistent date formatting
      const filteredAvailabilities = availabilities.filter(availability => {
        // For debugging the date formats
        console.log(`Checking availability date: ${availability.date}`);
        
        // Check if this date is in the closed days list (exact string match)
        return !closedDays.some(closedDay => {
          const match = closedDay.date === availability.date;
          if (match) {
            console.log(`Match found! Closed day: ${closedDay.date}, Availability date: ${availability.date}`);
          }
          return match;
        });
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

  // Booking API endpoints with auto close day feature
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      // Create the booking
      const booking = await storage.createBooking(req.body);
      
      // Check if auto-close is enabled and close the day if it is
      const isAutoCloseEnabled = await storage.getAutoCloseDaySetting();
      if (isAutoCloseEnabled) {
        const availability = await storage.getAvailability(booking.availabilityId);
        if (availability) {
          // Add this date to closed days
          await storage.addClosedDay(
            availability.date, 
            `Automatically closed due to booking #${booking.id}`
          );
        }
      }
      
      res.status(201).json(booking);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: error.message || "Failed to create booking" });
    }
  });

  // Create an HTTP server
  const httpServer = createServer(app);

  return httpServer;
}