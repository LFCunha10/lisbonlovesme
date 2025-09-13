import SwiftUI

struct RequestsView: View {
    @State private var items: [BookingRequest] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List(items) { req in
                VStack(alignment: .leading) {
                    Text("\(req.customerFirstName) \(req.customerLastName)").bold()
                    Text(req.bookingReference).font(.footnote).foregroundStyle(.secondary)
                    Text("Status: \(req.paymentStatus)").font(.footnote)
                }
            }
            .overlay { if isLoading { ProgressView() } }
            .navigationTitle("Requests")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { items = try await APIClient.shared.listBookingRequests() }
        catch { errorMessage = (error as? APIError)?.message ?? "Failed" }
    }
}

