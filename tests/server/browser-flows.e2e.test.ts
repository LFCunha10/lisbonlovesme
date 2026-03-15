import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import puppeteer, { type Browser } from "puppeteer";
import bcrypt from "bcryptjs";
import {
  resetRouteTestState,
  restoreRouteTestState,
  seedTour,
  startTestServer,
  stopServer,
  testState,
} from "./support/route-test-harness";

describe("server browser e2e flows", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }, 30_000);

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
  });

  it("enforces CSRF for admin session login, mutation, and logout flows", async () => {
    await testState.currentStorage.createUser({
      username: "admin",
      password: await bcrypt.hash("adminpassword", 10),
      isAdmin: true,
    });

    const { server, baseUrl } = await startTestServer();
    const page = await browser.newPage();

    try {
      await page.goto(`${baseUrl}/__test__/browser`, { waitUntil: "networkidle0" });

      const flow = await page.evaluate(async () => {
        const badLogin = await fetch("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "adminpassword" }),
        });

        const csrfResponse = await fetch("/api/csrf-token", {
          credentials: "include",
        });
        const csrfPayload = await csrfResponse.json();
        const cookieAfterCsrf = document.cookie;

        const loginResponse = await fetch("/api/admin/login", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrfPayload.csrfToken,
          },
          body: JSON.stringify({ username: "admin", password: "adminpassword" }),
        });
        const loginPayload = await loginResponse.json();

        const meAfterLogin = await fetch("/api/admin/me", {
          credentials: "include",
        });

        const createUserWithoutCsrf = await fetch("/api/admin/create-user", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "secondary-admin", password: "supersecurepassword" }),
        });

        const createUserWithCsrf = await fetch("/api/admin/create-user", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": loginPayload.csrfToken,
          },
          body: JSON.stringify({ username: "secondary-admin", password: "supersecurepassword" }),
        });

        const logoutWithoutCsrf = await fetch("/api/admin/logout", {
          method: "POST",
          credentials: "include",
        });

        const logoutWithCsrf = await fetch("/api/admin/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            "x-csrf-token": loginPayload.csrfToken,
          },
        });

        const meAfterLogout = await fetch("/api/admin/me", {
          credentials: "include",
        });

        return {
          badLoginStatus: badLogin.status,
          csrfStatus: csrfResponse.status,
          cookieAfterCsrf,
          loginStatus: loginResponse.status,
          loginPayload,
          meAfterLoginStatus: meAfterLogin.status,
          createUserWithoutCsrfStatus: createUserWithoutCsrf.status,
          createUserWithCsrfStatus: createUserWithCsrf.status,
          logoutWithoutCsrfStatus: logoutWithoutCsrf.status,
          logoutWithCsrfStatus: logoutWithCsrf.status,
          meAfterLogoutStatus: meAfterLogout.status,
        };
      });

      expect(flow.badLoginStatus).toBe(403);
      expect(flow.csrfStatus).toBe(200);
      expect(flow.cookieAfterCsrf).toContain("csrfToken=");
      expect(flow.loginStatus).toBe(200);
      expect(flow.loginPayload.user.username).toBe("admin");
      expect(flow.meAfterLoginStatus).toBe(200);
      expect(flow.createUserWithoutCsrfStatus).toBe(403);
      expect(flow.createUserWithCsrfStatus).toBe(201);
      expect(flow.logoutWithoutCsrfStatus).toBe(403);
      expect(flow.logoutWithCsrfStatus).toBe(200);
      expect(flow.meAfterLogoutStatus).toBe(401);
    } finally {
      await page.close();
      await stopServer(server);
    }
  }, 30_000);

  it("prevents concurrent overbooking when two browser requests race for one remaining spot", async () => {
    const tour = await seedTour({ price: 9000 });
    const availability = await testState.currentStorage.createAvailability({
      tourId: tour.id,
      date: "2026-11-01",
      time: "09:00",
      maxSpots: 1,
      spotsLeft: 1,
    });

    const { server, baseUrl } = await startTestServer();
    const page = await browser.newPage();

    try {
      await page.goto(`${baseUrl}/__test__/browser`, { waitUntil: "networkidle0" });

      const responses = await page.evaluate(
        async ({ tourId, availabilityId }) => {
          const payload = {
            tourId,
            availabilityId,
            customerFirstName: "Maria",
            customerLastName: "Silva",
            customerEmail: "maria@example.com",
            customerPhone: "+351123456700",
            numberOfParticipants: 1,
            language: "en",
          };

          const createBooking = () =>
            fetch("/api/bookings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            }).then(async (response) => ({
              status: response.status,
              body: await response.json(),
            }));

          return Promise.all([createBooking(), createBooking()]);
        },
        { tourId: tour.id, availabilityId: availability.id },
      );

      const statuses = responses.map((entry) => entry.status).sort((left, right) => left - right);
      const bookings = await testState.currentStorage.getBookings();
      const updatedAvailability = await testState.currentStorage.getAvailability(availability.id);

      expect(statuses).toEqual([201, 409]);
      expect(bookings).toHaveLength(1);
      expect(updatedAvailability?.spotsLeft).toBe(0);
      expect(testState.sendRequestConfirmationEmail).toHaveBeenCalledTimes(1);
      expect(testState.sendBookingRequestNotification).toHaveBeenCalledTimes(1);
    } finally {
      await page.close();
      await stopServer(server);
    }
  }, 30_000);
});
