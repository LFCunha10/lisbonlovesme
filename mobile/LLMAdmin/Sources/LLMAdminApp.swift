import SwiftUI
import UserNotifications

@main
struct LLMAdminApp: App {
    @StateObject private var session = SessionModel()

    var body: some Scene {
        WindowGroup {
            Group {
                if session.isAuthenticated {
                    MainTabView()
                        .environmentObject(session)
                } else {
                    LoginView()
                        .environmentObject(session)
                }
            }
            .task {
                await session.bootstrap()
            }
        }
    }
}

final class SessionModel: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var csrfToken: String?

    func bootstrap() async {
        // Check session
        do {
            if let _ = try await APIClient.shared.getAdminMe() {
                await MainActor.run { self.isAuthenticated = true }
            }
        } catch {
            await MainActor.run { self.isAuthenticated = false }
        }
        // Ask notification permission and register
        await PushManager.shared.registerForPushNotifications()
    }
}

