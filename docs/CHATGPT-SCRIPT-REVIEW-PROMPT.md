# ChatGPT prompt — polish the talk script (2026-10-31)

Copy everything between the two lines into ChatGPT. Bring the whole answer back to Claude: every change gets checked against the app and the verified evidence before it goes into the deck.

---

You're a speechwriter and presentation coach for a technical healthcare audience. Help me polish an 8-minute competition talk that I'll read almost word for word from my speaker notes. I'm a nervous presenter, so every line has to be easy to say out loud, sound spoken rather than written, and make me sound sharp and confident.

**The event:** AMIA 2026 Annual Symposium, FHIR App Competition finals (Nov 10, Dallas). About 9 finalists give 8-minute talks back to back with no Q&A, and the audience votes for the top 3 right after. I present first. The audience is clinical informaticians, HL7/FHIR standards people, developers and some clinicians. The other finalists are strong and technical. Reviewer feedback on my abstract: too much clinical background and not enough about the FHIR app; explain FHIR in plain language. Another reviewer called the demo outstanding.

**The app (describe it accurately):** OncoVTE Guard is a deterministic, rules-based clinical decision support app, **not AI or machine learning**, for primary VTE prophylaxis in ambulatory adults with cancer. It reads FHIR R4 Patient, Condition, Observation and MedicationRequest (read-only) through SMART App Launch or CDS Hooks (patient-view, order-select). Both paths go through the same normalizer and rule engine. The engine scores Khorana (threshold ≥2), checks bleeding risk, platelets, Cockcroft-Gault CrCl, contraindications and DOAC drug–drug interactions, then recommends apixaban or rivaroxaban, falls back to LMWH when both DOACs are blocked, or says prophylaxis is contraindicated or not indicated. The app returns its decision as FHIR (RiskAssessment, a DetectedIssue pointing at the interacting MedicationRequest, a draft/proposal MedicationRequest, GuidanceResponse, Provenance). CDS Hooks currently returns cards; order suggestions are future work. All 7 demo bundles pass the HL7 validator with 0 errors and round-trip through a public FHIR server. It can screen a synthetic panel through Bulk Data $export. 229 automated tests. Synthetic data only. The live demo (QR code) opens on James on a phone, with sliders and toggles that update the verdict live.

**Hard rules (do not break these):**
1. No new statistics, numbers or clinical claims, and don't strengthen the existing ones. If you think a claim is weak, say so in your notes instead of rewriting it into something new.
2. Keep "pooled data from the AVERT and CASSINI trials" (never "each trial showed").
3. Never call the engine "reasoning," "thinking," "intelligent" or "AI." Use verbs like checks, flags, scores, rules out, evaluates, re-runs.
4. The patients are synthetic; never say "real patient." Only slide 8 has video, so don't say "watch" on still slides.
5. Keep these lines (light edits are OK): "Structured FHIR in. Structured FHIR out." · "Both doors run through the same engine, so the dashboard and the EHR alert can't disagree." · guideline, to rule, to code, to test · "when one option is ruled out, the engine evaluates the ones that remain."
6. Don't say a stopped drug can't change the advice (itraconazole has a 2-week washout).
7. Total spoken length 900–960 words across the timed slots below. One sentence per line. Keep the [PAUSE] and [CLICK] cues where they make sense.
8. Keep my self-introduction and disclosure facts as they are (first-year medicine resident at NYU Langone; built as a project in my fourth year of medical school).
9. American English. No rhetorical-question gimmicks, no "imagine a world," no hype words ("revolutionary," "game-changing," "seamless").

**What I want from you:**
1. Read it as an audience member who has just heard eight other talks. Where does attention drop? Which lines sound written rather than spoken? Where would a FHIR expert roll their eyes? Where would a clinician?
2. A revised script in exactly the same format (slide by slide, the time at the top, one sentence per line, cues kept). Mark every line you changed with ✎.
3. A short table of your changes: old line → new line → why.
4. The 3 lines most likely to win votes, and the 3 most likely to lose them.
5. Any line that's hard to say out loud (tongue-twisters, too many stressed syllables, long noun stacks), with an easier version.

**Slides and current speaker notes:**


SLIDE 2 — Title. On screen: OncoVTE Guard · FHIR-native decision support for cancer-associated VTE prophylaxis · Justin Chestang · NYU Langone Health · 2026 AMIA / HL7 FHIR App Competition · small corner stat: "Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis" (Holmes et al., JCO Oncol Pract 2026).
NOTES:
0:00 – 0:20

Hi, I'm Justin Chestang, a first-year medicine resident at NYU Langone Health, and this is OncoVTE Guard.
Guidelines tell you what to do.
They don't tell you how that applies to the one patient in front of you.
OncoVTE Guard does that checking automatically, on FHIR —
and it shows exactly how it reached each answer.


