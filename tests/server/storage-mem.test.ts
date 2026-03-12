import { describe, it, expect, beforeEach, vi } from "vitest";
import { MemStorage } from "../../server/storage";

vi.mock("../../server/database-storage", () => ({
  DatabaseStorage: class {},
}));

describe("server/storage MemStorage", () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  it("creates and manages tours with defaults and active filtering", async () => {
    const activeTour = await storage.createTour({
      name: { en: "Lisbon Walk", pt: "Caminhada Lisboa", ru: "Прогулка" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour.jpg",
      duration: 3,
      maxGroupSize: 10,
      difficulty: { en: "Easy", pt: "Fácil", ru: "Легкий" },
      price: 5000,
      isActive: true,
    } as any);

    const inactiveTour = await storage.createTour({
      name: { en: "Private Tour", pt: "Privado", ru: "Частный" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour2.jpg",
      duration: 2,
      maxGroupSize: 4,
      difficulty: { en: "Medium", pt: "Médio", ru: "Средний" },
      price: 9000,
      isActive: false,
    } as any);

    expect(activeTour.displayDurationInCard).toBe(true);
    expect(activeTour.displayGroupSizeInCard).toBe(true);
    expect(activeTour.displayChildrenInCard).toBe(true);
    expect(activeTour.displayConductedByInCard).toBe(true);
    expect(activeTour.displayDifficultyInCard).toBe(true);
    expect(activeTour.childrenPolicy).toBe("allowed");
    expect(activeTour.conductedBy).toBe("walking");

    const publicTours = await storage.getTours();
    const allTours = await storage.getAllTours();
    expect(publicTours.map((t) => t.id)).toEqual([activeTour.id]);
    expect(allTours.map((t) => t.id).sort((a, b) => a - b)).toEqual(
      [activeTour.id, inactiveTour.id].sort((a, b) => a - b),
    );
  });

  it("updates and deletes tours", async () => {
    const tour = await storage.createTour({
      name: { en: "Old Name", pt: "Velho", ru: "Старый" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour.jpg",
      duration: 2,
      maxGroupSize: 8,
      difficulty: { en: "Easy", pt: "Fácil", ru: "Легкий" },
      price: 3000,
      isActive: true,
    } as any);

    const updated = await storage.updateTour(tour.id, {
      duration: 5,
      displayDurationInCard: false,
      childrenPolicy: "allowed_above_12",
      conductedBy: "electric_mercedes_benz_car",
    } as any);

    expect(updated?.duration).toBe(5);
    expect(updated?.displayDurationInCard).toBe(false);
    expect(updated?.childrenPolicy).toBe("allowed_above_12");
    expect(updated?.conductedBy).toBe("electric_mercedes_benz_car");

    expect(await storage.deleteTour(tour.id)).toBe(true);
    expect(await storage.getTour(tour.id)).toBeUndefined();
  });

  it("creates and manages availabilities including bulk delete", async () => {
    const tour = await storage.createTour({
      name: { en: "Tour", pt: "Tour", ru: "Тур" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour.jpg",
      duration: 2,
      maxGroupSize: 10,
      difficulty: { en: "Easy", pt: "Fácil", ru: "Легкий" },
      price: 3000,
      isActive: true,
    } as any);

    const a1 = await storage.createAvailability({
      tourId: tour.id,
      date: "2026-04-01",
      time: "10:00",
      maxSpots: 10,
      spotsLeft: 10,
    });
    const a2 = await storage.createAvailability({
      tourId: tour.id,
      date: "2026-04-02",
      time: "10:00",
      maxSpots: 8,
      spotsLeft: 8,
    });

    expect(await storage.getAvailabilityByTourAndDateTime(tour.id, "2026-04-01", "10:00")).toMatchObject({
      id: a1.id,
    });

    const updated = await storage.updateAvailability(a1.id, { spotsLeft: 6 });
    expect(updated?.spotsLeft).toBe(6);

    const deletedCount = await storage.deleteAvailabilities([a1.id, a2.id, 99999]);
    expect(deletedCount).toBe(2);
    expect(await storage.getAvailabilities(tour.id)).toEqual([]);
  });

  it("creates bookings, generates references, and decrements availability safely", async () => {
    const tour = await storage.createTour({
      name: { en: "Tour", pt: "Tour", ru: "Тур" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour.jpg",
      duration: 2,
      maxGroupSize: 10,
      difficulty: { en: "Easy", pt: "Fácil", ru: "Легкий" },
      price: 3000,
      isActive: true,
    } as any);

    const availability = await storage.createAvailability({
      tourId: tour.id,
      date: "2026-05-10",
      time: "09:00",
      maxSpots: 5,
      spotsLeft: 5,
    });

    const booking = await storage.createBooking({
      tourId: tour.id,
      availabilityId: availability.id,
      customerFirstName: "Ana",
      customerLastName: "Silva",
      customerEmail: "ana@example.com",
      customerPhone: "+351900000000",
      numberOfParticipants: 3,
      totalAmount: 9000,
    } as any);

    expect(booking.bookingReference).toMatch(/^LT-[A-Z0-9]{8}$/);
    const afterFirstBooking = await storage.getAvailability(availability.id);
    expect(afterFirstBooking?.spotsLeft).toBe(2);

    await storage.createBooking({
      tourId: tour.id,
      availabilityId: availability.id,
      customerFirstName: "Bob",
      customerLastName: "Jones",
      customerEmail: "bob@example.com",
      customerPhone: "+351911111111",
      numberOfParticipants: 10,
      totalAmount: 20000,
    } as any);

    const afterSecondBooking = await storage.getAvailability(availability.id);
    expect(afterSecondBooking?.spotsLeft).toBe(0);

    const found = await storage.getBookingByReference(booking.bookingReference);
    expect(found?.id).toBe(booking.id);
  });

  it("updates booking payment status and tracks discount usage", async () => {
    const tour = await storage.createTour({
      name: { en: "Tour", pt: "Tour", ru: "Тур" },
      shortDescription: { en: "", pt: "", ru: "" },
      description: { en: "Desc", pt: "Desc", ru: "Desc" },
      imageUrl: "https://example.com/tour.jpg",
      duration: 2,
      maxGroupSize: 10,
      difficulty: { en: "Easy", pt: "Fácil", ru: "Легкий" },
      price: 3000,
      isActive: true,
    } as any);
    const availability = await storage.createAvailability({
      tourId: tour.id,
      date: "2026-06-01",
      time: "12:00",
      maxSpots: 10,
      spotsLeft: 10,
    });
    const booking = await storage.createBooking({
      tourId: tour.id,
      availabilityId: availability.id,
      customerFirstName: "Ana",
      customerLastName: "Silva",
      customerEmail: "ana@example.com",
      customerPhone: "+351900000000",
      numberOfParticipants: 1,
      totalAmount: 3000,
      paymentStatus: "requested",
    } as any);

    const paid = await storage.updatePaymentStatus(booking.id, "paid", "pi_123");
    expect(paid?.paymentStatus).toBe("paid");
    expect(paid?.stripePaymentIntentId).toBe("pi_123");

    const dc = await storage.createDiscountCode({
      code: "HELLO10",
      name: "Hello",
      category: "percentage",
      value: 10,
      isActive: true,
    } as any);
    await storage.incrementDiscountUsage(dc.id);
    const loaded = await storage.getDiscountCodeByCode("HELLO10");
    expect(loaded?.usedCount).toBe(1);
  });
});
