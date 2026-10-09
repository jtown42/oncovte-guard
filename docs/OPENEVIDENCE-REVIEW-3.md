# OpenEvidence review 3 — LMWH dosing, ibrutinib citations, itraconazole realism (2026-10-09)

Verbatim record of OpenEvidence's answer to the round-3 questions (LMWH doses, missing
references from review 2 Part C, itraconazole vs voriconazole), followed by the James
scenario spec OpenEvidence produced. Reference markers ([1]–[21]) are as returned; the
numbered reference list itself was **not** included in the paste. What was applied is at
the end.

---

## Part D — Answer to the three round-3 questions (verbatim)

Three precise corrections, and the first one carries the same lesson as the ibrutinib fix: your demo is showing a dose whose evidence base doesn't match your demo patient.

### 1. The LMWH doses: right regimen, wrong patient

Your instinct is half-right in an important way. The doses in your app — enoxaparin 1 mg/kg daily then 40 mg daily, and dalteparin 200 units/kg daily × 1 month then 150 units/kg daily — are not fabricated: they are copied almost verbatim from the NCCN ambulatory medical-oncology prophylaxis table (VTE-B-2 in the v1.2026 Cancer-Associated VTE guideline). [1] But that table carries a footnote stating explicitly that these weight-based regimens are supported by data in advanced unresectable and metastatic pancreatic cancer — i.e., they are the CONKO-004 / FRAGEM regimens, exactly as you suspected. [1] So the problem isn't that the doses are invented; it's that your app applies a near-therapeutic, pancreatic-cancer-derived regimen to every patient, including a 72-year-old with lymphoma.

For a general high-Khorana ambulatory patient who is not pancreatic, the defensible prophylactic dose is the standard fixed dose:

| Agent | Standard prophylactic dose | Pancreatic-specific (weight-based) option | Renal (CrCl <30) | References |
|---|---|---|---|---|
| Enoxaparin | 40 mg SC once daily | 1 mg/kg SC daily × 3 mo, then 40 mg daily | Avoid, or 30 mg SC daily per label/ACCP | [1-3] |
| Dalteparin | 5,000 units SC once daily | 200 units/kg SC daily × 1 mo, then 150 units/kg daily | Avoid if CrCl <30 | [1] |
| Fondaparinux | 2.5 mg SC once daily | — | Avoid if CrCl <30; caution 30–49 | [1] |

The fixed doses (enoxaparin 40 mg daily; dalteparin 5,000 units daily) are what NCCN lists as category 1 for medical-oncology inpatient prophylaxis and for post-discharge prophylaxis, and they are the doses used across the ambulatory LMWH prophylaxis evidence base. [1] ASCO 2023 (Recommendation 2.2) endorses LMWH as one option for high-risk outpatients (Khorana ≥2) without specifying a fixed dose, noting the LMWH evidence is from meta-analyses showing roughly a halving of symptomatic VTE. [4] ASH 2021 (Recommendation 13) suggests parenteral LMWH prophylaxis only for high-risk ambulatory patients and makes no weight-based dose stipulation. [5] ITAC 2022 reserves its strongest LMWH prophylaxis recommendation (grade 1A) specifically for locally advanced/metastatic pancreatic cancer, which is the same signal as the NCCN footnote. [6]

What the app should do: make the LMWH prophylaxis dose cancer-type aware. Default to enoxaparin 40 mg SC daily or dalteparin 5,000 units SC daily for the general high-Khorana outpatient; reserve the weight-based regimen (enoxaparin 1 mg/kg daily; dalteparin 200→150 units/kg) for pancreatic cancer, with a one-line note that this regimen is pancreatic-derived per NCCN VTE-B-2. [1] For your lymphoma demo patient with normal renal function, the on-screen fallback should read enoxaparin 40 mg SC once daily (or dalteparin 5,000 units SC once daily) — not the weight-based dose currently shown.

