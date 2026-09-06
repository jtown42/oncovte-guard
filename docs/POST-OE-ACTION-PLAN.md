# Post-OpenEvidence Action Plan

## DECISIONS (locked 2026-09-06)
- **Mortality line → Option 2:** "the second leading cause of death in patients with
  cancer, after cancer progression" (guideline-standard; ITAC 2019/2022, ESC 2022).
- **Promotional title → Option 1 (audit-forward):** "When Chemo Meets Anticoagulation:
  A FHIR Engine Whose Every Recommendation You Can Audit." *(human-gated portal paste;
  hybrid alt available)*

## STATUS — executed 2026-09-06 (commit pending)
- [x] WS1 narrative: demo script re-framed (verifiability spine, three-link chain,
  sharpened hook as vote line, "provably consistent not validated" pairing).
- [x] WS2 ≥2 reframe: abstract, design, references, PROJECT-SPEC.
- [x] WS2 APS positivity nuance: `src/core/contraindications.ts` detail + comment; spec.
- [x] WS3 mortality: abstract, rationale, references, spec (+ Lam 2026 scale in abstract).
- [x] WS4 pooled RR labeled "overall VTE" + Bosch (references, spec); RCC Lam data in
  `KIDNEY_NOTE`; DDI framing (ITAC 2022 1A + ACC 2026; EHRA noted as non-source).
- [x] WS5 currency line: design + references + spec.
- [x] WS6 guardrails: "faithful to a single named source set" (references); honesty
  pairing in demo script.
- [x] 185 tests pass; tsc clean; all portal fields within limits.
- [ ] **Human-gated (you):** paste new title + abstract in portal; advisor PDF; headshot; logo.
- [ ] Redeploy only if needed (engine advisory strings changed, not the live verdicts).

---


> Turns `OPENEVIDENCE-REVIEW.md` into concrete edits. Grouped by workstream.
> Nothing here changes a clinical rule — OE confirmed all core rules match NCCN
> v1.2026. Two small code touches (APS advisory text, optional DDI source array)
> add nuance, not new logic. Budget-critical files: `02-rationale.txt` (26 chars
> free) and `04-evaluation.txt` (12 chars free) — additions there require trims.

## Workstream 1 — Narrative spine + hook (highest leverage)
OE strongly endorsed **A (verifiable/traceable CDS) as spine + C (appliesTo LMWH-
fallback) as the demo climax**, with a specific three-link chain the story must tell:
**tests prove faithfulness to the rules → the traceability matrix proves the rules
trace to the literature → the LMWH-fallback demo proves the rules behave
intelligently.** Lead with the *matrix* (provenance), not the test count.

