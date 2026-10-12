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