On your three sub-questions: dose should depend on body weight at the extremes (BMI ≥40 → enoxaparin 40 mg q12h or 0.5 mg/kg daily, dalteparin 7,500 units daily; body weight 25–50 kg → reduced dosing), on CrCl <30 (NCCN says avoid both LMWHs in the prophylaxis tables; the enoxaparin label/ACCP permit 30 mg daily if LMWH is required), and on cancer type (pancreatic → weight-based; myeloma → its own IMiD pathway with aspirin/LMWH/apixaban; the exclusions you already handle). [1-2][6]

### 2. Full citations from the ibrutinib answer

**2025 ACC Concise Clinical Guidance (the factor Xa / dabigatran source):**

Ganatra S, Barac A, Armenian S, et al. Diagnosis and Management of Cardiovascular Adverse Effects of Targeted Oncology Therapies: Bruton's Tyrosine Kinase, Immune Checkpoint, and Vascular Endothelial Growth Factor Inhibitors: 2025 ACC Concise Clinical Guidance: A Report of the American College of Cardiology Solution Set Oversight Committee. Journal of the American College of Cardiology; published online February 10, 2026. [7] The relevant content is in Section 4.1.5 (Management of Preexisting Cardiovascular Conditions in Patients Starting Ibrutinib), with the drug-interaction mechanisms in Table 4 and the accompanying Figure 2. That section states directly that direct thrombin inhibitors (dabigatran) should not be coadministered because ibrutinib inhibits intestinal P-gp and can raise their levels, whereas "although ibrutinib theoretically increases the concentration of factor Xa inhibitors, no significant clinical adverse events have been observed" — which is the basis for preferring apixaban/rivaroxaban and flagging dabigatran as the major interaction. [7] One honesty caveat for your records: the retrieved record does not contain the volume, page range, or DOI (it appears to be an online-ahead-of-print at the time of indexing), so verify those against JACC before you print them on a slide — don't transcribe a fabricated DOI.

**Imbruvica (ibrutinib) label:**

Food and Drug Administration, Imbruvica (ibrutinib) prescribing information, 2025. [8] Bleeding with anticoagulants is in Section 5.1 (Hemorrhage), which states that use of either anticoagulant or antiplatelet agents concomitantly with ibrutinib increases the risk of major hemorrhage and that the mechanism "is not well understood." The CYP3A4 and P-gp characterization is in [8] Section 7 (Drug Interactions) and Section 12.3 (Clinical Pharmacology) — ibrutinib as a sensitive CYP3A substrate (dose adjustments for CYP3A inhibitors/inducers) and the statement that it may inhibit P-gp/BCRP.

**Apixaban (Eliquis) label — "avoid with itraconazole":**

Food and Drug Administration, apixaban prescribing information, 2024. [9] Section 7.1 (Combined P-gp and Strong CYP3A4 Inhibitors), cross-referenced to Section 2.5 (Dosage and Administration): for patients receiving apixaban 2.5 mg twice daily, avoid co-administration with combined P-gp and strong CYP3A4 inhibitors, with the named examples "ketoconazole, itraconazole, ritonavir." [9]

**Rivaroxaban (Xarelto) label — "avoid with itraconazole":**

Food and Drug Administration, rivaroxaban prescribing information, 2025. [10] Section 7.2 (Drugs that Inhibit Cytochrome P450 3A Enzymes and Drug Transport Systems): avoid concomitant administration with known combined P-gp and strong CYP3A inhibitors (label examples "ketoconazole and ritonavir"); itraconazole falls in this class rather than being named. [10]

### 3. Itraconazole realism — and a trap with voriconazole

Your ID reviewer is right that voriconazole (or isavuconazole) is first-line for invasive pulmonary aspergillosis, not itraconazole. [11-13] Itraconazole and posaconazole sit in the salvage/alternative tier per IDSA. [14] So a stock "IPA → itraconazole" scenario needs a reason.

But there is a more important engine problem hiding here: voriconazole would not reliably block both DOACs, so if you "fixed" the realism by switching to voriconazole, you would break the demo. Voriconazole is a strong CYP3A inhibitor but not a meaningful P-gp inhibitor, so it does not satisfy rivaroxaban's "combined P-gp and strong CYP3A" avoid criterion. In the microdose cocktail study, voriconazole's effect on rivaroxaban was minimal, whereas itraconazole and posaconazole (both P-gp + strong CYP3A) produced clear increases. [15-16] This differential is shown cleanly in the Rohr et al. study, where the rivaroxaban concentration-time curve barely moves with voriconazole but rises with itraconazole and posaconazole:

> *[Figure as returned by OpenEvidence:]* Figure 3. Rivaroxaban plasma concentration-time curves after administration of rivaroxaban 25 µg alone (baseline) and during coadministration with different azole fungistatic drugs (itraconazole, voriconazole, fluconazole, ketoconazole, posaconazole, isavuconazole) in linear and logarithmic presentation. Perpetrator Characteristics of Azole Antifungal Drugs on Three Oral Factor Xa Inhibitors Administered as a Microdosed Cocktail. Clin Pharmacokinet. January 1, 2022. Used under license from Springer Nature.

So for rivaroxaban, your knowledge base should rate voriconazole as moderate (strong CYP3A4 only, not combined), but apixaban as major/avoid (apixaban is more CYP3A4-dependent, and reviews list voriconazole among the strong dual inhibitors to avoid). [17-18] A voriconazole patient would therefore land in "rivaroxaban allowed, apixaban avoid" — not your clean "both blocked → LMWH" verdict.

| Azole | Apixaban | Rivaroxaban | ID realism | References |
|---|---|---|---|---|
| Itraconazole | Avoid (named in label) | Avoid (combined P-gp + strong CYP3A class) | Salvage/alternative for IPA; needs a reason vs. voriconazole | [9-10, 14, 17, 19] |
| Posaconazole | Avoid (combined P-gp + strong CYP3A) | Avoid (combined P-gp + strong CYP3A) | Authentic in hematology — salvage IPA and mold-active prophylaxis | [16, 19-21] |
| Voriconazole | Avoid (strong CYP3A4) | Minimal effect — does NOT clearly trigger avoid | First-line for IPA | [15-16, 18] |

Two ways to make the scenario hold up, both preserving the "both avoid → LMWH" verdict:

Keep itraconazole, justify it in one line via voriconazole intolerance. This is clinically routine — voriconazole has a narrow therapeutic window, hepatotoxicity, visual disturbances, phototoxicity, and QTc prolongation, any of which forces a switch. Stage line: "He developed invasive pulmonary aspergillosis during chemotherapy and was switched from first-line voriconazole to itraconazole after voriconazole-induced hepatotoxicity — a combined P-gp and strong CYP3A4 inhibitor both DOAC labels say to avoid, so the engine falls back to LMWH." This keeps itraconazole's advantage of being named verbatim in the apixaban label for your on-screen quote. [9][12]

Switch to posaconazole for maximum ID authenticity. Posaconazole is a bona fide hematology drug — used both as salvage therapy for refractory IPA and as mold-active prophylaxis — and it is unambiguously a combined P-gp + strong CYP3A4 inhibitor, so both DOACs are avoid. The trade-off is that posaconazole is not in the US apixaban/rivaroxaban label example lists (only ketoconazole/itraconazole/ritonavir appear), so your "here's the exact label text" moment is slightly weaker, though the drug-interaction review literature does list it explicitly. [16-21]

Recommendation: keep itraconazole with the voriconazole-intolerance one-liner. It is the only option that is simultaneously clinically defensible, label-named for the apixaban quote, and class-covered for rivaroxaban — and it needs no change to your existing patient bundle beyond the single justifying sentence. Avoid voriconazole entirely for this demo, because it won't block rivaroxaban and would make the verdict wrong in exactly the way the ibrutinib entry was.

---

## Part E — James Chen scenario spec (verbatim, as produced by OpenEvidence)

**Purpose.** Replaces the ibrutinib-based James Chen scenario, whose interaction pointed the wrong way (the 2025 ACC cardio-oncology guidance makes factor Xa inhibitors the *preferred* anticoagulant with ibrutinib, and names dabigatran — not apixaban/rivaroxaban — as the one to avoid). The itraconazole rewrite preserves the exact demo mechanic ("remove the drug → DOACs return; add it back → LMWH") while using an interaction both DOAC FDA labels unambiguously support.

