import { afterEach, describe, expect, it, vi } from "vitest";
import {
  geolocateIp,
  getClientIp,
  parseUserAgent,
  reverseGeocode,
} from "../../server/utils/visit-utils";

describe("server/utils/visit-utils", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.IPINFO_TOKEN;
  });

  it("selects client ip with proper precedence and strips ipv6 prefix", () => {
    const req = {
      headers: {
        "x-forwarded-for": "1.2.3.4, 4.3.2.1",
      },
      socket: {
        remoteAddress: "::ffff:9.8.7.6",
      },
    };
    expect(getClientIp(req as never)).toBe("1.2.3.4");

    const reqWithCf = {
      headers: {
        "cf-connecting-ip": "::ffff:5.6.7.8",
        "x-forwarded-for": "1.2.3.4",
      },
      socket: { remoteAddress: "9.9.9.9" },
    };
    expect(getClientIp(reqWithCf as never)).toBe("5.6.7.8");
  });

  it("parses user agent details", () => {
    const desktopUa =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36";
    const parsed = parseUserAgent(desktopUa);
    expect(parsed.browser?.toLowerCase()).toContain("chrome");
    expect(parsed.os?.toLowerCase()).toContain("windows");
    expect(parsed.deviceType).toBe("desktop");
  });

  it("uses ipinfo when token is set and response is ok", async () => {
    process.env.IPINFO_TOKEN = "token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        city: "Lisbon",
        region: "Lisbon",
        country: "PT",
        loc: "38.72,-9.13",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await geolocateIp("1.1.1.1");
    expect(result).toEqual({
      ip: "1.1.1.1",
      city: "Lisbon",
      region: "Lisbon",
      country: "PT",
      loc: "38.72,-9.13",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to ipapi when ipinfo is unavailable", async () => {
    process.env.IPINFO_TOKEN = "token";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          city: "Porto",
          region: "Porto",
          country: "PT",
          latitude: 41.15,
          longitude: -8.61,
        }),
      });

    vi.stubGlobal("fetch", fetchMock);
    const result = await geolocateIp("8.8.8.8");
    expect(result).toEqual({
      ip: "8.8.8.8",
      city: "Porto",
      region: "Porto",
      country: "PT",
      loc: "41.15,-8.61",
    });
  });

  it("returns ip only when all lookups fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    const result = await geolocateIp("9.9.9.9");
    expect(result).toEqual({ ip: "9.9.9.9" });
  });

  it("reverse geocodes and builds location string", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Lisbon",
          state: "Lisbon District",
          country: "Portugal",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(reverseGeocode(38.7223, -9.1393)).resolves.toEqual({
      location: "Lisbon, Lisbon District, Portugal",
    });
  });

  it("returns empty object when reverse geocode request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    await expect(reverseGeocode(38.7223, -9.1393)).resolves.toEqual({});
  });
});
