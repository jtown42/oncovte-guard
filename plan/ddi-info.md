# OncoVTE Guard — Clinical Values Reference for Coding Agent

> Comprehensive, literature-verified reference document containing every clinical value the coding agent needs to build the three core engines. All values are sourced and ready to encode.

> ⚠️ **PRECEDENCE NOTICE:** `errata-contract-reconciliation.md` is AUTHORITATIVE and overrides this file wherever they conflict. Known overrides: max Khorana score is **6** not 7 (Part 1A); score **1 = Low Risk** not Intermediate (Part 1B); **paclitaxel** is MINOR–MODERATE and nab-paclitaxel uses RxNorm **686924** not 56946 (Part 3C / Patient 1); **dabigatran & edoxaban are DDI-reference-only, never prophylaxis recommendations** (Parts 5, 12); DDI knowledge base JSON is **camelCase** with a `sources` field (Part 3D); `checkDDIs()` always returns the full per-DOAC shape (Part 8C); HIT contraindication is `appliesTo`-scoped (Parts 4, 12). Always read the errata before implementing.

---

## PART 1: KHORANA VTE RISK SCORE ENGINE

### 1A. Scoring Criteria (5 variables, max score = 7)

| Variable | Threshold | Points |
|---|---|---|
| Cancer site — Very high risk (stomach, pancreas) | Present | 2 |
| Cancer site — High risk (lung, lymphoma, gynecologic, bladder, testicular) | Present | 1 |
| Cancer site — All other solid tumors | Present | 0 |
| Prechemotherapy platelet count | ≥350 × 10⁹/L | 1 |
| Hemoglobin | <10 g/dL OR use of erythropoiesis-stimulating agents (ESAs) | 1 |
| Prechemotherapy leukocyte (WBC) count | >11 × 10⁹/L | 1 |
| Body mass index (BMI) | ≥35 kg/m² | 1 |

Source: NCCN Cancer-Associated VTE Guidelines v1.2026, VTE-C; Khorana et al. original derivation/validation.

### 1B. Risk Categories and VTE Incidence

| Total Score | Risk Category | 6-Month VTE Risk (original validation) | 6-Month VTE Risk (meta-analysis, Mulder 2019) |
|---|---|---|---|
| 0 | Low | 0.3–1.5% | 5.0% (95% CI 3.9–6.5%) |
| 1–2 | Intermediate | 2.0–4.8% | 6.6% (95% CI 5.6–7.7%) |
| ≥3 | High | 6.7–12.9% | 11.0% (95% CI 8.8–13.8%) |

Note: The original Khorana validation rates (0.3–1.5%, 2.0–4.8%, 6.7–12.9%) are the values used in the NCCN guideline table. The meta-analysis rates from Mulder et al. 2019 (n=34,555) are higher across all categories, reflecting real-world heterogeneity. Use the NCCN-cited ranges in the app display.

### 1C. Prophylaxis Threshold

- **Khorana ≥2:** NCCN and ASCO recommend considering anticoagulant prophylaxis for up to 6 months (or longer if risk persists).
- **Khorana <2:** No routine VTE prophylaxis recommended.

Source: NCCN VTE-2; ASCO 2023 VTE Guideline Update.

### 1D. ICD-10 to Cancer Category Mapping

Encode the following ICD-10 prefix → Khorana category mapping:

**Very High Risk (2 points)**

| Cancer | ICD-10 Codes |
|---|---|
| Stomach (gastric) | C16.x |
| Pancreas | C25.x |

**High Risk (1 point)**

| Cancer | ICD-10 Codes |
|---|---|
| Lung | C34.x |
| Lymphoma (Hodgkin) | C81.x |
| Lymphoma (Non-Hodgkin) | C82.x, C83.x, C84.x, C85.x, C86.x |
| Gynecologic — Ovary | C56.x |
| Gynecologic — Uterus | C54.x, C55 |
| Gynecologic — Cervix | C53.x |
| Gynecologic — Other | C51.x, C52, C57.x, C58 |
| Bladder | C67.x |
| Testicular | C62.x |
| Kidney/Renal | C64, C65, C66, C68.x |

Note: The JACC review (Mosarla et al. 2019) lists "genitourinary excluding prostate" as high risk, which includes kidney/renal. Some sources include kidney in the high-risk category. The NCCN table specifically lists "bladder, testicular" — for maximum fidelity to NCCN, code bladder and testicular as high risk. Kidney can be included as high risk per the JACC/ASCO interpretation, but flag it with a note.

**Standard Risk (0 points)**

All other C00–C97 codes not listed above, including:

- Breast (C50.x)
- Colorectal (C18.x, C19, C20)
- Prostate (C61)
- Head and neck (C00–C14, C30–C32)
- Melanoma (C43.x)
- Hepatobiliary (C22.x, C23, C24.x)
- Esophageal (C15.x)
- Brain/CNS (C71.x) — NOTE: Brain tumors are EXCLUDED from Khorana-based prophylaxis per NCCN VTE-2
- All others

**Special Exclusions (do NOT apply Khorana-based prophylaxis)**

Per NCCN VTE-2, the following populations follow separate pathways:

- Multiple myeloma (C90.0) — separate prophylaxis pathway (see NCCN MM guidelines)
- Acute leukemia (C91.0, C92.0, etc.)
- Myeloproliferative neoplasms (D47.1, D45, D47.3, etc.)
- Primary/metastatic brain tumors (C71.x, C79.31)

The app should detect these and display: "Khorana score not applicable for this cancer type. See disease-specific guidelines."

### 1E. LOINC Codes for Lab Values

| Lab | LOINC Code | Units |
|---|---|---|
| Platelet count | 777-3 | 10⁹/L (or ×10³/μL — equivalent) |
| Hemoglobin | 718-7 | g/dL |
| Leukocyte (WBC) count | 6690-2 | 10⁹/L (or ×10³/μL) |
| Serum creatinine | 2160-0 | mg/dL |
| Body weight | 29463-7 | kg |
| Body height | 8302-2 | cm |
| ALT | 1742-6 | U/L |
| AST | 1920-8 | U/L |
| Total bilirubin | 1975-2 | mg/dL |

### 1F. BMI Calculation

- BMI = weight (kg) / [height (m)]²
- Threshold: ≥35 kg/m²

### 1G. Stale Lab Threshold

Flag labs as "stale" if >30 days old from current date. Still use them for calculation but display a warning: "Lab values are >30 days old. Consider repeating before clinical decision."

### 1H. Edge Cases to Handle

- **Multiple malignancies:** Use the highest-scoring cancer category.
- **Hematologic malignancies with disease-related cytopenias/leukocytosis:** Display contextual warning: "Khorana score may be less reliable when cytopenias or leukocytosis are disease-related rather than treatment-related."
- **Missing data:** Compute partial score with explicit missing-data flags. Display: "Score: X (incomplete — missing: [list]). Full score requires: [list]."
- **Boundary values:** Platelets exactly 350 → scores 1 point (threshold is ≥350). Hemoglobin exactly 10.0 → does NOT score (threshold is <10). WBC exactly 11.0 → does NOT score (threshold is >11).

---

## PART 2: DOAC RENAL DOSING MODULE

### 2A. Cockcroft-Gault Formula for CrCl

CrCl (mL/min) = [(140 − age) × weight (kg) × (0.85 if female)] / [72 × serum creatinine (mg/dL)]

- Use actual body weight.
- Use the Cockcroft-Gault formula specifically (not MDRD or CKD-EPI), as this is the formula used in DOAC clinical trials and recommended by regulatory agencies.

### 2B. DOAC Renal Dosing Thresholds for VTE Prophylaxis in Cancer

These thresholds are specific to the VTE PROPHYLAXIS indication in ambulatory cancer patients, per NCCN VTE-B:

| DOAC | Standard Prophylaxis Dose | CrCl <30 mL/min | CrCl 30–49 mL/min | Additional Considerations |
|---|---|---|---|---|
| Apixaban | 2.5 mg PO BID | Use with CAUTION (limited data; patients with CrCl <30 excluded from prophylaxis trials) | No dose adjustment | Avoid if platelet count <50,000/μL; avoid if weight <40 kg |
| Rivaroxaban | 10 mg PO daily | AVOID | No dose adjustment | Avoid if platelet count <50,000/μL |
| Dalteparin (LMWH) | 200 units/kg SC daily × 1 month, then 150 units/kg SC daily | AVOID if CrCl <30 | No dose adjustment | Avoid if platelet count <50,000/μL |
| Enoxaparin (LMWH) | 1 mg/kg SC daily × 3 months, then 40 mg SC daily | AVOID if CrCl <30 | No dose adjustment | Avoid if platelet count <50,000/μL |

Source: NCCN VTE-B 2 of 4 (Ambulatory Medical Oncology Patients).

### 2C. General DOAC Renal Thresholds (for reference — AF/VTE treatment indications)

Per ACC/AHA 2023 AF Guideline, Table 19:

| DOAC | CrCl >95 | CrCl 51–95 | CrCl 31–50 | CrCl 15–30 | CrCl <15 or dialysis |
|---|---|---|---|---|---|
| Apixaban | 5 or 2.5 mg BID | 5 or 2.5 mg BID | 5 or 2.5 mg BID | 5 or 2.5 mg BID | 5 or 2.5 mg BID |
| Dabigatran | 150 mg BID | 150 mg BID | 150 mg BID | 75 mg BID | Contraindicated |
| Edoxaban | Contraindicated | 60 mg daily | 30 mg daily | 30 mg daily | Contraindicated |
| Rivaroxaban | 20 mg daily | 20 mg daily | 15 mg daily | 15 mg daily | 15 mg daily |

Note: For the OncoVTE Guard app, use the PROPHYLAXIS-specific thresholds from Part 2B above. The general thresholds in 2C are for reference only and apply to AF/VTE treatment indications.

### 2D. Apixaban Dose Reduction Criteria (AF indication — for reference)

Reduce to 2.5 mg BID if ≥2 of the following 3 criteria are met:

- Age ≥80 years
- Body weight ≤60 kg
- Serum creatinine ≥1.5 mg/dL

Note: This rule applies to the AF indication. For cancer VTE prophylaxis, the dose is already 2.5 mg BID, so this rule is not directly applicable but should be noted in the app for patients who are on apixaban for other indications.

### 2E. Renal Clearance of DOACs (for display/education)

| DOAC | Renal Clearance (%) |
|---|---|
| Dabigatran | 80% |
| Edoxaban | 50% |
| Rivaroxaban | 33–35% |
| Apixaban | 27% |

Source: 2026 AHA/ACC PE Guideline; Zhu et al. 2026.

### 2F. Cancer-Specific Renal Caveats

- **Sarcopenia flag:** If BMI <18.5, display: "Low BMI may indicate sarcopenia. Cockcroft-Gault may overestimate CrCl due to low muscle mass. Consider cystatin C-based GFR or clinical judgment."
- **Nephrotoxic chemotherapy flag:** If active MedicationRequest includes cisplatin (RxNorm: 2555), carboplatin (RxNorm: 40048), or methotrexate (RxNorm: 6851), display: "Patient is on nephrotoxic chemotherapy. Monitor renal function closely and reassess DOAC dosing."

---

## PART 3: DOAC-CHEMOTHERAPY DDI KNOWLEDGE BASE

### 3A. Pharmacological Framework

DOACs interact with antineoplastic agents through two primary mechanisms:

- **P-glycoprotein (P-gp):** All four DOACs are P-gp substrates. P-gp inhibitors increase DOAC absorption and decrease elimination → increased DOAC levels → bleeding risk. P-gp inducers decrease DOAC levels → reduced efficacy → thrombosis risk.
- **CYP3A4:** Rivaroxaban (66% CYP3A4 metabolism) and apixaban (15%) are affected. Dabigatran (0%) and edoxaban (<4%) are minimally affected by CYP3A4.

Key principle: Strong dual inhibitors of both CYP3A4 and P-gp pose the greatest risk to apixaban and rivaroxaban. Strong P-gp inhibitors alone affect all DOACs. Strong CYP3A4 inducers reduce levels of rivaroxaban and apixaban most significantly.

