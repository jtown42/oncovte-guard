/**
 * LOINC code constants for the labs and vitals OncoVTE Guard consumes.
 * Source: plan/ddi-info.md Parts 1E & 6.
 */

export const LOINC = {
  PLATELETS: "777-3",
  HEMOGLOBIN: "718-7",
  WBC: "6690-2",
  SERUM_CREATININE: "2160-0",
  BODY_WEIGHT: "29463-7",
  BODY_HEIGHT: "8302-2",
  BMI: "39156-5",
  ALT: "1742-6",
  AST: "1920-8",
  TOTAL_BILIRUBIN: "1975-2",
} as const;

export type LoincCode = (typeof LOINC)[keyof typeof LOINC];

/** LOINC codes for the CBC + chemistry panel used in laboratory prefetch. */
export const LAB_LOINC_CODES: LoincCode[] = [
  LOINC.PLATELETS,
  LOINC.HEMOGLOBIN,
  LOINC.WBC,
  LOINC.SERUM_CREATININE,
  LOINC.ALT,
  LOINC.AST,
  LOINC.TOTAL_BILIRUBIN,
];

/** LOINC codes for the vital-signs prefetch. */
export const VITAL_LOINC_CODES: LoincCode[] = [LOINC.BODY_WEIGHT, LOINC.BODY_HEIGHT];
