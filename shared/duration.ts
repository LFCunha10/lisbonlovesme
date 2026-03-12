export type SupportedLanguage = "en" | "pt" | "ru";

function normalizeLanguage(language?: string): SupportedLanguage {
  if (!language) return "en";
  if (language.startsWith("pt")) return "pt";
  if (language.startsWith("ru")) return "ru";
  return "en";
}

function parseHoursFromText(value: string): number | null {
  const match = value.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const numericValue = Number(match[1].replace(",", "."));
  if (!Number.isFinite(numericValue)) return null;
  return Math.max(1, Math.round(numericValue));
}

export function parseDurationHours(value: unknown, fallback = 1): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }

  if (typeof value === "string") {
    return parseHoursFromText(value) ?? fallback;
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;

    for (const key of ["en", "pt", "ru", "value"]) {
      const candidate = source[key];
      const parsed =
        typeof candidate === "number" || typeof candidate === "string"
          ? parseDurationHours(candidate, fallback)
          : null;
      if (parsed && parsed >= 1) {
        return parsed;
      }
    }
  }

  return fallback;
}

function getRussianHourWord(hours: number): string {
  const mod10 = hours % 10;
  const mod100 = hours % 100;

  if (mod10 === 1 && mod100 !== 11) return "час";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "часа";
  return "часов";
}

export function formatDurationHours(value: unknown, language?: string): string {
  const hours = parseDurationHours(value);
  const lang = normalizeLanguage(language);

  if (lang === "pt") {
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  if (lang === "ru") {
    return `${hours} ${getRussianHourWord(hours)}`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}
