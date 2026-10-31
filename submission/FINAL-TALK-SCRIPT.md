# OncoVTE Guard — Talk script v3 (reading copy)

> These are word for word the speaker notes in `OncoVTE-final.pptx`, generated from `scripts/deck-notes.py` by `scripts/talk-script-md.py`. Earlier versions are in git history.

**How to use it:** read one line at a time. Each line is one breath. **[PAUSE]** = stop for one full second. **[CLICK]** = advance. The time at the top of each slide is where you should be when the slide comes up.

**Length:** about 950 spoken words, about 7:00 at a calm pace with the 14-second video. Over 7:15 in rehearsal → hide slide 10 (panel), which saves about 25 s.

**Lines to know cold:** the first two sentences, "Structured FHIR in. Structured FHIR out.", the James clip lines, and the whole close.

---

## Slide 2 — Title

**0:00 – 0:20**

> Hi, I'm Justin Chestang, a first-year medicine resident at NYU Langone Health, and this is OncoVTE Guard.
>
> Guidelines tell you what to do.
>
> They don't tell you how that applies to the one patient in front of you.
>
> OncoVTE Guard does that checking automatically, on FHIR —
>
> and it shows exactly how it reached each answer.

---

## Slide 3 — Disclosures

**0:20 – 0:32**

> Quick disclosure: I have no financial relationships.
>
> I built this as a student project in my fourth year of medical school.
>
> It runs entirely on synthetic data, and it has never been used on a real patient.

---

## Slide 4 — Why it matters

**0:32 – 1:05**

> Patients with cancer are at high risk for blood clots.
>
> Clots are a leading cause of death in cancer — second only to the cancer itself.
>
> Pooled data from the AVERT and CASSINI trials show prophylaxis roughly halved clots in higher-risk patients.
>
> But even in a dedicated prevention program, only about six in ten high-risk patients got it.
>
> **[PAUSE]**
>
> And you can't just give everyone a blood thinner — the wrong patient bleeds.
>
> So the hard part isn't knowing prophylaxis works.
>
> It's picking the right patient, and the right drug.

---

## Slide 5 — The problem

**1:05 – 1:50**

> That takes four checks in a single visit.
>
> Is the clot risk high enough?
>
> Is another drug in the way?
>
> Do the kidneys allow it?
>
> And can this patient be anticoagulated at all?
>
> **[PAUSE]**
>
> And the answers interact.
>
> One antifungal can rule out both first-choice pills at once.
>
> **[CLICK]**
>
> So here's the idea behind the app.
>
> Guidelines are written for people to read.
>
> Software needs rules it can run — and proof that the translation is right.
>
> OncoVTE Guard makes that chain explicit: guideline, to rule, to code, to test.
>
> And when one option is ruled out, the engine evaluates the ones that remain.

---

## Slide 6 — Two doors, one engine

**1:50 – 2:45**

> Here's how it uses FHIR.
>
> The app reads four standard resources:
>
> the Patient, a Condition for each diagnosis, an Observation for each lab, and a MedicationRequest for each drug.
>
> It only reads. It never writes to the chart.
>
> And it's strict about meaning: a diagnosis or a lab counts only if it's coded.
>
> **[PAUSE]**
>
> There are two ways in.
>
> SMART App Launch, when a clinician opens it inside the chart.
>
> And CDS Hooks, when the EHR calls it automatically — as a chart opens, or a new drug order is entered.
>
> Both doors run through the same engine, so the dashboard and the EHR alert can't disagree.
>
> And the decision comes back as FHIR, too.
>
> Structured FHIR in. Structured FHIR out.
>
> Let me show you, with two synthetic patients — real output from the app.

---

## Slide 7 — Maria — clear risk, clear recommendation

**2:45 – 3:15**

> Maria has pancreatic cancer and a risk score of five. That's high risk.
>
> That's the Khorana score, and the app calculates it straight from FHIR —
>
> the cancer type from her Condition, and platelets, hemoglobin, white count and BMI from her Observations.
>
> Nothing gets in the way.
>
> So the app recommends apixaban or rivaroxaban — and every card shows the guideline it came from.
>
> James is not that simple.

---

## Slide 8 — James — one medication changes the decision (VIDEO)

**3:15 – 4:15**

