/**
 * Qualitative bleeding-risk panel (WS-2) — rendered beside the Khorana card so
 * the thrombotic/bleeding asymmetry is visible at a glance. Deliberately a list
 * of guideline-named factors, never a score (see the disclaimer).
 */
import type { BleedingRiskProfile, BleedingRiskTier } from "../types/bleeding-risk";
import { Card, Pill } from "./primitives";
import type { Tone } from "../ui/format";

const TIER_TONE: Record<BleedingRiskTier, Tone> = {
  elevated: "warning",
  standard: "good",
  insufficient_data: "neutral",
};

const TIER_LABEL: Record<BleedingRiskTier, string> = {
  elevated: "Elevated",
  standard: "Standard",
  insufficient_data: "Insufficient data",
};

export function BleedingRiskPanel({ profile }: { profile: BleedingRiskProfile }) {
  return (
    <Card
      title="Bleeding-risk factors"
      right={
        <Pill tone={TIER_TONE[profile.tier]} dot>
          {TIER_LABEL[profile.tier]}
        </Pill>
      }
    >
      {profile.tier === "elevated" && (
        <ul className="space-y-2">
          {profile.factors.map((f) => (
            <li
              key={f.key}
              className="rounded-md border-l-2 border-sev-caution bg-sev-cautionWash px-3 py-2 text-sm text-sev-cautionInk"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{f.label}</span>
                {f.prefersLmwh && (
                  <span className="shrink-0 text-xs font-medium text-sev-cautionInk">
                    LMWH preferred
                  </span>
                )}
              </div>
              <p className="mt-0.5 opacity-90">{f.detail}</p>
              <p className="mt-0.5 text-xs text-sev-cautionInk opacity-80">Source: {f.source}</p>
            </li>
          ))}
        </ul>
      )}

      {profile.tier === "standard" && (
        <p className="rounded-md border-l-2 border-clinical-brand bg-clinical-brandSoft px-3 py-2 text-sm text-clinical-brandDark">
          No guideline-named bleeding-risk factors detected in the available data.
        </p>
      )}

      {profile.tier === "insufficient_data" && (
        <p className="rounded-md border-l-2 border-clinical-border bg-clinical-bg px-3 py-2 text-sm text-clinical-muted">
          Insufficient data to assess bleeding-risk factors — missing{" "}
          {profile.missingInputs.join(", ")}. Obtain before relying on this panel.
        </p>
      )}

      <p className="mt-3 text-xs leading-relaxed text-clinical-muted">
        {profile.disclaimer}
      </p>
    </Card>
  );
}
