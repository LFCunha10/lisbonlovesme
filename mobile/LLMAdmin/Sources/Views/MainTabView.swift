import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            RequestsView()
                .tabItem { Label("Requests", systemImage: "list.bullet") }
            ReviewsView()
                .tabItem { Label("Reviews", systemImage: "star") }
            MessagesView()
                .tabItem { Label("Messages", systemImage: "envelope") }
            NotificationsView()
                .tabItem { Label("Alerts", systemImage: "bell") }
        }
    }
}

