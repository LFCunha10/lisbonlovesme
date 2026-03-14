import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  currentStorage: null as any,
  sendBookingConfirmationEmail: vi.fn(async () => undefined),
  sendRequestConfirmationEmail: vi.fn(async () => undefined),
  sendReviewRequestEmail: vi.fn(async () => undefined),
  sendBookingRequestNotification: vi.fn(async () => undefined),
  sendContactFormNotification: vi.fn(async () => undefined),
  verifyEmailTransport: vi.fn(async () => ({ ok: true })),
  sendTestEmail: vi.fn(async () => undefined),
  getEmailTransportDiagnostics: vi.fn(() => ({ ok: true })),
  createNotificationAndPush: vi.fn(async () => undefined),
}));

vi.mock("../../server/storage", async () => {
  const actual = await vi.importActual<any>("../../server/storage");
  return {
    ...actual,
    get storage() {
      return testState.currentStorage;
    },
  };
});

vi.mock("../../server/emailService.js", () => ({
  sendBookingConfirmationEmail: testState.sendBookingConfirmationEmail,
  sendRequestConfirmationEmail: testState.sendRequestConfirmationEmail,
  sendReviewRequestEmail: testState.sendReviewRequestEmail,
  sendBookingRequestNotification: testState.sendBookingRequestNotification,
  sendContactFormNotification: testState.sendContactFormNotification,
  verifyEmailTransport: testState.verifyEmailTransport,
  sendTestEmail: testState.sendTestEmail,
  getEmailTransportDiagnostics: testState.getEmailTransportDiagnostics,
}));

vi.mock("../../server/translation-service.js", () => ({
  autoTranslateTourContent: vi.fn(async (payload: any) => payload),
  translateField: vi.fn(async (value: string) => value),
}));

vi.mock("../../server/notificationService", () => ({
  createNotificationAndPush: testState.createNotificationAndPush,
}));

vi.mock("../../server/websocket", () => ({
  initNotificationsWebSocketServer: vi.fn(),
}));

vi.mock("../../server/utils/export-database-complete", () => ({
  exportDatabase: vi.fn(async () => "/tmp/test-export.sql"),
}));

vi.mock("../../server/utils/image-upload", () => ({
  upload: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  handleUploadErrors: (_req: any, _res: any, next: any) => next(),
  getUploadedFileUrl: (filename: string) => `/uploads/${filename}`,
  getImageStoredFilePath: (filename: string) => `/tmp/${filename}`,
}));

vi.mock("../../server/utils/document-upload", () => ({
  uploadDocument: {
    single: () => (_req: any, _res: any, next: any) => next(),
  },
  handleDocumentUploadErrors: (_req: any, _res: any, next: any) => next(),
  getStoredFilePath: (filename: string) => `/tmp/${filename}`,
}));

class RouteTestStorageBase {}

let registerRoutes: ((app: express.Express) => Promise<Server>) | undefined;

