import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatTime,
  generateTimeSlots,
  getDaysInMonth,
  getFirstDayOfMonth,
  isPastDate,
  isSameDay,
} from "../../client/src/lib/utils";

describe("client/lib/utils", () => {
  it("formats currency in cents", () => {
    const value = formatCurrency(12345, "EUR");
    expect(value).toContain("123.45");
    expect(value).toContain("€");
  });

  it("formats date and time", () => {
    expect(formatDate("2026-01-15T10:30:00.000Z")).toContain("2026");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime("12:30")).toBe("12:30 PM");
    expect(formatTime("23:59")).toBe("11:59 PM");
  });

  it("generates time slots and calendar helpers", () => {
    expect(generateTimeSlots(9, 10, 30)).toEqual(["09:00", "09:30"]);
    expect(getDaysInMonth(2024, 1)).toBe(29);
    expect(getFirstDayOfMonth(2026, 0)).toBeTypeOf("number");
  });

  it("compares and classifies dates", () => {
    const now = new Date();
    const sameDay = new Date(now);
    sameDay.setHours(0, 0, 0, 0);
    expect(isSameDay(now, sameDay)).toBe(true);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(isPastDate(yesterday)).toBe(true);
    expect(isPastDate(tomorrow)).toBe(false);
  });
});
