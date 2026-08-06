/**
 * Contraindication / caution types.
 * Source: plan/ddi-info.md Part 4 + ERRATA Issues 9 & 10.
 *
 * `appliesTo` is "all" for universal contraindications, or a list of specific
 * anticoagulant names for targeted ones (e.g. HIT -> ["enoxaparin","dalteparin"]).
 * The orchestration filters on this before declaring a global "contraindicated"
 * state (ERRATA Issue 9).
 */

import type { AnticoagulantName } from "./renal";

export type AppliesTo = AnticoagulantName[] | "all";

/** Canonical, snake_case contraindication/caution reasons (ERRATA Issue 10). */
export type ContraindicationReason =
  | "severe_thrombocytopenia"
  | "antiphospholipid_syndrome"
  | "hit"
  | "active_major_bleeding"
  | "severe_hepatic_impairment"
  | "gi_tract_cancer"
  | "brain_tumor"
  | "multiple_myeloma_imid"
  | "concurrent_antiplatelet"
  // WS-1.1: apixaban <40 kg is a categorical NCCN VTE-B-2 instruction
  // ("Avoid if weight <40 kg"), encoded as a targeted absolute — not a
  // curator-chosen relative caution. Renamed from "low_weight".
  | "weight_below_40kg";

export interface Contraindication {
  type: "absolute" | "relative";
  reason: ContraindicationReason;
  detail: string;
  appliesTo: AppliesTo;
  /**
   * Guideline citation for this finding (auditability ground rule). Kept on the
   * object so a reviewer can trace the rule to a source without reading code.
   */
  source?: string;
}

export interface ContraindicationResult {
  absolute: Contraindication[];
  relative: Contraindication[];
  /** false only when a universal (appliesTo === "all") absolute contraindication exists. */
  canProceedWithProphylaxis: boolean;
}
