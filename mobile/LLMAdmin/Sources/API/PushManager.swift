import Foundation
import UIKit
import UserNotifications

final class PushManager: NSObject, UNUserNotificationCenterDelegate, UIApplicationDelegate {
    static let shared = PushManager()
    private override init() {}

    func registerForPushNotifications() async {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            guard granted else { return }
            await MainActor.run {
                UIApplication.shared.registerForRemoteNotifications()
            }
        } catch {
            print("Push permission error: \(error)")
        }
    }

    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        Task {
            await registerDeviceToken(token)
        }
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("APNs register failed: \(error)")
    }

    private func registerDeviceToken(_ token: String) async {
        guard let url = URL(string: "https://localhost:5001/api/notifications/device") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["platform": "ios", "token": token]
        req.httpBody = try? JSONSerialization.data(withJSONObject: body)
        do {
            _ = try await URLSession.shared.data(for: req)
        } catch {
            print("Device register error: \(error)")
        }
    }
}

