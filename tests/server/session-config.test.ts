import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnv = { ...process.env };

async function loadSessionConfigWithEnv(envOverrides: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    ...envOverrides,
  };
  return import("../../server/session-config");
}

afterEach(() => {
  process.env = { ...originalEnv };
  vi.resetModules();
});

describe("server/session-config", () => {
  it('uses secure "auto" cookies in production so localhost http still works', async () => {
    const { getSessionCookieOptions } = await loadSessionConfigWithEnv({
      NODE_ENV: "production",
    });

    expect(getSessionCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: "auto",
        sameSite: "lax",
      }),
    );
  });

  it("uses non-secure cookies in development", async () => {
    const { getSessionCookieOptions } = await loadSessionConfigWithEnv({
      NODE_ENV: "development",
    });

    expect(getSessionCookieOptions()).toEqual(
      expect.objectContaining({
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      }),
    );
  });
});