> James is 72, with lymphoma, and he's on itraconazole for a serious fungal infection.
>
> His risk score qualifies him for prophylaxis.
>
> The engine checks every drug he takes against every blood thinner.
>
> It flags that itraconazole strongly inhibits CYP3A4 and P-glycoprotein — the pathways that clear both oral options.
>
> So the FDA labels say to avoid both.
>
> Catching that is only half the job.
>
> The engine then evaluates what's left, recommends an injectable heparin, and shows exactly why each pill was ruled out.
>
> **[CLICK — PLAY THE VIDEO]**
>
> Here it is in the app.
>
> Without itraconazole — the oral options come back.
>
> Add it back — we're back to the injectable.
>
> Same patient. One medication. A different recommendation.
>
> And the whole decision re-runs every time.
>
> [IF THE VIDEO WON'T PLAY:] "Without itraconazole, the engine re-runs and the oral options come back. Add it back, and it's the injectable again."

---

## Slide 9 — James's decision, written back as standard FHIR

**4:15 – 4:50**

> And here's that same decision, as FHIR.
>
> Each blocked drug becomes a DetectedIssue — and it points at the exact order that caused it.
>
> Here, his itraconazole.
>
> The risk score becomes a RiskAssessment, pointing at the lab results behind it.
>
> The recommendation becomes a draft MedicationRequest — a proposal, never a signed order.
>
> And a Provenance record ties it all to the exact engine version.
>
> Every demo bundle passes the official HL7 validator with zero errors, and round-trips through a public FHIR server.

---

## Slide 10 — Same engine, whole panel (first to cut)

**4:50 – 5:15   (FIRST TO CUT: hide this slide if the timed run is over 7:15)**

> And because it's FHIR in and FHIR out, the same engine can screen a whole clinic at once, through Bulk Data export.
>
> On a synthetic panel I generated, it builds a worklist:
>
> patients who meet the guideline threshold, but have no blood thinner on file.
>
> That turns the underuse problem into a list a clinic can act on.

---

## Slide 11 — Proof and limits

**5:15 – 6:10**

> So why should anyone trust it?
>
> Because testing is built into the design.
>
> The tests I care about most sit exactly where a recommendation flips.
>
> A platelet count of 350 adds a risk point. 349 doesn't.
>
> Both are tested — because that's exactly where a quiet bug would change the advice.
>
> Every clinical rule is linked to its guideline source, the code that runs it, and a test that checks it.
>
> **[PAUSE]**
>
> Now, the limits.
>
> This is a prototype, tested only on synthetic data.
>
> The drug-interaction table still needs independent pharmacist review.
>
> And today it reads diagnoses coded in ICD-10. SNOMED support is next —
>
> along with silent-mode testing on real charts, compared against expert review.
>
> [OPTIONAL — only if the run is under 6:30:] "While building it, I found 22 drug codes pointing at the wrong medication. One chemo code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation."

---

## Slide 12 — The close (QR code)

**6:10 – 6:50   (leave this slide up through the applause)**

> So: OncoVTE Guard takes structured FHIR data and published guidelines,
>
> and turns them into a decision you can inspect, for one specific patient —
>
> then hands that decision back as standard FHIR.
>
> Every rule traces to its source, its code, and its test.
>
> And when one treatment is ruled out, it evaluates what remains.
>
> The app is live. Scan the code — it opens on James.
>
> Move a slider, and the verdict changes right on your phone.
>
> If this is the kind of FHIR app you want to see move forward, I'd be grateful for your vote.
>
> Thank you.

---

## Slide 13 — Dorothy (HIDDEN backup)

**HIDDEN BACKUP — only if the run is very short.**

> One more.
>
> Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate.
>
> So: contraindicated.
>
> Raise her platelets past 50,000, and the verdict changes — but not to a simple yes.
>
> Her kidneys are severely impaired.
>
> So the engine allows one pill, with caution, and rules out the others.
>
> It doesn't stop at yes or no.

---

## Claims in this script and where they come from
- Prophylaxis roughly halved clots in higher-risk patients: pooled AVERT + CASSINI, overall VTE RR 0.56 (95% CI 0.35–0.89), ITAC 2022 (OpenEvidence round 5). Say "pooled", never "each trial showed".
- Only about six in ten high-risk patients got prophylaxis, even in a dedicated program: Holmes et al., JCO Oncol Pract 2026 (round 5). "High-risk" there means Khorana or PROTECHT ≥3, so never tie it to the app's ≥2 threshold.
- Clots are a leading cause of death in cancer, second only to the cancer itself: Khorana et al., J Thromb Haemost 2007. **Pending OpenEvidence check (docs/OPENEVIDENCE-FACTCHECK-7.md); spoken only, not on a slide.**
- Itraconazole: FDA labels say avoid with apixaban 2.5 mg BID and with rivaroxaban (round 5). The itraconazole label also says avoid for 2 weeks after stopping (round 6), so the script never says a stopped drug can't change the advice.
- 350 vs 349 platelets: Khorana ≥350 ×10⁹/L (round 5). Maria: Khorana 5, high risk (round 5). Dorothy: platelets <50k contraindicated; CrCl ~18 → apixaban with caution (round 5).
- FHIR claims: 7/7 demo bundles 0 validator errors; sandbox round trip; 229 tests. All verified in the repo.

## If something goes wrong
- **The video won't play:** the still is already up. Read the [IF THE VIDEO WON'T PLAY] line and move on.
- **You lose your place:** look at the slide title, find that slide here, and start at its first line. Every slide stands alone.
- **Running long:** skip slide 10 (one click past it), then cut Maria to her first and last lines.
- **Running short:** add the optional 22-codes line on slide 11.
