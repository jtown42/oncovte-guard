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
- **Verified state (live run, 2026-08-06):** `vitest run` → **14 files, 173/173 tests passing**; `tsc --noEmit` strict → clean; `vite build` → succeeds. Reproduce with the commands in §16.
- **Companion docs:** `README.md` (orientation), `VERIFICATION.md` (rule→source→code→test audit), `ASSESSMENT.md` (reviewer verdict lens), `submission/SUBMISSION-FULL.md` (the actual entry text), `plan/errata-contract-reconciliation.md` (the authoritative contract).

> ### If you are an outside reviewer or an evidence model, start here
>
> **The claim this project makes, precisely:** *a faithful, deterministic, exhaustively
> tested encoding of a curated guideline set, exposed identically through two EHR
> surfaces.* It does **not** claim independently validated pharmacology, clinician
> validation, or measured clinical impact. Where the app is strong it is strong in
> **software and traceability**; where it is thin it is thin in **citation granularity
> and human evaluation**. Both are mapped, not minimized.
>
> **The four sections that will tell you the most, fastest:**
> 1. **§5 (Evidence base, graded)** — every clinical rule with a provenance tier, including the ones that are curator inventions. Attack this first.
> 2. **§12 (Flaw register)** — 14 findings, self-reported, ordered by how hard a reviewer will press. **F12, F13, F14 were found by auditing for this revision and are new.**
> 3. **§11.3 (What has *not* been evaluated)** — the usability and alert-fatigue gaps.
> 4. **§13 (Audit checklist)** — a ~30-minute path to falsifying our correctness claims yourself.
>
> **The three things most likely to change your assessment, stated up front so you don't
> have to find them:** (a) the 52-agent DDI knowledge base cites the *same two secondary
> references* on essentially every agent — KB-level attested, though the **16
> recommendation-changing `major` cells are now individually source-anchored** and
> test-guarded (**F12 / WS-3**); (b) **no clinician has ever used this** — alert-fatigue
> *mitigations* are now built (two-channel alerts, role tailoring, override capture, a
> `/metrics` route — WS-4) but remain *empirically unvalidated* until a clinician evaluation
> (**F13**; WS-8 pending); (c) the hepatic rule is a **conservative lab-only proxy we built**
> — *not* Child-Pugh (renamed accordingly in WS-1.4, **F14**). Note: WS-1, WS-2, WS-3, and
> WS-4 have landed — see "Done since last revision" in §17.
>
> **State of the tree (be aware when reproducing):** the engine, tests, and docs are
> committed. An in-progress **UI readability revision** (light palette, emoji/symbol removal,
> larger type — §11.2) is **present in the working tree but not yet committed**, so the
> **live site at oncovte-guard.pages.dev is behind `main`** and shows the prior styling.
> **No clinical logic differs between the two** — the redesign touched only components,
> `index.css`, `ui/format.ts`, and the Tailwind config; the 173 tests cover the engine and
> pass identically on both.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [The clinical problem](#2-the-clinical-problem)
3. [Architecture — the one-seam design](#3-architecture--the-one-seam-design)
4. [Clinical methods, exhaustively](#4-clinical-methods-exhaustively)
5. [**Evidence base, graded — read this first if you are assessing clinical validity**](#5-evidence-base-graded)
6. [Knowledge bases & code sets](#6-knowledge-bases--code-sets)
7. [FHIR / SMART / CDS Hooks conformance](#7-fhir--smart--cds-hooks-conformance)
8. [The five synthetic patients](#8-the-five-synthetic-patients)
9. [The authoritative errata contract (10 issues)](#9-the-authoritative-errata-contract-10-issues)
10. [Testing & verification](#10-testing--verification)
11. [The interface — what a clinician actually uses](#11-the-interface--what-a-clinician-actually-uses)
12. [Complete flaw, gap & risk register](#12-complete-flaw-gap--risk-register)
13. [Clinical-accuracy audit checklist for a reviewer](#13-clinical-accuracy-audit-checklist-for-a-reviewer)
14. [Deployment & operations](#14-deployment--operations)
15. [Presenting at a national conference](#15-presenting-at-a-national-conference)
16. [Reproduce everything](#16-reproduce-everything)
17. [Outstanding work before final submission](#17-outstanding-work-before-final-submission)

---

## 1. Executive summary

OncoVTE Guard answers two coupled questions at the point of care for an **ambulatory
cancer patient on systemic therapy**:

1. **Should this patient get pharmacologic VTE prophylaxis?** (Khorana risk score vs. the NCCN ≥2 threshold, after routing out the malignancies that fall outside the Khorana model.)
2. **If yes, which anticoagulant is actually safe *for this patient right now*?** (renal function, drug–drug interactions with active chemotherapy, thrombocytopenia, hepatic function, and other contraindications.)

The defining architectural claim: **this is not a dashboard that displays data — it is a
clinical reasoning engine, proven by 173 automated tests, exposed through two EHR
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
173 tests prove the encoded rules are *applied faithfully and consistently*. They do
**not** independently prove the underlying pharmacology is itself correct or current —
that needs clinician/pharmacist sign-off for real use. The app says so everywhere.

**§5 grades exactly how well-supported each rule is**, rule by rule, and separates the
A-tier medicine (the Khorana model, the ≥2 threshold, the apixaban/rivaroxaban-only
restriction) from the curator-mediated content (most DDI severities, the renal specifics,
the hepatic surrogate) and from the pure engineering conventions (30-day staleness). If
you read one section critically, read that one.

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
> a confirmed primary source. Remaining task (§17): paste them into the `.docx`
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
`VERIFICATION.md`; see §1 and §12 for the caveat on independent validation.

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

- **Risk tiers** (`riskCategoryForScore`): **0 = Low, 1–2 = Intermediate, ≥3 = High** — the original Khorana model / NCCN VTE-C tiering. **Prophylaxis threshold = ≥2** regardless of tier label. *(This restores the published tiering over an errata draft that mislabeled score 1 as "Low"; see §9 Issue 2. Labeling only — no recommendation changes.)*
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
| Active major bleeding | absolute | all | `hasActiveMajorBleeding` boolean (clinician-assessed; wired through the pipeline and toggleable in the demo — see Finding F1, §12) |
| Severe thrombocytopenia | absolute | all | platelets `< 50` ×10⁹/L (`SEVERE_THROMBOCYTOPENIA_LT`) |
| Antiphospholipid syndrome | absolute | all | `D68.61` (DOACs failed in TRAPS) |
| Severe hepatic impairment | absolute | all | total bilirubin `>3` mg/dL **and** (ALT **or** AST) `>5× ULN` (ULN default 40; **conservative lab-only proxy for severe hepatic impairment — not Child-Pugh**, WS-1.4) |
| HIT | absolute | **`["enoxaparin","dalteparin"]`** | `D75.82` — blocks LMWH only; DOACs remain (and are preferred) |
| GI/GU luminal tumor | relative | all | `C15, C16, C67` |
| Brain tumor | relative | all | `C71, C79.31` |
| Multiple myeloma + IMiD | relative | all | `C90.0–C90.3` **and** `onIMiD` |
| Concurrent antiplatelet | relative | all | `onAntiplatelet` |
| Weight <40 kg (avoid apixaban) | **absolute** (WS-1.1) | **`["apixaban"]`** | weight `< 40` kg (`APIXABAN_LOW_WEIGHT_LT`; reason `weight_below_40kg`) — NCCN VTE-B-2 categorical "Avoid if weight <40 kg"; targeted, so a <40 kg patient still receives rivaroxaban/LMWH |

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

## 5. Evidence base, graded

> **Why this section exists.** §4 says *what the engine does*. This section says
> *how well-supported each of those rules actually is*, because "the tests pass" and
> "the medicine is right" are different claims and only the first is proven. If you are
> a clinician, a pharmacist, or an evidence-retrieval model assessing whether this app
> is safe and sound, **this is the section to attack.** It is written to make disagreement
> easy.

### 5.1 The grading scale (ours, not a standard)

This is a **transparent internal provenance scale**, not GRADE, not USPSTF, and not any
recognized evidence hierarchy. It grades *how the rule got into this codebase*, which is
the thing under audit here — not the strength of the underlying medical literature.

| Tier | Meaning |
|---|---|
| **A** | Traceable to a named guideline or trial that directly states the rule (e.g. NCCN VTE-C, Khorana 2008, TRAPS). |
| **B** | Traceable to a named review/scientific statement or regulatory labeling covering the drug class, applied to a specific agent by the curator. |
| **C** | Mechanistic or clinical inference by the curator, consistent with B-tier material but **not stated as such** in a cited source. |
| **D** | Engineering/defensive convention with no clinical source claimed (guards, conservative fallbacks, display order). |

**Tier C is the honest home of most of the 208 per-agent × per-DOAC severity cells.** See §5.3.

### 5.2 Rule-level grading

| Rule (→ §4) | Source as encoded | Tier | Honest note |
|---|---|---|---|
| Khorana components & weights (site, plt ≥350, Hgb <10/ESA, WBC >11, BMI ≥35) | Khorana et al., *Blood* 2008 | **A** | Directly the published model. Constants match the paper. |
| Risk tiers 0 Low / 1–2 Intermediate / ≥3 High | Khorana 2008; NCCN VTE-C | **A** | Restored over the errata draft (§9). Labeling only. |
| Prophylaxis threshold ≥2 | NCCN VTE-C; AVERT & CASSINI enrolled ≥2 | **A** | The single most consequential threshold in the app. Well-supported. |
| Max score = 6 | Component arithmetic | **A** | Not a judgment call — 2+1+1+1+1. Connors *NEJM* 2014's "0 to 7" is an error in that review. |
| Khorana exclusions (myeloma, acute leukemia, MPN, brain) | NCCN VTE-2 | **A** | Population the model was not built for. |
| Lung-cancer weak-discrimination advisory | van Es et al., IPD meta-analysis | **A** | Correctly surfaced as an advisory, not a score change. |
| Pancreatic/hepatobiliary discrimination caveat (WS-6) | Khorana validation-cohort literature | **A** | Info-level advisory on C25 (Maria); surfaced on the score, does not change it. |
| Khorana calibration-transparency line (WS-7) | Multi-cohort calibration variance | **A** | States tier informs the ≥2 decision but is not a precise individual risk estimate; shown on every scored patient. |
| **Renal-cell carcinoma (C64) scored high-risk (+1)** | JACC/ASCO interpretation | **C** | **NCCN VTE-C names only bladder and testicular.** A documented divergence (F6), surfaced in-app. **Narrowed in WS-1.3 to C64 only** — renal pelvis/ureter/other urinary (C65/C66/C68) no longer score, removing an over-broad set. A guideline purist may still reject the point entirely. |
| Cockcroft-Gault CrCl formula | Cockcroft & Gault | **A** | Formula is exact; note it is *not* CKD-EPI/MDRD, deliberately — DOAC labeling is C-G based. |
| CrCl bands 90/60/30 | NCCN VTE-B; labeling | **A** | Conventional. |
| CrCl <30: apixaban caution, rivaroxaban/LMWH avoid | NCCN VTE-B + DOAC labeling | **B** | Class-level labeling applied to the prophylaxis context by the curator. |
| Only apixaban/rivaroxaban as prophylaxis; never dabigatran/edoxaban | NCCN VTE-C; AVERT/CASSINI | **A** | Strongest safety rule in the app. Dabi/edox have no ambulatory cancer-prophylaxis indication. |
| Severe thrombocytopenia <50 ×10⁹/L absolute | **NCCN VTE-B-2 (per-agent) + VTE-F** (WS-1.2) | **A** | The 50K cut is conventional; some centers dose-reduce rather than stop. Now cites the per-agent VTE-B-2 rows and the VTE-F "DOACs not recommended below 50,000/μL" statement, carried on the finding's `source` field. |
| Antiphospholipid syndrome absolute | TRAPS trial | **A** | Rivaroxaban harm in triple-positive APS is well-established. |
| HIT blocks LMWH only, DOACs remain | Clinical | **B/C** | Mechanistically sound and clinically standard, but encoded as "clinical" with no specific citation in `VERIFICATION.md`. **Would benefit from a named source.** |
| Severe hepatic impairment: bili >3 **and** AST/ALT >5× ULN | NCCN VTE-B hepatic regimen selection; operationalization ours | **C** | **A curator-built lab-only proxy for severe hepatic impairment, not a published rule and not Child-Pugh** (real Child-Pugh needs albumin, INR, ascites, encephalopathy — none read). WS-1.4 renamed it off "Child-Pugh C" everywhere in code/docs; the domain is guideline-recognized (NCCN names elevated transaminases/bilirubin, Child-Pugh B/C, cirrhosis) but the operationalization is ours. Flagged as F14. |
| **Weight <40 kg → avoid apixaban (targeted absolute)** | **NCCN VTE-B-2 ("Avoid if weight <40 kg")** | **A** (WS-1.1, was B) | Now graded A: NCCN VTE-B-2 states this verbatim as a categorical per-agent instruction, not a curator inference. Regraded from relative/B to targeted absolute/A. |
| Sarcopenia warning <60 kg | C-G overestimation | **C** | Well-known limitation; the specific 60 kg trigger is a curator choice. |
| Nephrotoxic-chemo warning (cisplatin/carboplatin/methotrexate) | Clinical | **C** | Uncontroversial mechanistically; agent list is curator-scoped and non-exhaustive. |
| Stale labs >30 days | — | **D** | **No clinical source claimed.** A defensible engineering convention, not a guideline. Do not defend it as evidence-based. |
| DDI severity ranking (major>moderate>PD>minor>none>unknown) | ERRATA Issue 7 | **D** | Display/precedence logic, not medicine. |
| Per-agent DDI severities (208 cells) | AHA 2022 statement; Hellfritzsch 2024; FDA labeling | **B/C** | **See §5.3 — the largest surface.** The 16 recommendation-changing `major` cells are now individually anchored (WS-3); the remaining non-major cells stay KB-level attested (they do not change a recommendation). |

### 5.3 The DDI knowledge base: what its provenance actually is

This is the finding an expert reviewer should press hardest, and it was not previously
stated anywhere in the deliverables. **Measured directly from `ddi-knowledge-base.json`:**

| `sources` value | Appears on |
|---|---|
| `AHA 2022 Scientific Statement` | **52 / 52** agents |
| `Hellfritzsch et al. 2024` | **49 / 52** agents |
| `FDA DOAC labeling` | **3 / 52** agents (itraconazole, ketoconazole, posaconazole only) |

**What this means, stated plainly:** the `sources` array is a **KB-level provenance
attestation applied near-uniformly to every agent** — it is *not* per-interaction
citation. Every one of the 52 agents carries the same one or two references. So:

- The KB satisfies errata Issue 6 (a `sources` field exists and is populated) — **true**.
- The KB does **not** let a reviewer trace *one specific severity cell* to *one specific
  supporting statement*. There is no page, table, or quotation anchor.
- The `mechanism` strings carry **specific quantitative claims that are not individually
  cited** — e.g. ibrutinib: *"Strong dual CYP3A4 + P-gp inhibition increases apixaban AUC
  ~100%"*. That "~100%" is presented to a clinician as fact and is traceable only to
  "AHA 2022 / Hellfritzsch 2024" at the whole-KB level. **A reviewer cannot verify it from
  this repo.** Neither can the author, without returning to the source.

**Severity distribution across the 52 × 4 = 208 cells:** `none` 80 · `moderate` 56 ·
`minor` 40 · `major` 16 · `pharmacodynamic` 16. The 16 `major` cells are the ones that
actually change a recommendation — **those are the cells to audit first**, and they are a
small, tractable set for a pharmacist to review in one sitting.

**Those 16 cells are exactly 8 agents × the 2 prophylaxis DOACs** (apixaban, rivaroxaban),
and they fall into two mechanistically clean groups — which is a point in the KB's favor,
and checkable in one command (§13, step 9):

| Group | Agents | Mechanism as encoded | Direction of harm |
|---|---|---|---|
| Strong dual CYP3A4 + P-gp **inhibitors** | ibrutinib, idelalisib, itraconazole, ketoconazole, posaconazole | Increased DOAC exposure | **Bleeding** |
| Strong CYP3A4 **inducers** | enzalutamide, apalutamide, mitotane | Reduced DOAC levels | **Therapeutic failure / thrombosis** |

This is the KB at its best: the majors are not a scattered list of one-off assertions —
they are the two mechanisms the AHA statement is *about*, applied consistently, and each
resolves to `AVOID. Use LMWH instead.` — which is exactly what the engine's LMWH-fallback
path exists to handle. **The bidirectionality matters clinically and is easy to miss:**
the inducer group is not a bleeding problem at all, it is a *failed-prophylaxis* problem,
and the app is right to treat both as `major`.

The remaining critique stands regardless: the *severity assignments* are coherent and
mechanism-consistent, but the *quantitative claims inside the mechanism strings* (the
"~100%") are still not individually anchored.

**Pharmacodynamic bleeding risk** is asserted for exactly 5 agents: ibrutinib,
bevacizumab, ramucirumab, lenvatinib, cabozantinib. Mechanistically coherent (BTK-mediated
platelet inhibition; VEGF-pathway bleeding) and consistent with the AHA statement's scope.

**The correct characterization for a reviewer, and for the submission:** this is a
*curated, internally-consistent, faithfully-applied interaction table derived from two
secondary references*, and it should be described that way — **not** as a per-agent
literature-sourced knowledge base. The engineering around it is sound; the citation
granularity is thin. See F2 and the new **F12**.

### 5.4 What is genuinely evidence-based here vs. what is engineering

Stated bluntly so nobody has to infer it:

- **Strong (A-tier, defensible in front of an oncologist):** the Khorana model and its
  thresholds; the ≥2 prophylaxis gate; the apixaban/rivaroxaban-only restriction with LMWH
  fallback; the Khorana exclusions; APS; the lung advisory; Cockcroft-Gault itself.
- **Reasonable but curator-mediated (B/C):** the DDI table's per-agent severities, the
  renal gating specifics, the hepatic surrogate, the low-weight and sarcopenia cuts.
- **Not clinical claims at all (D):** the 30-day staleness rule, severity display
  precedence, the conservative CrCl-0 fallback.
- **Deliberately qualitative, not scored (WS-2):** the bleeding-risk panel (§5.5). The factor
  *list* is guideline-scaffolded (ACC 2026 / NCCN VTE-2); the numeric cut-points are curator
  choices; and *no bleeding score is computed on purpose* — the evidence does not support one
  for primary prophylaxis in this population.
- **The engineering *is* the contribution.** The one-seam architecture, the 173 tests, the
  dual-surface coherence, and the traceability matrix are real, verifiable, and unusual for
  a student prototype. The clinical content is a *faithful encoding of a curated set* — the
  app's honest claim is **"provably consistent," not "independently validated."**

### 5.5 Bleeding-risk panel (WS-2), graded — and why it is *not* a score

The app quantifies thrombotic risk (Khorana) but **deliberately does not compute a bleeding
score.** The evidence does not support one in this setting: published cancer-associated
thrombosis (CAT) bleeding scores reach c-statistics of only ~0.50–0.70 (ACCP-VTE, HAS-BLED,
VTE-BLEED, CAT-BLEED, B-CAT, Perform, ONCO-DOAC BLEED), with poor calibration, and — critically
— were derived in patients **being treated for established CAT, not in ambulatory patients
receiving primary prophylaxis.** Applying them to the Khorana population is off-label
extrapolation. Presenting a number would be the app's first genuinely unsupportable claim.

Instead, `src/core/bleeding-risk.ts` surfaces a **qualitative panel** of guideline-named
factors, each individually sourced, in three tiers (`elevated` / `standard` /
`insufficient_data`). Per-factor grading:

| Factor | Source | Grade |
|---|---|---|
| Gastric / gastroesophageal tumor → prefer LMWH | NCCN VTE-2 footnote (increased hemorrhage with DOACs) | **A** |
| CrCl <30 → prefer LMWH | ACC 2026; NCCN VTE-B-2 | **A/B** |
| Unresected luminal GI; urothelial/gyn; RCC/melanoma; low weight <50 kg; anemia; thrombocytopenia; anorexia/vomiting; frailty/ECOG 3–4 | ACC 2026 Scientific Statement (LMWH-preferred scenario list) | **B** (site/flag), **C** for the specific numeric thresholds (anemia <10, thrombocytopenia <100, weight <50 — curator cut-points) |
| Systemic corticosteroids | Vedovati et al. (HR 2.69) | **B** |
| Concurrent antiplatelet / NSAID; prior major bleeding | ACC; ONCO-DOAC BLEED; ACCP | **B** |

**The honest framing to a panel:** "we deliberately did not build a bleeding score, and here
is why" is a stronger, more defensible answer than a fabricated c-0.6 number. The panel
*informs* the clinician alongside the Khorana score; it never drives the verdict.

---

## 6. Knowledge bases & code sets

- **`ddi-knowledge-base.json`** — **52** antineoplastic/supportive agents × 4-DOAC interaction profiles (**208 severity cells**: 80 none, 56 moderate, 40 minor, 16 major, 16 pharmacodynamic), camelCase, each entry carrying a `sources` array (errata Issue 6). Includes the four "special-notes" agents (doxorubicin 3639, vinblastine 11198, etoposide 4179, tamoxifen 10324). Scoped to its listed agents; anything else → `unknown` → "verify manually." **Read §5.3 before assessing this file:** its `sources` are a uniform KB-level attestation (AHA 2022 on all 52; Hellfritzsch 2024 on 49; FDA labeling on 3), **not** per-interaction citation — see F12. Each entry also carries `pgpEffect` / `cyp3a4Effect` class flags and free-text `notes`.
- **`icd10-cancer-map.ts`** — the classification rules in §4.1.
- **`doac-renal-thresholds.ts`** — six-agent renal rules + NCCN prophylaxis dose strings (apixaban 2.5 mg PO BID; rivaroxaban 10 mg PO daily; enoxaparin/dalteparin regimens; dabigatran/edoxaban explicitly "Not an NCCN-supported ambulatory cancer VTE prophylaxis option").
- **`rxnorm-codes.ts`** — DOAC, anticoagulant, antiplatelet, ESA, IMiD, and nephrotoxic sets used both by the FHIR parser (to derive flags) and the engine. **Contains a fixed latent bug + regression lock:** `10324` is **tamoxifen** (a SERM, in the DDI KB), **not** thalidomide (`10400`, the IMiD). Locked by `tests/data/rxnorm-codes.test.ts` so a tamoxifen patient is never falsely flagged `onIMiD`.
- **`loinc-codes.ts`** — lab/vital LOINC constants + prefetch code lists.

---

## 7. FHIR / SMART / CDS Hooks conformance

- **Release:** FHIR **R4 (4.0.1)**.
- **Resources read:** Patient (read); Condition, Observation, MedicationRequest (search). Declared in `public/capability-statement.json` (R4 **client** CapabilityStatement, `kind: requirements`).
- **Codings:** ICD-10-CM (`http://hl7.org/fhir/sid/icd-10-cm`), LOINC (labs/vitals), RxNorm (meds), US Core race/ethnicity extensions (`extractOmbDisplay`).
- **Unit conversions in the parser:** weight lb→kg ×0.453592, height in→cm ×2.54.
- **Resilience:** every parser returns `null` rather than throwing on missing data, so a sparse chart still yields a well-formed `PatientData`.
- **SMART launch:** `public/launch.html` → `FHIR.oauth2.authorize()`; app → `FHIR.oauth2.ready()` (`smart-launch.ts`). Scopes: `launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read openid fhirUser`.
- **CDS Hooks 1.0:**
  - **Discovery:** `GET /cds-services` → two services.
  - **`oncovte-prophylaxis` (`patient-view`):** **two-channel alert model (WS-4).** Only **critical** alerts emit their own interruptive card; all **warning/info** alerts collapse into the single non-interruptive summary card as an "N additional considerations" section — so a 1-critical + 4-non-critical patient produces **two** cards, not five. **140-char summary cap** enforced (`clip`).
  - **Role tailoring (WS-4):** an optional `role` (`oncologist` / `pharmacist` / `app`, from context or `?role=`) reorders the summary detail — pharmacists lead with DDI mechanism + renal dosing; prescribers lead with the verdict + option choice. Role tailoring is the only design change with demonstrated improvement in prescriber acceptance in the CDS literature.
  - **Override capture (WS-4):** every interruptive (critical) card carries a fixed `overrideReasons` vocabulary (clinically inappropriate / already addressed / data inaccurate / patient preference / other). `POST /cds-services/override-feedback` appends the reason to an append-only JSONL log (`override-log.ts`).
  - **Governance metrics (WS-4):** `GET /metrics` renders firing rate per 100 chart-opens, critical-to-total ratio, and override rate by reason across the synthetic cohort (`metrics.ts`) — the metric set the alert-fatigue literature asks for, so repeatedly-overridden alerts can be demoted active→passive (Clickbusters model).
  - **`oncovte-ddi-check` (`order-select`):** screens the order(s) being composed — ordering a DOAC screens active meds against it; ordering another agent screens it against the patient's active DOAC(s). Only major (critical) and moderate/pharmacodynamic (warning) surface as cards; major cards also carry `overrideReasons` and each `major` cell's evidence anchor (WS-3).
  - **Prefetch:** templates declared per service; `prefetch.ts` adapts the prefetch block into `RawFHIRData` through the same pipeline and degrades missing bundles gracefully (throws only if the Patient resource is absent).

---

## 8. The five synthetic patients

Real FHIR R4 bundles, parsed through the identical `assemblePatientData →
generateRecommendation` pipeline. Test reference date pinned at `2026-06-10T12:00:00Z`
(`tests/integration/patients.test.ts`, 25 assertions). Each exercises a distinct terminal state.

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

## 9. The authoritative errata contract (10 issues)

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

## 10. Testing & verification

**Live run (this document): `vitest run` → 14 files, 173 tests, all passing** in ~6 s.
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

## 11. The interface — what a clinician actually uses

> Previously undocumented. A reviewer assessing *usefulness* (as opposed to correctness)
> cannot do it from the engine description alone, so the surface is specified here — along
> with what has **not** been evaluated about it.

### 11.1 What is on the screen

**Layout** (standalone demo and SMART dashboard share every component): a fixed left
control rail (~20 rem) beside a scrolling decision column.

- **Patient banner** — name, age/sex, diagnosis + ICD-10, MRN. Synthetic data only.
- **Alert stack** — severity-sorted (critical → warning → info), each with a left border
  accent, a plain-word level ("Important" / "Caution" / "For information"), a title, a
  detail, and an explicit **`Source:`** line naming the guideline that produced it.
- **Verdict banner** — the terminal state in words, with a stroke-icon status mark and a
  one-line summary. Flashes on change.
- **Anticoagulant options** — Preferred / Alternative / Avoid groups. Each card: agent
  name, dose + route + frequency, duration, a kidney-function chip, and a drug-interaction
  chip. Avoided agents each carry an explicit reason.
- **Khorana card** — per-criterion breakdown (value → points), total, tier, and the
  threshold conclusion in a sentence, plus a **calibration-transparency line** (WS-7):
  absolute risk by tier varies several-fold across cohorts and most VTE occurs outside the
  high-risk group — tier informs the ≥2 decision, it is not a precise individual estimate.
- **Bleeding-risk card (WS-2)** — rendered *beside* the Khorana card so the thrombotic vs
  bleeding trade-off is visible at a glance. A tier pill (Elevated / Standard / Insufficient
  data) plus the list of detected guideline-named factors, each with its source and a "LMWH
  preferred" marker where applicable, under an explicit "**not a score**" disclaimer.
- **Renal card** — CrCl, band, and per-agent guidance.
- **Drug-interaction card** — a headline for the worst interaction plus a per-severity
  tally; the full 4 × N matrix opens in a modal with expandable per-agent mechanism and
  action detail, each `major` cell showing its evidence anchor and a KB-version footer (WS-3).
- **Contraindication card** — Absolute and Relative groups, each finding showing its
  `appliesTo` scope so "blocks LMWH only" is visible rather than implied.
- **Disclaimers** — collapsed, always present.

### 11.2 Interaction design decisions that are clinical, not cosmetic

- **The what-if rail is the proof of the engine.** Editing platelets, hemoglobin, WBC,
  creatinine, medications, or the bleeding flag rebuilds a real `PatientData` and re-runs
  `generateRecommendation`. It duplicates no clinical logic (§3). Values can be set to
  **"not measured"** rather than zero, so the missing-data pathway is demonstrable rather
  than merely tested.
- **Exactly one animation carries clinical weight.** A slow border pulse is scoped to
  **absolute contraindications and nothing else**. If everything pulses, nothing does.
- **`prefers-reduced-motion` is honored** — the pulse resolves to a static red border.
- **No emoji, no symbolic shorthand in clinical copy.** Arrows, `≥`, and icon glyphs were
  removed from user-facing strings in favor of words ("Score of 2 or more: prophylaxis
  indicated"). Emoji render inconsistently across OS/projector and require decoding a
  picture before reading the sentence. Real clinical notation is deliberately **kept**
  (`2.5 mg PO BID`, `×10⁹/L`, `C25.1`) — that is a clinician's native language, and
  stripping it would be condescending, not clearer.
- **Type is sized for a projector and for presbyopia:** nothing in the interface is below
  14 px; drug names 20 px; labs are `tabular-nums` mono so digits align.
- **Presentation mode** (`?present=true`) enlarges verdict / score / CrCl for a hall.

### 11.3 What has *not* been evaluated about the interface — read this before claiming usability

- **No user testing *yet*.** No think-aloud has been run — but a protocol is now written and ready (`docs/EVALUATION.md` §2/§3: a 3-scenario think-aloud + an n=2 timing baseline), awaiting one clinician participant. Still zero *data*, but no longer zero *plan*.
- **No formal heuristic evaluation** and no cognitive-walkthrough.
- **Contrast IS now measured (WS-8).** A full WCAG 2.1 AA contrast audit across all five states + presentation mode is complete and **passing** (`docs/ACCESSIBILITY.md`; tightest pair 4.55:1). Semantic roles (`role="alert"`, `role="status"`, `role="switch"`, `aria-checked`, `aria-modal`) are used. Still open: screen-reader pass, keyboard-only traversal, focus-visible, 400% reflow.
- **Alert-fatigue *mitigations* are now built (WS-4), but not yet *measured with clinicians*.** The `patient-view` hook now uses a two-channel model (only critical alerts interrupt; the rest collapse into one non-interruptive summary card), role tailoring, override-reason capture, and a `/metrics` governance route. What is still absent is *empirical* evidence that these reduce fatigue in use — that requires clinicians and a deployment, which this prototype has not had.
- **Override logging exists but is unpopulated.** `POST /cds-services/override-feedback` appends to an append-only log and `/metrics` aggregates it, but no real clinician has generated override data, so the effectiveness signal is structural, not measured.

**Fair summary:** the interface is *considered* — the design rationale above is real and
defensible — but it is **unvalidated**. "Designed for clinician readability" is honest;
"usable by clinicians" is not yet a supported claim. See **F13**.

---

## 12. Complete flaw, gap & risk register

Ordered by how much a sharp reviewer/judge is likely to press on it. Nothing here is
hidden in the deliverables — but F1 is a genuine implementation gap not previously
surfaced, found while writing this document.

### F1 — `hasActiveMajorBleeding` end-to-end wiring **(RESOLVED 2026-07-15)**
- *Originally:* the contraindications engine supported active major bleeding (`ContraindicationInput.hasActiveMajorBleeding`, checked at `contraindications.ts:85` → universal absolute), but it was unreachable from a patient — `PatientData` had no such field and the orchestrator never passed it, so the verdict could never actually fire. The submission described it as "modeled as a clinician-set boolean," which was then aspirational relative to the code.
- **Fixed:** `hasActiveMajorBleeding: boolean` was added to `PatientData` (defaulted `false` in `assemblePatientData`, since FHIR has no reliable discrete signal for it), threaded through `Scenario` / `scenarioToPatient` / `patientToScenario`, forwarded in `generateRecommendation`'s `detectContraindications` call, and exposed as an "Active major bleeding (clinician-assessed)" toggle in the control rail. Two tests lock it (`tests/core/recommendation.test.ts`, `tests/standalone/scenario.test.ts`): toggling it on an otherwise-`recommend` patient flips the verdict to `contraindicated` with reason `active_major_bleeding`. Suite is now **173/173**, typecheck clean, build green.
- The submission claim is now literally true and demonstrable live — the toggle is the companion safety-gate demo to the Dorothy platelet flip.

### F2 — Curated knowledge base, not a live interaction service *(the central scientific dependency)*
- The DDI KB and thresholds are curated from supplied structured input + labeling. The tests prove *faithful application*, **not** that the pharmacology is correct or current.
- **Framing for a reviewer:** "faithful, tested implementation of a curated guideline set," **not** "independently validated drug-interaction service." Needs clinician/pharmacist sign-off and a maintenance steward for real use. Disclosed in `ASSESSMENT.md §5`, `VERIFICATION.md §9`, in-app disclaimers, and every submission field.

### F3 — No live-EHR deployment or end-user validation
- SMART launch is **code-complete and standards-conformant** but has **not** been exercised against a live production EHR or the SMART App Gallery sandbox by an external party. The screenshot-verified path is standalone synthetic mode. Both modes share one pipeline, so behavior is identical *by construction* — but a reviewer should not assume a live-EHR run happened. No users, no outcome data; impact is argued from literature (AVERT/CASSINI), not measured.

### F4 — Verdict word didn't distinguish "recommend DOAC" from "recommend LMWH fallback" — **resolved (WS-5)**
- **Resolution:** added a `verdictLabel` field (`recommend_lmwh`) alongside the machine-stable `overallAction`. When both DOACs are blocked and LMWH is eligible (e.g. James Chen), the hero now reads **"Prophylaxis recommended — LMWH (DOACs blocked)"**; API consumers still see `overallAction` unchanged. Test: integration "F4 (WS-5): … verdictLabel 'recommend_lmwh'".

### F5 — CDS `order-select` "not an NCCN prophylaxis option" note for dabigatran/edoxaban — **resolved (WS-5)**
- **Resolution:** `buildOrderSelectCards` now emits an advisory card when a dabigatran/edoxaban order is composed; the dabigatran card additionally cites the ACC statement that it has not been evaluated in cancer-associated thrombosis. Test: cards "F5 (WS-5): ordering dabigatran or edoxaban emits a 'not NCCN-supported' advisory".

### F6 — Kidney cancer scored high-risk against NCCN's narrower list — **narrowed (WS-1.3)**
- Narrowed to **C64 only** (renal-cell carcinoma); renal pelvis/ureter/other urinary no longer score. Still a documented JACC/ASCO divergence (grade C), surfaced as an advisory — flagged, not hidden.

### F7 — Advisory notes only surfaced on an *active recommendation* — **resolved (WS-5)**
- **Resolution:** the cancer-site caveat is now built once (`siteAlert`) and attached to **every** terminal state — `excluded`, `not_indicated`, and `contraindicated` included. Test: recommendation "F7 (WS-5): a lung patient with not_indicated STILL carries the lung advisory".

### F8 — Renal data absent → conservative-but-blunt fallback — **resolved (WS-5)**
- Missing weight/creatinine still synthesizes an internal `CrCl 0 / severe` sentinel so dosing gates safely, **but** the user-facing copy now reads **"Renal function not assessable — treated conservatively (obtain weight and serum creatinine)"** instead of leaning on a placeholder CrCl. Test: recommendation "F8 (WS-5): missing renal data → 'not assessable' copy, never a CrCl-0/<30 claim".

### F9 — Epidemiology figures **(citations supplied; docx insert remaining)**
- The figures are now grounded in specific sources (see the References appendix): ~4–7× risk and ~20% of all VTE events → ITAC 2019 (Farge et al., *Lancet Oncol*); ~2 million new US diagnoses/yr → ACS 2024 (Siegel et al., *CA Cancer J Clin*); cancer-associated VTE epidemiology → Lam et al. 2026 (*Am J Hematol*). The prose was reconciled across `SUBMIT!/materials.md`, `submission/02-rationale.txt`, and this document ("a leading cause," "approximately 2 million"). **Remaining:** paste the references into `AMIA-App-Competition-Submission.docx` and clear its `(cite)` placeholders (§17). The Lam et al. 2026 volume/pages should be confirmed on final publication.

### F10 — Live demo reference date — **resolved (WS-5)**
- **Resolution:** a `?asof=YYYY-MM-DD` query parameter (`src/ui/asof.ts: getAsOfDate`) pins the reference date used for lab-staleness, defaulting to `new Date()`. Robert's stale-lab state is now reproducible on any stage day (e.g. `?asof=2026-07-16`). Test: "getAsOfDate parses a valid ?asof date".

### F11 — Sustainability depends on a KB steward
- A curated KB is a maintenance liability without an owner. The architecture makes updates *data edits* (external versioned JSON with per-agent sources), which mitigates but does not remove the need. Roadmap: validate against public sandboxes, broaden KB under clinical review, SMART App Gallery publication.

### F12 — DDI knowledge-base citations are KB-level, not per-interaction *(new — found by measuring the file, 2026-07-16)*
- Measured from `ddi-knowledge-base.json`: **every** one of the 52 agents cites `AHA 2022 Scientific Statement`; **49** additionally cite `Hellfritzsch et al. 2024`; only **3** (the azole antifungals) cite `FDA DOAC labeling`. The `sources` array is therefore a **uniform KB-level attestation**, not per-agent literature sourcing.
- **Why it matters:** `mechanism` strings state specific quantitative pharmacology to the clinician — e.g. ibrutinib *"increases apixaban AUC ~100%"* — that **cannot be verified from this repo** and is not anchored to a page, table, or quote. The errata's `sources` requirement (Issue 6) is met to the letter and thin in the spirit.
- **This does not make the KB wrong.** Both references are appropriate, on-topic secondary sources for DOAC–antineoplastic interactions, and the table is internally consistent. It makes the KB **unauditable at the cell level**, which is a different and more honest criticism than "the pharmacology may be wrong."
- **Resolution (WS-3):** the **16 `major` cells** — the only cells that change a recommendation — now each carry a per-cell `evidenceAnchor` `{source, locator, claim}`. The inhibitor and inducer groups anchor to the AHA 2022 Scientific Statement **Table 3** (named in `plan/ddi-info.md` as the build source); the three azole antifungals anchor to the **FDA DOAC labeling "combined P-gp and strong CYP3A4 inhibitors"** drug-interaction subsection. A validation test (`tests/data/ddi-kb-provenance.test.ts`) now **fails** if any `major` cell loses its anchor, if a locator is a bare paper name, or if any mechanism states a digit-percentage magnitude without an anchor — making the gap structurally impossible to reintroduce. The KB root gained `kbVersion`, `lastReviewed` (a **curation** date, not clinician sign-off), and a `provenanceNote`; both are surfaced in the DDI matrix footer and the CDS card detail.
- **Honest limit that remains:** the anchors point the reviewer to the right table/label subsection, but the *quantitative magnitudes* in mechanism strings (e.g. ibrutinib "~100% AUC") are **as reported in those secondary references, not independently re-derived** — the `provenanceNote` says exactly this. This is now auditable at the cell level; it is not the same as an original PK review.
- **Do not describe the KB as "literature-sourced per agent."** Correct phrasing: "curated from two secondary references and applied consistently across 52 agents; the 16 recommendation-changing cells are individually anchored."

### F13 — The interface is unvalidated *(partially addressed — WS-4/WS-8)*
- **Mitigations built (WS-4):** two-channel alerts (only critical interrupts; warning/info collapse to one card), role tailoring (pharmacist vs prescriber), fixed-vocabulary override capture, and a `/metrics` governance route (firing rate per 100 chart-opens, critical-to-total ratio, override rate by reason). These implement the evidence-based strategies the alert-fatigue literature names (tiering, role tailoring, override capture, continuous monitoring / Clickbusters).
- **Contrast now measured (WS-8):** a full WCAG AA audit is complete and passing (`docs/ACCESSIBILITY.md`). Think-aloud and timing protocols are written (`docs/EVALUATION.md`) but not yet run — they need one clinician participant.
- **Still open:** no user testing *data* yet, no heuristic evaluation, no screen-reader pass. The override log and `/metrics` are structurally in place but unpopulated (no clinician has used the tool).
- **Why a judge will care:** for a CDS entry, usability *is* safety — alert fatigue is the best-documented failure mode in the CDS literature. The app now has *mitigations and measurement scaffolding*; what it lacks is *empirical* validation.
- **Framing:** claim "designed for clinician readability, with stated rationale"; **do not** claim "clinician-validated" or "usable." Cheapest credible improvement: a measured contrast pass + one think-aloud with a single oncology APP would move this from zero to non-zero.

### F14 — The hepatic-impairment rule is a curator-built surrogate — **renamed (WS-1.4)**
- `bilirubin >3 mg/dL AND (ALT or AST) >5× ULN` was documented as a "Child-Pugh C surrogate," but **it is not Child-Pugh** and no published source states this rule. True Child-Pugh requires albumin, INR, ascites, and encephalopathy — none of which the app reads, and two of which are not lab-derivable at all.
- Conservative and defensible in direction, but it is an **invention presented alongside A-tier rules**, and a hepatologist would notice. Tier **C** in §5.2.
- **Resolution (WS-1.4):** the string "Child-Pugh C" has been removed from `src/`, the alert text, and `VERIFICATION.md`; it is now called "a conservative lab-only proxy for severe hepatic impairment (bilirubin >3 mg/dL and AST or ALT >5× ULN)." The rationale cites NCCN's own regimen-selection language ("elevated transaminases or bilirubin, Child-Pugh B and C liver impairment, or cirrhosis") as evidence the domain is guideline-recognized while stating the operationalization is ours. *Remaining `plan/ddi-info.md` mention is the authoritative source contract and is left as historical record.*

**None of F2–F14 are disqualifiers for a Student-category prototype** — the bar is a
well-engineered, well-reasoned, honestly-scoped prototype, and this clears it. **The items
to actively fix or explicitly frame before presenting: F9** (docx citations), **F12** (anchor
the 16 major DDI cells — WS-3), and **F13** (stop at "designed for readability"; WS-4/WS-8 in
progress). **F1, F6 (narrowed, WS-1.3), and F14 (renamed, WS-1.4) are resolved.**

---

## 13. Clinical-accuracy audit checklist for a reviewer

Use this to stress-test correctness in ~30 minutes:

1. **Boundary sampling (Khorana):** confirm platelets 349 vs 350, Hgb 10.0 vs 9.9, WBC 11.0 vs 11.1, BMI 34.9 vs 35 in `khorana-engine.test.ts`. Do the code constants match the cited model? (They do: §4.2.)
2. **Tier vs threshold:** confirm score 1 = Intermediate but `prophylaxisRecommended=false`; score 2 = Intermediate + true. Confirm the supersession note (§9) is a labeling change only.
3. **Severity precedence:** verify `SEVERITY_RANK` in `ddi-checker.ts` matches `major>moderate>pharmacodynamic>minor>none>unknown` and that `DDIMatrix.tsx`/`format.ts` render the same order.
4. **Targeted vs universal:** trace a HIT patient (`D75.82`) → LMWH blocked, DOACs preferred, `canProceedWithProphylaxis=true`. Trace platelets 42K → universal absolute → contraindicated.
5. **LMWH fallback safety:** confirm no code path ever offers dabigatran/edoxaban as prophylaxis (grep `PROPHYLAXIS_DOACS` — only apixaban/rivaroxaban; `REFERENCE_DOACS` always ineligible).
6. **Unknown-drug degradation:** an RxNorm not in the KB → `unknown` + "verify manually," never a crash.
7. **Active-bleeding gate (F1, resolved):** toggle "active major bleeding" on an otherwise-`recommend` patient in the demo and confirm the verdict flips to `contraindicated` with reason `active_major_bleeding`. Confirms the safety gate is wired end-to-end (regression-locked by two tests).
8. **Reproduce §16** and confirm 133/133 + clean typecheck + build.

**Then stress-test the *evidence*, which is the softer target (~20 more minutes):**

9. **Audit the 16 `major` DDI cells** — the only cells that change a recommendation. List them, now with their per-cell anchor (WS-3):
   ```bash
   python -c "import json;kb=json.load(open('src/data/ddi-knowledge-base.json'));[print(e['agentName'],d,'|',v['mechanism'],'|',v.get('evidenceAnchor',{}).get('locator','NO ANCHOR')) for e in kb['agents'] for d,v in e['interactions'].items() if v['severity']=='major']"
   ```
   Every row must show a locator (a table/section/label subsection), not "NO ANCHOR" — `tests/data/ddi-kb-provenance.test.ts` enforces this. Then ask the residual question the anchor can't answer: is each `mechanism`'s *quantitative magnitude* (e.g. ibrutinib "~100%") the value in that source? The `provenanceNote` states these are as-reported, not independently re-derived (F12).
10. **Confirm the provenance shape** — every agent cites the same 1–2 references, and read the root metadata:
    ```bash
    python -c "import json;from collections import Counter;kb=json.load(open('src/data/ddi-knowledge-base.json'));print('kbVersion',kb['kbVersion'],'| lastReviewed',kb['lastReviewed']);print(Counter(s for e in kb['agents'] for s in e['sources']))"
    ```
11. **Grade-check §5.2** — disagree with our tiering. The rules we self-graded **C** (kidney +1, the hepatic surrogate, sarcopenia/low-weight cuts) are the ones where a specialist is most likely to overrule us; the rule graded **D** (30-day staleness) has no clinical source at all and is not defended as one.
12. **Bleeding-risk handling (WS-2).** The app does **not** compute a bleeding *score* — deliberately: published cancer-associated-thrombosis bleeding scores reach c-statistics of only 0.50–0.70 and were derived in *treatment*, not prophylaxis, cohorts, so a number here would be the app's first genuinely unsupportable claim. Instead a **qualitative bleeding-risk panel** (`src/core/bleeding-risk.ts`) surfaces guideline-named factors (ACC 2026; NCCN VTE-2), each individually sourced, beside the Khorana card. Press on the honest residual: the factor *thresholds* (anemia <10, thrombocytopenia <100, weight <50) are curator choices (grade C), and the panel informs rather than decides.

---

## 14. Deployment & operations

- **Live:** oncovte-guard.pages.dev — **Cloudflare Pages**, direct-upload via wrangler (account `3f6da4967d8184d8889747c26d348a69`, jtown42@live.com). The GitHub repo is the source of record; the Pages project is fed by direct upload, not a Git integration.
- **Redeploy the app bundle:**
  ```bash
  npm run build
  npx wrangler pages deploy dist --project-name=oncovte-guard --branch=main --commit-dirty=true
  ```
- **Docs-only changes** (README, VERIFICATION, screenshots, this file) do **not** require a redeploy — the live bundle is independent of repo docs.
- **CDS Hooks service** (`npm run cds-server`, Express on :3000) is **not** part of the Cloudflare static deploy — it is a local/self-hostable Node service. If a demo needs the live CDS endpoint, it must be hosted separately.

---

## 15. Presenting at a national conference

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
1. "This is a clinical reasoning engine, not a dashboard — 173 tests prove it, and one seam feeds both a SMART app and a CDS Hooks service."
2. "Every rule traces guideline → source → code → test in our VERIFICATION document."
3. "The knowledge base is curated and tested for faithful application — clinician sign-off is the explicit next step, and we say so."

**Anticipated hard questions — and honest answers:**

| Question | Answer |
|---|---|
| "Is the pharmacology validated?" | No — curated from supplied structured input + labeling; tests prove faithful *application*, not independent correctness. Clinician/pharmacist sign-off is the next step (F2). |
| "Have you run it in a real EHR?" | SMART launch is code-complete and conformant; demonstrated path is synthetic. Both modes share one pipeline (F3). |
| "Why score kidney cancer high-risk?" | JACC/ASCO interpretation; NCCN names only bladder/testicular. We surface an explicit advisory note rather than hide the divergence (F6). |
| "Your errata file says score 1 is Low." | We deliberately restored the published Khorana/NCCN tiering (0 Low, 1–2 Intermediate, ≥3 High) over the errata draft; it's a label change only — threshold stays ≥2 (§9). |
| "What about active bleeding?" | Handled as a clinician-confirmable flag — FHIR has no reliable discrete signal for it, so it's an explicit toggle, and flipping it live drops every option and flips the verdict to contraindicated. Regression-locked by two tests (F1, resolved). |
| "Max score 6 or 7?" | 6, from the component weights; the 0–7 in one review is a known error (§9). |
| **"Where does each interaction severity come from?"** | Two secondary references (AHA 2022 statement, Hellfritzsch 2024) applied across all 52 agents — it's a KB-level attestation, not per-cell citation, and I can show you the exact counts. The 16 `major` cells are the ones that change a recommendation and they're the audit target. **Don't oversell this one** (F12). |
| **"Is that really Child-Pugh C?"** | No — it's a conservative lab-only proxy using bilirubin and transaminases. True Child-Pugh needs albumin, INR, ascites, and encephalopathy, which we don't read. Documented as a surrogate (F14). |
| **"Have any clinicians used it?"** | No. No user testing, no heuristic eval, no contrast audit. The design rationale is stated and deliberate, but it is unvalidated, and alert fatigue is unaddressed (F13, §11.3). |
| **"What about alert fatigue?"** | Addressed by design (WS-4): a two-channel model where only critical alerts interrupt and the rest collapse into one non-interruptive card; role tailoring (the only design shown to improve acceptance); fixed-vocabulary override capture; and a `/metrics` route tracking firing rate, critical-to-total ratio, and override rate by reason — the Clickbusters governance loop. What I *can't* claim is measured impact: no clinician has used it, so the mitigations are implemented but not yet empirically validated (F13). |

Cite the epidemiology figures on any slide (ITAC 2019 for 4–7× and ~20%; ACS 2024 for ~2 million) — see the References appendix.

---

## 16. Reproduce everything

Requires Node 18+.

```bash
npm install
npm run typecheck     # tsc --noEmit (strict)        → 0 errors
npm test              # vitest run                    → 14 files, 173 tests pass
npm run build         # tsc && vite build             → dist/ (113 modules)
npm run dev           # standalone demo, 5 patients   → http://localhost:5173
npm run preview       # serve the production build
npm run cds-server    # CDS Hooks service             → http://localhost:3000/cds-services
```

Then read, in order: `VERIFICATION.md` (the audit) → `src/core/recommendation.ts` (the
actual reasoning) → `tests/integration/patients.test.ts` (five patients end-to-end) →
`submission/SUBMISSION-FULL.md` (the entry) → `docs/screenshots/` (the five states).

---

## 17. Outstanding work before final submission

**Blocking (needs a human / advisor):**
1. **Advisor attestation** — required for the Student category (signed PDF; template at `submission/advisor-attestation-template.md`).
2. **Logo + student headshot** — placeholders noted in the submission.
3. **Paste the epidemiology references into `AMIA-App-Competition-Submission.docx`** and clear its `(cite)` placeholders (F9). The sources are supplied and reconciled in the text (References appendix below); this is now a copy-in step, and the Lam et al. 2026 volume/pages should be confirmed on publication.

**Non-blocking but high-value (you can do these alone):**
4. **Sweep the submission text for overclaims** against §5.4 — specifically any phrasing that implies per-agent literature sourcing, clinician validation, or usability evidence.
5. **A measured contrast pass** (and, if any clinician is reachable at all, one think-along) would take F13 from zero evidence to non-zero (WS-8).
6. **Commit the UI readability revision** — it is currently working-tree only, so the live site is behind `main` (see the header note).

**Done since last revision:**
- ✅ **WS-1 clinical contract corrections** — (1.1) apixaban <40 kg regraded to a targeted **absolute** citing NCCN VTE-B-2, regraded evidence **A**; (1.2) thrombocytopenia retagged to NCCN VTE-B-2 + VTE-F with the "DOACs not recommended <50,000/μL" rationale; (1.3) kidney rule narrowed to **C64 only** (RCC), C65/C66/C68 no longer score; (1.4) hepatic rule renamed off "Child-Pugh C" across code + `VERIFICATION.md`.
- ✅ **WS-3 DDI auditability (F12)** — the 16 `major` cells each carry a per-cell `evidenceAnchor` (AHA 2022 Table 3 / FDA azole labeling); KB root gained `kbVersion`/`lastReviewed`/`provenanceNote`, surfaced in the DDI matrix footer and CDS card; a new validation test makes the gap structurally impossible to reintroduce.
- ✅ **WS-2 qualitative bleeding-risk panel** — `src/core/bleeding-risk.ts` surfaces guideline-named bleeding-risk factors (ACC 2026 / NCCN VTE-2), each sourced, in three tiers, **deliberately not a score** (the evidence does not support one for primary prophylaxis). Rendered beside the Khorana card; present on all 5 patients; 18 unit tests + integration. Converts the app's biggest acknowledged asymmetry into a documented, cited feature.
- ✅ **WS-4 alert fatigue & CDS governance (F13)** — two-channel alert model (only critical interrupts; warning/info collapse into one card — 1-critical+4-non-critical now yields 2 cards not 5), role tailoring (oncologist/pharmacist/app), fixed-vocabulary override capture with an append-only log, and a `/metrics` governance route (firing rate per 100 chart-opens, critical-to-total ratio, override rate). Implements the evidence-based fatigue strategies (tiering, role tailoring, override capture, Clickbusters monitoring). Mitigations built; empirical validation still pending (WS-8).
- ✅ **WS-5 findings sweep** — F4 (`verdictLabel:"recommend_lmwh"` for the LMWH-fallback verdict, `overallAction` kept stable), F5 (order-select advisory for dabigatran/edoxaban + ACC dabigatran note), F7 (cancer-site advisory now on *every* terminal state), F8 (renal fallback copy reads "not assessable," never "CrCl 0"), F10 (`?asof=YYYY-MM-DD` pins the demo reference date). **F9 remains** — the `.docx` citation paste (binary edit, needs you).
- ✅ **WS-6/7 caveats** — pancreatic/hepatobiliary Khorana-discrimination caveat on Maria (does not change her score); Khorana calibration-transparency line on every scored patient (tier is not a precise individual estimate).
- ⏳ **WS-8 evaluation** — **contrast audit DONE** (`docs/ACCESSIBILITY.md`, all AA-passing); **think-aloud + n=2 timing protocols written** (`docs/EVALUATION.md`) but **awaiting a clinician participant** — this is the one workstream that needs a human, by design. No transcript or timing has been invented.
- ✅ **F1 wired end-to-end** — active major bleeding now flips the verdict live.
- ✅ **F9 figures sourced + reconciled** across `materials.md`, `submission/02-rationale.txt`, and this document ("a leading cause," "approximately 2 million").
- ✅ **Evidence base graded (§5)** — every clinical rule assigned a provenance tier; DDI KB provenance measured directly from the file rather than assumed.
- ✅ **Interface documented (§11)**, including an explicit inventory of what has *not* been evaluated.
- ✅ **Three new findings self-reported** — F12 (KB citation granularity), F13 (unvalidated interface / alert fatigue), F14 (hepatic surrogate).

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
Last verified against a live test run of 173/173 passing.*