Source: AHA Scientific Statement on Cardio-Oncology Drug Interactions (Beavers et al. 2022); Hellfritzsch et al. 2024; Mosarla et al. JACC 2019.

### 3B. DDI Severity Classification System

For each antineoplastic agent, classify the interaction with each DOAC as:

| Severity | Definition | App Display Color | Clinical Action |
|---|---|---|---|
| MAJOR (Avoid) | Strong dual CYP3A4 + P-gp inhibitor/inducer; expected clinically significant change in DOAC levels | Red | "AVOID combination. Consider LMWH or alternative DOAC." |
| MODERATE (Caution) | Moderate CYP3A4 or P-gp effect; potential for clinically relevant interaction | Yellow/Orange | "USE WITH CAUTION. Monitor for bleeding/thrombosis. Consider alternative DOAC." |
| MINOR (Monitor) | Mild or competitive effect; unlikely to be clinically significant | Light Yellow | "Low interaction risk. Standard monitoring." |
| NONE (Compatible) | No known CYP3A4 or P-gp interaction | Green | "No known pharmacokinetic interaction." |
| PD (Pharmacodynamic) | No PK interaction but intrinsic bleeding/thrombotic risk | Blue | "No PK interaction, but pharmacodynamic bleeding risk. Clinical judgment required." |

### 3C. DDI Knowledge Base — High-Priority Agents (Starter Set)

The following table provides the interaction profile for high-priority antineoplastic agents. This is the minimum set for the MVP. The full 50+ agent database should be built from Hellfritzsch et al. 2024 (100 agents evaluated) and the AHA Scientific Statement Table 3.

**STRONG DUAL INHIBITORS (CYP3A4 + P-gp) — MAJOR interactions with apixaban/rivaroxaban**

| Agent | Drug Class | P-gp Effect | CYP3A4 Effect | Apixaban | Rivaroxaban | Dabigatran | Edoxaban | RxNorm |
|---|---|---|---|---|---|---|---|---|
| Ibrutinib | BTK inhibitor | Strong inhibitor | Strong inhibitor | MAJOR — Avoid | MAJOR — Avoid | MODERATE — Caution | MINOR — Monitor | 1442981 |
| Idelalisib | PI3K inhibitor | Strong inhibitor (in vitro) | Strong inhibitor | MAJOR — Avoid | MAJOR — Avoid/dose reduce | MODERATE — Caution | MINOR — Monitor | 1547523 |
| Itraconazole* | Antifungal (supportive) | Strong inhibitor | Strong inhibitor | MAJOR — Avoid or 50% dose reduce | MAJOR — Avoid | MODERATE — Caution | MODERATE — Caution | 28031 |
| Ketoconazole* | Antifungal (supportive) | Strong inhibitor | Strong inhibitor | MAJOR — Avoid or 50% dose reduce | MAJOR — Contraindicated | MODERATE — Caution | MODERATE — Caution | 6135 |
| Posaconazole* | Antifungal (supportive) | Strong inhibitor | Strong inhibitor | MAJOR — Avoid or 50% dose reduce | MAJOR — Avoid | MODERATE — Caution | MODERATE — Caution | 282446 |
| Voriconazole* | Antifungal (supportive) | Moderate inhibitor | Strong inhibitor | MODERATE — Caution | MODERATE — Caution | MINOR — Monitor | MINOR — Monitor | 121243 |

\*Antifungals are included because they are commonly co-prescribed in oncology patients and are the most clinically significant CYP3A4/P-gp inhibitors.

**STRONG CYP3A4 INDUCERS — Reduce DOAC levels (thrombosis risk)**

| Agent | Drug Class | P-gp Effect | CYP3A4 Effect | Apixaban | Rivaroxaban | Dabigatran | Edoxaban | RxNorm |
|---|---|---|---|---|---|---|---|---|
| Enzalutamide | Androgen receptor inhibitor | Moderate inducer | Strong inducer | MAJOR — Avoid | MAJOR — Avoid | MINOR — Monitor | MINOR — Monitor | 1232107 |
| Apalutamide | Androgen receptor inhibitor | Moderate inducer | Strong inducer | MAJOR — Avoid | MAJOR — Avoid | MINOR — Monitor | MINOR — Monitor | 2049106 |
| Mitotane | Adrenocortical agent | Unknown | Strong inducer | MAJOR — Avoid | MAJOR — Avoid | MINOR — Monitor | MINOR — Monitor | 6879 |

**MODERATE INHIBITORS — Use with caution**

| Agent | Drug Class | P-gp Effect | CYP3A4 Effect | Apixaban | Rivaroxaban | Dabigatran | Edoxaban | RxNorm |
|---|---|---|---|---|---|---|---|---|
| Imatinib | TKI (BCR-ABL) | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 282388 |
| Nilotinib | TKI (BCR-ABL) | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 644241 |
| Crizotinib | TKI (ALK) | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 1148494 |
| Ceritinib | TKI (ALK) | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 1535457 |
| Ribociclib | CDK4/6 inhibitor | Unknown | Moderate inhibitor | MODERATE | MODERATE | MINOR | MINOR | 1873983 |
| Tucatinib | TKI (HER2) | Unknown | Moderate inhibitor | MODERATE | MODERATE | MINOR | MINOR | 2361290 |
| Aprepitant | NK1 antagonist (antiemetic) | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 358255 |
| Cyclosporine | Immunosuppressant | Strong inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MODERATE | 3008 |
| Tacrolimus | Immunosuppressant | Strong inhibitor | Minor inhibitor | MODERATE | MINOR | MODERATE | MINOR | 42316 |
| Abiraterone | Androgen synthesis inhibitor | Moderate inhibitor | Moderate inhibitor | MODERATE | MODERATE | MODERATE | MINOR | 1100072 |
| Neratinib | TKI (HER2) | Strong inhibitor | Unknown | MODERATE | MODERATE | MODERATE | MODERATE | 1927880 |

**MODERATE INDUCERS**

| Agent | Drug Class | P-gp Effect | CYP3A4 Effect | Apixaban | Rivaroxaban | Dabigatran | Edoxaban | RxNorm |
|---|---|---|---|---|---|---|---|---|
| Dexamethasone | Corticosteroid | Strong P-gp inducer | Moderate CYP3A4 inducer | MODERATE | MODERATE | MODERATE | MINOR | 3264 |
| Dabrafenib | BRAF inhibitor | Moderate inducer | Moderate inducer | MODERATE | MODERATE | MINOR | MINOR | 1425672 |
| Vemurafenib | BRAF inhibitor | Moderate inducer | Moderate inducer | MODERATE | MODERATE | MINOR | MINOR | 1147220 |

**PHARMACODYNAMIC INTERACTIONS (no PK interaction, but bleeding risk)**

| Agent | Drug Class | Mechanism | All DOACs | RxNorm |
|---|---|---|---|---|
| Bevacizumab | Anti-VEGF mAb | Impaired wound healing, GI perforation risk, increased bleeding | PD — Increased bleeding risk | 253337 |
| Ramucirumab | Anti-VEGFR2 mAb | Increased bleeding risk | PD — Increased bleeding risk | 1424911 |
| Lenvatinib | Multi-TKI (VEGFR) | Increased bleeding risk | PD — Increased bleeding risk | 1594772 |
| Cabozantinib | Multi-TKI (VEGFR) | Increased bleeding risk | PD — Increased bleeding risk | 1291270 |

**NO SIGNIFICANT INTERACTION (Compatible with all DOACs)**

| Agent | Drug Class | RxNorm |
|---|---|---|
| Carboplatin | Platinum | 40048 |
| Cisplatin | Platinum | 2555 |
| Oxaliplatin | Platinum | 32592 |
| Pemetrexed | Antimetabolite | 258702 |
| Gemcitabine | Antimetabolite | 12574 |
| 5-Fluorouracil | Antimetabolite | 4492 |
| Capecitabine | Antimetabolite (prodrug of 5-FU) | 194000 |
| Methotrexate | Antimetabolite | 6851 |
| Trastuzumab | Anti-HER2 mAb | 224905 |
| Pertuzumab | Anti-HER2 mAb | 1298944 |
| Rituximab | Anti-CD20 mAb | 121191 |
| Pembrolizumab | Anti-PD-1 mAb | 1547545 |
| Nivolumab | Anti-PD-1 mAb | 1597876 |
| Atezolizumab | Anti-PD-L1 mAb | 1792776 |
| Durvalumab | Anti-PD-L1 mAb | 1919503 |
| Ipilimumab | Anti-CTLA-4 mAb | 1094833 |
| Docetaxel | Taxane | 72962 |
| Paclitaxel | Taxane | 56946 |
| Bendamustine | Alkylating agent | 134547 |
| Bleomycin | Intercalating agent | 1550 |

Note: Capecitabine has a known interaction with WARFARIN (inhibits CYP2C9) but does NOT have a clinically significant PK interaction with DOACs. However, capecitabine can cause thrombocytopenia, which is a pharmacodynamic consideration.

**AGENTS REQUIRING SPECIAL NOTES**

| Agent | Note |
|---|---|
| Doxorubicin | P-gp INDUCER (strong). May reduce DOAC levels. MODERATE interaction with all DOACs. |
| Vinblastine | P-gp INDUCER (strong). May reduce DOAC levels. MODERATE interaction with all DOACs. |
| Etoposide | Mild P-gp inhibitor, mild CYP3A4 inhibitor. MINOR interaction. |
| Paclitaxel | Moderate CYP3A4 inducer. MINOR-MODERATE interaction with apixaban/rivaroxaban. |
| Tamoxifen | Mild P-gp inhibitor. MINOR interaction. But note: tamoxifen itself increases VTE risk. |
| Thalidomide/Lenalidomide/Pomalidomide | Follow NCCN Multiple Myeloma guidelines for VTE prophylaxis (separate pathway). |

### 3D. JSON Schema for DDI Knowledge Base

```json
{
  "agent_name": "ibrutinib",
  "brand_name": "Imbruvica",
  "rxnorm_code": "1442981",
  "drug_class": "BTK inhibitor",
  "pgp_effect": "strong_inhibitor",
  "cyp3a4_effect": "strong_inhibitor",
  "interactions": {
    "apixaban": {
      "severity": "major",
      "mechanism": "Strong dual CYP3A4 and P-gp inhibition increases apixaban exposure significantly",
      "recommendation": "AVOID combination. Use LMWH instead.",
      "alternative_doac": "Consider edoxaban (minimal CYP3A4 dependence) with close monitoring if DOAC required"
    },
    "rivaroxaban": {
      "severity": "major",
      "mechanism": "Strong dual CYP3A4 and P-gp inhibition increases rivaroxaban exposure significantly",
      "recommendation": "AVOID combination. Use LMWH instead.",
      "alternative_doac": "Consider edoxaban with close monitoring if DOAC required"
    },
    "dabigatran": {
      "severity": "moderate",
      "mechanism": "Strong P-gp inhibition increases dabigatran absorption. No CYP3A4 effect on dabigatran.",
      "recommendation": "Use with caution. Monitor for bleeding signs.",
      "alternative_doac": null
    },
    "edoxaban": {
      "severity": "minor",
      "mechanism": "P-gp inhibition may modestly increase edoxaban levels. Minimal clinical significance expected.",
      "recommendation": "Standard monitoring. Edoxaban is the least affected DOAC.",
      "alternative_doac": null
    }
  },
  "pharmacodynamic_bleeding_risk": false,
  "notes": "Ibrutinib also has intrinsic platelet dysfunction effects independent of DOAC interaction. Consider bleeding risk from both mechanisms.",
  "sources": ["AHA Scientific Statement 2022", "Hellfritzsch et al. 2024"]
}
```

Use this schema for all 50+ agents. The severity field accepts: `"major"`, `"moderate"`, `"minor"`, `"none"`, `"pharmacodynamic"`.

---

## PART 4: CONTRAINDICATION DETECTION

### 4A. Absolute Contraindications to DOAC Prophylaxis

