import Foundation

enum AppConfig {
    // Set this to your backend origin, e.g. "https://your-domain.com"
    static let baseURL = URL(string: "https://lisbonlovesme.onrender.com")!

    // Optional key scoped to `push:register` on the backend.
    static let pushRegistrationAPIKey: String? = nil
}