async function buildStorage() {
  const actual = await vi.importActual<any>("../../server/storage");
  const MemStorage = actual.MemStorage as any;

  class RouteTestStorage extends MemStorage {
    private closedDaysMem = new Map<string, any>();
    private closedDayCurrentId = 1;
    private galleryMem = new Map<number, any>();
    private galleryCurrentId = 1;
    private autoCloseDayEnabled = false;

    async getClosedDays() {
      return Array.from(this.closedDaysMem.values());
    }

    async getClosedDay(date: string) {
      return this.closedDaysMem.get(date);
    }

    async addClosedDay(date: string, reason?: string) {
      const existing = this.closedDaysMem.get(date);
      if (existing) return existing;
      const row = {
        id: this.closedDayCurrentId++,
        date,
        reason: reason ?? null,
        createdAt: new Date(),
      };
      this.closedDaysMem.set(date, row);
      return row;
    }

    async removeClosedDay(date: string) {
      return this.closedDaysMem.delete(date);
    }

    async isDateClosed(date: string) {
      return this.closedDaysMem.has(date);
    }

    async updateAdminSettings(settings: any) {
      if (typeof settings?.autoCloseDay === "boolean") {
        this.autoCloseDayEnabled = settings.autoCloseDay;
      }
      return super.updateAdminSettings(settings);
    }

    async getAutoCloseDaySetting() {
      return this.autoCloseDayEnabled;
    }

    async getGalleryImages() {
      return Array.from(this.galleryMem.values()).sort((a, b) => a.displayOrder - b.displayOrder);
    }

    async getGalleryImage(id: number) {
      return this.galleryMem.get(id);
    }

    async createGalleryImage(image: any) {
      const id = this.galleryCurrentId++;
      const row = {
        id,
        imageUrl: image.imageUrl,
        title: image.title ?? null,
        description: image.description ?? null,
        displayOrder: image.displayOrder ?? 0,
        isActive: image.isActive ?? true,
        createdAt: image.createdAt ?? new Date(),
        updatedAt: image.updatedAt ?? new Date(),
      };
      this.galleryMem.set(id, row);
      return row;
    }

    async updateGalleryImage(id: number, image: any) {
      const existing = this.galleryMem.get(id);
      if (!existing) return undefined;
      const updated = {
        ...existing,
        ...image,
        updatedAt: new Date(),
      };
      this.galleryMem.set(id, updated);
      return updated;
    }

    async deleteGalleryImage(id: number) {
      return this.galleryMem.delete(id);
    }

    async reorderGalleryImages(imageIds: number[]) {
      imageIds.forEach((id, index) => {
        const image = this.galleryMem.get(id);
        if (image) {
          this.galleryMem.set(id, { ...image, displayOrder: index });
        }
      });
      return true;
    }
  }

  return new RouteTestStorage();
}

