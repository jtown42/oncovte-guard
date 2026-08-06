/**
 * F10 (WS-5): `?asof=YYYY-MM-DD` pins the reference date for lab staleness.
 */
import { describe, it, expect } from "vitest";
import { getAsOfDate } from "../../src/ui/asof";

describe("getAsOfDate", () => {
  it("parses a valid ?asof date (noon UTC)", () => {
    const d = getAsOfDate("?asof=2026-07-16");
    expect(d.toISOString()).toBe("2026-07-16T12:00:00.000Z");
  });

  it("falls back to now for a missing or malformed value", () => {
    const before = Date.now();
    for (const s of ["", "?asof=nope", "?asof=2026-13-40", "?foo=bar"]) {
      const d = getAsOfDate(s);
      expect(d.getTime()).toBeGreaterThanOrEqual(before);
    }
  });
});
