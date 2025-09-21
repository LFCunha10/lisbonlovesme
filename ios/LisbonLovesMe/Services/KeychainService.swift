import Foundation
import LocalAuthentication

enum KeychainService {
    private static let account = "com.example.lisbonlovesme.credentials"
    private static let service = "LisbonLovesMe"

    struct Credentials: Codable { let username: String; let password: String }

    #if DEBUG
    private static func describeStatus(_ status: OSStatus) -> String {
        switch status {
        case errSecSuccess: return "errSecSuccess"
        case errSecItemNotFound: return "errSecItemNotFound (-25300)"
        case errSecInteractionNotAllowed: return "errSecInteractionNotAllowed (-25299)"
        case errSecAuthFailed: return "errSecAuthFailed (-25293)"
        default: return "OSStatus(\(status))"
        }
    }
    #endif

    static func save(_ creds: Credentials) throws {
        let data = try JSONEncoder().encode(creds)

        // Require user presence (Face ID/Touch ID with passcode fallback) for broad compatibility
        let flags: SecAccessControlCreateFlags = [.userPresence]

        guard let access = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, flags, nil) else {
            throw NSError(domain: "KeychainService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Unable to configure access control for Keychain item."])
        }
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
        ]
        query[kSecAttrAccessControl as String] = access
        query[kSecAttrSynchronizable as String] = false

        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = data
        let status = SecItemAdd(query as CFDictionary, nil)
        #if DEBUG
        if status != errSecSuccess {
            print("[KeychainService] SecItemAdd failed: \(describeStatus(status))")
        } else {
            print("[KeychainService] SecItemAdd succeeded")
        }
        #endif
        guard status == errSecSuccess else { throw NSError(domain: NSOSStatusErrorDomain, code: Int(status)) }
    }

    static func loadWithBiometrics(reason: String) throws -> Credentials {
        let ctx = LAContext()
        ctx.localizedReason = reason
        ctx.interactionNotAllowed = false
        ctx.localizedFallbackTitle = "Use Passcode"
        if #available(iOS 11.0, *) {
            // Allow a brief reuse window to reduce repeated prompts during quick successive accesses
            ctx.touchIDAuthenticationAllowableReuseDuration = 10
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecUseAuthenticationContext as String: ctx,
            kSecUseOperationPrompt as String: reason,
            kSecAttrSynchronizable as String: false
        ]
        var dataRef: CFTypeRef?
        var status = SecItemCopyMatching(query as CFDictionary, &dataRef)
        #if DEBUG
        if status != errSecSuccess {
            print("[KeychainService] SecItemCopyMatching (primary) failed: \(describeStatus(status))")
        } else {
            print("[KeychainService] SecItemCopyMatching (primary) succeeded")
        }
        #endif
        if status == errSecItemNotFound {
            // Backwards-compat: attempt lookup without service (old versions)
            var legacyQuery = query
            legacyQuery.removeValue(forKey: kSecAttrService as String)
            dataRef = nil
            status = SecItemCopyMatching(legacyQuery as CFDictionary, &dataRef)
            #if DEBUG
            if status != errSecSuccess {
                print("[KeychainService] SecItemCopyMatching (legacy) failed: \(describeStatus(status))")
            } else {
                print("[KeychainService] SecItemCopyMatching (legacy) succeeded")
            }
            #endif
            if status == errSecSuccess, let data = dataRef as? Data {
                let creds = try JSONDecoder().decode(Credentials.self, from: data)
                // Migrate to current key (with service) for future lookups
                try? save(creds)
                return creds
            }
        }
        guard status == errSecSuccess, let data = dataRef as? Data else { throw NSError(domain: NSOSStatusErrorDomain, code: Int(status)) }
        return try JSONDecoder().decode(Credentials.self, from: data)
    }

    static func loadIfExistsWithoutBiometrics() -> Credentials? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecAttrSynchronizable as String: false
        ]
        var dataRef: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &dataRef)
        #if DEBUG
        if status != errSecSuccess {
            print("[KeychainService] SecItemCopyMatching (no biometrics) failed: \(describeStatus(status))")
        } else {
            print("[KeychainService] SecItemCopyMatching (no biometrics) succeeded")
        }
        #endif
        guard status == errSecSuccess, let data = dataRef as? Data else { return nil }
        return try? JSONDecoder().decode(Credentials.self, from: data)
    }

    static func exists() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecAttrSynchronizable as String: false
        ]
        var ref: CFTypeRef?
        var status = SecItemCopyMatching(query as CFDictionary, &ref)
        #if DEBUG
        if status != errSecSuccess {
            print("[KeychainService] exists() primary lookup failed: \(describeStatus(status))")
        } else {
            print("[KeychainService] exists() primary lookup succeeded")
        }
        #endif
        if status == errSecItemNotFound {
            // Legacy lookup without service
            var legacy = query; legacy.removeValue(forKey: kSecAttrService as String)
            ref = nil
            status = SecItemCopyMatching(legacy as CFDictionary, &ref)
            #if DEBUG
            if status != errSecSuccess {
                print("[KeychainService] exists() legacy lookup failed: \(describeStatus(status))")
            } else {
                print("[KeychainService] exists() legacy lookup succeeded")
            }
            #endif
        }
        return status == errSecSuccess
    }

    static func remove() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecAttrSynchronizable as String: false
        ]
        SecItemDelete(query as CFDictionary)
    }

    static func isBiometryAvailable() -> Bool {
        let ctx = LAContext()
        var error: NSError?
        let can = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
        return can
    }
}