| Contraindication | Detection Method | ICD-10 / Lab Threshold |
|---|---|---|
| Active major bleeding | Condition resource | — (clinical judgment) |
| Severe thrombocytopenia | Observation (platelets) | Platelet count <50,000/μL |
| Antiphospholipid syndrome (triple-positive) | Condition resource | D68.61 |
| Severe hepatic impairment (Child-Pugh C) | Observation (labs) | Total bilirubin >3 mg/dL AND (ALT or AST >5× ULN) |
| Heparin-induced thrombocytopenia (for LMWH) | Condition resource | D75.82 (HIT) — flag as contraindication to LMWH only; DOACs are an option |

### 4B. Relative Cautions / Warnings

| Caution | Detection | Display Message |
|---|---|---|
| GI/GU tract cancer (gastric, gastroesophageal, bladder) | Condition (ICD-10 C16.x, C15.x for GEJ, C67.x) | "Patients with gastric/GEJ tumors are at increased risk for hemorrhage with DOACs. Apixaban may be safer than edoxaban or rivaroxaban (NCCN category 2B). Consider LMWH." |
| Brain tumors (primary or metastatic) | Condition (C71.x, C79.31) | "Patients with primary/metastatic brain tumors are excluded from Khorana-based prophylaxis recommendations. Individualized risk-benefit assessment required." |
| Multiple myeloma on IMiDs | Condition (C90.0) + MedicationRequest (thalidomide/lenalidomide/pomalidomide) | "Multiple myeloma patients on IMiD-based therapy follow a separate VTE prophylaxis pathway. See NCCN Multiple Myeloma guidelines." |
| Weight <40 kg | Observation (weight) | "Apixaban: avoid if weight <40 kg per NCCN. Consider LMWH with weight-based dosing." |
| Concurrent antiplatelet therapy | MedicationRequest (aspirin, clopidogrel, etc.) | "Concurrent antiplatelet + anticoagulant therapy increases bleeding risk. Assess indication for dual therapy." |

---

## PART 5: PROPHYLAXIS DOSING RECOMMENDATIONS (OUTPUT)

When the app generates a recommendation, display the following based on the clinical scenario:

**Ambulatory Cancer Patient, Khorana ≥2, No Contraindications**

Preferred options (NCCN VTE-B 2 of 4):

- Apixaban 2.5 mg PO BID (for up to 6 months or longer if risk persists)
- Rivaroxaban 10 mg PO daily

Alternative options:

- Dalteparin 200 units/kg SC daily × 1 month, then 150 units/kg SC daily × 2 months
- Enoxaparin 1 mg/kg SC daily × 3 months, then 40 mg SC daily

**If CrCl <30 mL/min**

- Rivaroxaban: AVOID
- Apixaban: Use with CAUTION (limited data)
- LMWH: AVOID
- Consider UFH or apixaban with close monitoring in extenuating circumstances

**If Platelet Count <50,000/μL**

- All anticoagulants: AVOID until platelet recovery

---

## PART 6: LOINC AND RXNORM CODE REFERENCE

### Key LOINC Codes (already listed in 1E, consolidated here)

- 777-3: Platelet count
- 718-7: Hemoglobin
- 6690-2: Leukocyte count
- 2160-0: Serum creatinine
- 29463-7: Body weight
- 8302-2: Body height
- 39156-5: BMI (if directly available)
- 1742-6: ALT
- 1920-8: AST
- 1975-2: Total bilirubin

### Key RxNorm Codes for DOACs

- Apixaban: 1364430
- Rivaroxaban: 1114195
- Dabigatran: 1037042
- Edoxaban: 1599538
- Enoxaparin: 67108
- Dalteparin: 27340
- Heparin (UFH): 5224
- Warfarin: 11289

### Key RxNorm Codes for Antiplatelets (for concurrent antiplatelet detection)

- Aspirin: 1191
- Clopidogrel: 32968
- Prasugrel: 613391
- Ticagrelor: 1116632

### Key RxNorm Codes for Nephrotoxic Chemotherapy (for renal monitoring flag)

- Cisplatin: 2555
- Carboplatin: 40048
- Methotrexate: 6851

### Key RxNorm Codes for ESAs (for Khorana hemoglobin criterion)

- Epoetin alfa: 3521
- Darbepoetin alfa: 237071

### Key RxNorm Codes for IMiDs (for multiple myeloma pathway detection)

- Thalidomide: 10324
- Lenalidomide: 321191
- Pomalidomide: 1369409

---

## PART 7: SYNTHETIC PATIENT FHIR BUNDLES

Build 5 synthetic patients as FHIR R4 Bundles (type: `"collection"`). Each patient tests a different clinical pathway through the app. All bundles should be valid FHIR R4 JSON and loadable into the SMART App Launcher or any FHIR R4 server.

### Patient 1: "Maria Santos" — High Khorana, Clean Medications, Normal Renal

Purpose: Tests the core Khorana engine and straightforward prophylaxis recommendation.

- Demographics: 58-year-old female, Hispanic, weight 95 kg, height 162 cm
- BMI: 36.2 kg/m² (≥35 → 1 point)
- Cancer: Pancreatic adenocarcinoma (C25.1) — Very high risk → 2 points
- Labs (dated 5 days ago):
  - Platelets: 410 × 10⁹/L (≥350 → 1 point)
  - Hemoglobin: 9.2 g/dL (<10 → 1 point)
  - WBC: 8.5 × 10⁹/L (≤11 → 0 points)
  - Serum creatinine: 0.8 mg/dL
- Expected Khorana Score: 2 + 1 + 1 + 0 + 1 = 5 (High Risk)
- Medications: Gemcitabine (12574), nab-paclitaxel (56946) — no DDIs with DOACs
- CrCl: [(140 − 58) × 95 × 0.85] / [72 × 0.8] = 115.5 mL/min — no renal adjustment
- Expected Output: Khorana 5 (High). Recommend apixaban 2.5 mg BID or rivaroxaban 10 mg daily. No DDIs detected. No contraindications. No renal dose adjustment needed.

FHIR Resources needed:

- Patient (name, birthDate, gender, race/ethnicity extensions)
- Condition (C25.1, clinicalStatus: active)
- Observation × 5 (platelets, hemoglobin, WBC, creatinine, body weight)
- Observation × 1 (body height)
- MedicationRequest × 2 (gemcitabine, nab-paclitaxel, status: active)

### Patient 2: "James Chen" — Moderate Khorana, Major DDI (Ibrutinib), Normal Renal

Purpose: Tests DDI detection engine — ibrutinib + apixaban/rivaroxaban = MAJOR.

- Demographics: 72-year-old male, Asian, weight 78 kg, height 175 cm
- BMI: 25.5 kg/m² (<35 → 0 points)
- Cancer: Mantle cell lymphoma (C83.1) — High risk (lymphoma) → 1 point
- Labs (dated 10 days ago):
  - Platelets: 195 × 10⁹/L (<350 → 0 points)
  - Hemoglobin: 11.8 g/dL (≥10 → 0 points)
  - WBC: 12.3 × 10⁹/L (>11 → 1 point)
  - Serum creatinine: 1.1 mg/dL
- Expected Khorana Score: 1 + 0 + 0 + 1 + 0 = 2 (Intermediate — meets ≥2 threshold)
- Medications: Ibrutinib (1442981), rituximab (121191)
- CrCl: [(140 − 72) × 78] / [72 × 1.1] = 66.9 mL/min — no renal adjustment
- Expected Output: Khorana 2 (Intermediate — prophylaxis recommended). DDI ALERT: Ibrutinib + apixaban = MAJOR. Ibrutinib + rivaroxaban = MAJOR. Recommend LMWH (dalteparin or enoxaparin) instead. Rituximab: no interaction. No contraindications. No renal adjustment.

FHIR Resources needed:

- Patient, Condition (C83.1), Observation × 5, MedicationRequest × 2 (ibrutinib, rituximab)

### Patient 3: "Dorothy Williams" — High Khorana, Renal Impairment (CrCl <30), Thrombocytopenia

Purpose: Tests renal dosing module AND contraindication detection (platelets <50K).

- Demographics: 81-year-old female, Black/African American, weight 52 kg, height 155 cm
- BMI: 21.6 kg/m² (<35 → 0 points)
- Cancer: Non-small cell lung cancer (C34.1) — High risk → 1 point
- Labs (dated 3 days ago):
  - Platelets: 42 × 10⁹/L (<50K → CONTRAINDICATION)
  - Hemoglobin: 8.9 g/dL (<10 → 1 point)
  - WBC: 14.2 × 10⁹/L (>11 → 1 point)
  - Serum creatinine: 2.8 mg/dL
- Expected Khorana Score: 1 + 0 + 1 + 1 + 0 = 3 (High Risk)
- Medications: Carboplatin (40048), pemetrexed (258702), pembrolizumab (1547545)
- CrCl: [(140 − 81) × 52 × 0.85] / [72 × 2.8] = 12.9 mL/min — Severe renal impairment
- Expected Output: Khorana 3 (High). CONTRAINDICATION: Platelets 42K — all anticoagulants contraindicated until platelet recovery. Additionally: CrCl 12.9 mL/min — rivaroxaban AVOID, LMWH AVOID, apixaban use with extreme caution. No DDIs detected (carboplatin, pemetrexed, pembrolizumab all compatible). Nephrotoxic chemotherapy flag: carboplatin detected.

FHIR Resources needed:

- Patient, Condition (C34.1), Observation × 5, MedicationRequest × 3

### Patient 4: "Robert Johnson" — Low Khorana (No Prophylaxis), Moderate DDI, Stale Labs

Purpose: Tests the "no prophylaxis recommended" pathway + stale lab warning + moderate DDI flagging for awareness.

- Demographics: 65-year-old male, White, weight 82 kg, height 178 cm
- BMI: 25.9 kg/m² (<35 → 0 points)
- Cancer: Colorectal adenocarcinoma (C18.4) — Standard risk → 0 points
- Labs (dated 45 days ago — STALE):
  - Platelets: 280 × 10⁹/L (<350 → 0 points)
  - Hemoglobin: 12.5 g/dL (≥10 → 0 points)
  - WBC: 7.8 × 10⁹/L (≤11 → 0 points)
  - Serum creatinine: 1.0 mg/dL
- Expected Khorana Score: 0 + 0 + 0 + 0 + 0 = 0 (Low Risk)
- Medications: 5-Fluorouracil (4492), oxaliplatin (32592), bevacizumab (253337)
- CrCl: [(140 − 65) × 82] / [72 × 1.0] = 85.4 mL/min
- Expected Output: Khorana 0 (Low). No routine VTE prophylaxis recommended. ⚠️ Lab values are >30 days old — consider repeating. Bevacizumab: pharmacodynamic bleeding risk noted (blue flag). 5-FU, oxaliplatin: no interaction.

FHIR Resources needed:

- Patient, Condition (C18.4), Observation × 5, MedicationRequest × 3

### Patient 5: "Priya Patel" — Multiple Myeloma (Special Exclusion) + IMiD Pathway

Purpose: Tests the special exclusion pathway — Khorana not applicable, redirect to MM-specific VTE prophylaxis.

- Demographics: 55-year-old female, Asian Indian, weight 68 kg, height 163 cm
- BMI: 25.6 kg/m²
- Cancer: Multiple myeloma (C90.00)
- Labs (dated 7 days ago):
  - Platelets: 165 × 10⁹/L
  - Hemoglobin: 9.5 g/dL
  - WBC: 5.2 × 10⁹/L
  - Serum creatinine: 1.3 mg/dL
- Medications: Lenalidomide (321191), dexamethasone (3264), bortezomib (358258)
- CrCl: [(140 − 55) × 68 × 0.85] / [72 × 1.3] = 52.6 mL/min
- Expected Output: "Khorana score not applicable for multiple myeloma. See NCCN Multiple Myeloma guidelines for VTE prophylaxis." Detect lenalidomide (IMiD) → display: "Patient is on IMiD-based therapy. NCCN recommends aspirin, LMWH, or warfarin for VTE prophylaxis based on individual risk factors." Dexamethasone: MODERATE DDI with DOACs (P-gp/CYP3A4 inducer) — flag for awareness even though DOACs are not the primary recommendation here.

FHIR Resources needed:

- Patient, Condition (C90.00), Observation × 5, MedicationRequest × 3

---

## PART 8: UNIT TEST SPECIFICATION

