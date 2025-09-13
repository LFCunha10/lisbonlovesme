import SwiftUI

struct NotificationsView: View {
    @State private var items: [NotificationItem] = []
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            List(items) { n in
                VStack(alignment: .leading) {
                    Text(n.title).bold()
                    Text(n.body).font(.footnote).foregroundStyle(.secondary)
                }
            }
            .overlay { if isLoading { ProgressView() } }
            .navigationTitle("Alerts")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { items = try await APIClient.shared.listNotifications() }
        catch { print(error) }
    }
}

