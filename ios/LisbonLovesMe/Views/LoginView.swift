import SwiftUI

struct LoginView: View {
    @EnvironmentObject var session: SessionModel
    @StateObject private var vm = AuthViewModel()
    @State private var showEnableFaceIDPrompt = true

    var body: some View {
        VStack(spacing: 24) {
            Text("Lisbonlovesme")
                .font(.largeTitle).bold()
                .padding(.top, 60)

            VStack(alignment: .leading, spacing: 12) {
                TextField("Username", text: $vm.username)
                    .textContentType(.username)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(true)
                    .padding().background(Color(.secondarySystemBackground)).cornerRadius(8)

                SecureField("Password", text: $vm.password)
                    .textContentType(.password)
                    .padding().background(Color(.secondarySystemBackground)).cornerRadius(8)
            }.padding(.horizontal)

            Button {
                Task {
                    await vm.login(session: session)
                    if session.isAuthenticated && vm.biometricsAvailable && !vm.biometricsEnabled {
                        showEnableFaceIDPrompt = true
                    }
                }
            } label: {
                HStack { if vm.isLoading { ProgressView() }; Text("Log In").bold() }
                    .frame(maxWidth: .infinity)
                    .padding().background(Color.accentColor).foregroundColor(.white).cornerRadius(10)
                    .padding(.horizontal)
            }

            Button {
                Task { await vm.tryFaceIDLogin(session: session) }
            } label: {
                HStack { Image(systemName: "faceid"); Text("Face ID") }
                    .frame(maxWidth: .infinity)
                    .padding().background(Color(.secondarySystemBackground)).cornerRadius(10)
                    .padding(.horizontal)
            }
            .disabled(!vm.biometricsEnabled)
            .opacity(vm.biometricsEnabled ? 1 : 0.5)

            if let err = vm.error { Text(err).foregroundColor(.red).padding(.horizontal) }
            Spacer()
        }
        .alert("Enable Face ID?", isPresented: $showEnableFaceIDPrompt) {
            Button("Not Now", role: .cancel) {}
            Button("Enable") { vm.enableBiometricsIfAllowed() }
        } message: {
            Text("Use Face ID for future logins.")
        }
    }
}

struct LoginView_Previews: PreviewProvider { static var previews: some View { LoginView().environmentObject(SessionModel()) } }

