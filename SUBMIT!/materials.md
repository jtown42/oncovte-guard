# OncoVTE Guard — AMIA / HL7 FHIR App Competition (Student) — Submission Answers

> Paste-ready. Every free-text field is within its stated limit. Bracketed **[ ]** items
> must still be supplied by the student/advisor before final submission (logo, headshot,
> advisor attestation, and citations for the epidemiology figures). Character counts are
> content-only (no trailing newline).

**Title:** OncoVTE Guard  ·  **Category:** Student

---

## Project rationale, impact and innovation
*Describe the problem/issue your submission is trying to address. What is the problem? Who does the problem affect? What is the impact (in terms of reduction of morbidity/mortality, number of people/patients affected, etc.) of solving the problem, both in the long as well as in the short term? In what ways is your project innovative?*

**≈ 3496 / 3500**

```text
THE PROBLEM. Venous thromboembolism (VTE) is a leading cause of death in people with cancer and accounts for roughly one in five of all VTE events. Active malignancy raises VTE risk about 4-7 fold, and many systemic therapies raise it further. Ambulatory patients receiving chemotherapy are a high-yield target for prevention, but blanket prophylaxis is inappropriate: anticoagulation must be reserved for patients whose thrombotic risk outweighs their bleeding risk. NCCN guidance therefore recommends risk-stratified prophylaxis using the validated Khorana score and endorses the DOACs apixaban and rivaroxaban as preferred oral options. The catch is that this decision is hard to make correctly at the point of care. In one sitting the clinician must (a) compute a multi-variable risk score from the diagnosis, a current CBC, and BMI; (b) know that DOACs are cleared through CYP3A4 and P-glycoprotein and that numerous antineoplastic and supportive-care drugs induce or inhibit these pathways enough to cause bleeding or therapeutic failure; (c) weigh renal function, thrombocytopenia, hepatic impairment, antiphospholipid syndrome, luminal GI/GU tumors, and heparin-induced thrombocytopenia; and (d) recognize the malignancies (myeloma, primary brain tumor, acute leukemia, myeloproliferative neoplasms) that fall outside the Khorana model entirely. Doing this reliably, for every patient, under time pressure, is exactly the kind of multi-factor, guideline-bound task that human memory offloads poorly.

WHO IS AFFECTED. The patients are approximately 2 million people newly diagnosed with cancer in the US each year, many of whom receive ambulatory systemic therapy. The clinicians are medical oncologists, hematologist-oncologists, oncology pharmacists, and advanced practice providers.

IMPACT. Cancer-associated VTE drives substantial morbidity, mortality, hospitalization, and cost, and it interrupts oncologic treatment. Randomized trials (AVERT, CASSINI) show that targeted DOAC prophylaxis in higher-risk ambulatory patients reduces VTE events; conversely, anticoagulating the wrong patient - one with severe thrombocytopenia, an active bleed, or a major DOAC drug interaction - causes preventable hemorrhage. In the short term, a tool that makes the guideline-concordant choice fast and explicit can raise appropriate prophylaxis rates and prevent unsafe anticoagulation at the individual encounter. In the long term, because the logic is reusable and scales across a very large population, small per-encounter improvements aggregate into meaningful reductions in preventable VTE, VTE-related death, bleeding harm, and treatment interruption.

INNOVATION. OncoVTE Guard is distinguished by four things. First, it unifies Khorana risk scoring with a structured, individually sourced 52-agent DOAC-chemotherapy interaction knowledge base in a single recommendation; most tools do one or the other. Second, its contraindication logic is "appliesTo"-aware: a condition such as HIT removes only the affected agents (LMWH) while leaving DOACs preferred, instead of bluntly aborting the assessment. Third, it is dual-surface - the exact same tested reasoning engine powers both an interactive SMART on FHIR dashboard (clinician pull) and a CDS Hooks service (EHR push) - so it meets clinicians where they already work. Fourth, it treats clinical accuracy as a testable property: every rule is backed by an automated test and an auditable rule-to-source-to-code-to-test traceability matrix.
```

---

## Project design and implementation
*Describe how you designed and implemented your project. How did your design address the problem you described above? How did you implement your solution and what requirements must be met to be able to do so? Where was this solution implemented, and with whom?*

**≈ 5600 / 7000**

