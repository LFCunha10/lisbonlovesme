import { describe, expect, it } from "vitest";
import { getLocalizedText } from "../../server/utils/tour-utils";

describe("server/utils/tour-utils", () => {
  it("returns empty string for nullish text", () => {
    expect(getLocalizedText(undefined)).toBe("");
    expect(getLocalizedText(null)).toBe("");
  });

  it("returns plain string values as-is", () => {
    expect(getLocalizedText("legacy value", "pt")).toBe("legacy value");
  });

  it("returns requested localized value and falls back", () => {
    expect(getLocalizedText({ en: "One", pt: "Um", ru: "Odin" }, "pt-BR")).toBe("Um");
    expect(getLocalizedText({ en: "One", pt: "Um", ru: "Odin" }, "ru-RU")).toBe("Odin");
    expect(getLocalizedText({ en: "One", pt: "Um", ru: "Odin" }, "de-DE")).toBe("One");
    expect(getLocalizedText({ en: "", pt: "Um", ru: "" }, "en")).toBe("Um");
  });
});
