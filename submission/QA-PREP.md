# OncoVTE Guard — Live Q&A Prep Sheet

> For the AMIA / HL7 FHIR App Competition, presented live Nov 10. Every answer is
> written to be *spoken* — short, confident, honest. The move on every hard question
> is the same: **concede the limit cleanly, then pivot to the design discipline that
> anticipated it.** You are not defending a finished product; you are demonstrating
> that you saw the hard parts and made a principled, documented call.

## North star (say some version of this whenever you can)
> "This is decision support you can **audit** — every recommendation traces to a
> guideline, a line of code, and a test that proves it — and when a drug is unsafe,
> the engine narrows to the safe option instead of just firing an alert."

## The honesty line (deploy once, early, then stop apologizing)
> "I hold this to a three-tier claim standard. The honest headline is **provably
> consistent — not clinically validated.** No patients, no clinician evaluation,
> synthetic data only. Here's exactly what would move it to the next tier: a
> prospective study of appropriate-prophylaxis rate, symptomatic VTE, major bleeding,
> and alert-override rate." — Then move on. Confidence, not penance.

---

## TIER 1 — most likely, highest-stakes (rehearse these cold)

### Q1. "Why offer prophylaxis at Khorana ≥2 when ASH treats a score of 2 as equipoise and reserves a clear recommendation for ≥3?"
**Answer.** "Because ≥2 is the *trial-validated* threshold: both pivotal RCTs — AVERT
and CASSINI — enrolled at Khorana ≥2, and ITAC and NCCN both adopt ≥2. So the app is
faithful to the evidence the drugs were actually approved on. You're right that the
net benefit is strongest at ≥3 — the number-needed-to-treat is roughly 17 at ≥3
versus ~34 at a score of 2 — and ASH 2021 preserves that nuance as equipoise. My app
doesn't hide that: it scores ≥2 as the actionable threshold *and* surfaces the tier
so the clinician sees whether a patient is at 2 or 4. It informs the judgment call;
it doesn't pretend the call is binary."
**If pressed ("so you'd anticoagulate a borderline patient?"):** "The app *recommends
considering* prophylaxis and shows the bleeding-risk panel alongside — it never
auto-prescribes. At a score of 2 with high bleeding risk, the tool makes the tradeoff
explicit rather than hiding it behind a single yes/no."

### Q2. "A blanket DOAC contraindication in antiphospholipid syndrome — isn't that too broad? The strong evidence is really just triple-positive disease."
**Answer.** "That's exactly the right question, and it's why the block is *targeted*,
not universal. In APS the app removes the DOAC class and falls back to LMWH — it never
aborts anticoagulation. You're correct that the strongest evidence — TRAPS, pooled OR
~5.4 for arterial thrombosis versus VKA — is in triple-positive, high-risk disease,
and the app says so in the advisory text. But NCCN extends the concern to single- and
double-positive disease, and for a *safety default* in an automated tool, matching the
guideline's conservative stance is the defensible call. What I'd want before relaxing
it is exactly the positivity data the current record is underpowered on."
**If pressed:** "Note the app can't read antibody-positivity from a single reliable
FHIR code today, so a stratified rule would be acting on data it doesn't have — another
reason the conservative default is the honest one."

### Q3. "The DOAC–chemotherapy interaction evidence is thin and sources disagree. Why should I trust your 52-agent table?"
**Answer.** "You shouldn't trust it as validated — and I don't claim it is. This is my
B-tier claim: it's *curator-mediated*, faithful to a single named source set — the AHA
2022 cardio-oncology statement, Hellfritzsch 2024, and FDA labeling — applied
consistently, with the 16 recommendation-changing 'major' cells individually
evidence-anchored. The literature genuinely disagrees: Nowinski and Chaireti 2025
found about 35% of pairs flagged by at least one source, with frequent conflict. My
answer to that isn't to pretend certainty — it's transparency: every interaction shows
its source, the curation date is labeled as authorship not sign-off, and an unknown
drug is surfaced as 'verify manually,' never silently dropped."
**If pressed ("so it could be wrong?"):** "It could disagree with another source, yes —
which is why it's positioned as a checkable prompt for the clinician and pharmacist,
not an oracle. The value is that it never *forgets* to check, and it always shows its
work."

