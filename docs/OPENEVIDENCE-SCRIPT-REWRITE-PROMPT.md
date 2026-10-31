# OpenEvidence prompt — rewrite the talk script (2026-10-12)

Copy everything between the two lines into OpenEvidence. When it answers, paste back the
whole answer **and** the numbered reference block under it.

---

I'm giving an 8-minute talk at the AMIA 2026 FHIR App Competition (finalist session; no Q&A; the audience votes right after). The audience is clinical informaticians, HL7/FHIR standards people and developers, plus some clinicians. I'm a nervous presenter, so I need a script I can **read almost word for word** that still sounds natural, confident and smart out loud. The other finalists are strong and technical, so nothing can sound basic, vague, hype-y or padded.

Please rewrite the spoken script below to be better, keeping the same 11-slide structure.

**What the app is (so you describe it accurately):** OncoVTE Guard is a deterministic, rules-based clinical decision support app for primary VTE prophylaxis in ambulatory adults with cancer. It is **not AI or machine learning.** It reads FHIR R4 Patient, Condition, Observation and MedicationRequest (read-only) through SMART App Launch or CDS Hooks (`patient-view`, `order-select`). Both go through the same normalizer and the same rule engine. The engine computes the Khorana score (threshold ≥2), checks bleeding risk, platelets, Cockcroft-Gault CrCl, absolute and relative contraindications, and DOAC drug–drug interactions, then recommends apixaban or rivaroxaban, falls back to LMWH (enoxaparin 40 mg daily or dalteparin 5,000 units daily) when both DOACs are blocked, or says prophylaxis is contraindicated or not indicated. The output is also written as FHIR: RiskAssessment (pointing at the labs used), DetectedIssue (pointing at the exact interacting MedicationRequest), a draft/proposal MedicationRequest, a GuidanceResponse and a Provenance record. All 7 demo bundles pass the HL7 validator with 0 errors and round-trip through the public SMART sandbox. It can also screen a synthetic panel through FHIR Bulk Data `$export`. 229 automated tests. Synthetic data only; never used on real patients. Live demo at oncovte-guard.pages.dev; on a phone it opens on James with sliders and toggles, and the verdict updates live.

**Hard rules:**
1. **No credentials, no "as a physician/clinician," no personal backstory.** The only identity on the slides is my name and institution.
2. **Don't call it "reasoning," "thinking" or "intelligent."** It's a rule engine. Say what it does: checks, scores, rules out, evaluates the remaining options, re-runs.
3. **No new statistics or clinical claims.** Only use the verified facts listed below, worded the way they're approved. If you think a claim should change, say so separately with a citation; don't slip it into the script.
4. **Keep these lines (light wording edits are OK):** "Structured FHIR in, structured FHIR out." · "One engine, two doors" (or "both doors run through the same engine") · the chain GUIDELINE → RULE → CODE → TEST → DECISION · "when one treatment is ruled out, the engine evaluates the remaining options."
5. **Patients are synthetic.** Never say "a real patient." Screenshots are "real output from the app."
6. **Total spoken length: 800–850 words** (about 7 minutes at a nervous, slower pace), plus a ~15-second silent video on slide 6.
7. Short sentences that are easy to say. No tongue-twisters, no long nested clauses, no lists of more than five items, no rhetorical questions that sound cheesy.
8. Slide 6 has the only video (James: remove itraconazole → the oral options return; add it back → LMWH). Every other slide is a still image, so don't say "watch" or "as you can see it doing" on still slides.

**Verified facts I can use (already checked by you in an earlier round; keep this wording):**
- Corner stat on slide 1 only (not spoken): "Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis" (Holmes et al., JCO Oncol Pract 2026; high-risk there = Khorana or PROTECHT ≥3, so never tie it to the ≥2 threshold).
- "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients" (overall VTE RR 0.56, 95% CI 0.35–0.89; ITAC 2022).
- One combined strong CYP3A4 + P-gp inhibitor (itraconazole) means the labels say to avoid both apixaban (at 2.5 mg BID) and rivaroxaban.
- Khorana platelet criterion ≥350 ×10⁹/L: 350 scores, 349 doesn't.
- Maria: pancreatic cancer, Khorana 5, high risk → apixaban or rivaroxaban.
- James: 72, lymphoma, on itraconazole, qualifies for prophylaxis → both DOACs avoided → LMWH at the standard prophylactic dose.
- Dorothy (hidden backup): lung cancer, platelets 42,000 → contraindicated; above 50,000 → apixaban with caution, rivaroxaban and LMWH avoided because CrCl is about 18.
- Limits: prototype; synthetic data only; the interaction table needs independent pharmacist review; diagnoses must be ICD-10-coded today (SNOMED next); next step is silent-mode validation on real charts against expert review.

