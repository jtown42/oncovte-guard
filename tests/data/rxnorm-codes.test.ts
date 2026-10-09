/**
 * Regression guard for the RxNorm code assignments.
 *
 * 10324 is TAMOXIFEN (a SERM used by the DDI knowledge base), not thalidomide.
 * Thalidomide is 10432. If these are ever conflated again, a tamoxifen patient
 * would be falsely flagged onIMiD and routed down the myeloma-IMiD pathway.
 */
import { describe, it, expect } from "vitest";
import { RXNORM, IMID_RXNORM, DOAC_RXNORM_TO_NAME } from "../../src/data/rxnorm-codes";
import { checkDDIs } from "../../src/core/ddi-checker";

describe("RxNorm assignments", () => {
  it("thalidomide is 10432 and tamoxifen's 10324 is NOT an IMiD", () => {
    expect(RXNORM.THALIDOMIDE).toBe("10432");
    expect(IMID_RXNORM.has("10324")).toBe(false);
    expect(IMID_RXNORM.has(RXNORM.THALIDOMIDE)).toBe(true);
  });

  it("10324 resolves to tamoxifen in the DDI knowledge base, not an IMiD", () => {
    expect(checkDDIs({ rxnormCode: "10324", display: "x" }).medication).toBe(
      "Tamoxifen",
    );
  });

  it("the four DOAC ingredient codes map to their names", () => {
    expect(DOAC_RXNORM_TO_NAME[RXNORM.APIXABAN]).toBe("apixaban");
    expect(DOAC_RXNORM_TO_NAME[RXNORM.RIVAROXABAN]).toBe("rivaroxaban");
    expect(DOAC_RXNORM_TO_NAME[RXNORM.DABIGATRAN]).toBe("dabigatran");
    expect(DOAC_RXNORM_TO_NAME[RXNORM.EDOXABAN]).toBe("edoxaban");
  });
});

/**
 * F17 (2026-10-09): 22 RxNorm codes were wrong or retired (e.g. dalteparin was
 * desflurane's code, epoetin alfa was dipyridamole's, nab-paclitaxel was
 * carvedilol's). Each value below was checked against RxNav as an ingredient
 * (IN/PIN) code whose RxNav name matches the drug. A drift here breaks matching against real EHR data.
 */
describe("F17: RxNav-verified ingredient codes", () => {
  const KB_VERIFIED: Record<string, string> = {
    Idelalisib: "1544460", Enzalutamide: "1307298", Mitotane: "7004", Nilotinib: "662281",
    Crizotinib: "1148495", Ribociclib: "1873916", Tucatinib: "2361285", Neratinib: "1940643",
    Dabrafenib: "1424911", Lenvatinib: "1603296", Cabozantinib: "1363268",
    Apalutamide: "1999574", Ramucirumab: "1535922",
    "Paclitaxel protein-bound (nab-paclitaxel)": "486610", Pemetrexed: "68446", Bleomycin: "1622",
  };
  it("knowledge-base agents use verified codes", () => {
    for (const [name, code] of Object.entries(KB_VERIFIED)) {
      expect(checkDDIs({ rxnormCode: code, display: name }).medication, name).toBe(name);
    }
  });
  it("classification constants use verified codes", () => {
    expect(RXNORM.DALTEPARIN).toBe("67109");
    expect(RXNORM.EPOETIN_ALFA).toBe("105694");
    expect(RXNORM.DARBEPOETIN_ALFA).toBe("283838");
    expect(RXNORM.LENALIDOMIDE).toBe("342369");
    expect(RXNORM.POMALIDOMIDE).toBe("1369713");
  });
});