SLIDE 3 — Disclosures. On screen: No financial relationships to disclose · Student project · synthetic data only · not used on real patients.
NOTES:
0:20 – 0:32

Quick disclosure: I have no financial relationships.
I built this as a student project in my fourth year of medical school.
It runs entirely on synthetic data, and it has never been used on a real patient.


SLIDE 4 — Why it matters. On screen: three tiles. ~44% fewer VTE with prophylaxis in higher-risk patients (Pooled AVERT + CASSINI (overall VTE, RR 0.56) · ITAC 2022) · ~6 in 10 high-risk patients received prophylaxis, even in a dedicated prevention program (Holmes et al., JCO Oncol Pract 2026) · Bleeding is the risk on the other side: in the wrong patient, a blood thinner can cause serious bleeding. Takeaway: The hard part isn't knowing prophylaxis works. It's picking the right patient — and the right drug.
NOTES:
0:32 – 1:05

Patients with cancer are at high risk for blood clots.
In patients on chemotherapy, blood clots are one of the leading causes of death after the cancer itself.
Pooled data from the AVERT and CASSINI trials show prophylaxis cut clots by about 44 percent in higher-risk patients.
But even in a dedicated prevention program, only about six in ten high-risk patients received it.
[PAUSE]
And you can't just give everyone a blood thinner — in the wrong patient, it can cause serious bleeding.
So the hard part isn't knowing prophylaxis works.
It's picking the right patient, and the right drug.


SLIDE 5 — The problem. On screen (builds): Four checks, in a single visit: four tiles (Is the clot risk high enough? (Khorana score) · Is another drug in the way? (DOAC–drug interaction) · Do the kidneys allow it? (CrCl) · Can the patient be anticoagulated at all? (bleeding, platelets, contraindications)) / The answers interact — one drug can rule out both oral options. / Wrong one way → clot. Other way → bleed. / The challenge isn't making a recommendation. It's making the logic inspectable and testable. / GUIDELINE → RULE → CODE → TEST → DECISION. Footnote: ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56.
NOTES:
1:05 – 1:50

That takes four checks in a single visit.
Is the clot risk high enough?
Is another drug in the way?
Do the kidneys allow it?
And can this patient be anticoagulated at all?
[PAUSE]
And the answers interact.
One antifungal can rule out both first-choice pills at once.
[CLICK]
So here's the idea behind the app.
Guidelines are written for people to read.
Software needs rules it can run — and proof that the translation is right.
OncoVTE Guard makes that chain explicit: guideline, to rule, to code, to test.
And when one option is ruled out, the engine evaluates the ones that remain.


SLIDE 6 — Two doors, one engine. On screen: a diagram. IN · read-only: Patient, Condition, Observation, MedicationRequest → DOORS: SMART App Launch (clinician opens it), CDS Hooks (EHR invokes it) → ONE engine → OUT · returned, no chart writes: GuidanceResponse, RiskAssessment, DetectedIssue, MedicationRequest · draft, Provenance. Caption: Structured FHIR in, structured FHIR out.
NOTES:
1:50 – 2:45

Here's how it uses FHIR.
The app reads four standard resources:
the Patient, a Condition for each diagnosis, an Observation for each lab, and a MedicationRequest for each drug.
It only reads. It never writes to the chart.
And it's strict about meaning: a diagnosis or a lab counts only if it's coded.
[PAUSE]
There are two ways in.
SMART App Launch, when a clinician opens it inside the chart.
And CDS Hooks, when the EHR calls it automatically — as a chart opens, or a new drug order is entered.
Both doors run through the same engine, so the dashboard and the EHR alert can't disagree.
And the decision comes back as FHIR, too.
Structured FHIR in. Structured FHIR out.
Let me show you, with two synthetic patients — real output from the app.


SLIDE 7 — Maria — clear risk, clear recommendation. On screen: a screenshot of the app with three numbered callouts: Risk score 5 · Apixaban or rivaroxaban · Guideline source on every card.
NOTES:
2:45 – 3:15

Maria has pancreatic cancer and a risk score of five. That's high risk.
That's the Khorana score, and the app calculates it straight from FHIR —
the cancer type from her Condition, and platelets, hemoglobin, white count and BMI from her Observations.
Nothing gets in the way.
So the app recommends apixaban or rivaroxaban — and every card shows the guideline it came from.
James is not that simple.


SLIDE 8 — James — one medication changes the decision. On screen: a screenshot (LMWH recommended; apixaban and rivaroxaban struck through, "Avoid — itraconazole interaction (FDA labeling)"). A 15-second silent video on top plays on click: itraconazole removed → apixaban or rivaroxaban; added back → LMWH.
NOTES:
3:15 – 4:15

