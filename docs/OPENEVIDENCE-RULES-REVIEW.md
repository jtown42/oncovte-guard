# OpenEvidence prompt — full review of OncoVTE Guard's clinical rules (2026-10-31)

Generated from the code as it runs today (`src/core/*`, `src/data/*`, `src/fhir/fhir-parser.ts`, DDI knowledge base v1.2.0).

**How to use it:** paste **Part A** into OpenEvidence first. When it answers, paste **Part B** (the interaction table) in a follow-up message in the same thread. If OpenEvidence accepts long input, you can paste both at once. Either way, bring back the whole answer **and** the numbered reference block under it. **Nothing gets changed in the app until we've read the answer together.**

---

## PART A — paste this first

I built a deterministic, rules-based clinical decision support app (not AI/ML) for **primary VTE prophylaxis in ambulatory adults with cancer starting or receiving systemic therapy**. Below is every clinical rule it applies, exactly as coded. Please audit it line by line against current primary sources (NCCN Cancer-Associated VTE 2026, ASCO 2023, ITAC 2022, ACC 2026 Scientific Statement, FDA labels, AVERT, CASSINI, CONKO-004, FRAGEM).

For **each numbered rule**, tell me: **correct / needs change / wrong / missing context**, the exact fix if needed, and the citation. Then answer the questions in section A10. Be blunt; this is going in front of an expert audience and in a public demo. Don't restate rules that are fine at length — a one-line "correct" is enough for those.

### A1. Inputs (what the app reads from FHIR R4)
1. **Diagnoses:** active `Condition` resources coded in **ICD-10-CM only** (`clinical-status=active`, `category=encounter-diagnosis` in the live query). SNOMED-coded diagnoses are not read (known limitation).
2. **Labs:** most recent `Observation` by LOINC — platelets 777-3, hemoglobin 718-7, WBC 6690-2, serum creatinine 2160-0, ALT 1742-6, AST 1920-8, total bilirubin 1975-2. Weight 29463-7 (lb converted to kg), height 8302-2 (in converted to cm). **BMI is computed from weight/height**, not read.
3. **Units:** platelets and WBC are assumed to be ×10⁹/L, hemoglobin g/dL, creatinine mg/dL. **No unit conversion** for these (e.g., creatinine in µmol/L is not converted).
4. **Medications:** `MedicationRequest` with `status=active` only, RxNorm-coded. Stopped/completed orders are ignored.
5. **Stale labs:** a lab older than 30 days is flagged "stale" (warning only; it is still used). Exactly 30 days is not stale.
6. **Sex:** FHIR `female` → female; anything else (male/other/unknown) → treated as male for Cockcroft-Gault.
7. **Derived medication flags:** on ESA (epoetin alfa, darbepoetin), on antiplatelet (aspirin, clopidogrel, prasugrel, ticagrelor), on IMiD (thalidomide, lenalidomide, pomalidomide), nephrotoxic chemo (cisplatin, carboplatin, methotrexate).
8. **Clinician-set only (never derived from data):** active major bleeding, prior major bleeding, systemic corticosteroid use, NSAID use, frailty/ECOG 3–4, anorexia/vomiting.

### A2. Decision order (the engine runs these steps in this order)
1. **Khorana exclusion** — if any active cancer is in an excluded group (A3.3) → verdict **"Excluded — disease-specific pathway"**; stop.
2. **Khorana score <2** → **"Prophylaxis not indicated"**; stop.
3. **Universal absolute contraindication** (A5.1) → **"Anticoagulation contraindicated"**; stop.
4. Otherwise evaluate **apixaban and rivaroxaban**; each is blocked by (in this order) a targeted contraindication (A5.2), renal "avoid" (A6), or a **major** drug interaction (A7). Missing weight or creatinine → renal treated as "avoid" for every agent.
5. Eligible DOACs → **"Prophylaxis recommended — apixaban or rivaroxaban."**
6. **Both DOACs blocked** → fall back to LMWH (enoxaparin / dalteparin) if LMWH is not itself blocked → **"Prophylaxis recommended — LMWH."** Never fall back to dabigatran or edoxaban.
7. Nothing eligible → **"Caution"** with no recommended agent.
8. Any **relative** contraindication (A5.3) present → verdict tone becomes **caution** (agents still shown).
9. Dabigatran and edoxaban are **never** offered; they appear only as reference columns ("not an NCCN-supported ambulatory cancer prophylaxis option").

