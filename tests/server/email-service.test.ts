import { beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const sendMailMock = vi.fn(async () => ({ messageId: "mock-message-id" }));
  const verifyMock = vi.fn(async () => true);
  const createTransportMock = vi.fn(() => ({
    sendMail: sendMailMock,
    verify: verifyMock,
  }));
  return {
    sendMailMock,
    verifyMock,
    createTransportMock,
  };
});

vi.mock("nodemailer", () => ({
  default: {
    createTransport: hoisted.createTransportMock,
  },
}));

const baseEnv = {
  EMAIL_HOST: "smtp.example.com",
  EMAIL_PORT: "587",
  EMAIL_USER: "noreply@example.com",
  EMAIL_PASS: "app-password-1234",
  ADMIN_EMAIL: "admin@example.com",
  DOMAIN: "lisbonlovesme.com",
};

async function loadModuleWithEnv(overrides: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [k, v] of Object.entries({ ...baseEnv, ...overrides })) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import("../../server/emailService");
}

describe("server/emailService", () => {
  beforeEach(() => {
    hoisted.sendMailMock.mockClear();
    hoisted.verifyMock.mockClear();
    hoisted.createTransportMock.mockClear();
  });

  it("skips transport verification when SMTP env is incomplete", async () => {
    const mod = await loadModuleWithEnv({ EMAIL_HOST: "" });
    const ok = await mod.verifyEmailTransport();
    expect(ok).toBe(false);
    expect(hoisted.verifyMock).not.toHaveBeenCalled();
  });

  it("sends review request email with booking review link", async () => {
    const mod = await loadModuleWithEnv();

    await mod.sendReviewRequestEmail({
      to: "customer@example.com",
      customerName: "Ana",
      bookingReference: "LT-ABC12345",
      tourName: "Lisbon Walk",
      baseUrl: "https://lisbonlovesme.com",
      language: "en",
    });

    expect(hoisted.sendMailMock).toHaveBeenCalledTimes(1);
    const call = hoisted.sendMailMock.mock.calls[0][0];
    expect(call.to).toBe("customer@example.com");
    expect(call.html).toContain("https://lisbonlovesme.com/review/LT-ABC12345");
    expect(call.from).toContain("Lisbonlovesme");
  });

  it("sends booking confirmation email with ICS attachment", async () => {
    const mod = await loadModuleWithEnv();

    await mod.sendBookingConfirmationEmail({
      to: "customer@example.com",
      name: "Ana",
      bookingReference: "LT-XYZ99999",
      tourName: "Sintra Day Tour",
      date: "2026-07-01",
      time: "09:30",
      participants: 2,
      totalAmount: "120.00",
      meetingPoint: "Rossio Square",
      language: "en",
    });

    expect(hoisted.sendMailMock).toHaveBeenCalledTimes(1);
    const call = hoisted.sendMailMock.mock.calls[0][0];
    expect(call.to).toBe("customer@example.com");
    expect(call.subject).toContain("LT-XYZ99999");
    expect(Array.isArray(call.attachments)).toBe(true);
    expect(call.attachments[0].filename).toBe("tour-booking.ics");
    expect(call.attachments[0].contentType).toContain("text/calendar");
  });

  it("sends admin booking request notification to ADMIN_EMAIL", async () => {
    const mod = await loadModuleWithEnv({ ADMIN_EMAIL: "ops@example.com" });

    await mod.sendBookingRequestNotification({
      customerName: "John",
      customerEmail: "john@example.com",
      customerPhone: "+351912345678",
      tourName: "Historic Lisbon",
      date: "2026-08-01",
      time: "11:00",
      participants: 4,
      bookingReference: "LT-REQ11111",
      language: "en",
    });

    expect(hoisted.sendMailMock).toHaveBeenCalledTimes(1);
    const call = hoisted.sendMailMock.mock.calls[0][0];
    expect(call.to).toBe("ops@example.com");
    expect(call.subject).toContain("Historic Lisbon");
    expect(call.html).toContain("LT-REQ11111");
  });
});
