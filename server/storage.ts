import {
  users, type User, type InsertUser,
  tours, type Tour, type InsertTour,
  availabilities, type Availability, type InsertAvailability,
  bookings, type Booking, type InsertBooking,
  testimonials, type Testimonial, type InsertTestimonial,
  closedDays, type ClosedDay, type InsertClosedDay,
  adminSettings, type AdminSetting, type InsertAdminSetting
} from "@shared/schema";
import { nanoid } from "nanoid";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;

  // Tour operations
  getTours(): Promise<Tour[]>;
  getTour(id: number): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  deleteTour(id: number): Promise<boolean>;

  // Availability operations
  getAvailabilities(tourId?: number): Promise<Availability[]>;
  getAvailability(id: number): Promise<Availability | undefined>;
  getAvailabilityByTourAndDateTime(tourId: number, date: string, time: string): Promise<Availability | undefined>;
  createAvailability(availability: InsertAvailability): Promise<Availability>;
  updateAvailability(id: number, availability: Partial<InsertAvailability>): Promise<Availability | undefined>;
  deleteAvailability(id: number): Promise<boolean>;

  // Booking operations
  getBookings(tourId?: number): Promise<Booking[]>;
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingByReference(reference: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  updatePaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string): Promise<Booking | undefined>;
  
  // Testimonial operations
  getTestimonials(tourId?: number, approvedOnly?: boolean): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  approveTestimonial(id: number): Promise<Testimonial | undefined>;

  // Closed Days operations
  getClosedDays(): Promise<ClosedDay[]>;
  getClosedDay(date: string): Promise<ClosedDay | undefined>;
  addClosedDay(date: string, reason?: string): Promise<ClosedDay>;
  removeClosedDay(date: string): Promise<boolean>;
  isDateClosed(date: string): Promise<boolean>;

  // Admin Settings operations
  getAdminSettings(): Promise<AdminSetting | undefined>;
  updateAdminSettings(settings: Partial<InsertAdminSetting>): Promise<AdminSetting>;
  getAutoCloseDaySetting(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tours: Map<number, Tour>;
  private availabilities: Map<number, Availability>;
  private bookings: Map<number, Booking>;
  private testimonials: Map<number, Testimonial>;
  
  private userCurrentId: number;
  private tourCurrentId: number;
  private availabilityCurrentId: number;
  private bookingCurrentId: number;
  private testimonialCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tours = new Map();
    this.availabilities = new Map();
    this.bookings = new Map();
    this.testimonials = new Map();
    
    this.userCurrentId = 1;
    this.tourCurrentId = 1;
    this.availabilityCurrentId = 1;
    this.bookingCurrentId = 1;
    this.testimonialCurrentId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample tours
    const tourData: InsertTour[] = [
      {
        name: "Historic Belém Tour",
        description: "Explore the historic Belém district including the iconic Tower, Monument to the Discoveries, and the famous Pastéis de Belém bakery.",
        imageUrl: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b",
        duration: "3 hours",
        maxGroupSize: 12,
        difficulty: "Moderate",
        price: 4500, // €45.00
        badge: "Most Popular",
        badgeColor: "primary",
        isActive: true,
      },
      {
        name: "Alfama & Fado Experience",
        description: "Wander through the charming streets of Alfama, Lisbon's oldest district, and enjoy an authentic Fado music performance with dinner.",
        imageUrl: "https://pixabay.com/get/g1a4760d97fc50e236c117537b1dbfe42cc1025f194035d2b98ce7c3096f322968be260e68fc90ab5c92388f5211d8ee865a229904078fca59379aedb1f308446_1280.jpg",
        duration: "4 hours",
        maxGroupSize: 10,
        difficulty: "Easy",
        price: 6500, // €65.00
        badge: "Evening Tour",
        badgeColor: "secondary",
        isActive: true,
      },
      {
        name: "Panoramic Lisbon Tour",
        description: "Experience the best views of Lisbon from various miradouros (viewpoints) across the city's seven hills, with transportation included.",
        imageUrl: "https://images.unsplash.com/photo-1569959220744-ff553533f492",
        duration: "6 hours",
        maxGroupSize: 8,
        difficulty: "Moderate",
        price: 7500, // €75.00
        badge: "Full Day",
        badgeColor: "accent",
        isActive: true,
      }
    ];

    tourData.forEach(tour => this.createTour(tour));

    // Create sample availabilities for the next 30 days
    const today = new Date();
    for (let i = 1; i <= 3; i++) { // For each tour
      for (let j = 0; j < 30; j++) { // For the next 30 days
        const date = new Date(today);
        date.setDate(today.getDate() + j);
        
        // Skip some days to create "unavailable" days
        if (j % 7 === 0 || j % 11 === 0) continue;
        
        const dateString = date.toISOString().split('T')[0];
        
        // Morning tour
        this.createAvailability({
          tourId: i,
          date: dateString,
          time: "09:00",
          maxSpots: 12,
          spotsLeft: 12
        });
        
        // Afternoon tour
        this.createAvailability({
          tourId: i,
          date: dateString,
          time: "14:00",
          maxSpots: 12,
          spotsLeft: 12
        });
      }
    }

    // Create sample testimonials
    const testimonialData: InsertTestimonial[] = [
      {
        customerName: "Emma Johnson",
        customerCountry: "United Kingdom",
        rating: 5,
        text: "Our guide Maria was absolutely fantastic! Her knowledge of Lisbon's history and culture made our tour incredibly enriching. The hidden spots she showed us were magical and away from the tourist crowds.",
        tourId: 1,
        isApproved: true,
      },
      {
        customerName: "Michael Chen",
        customerCountry: "Canada",
        rating: 5,
        text: "The Belém Tour exceeded our expectations. João was knowledgeable and passionate, and the small group size made it feel very personal. The pasteis de nata at the end were the perfect touch!",
        tourId: 1,
        isApproved: true,
      },
      {
        customerName: "Thomas Mueller",
        customerCountry: "Germany",
        rating: 5,
        text: "The Fado experience was truly unforgettable. Our guide Ana took us to an authentic venue where we felt like locals. The combination of dinner, music, and the atmospheric streets of Alfama made for a perfect evening.",
        tourId: 2,
        isApproved: true,
      },
    ];

    testimonialData.forEach(testimonial => this.createTestimonial(testimonial));
  }

  // User operations (existing)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, isAdmin: insertUser.isAdmin || false };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Tour operations
  async getTours(): Promise<Tour[]> {
    return Array.from(this.tours.values()).filter(tour => tour.isActive);
  }

  async getTour(id: number): Promise<Tour | undefined> {
    return this.tours.get(id);
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const id = this.tourCurrentId++;
    const newTour: Tour = { ...tour, id };
    this.tours.set(id, newTour);
    return newTour;
  }

  async updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const existingTour = this.tours.get(id);
    if (!existingTour) return undefined;

    const updatedTour: Tour = { ...existingTour, ...tour };
    this.tours.set(id, updatedTour);
    return updatedTour;
  }

  async deleteTour(id: number): Promise<boolean> {
    return this.tours.delete(id);
  }

  // Availability operations
  async getAvailabilities(tourId?: number): Promise<Availability[]> {
    const allAvailabilities = Array.from(this.availabilities.values());
    if (tourId) {
      return allAvailabilities.filter(a => a.tourId === tourId);
    }
    return allAvailabilities;
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    return this.availabilities.get(id);
  }

  async getAvailabilityByTourAndDateTime(tourId: number, date: string, time: string): Promise<Availability | undefined> {
    return Array.from(this.availabilities.values()).find(
      a => a.tourId === tourId && a.date === date && a.time === time
    );
  }

  async createAvailability(availability: InsertAvailability): Promise<Availability> {
    const id = this.availabilityCurrentId++;
    const newAvailability: Availability = { ...availability, id };
    this.availabilities.set(id, newAvailability);
    return newAvailability;
  }

  async updateAvailability(id: number, availability: Partial<InsertAvailability>): Promise<Availability | undefined> {
    const existingAvailability = this.availabilities.get(id);
    if (!existingAvailability) return undefined;

    const updatedAvailability: Availability = { ...existingAvailability, ...availability };
    this.availabilities.set(id, updatedAvailability);
    return updatedAvailability;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    return this.availabilities.delete(id);
  }

  // Booking operations
  async getBookings(tourId?: number): Promise<Booking[]> {
    const allBookings = Array.from(this.bookings.values());
    if (tourId) {
      return allBookings.filter(b => b.tourId === tourId);
    }
    return allBookings;
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingByReference(reference: string): Promise<Booking | undefined> {
    return Array.from(this.bookings.values()).find(
      b => b.bookingReference === reference
    );
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const id = this.bookingCurrentId++;
    // Generate a unique booking reference
    const bookingReference = `LT-${nanoid(8).toUpperCase()}`;
    
    const newBooking: Booking = { 
      ...booking, 
      id, 
      bookingReference,
      createdAt: new Date(),
      remindersSent: false,
    };
    
    this.bookings.set(id, newBooking);
    
    // Update availability (reduce spots left)
    const availability = await this.getAvailability(booking.availabilityId);
    if (availability) {
      const newSpotsLeft = Math.max(0, availability.spotsLeft - booking.numberOfParticipants);
      await this.updateAvailability(availability.id, { spotsLeft: newSpotsLeft });
    }
    
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existingBooking = this.bookings.get(id);
    if (!existingBooking) return undefined;

    const updatedBooking: Booking = { ...existingBooking, ...booking };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async updatePaymentStatus(id: number, paymentStatus: string, stripePaymentIntentId?: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking: Booking = { 
      ...booking, 
      paymentStatus, 
      stripePaymentIntentId: stripePaymentIntentId || booking.stripePaymentIntentId 
    };
    
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Testimonial operations
  async getTestimonials(tourId?: number, approvedOnly = true): Promise<Testimonial[]> {
    let testimonials = Array.from(this.testimonials.values());
    
    if (approvedOnly) {
      testimonials = testimonials.filter(t => t.isApproved);
    }
    
    if (tourId) {
      testimonials = testimonials.filter(t => t.tourId === tourId);
    }
    
    return testimonials;
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.testimonialCurrentId++;
    const newTestimonial: Testimonial = { ...testimonial, id };
    this.testimonials.set(id, newTestimonial);
    return newTestimonial;
  }

  async approveTestimonial(id: number): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;

    const updatedTestimonial: Testimonial = { ...testimonial, isApproved: true };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
