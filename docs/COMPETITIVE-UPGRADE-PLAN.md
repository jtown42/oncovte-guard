# Competitive upgrade plan: AMIA 2026 FHIR App Competition

> Planning document, written 2026-10-11 (Sun). **Nothing here is built yet.**
> Deck upload deadline: **Fri Oct 16, 11:59 pm EST**. Talk: **Tue Nov 10, 10:00 am** (first slot, 8 min, no Q&A; the audience votes at about 11:12).
> Inputs: the OpenEvidence assessment and menu (2026-10-11), the FHIR write-back spec, Claude's code review of that spec, and the finalist abstracts.

---

## 0. Update, 2026-10-11 evening (this overrides the sections below)

- **No pharmacist and no clinicians are available.** Items C and D are dropped. The limitations slide keeps its honest wording ("interaction table needs pharmacist review"; "not yet tested with clinicians").
- **Slides can't be swapped on site.** The deck is final at upload, so **all content is locked by Thu Oct 15.** There's no "add it later" path for slides.
- **Scope is A (write-back), B (panel screening), E (roadmap line) and F (license).** A comes first. B is dropped if A isn't validating by Tue night.
- **Positioning: lead as a clinician.** The program lists Justin as MD, MPH, NYU Langone Health. In a field of engineers and ML entries, "a physician who encoded the decision he has to make, and made every step auditable" is the differentiator. The script rewrite (Wed) adds a first-person clinical framing in the opening and close. The engine stays the evidence.
- **A design refinements** (from reading the code): the two equivalent options (apixaban *or* rivaroxaban; enoxaparin *or* dalteparin) are emitted as a `RequestGroup` with `selectionBehavior = exactly-one`, which `GuidanceResponse.result` points to. That's FHIR's own way of saying "pick one of these proposals," rather than inventing a single chosen agent the engine never picks.

