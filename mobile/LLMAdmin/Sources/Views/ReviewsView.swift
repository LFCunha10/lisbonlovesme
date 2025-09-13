import SwiftUI

struct ReviewsView: View {
    @State private var items: [Review] = []
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            List(items) { review in
                HStack {
                    VStack(alignment: .leading) {
                        Text(review.customerName).bold()
                        Text(review.text).lineLimit(2)
                    }
                    Spacer()
                    if review.isApproved != true {
                        Button("Approve") {
                            Task {
                                try? await APIClient.shared.approveReview(id: review.id)
                                await load()
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
            .overlay { if isLoading { ProgressView() } }
            .navigationTitle("Reviews")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { items = try await APIClient.shared.listAllTestimonials() }
        catch { print(error) }
    }
}

