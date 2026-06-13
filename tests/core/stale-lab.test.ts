/**
 * Stale-lab detection unit tests.
 * A value older than 30 days is stale; exactly 30 days is not.
 */

import { describe, it, expect } from "vitest";
import {
  isLabStale,
  isLabValueStale,
  labAgeDays,
  getStaleWarning,
} from "../../src/core/stale-lab";
import type { LabValue } from "../../src/types/patient";

const NOW = new Date("2026-06-10T12:00:00Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function lab(date: string): LabValue {
  return { value: 200, unit: "10*3/uL", date, loincCode: "777-3", isStale: false };
}

describe("isLabStale", () => {
  it("Test 1: a fresh lab (5 days old) is not stale", () => {
    expect(isLabStale(daysAgo(5), NOW)).toBe(false);
  });

  it("Test 2: exactly 30 days old is NOT stale (boundary)", () => {
    expect(isLabStale(daysAgo(30), NOW)).toBe(false);
  });

  it("Test 3: 31 days old IS stale", () => {
    expect(isLabStale(daysAgo(31), NOW)).toBe(true);
  });

  it("Test 4: a missing/unparseable date is treated as stale", () => {
    expect(isLabStale("", NOW)).toBe(true);
    expect(isLabStale("not-a-date", NOW)).toBe(true);
  });
});

describe("labAgeDays", () => {
  it("computes whole-day age and returns null for bad input", () => {
    expect(labAgeDays(daysAgo(10), NOW)).toBe(10);
    expect(labAgeDays("", NOW)).toBeNull();
  });
});

describe("isLabValueStale", () => {
  it("a null lab is absent, not stale", () => {
    expect(isLabValueStale(null, NOW)).toBe(false);
  });

  it("flags an old LabValue", () => {
    expect(isLabValueStale(lab(daysAgo(45)), NOW)).toBe(true);
  });
});

describe("getStaleWarning", () => {
  it("lists only the stale fields and builds a warning string", () => {
    const { staleFields, warning } = getStaleWarning(
      {
        platelets: lab(daysAgo(45)),
        hemoglobin: lab(daysAgo(5)),
        serumCreatinine: null,
      },
      NOW,
    );
    expect(staleFields).toEqual(["platelets"]);
    expect(warning).toContain("platelets");
  });

  it("returns an empty warning when nothing is stale", () => {
    const { staleFields, warning } = getStaleWarning(
      { platelets: lab(daysAgo(2)) },
      NOW,
    );
    expect(staleFields).toHaveLength(0);
    expect(warning).toBe("");
  });
});
