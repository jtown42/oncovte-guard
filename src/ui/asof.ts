/**
 * F10 (WS-5): pin the reference date used for lab-staleness via `?asof=YYYY-MM-DD`,
 * defaulting to now. Removes stage-day fragility — a demo of a stale-lab state is
 * reproducible on any date (e.g. `?asof=2026-07-16`).
 */
export function getAsOfDate(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): Date {
  const raw = new URLSearchParams(search).get("asof");
  if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T12:00:00Z`);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}
