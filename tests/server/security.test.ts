import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadSecurityWithEnv(envOverrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    ...envOverrides,
  };
  return import("../../server/security");
}

function evaluateCorsOrigin(
  originHandler: NonNullable<ReturnType<typeof import("../../server/security")["createCorsOptions"]>["origin"]>,
  origin: string | undefined,
): Promise<{ allowed: boolean; error: Error | null }> {
  return new Promise((resolve) => {
    originHandler(origin, (error, allowed) => {
      resolve({
        allowed: Boolean(allowed),
        error: error instanceof Error ? error : null,
      });
    });
  });
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("server/security CORS handling", () => {
  it("recognizes localhost loopback origins", async () => {
    const { isLocalhostOrigin } = await loadSecurityWithEnv({ NODE_ENV: "production" });

    expect(isLocalhostOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalhostOrigin("http://127.0.0.1:5173")).toBe(true);
    expect(isLocalhostOrigin("http://[::1]:4173")).toBe(true);
    expect(isLocalhostOrigin("https://example.com")).toBe(false);
  });

  it("allows localhost origins even when running with production settings", async () => {
    const { createCorsOptions } = await loadSecurityWithEnv({
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://app.example.com",
    });

    const options = createCorsOptions();
    const result = await evaluateCorsOrigin(options.origin!, "http://localhost:5173");

    expect(result.allowed).toBe(true);
    expect(result.error).toBeNull();
  });

  it("still blocks unknown non-localhost origins in production", async () => {
    const { createCorsOptions } = await loadSecurityWithEnv({
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://app.example.com",
    });

    const options = createCorsOptions();
    const result = await evaluateCorsOrigin(options.origin!, "https://evil.example.com");

    expect(result.allowed).toBe(false);
    expect(result.error?.message).toBe("Origin is not allowed by CORS");
  });
});
