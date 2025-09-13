import Foundation

struct APIError: Error, Decodable { let message: String? }

final class APIClient {
    static let shared = APIClient()
    private init() {}

    // Update to your server URL
    private let BASE_URL = URL(string: "https://localhost:5001")!

    private var session: URLSession = {
        let cfg = URLSessionConfiguration.default
        cfg.httpCookieAcceptPolicy = .always
        cfg.httpCookieStorage = .shared
        return URLSession(configuration: cfg)
    }()

    // MARK: CSRF + Auth
    func getCSRFToken() async throws -> String {
        let url = BASE_URL.appendingPathComponent("api/csrf-token")
        let (data, _) = try await session.data(from: url)
        let obj = try JSONDecoder().decode([String:String].self, from: data)
        return obj["csrfToken"] ?? ""
    }

    func login(username: String, password: String) async throws {
        let token = try await getCSRFToken()
        let url = BASE_URL.appendingPathComponent("api/admin/login")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.addValue(token, forHTTPHeaderField: "X-CSRF-Token")
        let body = ["username": username, "password": password]
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await session.data(for: req)
        if let http = resp as? HTTPURLResponse, http.statusCode >= 400 {
            let e = try? JSONDecoder().decode(APIError.self, from: data)
            throw APIError(message: e?.message ?? "Login failed")
        }
    }

    func getAdminMe() async throws -> AdminMe? {
        let url = BASE_URL.appendingPathComponent("api/admin/me")
        let (data, resp) = try await session.data(from: url)
        if let http = resp as? HTTPURLResponse, http.statusCode == 401 {
            return nil
        }
        return try JSONDecoder().decode(AdminMe.self, from: data)
    }

    // MARK: Requests
    func listBookingRequests() async throws -> [BookingRequest] {
        let url = BASE_URL.appendingPathComponent("api/admin/requests")
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([BookingRequest].self, from: data)
    }

    func updateRequest(id: Int, updates: [String: Any]) async throws {
        let url = BASE_URL.appendingPathComponent("api/admin/requests/\(id)")
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        req.addValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: updates)
        _ = try await session.data(for: req)
    }

    func sendConfirmation(id: Int) async throws {
        let url = BASE_URL.appendingPathComponent("api/admin/requests/\(id)/confirm")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        _ = try await session.data(for: req)
    }

    // MARK: Reviews
    func listAllTestimonials() async throws -> [Review] {
        var comp = URLComponents(url: BASE_URL.appendingPathComponent("api/testimonials"), resolvingAgainstBaseURL: false)!
        comp.queryItems = [URLQueryItem(name: "approvedOnly", value: "false")]
        let (data, _) = try await session.data(from: comp.url!)
        return try JSONDecoder().decode([Review].self, from: data)
    }

    func approveReview(id: Int) async throws {
        let url = BASE_URL.appendingPathComponent("api/testimonials/\(id)/approve")
        var req = URLRequest(url: url)
        req.httpMethod = "PUT"
        _ = try await session.data(for: req)
    }

    // MARK: Messages
    func listMessages() async throws -> [ContactMessageModel] {
        let url = BASE_URL.appendingPathComponent("api/admin/messages")
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([ContactMessageModel].self, from: data)
    }

    // MARK: Notifications
    func listNotifications() async throws -> [NotificationItem] {
        let url = BASE_URL.appendingPathComponent("api/notifications")
        let (data, _) = try await session.data(from: url)
        return try JSONDecoder().decode([NotificationItem].self, from: data)
    }
}

struct AdminMe: Codable { let username: String; let isAdmin: Bool }

