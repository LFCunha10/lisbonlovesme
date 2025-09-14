import type { Request } from "express";
import UAParser from "ua-parser-js";

export type DeviceInfo = {
  browser?: string;
  os?: string;
  deviceType?: string;
};

export type GeoInfo = {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string; // lat,long
};

export function getClientIp(req: Request): string {
  // Prefer well-known proxy headers if present
  const cf = (req.headers["cf-connecting-ip"] || "") as string; // Cloudflare
  const tc = (req.headers["true-client-ip"] || "") as string; // Akamai/F5
  const xri = (req.headers["x-real-ip"] || "") as string; // Nginx/Ingress
  const xf = (req.headers["x-forwarded-for"] || "") as string; // Standard chain
  const xfFirst = xf?.split(",")[0]?.trim();
  const remote = req.socket?.remoteAddress || "";

  const raw = [cf, tc, xri, xfFirst, remote].find(Boolean) || "";
  // Strip IPv6 prefix if any
  return raw.startsWith("::ffff:") ? raw.substring(7) : raw;
}

export function parseUserAgent(uaString?: string): DeviceInfo {
  const parser = new UAParser(uaString);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();
  const deviceType = device.type || (uaString?.toLowerCase().includes("mobile") ? "mobile" : "desktop");
  return {
    browser: [browser.name, browser.version].filter(Boolean).join(" ").trim(),
    os: [os.name, os.version].filter(Boolean).join(" ").trim(),
    deviceType,
  };
}

export async function geolocateIp(ip: string): Promise<GeoInfo> {
  const info: GeoInfo = { ip };
  try {
    if (process.env.IPINFO_TOKEN) {
      const resp = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
      if (resp.ok) {
        const data = await resp.json();
        info.city = data.city;
        info.region = data.region;
        info.country = data.country;
        info.loc = data.loc;
        return info;
      }
    }
  } catch (e) {
    // ignore and fallback
  }
  try {
    const resp = await fetch(`https://ipapi.co/${ip}/json/`);
    if (resp.ok) {
      const data = await resp.json();
      info.city = data.city;
      info.region = data.region;
      info.country = data.country;
      info.loc = data.latitude && data.longitude ? `${data.latitude},${data.longitude}` : undefined;
      return info;
    }
  } catch (e) {
    // ignore
  }
  return info;
}

// Attempt to reverse geocode latitude/longitude into a human-readable location
export async function reverseGeocode(lat: number, lon: number): Promise<{ location?: string }> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
    url.searchParams.set('zoom', '10');
    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'LisbonLovesMe/1.0 (+https://lisbonlovesme.onrender.com)' }
    });
    if (!resp.ok) return {};
    const data = await resp.json();
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality;
    const region = address.state || address.region || address.county;
    const country = address.country;
    const parts = [city, region, country].filter(Boolean);
    const location = parts.join(', ');
    return location ? { location } : {};
  } catch {
    return {};
  }
}
