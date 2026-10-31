"""Final speaker notes for the AMIA deck (word-for-word reading script).

Used by scripts/finalize-deck.py and mirrored in submission/FINAL-TALK-SCRIPT.md.
Keys are 1-based slide positions in OncoVTE.pptx (slide 1 is a hidden blank,
slide 12 the hidden Dorothy backup). One sentence per line.
"""

NOTES = {
2: """0:00 – 0:20

Hi, I'm Justin Chestang, a first-year medicine resident at NYU Langone Health, and this is OncoVTE Guard.
Guidelines tell you what to do.
They don't tell you how that applies to the one patient in front of you.
OncoVTE Guard does that checking automatically, on FHIR —
and it shows exactly how it reached each answer.""",

3: """0:20 – 0:32

Quick disclosure: I have no financial relationships.
I built this as a student project in my fourth year of medical school.
It runs entirely on synthetic data, and it has never been used on a real patient.""",

4: """0:32 – 1:45

Patients with cancer are at high risk for blood clots.
Clots are a leading cause of death in cancer — second only to the cancer itself.
Pooled data from the AVERT and CASSINI trials show prophylaxis roughly halved clots in higher-risk patients.
[PAUSE]
But a blood thinner in the wrong patient causes bleeding.
So the real problem is picking the right patient, and the right drug.
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
And when one option is ruled out, the engine evaluates the ones that remain.""",

5: """1:45 – 2:40

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
Let me show you, with two synthetic patients — real output from the app.""",

6: """2:40 – 3:10

Maria has pancreatic cancer and a risk score of five. That's high risk.
That's the Khorana score, and the app calculates it straight from FHIR —
the cancer type from her Condition, and platelets, hemoglobin, white count and BMI from her Observations.
Nothing gets in the way.
So the app recommends apixaban or rivaroxaban — and every card shows the guideline it came from.
James is not that simple.""",

7: """3:10 – 4:10

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

[IF THE VIDEO WON'T PLAY:] "Without itraconazole, the engine re-runs and the oral options come back. Add it back, and it's the injectable again." """,

8: """4:05 – 4:40

And here's that same decision, as FHIR.
Each blocked drug becomes a DetectedIssue — and it points at the exact order that caused it.
Here, his itraconazole.
The risk score becomes a RiskAssessment, pointing at the lab results behind it.
The recommendation becomes a draft MedicationRequest — a proposal, never a signed order.
And a Provenance record ties it all to the exact engine version.
Every demo bundle passes the official HL7 validator with zero errors, and round-trips through a public FHIR server.""",

9: """4:40 – 5:05   (FIRST TO CUT: hide this slide if the timed run is over 7:15)

And because it's FHIR in and FHIR out, the same engine can screen a whole clinic at once, through Bulk Data export.
On a synthetic panel I generated, it builds a worklist:
patients who meet the guideline threshold, but have no blood thinner on file.
That turns the underuse problem into a list a clinic can act on.""",

10: """5:05 – 6:00

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

[OPTIONAL — only if the run is under 6:30:] "While building it, I found 22 drug codes pointing at the wrong medication. One chemo code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation." """,

11: """6:00 – 6:40   (leave this slide up through the applause)

So: OncoVTE Guard takes structured FHIR data and published guidelines,
and turns them into a decision you can inspect, for one specific patient —
then hands that decision back as standard FHIR.
Every rule traces to its source, its code, and its test.
And when one treatment is ruled out, it evaluates what remains.
The app is live. Scan the code — it opens on James.
Move a slider, and the verdict changes right on your phone.
If this is the kind of FHIR app you want to see move forward, I'd be grateful for your vote.
Thank you.""",

12: """HIDDEN BACKUP — only if the run is very short.

One more.
Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate.
So: contraindicated.
Raise her platelets past 50,000, and the verdict changes — but not to a simple yes.
Her kidneys are severely impaired.
So the engine allows one pill, with caution, and rules out the others.
It doesn't stop at yes or no.""",
}
