# OncoVTE Guard — Master Specification for Expert Review

> **Purpose of this document.** This is a complete, self-contained specification of
> the OncoVTE Guard project, written so an expert reviewer (or a capable LLM) can
> assess it *rigorously and accurately without repository access*. Every clinical
> rule, threshold, data source, and claim below was transcribed directly from the
> implementation, not from marketing copy.

---

## 0. Instructions to the reviewer

Please review this project the way a **multidisciplinary expert panel** would —
combining the lenses of (1) a **thrombosis/oncology clinician**, (2) a **FHIR /
health-IT interoperability engineer**, (3) a **software architect**, and (4) a
**research-methods / evidence reviewer**. For each area:

- Verify the **clinical logic** against current guidelines (NCCN Cancer-Associated
  VTE Disease; ITAC 2019/2022; ACC 2026; AHA statements) and primary trials.
  Flag any threshold, direction, or claim that is wrong, outdated, or overstated.
- Scrutinize the **FHIR conformance** claims (resource typing, code systems,
  SMART, CDS Hooks, US Core) for correctness and completeness.
- Judge the **evaluation rigor** and whether the stated maturity matches the
  evidence.
- Hold every **claim** to a strict honesty standard: distinguish what is *proven*
  from what is *asserted by construction* from what is *curator-mediated*.

Be specific, cite where you disagree, and rank issues by clinical/technical
severity. Do **not** assume the summary is correct — challenge it.

**Two hard constraints for you, the reviewer:**
1. **NCCN content is licensed and MUST NOT be reproduced.** Do not quote or
   reconstruct NCCN guideline tables/algorithms. Reason from the primary
   literature and general clinical knowledge instead. Citations to NCCN by name
   are fine; reproducing its content is not.
2. **All demonstration data is synthetic (no PHI).** There is no real-world
   patient data, no clinician validation, and no live deployment usage.

---

## 1. What the project is

**OncoVTE Guard** is a **SMART-on-FHIR clinical decision support (CDS) application**,
with a companion **CDS Hooks service**, for **primary pharmacologic VTE prophylaxis
in ambulatory cancer patients**. It is a **student-category** entry to the AMIA /
HL7 FHIR App Competition (2026 Annual Symposium). It is a **pre-deployment
prototype**: 0 users, 0 patients impacted, no paying customers.

**What it does:** ingests a patient's FHIR R4 data and deterministically produces
**one of five terminal recommendations** for whether/what anticoagulant prophylaxis
to use, with every output source-attributed.

**What it explicitly does NOT do:** it does not treat established VTE (a
therapeutic-anticoagulation module is designed but deliberately deferred); it does
not claim clinical validation; it is not for clinical use without
pharmacist/clinician sign-off.

**Live demo:** https://oncovte-guard.pages.dev · **Source:**
https://github.com/jtown42/oncovte-guard

---

## 2. Clinical decision logic (the core to scrutinize)

The engine runs a fixed pipeline. All thresholds below are **exact values from the
code**, kept as named constants for auditability.

### 2.1 Cancer-site classification (ICD-10-CM → Khorana category)

Matching is **hierarchical prefix matching** on normalized (uppercase, trimmed)
ICD-10-CM codes. Exclusions are checked first and take precedence.

- **Very high risk (+2 pts):** gastric `C16`, pancreatic `C25`.
- **High risk (+1 pt):** lung `C34`; Hodgkin `C81`; non-Hodgkin lymphoma
  `C82–C86`; ovarian `C56`; uterine `C54/C55`; cervical `C53`; other gynecologic
  `C51/C52/C57/C58`; bladder `C67`; testicular `C62`; **renal-cell carcinoma `C64`
  only**.
- **Standard risk (0 pts):** any other malignant neoplasm (e.g., colon, breast,
  prostate).