### A3. Khorana score
1. Points: cancer site 0/1/2; **platelets ≥350 ×10⁹/L** +1; **hemoglobin <10 g/dL or on an ESA** +1; **WBC >11 ×10⁹/L** +1; **BMI ≥35** +1. Exactly 350 scores; exactly 10.0 Hgb does not; exactly 11.0 WBC does not; exactly 35.0 BMI scores. Max 6.
2. Missing lab → 0 points for that item and the assessment is flagged "incomplete" (an ESA alone satisfies the hemoglobin item).
3. **Excluded (score not applied):** multiple myeloma / plasma-cell neoplasms (C90.0–C90.3); acute leukemias (C91.0, C92.0, C92.4, C92.5, C92.6, C92.A, C93.0, C94.0, C95.0); MPNs (D45, D47.1, D47.3, D47.4, **C92.1 CML**); primary or metastatic brain tumor (C71, C79.31). CLL (C91.1) is **not** excluded. If any excluded diagnosis is present it governs, even alongside a scored cancer. Myeloma + IMiD adds a pointer to myeloma-specific prophylaxis (aspirin / LMWH / prophylactic apixaban per NCCN MM / ITAC).
4. **Very high (+2):** stomach C16, pancreas C25.
5. **High (+1):** lung C34; Hodgkin C81; non-Hodgkin lymphoma C82–C86; ovarian C56; uterine C54–C55; cervical C53; other gynecologic C51, C52, C57, C58; bladder C67; testicular C62.
6. **Not scored (0):** renal-cell carcinoma C64 (with an advisory that its VTE risk may exceed some scored GU sites, citing Lam 2026; evidence grade C), renal pelvis/ureter C65/C66, and all other solid tumors.
7. With multiple cancers, the highest-scoring site governs.
8. **Tiers:** 0 = low, 1–2 = intermediate, ≥3 = high. **Prophylaxis threshold: ≥2.**
9. **Advisories shown with the score:** lung — limited discrimination (van Es IPD meta-analysis); pancreatic — discrimination contested in validation cohorts; every scored patient — a general calibration caveat.

### A4. Bleeding-risk panel (qualitative — never a score; never changes the verdict)
Shows a tier ("elevated" if any factor, "standard" if none, "insufficient data" if inputs missing) and the list of factors, with the disclaimer that no validated bleeding score exists for primary prophylaxis. Factors:
1. Gastric/GEJ tumor (C16) — "LMWH preferred (NCCN VTE-2 footnote)".
2. Other luminal GI (C15, C17–C20) — elevated bleeding risk (ACC 2026).
3. Urothelial or gynecologic tumor (C51–C55, C57, C58, C65–C67).
4. Renal-cell carcinoma or melanoma (C64, C43).
5. CrCl <30 mL/min — "LMWH preferred".
6. Weight <50 kg.
7. Hemoglobin <10 g/dL.
8. Platelets <100 ×10⁹/L.
9. Anorexia/vomiting (clinician flag).
10. Frailty / ECOG 3–4 (clinician flag) — "LMWH preferred".
11. Systemic corticosteroids (clinician flag; Vedovati HR 2.69).
12. Concurrent antiplatelet or NSAID.
13. Prior major bleeding (clinician flag).

### A5. Contraindications
**A5.1 Universal absolute (stop all anticoagulation):**
1. Active major bleeding (clinician flag).
2. **Platelets <50 ×10⁹/L** (NCCN VTE-B-2 per agent; VTE-F for DOACs).

