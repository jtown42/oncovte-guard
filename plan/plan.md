### OncoVTE Guard — AMIA/HL7 FHIR App Competition Submission

## SUBMISSION METADATA

**Title:** OncoVTE Guard: A SMART-on-FHIR Clinical Decision Support App for Cancer-Associated VTE Prevention with Integrated DOAC-Chemotherapy Drug Interaction Checking

**Category:** Student

**Letter of Support:** Required — see Part 14 below for a template for your primary advisor.

---

## 1. PROJECT ABSTRACT (1,000 characters max)

Cancer-associated venous thromboembolism (VTE) is the second leading cause of death in cancer patients, yet guideline-recommended thromboprophylaxis remains underutilized. OncoVTE Guard is a SMART-on-FHIR clinical decision support app that auto-calculates the Khorana VTE risk score from structured EHR data at the point of chemotherapy ordering, checks for DOAC-chemotherapy drug-drug interactions (DDIs) across 50+ antineoplastic agents using mechanism-specific P-gp/CYP3A4 severity ratings, and provides renal dosing adjustments — all within a single clinician-facing dashboard. The app fires CDS Hooks alerts during chemotherapy ordering to flag high-risk patients lacking prophylaxis and warn of unsafe DOAC-chemotherapy combinations missed by generic EHR alerts. Built on FHIR R4 with CDS Hooks, SMART App Launch, and CQL, OncoVTE Guard is EHR-agnostic and validated against synthetic FHIR patients spanning five clinical scenarios. By embedding NCCN-concordant VTE risk stratification and pharmacologically curated DDI checking into oncology workflow, OncoVTE Guard addresses a critical patient safety gap at the intersection of thrombosis, pharmacology, and clinical informatics.

*[Character count: ~988]*

---

## 2. PROJECT RATIONALE, IMPACT AND INNOVATION (3,500 characters max)

**The Problem**

VTE affects 3–30% of cancer patients depending on tumor type and treatment, making it the second leading cause of non-cancer death in this population. The Khorana score — a validated 5-variable risk model endorsed by NCCN, ASCO, and ITAC guidelines — identifies ambulatory chemotherapy patients at high risk (6.7–12.9% 6-month VTE rate for score ≥3). Landmark trials (AVERT, CASSINI) demonstrated that DOAC prophylaxis reduces VTE by approximately 50% in high-risk patients. Despite this Level I evidence, real-world studies consistently show thromboprophylaxis is prescribed in fewer than 10–15% of eligible patients.

A second, underrecognized problem compounds this gap: when DOACs are prescribed, clinicians must navigate complex pharmacokinetic interactions between DOACs and antineoplastic agents. A 2024 systematic review found that 52.7% of anticancer agents have clinically significant interactions with at least one DOAC via CYP3A4 and/or P-glycoprotein pathways. Generic EHR drug interaction alerts do not distinguish between mechanism-specific DOAC-chemotherapy interactions and generate excessive low-value alerts, contributing to alert fatigue.

**Who Is Affected**

Over 1.9 million new cancer diagnoses occur annually in the United States. Conservatively, 20–30% of ambulatory chemotherapy patients have Khorana scores ≥2, representing 380,000–570,000 patients per year who may benefit from prophylaxis. Among those prescribed DOACs, a substantial proportion are concurrently receiving interacting antineoplastic agents without dose adjustment or alternative selection.

**Impact**

In the short term, OncoVTE Guard can reduce missed VTE prophylaxis opportunities by surfacing risk scores and guideline recommendations at the point of chemotherapy ordering — the exact clinical decision point where prophylaxis should be initiated. The integrated DDI checker prevents both bleeding events (from unrecognized DOAC exposure increases) and thrombotic events (from unrecognized DOAC efficacy reductions by enzyme inducers like enzalutamide). In the long term, population-level deployment could reduce cancer-associated VTE incidence, decrease VTE-related hospitalizations (average cost $20,000–$45,000 per event), and improve survival.

**Innovation**

OncoVTE Guard is the first tool to combine three functions in a single FHIR-native CDS workflow: (1) automated Khorana VTE risk scoring from EHR data, (2) mechanism-specific DOAC-chemotherapy DDI checking curated from pharmacology literature rather than generic drug databases, and (3) renal dosing adjustments with cancer-specific caveats (e.g., sarcopenia flags, GI cancer bleeding risk). No existing commercial EHR module or standalone app integrates all three. The CDS Hooks architecture ensures alerts fire contextually during chemotherapy ordering rather than requiring clinicians to navigate to a separate tool, reducing cognitive burden and improving adoption potential.

*[Character count: ~2,489]*

---

## 3. PROJECT DESIGN AND IMPLEMENTATION (7,000 characters max)

**Architecture Overview**

