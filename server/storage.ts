import {
  users, type User, type InsertUser,
  tours, type Tour, type InsertTour,
  availabilities, type Availability, type InsertAvailability,
  bookings, type Booking, type InsertBooking,
  testimonials, type Testimonial, type InsertTestimonial,
  closedDays, type ClosedDay, type InsertClosedDay,
  adminSettings, type AdminSetting, type InsertAdminSetting,
  gallery, type Gallery, type InsertGallery,
  articles, type Article, type InsertArticle
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

  // Gallery operations
  getGalleryImages(): Promise<Gallery[]>;
  getGalleryImage(id: number): Promise<Gallery | undefined>;
  createGalleryImage(image: InsertGallery): Promise<Gallery>;
  updateGalleryImage(id: number, image: Partial<InsertGallery>): Promise<Gallery | undefined>;
  deleteGalleryImage(id: number): Promise<boolean>;
  reorderGalleryImages(imageIds: number[]): Promise<boolean>;

  // Article operations
  getArticles(): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getArticleTree(): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  // Closed Days operations
  async getClosedDays(): Promise<ClosedDay[]> {
    return [];
  }

  async getClosedDay(date: string): Promise<ClosedDay | undefined> {
    return undefined;
  }

  async addClosedDay(date: string, reason?: string): Promise<ClosedDay> {
    return { id: 0, date, reason: reason ?? null, createdAt: null };
  }

  async removeClosedDay(date: string): Promise<boolean> {
    return true;
  }

  async isDateClosed(date: string): Promise<boolean> {
    return false;
  }

  // Admin Settings operations
  async getAdminSettings(): Promise<AdminSetting | undefined> {
    return undefined;
  }

  async updateAdminSettings(settings: Partial<InsertAdminSetting>): Promise<AdminSetting> {
    return { 
      id: 0, 
      ...settings,
      lastUpdated: null,
      autoCloseDay: null
    };
  }

  async getAutoCloseDaySetting(): Promise<boolean> {
    return false;
  }

  // Gallery operations
  async getGalleryImages(): Promise<Gallery[]> {
    return [];
  }

  async getGalleryImage(id: number): Promise<Gallery | undefined> {
    return undefined;
  }

  async createGalleryImage(image: InsertGallery): Promise<Gallery> {
    return {
      id: 0,
      ...image,
      createdAt: null,
      updatedAt: null,
      title: null,
      description: null,
      displayOrder: 0,
      isActive: false,
    };
  }

  async updateGalleryImage(id: number, image: Partial<InsertGallery>): Promise<Gallery | undefined> {
    return undefined;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    return true;
  }

  async reorderGalleryImages(imageIds: number[]): Promise<boolean> {
    return true;
  }
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

  private articles: Map<number, Article> = new Map();
  private articleCurrentId = 1;

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
    const user = this.users.get(id);
    return user ? { ...user, isAdmin: !!user.isAdmin } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = Array.from(this.users.values()).find(
      (user) => user.username === username
    );
    return user ? { ...user, isAdmin: !!user.isAdmin } : undefined;
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
    const newTour: Tour = {
      ...tour,
      id,
      shortDescription: tour.shortDescription ?? null,
      isActive: tour.isActive ?? null,
      priceType: tour.priceType ?? null,
      badge: tour.badge ?? null,
      badgeColor: tour.badgeColor ?? null,
    };
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
      specialRequests: booking.specialRequests ?? null,
      language: booking.language ?? null,
      paymentStatus: booking.paymentStatus ?? null,
      stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
      additionalInfo: booking.additionalInfo ?? null,
      meetingPoint: booking.meetingPoint ?? null,
      confirmedDate: booking.confirmedDate ?? null,
      confirmedTime: booking.confirmedTime ?? null,
      confirmedMeetingPoint: booking.confirmedMeetingPoint ?? null,
      adminNotes: booking.adminNotes ?? null,
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
    const newTestimonial: Testimonial = {
      ...testimonial,
      id,
      isApproved: null,
    };
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

  async getArticles(): Promise<Article[]> {
    return Array.from(this.articles.values());
  }

  async getArticle(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(a => a.slug === slug);
  }

  async getArticleTree(): Promise<Article[]> {
    const articles = Array.from(this.articles.values());
    const map = new Map<number, Article & { children: Article[] }>();
    articles.forEach(article => {
      map.set(article.id, { ...article, children: [] });
    });

    const tree: (Article & { children: Article[] })[] = [];
    map.forEach(article => {
      if (article.parentId && map.has(article.parentId)) {
        map.get(article.parentId)!.children.push(article);
      } else {
        tree.push(article);
      }
    });

    return tree;
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const id = this.articleCurrentId++;
    const now = new Date();
    const article: Article = {
      id,
      title: insertArticle.title,
      slug: insertArticle.slug,
      content: insertArticle.content,
      excerpt: insertArticle.excerpt ?? {},
      featuredImage: insertArticle.featuredImage ?? null,
      parentId: insertArticle.parentId ?? null,
      sortOrder: insertArticle.sortOrder ?? null,
      isPublished: insertArticle.isPublished ?? null,
      publishedAt: insertArticle.publishedAt ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.articles.set(id, article);
    return article;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = this.articles.get(id);
    if (!existing) return undefined;

    const updated: Article = {
      ...existing,
      ...article,
      updatedAt: new Date(),
    };
    this.articles.set(id, updated);
    return updated;
  }

  async deleteArticle(id: number): Promise<boolean> {
    return this.articles.delete(id);
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
