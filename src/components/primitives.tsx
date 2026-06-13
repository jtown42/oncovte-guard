/** Small presentational primitives shared across dashboard cards. */
import type { ReactNode } from "react";
import { TONE_PILL, TONE_DOT, type Tone } from "../ui/format";

export function Pill({
  tone,
  children,
  dot = false,
}: {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={`pill ${TONE_PILL[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[tone]}`} />}
      {children}
    </span>
  );
}

export function Card({
  title,
  right,
  children,
  className = "",
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="card-header">
        <h2 className="card-title">{title}</h2>
        {right}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

export function KV({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="kv">
      <span className="kv-label">{label}</span>
      <span className="kv-value">{children}</span>
    </div>
  );
}