- [ ] Adopt the sharpened one-sentence hook (OE's): *"Every recommendation OncoVTE
  Guard makes can be traced — live, in this room — from a guideline, to a line of
  code, to a test that proves it, and when a drug is unsafe the engine narrows to
  the safe option instead of just firing an alert."*
- [ ] Rewrite `submission/DEMO-SCRIPT.md` opening + close around the three-link chain
  and this hook; keep James → LMWH fallback as the climax; add the confident
  one-sentence honesty line ("provably consistent, not clinically validated — here's
  what would move it to the next tier").
- [ ] Update `docs/NARRATIVE-BRIEF-FOR-OPENEVIDENCE.md` §7 to record the chosen frame.
- [ ] **[human-gated] Promotional title** — soften "so clinicians don't have to wing
  it"/"thinks through" (flirts with replacing judgment) toward auditability. Decision pending.

## Workstream 2 — Substantive framing refinements (2)
These are the two items OE flagged "substantive" — wording, not rules.

- [ ] **Khorana ≥2 label (Q2).** Stop calling ≥2 "the prophylaxis threshold."
  Reframe everywhere to: *"the trial-validated threshold used by ITAC and NCCN,
  distinct from the original ≥3 high-risk label."* Optionally add "net benefit is
  strongest at ≥3." Files: `01-abstract.txt` ("NCCN prophylaxis threshold"),
  `02-rationale.txt`, `04-evaluation.txt`, `docs/PROJECT-SPEC-FOR-REVIEW.md`.
  Prep a Q&A note (ASH 2021 equipoise at 2; NNT ~34 at KS=2 vs ~17 at ≥3, Bosch).
- [ ] **APS positivity nuance (Q5).** Keep the blanket DOAC-class contraindication as
  the safe default, but enrich the advisory/detail string to note evidence is
  strongest in triple-positive/high-risk APS. Files: `src/core/contraindications.ts`
  (APS `source`/detail), possibly a test assertion in
  `tests/core/contraindications.test.ts`. Showcases appliesTo sophistication.

## Workstream 3 — Mortality framing (Q1, high-value polish)
OE: we over-corrected. "Second leading cause of death (after cancer progression)"
is guideline-standard (ITAC 2019/2022, ESC 2022); for our *ambulatory chemo*
population specifically, Brito-Dellan et al. support **"the leading cause of death."**
- [ ] Restore the stronger mortality line (decision pending on which). Files:
  `01-abstract.txt`, `02-rationale.txt`, `submission/11-references.txt` wording note.
- [ ] Add contemporary scale figure (Lam 2026: 12-mo VTE 3.7% overall, **5.7% on
  systemic therapy**) where budget allows. Optional: note risk is higher in recent
  cohorts (Danish HR 8.5) — keep 4–7× as the guideline-safe base.

## Workstream 4 — Polish citations & data points
- [ ] **Pooled efficacy (Q3):** where RR 0.56 (0.35–0.89) is cited, label it
  **overall VTE** (pooled symptomatic VTE was NS). Add Bosch et al. 2020 (Blood Adv;
  RR 0.51 at KS≥2, NNT by tier). File: `submission/11-references.txt`, PROJECT-SPEC §8.
- [ ] **DDI sources (Q4):** add **EHRA Practical Guide** DOAC-interaction table +
  **ITAC 2022 (1A)** and **ACC 2026** as the LMWH-fallback decision authorities.
  Files: `submission/03-design.txt`, `11-references.txt`, PROJECT-SPEC §4.3/§8; and
  optionally add EHRA to the KB `sources` array in `src/data/ddi-knowledge-base.json`
  (data edit; re-run tests).
- [ ] **RCC (Q6):** strengthen KIDNEY_NOTE advisory with the Lam 2026 data point
  (kidney ~7.6% > bladder ~4.8% > testicular ~3.8%) and ACC 2026 (metastatic RCC =
  high-bleeding-risk). File: `src/data/icd10-cancer-map.ts` KIDNEY_NOTE; references.
- [ ] **Lung (Q7):** keep van Es caveat verbatim; optionally add a "biomarker models
  (TARGET-TP) outperform Khorana in lung/GI" frontier note. File: references / spec.

## Workstream 5 — Currency statement (Q8, cheap credibility)
- [ ] Add a one-liner "current as of NCCN v1.2026, ITAC 2022, ASCO 2023, ACC 2026"
  and a sentence acknowledging **API-CAT (2025)**, **TARGET-TP**, and **factor XI
  inhibitors (abelacimab)** as tracked-but-out-of-scope (primary vs secondary
  prophylaxis boundary). Files: `04-evaluation.txt` (sustainability/future work),
  PROJECT-SPEC §7/§8.

## Workstream 6 — Overclaiming guardrails (Q9/§9)
- [ ] In `DEMO-SCRIPT.md` and any slide notes: always pair "provably consistent" with
  "not clinically validated — no patients, no clinician evaluation, synthetic data."
- [ ] Scrub unqualified "accurate" for the DDI module; use "faithful to a single
  named source set." Grep submission/ for "accurate".

## Sequencing
1. Resolve the two decisions (mortality line; promotional title).
2. Text edits (WS 2–5) with `npm run check:submission` after each budget-tight file.
3. Code edits (APS advisory, KIDNEY_NOTE, optional DDI source) + `npx vitest run`.
4. Narrative/demo rewrite (WS1).
5. `npm run build:submission`; final limit check; commit; (redeploy only if engine text on the live UI changed).
6. Hand back the human-gated portal items (title, abstract re-paste).
