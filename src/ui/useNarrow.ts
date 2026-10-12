import { useEffect, useState } from "react";

/** Below Tailwind's `lg` breakpoint — a phone or a narrow tablet. */
export const NARROW_QUERY = "(max-width: 1023.98px)";

/** True when the viewport is narrower than `lg`; tracks resizes/rotation. */
export function useNarrow(): boolean {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.matchMedia(NARROW_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(NARROW_QUERY);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}
