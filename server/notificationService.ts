import { storage } from "./storage";
import type { InsertNotification } from "@shared/schema";

let apnProvider: any | undefined = undefined;

async function initApnOnce() {
  if (apnProvider !== undefined) return apnProvider;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  const key = process.env.APNS_KEY_PATH || process.env.APNS_KEY_BASE64;
  const isSandbox = process.env.APNS_SANDBOX === "true";
  if (keyId && teamId && bundleId && key) {
    try {
      // Dynamically import to avoid bundling if unused (ESM)
      const apn = await import("apn");
      const options: any = key.startsWith("-----BEGIN PRIVATE KEY-----") || key.includes("\n")
        ? { token: { key: key, keyId, teamId }, production: !isSandbox }
        : { token: { key: key, keyId, teamId }, production: !isSandbox };

      apnProvider = new (apn as any).Provider(options);
      (apnProvider as any)._bundleId = bundleId;
      return apnProvider;
    } catch (e) {
      console.error("APNs init failed:", e);
      apnProvider = null;
    }
  } else {
    apnProvider = null;
  }
  return apnProvider;
}

export async function createNotificationAndPush(input: InsertNotification): Promise<void> {
  // Always persist notification for in-app list
  await storage.createNotification(input);

  // Try APNs if configured
  try {
    const provider = await initApnOnce();
    if (!provider) return;
    const tokens = await storage.getDevices();
    if (tokens.length === 0) return;

    const apn = await import("apn");
    const note = new (apn as any).Notification();
    note.alert = { title: input.title, body: input.body } as any;
    note.payload = input.payload || {};
    note.sound = "default";
    note.topic = (provider as any)._bundleId;

    const deviceTokens = tokens.map((d) => d.token);
    await provider.send(note, deviceTokens);
  } catch (e) {
    console.error("APNs push failed:", e);
  }
}
