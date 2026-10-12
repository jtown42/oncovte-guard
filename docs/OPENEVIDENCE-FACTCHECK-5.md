# OpenEvidence fact-check, round 5: talk script v2 (2026-10-12)

> **How to use:** paste everything under "Prompt to paste" into OpenEvidence as one message. When it answers, **copy the numbered reference list too**: it's a separate block under the answer. Paste both back to Claude.
>
> OpenEvidence only gets the **clinical and evidence claims**. The software and FHIR claims were checked by Claude directly against the code, the tests and the HL7 validator (section "Already verified" at the end). Don't send those; OpenEvidence can't check code.

---

## Prompt to paste

I'm presenting an 8-minute talk at AMIA 2026 about a clinical decision support app for cancer-associated VTE prophylaxis. All patients are synthetic. Below are the exact sentences that will be on slides or said aloud. For **each numbered item**, give:

1. **Verdict:** accurate as written / accurate but needs a wording change / inaccurate.
2. **Replacement wording** if needed: the shortest accurate version, about the same length.
3. **Citation:** full reference (authors, title, journal, year, volume, pages, DOI) for the source that supports it.

Please be strict. A room of informaticians and clinicians will hear this, and an overstatement costs more than a hedge.

**1. Underuse statistic (title slide, small print).**
> "Only ~6 in 10 high-risk patients receive prophylaxis, even in a dedicated program (Holmes et al., JCO Oncology Practice 2026)."

Our abstract says: "Even within a dedicated multidisciplinary prevention program, only 59% of high-risk patients received prophylaxis." Please confirm that this paper exists, the 59% figure, the setting (a dedicated/multidisciplinary prevention program), and what "high-risk" meant there (Khorana ≥2? another definition?). Give the full citation.

**2. Pooled trial effect (problem slide footnote).**
> "Pooled AVERT + CASSINI, overall VTE RR 0.56."

Which publication reports a pooled AVERT + CASSINI estimate, and is 0.56 the right number for overall VTE? Was it intention-to-treat? Is "higher-risk patients (Khorana ≥2)" the right population description? Give the full citation.

**3. "Prevention works" (spoken, problem slide).**
> "Prevention works — the AVERT and CASSINI trials showed that."

CASSINI's intention-to-treat primary endpoint did not reach statistical significance (the on-treatment analysis did). Is this sentence fair? If not, give a one-clause replacement, e.g. "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients."

**4. Guideline citation (problem slide footnote).**
> "ITAC 2022"

Confirm the 2022 International Initiative on Thrombosis and Cancer (ITAC) guideline recommends primary prophylaxis with apixaban, rivaroxaban or LMWH in ambulatory patients receiving systemic anticancer therapy at intermediate-to-high risk (Khorana ≥2), in the absence of contraindications. Give the full citation.

**5. The hard part (spoken, problem slide).**
> "One interacting drug can rule out both oral options; kidney function narrows what's left."

Is it accurate that a single concomitant drug (e.g. itraconazole, a combined strong CYP3A4 + P-gp inhibitor; or rifampin, a strong inducer) can make **both** apixaban and rivaroxaban inappropriate per US labeling?

**6. James (spoken, demo).**
> "James is 72, with lymphoma, and he's taking itraconazole for a serious fungal infection. His risk qualifies him for prophylaxis. … itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling says to avoid both oral options. … the engine then evaluates what's left and recommends an injectable heparin."

Details: mantle cell lymphoma, on rituximab; itraconazole as oral step-down for invasive aspergillosis after voriconazole hepatotoxicity; Khorana 2 (lymphoma +1, WBC 12.3 → +1); CrCl ~67. Please confirm:
(a) The apixaban and rivaroxaban US labels advise avoiding co-administration with combined strong CYP3A4 + P-gp inhibitors such as itraconazole. Name the label sections, and say whether this applies at the prophylactic doses (apixaban 2.5 mg BID; rivaroxaban 10 mg daily).
(b) Recommending LMWH (enoxaparin 40 mg SC daily or dalteparin 5,000 units SC daily) as the alternative here is consistent with NCCN.
(c) Is "the drug labeling says to avoid" the most accurate phrasing, or is "the labeling advises against" better?

