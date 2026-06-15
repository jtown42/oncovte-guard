# OncoVTE Guard — Verification & Traceability Document

**Purpose.** This document lets an independent reviewer audit OncoVTE Guard
without reading the whole codebase. For every clinical decision the app can
make, it traces a chain:

> **clinical rule → published source → implementing code (`file:function`) → automated test that proves it.**

It also records the errata-compliance evidence, the synthetic-patient
expected-output table, the FHIR/CDS-Hooks conformance surface, the full test
inventory, and the exact commands to reproduce every result below.

- **Verified on:** 2026-06-15
- **Authoritative contract:** [`plan/errata-contract-reconciliation.md`](plan/errata-contract-reconciliation.md) (overrides `plan/ddi-info.md` on its 10 resolved issues), with one dated clinical-review supersession noted in §5 (risk-tier labels).
- **Status:** `tsc --noEmit` clean · `vite build` succeeds · **121 / 121 tests passing**

---

## 1. How to reproduce this audit

```bash
npm install
npm run typecheck     # tsc --noEmit  → no errors
npm test              # vitest run    → 10 files, 121 tests, all passing
npm run build         # tsc && vite build → dist/ (113 modules)
npm run dev           # standalone demo (5 synthetic patients), http://localhost:5173
npm run cds-server    # CDS Hooks service, http://localhost:3000/cds-services
```

Every claim in §4–§8 is independently checkable by reading the cited file and
running the cited test (`npx vitest run <path> -t "<test title>"`).

---

## 2. Verification evidence (latest run)

| Gate | Command | Result |
| --- | --- | --- |
| Type safety | `tsc --noEmit` (strict, `noUnusedLocals`, `noImplicitReturns`) | **0 errors** |
| Unit + integration tests | `vitest run` | **10 files, 121 tests passed** |
| Production build | `tsc && vite build` | **113 modules transformed, built** |
| Live render (manual) | `vite preview` + browser | All five pathways (recommend / LMWH-fallback / contraindicated / not-indicated / excluded) verified visually in the redesigned demo UI, including the live verdict flip and presentation mode (see `docs/screenshots/`) |

Test files: `khorana-engine` (27), `ddi-checker` (13), `renal-dosing` (11),
`contraindications` (11), `stale-lab` (9), `recommendation` (6),
`rxnorm-codes` (3), `integration/patients` (19), `cds-hooks/cards` (11),
`standalone/scenario` (11).

---

## 3. Repository inventory (what exists, by layer)

**Clinical engines** — `src/core/` (pure, framework-free, deterministic)

| File | Responsibility |
| --- | --- |
| `khorana-engine.ts` | Khorana score, cancer-site resolution, risk tiering |
| `ddi-checker.ts` | Per-DOAC interaction lookup + worst-severity aggregation |
| `renal-dosing.ts` | Cockcroft-Gault CrCl + per-anticoagulant renal guidance |
| `contraindications.ts` | Absolute/relative contraindications with `appliesTo` scope |
| `stale-lab.ts` | >30-day lab staleness |
| `recommendation.ts` | Orchestrator → `ProphylaxisRecommendation` |

**Knowledge bases** — `src/data/`

| File | Responsibility |
| --- | --- |
| `ddi-knowledge-base.json` | 52 antineoplastic/supportive agents × 4-DOAC interaction profiles |
| `icd10-cancer-map.ts` | ICD-10-CM → Khorana category (prefix matching) + exclusions |
| `doac-renal-thresholds.ts` | Per-agent renal rules + prophylaxis dose strings |
| `loinc-codes.ts` | Lab/vital LOINC constants + prefetch code lists |
| `rxnorm-codes.ts` | DOAC/anticoagulant/antiplatelet/ESA/IMiD/nephrotoxic RxNorm sets |

**FHIR layer** — `src/fhir/`: `fhir-parser.ts` (R4 → `PatientData`),
`smart-launch.ts` (OAuth2), `fhir-client.ts` (live fetch),
`standalone-loader.ts` (synthetic bundles).

**CDS Hooks** — `src/cds-hooks/`: `discovery.ts`, `prefetch.ts`, `cards.ts`,
`server.ts`, `types.ts`.

