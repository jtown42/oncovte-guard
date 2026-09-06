# OncoVTE Guard — Complete Narrative & Evidence Brief

> **What this document is.** A single, self-contained brief on the entire OncoVTE
> Guard project, written so a capable clinical-evidence AI (OpenEvidence) or an
> expert reviewer can (1) help choose the **strongest competition narrative**, (2)
> **stress-test every clinical claim against current evidence**, and (3) tell us
> where we should **polish vs. make a major readjustment** before submission.
> You do **not** need repository access — everything is here.

---

## 0. What we are asking you to do

We are entering **OncoVTE Guard** in the **AMIA / HL7 FHIR App Competition
(Student category), 2026 Annual Symposium, Dallas TX.** It will be **presented
live and in person** on Nov 10. We have built the app and the submission text.
What we want from you now, in priority order:

1. **Narrative.** Given the full project below and the judging rubric in §2, what
   is the single most compelling, defensible narrative to win this competition?
   React to the candidate narratives in §7 — endorse, combine, or replace them.
   Tell us the *one sentence* the judges should remember.
2. **Evidence stress-test.** Hold every clinical claim (§4, §9) to current
   literature and guidelines. Flag anything wrong, outdated, overstated, or
   citable more strongly. Answer the specific evidence questions in §10.
3. **Polish vs. readjust.** For each finding, tell us whether it is a wording
   polish or a substantive change we should make before we submit.

**Two hard constraints you must respect:**

1. **NCCN content is licensed and must NOT be reproduced.** We cite NCCN by
   section name only (e.g., "NCCN VTE-B"). Do not reconstruct NCCN tables or
   algorithms in your answer; reason from primary literature and general clinical
   knowledge, and cite NCCN by name where relevant.
2. **All demonstration data is synthetic (no PHI).** There is **no** real-world
   patient data, **no** clinician validation, and **no** live deployment usage.
   The honest headline is *"provably consistent,"* never *"clinically validated."*
   Do not help us claim otherwise — and flag anywhere our own text drifts toward
   overclaiming.

---

## 1. One-paragraph summary

OncoVTE Guard is a **SMART-on-FHIR clinical decision support app** with a
companion **CDS Hooks service** for **primary pharmacologic VTE prophylaxis in
ambulatory cancer patients.** It ingests FHIR R4 data and runs it through one
deterministic clinical engine that classifies the cancer site, computes the
Khorana risk score against the prophylaxis threshold, screens 52 antineoplastic
agents for per-DOAC drug interactions, computes renal dosing, and evaluates
`appliesTo`-scoped contraindications — producing **one of five terminal
recommendations**, each source-attributed. It is a **pre-deployment student
prototype** (0 users, 0 patients, synthetic data only). Its distinguishing move
is treating **clinical accuracy as a testable, auditable property**: 185
automated tests and a rule→source→code→test traceability matrix.

**Live demo:** https://oncovte-guard.pages.dev · **Source:**
https://github.com/jtown42/oncovte-guard

---

## 2. The competition and the de-facto judging rubric

This is a FHIR *App* competition judged by informaticians, not a clinical-trial
review. The portal's required fields reveal exactly what is scored — treat these
as the rubric to write toward:

| Judged dimension (from the portal fields) | What they are really asking |
|---|---|
| **Rationale, impact & innovation** | Is the problem real and important? Who is affected? What is the morbidity/mortality/scale impact? **What is genuinely novel here?** |
| **Design & implementation** | Is the engineering sound and the design responsive to the stated problem? What does it take to deploy it? |
| **Evaluation & sustainability** | What evidence did you gather (quant + qual)? Did it meet its goals? How is it maintained over time? |
| **Data Validation** | Do you validate required fields, flag stale/inconsistent data, enforce standard terminology (right code in the right resource type), and surface provenance? |
| **FHIR usage** | How real and standards-faithful is the FHIR use — release, resources, SMART/CDS Hooks, US Core? |

**Format that matters for narrative:** it is judged **live and in person** to an
informatics audience. That rewards a crisp, memorable demo moment and a claim the
audience can *verify*, not just believe. **Category is Student** — the bar is
"exceptional rigor and clarity for a student," and a **signed advisor attestation**
of the student's own authorship is required.

