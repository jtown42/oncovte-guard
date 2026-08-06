/**
 * WS-4 alert-metrics governance (F13).
 *
 * The CDS alert-fatigue literature asks tools to monitor firing and response
 * rates continuously so repeatedly-overridden alerts can be demoted from active
 * to passive (the Vanderbilt "Clickbusters" model). This computes the metric set
 * that literature names — firing rate per 100 chart-opens, critical-to-total
 * ratio, and override rate by reason — over a cohort (the five synthetic
 * patients, or any loaded set). It is a pure function; the /metrics route just
 * renders it.
 */

import type { PatientData } from "../types/patient";
import { buildPatientViewCards } from "./cards";

export interface PerPatientMetric {
  name: string;
  totalCards: number;
  criticalCards: number;
  /** Non-critical alerts collapsed into the single summary card (WS-4). */
  collapsedNonCritical: number;
}

export interface AlertMetrics {
  chartOpens: number;
  totalCards: number;
  criticalCards: number;
  /** Cards fired per 100 chart-opens — the headline alert-burden metric. */
  firingRatePer100ChartOpens: number;
  /** Fraction of fired cards that are interruptive (critical). */
  criticalToTotalRatio: number;
  perPatient: PerPatientMetric[];
  overridesByReason: Record<string, number>;
  totalOverrides: number;
  /** Override rate = overrides / interruptive cards fired. */
  overrideRate: number;
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Compute alert metrics across a patient cohort. `overrideReasonCounts` comes
 * from the append-only override log (empty until clinicians dismiss cards).
 */
export function computeAlertMetrics(
  patients: PatientData[],
  overrideReasonCounts: Record<string, number> = {},
): AlertMetrics {
  const perPatient: PerPatientMetric[] = patients.map((p) => {
    const cards = buildPatientViewCards(p);
    const criticalCards = cards.filter((c) => c.indicator === "critical").length;
    // The single summary card may collapse several non-critical alerts; count
    // them from the recommendation so the governance view shows what was hidden.
    const collapsed = cards[0]?.detail?.match(/additional consideration/i)
      ? Number(cards[0].detail.match(/\*\*(\d+) additional consideration/)?.[1] ?? 0)
      : 0;
    return {
      name: p.name,
      totalCards: cards.length,
      criticalCards,
      collapsedNonCritical: collapsed,
    };
  });

  const chartOpens = patients.length;
  const totalCards = perPatient.reduce((s, p) => s + p.totalCards, 0);
  const criticalCards = perPatient.reduce((s, p) => s + p.criticalCards, 0);
  const totalOverrides = Object.values(overrideReasonCounts).reduce(
    (a, b) => a + b,
    0,
  );

  return {
    chartOpens,
    totalCards,
    criticalCards,
    firingRatePer100ChartOpens: chartOpens
      ? round((totalCards / chartOpens) * 100)
      : 0,
    criticalToTotalRatio: totalCards ? round(criticalCards / totalCards, 2) : 0,
    perPatient,
    overridesByReason: overrideReasonCounts,
    totalOverrides,
    overrideRate: criticalCards ? round(totalOverrides / criticalCards, 2) : 0,
  };
}

/** Minimal, self-contained HTML for the /metrics governance dashboard. */
export function renderMetricsHtml(m: AlertMetrics): string {
  const rows = m.perPatient
    .map(
      (p) =>
        `<tr><td>${escapeHtml(p.name)}</td><td>${p.totalCards}</td><td>${p.criticalCards}</td><td>${p.collapsedNonCritical}</td></tr>`,
    )
    .join("");
  const overrideRows =
    Object.keys(m.overridesByReason).length > 0
      ? Object.entries(m.overridesByReason)
          .map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v}</td></tr>`)
          .join("")
      : `<tr><td colspan="2"><em>No overrides captured yet.</em></td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>OncoVTE Guard — Alert governance metrics</title>
<style>body{font:14px/1.5 system-ui,sans-serif;margin:2rem;color:#0f172a}h1{font-size:1.25rem}
table{border-collapse:collapse;margin:1rem 0}td,th{border:1px solid #cbd5e1;padding:.4rem .7rem;text-align:left}
.kpi{display:inline-block;margin-right:2rem}.kpi b{font-size:1.5rem;display:block}small{color:#64748b}</style></head>
<body><h1>Alert governance metrics</h1>
<p><small>WS-4 (F13). Firing/critical/override metrics across ${m.chartOpens} chart-opens. Repeatedly-overridden alerts should be demoted active→passive (Clickbusters model).</small></p>
<div class="kpi"><b>${m.firingRatePer100ChartOpens}</b>cards / 100 chart-opens</div>
<div class="kpi"><b>${m.criticalToTotalRatio}</b>critical-to-total ratio</div>
<div class="kpi"><b>${m.overrideRate}</b>override rate</div>
<h2>Per patient</h2>
<table><thead><tr><th>Patient</th><th>Total cards</th><th>Critical (interruptive)</th><th>Non-critical (collapsed)</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Overrides by reason</h2>
<table><thead><tr><th>Reason</th><th>Count</th></tr></thead><tbody>${overrideRows}</tbody></table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;",
  );
}