**One-line clinical history (on-screen patient summary):**
> James Chen, 72 — relapsed mantle cell lymphoma on rituximab, Khorana 2. Developed invasive pulmonary aspergillosis during chemotherapy and was switched from first-line voriconazole to itraconazole after voriconazole-induced hepatotoxicity. Normal renal function.

Voriconazole (or isavuconazole) is first-line for invasive pulmonary aspergillosis per IDSA 2016, so the single-sentence "switched off voriconazole for hepatotoxicity" is what makes itraconazole clinically believable to an ID reviewer. Do **not** substitute voriconazole itself: it is a strong CYP3A4 inhibitor but **not** a P-gp inhibitor, so it does not satisfy rivaroxaban's "combined P-gp *and* strong CYP3A" avoid criterion and would break the "both blocked" verdict (Rohr et al., Clin Pharmacokinet 2022).

**Khorana score (2 — threshold met):**

| Component | Value | Points |
|---|---|---|
| Cancer site (lymphoma, high-risk) | Mantle cell lymphoma | +1 |
| Hemoglobin < 10 g/dL (or ESA) | 9.8 g/dL | +1 |
| Platelets ≥ 350 ×10⁹/L | 240 | 0 |
| WBC > 11 ×10⁹/L | 7.5 | 0 |
| BMI ≥ 35 | 25.5 | 0 |
| **Total** | | **2 (meets ≥2 threshold)** |

Threshold of ≥2 is the trial-validated cutoff (AVERT, CASSINI) used by ITAC 2022 and NCCN Cancer-Associated VTE v1.2026.

**FHIR R4 resources.** Codes below are the expected systems per the app's strict-terminology rule (ICD-10-CM for Condition, LOINC for Observation, RxNorm for MedicationRequest). **Verify each RxCUI/LOINC in RxNav/LOINC before locking the bundle** — given the prior tamoxifen/thalidomide RxCUI bug, treat these as drafts to confirm, not ground truth.

- Patient: age 72, male; US Core race/ethnicity extensions as in the other bundles.
- Condition (active): Mantle cell lymphoma, unspecified site — C83.10; Invasive pulmonary aspergillosis — B44.0.
- Observation (all current ≤ 30 days): platelets 240 ×10⁹/L (777-3); hemoglobin 9.8 g/dL (718-7); WBC 7.5 ×10⁹/L (6690-2); creatinine 1.1 mg/dL (2160-0); ALT 28 U/L (1742-6); AST 31 U/L (1920-8); total bilirubin 0.7 mg/dL (1975-2); body weight 78 kg (29463-7); body height 175 cm (8302-2). Derived: BMI ≈ 25.5; Cockcroft-Gault CrCl ≈ 67 mL/min → no renal contraindication.
- MedicationRequest (active): rituximab 121191 (lymphoma therapy, not the VTE interactor); itraconazole 28031 (the interaction driver — blocks both prophylaxis DOACs).

**Per-DOAC interaction cells — itraconazole:**

| DOAC | Severity | Mechanism (one sentence) | Management (one sentence) |
|---|---|---|---|
| **Apixaban** | **Major (avoid)** | Itraconazole is a combined P-glycoprotein and strong CYP3A4 inhibitor that raises apixaban exposure (~1.42-fold), and the apixaban FDA label names itraconazole as a drug to avoid at the 2.5 mg twice-daily dose. | Avoid; fall back to LMWH. |
| **Rivaroxaban** | **Major (avoid)** | Itraconazole's combined P-gp + strong CYP3A inhibition increases rivaroxaban exposure (~1.47-fold); the rivaroxaban FDA label directs avoidance of combined P-gp and strong CYP3A inhibitors. | Avoid; fall back to LMWH. |
| Dabigatran | Major (avoid) | Itraconazole inhibits P-gp, the main transporter governing dabigatran absorption, raising its levels. | Not offered as prophylaxis; would be avoided regardless. |
| Edoxaban | Moderate | Edoxaban is a P-gp substrate; itraconazole can modestly raise exposure. | Not offered as prophylaxis. |