- **Status, end of Sun Oct 11: A is done, a day ahead of schedule** (commits dd4093a, 64afe14; deployed). Write-back with Provenance (item G) included; 224 tests; HL7 validator 7/7 bundles, 0 errors; sandbox round trip 9 in / 9 back; talk stills pixel-identical; slide images `talk-assets/07-james-fhir-output-panel.png` and `08-james-card-to-fhir.png`. **B done too** (F20): real `$export` against the public SMART Bulk Data server works, but it assesses 0 of 100 there because its diagnoses are SNOMED-coded (parser is ICD-10-CM only; now on the roadmap). The synthetic panel (40 patients, 19 flagged, labeled as generator output) gives the slide `talk-assets/09-panel-worklist.png`. 229 tests. License: MIT. **Next: rewrite the script and the PowerPoint prompt (Wed's work, now possible Mon).**

---

## 1. Where we stand, honestly

**What the field has that we don't:**
- **Real deployment:** AI Workbench (Epic, 200+ users) and eLTSS (Oracle PowerChart).
- **Measured performance:** PeriopUDI (0.68 s scan-to-chart), NEUROFLOW (AUROC on MIMIC/eICU), FAERS-GraphRAG (Hit@k).
- **A larger FHIR footprint:** NEUROFLOW writes RiskAssessment and CarePlan; NeuroFHIR-QC uses Provenance, Task and transaction Bundles; PeriopUDI writes Device; ClinicalHub has its rules in CQL.

**What we have that they don't:**
- The only deterministic, rule-to-code-to-test-traceable engine in a lineup where 6 of 9 apps are ML or LLM.
- The best-sourced clinical problem statement.
- Modest claims that can be checked.

**The two gaps the room will notice:**
1. **"It only reads FHIR."** We read 4 resources and write nothing.
2. **"It's never been checked by anyone but you."** The interaction table hasn't had a pharmacist review, and no clinician has tested the app.

**Goal for this week:** close both gaps without touching the audited clinical engine and without breaking the deck we already have.

---

## 2. Guardrails (apply to every item)

1. **The engine files don't change.** No rule, threshold, severity, RxNorm code or KB entry. New code only reads the engine's finished verdict.
2. **The existing 208 tests pass at every commit.** New tests are added on top.
3. **The talk stills are regenerated after each change and compared with today's.** If a verdict screenshot changes, stop and investigate.
4. **The demo stays images plus one short James clip.** No new videos.
5. **Nothing writes to a live chart.** Sandbox POSTs are made only from a script, and every proposed order is `status=draft`, `intent=proposal`.
6. **Cut rules are fixed in advance** (section 6). Worst case, we upload the deck we already have.

---

## 3. The full menu, with a verdict on each

"4-day feasible" means it can be done by Thu Oct 15 and still make the Oct 16 deck.

| # | Item | Owner | 4-day feasible? | Verdict |
|---|---|---|---|---|
| A | **FHIR write-back** (GuidanceResponse, RiskAssessment, DetectedIssue, draft MedicationRequest) | Claude | **Yes** | **DO. Top priority.** |
| B | **Bulk Data ($export) panel screening** | Claude | **Yes, scoped** to a demo over synthetic data | **DO. Second priority.** |
| C | **Pharmacist reviews the interaction table** | Justin (find the pharmacist); Claude (review packet) | **Only if** a pharmacist says yes by Tue | **DO. Start today.** |
| D | **Clinician think-aloud** (protocol already written: `docs/EVALUATION.md` §2) | Justin (participants); Claude (session kit) | **Only if** 3–4 clinicians agree by Wed | **DO. Start today.** |
| E | Roadmap slide (CQL, CDS Hooks suggestions, silent-mode study) | Claude (text) | Yes | **DO.** It's cheap. |
| F | Open source (repo is already **public**; it has **no LICENSE**) | Claude | Yes, 5 minutes | **DO:** add an MIT or Apache-2.0 license. |
| G | Provenance resource | Claude | Yes, if A is done by Tue | **Stretch.** |
| H | CDS Hooks `create` suggestions (the card proposes the draft order) | Claude | Possible, but after Oct 16 | **After the deadline.** |
| I | One slice of logic in CQL / PlanDefinition | Claude | No; it needs a translator and an execution engine, and a half-working version invites scrutiny | **Roadmap only.** |
| J | SMART App Gallery listing | Justin | No; external review takes weeks | **Skip for the talk.** You can submit it, but you can't claim it. |
| K | SNOMED CT / terminology service | Claude | No; it reopens cancer classification, which borders on the engine | **Skip.** Roadmap. |
| L | QuestionnaireResponse for manual flags (bleeding, APS, HIT) | Claude | Possible, but it changes the input path | **Skip.** |
| M | Structured override capture | Claude | Possible, but there's no story for it on stage | **Skip.** |
| N | Personalized NNT / ARR in the output | — | Technically yes | **Skip. It's a trap:** it adds new clinical claims (absolute-benefit numbers per tier) that we'd have to defend, and nobody has audited them. |
| — | Bleeding risk score, LLM features, more drugs or cancer types | — | — | **Never.** (OpenEvidence agrees.) |

**Honest read on "all of this in 4 days":**
- **Software (A, B, E, F, and maybe G):** yes, these are feasible.
- **Human validation (C, D):** these depend on other people saying yes this week. Nobody can promise that. Start the asks today. Whatever is done by Thu goes in the deck; whatever finishes later goes into the spoken script and, if AMIA allows a deck swap at Speaker Ready, the slides.
- **Everything else on the menu** either can't be done by Oct 16 or risks the engine.

---

## 4. Item specs

### A. FHIR write-back (a serializer only)

**Shape:** `src/fhir-output/` exports `buildFhirOutput(patient, recommendation) → Bundle`. It's a pure function. It reads the finished verdict and computes nothing clinical.

**Resources:**

| Resource | Content | When |
|---|---|---|
| `Device` | "OncoVTE Guard Decision Engine". The version includes **KB v1.2.0**, read from the KB file so it can't drift. | Always |
| `GuidanceResponse` | The verdict envelope. `status=success`, `performerDevice`. `reasonReference` points to the RiskAssessment and DetectedIssues. `outputParameters` or `note` carries the verdict text exactly as the UI shows it. **This is the FHIR home for CDS output**, and it handles Excluded and Not indicated cleanly. | Always |
| `RiskAssessment` | Khorana score; `qualitativeRisk` uses 0 → low, 1–2 → moderate, ≥3 → high. `basis` holds references to the platelet, hemoglobin and WBC Observations and the cancer Condition. `rationale` lists the components that fired. | Every verdict except Excluded |
| `DetectedIssue` | One per blocked agent or finding. A drug interaction uses `v3-ActCode DRG`; a contraindication uses text plus a local code. `severity`: major → high. `implicated` points to the offending MedicationRequest or Observation. `detail` reuses the card text. `mitigation` holds the resolution. | Every blocked agent, contraindication or renal-avoid |
| `MedicationRequest` | `status=draft`, `intent=proposal`, the RxNorm code from the locked list, and the exact dose string from the UI. `reasonReference` points to the RiskAssessment and any forcing DetectedIssues. | Recommend (DOAC or LMWH) only |
| `Provenance` | Stretch (G) | — |
| `Bundle` | `collection` for display; `transaction` for the sandbox POST | Always |

**Fixes to the original spec:**
1. The KB version is **v1.2.0**, not v1.1.0.
2. Mapping added for **"recommend with caution"** (Dorothy at 55k): one renal-avoid DetectedIssue for rivaroxaban, one for LMWH, a moderate caution issue on apixaban, and a draft apixaban proposal. Mapping also added for **"no safe agent"**: one DetectedIssue per blocked agent and no proposal.
3. "Excluded" emits a GuidanceResponse whose note says the cancer type is outside the Khorana model, rather than forcing a DetectedIssue.
4. **Parser change (the only edit to existing code, and an additive one):** add an optional `sourceRef` (for example `"Observation/abc"`) to `LabValue`, `MedicationItem` and `CancerConditionItem` in `src/types/patient.ts`, filled in by `src/fhir/fhir-parser.ts`. The engine never reads it.
5. Drugs added by hand in the what-if editor have no FHIR resource behind them, so they get a **display-only reference** (`{ display: "Itraconazole (added in what-if)" }`).
6. There's **no CI** in this repo. Validation runs the official HL7 validator jar locally (Java 21 is installed) from a script, `scripts/validate-fhir-output.cjs`. The claim on stage is "validated against the FHIR R4 base specification," not "in CI."

**Tests to add (`tests/fhir-output/`):**
- Each verdict produces exactly the resource set in the mapping, for all five patients.
- James produces exactly two high-severity DetectedIssues (apixaban and rivaroxaban), both implicating itraconazole, plus one draft enoxaparin proposal.
- Removing itraconazole makes both DetectedIssues disappear and the proposal flip to a DOAC.
- No MedicationRequest ever has `status != draft` or `intent != proposal`.
- Every `basis` and `implicated` reference resolves within the bundle or the source data.
- The Device version equals the KB version.

**UI:** a "FHIR output" tab or drawer showing pretty-printed JSON with a Copy button. Not shown in presentation mode by default.

**Sandbox round trip:** `scripts/post-fhir-output.cjs` POSTs James's transaction Bundle to `r4.smarthealthit.org`, reads every entry back, and prints "N in / N back." This is not done on Epic, because its sandbox doesn't accept these writes.

### B. Bulk Data panel screening

**The story:** *the same engine, run across a whole oncology panel, finds the high-risk patients who aren't on prophylaxis.* It attacks the underuse gap (Holmes 59%) directly, and Bulk Data is a standard FHIR capability the HL7 crowd respects.

**Shape:**
- `scripts/panel-screen.cjs` runs a Bulk Data `$export` (Patient, Condition, Observation, MedicationRequest) and writes the NDJSON to disk.
- It groups the export by patient, runs each through the **existing parser and the frozen `generateRecommendation`**, and writes a summary table and a CSV.
- Output columns: patient, cancer site, Khorana, verdict, on prophylaxis already (yes/no), flag "eligible and not on prophylaxis."

**Two data sources, labeled honestly:**
1. **The public SMART Bulk Data reference server** (`bulk-data.smarthealthit.org`, Synthea data). This proves the real `$export` flow against a server we don't control. **Caveat:** Synthea may contain very few cancer patients with all the labs Khorana needs, so the result may be "N screened, 0–2 eligible." That's fine as proof of the plumbing. Check this first, on Monday.
2. **A synthetic oncology panel we generate** (about 40 patients, extending `scripts/gen-patients.cjs`), served as NDJSON. This gives a readable screen. **It must be labeled as synthetic data we built.** Any count it produces ("found 9 untreated") shows the flow, not prevalence. Never present it as a finding.

**Deck use:** one static slide with the panel table screenshot. The rows flagged "eligible and not on prophylaxis" are highlighted, and the caption reads: *"Synthetic panel · same engine, unchanged · Bulk Data $export."*

**What it is not:** a scheduled job, a real hospital run, or an EHR integration. Present it as "the same engine, run across a panel."

### C. Pharmacist review

**The ask:** one NYU oncology or heme-onc pharmacist, about 60–90 minutes.

**Packet (Claude builds it):**
- The **22 prophylaxis major cells** (11 agents × apixaban/rivaroxaban) plus the 4 reference cells. **Note:** OpenEvidence's menu says "14 blocking cells." Our KB has **26 major cells (22 prophylaxis)**. Use our real numbers.
- Each cell shows the agent, the DOAC, our rating, the mechanism, the source, and columns for "agree / disagree / comment."
- A one-page cover note covering what the app is, synthetic-only use, what we're asking, and how they'll be acknowledged.

**Output:** `docs/PHARMACIST-REVIEW.md` with their verdicts, used exactly as returned. **If they disagree with a cell, that's a finding, not an embarrassment.** Report it as "X of 22 agreed; Y revised," and any KB change becomes its own audited change, which isn't happening this week.

**Wording on the limitations slide, depending on the outcome:**
- Done: *"Interaction logic reviewed by an oncology pharmacist (X/22 concordant)."*
- Not done: keep the current *"interaction table needs pharmacist review."*

### D. Clinician think-aloud (n = 3–4)

- **Protocol:** `docs/EVALUATION.md` §2 (already written).
- **Session kit (Claude builds it):** a one-page script, a task card (Maria, James, Dorothy), a timing sheet, and a short post-task questionnaire.
- **Participants:** NYU residents or fellows; 15 min each, over Zoom or in person.
- **Report only what happened:** task completion, time to decision, and quotes. No statistics at n=4.
- **Wording, depending on the outcome:**
  - Done: *"Early think-aloud with 4 clinicians: [one-line finding]."*
  - Not done: keep *"not yet tested with clinicians."*
- **IRB note:** a quality-improvement or usability conversation with colleagues usually isn't human-subjects research, but **check NYU's rule** before you call it a "study." Say "think-aloud sessions," not "a study."

### E. Roadmap slide (or one line on the Proof slide)
*Next: CDS Hooks order suggestions · logic in CQL · silent-mode validation on real charts.*

### F. License
Add `LICENSE` (MIT or Apache-2.0; Justin chooses). Then "open source on GitHub" becomes true.

---

## 5. Schedule

| Day | Claude (code) | Justin (people + deck) | Gate at end of day |
|---|---|---|---|
| **Sun Oct 11** | This plan. Pharmacist packet and think-aloud kit drafts. License. | **Send the pharmacist ask and 3–4 clinician asks tonight.** Confirm whether AMIA allows a deck swap at Speaker Ready. | Asks sent |
| **Mon Oct 12** | A: `sourceRef` in the parser; serializer; mapping tests (test-first). Check whether the Bulk Data public server has usable cancer patients. | Follow up on the asks; schedule the sessions | 208 old tests pass, plus the new serializer tests pass |
| **Tue Oct 13** | A: FHIR output drawer; validator script; sandbox POST and read-back. B: export runner and engine-over-panel script. | Pharmacist review happens (if they said yes) | **Validator: 0 errors.** James round trip N in / N back |
| **Wed Oct 14** | B: synthetic panel, summary screen, slide screenshot. G (Provenance) if there's time. Re-capture the talk stills and compare. **Rewrite the script and the PowerPoint prompt.** | Think-aloud sessions | **Cut-rule checkpoint at noon** (section 6) |
| **Thu Oct 15** | Final regression pass; docs (VERIFICATION rows, MASTER-DOCUMENT F19); deploy; commit. | Build the deck, test it on Windows, do one timed run | Deck runs at ≤ 7:30 |
| **Fri Oct 16** | Standby for fixes | **Upload** | Uploaded |
| **Oct 17 – Nov 9** | H (CDS Hooks suggestions); fold in late pharmacist and think-aloud results | Rehearse 5+ times; swap the deck at Speaker Ready if allowed | — |

---

## 6. Cut rules (decided now so we don't negotiate them at midnight)

- **A isn't validating by Wed noon:** drop the write-back slide and keep a single "writes FHIR" line only if the James bundle validates. Otherwise ship the current deck.
- **B's public server has no usable patients:** show only the synthetic panel, labeled.
- **B isn't working by Wed evening:** drop it entirely. It's the second priority, so this costs nothing.
- **The pharmacist or clinicians aren't done by Thu:** keep the current limitation wording in the deck, and add the result verbally on Nov 10 (and to the slide, if a swap is allowed).
- **Any talk still changes after a change:** stop and revert that change before doing anything else.
- **Timed run over 7:30 on Thu:** cut B's slide first, then the roadmap line.

---

## 7. Talk impact: draft run of show (to be finalized Wed)

Two new slides cost about 40 s, paid for by tightening the problem and Maria.

| Time | Slide | Change from the frozen script |
|---|---|---|
| 0:00–0:30 | Title + Disclosure | Unchanged. The title slide affiliation reads **NYU Langone Health**. |
| 0:30–1:15 | Problem → Thesis | **Re-aimed at the combinatorics** (interaction + renal + contraindication), not Khorana. About 20 s shorter. |
| 1:15–2:20 | FHIR: two doors, one engine | Adds *"Structured FHIR in → structured FHIR out."* The "sign in with Google" aside is cut. |
| 2:20–2:40 | Maria | One sentence |
| 2:40–4:00 | James + clip | Unchanged (the one video) |
| 4:00–4:20 | **NEW: James's decision in FHIR** | Image: the card next to the DetectedIssue JSON, with an arrow to the itraconazole MedicationRequest |
| 4:20–4:45 | **NEW: Same engine, whole panel** | Image: the panel screen (B). Drop it if B is cut. |
| 4:45–6:25 | Proof + honesty | The limitations line is updated if C or D finished. Roadmap line added. |
| 6:25–7:05 | Ask + QR | Unchanged |

New spoken lines (draft):
- **Write-back:** "It doesn't just read FHIR — it writes its reasoning back as standard FHIR. Every blocked drug becomes a DetectedIssue that points to the exact medication that caused it, and the recommendation becomes a draft proposal, never a signed order."
- **Panel:** "And because it's just FHIR in and FHIR out, the same engine can run across a whole panel through Bulk Data export — here, a synthetic oncology panel — and surface the high-risk patients who aren't on prophylaxis. That's the underuse problem from my first slide."

---

## 8. Actions for Justin today

1. **Pharmacist ask:** "Could you spend about an hour reviewing 22 drug-interaction ratings for a student FHIR app I'm presenting at AMIA? Synthetic data only; I'll send a one-page packet." (Claude drafts the packet.)
2. **Clinician asks (3–4):** "15 minutes on Zoom this week to think aloud while using a decision-support prototype?"
3. **Ask AMIA:** "Can presenters update their slides at Speaker Ready on site, after the Oct 16 upload?"
4. **Pick a license:** MIT (simplest) or Apache-2.0.
5. **Verify the Holmes "59%" / "~6 in 10" and the AVERT + CASSINI RR 0.56 figures** against the papers (carried over from before).