**UI** — `src/App.tsx`, `src/main.tsx`, `src/components/*`, `src/ui/format.ts`.
The standalone demo presents a sticky left **control rail**
(`src/components/ScenarioEditor.tsx`) beside the dashboard, so the verdict stays
in view while an input is dragged. It is a live "what-if" editor
(+ `src/standalone/scenario.ts`): editing labs, BMI, cancer site, flags, or
medications rebuilds a real `PatientData` (deriving onAntiplatelet/onIMiD/
nephrotoxic/ESA flags from the same RxNorm sets the FHIR parser uses) and
re-runs `generateRecommendation` — no clinical logic is duplicated. Proven by
`tests/standalone/scenario.test.ts` (11 tests). When a result changes, the
affected module replays a recompute flash (`src/components/Flash.tsx`); the DOAC
interaction grid is summarized inline with the full matrix behind a modal
(`DDISummary`/`DDIMatrix` in `src/components/DDIMatrix.tsx`); and a presentation
mode (`?present=true` or the top-bar toggle) enlarges the verdict, Khorana
score, and CrCl for projector legibility. None of this touches the clinical
engine — every rendered value comes from `generateRecommendation`.

**Synthetic data** — `synthetic-patients/patient-1..5-*.json` (FHIR R4
collection bundles). Generator: `scripts/gen-patients.cjs`.

**Conformance artifacts** — `public/capability-statement.json` (FHIR R4 client
CapabilityStatement), `public/launch.html` (SMART launch entry).

---

## 4. Clinical traceability matrix

Each row: **rule → source → code → test**. Test titles are quoted verbatim from
the suite.

### 4.1 Khorana VTE Risk Score

