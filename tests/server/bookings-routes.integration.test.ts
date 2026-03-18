import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  json,
  resetRouteTestState,
  restoreRouteTestState,
  seedTour,
  startTestServer,
  stopServer,
  testState,
} from "./support/route-test-harness";

describe("server booking routes integration", () => {
  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
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
      expect(bookingPayload.additionalInfo.date).toBe("2026-09-01");
      expect(bookingPayload.additionalInfo.time).toBe("09:30");
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

  it("hydrates admin booking requests with the requested slot from availability when older records lack it", async () => {
    const tour = await seedTour();
    const availability = await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-11-15",
      time: "14:00",
      maxSpots: 10,
      spotsLeft: 7,
    });
    await testState.currentStorage.createBooking({
      tourId: tour.id,
      availabilityId: availability.id,
      customerFirstName: "Marta",
      customerLastName: "Sousa",
      customerEmail: "marta@example.com",
      customerPhone: "+351123456700",
      numberOfParticipants: 3,
      totalAmount: 45000,
      paymentStatus: "requested",
      additionalInfo: null,
    } as any);

    const { server, baseUrl } = await startTestServer();
    try {
      const response = await fetch(`${baseUrl}/api/admin/requests`, {
        headers: {
          "x-test-admin": "1",
        },
      });

      expect(response.status).toBe(200);
      const payload = await json<any[]>(response);

      expect(payload).toHaveLength(1);
      expect(payload[0].additionalInfo.date).toBe("2026-11-15");
      expect(payload[0].additionalInfo.time).toBe("14:00");
    } finally {
      await stopServer(server);
    }
  });

  it("sanitizes booking reference lookups for review pages", async () => {
    const tour = await seedTour();
    const availability = await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-10-01",
      time: "10:30",
      maxSpots: 4,
      spotsLeft: 4,
    });
    const booking = await testState.currentStorage.createBooking({
      tourId: tour.id,
      availabilityId: availability.id,
      customerFirstName: "Ana",
      customerLastName: "Silva",
      customerEmail: "ana@example.com",
      customerPhone: "+351123456788",
      numberOfParticipants: 1,
      totalAmount: 15000,
      paymentStatus: "requested",
    } as any);

    const { server, baseUrl } = await startTestServer();
    try {
      const response = await fetch(`${baseUrl}/api/bookings/reference/${booking.bookingReference}`);

      expect(response.status).toBe(200);
      const payload = await json<any>(response);
      expect(payload).toEqual({
        id: booking.id,
        tourId: booking.tourId,
        bookingReference: booking.bookingReference,
      });
      expect(payload.customerEmail).toBeUndefined();
    } finally {
      await stopServer(server);
    }
  });
});