The coding agent should generate unit tests for every clinical logic module. Use a testing framework like Vitest (for Vite/TypeScript projects) or Jest.

### 8A. Khorana Score Engine Tests

Test Suite: `khorana-engine`

- **Test 1: "Pancreatic cancer scores 2 points for site"**
  - Input: `conditions = [{code: "C25.1"}]`
  - Expected: `cancerSiteScore = 2`
- **Test 2: "Lung cancer scores 1 point for site"**
  - Input: `conditions = [{code: "C34.9"}]`
  - Expected: `cancerSiteScore = 1`
- **Test 3: "Breast cancer scores 0 points for site"**
  - Input: `conditions = [{code: "C50.9"}]`
  - Expected: `cancerSiteScore = 0`
- **Test 4: "Platelets exactly 350 scores 1 point"**
  - Input: `platelets = 350`
  - Expected: `plateletScore = 1`
- **Test 5: "Platelets 349 scores 0 points"**
  - Input: `platelets = 349`
  - Expected: `plateletScore = 0`
- **Test 6: "Hemoglobin exactly 10.0 scores 0 points"**
  - Input: `hemoglobin = 10.0, onESA = false`
  - Expected: `hemoglobinScore = 0`
- **Test 7: "Hemoglobin 9.9 scores 1 point"**
  - Input: `hemoglobin = 9.9, onESA = false`
  - Expected: `hemoglobinScore = 1`
- **Test 8: "Hemoglobin 12.0 but on ESA scores 1 point"**
  - Input: `hemoglobin = 12.0, onESA = true`
  - Expected: `hemoglobinScore = 1`
- **Test 9: "WBC exactly 11.0 scores 0 points"**
  - Input: `wbc = 11.0`
  - Expected: `wbcScore = 0`
- **Test 10: "WBC 11.1 scores 1 point"**
  - Input: `wbc = 11.1`
  - Expected: `wbcScore = 1`
- **Test 11: "BMI exactly 35.0 scores 1 point"**
  - Input: `bmi = 35.0`
  - Expected: `bmiScore = 1`
- **Test 12: "BMI 34.9 scores 0 points"**
  - Input: `bmi = 34.9`
  - Expected: `bmiScore = 0`
- **Test 13: "Patient 1 (Maria Santos) full score = 5"**
  - Input: `{conditions: [{code: "C25.1"}], platelets: 410, hemoglobin: 9.2, wbc: 8.5, bmi: 36.2, onESA: false}`
  - Expected: `totalScore = 5, riskCategory = "high"`
- **Test 14: "Patient 2 (James Chen) full score = 2"**
  - Input: `{conditions: [{code: "C83.1"}], platelets: 195, hemoglobin: 11.8, wbc: 12.3, bmi: 25.5, onESA: false}`
  - Expected: `totalScore = 2, riskCategory = "intermediate"`
- **Test 15: "Patient 4 (Robert Johnson) full score = 0"**
  - Input: `{conditions: [{code: "C18.4"}], platelets: 280, hemoglobin: 12.5, wbc: 7.8, bmi: 25.9, onESA: false}`
  - Expected: `totalScore = 0, riskCategory = "low"`
- **Test 16: "Multiple myeloma returns special exclusion"**
  - Input: `conditions = [{code: "C90.00"}]`
  - Expected: `exclusion = true, exclusionReason = "multiple_myeloma"`
- **Test 17: "Brain tumor returns special exclusion"**
  - Input: `conditions = [{code: "C71.9"}]`
  - Expected: `exclusion = true, exclusionReason = "brain_tumor"`
- **Test 18: "Multiple malignancies uses highest-scoring site"**
  - Input: `conditions = [{code: "C50.9"}, {code: "C25.1"}]`
  - Expected: `cancerSiteScore = 2` (pancreas takes priority)
- **Test 19: "Missing platelets returns incomplete score"**
  - Input: `{conditions: [{code: "C34.1"}], platelets: null, hemoglobin: 9.0, wbc: 12.0, bmi: 30.0}`
  - Expected: `totalScore = 3, isComplete = false, missingFields = ["platelets"]`

### 8B. Renal Dosing Module Tests

Test Suite: `renal-dosing`

- **Test 1: "CrCl calculation — Patient 1 (Maria Santos)"**
  - Input: `age = 58, weight = 95, gender = "female", creatinine = 0.8`
  - Expected: `crcl ≈ 115.5 mL/min (±1)`
- **Test 2: "CrCl calculation — Patient 3 (Dorothy Williams)"**
  - Input: `age = 81, weight = 52, gender = "female", creatinine = 2.8`
  - Expected: `crcl ≈ 12.9 mL/min (±1)`
- **Test 3: "CrCl calculation — Patient 2 (James Chen)"**
  - Input: `age = 72, weight = 78, gender = "male", creatinine = 1.1`
  - Expected: `crcl ≈ 66.9 mL/min (±1)`
- **Test 4: "CrCl <30 → rivaroxaban AVOID"**
  - Input: `crcl = 25`
  - Expected: `rivaroxaban.recommendation = "avoid"`
- **Test 5: "CrCl <30 → apixaban CAUTION"**
  - Input: `crcl = 25`
  - Expected: `apixaban.recommendation = "caution"`
- **Test 6: "CrCl <30 → LMWH AVOID"**
  - Input: `crcl = 25`
  - Expected: `enoxaparin.recommendation = "avoid", dalteparin.recommendation = "avoid"`
- **Test 7: "CrCl 30–49 → no dose adjustment for any DOAC"**
  - Input: `crcl = 40`
  - Expected: `apixaban.recommendation = "standard", rivaroxaban.recommendation = "standard"`
- **Test 8: "CrCl ≥50 → no dose adjustment"**
  - Input: `crcl = 85`
  - Expected: all DOACs = `"standard"`
- **Test 9: "Sarcopenia flag when BMI <18.5"**
  - Input: `bmi = 17.2`
  - Expected: warnings includes `"sarcopenia"`
- **Test 10: "Nephrotoxic chemo flag when cisplatin present"**
  - Input: `medications = [{rxnorm: "2555"}]`
  - Expected: warnings includes `"nephrotoxic_chemotherapy"`

### 8C. DDI Checker Tests

Test Suite: `ddi-checker`

- **Test 1: "Ibrutinib + apixaban = MAJOR"**
  - Input: `medications = [{rxnorm: "1442981"}], doac = "apixaban"`
  - Expected: `severity = "major"`, recommendation contains "AVOID"
- **Test 2: "Ibrutinib + rivaroxaban = MAJOR"**
  - Input: `medications = [{rxnorm: "1442981"}], doac = "rivaroxaban"`
  - Expected: `severity = "major"`
- **Test 3: "Ibrutinib + dabigatran = MODERATE"**
  - Input: `medications = [{rxnorm: "1442981"}], doac = "dabigatran"`
  - Expected: `severity = "moderate"`
- **Test 4: "Ibrutinib + edoxaban = MINOR"**
  - Input: `medications = [{rxnorm: "1442981"}], doac = "edoxaban"`
  - Expected: `severity = "minor"`
- **Test 5: "Gemcitabine + any DOAC = NONE"**
  - Input: `medications = [{rxnorm: "12574"}], doac = "apixaban"`
  - Expected: `severity = "none"`
- **Test 6: "Bevacizumab = pharmacodynamic flag"**
  - Input: `medications = [{rxnorm: "253337"}], doac = "apixaban"`
  - Expected: `severity = "pharmacodynamic"`
- **Test 7: "Multiple medications — worst severity wins"**
  - Input: `medications = [{rxnorm: "12574"}, {rxnorm: "1442981"}], doac = "apixaban"`
  - Expected: `worstSeverity = "major"` (ibrutinib drives it)
- **Test 8: "Enzalutamide + apixaban = MAJOR (inducer — thrombosis risk)"**
  - Input: `medications = [{rxnorm: "1232107"}], doac = "apixaban"`
  - Expected: `severity = "major"`, mechanism contains "inducer"
- **Test 9: "Dexamethasone + apixaban = MODERATE"**
  - Input: `medications = [{rxnorm: "3264"}], doac = "apixaban"`
  - Expected: `severity = "moderate"`
- **Test 10: "Unknown RxNorm code returns 'not in database'"**
  - Input: `medications = [{rxnorm: "9999999"}], doac = "apixaban"`
  - Expected: `severity = "unknown"`, message = "Agent not in DDI database"

### 8D. Contraindication Detection Tests

Test Suite: `contraindication-detector`

- **Test 1: "Platelets <50K → absolute contraindication"**
  - Input: `platelets = 42`
  - Expected: contraindications includes `{type: "absolute", reason: "severe_thrombocytopenia"}`
- **Test 2: "Platelets 50K → no contraindication"**
  - Input: `platelets = 50`
  - Expected: contraindications does not include `"severe_thrombocytopenia"`
- **Test 3: "APS diagnosis → absolute contraindication"**
  - Input: `conditions = [{code: "D68.61"}]`
  - Expected: contraindications includes `{type: "absolute", reason: "antiphospholipid_syndrome"}`
- **Test 4: "HIT → contraindication to LMWH only"**
  - Input: `conditions = [{code: "D75.82"}]`
  - Expected: contraindications includes `{type: "absolute", reason: "HIT", appliesTo: ["enoxaparin", "dalteparin"]}`
- **Test 5: "Gastric cancer → relative caution for DOACs"**
  - Input: `conditions = [{code: "C16.5"}]`
  - Expected: cautions includes `{type: "relative", reason: "gi_tract_cancer"}`
- **Test 6: "Concurrent aspirin → bleeding risk warning"**
  - Input: `medications = [{rxnorm: "1191"}]`
  - Expected: cautions includes `{type: "relative", reason: "concurrent_antiplatelet"}`
- **Test 7: "Weight <40 kg → apixaban caution"**
  - Input: `weight = 38`
  - Expected: cautions includes `{type: "relative", reason: "low_weight", appliesTo: ["apixaban"]}`
- **Test 8: "Severe hepatic impairment → absolute contraindication"**
  - Input: `totalBilirubin = 4.2, alt = 250` (assuming ULN = 40, so 5× = 200)
  - Expected: contraindications includes `{type: "absolute", reason: "severe_hepatic_impairment"}`

### 8E. Stale Lab Detection Tests

Test Suite: `stale-lab-detector`

- **Test 1: "Lab dated 5 days ago → not stale"**
  - Input: `labDate = today - 5 days`
  - Expected: `isStale = false`
- **Test 2: "Lab dated 30 days ago → not stale"**
  - Input: `labDate = today - 30 days`
  - Expected: `isStale = false`
- **Test 3: "Lab dated 31 days ago → stale"**
  - Input: `labDate = today - 31 days`
  - Expected: `isStale = true`
- **Test 4: "Lab dated 45 days ago → stale (Patient 4)"**
  - Input: `labDate = today - 45 days`
  - Expected: `isStale = true, warning = "Lab values are >30 days old"`

### 8F. Integration Tests (End-to-End per Patient)

Test Suite: `integration`

- **Test 1: "Patient 1 (Maria Santos) — full pipeline"**
  - Load: `patient-1-bundle.json`
  - Expected:
    - Khorana = 5, High Risk
    - Prophylaxis recommended
    - No DDIs
    - CrCl = 115.5, no renal adjustment
    - No contraindications
    - Recommendation: apixaban 2.5 mg BID or rivaroxaban 10 mg daily
- **Test 2: "Patient 2 (James Chen) — DDI alert pipeline"**
  - Load: `patient-2-bundle.json`
  - Expected:
    - Khorana = 2, Intermediate (meets threshold)
    - DDI: ibrutinib + apixaban = MAJOR, ibrutinib + rivaroxaban = MAJOR
    - Recommendation: LMWH preferred
    - CrCl = 66.9, no renal adjustment
- **Test 3: "Patient 3 (Dorothy Williams) — contraindication pipeline"**
  - Load: `patient-3-bundle.json`
  - Expected:
    - Khorana = 3, High Risk
    - Contraindication: platelets 42K
    - CrCl = 12.9, severe renal impairment
    - Nephrotoxic chemo flag (carboplatin)
    - Output: "All anticoagulants contraindicated until platelet recovery"
