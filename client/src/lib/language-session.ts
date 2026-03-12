import { normalizeLanguage, type SupportedLanguage } from "@/lib/language-routing";

export const LANGUAGE_SESSION_COOKIE = "llm_lang_session";

export function getSessionLanguageCookie(): SupportedLanguage | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${LANGUAGE_SESSION_COOKIE}=`;
  const cookieValue = document.cookie
    .split(";")
    .map((cookiePart) => cookiePart.trim())
    .find((cookiePart) => cookiePart.startsWith(cookiePrefix))
    ?.slice(cookiePrefix.length);

  if (!cookieValue) {
    return null;
  }

  return normalizeLanguage(decodeURIComponent(cookieValue));
}

export function setSessionLanguageCookie(language: string): SupportedLanguage {
  const normalizedLanguage = normalizeLanguage(language);
  document.cookie = `${LANGUAGE_SESSION_COOKIE}=${encodeURIComponent(normalizedLanguage)}; path=/; SameSite=Lax`;
  return normalizedLanguage;
}
