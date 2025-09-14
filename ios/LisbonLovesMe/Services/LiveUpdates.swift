import Foundation

final class LiveUpdates: ObservableObject {
    enum EventType: String { case notification }
    struct Event { let type: EventType; let noteType: String? }

    @Published var lastEvent: Event?

    private var task: URLSessionWebSocketTask?
    private var isConnecting = false
    private var backoff: TimeInterval = 1

    func connectIfNeeded() {
        guard task == nil, !isConnecting else { return }
        guard let wsURL = Self.makeWebSocketURL() else { return }
        isConnecting = true
        let session = URLSession(configuration: .default)
        let t = session.webSocketTask(with: wsURL)
        task = t
        t.resume()
        isConnecting = false
        listen()
    }

    func disconnect() {
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
    }

    private func listen() {
        task?.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let msg):
                self.backoff = 1
                if case let .string(text) = msg { self.handle(text: text) }
                self.listen()
            case .failure:
                self.scheduleReconnect()
            }
        }
    }

    private func scheduleReconnect() {
        disconnect()
        let delay = min(backoff, 30)
        backoff *= 2
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            self?.connectIfNeeded()
        }
    }

    private func handle(text: String) {
        guard let data = text.data(using: .utf8) else { return }
        // Expected shape: { type: "notification", data: { id, type, title, body, payload, createdAt, ... } }
        do {
            let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
            let type = (json?["type"] as? String) ?? ""
            if type == "notification" {
                let note = json?["data"] as? [String: Any]
                let noteType = (note?["type"] as? String) ?? nil
                DispatchQueue.main.async {
                    self.lastEvent = Event(type: .notification, noteType: noteType)
                }
            }
        } catch { }
    }

    private static func makeWebSocketURL() -> URL? {
        let base = AppConfig.baseURL
        var comps = URLComponents(url: base, resolvingAgainstBaseURL: false)
        comps?.scheme = (base.scheme == "https") ? "wss" : "ws"
        comps?.path = "/api/notifications/ws"
        return comps?.url
    }
}

