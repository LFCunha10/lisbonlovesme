import { describe, expect, it } from "vitest";
import {
  formatEditableConfirmationDate,
  formatEditableConfirmationTime,
  normalizeConfirmationDate,
  normalizeConfirmationTime,
} from "../../client/src/lib/booking-confirmation-inputs";

describe("client/lib/booking-confirmation-inputs", () => {
  it("formats confirmation date values for editing", () => {
    expect(formatEditableConfirmationDate("2026-03-13")).toBe("2026-03-13");
    expect(formatEditableConfirmationDate("2026-03-13T10:30:00.000Z")).toBe("2026-03-13");
  });

  it("normalizes editable dates to ISO format", () => {
    expect(normalizeConfirmationDate("2026-03-13")).toBe("2026-03-13");
    expect(normalizeConfirmationDate("3/13/2026")).toBe("2026-03-13");
    expect(normalizeConfirmationDate("13/13/2026")).toBeNull();
  });

  it("formats and normalizes confirmation times", () => {
    expect(formatEditableConfirmationTime("16:30")).toBe("4:30 PM");
    expect(normalizeConfirmationTime("4:30 PM")).toBe("16:30");
    expect(normalizeConfirmationTime("04:30")).toBe("04:30");
    expect(normalizeConfirmationTime("25:30")).toBeNull();
  });
});