async function startTestServer() {
  if (!registerRoutes) {
    ({ registerRoutes } = await import("../../server/routes"));
  }

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(
    session({
      secret: "integration-test-secret",
      resave: false,
      saveUninitialized: true,
    }),
  );
  app.use((req, _res, next) => {
    if (req.headers["x-test-admin"] === "1") {
      req.session.isAuthenticated = true;
      req.session.user = {
        id: 1,
        username: "admin",
        isAdmin: true,
      };
    }
    next();
  });

  const server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function seedTour(overrides: Record<string, unknown> = {}) {
  return testState.currentStorage.createTour({
    name: { en: "Lisbon Walking Tour", pt: "Passeio em Lisboa", ru: "Тур по Лиссабону" },
    shortDescription: { en: "Short", pt: "Curto", ru: "Коротко" },
    description: { en: "Full description", pt: "Descricao", ru: "Описание" },
    imageUrl: "/tour.jpg",
    duration: 3,
    displayDurationInCard: true,
    displayGroupSizeInCard: true,
    displayChildrenInCard: true,
    displayConductedByInCard: true,
    displayDifficultyInCard: true,
    childrenPolicy: "allowed",
    conductedBy: "walking",
    maxGroupSize: 12,
    difficulty: { en: "Easy", pt: "Facil", ru: "Легко" },
    price: 15000,
    priceType: "per_person",
    badge: { en: "Popular", pt: "Popular", ru: "Популярно" },
    badgeColor: "primary",
    isActive: true,
    ...overrides,
  });
}

describe("server/routes integration", () => {
  beforeEach(async () => {
    testState.currentStorage = await buildStorage();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("serves the main public collections through the registered routes", async () => {
    const activeTour = await seedTour();
    await seedTour({
      name: { en: "Hidden Tour", pt: "Oculto", ru: "Скрытый" },
      isActive: false,
    });
    await testState.currentStorage.createArticle({
      title: { en: "Published", pt: "Publicado", ru: "Опубликовано" },
      slug: "published-article",
      content: { en: "Body", pt: "Corpo", ru: "Текст" },
      excerpt: { en: "Excerpt", pt: "Resumo", ru: "Кратко" },
      featuredImage: "/article.jpg",
      parentId: undefined,
      sortOrder: 0,
      isPublished: true,
      publishedAt: new Date(),
    });
    await testState.currentStorage.createArticle({
      title: { en: "Draft", pt: "Rascunho", ru: "Черновик" },
      slug: "draft-article",
      content: { en: "Draft", pt: "Rascunho", ru: "Черновик" },
      excerpt: { en: "Excerpt", pt: "Resumo", ru: "Кратко" },
      featuredImage: "/draft.jpg",
      parentId: undefined,
      sortOrder: 1,
      isPublished: false,
      publishedAt: null,
    });
    await testState.currentStorage.createGalleryImage({
      imageUrl: "/gallery.jpg",
      title: "Gallery",
      description: "Test image",
      displayOrder: 0,
      isActive: true,
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const toursResponse = await fetch(`${baseUrl}/api/tours`);
      const allToursResponse = await fetch(`${baseUrl}/api/tours?all=1`);
      const publishedArticlesResponse = await fetch(`${baseUrl}/api/articles?published=true`);
      const galleryResponse = await fetch(`${baseUrl}/api/gallery`);

      expect(toursResponse.status).toBe(200);
      expect(allToursResponse.status).toBe(200);
      expect(publishedArticlesResponse.status).toBe(200);
      expect(galleryResponse.status).toBe(200);

      const tours = await json<any[]>(toursResponse);
      const allTours = await json<any[]>(allToursResponse);
      const publishedArticles = await json<any[]>(publishedArticlesResponse);
      const gallery = await json<any[]>(galleryResponse);

      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe(activeTour.id);
      expect(allTours).toHaveLength(2);
      expect(publishedArticles).toHaveLength(1);
      expect(publishedArticles[0].slug).toBe("published-article");
      expect(gallery).toHaveLength(1);
      expect(gallery[0].imageUrl).toBe("/gallery.jpg");
    } finally {
      await stopServer(server);
    }
  });

  it("returns tour details with approved testimonials and filters closed-day availabilities", async () => {
    const tour = await seedTour();
    await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-08-10",
      time: "10:00",
      maxSpots: 10,
      spotsLeft: 6,
    });
    await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-08-11",
      time: "11:00",
      maxSpots: 10,
      spotsLeft: 4,
    });
    await testState.currentStorage.addClosedDay("2026-08-11", "Closed for event");

    const approved = await testState.currentStorage.createTestimonial({
      customerName: "Alice",
      customerCountry: "PT",
      rating: 5,
      text: "Excellent",
      tourId: tour.id,
    });
    await testState.currentStorage.createTestimonial({
      customerName: "Bob",
      customerCountry: "US",
      rating: 4,
      text: "Pending",
      tourId: tour.id,
    });
    await testState.currentStorage.approveTestimonial(approved.id);

    const { server, baseUrl } = await startTestServer();
    try {
      const tourResponse = await fetch(`${baseUrl}/api/tours/${tour.id}`);
      const availabilitiesResponse = await fetch(`${baseUrl}/api/availabilities/${tour.id}`);

      expect(tourResponse.status).toBe(200);
      expect(availabilitiesResponse.status).toBe(200);

      const tourPayload = await json<any>(tourResponse);
      const availabilitiesPayload = await json<any[]>(availabilitiesResponse);

      expect(tourPayload.testimonials).toHaveLength(1);
      expect(tourPayload.testimonials[0].customerName).toBe("Alice");
      expect(availabilitiesPayload).toHaveLength(1);
      expect(availabilitiesPayload[0].date).toBe("2026-08-10");
    } finally {
      await stopServer(server);
    }
  });

  it("creates bookings end to end with totals, discount tracking, availability updates, and side effects", async () => {
    const tour = await seedTour({ price: 12000 });
    const availability = await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-09-01",
      time: "09:30",
      maxSpots: 8,
      spotsLeft: 5,
    });
    await testState.currentStorage.createDiscountCode({
      code: "SAVE10",
      name: "Ten Percent",
      category: "percentage",
      value: 10,
      usageLimit: 5,
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId: tour.id,
          availabilityId: availability.id,
          customerFirstName: "Luiz",
          customerLastName: "Cunha",
          customerEmail: "luiz@example.com",
          customerPhone: "+351123456789",
          numberOfParticipants: 2,
          specialRequests: "Window seat",
          language: "en",
          discountCode: "SAVE10",
        }),
      });

      expect(bookingResponse.status).toBe(201);
      const bookingPayload = await json<any>(bookingResponse);
      const updatedAvailability = await testState.currentStorage.getAvailability(availability.id);
      const discount = await testState.currentStorage.getDiscountCodeByCode("SAVE10");

      expect(bookingPayload.success).toBe(true);
      expect(bookingPayload.totalAmount).toBe(21600);
      expect(bookingPayload.paymentStatus).toBe("requested");
      expect(bookingPayload.additionalInfo.pricing.originalAmount).toBe(24000);
      expect(bookingPayload.additionalInfo.pricing.discount.appliedAmount).toBe(2400);
      expect(updatedAvailability?.spotsLeft).toBe(3);
      expect(discount?.usedCount).toBe(1);
      expect(testState.sendRequestConfirmationEmail).toHaveBeenCalledTimes(1);
      expect(testState.sendBookingRequestNotification).toHaveBeenCalledTimes(1);
      expect(testState.createNotificationAndPush).toHaveBeenCalledTimes(1);
    } finally {
      await stopServer(server);
    }
  });

  it("persists contact messages and exposes admin message access through authenticated routes", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const invalidResponse = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Luiz" }),
      });
      const validResponse = await fetch(`${baseUrl}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Luiz",
          email: "luiz@example.com",
          subject: "Question",
          message: "Hello there",
          language: "en",
        }),
      });
      const unauthenticatedMessagesResponse = await fetch(`${baseUrl}/api/admin/messages`);
      const authenticatedMessagesResponse = await fetch(`${baseUrl}/api/admin/messages`, {
        headers: { "x-test-admin": "1" },
      });

      expect(invalidResponse.status).toBe(400);
      expect(validResponse.status).toBe(200);
      expect(unauthenticatedMessagesResponse.status).toBe(401);
      expect(authenticatedMessagesResponse.status).toBe(200);

      const messages = await json<any[]>(authenticatedMessagesResponse);
      expect(messages).toHaveLength(1);
      expect(messages[0].email).toBe("luiz@example.com");
      expect(testState.sendContactFormNotification).toHaveBeenCalledTimes(1);
      expect(testState.createNotificationAndPush).toHaveBeenCalledTimes(1);
    } finally {
      await stopServer(server);
    }
  });

  it("protects notification endpoints and returns structured notifications for admins", async () => {
    await testState.currentStorage.createNotification({
      type: "visit",
      title: "New Site Visit",
      body: JSON.stringify({
        title: "Visit",
        dateString: "Friday, March 13",
        location: "Lisbon",
        device: { browser: "Safari" },
      }),
      payload: { when: new Date().toISOString() },
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const unauthenticatedResponse = await fetch(`${baseUrl}/api/notifications`);
      const authenticatedResponse = await fetch(`${baseUrl}/api/notifications`, {
        headers: { "x-test-admin": "1" },
      });

      expect(unauthenticatedResponse.status).toBe(401);
      expect(authenticatedResponse.status).toBe(200);

      const notifications = await json<any[]>(authenticatedResponse);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].body.ok).toBe(true);
      expect(notifications[0].body.location).toBe("Lisbon");
      expect(notifications[0].body.device.browser).toBe("Safari");
    } finally {
      await stopServer(server);
    }
  });
});
