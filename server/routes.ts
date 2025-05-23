import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertAvailabilitySchema, insertBookingSchema, insertTestimonialSchema, insertTourSchema } from "@shared/schema";
import Stripe from "stripe";
import { sendBookingConfirmationEmail } from "./email";
import { generateICSFile } from "./utils/ics-generator";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY environment variable. Payments will be simulated.');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // TOURS
  
  // Get all tours
  app.get("/api/tours", async (req, res) => {
    const tours = await storage.getTours();
    res.json(tours);
  });

  // Get single tour
  app.get("/api/tours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    const tour = await storage.getTour(id);
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.json(tour);
  });

  // Create tour (admin)
  app.post("/api/tours", async (req, res) => {
    try {
      const tourData = insertTourSchema.parse(req.body);
      const tour = await storage.createTour(tourData);
      res.status(201).json(tour);
    } catch (error) {
      res.status(400).json({ message: "Invalid tour data", error });
    }
  });

  // Update tour (admin)
  app.put("/api/tours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    try {
      const tourData = insertTourSchema.partial().parse(req.body);
      const tour = await storage.updateTour(id, tourData);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      res.status(400).json({ message: "Invalid tour data", error });
    }
  });

  // Delete tour (admin)
  app.delete("/api/tours/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid tour ID" });
    }

    const result = await storage.deleteTour(id);
    if (!result) {
      return res.status(404).json({ message: "Tour not found" });
    }

    res.status(204).end();
  });

  // AVAILABILITIES

  // Get availabilities for a tour
  app.get("/api/availabilities", async (req, res) => {
    const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
    const availabilities = await storage.getAvailabilities(tourId);
    res.json(availabilities);
  });

  // Create availability (admin)
  app.post("/api/availabilities", async (req, res) => {
    try {
      const availabilityData = insertAvailabilitySchema.parse(req.body);
      const availability = await storage.createAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data", error });
    }
  });

  // Update availability (admin)
  app.put("/api/availabilities/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid availability ID" });
    }

    try {
      const availabilityData = insertAvailabilitySchema.partial().parse(req.body);
      const availability = await storage.updateAvailability(id, availabilityData);
      
      if (!availability) {
        return res.status(404).json({ message: "Availability not found" });
      }
      
      res.json(availability);
    } catch (error) {
      res.status(400).json({ message: "Invalid availability data", error });
    }
  });

  // Delete availability (admin)
  app.delete("/api/availabilities/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid availability ID" });
    }

    const result = await storage.deleteAvailability(id);
    if (!result) {
      return res.status(404).json({ message: "Availability not found" });
    }

    res.status(204).end();
  });

  // BOOKINGS

  // Get all bookings (admin)
  app.get("/api/bookings", async (req, res) => {
    const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
    const bookings = await storage.getBookings(tourId);
    res.json(bookings);
  });

  // Get booking by reference
  app.get("/api/bookings/reference/:reference", async (req, res) => {
    const reference = req.params.reference;
    const booking = await storage.getBookingByReference(reference);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json(booking);
  });

  // Create booking and payment intent
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Verify availability has enough spots
      const availability = await storage.getAvailability(bookingData.availabilityId);
      if (!availability) {
        return res.status(404).json({ message: "Availability not found" });
      }
      
      if (availability.spotsLeft < bookingData.numberOfParticipants) {
        return res.status(400).json({ 
          message: `Not enough spots available. Only ${availability.spotsLeft} spots left.` 
        });
      }
      
      // Get tour info for pricing
      const tour = await storage.getTour(bookingData.tourId);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      // Calculate total amount
      const totalAmount = tour.price * bookingData.numberOfParticipants;
      bookingData.totalAmount = totalAmount;
      
      // Add meeting point info based on the tour
      const meetingPoints = {
        1: "We'll meet at the entrance of Belém Tower, 15 minutes before the tour starts.",
        2: "We'll meet at Alfama district entrance near São Jorge Castle, 15 minutes before the tour starts.",
        3: "We'll meet at Rossio Square in the city center, 15 minutes before the tour starts.",
      };
      
      bookingData.meetingPoint = meetingPoints[bookingData.tourId] || 
        "Meeting point details will be sent in the confirmation email.";
      
      // Create booking
      const booking = await storage.createBooking(bookingData);
      
      // Create Stripe payment intent
      let paymentIntent;
      
      if (stripe) {
        try {
          paymentIntent = await stripe.paymentIntents.create({
            amount: totalAmount,
            currency: "eur",
            metadata: {
              bookingId: booking.id.toString(),
              bookingReference: booking.bookingReference,
              tourName: tour.name
            }
          });
          
          // Update booking with payment intent ID
          await storage.updatePaymentStatus(
            booking.id, 
            "pending", 
            paymentIntent.id
          );
          
        } catch (error) {
          console.error("Stripe payment intent creation failed:", error);
          return res.status(500).json({ message: "Payment processing failed" });
        }
      } else {
        // Simulate payment intent for testing when Stripe is not configured
        paymentIntent = {
          client_secret: `simulation_secret_${Date.now()}`
        };
      }
      
      res.status(201).json({ 
        booking,
        clientSecret: paymentIntent.client_secret 
      });
      
    } catch (error) {
      res.status(400).json({ message: "Invalid booking data", error });
    }
  });

  // Confirm payment and send confirmation
  app.post("/api/bookings/:id/confirm", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Update booking status
    const updatedBooking = await storage.updatePaymentStatus(id, "paid");
    
    // Get tour info for email
    const tour = await storage.getTour(booking.tourId);
    const availability = await storage.getAvailability(booking.availabilityId);
    
    if (!tour || !availability) {
      return res.status(500).json({ message: "Could not get booking details" });
    }
    
    // Generate ICS file
    const icsContent = generateICSFile({
      summary: `Lisboa Tours: ${tour.name}`,
      description: tour.description,
      location: booking.meetingPoint || "Lisboa, Portugal",
      start: `${availability.date}T${availability.time}:00`,
      duration: parseInt(tour.duration.split(' ')[0]), // E.g., "3 hours" -> 3
      url: `${req.protocol}://${req.get('host')}/bookings/${booking.bookingReference}`
    });
    
    // Send confirmation email
    try {
      await sendBookingConfirmationEmail({
        to: booking.customerEmail,
        name: `${booking.customerFirstName} ${booking.customerLastName}`,
        bookingReference: booking.bookingReference,
        tourName: tour.name,
        date: availability.date,
        time: availability.time,
        participants: booking.numberOfParticipants,
        totalAmount: (booking.totalAmount / 100).toFixed(2),
        meetingPoint: booking.meetingPoint || "",
        icsContent
      });
      
      res.json({ 
        success: true, 
        booking: updatedBooking 
      });
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      res.status(200).json({ 
        success: true, 
        booking: updatedBooking,
        emailSent: false 
      });
    }
  });

  // TESTIMONIALS

  // Get testimonials
  app.get("/api/testimonials", async (req, res) => {
    const tourId = req.query.tourId ? parseInt(req.query.tourId as string) : undefined;
    const includeUnapproved = req.query.includeUnapproved === 'true';
    
    const testimonials = await storage.getTestimonials(tourId, !includeUnapproved);
    res.json(testimonials);
  });

  // Create testimonial
  app.post("/api/testimonials", async (req, res) => {
    try {
      const testimonialData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(testimonialData);
      res.status(201).json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Invalid testimonial data", error });
    }
  });

  // Approve testimonial (admin)
  app.put("/api/testimonials/:id/approve", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid testimonial ID" });
    }

    const testimonial = await storage.approveTestimonial(id);
    if (!testimonial) {
      return res.status(404).json({ message: "Testimonial not found" });
    }

    res.json(testimonial);
  });

  // Webhook for Stripe events
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(200).json({ received: true, simulated: true });
    }
    
    const payload = req.body;
    
    try {
      const event = stripe.webhooks.constructEvent(
        payload, 
        req.headers['stripe-signature'] as string, 
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test'
      );
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find booking by payment intent ID
        const bookings = await storage.getBookings();
        const booking = bookings.find(b => b.stripePaymentIntentId === paymentIntent.id);
        
        if (booking) {
          // Update booking status
          await storage.updatePaymentStatus(booking.id, "paid");
          
          // Send confirmation email would go here in a real implementation
          // For now, we'll trigger that from the frontend
        }
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
