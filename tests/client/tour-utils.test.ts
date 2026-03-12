import { describe, expect, it } from "vitest";
import { convertToMultilingual, getLocalizedText } from "../../client/src/lib/tour-utils";

describe("client/lib/tour-utils", () => {
  it("returns empty string for undefined content", () => {
    expect(getLocalizedText(undefined, "en")).toBe("");
  });

  it("returns plain string as-is", () => {
    expect(getLocalizedText("Legacy text", "pt")).toBe("Legacy text");
  });

  it("returns localized field from multilingual object", () => {
    const value = { en: "Hello", pt: "Ola", ru: "Privet" };
    expect(getLocalizedText(value, "pt-BR")).toBe("Ola");
    expect(getLocalizedText(value, "ru-RU")).toBe("Privet");
    expect(getLocalizedText(value, "es-ES")).toBe("Hello");
  });

  it("converts legacy text to multilingual object", () => {
    expect(convertToMultilingual("abc")).toEqual({
      en: "abc",
      pt: "abc",
      ru: "abc",
    });
  });
});
