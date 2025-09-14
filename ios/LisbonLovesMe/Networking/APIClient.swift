import Foundation

actor APIClient {
    static let shared = APIClient()
    private let session: URLSession
    private var csrfToken: String?

    private init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpShouldSetCookies = true
        config.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        self.session = URLSession(configuration: config)
    }

    // MARK: - Helpers
    private func request(_ path: String, method: String = "GET", jsonBody: Encodable? = nil, headers: [String:String] = [:]) async throws -> (Data, HTTPURLResponse) {
        var url = AppConfig.baseURL
        url.append(path: path)

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let jsonBody {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(jsonBody))
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        for (k,v) in headers { req.setValue(v, forHTTPHeaderField: k) }

        let (data, resp) = try await session.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw URLError(.badServerResponse) }
        return (data, http)
    }

    // MARK: - CSRF + Auth
    func fetchCSRFToken() async throws -> String {
        let (data, _) = try await request("/api/csrf-token")
        struct TokenResp: Decodable { let csrfToken: String }
        let token = try JSONDecoder().decode(TokenResp.self, from: data).csrfToken
        csrfToken = token
        return token
    }

    func login(username: String, password: String) async throws {
        let token = try await fetchCSRFToken()
        struct Body: Encodable { let username: String; let password: String }
        let (data, resp) = try await request("/api/admin/login", method: "POST", jsonBody: Body(username: username, password: password), headers: ["x-csrf-token": token])
        guard (200..<300).contains(resp.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Login failed"
            throw NSError(domain: "api", code: resp.statusCode, userInfo: [NSLocalizedDescriptionKey: msg])
        }
    }

    func logout() async {
        _ = try? await request("/api/admin/logout", method: "POST")
    }

    // MARK: - Data endpoints
    func fetchBookings() async throws -> [Booking] {
        let (data, _) = try await request("/api/admin/bookings")
        return try JSONDecoder.api.decode([Booking].self, from: data)
    }

    func fetchTestimonials(approvedOnly: Bool = true) async throws -> [Testimonial] {
        let qs = approvedOnly ? "?approvedOnly=true" : ""
        let (data, _) = try await request("/api/testimonials\(qs)")
        return try JSONDecoder.api.decode([Testimonial].self, from: data)
    }

    func fetchMessages(limit: Int = 50, offset: Int = 0) async throws -> [ContactMessage] {
        let (data, _) = try await request("/api/admin/messages?limit=\(limit)&offset=\(offset)")
        return try JSONDecoder.api.decode([ContactMessage].self, from: data)
    }

    func fetchNotifications(limit: Int = 100, offset: Int = 0) async throws -> [NotificationItem] {
        let (data, _) = try await request("/api/notifications?limit=\(limit)&offset=\(offset)")
        return try JSONDecoder.api.decode([NotificationItem].self, from: data)
    }

    // MARK: - Push registration
    func registerDevice(platform: String, token: String) async {
        struct Body: Encodable { let platform: String; let token: String }
        _ = try? await request("/api/notifications/device", method: "POST", jsonBody: Body(platform: platform, token: token))
    }
}

// MARK: - Models
struct Booking: Codable, Identifiable {
    let id: Int
    let tourId: Int
    let availabilityId: Int
    let customerFirstName: String
    let customerLastName: String
    let customerEmail: String
    let customerPhone: String
    let numberOfParticipants: Int
    let specialRequests: String?
    let bookingReference: String
    let totalAmount: Int
    let paymentStatus: String?
    let stripePaymentIntentId: String?
    let createdAt: String?
    let meetingPoint: String?
    let language: String?
}

struct Testimonial: Codable, Identifiable {
    let id: Int
    let customerName: String
    let customerCountry: String
    let rating: Int
    let text: String
    let tourId: Int
    let isApproved: Bool?
}

struct ContactMessage: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let subject: String?
    let message: String
    let read: Bool?
    let createdAt: String?
}

struct NotificationItem: Codable, Identifiable {
    struct BodyObj: Codable {
        let ok: Bool?
        let title: String?
        let dateString: String?
        let location: String?
        let device: DeviceInfo?
    }
    struct DeviceInfo: Codable { let os: String?; let browser: String?; let deviceType: String? }

    let id: Int
    let type: String
    let title: String
    let body: BodyObj?
    let payload: VisitPayload?
    let read: Bool?
    let createdAt: String?
}

struct VisitPayload: Codable {
    let ip: String?
    let location: String?
    let loc: String?
    let device: NotificationItem.DeviceInfo?
    let when: String?
    let path: String?
    let referrer: String?
}

// MARK: - JSON helpers
extension JSONDecoder {
    static var api: JSONDecoder { let d = JSONDecoder(); d.keyDecodingStrategy = .convertFromSnakeCase; return d }
}

// Wrap any encodable so we can pass protocol types
struct AnyEncodable: Encodable {
    private let enc: (Encoder) throws -> Void
    init(_ value: Encodable) { self.enc = value.encode }
    func encode(to encoder: Encoder) throws { try enc(encoder) }
}

