import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import type { Server } from "http";
import type { AddressInfo } from "net";
import { vi } from "vitest";
import fs from "fs";
import path from "path";

export const testState = {
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
};

export const TEST_API_KEYS = JSON.stringify([
  {
    id: "ops",
    value: "ops-key-for-tests-1234567890",
    scopes: ["admin:read", "admin:write"],
  },
  {
    id: "ios-push",
    value: "push-key-for-tests-1234567890",
    scopes: ["push:register"],
  },
]);

const originalApiKeys = process.env.API_KEYS;

vi.mock("../../../server/storage", async () => {
  const actual = await vi.importActual<any>("../../../server/storage");
  return {
    ...actual,
    get storage() {
      return testState.currentStorage;
    },
  };
});

vi.mock("../../../server/emailService.js", () => ({
  sendBookingConfirmationEmail: testState.sendBookingConfirmationEmail,
  sendRequestConfirmationEmail: testState.sendRequestConfirmationEmail,
  sendReviewRequestEmail: testState.sendReviewRequestEmail,
  sendBookingRequestNotification: testState.sendBookingRequestNotification,
  sendContactFormNotification: testState.sendContactFormNotification,
  verifyEmailTransport: testState.verifyEmailTransport,
  sendTestEmail: testState.sendTestEmail,
  getEmailTransportDiagnostics: testState.getEmailTransportDiagnostics,
}));

vi.mock("../../../server/translation-service.js", () => ({
  autoTranslateTourContent: vi.fn(async (payload: any) => payload),
  translateField: vi.fn(async (value: string) => value),
}));

vi.mock("../../../server/notificationService", () => ({
  createNotificationAndPush: testState.createNotificationAndPush,
}));

vi.mock("../../../server/websocket", () => ({
  initNotificationsWebSocketServer: vi.fn(),
}));

vi.mock("../../../server/utils/export-database-complete", () => ({
  exportDatabase: vi.fn(async () => "/tmp/test-export.sql"),
}));

vi.mock("../../../server/utils/image-upload", () => ({
  upload: {
    single: () => (req: any, _res: any, next: any) => {
      const filenameHeader = req.headers["x-test-upload-filename"];
      if (typeof filenameHeader === "string" && filenameHeader) {
        req.file = {
          filename: filenameHeader,
          originalname: (req.headers["x-test-upload-original-name"] as string) || filenameHeader,
          mimetype: (req.headers["x-test-upload-mimetype"] as string) || "image/jpeg",
          size: Number(req.headers["x-test-upload-size"] || 128),
        };
      }
      next();
    },
  },
  handleUploadErrors: (_req: any, _res: any, next: any) => next(),
  getUploadedFileUrl: (filename: string) => `/uploads/${filename}`,
  getImageStoredFilePath: (filename: string) => `/tmp/${filename}`,
}));

vi.mock("../../../server/utils/document-upload", () => ({
  uploadDocument: {
    single: () => (req: any, _res: any, next: any) => {
      const filenameHeader = req.headers["x-test-upload-filename"];
      if (typeof filenameHeader === "string" && filenameHeader) {
        req.file = {
          filename: filenameHeader,
          originalname: (req.headers["x-test-upload-original-name"] as string) || filenameHeader,
          mimetype: (req.headers["x-test-upload-mimetype"] as string) || "application/pdf",
          size: Number(req.headers["x-test-upload-size"] || 1024),
        };
      }
      next();
    },
  },
  handleDocumentUploadErrors: (_req: any, _res: any, next: any) => next(),
  getStoredFilePath: (filename: string) => `/tmp/${filename}`,
}));

let registerRoutes: ((app: express.Express) => Promise<Server>) | undefined;

export async function buildStorage() {
  const actual = await vi.importActual<any>("../../../server/storage");
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

export async function resetRouteTestState() {
  testState.currentStorage = await buildStorage();
  vi.clearAllMocks();
  process.env.API_KEYS = TEST_API_KEYS;
  return testState.currentStorage;
}

export function restoreRouteTestState() {
  vi.clearAllMocks();
  if (typeof originalApiKeys === "string") {
    process.env.API_KEYS = originalApiKeys;
  } else {
    delete process.env.API_KEYS;
  }
}

export async function startTestServer() {
  if (!registerRoutes) {
    ({ registerRoutes } = await import("../../../server/routes"));
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
  app.get("/__test__/browser", (_req, res) => {
    res.status(200).type("html").send("<!doctype html><html><body>route-test-browser</body></html>");
  });

  const server = await registerRoutes(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

export async function stopServer(server: Server) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

export async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function seedTour(overrides: Record<string, unknown> = {}) {
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

export async function writeTempFile(filename: string, contents: string) {
  const targetPath = path.join("/tmp", filename);
  await fs.promises.writeFile(targetPath, contents, "utf8");
  return targetPath;
}
