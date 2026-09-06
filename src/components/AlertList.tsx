/** Ordered clinical alert stack (critical → warning → info). */
import type { Alert } from "../types/recommendation";
import { alertTone, TONE_BANNER } from "../ui/format";

const ORDER = { critical: 0, warning: 1, info: 2 } as const;

/* A word, not a symbol. Emoji render differently on every projector and OS,
   and they ask the reader to decode a picture before reading the sentence. */
const LEVEL_LABEL = {
  critical: "Important",
  warning: "Caution",
  info: "For information",
} as const;

export function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  const sorted = [...alerts].sort((a, b) => ORDER[a.level] - ORDER[b.level]);

  return (
    <div className="space-y-2">
      {sorted.map((a, i) => (
        <div
          key={i}
          className={`rounded-md border px-3.5 py-2.5 ${TONE_BANNER[alertTone(a.level)]}`}
          role={a.level === "critical" ? "alert" : "status"}
        >
          <p className="text-sm font-semibold tracking-tight">
            <span className="opacity-60">{LEVEL_LABEL[a.level]} · </span>
            {a.title}
          </p>
          <p className="mt-0.5 text-sm opacity-90">{a.detail}</p>
          <p className="mt-1 text-xs opacity-60">Source: {a.source}</p>
        </div>
      ))}
    </div>
  );
}