---

## 3. What the app does (the five terminal decisions)

The engine runs a fixed pipeline and lands in exactly one of five states:

1. **`excluded`** — cancer is in a population where Khorana does not apply
   (multiple myeloma / plasma-cell neoplasm, **acute** leukemias, myeloproliferative
   neoplasms, primary/metastatic brain tumor) → routes to the disease-specific
   pathway instead of scoring.
2. **`not_indicated`** — Khorana < 2 → routine prophylaxis not indicated.
3. **`contraindicated`** — a **universal** absolute contraindication (active major
   bleeding, or platelets < 50,000/µL) → no pharmacologic option presented.
4. **`recommend`** — Khorana ≥ 2, no universal contraindication, at least one
   preferred DOAC survives interaction/renal/targeted-contraindication filtering.
5. **`caution` / LMWH fallback** — both preferred DOACs are blocked but LMWH is
   eligible → LMWH recommended (a distinct verdict), or relative cautions apply.

**Prophylaxis DOACs are apixaban and rivaroxaban only.** Dabigatran and edoxaban
are reference-only (shown in the interaction/renal matrices, never recommended for
prophylaxis). If both preferred DOACs are blocked, the engine **falls back to
LMWH — never to dabigatran/edoxaban.**

---

## 4. The clinical logic in full (all thresholds are exact, from code)

### 4.1 Cancer-site classification (ICD-10-CM → Khorana site category)
Hierarchical prefix matching; exclusions checked first.
- **Very high (+2):** gastric `C16`, pancreatic `C25`.
- **High (+1):** lung `C34`; Hodgkin `C81`; NHL `C82–C86`; ovarian `C56`;
  uterine `C54/C55`; cervical `C53`; other gynecologic `C51/C52/C57/C58`; bladder
  `C67`; testicular `C62`.
- **Standard (0):** all other malignancies (colon, breast, prostate, etc.).
  **Renal-cell carcinoma `C64` scores 0** (see divergence note below).
- **Excluded (disease-specific pathway):** myeloma `C90.0–C90.3`; acute leukemias
  (`C91.0, C92.0, C92.4–6, C92.A, C93.0, C94.0, C95.0` — chronic CLL/CML are
  deliberately NOT excluded); MPN `D45, D47.1, D47.3, D47.4`; brain `C71, C79.31`.

**Deliberate divergences (we want your judgment on these):**
- **RCC (C64) is NOT scored (0 pts)** — we match the guideline naming only bladder
  and testicular. Scoring RCC could by itself cross the ≥2 threshold and flip the
  decision, so we surface elevated-risk concern as an **advisory note only** and
  additionally list metastatic RCC as a **bleeding-risk factor**. Renal
  pelvis/ureter (C65/C66/C68) likewise not scored.
- **Lung** carries an advisory that Khorana discriminates weakly in lung
  specifically (van Es IPD meta-analysis: OR ~1.1 in lung vs ~3.2 elsewhere,
  P-interaction 0.002). Score unchanged; caveat surfaced.
- **Pancreatic** carries a similar contested-discrimination advisory.

### 4.2 Khorana VTE risk score (max 6)
| Criterion | Scores when | Points |
|---|---|---|
| Cancer site | very-high / high | +2 / +1 |
| Platelets | ≥ 350 ×10⁹/L | +1 |
| Hemoglobin | < 10.0 g/dL **or** on an ESA | +1 |
| WBC | > 11 ×10⁹/L | +1 |
| BMI | ≥ 35 kg/m² | +1 |

- Boundaries are explicit and unit-tested (platelets exactly 350 score; Hgb
  exactly 10.0 does not; WBC exactly 11.0 does not; BMI exactly 35 scores).
- **Risk tiers:** 0 = Low, 1–2 = Intermediate, ≥3 = High.
- **Actionable threshold: prophylaxis is indicated at Khorana ≥ 2** (and not
  excluded) — the prophylaxis cut point aligned with AVERT/CASSINI inclusion,
  explicitly distinct from the original ≥3 high-risk label. The app states it uses ≥2.
