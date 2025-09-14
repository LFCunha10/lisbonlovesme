import SwiftUI
import Charts

struct MainTabView: View {
    @State private var selection: Int = 0
    var body: some View {
        TabView(selection: $selection) {
            RequestsView()
                .tabItem { Label("Requests", systemImage: "doc.text") }
                .tag(0)

            ReviewsView()
                .tabItem { Label("Reviews", systemImage: "star.bubble") }
                .tag(1)

            MessagesView()
                .tabItem { Label("Messages", systemImage: "envelope") }
                .tag(2)

            VisitsContainerView()
                .tabItem { Label("Visits", systemImage: "person.crop.circle.badge.exclam") }
                .tag(3)

            PersonalView()
                .tabItem { Label("Personal", systemImage: "person.crop.circle") }
                .tag(4)
        }
        .onChange(of: selection) { sel in
            let names = ["Requests","Reviews","Messages","Visits","Personal"]
            if sel >= 0 && sel < names.count { DataLogger.logTabSelection(names[sel]) }
        }
    }
}

// MARK: - Requests
struct RequestsView: View {
    @State private var requests: [Booking] = []
    @State private var loading = false
    @State private var error: String?
    @State private var query: String = ""
    @State private var requestedOnly: Bool = true
    @State private var sort: Sort = .dateDesc
    @EnvironmentObject var live: LiveUpdates

    enum Sort: String, CaseIterable { case dateDesc = "Newest", dateAsc = "Oldest", participantsDesc = "Most people", participantsAsc = "Fewest people" }

    var body: some View {
        NavigationStack {
            Group {
                if loading { ProgressView() }
                List(filteredAndSorted) { r in
                    VStack(alignment: .leading, spacing: 4) {
                        Text("\(r.customerFirstName) \(r.customerLastName)")
                            .font(.headline)
                        Text("Participants: \(r.numberOfParticipants) · Reference: \(r.bookingReference)").font(.subheadline).foregroundColor(.secondary)
                        if let createdAt = r.createdAt, let dt = ISO8601DateFormatter().date(from: createdAt) {
                            Text(Self.dateFormatter.string(from: dt)).font(.footnote).foregroundColor(.secondary)
                        }
                    }
                }
                .searchable(text: $query)
            }
            .navigationTitle("Requests")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Picker("Sort", selection: $sort) { ForEach(Sort.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                        Toggle("Requested only", isOn: $requestedOnly)
                    } label: { Label("Options", systemImage: "line.3.horizontal.decrease.circle") }
                }
                ToolbarItem(placement: .topBarTrailing) { Button("Refresh") { Task { await load() } } }
            }
            .task { await load() }
            .onAppear { Task { await load() } }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
            .onChange(of: live.lastEvent?.noteType) { note in
                if note == "booking" { Task { await load() } }
            }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do {
            DataLogger.logInfo("Requests", "Fetching /api/admin/bookings")
            let all = try await APIClient.shared.fetchBookings()
            self.requests = all.filter { ($0.paymentStatus ?? "requested").lowercased() == "requested" }
            DataLogger.logRequests(all)
        } catch {
            let msg = (error as NSError).localizedDescription
            DataLogger.logError("Requests", "Fetch error: \(msg)")
            self.error = msg
        }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

private extension RequestsView {
    var filteredAndSorted: [Booking] {
        var items = requests
        if !query.isEmpty {
            let q = query.lowercased()
            items = items.filter { ("\($0.customerFirstName) \($0.customerLastName) \($0.bookingReference)".lowercased()).contains(q) }
        }
        if requestedOnly {
            items = items.filter { ($0.paymentStatus ?? "requested").lowercased() == "requested" }
        }
        items.sort { a, b in
            switch sort {
            case .dateDesc:
                let ad = a.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
                let bd = b.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
                return ad > bd
            case .dateAsc:
                let ad = a.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
                let bd = b.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
                return ad < bd
            case .participantsDesc:
                return a.numberOfParticipants > b.numberOfParticipants
            case .participantsAsc:
                return a.numberOfParticipants < b.numberOfParticipants
            }
        }
        return items
    }
}

// MARK: - Reviews
struct ReviewsView: View {
    @State private var items: [Testimonial] = []
    @State private var loading = false
    @State private var error: String?
    @State private var query: String = ""
    @State private var minRating: Int = 0
    @State private var sort: Sort = .dateDesc
    @EnvironmentObject var live: LiveUpdates

    enum Sort: String, CaseIterable { case dateDesc = "Newest", dateAsc = "Oldest", ratingDesc = "Highest rated", ratingAsc = "Lowest rated" }

    var body: some View {
        NavigationStack {
            Group {
                if loading { ProgressView() }
                List(filteredAndSorted) { t in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(t.customerName).font(.headline)
                            Spacer()
                            Text("⭐️ \(t.rating)")
                        }
                        Text(t.text)
                    }
                }
                .searchable(text: $query)
            }
            .navigationTitle("Reviews")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Picker("Sort", selection: $sort) { ForEach(Sort.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                        Picker("Min rating", selection: $minRating) { ForEach([0,1,2,3,4,5], id: \.self) { Text("\($0)+").tag($0) } }
                    } label: { Label("Options", systemImage: "line.3.horizontal.decrease.circle") }
                }
                ToolbarItem(placement: .topBarTrailing) { Button("Refresh") { Task { await load() } } }
            }
            .task { await load() }
            .onAppear { Task { await load() } }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
            .onChange(of: live.lastEvent?.noteType) { note in
                if note == "review" { Task { await load() } }
            }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do {
            DataLogger.logInfo("Reviews", "Fetching /api/testimonials?approvedOnly=true")
            self.items = try await APIClient.shared.fetchTestimonials(approvedOnly: true)
            DataLogger.logReviews(self.items)
        } catch {
            let msg = (error as NSError).localizedDescription
            DataLogger.logError("Reviews", "Fetch error: \(msg)")
            self.error = msg
        }
    }
}

