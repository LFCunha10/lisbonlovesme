import SwiftUI

struct MessagesView: View {
    @State private var items: [ContactMessageModel] = []
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            List(items) { msg in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(msg.name).bold()
                        Text("<\(msg.email)>").foregroundStyle(.secondary)
                    }
                    if let subject = msg.subject { Text(subject).font(.subheadline) }
                    Text(msg.message).font(.callout)
                }
                .padding(.vertical, 4)
            }
            .overlay { if isLoading { ProgressView() } }
            .navigationTitle("Messages")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { items = try await APIClient.shared.listMessages() }
        catch { print(error) }
    }
}

