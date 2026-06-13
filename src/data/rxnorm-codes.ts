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
  DALTEPARIN: "27340",
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
  EPOETIN_ALFA: "3521",
  DARBEPOETIN_ALFA: "237071",

  // Immunomodulatory imide drugs (IMiDs)
  // NOTE: thalidomide is 10400; 10324 is TAMOXIFEN (a SERM, not an IMiD) and is
  // used by the DDI knowledge base. Keeping these distinct prevents tamoxifen
  // patients from being falsely flagged onIMiD.
  THALIDOMIDE: "10400",
  LENALIDOMIDE: "321191",
  POMALIDOMIDE: "1369409",
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

export const ESA_RXNORM = new Set<string>([RXNORM.EPOETIN_ALFA, RXNORM.DARBEPOETIN_ALFA]);

export const IMID_RXNORM = new Set<string>([
  RXNORM.THALIDOMIDE,
  RXNORM.LENALIDOMIDE,
  RXNORM.POMALIDOMIDE,
]);
