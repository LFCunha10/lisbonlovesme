import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Tour model
export const tours = pgTable("tours", {
  id: serial("id").primaryKey(),
  name: json("name").$type<{ en: string; pt: string; ru: string }>().notNull(),
  shortDescription: json("short_description")
    .$type<{ en: string; pt: string; ru: string }>()
    .default({ en: "", pt: "", ru: "" }),
  description: json("description").$type<{ en: string; pt: string; ru: string }>().notNull(),
  imageUrl: text("image_url").notNull(),
  duration: json("duration").$type<{ en: string; pt: string; ru: string }>().notNull(),
  maxGroupSize: integer("max_group_size").notNull(),
  difficulty: json("difficulty").$type<{ en: string; pt: string; ru: string }>().notNull(),
  price: integer("price").notNull(),
  priceType: text("price_type").default("per_person"),
  badge: json("badge").$type<{ en: string; pt: string; ru: string }>().default({ en: "", pt: "", ru: "" }),
  badgeColor: text("badge_color"),
  isActive: boolean("is_active").default(true),
});

export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
});

export type MultilingualText = {
  en: string;
  pt: string;
  ru: string;
};

export type TourTranslations = {
  name: MultilingualText;
  shortDescription: MultilingualText;
  description: MultilingualText;
  duration: MultilingualText;
  difficulty: MultilingualText;
  badge: MultilingualText;
};

export const availabilities = pgTable("availabilities", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  time: text("time").notNull(),
  maxSpots: integer("max_spots").notNull(),
  spotsLeft: integer("spots_left").notNull(),
});

export const insertAvailabilitySchema = createInsertSchema(availabilities).omit({
  id: true,
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tourId: integer("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
  availabilityId: integer("availability_id")
    .notNull()
    .references(() => availabilities.id, { onDelete: "cascade" }),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  numberOfParticipants: integer("number_of_participants").notNull(),
  specialRequests: text("special_requests"),
  bookingReference: text("booking_reference").notNull().unique(),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").default("requested"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  additionalInfo: json("additional_info"),
  meetingPoint: text("meeting_point"),
  remindersSent: boolean("reminders_sent").default(false),
  confirmedDate: text("confirmed_date"),
  confirmedTime: text("confirmed_time"),
  confirmedMeetingPoint: text("confirmed_meeting_point"),
  adminNotes: text("admin_notes"),
  language: text("language").default("en"),
});

export const insertBookingSchema = createInsertSchema(bookings, {
  specialRequests: z.string().nullable().default(null),
  paymentStatus: z.string().nullable().default("requested"),
  stripePaymentIntentId: z.string().nullable().default(null),
  additionalInfo: z.any().nullable().default(null),
  meetingPoint: z.string().nullable().default(null),
  confirmedDate: z.string().nullable().default(null),
  confirmedTime: z.string().nullable().default(null),
  confirmedMeetingPoint: z.string().nullable().default(null),
  adminNotes: z.string().nullable().default(null),
  language: z.string().nullable().default("en"),
}).omit({
  id: true,
  bookingReference: true,
  createdAt: true,
  remindersSent: true,
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerCountry: text("customer_country").notNull(),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  isApproved: boolean("is_approved").default(false),
  tourId: integer("tour_id")
    .notNull()
    .references(() => tours.id, { onDelete: "cascade" }),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
  isApproved: true,
});

export const closedDays = pgTable("closed_days", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClosedDaySchema = createInsertSchema(closedDays).omit({
  id: true,
  createdAt: true,
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  autoCloseDay: boolean("auto_close_day").default(false),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertAdminSettingsSchema = createInsertSchema(adminSettings).omit({
  id: true,
  lastUpdated: true,
});

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  description: text("description"),
  displayOrder: integer("display_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertGallerySchema = createInsertSchema(gallery).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: json("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: json("content").notNull(),
  excerpt: json("excerpt"),
  featuredImage: text("featured_image"),
  parentId: integer("parent_id"),
  sortOrder: integer("sort_order").default(0),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Devices for push notifications
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // e.g., 'ios'
  token: text("token").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActiveAt: timestamp("last_active_at"),
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

// Documents for downloadable files with custom slugs
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  originalFilename: text("original_filename").notNull(),
  storedFilename: text("stored_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Document = InferSelectModel<typeof documents>;
export type InsertDocument = InferInsertModel<typeof documents>;

// App-side notifications (for visits, contact messages, etc.)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // e.g., 'visit', 'contact', 'booking'
  title: text("title").notNull(),
  body: text("body").notNull(),
  payload: json("payload"),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Persisted contact messages
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  read: true,
  createdAt: true,
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
export type Gallery = typeof gallery.$inferSelect;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