**7. Khorana boundary (proof slide; shown large).**
> "349 ×10⁹/L → 0 points · 350 ×10⁹/L → +1 point."

Confirm the Khorana 2008 platelet criterion is **≥350 ×10⁹/L** (so exactly 350 scores and 349 doesn't), not >350. Also confirm the other criteria as we encode them: hemoglobin <10 g/dL **or** ESA use; WBC >11 ×10⁹/L; BMI ≥35 kg/m²; site points (stomach/pancreas 2; lung, lymphoma, gynecologic, bladder, testicular 1).

**8. Maria (spoken, demo).**
> "Maria has pancreatic cancer and a risk score of 5. Nothing rules out the oral options, so it recommends apixaban or rivaroxaban."

Her components: pancreas +2, platelets 410 ×10⁹/L (+1), hemoglobin 9.2 g/dL (+1), WBC 8.5 (0), BMI 36.2 (+1) = 5. Confirm the arithmetic and that a Khorana score of 5 is "high" (≥3).

**9. Dorothy (hidden backup slide; only used if the talk runs short).**
> "Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes … Her kidneys are severely impaired, so the engine allows one pill with caution and rules out the others."

Dorothy is 82, CrCl 17.8 mL/min (creatinine 2.0). At platelets 55,000 the app shows apixaban "use with caution", and rivaroxaban "avoid" (CrCl <30, NCCN VTE-B) and LMWH "avoid" (CrCl <30, NCCN VTE-B). Please check:
(a) Is <50,000/µL the right platelet floor for withholding **prophylactic** anticoagulation?
(b) Is "avoid LMWH at CrCl <30" right for prophylaxis, given enoxaparin has a labeled 30 mg daily dose for CrCl <30? Should it say "dose-adjust" rather than "avoid"?
(c) Is "rivaroxaban avoid at CrCl <30" right for **prophylaxis** in NCCN?
If (b) or (c) is wrong, say so plainly. We will cut the slide rather than change a rule this week.

**10. Overall.**
Is anything else in the sentences above clinically wrong, outdated, or likely to draw an objection from a hematologist or oncologist in the room?

---

## Already verified by Claude (do not send to OpenEvidence)

| Claim in the talk | How it was checked |
|---|---|
| Reads Patient, Condition, Observation, MedicationRequest, read-only | SMART scopes (`*.read`) and `public/capability-statement.json` |
| "A stopped drug can't change the advice" | Parser skips any MedicationRequest whose status isn't `active` (`fhir-parser.ts: parseMedications`) |
| Diagnosis only from a coded Condition; lab only from a coded Observation | Parser reads ICD-10-CM Conditions and LOINC Observations only |
| CDS Hooks: "a chart opening, or a new drug order being entered" | Hooks are `patient-view` and `order-select` (`discovery.ts`). **Fixed:** v2 said "a chemo order being *signed*", which would be `order-sign`, a hook we don't implement |
| "Both doors run through the same normalizer and the same engine" | patient-view → `assemblePatientData` → `generateRecommendation`; order-select → `assemblePatientData` → the same interaction checker. **Fixed:** v2 said "one decision function / no clinical logic anywhere else", which overstated order-select |
| Each blocked drug → DetectedIssue pointing at the offending order; RiskAssessment → the labs used; draft proposal; Provenance → engine version | `tests/fhir-output/build.test.ts` (16 tests) |
| "Every demo bundle passes the official HL7 validator" | HL7 validator 7.0.1, FHIR 4.0.1: 7/7 bundles, 0 errors. **Fixed:** "every bundle" → "every demo bundle" |
| "Round-trips through a public FHIR server" | `scripts/post-fhir-output.ts`: 9 in, 9 read back on r4.smarthealthit.org, references rewritten to server ids |
| Bulk Data panel: "the same engine can run across a whole panel" | `scripts/panel-screen.ts --export` against bulk-data.smarthealthit.org works end to end; the slide's counts come from the labeled synthetic panel |
| "Today it reads diagnoses coded in ICD-10" | Confirmed: the public Bulk Data server's SNOMED-coded patients are skipped (0 of 100 assessed) |
| 229 automated tests | `npx vitest run`: 229 passed |
| 349/350 tests exist | "Test 5: platelets exactly 350 score (>= boundary)", "Test 6: platelets 349 do not score" (`khorana-engine.test.ts`) |
| James is 72; Maria pancreatic; James has aspergillosis | Bundle birthDate 1954-01-20 (72 on Nov 10, 2026); C25.1; B44.0. **Fixed:** "relapsed lymphoma" → "lymphoma" (nothing in the data says relapsed, and the screen shows "Non-Hodgkin lymphoma") |
| "22 drug codes pointing at the wrong medication — one 'chemo' code was actually a blood-pressure pill" | F17: nab-paclitaxel's old code 686924 is carvedilol in RxNav; 22 = 16 KB codes + 6 constants |
| QR → https://oncovte-guard.pages.dev/ | Decoded with jsQR; the live site serves the latest build |


---

## Outcome (2026-10-12)

OpenEvidence confirmed every clinical claim. Changes applied:

| Item | Verdict | Applied |
|---|---|---|
| 1 Holmes | Accurate; "high-risk" there = Khorana **or** PROTECHT ≥3 (340/573 = 59%) | Corner stat now reads "Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis." The delivery note warns not to tie it to the ≥2 threshold |
| 2 RR 0.56 | Accurate (95% CI 0.35–0.89, ITT, overall VTE; symptomatic VTE was not significant) | Footnote unchanged |
| 3 "Prevention works — AVERT and CASSINI showed that" | Needs change (CASSINI ITT HR 0.66, 0.40–1.09) | Now "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients." |
| 4 ITAC 2022 | Accurate (DOAC at Khorana ≥2, grade 1B; LMWH 1A is pancreatic-specific) | Footnote makes no LMWH claim, so unchanged |
| 5 One drug rules out both | Accurate | — |
| 6 James | Accurate. Labels say "avoid" at 2.5 mg BID (apixaban §2.5/7.1) and for rivaroxaban (§7.2). LMWH fallback is NCCN-consistent, **but VTE-B-2's printed LMWH doses are the pancreatic weight-based ones** | The fixed-dose LMWH card source changed from "NCCN VTE-B-2" to **"NCCN VTE-B-2 (agent) · VTE-B-1 (standard dose)"**. James still and clip re-captured (only that line changed) |
| 7 Khorana ≥350 and other criteria | Accurate | — |
| 8 Maria = 5, high | Accurate | — |
| 9 Dorothy | Accurate for ambulatory prophylaxis ("avoid LMWH / rivaroxaban at CrCl <30" is VTE-B-2; 30 mg enoxaparin is the inpatient VTE-B-1 reading). Keep the slide | — |
| 10 Overall | Don't conflate Holmes's ≥3 cohort with ≥2. The 41% untreated partly reflects individualized decisions. Say "standard prophylactic dose," not "the NCCN ambulatory dose" | Delivery notes added. The v2 script never says "walked out on nothing" (that was an earlier draft) |

## Answer (verbatim body, figure captions omitted)

**Every clinical claim in the v2 script checks out against primary sources, with three wording refinements and one citation correction you should make before you lock it.** The most important fix is in item 1: the Holmes paper exists and the 59% is real, but its "high-risk" threshold was a score of **≥3**, not Khorana ≥2 — so the way you gloss it matters. Everything else is accurate as written or needs only a light touch.

**1. Underuse statistic.** Accurate but needs one wording precision. The paper is real and the numbers are exact: of 573 high-risk patients in a multidisciplinary VTE prevention program (the "Vermont model," 2016–2021), 340 (59%) received thromboprophylaxis and 233 (41%) did not.[1] The catch: "high-risk" was defined as a Khorana or Protecht score ≥3, not Khorana ≥2.[1] Keep the wording, optionally tightening to: "Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis (Holmes et al., 2026)." Citation: Holmes CE, Martin KA, Devine D, et al. JCO Oncology Practice. Published online April 6, 2026. PMID: 41941694. (Volume/page/DOI were not retrievable — it is epub-ahead-of-print; do not fabricate them.)[1]

**2. Pooled trial effect.** Accurate as written. The pooled AVERT + CASSINI estimate for overall VTE is RR 0.56 (95% CI 0.35–0.89), computed over the ITT population across the 6-month period.[2][3] Keep "overall VTE" — the symptomatic-VTE pooled estimate (RR 0.58, 0.29–1.13) was not significant.[2][3]

**3. "Prevention works — AVERT and CASSINI showed that."** Needs a wording change. CASSINI's ITT primary endpoint was not significant (HR 0.66, 95% CI 0.40–1.09; the on-treatment analysis was positive, HR 0.40, 0.20–0.80).[3][5] Replacement: "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients."[2][3]

**4. ITAC 2022.** Accurate as written. "Primary prophylaxis with a DOAC (rivaroxaban or apixaban) is recommended in ambulatory patients receiving systemic anticancer therapy at intermediate-to-high risk of VTE, identified by a validated RAM (i.e., Khorana score ≥2), and not actively bleeding or at high risk for bleeding (grade 1B)".[2] ITAC's LMWH recommendation at grade 1A is specifically for pancreatic cancer — if your footnote implies ITAC endorses LMWH broadly for Khorana ≥2, soften to "DOACs."

**5. One interacting drug can rule out both oral options.** Accurate as written. A single combined strong CYP3A4 + P-gp inhibitor (itraconazole) triggers "avoid" for apixaban at 2.5 mg BID and for rivaroxaban; a strong dual inducer (rifampin) triggers "avoid" for both.[6][7][8][9]

**6. James.** (a) Accurate. The apixaban label (§7.1, cross-referenced to §2.5) names itraconazole explicitly and directs that for patients already on 2.5 mg BID, you avoid co-administration with combined P-gp + strong CYP3A4 inhibitors.[6] The rivaroxaban label (§7.2) says to avoid concomitant combined P-gp + strong CYP3A inhibitors.[8][7] (b) Accurate and NCCN-consistent, with one footnote: NCCN's ambulatory table (VTE-B-2) lists the weight-based LMWH regimens (enoxaparin 1 mg/kg, dalteparin 200 u/kg), with a footnote tying those data to pancreatic cancer.[10] Fixed enoxaparin 40 mg daily / dalteparin 5,000 units daily are the standard prophylaxis doses (matching NCCN's inpatient-medical and post-discharge surgical tables) — the correct choice for a non-pancreatic patient like James; just don't attribute those exact numbers to VTE-B-2 verbatim.[10] (c) "Says to avoid" is accurate; both labels literally use "avoid".[6][7]