- **Excluded (disease-specific pathway, NCCN VTE-2 — Khorana not applied):**
  multiple myeloma / plasma-cell neoplasm `C90.0–C90.3`; **acute** leukemias
  (`C91.0, C92.0, C92.4–6, C92.A, C93.0, C94.0, C95.0` — chronic CLL/CML are
  intentionally NOT excluded); myeloproliferative neoplasms `D45, D47.1, D47.3,
  D47.4`; primary/metastatic brain tumor `C71, C79.31`.

**Deliberate divergences the reviewer should judge (flagged in-code):**
- **Renal-cell carcinoma (C64) scored high-risk** is a *divergence from NCCN*,
  which names only bladder and testicular. Retained per a JACC/ASCO interpretation;
  self-graded **evidence grade C**; surfaced as an advisory note. Renal
  pelvis/ureter/other urinary (C65/C66/C68) are **not** scored.
- **Lung cancer** carries an advisory: Khorana's discrimination is weak in lung
  specifically (van Es et al. IPD meta-analysis: OR ~1.1 in lung vs ~3.2 elsewhere,
  P-interaction 0.002). Score unchanged; caveat surfaced.
- **Pancreatic** carries a similar contested-discrimination advisory. Score
  unchanged; caveat surfaced.

### 2.2 Khorana VTE risk score

Components (Khorana et al., *Blood* 2008), max score **6**:
| Criterion | Scores when | Points |
|---|---|---|
| Cancer site | very-high / high | +2 / +1 |
| Platelets | **≥ 350** ×10⁹/L | +1 |
| Hemoglobin | **< 10.0** g/dL **OR on an ESA** | +1 |
| Leukocytes (WBC) | **> 11** ×10⁹/L | +1 |
| BMI | **≥ 35** kg/m² | +1 |

- **Boundary behavior is explicit and unit-tested:** platelets exactly 350 score;
  hemoglobin exactly 10.0 does **not**; WBC exactly 11.0 does **not**; BMI exactly
  35 scores.
- **Risk tiers** (original Khorana / NCCN VTE-C labeling): 0 = Low, 1–2 =
  Intermediate, ≥3 = High.
- **Actionable threshold: prophylaxis is indicated at Khorana ≥ 2** (AND not
  excluded). *This is the ≥2 NCCN prophylaxis threshold, which aligns with the
  AVERT/CASSINI inclusion criteria — deliberately distinct from the original
  ≥3 high-risk cut point. The app is explicit about using ≥2.*
- Missing labs are treated as **non-scoring (0)** and recorded in `missingFields`;
  `isComplete=false` flags an incomplete assessment (conservative, never throws).
- ESA use can satisfy the hemoglobin criterion even without a hemoglobin value.

### 2.3 DOAC–chemotherapy interaction engine

- **52 antineoplastic/supportive agents**, indexed by RxNorm, each carrying a
  **per-DOAC** interaction profile for **apixaban, rivaroxaban, dabigatran,
  edoxaban** (mechanism, severity, management).
- **Severity ordering (worst-wins):** `major > moderate > pharmacodynamic > minor
  > none > unknown`. An unrecognized RxNorm code returns **`unknown`** for every
  DOAC and is surfaced as "verify manually" — never silently dropped, never throws.
- **Knowledge-base provenance (verified in `ddi-knowledge-base.json`), kbVersion
  1.0.0:** curated from **two secondary references — the AHA 2022 Scientific
  Statement (cardio-oncology drug interactions, Table 3) and Hellfritzsch et al.
  2024 (100 agents evaluated)** — **plus FDA DOAC labeling for the azole
  antifungals**, applied consistently across all 52 agents. The per-agent `sources`
  array is a **KB-level attestation, not per-interaction citation**. The **16
  recommendation-changing `major` cells** (8 agents × apixaban/rivaroxaban) are
  **individually anchored** via `evidenceAnchor`. The `lastReviewed` date is the
  **author curation date and explicitly does NOT denote clinician validation**.