### Q4. "What would it take to call this clinically validated?"
**Answer.** "A prospective study in a live EHR: appropriate-prophylaxis rate against
expert adjudication, then symptomatic VTE and major bleeding as outcomes, plus
alert-override and alert-fatigue rates for the CDS Hooks surface. That's the study I've
designed and would run next. Today the claim is deliberately narrower and fully
supportable — provably *consistent*: it applies its encoded rules faithfully every
time, and you can audit that claim in this room."

---

## TIER 2 — very likely (have the one-liner ready)

### Q5. "How is this more than a Khorana calculator? Those already exist."
"A calculator gives you a number. This gives you a *decision* — it unifies the score
with a per-drug interaction screen, renal dosing, and targeted contraindications, and
it reasons to the next-best agent when the preferred one is unsafe. The James case in
the demo — ibrutinib blocks both preferred DOACs, so it falls back to LMWH and refuses
to substitute a non-guideline DOAC — is something no calculator does."

### Q6. "Renal-cell carcinoma isn't scored — aren't you missing high-risk patients? RCC clots a lot."
"It clots more than some cancers that *do* score — contemporary US data put kidney at
~7.6% versus bladder ~4.8% and testicular ~3.8%. But the Khorana model, and NCCN,
score only bladder and testicular among GU cancers. I made a deliberate choice: rather
than invent an off-guideline score that could by itself cross the ≥2 threshold and
silently flip the decision, I score the guideline and *flag the gap* — RCC surfaces as
an advisory and as a bleeding-risk factor. It's the discipline of the whole engine:
score what's validated, surface what isn't."

### Q7. "'Identical by construction' — what does that actually buy me, and can you prove it?"
"Both surfaces — the SMART dashboard and the CDS Hooks service — call the same pure
reasoning engine; neither has its own copy of the logic. So they *cannot* drift apart
as guidelines change, which is the usual failure mode when a dashboard and an alert are
maintained separately. I can prove it: the same test suite drives both paths, and you
can read the shared engine module in the repo."

### Q8. "Why only apixaban and rivaroxaban? Why not dabigatran or edoxaban?"
"Because those are the two the guideline endorses for ambulatory cancer prophylaxis and
the two the trials studied. Dabigatran and edoxaban appear only as interaction and
renal references — and the app *actively refuses* to fall back to them, which is a
safety feature, not a gap."

### Q9. "Have you run this against a live EHR or a real FHIR sandbox?"
"Yes — a real SMART sandbox. I loaded the five synthetic oncology bundles into the
SMART Health IT public sandbox and EHR-launched the app against each: it completed the
real OAuth2/PKCE handshake, read the patient's live Condition, Observation, and
MedicationRequest resources off the server, and produced the correct verdicts — recommend
for the pancreatic patient, the LMWH fallback when ibrutinib blocked both DOACs, and
contraindicated at platelets 42k. That's the full pipeline against a real SMART-secured
FHIR server, not just the login. Honest scope: it's a public sandbox with synthetic
patients I authored, so it demonstrates standards-native interoperability and faithful
reasoning — not clinician validation or production-EHR use, which stay the next steps."

### Q10. "Active major bleeding is just a checkbox the clinician sets — isn't that a cop-out?"
"It's a deliberate scope decision. FHIR has no single reliable representation of
'actively bleeding right now,' so rather than infer it wrongly from codes, I model it
as a clinician-confirmed flag — the determination stays with the human, but it still
hard-stops the recommendation. Inferring it unreliably would be the more dangerous
choice."

---

## TIER 3 — possible (know the facts, keep it brief)

