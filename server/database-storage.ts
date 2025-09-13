import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users, tours, availabilities, bookings, testimonials, closedDays, adminSettings, gallery, articles,
  devices, notifications, contactMessages,
  type User, type InsertUser,
  type Tour, type InsertTour,
  type Availability, type InsertAvailability,
  type Booking, type InsertBooking,
  type Testimonial, type InsertTestimonial,
  type ClosedDay, type InsertClosedDay,
  type AdminSetting, type InsertAdminSetting,
  type Gallery, type InsertGallery,
  type Article, type InsertArticle,
  type Device, type InsertDevice,
  type Notification, type InsertNotification,
  type ContactMessage, type InsertContactMessage
} from "@shared/schema";
import { nanoid } from "nanoid";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Devices
  async registerDevice(platform: string, token: string): Promise<Device> {
    const now = new Date();
    const [d] = await db
      .insert(devices)
      .values({ platform, token, isActive: true, createdAt: now, lastActiveAt: now } as any)
      .onConflictDoUpdate({
        target: [devices.token],
        set: { platform, isActive: true, lastActiveAt: now },
      })
      .returning();
    return d;
  }

  async getDevices(): Promise<Device[]> {
    return db.select().from(devices).where(eq(devices.isActive, true));
  }

  async deactivateDevice(token: string): Promise<boolean> {
    const res = await db
      .update(devices)
      .set({ isActive: false })
      .where(eq(devices.token, token));
    return res.rowCount ? res.rowCount > 0 : false;
  }

  // Notifications
  async createNotification(n: InsertNotification): Promise<Notification> {
    const [record] = await db.insert(notifications).values(n as any).returning();
    return record;
  }

  async getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markNotificationRead(id: number, read = true): Promise<boolean> {
    const res = await db
      .update(notifications)
      .set({ read })
      .where(eq(notifications.id, id));
    return res.rowCount ? res.rowCount > 0 : false;
  }

  // Contact messages
  async createContactMessage(m: InsertContactMessage): Promise<ContactMessage> {
    const [cm] = await db.insert(contactMessages).values(m as any).returning();
    return cm;
  }

  async getContactMessages(limit = 50, offset = 0): Promise<ContactMessage[]> {
    return db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markContactMessageRead(id: number, read = true): Promise<boolean> {
    const res = await db
      .update(contactMessages)
      .set({ read })
      .where(eq(contactMessages.id, id));
    return res.rowCount ? res.rowCount > 0 : false;
  }
  // Closed Days operations
  async getClosedDays(): Promise<ClosedDay[]> {
    const closedDaysList = await db.select().from(closedDays).orderBy(asc(closedDays.date));
    return closedDaysList;
  }

  async getClosedDay(date: string): Promise<ClosedDay | undefined> {
    const [closedDay] = await db.select().from(closedDays).where(eq(closedDays.date, date));
    return closedDay;
  }

  async addClosedDay(date: string, reason?: string): Promise<ClosedDay> {
    const [closedDay] = await db
      .insert(closedDays)
      .values({
        date,
        reason: reason || 'Manually closed',
      })
      .onConflictDoNothing()
      .returning();

    return closedDay;
  }

  async removeClosedDay(date: string): Promise<boolean> {
    const result = await db.delete(closedDays).where(eq(closedDays.date, date));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async isDateClosed(date: string): Promise<boolean> {
    const [closedDay] = await db.select().from(closedDays).where(eq(closedDays.date, date));
    return !!closedDay;
  }

  // Admin Settings operations
  async getAdminSettings(): Promise<AdminSetting | undefined> {
    const [settings] = await db.select().from(adminSettings);
    if (!settings) {
      // Create default settings if none exist
      return this.updateAdminSettings({ autoCloseDay: false });
    }
    return settings;
  }

  async updateAdminSettings(data: Partial<AdminSetting>): Promise<AdminSetting> {
  const [updated] = await db
    .insert(adminSettings)
    .values({
      id: 1,
      autoCloseDay: data.autoCloseDay ?? false,
      lastUpdated: new Date(),
    })
    .onConflictDoUpdate({
      target: [adminSettings.id],
      set: {
        autoCloseDay: data.autoCloseDay ?? false,
        lastUpdated: new Date(),
      },
    })
    .returning();

  return updated;
}

  async getAutoCloseDaySetting(): Promise<boolean> {
    const settings = await this.getAdminSettings();
    return settings?.autoCloseDay || false;
  }

  // Gallery operations
  async getGalleryImages(): Promise<Gallery[]> {
    const images = await db.select().from(gallery).orderBy(gallery.displayOrder, gallery.id);
    return images;
  }

  async getGalleryImage(id: number): Promise<Gallery | undefined> {
    const [image] = await db.select().from(gallery).where(eq(gallery.id, id));
    return image;
  }

  async createGalleryImage(image: InsertGallery): Promise<Gallery> {
    const [newImage] = await db
      .insert(gallery)
      .values({
        ...image,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newImage;
  }

  async updateGalleryImage(id: number, image: Partial<InsertGallery>): Promise<Gallery | undefined> {
    const [updatedImage] = await db
      .update(gallery)
      .set({ ...image, updatedAt: new Date() })
      .where(eq(gallery.id, id))
      .returning();
    return updatedImage;
  }

  async deleteGalleryImage(id: number): Promise<boolean> {
    const result = await db.delete(gallery).where(eq(gallery.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async reorderGalleryImages(imageIds: number[]): Promise<boolean> {
    try {
      for (let i = 0; i < imageIds.length; i++) {
        await db
          .update(gallery)
          .set({ displayOrder: i })
          .where(eq(gallery.id, imageIds[i]));
      }
      return true;
    } catch (error) {
      console.error('Error reordering gallery images:', error);
      return false;
    }
  }
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ? { ...user, isAdmin: !!user.isAdmin } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ? { ...user, isAdmin: !!user.isAdmin } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Tour operations
  async getTours(): Promise<Tour[]> {
    // Only active tours for public endpoints
    return db.select().from(tours).where(eq(tours.isActive, true));
  }

  async getAllTours(): Promise<Tour[]> {
    // Admin/management view requires all tours
    return db.select().from(tours);
  }

  async getTour(id: number): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [newTour] = await db.insert(tours).values({
      ...tour,
      shortDescription: tour.shortDescription ?? null,
      // Ensure DB default true is respected when undefined
      isActive: tour.isActive ?? true,
    }).returning();
    return newTour;
  }

  async updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const [updatedTour] = await db
      .update(tours)
      .set(tour)
      .where(eq(tours.id, id))
      .returning();
    return updatedTour;
  }

  async deleteTour(id: number): Promise<boolean> {
    const result = await db.delete(tours).where(eq(tours.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Availability operations
  async getAvailabilities(tourId?: number): Promise<Availability[]> {
    if (tourId) {
      return db.select().from(availabilities).where(eq(availabilities.tourId, tourId));
    }
    return db.select().from(availabilities);
  }

  async getAvailability(id: number): Promise<Availability | undefined> {
    const [availability] = await db.select().from(availabilities).where(eq(availabilities.id, id));
    return availability;
  }

  async getAvailabilityByTourAndDateTime(
    tourId: number,
    date: string,
    time: string
  ): Promise<Availability | undefined> {
    const [availability] = await db
      .select()
      .from(availabilities)
      .where(
        and(
          eq(availabilities.tourId, tourId),
          eq(availabilities.date, date),
          eq(availabilities.time, time)
        )
      );
    return availability;
  }

  async createAvailability(availability: InsertAvailability): Promise<Availability> {
    const [newAvailability] = await db
      .insert(availabilities)
      .values(availability)
      .returning();
    return newAvailability;
  }

  async updateAvailability(
    id: number,
    availability: Partial<InsertAvailability>
  ): Promise<Availability | undefined> {
    const [updatedAvailability] = await db
      .update(availabilities)
      .set(availability)
      .where(eq(availabilities.id, id))
      .returning();
    return updatedAvailability;
  }

  async deleteAvailability(id: number): Promise<boolean> {
    const result = await db.delete(availabilities).where(eq(availabilities.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Booking operations
  async getBookings(tourId?: number): Promise<Booking[]> {
    if (tourId) {
      return db
        .select()
        .from(bookings)
        .where(eq(bookings.tourId, tourId))
        .orderBy(desc(bookings.createdAt));
    }
    return db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingByReference(reference: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingReference, reference));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
  console.log("Starting booking creation with data:", booking);

  const bookingReference = `LT-${nanoid(7).toUpperCase()}`;

  try {
    const [newBooking] = await db
      .insert(bookings)
      .values({
        ...booking,
        bookingReference,
        specialRequests: booking.specialRequests ?? null,
        paymentStatus: booking.paymentStatus ?? null,
        stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
        additionalInfo: booking.additionalInfo ?? null,
        meetingPoint: booking.meetingPoint ?? null,
        confirmedDate: booking.confirmedDate ?? null,
        confirmedTime: booking.confirmedTime ?? null,
        confirmedMeetingPoint: booking.confirmedMeetingPoint ?? null,
        adminNotes: booking.adminNotes ?? null,
        language: booking.language ?? null,
      })
      .returning();

    console.log("Booking inserted successfully:", newBooking);
    return newBooking;

  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
}

  async updateBooking(
    id: number,
    booking: Partial<InsertBooking>
  ): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set(booking)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async updatePaymentStatus(
    id: number,
    paymentStatus: string,
    stripePaymentIntentId?: string
  ): Promise<Booking | undefined> {
    const updateData: any = { paymentStatus };
    if (stripePaymentIntentId) {
      updateData.stripePaymentIntentId = stripePaymentIntentId;
    }
    
    const [updatedBooking] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Testimonial operations
  async getTestimonials(tourId?: number, approvedOnly = true): Promise<Testimonial[]> {
    return db
      .select()
      .from(testimonials)
      .where(
        and(
          ...(tourId ? [eq(testimonials.tourId, tourId)] : []),
          ...(approvedOnly ? [eq(testimonials.isApproved, true)] : [])
        )
      )
      .orderBy(desc(testimonials.id));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db
      .insert(testimonials)
      .values({
        ...testimonial,
        isApproved: null,
      })
      .returning();
    return newTestimonial;
  }

  async approveTestimonial(id: number): Promise<Testimonial | undefined> {
    const [updatedTestimonial] = await db
      .update(testimonials)
      .set({ isApproved: true })
      .where(eq(testimonials.id, id))
      .returning();
    return updatedTestimonial;
  }

  // Article operations
  async getArticles(): Promise<Article[]> {
    return db.select().from(articles).orderBy(asc(articles.sortOrder));
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
    return article;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db
      .insert(articles)
      .values({
        ...article,
        updatedAt: new Date(),
      })
      .returning();
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updatedArticle] = await db
      .update(articles)
      .set({
        ...article,
        updatedAt: new Date(),
      })
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    try {
      await db.delete(articles).where(eq(articles.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting article:", error);
      return false;
    }
  }

  async getArticleTree(): Promise<Article[]> {
    const allArticles = await db.select().from(articles).orderBy(asc(articles.id));
    return allArticles;
  }

}
