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
        // Build URL robustly so query strings are not encoded into the path
        guard let url = URL(string: path, relativeTo: AppConfig.baseURL) else {
            throw URLError(.badURL)
        }
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
        let (data, resp) = try await request("/api/admin/bookings")
        guard (200..<300).contains(resp.statusCode) else {
            throw APIClient.decodeAPIError(data: data, status: resp.statusCode)
        }
        return try JSONDecoder.api.decode([Booking].self, from: data)
    }

    func fetchTestimonials(approvedOnly: Bool = true) async throws -> [Testimonial] {
        let qs = "?approvedOnly=\(approvedOnly ? "true" : "false")"
        let (data, resp) = try await request("/api/testimonials\(qs)")
        guard (200..<300).contains(resp.statusCode) else {
            throw APIClient.decodeAPIError(data: data, status: resp.statusCode)
        }

        // Support both a plain array and an envelope shape
        struct TestimonialsEnvelope: Decodable { let testimonials: [Testimonial] }

        do {
            // Try plain array first
            if let arr = try? JSONDecoder.api.decode([Testimonial].self, from: data) {
                return arr
            }
            // Try envelope `{ "testimonials": [...] }`
            if let env = try? JSONDecoder.api.decode(TestimonialsEnvelope.self, from: data) {
                return env.testimonials
            }

            // Log raw response for debugging when decoding fails
            if let raw = String(data: data, encoding: .utf8) {
                print("fetchTestimonials decode failed. Raw response:", raw)
            }

            // Legacy fallback: attempt to parse an array of dictionaries
            if let arr = try? JSONSerialization.jsonObject(with: data) as? [Any] {
                return APIClient.parseTestimonials(arr)
            }

            // If nothing matched, throw a descriptive error
            throw DecodingError.dataCorrupted(.init(codingPath: [], debugDescription: "Unexpected testimonials response shape"))
        }
    }

    func fetchMessages(limit: Int = 50, offset: Int = 0) async throws -> [ContactMessage] {
        let (data, resp) = try await request("/api/admin/messages?limit=\(limit)&offset=\(offset)")
        guard (200..<300).contains(resp.statusCode) else {
            throw APIClient.decodeAPIError(data: data, status: resp.statusCode)
        }
        do {
            return try JSONDecoder.api.decode([ContactMessage].self, from: data)
        } catch {
            if let arr = try? JSONSerialization.jsonObject(with: data) as? [Any] {
                return APIClient.parseMessages(arr)
            }
            throw error
        }
    }

    func fetchNotifications(limit: Int = 100, offset: Int = 0) async throws -> [NotificationItem] {
        let (data, resp) = try await request("/api/notifications?limit=\(limit)&offset=\(offset)")
        guard (200..<300).contains(resp.statusCode) else {
            throw APIClient.decodeAPIError(data: data, status: resp.statusCode)
        }
        do {
            return try JSONDecoder.api.decode([NotificationItem].self, from: data)
        } catch {
            if let arr = try? JSONSerialization.jsonObject(with: data) as? [Any] {
                return APIClient.parseNotifications(arr)
            }
            throw error
        }
    }

    // MARK: - Error helpers
    static func decodeAPIError(data: Data, status: Int) -> NSError {
        if let obj = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
            if let msg = obj["message"] as? String { return NSError(domain: "api", code: status, userInfo: [NSLocalizedDescriptionKey: msg]) }
            if let error = obj["error"] as? String { return NSError(domain: "api", code: status, userInfo: [NSLocalizedDescriptionKey: error]) }
        }
        let txt = String(data: data, encoding: .utf8) ?? "HTTP \(status)"
        return NSError(domain: "api", code: status, userInfo: [NSLocalizedDescriptionKey: txt])
    }

    // MARK: - Fallback parsers
    private static func parseTestimonials(_ arr: [Any]) -> [Testimonial] {
        return arr.compactMap { elt in
            guard let d = elt as? [String: Any] else { return nil }
            func str(_ k: String) -> String? { d[k] as? String }
            func int(_ k: String) -> Int? {
                if let n = d[k] as? Int { return n }
                if let s = d[k] as? String, let n = Int(s) { return n }
                return nil
            }
            let id = int("id") ?? 0
            let rating = int("rating") ?? 0
            let tourId = int("tourId") ?? 0
            let name = str("customerName") ?? str("customer_name") ?? ""
            let country = str("customerCountry") ?? str("customer_country") ?? ""
            let text = str("text") ?? ""
            let isApproved: Bool? = {
                if let b = d["isApproved"] as? Bool { return b }
                if let s = d["isApproved"] as? String { return ["1","true","yes"].contains(s.lowercased()) }
                if let n = d["isApproved"] as? Int { return n != 0 }
                return nil
            }()
            return Testimonial(id: id, customerName: name, customerCountry: country, rating: rating, text: text, tourId: tourId, isApproved: isApproved)
        }
    }

    private static func parseMessages(_ arr: [Any]) -> [ContactMessage] {
        return arr.compactMap { elt in
            guard let d = elt as? [String: Any] else { return nil }
            func str(_ k: String) -> String? { d[k] as? String }
            func int(_ k: String) -> Int? {
                if let n = d[k] as? Int { return n }
                if let s = d[k] as? String, let n = Int(s) { return n }
                return nil
            }
            func bool(_ k: String) -> Bool? {
                if let b = d[k] as? Bool { return b }
                if let s = d[k] as? String { return ["1","true","yes"].contains(s.lowercased()) }
                if let n = d[k] as? Int { return n != 0 }
                return nil
            }
            let id = int("id") ?? 0
            let name = str("name") ?? ""
            let email = str("email") ?? ""
            let subject = str("subject")
            let message = str("message") ?? ""
            let read = bool("read")
            let createdAt = str("createdAt") ?? str("created_at")
            return ContactMessage(id: id, name: name, email: email, subject: subject, message: message, read: read, createdAt: createdAt)
        }
    }

    private static func parseNotifications(_ arr: [Any]) -> [NotificationItem] {
        return arr.compactMap { elt in
            guard let d = elt as? [String: Any] else { return nil }
            func str(_ k: String) -> String? { d[k] as? String }
            func int(_ k: String) -> Int? {
                if let n = d[k] as? Int { return n }
                if let s = d[k] as? String, let n = Int(s) { return n }
                return nil
            }
            func bool(_ k: String) -> Bool? {
                if let b = d[k] as? Bool { return b }
                if let s = d[k] as? String { return ["1","true","yes"].contains(s.lowercased()) }
                if let n = d[k] as? Int { return n != 0 }
                return nil
            }
            let id = int("id") ?? 0
            let type = str("type") ?? ""
            let title = str("title") ?? ""

            var bodyObj: NotificationItem.BodyObj? = nil
            if let b = d["body"] as? [String: Any] {
                let ok = b["ok"] as? Bool
                let bt = b["title"] as? String
                let ds = b["dateString"] as? String
                var dev: NotificationItem.DeviceInfo? = nil
                if let dv = b["device"] as? [String: Any] {
                    dev = .init(os: dv["os"] as? String, browser: dv["browser"] as? String, deviceType: dv["deviceType"] as? String)
                }
                bodyObj = .init(ok: ok, title: bt, dateString: ds, location: b["location"] as? String, device: dev)
            } else if let s = d["body"] as? String, let data = s.data(using: .utf8), let b = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let ok = b["ok"] as? Bool
                let bt = b["title"] as? String
                let ds = b["dateString"] as? String
                var dev: NotificationItem.DeviceInfo? = nil
                if let dv = b["device"] as? [String: Any] {
                    dev = .init(os: dv["os"] as? String, browser: dv["browser"] as? String, deviceType: dv["deviceType"] as? String)
                }
                bodyObj = .init(ok: ok, title: bt, dateString: ds, location: b["location"] as? String, device: dev)
            }

            var payload: VisitPayload? = nil
            if let p = d["payload"] as? [String: Any] {
                let dv = p["device"] as? [String: Any]
                let dev = NotificationItem.DeviceInfo(os: dv?["os"] as? String, browser: dv?["browser"] as? String, deviceType: dv?["deviceType"] as? String)
                payload = .init(ip: p["ip"] as? String, location: p["location"] as? String, loc: p["loc"] as? String, device: dev, when: p["when"] as? String, path: p["path"] as? String, referrer: p["referrer"] as? String)
            }
            let read = bool("read")
            let createdAt = str("createdAt") ?? str("created_at")
            return NotificationItem(id: id, type: type, title: title, body: bodyObj, payload: payload, read: read, createdAt: createdAt)
        }
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

    enum CodingKeys: String, CodingKey { case id, customerName, customerCountry, rating, text, tourId, isApproved }
    init(id: Int, customerName: String, customerCountry: String, rating: Int, text: String, tourId: Int, isApproved: Bool?) {
        self.id = id; self.customerName = customerName; self.customerCountry = customerCountry; self.rating = rating; self.text = text; self.tourId = tourId; self.isApproved = isApproved
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let id = try c.decodeIntFlexible(forKey: .id)
        let rating = try c.decodeIntFlexible(forKey: .rating)
        let tourId = try c.decodeIntFlexible(forKey: .tourId)
        let name = try c.decode(String.self, forKey: .customerName)
        let country = try c.decode(String.self, forKey: .customerCountry)
        let text = try c.decode(String.self, forKey: .text)
        let approved = try? c.decodeBoolFlexible(forKey: .isApproved)
        self.init(id: id, customerName: name, customerCountry: country, rating: rating, text: text, tourId: tourId, isApproved: approved)
    }
}

