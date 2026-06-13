# OncoVTE Guard — Errata & Contract Reconciliation

> **AUTHORITATIVE.** This document resolves all 10 inconsistencies identified in the specification. These resolutions **override any conflicting content** in the prior four documents (including `ddi-info.md` and `plan.md`). Where this file and any other spec disagree, **this file wins**.

---

## ISSUE 1: Max Khorana Score is 6, not 7

**Resolution:** The maximum Khorana score is **6**.

The original Khorana model (Khorana et al., *Blood* 2008) has a maximum of 6 points:

- Cancer site: 0–2
- Platelets ≥350: 0–1
- Hemoglobin <10 or ESA use: 0–1
- WBC >11: 0–1
- BMI ≥35: 0–1
- Total maximum = 2 + 1 + 1 + 1 + 1 = **6**

All references to "max score 7" in Part 1A are incorrect. The coding agent should:

- Set `MAX_SCORE = 6` as a constant
- Update any header/comment that says "0–7" to "0–6"

---

## ISSUE 2: Risk Category Cutoffs — Single Source of Truth

> **⚠️ SUPERSEDED ON CLINICAL REVIEW (2026-06-13).** The resolution below
> relabeled score 1 as "Low Risk" and called the original "1–2 = Intermediate"
> incorrect. This was itself wrong: the original Khorana model (Khorana et al.,
> *Blood* 2008) and the **NCCN VTE-C** risk-stratification table both define
> **0 = Low, 1–2 = Intermediate, ≥3 = High**. The implementation now restores
> that published tiering (`riskCategoryForScore`: `score >= 1 → INTERMEDIATE`).
> **This is a labeling change only** — the actionable prophylaxis threshold
> remains `totalScore >= 2`, so no recommendation changes; only the tier label
> shown for a score of 1 moves from "Low" to "Intermediate." Test 20 and the
> `riskCategoryForScore` test were updated to assert Intermediate for score 1.
> The enum comment `// score 0–1` below is accordingly obsolete (now `// score 0`).
> The original text is retained verbatim below for the audit trail.

**Resolution:** Use the NCCN-aligned two-tier threshold.

The definitive cutoffs are:

```
Score 0     → Low Risk        → No routine prophylaxis
Score 1     → Low Risk        → No routine prophylaxis
Score 2     → Intermediate    → Prophylaxis recommended (NCCN ≥2 threshold)
Score ≥3    → High Risk       → Prophylaxis recommended
```

The Part 1B table that listed "1–2 = Intermediate" is **incorrect**. Score 1 is **Low Risk**.

The TypeScript enum is correct as written:

```typescript
export enum RiskCategory {
  LOW = "low",                   // score 0–1
  INTERMEDIATE = "intermediate", // score 2
  HIGH = "high"                  // score ≥3
}
```

The `prophylaxisRecommended` flag should be `true` when `totalScore >= 2`.

**Additional unit test to add (fills the gap):**

- **Test 20: "Score 1 is Low Risk, no prophylaxis"**
  - Input: `{conditions: [{code: "C83.1"}], platelets: 200, hemoglobin: 12.0, wbc: 8.0, bmi: 28.0, onESA: false}`
  - Expected: `totalScore = 1, riskCategory = "low", prophylaxisRecommended = false`

---

## ISSUE 3: Paclitaxel Duplication + nab-Paclitaxel RxNorm

**Resolution:** Three distinct entries.

**Plain paclitaxel (Taxol):**

- RxNorm: `56946`
- DDI severity: MINOR–MODERATE (weak CYP3A4 inducer, may modestly reduce DOAC levels)
- Per-DOAC: apixaban MINOR, rivaroxaban MINOR, dabigatran NONE, edoxaban NONE
- This corrects the "compatible / NONE" entry in Part 3C, which was wrong.

**nab-Paclitaxel (Abraxane):**

- RxNorm: `686924`
- DDI severity: MINOR (same mechanism as plain paclitaxel but albumin-bound formulation; clinical significance is low)
- Per-DOAC: apixaban MINOR, rivaroxaban MINOR, dabigatran NONE, edoxaban NONE

**Patient 1 (Maria Santos) correction:**

- Change nab-paclitaxel MedicationRequest from RxNorm `56946` to `686924`
- Change display from "paclitaxel" to "paclitaxel protein-bound" or "nab-paclitaxel"
- Update the DDI knowledge base JSON to include both entries