### Q11. "You still score lung cancer even though Khorana barely discriminates there."
"Correct, and the app says so — it scores lung per the model but attaches an advisory
citing the van Es individual-patient-data meta-analysis, where the score's odds ratio
in lung is ~1.1 versus ~3.2 elsewhere. Score the guideline, flag the gap — same
pattern. Biomarker-driven models like TARGET-TP are the frontier there, and I note that."

### Q12. "Aren't you overstating efficacy? CASSINI's primary endpoint was negative."
"I'm careful about exactly this. I credit the *pooled* AVERT+CASSINI analysis — RR ~0.56
for overall VTE — not CASSINI's primary result, which over the full period was not
significant. And I flag that the pooled *symptomatic*-VTE reduction didn't reach
significance either. The claim is 'targeted prophylaxis reduces VTE in higher-risk
patients,' which the pooled data support, not 'these trials individually hit their
endpoints.'"

### Q13. "Who maintains the interaction knowledge base? It'll go stale."
"It's an external, versioned data file with per-agent source attribution — so a guideline
or labeling update is a data edit, not a code rewrite, and the test suite re-verifies it
immediately. That's the sustainability model: the clinical knowledge is decoupled from
the code so it can be updated under review without touching the engine."

### Q14. "How do you avoid alert fatigue in the CDS Hooks surface?"
"The order-select service only fires on an actual anticoagulant/chemo order, and it
leads with severity — a major interaction is a distinct card, not one of ten. The design
principle is that the push surface interrupts only when the decision is actually
changing."

### Q15. "Is your US Core / FHIR conformance claim real?"
"It's deliberately narrow and honest: I parse the US Core race and ethnicity extensions
from Patient and follow SMART App Launch for auth. I do *not* claim full US Core profile
conformance or validation — only what I actually implemented."

---

## Reusable moves (pull these out under any pressure)
- **Tier discipline:** "That's an A-tier / B-tier / engineering claim —" tells the judge
  you know the difference between proven, curated, and asserted.
- **"Score the guideline, flag the gap."** Your one-phrase design philosophy — RCC, lung,
  pancreatic, hepatic all fit it. Use it by name.
- **Targeted, not blunt.** HIT removes only LMWH; APS/pregnancy remove only DOACs;
  hepatic blocks only the affected agent. "It narrows; it doesn't abort."
- **Show, don't tell.** If a question is about behavior, offer to demonstrate it live —
  toggle the flag, remove the drug. You can, and almost no competitor can.
- **When you don't know:** "I don't have data on that — here's how the design would
  handle it, and here's what I'd need to answer it properly." Never bluff a number.

## Numbers to have cold
- AVERT: VTE 4.2% vs 10.2%, HR 0.41 (0.26–0.65); major bleeding HR 2.00 (1.01–3.95).
- CASSINI: primary HR 0.66 (0.40–1.09), NS; on-treatment HR 0.40 (0.20–0.80).
- Pooled: overall VTE RR ~0.56 (0.35–0.89); symptomatic VTE NS (~0.58, 0.29–1.13); no
  significant major-bleeding excess. Bosch 2020: RR ~0.51 at KS≥2; NNT ~34 at 2 vs ~17 at ≥3.
- APS: TRAPS (triple-positive) stopped early; pooled OR ~5.4 arterial thrombosis vs VKA.
- RCC vs scored GU: kidney ~7.6% vs bladder ~4.8%, testicular ~3.8% (Lam 2026, 12-mo).
- Lung Khorana: OR ~1.1 vs ~3.2 elsewhere (van Es IPD; P-interaction 0.002).
- Burden: VTE = second leading cause of death in cancer (after progression); risk ~4–7×;
  12-mo incidence ~3.7% overall, ~5.7% on systemic therapy (Lam 2026).
- Engine: 185 tests, 15 files; 52 DDI agents × 4 DOACs; 5 terminal states; 5 synthetic patients.
