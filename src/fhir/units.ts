/**
 * Lab-unit normalization for the two analytes whose unit changes the decision
 * (OpenEvidence rules review, 2026-10-31).
 *
 * The engine works in g/dL (hemoglobin) and mg/dL (serum creatinine). Much of
 * the world reports hemoglobin in g/L or mmol/L and creatinine in µmol/L; read
 * as-is, a Dutch "5" (mmol/L, about 8.1 g/dL) would trip the severe-anemia hold
 * and an SI creatinine would put CrCl near zero. The UCUM code
 * (valueQuantity.code) is preferred, falling back to the display unit.
 * Anything unrecognized is not converted and not used ("verify manually").
 */
import { LOINC } from "../data/loinc-codes";

/** 1 g/dL hemoglobin = 0.6206 mmol/L (monomer); 1 mg/dL creatinine = 88.4 µmol/L. */
export const HGB_MMOL_PER_G_DL = 0.6206;
export const CREATININE_UMOL_PER_MG_DL = 88.4;

type Converter = (v: number) => number;

const CONVERSIONS: Record<string, Record<string, Converter>> = {
  [LOINC.HEMOGLOBIN]: {
    "g/dl": (v) => v,
    "g/l": (v) => v / 10,
    "mmol/l": (v) => v / HGB_MMOL_PER_G_DL,
  },
  [LOINC.SERUM_CREATININE]: {
    "mg/dl": (v) => v,
    "umol/l": (v) => v / CREATININE_UMOL_PER_MG_DL,
    "µmol/l": (v) => v / CREATININE_UMOL_PER_MG_DL,
    "μmol/l": (v) => v / CREATININE_UMOL_PER_MG_DL,
  },
};

const TARGET_UNIT: Record<string, string> = {
  [LOINC.HEMOGLOBIN]: "g/dL",
  [LOINC.SERUM_CREATININE]: "mg/dL",
};

export type Normalized =
  | { ok: true; value: number; unit: string }
  | { ok: false; reported: string };

/** True when this LOINC code has its unit checked. Other labs pass through. */
export function isUnitChecked(loincCode: string): boolean {
  return loincCode in CONVERSIONS;
}

/**
 * Convert a value to the engine's unit. Returns `ok: false` (with the unit as
 * reported) when the unit is missing or not one we know how to convert.
 */
export function normalizeLab(
  loincCode: string,
  value: number,
  ucumCode: string | undefined,
  unitText: string | undefined,
): Normalized {
  const table = CONVERSIONS[loincCode];
  if (!table) return { ok: true, value, unit: unitText ?? ucumCode ?? "" };
  for (const raw of [ucumCode, unitText]) {
    const key = raw?.trim().toLowerCase();
    if (key && table[key]) {
      return { ok: true, value: round2(table[key](value)), unit: TARGET_UNIT[loincCode] };
    }
  }
  return { ok: false, reported: (unitText || ucumCode || "no unit").trim() };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
