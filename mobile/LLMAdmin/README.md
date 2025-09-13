LisbonLovesMe Admin iOS App (SwiftUI)

Overview
- SwiftUI app to manage booking requests, reviews, messages, and notifications.
- Uses your existing backend endpoints (cookie session) with CSRF-protected login.
- Registers the device for push notifications via `/api/notifications/device`.

Prerequisites
- Xcode 15+
- iOS 16+ target
- Backend running and reachable (configure `BASE_URL`).
- For push (optional): set APNs keys on the server and iOS capabilities in your project.

Setup
1) In Xcode, create a new iOS App project named "LLMAdmin" (SwiftUI + Swift).
2) Add the files from `mobile/LLMAdmin/Sources/` into your project.
3) Update `BASE_URL` in `APIClient.swift` to point to your server.
4) Run on device/simulator. For push, test on a real device with APNs enabled.

Notes
- The backend uses session cookies. Login flow:
  a) GET `/api/csrf-token` to read `csrfToken`.
  b) POST `/api/admin/login` with body `{ username, password }` and header `X-CSRF-Token`.
- After login, cookies are stored by `URLSession` automatically.

