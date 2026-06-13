/** Ordered clinical alert stack (critical → warning → info). */
import type { Alert } from "../types/recommendation";
import { alertTone, TONE_BANNER } from "../ui/format";

const ORDER = { critical: 0, warning: 1, info: 2 } as const;
const ICON = { critical: "⛔", warning: "⚠️", info: "ℹ️" } as const;

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  const sorted = [...alerts].sort((a, b) => ORDER[a.level] - ORDER[b.level]);

  return (
    <div className="space-y-2">
      {sorted.map((a, i) => (
        <div
          key={i}
          className={`flex gap-3 rounded-lg border px-4 py-3 ${TONE_BANNER[alertTone(a.level)]}`}
          role={a.level === "critical" ? "alert" : "status"}
        >
          <span aria-hidden className="mt-0.5 leading-none">
            {ICON[a.level]}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{a.title}</p>
            <p className="text-sm opacity-90">{a.detail}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide opacity-70">
              {a.source}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
