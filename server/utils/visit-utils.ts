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
  const xf = (req.headers["x-forwarded-for"] || "") as string;
  const ipFromXf = xf?.split(",")[0]?.trim();
  const ip = ipFromXf || (req.socket?.remoteAddress || "");
  // Strip IPv6 prefix if any
  return ip.startsWith("::ffff:") ? ip.substring(7) : ip;
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