- Missing labs are non-scoring (0), recorded, and flag the assessment incomplete
  (never throws). ESA use can satisfy the hemoglobin criterion without a value.

### 4.3 DOAC–chemotherapy interaction engine
- **52 agents**, indexed by RxNorm, each with a **per-DOAC** profile (apixaban,
  rivaroxaban, dabigatran, edoxaban): mechanism, severity, management.
- **Severity ordering (worst-wins):** major > moderate > pharmacodynamic > minor >
  none > unknown. Unknown RxNorm → `unknown` for every DOAC, surfaced as "verify
  manually," never silently dropped.
- **Knowledge-base provenance (kbVersion 1.0.0):** curated from two secondary
  references — the **AHA 2022 cardio-oncology drug-interactions Scientific
  Statement** and **Hellfritzsch et al. 2024** — **plus FDA DOAC labeling** for the
  azole antifungals. The per-agent `sources` array is a **KB-level attestation, not
  a per-interaction citation.** The **16 recommendation-changing `major` cells** (8
  agents × apixaban/rivaroxaban) are **individually evidence-anchored.** The review
  date is the **author's curation date and explicitly does NOT denote clinician
  validation.**
- **We acknowledge this module carries the most clinical uncertainty:** the
  DOAC–anticancer interaction evidence base is thin and CDS sources disagree
  substantially (e.g., Nowinski & Chaireti 2025: ~35% of 240 pairs flagged by ≥1
  source, frequent disagreement). Our defense is **transparency about a single
  named source set**, not a claim of independent validation.

### 4.4 Renal function & dosing
- **Cockcroft-Gault** CrCl, computed only when both weight and serum creatinine are
  present; otherwise "renal function not assessable" (no guessing). Numeric guards
  prevent divide-by-zero/negatives.
- All six anticoagulants reported for a complete picture.
- **CrCl < 30:** rivaroxaban → avoid; LMWH → avoid; apixaban → caution (trials
  excluded <30); dabigatran/edoxaban → avoid. Bands: <30 critical, 30–49
  dose-adjust/monitor. Warnings for active nephrotoxic chemo and low body weight.

### 4.5 Contraindications — the `appliesTo` model (a core differentiator)
Each contraindication carries an **`appliesTo` scope**: `"all"` (universal) or a
list of specific agents (targeted). **Only a universal absolute contraindication
aborts the pipeline; a targeted one removes just the affected agent(s)** and lets
the engine steer to the next-best option.

**Absolute:**
- **Active major bleeding** → universal (clinician-confirmed boolean; no reliable
  single FHIR code).
- **Severe thrombocytopenia < 50,000/µL** → universal.
- **Antiphospholipid syndrome `D68.61`** → **targeted to the DOAC class** (DOACs
  cause excess arterial thrombosis vs VKA — TRAPS; the class is contraindicated,
  VKA preferred). **LMWH remains and the engine falls back to it.**
- **Pregnancy / breastfeeding** (`O*`, `Z33.1`, `Z3A`, `Z39.1`) → **targeted to the
  DOAC class** (placental transfer / milk excretion; LMWH is standard in pregnancy).
- **Severe hepatic impairment — per-agent**, as multiples of each lab's own ULN:
  apixaban ALT/AST >3× **or** bilirubin >2×; rivaroxaban ALT/AST >3×; dabigatran
  ALT/AST >2×; edoxaban ALT/AST >3× **and** bilirubin >2× (conjunctive). Targeted
  (blocks the affected DOAC → LMWH remains). Only the lab-based arm is automated;
  Child-Pugh / cirrhosis / active hepatitis are surfaced as a clinician caveat.
- **HIT `D75.82`** → **targeted to LMWH only** (blocks enoxaparin/dalteparin; DOACs
  remain and are preferred). *This is the clearest showcase of the model.*
- **Weight < 40 kg** → **targeted to apixaban only**; rivaroxaban/LMWH still
  available.

**Relative (cautions):** luminal GI/GU tumor `C15/C16/C67`; brain tumor; myeloma on
an IMiD; concurrent antiplatelet.

