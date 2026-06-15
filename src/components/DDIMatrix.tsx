/**
 * DOAC × medication interaction display.
 *
 * On the dashboard we lead with a compact `DDISummary` — a single headline of
 * the worst detected interaction plus a per-severity tally — because a wall of
 * 4×N severity cells is unreadable to a live audience. The full grid (`DDIMatrix`)
 * is one click away in a modal for anyone who wants the per-DOAC detail.
 */
import { useEffect, useState } from "react";
import type { DDICheckResult } from "../types/ddi";
import { DOAC_NAMES } from "../types/ddi";
import type { DDISeverity } from "../types/ddi";
import { Card, Pill } from "./primitives";
import { Flash } from "./Flash";
import {
  severityTone,
  SEVERITY_CELL,
  SEVERITY_LABEL,
  TONE_PILL,
  TONE_BANNER,
  type Tone,
} from "../ui/format";

/* ---------- compact summary (dashboard) ---------- */

/** Worst-first severity ranking used to pick the headline interaction. */
const SEVERITY_RANK: Record<DDISeverity, number> = {
  major: 5,
  moderate: 4,
  pharmacodynamic: 3,
  minor: 2,
  unknown: 1,
  none: 0,
};

const TALLY_ORDER: DDISeverity[] = [
  "major",
  "moderate",
  "pharmacodynamic",
  "minor",
  "none",
  "unknown",
];

interface Headline {
  severity: DDISeverity;
  tone: Tone;
  icon: string;
  title: string;
  detail: string | null;
}

function buildHeadline(results: DDICheckResult[]): Headline {
  const worst = results.reduce<DDISeverity>(
    (acc, r) =>
      SEVERITY_RANK[r.worstSeverity] > SEVERITY_RANK[acc] ? r.worstSeverity : acc,
    "none",
  );
  const offenders = results
    .filter((r) => r.worstSeverity === worst)
    .map((r) => r.medication);
  const list = offenders.join(", ");

  switch (worst) {
    case "major":
      return {
        severity: worst,
        tone: "danger",
        icon: "⛔",
        title: `${offenders.length} major interaction${offenders.length === 1 ? "" : "s"} detected`,
        detail: `${list} — a DOAC is unsafe with this therapy. LMWH may be preferred.`,
      };
    case "moderate":
      return {
        severity: worst,
        tone: "warning",
        icon: "⚠️",
        title: `${offenders.length} moderate interaction${offenders.length === 1 ? "" : "s"}`,
        detail: `${list} — monitor closely or adjust.`,
      };
    case "pharmacodynamic":
      return {
        severity: worst,
        tone: "warning",
        icon: "⚠️",
        title: "Additive bleeding risk",
        detail: `${list} — pharmacodynamic bleeding risk independent of DOAC levels.`,
      };
    case "minor":
      return {
        severity: worst,
        tone: "caution",
        icon: "ℹ️",
        title: "Only minor interactions",
        detail: `${list} — no change to anticoagulant selection.`,
      };
    default:
      return {
        severity: "none",
        tone: "good",
        icon: "✓",
        title: "No significant DOAC interactions",
        detail: null,
      };
  }
}

