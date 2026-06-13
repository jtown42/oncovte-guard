/**
 * Regression guard for the RxNorm code assignments.
 *
 * 10324 is TAMOXIFEN (a SERM used by the DDI knowledge base), not thalidomide.
 * Thalidomide is 10400. If these are ever conflated again, a tamoxifen patient
 * would be falsely flagged onIMiD and routed down the myeloma-IMiD pathway.
 */
import { describe, it, expect } from "vitest";
import { RXNORM, IMID_RXNORM, DOAC_RXNORM_TO_NAME } from "../../src/data/rxnorm-codes";
import { checkDDIs } from "../../src/core/ddi-checker";

describe("RxNorm assignments", () => {
  it("thalidomide is 10400 and tamoxifen's 10324 is NOT an IMiD", () => {
    expect(RXNORM.THALIDOMIDE).toBe("10400");
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
