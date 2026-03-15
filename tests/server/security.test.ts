import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";

const originalEnv = { ...process.env };

async function loadSecurityWithEnv(envOverrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    ...envOverrides,
  };
  return import("../../server/security");
}

function createRequestMock(options: {
  origin?: string;
  host?: string;
  forwardedHost?: string;
  forwardedProto?: string;
  protocol?: string;
}): Request {
  const headers = new Map<string, string>();

  if (options.origin) headers.set("origin", options.origin);
  if (options.host) headers.set("host", options.host);
  if (options.forwardedHost) headers.set("x-forwarded-host", options.forwardedHost);
  if (options.forwardedProto) headers.set("x-forwarded-proto", options.forwardedProto);

  return {
    protocol: options.protocol ?? "https",
    get(name: string) {
      return headers.get(name.toLowerCase());
    },
  } as Request;
}

function evaluateCorsOptionsDelegate(
  optionsDelegate: ReturnType<typeof import("../../server/security")["createCorsOptions"]>,
  req: Request,
): Promise<{ allowed: boolean; error: Error | null }> {
  return new Promise((resolve) => {
    optionsDelegate(req, (error, options) => {
      resolve({
        allowed: options?.origin === true,
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

    const result = await evaluateCorsOptionsDelegate(
      createCorsOptions(),
      createRequestMock({
        origin: "http://localhost:5173",
        host: "lisbonlovesme.onrender.com",
        forwardedProto: "https",
      }),
    );

    expect(result.allowed).toBe(true);
    expect(result.error).toBeNull();
  });

  it("allows the deployed same-origin host in production", async () => {
    const { createCorsOptions, isSameOriginRequest } = await loadSecurityWithEnv({
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "",
    });

    const req = createRequestMock({
      origin: "https://lisbonlovesme.onrender.com",
      host: "lisbonlovesme.onrender.com",
      forwardedHost: "lisbonlovesme.onrender.com",
      forwardedProto: "https",
      protocol: "https",
    });

    expect(isSameOriginRequest("https://lisbonlovesme.onrender.com", req)).toBe(true);

    const result = await evaluateCorsOptionsDelegate(createCorsOptions(), req);
    expect(result.allowed).toBe(true);
    expect(result.error).toBeNull();
  });

  it("still blocks unknown non-localhost origins in production", async () => {
    const { createCorsOptions } = await loadSecurityWithEnv({
      NODE_ENV: "production",
      ALLOWED_ORIGINS: "https://app.example.com",
    });

    const result = await evaluateCorsOptionsDelegate(
      createCorsOptions(),
      createRequestMock({
        origin: "https://evil.example.com",
        host: "lisbonlovesme.onrender.com",
        forwardedProto: "https",
      }),
    );

    expect(result.allowed).toBe(false);
    expect(result.error?.message).toBe("Origin is not allowed by CORS");
  });
});