```text
DESIGN PHILOSOPHY. The core design decision was to separate clinical reasoning from presentation and transport. All guideline logic lives in pure, framework-free TypeScript modules with no knowledge of React, HTTP, or FHIR wire formats. Those engines are consumed through a single, well-typed seam - assemblePatientData() produces a normalized PatientData, and generateRecommendation() turns it into a ProphylaxisRecommendation. Three surfaces feed that seam identically: a live SMART on FHIR client, a standalone synthetic-patient loader, and a CDS Hooks prefetch adapter. This guarantees that the dashboard, the demo, and the machine-to-machine service all produce the same clinical output, and it makes every rule unit-testable in isolation. Because the engine is pure and instant, the standalone demo wraps it in a live "what-if" editor: editing any input - labs, BMI, cancer site, clinical flags, or the active medication list - rebuilds the patient and re-runs the full recommendation in real time, making the reasoning engine directly inspectable by a reviewer.

HOW THE DESIGN ADDRESSES THE PROBLEM. The pipeline mirrors the clinician's mental workflow, step by step:
1. Cancer-site classification and exclusions. ICD-10-CM codes are matched by hierarchical prefix. Disease-specific populations (multiple myeloma, primary/metastatic brain tumor, acute leukemia, myeloproliferative neoplasms) are detected and routed out of the Khorana model to their own pathway, rather than being mis-scored.
2. Khorana VTE risk score. Cancer site (0-2) plus four one-point criteria (platelets >=350, hemoglobin <10 or ESA use, WBC >11, BMI >=35), capped at 6. Tiers follow the original Khorana model / NCCN VTE-C (0 Low, 1-2 Intermediate, >=3 High); pharmacologic prophylaxis is indicated at >=2. Each criterion's boundary is explicit and tested.
3. DOAC-chemotherapy interaction screening. Every active medication is checked against a 52-agent knowledge base. For each, the engine returns the full per-DOAC profile (apixaban, rivaroxaban, dabigatran, edoxaban) with mechanism, severity, and management, and aggregates a worst-case severity (major > moderate > pharmacodynamic > minor > none > unknown).
4. Renal dosing. Cockcroft-Gault CrCl drives per-anticoagulant standard/caution/avoid guidance, with warnings for low body weight and active nephrotoxic agents.
5. Contraindications. Absolute (active bleeding, severe thrombocytopenia, antiphospholipid syndrome, severe hepatic impairment, HIT) and relative (GI/GU tumor, brain tumor, myeloma+IMiD, concurrent antiplatelet, low weight) findings each carry an appliesTo scope.
6. Synthesis. Only apixaban and rivaroxaban are ever presented as prophylaxis options (NCCN); dabigatran and edoxaban appear only as interaction references. If both preferred DOACs are blocked, the engine falls back to LMWH - never to dabigatran/edoxaban. A universal absolute contraindication aborts pharmacologic prophylaxis; a targeted one only removes the affected agents.
7. Stale data guarding. Labs older than 30 days are flagged before they drive a decision.

IMPLEMENTATION. The stack is TypeScript, React 18, and Vite for the dashboard; an Express service for CDS Hooks; and Vitest for testing. fhirclient handles the SMART OAuth2 handshake. Knowledge is externalized into data files: the DDI knowledge base (JSON), the ICD-10 cancer map, LOINC codes, RxNorm code sets, and per-agent renal thresholds. A FHIR R4 client CapabilityStatement documents exactly which resources and interactions the app needs.

REQUIREMENTS TO DEPLOY. A SMART on FHIR-enabled EHR (or sandbox) supporting EHR launch with OAuth2 and read access to Patient, Condition, Observation, and MedicationRequest (scopes are declared); for the CDS Hooks service, a CDS Hooks-capable EHR that can call the discovery endpoint and deliver prefetch. The demo mode requires only a browser.

CHALLENGES OVERCOME. (1) Encoding "active major bleeding": FHIR has no single, reliable representation of active bleeding status, so rather than infer it unreliably we made a deliberate scope decision to model it as a clinician-confirmable boolean, keeping the determination with the clinician while still gating the recommendation. (2) Drug identity precision: paclitaxel and albumin-bound nab-paclitaxel needed distinct RxNorm entries because their interaction profiles and codes differ. (3) RxNorm verification: resolving codes for newly added agents surfaced a latent defect - 10324 had been treated as thalidomide when it is in fact tamoxifen (thalidomide is 10400); we corrected the IMiD code set and locked it with a regression test so a tamoxifen patient is never mislabeled as on an immunomodulatory drug. (4) Contraindication semantics: early logic conflated "patient cannot be anticoagulated" with "this agent is unsuitable," which the appliesTo model resolved. (5) Authoritative-contract drift: a reconciliation document was made the single source of truth so that ten resolved guideline/contract decisions are enforced consistently in code and tests.

WHERE AND WITH WHOM. OncoVTE Guard was designed and built as a student competition entry (under advisor guidance) and implemented as a public, self-contained web application: a live standalone demo deployed on Cloudflare Pages and an open-source repository on GitHub, plus a self-hostable CDS Hooks service. It has not yet been implemented inside a live clinical EHR; validation to date is against five synthetic FHIR R4 patients and the automated suite, and public SMART/FHIR sandbox testing with a clinical reviewer is the defined next step.
```

