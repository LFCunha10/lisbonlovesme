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