export function DDISummary({ results }: { results: DDICheckResult[] }) {
  const [open, setOpen] = useState(false);

  if (results.length === 0) {
    return (
      <Card title="DOAC ↔ Therapy Interactions">
        <p className="text-sm text-clinical-muted">
          No active medications to screen.
        </p>
      </Card>
    );
  }

  const headline = buildHeadline(results);
  const counts = TALLY_ORDER.map((sev) => ({
    sev,
    count: results.filter((r) => r.worstSeverity === sev).length,
  })).filter((t) => t.count > 0);

  return (
    <Card
      title="DOAC ↔ Therapy Interactions"
      right={
        <span className="text-xs text-clinical-muted">
          {results.length} medication{results.length === 1 ? "" : "s"} screened
        </span>
      }
    >
      <Flash watch={headline.severity} tone={headline.tone}>
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${TONE_BANNER[headline.tone]}`}
        >
          <span className="text-lg leading-none" aria-hidden>
            {headline.icon}
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{headline.title}</p>
            {headline.detail && (
              <p className="mt-0.5 text-sm opacity-90">{headline.detail}</p>
            )}
          </div>
        </div>
      </Flash>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {counts.map((t) => (
          <Pill key={t.sev} tone={severityTone(t.sev)}>
            {t.count} {SEVERITY_LABEL[t.sev]}
          </Pill>
        ))}
        <button
          onClick={() => setOpen(true)}
          className="ml-auto rounded-md border border-clinical-border bg-white px-3 py-1.5 text-xs font-medium text-clinical-brand hover:border-clinical-brand"
        >
          View full matrix →
        </button>
      </div>

      {open && (
        <Modal
          title="DOAC ↔ Therapy interaction matrix"
          onClose={() => setOpen(false)}
        >
          <DDIMatrix results={results} />
        </Modal>
      )}
    </Card>
  );
}

/* ---------- modal shell ---------- */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl border border-clinical-border bg-clinical-panel shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-clinical-border bg-clinical-panel px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-clinical-muted">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-md text-clinical-muted hover:bg-slate-100 hover:text-clinical-ink"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- full matrix (inside the modal) ---------- */

export function DDIMatrix({ results }: { results: DDICheckResult[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (results.length === 0) {
    return (
      <p className="text-sm text-clinical-muted">No active medications to screen.</p>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-clinical-panel py-2 pr-3 text-left text-xs font-medium uppercase tracking-wide text-clinical-muted">
                Medication
              </th>
              {DOAC_NAMES.map((d) => (
                <th
                  key={d}
                  className="px-1.5 py-2 text-center text-xs font-medium capitalize text-clinical-muted"
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <RowGroup
                key={`${r.rxnormCode}-${i}`}
                result={r}
                expanded={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Legend />
    </div>
  );
}

function RowGroup({
  result,
  expanded,
  onToggle,
}: {
  result: DDICheckResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-t border-clinical-border hover:bg-slate-50"
        onClick={onToggle}
      >
        <td className="sticky left-0 bg-inherit py-2 pr-3">
          <button className="flex items-center gap-1.5 text-left font-medium">
            <span
              className={`transition-transform ${expanded ? "rotate-90" : ""}`}
              aria-hidden
            >
              ▸
            </span>
            <span className="capitalize">{result.medication}</span>
          </button>
        </td>
        {DOAC_NAMES.map((d) => {
          const sev = result.perDoac[d].severity;
          return (
            <td key={d} className="px-1 py-1.5 text-center">
              <span
                className={`inline-block min-w-[3.25rem] rounded-md px-1.5 py-1 text-xs font-semibold ${TONE_PILL[severityTone(sev)]}`}
                title={SEVERITY_LABEL[sev]}
              >
                {SEVERITY_CELL[sev]}
              </span>
            </td>
          );
        })}
      </tr>
      {expanded && (
        <tr className="bg-slate-50/70">
          <td colSpan={DOAC_NAMES.length + 1} className="px-3 py-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {DOAC_NAMES.map((d) => {
                const detail = result.perDoac[d];
                return (
                  <div
                    key={d}
                    className="rounded-lg border border-clinical-border bg-white p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-semibold capitalize">{d}</span>
                      <Pill tone={severityTone(detail.severity)}>
                        {SEVERITY_LABEL[detail.severity]}
                      </Pill>
                    </div>
                    <p className="text-xs text-clinical-muted">
                      <span className="font-medium text-clinical-ink">
                        Mechanism:
                      </span>{" "}
                      {detail.mechanism}
                    </p>
                    <p className="mt-1 text-xs text-clinical-muted">
                      <span className="font-medium text-clinical-ink">
                        Action:
                      </span>{" "}
                      {detail.recommendation}
                    </p>
                    {detail.alternativeDoac && (
                      <p className="mt-1 text-xs">
                        <span className="font-medium">Prefer:</span>{" "}
                        <span className="capitalize">{detail.alternativeDoac}</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Legend() {
  const items: { tone: Tone; label: string }[] = [
    { tone: "danger", label: "Major" },
    { tone: "warning", label: "Moderate / Additive bleeding" },
    { tone: "caution", label: "Minor" },
    { tone: "good", label: "None" },
    { tone: "neutral", label: "Unknown" },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-clinical-muted">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className={`inline-block h-3 w-3 rounded ${TONE_PILL[it.tone]}`}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
