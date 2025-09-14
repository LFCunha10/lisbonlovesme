import { storage } from "./storage";
import { broadcastNotification } from "./websocket";
import type { InsertNotification } from "@shared/schema";

// Optional Firebase Admin (FCM) support
let firebaseInited: boolean | undefined = undefined;
let firebaseAdmin: any | undefined = undefined;

async function initFirebaseOnce() {
  if (firebaseInited !== undefined) return firebaseAdmin;
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Allow escaped newlines
    if (privateKey && privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    const usingADC = process.env.GOOGLE_APPLICATION_CREDENTIALS && !projectId;

    if (usingADC || (projectId && clientEmail && privateKey)) {
      // Dynamic import to avoid bundling if unused
      const admin = await import("firebase-admin");
      if (admin?.apps?.length) {
        firebaseAdmin = admin; // already initialized
      } else {
        const opts: any = usingADC
          ? { credential: (admin as any).credential.applicationDefault() }
          : { credential: (admin as any).credential.cert({ projectId, clientEmail, privateKey }) };
        (admin as any).initializeApp(opts);
        firebaseAdmin = admin;
      }
    } else {
      firebaseAdmin = null;
    }
  } catch (e) {
    console.error("FCM init failed:", e);
    firebaseAdmin = null;
  } finally {
    firebaseInited = true;
  }
  return firebaseAdmin;
}

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
  const record = await storage.createNotification(input);
  try {
    broadcastNotification(record as any);
  } catch (e) {
    // Do not fail if WS broadcast errors
    console.error("WS broadcast failed:", e);
  }

  // Gather device tokens
  let devices: Array<{ platform: string; token: string }> = [];
  try {
    devices = await storage.getDevices();
  } catch (e) {
    console.error("Failed to load devices:", e);
  }

  // Try FCM if configured (platform 'ios-fcm')
  try {
    const admin = await initFirebaseOnce();
    if (admin) {
      const fcmTokens = devices.filter(d => (d.platform || '').toLowerCase().includes('fcm')).map(d => d.token);
      if (fcmTokens.length) {
        const payloadData: Record<string, string> = {};
        if (input.payload) payloadData["payload"] = JSON.stringify(input.payload);
        await (admin as any).messaging().sendEachForMulticast({
          tokens: fcmTokens,
          notification: { title: input.title, body: input.body },
          data: payloadData,
          apns: { payload: { aps: { sound: "default" } } }
        });
      }
    }
  } catch (e) {
    console.error("FCM push failed:", e);
  }

  // Try APNs if configured (platform 'ios')
  try {
    const provider = await initApnOnce();
    if (!provider) return;
    const apnsTokens = devices.filter(d => (d.platform || '').toLowerCase() === 'ios' || (d.platform || '').toLowerCase().includes('apns')).map(d => d.token);
    if (apnsTokens.length === 0) return;

    const apn = await import("apn");
    const note = new (apn as any).Notification();
    note.alert = { title: input.title, body: input.body } as any;
    note.payload = input.payload || {};
    note.sound = "default";
    note.topic = (provider as any)._bundleId;

    await provider.send(note, apnsTokens);
  } catch (e) {
    console.error("APNs push failed:", e);
  }
}

// Exported utility for CI to verify Firebase configuration
export async function verifyFcmConfig(): Promise<boolean> {
  const admin = await initFirebaseOnce();
  return !!admin;
}
