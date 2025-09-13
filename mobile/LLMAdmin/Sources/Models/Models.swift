import Foundation

struct BookingRequest: Codable, Identifiable {
    let id: Int
    let customerFirstName: String
    let customerLastName: String
    let customerEmail: String
    let customerPhone: String
    let numberOfParticipants: Int
    let specialRequests: String?
    let bookingReference: String
    let totalAmount: Int
    let paymentStatus: String
}

struct Review: Codable, Identifiable {
    let id: Int
    let customerName: String
    let customerCountry: String
    let rating: Int
    let text: String
    let isApproved: Bool?
}

struct ContactMessageModel: Codable, Identifiable {
    let id: Int
    let name: String
    let email: String
    let subject: String?
    let message: String
    let read: Bool?
}

struct NotificationItem: Codable, Identifiable {
    let id: Int
    let type: String
    let title: String
    let body: String
    let payload: [String: AnyCodable]?
    let createdAt: String?
}

struct AnyCodable: Codable {}

