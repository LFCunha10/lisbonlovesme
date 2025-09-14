import SwiftUI
import Charts

struct MainTabView: View {
    var body: some View {
        TabView {
            RequestsView()
                .tabItem { Label("Requests", systemImage: "doc.text") }

            ReviewsView()
                .tabItem { Label("Reviews", systemImage: "star.bubble") }

            MessagesView()
                .tabItem { Label("Messages", systemImage: "envelope") }

            VisitsContainerView()
                .tabItem { Label("Visits", systemImage: "person.crop.circle.badge.exclam") }

            PersonalView()
                .tabItem { Label("Personal", systemImage: "person.crop.circle") }
        }
    }
}

// MARK: - Requests
struct RequestsView: View {
    @State private var requests: [Booking] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationView {
            Group {
                if loading { ProgressView() }
                List(requests) { r in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(r.customerFirstName) \(r.customerLastName)")
                            .font(.headline)
                        Text("Participants: \(r.numberOfParticipants) · Reference: \(r.bookingReference)").font(.subheadline).foregroundColor(.secondary)
                        if let createdAt = r.createdAt, let dt = ISO8601DateFormatter().date(from: createdAt) {
                            Text(Self.dateFormatter.string(from: dt)).font(.footnote).foregroundColor(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Requests")
            .toolbar { Button("Refresh") { Task { await load() } } }
            .task { await load() }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do {
            let all = try await APIClient.shared.fetchBookings()
            self.requests = all.filter { ($0.paymentStatus ?? "requested").lowercased() == "requested" }
        } catch { self.error = (error as NSError).localizedDescription }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

// MARK: - Reviews
struct ReviewsView: View {
    @State private var items: [Testimonial] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationView {
            Group {
                if loading { ProgressView() }
                List(items) { t in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(t.customerName).font(.headline)
                            Spacer()
                            Text("⭐️ \(t.rating)")
                        }
                        Text(t.text)
                    }
                }
            }
            .navigationTitle("Reviews")
            .toolbar { Button("Refresh") { Task { await load() } } }
            .task { await load() }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do { self.items = try await APIClient.shared.fetchTestimonials(approvedOnly: true) }
        catch { self.error = (error as NSError).localizedDescription }
    }
}

// MARK: - Messages
struct MessagesView: View {
    @State private var items: [ContactMessage] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        NavigationView {
            Group {
                if loading { ProgressView() }
                List(items) { m in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack { Text(m.name).bold(); Spacer(); Text(m.email).foregroundColor(.secondary) }
                        if let s = m.subject { Text(s).font(.subheadline) }
                        Text(m.message)
                        if let createdAt = m.createdAt, let dt = ISO8601DateFormatter().date(from: createdAt) {
                            Text(Self.dateFormatter.string(from: dt)).font(.footnote).foregroundColor(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("Messages")
            .toolbar { Button("Refresh") { Task { await load() } } }
            .task { await load() }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do { self.items = try await APIClient.shared.fetchMessages() }
        catch { self.error = (error as NSError).localizedDescription }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

// MARK: - Visits
struct VisitsContainerView: View {
    @State private var selection = 0
    var body: some View {
        NavigationView {
            VStack {
                Picker("Mode", selection: $selection) {
                    Text("Feed").tag(0)
                    Text("Trends").tag(1)
                }
                .pickerStyle(.segmented)
                .padding()
                if selection == 0 {
                    VisitsFeedView()
                } else {
                    VisitsTrendsView()
                }
            }
            .navigationTitle("Visits")
        }
    }
}

struct VisitsFeedView: View {
    @State private var items: [NotificationItem] = []
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        Group {
            if loading { ProgressView() }
            List(items.filter { $0.type.lowercased() == "visit" }) { n in
                VStack(alignment: .leading, spacing: 6) {
                    Text("New visitor on the site").font(.headline)
                    if let whenIso = n.payload?.when, let dt = ISO8601DateFormatter().date(from: whenIso) {
                        Text(Self.dateFormatter.string(from: dt)).font(.subheadline).foregroundColor(.secondary)
                    }
                    if let d = n.payload?.device {
                        Text("Device: \(d.browser ?? "?") · \(d.os ?? "?") · \(d.deviceType ?? "?")")
                            .font(.subheadline)
                    }
                    Text("Location: \(n.payload?.location ?? n.body?.location ?? "Unknown")")
                        .font(.subheadline)
                }
                .padding(.vertical, 6)
            }
        }
        .toolbar { Button("Refresh") { Task { await load() } } }
        .task { await load() }
        .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do { self.items = try await APIClient.shared.fetchNotifications() }
        catch { self.error = (error as NSError).localizedDescription }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_GB"); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

struct VisitsTrendsView: View {
    @State private var items: [NotificationItem] = []
    @State private var loading = false

    var body: some View {
        VStack(alignment: .leading) {
            if loading { ProgressView() }
            Chart(trends) { point in
                LineMark(x: .value("Date", point.date), y: .value("Visits", point.count))
                PointMark(x: .value("Date", point.date), y: .value("Visits", point.count))
            }
            .frame(height: 260)
            .padding()
        }
        .task { await load() }
    }

    struct TrendPoint: Identifiable { let id = UUID(); let date: Date; let count: Int }
    private var trends: [TrendPoint] {
        let visits = items.filter { $0.type.lowercased() == "visit" }
        let fmt = ISO8601DateFormatter()
        let grouped = Dictionary(grouping: visits.compactMap { n -> Date? in
            guard let iso = n.payload?.when, let d = fmt.date(from: iso) else { return nil }
            return Calendar.current.startOfDay(for: d)
        }) { $0 }
        let points = grouped.map { (day, arr) in TrendPoint(date: day, count: arr.count) }
        return points.sorted { $0.date < $1.date }
    }

    private func load() async {
        loading = true; defer { loading = false }
        if let res = try? await APIClient.shared.fetchNotifications(limit: 500) { self.items = res }
    }
}

// MARK: - Personal
struct PersonalView: View {
    @EnvironmentObject var session: SessionModel
    @StateObject private var vm = AuthViewModel()

    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Text("Signed in as \(session.username)")
                Button(role: .destructive) {
                    Task { await vm.logout(session: session) }
                } label: {
                    Text("Log Out").bold().frame(maxWidth: .infinity)
                        .padding().background(Color.red).foregroundColor(.white).cornerRadius(10)
                }
                .padding(.horizontal)
                Spacer()
            }
            .navigationTitle("Personal")
        }
    }
}

