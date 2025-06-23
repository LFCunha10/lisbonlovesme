"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertArticleSchema = exports.articles = exports.insertGallerySchema = exports.gallery = exports.insertAdminSettingsSchema = exports.adminSettings = exports.insertClosedDaySchema = exports.closedDays = exports.insertTestimonialSchema = exports.testimonials = exports.insertBookingSchema = exports.bookings = exports.insertAvailabilitySchema = exports.availabilities = exports.insertTourSchema = exports.tours = exports.insertUserSchema = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
var drizzle_zod_1 = require("drizzle-zod");
var zod_1 = require("zod");
// User model
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    isAdmin: (0, pg_core_1.boolean)("is_admin").default(false),
});
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
    isAdmin: true,
});
// Tour model
exports.tours = (0, pg_core_1.pgTable)("tours", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.json)("name").$type().notNull(),
    shortDescription: (0, pg_core_1.json)("short_description")
        .$type()
        .default({ en: "", pt: "", ru: "" }),
    description: (0, pg_core_1.json)("description").$type().notNull(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    duration: (0, pg_core_1.json)("duration").$type().notNull(),
    maxGroupSize: (0, pg_core_1.integer)("max_group_size").notNull(),
    difficulty: (0, pg_core_1.json)("difficulty").$type().notNull(),
    price: (0, pg_core_1.integer)("price").notNull(),
    priceType: (0, pg_core_1.text)("price_type").default("per_person"),
    badge: (0, pg_core_1.json)("badge").$type().default({ en: "", pt: "", ru: "" }),
    badgeColor: (0, pg_core_1.text)("badge_color"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
exports.insertTourSchema = (0, drizzle_zod_1.createInsertSchema)(exports.tours).omit({
    id: true,
});
exports.availabilities = (0, pg_core_1.pgTable)("availabilities", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tourId: (0, pg_core_1.integer)("tour_id")
        .notNull()
        .references(function () { return exports.tours.id; }, { onDelete: "cascade" }),
    date: (0, pg_core_1.text)("date").notNull(),
    time: (0, pg_core_1.text)("time").notNull(),
    maxSpots: (0, pg_core_1.integer)("max_spots").notNull(),
    spotsLeft: (0, pg_core_1.integer)("spots_left").notNull(),
});
exports.insertAvailabilitySchema = (0, drizzle_zod_1.createInsertSchema)(exports.availabilities).omit({
    id: true,
});
exports.bookings = (0, pg_core_1.pgTable)("bookings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    tourId: (0, pg_core_1.integer)("tour_id")
        .notNull()
        .references(function () { return exports.tours.id; }, { onDelete: "cascade" }),
    availabilityId: (0, pg_core_1.integer)("availability_id")
        .notNull()
        .references(function () { return exports.availabilities.id; }, { onDelete: "cascade" }),
    customerFirstName: (0, pg_core_1.text)("customer_first_name").notNull(),
    customerLastName: (0, pg_core_1.text)("customer_last_name").notNull(),
    customerEmail: (0, pg_core_1.text)("customer_email").notNull(),
    customerPhone: (0, pg_core_1.text)("customer_phone").notNull(),
    numberOfParticipants: (0, pg_core_1.integer)("number_of_participants").notNull(),
    specialRequests: (0, pg_core_1.text)("special_requests"),
    bookingReference: (0, pg_core_1.text)("booking_reference").notNull().unique(),
    totalAmount: (0, pg_core_1.integer)("total_amount").notNull(),
    paymentStatus: (0, pg_core_1.text)("payment_status").default("requested"),
    stripePaymentIntentId: (0, pg_core_1.text)("stripe_payment_intent_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    additionalInfo: (0, pg_core_1.json)("additional_info"),
    meetingPoint: (0, pg_core_1.text)("meeting_point"),
    remindersSent: (0, pg_core_1.boolean)("reminders_sent").default(false),
    confirmedDate: (0, pg_core_1.text)("confirmed_date"),
    confirmedTime: (0, pg_core_1.text)("confirmed_time"),
    confirmedMeetingPoint: (0, pg_core_1.text)("confirmed_meeting_point"),
    adminNotes: (0, pg_core_1.text)("admin_notes"),
    language: (0, pg_core_1.text)("language").default("en"),
});
exports.insertBookingSchema = (0, drizzle_zod_1.createInsertSchema)(exports.bookings, {
    specialRequests: zod_1.z.string().nullable().default(null),
    paymentStatus: zod_1.z.string().nullable().default("requested"),
    stripePaymentIntentId: zod_1.z.string().nullable().default(null),
    additionalInfo: zod_1.z.any().nullable().default(null),
    meetingPoint: zod_1.z.string().nullable().default(null),
    confirmedDate: zod_1.z.string().nullable().default(null),
    confirmedTime: zod_1.z.string().nullable().default(null),
    confirmedMeetingPoint: zod_1.z.string().nullable().default(null),
    adminNotes: zod_1.z.string().nullable().default(null),
    language: zod_1.z.string().nullable().default("en"),
}).omit({
    id: true,
    bookingReference: true,
    createdAt: true,
    remindersSent: true,
});
exports.testimonials = (0, pg_core_1.pgTable)("testimonials", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    customerName: (0, pg_core_1.text)("customer_name").notNull(),
    customerCountry: (0, pg_core_1.text)("customer_country").notNull(),
    rating: (0, pg_core_1.integer)("rating").notNull(),
    text: (0, pg_core_1.text)("text").notNull(),
    isApproved: (0, pg_core_1.boolean)("is_approved").default(false),
    tourId: (0, pg_core_1.integer)("tour_id")
        .notNull()
        .references(function () { return exports.tours.id; }, { onDelete: "cascade" }),
});
exports.insertTestimonialSchema = (0, drizzle_zod_1.createInsertSchema)(exports.testimonials).omit({
    id: true,
    isApproved: true,
});
exports.closedDays = (0, pg_core_1.pgTable)("closed_days", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    date: (0, pg_core_1.text)("date").notNull().unique(),
    reason: (0, pg_core_1.text)("reason"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.insertClosedDaySchema = (0, drizzle_zod_1.createInsertSchema)(exports.closedDays).omit({
    id: true,
    createdAt: true,
});
exports.adminSettings = (0, pg_core_1.pgTable)("admin_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    autoCloseDay: (0, pg_core_1.boolean)("auto_close_day").default(false),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
});
exports.insertAdminSettingsSchema = (0, drizzle_zod_1.createInsertSchema)(exports.adminSettings).omit({
    id: true,
    lastUpdated: true,
});
exports.gallery = (0, pg_core_1.pgTable)("gallery", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    title: (0, pg_core_1.text)("title"),
    description: (0, pg_core_1.text)("description"),
    displayOrder: (0, pg_core_1.integer)("display_order").default(0).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertGallerySchema = (0, drizzle_zod_1.createInsertSchema)(exports.gallery).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
exports.articles = (0, pg_core_1.pgTable)("articles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.json)("title").notNull(),
    slug: (0, pg_core_1.text)("slug").notNull().unique(),
    content: (0, pg_core_1.json)("content").notNull(),
    excerpt: (0, pg_core_1.json)("excerpt"),
    featuredImage: (0, pg_core_1.text)("featured_image"),
    parentId: (0, pg_core_1.integer)("parent_id"),
    sortOrder: (0, pg_core_1.integer)("sort_order").default(0),
    isPublished: (0, pg_core_1.boolean)("is_published").default(false),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.insertArticleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.articles).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
