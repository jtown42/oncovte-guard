/**
 * The clinical centerpiece: overall action hero + the preferred / alternative /
 * avoid anticoagulant options. Reflects ERRATA Issue 4 — only apixaban and
 * rivaroxaban are ever "preferred"; dabigatran/edoxaban appear only under Avoid.
 */
import type {
  DOACOption,
  ProphylaxisRecommendation,
} from "../types/recommendation";
import { Pill } from "./primitives";
import {
  ACTION,
  TONE_BANNER,
  renalStatusTone,
  RENAL_STATUS_LABEL,
  severityTone,
  SEVERITY_LABEL,
} from "../ui/format";

export function RecommendationPanel({
  rec,
}: {
  rec: ProphylaxisRecommendation;
}) {
  const action = ACTION[rec.overallAction];
  const showOptions =
    rec.overallAction === "recommend" || rec.overallAction === "caution";

  return (
    <section className="card overflow-hidden">
      {/* Hero banner */}
      <div className={`border-l-4 px-5 py-4 ${TONE_BANNER[action.tone]}`}>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{action.label}</h2>
          <Pill tone={action.tone}>{rec.overallAction.replace(/_/g, " ")}</Pill>
        </div>
        <p className="mt-1 text-sm opacity-90">{action.summary}</p>
      </div>

      <div className="card-body space-y-5">
        {rec.staleLabWarning && (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            ⚠️ Decision uses laboratory values older than 30 days (
            {rec.staleLabFields.join(", ")}). Re-check before acting.
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
        <h3 className="text-sm font-semibold uppercase tracking-wide text-clinical-ink">
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
    <div className={`rounded-lg border border-clinical-border bg-white p-4 ring-1 ${ring}`}>
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold capitalize">{o.name}</span>
        <Pill tone={renalStatusTone(o.renalStatus)}>
          renal: {RENAL_STATUS_LABEL[o.renalStatus]}
        </Pill>
      </div>
      <p className="mt-1 font-mono text-sm text-clinical-ink">
        {[o.dose, o.route, o.frequency].filter(Boolean).join(" ")}
      </p>
      {o.duration && (
        <p className="text-xs text-clinical-muted">{o.duration}</p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Pill tone={severityTone(o.worstDDI)}>
          DDI: {SEVERITY_LABEL[o.worstDDI]}
        </Pill>
      </div>
    </div>
  );
}

function AvoidList({ options }: { options: DOACOption[] }) {
  if (options.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-700">
        Avoid / not an option
      </h3>
      <ul className="space-y-1.5">
        {options.map((o) => (
          <li
            key={o.name}
            className="flex flex-col gap-0.5 rounded-md bg-slate-50 px-3 py-2 text-sm sm:flex-row sm:items-center sm:gap-3"
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