### 4.6 Bleeding-risk panel (qualitative — explicitly NOT a score)
A separate panel lists individually-sourced qualitative bleeding-risk factors
(anemia, severe renal impairment, thrombocytopenia, GI/GU tumor site,
antiplatelet/NSAID/steroid use, prior major bleeding, frailty). The UI states
plainly that **no validated bleeding score exists for primary prophylaxis in this
population** (published CAT bleeding scores reach c-statistics ~0.50–0.70 and were
derived in treatment, not prophylaxis, cohorts). It is weighed clinically against
Khorana thrombotic risk.

---

## 5. FHIR / interoperability

- **Release:** R4 (4.0.1).
- **Resources read:** `Patient` (demographics, US Core race/ethnicity extensions),
  `Condition` (active malignancy by ICD-10-CM), `Observation` (platelets, Hgb, WBC,
  creatinine, ALT, AST, bilirubin, weight, height by LOINC), `MedicationRequest`
  (active meds by RxNorm).
- **Resource-type & code-system strict:** diagnoses only from `Condition` +
  ICD-10-CM; labs/vitals only from `Observation` + LOINC; meds only from
  `MedicationRequest` + RxNorm with **`status=active` only**. A diagnosis cannot be
  mistaken for a procedure, etc. Terminology precision is test-locked.
- **Two FHIR technologies:**
  - **SMART on FHIR** (SMART App Launch, OAuth2) — the interactive dashboard.
  - **CDS Hooks** — `oncovte-prophylaxis` (**patient-view**, on chart open) and
    `oncovte-ddi-check` (**order-select**, on anticoagulant/chemo order); resources
    via prefetch.
- A client **CapabilityStatement** declares exactly these four resources.
- **US Core:** parses race/ethnicity extensions; does **not** claim full US Core
  conformance (deliberately narrow, honest claim).
- **Data source:** production = live SMART API for the launch patient; demo = **five
  synthetic FHIR R4 bundles (no PHI)** through the *identical* pipeline.

---

## 6. Architecture, engineering & evaluation

- **Stack:** TypeScript (strict), React 18, Vite; Express (CDS Hooks); Vitest.
- **Dual-surface, one engine:** the SMART dashboard and the CDS Hooks service both
  consume the **same pure clinical engine** — "identical by construction," so the
  two surfaces cannot diverge.
- **Knowledge externalized** into versioned data files (DDI KB JSON, ICD-10 map,
  code sets, per-agent renal/hepatic thresholds), so a guideline/labeling update is
  a **data edit, not a code rewrite**, immediately re-verified by its tests.
- **Evaluation (guideline fidelity, not usage metrics):**
  - **185 automated tests, 15 files, all passing** — every Khorana boundary, the
    52-agent DDI checker, Cockcroft-Gault, `appliesTo` contraindications, stale-lab
    detection, the orchestrator, RxNorm integrity, the CDS Hooks card builder.
  - **Five synthetic FHIR patients** exercise all five states end-to-end:
    1. **Maria Santos** — pancreatic → **recommend** (clean).
    2. **James Chen** — NHL on ibrutinib → **LMWH fallback** (both DOACs blocked by
       a major DDI). *(the demo centerpiece)*
    3. **Dorothy Williams** — lung, platelets <50k + severe renal → **contraindicated**.
    4. **Robert Johnson** — low Khorana, stale labs → **not indicated**.
    5. **Priya Patel** — myeloma on an IMiD → **excluded**.
  - **Traceability matrix:** rule → guideline source → code → test — a reviewable
    artifact letting a judge independently confirm guideline fidelity.
  - **Static gates:** TS strict clean; production build succeeds.
  - **Accessibility:** every text/background pair passes a measured WCAG 2.1 AA
    contrast audit (tightest 4.72:1).
  - **Prospective validation plan (stated, not yet run):** appropriate-prophylaxis
    rate, symptomatic VTE, major bleeding, alert override/fatigue.

---

## 7. The narrative problem — candidate angles (react to these)

We believe **narrative wins this competition**, and the app has four genuine
differentiators. Candidate narratives, for you to endorse / combine / replace:

- **A. "Verifiable CDS — the anti-black-box."** Every recommendation traces to a
  guideline line, a line of code, and a passing test. In an era of unverifiable AI
  CDS, this app makes correctness *auditable*. (Leans on the traceability matrix +
  185 tests + "provably consistent.")
- **B. "One engine, where clinicians already work."** The same tested reasoning
  drives both a SMART dashboard (pull) and CDS Hooks alerts (push) — identical by
  construction. (Interoperability / adoption story.)
- **C. "Surgical safety logic, not blunt alerts."** The `appliesTo` model + LMWH
  fallback: HIT removes only LMWH; APS/pregnancy remove only the DOAC class; the
  engine narrows to the safe option instead of aborting — it reasons like a
  pharmacist. (Best live-demo moment: James → LMWH fallback.)
- **D. "The honest entry."** A three-tier claim standard that refuses to overclaim
  and names its own uncertainty. Credibility texture for an informatics audience.

**Our working recommendation (challenge it):** lead with **A (verifiable CDS)** as
the spine, *prove* it live through **C (the surgical LMWH-fallback moment)**, cite
**B (dual-surface)** as the interoperability payoff, and let **D (honesty)** be the
credibility texture throughout. One-sentence hook candidate:
> *"OncoVTE Guard turns cancer-VTE prophylaxis guidance into a decision you can
> audit — every recommendation traces to a guideline, a line of code, and a test
> that proves it — delivered identically to the dashboard and the order screen."*

**Questions for you:** Is that the winning frame? Is there a stronger one we are
missing? What single sentence should the judges remember? Is leaning on "honesty /
we don't overclaim" an asset or a liability in front of this audience?

---

## 8. Current positioning already written (what's live vs. corrected)

- **Promotional title (live):** *"When Chemo Meets Anticoagulation: A FHIR-Powered
  Engine That Thinks Through Cancer VTE Prophylaxis So Clinicians Don't Have to Wing
  It."*