- **Test 4: "Patient 4 (Robert Johnson) — no prophylaxis pipeline"**
  - Load: `patient-4-bundle.json`
  - Expected:
    - Khorana = 0, Low Risk
    - No prophylaxis recommended
    - Stale lab warning (45 days)
    - Bevacizumab: pharmacodynamic flag
- **Test 5: "Patient 5 (Priya Patel) — special exclusion pipeline"**
  - Load: `patient-5-bundle.json`
  - Expected:
    - Khorana: NOT APPLICABLE (multiple myeloma exclusion)
    - IMiD detected (lenalidomide)
    - Display MM-specific VTE guidance
    - Dexamethasone: MODERATE DDI flagged for awareness

---

## PART 9: CDS HOOKS SERVICE SPECIFICATION

### 9A. Hook: patient-view

Trigger: Fires when a clinician opens a cancer patient's chart.

Prefetch:

```json
{
  "patient": "Patient/{{context.patientId}}",
  "conditions": "Condition?patient={{context.patientId}}&clinical-status=active&category=encounter-diagnosis",
  "labs": "Observation?patient={{context.patientId}}&category=laboratory&code=777-3,718-7,6690-2,2160-0&_sort=-date&_count=4",
  "vitals": "Observation?patient={{context.patientId}}&category=vital-signs&code=29463-7,8302-2&_sort=-date&_count=2",
  "medications": "MedicationRequest?patient={{context.patientId}}&status=active"
}
```

Response logic:

- Check if patient has active cancer diagnosis (C00–C97 or D45–D47)
- If no cancer → return empty cards
- If cancer is a special exclusion → return info card with exclusion message
- Calculate Khorana score
- If Khorana ≥2 → return warning card with score, risk category, and link to app
- If Khorana <2 → return info card: "Khorana score X (Low). No routine VTE prophylaxis recommended."

Card format:

```json
{
  "cards": [
    {
      "summary": "VTE Risk: Khorana Score 5 (HIGH) — Prophylaxis Recommended",
      "detail": "Pancreatic cancer (2pts) + Platelets 410 (1pt) + Hgb 9.2 (1pt) + BMI 36.2 (1pt). Consider apixaban 2.5mg BID or rivaroxaban 10mg daily. Click to open OncoVTE Guard for DDI check and renal dosing.",
      "indicator": "critical",
      "source": {
        "label": "OncoVTE Guard",
        "url": "https://oncovte-guard.example.com",
        "topic": {
          "system": "http://snomed.info/sct",
          "code": "429098002",
          "display": "Thromboembolism prophylaxis"
        }
      },
      "links": [
        {
          "label": "Open OncoVTE Guard Dashboard",
          "url": "https://oncovte-guard.example.com/launch",
          "type": "smart"
        }
      ]
    }
  ]
}
```

Card indicator logic:

- Khorana ≥3 → "critical" (red)
- Khorana 2 → "warning" (yellow)
- Khorana 0–1 → "info" (blue)
- Special exclusion → "info" with specific message
- Contraindication detected → "critical" with contraindication details

### 9B. Hook: order-select

Trigger: Fires when a clinician orders a DOAC (apixaban, rivaroxaban, dabigatran, edoxaban).

Context:

```json
{
  "patientId": "{{context.patientId}}",
  "selections": ["MedicationRequest/{{context.draftOrders.entry.resource.id}}"]
}
```

Prefetch:

```json
{
  "patient": "Patient/{{context.patientId}}",
  "draftOrders": "MedicationRequest?patient={{context.patientId}}&_id={{context.selections}}",
  "activeMeds": "MedicationRequest?patient={{context.patientId}}&status=active",
  "conditions": "Condition?patient={{context.patientId}}&clinical-status=active",
  "renalLabs": "Observation?patient={{context.patientId}}&code=2160-0&_sort=-date&_count=1",
  "cbc": "Observation?patient={{context.patientId}}&code=777-3&_sort=-date&_count=1"
}
```

Response logic:

- Identify which DOAC is being ordered from draftOrders
- Check active medications against DDI knowledge base for that specific DOAC
- Calculate CrCl and check renal thresholds for that DOAC
- Check platelets for contraindication
- Return cards for any DDIs, renal alerts, or contraindications

Example card (DDI detected):

```json
{
  "cards": [
    {
      "summary": "⚠️ MAJOR DDI: Apixaban + Ibrutinib — AVOID",
      "detail": "Ibrutinib is a strong dual CYP3A4/P-gp inhibitor that significantly increases apixaban exposure. Risk of major bleeding. Consider LMWH (dalteparin or enoxaparin) instead. If DOAC required, edoxaban has the least interaction potential.",
      "indicator": "critical",
      "source": {
        "label": "OncoVTE Guard DDI Checker"
      },
      "suggestions": [
        {
          "label": "Switch to enoxaparin 1 mg/kg SC daily",
          "actions": [
            {
              "type": "create",
              "description": "Order enoxaparin",
              "resource": {
                "resourceType": "MedicationRequest",
                "medicationCodeableConcept": {
                  "coding": [{"system": "http://www.nlm.nih.gov/research/umls/rxnorm", "code": "67108", "display": "enoxaparin"}]
                }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## PART 10: DIRECTORY STRUCTURE FOR CODING AGENT

```
oncovte-guard/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── src/
│   ├── types/
│   │   ├── patient.ts            # PatientData, FHIRPatient interfaces
│   │   ├── khorana.ts            # KhoranaInput, KhoranaResult, CancerCategory
│   │   ├── renal.ts              # RenalInput, RenalResult, DOACRenalThreshold
│   │   ├── ddi.ts                # DDIEntry, DDICheckResult, Severity enum
│   │   ├── contraindication.ts   # Contraindication, Caution, ContraindicationResult
│   │   ├── recommendation.ts     # ProphylaxisRecommendation, DOACOption
│   │   └── fhir.ts               # FHIR R4 type aliases (Bundle, Patient, Observation, etc.)
│   │
│   ├── core/
│   │   ├── khorana-engine.ts     # calculateKhoranaScore(), getCancerCategory()
│   │   ├── renal-dosing.ts       # calculateCrCl(), getDOACRenalRecommendation()
│   │   ├── ddi-checker.ts        # checkDDIs(), getWorstSeverity()
│   │   ├── contraindications.ts  # detectContraindications(), detectCautions()
│   │   ├── recommendation.ts     # generateRecommendation() — orchestrates all modules
│   │   └── stale-lab.ts          # isLabStale(), getStaleWarning()
│   │
│   ├── data/
│   │   ├── icd10-cancer-map.ts   # ICD-10 prefix → CancerCategory mapping
│   │   ├── ddi-knowledge-base.json  # All 50+ agents with per-DOAC severity
│   │   ├── doac-renal-thresholds.ts # CrCl cutoffs per DOAC per indication
│   │   ├── loinc-codes.ts        # LOINC code constants
│   │   └── rxnorm-codes.ts       # RxNorm code constants for DOACs, chemo, ESAs, etc.
│   │
│   ├── fhir/
│   │   ├── smart-launch.ts       # SMART-on-FHIR OAuth2 launch handler
│   │   ├── fhir-client.ts        # FHIR data fetching (Patient, Condition, Observation, MedicationRequest)
│   │   ├── fhir-parser.ts        # Extract clinical values from FHIR resources → PatientData
│   │   └── fhir-helpers.ts       # Utility: find latest lab by LOINC, parse CodeableConcept, etc.
│   │
│   ├── cds-hooks/
│   │   ├── server.ts             # Express server for CDS Hooks endpoints
│   │   ├── discovery.ts          # GET /cds-services — service discovery endpoint
│   │   ├── patient-view.ts       # POST /cds-services/oncovte-patient-view
│   │   ├── order-select.ts       # POST /cds-services/oncovte-order-select
│   │   └── card-builder.ts       # Helper to construct CDS Hooks Card JSON
│   │
│   ├── ui/
│   │   ├── App.tsx               # Main React app shell
│   │   ├── components/
│   │   │   ├── PatientBanner.tsx      # Name, age, gender, cancer type, MRN
│   │   │   ├── KhoranaScoreCard.tsx   # Score breakdown with color-coded risk
│   │   │   ├── DDIMatrix.tsx          # Grid: rows = active meds, columns = DOACs, cells = severity
│   │   │   ├── RenalPanel.tsx         # CrCl value, DOAC-specific recommendations
│   │   │   ├── ContraindicationBanner.tsx  # Red banner for absolute contraindications
│   │   │   ├── RecommendationOutput.tsx    # Final synthesized recommendation
│   │   │   ├── LabStalenessWarning.tsx     # Yellow banner for stale labs
│   │   │   ├── ClinicalDisclaimer.tsx      # "Clinical decision support — not a substitute for clinical judgment"
│   │   │   └── SourceAttribution.tsx       # NCCN, ASCO, AHA source citations
│   │   ├── hooks/
│   │   │   ├── useFHIRPatient.ts     # Custom hook: SMART launch → fetch → PatientData
│   │   │   └── useRecommendation.ts  # Custom hook: PatientData → full recommendation
│   │   └── styles/
│   │       └── index.css             # Tailwind CSS or plain CSS
│   │
│   └── index.tsx                 # React entry point
│
├── public/
│   ├── launch.html               # SMART launch page
│   └── index.html                # Main app page
│
├── synthetic-patients/
│   ├── patient-1-maria-santos.json
│   ├── patient-2-james-chen.json
│   ├── patient-3-dorothy-williams.json
│   ├── patient-4-robert-johnson.json
│   └── patient-5-priya-patel.json
│
├── tests/
│   ├── core/
│   │   ├── khorana-engine.test.ts
│   │   ├── renal-dosing.test.ts
│   │   ├── ddi-checker.test.ts
│   │   ├── contraindications.test.ts
│   │   └── stale-lab.test.ts
│   ├── fhir/
│   │   ├── fhir-parser.test.ts
│   │   └── fhir-helpers.test.ts
│   ├── cds-hooks/
│   │   ├── patient-view.test.ts
│   │   └── order-select.test.ts
│   └── integration/
│       ├── patient-1.integration.test.ts
│       ├── patient-2.integration.test.ts
│       ├── patient-3.integration.test.ts
│       ├── patient-4.integration.test.ts
│       └── patient-5.integration.test.ts
│
├── docs/
│   ├── CLINICAL_SOURCES.md       # All guideline/literature citations
│   ├── DDI_METHODOLOGY.md        # How DDI severity was classified
│   ├── DEMO_SCRIPT.md            # Step-by-step demo walkthrough
│   └── ARCHITECTURE.md           # System architecture diagram description
│
└── .env.example                  # FHIR server URL, client ID, scopes
```

---

## PART 11: KEY TYPESCRIPT INTERFACES

The coding agent should create these interfaces FIRST before writing any logic. They serve as the contract between all modules.

```typescript
// === types/khorana.ts ===

export enum CancerCategory {
  VERY_HIGH = "very_high",   // stomach, pancreas → 2 pts
  HIGH = "high",             // lung, lymphoma, gyn, bladder, testicular → 1 pt
  STANDARD = "standard",     // all others → 0 pts
  EXCLUDED = "excluded"      // myeloma, brain, acute leukemia, MPN
}

export enum RiskCategory {
  LOW = "low",               // score 0-1
  INTERMEDIATE = "intermediate", // score 2
  HIGH = "high"              // score ≥3
}

export interface KhoranaInput {
  cancerCategory: CancerCategory;
  plateletCount: number | null;       // ×10⁹/L
  hemoglobin: number | null;          // g/dL
  onESA: boolean;
  wbcCount: number | null;            // ×10⁹/L
  bmi: number | null;                 // kg/m²
}

export interface KhoranaResult {
  totalScore: number;
  riskCategory: RiskCategory;
  isComplete: boolean;
  missingFields: string[];
  breakdown: {
    cancerSite: { value: string; score: number };
    platelets: { value: number | null; score: number };
    hemoglobin: { value: number | null; score: number; esaFlag: boolean };
    wbc: { value: number | null; score: number };
    bmi: { value: number | null; score: number };
  };
  exclusion: {
    isExcluded: boolean;
    reason: string | null;  // "multiple_myeloma" | "brain_tumor" | "acute_leukemia" | "mpn"
  };
  prophylaxisRecommended: boolean;  // true if score ≥2 AND not excluded
}

