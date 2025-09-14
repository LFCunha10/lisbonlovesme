import Foundation
import LocalAuthentication

enum KeychainService {
    private static let account = "com.example.lisbonlovesme.credentials"
    private static let service = "LisbonLovesMe"

    struct Credentials: Codable { let username: String; let password: String }

    static func save(_ creds: Credentials) throws {
        let data = try JSONEncoder().encode(creds)

        // Require current biometric set, stored only on this device
        let access = SecAccessControlCreateWithFlags(nil, kSecAttrAccessibleWhenUnlockedThisDeviceOnly, .biometryCurrentSet, nil)
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
        ]
        if let access {
            query[kSecAttrAccessControl as String] = access
        }

        SecItemDelete(query as CFDictionary)
        query[kSecValueData as String] = data
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw NSError(domain: NSOSStatusErrorDomain, code: Int(status)) }
    }

    static func loadWithBiometrics(reason: String) throws -> Credentials {
        let ctx = LAContext()
        ctx.localizedReason = reason

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecUseAuthenticationContext as String: ctx,
        ]
        var dataRef: CFTypeRef?
        var status = SecItemCopyMatching(query as CFDictionary, &dataRef)
        if status == errSecItemNotFound {
            // Backwards-compat: attempt lookup without service (old versions)
            var legacyQuery = query
            legacyQuery.removeValue(forKey: kSecAttrService as String)
            dataRef = nil
            status = SecItemCopyMatching(legacyQuery as CFDictionary, &dataRef)
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

    static func exists() -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var ref: CFTypeRef?
        var status = SecItemCopyMatching(query as CFDictionary, &ref)
        if status == errSecItemNotFound {
            // Legacy lookup without service
            var legacy = query; legacy.removeValue(forKey: kSecAttrService as String)
            ref = nil
            status = SecItemCopyMatching(legacy as CFDictionary, &ref)
        }
        return status == errSecSuccess
    }

    static func remove() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: account,
            kSecAttrService as String: service
        ]
        SecItemDelete(query as CFDictionary)
    }
}
