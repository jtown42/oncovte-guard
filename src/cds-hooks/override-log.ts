/**
 * WS-4: append-only override log (demo build).
 *
 * When a clinician overrides an interruptive card, the reason is POSTed and
 * appended here as one JSON object per line (JSONL). The /metrics route reads it
 * back to compute override rate by reason — the feedback loop the CDS literature
 * requires so repeatedly-overridden alerts can be demoted from active to passive.
 *
 * Node-only (uses fs); imported by the CDS server, never by the browser bundle.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";

const LOG_PATH = process.env.OVERRIDE_LOG_PATH ?? "override-log.jsonl";

/** A valid override-reason code (mirrors OVERRIDE_REASONS in cards.ts). */
export interface OverrideEntry {
  timestamp: string;
  reasonCode: string;
  reasonDisplay?: string;
  cardUuid?: string;
  patientId?: string;
  note?: string;
}

/** Append one override to the log (creates the file on first write). */
export function appendOverride(
  entry: Omit<OverrideEntry, "timestamp">,
  path: string = LOG_PATH,
): OverrideEntry {
  const full: OverrideEntry = { ...entry, timestamp: new Date().toISOString() };
  appendFileSync(path, `${JSON.stringify(full)}\n`, "utf-8");
  return full;
}

/** Read the log and tally overrides by reason code. Missing file → empty. */
export function readOverrideReasonCounts(
  path: string = LOG_PATH,
): Record<string, number> {
  if (!existsSync(path)) return {};
  const counts: Record<string, number> = {};
  const lines = readFileSync(path, "utf-8").split("\n").filter(Boolean);
  for (const line of lines) {
    try {
      const e = JSON.parse(line) as OverrideEntry;
      if (e.reasonCode) counts[e.reasonCode] = (counts[e.reasonCode] ?? 0) + 1;
    } catch {
      // Skip malformed lines — the log is append-only and best-effort.
    }
  }
  return counts;
}
