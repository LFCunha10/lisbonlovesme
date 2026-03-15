import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  json,
  resetRouteTestState,
  restoreRouteTestState,
  startTestServer,
  stopServer,
  testState,
} from "./support/route-test-harness";

describe("server communications routes integration", () => {
  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
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
      const apiKeyMessagesResponse = await fetch(`${baseUrl}/api/admin/messages`, {
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });
      const apiKeyMarkReadResponse = await fetch(`${baseUrl}/api/admin/messages/1/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "ops-key-for-tests-1234567890",
        },
        body: JSON.stringify({ read: true }),
      });

      expect(invalidResponse.status).toBe(400);
      expect(validResponse.status).toBe(200);
      expect(unauthenticatedMessagesResponse.status).toBe(401);
      expect(authenticatedMessagesResponse.status).toBe(200);
      expect(apiKeyMessagesResponse.status).toBe(200);
      expect(apiKeyMarkReadResponse.status).toBe(200);

      const messages = await json<any[]>(authenticatedMessagesResponse);
      const apiKeyMessages = await json<any[]>(apiKeyMessagesResponse);
      const apiKeyMarkReadPayload = await json<any>(apiKeyMarkReadResponse);
      expect(messages).toHaveLength(1);
      expect(messages[0].email).toBe("luiz@example.com");
      expect(apiKeyMessages).toHaveLength(1);
      expect(apiKeyMessages[0].email).toBe("luiz@example.com");
      expect(apiKeyMarkReadPayload.ok).toBe(true);
      expect(testState.sendContactFormNotification).toHaveBeenCalledTimes(1);
      expect(testState.createNotificationAndPush).toHaveBeenCalledTimes(1);
    } finally {
      await stopServer(server);
    }
  });

  it("protects notification endpoints, returns structured notifications, and requires a scoped key for device registration", async () => {
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
      const missingKeyResponse = await fetch(`${baseUrl}/api/notifications/device`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "ios-apns", token: "a".repeat(64) }),
      });
      const invalidScopeResponse = await fetch(`${baseUrl}/api/notifications/device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "ops-key-for-tests-1234567890",
        },
        body: JSON.stringify({ platform: "ios-apns", token: "b".repeat(64) }),
      });
      const validResponse = await fetch(`${baseUrl}/api/notifications/device`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "push-key-for-tests-1234567890",
        },
        body: JSON.stringify({ platform: "ios-apns", token: "c".repeat(64) }),
      });

      expect(unauthenticatedResponse.status).toBe(401);
      expect(authenticatedResponse.status).toBe(200);
      expect(missingKeyResponse.status).toBe(401);
      expect(invalidScopeResponse.status).toBe(403);
      expect(validResponse.status).toBe(200);

      const notifications = await json<any[]>(authenticatedResponse);
      const devicePayload = await json<any>(validResponse);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].body.ok).toBe(true);
      expect(notifications[0].body.location).toBe("Lisbon");
      expect(notifications[0].body.device.browser).toBe("Safari");
      expect(devicePayload.ok).toBe(true);
      expect(devicePayload.device.platform).toBe("ios-apns");
    } finally {
      await stopServer(server);
    }
  });
});
