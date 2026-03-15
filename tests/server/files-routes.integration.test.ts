import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "fs";
import {
  json,
  resetRouteTestState,
  restoreRouteTestState,
  startTestServer,
  stopServer,
  testState,
  writeTempFile,
} from "./support/route-test-harness";

describe("server file routes integration", () => {
  beforeEach(async () => {
    await resetRouteTestState();
  });

  afterEach(() => {
    restoreRouteTestState();
  });

  it("handles image upload, database export, documents, and public document downloads", async () => {
    await writeTempFile("test-export.sql", "-- export");
    await writeTempFile("tour-guide.pdf", "pdf-content");

    const { server, baseUrl } = await startTestServer();
    try {
      const uploadImageResponse = await fetch(`${baseUrl}/api/upload-image`, {
        method: "POST",
        headers: {
          "x-api-key": "ops-key-for-tests-1234567890",
          "x-test-upload-filename": "hero.jpg",
          "x-test-upload-original-name": "hero.jpg",
          "x-test-upload-mimetype": "image/jpeg",
        },
      });
      const exportResponse = await fetch(`${baseUrl}/api/export-database`, {
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });
      const createDocumentResponse = await fetch(`${baseUrl}/api/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "ops-key-for-tests-1234567890",
          "x-test-upload-filename": "tour-guide.pdf",
          "x-test-upload-original-name": "tour-guide.pdf",
          "x-test-upload-mimetype": "application/pdf",
        },
        body: JSON.stringify({
          slug: "tour-guide",
          title: "Tour Guide",
        }),
      });

      expect(uploadImageResponse.status).toBe(200);
      expect(exportResponse.status).toBe(200);
      expect(createDocumentResponse.status).toBe(201);

      const uploadImagePayload = await json<any>(uploadImageResponse);
      const createDocumentPayload = await json<any>(createDocumentResponse);
      const listDocumentsResponse = await fetch(`${baseUrl}/api/documents`, {
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });
      const publicDocumentResponse = await fetch(`${baseUrl}/tour-guide`);
      const deleteDocumentResponse = await fetch(`${baseUrl}/api/documents/${createDocumentPayload.id}`, {
        method: "DELETE",
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });

      expect(uploadImagePayload.imageUrl).toBe("/uploads/hero.jpg");
      expect(createDocumentPayload.slug).toBe("tour-guide");
      expect(listDocumentsResponse.status).toBe(200);
      expect(publicDocumentResponse.status).toBe(200);
      expect(await publicDocumentResponse.text()).toBe("pdf-content");
      expect(deleteDocumentResponse.status).toBe(200);
      expect(fs.existsSync("/tmp/tour-guide.pdf")).toBe(false);
    } finally {
      await stopServer(server);
    }
  });

  it("returns storage diagnostics for admins", async () => {
    const { server, baseUrl } = await startTestServer();
    try {
      const response = await fetch(`${baseUrl}/api/admin/storage/diagnostics`, {
        headers: { "x-api-key": "ops-key-for-tests-1234567890" },
      });

      expect(response.status).toBe(200);
      const payload = await json<any>(response);
      expect(typeof payload.uploadDir).toBe("string");
      expect(typeof payload.exists).toBe("boolean");
    } finally {
      await stopServer(server);
    }
  });
});