**What I already think is weak (fix these, and anything else you see):**
- The opener is generic, and "partly because it isn't one decision" is an unsupported causal claim. I'd like a concrete hook in the first 15 seconds (for example, a patient whose one medication rules out both recommended pills) without inventing statistics.
- The thesis is abstract and a bit boring ("guidelines are written for humans, but implementing them reliably in software is hard").
- Slide 5's on-slide headline was "Watch it reason — Maria," which is weird on a still image and oversells a rule engine. It needs a better headline and a less flat spoken line.
- Slide 4 ends with "I'll show you … with a real patient," but the patients are synthetic.
- Slide 7 (the FHIR write-back) is dense; make it easy to say while keeping every resource name.
- The close repeats earlier lines. It should land the pitch, point people to the QR (they can move a slider and watch the verdict change on their phone), and ask for the vote without sounding needy.

**Output format I need:**
For each slide: (a) the slide number and title; (b) any change to the on-slide text, including a better headline (or "no change"); (c) the spoken text, **one sentence per line**, with **[PAUSE]** and **[CLICK]** cues where they belong, and the one or two words to stress in **bold**; (d) the word count. At the end: the total word count, a timing table, and a list of every place you changed a clinical claim or wording, with a citation. Slide 11 (Dorothy) stays a hidden backup. Keep the optional "22 drug codes" line on slide 9.

**Current spoken script:**

SLIDE 1 — Title. On slide: OncoVTE Guard · FHIR-native decision support for cancer-associated VTE prophylaxis · Justin Chestang · NYU Langone Health · 2026 AMIA / HL7 FHIR App Competition · corner stat (above).
"We know how to prevent many blood clots in patients with cancer, but prophylaxis is still underused — partly because it isn't one decision. It's risk, bleeding, kidney function, drug interactions and contraindications, all at once. OncoVTE Guard does that reasoning from the EHR, on FHIR, and shows exactly how it got there."

SLIDE 2 — Disclosure. On slide: No financial relationships · Student project · synthetic data only · not used on real patients.
"Quick disclosure: no financial relationships. This is a student project. It runs entirely on synthetic data and has never touched a real patient."

SLIDE 3 — Problem → thesis. On slide (builds): Prevention works — but prescribing it safely means resolving 5 things at once: risk score · bleeding risk · kidney function · drug interactions · contraindications / One interacting drug can rule out both oral options. Kidney function narrows what's left. / Wrong one way → clot. Other way → bleed. / The challenge isn't making a recommendation. It's making the reasoning inspectable and testable. / GUIDELINE → RULE → CODE → TEST → DECISION. Footnote: ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56.
"Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients. The hard part is prescribing it safely, because five things have to be resolved at once: a risk score, bleeding risk, kidney function, drug interactions, and contraindications. One interacting drug can rule out both oral options; kidney function narrows what's left. Get it wrong one way, the patient clots. The other way, she bleeds. So here's the idea behind the whole app. Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to a rule, to the code that runs it, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options."

SLIDE 4 — FHIR: two doors, one engine. On slide: a diagram. In: Patient · Condition · Observation · MedicationRequest (read-only). Doors: SMART App Launch (clinician opens it) and CDS Hooks (EHR invokes it). ONE engine. Out: GuidanceResponse · RiskAssessment · DetectedIssue · draft MedicationRequest · Provenance. Caption: Structured FHIR in, structured FHIR out.
"Here's how it uses FHIR. FHIR gives an app standardized records: a Condition for each diagnosis, an Observation for each lab, a MedicationRequest for each active drug, and the Patient. The app reads exactly those four, read-only, and it's strict about meaning — a diagnosis only from a coded Condition, a lab only from a coded Observation, and a stopped drug can't change the advice. It connects two ways. SMART App Launch, when a clinician opens it inside the chart. And CDS Hooks, when the EHR calls the same engine automatically at a workflow event — a chart opening, or a new drug order being entered. Both doors run through the same normalizer and the same engine, so the dashboard and the EHR alert can't disagree. And the output is FHIR too. Structured FHIR in, structured FHIR out. I'll show you what that means with a real patient."

