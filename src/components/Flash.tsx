/**
 * Recompute flash. Wraps a stateless display element (the verdict banner, a big
 * metric number, the interaction summary) and replays a brief colored glow
 * whenever `watch` changes — the visible proof that a live edit re-ran the
 * engine. Remounting on change is intentional and safe here: every consumer
 * wraps a presentational leaf with no internal state to preserve.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Tone } from "../ui/format";

type FlashTone = "good" | "danger" | "warning" | "info" | "neutral";

/** Map the richer semantic tone set onto the five flash colors. */
function flashTone(tone: Tone): FlashTone {
  switch (tone) {
    case "good":
      return "good";
    case "danger":
      return "danger";
    case "warning":
    case "caution":
      return "warning";
    case "info":
      return "info";
    case "neutral":
      return "neutral";
  }
}

export function Flash({
  watch,
  tone,
  className = "",
  children,
}: {
  /** When this value changes, replay the flash. */
  watch: string | number;
  tone: Tone;
  className?: string;
  children: ReactNode;
}) {
  const first = useRef(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setTick((n) => n + 1);
  }, [watch]);

  // Re-keying forces the CSS animation to replay from the start on each change.
  return (
    <div key={tick} className={`${tick > 0 ? `flash-${flashTone(tone)}` : ""} ${className}`}>
      {children}
    </div>
  );
}
