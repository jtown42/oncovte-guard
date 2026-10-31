/**
 * RxNorm code constants + classification sets.
 * Source: plan/ddi-info.md Part 6 (DOACs, anticoagulants, antiplatelets,
 * nephrotoxic chemo, ESAs, IMiDs).
 */

export const RXNORM = {
  // DOACs (ingredient codes)
  APIXABAN: "1364430",
  RIVAROXABAN: "1114195",
  DABIGATRAN: "1037042",
  EDOXABAN: "1599538",

  // Other anticoagulants
  ENOXAPARIN: "67108",
  DALTEPARIN: "67109",
  HEPARIN_UFH: "5224",
  WARFARIN: "11289",

  // Antiplatelets
  ASPIRIN: "1191",
  CLOPIDOGREL: "32968",
  PRASUGREL: "613391",
  TICAGRELOR: "1116632",

  // Nephrotoxic chemotherapy
  CISPLATIN: "2555",
  CARBOPLATIN: "40048",
  METHOTREXATE: "6851",

  // Erythropoiesis-stimulating agents (ESAs)
  EPOETIN_ALFA: "105694",
  DARBEPOETIN_ALFA: "283838",

  // Immunomodulatory imide drugs (IMiDs)
  // NOTE: thalidomide is 10432; 10324 is TAMOXIFEN (a SERM, not an IMiD) and is
  // used by the DDI knowledge base. Keeping these distinct prevents tamoxifen
  // patients from being falsely flagged onIMiD.
  THALIDOMIDE: "10432",
  LENALIDOMIDE: "342369",
  POMALIDOMIDE: "1369713",
} as const;

export type RxNormCode = (typeof RXNORM)[keyof typeof RXNORM];

/** The four DOACs, keyed by RxNorm code -> canonical lowercase name. */
export const DOAC_RXNORM_TO_NAME: Record<string, "apixaban" | "rivaroxaban" | "dabigatran" | "edoxaban"> = {
  [RXNORM.APIXABAN]: "apixaban",
  [RXNORM.RIVAROXABAN]: "rivaroxaban",
  [RXNORM.DABIGATRAN]: "dabigatran",
  [RXNORM.EDOXABAN]: "edoxaban",
};

export const ANTIPLATELET_RXNORM = new Set<string>([
  RXNORM.ASPIRIN,
  RXNORM.CLOPIDOGREL,
  RXNORM.PRASUGREL,
  RXNORM.TICAGRELOR,
]);

export const NEPHROTOXIC_CHEMO_RXNORM = new Set<string>([
  RXNORM.CISPLATIN,
  RXNORM.CARBOPLATIN,
  RXNORM.METHOTREXATE,
]);

/**
 * Anticoagulants whose active order means the patient is already anticoagulated,
 * so primary prophylaxis does not apply (AVERT excluded patients on any of these).
 */
export const ANTICOAGULANT_RXNORM = new Set<string>([
  RXNORM.APIXABAN,
  RXNORM.RIVAROXABAN,
  RXNORM.DABIGATRAN,
  RXNORM.EDOXABAN,
  RXNORM.ENOXAPARIN,
  RXNORM.DALTEPARIN,
  RXNORM.HEPARIN_UFH,
  RXNORM.WARFARIN,
]);

/**
 * Systemic corticosteroids that set the bleeding-panel flag automatically
 * (a review prompt; observational evidence, Vedovati 2025). Hydrocortisone is left out: it is usually physiologic
 * replacement. Codes verified on RxNav 2026-10-31.
 */
export const CORTICOSTEROID_RXNORM = new Set<string>([
  "3264", // dexamethasone
  "8640", // prednisone
  "6902", // methylprednisolone
]);

/**
 * Individually reviewed combined P-gp + moderate CYP3A inhibitors. The
 * rivaroxaban label (section 7.2) says not to use rivaroxaban with these at
 * CrCl 15 to <80 mL/min unless the benefit justifies the risk; apixaban's label
 * has no such statement. This is a reviewed list, not derived from the KB's
 * enzyme fields (OpenEvidence follow-up, 2026-10-31). Deliberately NOT here:
 * aprepitant (EMEND 12.3: P-gp interaction unlikely; no digoxin interaction),
 * abiraterone (P-gp inhibition in vitro only), ceritinib (a strong CYP3A
 * inhibitor clinically; needs its own review).
 */
export const RIVAROXABAN_COMBINED_MODERATE_RXNORM = new Set<string>([
  "1148495", // crizotinib — XALKORI 12.3: CYP3A and P-gp inhibition
  "1608322", // isavuconazonium — CRESEMBA 12.3: moderate CYP3A, P-gp inhibition
  "662281", // nilotinib — TASIGNA 12.3: moderate CYP3A (repeat dosing), P-gp
  "282388", // imatinib — Gleevec label (CYP3A) + transporter studies (Dohse 2010)
  "3008", // cyclosporine — P-gp inhibitor; rivaroxaban PK study (Brings 2019)
]);

/** CrCl band (mL/min) where that rivaroxaban rule applies: 15 to <80. */
export const RIVAROXABAN_COMBINED_MODERATE_CRCL = { GTE: 15, LT: 80 } as const;

export const ESA_RXNORM = new Set<string>([RXNORM.EPOETIN_ALFA, RXNORM.DARBEPOETIN_ALFA]);

export const IMID_RXNORM = new Set<string>([
  RXNORM.THALIDOMIDE,
  RXNORM.LENALIDOMIDE,
  RXNORM.POMALIDOMIDE,
]);
