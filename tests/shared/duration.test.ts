import { describe, expect, it } from "vitest";
import { formatDurationHours, parseDurationHours } from "../../shared/duration";

describe("shared/duration", () => {
  describe("parseDurationHours", () => {
    it("parses numbers and rounds with minimum 1", () => {
      expect(parseDurationHours(2.2)).toBe(2);
      expect(parseDurationHours(0)).toBe(1);
    });

    it("parses strings with comma or dot decimal separators", () => {
      expect(parseDurationHours("2,5 hours")).toBe(3);
      expect(parseDurationHours("3.1h")).toBe(3);
    });

    it("parses multilingual object values in priority order", () => {
      expect(parseDurationHours({ en: "2 hours", pt: "2 horas", ru: "2 часа" })).toBe(2);
      expect(parseDurationHours({ pt: "3 horas" })).toBe(3);
    });

    it("falls back when input is invalid", () => {
      expect(parseDurationHours(undefined, 5)).toBe(5);
      expect(parseDurationHours("not-a-duration", 4)).toBe(4);
    });
  });

  describe("formatDurationHours", () => {
    it("formats english", () => {
      expect(formatDurationHours(1, "en")).toBe("1 hour");
      expect(formatDurationHours(3, "en-US")).toBe("3 hours");
    });

    it("formats portuguese", () => {
      expect(formatDurationHours(1, "pt")).toBe("1 hora");
      expect(formatDurationHours(2, "pt-BR")).toBe("2 horas");
    });

    it("formats russian plural forms", () => {
      expect(formatDurationHours(1, "ru")).toBe("1 час");
      expect(formatDurationHours(2, "ru")).toBe("2 часа");
      expect(formatDurationHours(5, "ru")).toBe("5 часов");
      expect(formatDurationHours(21, "ru")).toBe("21 час");
    });
  });
});