James is 72, with lymphoma, and he's on itraconazole for a serious fungal infection.
His risk score qualifies him for prophylaxis.
The engine checks every drug he takes against every blood thinner.
It flags that itraconazole strongly inhibits CYP3A4 and P-glycoprotein — the pathways that clear both oral options.
So the FDA labels say to avoid both.
Catching that is only half the job.
The engine then evaluates what's left, recommends an injectable heparin, and shows exactly why each pill was ruled out.
[CLICK — PLAY THE VIDEO]
Here it is in the app.
Without itraconazole — the oral options come back.
Add it back — we're back to the injectable.
Same patient. One medication. A different recommendation.
And the whole decision re-runs every time.

[IF THE VIDEO WON'T PLAY:] "Without itraconazole, the engine re-runs and the oral options come back. Add it back, and it's the injectable again."


SLIDE 9 — Full-slide image: "James's decision, written back as standard FHIR." Top: the struck-through apixaban/rivaroxaban rows the clinician sees. Bottom: the FHIR R4 DetectedIssue JSON (status final, severity high, code DRG from v3-ActCode, implicated → MedicationRequest/medrx-itraconazole-2 highlighted, mitigation "Use Enoxaparin or Dalteparin").
NOTES:
4:15 – 4:50

And here's that same decision, as FHIR.
Each blocked drug becomes a DetectedIssue — and it points at the exact order that caused it.
Here, his itraconazole.
The risk score becomes a RiskAssessment, pointing at the lab results behind it.
The recommendation becomes a draft MedicationRequest — a proposal, never a signed order.
And a Provenance record ties it all to the exact engine version.
Every demo bundle passes the official HL7 validator with zero errors, and round-trips through a public FHIR server.


SLIDE 10 — Full-slide image: "Same engine, whole panel." FHIR Bulk Data $export → the same engine → a worklist. 40 synthetic patients screened · 19 flagged (meet the threshold, no anticoagulant on file). Labeled SYNTHETIC PANEL. Optional; the first slide to cut if long.
NOTES:
4:50 – 5:15   (FIRST TO CUT: hide this slide if the timed run is over 7:15)

And because it's FHIR in and FHIR out, the same engine can screen a whole clinic at once, through Bulk Data export.
On a synthetic panel I generated, it builds a worklist:
patients who meet the guideline threshold, but have no blood thinner on file.
That turns the underuse problem into a list a clinic can act on.


SLIDE 11 — Title: Clinical software only matters if you can trust how it reaches the answer. On screen: 349 ×10⁹/L → 0 points / 350 ×10⁹/L → +1 point (both sides tested) · SOURCE → RULE → CODE → TEST · FHIR output validated against R4 (HL7 validator: 0 errors) · limits strip: Prototype · synthetic data only · interaction table needs pharmacist review · diagnoses must be ICD-10-coded today · Next: silent-mode validation on real charts · SNOMED CT support · CDS Hooks order suggestions · badge: 229 automated tests.
NOTES:
5:15 – 6:10

So why should anyone trust it?
Because testing is built into the design.
The tests I care about most sit exactly where a recommendation flips.
A platelet count of 350 adds a risk point. 349 doesn't.
Both are tested — because that's exactly where a quiet bug would change the advice.
Every clinical rule is linked to its guideline source, the code that runs it, and a test that checks it.
[PAUSE]
Now, the limits.
This is a prototype, tested only on synthetic data.
The drug-interaction table still needs independent pharmacist review.
And today it reads diagnoses coded in ICD-10. SNOMED support is next —
along with silent-mode testing on real charts, compared against expert review.

[OPTIONAL — only if the run is under 6:30:] "While building it, I found 22 drug codes pointing at the wrong medication. One chemo code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation."


SLIDE 12 — Close. On screen: PATIENT DATA (FHIR) ↓ GUIDELINE → RULE → CODE → TEST ↓ EXPLAINABLE DECISION (FHIR) · a large QR code · Try it live: oncovte-guard.pages.dev · Vote for us.
NOTES:
6:10 – 6:50   (leave this slide up through the applause)

So: OncoVTE Guard takes structured FHIR data and published guidelines,
and turns them into a decision you can inspect, for one specific patient —
then hands that decision back as standard FHIR.
Every rule traces to its source, its code, and its test.
And when one treatment is ruled out, it evaluates what remains.
The app is live. Scan the code — it opens on James.
Move a slider, and the verdict changes right on your phone.
If this is the kind of FHIR app you want to see move forward, I'd be grateful for your vote.
Thank you.


SLIDE 13 — HIDDEN backup. Dorothy: two screenshots, Platelets 42k → 55k: 42,000 → Contraindicated; 55,000 → Apixaban with caution; rivaroxaban and LMWH avoided. Lung cancer · severe kidney impairment (CrCl ≈ 18).
NOTES:
HIDDEN BACKUP — only if the run is very short.

One more.
Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate.
So: contraindicated.
Raise her platelets past 50,000, and the verdict changes — but not to a simple yes.
Her kidneys are severely impaired.
So the engine allows one pill, with caution, and rules out the others.
It doesn't stop at yes or no.


---
