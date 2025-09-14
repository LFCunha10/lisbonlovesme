import Foundation
import os

enum DataLogger {
    private static let requestsLog = Logger(subsystem: "com.lisbonlovesme.app", category: "Requests")
    private static let reviewsLog  = Logger(subsystem: "com.lisbonlovesme.app", category: "Reviews")
    private static let messagesLog = Logger(subsystem: "com.lisbonlovesme.app", category: "Messages")
    private static let visitsLog   = Logger(subsystem: "com.lisbonlovesme.app", category: "Visits")
    private static let tabLog      = Logger(subsystem: "com.lisbonlovesme.app", category: "Tabs")

    static func logTabSelection(_ name: String) {
        tabLog.info("Tab selected: \(name, privacy: .public)")
    }

    static func logRequests(_ items: [Booking]) {
        let json = makeJSON(items)
        requestsLog.info("Fetched Requests (\(items.count)): \(json, privacy: .public)")
    }

    static func logReviews(_ items: [Testimonial]) {
        let json = makeJSON(items)
        reviewsLog.info("Fetched Reviews (\(items.count)): \(json, privacy: .public)")
    }

    static func logMessages(_ items: [ContactMessage]) {
        let json = makeJSON(items)
        messagesLog.info("Fetched Messages (\(items.count)): \(json, privacy: .public)")
    }

    static func logNotifications(_ items: [NotificationItem]) {
        let json = makeJSON(items)
        visitsLog.info("Fetched Notifications (\(items.count)): \(json, privacy: .public)")
    }

    static func logInfo(_ category: String, _ message: String) {
        let log = logger(for: category)
        log.info("\(message, privacy: .public)")
    }

    static func logError(_ category: String, _ message: String) {
        let log = logger(for: category)
        log.error("\(message, privacy: .public)")
    }

    private static func logger(for category: String) -> Logger {
        switch category.lowercased() {
        case "requests": return requestsLog
        case "reviews": return reviewsLog
        case "messages": return messagesLog
        case "visits": return visitsLog
        default: return Logger(subsystem: "com.lisbonlovesme.app", category: category)
        }
    }

    private static func makeJSON<T: Encodable>(_ value: T) -> String {
        let enc = JSONEncoder()
        enc.outputFormatting = [.prettyPrinted, .sortedKeys]
        if let data = try? enc.encode(value), let s = String(data: data, encoding: .utf8) {
            // Cap very large payloads for log readability
            return s.count > 8000 ? String(s.prefix(8000)) + "\n…(truncated)…" : s
        }
        return "<encode-failed>"
    }
}
