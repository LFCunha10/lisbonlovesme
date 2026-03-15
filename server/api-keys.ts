import crypto from "node:crypto";
import type { Request, RequestHandler, Response } from "express";
import { hasAuthenticatedAdminSession } from "./auth";
import { requireCsrf } from "./security";

const API_KEYS_ENV_NAME = "API_KEYS";
const API_KEY_HEADER = "x-api-key";

const supportedApiKeyScopes = ["admin:read", "admin:write", "push:register", "*"] as const;
const scopedAccessGrants = {
  "admin:read": new Set(["admin:read", "admin:write", "*"]),
  "admin:write": new Set(["admin:write", "*"]),
  "push:register": new Set(["push:register", "*"]),
} as const;

export type ApiKeyScope = (typeof supportedApiKeyScopes)[number];

export type ApiKeyPrincipal = {
  id: string;
  scopes: ApiKeyScope[];
};

type ParsedApiKey = {
  id: string;
  value: string;
  scopes: Set<ApiKeyScope>;
};

declare global {
  namespace Express {
    interface Request {
      apiKeyPrincipal?: ApiKeyPrincipal;
    }
  }
}

let cachedApiKeysRaw: string | undefined;
let cachedApiKeys: ParsedApiKey[] | undefined;

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseConfiguredApiKeys(rawValue: string): ParsedApiKey[] {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`${API_KEYS_ENV_NAME} must be valid JSON.`);
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error(`${API_KEYS_ENV_NAME} must be a JSON array.`);
  }

  const seenIds = new Set<string>();

  return parsedValue.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`${API_KEYS_ENV_NAME}[${index}] must be an object.`);
    }

    const { id, value, scopes } = entry as {
      id?: unknown;
      value?: unknown;
      scopes?: unknown;
    };

    if (typeof id !== "string" || !id.trim()) {
      throw new Error(`${API_KEYS_ENV_NAME}[${index}].id must be a non-empty string.`);
    }

    const normalizedId = id.trim();
    if (seenIds.has(normalizedId)) {
      throw new Error(`${API_KEYS_ENV_NAME} contains duplicate id "${normalizedId}".`);
    }
    seenIds.add(normalizedId);

    if (typeof value !== "string" || value.trim().length < 16) {
      throw new Error(
        `${API_KEYS_ENV_NAME}[${index}].value must be a non-empty string with at least 16 characters.`,
      );
    }

    if (!Array.isArray(scopes) || scopes.length === 0) {
      throw new Error(`${API_KEYS_ENV_NAME}[${index}].scopes must be a non-empty array.`);
    }

    const normalizedScopes = scopes.map((scope, scopeIndex) => {
      if (typeof scope !== "string" || !supportedApiKeyScopes.includes(scope as ApiKeyScope)) {
        throw new Error(
          `${API_KEYS_ENV_NAME}[${index}].scopes[${scopeIndex}] must be one of ${supportedApiKeyScopes.join(", ")}.`,
        );
      }

      return scope as ApiKeyScope;
    });

    return {
      id: normalizedId,
      value: value.trim(),
      scopes: new Set(normalizedScopes),
    };
  });
}

function getConfiguredApiKeys(): ParsedApiKey[] {
  const rawValue = process.env[API_KEYS_ENV_NAME]?.trim();

  if (cachedApiKeysRaw === rawValue && cachedApiKeys) {
    return cachedApiKeys;
  }

  cachedApiKeysRaw = rawValue;
  cachedApiKeys = rawValue ? parseConfiguredApiKeys(rawValue) : [];
  return cachedApiKeys;
}

export function validateApiKeyConfiguration() {
  getConfiguredApiKeys();
}

function getPresentedApiKey(req: Request): string | null {
  const headerValue = req.get(API_KEY_HEADER)?.trim();
  if (headerValue) {
    return headerValue;
  }

  const authorizationHeader = req.get("authorization")?.trim();
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, credentials] = authorizationHeader.split(/\s+/, 2);
  if (!credentials || !/^(apikey|bearer)$/i.test(scheme)) {
    return null;
  }

  return credentials.trim() || null;
}

function matchApiKey(value: string): ParsedApiKey | undefined {
  const configuredApiKeys = getConfiguredApiKeys();
  return configuredApiKeys.find((apiKey) => safeEqual(apiKey.value, value));
}

function buildPrincipal(apiKey: ParsedApiKey): ApiKeyPrincipal {
  return {
    id: apiKey.id,
    scopes: Array.from(apiKey.scopes),
  };
}

function hasScope(principal: ApiKeyPrincipal, requiredScope: Exclude<ApiKeyScope, "*">): boolean {
  const allowedScopes = scopedAccessGrants[requiredScope];
  return principal.scopes.some((scope) => allowedScopes.has(scope));
}

export function getApiKeyPrincipal(req: Request): ApiKeyPrincipal | null {
  if (req.apiKeyPrincipal) {
    return req.apiKeyPrincipal;
  }

  const presentedKey = getPresentedApiKey(req);
  if (!presentedKey) {
    return null;
  }

  const matchingKey = matchApiKey(presentedKey);
  if (!matchingKey) {
    return null;
  }

  req.apiKeyPrincipal = buildPrincipal(matchingKey);
  return req.apiKeyPrincipal;
}

export function requestHasApiKeyScope(
  req: Request,
  requiredScope: Exclude<ApiKeyScope, "*">,
): boolean {
  const principal = getApiKeyPrincipal(req);
  if (!principal) {
    return false;
  }

  return hasScope(principal, requiredScope);
}

function rejectMissingOrInvalidApiKey(res: Response, message: string, status = 401) {
  return res.status(status).json({ message });
}

export function requireScopedApiKey(
  requiredScope: Exclude<ApiKeyScope, "*">,
  options?: { allowAdminSession?: boolean },
): RequestHandler {
  return (req, res, next) => {
    if (options?.allowAdminSession && hasAuthenticatedAdminSession(req)) {
      return next();
    }

    const presentedKey = getPresentedApiKey(req);
    if (!presentedKey) {
      return rejectMissingOrInvalidApiKey(res, "API key required");
    }

    const principal = getApiKeyPrincipal(req);
    if (!principal) {
      return rejectMissingOrInvalidApiKey(res, "Invalid API key", 403);
    }

    if (!hasScope(principal, requiredScope)) {
      return rejectMissingOrInvalidApiKey(res, "API key does not grant the required scope", 403);
    }

    next();
  };
}

export function requireAdminAccess(options?: {
  requiredScope?: "admin:read" | "admin:write";
  requireCsrfForSession?: boolean;
}): RequestHandler {
  const requiredScope = options?.requiredScope ?? "admin:read";
  const requireCsrfForSession = options?.requireCsrfForSession ?? false;

  return (req, res, next) => {
    const presentedKey = getPresentedApiKey(req);
    if (presentedKey) {
      const principal = getApiKeyPrincipal(req);
      if (!principal) {
        return res.status(403).json({ message: "Invalid API key" });
      }

      if (!hasScope(principal, requiredScope)) {
        return res.status(403).json({ message: "API key does not grant the required scope" });
      }

      return next();
    }

    if (!hasAuthenticatedAdminSession(req)) {
      return res.status(401).json({ message: "Admin session or API key required" });
    }

    if (requireCsrfForSession) {
      return requireCsrf(req, res, next);
    }

    next();
  };
}

export function getApiKeyHeaderName() {
  return API_KEY_HEADER;
}