private extension ReviewsView {
    var filteredAndSorted: [Testimonial] {
        var arr = items
        if !query.isEmpty {
            let q = query.lowercased()
            arr = arr.filter { ("\($0.customerName) \($0.text)".lowercased()).contains(q) }
        }
        if minRating > 0 { arr = arr.filter { $0.rating >= minRating } }
        arr.sort { a, b in
            switch sort {
            case .dateDesc: return a.id > b.id
            case .dateAsc: return a.id < b.id
            case .ratingDesc: return a.rating > b.rating
            case .ratingAsc: return a.rating < b.rating
            }
        }
        return arr
    }
}

// MARK: - Messages
struct MessagesView: View {
    @State private var items: [ContactMessage] = []
    @State private var loading = false
    @State private var error: String?
    @State private var query: String = ""
    @State private var unreadOnly: Bool = false
    @State private var sort: Sort = .dateDesc
    @EnvironmentObject var live: LiveUpdates

    enum Sort: String, CaseIterable { case dateDesc = "Newest", dateAsc = "Oldest" }

    var body: some View {
        NavigationStack {
            Group {
                if loading { ProgressView() }
                List(filteredAndSorted) { m in
                    VStack(alignment: .leading, spacing: 4) {
                        HStack { Text(m.name).bold(); Spacer(); Text(m.email).foregroundColor(.secondary) }
                        if let s = m.subject { Text(s).font(.subheadline) }
                        Text(m.message)
                        if let createdAt = m.createdAt, let dt = ISO8601DateFormatter().date(from: createdAt) {
                            Text(Self.dateFormatter.string(from: dt)).font(.footnote).foregroundColor(.secondary)
                        }
                    }
                }
                .searchable(text: $query)
            }
            .navigationTitle("Messages")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Menu {
                        Picker("Sort", selection: $sort) { ForEach(Sort.allCases, id: \.self) { Text($0.rawValue).tag($0) } }
                        Toggle("Unread only", isOn: $unreadOnly)
                    } label: { Label("Options", systemImage: "line.3.horizontal.decrease.circle") }
                }
                ToolbarItem(placement: .topBarTrailing) { Button("Refresh") { Task { await load() } } }
            }
            .task { await load() }
            .onAppear { Task { await load() } }
            .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
            .onChange(of: live.lastEvent?.noteType) { note in
                if note == "contact" { Task { await load() } }
            }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do {
            DataLogger.logInfo("Messages", "Fetching /api/admin/messages")
            self.items = try await APIClient.shared.fetchMessages()
            DataLogger.logMessages(self.items)
        } catch {
            let msg = (error as NSError).localizedDescription
            DataLogger.logError("Messages", "Fetch error: \(msg)")
            self.error = msg
        }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

private extension MessagesView {
    var filteredAndSorted: [ContactMessage] {
        var arr = items
        if !query.isEmpty {
            let q = query.lowercased()
            arr = arr.filter { ("\($0.name) \($0.email) \($0.subject ?? "") \($0.message)".lowercased()).contains(q) }
        }
        if unreadOnly { arr = arr.filter { ($0.read ?? false) == false } }
        arr.sort { a, b in
            let ad = a.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
            let bd = b.createdAt.flatMap { ISO8601DateFormatter().date(from: $0) } ?? .distantPast
            return sort == .dateDesc ? ad > bd : ad < bd
        }
        return arr
    }
}

// MARK: - Visits
struct VisitsContainerView: View {
    @State private var selection = 0
    var body: some View {
        NavigationStack {
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
    @EnvironmentObject var live: LiveUpdates

    var body: some View {
        Group {
            if loading { ProgressView() }
            List(items.filter { $0.type.lowercased() == "visit" }) { n in
                VStack(alignment: .leading, spacing: 6) {
                    Text("New visitor on the site").font(.headline)
                    
                    if let when = n.body?.dateString {
                        Text(when)
                    }
                    let locationText: String = {
                        if let loc = n.payload?.location { return loc }
                        if let loc = n.body?.location { return loc }
                        return "Unknown"
                    }()
                    Text("Location: \(locationText)")
                        .font(.subheadline)
                    if let d = n.payload?.device {
                        Text("Device: \(d.browser ?? "?") · \(d.os ?? "?") · \(d.deviceType ?? "?")")
                            .font(.subheadline)
                    }
                }
                .padding(.vertical, 6)
            }
        }
        .toolbar { Button("Refresh") { Task { await load() } } }
        .task { await load() }
        .onAppear { Task { await load() } }
        .alert(error ?? "", isPresented: .constant(error != nil)) { Button("OK") { error = nil } }
        .onChange(of: live.lastEvent?.noteType) { note in
            if note == "visit" { Task { await load() } }
        }
    }

    private func load() async {
        loading = true; defer { loading = false }
        do {
            DataLogger.logInfo("Visits", "Fetching /api/notifications")
            self.items = try await APIClient.shared.fetchNotifications()
            DataLogger.logNotifications(self.items)
        } catch {
            let msg = (error as NSError).localizedDescription
            DataLogger.logError("Visits", "Fetch error: \(msg)")
            self.error = msg
        }
    }

    static let dateFormatter: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "en_GB"); f.dateFormat = "EEEE, dd/MM/yyyy 'at' HH:mm"; return f
    }()
}

struct VisitsTrendsView: View {
    @State private var items: [NotificationItem] = []
    @State private var loading = false
    @EnvironmentObject var live: LiveUpdates

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
        .onAppear { Task { await load() } }
        .onChange(of: live.lastEvent?.noteType) { note in
            if note == "visit" { Task { await load() } }
        }
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
        if let res = try? await APIClient.shared.fetchNotifications(limit: 500) { self.items = res; DataLogger.logNotifications(res) }
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