---

## Project evaluation and sustainability
*How did you evaluate your project? What kind of qualitative and quantitative data did you gather, and what conclusions do you draw from them? Did your project achieve its goals in terms of implementation and impact? How will your project be sustained?*

**≈ 2705 / 3500**

```text
EVALUATION APPROACH. Because the project's central claim is clinical accuracy, evaluation focused on verifiable guideline fidelity rather than on usage metrics (the app is a pre-deployment prototype). We gathered both quantitative and qualitative evidence.

QUANTITATIVE. (1) A 123-test automated suite (Vitest) covers every clinical engine and the integration boundaries: Khorana scoring including each criterion's boundary value (e.g., platelets exactly 350 scores, hemoglobin exactly 10.0 does not), the 52-agent DOAC interaction checker, Cockcroft-Gault renal dosing, appliesTo-aware contraindications, stale-lab detection, the recommendation orchestrator, RxNorm code integrity, and the CDS Hooks card builder. (2) Five synthetic FHIR R4 patients are run end to end, asserting the expected output of all five decision states - recommend, caution/LMWH fallback, contraindicated, not indicated, and excluded. (3) A rule-to-source-to-code-to-test traceability matrix links each clinical rule to its guideline citation, its implementing code, and the test that proves it, including the ten authoritative contract decisions. (4) Static gates: the TypeScript compiler runs clean under strict mode, and the production build succeeds.

QUALITATIVE. Each of the five decision states was visually verified in the running app and captured as a screenshot, confirming that the interface communicates severity (color-coded interaction matrix, ranked alerts, explicit "avoid / not an option" list) clearly and unambiguously.

CONCLUSIONS. The engine reproduces NCCN-concordant outputs deterministically across the tested space, and the dual-surface architecture delivers identical results through both the dashboard and the CDS Hooks service. The project met its goals for clinical accuracy and for standards-based EHR integration. It has not yet been evaluated with live EHR data or in a clinical setting, which is the clear next step.

SUSTAINABILITY. The design is built to last and to be maintained. The DOAC interaction knowledge base is an external, versioned data file in which every agent carries explicit sources, so guideline and labeling updates are data edits, not code rewrites. Clinical engines are decoupled from UI and transport, so a guideline change is localized and immediately re-verified by the test suite that encodes it. The app is built entirely on open standards - FHIR R4, SMART App Launch, and CDS Hooks - which maximizes portability across EHRs and avoids vendor lock-in. The roadmap is to validate against public SMART/FHIR sandboxes, broaden the knowledge base under clinical review, and, contingent on review, publish in the SMART App Gallery for community adoption and contribution.
```

---

## Data Validation
*How did you ensure your app validates required fields or flags inconsistent/outdated information? How did you promote appropriate use of standard terminology (e.g., ensuring active codes are used, that a condition code is represented in a Condition resource — not a Procedure, and vice versa)? What processes did you put in place to capture and surface provenance metadata to indicate where the data came from and who entered it?*

**≈ 3068 / 3500**

