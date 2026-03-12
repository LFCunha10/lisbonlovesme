import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

function readLocale(locale: "en" | "pt" | "ru"): JsonObject {
  const filePath = path.resolve(process.cwd(), "client/src/i18n/locales", `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as JsonObject;
}

function flattenKeys(source: JsonObject, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(source)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as JsonObject, fullKey));
      continue;
    }
    keys.push(fullKey);
  }

  return keys;
}

function flattenValues(source: JsonObject): string[] {
  const values: string[] = [];
  for (const value of Object.values(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      values.push(...flattenValues(value as JsonObject));
      continue;
    }
    values.push(String(value ?? ""));
  }
  return values;
}

describe("i18n locales", () => {
  it("keeps pt/ru translation keyset aligned with en", () => {
    const en = readLocale("en");
    const pt = readLocale("pt");
    const ru = readLocale("ru");

    const enKeys = new Set(flattenKeys(en));
    const ptKeys = new Set(flattenKeys(pt));
    const ruKeys = new Set(flattenKeys(ru));

    expect([...ptKeys].filter((key) => !enKeys.has(key))).toEqual([]);
    expect([...ruKeys].filter((key) => !enKeys.has(key))).toEqual([]);
    expect([...enKeys].filter((key) => !ptKeys.has(key))).toEqual([]);
    expect([...enKeys].filter((key) => !ruKeys.has(key))).toEqual([]);
  });

  it("ensures no empty translation values", () => {
    const locales = [readLocale("en"), readLocale("pt"), readLocale("ru")];
    for (const locale of locales) {
      const values = flattenValues(locale);
      expect(values.every((value) => value.trim().length > 0)).toBe(true);
    }
  });
});