- **Reviewer caution (acknowledged by the project):** the evidence base for
  DOAC–anticancer interactions is thin and CDS sources disagree substantially
  (e.g., Nowinski & Chaireti 2025 found ~35% of 240 pairs flagged by ≥1 source,
  with frequent disagreement). This module carries the most clinical uncertainty;
  the project's defense is transparency about its single named source set, not a
  claim of independent validation.

### 2.4 Renal function and dosing

- **Cockcroft-Gault** creatinine clearance. Computed **only when both weight and
  serum creatinine are present**; otherwise the app emits "renal function not
  assessable" rather than guessing. Numeric guards prevent divide-by-zero /
  negative inputs.
- **Six anticoagulants always reported** (apixaban, rivaroxaban, dabigatran,
  edoxaban, enoxaparin, dalteparin) for a complete renal picture.
- **CrCl < 30 mL/min rules (prophylaxis indication):** rivaroxaban → **avoid**;
  LMWH (enoxaparin/dalteparin) → **avoid**; apixaban → **caution** (trials
  excluded CrCl <30); dabigatran/edoxaban → avoid (and not NCCN prophylaxis
  options regardless).
- Additional CrCl bands surface alerts: <30 critical; 30–49 dose-adjust/monitor.
- Warnings: **nephrotoxic chemotherapy active** (e.g., cisplatin) and **low body
  weight <60 kg / sarcopenia** (Cockcroft-Gault may overestimate clearance).

### 2.5 Contraindications (absolute / relative, `appliesTo`-scoped)

The key design idea: each contraindication carries an **`appliesTo` scope** —
`"all"` (universal) or a list of specific agents (targeted). Only a **universal
absolute** contraindication aborts the whole pipeline; a **targeted** one removes
just the affected agent(s).

**Absolute:**
- **Active major bleeding** (clinician-confirmed boolean; FHIR has no reliable
  single code for it) → universal.
- **Severe thrombocytopenia < 50,000/µL** → universal (NCCN VTE-B-2 per-agent;
  VTE-F for DOACs).
- **Antiphospholipid syndrome** `D68.61` (triple-positive; DOACs failed in TRAPS)
  → universal.
- **Severe hepatic impairment — per-agent, NCCN VTE-D-5 (v1.2026):** thresholds
  expressed as multiples of each lab's **own ULN**. Apixaban: ALT/AST >3× **or**
  bilirubin >2×. Rivaroxaban: ALT/AST >3×. Dabigatran: ALT/AST >2×. Edoxaban:
  ALT/AST >3× **AND** bilirubin >2× (conjunctive). Targeted (blocks the affected
  DOAC, not anticoagulation universally → LMWH remains). Only the **lab-based
  arm** is automated; Child-Pugh / cirrhosis / active hepatitis require clinical
  assessment the app does not read — surfaced as a caveat in each detail string.
- **HIT** `D75.82` → **targeted to LMWH only** (blocks enoxaparin/dalteparin;
  DOACs remain and are in fact preferred). *This is the showcase of the
  `appliesTo` model.*
