import Foundation
import LocalAuthentication

@MainActor
final class AuthViewModel: ObservableObject {
    @Published var username: String = ""
    @Published var password: String = ""
    @Published var isLoading: Bool = false
    @Published var error: String?
    @Published var biometricsAvailable: Bool = false
    @Published var biometricsEnabled: Bool = false

    init() {
        // Face ID availability
        let ctx = LAContext()
        var err: NSError?
        biometricsAvailable = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &err)
        biometricsEnabled = KeychainService.exists()
    }

    func login(session: SessionModel) async {
        error = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await APIClient.shared.login(username: username, password: password)
            session.isAuthenticated = true
            session.username = username
        } catch {
            self.error = (error as NSError).localizedDescription
        }
    }

    func tryFaceIDLogin(session: SessionModel) async {
        guard biometricsAvailable else { return }
        do {
            let creds = try KeychainService.loadWithBiometrics(reason: "Log in with Face ID")
            username = creds.username
            password = creds.password
            await login(session: session)
        } catch {
            self.error = (error as NSError).localizedDescription
        }
    }

    func enableBiometricsIfAllowed() {
        guard biometricsAvailable else { return }
        do {
            let creds = KeychainService.Credentials(username: username, password: password)
            try KeychainService.save(creds)
            biometricsEnabled = true
        } catch {
            self.error = (error as NSError).localizedDescription
        }
    }

    func logout(session: SessionModel) async {
        await APIClient.shared.logout()
        session.isAuthenticated = false
        session.username = ""
    }
}

