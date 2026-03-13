import { describe, expect, it } from "vitest";
import { normalizeCardDisplayFlag } from "../../server/utils/card-display";

describe("normalizeCardDisplayFlag", () => {
  it("defaults missing values to visible", () => {
    expect(normalizeCardDisplayFlag(undefined)).toBe(true);
    expect(normalizeCardDisplayFlag(null)).toBe(true);
  });

  it("keeps explicit boolean values", () => {
    expect(normalizeCardDisplayFlag(true)).toBe(true);
    expect(normalizeCardDisplayFlag(false)).toBe(false);
  });

  it("parses serialized false-like values", () => {
    expect(normalizeCardDisplayFlag("false")).toBe(false);
    expect(normalizeCardDisplayFlag("0")).toBe(false);
    expect(normalizeCardDisplayFlag("off")).toBe(false);
    expect(normalizeCardDisplayFlag("no")).toBe(false);
    expect(normalizeCardDisplayFlag(0)).toBe(false);
  });

  it("parses serialized true-like values", () => {
    expect(normalizeCardDisplayFlag("true")).toBe(true);
    expect(normalizeCardDisplayFlag("1")).toBe(true);
    expect(normalizeCardDisplayFlag("on")).toBe(true);
    expect(normalizeCardDisplayFlag("yes")).toBe(true);
    expect(normalizeCardDisplayFlag(1)).toBe(true);
  });
});
