import { z } from "zod";

const supportedLanguages = ["en", "pt", "ru"] as const;
const bookingStatus = ["requested", "confirmed", "cancelled", "refunded", "completed", "paid"] as const;

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const adminCreateUserSchema = z.object({
  username: z.string().trim().min(3).max(100),
  password: z.string().min(8).max(200),
});

export const adminPasswordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(4000),
  language: z.enum(supportedLanguages).optional(),
});

export const testimonialSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerCountry: z.string().trim().min(2).max(120),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().trim().min(10).max(500),
  tourId: z.coerce.number().int().positive(),
  bookingReference: z.string().trim().max(64).optional(),
});

export const bookingSchema = z.object({
  tourId: z.coerce.number().int().positive(),
  availabilityId: z.coerce.number().int().positive(),
  customerFirstName: z.string().trim().min(1).max(120),
  customerLastName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(5).max(32),
  numberOfParticipants: z.coerce.number().int().positive().max(99),
  specialRequests: z.string().trim().max(2000).nullable().optional(),
  language: z.enum(supportedLanguages).optional(),
  discountCode: z.string().trim().max(64).optional(),
  additionalInfo: z.record(z.any()).optional(),
});

export const discountValidationSchema = z.object({
  code: z.string().trim().min(1).max(64),
  tourId: z.coerce.number().int().positive(),
  numberOfParticipants: z.coerce.number().int().positive().max(99),
});

export const adminRequestUpdateSchema = z.object({
  paymentStatus: z.enum(bookingStatus).optional(),
  confirmedDate: z.string().trim().max(64).nullable().optional(),
  confirmedTime: z.string().trim().max(32).nullable().optional(),
  confirmedMeetingPoint: z.string().trim().max(500).nullable().optional(),
  adminNotes: z.string().trim().max(2000).nullable().optional(),
});

export const galleryReorderSchema = z.object({
  imageIds: z.array(z.coerce.number().int().positive()).min(1),
});

export const storageDeleteSchema = z.object({
  name: z.string().trim().min(1).max(500),
});

export const deviceRegistrationSchema = z.object({
  platform: z.string().trim().min(2).max(64),
  token: z.string().trim().min(16).max(4096),
});