- **Abstract — CORRECTED version we are about to submit** (the currently-live portal
  copy wrongly says "second leading cause" and "121 tests"; corrected copy says **"a
  leading cause"** and **185 tests**):
  > Cancer-associated VTE is a leading cause of death in patients with cancer, and
  > active malignancy raises VTE risk four- to sevenfold. Landmark trials (AVERT,
  > CASSINI) and their pooled analysis show targeted DOAC prophylaxis reduces VTE in
  > higher-risk ambulatory patients, yet safe prescribing demands a clinician
  > simultaneously compute a Khorana score, screen DOAC–chemo interactions across
  > CYP3A4/P-gp, assess renal function, and evaluate contraindications — cognitive
  > load rarely carried reliably in one encounter. [App description + 185-test /
  > traceability-matrix evaluation.]
- **Twitter (140):** "SMART on FHIR + CDS Hooks engine that scores cancer VTE risk
  and flags DOAC-chemo interactions, with 185 tests proving guideline fidelity."

**Question for you:** does the corrected positioning maximize impact, or should the
hook change to match whatever narrative you recommend in §7?

---

## 9. Claims & honesty standard (hold this to account)

- **A-tier (evidence-based, guideline-anchored):** the directional rules — Khorana
  ≥2 threshold; agent selection (apixaban/rivaroxaban preferred, LMWH fallback);
  renal cutoffs; categorical contraindications (platelets <50k; weight <40 kg for
  apixaban).
- **B-tier (curator-mediated):** the DDI knowledge base — source-attributed, 16
  major cells anchored, but **not** independently validated; inherits the
  literature's uncertainty.
- **C-tier (true by construction, not clinical efficacy):** "185 tests pass,"
  "dual-surface identical by construction," "provably consistent."

**The honest headline is "provably consistent," NOT "clinically validated."** No
clinician validation, no live-EHR evaluation, no real users. Please flag anywhere
our language drifts toward "validated," "proven," or "usable."

---

## 10. Clinical-evidence questions for you (your sweet spot)

Please answer each with current evidence and the strongest citable sources, and say
whether it implies a **polish** or a **substantive change**:

1. **Mortality framing.** Is *"a leading cause of death"* the best-supported
   statement for cancer-associated VTE? Is *"second leading cause"* defensible with
   a solid primary source, or is the conservative wording correct?
2. **Khorana ≥2 vs ≥3.** What is the strongest current evidence/guideline basis for
   offering prophylaxis at **≥2** (AVERT/CASSINI inclusion) rather than the original
   ≥3 high-risk cut point? Is calling ≥2 "the prophylaxis threshold" defensible?
3. **CASSINI / efficacy framing.** Confirm the honest way to claim efficacy is the
   **pooled analysis of AVERT + CASSINI** (RR ~0.56, 95% CI 0.35–0.89), given
   CASSINI's primary endpoint over the full period was not statistically significant
   (HR 0.66, 95% CI 0.40–1.09) and was significant only on-treatment (HR 0.40,
   0.20–0.80). Are there newer pooled/meta-analytic numbers we should cite?
4. **DDI evidence base.** Is **AHA 2022 + Hellfritzsch 2024 + FDA labeling** a
   defensible basis for a 52-agent per-DOAC interaction table, given documented
   inter-source disagreement? Is there a **stronger or more recent consensus source**
   (updated ISTH/ITAC, ASCO, ESC cardio-oncology) we should add or defer to?
5. **APS + DOACs.** Confirm the strength of evidence (TRAPS; meta-analyses) for
   contraindicating the **DOAC class** in antiphospholipid syndrome with VKA/LMWH
   preferred. Any nuance by single/double/triple positivity we should reflect?
6. **RCC non-scoring.** Confirm the risk model scores only bladder and testicular
   among GU cancers (i.e., RCC should not score). Is there evidence RCC elevates VTE
   risk enough to justify our advisory-only treatment?
7. **Lung discrimination.** Confirm Khorana discriminates weakly in lung cancer
   specifically (van Es IPD meta-analysis) — is our advisory accurate?
8. **Currency check.** Are there **2024–2026 guideline updates** (NCCN by name only,
   ITAC/ISTH, ASCO, ACC/ESC) that would **change any rule above** or that we should
   cite to demonstrate the app is current?
9. **Anything we got wrong** that a thrombosis/oncology expert would immediately
   catch — ranked by clinical severity.

---

## 11. Evidence base as currently cited (verify these)

- **Burden:** active malignancy raises VTE risk ~4–7×; VTE described as *a leading
  cause of death* in cancer patients.
- **Prophylaxis efficacy:** **AVERT** (apixaban 2.5 mg BID, Khorana ≥2): VTE 4.2% vs
  10.2%, HR 0.41 (95% CI 0.26–0.65), with more major bleeding (3.5% vs 1.8%, HR 2.00,
  1.01–3.95). **CASSINI** (rivaroxaban 10 mg, Khorana ≥2): primary endpoint over the
  full period NOT significant (HR 0.66, 0.40–1.09); significant on-treatment (HR 0.40,
  0.20–0.80). **Pooled:** RR ~0.56 (0.35–0.89) without a significant major-bleeding
  increase. **We credit the pooled analysis, not each trial's primary result.**
- **Risk model:** Khorana et al., *Blood* 2008.
- **Guideline anchors (named only):** NCCN Cancer-Associated VTE Disease (v1.2026);
  ITAC 2019/2022; ACC 2026 DOAC statement; AHA 2022 cardio-oncology drug
  interactions; Hellfritzsch et al. 2024; FDA DOAC labeling.
- **Epidemiology:** Lam BD et al. *Am J Hematol.* 2026;101(5):1005–1018.
  doi:10.1002/ajh.70271 (contemporary US CAT epidemiology, Epic Cosmos).

---

## 12. Where we'll accept a major readjustment vs. polish

- **Open to major change:** the winning narrative/hook; whether to foreground the
  DDI KB (our weakest-evidence module) or lead with the traceable-engine story; the
  ≥2 threshold framing; any rule you show is clinically wrong.
- **Polish only (unless you show us otherwise):** wording of individual claims; which
  citations to add; the promotional title.
- **Fixed by constraint (cannot change):** no NCCN content reproduced; no claim of
  clinical validation or real-world use; synthetic-data-only; student authorship.
