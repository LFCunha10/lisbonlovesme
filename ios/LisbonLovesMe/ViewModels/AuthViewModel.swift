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
            
            // Persist credentials to Keychain only after a successful login
            if biometricsAvailable {
                do {
                    let creds = KeychainService.Credentials(username: username, password: password)
                    try KeychainService.save(creds)
                    biometricsEnabled = true
                } catch {
                    #if DEBUG
                    print("[AuthViewModel] Failed to save credentials after login: \(error.localizedDescription)")
                    #endif
                }
            }
        } catch {
            self.error = (error as NSError).localizedDescription
        }
    }

    func tryFaceIDLogin(session: SessionModel) async {
        guard biometricsAvailable else { return }
        do {
            let creds = try KeychainService.loadWithBiometrics(reason: "Log in with Face ID")
            // Only update fields if we successfully retrieved creds
            username = creds.username
            password = creds.password
            await login(session: session)
        } catch {
            self.error = (error as NSError).localizedDescription
        }
    }

    func enableBiometricsIfAllowed() {
        guard biometricsAvailable else { return }
        // Require non-empty credentials
        guard !username.isEmpty, !password.isEmpty else {
            self.error = "Please enter your username and password first."
            return
        }
        // Attempt a login; on success, `login(session:)` will save to Keychain
        // Note: We cannot call async from here without a session; consider exposing an async variant in the UI.
    }
    
    func enableBiometricsAfterSuccessfulLogin(session: SessionModel) async {
        guard biometricsAvailable else { return }
        // Require non-empty credentials
        guard !username.isEmpty, !password.isEmpty else {
            await MainActor.run { self.error = "Please enter your username and password first." }
            return
        }
        await login(session: session)
        // Saving now happens inside `login(session:)` on success.
    }

    func logout(session: SessionModel) async {
        await APIClient.shared.logout()
        session.isAuthenticated = false
        session.username = ""
    }
}