**7. Khorana boundary.** Accurate as written. Platelet criterion is ≥350 ×10⁹/L, so exactly 350 scores and 349 does not.[10][11][12] Other encodings correct: Hgb <10 or ESA; WBC >11 (11.0 does not score); BMI ≥35; sites stomach/pancreas 2, lung/lymphoma/gynecologic/bladder/testicular 1.[10]

**8. Maria.** Accurate. Pancreas +2, platelets 410 +1, Hgb 9.2 +1, WBC 8.5 +0, BMI 36.2 +1 = 5, high tier (≥3).[10]

**9. Dorothy.** (a) Accurate: platelets <50,000 is the floor.[10] (b) Defensible as coded — do not cut the slide. NCCN's ambulatory prophylaxis table (VTE-B-2) says "Avoid if CrCl <30".[10] The enoxaparin label provides a 30 mg daily dose for CrCl <30 [13] and NCCN's inpatient medical table (VTE-B-1) recommends 30 mg daily in that range.[10] "Avoid" is correct for the ambulatory primary-prophylaxis setting. (c) Accurate: rivaroxaban "avoid if CrCl <30"; apixaban "use with caution" matches VTE-B-2's footnote.[10]

**10. Overall.** Holmes "high-risk" = score ≥3: be ready to say the app's ≥2 threshold is the trial/guideline threshold (AVERT, CASSINI, ITAC, NCCN, ASCO).[2][5][10] The "4 in 10 untreated" framing: Holmes describes individualized decisions, not pure failure.[1] LMWH dose provenance: say "standard prophylactic dose," not "the NCCN ambulatory dose."[10] Nothing in the James, Maria, or Dorothy clinical logic is wrong.