// === types/renal.ts ===

export interface RenalInput {
  age: number;
  weightKg: number;
  gender: "male" | "female";
  serumCreatinine: number;    // mg/dL
  bmi?: number;
}

export interface DOACRenalRecommendation {
  doac: string;
  recommendation: "standard" | "caution" | "avoid";
  dose: string;
  rationale: string;
}

export interface RenalResult {
  crclMlMin: number;
  crclCategory: "normal" | "mild" | "moderate" | "severe";  // ≥90, 60-89, 30-59, <30
  doacRecommendations: DOACRenalRecommendation[];
  warnings: string[];  // sarcopenia, nephrotoxic chemo, etc.
}

// === types/ddi.ts ===

export type DDISeverity = "major" | "moderate" | "minor" | "none" | "pharmacodynamic" | "unknown";

export interface DDIEntry {
  agentName: string;
  brandName: string;
  rxnormCode: string;
  drugClass: string;
  pgpEffect: string;
  cyp3a4Effect: string;
  interactions: {
    apixaban: DDIDetail;
    rivaroxaban: DDIDetail;
    dabigatran: DDIDetail;
    edoxaban: DDIDetail;
  };
  pharmacodynamicBleedingRisk: boolean;
  notes: string;
}

export interface DDIDetail {
  severity: DDISeverity;
  mechanism: string;
  recommendation: string;
  alternativeDoac: string | null;
}

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

// === types/contraindication.ts ===

export interface Contraindication {
  type: "absolute" | "relative";
  reason: string;
  detail: string;
  appliesTo: string[] | "all";  // specific DOACs or "all"
}

export interface ContraindicationResult {
  absolute: Contraindication[];
  relative: Contraindication[];
  canProceedWithProphylaxis: boolean;  // false if any absolute contraindication
}

// === types/recommendation.ts ===

export interface ProphylaxisRecommendation {
  khorana: KhoranaResult;
  renal: RenalResult;
  ddiResults: DDICheckResult[];
  contraindications: ContraindicationResult;
  staleLabWarning: boolean;
  staleLabFields: string[];
  // Final synthesized output
  overallAction: "recommend" | "caution" | "contraindicated" | "not_indicated" | "excluded";
  preferredOptions: DOACOption[];
  alternativeOptions: DOACOption[];
  avoidOptions: DOACOption[];
  alerts: Alert[];
  disclaimers: string[];
}

export interface DOACOption {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration: string;
  renalStatus: "standard" | "caution" | "avoid";
  worstDDI: DDISeverity;
  eligible: boolean;       // true if no MAJOR DDI and renal status is not "avoid"
  ineligibleReason: string | null;
}

export interface Alert {
  level: "critical" | "warning" | "info";
  title: string;
  detail: string;
  source: string;  // e.g., "NCCN VTE-B", "AHA 2022"
}

// === types/patient.ts ===

export interface PatientData {
  // Demographics
  id: string;
  name: string;
  birthDate: string;
  age: number;
  gender: "male" | "female";
  race: string | null;
  ethnicity: string | null;
  // Vitals
  weightKg: number | null;
  heightCm: number | null;
  bmi: number | null;
  // Cancer
  activeCancerConditions: {
    code: string;       // ICD-10
    display: string;
    category: CancerCategory;
  }[];
  // Labs (most recent)
  labs: {
    platelets: LabValue | null;
    hemoglobin: LabValue | null;
    wbc: LabValue | null;
    serumCreatinine: LabValue | null;
    alt: LabValue | null;
    ast: LabValue | null;
    totalBilirubin: LabValue | null;
  };
  // Medications
  activeMedications: {
    rxnormCode: string;
    display: string;
    status: string;
  }[];
  // Derived flags
  onESA: boolean;
  onAntiplatelet: boolean;
  onIMiD: boolean;
  hasNephrotoxicChemo: boolean;
}

export interface LabValue {
  value: number;
  unit: string;
  date: string;       // ISO date
  loincCode: string;
  isStale: boolean;    // >30 days old
}
```

---

## PART 12: RECOMMENDATION ENGINE ORCHESTRATION LOGIC

This is the master function that ties all modules together. The coding agent should implement this as `generateRecommendation()` in `src/core/recommendation.ts`.

```
FUNCTION generateRecommendation(patientData: PatientData) → ProphylaxisRecommendation:

  // STEP 1: Check for Khorana exclusions
  cancerCategory = getCancerCategory(patientData.activeCancerConditions)
  IF cancerCategory == EXCLUDED:
    RETURN {overallAction: "excluded", alerts: [exclusion message]}

  // STEP 2: Calculate Khorana score
  khoranaResult = calculateKhoranaScore({
    cancerCategory,
    plateletCount: patientData.labs.platelets?.value,
    hemoglobin: patientData.labs.hemoglobin?.value,
    onESA: patientData.onESA,
    wbcCount: patientData.labs.wbc?.value,
    bmi: patientData.bmi
  })

  // STEP 3: Check if prophylaxis is indicated
  IF khoranaResult.totalScore < 2:
    RETURN {overallAction: "not_indicated", khorana: khoranaResult}

  // STEP 4: Detect contraindications
  contraindicationResult = detectContraindications(patientData)
  IF contraindicationResult.absolute.length > 0 AND appliesTo == "all":
    RETURN {overallAction: "contraindicated", contraindications: contraindicationResult}

  // STEP 5: Calculate renal function
  renalResult = calculateCrCl(patientData) + getDOACRenalRecommendation()

  // STEP 6: Check DDIs for all active medications against all 4 DOACs
  ddiResults = []
  FOR EACH medication IN patientData.activeMedications:
    ddiResult = checkDDIs(medication, ALL_DOACS)
    ddiResults.push(ddiResult)

  // STEP 7: Build DOAC option list
  FOR EACH doac IN [apixaban, rivaroxaban, dabigatran, edoxaban]:
    option = {
      name: doac,
      dose: getProphylaxisDose(doac),
      renalStatus: renalResult.doacRecommendations[doac],
      worstDDI: getWorstDDIForDoac(ddiResults, doac),
      eligible: renalStatus != "avoid" AND worstDDI != "major"
    }
  SORT into preferredOptions / alternativeOptions / avoidOptions

  // STEP 8: Add LMWH options
  IF any DOAC has MAJOR DDI:
    ADD dalteparin and enoxaparin to preferredOptions (if renal allows)

  // STEP 9: Check stale labs
  staleLabWarning = ANY lab in patientData.labs where isStale == true

  // STEP 10: Compile alerts
  alerts = []
  ADD DDI alerts (MAJOR = critical, MODERATE = warning)
  ADD renal alerts (CrCl <30 = critical, 30-49 = warning)
  ADD contraindication alerts
  ADD stale lab alerts
  ADD nephrotoxic chemo alerts
  ADD pharmacodynamic bleeding risk alerts

  RETURN full ProphylaxisRecommendation object
