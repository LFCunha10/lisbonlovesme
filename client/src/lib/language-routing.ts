export const SUPPORTED_LANGUAGES = ["en", "pt", "ru"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANGUAGE: SupportedLanguage = "en";
const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);
const EXCLUDED_PATH_PREFIXES = ["/admin", "/api", "/uploads"];
const EXTERNAL_PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const LANGUAGE_SESSION_COOKIE = "llm_lang_session";

function splitPath(value: string): { pathname: string; search: string; hash: string } {
  const hashIndex = value.indexOf("#");
  const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;

  const searchIndex = withoutHash.indexOf("?");
  const pathname = searchIndex >= 0 ? withoutHash.slice(0, searchIndex) : withoutHash;
  const search = searchIndex >= 0 ? withoutHash.slice(searchIndex) : "";

  return {
    pathname: pathname || "/",
    search,
    hash,
  };
}

function isExternalPath(path: string): boolean {
  return path.startsWith("//") || EXTERNAL_PROTOCOL_PATTERN.test(path);
}

export function normalizeLanguage(language?: string | null): SupportedLanguage {
  const normalized = (language || "").toLowerCase().split("-")[0];
  if (SUPPORTED_LANGUAGE_SET.has(normalized)) {
    return normalized as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
}

export function getLanguageFromPath(pathname: string): SupportedLanguage | null {
  const [firstSegment] = pathname.replace(/^\/+/, "").split("/");
  if (!firstSegment) {
    return null;
  }

  const normalizedSegment = firstSegment.toLowerCase();
  const normalizedLanguage = normalizeLanguage(normalizedSegment);
  const isExactLanguage = SUPPORTED_LANGUAGE_SET.has(normalizedSegment);
  const isLanguageVariant = normalizedSegment.startsWith(`${normalizedLanguage}-`);

  return isExactLanguage || isLanguageVariant ? normalizedLanguage : null;
}

export function stripLanguageFromPath(pathname: string): string {
  const normalizedPath = pathname || "/";
  const [firstSegment, ...restSegments] = normalizedPath.replace(/^\/+/, "").split("/");

  if (!firstSegment) {
    return "/";
  }

  const language = getLanguageFromPath(`/${firstSegment}`);
  if (!language) {
    return normalizedPath;
  }

  const strippedPath = restSegments.join("/");
  return strippedPath ? `/${strippedPath}` : "/";
}

export function isLanguageExcludedPath(pathname: string): boolean {
  const barePath = stripLanguageFromPath(pathname);
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => barePath === prefix || barePath.startsWith(`${prefix}/`),
  );
}

export function getPreferredLanguage(
  pathname: string,
  fallbackLanguage?: string | null,
): SupportedLanguage {
  const languageFromPath = getLanguageFromPath(pathname);
  if (languageFromPath) {
    return languageFromPath;
  }

  if (fallbackLanguage) {
    return normalizeLanguage(fallbackLanguage);
  }

  if (typeof document !== "undefined") {
    const cookiePrefix = `${LANGUAGE_SESSION_COOKIE}=`;
    const storedLanguage = document.cookie
      .split(";")
      .map((cookiePart) => cookiePart.trim())
      .find((cookiePart) => cookiePart.startsWith(cookiePrefix))
      ?.slice(cookiePrefix.length);

    if (storedLanguage) {
      return normalizeLanguage(decodeURIComponent(storedLanguage));
    }
  }

  return DEFAULT_LANGUAGE;
}

export function withLanguagePrefix(path: string, language: string): string {
  if (!path || path.startsWith("#") || isExternalPath(path)) {
    return path;
  }

  const { pathname, search, hash } = splitPath(path);
  const normalizedPathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (isLanguageExcludedPath(normalizedPathname)) {
    const barePath = stripLanguageFromPath(normalizedPathname);
    return `${barePath}${search}${hash}`;
  }

  const barePath = stripLanguageFromPath(normalizedPathname);
  const normalizedLanguage = normalizeLanguage(language);
  const localizedPath = barePath === "/" ? `/${normalizedLanguage}` : `/${normalizedLanguage}${barePath}`;

  return `${localizedPath}${search}${hash}`;
}
