import { describe, expect, it, vi } from "vitest";
import { generateICSFile } from "../../server/utils/ics-generator";

describe("server/utils/ics-generator", () => {
  it("throws for invalid start date", () => {
    expect(() =>
      generateICSFile({
        summary: "Tour",
        description: "Desc",
        location: "Lisbon",
        start: "bad-date",
        duration: "2 hours",
      }),
    ).toThrow("Invalid start date");
  });

  it("throws for invalid duration", () => {
    expect(() =>
      generateICSFile({
        summary: "Tour",
        description: "Desc",
        location: "Lisbon",
        start: "2026-03-15T10:00:00.000Z",
        duration: "abc",
      }),
    ).toThrow("Invalid duration format");
  });

  it("generates valid UTC ICS payload with CRLF", () => {
    vi.spyOn(Date, "now").mockReturnValue(1700000000000);
    const ics = generateICSFile({
      summary: "Historic Tour",
      description: "Line 1\nLine 2",
      location: "Lisbon, PT",
      start: "2026-03-15T10:00:00.000Z",
      duration: "2 hours",
      url: "https://example.com",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:event-1700000000000@lisbonlovesme.com");
    expect(ics).toContain("DTSTART:20260315T100000Z");
    expect(ics).toContain("DTEND:20260315T120000Z");
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2");
    expect(ics).toContain("LOCATION:Lisbon\\, PT");
    expect(ics).toContain("URL:https://example.com");
    expect(ics).toContain("\r\n");
  });

  it("supports timezone-based DTSTART/DTEND", () => {
    const ics = generateICSFile({
      summary: "Lisbon Tour",
      description: "Desc",
      location: "Lisbon",
      start: "2026-06-15T10:00:00.000Z",
      duration: "3 hours",
      tzid: "Europe/Lisbon",
    });

    expect(ics).toContain("DTSTART;TZID=Europe/Lisbon:");
    expect(ics).toContain("DTEND;TZID=Europe/Lisbon:");
    expect(ics).not.toContain("DTSTART:20260615T100000Z");
  });
});