```text
VALIDATING AND FLAGGING STALE OR INCOMPLETE DATA. Every clinical input is validated before it can drive a decision. Laboratory and vital Observations each carry their effectiveDateTime, and any value older than 30 days is flagged as stale (a missing or unparseable date is treated as stale, i.e., conservatively) and surfaced as an explicit warning rather than silently trusted. When multiple Observations exist for the same analyte, the engine sorts by effective time and uses only the most recent. Required-field completeness is tracked: the Khorana engine records any missing component in missingFields and marks the result isComplete=false; creatinine clearance is computed only when both weight and serum creatinine are present, otherwise the app emits a "renal function not assessable" alert instead of guessing. Numeric guards prevent invalid math (a non-positive creatinine or weight, or a negative age, yields a guarded result rather than a divide-by-zero). A medication whose RxNorm code is not in the knowledge base is surfaced as "unknown - verify manually," never silently dropped. Every threshold is an explicit, unit-tested boundary.

STANDARD TERMINOLOGY AND CORRECT RESOURCE TYPES. The parser is terminology- and resource-type-strict. Diagnoses are read only from Condition resources and only from the coding whose system is ICD-10-CM (http://hl7.org/fhir/sid/icd-10-cm); non-malignancy codes are filtered out, and matching respects the ICD-10-CM hierarchy through prefix logic. Labs and vitals are read only from Observation resources and only from LOINC codings (http://loinc.org). Medications are read only from MedicationRequest resources and only from RxNorm codings (http://www.nlm.nih.gov/research/umls/rxnorm), and only requests with status "active" are used, so discontinued or draft orders never influence a recommendation. Because each datum is accepted only from the semantically correct resource paired with its expected code system, a diagnosis cannot be mistaken for a procedure, or vice versa. Terminology precision is enforced by tests - for example, a regression test locks RxNorm 10324 to tamoxifen and 10400 to thalidomide so a tamoxifen patient is never mis-flagged as taking an immunomodulatory drug.

PROVENANCE. Two kinds of provenance are surfaced today. First, data timing and status: each lab retains its source effectiveDateTime (which drives the staleness flag) and each medication retains its MedicationRequest.status. Second, decision provenance: every recommendation, alert, and CDS Hooks card carries an explicit source attribution (e.g., "NCCN VTE-B," "AHA 2022 Scientific Statement," or the DDI knowledge base), and each knowledge-base agent lists its own sources, so a clinician sees exactly which rule and reference produced each output. We are transparent about the current limit: the app does not yet consume the FHIR Provenance resource or meta.source to display which system recorded a value or which user entered it; capturing that author/origin metadata is a defined roadmap item before any live deployment.
```

---

## Who is the intended user/audience of your app?
*Select all that apply.*

- [ ] Patient-facing
- [x] **Provider-facing**
- [ ] Researchers
- [ ] Payers
- [x] **Other** — EHR / clinical-informatics teams who embed the CDS Hooks service into existing order-entry and chart-review workflows. (The ultimate beneficiary is the ambulatory cancer patient, though the app is not patient-facing.)

---

## Twitter project summary
**138 / 140**

```text
SMART on FHIR + CDS Hooks engine that scores cancer VTE risk and flags DOAC-chemo interactions, with 123 tests proving guideline fidelity.
```

---

## How is FHIR being used in the app?
*Briefly describe how your application leverages the FHIR specification, for instance as an end user-facing app or a machine-to-machine interface.*

**476 / 500**

```text
FHIR is used two ways. (1) As an end-user-facing SMART on FHIR app: launched from the EHR, it reads the in-context patient's FHIR resources to drive an interactive VTE prophylaxis dashboard. (2) As a machine-to-machine interface via CDS Hooks: the same engine is served as a CDS service that consumes FHIR resources delivered in the hook prefetch and returns decision cards, enabling passive, point-of-care guidance inside native EHR workflows (patient-view and order-select).
```

---

## What FHIR release does your application use?

- [x] **R4** (4.0.1)
- [ ] STU 3
- [ ] DSTU 2
- [ ] DSTU 1

---

## What is the data source for the FHIR resources and how are the FHIR resources accessed?
*e.g. SMART-on-FHIR API specified by Argonaut, FHIR bundles retrieved from a FHIR server, etc.*

**471 / 500**

```text
In production, resources are accessed live via the SMART on FHIR API (SMART App Launch, OAuth2) per the Argonaut/US Core ecosystem - the app reads Patient, Condition, Observation, and MedicationRequest for the launch patient. For CDS Hooks, resources arrive in the hook prefetch (or via the referenced FHIR server). For demo and automated testing, five synthetic FHIR R4 bundles (no PHI) run through the identical parsing pipeline, so demo and live modes behave the same.
```

---

## FHIR Resources
*Which type of resources you will provide.*

- [x] **Both** — Upload FHIR Capability Statement **and** List of FHIR Resources

**Capability Statement to upload:** `public/capability-statement.json` (FHIR R4 client CapabilityStatement, `kind: requirements`).

**Resource list:** Patient (read), Condition (search), Observation (search), MedicationRequest (search).

---

## Does your app use US Core profiles or other implementation guides?

- [x] **US Core** — US Core race and ethnicity extensions are parsed from the Patient resource; SMART App Launch is followed for authorization. Otherwise the app uses standard FHIR R4 resources.
- [ ] Other Implementation Guides
- [ ] None

---

## What FHIR technologies does your app use?

- [x] **SMART**
- [x] **CDS Hooks** (patient-view and order-select services with a discovery endpoint)
- [ ] Bulk CQL
- [ ] None of the above

