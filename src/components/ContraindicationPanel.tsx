/** Contraindication / caution panel (appliesTo-aware, ERRATA Issues 9 & 10). */
import type {
  Contraindication,
  ContraindicationResult,
} from "../types/contraindication";
import { Card, Pill } from "./primitives";
import { humanize } from "../ui/format";

function appliesToLabel(c: Contraindication): string {
  return c.appliesTo === "all"
    ? "All anticoagulants"
    : c.appliesTo.map((a) => a).join(", ");
}

function Row({ c }: { c: Contraindication }) {
  const tone = c.type === "absolute" ? "danger" : "warning";
  return (
    <li className="flex flex-col gap-1 border-t border-clinical-border py-2.5 first:border-t-0">
      <div className="flex items-center gap-2">
        <Pill tone={tone}>{humanize(c.reason)}</Pill>
        <span className="text-xs capitalize text-clinical-muted">
          {appliesToLabel(c)}
        </span>
      </div>
      <p className="text-sm text-clinical-ink">{c.detail}</p>
    </li>
  );
}

export function ContraindicationPanel({
  contraindications,
}: {
  contraindications: ContraindicationResult;
}) {
  const { absolute, relative } = contraindications;
  const none = absolute.length === 0 && relative.length === 0;

  return (
    <Card
      title="Contraindications & Cautions"
      right={
        none ? (
          <Pill tone="good" dot>
            None detected
          </Pill>
        ) : (
          <Pill tone={absolute.length > 0 ? "danger" : "warning"} dot>
            {absolute.length} absolute · {relative.length} relative
          </Pill>
        )
      }
    >
      {none ? (
        <p className="text-sm text-clinical-muted">
          No bleeding, hepatic, thrombocytopenic, or agent-specific
          contraindications were detected from the available data.
        </p>
      ) : (
        <div className="space-y-4">
          {absolute.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-rose-700">
                Absolute
              </h3>
              <ul>
                {absolute.map((c, i) => (
                  <Row key={`a-${i}`} c={c} />
                ))}
              </ul>
            </div>
          )}
          {relative.length > 0 && (
            <div>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Relative
              </h3>
              <ul>
                {relative.map((c, i) => (
                  <Row key={`r-${i}`} c={c} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
