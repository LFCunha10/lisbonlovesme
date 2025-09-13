import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionModel
    @State private var username = ""
    @State private var password = ""
    @State private var errorMessage: String?
    @State private var isLoading = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                Text("LLM Admin")
                    .font(.largeTitle).bold()
                TextField("Username", text: $username)
                    .textInputAutocapitalization(.never)
                    .textFieldStyle(.roundedBorder)
                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)
                if let errorMessage { Text(errorMessage).foregroundStyle(.red) }
                Button(action: { Task { await login() } }) {
                    if isLoading { ProgressView() } else { Text("Log In") }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading || username.isEmpty || password.isEmpty)
                Spacer()
            }
            .padding()
        }
    }

    private func login() async {
        errorMessage = nil
        isLoading = true
        defer { isLoading = false }
        do {
            try await APIClient.shared.login(username: username, password: password)
            await MainActor.run { session.isAuthenticated = true }
        } catch {
            await MainActor.run { errorMessage = (error as? APIError)?.message ?? "Login failed" }
        }
    }
}