**A5.2 Targeted absolute (block specific agents; the rest stay available):**
1. **Antiphospholipid syndrome (D68.61)** → block all four DOACs (TRAPS; NCCN VTE-D-5); LMWH remains.
2. **Pregnancy or breastfeeding (any O-code, Z33.1, Z3A, Z39.1)** → block all DOACs; LMWH remains.
3. **Hepatic, per agent (multiples of each lab's ULN; defaults ALT 40, AST 40 U/L, bilirubin 1.2 mg/dL):** apixaban — ALT or AST >3× ULN, **or** bilirubin >2× ULN; rivaroxaban — ALT or AST >3× ULN; dabigatran — ALT or AST >2× ULN; edoxaban — ALT or AST >3× ULN **and** bilirubin >2× ULN. Child-Pugh B/C is not automated (noted in text).
4. **HIT (D75.82)** → block enoxaparin and dalteparin; DOACs remain.
5. **Weight <40 kg** → block apixaban ("Avoid if weight <40 kg", NCCN VTE-B-2).

**A5.3 Relative (caution; agents still offered):**
1. GI/GU tract tumor (C15, C16, C18–C20, C65–C67) — "apixaban may be safer than rivaroxaban/edoxaban (NCCN 2B); consider LMWH".
2. Brain tumor (C71, C79.31).
3. Multiple myeloma on an IMiD.
4. Concurrent antiplatelet.

### A6. Renal function and renal rules
1. **Cockcroft-Gault:** CrCl = (140 − age) × weight × (0.85 if female) / (72 × SCr). Uses **adjusted body weight** (IBW + 0.4 × (actual − IBW); Devine IBW) when **BMI ≥30** and height is known and actual > IBW; otherwise actual weight.
2. Bands: ≥90 normal, 60–89 mild, 30–59 moderate, <30 severe.
3. **Apixaban:** CrCl <15 → avoid (EMA SmPC); 15–29 → caution; ≥30 → standard.
4. **Rivaroxaban:** <30 → avoid.
5. **Enoxaparin / dalteparin:** <30 → **avoid** (ambulatory table, NCCN VTE-B-2). (The 30 mg enoxaparin renal dose is the inpatient VTE-B-1 reading, not used here.)
6. Dabigatran / edoxaban (reference only): <30 → avoid.
7. Alerts: CrCl <30 critical ("avoid rivaroxaban and LMWH; apixaban only with caution; consider UFH or specialist input"); CrCl 30–49 warning ("dose-adjust and monitor"); weight <60 kg info (CG may overestimate in cachexia); nephrotoxic chemo info; adjusted-weight info.

### A7. Drug interactions
1. A knowledge base of **70 agents** (Part B) rates each against apixaban, rivaroxaban, dabigatran, edoxaban as **major / moderate / pharmacodynamic (additive bleeding) / minor / none / unknown**.
2. **Only "major" with apixaban or rivaroxaban blocks that DOAC.** Moderate and pharmacodynamic produce warnings only. Dabigatran/edoxaban ratings never drive a block or an alert.
3. A medication **not in the table** is shown as **"Unknown — verify manually"** and does not block anything.
4. Alert wording separates inhibitors ("raises DOAC levels, increasing bleeding risk") from inducers ("lowers DOAC levels, risking loss of efficacy").

### A8. Doses shown
1. **Apixaban 2.5 mg PO BID**; **rivaroxaban 10 mg PO daily** — "up to 6 months, longer if VTE risk persists" (NCCN VTE-B-2 · AVERT / CASSINI).
2. **LMWH, non-pancreatic:** enoxaparin **40 mg SC daily**, dalteparin **5,000 units SC daily** ("Standard prophylactic dose (NCCN VTE-B)").
   - BMI ≥40: enoxaparin 40 mg SC **every 12 h**; dalteparin **7,500 units** daily.
   - Weight ≤50 kg: dalteparin **2,500 units**; enoxaparin **30 mg** (41–50 kg) or **20 mg** (≤40 kg).
3. **LMWH, pancreatic (C25):** enoxaparin **1 mg/kg SC daily ×3 months, then 40 mg daily** (CONKO-004); dalteparin **200 units/kg daily ×1 month, then 150 units/kg daily ×2 months** (FRAGEM).

### A9. Things I already know are gaps (tell me how serious each is)
1. **Itraconazole washout:** the label says avoid apixaban/rivaroxaban during and for **2 weeks after** itraconazole, but the app ignores stopped medications (A1.4). Not yet coded.
2. **Corticosteroids and NSAIDs** are clinician flags only; a dexamethasone or ibuprofen order does not set them automatically.
3. **No lab-unit conversion** (A1.3) — an SI-unit creatinine would miscompute CrCl.
4. **Supportive drugs outside the table** (e.g., acyclovir, allopurinol, ondansetron) show as "unknown".
5. Sex other than female is treated as male for Cockcroft-Gault.
6. Weight-adjusted LMWH doses (A8.2) apply only to non-pancreatic patients; the pancreatic weight-based regimen is shown as-is at any weight.

### A10. Questions
1. Which rules, if any, would make an oncologist, hematologist or pharmacist distrust the tool on sight?
2. Is the **decision order** (A2) right? In particular: should a **relative** GI/GU tumor caution or a **gastric** tumor (NCCN "prefer LMWH") ever change the recommended agent rather than just add caution?
3. Is **"LMWH avoid at CrCl <30"** the right call for ambulatory prophylaxis, or should the app offer reduced-dose enoxaparin 30 mg daily or UFH?
4. Should **platelets 50–100 ×10⁹/L** do anything beyond the bleeding panel (e.g., dose reduction, caution verdict)?
5. Anything **missing** that a guideline treats as a contraindication or a dose change in this population (e.g., recent surgery, CNS metastases beyond brain primaries, concurrent anticoagulant already on board, age thresholds)?
6. Rank the gaps in A9 by clinical risk.

---

## PART B — the interaction table (paste as a follow-up in the same thread)

Here is the full drug-interaction table the engine uses (KB v1.2.0, curated from the AHA 2022 Scientific Statement Table 3, Hellfritzsch et al. 2024, FDA DOAC labels, and the 2025 ACC cardio-oncology guidance for BTK inhibitors). Columns: agent | RxNorm | class | CYP3A4 effect | P-gp effect | rating vs **apixaban | rivaroxaban | dabigatran | edoxaban**. MAJOR blocks the DOAC; mod = moderate (warning); PD = pharmacodynamic additive bleeding (warning); ? = unknown.

Please flag every rating you would change for **apixaban and rivaroxaban** (those drive the decision), with the label section or guideline citation. Dabigatran/edoxaban are reference-only, so flag those only if clearly wrong. I'm especially unsure about: **clarithromycin** (strong dual inhibitor rated *minor*), **voriconazole** (strong CYP3A4 rated *moderate*), **posaconazole/ketoconazole** (*major*), **cyclosporine/tacrolimus**, **enzalutamide/apalutamide/mitotane** (*major* as strong inducers), **dexamethasone** (*minor*), and the **VEGF/BTK PD** ratings.

| Agent | RxNorm | Class | CYP3A4 | P-gp | Apix | Riva | Dabi | Edox |
|---|---|---|---|---|---|---|---|---|
| Mitotane | 7004 | Adrenocortical agent | strong inducer | unknown | MAJOR | MAJOR | minor | minor |
| Bendamustine | 134547 | Alkylating agent | none | none | none | none | none | none |
| Apalutamide | 1999574 | Androgen receptor inhibitor | strong inducer | moderate inducer | MAJOR | MAJOR | minor | minor |
| Enzalutamide | 1307298 | Androgen receptor inhibitor | strong inducer | minor inhibitor | MAJOR | MAJOR | minor | minor |
| Abiraterone | 1100072 | CYP17 inhibitor | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Doxorubicin | 3639 | Anthracycline | none | weak inducer | minor | minor | minor | minor |
| Rituximab | 121191 | Anti-CD20 mAb | none | none | none | none | none | none |
| Ipilimumab | 1094833 | Anti-CTLA-4 mAb | none | none | none | none | none | none |
| Pertuzumab | 1298944 | Anti-HER2 mAb | none | none | none | none | none | none |
| Trastuzumab | 224905 | Anti-HER2 mAb | none | none | none | none | none | none |
| Nivolumab | 1597876 | Anti-PD-1 mAb | none | none | none | none | none | none |
| Pembrolizumab | 1547545 | Anti-PD-1 mAb | none | none | none | none | none | none |
| Atezolizumab | 1792776 | Anti-PD-L1 mAb | none | none | none | none | none | none |
| Durvalumab | 1919503 | Anti-PD-L1 mAb | none | none | none | none | none | none |
| Bevacizumab | 253337 | Anti-VEGF mAb | none | none | PD | PD | PD | PD |
| Ramucirumab | 1535922 | Anti-VEGFR2 mAb | none | none | PD | PD | PD | PD |
| Carbamazepine | 2002 | Antiepileptic | strong inducer | strong inducer | MAJOR | MAJOR | ? | ? |
| Phenytoin | 8183 | Antiepileptic | strong inducer | strong inducer | MAJOR | MAJOR | ? | ? |
| 5-Fluorouracil | 4492 | Antimetabolite | none | none | none | none | none | none |
| Gemcitabine | 12574 | Antimetabolite | none | none | none | none | none | none |
| Capecitabine | 194000 | Antimetabolite | none | none | none | none | none | none |
| Methotrexate | 6851 | Antifolate | none | none | none | none | none | none |
| Pemetrexed | 68446 | Antifolate | none | none | none | none | none | none |
| Bleomycin | 1622 | Antitumor antibiotic | none | none | none | none | none | none |
| Fluconazole | 4450 | Azole antifungal | moderate inhibitor | none | none | mod | ? | ? |
| Isavuconazonium | 1608322 | Azole antifungal | moderate inhibitor | moderate inhibitor | mod | mod | ? | ? |
| Itraconazole | 28031 | Azole antifungal | strong inhibitor | strong inhibitor | MAJOR | MAJOR | MAJOR | mod |
| Ketoconazole | 6135 | Azole antifungal | strong inhibitor | strong inhibitor | MAJOR | MAJOR | mod | mod |
| Posaconazole | 282446 | Azole antifungal | strong inhibitor | strong inhibitor | MAJOR | MAJOR | mod | mod |
| Voriconazole | 121243 | Azole antifungal | strong inhibitor | moderate inhibitor | mod | mod | minor | minor |
| Venetoclax | 1747556 | BCL-2 inhibitor | none | moderate inhibitor | mod | mod | ? | ? |
| Dabrafenib | 1424911 | BRAF inhibitor | moderate inducer | moderate inducer | mod | mod | minor | minor |
| Vemurafenib | 1147220 | BRAF inhibitor | moderate inducer | moderate inducer | mod | mod | minor | minor |
| Acalabrutinib | 1986808 | BTK inhibitor | unknown | unknown | PD | PD | PD | PD |
| Ibrutinib | 1442981 | BTK inhibitor | minor inhibitor | minor inhibitor | PD | PD | MAJOR | PD |
| Pirtobrutinib | 2629338 | BTK inhibitor | unknown | unknown | PD | PD | PD | PD |
| Zanubrutinib | 2262435 | BTK inhibitor | unknown | unknown | PD | PD | PD | PD |
| Ribociclib | 1873916 | CDK4/6 inhibitor | moderate inhibitor | unknown | mod | mod | minor | minor |
| Cyclosporine | 3008 | Calcineurin inhibitor | moderate inhibitor | strong inhibitor | mod | mod | mod | mod |
| Tacrolimus | 42316 | Calcineurin inhibitor | minor inhibitor | strong inhibitor | mod | minor | mod | minor |
| Dexamethasone | 3264 | Corticosteroid | weak inducer | unknown | minor | minor | minor | minor |
| Clarithromycin | 21212 | Macrolide antibiotic | strong inhibitor | strong inhibitor | minor | minor | ? | ? |
| Axitinib | 1242999 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Cabozantinib | 1363268 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Lenvatinib | 1603296 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Pazopanib | 714438 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Regorafenib | 1312397 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Sorafenib | 495881 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Sunitinib | 357977 | VEGFR TKI | none | none | PD | PD | PD | PD |
| Aprepitant | 358255 | NK1 antagonist (antiemetic) | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Idelalisib | 1544460 | PI3K inhibitor | strong inhibitor | minor inhibitor | MAJOR | MAJOR | mod | minor |
| Carboplatin | 40048 | Platinum | none | none | none | none | none | none |
| Cisplatin | 2555 | Platinum | none | none | none | none | none | none |
| Oxaliplatin | 32592 | Platinum | none | none | none | none | none | none |
| Carfilzomib | 1302966 | Proteasome inhibitor | none | none | none | none | ? | ? |
| Rifampin | 9384 | Rifamycin antibiotic | strong inducer | strong inducer | MAJOR | MAJOR | MAJOR | MAJOR |
| Tamoxifen | 10324 | SERM | none | minor inhibitor | minor | minor | minor | minor |
| Docetaxel | 72962 | Taxane | none | none | none | none | none | none |
| Paclitaxel | 56946 | Taxane | weak inducer | none | minor | minor | none | none |
| Nab-paclitaxel | 486610 | Taxane (albumin-bound) | weak inducer | none | minor | minor | none | none |
| Etoposide | 4179 | Topoisomerase II inhibitor | minor inhibitor | minor inhibitor | minor | minor | minor | minor |
| Ceritinib | 1535457 | ALK TKI | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Crizotinib | 1148495 | ALK TKI | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Lorlatinib | 2103164 | ALK TKI | moderate inducer | moderate inducer | mod | mod | ? | ? |
| Imatinib | 282388 | BCR-ABL TKI | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Nilotinib | 662281 | BCR-ABL TKI | moderate inhibitor | moderate inhibitor | mod | mod | mod | minor |
| Lapatinib | 480167 | HER2 TKI | minor inhibitor | moderate inhibitor | mod | mod | ? | ? |
| Neratinib | 1940643 | HER2 TKI | unknown | strong inhibitor | mod | mod | mod | mod |
| Tucatinib | 2361285 | HER2 TKI | strong inhibitor | moderate inhibitor | MAJOR | MAJOR | minor | minor |
| Vinblastine | 11198 | Vinca alkaloid | none | weak inducer | minor | minor | minor | minor |

Also: should any common oncology **supportive-care** drugs be added (e.g., acyclovir, allopurinol, ondansetron, PPIs, SSRIs/SNRIs, NSAIDs, amiodarone, diltiazem/verapamil, St John's wort), and with what ratings?

---

## Outcome (2026-10-31)

OpenEvidence answered Parts A and B together, plus a separate severe-anemia answer. The user approved **Tier 1** with a **7 g/dL** anemia threshold; Tier 2 waits until after Nov 10. Tests: `tests/core/openevidence-rules-review.test.ts` (19 new; 248 total).

**Applied (Tier 1):**

| Finding | Change |
|---|---|
| Already-anticoagulated patients weren't detected (AVERT excluded them; the rivaroxaban label warns about adding agents) | Any active apixaban, rivaroxaban, dabigatran, edoxaban, enoxaparin, dalteparin, UFH or warfarin order → "Already anticoagulated" (overallAction `not_indicated`, verdictLabel `already_anticoagulated`); no agent offered |
| Hgb 5 returned a confident "recommend" (anemia adds a Khorana point; RIETE RR 2.52 for major bleeding; often a sign of bleeding) | **Hgb <7 g/dL → universal hold**, labeled "OncoVTE design rule; not an NCCN contraindication" (AABB threshold; NCCN anemia workup). Khorana still counts the point. Hgb 7 to <10 unchanged |
| No warning for a falling hemoglobin | A fall of ≥2 g/dL from any result in the prior 30 days → "possible active bleeding" warning (NCCN major-bleeding definition) |
| No lab-unit handling | Hemoglobin g/L ÷10, mmol/L ÷0.6206; creatinine µmol/L ÷88.4 (UCUM code first). Missing or unknown unit → value not used, "verify manually" |
| Missing labs could produce "not indicated" | Score <2, but score + possible points from missing items ≥2 → "Insufficient data" |
| Decision order sent a bleeding myeloma patient to a myeloma regimen | Already anticoagulated → universal stops → exclusion → score → options |
| The brain-tumor relative caution could never fire | Removed |
| The bleeding panel said "LMWH preferred" at CrCl <30 while the renal rules avoid LMWH | Text now says patients with CrCl <30 were excluded from the prophylaxis trials; no LMWH preference |
| The gastric note credited NCCN for ACC's "LMWH may be preferred" | "Increased hemorrhage risk with DOACs (NCCN VTE-2 footnote); LMWH may be preferred (ACC 2026)" |
| Enoxaparin 20 mg (≤40 kg) and dalteparin 2,500 units had no source | Removed: enoxaparin 30 mg for everyone ≤50 kg; dalteparin stays 5,000 units; all weight-adjusted doses labeled "extrapolated from inpatient/surgical data" |
| Supportive drugs showed "unknown" | KB v1.3.0 adds acyclovir, allopurinol and ondansetron as "none" for apixaban/rivaroxaban (dabigatran/edoxaban unknown) |

**Confirmed correct:** Khorana points, boundaries, sites, tiers and the ≥2 threshold; exclusions (CML as an MPN is defensible; CLL is fine); platelets <50 as a universal stop (50–100 stays a bleeding-panel item); renal rules (apixaban caution at 15–29, rivaroxaban/LMWH avoid <30); DOAC duration wording; APS, pregnancy, HIT and <40 kg blocks; ketoconazole, itraconazole, carbamazepine, phenytoin and rifampin MAJOR; clarithromycin non-blocking (both labels exempt it); BTK/VEGF PD; LMWH avoid <30 kept for now (the enoxaparin 30 mg data are inpatient).

**Deferred to after Nov 10 (Tier 2):**
- One precedence rule for interactions (label > ASCO class statement > reviews); voriconazole → major under ASCO's wording.
- Rivaroxaban conditional block with combined P-gp + moderate CYP3A inhibitors at CrCl 15 to <80 (cyclosporine, isavuconazonium, imatinib, nilotinib, crizotinib, ceritinib, aprepitant, abiraterone, erythromycin, verapamil, diltiazem).
- Tag posaconazole, idelalisib, tucatinib and the strong inducers as "class/expert (ASCO), not label"; fluconazole moderate for both.
- Add St John's wort and phenobarbital (major); SSRIs/SNRIs, antiplatelets and NSAIDs (PD, and set the flags automatically); amiodarone (moderate); PPIs none (with the itraconazole-absorption note).
- Condition query: include `problem-list-item`; accept recurrence and relapse.
- Read INR, PT and aPTT (hemorrhagic coagulopathy); add neuraxial-procedure and gastric/small-bowel-resection flags.
- Itraconazole 14-day washout; sex other than female → female factor with a flag; gastric (C16) → LMWH and apixaban preferred, rivaroxaban less preferred; pancreatic-regimen weight caveat.

**Demo impact:** no demo verdict changed. Talk images re-captured: all identical except the panel slide (three anticoagulated rows now read "Already anticoagulated"; still 19 flagged) and Dorothy's hidden backup slide (bleeding-panel text). Both were swapped into OncoVTE-final.pptx.

### References (as given)
1. NCCN. Cancer-Associated Venous Thromboembolic Disease. Updated 2026-05-05.
2. Kumbhani DJ, Armbruster AL, Cheng RK, et al. 2026 ACC Scientific Statement on DOACs. J Am Coll Cardiol. 2026. doi:10.1016/j.jacc.2026.05.033.
3. Rojas-Hernandez CM, Oo TH. DOACs in cancer VTE: insights from RCTs. Drugs. 2019;79(6):621-631. doi:10.1007/s40265-019-01084-2.
4. Xarelto. FDA label, updated 2026-09-10.
5. Rivaroxaban. FDA label, updated 2025-12-11.
6. Enoxaparin sodium. FDA label, updated 2025-09-30.
7. Garcia DA, Baglin TP, Weitz JI, Samama MM. Parenteral anticoagulants (ACCP 9th ed). Chest. 2012;141(2 Suppl):e24S-e43S. doi:10.1378/chest.11-2291.
8. Sebaaly J, Covert K. Enoxaparin dosing at extremes of weight. Ann Pharmacother. 2018;52(9):898-909. doi:10.1177/1060028018768449.
9. Vandiver JW, Ritz LI, Lalama JT. Chemical prophylaxis in morbid obesity. J Thromb Thrombolysis. 2016;41(3):475-81. doi:10.1007/s11239-015-1231-5.
10. VTE Prophylaxis in Hospitalized Surgical Patients. Anticoagulation Forum. 2026.
11. ELIQUIS. FDA label, updated 2025-04-17.
12. Key NS, Khorana AA, Kuderer NM, et al. ASCO guideline update. J Clin Oncol. 2023;41(16):3063-3071. doi:10.1200/JCO.23.00294.
13. Joglar JA, Chung MK, et al. 2023 ACC/AHA/ACCP/HRS atrial fibrillation guideline. J Am Coll Cardiol. 2024;83(1):109-279. doi:10.1016/j.jacc.2023.08.017.
14. Wiggins BS, Dixon DL, Neyens RR, Page RL, Gluckman TJ. Select DDIs with DOACs (JACC Review). J Am Coll Cardiol. 2020;75(11):1341-1350. doi:10.1016/j.jacc.2019.12.068.
15. Rahman AA, He N, Rej S, Platt RW, Renoux C. SSRIs and oral anticoagulants: major bleeding meta-analysis. Thromb Haemost. 2023;123(1):54-63. doi:10.1055/a-1932-8976.

The severe-anemia answer also cited RIETE (anemia RR 2.52 for major and 2.73 for fatal bleeding), API-CAT (sHR 1.93), the AABB 7 g/dL threshold, and the UCUM hemoglobin conversion (1 g/dL = 0.6206 mmol/L).
