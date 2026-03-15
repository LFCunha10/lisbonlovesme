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

describe("server tour routes integration", () => {
  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
  });

  it("serves public tours and restricts all-tour access to admins", async () => {
    const activeTour = await seedTour();
    await seedTour({
      name: { en: "Hidden Tour", pt: "Oculto", ru: "Скрытый" },
      isActive: false,
    });

    const { server, baseUrl } = await startTestServer();
    try {
      const toursResponse = await fetch(`${baseUrl}/api/tours`);
      const allToursResponse = await fetch(`${baseUrl}/api/tours?all=1`, {
        headers: { "x-test-admin": "1" },
      });

      expect(toursResponse.status).toBe(200);
      expect(allToursResponse.status).toBe(200);

      const tours = await json<any[]>(toursResponse);
      const allTours = await json<any[]>(allToursResponse);

      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe(activeTour.id);
      expect(allTours).toHaveLength(2);
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
      text: "Excellent review",
      tourId: tour.id,
    });
    await testState.currentStorage.createTestimonial({
      customerName: "Bob",
      customerCountry: "US",
      rating: 4,
      text: "Pending review",
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
});