**Impact on Patient 1 expected output:**

- DDI matrix should show nab-paclitaxel (`686924`) as MINOR for apixaban/rivaroxaban, NONE for dabigatran/edoxaban
- This does NOT change the overall recommendation (MINOR does not block any DOAC)
- Update integration test 1 to expect MINOR rather than NONE for the nab-paclitaxel row

---

## ISSUE 4: Dabigatran/Edoxaban Are NOT Prophylaxis Options

**Resolution:** Show all 4 DOACs in the DDI matrix for completeness, but only **apixaban** and **rivaroxaban** are valid prophylaxis recommendations.

The NCCN VTE guidelines support only two DOACs for ambulatory cancer VTE prophylaxis:

- Apixaban 2.5 mg PO BID
- Rivaroxaban 10 mg PO daily

Dabigatran and edoxaban have no NCCN-supported prophylaxis indication in this setting.

**Changes to the TypeScript interfaces:**

```typescript
// In types/recommendation.ts, add a field to DOACOption:
export interface DOACOption {
  // ... existing fields ...
  hasNccnProphylaxisIndication: boolean;  // true only for apixaban and rivaroxaban
}
```

**Changes to orchestration (Part 12, Step 7):**

```
// Step 7 revised:
FOR EACH doac IN [apixaban, rivaroxaban]:
  // Build as prophylaxis option (eligible = true if no MAJOR DDI and renal OK)

FOR EACH doac IN [dabigatran, edoxaban]:
  // Build as DDI-reference-only (hasNccnProphylaxisIndication = false, eligible = false)
  // Still show in DDI matrix so clinicians see the full interaction picture
  // Do NOT present as a prophylaxis recommendation
```

**Changes to UI:**

- DDI matrix: still shows all 4 DOAC columns (useful for clinicians who may be considering DOACs for other indications)
- RecommendationOutput: only lists apixaban and rivaroxaban as prophylaxis options
- If both apixaban and rivaroxaban are blocked (MAJOR DDI or renal), recommend LMWH — do NOT fall back to dabigatran/edoxaban

**Changes to CDS Hooks order-select:**

- The order-select hook should still fire for dabigatran/edoxaban orders (to flag DDIs)
- But the card should note: "This DOAC does not have an NCCN-supported indication for ambulatory cancer VTE prophylaxis"

---

## ISSUE 5: C90.0 vs C90.00 — Prefix Matching Confirmed

**Resolution:** Use prefix-based matching. This is already the correct approach.

ICD-10-CM codes are hierarchical:

- C90 = Multiple myeloma and malignant plasma cell neoplasms
- C90.0 = Multiple myeloma (3-character + 1)
- C90.00 = Multiple myeloma not having achieved remission (full specificity)
- C90.01 = Multiple myeloma in remission
- C90.02 = Multiple myeloma in relapse

The exclusion list should store the prefix `"C90.0"` and the matcher should use `startsWith()`:

```typescript
const MYELOMA_EXCLUSION_PREFIXES = ["C90.0", "C90.1", "C90.2", "C90.3"];
// C90.0x = multiple myeloma
// C90.1x = plasma cell leukemia
// C90.2x = extramedullary plasmacytoma
// C90.3x = solitary plasmacytoma

function isExcludedCancer(icd10Code: string): boolean {
  return EXCLUSION_PREFIXES.some(prefix => icd10Code.startsWith(prefix));
}
```

This means C90.0, C90.00, C90.01, C90.02 all correctly trigger the myeloma exclusion. No code changes needed — just confirm the matcher uses `startsWith()`, not exact equality.

Similarly for brain tumors:

- Store prefix `"C71"` (malignant neoplasm of brain)
- C71.0 through C71.9 all match

---

## ISSUE 6: snake_case vs camelCase — Canonical Shape

**Resolution:** The TypeScript interface (camelCase) is the canonical in-memory shape. The JSON knowledge base uses camelCase to match. **No transform layer needed.**

The DDI knowledge base JSON (Part 3D) should be rewritten in camelCase to match the TypeScript interface exactly:

```json
{
  "agentName": "Ibrutinib",
  "brandName": "Imbruvica",
  "rxnormCode": "1442981",
  "drugClass": "BTK inhibitor",
  "pgpEffect": "strong_inhibitor",
  "cyp3a4Effect": "strong_inhibitor",
  "interactions": {
    "apixaban": {
      "severity": "major",
      "mechanism": "Strong dual CYP3A4 + P-gp inhibition increases apixaban AUC ~100%",
      "recommendation": "AVOID. Use LMWH instead.",
      "alternativeDoac": null
    },
    "rivaroxaban": {
      "severity": "major",
      "mechanism": "Strong dual CYP3A4 + P-gp inhibition increases rivaroxaban exposure",
      "recommendation": "AVOID. Use LMWH instead.",
      "alternativeDoac": null
    },
    "dabigatran": {
      "severity": "moderate",
      "mechanism": "P-gp inhibition increases dabigatran exposure (no CYP3A4 component)",
      "recommendation": "Use with caution. Monitor for bleeding.",
      "alternativeDoac": "edoxaban"
    },
    "edoxaban": {
      "severity": "minor",
      "mechanism": "P-gp inhibition; edoxaban has lowest CYP3A4 dependence",
      "recommendation": "Lowest interaction risk among DOACs. Monitor.",
      "alternativeDoac": null
    }
  },
  "pharmacodynamicBleedingRisk": true,
  "notes": "Ibrutinib itself increases bleeding risk via BTK-mediated platelet inhibition.",
  "sources": ["AHA 2022 Scientific Statement", "Hellfritzsch et al. 2024"]
}
```

Add `sources` to the TypeScript interface:

```typescript
export interface DDIEntry {
  // ... existing fields ...
  sources: string[];  // was missing from Part 11
}
```

The coding agent should write the entire `ddi-knowledge-base.json` file in camelCase from the start. No snake_case → camelCase transform layer is needed.

---

## ISSUE 7: checkDDIs Signature — Unified Contract

**Resolution:** `checkDDIs()` always returns the full per-DOAC shape. Unit tests are updated to match.

The function signature:

```typescript
/**
 * Check one medication against all 4 DOACs.
 * Returns a DDICheckResult with per-DOAC detail and a worstSeverity across all DOACs.
 */
export function checkDDIs(
  medication: { rxnormCode: string; display: string },
): DDICheckResult;

// DDICheckResult (unchanged from Part 11):
export interface DDICheckResult {
  medication: string;
  rxnormCode: string;
  perDoac: {
    apixaban: DDIDetail;
    rivaroxaban: DDIDetail;
    dabigatran: DDIDetail;
    edoxaban: DDIDetail;
  };
  worstSeverity: DDISeverity;
}
```

**Updated unit tests (Part 8C) — all tests now assert against the full shape:**

- **Test 1: "Ibrutinib + all DOACs"**
  - Input: `medication = {rxnormCode: "1442981", display: "ibrutinib"}`
  - Expected:
    - `perDoac.apixaban.severity = "major"`
    - `perDoac.rivaroxaban.severity = "major"`
    - `perDoac.dabigatran.severity = "moderate"`
    - `perDoac.edoxaban.severity = "minor"`
    - `worstSeverity = "major"`
- **Test 2: "Gemcitabine + all DOACs"**
  - Input: `medication = {rxnormCode: "12574", display: "gemcitabine"}`
  - Expected:
    - `perDoac.apixaban.severity = "none"`
    - `perDoac.rivaroxaban.severity = "none"`
    - `perDoac.dabigatran.severity = "none"`
    - `perDoac.edoxaban.severity = "none"`
    - `worstSeverity = "none"`
- **Test 3: "Bevacizumab — pharmacodynamic flag"**
  - Input: `medication = {rxnormCode: "253337", display: "bevacizumab"}`
  - Expected:
    - `perDoac.apixaban.severity = "pharmacodynamic"`
    - `perDoac.rivaroxaban.severity = "pharmacodynamic"`
    - `perDoac.dabigatran.severity = "pharmacodynamic"`
    - `perDoac.edoxaban.severity = "pharmacodynamic"`
    - `worstSeverity = "pharmacodynamic"`
- **Test 4: "Enzalutamide + all DOACs"**
  - Input: `medication = {rxnormCode: "1232107", display: "enzalutamide"}`
  - Expected:
    - `perDoac.apixaban.severity = "major"`
    - `perDoac.rivaroxaban.severity = "major"`
    - `perDoac.dabigatran.severity = "minor"`
    - `perDoac.edoxaban.severity = "minor"`
    - `worstSeverity = "major"`
