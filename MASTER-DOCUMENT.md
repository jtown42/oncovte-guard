# OncoVTE Guard — Master Reference Document

> **What this document is.** A single, self-contained briefing that gives an expert
> reviewer everything needed to (1) *understand* the project completely, (2) *assess* it
> critically for the AMIA / HL7 FHIR App Competition, (3) *fix* what is weak, and
> (4) *present* it confidently at a national conference. It states every method, every
> clinical threshold, every data source, every test, and — in full — every known flaw,
> gap, and risk, including one design–implementation gap surfaced while writing this doc.
>
> It is deliberately blunt. Nothing here is marketing. Where a claim is only *potential*
> (impact, live-EHR behavior), it says so. Where the implementation diverges from the
> documented design, it says so.

- **Project:** OncoVTE Guard — SMART-on-FHIR + CDS Hooks clinical decision support for cancer-associated VTE prophylaxis with DOAC–chemotherapy drug–drug interaction (DDI) checking.
- **Category:** AMIA / HL7 FHIR App Competition — **Student**.
- **Live demo:** https://oncovte-guard.pages.dev · **SMART launch:** https://oncovte-guard.pages.dev/launch
- **Source:** https://github.com/jtown42/oncovte-guard
- **Verified state (live run, this document):** `vitest run` → **10 files, 123/123 tests passing**; `tsc --noEmit` strict → clean; `vite build` → succeeds (113 modules). Reproduce with the commands in §14.
- **Companion docs:** `README.md` (orientation), `VERIFICATION.md` (rule→source→code→test audit), `ASSESSMENT.md` (reviewer verdict lens), `submission/SUBMISSION-FULL.md` (the actual entry text), `plan/errata-contract-reconciliation.md` (the authoritative contract).

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [The clinical problem](#2-the-clinical-problem)
3. [Architecture — the one-seam design](#3-architecture--the-one-seam-design)
4. [Clinical methods, exhaustively](#4-clinical-methods-exhaustively)
5. [Knowledge bases & code sets](#5-knowledge-bases--code-sets)
6. [FHIR / SMART / CDS Hooks conformance](#6-fhir--smart--cds-hooks-conformance)
7. [The five synthetic patients](#7-the-five-synthetic-patients)
8. [The authoritative errata contract (10 issues)](#8-the-authoritative-errata-contract-10-issues)
9. [Testing & verification](#9-testing--verification)
10. [Complete flaw, gap & risk register](#10-complete-flaw-gap--risk-register)
11. [Clinical-accuracy audit checklist for a reviewer](#11-clinical-accuracy-audit-checklist-for-a-reviewer)
12. [Deployment & operations](#12-deployment--operations)
13. [Presenting at a national conference](#13-presenting-at-a-national-conference)
14. [Reproduce everything](#14-reproduce-everything)
15. [Outstanding work before final submission](#15-outstanding-work-before-final-submission)

---

## 1. Executive summary

OncoVTE Guard answers two coupled questions at the point of care for an **ambulatory
cancer patient on systemic therapy**:

1. **Should this patient get pharmacologic VTE prophylaxis?** (Khorana risk score vs. the NCCN ≥2 threshold, after routing out the malignancies that fall outside the Khorana model.)
2. **If yes, which anticoagulant is actually safe *for this patient right now*?** (renal function, drug–drug interactions with active chemotherapy, thrombocytopenia, hepatic function, and other contraindications.)

The defining architectural claim: **this is not a dashboard that displays data — it is a
clinical reasoning engine, proven by 123 automated tests, exposed through two EHR
surfaces.** All guideline logic lives in pure, framework-free TypeScript in `src/core/`.
A SMART-on-FHIR dashboard (clinician *pull*), a CDS Hooks service (EHR *push*), and a
standalone what-if demo all converge on **one seam**:

```
assemblePatientData(rawFHIR) → PatientData → generateRecommendation(PatientData) → ProphylaxisRecommendation
```

Because that seam is the only path to a clinical answer, the three surfaces are
identical *by construction*, not by duplicated logic — and every rule is unit-testable
in isolation.

**Five terminal decision states** the engine can reach (each screenshot-verified):
`recommend` · `caution` (incl. LMWH fallback) · `contraindicated` · `not_indicated` · `excluded`.

**The single most important caveat** (repeat it to any reviewer, unprompted): the DDI
knowledge base and clinical thresholds were **curated from supplied structured clinical
input and published labeling**, encoded against an authoritative project contract. The
123 tests prove the encoded rules are *applied faithfully and consistently*. They do
**not** independently prove the underlying pharmacology is itself correct or current —
that needs clinician/pharmacist sign-off for real use. The app says so everywhere.

---

## 2. The clinical problem

**Why it matters.** VTE is a leading cause of death in people with cancer and accounts
for roughly **one in five** of all VTE events. Active malignancy raises VTE risk
**~4–7×**, and many systemic therapies raise it further. Ambulatory chemotherapy
patients are a high-yield prevention target — **but blanket prophylaxis is wrong**:
anticoagulation must be reserved for patients whose thrombotic risk outweighs their
bleeding risk. RCTs (AVERT, CASSINI) show targeted DOAC prophylaxis in higher-risk
ambulatory patients reduces VTE events; anticoagulating the wrong patient causes
preventable hemorrhage.

**Why it's genuinely hard at the point of care** — the clinician must, in one sitting:

- compute a **multi-variable Khorana score** from diagnosis + a current CBC + BMI;
- know DOACs are **CYP3A4 / P-gp** substrates and that specific antineoplastic and supportive-care agents induce or inhibit those pathways enough to cause bleeding or therapeutic failure;
- account for **renal function, thrombocytopenia, hepatic impairment, antiphospholipid syndrome, luminal GI/GU tumors, and HIT**;
- recognize the malignancies (**myeloma, primary brain tumor, acute leukemia, MPN**) that fall *outside* the Khorana model entirely.

**Affected population / users.** ~2 million people newly diagnosed with cancer in the US
each year (ACS 2024), a large fraction on ambulatory systemic therapy. Users: medical
oncologists, hematologist-oncologists, oncology pharmacists, and APPs (NPs/PAs).

> **The epidemiology figures above are now sourced** (see the References appendix):
> ~4–7× risk and ~20% of all VTE events → ITAC 2019 (Farge et al.); ~2 million new US
> diagnoses/yr → ACS 2024 (Siegel et al.); cancer-associated VTE epidemiology → Lam et
> al. 2026. "Second leading cause" was deliberately softened to "a leading cause" absent
> a confirmed primary source. Remaining task (§15): paste them into the `.docx`
> references section and clear its `(cite)` placeholders.

---

## 3. Architecture — the one-seam design

```
src/
  core/         Clinical engines — pure, framework-free, deterministic, fully unit-tested
                khorana-engine · ddi-checker · renal-dosing · contraindications ·
                stale-lab · recommendation (orchestrator)
  data/         Knowledge bases: ddi-knowledge-base.json (52 agents), icd10-cancer-map,
                doac-renal-thresholds, loinc-codes, rxnorm-codes
  types/        Shared domain contracts (camelCase; strict TS)
  fhir/         fhir-parser (R4 → PatientData) · smart-launch (OAuth2) ·
                fhir-client (live fetch) · standalone-loader (synthetic bundles)
  cds-hooks/    discovery · prefetch (adapter) · cards (card builder) · server (Express) · types
  components/   React dashboard (banner, recommendation, Khorana, renal, DDI matrix,
                contraindications, alerts) + ScenarioEditor (what-if control rail) + Flash
  ui/           format.ts — severity/tone ↔ color/label helpers
  standalone/   scenario.ts — editable Scenario ↔ PatientData bridge
synthetic-patients/   Five FHIR R4 collection bundles (no PHI)
public/               capability-statement.json (R4 client), launch.html (SMART entry)
```

**The seam, precisely.** `assemblePatientData()` (in `src/fhir/fhir-parser.ts`) normalizes
any source of raw FHIR (live SMART fetch, synthetic bundle, or CDS Hooks prefetch) into a
single `PatientData` object. `generateRecommendation()` (in `src/core/recommendation.ts`)
turns that into a `ProphylaxisRecommendation`. **No clinical decision is made anywhere
else.** The CDS card builder (`src/cds-hooks/cards.ts`) and every React component consume
the already-computed recommendation — they format, they do not decide.

**Why this is the project's strongest argument:** dual-surface coherence (SMART dashboard
vs. CDS Hooks) is *guaranteed* rather than *tested for*, and auditability is possible
because each rule is an isolated pure function with a citation and a test.

**The standalone what-if editor** (`src/components/ScenarioEditor.tsx` +
`src/standalone/scenario.ts`) rebuilds a real `PatientData` on every edit — deriving the
`onAntiplatelet / onIMiD / onESA / hasNephrotoxicChemo` flags from the *same* RxNorm sets
the FHIR parser uses — and re-runs `generateRecommendation`. It duplicates **no** clinical
logic; it is the engine made directly inspectable. Proven by `tests/standalone/scenario.test.ts`.

---

## 4. Clinical methods, exhaustively

Every threshold below is a named constant in code (kept explicit for auditability), and
every boundary has a test. Citations are as encoded in the source comments and
`VERIFICATION.md`; see §1 and §10 for the caveat on independent validation.

### 4.1 Cancer-site classification & exclusions — `src/data/icd10-cancer-map.ts`

Matching is **ICD-10-CM prefix / `startsWith`**, normalized upper-case (errata Issue 5).

- **Exclusions (routed *out* of Khorana → disease-specific pathway, NCCN VTE-2), checked first:**
  - Multiple myeloma / plasma-cell neoplasm: `C90.0, C90.1, C90.2, C90.3`
  - Acute leukemia: `C91.0, C92.0, C92.4, C92.5, C92.6, C92.A, C93.0, C94.0, C95.0` (chronic leukemias C91.1/C92.1 intentionally **not** excluded)
  - Myeloproliferative neoplasms: `D45, D47.1, D47.3, D47.4`
  - Primary/metastatic brain tumor: `C71, C79.31`
- **Very-high risk → 2 points:** stomach/gastric `C16`; pancreas `C25`.
- **High risk → 1 point:** lung `C34`; Hodgkin `C81`; non-Hodgkin `C82–C86`; ovarian `C56`; uterine `C54, C55`; cervical `C53`; other gyn `C51, C52, C57, C58`; bladder `C67`; testicular `C62`; kidney/renal `C64, C65, C66, C68`.
- **Standard → 0 points:** any other malignancy ("Other solid tumor").
- **Two advisory notes** attach at classification and surface as info-level alerts *only when an active recommendation is produced*:
  - **Kidney note** — kidney is scored high-risk per JACC/ASCO interpretation, but **NCCN VTE-C names only bladder and testicular**. Documented divergence, not a silent assumption.
  - **Lung note** — the Khorana score has **weak discrimination in lung cancer** (van Es et al. IPD meta-analysis: predictive in other cancers OR ~3.2, not in lung OR ~1.1, P-interaction 0.002).

**Multi-condition precedence** (`getCancerCategory`): any excluded condition **dominates** a
co-occurring scorable tumor; otherwise the **highest-scoring site governs**
(VERY_HIGH > HIGH > STANDARD). No conditions → STANDARD (0 pts), never throws.

### 4.2 Khorana VTE Risk Score — `src/core/khorana-engine.ts`

`score = cancerSite(0–2) + platelets≥350(1) + (Hgb<10 OR on ESA)(1) + WBC>11(1) + BMI≥35(1)`, **capped at 6** (errata Issue 1).

| Criterion | Constant | Scores when | Does **not** score at |
|---|---|---|---|
| Platelets | `PLATELETS_GTE = 350` (×10⁹/L) | ≥ 350 | 349 |
| Hemoglobin | `HEMOGLOBIN_LT = 10` (g/dL) | < 10 **or** on ESA | exactly 10.0 (ESA alone suffices) |
| WBC | `WBC_GT = 11` (×10⁹/L) | > 11 | exactly 11.0 |
| BMI | `BMI_GTE = 35` (kg/m²) | ≥ 35 | 34.9 |

- **Risk tiers** (`riskCategoryForScore`): **0 = Low, 1–2 = Intermediate, ≥3 = High** — the original Khorana model / NCCN VTE-C tiering. **Prophylaxis threshold = ≥2** regardless of tier label. *(This restores the published tiering over an errata draft that mislabeled score 1 as "Low"; see §8 Issue 2. Labeling only — no recommendation changes.)*
- **Missing labs** → recorded in `missingFields`, `isComplete = false`, treated as non-scoring (conservative). Excluded population → `totalScore = 0`, nested `exclusion:{isExcluded,reason}` (snake_case reason).
- Output includes a **per-criterion breakdown** (value + points, plus the ESA flag on the hemoglobin row) so the score is fully transparent in the UI.

### 4.3 DOAC–chemotherapy interactions — `src/core/ddi-checker.ts` + `src/data/ddi-knowledge-base.json`

- `checkDDIs(med)` **always** returns the full per-DOAC shape for all four DOACs (apixaban, rivaroxaban, dabigatran, edoxaban), each with `severity / mechanism / recommendation / alternativeDoac` (errata Issue 7). Lookup is O(1) by RxNorm code.
- **Severity precedence** (`SEVERITY_RANK`): `major(5) > moderate(4) > pharmacodynamic(3) > minor(2) > none(1) > unknown(0)`. `unknown` ranks lowest so a known interaction always dominates, yet stays distinguishable from `none` for display.
- **`pharmacodynamic`** = additive bleeding risk independent of DOAC drug levels (e.g. bevacizumab, ibrutinib's BTK-mediated platelet effect) — flagged regardless of pharmacokinetics.
- **Unknown RxNorm** → `unknown` for every DOAC, no throw → orchestration surfaces "verify manually" rather than failing.
- `getWorstDDIForDoac(results, doac)` aggregates the worst severity for one DOAC across all active meds (starts at `none`). A `major` worst-DDI blocks that DOAC as a prophylaxis option.

### 4.4 Renal dosing (Cockcroft-Gault) — `src/core/renal-dosing.ts` + `src/data/doac-renal-thresholds.ts`

- `CrCl = [(140 − age) · weight(kg) · (0.85 if female)] / (72 · SCr)`, rounded to 0.1 mL/min. Guards divide-by-zero / invalid input → returns 0.
- **Bands:** normal ≥90 · mild 60–89 · moderate 30–59 · **severe <30**.
- **Six anticoagulants always reported** (errata Issue 8: 4 DOACs + enoxaparin + dalteparin), each via `getAnticoagulantRenalRecommendation`. At **CrCl <30**: apixaban = **caution**, rivaroxaban / enoxaparin / dalteparin = **avoid**, dabigatran / edoxaban = **avoid** (and never prophylaxis options regardless).
- **Warnings:** low body weight `<60 kg` → `sarcopenia` (Cockcroft-Gault may overestimate clearance); an active nephrotoxic agent (cisplatin/carboplatin/methotrexate) → `nephrotoxic_chemotherapy`.

### 4.5 Contraindications (`appliesTo`-aware) — `src/core/contraindications.ts`

Each finding carries an `appliesTo` scope: `"all"` (universal) or a list of specific
agents (targeted). This is the mechanism that lets HIT block only LMWH while DOACs remain
preferred (errata Issue 9).

| Finding | Type | appliesTo | Trigger |
|---|---|---|---|
| Active major bleeding | absolute | all | `hasActiveMajorBleeding` boolean (clinician-assessed; wired through the pipeline and toggleable in the demo — see Finding F1, §10) |
| Severe thrombocytopenia | absolute | all | platelets `< 50` ×10⁹/L (`SEVERE_THROMBOCYTOPENIA_LT`) |
| Antiphospholipid syndrome | absolute | all | `D68.61` (DOACs failed in TRAPS) |
| Severe hepatic impairment | absolute | all | total bilirubin `>3` mg/dL **and** (ALT **or** AST) `>5× ULN` (ULN default 40; Child-Pugh C surrogate) |
| HIT | absolute | **`["enoxaparin","dalteparin"]`** | `D75.82` — blocks LMWH only; DOACs remain (and are preferred) |
| GI/GU luminal tumor | relative | all | `C15, C16, C67` |
| Brain tumor | relative | all | `C71, C79.31` |
| Multiple myeloma + IMiD | relative | all | `C90.0–C90.3` **and** `onIMiD` |
| Concurrent antiplatelet | relative | all | `onAntiplatelet` |
| Low weight (apixaban) | relative | **`["apixaban"]`** | weight `< 40` kg (`APIXABAN_LOW_WEIGHT_LT`) |

`canProceedWithProphylaxis` is false **only** when a *universal* absolute exists.

### 4.6 Stale labs — `src/core/stale-lab.ts`

`> 30` days = stale (`STALE_LAB_THRESHOLD_DAYS`). Boundary: exactly 30 days = **not** stale;
31 = stale. A missing/unparseable date is treated as stale (conservative). A `null` lab is
**absent**, not stale. Whole-day age via `Math.floor`.

### 4.7 Recommendation orchestration — `src/core/recommendation.ts: generateRecommendation`

Deterministic pipeline with early returns. Exact order:

1. **Resolve cancer category** across all active conditions.
2. **Score Khorana** (+ compute contraindications, DDIs, renal, stale-labs so the result object is always fully populated, even on early return).
3. **Excluded population** → return `overallAction:"excluded"`, no options, info alert(s). *Myeloma + IMiD adds a second alert pointing to the myeloma-specific pathway (NCCN MM / ITAC).*
4. **Khorana < 2** → return `not_indicated`, no options, info alert.
5. **Universal absolute contraindication** (`appliesTo === "all"`) → return `contraindicated`, no options, critical alert(s). *(Targeted absolutes do **not** abort — they flow to option-building.)*
6. **Build options.** If renal data is missing, synthesize a conservative `severe / CrCl 0` renal result so dosing can still gate. Build the two prophylaxis DOACs (apixaban, rivaroxaban), the two reference DOACs (dabigatran, edoxaban — always ineligible, always "avoid"), and the two LMWH agents.
   - A DOAC is **eligible** iff: it's an NCCN prophylaxis DOAC **and** not targeted-blocked **and** renal ≠ avoid **and** worst-DDI ≠ major. Otherwise it's ineligible with a specific reason.
7. **LMWH fallback.** If **both** DOACs are blocked and an LMWH is eligible → LMWH becomes the alternative, with a warning: "do not substitute dabigatran or edoxaban." Reference DOACs + all blocked agents are surfaced under **avoid**.
8. **Compile alerts** (ranked): cancer-site caveat (kidney/lung) → DDI alerts (major=critical, moderate/pharmacodynamic=warning) → renal alerts (CrCl<30 critical, 30–49 warning, nephrotoxic, sarcopenia) → relative-contraindication warnings → stale-lab warning.
9. **Overall action:** default `recommend`; → `caution` if (no eligible DOAC **and** no eligible LMWH) **or** any relative contraindication exists.

> **Subtlety worth stating aloud in a demo (see also Finding F4):** a patient whose DOACs
> are blocked but who has an eligible LMWH (e.g. James Chen) yields `overallAction:
> "recommend"` — the top-line verdict is "prophylaxis recommended," and the *fact that it's
> LMWH not a DOAC* is carried in the options list and a warning alert, not in the verdict
> word. This is defensible (prophylaxis *is* recommended) but a judge may ask about it.

---

## 5. Knowledge bases & code sets

- **`ddi-knowledge-base.json`** — **52** antineoplastic/supportive agents × 4-DOAC interaction profiles, camelCase, each entry carrying a `sources` array (errata Issue 6). Includes the four "special-notes" agents (doxorubicin 3639, vinblastine 11198, etoposide 4179, tamoxifen 10324). Scoped to its listed agents; anything else → `unknown` → "verify manually."
- **`icd10-cancer-map.ts`** — the classification rules in §4.1.
- **`doac-renal-thresholds.ts`** — six-agent renal rules + NCCN prophylaxis dose strings (apixaban 2.5 mg PO BID; rivaroxaban 10 mg PO daily; enoxaparin/dalteparin regimens; dabigatran/edoxaban explicitly "Not an NCCN-supported ambulatory cancer VTE prophylaxis option").
- **`rxnorm-codes.ts`** — DOAC, anticoagulant, antiplatelet, ESA, IMiD, and nephrotoxic sets used both by the FHIR parser (to derive flags) and the engine. **Contains a fixed latent bug + regression lock:** `10324` is **tamoxifen** (a SERM, in the DDI KB), **not** thalidomide (`10400`, the IMiD). Locked by `tests/data/rxnorm-codes.test.ts` so a tamoxifen patient is never falsely flagged `onIMiD`.
- **`loinc-codes.ts`** — lab/vital LOINC constants + prefetch code lists.

---

## 6. FHIR / SMART / CDS Hooks conformance

- **Release:** FHIR **R4 (4.0.1)**.
- **Resources read:** Patient (read); Condition, Observation, MedicationRequest (search). Declared in `public/capability-statement.json` (R4 **client** CapabilityStatement, `kind: requirements`).
- **Codings:** ICD-10-CM (`http://hl7.org/fhir/sid/icd-10-cm`), LOINC (labs/vitals), RxNorm (meds), US Core race/ethnicity extensions (`extractOmbDisplay`).
- **Unit conversions in the parser:** weight lb→kg ×0.453592, height in→cm ×2.54.
- **Resilience:** every parser returns `null` rather than throwing on missing data, so a sparse chart still yields a well-formed `PatientData`.
- **SMART launch:** `public/launch.html` → `FHIR.oauth2.authorize()`; app → `FHIR.oauth2.ready()` (`smart-launch.ts`). Scopes: `launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read openid fhirUser`.
- **CDS Hooks 1.0:**
  - **Discovery:** `GET /cds-services` → two services.
  - **`oncovte-prophylaxis` (`patient-view`):** a summary card (Khorana, preferred/alternative, renal, stale-lab note) + one card per critical/warning alert; **140-char summary cap** enforced (`clip`). Info alerts are folded into the summary detail, not emitted as separate cards.
  - **`oncovte-ddi-check` (`order-select`):** screens the order(s) being composed — ordering a DOAC screens active meds against it; ordering another agent screens it against the patient's active DOAC(s). Only major (critical) and moderate/pharmacodynamic (warning) surface as cards.
  - **Prefetch:** templates declared per service; `prefetch.ts` adapts the prefetch block into `RawFHIRData` through the same pipeline and degrades missing bundles gracefully (throws only if the Patient resource is absent).

---

## 7. The five synthetic patients

Real FHIR R4 bundles, parsed through the identical `assemblePatientData →
generateRecommendation` pipeline. Test reference date pinned at `2026-06-10T12:00:00Z`
(`tests/integration/patients.test.ts`, 19 assertions). Each exercises a distinct terminal state.

| # | Patient | Dx | Engine output (asserted) | Demonstrates |
|---|---|---|---|---|
| 1 | Maria Santos | C25.1 pancreas | Khorana **5 High**; apixaban + rivaroxaban preferred; CrCl ~**115** normal; nab-paclitaxel (686924) **minor**, non-blocking | `recommend` (clean high-risk) |
| 2 | James Chen | C83.1 NHL | Khorana **2**; ibrutinib **major** on both DOACs → preferred empty → **enoxaparin + dalteparin** alternative; **no dabi/edox**; rituximab none | LMWH fallback (verdict word is still `recommend` — Finding F4) |
| 3 | Dorothy Williams | C34.1 lung | Khorana **3 High** but platelets **42K** → `contraindicated` (universal absolute); CrCl **12.9** severe; carboplatin nephrotoxic warning | `contraindicated`; the on-stage platelet-flip demo (42K → ≥50K flips contraindicated → recommend) |
| 4 | Robert Johnson | C18.4 colon | Khorana **0** → `not_indicated`; labs **stale** (>30d); bevacizumab **pharmacodynamic** | `not_indicated` + stale-lab guard |
| 5 | Priya Patel | C90.00 myeloma | Khorana **excluded**; `onIMiD` true (lenalidomide); dexamethasone **moderate** | `excluded` (disease-specific pathway) |

> **Documented arithmetic discrepancy:** the plan's hand calc lists Maria's CrCl as 115.5;
> the correct Cockcroft-Gault value for 95 kg is **~115.0**, which the engine computes and
> the test asserts. The engine is right; the plan's rounding was off.

---

## 8. The authoritative errata contract (10 issues)

`plan/errata-contract-reconciliation.md` is the single source of truth; it **overrides**
`plan/ddi-info.md` and `plan/plan.md` on conflict. All 10 are implemented and test-locked:

| # | Requirement | Enforced by |
|---|---|---|
| 1 | Max Khorana score = 6 (not 7) | `MAX_KHORANA_SCORE` cap; "Test 15" |
| 2 | Risk tiers + prophylaxis at ≥2 — **superseded, see below** | `riskCategoryForScore`; "Test 20", tier map test |
| 3 | Split paclitaxel (56946) vs nab-paclitaxel (686924); 3 distinct KB entries | KB + patient-1 bundle + integration test 1 |
| 4 | Only apixaban/rivaroxaban are prophylaxis options; LMWH fallback; never dabi/edox | `PROPHYLAXIS_DOACS`/`REFERENCE_DOACS`; recommendation + integration P2 |
| 5 | ICD-10 prefix matching | `classifyIcd10`; khorana suite |
| 6 | KB camelCase + `sources` field | `types/ddi.ts: DDIEntry`; typecheck |
| 7 | `checkDDIs()` full per-DOAC shape; severity ranking | ddi-checker suite (Tests 1–7) |
| 8 | Renal 6-entry array + lookup helper | `doac-renal-thresholds.ts`; renal Tests 6/7 |
| 9 | `appliesTo`-aware contraindications | contraindications Tests 4/9 |
| 10 | snake_case reasons + nested result shapes | khorana Test 16; contraindication suite |

> **Supersession (Issue 2, 2026-06-13).** The errata draft relabeled the tiers as *0–1
> Low, 2 Intermediate, ≥3 High* and called the original "1–2 Intermediate" incorrect. On
> clinical review this was **reversed**: Khorana et al. (*Blood* 2008) and NCCN VTE-C both
> define **0 Low, 1–2 Intermediate, ≥3 High**, so the published tiering is restored. This
> is a **labeling change only** — the actionable threshold stays **≥2**, so no patient's
> recommendation changes; only the tier *word* for a score of 1 moves Low → Intermediate.
> **This is a deliberate, documented departure from the "authoritative" errata file** —
> a reviewer who reads the errata literally will see the mismatch; the story is the whole
> point. Be ready to defend it (memory: risk tiers 0 Low / 1–2 Intermediate / ≥3 High).
>
> **Score-range note.** Connors (*NEJM* 2014) says the Khorana range is "0 to 7"; the
> correct max from the component weights (2+1+1+1+1) is **6**. The 0–7 figure is a known
> error in that review; the engine caps at 6.

---

## 9. Testing & verification

**Live run (this document): `vitest run` → 10 files, 123 tests, all passing** in ~6 s.
`tsc --noEmit` (strict, `noUnusedLocals`, `noImplicitReturns`) → 0 errors.
`tsc && vite build` → succeeds (113 modules).

| Test file | Tests | Covers |
|---|---|---|
| `tests/core/khorana-engine.test.ts` | 27 | every criterion boundary, cap, tiers, exclusions, multi-condition precedence, advisory notes |
| `tests/core/ddi-checker.test.ts` | 13 | per-DOAC shape, severity ordering, unknown handling, worst-per-DOAC aggregation |
| `tests/core/renal-dosing.test.ts` | 11 | Cockcroft-Gault (M/F), guards, bands, 6-agent array, CrCl<30 rules, sarcopenia/nephrotoxic warnings |
| `tests/core/contraindications.test.ts` | 11 | universal vs targeted, thrombocytopenia boundary, APS, hepatic, HIT-LMWH-only, GI, low-weight-apixaban |
| `tests/core/stale-lab.test.ts` | 9 | 30/31-day boundary, fresh, missing-date, null-lab-absent |
| `tests/core/recommendation.test.ts` | 7 | all five terminal states + LMWH fallback + HIT-DOACs-remain + active-bleeding gate |
| `tests/data/rxnorm-codes.test.ts` | 3 | tamoxifen vs thalidomide regression lock |
| `tests/integration/patients.test.ts` | 19 | five patients end-to-end |
| `tests/cds-hooks/cards.test.ts` | 11 | discovery, patient-view cards, order-select interaction cards, 140-char cap, prefetch degradation |
| `tests/standalone/scenario.test.ts` | 12 | Scenario ↔ PatientData bridge; flag derivation from RxNorm sets; active-bleeding toggle |

`VERIFICATION.md` is the **rule → published source → code (`file:function`) → test**
traceability matrix. It is the credibility anchor; a reviewer can confirm any single
clinical rule end-to-end from it without reading the whole codebase.

---

## 10. Complete flaw, gap & risk register

Ordered by how much a sharp reviewer/judge is likely to press on it. Nothing here is
hidden in the deliverables — but F1 is a genuine implementation gap not previously
surfaced, found while writing this document.

### F1 — `hasActiveMajorBleeding` end-to-end wiring **(RESOLVED 2026-07-15)**
- *Originally:* the contraindications engine supported active major bleeding (`ContraindicationInput.hasActiveMajorBleeding`, checked at `contraindications.ts:85` → universal absolute), but it was unreachable from a patient — `PatientData` had no such field and the orchestrator never passed it, so the verdict could never actually fire. The submission described it as "modeled as a clinician-set boolean," which was then aspirational relative to the code.
- **Fixed:** `hasActiveMajorBleeding: boolean` was added to `PatientData` (defaulted `false` in `assemblePatientData`, since FHIR has no reliable discrete signal for it), threaded through `Scenario` / `scenarioToPatient` / `patientToScenario`, forwarded in `generateRecommendation`'s `detectContraindications` call, and exposed as an "Active major bleeding (clinician-assessed)" toggle in the control rail. Two tests lock it (`tests/core/recommendation.test.ts`, `tests/standalone/scenario.test.ts`): toggling it on an otherwise-`recommend` patient flips the verdict to `contraindicated` with reason `active_major_bleeding`. Suite is now **123/123**, typecheck clean, build green.
- The submission claim is now literally true and demonstrable live — the toggle is the companion safety-gate demo to the Dorothy platelet flip.

### F2 — Curated knowledge base, not a live interaction service *(the central scientific dependency)*
- The DDI KB and thresholds are curated from supplied structured input + labeling. The tests prove *faithful application*, **not** that the pharmacology is correct or current.
- **Framing for a reviewer:** "faithful, tested implementation of a curated guideline set," **not** "independently validated drug-interaction service." Needs clinician/pharmacist sign-off and a maintenance steward for real use. Disclosed in `ASSESSMENT.md §5`, `VERIFICATION.md §9`, in-app disclaimers, and every submission field.

### F3 — No live-EHR deployment or end-user validation
- SMART launch is **code-complete and standards-conformant** but has **not** been exercised against a live production EHR or the SMART App Gallery sandbox by an external party. The screenshot-verified path is standalone synthetic mode. Both modes share one pipeline, so behavior is identical *by construction* — but a reviewer should not assume a live-EHR run happened. No users, no outcome data; impact is argued from literature (AVERT/CASSINI), not measured.

### F4 — The verdict word doesn't distinguish "recommend DOAC" from "recommend LMWH fallback"
- As in §4.7 and §7 (James Chen): DOACs blocked + LMWH eligible → `overallAction:"recommend"`, with LMWH carried in options + a warning. Clinically defensible, but the single-word verdict under-communicates. **Optional fix:** a distinct verdict tone/label for "recommend (LMWH — DOACs blocked)." Decide deliberately; don't let a judge surface it first.

### F5 — CDS `order-select` doesn't emit the "not an NCCN prophylaxis option" note for dabigatran/edoxaban
- Errata Issue 4 says an order-select card for a dabigatran/edoxaban order should note it has no NCCN-supported ambulatory-prophylaxis indication. `cards.ts` screens those orders for DDIs but does **not** add that advisory line. Minor deviation from the contract's letter. **Fix:** append the note when `orderedDoac ∈ {dabigatran, edoxaban}`.

### F6 — Kidney cancer scored high-risk against NCCN's narrower list
- Documented clinical interpretation (JACC/ASCO), surfaced as an advisory note — **not** NCCN consensus (NCCN VTE-C names only bladder/testicular). A guideline purist may disagree with scoring it at all. It is flagged, not hidden.

### F7 — Advisory notes (kidney/lung) only surface on an *active recommendation*
- The cancer-site caveat alert is appended only after the Khorana≥2 and no-universal-absolute gates pass (`recommendation.ts:381`). A lung-cancer patient who is `not_indicated` or `contraindicated` won't see the "weak discrimination in lung cancer" note. Arguably fine (no recommendation to caveat), but inconsistent. Note it.

### F8 — Renal data absent → conservative-but-blunt fallback
- Missing weight/creatinine → synthesized `CrCl 0 / severe`. That makes rivaroxaban and LMWH "avoid" and leaves apixaban "caution" (still eligible), so a data-poor patient can still land on apixaban with a "renal not assessable" warning. Deterministic and safe-leaning, but the reasons shown lean on a placeholder CrCl of 0 — make sure the UI copy reads as "not assessable," not "CrCl = 0."

### F9 — Epidemiology figures **(citations supplied; docx insert remaining)**
- The figures are now grounded in specific sources (see the References appendix): ~4–7× risk and ~20% of all VTE events → ITAC 2019 (Farge et al., *Lancet Oncol*); ~2 million new US diagnoses/yr → ACS 2024 (Siegel et al., *CA Cancer J Clin*); cancer-associated VTE epidemiology → Lam et al. 2026 (*Am J Hematol*). The prose was reconciled across `SUBMIT!/materials.md`, `submission/02-rationale.txt`, and this document ("a leading cause," "approximately 2 million"). **Remaining:** paste the references into `AMIA-App-Competition-Submission.docx` and clear its `(cite)` placeholders (§15). The Lam et al. 2026 volume/pages should be confirmed on final publication.

### F10 — Live demo uses the real current date
- Staleness in the live demo advances over time by design (`new Date()`), while tests pin a fixed date. Robert's "stale labs" story depends on the bundle dates staying >30 days behind "today" — fine now, but the bundle dates are fixed, so this only ever gets *more* stale (safe direction). Just know why the demo shows stale.

### F11 — Sustainability depends on a KB steward
- A curated KB is a maintenance liability without an owner. The architecture makes updates *data edits* (external versioned JSON with per-agent sources), which mitigates but does not remove the need. Roadmap: validate against public sandboxes, broaden KB under clinical review, SMART App Gallery publication.

**None of F2–F11 are disqualifiers for a Student-category prototype** — the bar is a
well-engineered, well-reasoned, honestly-scoped prototype, and this clears it. **F1 and F9
are the two items to actively fix or explicitly frame before presenting.**

---

## 11. Clinical-accuracy audit checklist for a reviewer

Use this to stress-test correctness in ~30 minutes:

1. **Boundary sampling (Khorana):** confirm platelets 349 vs 350, Hgb 10.0 vs 9.9, WBC 11.0 vs 11.1, BMI 34.9 vs 35 in `khorana-engine.test.ts`. Do the code constants match the cited model? (They do: §4.2.)
2. **Tier vs threshold:** confirm score 1 = Intermediate but `prophylaxisRecommended=false`; score 2 = Intermediate + true. Confirm the supersession note (§8) is a labeling change only.
3. **Severity precedence:** verify `SEVERITY_RANK` in `ddi-checker.ts` matches `major>moderate>pharmacodynamic>minor>none>unknown` and that `DDIMatrix.tsx`/`format.ts` render the same order.
4. **Targeted vs universal:** trace a HIT patient (`D75.82`) → LMWH blocked, DOACs preferred, `canProceedWithProphylaxis=true`. Trace platelets 42K → universal absolute → contraindicated.
5. **LMWH fallback safety:** confirm no code path ever offers dabigatran/edoxaban as prophylaxis (grep `PROPHYLAXIS_DOACS` — only apixaban/rivaroxaban; `REFERENCE_DOACS` always ineligible).
6. **Unknown-drug degradation:** an RxNorm not in the KB → `unknown` + "verify manually," never a crash.
7. **Active-bleeding gate (F1, resolved):** toggle "active major bleeding" on an otherwise-`recommend` patient in the demo and confirm the verdict flips to `contraindicated` with reason `active_major_bleeding`. Confirms the safety gate is wired end-to-end (regression-locked by two tests).
8. **Reproduce §14** and confirm 123/123 + clean typecheck + build.

---

## 12. Deployment & operations

- **Live:** oncovte-guard.pages.dev — **Cloudflare Pages**, direct-upload via wrangler (account `3f6da4967d8184d8889747c26d348a69`, jtown42@live.com). The GitHub repo is the source of record; the Pages project is fed by direct upload, not a Git integration.
- **Redeploy the app bundle:**
  ```bash
  npm run build
  npx wrangler pages deploy dist --project-name=oncovte-guard --branch=main --commit-dirty=true
  ```
- **Docs-only changes** (README, VERIFICATION, screenshots, this file) do **not** require a redeploy — the live bundle is independent of repo docs.
- **CDS Hooks service** (`npm run cds-server`, Express on :3000) is **not** part of the Cloudflare static deploy — it is a local/self-hostable Node service. If a demo needs the live CDS endpoint, it must be hosted separately.

---

## 13. Presenting at a national conference

**The narrative arc (≈8 min):** escalate through the patients — Maria (clean recommend) →
James (DOAC blocked, LMWH fallback) → Dorothy (the killer interaction). Full stage
directions in `docs/DEMO-SCRIPT.md`.

**The killer interaction (do this live):** load Dorothy (platelets 42K → **contraindicated**,
red). In the what-if rail, raise platelets to ≥50K. The verdict **flips live** to
`recommend` — apixaban preferred (caution) / rivaroxaban avoided, with the CrCl 12.9
severe-renal alert persisting. This proves it's a real engine reacting to a real threshold,
not a slideshow. Use **presentation mode** (`?present=true` or the top-bar toggle) to
enlarge the verdict/score/CrCl for projection.

**The three sentences that frame the whole project:**
1. "This is a clinical reasoning engine, not a dashboard — 123 tests prove it, and one seam feeds both a SMART app and a CDS Hooks service."
2. "Every rule traces guideline → source → code → test in our VERIFICATION document."
3. "The knowledge base is curated and tested for faithful application — clinician sign-off is the explicit next step, and we say so."

**Anticipated hard questions — and honest answers:**

| Question | Answer |
|---|---|
| "Is the pharmacology validated?" | No — curated from supplied structured input + labeling; tests prove faithful *application*, not independent correctness. Clinician/pharmacist sign-off is the next step (F2). |
| "Have you run it in a real EHR?" | SMART launch is code-complete and conformant; demonstrated path is synthetic. Both modes share one pipeline (F3). |
| "Why score kidney cancer high-risk?" | JACC/ASCO interpretation; NCCN names only bladder/testicular. We surface an explicit advisory note rather than hide the divergence (F6). |
| "Your errata file says score 1 is Low." | We deliberately restored the published Khorana/NCCN tiering (0 Low, 1–2 Intermediate, ≥3 High) over the errata draft; it's a label change only — threshold stays ≥2 (§8). |
| "What about active bleeding?" | *(If unfixed:)* the engine models it, but it isn't yet surfaced in the app — a known gap on the fix list (F1). *(Fix it before you present so this becomes "handled as a clinician-confirmable flag.")* |
| "Max score 6 or 7?" | 6, from the component weights; the 0–7 in one review is a known error (§8). |

Cite the epidemiology figures on any slide (ITAC 2019 for 4–7× and ~20%; ACS 2024 for ~2 million) — see the References appendix.

---

## 14. Reproduce everything

Requires Node 18+.

```bash
npm install
npm run typecheck     # tsc --noEmit (strict)        → 0 errors
npm test              # vitest run                    → 10 files, 123 tests pass
npm run build         # tsc && vite build             → dist/ (113 modules)
npm run dev           # standalone demo, 5 patients   → http://localhost:5173
npm run preview       # serve the production build
npm run cds-server    # CDS Hooks service             → http://localhost:3000/cds-services
```

Then read, in order: `VERIFICATION.md` (the audit) → `src/core/recommendation.ts` (the
actual reasoning) → `tests/integration/patients.test.ts` (five patients end-to-end) →
`submission/SUBMISSION-FULL.md` (the entry) → `docs/screenshots/` (the five states).

---

## 15. Outstanding work before final submission

**Blocking (needs a human / advisor):**
1. **Advisor attestation** — required for the Student category (signed PDF; template at `submission/advisor-attestation-template.md`).
2. **Logo + student headshot** — placeholders noted in the submission.
3. **Paste the epidemiology references into `AMIA-App-Competition-Submission.docx`** and clear its `(cite)` placeholders (F9). The sources are supplied and reconciled in the text (References appendix below); this is now a copy-in step, and the Lam et al. 2026 volume/pages should be confirmed on publication.

**Done since last revision:**
- ✅ **F1 wired end-to-end** — active major bleeding now flips the verdict live; suite 123/123.
- ✅ **F9 figures sourced + reconciled** across `materials.md`, `submission/02-rationale.txt`, and this document ("a leading cause," "approximately 2 million").

**Optional before presenting:** distinct verdict label for LMWH fallback (F4); the dabigatran/edoxaban order-select note (F5).

**Roadmap (post-competition):** validate against public SMART/FHIR sandboxes; broaden the
KB under clinical review with a named steward; contingent on review, publish to the SMART
App Gallery.

---

## Appendix — References for the epidemiology figures

Supplied by the submitter's literature search; map each claim to its source.

- **Farge D, Frere C, Connors JM, et al.** 2019 International Clinical Practice Guidelines for the Treatment and Prophylaxis of Venous Thromboembolism in Patients With Cancer (ITAC). *Lancet Oncol.* 2019;20(10):e566–e581. — supports **~4–7-fold increased VTE risk** and **cancer accounts for ~20% of all VTE events**; cancer-associated VTE as a leading cause of death in cancer patients.
- **Siegel RL, Giaquinto AN, Jemal A.** Cancer Statistics, 2024. *CA Cancer J Clin.* 2024;74(1):12–49. — supports **~2 million (≈2,001,140) new US cancer diagnoses per year**.
- **Lam BD, Ryu J, Jafari O, et al.** Epidemiology of Cancer-Associated Venous Thromboembolism Across the United States (Epic Cosmos, 911,855 patients). *Am J Hematol.* 2026. — supports contemporary cancer-associated VTE epidemiology (12-month cumulative incidence ~3.7% overall, ~5.7% with systemic therapy). *(Confirm volume/pages on final publication.)*

Supporting trials cited in the narrative (not epidemiology): **AVERT** (Carrier et al., *NEJM* 2019) and **CASSINI** (Khorana et al., *NEJM* 2019) for DOAC prophylaxis efficacy in higher-risk ambulatory patients; **Khorana et al.**, *Blood* 2008 for the risk score; **NCCN Guidelines®, Cancer-Associated Venous Thromboembolic Disease** for the prophylaxis pathway.

> **Wording note:** the submission uses **"a leading cause of death"** (not "the second leading cause"), which the ITAC guidance supports; "second leading cause" is widely quoted but its primary source is unconfirmed, so it is intentionally avoided.

---

*This document is a reference, not a substitute for the code. Where it and the source
disagree, the source wins — and that disagreement is itself a finding worth filing.
Last verified against a live test run of 123/123 passing.*
