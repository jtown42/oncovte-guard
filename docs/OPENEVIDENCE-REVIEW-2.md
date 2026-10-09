# OncoVTE Guard — OpenEvidence Review 2 (verbatim): finalist talk + ibrutinib correction

> Returned 2026-10-09, after OncoVTE Guard was selected as a finalist (top ~9) in the
> 2026 AMIA/HL7 FHIR App Competition. Three OpenEvidence responses, saved verbatim in
> the order received, plus the presenter's chosen closing "vision" line.
> Citation markers `[n]` are OpenEvidence's. The numbered reference list was returned
> for Part B only; Parts A and C were pasted without their reference lists — **Part C's
> reference list must be retrieved before external citation** (see "Open items" at end).
> Input brief: the Claude Doc "OncoVTE Guard — AMIA 2026 FHIR App Competition
> Presentation Master Brief".
> Prior review: `docs/OPENEVIDENCE-REVIEW.md` (2026-09-06).

---

## Part A — 8-minute script (verbatim)

**Target: 7 min 30 sec spoken · ~1,065 words · 5 slides · no Q&A · audience votes at session end**

Timing split (matches Reviewer 1's instruction — less use case, more FHIR + demo): problem ≤60s, FHIR 90s dedicated (plus FHIR callouts woven through the demo), live demo ~3.5 min.

---

### Run of show

| Time | Segment | On screen | Spoken words |
|---|---|---|---|
| 0:00–0:20 | Hook | Slide 1: title + one patient | ~60 |
| 0:20–1:10 | The problem | Slide 2: the five things to juggle | ~125 |
| 1:10–2:40 | How it uses FHIR | Slide 3: two doors, one engine | ~225 |
| 2:40–6:10 | Live demo | App in presentation mode | ~450 (mostly action) |
| 6:10–7:00 | Proof & honesty | Slide 4: evidence chain + sandbox shot | ~140 |
| 7:00–7:30 | The ask | Slide 5: vote line + QR code | ~40 |

---

### Slide 1 — Hook (0:00–0:20)

**On screen:** App name. One line: *"One patient. One decision. One question."* A single patient silhouette (Maria).

**Say:**
> "A 58-year-old woman is in clinic, three weeks into chemotherapy for pancreatic cancer. Her oncologist has about two minutes to answer one question: should she start a blood thinner to prevent a clot — and which one is safe with her chemo? Today I'll show you an app that answers that, out loud, from the chart."

**Note:** Slow down on the last sentence. Do not read the slide; the slide is the backdrop.

---

### Slide 2 — The problem (0:20–1:10)

**On screen:** Five small icons — risk score, drug interactions, kidneys, platelets/contraindications, "cancers the score skips." Epidemiology citations in small type at the bottom.

**Say:**
> "Clots are the second leading cause of death in people with cancer — second only to the cancer itself. And we can prevent many of them: the AVERT and CASSINI trials showed a direct oral anticoagulant roughly halves clots in high-risk patients. But 'high-risk' and 'which drug' aren't one decision — they're five, at once. You compute a Khorana risk score. You check whether the chemo interacts with each blood thinner. You check the kidneys, the platelets, the contraindications. And you have to recognize the cancers where the score doesn't even apply. Get it wrong one way, she clots. The other way, she bleeds. Most of us do this from memory, between patients."

**Note:** This is the whole clinical section — keep it to ~50 seconds. No trial tables on the slide. "Second leading cause of death" and "roughly halves" are both verified (ITAC 2019/2022; pooled AVERT+CASSINI RR 0.56, Li et al., JTH 2019).

---

### Slide 3 — How it uses FHIR (1:10–2:40)

**On screen:** One diagram. Two doors (SMART app = clinician clicks; CDS Hooks = EHR calls) → one translator → one engine. Four FHIR resources labeled plainly: *who the patient is (Patient), diagnoses (Condition), labs (Observation), active meds (MedicationRequest).*

**Say:**
> "Here's how it works — and this is the part I most want you to remember. FHIR is the common language that EHRs now speak. Any system that speaks it can hand my app the same four things: who the patient is, their diagnoses, their lab results, and their active medications. The app plugs in through two doors. Door one: the clinician clicks it open inside the chart. It signs in securely — think 'sign in with Google,' but for the EHR — and it only ever asks to *read* those four things; it never writes back. Door two: the EHR calls the app on its own. When the chart opens, or when a chemo or blood-thinner order is being written, the EHR rings a doorbell — that's CDS Hooks — and the app answers with one advice card. And here's the design choice I'm proudest of: both doors hand their data to the same translator and the same decision engine. Every diagnosis has to arrive as a coded diagnosis, every lab as a coded lab, every drug as an active prescription — so a stopped drug can't change the advice, and a procedure can't be mistaken for a diagnosis. Same brain, two doors — so the dashboard and the EHR alert can never disagree."

**Note:** This is the reviewer-critical section. No jargon beyond "SMART" and "CDS Hooks," each defined in one breath. End on "same brain, two doors" — it is the line people will repeat. Avoid saying "appliesTo," function names, "terminal state," or "prefetch" on stage.

---

### Slide 4 — Live demo (2:40–6:10, ~3.5 min)

**On screen:** The app in presentation mode (`?present=true`). Nothing pre-baked — every change re-runs the real engine.

**Keep FHIR visible here too** — this is how you answer Reviewer 1 without spending more slide time: narrate where the data came from as you go.

#### Beat 1 — Maria, the clean recommendation (~40s)
**Do:** Open Maria (pancreatic).
**Say:**
> "This is Maria. The engine pulled her diagnosis, her platelets, hemoglobin, white count, and her chemo — all through FHIR. Khorana score of 5, high risk. Verdict: recommend prophylaxis — apixaban or rivaroxaban. And notice every line carries its source: the recommendation, the score, the threshold. Nothing here is a black box."

#### Beat 2 — James, the climax (~2 min)
**Do:** Open James (NHL on ibrutinib). Then remove ibrutinib in the left rail; verdict flips to DOACs. Add it back; LMWH returns.
**Say:**
> "Now James — non-Hodgkin lymphoma, on ibrutinib. Same high-risk picture, but the verdict is different: low-molecular-weight heparin, not a pill. Why? The engine flagged that ibrutinib interacts with both oral options — and instead of just throwing a red alert, it narrowed to the drug that's still safe. Watch what happens when I take ibrutinib off his list. *[remove]* The oral options come right back. Put it back — *[add]* — and we're at heparin again. That's the whole point: this isn't a lookup table. The engine re-runs the entire decision, live, every time the chart changes — exactly what would happen if a pharmacist updated his meds in the real EHR."

**Note:** Rehearse this toggle until it is under 20 seconds and never fails. This is the moment the room remembers.

#### Beat 3 — Dorothy, threshold behavior (~40s) *(pick this OR the bleeding switch, not both)*
**Do:** Open Dorothy (platelets 42,000 → contraindicated). Drag platelet slider past 50,000.
**Say:**
> "One more. Dorothy's platelets are 42,000 — below the safety floor, so every option is off: contraindicated. Watch the threshold. *[drag past 50,000]* Now it recommends — but apixaban with caution, and rivaroxaban still off, because her kidneys can't clear it. The engine knows the difference between 'safe' and 'safe with conditions.'"

---

### Slide 5a — Proof & honesty (6:10–7:00)

**On screen:** Slide 4: three-link chain (tests → traceability matrix → live demo) + one sandbox launch screenshot.

**Say:**
> "How do you know it's right? Three things, and I'll be precise about each. One: 185 automated tests check that the code follows its rules — every threshold, every boundary. Two: a traceability matrix links every rule back to its guideline source, the exact line of code, and the test that proves it. Three: I launched it from the public SMART Health IT sandbox, where it signed in with real OAuth, read live FHIR data, and returned the right verdicts. And here's what I will not claim: it has never been used on a real patient. No users, no outcomes yet. The honest headline is that it's provably *consistent* — not yet clinically *validated*. My next step is to run it silently against real charts and compare it to expert review."

**Note:** The honesty line builds trust and is itself a differentiator (Reviewer 2 praised exactly this). Say it confidently, once.

---

### Slide 5b — The ask (7:00–7:30)

**On screen:** Slide 5: the vote line + a large QR code to the live demo.

**Say (short vote line, ~15s):**
> "If you take one thing away: every recommendation here traces from guideline, to code, to test — and when a drug is unsafe, the engine finds the safe one. That's the decision support I'd want in my EHR. Please vote — and the demo's behind this QR code, try it yourself."

---

### Hook options

**A — Original (patient story):** as in Slide 1 above. Strongest for a mixed room; a face and a clock.

**B — The collision (names the tension in the title):**
> "Chemo and blood thinners don't always get along. Give the wrong combination and you cause the bleed you were trying to prevent. My app reads the chart and, in seconds, tells the oncologist whether to anticoagulate — and which drug is safe with *this* patient's chemo."

**C — The cognitive-load open:**
> "Five things, two minutes, from memory: a risk score, drug interactions, kidneys, platelets, and the cancers where the rules don't apply. That's what stands between a cancer patient and a preventable clot. I built an app that does all five, live, from the chart."

Recommendation: **A as the opener, with the title slide carrying B's "chemo meets anticoagulation" framing** so both land.

### Vote line options

- **15-second (use this):** see Slide 5b.
- **10-second (if running long):** "Every recommendation here traces from guideline, to code, to test — and it finds the safe drug instead of just alerting. If that's what you'd want in your EHR, please vote."

---

### Things to cut (strict 8 minutes, no Q&A)

1. **All trial tables and effect sizes on slides.** Say "roughly halves clots" once; keep AVERT/CASSINI numbers in your back pocket, not on screen.
2. **The step-by-step engine pipeline** (classify → score → interactions → renal → contraindications → synthesis). Show it working in the demo; never narrate the seven steps.
3. **The third live moment.** Two beats maximum after Maria (James + one of Dorothy/bleeding). Cutting the third protects the climax.
4. **The full contraindication-scoping table** (HIT, APS, pregnancy, weight <40 kg, liver). One example — Dorothy's "safe with conditions" — makes the point.
5. **Internal vocabulary:** appliesTo, function names, "terminal state," CapabilityStatement, prefetch, 52-agent knowledge base internals. Keep the FHIR story in plain language.
6. **Deep epidemiology.** One statistic (second leading cause of death). Drop the 4–7 fold, 1-in-5, incidence percentages, and 2-million-cases figures from the spoken track; leave one citation line in small type on Slide 2.
7. **Out-of-scope roadmap** (API-CAT, TARGET-TP, factor XI inhibitors, Bulk Data, CQL, Provenance). Omit unless it comes up — and it won't, since there's no Q&A.

---

### Clinical fact-check (every spoken/slide claim)

All verified against primary literature. None require correction; a few carry nuances worth knowing in case you tighten wording.

| Claim | Verified value | Status | Source |
|---|---|---|---|
| VTE 2nd leading cause of death in cancer | Stated in guideline text | ✅ Keep | ITAC 2019/2022 (Farge et al., Lancet Oncol) |
| Active cancer raises VTE ~4–7 fold | Central estimate; broader range exists (Danish HR 8.5) | ✅ Keep | Khorana et al., Nat Rev Dis Primers 2022; Mulder et al., Blood 2021 |
| Cancer = ~1 in 5 of all VTE | ~20% | ✅ Keep | ASH 2021 (Lyman et al.); AHA 2020 |
| US 12-mo VTE 3.7% overall / 5.7% on systemic therapy | 3.66% / 5.68% | ✅ Exact | Lam et al., Am J Hematol 2026 (Epic Cosmos, n≈1.63M) |
| ~2 million new US cancer cases/yr | 2,001,140 (2024) | ✅ Exact | Siegel et al., CA Cancer J Clin 2024 |
| AVERT: VTE 4.2% vs 10.2%, HR 0.41 (0.26–0.65) | 12/288 vs 28/275; P<0.001 | ✅ Exact | Carrier et al., NEJM 2019 |
| AVERT major bleeding 3.5% vs 1.8% | 10/288 vs 5/275; HR 2.00 (1.01–3.95), P=0.046 | ✅ Exact | Carrier et al., NEJM 2019 |
| CASSINI full-period HR 0.66 (0.40–1.09), NS | 6.0% vs 8.8%, P=0.10 | ✅ Exact | Khorana et al., NEJM 2019 |
| CASSINI on-treatment HR 0.40 (0.20–0.80) | 2.6% vs 6.4% | ✅ Exact | Khorana et al., NEJM 2019 |
| Pooled VTE RR 0.56 (0.35–0.89); symptomatic VTE NS | Li et al. meta-analysis | ✅ Exact | Li et al., JTH 2019 |
| Khorana ≥2 threshold used by ITAC & NCCN | Confirmed | ✅ Keep | ITAC 2022; NCCN v1.2026; ASCO 2023 |
| ASH 2021 treats score 2 as equipoise | Accurate for DOACs | ⚠️ Minor nuance (below) | Lyman et al., Blood Adv 2021 |
| Khorana discriminates weakly in lung cancer | OR 1.1 lung vs 3.2 other (P=0.002) | ✅ Exact | van Es et al., JTH 2020 (IPD meta-analysis) |
| Cancers outside Khorana: myeloma, brain, acute leukemia, MPN | Confirmed exclusion list | ✅ Keep | NCCN v1.2026; ACC 2026 |
| Kidney cancer ~7.6% at 12 months | 7.6% is the *treated* cohort (2.8% overall) | ⚠️ Scope nuance (below) | Lam et al., Am J Hematol 2026 |
| DOACs are P-gp substrates; apixaban/rivaroxaban also CYP3A4 | Confirmed | ✅ Keep | Beavers et al., AHA 2022; Mosarla et al., JACC 2019 |

**Nuances (for your own awareness; none change the script):**

- **ASH 2021 "equipoise":** ASH's *intermediate* tier is scores **1–2 together**, and for DOACs it genuinely presents "prophylaxis or no prophylaxis" as equally acceptable. It does not single out score = 2 the way ASCO/ITAC/NCCN do. Your on-stage wording doesn't depend on this, so no change needed.

- **Kidney cancer 7.6%:** this figure is specifically the systemic-therapy cohort; the all-comers kidney-cancer rate was 2.8% (Lam et al. 2026). If you ever cite it in a handout, label it "on systemic therapy." Not spoken, so no change.

- **Ibrutinib → both DOACs blocked (your climax):** this is the one place a cardio-oncology expert might mentally push back, and it's worth understanding since the demo rests on it. The 2025 ACC guidance (Ganatra et al., JACC) actually calls factor Xa inhibitors *preferred* over dabigatran with ibrutinib, noting no significant clinical adverse events have been observed despite the theoretical PK interaction — it's **dabigatran** that should be avoided. The strongest defense of the app's caution is ibrutinib's *pharmacodynamic* bleeding effect (off-target platelet inhibition), which is an independent reason to be wary of combining it with any oral anticoagulant. Because there's no Q&A, this won't be challenged live, and the demo's point is the live re-run, not the specific verdict. Keep your KB framing exactly as the brief instructs — "faithful to its cited sources," never "accurate" or "validated." If you want to pre-empt it, one optional half-sentence: *"...reflecting the cautious reading in its source set."*

---

## Part B — What wins the vote: presentation strategy (verbatim)

Winning this is a function of two things working together: being the app the FHIR experts respect, and being the talk the whole room remembers eight apps later. The evidence is unusually clear on both, and the good news is that OncoVTE Guard already has the substance — the differentiators you identified last time (traceability, the live what-if editor, narrowing to the safe option) map almost exactly onto what the CDS literature says expert judges value and onto what communication science says wins audience recall. The job in the next four weeks is mostly to weaponize what you have, not build something new.

### What "winning" actually rewards here
This is an attendee vote at the end of nine back-to-back talks — not a rubric-scored judging panel. That format has a specific, evidence-backed implication: memory and distinctiveness decide it, not completeness. Serial-position research shows that in sequential evaluations judged at the end, middle positions are systematically disadvantaged and the items that survive are the distinctive ones — you're remembered "to the extent that you are more distinct than competing items at the time of retrieval." Studies of exactly this kind of end-of-sequence judging (Eurovision, figure skating, sequential wine tasting) find both primacy and recency advantages, with the middle of the pack losing out. [1-4] So two strategic levers:

If you get any say in running order, ask to go first or last. First and last items are recalled faster, with higher confidence. If you can't choose, assume you're in the disadvantaged middle and over-invest in distinctiveness to compensate. [5-6]

Build the entire talk around one repeatable phrase a voter can recall at the ballot. The whole point is that after eight more apps, someone thinks "that was the guideline-to-code-to-test one." Pick that phrase and say it twice.

### The evidence on what wins the experts in the room
The CDS-success literature tells you exactly which features FHIR/informatics judges have internalized as markers of a serious app — and OncoVTE Guard hits most of them. Kawamoto's landmark BMJ review found four independent predictors of CDS success; systems with all four improved practice 94% of the time: automatic provision in workflow, recommendations rather than just assessments, delivery at the point of decision, and computer-based support. [7] Your engine gives a verdict and the safe drug — a recommendation, not an alert — which is the single feature that most separates effective CDS from the alerts clinicians override. [7-8] Roshanov's meta-regression of 162 trials adds that requiring an override reason is the strongest individual predictor of success (OR 11.23). [8] You already built fixed, logged override reasons into the CDS Hooks cards — so name that on stage, because this audience knows how rare and how predictive it is.

The adoption literature also tells you what this crowd fears, so you can pre-empt it: the dominant failure modes are poor workflow fit, alert fatigue, and lack of trust/transparency — not incorrect logic. [9-10] Your non-interruptive-by-default two-channel design is an answer to alert fatigue, and your traceability matrix is an answer to the trust/transparency problem that explainability research says drives CDS acceptance. [11-12] The newer standards-stack work frames FHIR + CQL + CDS Hooks + SMART as the complete modern CDS architecture. [13-14] One honest gap to decide how to handle: you use a deterministic rules engine rather than CQL. That's defensible (and arguably more testable), but a FHIR purist might ask — so frame it as a deliberate choice that bought you the 185-test boundary suite, rather than leaving it unsaid.

### The evidence on what wins the room
Here the communication science is remarkably actionable, and it all points the same direction: structure the talk as a single narrative with your demo as the climax, and ruthlessly cut everything that isn't that.

Use one narrative arc, built on And–But–Therefore. The JAMA Otolaryngology framework for scientific communication says every talk needs one sentence it's "about," and the ABT structure is how you create the tension that makes an audience care: what we know (And), the problem (But), what we built (Therefore). [15] Without it, content becomes "a disconnected list of facts — no single, urgent question emerges." Your arc writes itself: [15] "We can prevent cancer clots, AND the trials prove it, BUT the clinician has to juggle a score, drug interactions, kidney function, and contraindications from memory in two minutes, THEREFORE OncoVTE Guard does that reasoning in seconds — visibly."

Open with a story, not a statistic. A strong opening captures attention and carries momentum through the whole talk; options the literature endorses are a story, a thought-provoking question, or a single compelling image. [16] Thin-slice research is striking here: in pitch studies, impressions formed in the first few seconds predicted evaluator interest — and in those first 4–8 seconds a speaker says only 8–20 words. [17] Your Maria hook (the 58-year-old on chemo, two minutes to decide) is the right instinct; make those first ~15 words count.

Make the live demo the center, and protect it. This is your single biggest lever and it's well-supported: dynamic content drives significantly more engagement than static, and product [18] usage demonstrations (showing it work) produce stronger favorable evaluation than describing features, mediated by "perceived diagnosticity" and mental imagery. [19-20] Reviewer 2 already told you the what-if editor is outstanding. The EEG pitch study found inter-evaluator neural alignment peaked during the solution/climax segment and that peak predicted real funding outcomes — which is the scientific version of "the James ibrutinib toggle is where you win or lose the vote." Give the demo ~3.5 of your 8 minutes, and rehearse the toggle until it's under 20 seconds and cannot fail. [17]

Respect cognitive load — this is where most technical talks die. Working memory holds only 3–4 new chunks; the most common cause of a failed presentation is too much information too fast. [16] So: limit the whole talk to 1–3 key messages, one idea per slide (a "billboard readable at highway speed"), font ≥28–30pt, images over bullet text (picture-superiority effect), and — critically — [16][21-22] don't read your slides, because narrating text verbatim creates visual-auditory dissonance that overloads the audience. [23] Speak over simple graphics instead. This also directly answers Reviewer 1: translating the FHIR into plain language is cognitive-load management.

Deliver with contrast and movement. Vary pace and volume (monotone signals "all of this is equally unimportant"), pause before your key line, use gestures (top TED speakers gesture far more than unpopular ones), move when you make a point rather than gripping the lectern, and close with a restated message and forward vision rather than a references slide. [16] In an empirical study of 44 scientific talks, the most-cited "best features" were clarity, pace, voice, and audience engagement — all delivery, not content. [24]

These ten evidence-based delivery tips are usefully distilled in one figure from the Pediatric Anesthesia paper on scientific presentations, which is worth keeping beside you while you rehearse:

> *[Figure as returned by OpenEvidence:]* Wiley Logo — Figure 1. Ten tips on how to give a great presentation developed by the authors for the Society for Pediatric Anesthesia. Challenging the status quo of scientific presentations. Paediatr Anaesth. February 1, 2021. Used under license from Wiley.

### The concrete plan for the next four weeks
The highest-leverage sequence, in priority order:

Lock the one-sentence arc and the one repeatable phrase. Everything else serves these. Candidate phrase: "guideline, to code, to test — and when a drug is unsafe, it narrows to the safe one instead of just firing an alert." Say it in the FHIR section and again in your close (recency). [6]

Script to ~7:30, 1–3 key messages only, and cut hard. Clinical background ≤60s (Reviewer 1's instruction and cognitive-load theory agree). No trial tables on slides. Five slides max.

Rehearse the James demo until it's bulletproof, and build the three-tier backup (local app → recorded video → screenshots) so a Wi-Fi failure can't sink your climax. [18-19]

Name the three features this expert audience will recognize as rare: recommendations-not-alerts, logged override reasons, and traceable transparency. One sentence each — they signal you know the CDS evidence base. [7-8][11-12]

Rehearse in front of someone who doesn't know FHIR. If the plain-language version lands for them, it lands for the clinicians in the room and satisfies Reviewer 1.

Seed the platform vision in exactly one sentence at the close — the "executable guideline" idea — then make the vote ask. Don't let it expand into the talk.

The thing to internalize: you will not win by being the most complete or the most technically dense app — the format punishes that. You win by being the one people can describe afterward, and the evidence says that comes from a single narrative, a memorable live demo as the climax, plain language, and one phrase repeated at the boundaries of the talk where memory is strongest. [1][6][15]

Want help turning the And–But–Therefore arc into the actual opening 15 seconds and the closing vote line — scripted word-for-word to hit that first-few-seconds impression window and the recency slot?

#### Part B references (verbatim)

1. Evidence for Similar Principles in Episodic and Semantic Memory: The Presidential Serial Position Function. Memory & Cognition. 2010. Neath I.
2. Save the Last Dance for Me: Unwanted Serial Position Effects in Jury Evaluations. Acta Psychologica. 2005. Bruine de Bruin W.
3. Save the Last Dance II: Unwanted Serial Position Effects in Figure Skating Judgments. Acta Psychologica. 2006. Bruine de Bruin W. SR
4. Order in Choice: Effects of Serial Position on Preferences. Psychological Science. 2009. Mantonakis A, Rodero P, Lesschaeve I, Hastie R.
5. Using Response Time Distributions and Race Models to Characterize Primacy and Recency Effects in Free Recall Initiation. Psychological Review. 2019. Osth AF, Farrell S.
6. Primacy (And Recency) Effects in Delayed Recognition of Items From Instances of Repeated Events. Memory. 2024. Rubínová E, Price HL.
7. Improving Clinical Practice Using Clinical Decision Support Systems: A Systematic Review of Trials to Identify Features Critical to Success. BMJ. 2005. Kawamoto K, Houlihan CA, Balas EA, Lobach DF. SR
8. Features of Effective Computerised Clinical Decision Support Systems: Meta-Regression of 162 Randomised Trials. BMJ. 2013. Roshanov PS, Fernandes N, Wilczynski JM, et al. SR
9. Identifying barriers and facilitators to successful implementation of computerized clinical decision support systems in hospitals: a NASSS framework-informed scoping review. Implementation Science: IS. 2023. Abell B, Naicker S, Rodwell D, et al. Review
10. A systematic review of clinicians' acceptance and use of clinical decision support systems over time. NPJ Digital Medicine. 2025. Newton N, Bamgboje-Ayodele A, Forsyth R, Tariq A, Baysari MT.
11. Exploring the role of professional identity in the implementation of clinical decision support systems—a narrative review. Implementation Science: IS. 2024. Ackerhans S, Huynh T, Kaiser C, Schultz C. SR
12. Explainability for artificial intelligence in healthcare: a multidisciplinary perspective. BMC Medical Informatics and Decision Making. 2020. Amann J, Blasimme A, Vayena E, et al.
13. Contemporary Clinical Decision Support Standards Using Health Level Seven International Fast Healthcare Interoperability Resources. Journal of the American Medical Informatics Association: JAMIA. 2021. Strasberg HR, Rhodes B, Del Fiol G, et al. Review
14. Coordinated Use of Health Level 7 Standards to Support Clinical Decision Support: Case Study With Shared Decision Making and Drug-Drug Interactions. International Journal of Medical Informatics. 2022. Thiess H, Del Fiol G, Malone DC, et al.
15. Three Pillars of Effective Scientific Communication: Telling the Story. JAMA Otolaryngology–Head & Neck Surgery. 2026. Piccirillo JF, Olson R.
16. Challenging the status quo of scientific presentations. Paediatric Anaesthesia. 2021. Chatterjee D, Yaster M, Lockman JL, et al.
17. Predicting entrepreneur fundraising success from focus group EEG data. PLoS One. 2025. Yun JH, Heaton S, Wong JS, Klein P, Platt ML.
18. Static vs. Dynamic Methods of Delivery for Science Communication: A Critical Analysis of User Engagement With Science on Social Media. PLoS One. 2021. Habibi SA, Salim L.
19. Effect of Product Presentation Videos on Consumers' Purchase Intention: The Role of Perceived Diagnosticity, Mental Imagery, and Product Rating. Frontiers in Psychology. 2022. Cheng Z, Shao B, Zhang Y.
20. Making Online Products More Tangible: The Effect of Product Presentation Formats on Product Evaluations. Cyberpsychology, Behavior and Social Networking. 2016. Verhagen T, Vonkeman C, van Dolen W.
21. Education Techniques for Lifelong Learning: Giving a PowerPoint Presentation: The Art of Communicating Effectively. Radiographics. 2004. Collins J. Review
22. How to Create and Deliver an Effective Presentation. Gastroenterology. 2016. Kaltenbach T, Soetikno R. Review
23. Delivering Impactful Scientific Oral Presentations. JAMA Surgery. 2024. Choi J, Spain DA. Opinion
24. The 10-Minute Oral Presentation: What Should I Focus On? The American Journal of the Medical Sciences. 2005. Estrada CA, Patel SR, Talente G, Kraemer S.

### Presenter's chosen closing vision line

> "OncoVTE Guard is one use case, but the architecture points to something broader: clinical guidelines that don't live in PDFs—they live in the EHR as transparent, testable, executable logic."

---

## Part C — Ibrutinib correction + replacement demo drug (verbatim)

Two corrections are warranted, and the first one has a direct consequence for your James Chen demo that you'll want to see before you rehearse it.

### 1. Ibrutinib is misclassified — and the current entry inverts the mechanism
Your entry is wrong on both the direction of the metabolic effect and the AUC number.

CYP3A4: ibrutinib is a sensitive substrate, not an inhibitor. The FDA label states ibrutinib and its metabolite PCI-45227 are unlikely to inhibit CYP3A4 at clinical doses; at most it is a weak, reversible intestinal CYP3A4 inhibitor. [1] Its own exposure is exquisitely CYP3A4-dependent — ketoconazole raises ibrutinib AUC 24-fold, rifampin lowers it >10-fold. [1] So calling it a "strong CYP3A4 inhibitor" reverses the pharmacology.

P-gp: ibrutinib is an in-vitro inhibitor, but not a "strong" one, and the effect is modest. The label notes it may inhibit P-gp/BCRP at clinical doses, with no supporting clinical DDI data; PBPK modeling predicts only a ~1.2–1.8-fold rise in P-gp substrate exposure, and the observed venetoclax increase was 1.8-fold. [1-2] It is not a substrate of P-gp. [1]

The "~100% apixaban AUC increase" is unsupported. No clinical PK study has measured apixaban or rivaroxaban levels with ibrutinib; European expert consensus judged any such interaction "unlikely to be of clinical significance," and the 2025 ACC guidance states that although ibrutinib theoretically raises factor Xa inhibitor levels, no significant clinical adverse events have been observed. [3-4] Delete that figure.

The real interaction is pharmacodynamic. Ibrutinib's bleeding risk comes from BTK/Tec-mediated inhibition of platelet GPVI and GPIb–vWF signaling, plus off-target Src inhibition and thrombocytopenia — not from raising DOAC levels. [1][5] The FDA label itself says the mechanism "is not well understood" but that concomitant anticoagulants increase major hemorrhage (6.1% with anticoagulants vs 3.1% without). [1] A population study found bleeding risk was similar across anticoagulant classes (VKA aOR 1.99, DOAC aOR 2.48) — if the mechanism were PK-driven DOAC accumulation, warfarin (not a P-gp substrate) would not be affected, so the parallel risk confirms a pharmacodynamic basis. [6]

#### Corrected per-DOAC cells (your severity scale)

| DOAC | Level | One-sentence mechanism | One-sentence management | References |
|---|---|---|---|---|
| Apixaban | Pharmacodynamic | Ibrutinib impairs platelet function via BTK/Tec inhibition, adding to the anticoagulant's bleeding risk; any CYP3A4/P-gp-mediated rise in apixaban level is modest and not clinically significant. | Factor Xa inhibitors are the preferred anticoagulant with ibrutinib — co-prescribe if benefit outweighs bleeding risk and monitor for bleeding. | [1, 3-5] |
| Rivaroxaban | Pharmacodynamic | Same platelet-mediated additive bleeding mechanism; no validated clinically significant PK interaction. | Acceptable with monitoring, but one retrospective series showed more major bleeding with rivaroxaban (18%) than apixaban (6%), so apixaban may be preferable. | [4-5, 7] |
| Edoxaban | Pharmacodynamic (ACC "moderate") | Predominantly additive bleeding from platelet inhibition; edoxaban is a P-gp substrate so a modest level increase is possible. | Acceptable — ACC lists factor Xa inhibitors, including edoxaban, as preferred; monitor for bleeding. | [4] |
| Dabigatran | Major (avoid) | Ibrutinib's P-gp inhibition can raise levels of dabigatran (the most P-gp-dependent DOAC), compounding its intrinsic platelet/bleeding effect. | Avoid — the 2025 ACC guidance rates this a major interaction. | [4] |

The demo consequence you need to see: as currently built, James Chen flips to LMWH because ibrutinib supposedly "blocks both DOACs." That is clinically backwards — the 2025 ACC cardio-oncology guidance makes factor Xa inhibitors the preferred anticoagulant with ibrutinib, and names dabigatran (not apixaban/rivaroxaban) as the one to avoid. [4] If a cardio-oncologist or pharmacist in that AMIA room knows this guidance, the climax of your talk becomes the one slide that's wrong. The clean fix is to keep the exact same demo mechanic (remove the drug → DOACs return; add it back → LMWH) but swap the interacting agent from ibrutinib to an azole antifungal, which brings us to your second question.

### 2. The replacement interacting drug: itraconazole is the best label-supported choice
All three candidates are combined P-gp + strong CYP3A4 inhibitors and trigger a label "avoid" for both DOACs, but they differ sharply in realism.

FDA label language:

Apixaban — for patients on 2.5 mg twice daily, the label directs to "avoid co-administration with combined P-gp and strong CYP3A4 inhibitors," giving the examples "ketoconazole, itraconazole, ritonavir". This is exactly your prophylaxis dose, so the label says avoid, not dose-reduce. [8]

Rivaroxaban — "Avoid concomitant administration of rivaroxaban with known combined P-gp and strong CYP3A inhibitors (e.g., ketoconazole and ritonavir)". [9-10]

Why itraconazole wins for a "quote the label" slide: it is named explicitly in the apixaban label, and as a combined P-gp/strong-CYP3A inhibitor it falls squarely in rivaroxaban's class-level avoid. [8][11] The Anticoagulation Forum's 2026 DDI table lists systemic itraconazole under "combined P-gp and strong CYP3A4 inhibitors" with the guidance "RIVAROXABAN: AVOID USE; APIXABAN: if already taking 2.5 mg BID, avoid use". [11]

Why not ketoconazole: it is named in both labels and is the strongest perpetrator (rivaroxaban AUC 2.32-fold), but oral ketoconazole carries a boxed warning for fatal hepatotoxicity and was restricted by the FDA in 2013; it is essentially obsolete as a systemic antifungal and would read as anachronistic to an informed audience. [12-14] Avoid it.

Why posaconazole is a close second: mechanistically equivalent and the most clinically authentic azole in hematology (NCCN category 1 for AML/MDS neutropenic prophylaxis), but it is not named in the US apixaban/rivaroxaban label example lists, so it weakens the "here's the exact label text" moment. [11][15]

The magnitude of these interactions is actually modest for itraconazole/posaconazole — apixaban AUC rises ~1.42-fold (itraconazole) and ~1.62-fold (posaconazole), and rivaroxaban ~1.47-fold and ~1.37-fold respectively — yet the label still says avoid categorically at the 2.5 mg prophylaxis dose, which is all your engine needs. [12][16] The differential azole effect on rivaroxaban is shown cleanly in the microdose cocktail study, if you want a figure to anchor the "why azoles" point:

> *[Figure as returned by OpenEvidence:]* Springer Nature Logo — Figure 3. Rivaroxaban plasma concentration-time curves after administration of rivaroxaban 25 µg alone (baseline; red points and dotted line) and during coadministration with different azole fungistatic drugs (itraconazole: yellow squares and line; voriconazole: light green upside triangles and line; fluconazole: dark green quadrates; ketoconazole: orange points; posaconazole: light blue hexagons; isavuconazole: purple downside triangles and line) in linear and logarithmic presentation. Perpetrator Characteristics of Azole Antifungal Drugs on Three Oral Factor Xa Inhibitors Administered as a Microdosed Cocktail. Clin Pharmacokinet. January 1, 2022. Used under license from Springer Nature.

The clinical-realism problem, and how to handle it: routine antifungal prophylaxis is not standard in NHL — ECIL 2025 and NCCN both put NHL at low invasive-fungal-disease risk (~0.5–3%, ~1.5% on BTK inhibitors) and do not recommend routine prophylaxis. [17] So a stock NHL-on-rituximab patient would not plausibly be on itraconazole. Two ways to make it bulletproof:

Keep the lymphoma patient, justify the azole as treatment or selected prophylaxis. ECIL does endorse mold-active azoles in selected NHL with refractory disease and repeated intensive chemotherapy with neutropenia (C-II). A one-sentence stage line: "This patient with relapsed lymphoma developed invasive pulmonary aspergillosis during chemotherapy-induced neutropenia and is on itraconazole — a combined P-gp and strong CYP3A4 inhibitor that both DOAC labels say to avoid, so the engine falls back to LMWH." That is clinically defensible and keeps lymphoma, which Khorana scores (+1 high-risk site). [17]

Or make the azole textbook-authentic with posaconazole prophylaxis. If you'd rather the drug use be unimpeachable, posaconazole in AML/MDS is NCCN category 1 — but note AML (acute leukemia) is in your excluded pathway and won't reach a DOAC→LMWH verdict, so you'd have to keep lymphoma and accept posaconazole's slightly weaker label-text fit. [15]

Recommendation: use itraconazole with the relapsed-lymphoma + invasive-aspergillosis framing. It preserves your existing demo mechanic and patient, is explicitly named in the apixaban label, is class-level "avoid" for rivaroxaban, and is clinically plausible as treatment of a documented fungal infection — and critically, it replaces a drug interaction that was pointing the wrong way with one the FDA labels unambiguously support.

---

## Open items

- **Part C reference list not returned** with the paste (markers [1]–[17]). Retrieve it from
  OpenEvidence before citing the ibrutinib correction externally — in particular the exact
  citation for "2025 ACC guidance" ([4]; Part A names it Ganatra et al., JACC) and the
  ibrutinib FDA label ([1]).
- Part A's script predates Part C: its James beat names ibrutinib and must be rewritten
  for itraconazole before rehearsal.