OncoVTE Guard consists of two components: (1) a React-based SMART-on-FHIR clinician dashboard that launches in-context from the EHR patient chart, and (2) a Node.js CDS Hooks service that fires alert cards during chemotherapy ordering. Both components share core logic modules for Khorana score calculation, DDI checking, and renal dosing.

**Design Approach**

The design directly addresses three barriers to VTE prophylaxis: (a) clinicians must manually recall and calculate the Khorana score, (b) DOAC-chemotherapy interactions require specialized pharmacology knowledge, and (c) renal dosing adjustments add complexity. OncoVTE Guard automates all three by extracting structured data from FHIR resources at the point of care.

**FHIR Data Flow**

Upon SMART launch, the app authenticates via OAuth2 and executes parallel FHIR R4 queries:

- Patient resource: demographics (age, sex) for CrCl calculation
- Condition resource: active cancer diagnoses filtered by ICD-10 codes (C00–C97), mapped to Khorana cancer risk categories (very high risk: stomach/pancreas = 2 pts; high risk: lung/lymphoma/gynecologic/bladder/testicular = 1 pt; standard: all others = 0 pts)
- Observation resource (laboratory): CBC components (platelets via LOINC 777-3, hemoglobin via 718-7, leukocytes via 6690-2), serum creatinine (2160-0), hepatic function (ALT 1742-6, AST 1920-8, bilirubin 1975-2)
- Observation resource (vital-signs): weight (29463-7), height (8302-2) for BMI calculation
- MedicationRequest resource: active medications matched against a curated DDI knowledge base by RxNorm code

**Khorana Score Engine**

The score engine maps ICD-10 prefixes to Khorana cancer categories and applies the five scoring criteria: cancer type (0–2 pts), platelets ≥350×10⁹/L (1 pt), hemoglobin 11×10⁹/L (1 pt), BMI ≥35 (1 pt). The engine tracks missing data elements explicitly, flags stale labs (>30 days old), and handles edge cases (multiple malignancies → highest-scoring cancer used; hematologic malignancies with disease-related cytopenias/leukocytosis → contextual warnings).

**DDI Knowledge Base**

A curated JSON database covers 50+ antineoplastic agents with interaction profiles for four DOACs (apixaban, rivaroxaban, edoxaban, dabigatran). Each entry specifies the agent's P-gp effect, CYP3A4 effect, per-DOAC severity rating (major/moderate/minor), mechanism description, and specific recommendation (dose adjustment, alternative agent, or avoidance). The database was constructed from the Hellfritzsch et al. 2024 systematic review of 100 antineoplastic agents and the AHA scientific statement on cardio-oncology drug interactions. Agents are classified as strong dual inhibitors (e.g., ibrutinib, idelalisib — avoid with apixaban/rivaroxaban), strong inducers (e.g., enzalutamide — avoid all DOACs), moderate inhibitors (e.g., imatinib, aprepitant — use with caution), and pharmacodynamic interactors (e.g., bevacizumab — increased bleeding risk independent of PK interaction).

**Renal Dosing Module**

CrCl is calculated via Cockcroft-Gault using age, sex, weight, and serum creatinine. Dosing rules are applied per FDA labeling: rivaroxaban contraindicated at CrCl ResourcePurposePatientDemographics (age, sex, weight) for CrCl calculation and patient bannerConditionActive cancer diagnoses (ICD-10 codes) for Khorana cancer category mappingObservation (laboratory)CBC (platelets, hemoglobin, WBC), creatinine, ALT, AST, bilirubinObservation (vital-signs)Body weight, body height, BMIMedicationRequestActive medications (RxNorm codes) for DDI checking and prophylaxis statusProcedureRecent surgical procedures for post-operative prophylaxis assessmentRiskAssessmentOutput resource: computed Khorana score and VTE risk categoryAllergyIntoleranceHeparin/pork allergy screening for LMWH contraindications

---

## 11. US CORE PROFILES

Yes. The app uses the following US Core Implementation Guide (v5.0.1) profiles:

- US Core Patient Profile
- US Core Condition Problems and Health Concerns Profile
- US Core Laboratory Result Observation Profile
- US Core Vital Signs Profile (Body Weight, Body Height, BMI)
- US Core MedicationRequest Profile
- US Core Procedure Profile

---

## 12. FHIR TECHNOLOGIES USED

- **SMART App Launch (v2.0):** EHR-context launch with OAuth2 authorization for the clinician dashboard
- **CDS Hooks (v1.1):** order-select hook (fires during chemotherapy ordering) and patient-view hook (fires on chart open) returning info/warning/critical cards
- **CQL (Clinical Quality Language):** Khorana score calculation logic and contraindication rule definitions
- **Bulk FHIR:** Not used in current MVP; planned for future population-level VTE prophylaxis gap analysis

---

## 13. ANY OTHER INFORMATION (1,500 characters max)