struct ContactMessage: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let subject: String?
    let message: String
    let read: Bool?
    let createdAt: String?

    enum CodingKeys: String, CodingKey { case id, name, email, subject, message, read, createdAt }
    init(id: Int, name: String, email: String, subject: String?, message: String, read: Bool?, createdAt: String?) {
        self.id = id; self.name = name; self.email = email; self.subject = subject; self.message = message; self.read = read; self.createdAt = createdAt
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let id = try c.decodeIntFlexible(forKey: .id)
        let name = (try? c.decode(String.self, forKey: .name)) ?? ""
        let email = (try? c.decode(String.self, forKey: .email)) ?? ""
        let subject = try? c.decodeIfPresent(String.self, forKey: .subject)
        let message = (try? c.decode(String.self, forKey: .message)) ?? ""
        let read = try? c.decodeBoolFlexible(forKey: .read)
        let createdAt = try? c.decode(String.self, forKey: .createdAt)
        self.init(id: id, name: name, email: email, subject: subject ?? nil, message: message, read: read, createdAt: createdAt)
    }
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

    enum CodingKeys: String, CodingKey { case id, type, title, body, payload, read, createdAt }
    init(id: Int, type: String, title: String, body: BodyObj?, payload: VisitPayload?, read: Bool?, createdAt: String?) {
        self.id = id; self.type = type; self.title = title; self.body = body; self.payload = payload; self.read = read; self.createdAt = createdAt
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let id = try c.decodeIntFlexible(forKey: .id)
        let type = (try? c.decode(String.self, forKey: .type)) ?? ""
        let title = (try? c.decode(String.self, forKey: .title)) ?? ""
        var body: BodyObj? = nil
        if let obj = try? c.decode(BodyObj.self, forKey: .body) {
            body = obj
        } else if let str = try? c.decode(String.self, forKey: .body) {
            // Attempt to parse stringified JSON
            if let data = str.data(using: .utf8), let dict = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                let ok = dict["ok"] as? Bool
                let title = dict["title"] as? String
                let dateString = dict["dateString"] as? String
                var device: DeviceInfo? = nil
                if let d = dict["device"] as? [String: Any] {
                    device = DeviceInfo(os: d["os"] as? String, browser: d["browser"] as? String, deviceType: d["deviceType"] as? String)
                }
                body = BodyObj(ok: ok, title: title, dateString: dateString, location: dict["location"] as? String, device: device)
            } else {
                body = nil
            }
        }
        let payload = try? c.decode(VisitPayload.self, forKey: .payload)
        let read = try? c.decodeBoolFlexible(forKey: .read)
        let createdAt = try? c.decode(String.self, forKey: .createdAt)
        self.init(id: id, type: type, title: title, body: body, payload: payload, read: read, createdAt: createdAt)
    }
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

// MARK: - Flexible decode helpers
private extension KeyedDecodingContainer {
    func decodeIntFlexible(forKey key: Key) throws -> Int {
        if let i = try? self.decode(Int.self, forKey: key) { return i }
        if let s = try? self.decode(String.self, forKey: key), let i = Int(s) { return i }
        throw DecodingError.typeMismatch(Int.self, DecodingError.Context(codingPath: [key], debugDescription: "Expected int or string int for \(key.stringValue)"))
    }
    func decodeBoolFlexible(forKey key: Key) throws -> Bool {
        if let b = try? self.decode(Bool.self, forKey: key) { return b }
        if let s = try? self.decode(String.self, forKey: key) {
            return ["1","true","yes"].contains(s.lowercased())
        }
        if let i = try? self.decode(Int.self, forKey: key) { return i != 0 }
        throw DecodingError.typeMismatch(Bool.self, DecodingError.Context(codingPath: [key], debugDescription: "Expected bool or string/int for \(key.stringValue)"))
    }
}