### References (as given)
1. Holmes CE, Martin KA, Devine D, et al. Impact of Venous Thrombosis Prevention in Ambulatory Oncology: Importance of Guideline Adherence. JCO Oncology Practice. 2026;:OP2501211. doi:10.1200/OP-25-01211.
2. Farge D, Frere C, Connors JM, et al. 2022 International Clinical Practice Guidelines for the Treatment and Prophylaxis of Venous Thromboembolism in Patients With Cancer, Including Patients With COVID-19. Lancet Oncol. 2022;23(7):e334-e347. doi:10.1016/S1470-2045(22)00160-7.
3. Alikhan R, Gomez K, Maraveyas A, et al. Cancer-associated venous thrombosis in adults (second edition): A British Society for Haematology Guideline. Br J Haematol. 2024;205(1):71-87. doi:10.1111/bjh.19414.
4. Kuderer NM, Desai A, Lustberg MB, Lyman GH. Mitigating acute chemotherapy-associated adverse events in patients with cancer. Nat Rev Clin Oncol. 2022;19(11):681-697. doi:10.1038/s41571-022-00685-3.
5. Key NS, Khorana AA, Kuderer NM, et al. Venous Thromboembolism Prophylaxis and Treatment in Patients With Cancer: ASCO Guideline Update. J Clin Oncol. 2023;41(16):3063-3071. doi:10.1200/JCO.23.00294.
6. Apixaban. Food and Drug Administration. Updated 2024-05-23.
7. Rivaroxaban. Food and Drug Administration. Updated 2025-12-11.
8. Xarelto. Food and Drug Administration. Updated 2026-09-10.
9. Wessler JD, Grip LT, Mendell J, Giugliano RP. The P-Glycoprotein Transport System and Cardiovascular Drugs. J Am Coll Cardiol. 2013;61(25):2495-502. doi:10.1016/j.jacc.2013.02.058.
10. National Comprehensive Cancer Network. Cancer-Associated Venous Thromboembolic Disease. Updated 2026-05-05.
11. Khorana AA, Mackman N, Falanga A, et al. Cancer-associated venous thromboembolism. Nat Rev Dis Primers. 2022;8(1):11. doi:10.1038/s41572-022-00336-y.
12. Di Leo G, Bordonaro CA, Capodanno D. Antithrombotic therapy for cancer-associated venous thromboembolism. Clin Res Cardiol. 2026. doi:10.1007/s00392-026-02872-z.
13. Enoxaparin Sodium. Food and Drug Administration. Updated 2026-02-04.
14. Butera E, Wang TF, Pola R, Carrier M. Implementation Failure: Thromboprophylaxis in Ambulatory Patients With Cancer. Hematology Am Soc Hematol Educ Program. 2025;2025(1):72-79. doi:10.1182/hematology.2025000689.
15–20. Byon 2019 (Clin Pharmacokinet); Anticoagulation Forum DOAC DDI 2026; Willems 2026 (Cancer Med); Jalaber 2025 (J Thromb Thrombolysis); Zhu 2026 (Eur J Haematol); Montomoli 2024 (Drugs). Full entries in `docs/REFERENCES.md`.
