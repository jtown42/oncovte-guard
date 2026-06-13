/**
 * Stale-lab detection.
 *
 * Source of truth: plan/ddi-info.md Part 1E / Part 11.
 * A laboratory value older than 30 days is considered stale: the Khorana score
 * and renal dosing depend on a current CBC and creatinine, so an out-of-date
 * value should be surfaced to the clinician rather than silently trusted.
 */

import type { LabValue } from "../types/patient";

/** Age (in days) beyond which a lab is considered stale. */
export const STALE_LAB_THRESHOLD_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Whole-day age of a lab relative to a reference date (default: now).
 * Returns null if the date is missing or unparseable.
 */
export function labAgeDays(
  labDate: string,
  now: Date = new Date(),
): number | null {
  if (!labDate) return null;
  const drawn = new Date(labDate);
  const t = drawn.getTime();
  if (Number.isNaN(t)) return null;
  const diffMs = now.getTime() - t;
  return Math.floor(diffMs / MS_PER_DAY);
}

/**
 * True when a lab is older than STALE_LAB_THRESHOLD_DAYS. A value drawn exactly
 * 30 days ago is NOT stale; 31 days is. A missing/unparseable date is treated
 * as stale (conservative).
 */
export function isLabStale(labDate: string, now: Date = new Date()): boolean {
  const age = labAgeDays(labDate, now);
  if (age === null) return true;
  return age > STALE_LAB_THRESHOLD_DAYS;
}

/** Convenience: stale check for a LabValue (null lab -> not stale, just absent). */
export function isLabValueStale(
  lab: LabValue | null,
  now: Date = new Date(),
): boolean {
  if (lab === null) return false;
  return isLabStale(lab.date, now);
}

/**
 * Given a map of named labs, return the names of those that are stale, plus a
 * single human-readable warning string (empty when nothing is stale).
 */
export function getStaleWarning(
  labs: Record<string, LabValue | null>,
  now: Date = new Date(),
): { staleFields: string[]; warning: string } {
  const staleFields: string[] = [];
  for (const [name, lab] of Object.entries(labs)) {
    if (isLabValueStale(lab, now)) {
      staleFields.push(name);
    }
  }
  const warning =
    staleFields.length === 0
      ? ""
      : `The following labs are older than ${STALE_LAB_THRESHOLD_DAYS} days and may not reflect the current clinical picture: ${staleFields.join(
          ", ",
        )}. Consider re-checking before acting on this recommendation.`;
  return { staleFields, warning };
}
