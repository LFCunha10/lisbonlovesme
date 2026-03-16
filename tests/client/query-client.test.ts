// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

async function loadQueryClientModule() {
  vi.resetModules();
  return import("../../client/src/lib/queryClient");
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  document.cookie = "csrfToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
});

describe("client/queryClient CSRF helpers", () => {
  it("bypasses the csrf cookie and requests a fresh token with no-store when forced", async () => {
    document.cookie = "csrfToken=stale-token; path=/";

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ csrfToken: "fresh-token" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { getCsrfToken } = await loadQueryClientModule();
    const token = await getCsrfToken(true);

    expect(token).toBe("fresh-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/csrf-token",
      expect.objectContaining({
        credentials: "include",
        cache: "no-store",
      }),
    );
  });

  it("reuses the csrf cookie without fetching when a refresh is not forced", async () => {
    document.cookie = "csrfToken=cookie-token; path=/";

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { getCsrfToken } = await loadQueryClientModule();
    const token = await getCsrfToken();

    expect(token).toBe("cookie-token");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
