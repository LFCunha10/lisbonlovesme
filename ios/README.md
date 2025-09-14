LisbonLovesMe iOS App

This folder contains a native SwiftUI iOS app that connects to your existing backend and supports Firebase Cloud Messaging push notifications.

What’s included
- SwiftUI app with login (CSRF + session cookies), optional Face ID quick login, and a 5‑tab main UI: Requests, Reviews, Messages, Visits (Feed + Trends), and Personal.
- Visits feed shows device, time, and location; Trends uses Swift Charts.
- Push registration (FCM preferred; APNs fallback). The app posts its device token to `POST /api/notifications/device`.

Before you run
1) Backend base URL: Edit `ios/LisbonLovesMe/Sources/AppConfig.swift` and set `AppConfig.baseURL` to your server origin (e.g. `https://your-domain.com`).
2) Firebase: In Xcode, add Firebase via Swift Package Manager (recommended) or CocoaPods.
   - SPM: File > Add Packages… and add `https://github.com/firebase/firebase-ios-sdk`. Add at least `FirebaseCore`, `FirebaseMessaging`.
   - Place your `GoogleService-Info.plist` in `ios/LisbonLovesMe` and ensure the app target includes it.
3) Capabilities: In Xcode target Signing & Capabilities, add:
   - Push Notifications
   - Background Modes: Remote notifications
   - Keychain Sharing (optional; not required if using default Keychain access group)
4) Info.plist keys (already in the sample Info.plist):
   - NSFaceIDUsageDescription

Optional server setup for FCM (recommended)
- Add Firebase Admin SDK credentials to the server and set env vars. See `server/notificationService.ts` changes in this PR for FCM support. Add to your server environment:
  - FIREBASE_PROJECT_ID
  - FIREBASE_CLIENT_EMAIL
  - FIREBASE_PRIVATE_KEY (escape newlines as `\n`)

Open and run
1) Open `ios/LisbonLovesMe.xcodeproj` in Xcode.
2) Add Firebase packages and your `GoogleService-Info.plist`.
3) Select a signing team, run on a device, and accept notification permission.

Notes
- Login uses CSRF: the app calls `/api/csrf-token`, then `/api/admin/login`. Cookies are persisted via `URLSession`.
- Face ID: After a successful login, you’ll be prompted to enable Face ID. If accepted, credentials are stored in Keychain with biometric protection. Next launch, you can authenticate with Face ID.
- Requests, Reviews, Messages pull from:
  - Requests: `/api/admin/bookings` (filtered by `paymentStatus === 'requested'`)
  - Reviews: `/api/testimonials?approvedOnly=true`
  - Messages: `/api/admin/messages`
  - Visits: `/api/notifications` filtered by `type === 'visit'`