- **Test 5: "Dexamethasone + all DOACs"**
  - Input: `medication = {rxnormCode: "3264", display: "dexamethasone"}`
  - Expected:
    - `perDoac.apixaban.severity = "moderate"`
    - `perDoac.rivaroxaban.severity = "moderate"`
    - `perDoac.dabigatran.severity = "minor"`
    - `perDoac.edoxaban.severity = "minor"`
    - `worstSeverity = "moderate"`
- **Test 6: "Unknown RxNorm code"**
  - Input: `medication = {rxnormCode: "9999999", display: "unknown"}`
  - Expected:
    - `perDoac.apixaban.severity = "unknown"`
    - `worstSeverity = "unknown"`
- **Test 7: "Multiple medications — use getWorstDDIForDoac helper"**
  - *(This tests the orchestration helper, not checkDDIs itself.)*
  - Input: `ddiResults = [checkDDIs(gemcitabine), checkDDIs(ibrutinib)]`
  - Expected:
    - `getWorstDDIForDoac(ddiResults, "apixaban") = "major"`
    - `getWorstDDIForDoac(ddiResults, "edoxaban") = "minor"`

**Add a helper function:**

```typescript
/**
 * Given an array of DDICheckResults (one per active medication),
 * return the worst severity for a specific DOAC across all medications.
 */
export function getWorstDDIForDoac(
  results: DDICheckResult[],
  doac: "apixaban" | "rivaroxaban" | "dabigatran" | "edoxaban"
): DDISeverity;
```

Severity ranking for "worst": `major > moderate > pharmacodynamic > minor > none > unknown`.

---

## ISSUE 8: RenalResult.doacRecommendations — Array with Helper

**Resolution:** Keep as array (cleaner TypeScript), add a lookup helper.

```typescript
export interface RenalResult {
  crclMlMin: number;
  crclCategory: "normal" | "mild" | "moderate" | "severe";
  doacRecommendations: DOACRenalRecommendation[];  // always 4 entries + 2 LMWH
  warnings: string[];
}

// Helper function:
export function getRenalRecommendation(
  result: RenalResult,
  doacName: string
): DOACRenalRecommendation | undefined {
  return result.doacRecommendations.find(r => r.doac === doacName);
}
```

**Orchestration Step 7 updated:**

```
// OLD (broken): renalResult.doacRecommendations[doac]
// NEW (correct): getRenalRecommendation(renalResult, doac)
FOR EACH doac IN [apixaban, rivaroxaban]:
  renalRec = getRenalRecommendation(renalResult, doac)
  option.renalStatus = renalRec.recommendation  // "standard" | "caution" | "avoid"
```

The `doacRecommendations` array should always contain 6 entries:

- apixaban
- rivaroxaban
- dabigatran
- edoxaban
- enoxaparin
- dalteparin

---

## ISSUE 9: HIT Contraindication — appliesTo-Aware Logic

**Resolution:** Orchestration Step 4 must filter by `appliesTo` before making a global "contraindicated" determination.

**Revised Step 4:**

```
// STEP 4: Detect contraindications
contraindicationResult = detectContraindications(patientData)

// Check for UNIVERSAL absolute contraindications (appliesTo == "all")
universalAbsolute = contraindicationResult.absolute.filter(c => c.appliesTo === "all")
IF universalAbsolute.length > 0:
  // e.g., platelets <50K, active major bleeding
  RETURN {overallAction: "contraindicated", contraindications: contraindicationResult}

// Check for TARGETED absolute contraindications (appliesTo == specific agents)
targetedAbsolute = contraindicationResult.absolute.filter(c => c.appliesTo !== "all")
// These don't block the whole pipeline — they block specific agents
// Pass them through to Step 7 where individual DOAC options are built
```

**Step 7 (revised):**

```
FOR EACH doac IN [apixaban, rivaroxaban]:
  // Check if this specific DOAC is blocked by a targeted contraindication
  isBlocked = targetedAbsolute.some(c => c.appliesTo.includes(doac))
  option.eligible = !isBlocked AND renalStatus != "avoid" AND worstDDI != "major"
  IF isBlocked:
    option.ineligibleReason = targetedAbsolute.find(c => c.appliesTo.includes(doac)).reason

// Same for LMWH:
FOR EACH lmwh IN [enoxaparin, dalteparin]:
  isBlocked = targetedAbsolute.some(c => c.appliesTo.includes(lmwh))
  // HIT patient: enoxaparin and dalteparin blocked, DOACs still available
```

