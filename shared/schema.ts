import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model (imported from the existing schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Tour model
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  duration: text("duration").notNull(),
  maxGroupSize: integer("max_group_size").notNull(),
  difficulty: text("difficulty").notNull(),
  price: integer("price").notNull(), // Price in cents
  badge: text("badge"), // "Most Popular", "Evening Tour", "Full Day", etc.
  badgeColor: text("badge_color"), // For styling
  isActive: boolean("is_active").default(true),
});

export const toursRelations = relations(tours, ({ many }) => ({
  availabilities: many(availabilities),
  bookings: many(bookings),
  testimonials: many(testimonials),
}));

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
});

// Availability model
export const availabilities = pgTable("availabilities", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  time: text("time").notNull(), // Format: HH:MM
  maxSpots: integer("max_spots").notNull(),
  spotsLeft: integer("spots_left").notNull(),
});

export const availabilitiesRelations = relations(availabilities, ({ one, many }) => ({
  tour: one(tours, {
    fields: [availabilities.tourId],
    references: [tours.id],
  }),
  bookings: many(bookings),
}));

export const insertAvailabilitySchema = createInsertSchema(availabilities).omit({
  id: true,
});

// Booking model
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  availabilityId: integer("availability_id").notNull().references(() => availabilities.id, { onDelete: "cascade" }),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  numberOfParticipants: integer("number_of_participants").notNull(),
  specialRequests: text("special_requests"),
  bookingReference: text("booking_reference").notNull().unique(),
  totalAmount: integer("total_amount").notNull(), // In cents
  paymentStatus: text("payment_status").default("pending"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  additionalInfo: json("additional_info"),
  meetingPoint: text("meeting_point"),
  remindersSent: boolean("reminders_sent").default(false),
});

export const bookingsRelations = relations(bookings, ({ one }) => ({
  tour: one(tours, {
    fields: [bookings.tourId],
    references: [tours.id],
  }),
  availability: one(availabilities, {
    fields: [bookings.availabilityId],
    references: [availabilities.id],
  }),
}));

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingReference: true,
  createdAt: true,
  remindersSent: true,
});

// Testimonial model
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerCountry: text("customer_country").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  isApproved: boolean("is_approved").default(false),
  tourId: integer("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
});

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  tour: one(tours, {
    fields: [testimonials.tourId],
    references: [tours.id],
  }),
}));

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  isApproved: true,
});

// Closed Days model
export const closedDays = pgTable("closed_days", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(), // Format: YYYY-MM-DD
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClosedDaySchema = createInsertSchema(closedDays).omit({
  id: true,
  createdAt: true,
});

// Admin Settings model
export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  autoCloseDay: boolean("auto_close_day").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  lastUpdated: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Tour = typeof tours.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;

export type Availability = typeof availabilities.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type ClosedDay = typeof closedDays.$inferSelect;
export type InsertClosedDay = z.infer<typeof insertClosedDaySchema>;

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingsSchema>;
