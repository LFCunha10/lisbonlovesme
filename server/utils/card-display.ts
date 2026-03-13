export function normalizeCardDisplayFlag(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") {
      return false;
    }

    if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") {
      return true;
    }
  }

  return true;
}