**Example — HIT patient:**

- Contraindication: `{type: "absolute", reason: "hit", appliesTo: ["enoxaparin", "dalteparin", "heparin"]}`
- Result: LMWH blocked, DOACs remain eligible (apixaban/rivaroxaban can be recommended)
- This is clinically correct — DOACs are actually preferred in HIT

**Additional unit test:**

- **Test 9: "HIT blocks LMWH but not DOACs"**
  - Input: `conditions = [{code: "D75.82"}], platelets = 85`
  - Expected:
    - `absolute = [{type: "absolute", reason: "hit", appliesTo: ["enoxaparin", "dalteparin"]}]`
    - `canProceedWithProphylaxis = true`  // DOACs still available
    - Orchestration: apixaban `eligible = true`, enoxaparin `eligible = false`

---

## ISSUE 10: Test Shape Alignment with Interfaces

**Resolution:** All tests must use the exact interface shape. Standardize string conventions.

**Exclusion tests — use nested shape:**

```
// WRONG (flat):
Test 16: Expected: exclusion = true, exclusionReason = "multiple_myeloma"

// CORRECT (matches KhoranaResult interface):
Test 16: Expected: exclusion.isExcluded = true, exclusion.reason = "multiple_myeloma"
Test 17: Expected: exclusion.isExcluded = true, exclusion.reason = "brain_tumor"
```

**String convention — use snake_case for all reason strings:**

```
// Canonical reason strings (snake_case, lowercase):
"multiple_myeloma"
"brain_tumor"
"acute_leukemia"
"mpn"
"severe_thrombocytopenia"    // platelets <50K
"antiphospholipid_syndrome"  // APS
"hit"                        // HIT (acronym, still lowercase in code)
"active_major_bleeding"
"severe_hepatic_impairment"
"gi_tract_cancer"
"concurrent_antiplatelet"
"low_weight"
"sarcopenia"
"nephrotoxic_chemotherapy"
```

**Contraindication test shapes — align with `ContraindicationResult`:**

```
// CORRECT shapes:
Test 1: Expected: absolute includes {type: "absolute", reason: "severe_thrombocytopenia", appliesTo: "all"}
Test 3: Expected: absolute includes {type: "absolute", reason: "antiphospholipid_syndrome", appliesTo: "all"}
Test 4: Expected: absolute includes {type: "absolute", reason: "hit", appliesTo: ["enoxaparin", "dalteparin"]}
Test 5: Expected: relative includes {type: "relative", reason: "gi_tract_cancer", appliesTo: "all"}
Test 6: Expected: relative includes {type: "relative", reason: "concurrent_antiplatelet", appliesTo: "all"}
Test 7: Expected: relative includes {type: "relative", reason: "low_weight", appliesTo: ["apixaban"]}
```

---

## SUMMARY OF ALL CHANGES

| Issue | What Changed | Files Affected |
|---|---|---|
| 1. Max score | 7 → 6 | `khorana-engine.ts`, tests |
| 2. Risk cutoffs | Score 1 = Low (not Intermediate) | `khorana-engine.ts`, data docs, add Test 20 |
| 3. Paclitaxel | Split into 3 entries; Patient 1 uses RxNorm 686924 | `ddi-knowledge-base.json`, patient-1 bundle, integration test 1 |
| 4. Dabigatran/edoxaban | DDI-only, not prophylaxis options | `recommendation.ts`, DOACOption interface, UI |
| 5. C90.0 prefix | Confirm `startsWith()` matcher | `icd10-cancer-map.ts` |
| 6. camelCase | JSON matches TS interface; add `sources` field | `ddi-knowledge-base.json`, `ddi.ts` |
| 7. checkDDIs | Always returns full per-DOAC shape; add `getWorstDDIForDoac` helper | `ddi-checker.ts`, all DDI tests rewritten |
| 8. Renal array | Add `getRenalRecommendation()` helper | `renal-dosing.ts`, `recommendation.ts` |
| 9. HIT logic | `appliesTo`-aware filtering in orchestration | `contraindications.ts`, `recommendation.ts`, add Test 9 |
| 10. Test shapes | Nested exclusion, snake_case reasons | All test files |