| Rule | Source | Code | Test |
| --- | --- | --- | --- |
| Cancer site: very-high (stomach, pancreas) = 2; high (lung, lymphoma, gyn, bladder, testicular, kidney*) = 1; standard = 0 | Khorana 2008; NCCN VTE-B | `icd10-cancer-map.ts: VERY_HIGH_RULES / HIGH_RULES`; `khorana-engine.ts: cancerSitePoints` | "Test 1…", "Test 2…", "Test 3…", "Test 4…" (khorana-engine) |
| Platelets ≥ 350 → +1 (349 does not score) | Khorana 2008 | `khorana-engine.ts: KHORANA_THRESHOLDS.PLATELETS_GTE` | "Test 5: platelets exactly 350 score", "Test 6: platelets 349 do not score" |
| Hemoglobin < 10 **or** on ESA → +1 (10.0 does not score; ESA alone suffices) | Khorana 2008 | `khorana-engine.ts` Hgb block (`esaFlag`) | "Test 7…", "Test 8…", "Test 9: ESA use scores… even with normal Hgb" |
| WBC > 11 → +1 (11.0 does not score) | Khorana 2008 | `khorana-engine.ts: KHORANA_THRESHOLDS.WBC_GT` | "Test 10…", "Test 11: WBC 11.1 scores" |
| BMI ≥ 35 → +1 (34.9 does not score) | Khorana 2008 | `khorana-engine.ts: KHORANA_THRESHOLDS.BMI_GTE` | "Test 12…", "Test 13…" |
| **Maximum score = 6** | ERRATA Issue 1 | `khorana-engine.ts: cappedScore = Math.min(total, MAX_KHORANA_SCORE)` | "Test 15: maximum score is capped at 6" |
| Tiers: **0 Low, 1–2 Intermediate, ≥3 High**; prophylaxis at **≥2** | Khorana 2008; NCCN VTE-C (supersedes errata draft — see §5 #2) | `khorana-engine.ts: riskCategoryForScore`, `prophylaxisRecommended` | "Test 20: score 1 is Intermediate Risk, no prophylaxis", "maps 0→low; 1,2→intermediate; 3+→high" |
| Missing labs → `missingFields` + `isComplete=false`, non-scoring | plan Part 1 | `khorana-engine.ts` null-guards | "Test 14: null platelets → missingFields + isComplete false" |

\* Kidney is flagged high-risk with an advisory note that NCCN VTE-C names only
bladder/testicular (`icd10-cancer-map.ts: KIDNEY_NOTE`) — documented divergence,
not a silent assumption. **Lung cancer** carries a parallel advisory
(`LUNG_NOTE`) flagging the Khorana score's weak discrimination in lung cancer
(van Es et al. IPD meta-analysis). Both notes are surfaced as an info-level
alert by `recommendation.ts` when an active recommendation is produced. Tests:
"lung cancer (C34) carries the limited-discrimination advisory note", "kidney
cancer (C64) carries the NCCN-divergence advisory note", "a standard site
carries no advisory note".

### 4.2 Cancer-site classification & disease-specific exclusions

| Rule | Source | Code | Test |
| --- | --- | --- | --- |
| ICD-10-CM matched by **prefix** (`startsWith`), normalized upper-case | ERRATA Issue 5 | `icd10-cancer-map.ts: classifyIcd10 / matchesAny` | exercised across all khorana-engine tests |
| Excluded populations (myeloma, acute leukemia, MPN, brain tumor) → Khorana N/A | NCCN VTE-2 | `icd10-cancer-map.ts: EXCLUSION_RULES` | "Test 16…myeloma", "Test 17…brain tumor", "Test 18…acute leukemia", "Test 19…MPN" |
| Exclusion reported as nested `{isExcluded, reason}` with snake_case reasons | ERRATA Issue 10 | `khorana-engine.ts: result.exclusion` | "Test 16…(nested shape, snake_case reason)" |
| Exclusion **dominates** a co-occurring scorable tumor; else highest site governs | plan Part 1D | `khorana-engine.ts: getCancerCategory` | "exclusion dominates a co-occurring scorable tumor", "highest-scoring site governs…" |

### 4.3 DOAC–chemotherapy interactions

| Rule | Source | Code | Test |
| --- | --- | --- | --- |
| `checkDDIs()` returns the **full per-DOAC shape** for all 4 DOACs | ERRATA Issue 7 | `ddi-checker.ts: checkDDIs` | "Test 1: ibrutinib interacts across all DOACs" |
| Severity rank: major > moderate > pharmacodynamic > minor > none > unknown | ERRATA Issue 7 | `ddi-checker.ts: SEVERITY_RANK / worseSeverity` | "orders major > moderate > pharmacodynamic > minor > none > unknown" |
| Strong CYP3A4/P-gp inducer → **major** for apixaban/rivaroxaban | DOAC labeling | `ddi-knowledge-base.json` (e.g. enzalutamide) | "Test 4: enzalutamide…major for apixaban/rivaroxaban" |
| Pharmacodynamic (additive bleeding) flagged independent of DOAC levels | AHA 2022 statement | `ddi-knowledge-base.json` (bevacizumab) | "Test 3: bevacizumab is a pharmacodynamic bleeding risk" |
| No-interaction agent → `none` | — | `ddi-knowledge-base.json` (gemcitabine) | "Test 2: gemcitabine has no interactions" |
| Unknown RxNorm → `unknown` for all DOACs (no throw) | ERRATA Issue 7 | `ddi-checker.ts: unknownDetail` | "Test 6: unknown RxNorm yields unknown for every DOAC" |
| Worst-per-DOAC aggregation across all active meds | ERRATA Issue 7 | `ddi-checker.ts: getWorstDDIForDoac` | "Test 7: aggregates the worst severity per DOAC…", "returns none for an empty result set" |
| KB is camelCase and includes a `sources` field | ERRATA Issue 6 | `src/types/ddi.ts: DDIEntry`; `ddi-knowledge-base.json` | typecheck (KB cast to `DDIEntry[]`) |

### 4.4 Renal dosing (Cockcroft-Gault)

| Rule | Source | Code | Test |
| --- | --- | --- | --- |
| `CrCl = [(140−age)·wt·(0.85 if F)] / (72·SCr)`, rounded 0.1 | Cockcroft-Gault | `renal-dosing.ts: calculateCrCl` | "Test 1: male 60y…→88.9", "Test 2: female applies the 0.85 factor" |
| Divide-by-zero / invalid input guarded → 0 | defensive | `renal-dosing.ts` guard | "Test 5: non-positive creatinine is guarded (returns 0)" |
| Bands: normal ≥90, mild 60–89, moderate 30–59, severe <30 | NCCN VTE-B | `renal-dosing.ts: categorizeCrCl` | "normal >=90, mild 60-89, moderate 30-59, severe <30" |
| Always reports **6** anticoagulants via lookup helper | ERRATA Issue 8 | `doac-renal-thresholds.ts: ASSESSED_ANTICOAGULANTS`; `getRenalRecommendation` | "Test 6: always reports six anticoagulants", "Test 7: getRenalRecommendation looks up a single agent" |
| At CrCl <30: apixaban=caution, rivaroxaban/LMWH=avoid | NCCN VTE-B; labeling | `doac-renal-thresholds.ts: ruleFor` | "Test 10: at CrCl <30, apixaban=caution, rivaroxaban/LMWH=avoid" |
| Low weight (<60 kg) → `sarcopenia` warning | C-G overestimation | `renal-dosing.ts` | "Test 8: low body weight raises the sarcopenia warning" |
| Active nephrotoxic agent → `nephrotoxic_chemotherapy` warning | clinical | `renal-dosing.ts` + `rxnorm-codes.ts: NEPHROTOXIC_CHEMO_RXNORM` | "Test 9: active nephrotoxic chemo raises a warning" |

### 4.5 Contraindications (appliesTo-aware)

| Rule | appliesTo | Source | Code | Test |
| --- | --- | --- | --- | --- |
| Active major bleeding | all (absolute) | NCCN VTE-B | `contraindications.ts` | (covered via recommendation contraindicated path) |
| Severe thrombocytopenia <50K | all (absolute) | NCCN VTE-B | `CONTRAINDICATION_THRESHOLDS.SEVERE_THROMBOCYTOPENIA_LT` | "Test 1…universal absolute", "Test 2: at/above 50K do not trigger" |
| Antiphospholipid syndrome (D68.61) | all (absolute) | TRAPS trial | `APS_PREFIXES` | "Test 3: antiphospholipid syndrome (D68.61) is a universal absolute" |
| Severe hepatic impairment (bili >3 **and** AST/ALT >5× ULN) | all (absolute) | DOAC labeling (Child-Pugh C) | hepatic block | "Test 8: severe hepatic impairment… is absolute" |
| **HIT (D75.82)** | **LMWH only** (targeted) | clinical | `HIT_PREFIXES`, `appliesTo:["enoxaparin","dalteparin"]` | "Test 4: HIT (D75.82) blocks LMWH only", "Test 9: HIT blocks LMWH but DOACs remain available" |
| GI/GU tract cancer | all (relative) | NCCN 2B | `GI_TRACT_PREFIXES` | "Test 5: GI tract cancer (gastric C16) is a relative caution" |
| Brain tumor | all (relative) | NCCN VTE-2 | `BRAIN_TUMOR_PREFIXES` | (classifier + recommendation paths) |
| Multiple myeloma + IMiD | all (relative) | NCCN MM | `MYELOMA_PREFIXES` + `onIMiD` | "multiple myeloma on an IMiD is a relative caution" |
| Concurrent antiplatelet | all (relative) | clinical | `onAntiplatelet` | "Test 6: concurrent antiplatelet is a relative caution" |
| Low weight <40 kg | **apixaban only** (relative) | NCCN | `APIXABAN_LOW_WEIGHT_LT` | "Test 7: low weight (<40 kg) is a relative caution for apixaban" |
| `canProceedWithProphylaxis` false **only** for a universal absolute | ERRATA Issue 9 | `contraindications.ts: hasUniversalAbsolute` | "a clean patient… can proceed"; recommendation tests |

### 4.6 Stale labs

| Rule | Code | Test |
| --- | --- | --- |
| >30 days = stale; exactly 30 = not stale; 31 = stale | `stale-lab.ts: STALE_LAB_THRESHOLD_DAYS, isLabStale` | "Test 2: exactly 30 days old is NOT stale (boundary)", "Test 3: 31 days old IS stale" |
| Fresh lab not stale; missing/unparseable date treated as stale | `stale-lab.ts` | "Test 1…not stale", "Test 4: a missing/unparseable date is treated as stale" |
| Null `LabValue` is absent (not stale) | `isLabValueStale` | "a null lab is absent, not stale" |

### 4.7 Recommendation orchestration (`recommendation.ts: generateRecommendation`)

| Decision | Code path | Test |
| --- | --- | --- |
| Excluded population → `overallAction:"excluded"`, no options | early return on `CancerCategory.EXCLUDED` | "excluded population (myeloma) → overallAction 'excluded'" |
| Khorana <2 → `not_indicated` | threshold gate | "Khorana <2 → not_indicated" |
| Universal absolute → `contraindicated`, no options | `universalAbsolute.length>0` | "universal absolute contraindication… → contraindicated" |
| Both DOACs blocked → **LMWH alternative; never dabi/edox** | `PROPHYLAXIS_DOACS` vs `REFERENCE_DOACS`; `LMWH_AGENTS` fallback | "ERRATA Issue 4: major DDI on both DOACs → LMWH fallback, no dabi/edox option" |
| HIT → LMWH removed, DOACs remain preferred | targeted-block filter | "ERRATA Issue 9: HIT blocks LMWH but DOACs remain the recommendation" |
| Clean high-risk → recommend apixaban + rivaroxaban | full option build | "high-Khorana pancreatic patient with no DDI → recommend apixaban + rivaroxaban" |

---

## 5. Errata compliance (the 10 authoritative issues)

| # | Errata requirement | Implemented in | Enforced by |
| --- | --- | --- | --- |
| 1 | Max Khorana score = 6 | `khorana-engine.ts: MAX_KHORANA_SCORE`, cap | "Test 15…capped at 6" |
| 2 | Risk tiers + prophylaxis at ≥2 — **see supersession note below** | `khorana-engine.ts: riskCategoryForScore` | "Test 20…score 1 is Intermediate", "maps 0→low; 1,2→intermediate; 3+→high" |
| 3 | camelCase domain fields throughout | `src/types/*` | typecheck (strict) |
| 4 | Only apixaban/rivaroxaban are prophylaxis options; LMWH fallback; never dabi/edox | `recommendation.ts: PROPHYLAXIS_DOACS / REFERENCE_DOACS`; `doac-renal-thresholds.ts` | "ERRATA Issue 4…" (recommendation + integration P2) |
| 5 | ICD-10 prefix matching | `icd10-cancer-map.ts: classifyIcd10` | khorana-engine suite |
| 6 | KB camelCase + `sources` field | `ddi-knowledge-base.json`, `types/ddi.ts: DDIEntry` | typecheck |
| 7 | `checkDDIs()` full per-DOAC shape; severity ranking | `ddi-checker.ts` | ddi-checker suite (Tests 1–7) |
| 8 | Renal: 6-entry array + lookup helper | `doac-renal-thresholds.ts`, `renal-dosing.ts` | "Test 6/7" (renal) |
| 9 | `appliesTo`-aware contraindications | `contraindications.ts` | "Test 4/9" (contraindications) |
| 10 | snake_case reasons + nested result shapes | `types/contraindication.ts`, `types/khorana.ts` | "Test 16" (khorana), contraindication suite |

> **Supersession note (Issue 2 — risk-tier labels, 2026-06-13).** The errata
> draft relabeled the Khorana risk tiers as *0–1 Low, 2 Intermediate, ≥3 High*,
> calling the original *1–2 Intermediate* "incorrect." On clinical review this
> was reversed: the original Khorana model (Khorana et al., *Blood* 2008) and
> the **NCCN VTE-C** table both define **0 Low, 1–2 Intermediate, ≥3 High**, so
> the published tiering is restored. This is a **labeling change only** — the
> actionable prophylaxis threshold remains **≥2** in both schemes, so no
> patient's recommendation changes; only the tier label shown for a score of 1
> moves from "Low" to "Intermediate." Errata file annotated accordingly.
>
> **Additional note (score range).** Connors (*NEJM* 2014) states the Khorana
> range is "0 to 7"; the correct maximum from the component weights
> (2+1+1+1+1) is **6**, consistent with the original model, NCCN, ASCO, and the
> AVERT trial. The engine caps at 6 (Issue 1); the 0–7 figure is a known error
> in that review and is noted here to preempt reviewer questions.

---

## 6. Synthetic-patient evidence (end-to-end)

Each patient is a real FHIR R4 bundle parsed through the identical
`assemblePatientData → generateRecommendation` pipeline. Reference date for the
suite is fixed at `2026-06-10T12:00:00Z`. File: `tests/integration/patients.test.ts`.

| # | Patient | Expected output (asserted) |
| --- | --- | --- |
| 1 | Maria Santos (C25.1 pancreas) | Khorana **5 High**; apixaban+rivaroxaban preferred; CrCl ~**115** normal; nab-paclitaxel (686924) **minor**, non-blocking |
| 2 | James Chen (C83.1 NHL) | Khorana **2**; ibrutinib **major** on both DOACs → preferred empty, **enoxaparin+dalteparin** alternative; **no dabigatran/edoxaban** offered; rituximab none |
| 3 | Dorothy Williams (C34.1 lung) | Khorana **3 High** but platelets **42K** → `contraindicated` (universal absolute); CrCl **12.9** severe; carboplatin nephrotoxic warning |
| 4 | Robert Johnson (C18.4 colon) | Khorana **0** → `not_indicated`; labs **stale** (>30d); bevacizumab **pharmacodynamic** |
| 5 | Priya Patel (C90.00 myeloma) | Khorana **excluded**; `onIMiD` true (lenalidomide); dexamethasone surfaced **moderate** |

> **Documented discrepancy:** the plan's hand arithmetic states Maria's CrCl as
> 115.5; the correct Cockcroft-Gault value for weight 95 kg is **~115.0**, which
> the engine computes. The test asserts the computed value, not the plan's
> rounding.

---

## 7. FHIR & SMART conformance

- **Resources read:** Patient (read), Condition / Observation / MedicationRequest (search) — declared in `public/capability-statement.json` (R4 client CapabilityStatement, `kind: requirements`).
- **Codings:** ICD-10-CM (`http://hl7.org/fhir/sid/icd-10-cm`), LOINC (`loinc-codes.ts`), RxNorm (`rxnorm-codes.ts`), US Core race/ethnicity extensions parsed in `fhir-parser.ts: extractOmbDisplay`.
- **Unit conversions:** weight lb→kg ×0.453592, height in→cm ×2.54 (`fhir-parser.ts: parseVitals`).
- **SMART launch:** `public/launch.html` → `FHIR.oauth2.authorize()`; app → `FHIR.oauth2.ready()` (`smart-launch.ts`). Scopes: `launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read openid fhirUser`.
- **Resilience:** every parser returns `null` rather than throwing on missing data, so a sparse chart still yields a well-formed `PatientData`.

## 8. CDS Hooks conformance

- **Discovery:** `GET /cds-services` → 2 services (`discovery.ts`). Test: "advertises a patient-view and an order-select service".
- **`patient-view` (`oncovte-prophylaxis`):** summary card + one card per critical/warning alert; 140-char summary cap enforced. Tests: Maria/James/Dorothy/Priya card assertions.
- **`order-select` (`oncovte-ddi-check`):** screens the order being composed against active therapy. Tests: "ordering apixaban for a patient on ibrutinib flags a critical interaction", "…clean patient produces no interaction cards".
- **Prefetch:** templates declared per service; `prefetch.ts` adapts the prefetch block into `RawFHIRData` (same pipeline as SMART/standalone) and degrades missing bundles gracefully. Tests: "throws when the Patient resource is absent", "degrades missing search bundles to empty bundles".

---

## 9. Known limitations & deferred items (full disclosure)

1. **Special-notes DDI agents — now included.** Doxorubicin (3639),
   vinblastine (11198), etoposide (4179), and tamoxifen (10324) were added from
   the plan's Part 3C clinical content (52 agents total). Resolving their codes
   surfaced a latent defect: `10324` had been mis-assigned to thalidomide in the
   IMiD set, when `10324` is **tamoxifen** (thalidomide is `10400`). This was
   corrected in `rxnorm-codes.ts` and is locked by a regression test
   (`tests/data/rxnorm-codes.test.ts`) so a tamoxifen patient is never falsely
   flagged `onIMiD`. Any RxNorm code still absent from the KB returns `unknown`
   with a "verify manually" recommendation rather than failing.
2. **Kidney cancer** is scored high-risk with an explicit advisory note that
   NCCN VTE-C names only bladder/testicular (clinical interpretation flagged,
   not hidden).
3. **Live demo uses the real current date** (`new Date()`); the test suite pins
   a fixed reference date for determinism. Staleness in the live demo therefore
   advances over time by design.
4. **Active major bleeding** has no single diagnosis code; it is modeled as a
   clinician-set boolean (`hasActiveMajorBleeding`), not auto-detected from FHIR.
5. **DDI knowledge base is curated** from supplied structured clinical input and
   published labeling; it is not a substitute for a maintained interaction
   service and is scoped to the agents listed in `ddi-knowledge-base.json`.

---

## 10. Clinical safety statement

OncoVTE Guard provides **clinical decision support only** and does not replace
clinical judgment. Recommendations derive from NCCN Cancer-Associated VTE
(VTE-B) guidance, the Khorana model, and published DOAC interaction literature;
they must be verified against the most current guidelines. All medication,
laboratory, and diagnosis data must be confirmed against the source record
before acting. All demonstration data is synthetic and contains no PHI.