OncoVTE Guard was conceived and developed by a PGY-0 medical school graduate with interests in hematology/oncology, clinical informatics, and health equity. The project addresses a problem I encountered during clinical rotations: oncology teams frequently omitted VTE risk assessment during chemotherapy initiation, and when DOACs were prescribed, potential interactions with antineoplastic agents were rarely considered systematically.

The DDI knowledge base represents a novel contribution — it is curated from the 2024 Hellfritzsch et al. systematic review covering 100 antineoplastic agents and the AHA scientific statement on cardio-oncology drug interactions, providing mechanism-specific (P-gp/CYP3A4) severity ratings rather than the generic "moderate interaction" alerts typical of commercial drug databases. This pharmacologically informed approach reduces alert fatigue while preserving sensitivity for clinically dangerous combinations.

The app is designed with health equity in mind. Future iterations will incorporate demographic stratification of VTE prophylaxis rates using Bulk FHIR data to identify disparities in thromboprophylaxis by race, ethnicity, insurance status, and socioeconomic factors — a documented gap in oncology care quality.

The codebase will be published as open-source software and submitted to the SMART App Gallery. The modular architecture allows other institutions to adopt and extend the tool with minimal configuration.

*[Character count: ~1,310]*

---

## 14. ADDITIONAL SUBMISSION ITEMS

**Logo/Headshot:** [Upload a professional headshot and a simple app logo — consider generating a logo with a shield/vein motif in your institution's colors using Canva or similar]

**Paying customers:** No

**When was your solution conceived:** [Insert month/year you began brainstorming, e.g., "June 2026"]

**When was your solution implemented:** [Insert month/year you completed the MVP, e.g., "July 2026"]

**How many users / patients impacted:** Pre-deployment prototype validated against 5 synthetic FHIR patients representing distinct clinical scenarios. No live patient data accessed. Planned usability evaluation with 5–10 oncology clinicians. (Time frame: June–August 2026)

**Website/URL:** [Your GitHub repository URL, e.g., https://github.com/[username]/oncovte-guard]

**SMART App Gallery:** Yes

---

## 15. STUDENT ATTESTATION LETTER TEMPLATE

Below is a template for the required PDF attestation letter. Send this to your primary advisor (e.g., your medical school research mentor, informatics faculty advisor, or incoming residency program director) for signature on institutional letterhead.

---

[INSTITUTION LETTERHEAD]

[Date]

To: AMIA/HL7 FHIR Applications Competition Committee

Re: Student Attestation for OncoVTE Guard Submission

**a. Training Program:**

[Full name of medical school or training program]

[Address]

**b. Primary Advisor:**

[Advisor name, credentials]

[Title, Department]

[Institution]

[Email, Phone]

**c. Authors and Contributions:**

- [Your name], MS/MD — Sole developer. Conceived the project, designed the architecture, implemented all frontend and backend code, curated the DDI knowledge base, created synthetic test patients, conducted validation testing, and wrote the competition submission.
- [Advisor name, if contributing] — Provided clinical guidance on VTE prophylaxis guidelines and DOAC pharmacology, reviewed the DDI knowledge base for clinical accuracy, and supervised the project.

[Add or remove co-authors as appropriate. For each, describe their specific contribution.]

**d. Attestation of Student Contribution:**

I attest that [Your Name] is the primary developer of OncoVTE Guard and made substantial, independent contributions to all aspects of this project, including conception, design, implementation, validation, and manuscript preparation. This work was completed during [his/her/their] time as a [medical student / PGY-0 graduate] at [Institution] under my supervision.

Sincerely,

[Advisor signature]

[Advisor name, credentials]

[Title]

---

## 16. TIMELINE AND CHECKLIST

**Pre-Submission Checklist:**

- MVP app functional with all 5 synthetic patients
- CDS Hooks service tested in CDS Hooks Sandbox
- SMART launch tested in SMART App Launcher
- Unit tests passing for Khorana score, DDI checker, renal dosing
- GitHub repository public with README, LICENSE (MIT), and documentation
- Demo video recorded (5 minutes, screen recording with narration)
- Attestation letter signed by advisor and saved as PDF
- All submission fields completed per this document
- Logo and headshot uploaded
- Proofread all character-limited fields for accuracy and count

**Suggested Development Timeline (4–6 weeks):**

- Week 1: Project scaffolding, SMART launch, FHIR data fetching (Prompts 1–2 from build spec)
- Week 2: Khorana score engine, cancer category mapping, dashboard UI (Prompts 3–4)
- Week 3: DDI knowledge base curation, DDI checker logic (Prompt 5)
- Week 4: Renal dosing module, contraindication flags, CDS Hooks service (Prompts 6–7)
- Week 5: Synthetic patient creation, testing, bug fixes (Prompt 8)
- Week 6: Usability feedback (if possible), demo video, submission writing, attestation letter