---

## Any other information about the project we should know about?
**≈ 190 / 250 words**

```text
OncoVTE Guard is decision support, not a substitute for clinical judgment; every recommendation is accompanied by disclaimers and source attributions, and all demonstration data is synthetic with no PHI. Two design points are worth highlighting for reviewers. First, the dual-surface architecture (one tested engine behind both a SMART dashboard and a CDS Hooks service) is what distinguishes this from a data-display dashboard: it is a clinical reasoning engine that can integrate passively into existing EHR workflows. Second, accuracy is treated as an auditable property - a companion VERIFICATION document provides a rule-to-source-to-code-to-test traceability matrix so reviewers can independently confirm guideline fidelity. Known, deliberate scope decisions are documented openly: active major bleeding is modeled as a clinician-confirmable flag (FHIR cannot reliably encode it); kidney cancer is scored high-risk with an explicit note that NCCN names only bladder/testicular; and the knowledge base, while curated and sourced, is scoped to its listed agents, with any unrecognized medication surfaced as "verify manually" rather than silently ignored.
```

---

## Logo
**[ TO BE PROVIDED ]**

## Headshot and promotional photo
Promotional screenshots of all five decision states are in `docs/screenshots/`. **[ Student headshot TO BE PROVIDED. ]**

---

## Customers
*Does your solution have paying customers?*

- [ ] Yes
- [x] **No**

## Solution Date — When was your solution conceived?
**June 2026**

## Implementation Date — When was your solution implemented?
**June 2026** (functional prototype completed)

## Users/Patients — How many users / how many patients impacted (time frame)?
**0 to date** — pre-deployment prototype; validated against 5 synthetic patients (no PHI). No live clinical use yet.

## Website / URL / GitHub
- **Live demo:** https://oncovte-guard.pages.dev
- **SMART launch:** https://oncovte-guard.pages.dev/launch
- **Source:** https://github.com/jtown42/oncovte-guard

## Any additional information / video / etc. about the project
**≈ 70 / 250 words**

```text
Reviewers can reproduce every claim: `npm test` runs the full 123-test suite, `npm run build` type-checks and builds, and `npm run dev` opens the standalone demo with its live "what-if" editor. Key artifacts in the repository: VERIFICATION.md (the rule-to-source-to-code-to-test traceability matrix), docs/DEMO-SCRIPT.md (an eight-minute walkthrough of all five decision states, including a live threshold-flip demonstration), and docs/screenshots/ (the five decision states). No live-demo video has been recorded yet.
```

## SMART App Gallery
*Agreement to publish your app in the SMART App Gallery if feasible:*

- [x] **Yes**

---

## References (supporting the rationale / epidemiology figures)

- **Farge D, Frere C, Connors JM, et al.** 2019 International Clinical Practice Guidelines for the Treatment and Prophylaxis of Venous Thromboembolism in Patients With Cancer (ITAC). *Lancet Oncol.* 2019;20(10):e566–e581. — supports the ~4–7-fold increased VTE risk and cancer accounting for ~20% ("one in five") of all VTE events.
- **Siegel RL, Giaquinto AN, Jemal A.** Cancer Statistics, 2024. *CA Cancer J Clin.* 2024;74(1):12–49. — supports ~2 million new US cancer diagnoses per year (≈2,001,140 projected for 2024).
- **Lam BD, Ryu J, Jafari O, et al.** Epidemiology of Cancer-Associated Venous Thromboembolism Across the United States. *Am J Hematol.* 2026. — contemporary cancer-associated VTE epidemiology (confirm volume/pages on publication).
- Supporting efficacy trials named in the text: **AVERT** (Carrier et al., *NEJM* 2019) and **CASSINI** (Khorana et al., *NEJM* 2019); risk model: **Khorana et al.**, *Blood* 2008; pathway: **NCCN Guidelines®, Cancer-Associated Venous Thromboembolic Disease**.

> Wording note: the rationale uses "a leading cause of death" (ITAC-supported), not "the second leading cause," whose primary source is unconfirmed.

---

### Still required before final submission (needs student/advisor)
1. **Advisor attestation** (Student category): signed PDF confirming the training program, primary advisor, all co-authors and contributions, and the student's contribution. Template: `submission/advisor-attestation-template.md`.
2. **Paste the References above into `AMIA-App-Competition-Submission.docx`** and clear its `(cite)` placeholders. (Figures are reconciled to "a leading cause" and "approximately 2 million"; the Lam et al. 2026 volume/pages need confirming on publication.)
3. **Logo** and **student headshot** image files.
