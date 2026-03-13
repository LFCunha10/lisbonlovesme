import { formatTime } from "@/lib/utils";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SLASH_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const TWELVE_HOUR_TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i;
const TWENTY_FOUR_HOUR_TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatEditableConfirmationDate(value?: string | null): string {
  if (!value) return "";

  if (ISO_DATE_PATTERN.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export function normalizeConfirmationDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (ISO_DATE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const slashMatch = trimmed.match(SLASH_DATE_PATTERN);
  if (slashMatch) {
    const [, first, second, year] = slashMatch;
    const month = Number(first);
    const day = Number(second);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${pad(month)}-${pad(day)}`;
    }
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

export function formatEditableConfirmationTime(value?: string | null): string {
  if (!value) return "";

  const normalized = normalizeConfirmationTime(value);
  if (!normalized) {
    return value;
  }

  return formatTime(normalized);
}

export function normalizeConfirmationTime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const twelveHourMatch = trimmed.match(TWELVE_HOUR_TIME_PATTERN);
  if (twelveHourMatch) {
    const [, hourRaw, minuteRaw, periodRaw] = twelveHourMatch;
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
      return null;
    }

    const period = periodRaw.toUpperCase();
    const normalizedHour = period === "PM" ? (hour % 12) + 12 : hour % 12;
    return `${pad(normalizedHour)}:${pad(minute)}`;
  }

  const twentyFourHourMatch = trimmed.match(TWENTY_FOUR_HOUR_TIME_PATTERN);
  if (twentyFourHourMatch) {
    const [, hourRaw, minuteRaw] = twentyFourHourMatch;
    const hour = Number(hourRaw);
    const minute = Number(minuteRaw);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return `${pad(hour)}:${pad(minute)}`;
  }

  return null;
}
