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
import { Flash } from "./Flash";
import {
  ACTION,
  TONE_BANNER,
  TONE_SOLID,
  TONE_DOT,
  type Tone,
  renalStatusTone,
  RENAL_STATUS_LABEL,
  severityTone,
  SEVERITY_LABEL,
} from "../ui/format";

/** A small severity dot — carries state without a filled chip. */
function Dot({ tone }: { tone: Tone }) {
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`} />;
}

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
        <div className={`flex items-center gap-4 border-l-4 px-6 py-5 ${TONE_BANNER[action.tone]}`}>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${TONE_SOLID[action.tone]}`}
            aria-hidden
          >
            <VerdictIcon action={rec.overallAction} />
          </span>
          <div className="min-w-0">
            <h2 className="verdict-hero">{heroLabel}</h2>
            <p className="mt-1.5 max-w-[62ch] text-sm opacity-90">{heroSummary}</p>
          </div>
        </div>
      </Flash>

      <div className="card-body space-y-6">
        {rec.staleLabWarning && (
          <p className="rounded-md border-l-2 border-sev-caution bg-sev-cautionWash px-3 py-2 text-base text-sev-cautionInk">
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
  options,
  emptyNote,
}: {
  heading: string;
  subheading: string;
  options: DOACOption[];
  emptyNote?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline gap-3">
        <p className="eyebrow">{heading}</p>
        <span className="text-xs text-clinical-muted">{subheading}</span>
      </div>
      {options.length === 0 ? (
        <p className="border-t border-clinical-hairline pt-3 text-sm text-clinical-muted">
          {emptyNote}
        </p>
      ) : (
        <div className="grid gap-x-10 sm:grid-cols-2">
          {options.map((o) => (
            <OptionRow key={o.name} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}

/* A typeset prescription line, not a boxed card: the agent set in serif, the
   dose in mono, and small dots for kidney-function fit and interaction. */
function OptionRow({ o }: { o: DOACOption }) {
  const renalOk = o.renalStatus === "standard";
  return (
    <div className="flex flex-col gap-1 border-t border-clinical-hairline py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-serif text-lg font-medium capitalize text-clinical-ink">
          {o.name}
        </span>
        <span className="font-mono text-[0.95rem] font-medium tabular-nums text-clinical-ink">
          {[o.dose, o.route, o.frequency].filter(Boolean).join(" ")}
        </span>
      </div>
      {o.duration && <p className="text-sm text-clinical-muted">{o.duration}</p>}
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.82rem] text-clinical-inkSoft">
        <span className="inline-flex items-center gap-1.5">
          <Dot tone={renalStatusTone(o.renalStatus)} />
          {renalOk
            ? "Standard dose for kidney function"
            : `Kidney function: ${RENAL_STATUS_LABEL[o.renalStatus].toLowerCase()}`}
        </span>
        <span className="text-clinical-faint">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Dot tone={severityTone(o.worstDDI)} />
          {o.worstDDI === "none"
            ? "No interaction"
            : `${SEVERITY_LABEL[o.worstDDI]} interaction`}
        </span>
      </div>
    </div>
  );
}

function AvoidList({ options }: { options: DOACOption[] }) {
  if (options.length === 0) return null;
  return (
    <div>
      <p className="eyebrow mb-1">Not recommended here</p>
      <div>
        {options.map((o) => (
          <div
            key={o.name}
            className="grid gap-1 border-t border-clinical-hairline py-2.5 text-sm sm:grid-cols-[8rem_1fr] sm:gap-4"
          >
            <span className="font-serif text-[0.95rem] capitalize text-clinical-inkSoft">
              {o.name}
            </span>
            <span className="text-clinical-muted">
              {o.ineligibleReason ?? "Not appropriate for this patient."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
