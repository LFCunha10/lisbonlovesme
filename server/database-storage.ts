import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "./db";
import {
  users, tours, availabilities, bookings, testimonials, closedDays, adminSettings,
  type User, type InsertUser,
  type Tour, type InsertTour,
  type Availability, type InsertAvailability,
  type Booking, type InsertBooking,
  type Testimonial, type InsertTestimonial,
  type ClosedDay, type InsertClosedDay,
  type AdminSetting, type InsertAdminSetting
} from "@shared/schema";
import { nanoid } from "nanoid";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
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
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
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
    return db.select().from(tours).where(eq(tours.isActive, true));
  }

  async getTour(id: number): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [newTour] = await db.insert(tours).values(tour).returning();
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
      .values({ ...booking, bookingReference })
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
    let query = db.select().from(testimonials);
    
    if (tourId) {
      query = query.where(eq(testimonials.tourId, tourId));
    }
    
    if (approvedOnly) {
      query = query.where(eq(testimonials.isApproved, true));
    }
    
    return query.orderBy(desc(testimonials.id));
  }

  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const [newTestimonial] = await db
      .insert(testimonials)
      .values(testimonial)
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
}