- **Weight < 40 kg** → **targeted to apixaban** (verbatim NCCN VTE-B-2 "avoid if
  weight <40 kg"); rivaroxaban/LMWH still available.

**Relative (cautions):** luminal GI/GU tract tumor `C15/C16/C67` (increased
hemorrhage; apixaban may be safer, consider LMWH); brain tumor (also a Khorana
exclusion); multiple myeloma on an IMiD (separate pathway); concurrent
antiplatelet.

### 2.6 Recommendation orchestration and the five terminal states

**Prophylaxis DOACs = apixaban and rivaroxaban ONLY.** Dabigatran and edoxaban are
**reference-only** (never presented as prophylaxis; appear only in the interaction/
renal matrices). If both preferred DOACs are blocked, the engine **falls back to
LMWH — never to dabigatran/edoxaban.**

Pipeline order → the five states:
1. **`excluded`** — cancer is in an excluded population (myeloma/acute leukemia/
   MPN/brain) → Khorana not applied; points to the disease-specific pathway
   (myeloma-on-IMiD gets a myeloma-specific prophylaxis pointer).
2. **`not_indicated`** — Khorana < 2 → routine prophylaxis not indicated.
3. **`contraindicated`** — a **universal** absolute contraindication (active
   bleeding, platelets <50k, APS) → no pharmacologic options presented.
4. **`recommend`** — Khorana ≥2, no universal contraindication, ≥1 preferred DOAC
   eligible after DDI/renal/targeted-contraindication filtering.
5. **`caution` / LMWH fallback** — both preferred DOACs blocked but LMWH eligible
   → LMWH recommended (distinct `recommend_lmwh` verdict label), or relative
   cautions present.

An agent is **ineligible** if: not an NCCN prophylaxis option; a targeted absolute
blocks it; renal status is "avoid"; **or** it has a **major** DDI with an active
medication.

### 2.7 Bleeding-risk panel (qualitative — NOT a score)

A separate panel lists individually-sourced qualitative bleeding-risk factors
(e.g., anemia, severe renal impairment, thrombocytopenia, GI/GU tumor site,
antiplatelet/NSAID/corticosteroid use, prior major bleeding, frailty, anorexia/
vomiting). It is **explicitly not a validated score** — the UI states that no
validated bleeding score exists for primary prophylaxis in this population
(published CAT bleeding scores achieve c-statistics ~0.50–0.70 and were derived in
*treatment*, not prophylaxis, cohorts). It is weighed clinically against the
thrombotic (Khorana) risk.

### 2.8 Data validation, terminology, provenance

- Labs/vitals carry `effectiveDateTime`; anything **>30 days old is flagged stale**
  (missing/unparseable date → treated as stale, conservatively); newest value used
  when duplicates exist.
- **Resource-type & code-system strict:** diagnoses only from `Condition` +
  ICD-10-CM (`http://hl7.org/fhir/sid/icd-10-cm`); labs/vitals only from
  `Observation` + LOINC (`http://loinc.org`); meds only from `MedicationRequest` +
  RxNorm (`http://www.nlm.nih.gov/research/umls/rxnorm`), **`status=active` only**.
  So a diagnosis can't be mistaken for a procedure, etc.
- Terminology precision is test-locked (e.g., RxNorm 10324 = tamoxifen, 10400 =
  thalidomide — a regression test prevents conflating a SERM with an IMiD).
- **Provenance surfaced today:** data timing/status + decision provenance (every
  recommendation/alert/card cites its rule and reference). **Not yet consumed:**
  the FHIR `Provenance` resource / `meta.source` (who entered a value) — a stated
  roadmap item.

---

## 3. FHIR / interoperability

- **FHIR release:** R4 (4.0.1).
- **Resources read:** `Patient` (demographics, sex, birthDate, US Core race/
  ethnicity extensions), `Condition` (active malignancy by ICD-10-CM), `Observation`
  (platelets, hemoglobin, WBC, creatinine, ALT, AST, bilirubin; weight/height by
  LOINC), `MedicationRequest` (active meds by RxNorm).
- **A client `CapabilityStatement`** (`public/capability-statement.json`) declares
  exactly these four resources and interactions.
- **Two FHIR technologies:**
  - **SMART on FHIR** (SMART App Launch, OAuth2) — the interactive dashboard,
    launched in-context from the EHR.
  - **CDS Hooks** — two services: `oncovte-prophylaxis` (**patient-view**, surfaces
    the assessment on chart open) and `oncovte-ddi-check` (**order-select**, checks
    interactions when an anticoagulant/chemo is ordered). Resources arrive via
    hook **prefetch**.
- **US Core:** the app **parses US Core race/ethnicity extensions** from `Patient`;
  it does **not** claim full US Core profile conformance/validation. (Honest,
  narrow claim.)
- **Data source:** production = live SMART-on-FHIR API for the launch patient;
  demo/testing = **five synthetic FHIR R4 bundles (no PHI)** run through the
  *identical* parsing pipeline, so demo and live modes behave the same.

---

## 4. Software architecture & engineering

- **Stack:** TypeScript (strict), React 18, Vite (dashboard); Express (CDS Hooks
  service); Vitest (tests). `fhirclient` handles SMART OAuth2.
- **Dual-surface, one engine:** the SMART dashboard and the CDS Hooks service
  consume the **same pure clinical engine** (`src/core/*`) — "identical by
  construction," so the two surfaces cannot diverge.
- **Separation of concerns:** clinical engines are decoupled from UI and transport.
  Knowledge is externalized into versioned data files (DDI KB JSON, ICD-10 cancer
  map, LOINC/RxNorm code sets, per-agent renal thresholds), so a guideline/labeling
  update is a **data edit, not a code rewrite**, and is immediately re-verified by
  the tests that encode it.

---

## 5. Evaluation

Because the central claim is **clinical accuracy**, evaluation targets **verifiable
guideline fidelity**, not usage metrics.

- **180 automated tests (Vitest), 14 files, all passing.** Cover Khorana scoring
  (incl. every boundary value), the 52-agent DDI checker, Cockcroft-Gault dosing,
  `appliesTo`-aware contraindications, stale-lab detection, the recommendation
  orchestrator, RxNorm code integrity, and the CDS Hooks card builder.
- **Five synthetic FHIR R4 patients** run end-to-end, asserting all five decision
  states:
  1. **Maria Santos** — pancreatic (C25.1) → **recommend** (clean).
  2. **James Chen** — NHL (C83.1) on ibrutinib → **LMWH fallback** (both DOACs
     blocked by a major DDI).
  3. **Dorothy Williams** — lung (C34.1), platelets <50k + severe renal impairment
     → **contraindicated**.
  4. **Robert Johnson** — low Khorana, stale labs, pharmacodynamic DDI → **not
     indicated**.
  5. **Priya Patel** — multiple myeloma (C90.00) on an IMiD → **excluded**.
- **Traceability matrix (`VERIFICATION.md`):** rule → guideline source → code →
  test, including ten authoritative-contract decisions. *This reviewable artifact
  is the project's headline differentiator.*
- **Static gates:** TypeScript strict compiles clean; production build succeeds.
- **Accessibility:** every text/background pair passes a measured WCAG 2.1 AA
  contrast audit (tightest 4.72:1).
- **Prospective validation plan (stated, not yet run):** appropriate-prophylaxis
  rate, symptomatic VTE, major bleeding, alert override/fatigue.

---

## 6. Claims & honesty standard (hold this to account)

The project uses a deliberate three-tier claim standard:
- **A-tier (evidence-based, guideline-anchored):** the *directional* clinical rules
  — Khorana ≥2 threshold, agent selection (apixaban/rivaroxaban preferred; LMWH
  fallback), renal cutoffs, the categorical NCCN contraindications (platelets <50k,
  weight <40 kg for apixaban).
- **B-tier (curator-mediated):** the DDI knowledge base — source-attributed at the
  KB level, 16 major cells individually anchored, but **not** independently
  validated and inheriting the underlying literature's uncertainty.
- **C-tier / engineering assertions (true by construction, not clinically
  validated):** "180 tests pass," "dual-surface identical by construction,"
  "provably consistent." These are software facts, not clinical efficacy.

**The honest headline claim is "provably consistent," NOT "clinically validated."**
The app has **no clinician validation, no live-EHR evaluation, and no real users.**
The interface is "designed for clinician readability with stated rationale and
measured contrast" — never "clinician-validated" or "proven usable."

---

## 7. Known limitations & deliberate scope decisions

- **Active major bleeding** is a clinician-confirmed boolean (FHIR has no reliable
  single representation) — determination stays with the clinician, but it still
  gates the recommendation.
- **Renal-cell carcinoma high-risk scoring** diverges from NCCN (grade C; see 2.1).
- **DDI module** carries the most clinical uncertainty (thin evidence, source
  disagreement); it is source-attributed, not validated.
- **No FHIR `Provenance` resource / `meta.source`** consumption yet (who entered a
  value) — roadmap item.
- **Therapeutic-anticoagulation (CAT-treatment) module deferred** — a structurally
  different engine (multi-phase regimens, parenteral lead-in, per-agent selection);
  designed against NCCN VTE-D/-F/-G but intentionally not shipped to preserve the
  fully-tested discipline of the prophylaxis entry.
- **No clinician think-aloud / usability study yet** (protocol written, participant
  pending); no timing/efficiency data.

---

## 8. Clinical evidence base (with the nuances a reviewer should check)

- **Cancer VTE burden:** active malignancy raises VTE risk ~4–7× (ITAC); commonly
  described as *a leading cause of death* in cancer patients. (The submission uses
  the conservative "a leading cause"; "second leading cause" is also supportable.)
- **Prophylaxis efficacy — the nuance:** **AVERT** (apixaban 2.5 mg BID, Khorana
  ≥2) significantly reduced VTE (4.2% vs 10.2%, HR 0.14) with more major bleeding
  (3.5% vs 1.8%). **CASSINI** (rivaroxaban 10 mg, Khorana ≥2): its **primary
  endpoint over the full 180-day period was NOT statistically significant** (HR
  0.66, 95% CI 0.40–1.09, p=0.10); benefit was significant only on-treatment (HR
  0.40). A **pooled analysis** of both shows a significant VTE reduction (RR ~0.56)
  without a significant increase in major bleeding. **The submission credits the
  pooled analysis, not each trial's primary result** — verify this framing is
  preserved wherever efficacy is claimed.
- **Risk model:** Khorana et al., *Blood* 2008 (development/validation).
- **Guideline anchors named:** NCCN Cancer-Associated VTE Disease (v1.2026, VTE-B
  family); ITAC 2019/2022; ACC 2026 DOAC statement; AHA 2022 cardio-oncology drug
  interactions (DDI source); Hellfritzsch et al. 2024 (DDI source); FDA DOAC
  labeling.
- **Epidemiology:** Lam BD, et al. *Am J Hematol.* 2026;101(5):1005-1018.
  doi:10.1002/ajh.70271 (contemporary US CAT epidemiology, Epic Cosmos).

---

## 9. Highest-scrutiny checklist (please probe these hardest)

1. **Khorana ≥2 threshold + population exclusions** — is the ≥2 (not ≥3) threshold
   correctly applied, and are myeloma/acute-leukemia/MPN/brain-tumor exclusions
   correctly routed off the Khorana pathway?
2. **DDI reference validity** — are AHA 2022 + Hellfritzsch 2024 + FDA labeling an
   adequate and correctly-applied basis for a 52-agent per-DOAC table, given known
   inter-source disagreement? Is the "curation date ≠ sign-off" disclosure
   sufficient?
3. **CASSINI framing** — is efficacy stated as the pooled result (correct) rather
   than implying CASSINI's primary endpoint was positive (incorrect)?
4. **Renal-cell carcinoma high-risk divergence (grade C)** — defensible, or should
   it be dropped to match NCCN?
5. **Per-agent hepatic thresholds (NCCN VTE-D-5)** — are the ULN-multiple cutoffs
   and the disjunctive/conjunctive logic (esp. edoxaban's AND) correct?
6. **`appliesTo` contraindication model** — does targeting (HIT→LMWH only,
   weight<40→apixaban only, per-agent hepatic) correctly avoid over-aborting?
7. **FHIR conformance** — resource typing, code systems, `status=active` filtering,
   CapabilityStatement completeness, CDS Hooks hook choices (patient-view /
   order-select), and the honest (narrow) US Core claim.
8. **Claim honesty** — anywhere the language drifts from "provably consistent"
   toward "validated," "proven," or "usable."