SLIDE 5 — Maria (still screenshot). On slide: headline "Watch it reason — Maria"; callouts: Risk score 5 · Apixaban or rivaroxaban · Guideline source on every card.
"Two synthetic patients — real output from the app, not mock-ups. Maria has pancreatic cancer and a risk score of 5. Nothing rules out the oral options, so it recommends apixaban or rivaroxaban, with the guideline source on every card."

SLIDE 6 — James (still, then the 15-second video on click). Headline: James — one medication changes the decision.
"James is 72, with lymphoma, and he's taking itraconazole for a serious fungal infection. His risk qualifies him for prophylaxis. The engine checks every drug he's on against every blood thinner. It catches that itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling says to avoid both oral options. Detecting that is only half the problem — the engine then evaluates what's left and recommends an injectable heparin, and shows exactly why each pill was ruled out. [CLICK — play the clip] Watch one thing. Remove itraconazole — the oral options come back. Add it back — we're back to the injectable. Same patient, one medication changed, different recommendation. The whole decision is re-evaluated every time."

SLIDE 7 — James's decision written back as FHIR (still: the clinician's card on top, the DetectedIssue JSON below with "MedicationRequest/medrx-itraconazole-2" highlighted).
"And here's that decision as FHIR. Each blocked drug becomes a DetectedIssue that points at the exact medication order that caused it — here, his itraconazole. The risk score becomes a RiskAssessment that points at the lab results it used. The recommendation becomes a draft proposal, never a signed order, and a Provenance record ties it all to the engine version. Every demo bundle passes the official HL7 validator, and it round-trips through a public FHIR server."

SLIDE 8 — Same engine, whole panel (still; optional, first cut if long).
"Because it's FHIR in and FHIR out, the same engine can run across a whole clinic panel through Bulk Data export. Here, on a synthetic panel I generated, it produces a worklist: patients who meet the guideline threshold with no anticoagulant on file. That's the underuse problem, at the population level."

SLIDE 9 — Proof and honesty. On slide: 349 ×10⁹/L → 0 points · 350 → +1, both tested · SOURCE → RULE → CODE → TEST · FHIR output validated against R4 (HL7 validator: 0 errors) · limits strip · next steps · badge "229 automated tests."
"Why trust it? I built verification into the architecture. The tests I care about most check the exact points where a recommendation flips. A platelet count of 350 adds a risk point; 349 doesn't — and both are tested, because that's precisely where a quiet bug would change the advice. Every clinical rule is linked to its guideline source, the code that implements it, and a test that checks its behavior. Now the limits. It's a prototype, evaluated only on synthetic data. The interaction table still needs independent pharmacist review. And today it reads diagnoses coded in ICD-10 — supporting SNOMED is next, along with silent-mode validation on real charts compared against expert review."
Optional: "While building it, I found 22 drug codes pointing at the wrong medication — one 'chemo' code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation."

SLIDE 10 — The ask (QR code to the live app; stays up through applause).
"OncoVTE Guard turns structured EHR data and clinical guidance into an inspectable, patient-specific decision — and hands that decision back as standard FHIR. Every clinical rule is traceable from its source, to its implementation, to its test. And when one treatment is ruled out, the engine re-evaluates what remains. If that's the kind of FHIR application you'd like to see move forward, I'd be grateful for your vote. The app is live — scan the code and try it yourself. Thank you."

SLIDE 11 — Dorothy (HIDDEN backup). Two stills: 42,000 → contraindicated; 55,000 → apixaban with caution, rivaroxaban and LMWH avoided.
"One more. Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes, but not to a simple yes. Her kidneys are severely impaired, so the engine allows one pill with caution and rules out the others. It reasons about degree."

---