Source anchoring: apixaban FDA label §7.1 / §2.5 (names "ketoconazole, itraconazole, ritonavir"); rivaroxaban FDA label §7.2 (combined P-gp + strong CYP3A class, "avoid"); magnitude estimates from Rohr et al., Clin Pharmacokinet 2022.

**Expected verdicts (the toggle):**

| State | Verdict | On-screen recommendation |
|---|---|---|
| Itraconazole present | Recommend LMWH (DOACs blocked) | Enoxaparin 40 mg SC once daily (or dalteparin 5,000 units SC once daily) |
| Itraconazole removed | Recommend (DOAC) | Apixaban 2.5 mg PO twice daily **or** rivaroxaban 10 mg PO once daily |

**LMWH dose correction (important):** show the standard fixed prophylactic dose — enoxaparin 40 mg SC once daily / dalteparin 5,000 units SC once daily — not the weight-based regimen. The weight-based regimen is the pancreatic-cancer regimen per NCCN v1.2026 (VTE-B-2) and ITAC 2022; reserve it for the pancreatic pathway (Maria Santos).

**Demo narration (≈ 20 seconds):**
> "James is 72, with relapsed lymphoma. He's on itraconazole because he developed an invasive fungal infection during chemo and couldn't tolerate first-line voriconazole. Watch — the engine says LMWH, because itraconazole is a drug both blood-thinner labels say to avoid. [remove itraconazole] Take the antifungal away, and the two pills come back. [add it back] Put it back, and it narrows straight to the safe injectable. Same engine, re-running live — not a lookup table."

**Checklist before rehearsal (as given):** swap the LMWH fallback to enoxaparin 40 mg for non-pancreatic patients; confirm RxCUIs/ICD-10/LOINC; confirm the toggle; update the itraconazole KB source note to the FDA labels; remove or correct the ibrutinib cell.

---

## What was applied (2026-10-09)

| Item | Done | Where |
|---|---|---|
| LMWH dose is cancer-type aware: fixed (enoxaparin 40 mg / dalteparin 5,000 units SC daily) by default; weight-based regimen only for pancreatic (ICD-10 C25*), labelled as the pancreatic regimen | Yes | `src/core/recommendation.ts` (`PANCREATIC_LMWH_PRESENTATION`), `src/data/doac-renal-thresholds.ts`; 2 regression tests |
| Itraconazole KB anchors cite apixaban label §7.1/§2.5 and rivaroxaban label §7.2 | Yes | `ddi-knowledge-base.json` |
| Ibrutinib KB anchors cite ACC 2025 §4.1.5 / Table 4 / Figure 2 and Imbruvica §5.1, §7, §12.3 | Yes — **volume, pages, DOI still to verify against JACC** (OE could not retrieve them) | `ddi-knowledge-base.json` |
| Voriconazole-intolerance line in the James beat | Yes | `submission/DEMO-SCRIPT.md` |
| Rituximab and itraconazole RxCUIs (121191, 28031) | Already in the bundle; unchanged | `scripts/gen-patients.cjs` |

**Not applied, and why:**

- **James's labs** (OE's spec: Hgb 9.8, platelets 240, WBC 7.5, creatinine 1.1). The existing bundle already scores Khorana 2 with CrCl 67; changing values would invalidate the SMART-sandbox record for no verdict change.
- **ICD-10 C83.1 → C83.10.** C83.10 is the billable code; the engine's prefix matching accepts both. Left as C83.1 for now because tests, the scenario builder and the sandbox record use it — an easy follow-up.
- **Obesity / low-weight LMWH adjustments** (BMI ≥40, 25–50 kg) and enoxaparin 30 mg at CrCl <30. The app still follows NCCN's "avoid LMWH at CrCl <30" and does not adjust for weight extremes; listed as a known limitation.
- **Knowledge-base disagreements OE raised, not changed without a primary source:** voriconazole × apixaban (KB moderate; OE says major/avoid) and itraconazole × dabigatran (KB moderate; OE says major). Neither changes any demo verdict (James is already blocked on both prophylaxis DOACs; dabigatran is never offered). To be resolved with a primary source.
- **"~1.42-fold" / "~1.47-fold" magnitudes** were not added to the mechanism strings: they come from a microdose study (Rohr 2022), and the reference list was not returned.
