/**
 * The clinical centerpiece: overall action hero + the preferred / alternative /
 * avoid anticoagulant options. Reflects ERRATA Issue 4 — only apixaban and
 * rivaroxaban are ever "preferred"; dabigatran/edoxaban appear only under Avoid.
 */
import type {
  DOACOption,
  ProphylaxisRecommendation,
} from "../types/recommendation";
import type { OverallAction } from "../types/recommendation";
import { Pill } from "./primitives";
import { Flash } from "./Flash";
import {
  ACTION,
  TONE_BANNER,
  TONE_SOLID,
  renalStatusTone,
  RENAL_STATUS_LABEL,
  severityTone,
  SEVERITY_LABEL,
} from "../ui/format";

/** Minimal stroke glyph per verdict — a clinical status mark, not an emoji. */
function VerdictIcon({ action }: { action: OverallAction }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (action) {
    case "recommend":
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
    case "caution":
      return (
        <svg {...common}>
          <path d="M12 3 2 20h20L12 3Z" />
          <path d="M12 10v4" />
          <path d="M12 17.5v.5" />
        </svg>
      );
    case "contraindicated":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case "not_indicated":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" />
        </svg>
      );
    case "excluded":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 7.5v.5" />
        </svg>
      );
  }
}

export function RecommendationPanel({
  rec,
}: {
  rec: ProphylaxisRecommendation;
}) {
  const action = ACTION[rec.overallAction];
  const showOptions =
    rec.overallAction === "recommend" || rec.overallAction === "caution";

  // F4 (WS-5): distinct LMWH-fallback label without changing overallAction/tone.
  const isLmwhVerdict = rec.verdictLabel === "recommend_lmwh";
  const heroLabel = isLmwhVerdict
    ? "Prophylaxis recommended — LMWH (DOACs blocked)"
    : action.label;
  const heroSummary = isLmwhVerdict
    ? "Both apixaban and rivaroxaban are blocked; LMWH is the NCCN-concordant choice (never dabigatran/edoxaban)."
    : action.summary;

  return (
    <section className="card overflow-hidden">
      {/* Hero banner — flashes on every verdict change so the flip lands on stage. */}
      <Flash watch={rec.overallAction} tone={action.tone}>
        <div className={`flex items-start gap-3 px-4 py-3.5 ${TONE_BANNER[action.tone]}`}>
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-white ${TONE_SOLID[action.tone]}`}
            aria-hidden
          >
            <VerdictIcon action={rec.overallAction} />
          </span>
          <div className="min-w-0">
            <h2 className="verdict-hero font-bold">{heroLabel}</h2>
            <p className="mt-1 text-sm opacity-90">{heroSummary}</p>
          </div>
        </div>
      </Flash>

      <div className="card-body space-y-3.5">
        {rec.staleLabWarning && (
          <p className="rounded-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-base text-amber-900">
            <span className="font-semibold">Caution.</span> This decision uses
            laboratory values older than 30 days ({rec.staleLabFields.join(", ")}
            ). Please re-check before acting.
          </p>
        )}

        {showOptions ? (
          <>
            <OptionGroup
              heading="Preferred"
              subheading="NCCN-supported ambulatory prophylaxis"
              tone="good"
              options={rec.preferredOptions}
              emptyNote="No DOAC is currently appropriate — see alternatives."
            />
            {rec.alternativeOptions.length > 0 && (
              <OptionGroup
                heading="Alternative"
                subheading={
                  rec.preferredOptions.length === 0
                    ? "DOACs blocked — use LMWH (never dabigatran/edoxaban)"
                    : "LMWH — NCCN-concordant alternative"
                }
                tone="warning"
                options={rec.alternativeOptions}
              />
            )}
            <AvoidList options={rec.avoidOptions} />
          </>
        ) : (
          <p className="text-sm text-clinical-muted">
            No pharmacologic anticoagulant options are presented for this
            pathway. Review the alerts and contraindications below.
          </p>
        )}
      </div>
    </section>
  );
}

function OptionGroup({
  heading,
  subheading,
  tone,
  options,
  emptyNote,
}: {
  heading: string;
  subheading: string;
  tone: "good" | "warning";
  options: DOACOption[];
  emptyNote?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <h3 className="text-base font-semibold text-clinical-ink">
          {heading}
        </h3>
        <span className="text-xs text-clinical-muted">{subheading}</span>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-clinical-muted">{emptyNote}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {options.map((o) => (
            <OptionCard key={o.name} o={o} tone={tone} />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionCard({ o, tone }: { o: DOACOption; tone: "good" | "warning" }) {
  const ring = tone === "good" ? "ring-emerald-200" : "ring-amber-200";
  return (
    <div className={`rounded-sm border border-clinical-border bg-white p-3 ring-1 ${ring}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xl font-semibold capitalize">{o.name}</span>
        {/* "renal: Standard" was shorthand for the reader who already knows the
            data model. Say what it means to the person prescribing. */}
        <Pill tone={renalStatusTone(o.renalStatus)}>
          {RENAL_STATUS_LABEL[o.renalStatus] === "Standard"
            ? "Standard dose for kidney function"
            : `Kidney function: ${RENAL_STATUS_LABEL[o.renalStatus].toLowerCase()}`}
        </Pill>
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums text-clinical-ink">
        {[o.dose, o.route, o.frequency].filter(Boolean).join(" ")}
      </p>
      {o.duration && (
        <p className="text-sm text-clinical-muted">{o.duration}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Pill tone={severityTone(o.worstDDI)}>
          {o.worstDDI === "none"
            ? "No drug interaction"
            : `${SEVERITY_LABEL[o.worstDDI]} drug interaction`}
        </Pill>
      </div>
    </div>
  );
}

function AvoidList({ options }: { options: DOACOption[] }) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-base font-semibold text-rose-700">
        Avoid / not an option
      </h3>
      <ul className="space-y-1.5">
        {options.map((o) => (
          <li
            key={o.name}
            className="flex flex-col gap-0.5 rounded-sm bg-slate-50 px-3 py-1.5 text-sm sm:flex-row sm:items-center sm:gap-3"
          >
            <span className="font-semibold capitalize text-clinical-ink sm:w-28">
              {o.name}
            </span>
            <span className="text-clinical-muted">
              {o.ineligibleReason ?? "Not appropriate for this patient."}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
