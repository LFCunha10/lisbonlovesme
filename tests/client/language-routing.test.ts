import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getLanguageFromPath,
  getPreferredLanguage,
  isLanguageExcludedPath,
  normalizeLanguage,
  stripLanguageFromPath,
  withLanguagePrefix,
} from "../../client/src/lib/language-routing";

describe("client/lib/language-routing", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes language codes", () => {
    expect(normalizeLanguage("pt-BR")).toBe("pt");
    expect(normalizeLanguage("ru-RU")).toBe("ru");
    expect(normalizeLanguage("es-ES")).toBe("en");
    expect(normalizeLanguage()).toBe("en");
  });

  it("extracts language from path", () => {
    expect(getLanguageFromPath("/pt/tours")).toBe("pt");
    expect(getLanguageFromPath("/ru-RU/tours")).toBe("ru");
    expect(getLanguageFromPath("/tours")).toBeNull();
  });

  it("strips language prefix from path", () => {
    expect(stripLanguageFromPath("/pt/tours")).toBe("/tours");
    expect(stripLanguageFromPath("/ru")).toBe("/");
    expect(stripLanguageFromPath("/admin")).toBe("/admin");
  });

  it("detects excluded paths", () => {
    expect(isLanguageExcludedPath("/admin")).toBe(true);
    expect(isLanguageExcludedPath("/pt/api/bookings")).toBe(true);
    expect(isLanguageExcludedPath("/ru/uploads/image.jpg")).toBe(true);
    expect(isLanguageExcludedPath("/pt/tours")).toBe(false);
  });

  it("adds language prefix when needed", () => {
    expect(withLanguagePrefix("/tours", "pt-BR")).toBe("/pt/tours");
    expect(withLanguagePrefix("/tours?x=1#y", "ru")).toBe("/ru/tours?x=1#y");
  });

  it("keeps excluded, anchor and external paths unchanged", () => {
    expect(withLanguagePrefix("/admin/login", "ru")).toBe("/admin/login");
    expect(withLanguagePrefix("#section", "pt")).toBe("#section");
    expect(withLanguagePrefix("https://example.com/page", "ru")).toBe("https://example.com/page");
  });

  it("gets preferred language from path first, then fallback, then cookie", () => {
    expect(getPreferredLanguage("/ru/tours", "pt")).toBe("ru");
    expect(getPreferredLanguage("/tours", "pt-BR")).toBe("pt");

    vi.stubGlobal("document", { cookie: "foo=bar; llm_lang_session=ru" });
    expect(getPreferredLanguage("/tours")).toBe("ru");
  });
});