```

---

## PART 13: UI COMPONENT SPECIFICATIONS

### 13A. Dashboard Layout (Single Page)

```
┌─────────────────────────────────────────────────────────────┐
│  [ContraindicationBanner — red, full width, if applicable]  │
│  [LabStalenessWarning — yellow, full width, if applicable]  │
├─────────────────────────────────────────────────────────────┤
│  PatientBanner                                              │
│  Maria Santos | 58F | Pancreatic Adenocarcinoma (C25.1)     │
│  Active Chemo: Gemcitabine + nab-Paclitaxel                 │
├──────────────────────┬──────────────────────────────────────┤
│  KhoranaScoreCard    │  RenalPanel                          │
│  ┌────────────────┐  │  ┌────────────────────────────────┐  │
│  │ Score: 5       │  │  │ CrCl: 115.5 mL/min            │  │
│  │ ██████ HIGH    │  │  │ Category: Normal               │  │
│  │                │  │  │                                │  │
│  │ Pancreas  +2   │  │  │ Apixaban: Standard dose ✓      │  │
│  │ Plt 410   +1   │  │  │ Rivaroxaban: Standard dose ✓   │  │
│  │ Hgb 9.2   +1   │  │  │ LMWH: Standard dose ✓          │  │
│  │ WBC 8.5   +0   │  │  │                                │  │
│  │ BMI 36.2  +1   │  │  │ ⚠ Nephrotoxic chemo: None      │  │
│  └────────────────┘  │  └────────────────────────────────┘  │
├──────────────────────┴──────────────────────────────────────┤
│  DDIMatrix                                                  │
│  ┌──────────────┬──────────┬──────────┬──────────┬────────┐ │
│  │ Medication   │ Apixaban │ Rivarox. │ Dabigat. │ Edoxab.│ │
│  ├──────────────┼──────────┼──────────┼──────────┼────────┤ │
│  │ Gemcitabine  │ 🟢 None  │ 🟢 None  │ 🟢 None  │ 🟢 None│ │
│  │ nab-Pacli.   │ 🟢 None  │ 🟢 None  │ 🟢 None  │ 🟢 None│ │
│  └──────────────┴──────────┴──────────┴──────────┴────────┘ │
├─────────────────────────────────────────────────────────────┤
│  RecommendationOutput                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ✅ VTE PROPHYLAXIS RECOMMENDED (Khorana ≥2)             ││
│  │                                                         ││
│  │ Preferred:                                              ││
│  │   • Apixaban 2.5 mg PO BID (up to 6 months)            ││
│  │   • Rivaroxaban 10 mg PO daily                          ││
│  │                                                         ││
│  │ No drug-drug interactions detected.                     ││
│  │ No renal dose adjustment required.                      ││
│  │ No contraindications identified.                        ││
│  │                                                         ││
│  │ Sources: NCCN VTE v1.2026 (VTE-B, VTE-C)               ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  ClinicalDisclaimer                                         │
│  "This tool provides clinical decision support based on     │
│   NCCN, ASCO, and AHA guidelines. It does not replace       │
│   clinical judgment. All recommendations should be          │
│   verified by the treating clinician."                      │
└─────────────────────────────────────────────────────────────┘
```

### 13B. DDI Matrix for Patient 2 (James Chen — ibrutinib)

```
┌──────────────┬───────────┬───────────┬───────────┬─────────┐
│ Medication   │ Apixaban  │ Rivarox.  │ Dabigat.  │ Edoxab. │
├──────────────┼───────────┼───────────┼───────────┼─────────┤
│ Ibrutinib    │ 🔴 MAJOR  │ 🔴 MAJOR  │ 🟡 MODERATE│ 🟢 MINOR│
│ Rituximab    │ 🟢 None   │ 🟢 None   │ 🟢 None   │ 🟢 None │
└──────────────┴───────────┴───────────┴───────────┴─────────┘
```

Clicking a red/yellow cell expands to show:

- Mechanism: "Strong dual CYP3A4/P-gp inhibition..."
- Recommendation: "AVOID combination. Consider LMWH."
- Source: "AHA Scientific Statement 2022; Hellfritzsch 2024"

### 13C. Color Coding System

**Khorana Score Card:**

- Score 0-1 (Low): Green background (#22c55e)
- Score 2 (Intermediate): Yellow background (#eab308)
- Score ≥3 (High): Red background (#ef4444)

**DDI Matrix Cells:**

- MAJOR: Red (#ef4444) with white text
- MODERATE: Orange (#f97316) with white text
- MINOR: Light yellow (#fef9c3) with dark text
- NONE: Green (#dcfce7) with dark text
- PHARMACODYNAMIC: Blue (#dbeafe) with dark text
- UNKNOWN: Gray (#e5e7eb) with dark text

**Renal Panel:**

- CrCl ≥50: Green
- CrCl 30-49: Yellow
- CrCl <30: Red

**Banners:**

- Contraindication: Red (#fef2f2 bg, #dc2626 border)
- Stale Lab: Yellow (#fffbeb bg, #d97706 border)
- Special Exclusion: Blue (#eff6ff bg, #2563eb border)

---

## PART 14: DEMO SCRIPT FOR AMIA PRESENTATION

Walk through the 5 patients in order. Each demonstrates a different capability.

**Demo 1 — Maria Santos (2 min):**

"This is a 58-year-old woman with pancreatic cancer starting gemcitabine/nab-paclitaxel. OncoVTE Guard automatically pulls her labs from the EHR via FHIR, calculates a Khorana score of 5 — high risk — and recommends apixaban 2.5 mg BID or rivaroxaban 10 mg daily. No drug interactions, no renal concerns. This is the straightforward case."

**Demo 2 — James Chen (3 min):**

"Now a 72-year-old man with mantle cell lymphoma on ibrutinib. Khorana score is 2 — prophylaxis is recommended. But watch the DDI matrix: ibrutinib is a strong dual CYP3A4/P-gp inhibitor. Apixaban and rivaroxaban are flagged MAJOR — avoid. The app automatically recommends LMWH instead. This is the interaction that gets missed."

**Demo 3 — Dorothy Williams (2 min):**

"An 81-year-old woman with NSCLC. Khorana score is 3 — high risk. But she has two safety stops: platelets are 42,000 — absolute contraindication to all anticoagulants — and CrCl is 12.9, which eliminates rivaroxaban and LMWH. The red banner says: hold all anticoagulation until platelet recovery."

**Demo 4 — Robert Johnson (1 min):**

"A 65-year-old man with colorectal cancer. Khorana score is 0 — low risk. No prophylaxis recommended. But the app still flags that his labs are 45 days old and notes bevacizumab's pharmacodynamic bleeding risk. Even when the answer is 'no prophylaxis,' the app adds value."

**Demo 5 — Priya Patel (1 min):**

"A 55-year-old woman with multiple myeloma on lenalidomide. The app recognizes that Khorana does not apply here and redirects to the NCCN Multiple Myeloma VTE pathway. It detects the IMiD and recommends aspirin, LMWH, or warfarin per disease-specific guidelines."

**Closing (1 min):**

"OncoVTE Guard integrates three clinical engines — VTE risk scoring, DOAC-chemotherapy interaction checking, and renal dosing — into a single FHIR-connected tool. It fires passively via CDS Hooks when a clinician opens a cancer patient's chart or orders a DOAC. Every clinical value is sourced from NCCN, ASCO, and AHA guidelines."

---

## PART 15: PACKAGE.JSON DEPENDENCIES

```json
{
  "name": "oncovte-guard",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "cds-server": "ts-node src/cds-hooks/server.ts",
    "lint": "eslint src/ --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "fhirclient": "^2.5.3",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "ts-node": "^10.9.2",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

Key dependency notes for the coding agent:

- **fhirclient (v2.5.3):** The official SMART-on-FHIR JavaScript client library. Handles OAuth2 launch, token management, and FHIR API calls. Use `FHIR.oauth2.init()` for launch and `client.request()` for data fetching.
- **express:** Only needed for the CDS Hooks server. The SMART app itself is a static React SPA.
- **vitest:** Testing framework compatible with Vite. Faster than Jest for Vite projects.
- **tailwindcss:** For rapid UI styling. The color system in Part 13C maps directly to Tailwind color classes.

---

## PART 16: ENVIRONMENT CONFIGURATION

```bash
# .env.example

# SMART-on-FHIR Configuration
VITE_FHIR_CLIENT_ID=oncovte-guard
VITE_FHIR_SCOPE=launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read
VITE_FHIR_REDIRECT_URI=http://localhost:5173/

# For local development with SMART App Launcher
VITE_FHIR_ISS=https://launch.smarthealthit.org/v/r4/sim/eyJoIjoiMSIsImIiOiIxIn0/fhir

# CDS Hooks Server
CDS_PORT=3001
CDS_BASE_URL=http://localhost:3001

# For testing with CDS Hooks Sandbox
# Register at: https://sandbox.cds-hooks.org/
```

---

## PART 17: SMART LAUNCH FLOW

```html
<!-- === public/launch.html === -->
<!-- This is the SMART launch endpoint. The EHR redirects here with ?iss=...&launch=... -->
<script src="https://cdn.jsdelivr.net/npm/fhirclient/build/fhir-client.js"></script>
<script>
  FHIR.oauth2.authorize({
    clientId: "oncovte-guard",
    scope: "launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read",
    redirectUri: "/index.html"
  });
</script>
```

```typescript
// === src/fhir/smart-launch.ts ===

import FHIR from "fhirclient";
import type Client from "fhirclient/lib/Client";

export async function initSmartClient(): Promise<Client> {
  // Called from index.html after redirect from launch.html
  // fhirclient handles the OAuth2 callback automatically
  const client = await FHIR.oauth2.ready();
  return client;
}

// === src/fhir/fhir-client.ts ===

import type Client from "fhirclient/lib/Client";
import type { fhirclient } from "fhirclient/lib/types";

export async function fetchPatientData(client: Client) {
  // 1. Get Patient resource (demographics)
  const patient = await client.patient.read();

  // 2. Get active Conditions (cancer diagnoses)
  const conditions = await client.request<fhirclient.FHIR.Bundle>(
    `Condition?patient=${patient.id}&clinical-status=active&category=encounter-diagnosis`
  );

  // 3. Get latest labs (platelets, hemoglobin, WBC, creatinine)
  const labCodes = "777-3,718-7,6690-2,2160-0,1742-6,1920-8,1975-2";
  const labs = await client.request<fhirclient.FHIR.Bundle>(
    `Observation?patient=${patient.id}&category=laboratory&code=${labCodes}&_sort=-date&_count=20`
  );

  // 4. Get vitals (weight, height)
  const vitalCodes = "29463-7,8302-2";
  const vitals = await client.request<fhirclient.FHIR.Bundle>(
    `Observation?patient=${patient.id}&category=vital-signs&code=${vitalCodes}&_sort=-date&_count=4`
  );

  // 5. Get active medications
  const medications = await client.request<fhirclient.FHIR.Bundle>(
    `MedicationRequest?patient=${patient.id}&status=active`
  );

  return { patient, conditions, labs, vitals, medications };
}

// === src/fhir/fhir-parser.ts ===
// This module transforms raw FHIR resources into the PatientData interface.
// Key parsing functions:

export function parsePatientDemographics(patient: fhir4.Patient): {
  name: string;
  birthDate: string;
  age: number;
  gender: "male" | "female";
  race: string | null;
  ethnicity: string | null;
} {
  // name: patient.name[0].given.join(" ") + " " + patient.name[0].family
  // birthDate: patient.birthDate
  // age: calculate from birthDate to today
  // gender: patient.gender
  // race: extract from US Core Race Extension
  //   url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race"
  //   look for extension with url "ombCategory" → valueCoding.display
  // ethnicity: extract from US Core Ethnicity Extension
  //   url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity"
  //   look for extension with url "ombCategory" → valueCoding.display
}

export function parseConditions(bundle: fhir4.Bundle): {
  code: string;
  display: string;
  category: CancerCategory;
}[] {
  // For each entry in bundle:
  //   resource.code.coding → find ICD-10 coding
  //     system: "http://hl7.org/fhir/sid/icd-10-cm"
  //   Map ICD-10 code to CancerCategory using icd10-cancer-map.ts
  // Filter to only cancer codes (C00-C97, D45-D47)
}

export function parseLatestLab(
  bundle: fhir4.Bundle,
  loincCode: string
): LabValue | null {
  // Filter bundle entries to Observation resources with matching LOINC code
  //   coding.system: "http://loinc.org"
  //   coding.code: loincCode
  // Sort by effectiveDateTime descending
  // Take the first (most recent)
  // Return: {
  //   value: resource.valueQuantity.value,
  //   unit: resource.valueQuantity.unit,
  //   date: resource.effectiveDateTime,
  //   loincCode: loincCode,
  //   isStale: (today - effectiveDateTime) > 30 days
  // }
}

export function parseMedications(bundle: fhir4.Bundle): {
  rxnormCode: string;
  display: string;
  status: string;
}[] {
  // For each entry in bundle:
  //   resource.medicationCodeableConcept.coding → find RxNorm coding
  //     system: "http://www.nlm.nih.gov/research/umls/rxnorm"
  //   Return code and display
  // Filter to status: "active"
}

export function parseVitals(
  bundle: fhir4.Bundle
): { weightKg: number | null; heightCm: number | null } {
  // Weight: LOINC 29463-7, valueQuantity in kg
  //   If unit is "lb" or "[lb_av]", convert: kg = lb × 0.453592
  // Height: LOINC 8302-2, valueQuantity in cm
  //   If unit is "in" or "[in_i]", convert: cm = in × 2.54
}
```

### 17A. Standalone Mode (No EHR — Synthetic Data)

For demo and development without a live FHIR server, the app should support loading synthetic patient bundles directly:

```typescript
// === src/fhir/standalone-loader.ts ===

import patient1 from "../../synthetic-patients/patient-1-maria-santos.json";
import patient2 from "../../synthetic-patients/patient-2-james-chen.json";
import patient3 from "../../synthetic-patients/patient-3-dorothy-williams.json";
import patient4 from "../../synthetic-patients/patient-4-robert-johnson.json";
import patient5 from "../../synthetic-patients/patient-5-priya-patel.json";

const syntheticPatients = [patient1, patient2, patient3, patient4, patient5];

export function loadSyntheticPatient(index: number): RawFHIRData {
  const bundle = syntheticPatients[index];
  // Parse the Bundle the same way as live FHIR data
  // Extract Patient, Condition, Observation, MedicationRequest resources
  // Return in the same format as fetchPatientData()
}
```

The `App.tsx` should detect whether it was launched via SMART (has `?iss=` and `?launch=` params) or standalone (no params). If standalone, show a patient selector dropdown with the 5 synthetic patients.

```typescript
// === src/ui/App.tsx — launch detection pseudocode ===

const urlParams = new URLSearchParams(window.location.search);
const isSmartLaunch = urlParams.has("iss") || urlParams.has("code");

if (isSmartLaunch) {
  // SMART flow: initSmartClient() → fetchPatientData() → parseAll()
} else {
  // Standalone flow: show patient selector → loadSyntheticPatient() → parseAll()
}
```

---

## PART 18: SYNTHETIC PATIENT FHIR BUNDLE TEMPLATE

Below is the complete FHIR R4 Bundle structure for Patient 1 (Maria Santos). The coding agent should use this as the template for all 5 patients, changing only the clinical values per the specifications in Part 7.

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-1",
        "name": [
          {
            "use": "official",
            "family": "Santos",
            "given": ["Maria"]
          }
        ],
        "gender": "female",
        "birthDate": "1968-03-15",
        "extension": [
          {
            "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
            "extension": [
              {
                "url": "ombCategory",
                "valueCoding": {
                  "system": "urn:oid:2.16.840.1.113883.6.238",
                  "code": "2106-3",
                  "display": "White"
                }
              },
              {
                "url": "text",
                "valueString": "White"
              }
            ]
          },
          {
            "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
            "extension": [
              {
                "url": "ombCategory",
                "valueCoding": {
                  "system": "urn:oid:2.16.840.1.113883.6.238",
                  "code": "2135-2",
                  "display": "Hispanic or Latino"
                }
              },
              {
                "url": "text",
                "valueString": "Hispanic or Latino"
              }
            ]
          }
        ]
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "condition-1",
        "clinicalStatus": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
              "code": "active",
              "display": "Active"
            }
          ]
        },
        "verificationStatus": {
          "coding": [
            {
              "system": "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              "code": "confirmed",
              "display": "Confirmed"
            }
          ]
        },
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/condition-category",
                "code": "encounter-diagnosis",
                "display": "Encounter Diagnosis"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://hl7.org/fhir/sid/icd-10-cm",
              "code": "C25.1",
              "display": "Malignant neoplasm of body of pancreas"
            }
          ],
          "text": "Pancreatic adenocarcinoma"
        },
        "subject": {
          "reference": "Patient/patient-1"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-platelets-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "laboratory",
                "display": "Laboratory"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "777-3",
              "display": "Platelets [#/volume] in Blood by Automated count"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 410,
          "unit": "10*3/uL",
          "system": "http://unitsofmeasure.org",
          "code": "10*3/uL"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-hemoglobin-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "laboratory",
                "display": "Laboratory"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "718-7",
              "display": "Hemoglobin [Mass/volume] in Blood"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 9.2,
          "unit": "g/dL",
          "system": "http://unitsofmeasure.org",
          "code": "g/dL"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-wbc-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "laboratory",
                "display": "Laboratory"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "6690-2",
              "display": "Leukocytes [#/volume] in Blood by Automated count"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 8.5,
          "unit": "10*3/uL",
          "system": "http://unitsofmeasure.org",
          "code": "10*3/uL"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-creatinine-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "laboratory",
                "display": "Laboratory"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "2160-0",
              "display": "Creatinine [Mass/volume] in Serum or Plasma"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 0.8,
          "unit": "mg/dL",
          "system": "http://unitsofmeasure.org",
          "code": "mg/dL"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-weight-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "29463-7",
              "display": "Body weight"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 95,
          "unit": "kg",
          "system": "http://unitsofmeasure.org",
          "code": "kg"
        }
      }
    },
    {
      "resource": {
        "resourceType": "Observation",
        "id": "obs-height-1",
        "status": "final",
        "category": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                "code": "vital-signs",
                "display": "Vital Signs"
              }
            ]
          }
        ],
        "code": {
          "coding": [
            {
              "system": "http://loinc.org",
              "code": "8302-2",
              "display": "Body height"
            }
          ]
        },
        "subject": {
          "reference": "Patient/patient-1"
        },
        "effectiveDateTime": "2026-06-04",
        "valueQuantity": {
          "value": 162,
          "unit": "cm",
          "system": "http://unitsofmeasure.org",
          "code": "cm"
        }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "medrx-gemcitabine-1",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [
            {
              "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
              "code": "12574",
              "display": "gemcitabine"
            }
          ],
          "text": "Gemcitabine"
        },
        "subject": {
          "reference": "Patient/patient-1"
        }
      }
    },
    {
      "resource": {
        "resourceType": "MedicationRequest",
        "id": "medrx-paclitaxel-1",
        "status": "active",
        "intent": "order",
        "medicationCodeableConcept": {
          "coding": [
            {
              "system": "http://www.nlm.nih.gov/research/umls/rxnorm",
              "code": "56946",
              "display": "paclitaxel"
            }
          ],
          "text": "nab-Paclitaxel"
        },
        "subject": {
          "reference": "Patient/patient-1"
        }
      }
    }
  ]
}
```

For Patients 2–5: Use this exact structure but substitute:

- Patient resource: id, name, gender, birthDate, race/ethnicity extensions
- Condition resource: ICD-10 code and display per Part 7
- Observation resources: values and effectiveDateTime per Part 7
- MedicationRequest resources: RxNorm codes per Part 7

Date calculations for effectiveDateTime:

- Patient 1: labs dated 5 days ago → "2026-06-04"
- Patient 2: labs dated 10 days ago → "2026-05-30"
- Patient 3: labs dated 3 days ago → "2026-06-06"
- Patient 4: labs dated 45 days ago → "2026-04-25"
- Patient 5: labs dated 7 days ago → "2026-06-02"

---

## PART 19: CDS HOOKS DISCOVERY ENDPOINT

The CDS Hooks server must expose a discovery endpoint at `GET /cds-services`:

```json
{
  "services": [
    {
      "hook": "patient-view",
      "title": "OncoVTE Guard — VTE Risk Assessment",
      "description": "Automatically calculates Khorana VTE risk score for ambulatory cancer patients and provides prophylaxis recommendations with DDI and renal safety checks.",
      "id": "oncovte-patient-view",
      "prefetch": {
        "patient": "Patient/{{context.patientId}}",
        "conditions": "Condition?patient={{context.patientId}}&clinical-status=active&category=encounter-diagnosis",
        "labs": "Observation?patient={{context.patientId}}&category=laboratory&code=777-3,718-7,6690-2,2160-0&_sort=-date&_count=4",
        "vitals": "Observation?patient={{context.patientId}}&category=vital-signs&code=29463-7,8302-2&_sort=-date&_count=2",
        "medications": "MedicationRequest?patient={{context.patientId}}&status=active"
      }
    },
    {
      "hook": "order-select",
      "title": "OncoVTE Guard — DOAC Safety Check",
      "description": "Checks for drug-drug interactions and renal contraindications when a DOAC is ordered for a cancer patient.",
      "id": "oncovte-order-select",
      "prefetch": {
        "patient": "Patient/{{context.patientId}}",
        "conditions": "Condition?patient={{context.patientId}}&clinical-status=active",
        "activeMeds": "MedicationRequest?patient={{context.patientId}}&status=active",
        "renalLabs": "Observation?patient={{context.patientId}}&code=2160-0&_sort=-date&_count=1",
        "cbc": "Observation?patient={{context.patientId}}&code=777-3&_sort=-date&_count=1"
      }
    }
  ]
}
```

---

## PART 20: TESTING INFRASTRUCTURE

### 20A. Testing with SMART App Launcher

1. Go to https://launch.smarthealthit.org/
2. Set FHIR Version: R4
3. Set Launch Type: "Provider EHR Launch"
4. Set App Launch URL: http://localhost:5173/launch.html
5. Select a patient (or upload synthetic patient bundle)
6. Click "Launch"
7. The launcher will redirect to your app with OAuth2 tokens

### 20B. Testing with CDS Hooks Sandbox

1. Go to https://sandbox.cds-hooks.org/
2. Add a new CDS Service: http://localhost:3001/cds-services
3. Select a patient
4. The sandbox will call your patient-view hook and display returned cards
5. To test order-select: use the sandbox's medication ordering interface

### 20C. Testing with Synthea

For generating additional synthetic patients beyond the 5 hardcoded ones:

1. Download Synthea: https://github.com/synthetichealth/synthea
2. Run: `java -jar synthea-with-dependencies.jar -p 10 --exporter.fhir.export=true`
3. This generates 10 synthetic patients as FHIR R4 Bundles
4. Load into a local HAPI FHIR server or use directly

Note: Synthea patients will NOT have the specific clinical values needed for OncoVTE Guard testing (they may not have cancer diagnoses). Use them only for testing FHIR parsing robustness and graceful handling of non-cancer patients.

---

## PART 21: CAPABILITY STATEMENT

The app should be able to generate or serve a FHIR CapabilityStatement for the competition submission:

```json
{
  "resourceType": "CapabilityStatement",
  "status": "draft",
  "date": "2026-06-09",
  "kind": "requirements",
  "fhirVersion": "4.0.1",
  "format": ["json"],
  "rest": [
    {
      "mode": "client",
      "security": {
        "service": [
          {
            "coding": [
              {
                "system": "http://terminology.hl7.org/CodeSystem/restful-security-service",
                "code": "SMART-on-FHIR"
              }
            ]
          }
        ]
      },
      "resource": [
        {
          "type": "Patient",
          "profile": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient",
          "interaction": [{"code": "read"}]
        },
        {
          "type": "Condition",
          "profile": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-condition-encounter-diagnosis",
          "interaction": [{"code": "read"}, {"code": "search-type"}],
          "searchParam": [
            {"name": "patient", "type": "reference"},
            {"name": "clinical-status", "type": "token"},
            {"name": "category", "type": "token"}
          ]
        },
        {
          "type": "Observation",
          "profile": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-lab",
          "interaction": [{"code": "read"}, {"code": "search-type"}],
          "searchParam": [
            {"name": "patient", "type": "reference"},
            {"name": "category", "type": "token"},
            {"name": "code", "type": "token"},
            {"name": "_sort", "type": "string"},
            {"name": "_count", "type": "number"}
          ]
        },
        {
          "type": "MedicationRequest",
          "profile": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-medicationrequest",
          "interaction": [{"code": "read"}, {"code": "search-type"}],
          "searchParam": [
            {"name": "patient", "type": "reference"},
            {"name": "status", "type": "token"}
          ]
        }
      ]
    }
  ]
}
```

---

## PART 22: FINAL BUILD CHECKLIST FOR CODING AGENT

Before considering the project complete, verify:

**CLINICAL LOGIC**

- [ ] Khorana engine passes all 19 unit tests (Part 8A)
- [ ] Renal dosing module passes all 10 unit tests (Part 8B)
- [ ] DDI checker passes all 10 unit tests (Part 8C)
- [ ] Contraindication detector passes all 8 unit tests (Part 8D)
- [ ] Stale lab detector passes all 4 unit tests (Part 8E)
- [ ] All 5 integration tests pass (Part 8F)
- [ ] Boundary values are correct (Plt ≥350, Hgb <10, WBC >11, BMI ≥35)
- [ ] Special exclusions work (myeloma, brain, leukemia, MPN)
- [ ] Missing data handled gracefully with partial scores

**FHIR INTEGRATION**

- [ ] SMART launch works with SMART App Launcher
- [ ] Patient resource parsed correctly (demographics, race, ethnicity)
- [ ] Condition resources parsed → ICD-10 → CancerCategory
- [ ] Observation resources parsed → latest lab by LOINC code
- [ ] MedicationRequest resources parsed → RxNorm codes
- [ ] Standalone mode works with synthetic patient selector
- [ ] All 5 synthetic patient bundles are valid FHIR R4 JSON

**CDS HOOKS**

- [ ] Discovery endpoint returns correct service definitions
- [ ] patient-view hook returns appropriate cards for each risk level
- [ ] order-select hook fires DDI/renal alerts when DOAC ordered
- [ ] Card indicators match severity (critical/warning/info)
- [ ] Prefetch templates are correct

**USER INTERFACE**

- [ ] Patient banner displays correctly
- [ ] Khorana score card shows breakdown with color coding
- [ ] DDI matrix renders with correct colors per severity
- [ ] Renal panel shows CrCl and per-DOAC recommendations
- [ ] Contraindication banner appears when applicable
- [ ] Stale lab warning appears when applicable
- [ ] Recommendation output synthesizes all modules
- [ ] Clinical disclaimer is always visible
- [ ] Source attribution is always visible
- [ ] All 5 synthetic patients render correctly

**DOCUMENTATION**

- [ ] README.md with setup instructions
- [ ] CLINICAL_SOURCES.md with all guideline citations
- [ ] DDI_METHODOLOGY.md explaining severity classification
- [ ] ARCHITECTURE.md with system diagram
- [ ] DEMO_SCRIPT.md for presentation

**COMPETITION DELIVERABLES**

- [ ] CapabilityStatement JSON file
- [ ] Project abstract (1,000 chars) — see Turn 5 document
- [ ] Project rationale (3,500 chars) — see Turn 5 document
- [ ] Project design (7,000 chars) — see Turn 5 document
- [ ] Project evaluation (3,500 chars) — see Turn 5 document
- [ ] Twitter summary (140 chars) — see Turn 5 document
- [ ] FHIR usage description (500 chars) — see Turn 5 document
- [ ] Logo/screenshot prepared

---

## PART 23: KNOWN LIMITATIONS TO DOCUMENT

The coding agent should include these in the README and in the competition submission under "challenges":

- **DDI knowledge base is curated, not exhaustive.** The MVP covers approximately 50 high-priority agents. A production system would integrate with a comprehensive DDI database (e.g., Lexicomp, Clinical Pharmacology, DrugBank).
- **Khorana score has known limitations.** It was validated primarily in solid tumors starting chemotherapy. Its predictive value varies by cancer type and has been shown to underperform in some populations (meta-analysis VTE rates are higher than original validation across all risk categories).
- **FHIR data quality varies.** Real-world EHR data may have inconsistent coding (e.g., SNOMED vs ICD-10 for conditions, NDC vs RxNorm for medications). The parser includes fallback logic but cannot guarantee 100% capture.
- **No prospective clinical validation.** This is a prototype evaluated with synthetic data and clinician feedback. Prospective validation in a clinical setting would be required before deployment.
- **Single-indication focus.** The app addresses ambulatory VTE prophylaxis only. It does not cover VTE treatment, hospitalized patients, surgical prophylaxis, or catheter-related thrombosis.
- **Cockcroft-Gault limitations.** CG may overestimate CrCl in sarcopenic/cachectic patients and underestimate in obese patients. The app flags these scenarios but does not use alternative formulas.
