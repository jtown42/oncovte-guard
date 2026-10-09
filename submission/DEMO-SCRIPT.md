# OncoVTE Guard — Finalist talk script (AMIA 2026 FHIR App Competition)

**Format:** Tuesday Nov 10, 2026 (confirm time in the acceptance email; AMIA's page says
9:45–11:00 a.m. CST). ~8 minutes per app, **no Q&A**, attendees vote for the top 3 at
the end of the session.
**Target:** 7:30 spoken, 5 slides + the live app.
**Built from:** OpenEvidence review 2 (`docs/OPENEVIDENCE-REVIEW-2.md`, Parts A–C), with
these changes: James now takes **itraconazole** (the ibrutinib entry was wrong — F15);
"roughly halves" → "about 40 percent"; "most of us" → "most clinicians"; the live re-run
line no longer implies the EHR pushes changes live; the hook's details are framed as
illustrative; the three CDS features expert judges recognize are named in the FHIR
section; the close carries the one-sentence vision line.

**The one repeatable phrase (say it twice — FHIR section and close):**
> "guideline, to code, to test"

**Running order:** if AMIA lets presenters choose, ask to go **first or last** (serial-
position effects favor both ends — Part B). If not, lean harder on the phrase and the demo.

---

## Run of show

| Time | Segment | On screen |
|---|---|---|
| 0:00–0:20 | Hook | Slide 1: title + one patient |
| 0:20–1:10 | The problem | Slide 2: five things to juggle |
| 1:10–2:40 | How it uses FHIR | Slide 3: two doors, one engine |
| 2:40–6:10 | Live demo | The app, presentation mode |
| 6:10–7:00 | Proof and honesty | Slide 4: evidence chain + sandbox screenshot |
| 7:00–7:30 | Vision and the ask | Slide 5: vote line + QR code to the live demo |

---

## Slide 1 — Hook (0:00–0:20)

**On screen:** App name. *"One patient. One decision. One question."* One patient silhouette.

> "Picture a 58-year-old woman, a few weeks into chemotherapy for pancreatic cancer. In
> one short visit, her oncologist has to answer one question: should she start a blood
> thinner to prevent a clot — and which one is safe with her chemo? Today I'll show you
> an app that answers that from the chart, and shows its work."

*Slow down on the last sentence. Don't read the slide.*

## Slide 2 — The problem (0:20–1:10)

**On screen:** Five icons — risk score, drug interactions, kidneys, platelets/contraindications,
"cancers the score skips." One citation line in small type (ITAC 2022; Li et al., JTH 2019).

> "Clots are the second leading cause of death in people with cancer — second only to the
> cancer itself. And we can prevent many of them: the AVERT and CASSINI trials showed a
> preventive blood thinner cuts clots by about 40 percent in higher-risk patients. But
> 'high-risk' and 'which drug' aren't one decision — they're five, at once. You compute a
> Khorana risk score. You check whether the chemo interacts with each blood thinner. You
> check the kidneys, the platelets, the contraindications. And you have to recognize the
> cancers where the score doesn't even apply. Get it wrong one way, she clots. The other
> way, she bleeds. Most clinicians do this from memory, between patients."

*Whole clinical section ≈ 50 s. No trial tables on screen.*

## Slide 3 — How it uses FHIR (1:10–2:40)

**On screen:** The "two doors, one engine" diagram. Four resources in plain words: who the
patient is (Patient), diagnoses (Condition), labs (Observation), active meds (MedicationRequest).

> "Here's how it works — and this is the part I most want you to remember. FHIR is the
> common language EHRs now speak. Any system that speaks it can hand my app the same four
> things: who the patient is, their diagnoses, their lab results, and their active
> medications. The app plugs in through two doors. Door one: the clinician clicks it open
> inside the chart. It signs in securely — think 'sign in with Google,' but for the EHR —
> and it only ever *reads* those four things; it never writes back. Door two: the EHR calls
> the app on its own. When the chart opens, or a chemo or blood-thinner order is being
> written, the EHR rings a doorbell — that's CDS Hooks — and the app answers with one card.
> It's a recommendation, not just an alert, and if a clinician overrides it, the card asks
> why and logs the reason. Both doors hand their data to the same translator and the same
> engine — every diagnosis must arrive coded, every lab coded, every drug an active
> prescription — so a stopped drug can't change the advice. Same brain, two doors — so the
> dashboard and the EHR alert can never disagree. And every rule in that brain traces from
> guideline, to code, to test."

*Reviewer-critical section. Define SMART and CDS Hooks in one breath each. Never say
"appliesTo," "prefetch," "terminal state," or function names.*

## Live demo (2:40–6:10) — app in presentation mode

Every change re-runs the real engine; nothing is pre-baked. Narrate where data came from
("pulled through FHIR") as you go — that keeps answering Reviewer 1.

### Beat 1 — Maria, the clean recommendation (~40 s)
**Do:** Maria is loaded.
> "This is Maria. The engine pulled her diagnosis, her platelets, hemoglobin, white count,
> and her chemo — all through FHIR. Khorana score of 5, high risk. Verdict: recommend
> prophylaxis — apixaban or rivaroxaban. And every finding carries its source. Nothing here
> is a black box."

### Beat 2 — James, the climax (~2 min)
**Do:** Click **James**. Point to the verdict. Then click **×** on **Itraconazole** in the
left rail (verdict flips to the pills). Then **+ Add a medication → Itraconazole** (back to
heparin).
> "Now James — 72, with relapsed lymphoma. During chemo he developed a fungal lung
> infection. The first-line antifungal, voriconazole, injured his liver, so he's finishing
> treatment on oral itraconazole. Same high-risk picture, but a different verdict: a standard-dose heparin
> injection, not a pill. Why? Itraconazole blocks the pathways that clear
> both oral blood thinners — the FDA labels for both say avoid it. And instead of just firing
> a red alert, the engine narrowed to the drug that's still safe. Watch what happens when I
> take the itraconazole off his list." *[remove]* "The pills come right back. Put it back —"
> *[add]* "— and we're at heparin again. This isn't a lookup table: the engine re-runs the
> whole decision every time the data changes. In the real EHR, the next time his chart
> opens or a drug is ordered, the advice updates the same way."

*Rehearse until the toggle takes under 20 seconds and cannot fail. This is the moment the
room remembers.*

*If anyone later asks "why not voriconazole?": it blocks CYP3A4 but not P-gp, so it would
not block rivaroxaban — the scenario uses itraconazole precisely because both labels say
avoid (OpenEvidence review 3). Never swap in voriconazole.*

### Beat 3 — Dorothy, threshold behavior (~40 s) *(this OR Maria's bleeding switch — not both)*
**Do:** Click **Dorothy** (platelets 42,000 → contraindicated). Drag the platelet slider past 50.
> "One more. Dorothy's platelets are 42,000 — below the safety floor, so every option is
> off: contraindicated. Watch the threshold." *[drag past 50,000]* "Now it recommends — but
> apixaban with caution, and rivaroxaban still off, because her kidneys can't clear it. The
> engine knows the difference between 'safe' and 'safe with conditions.'"

## Slide 4 — Proof and honesty (6:10–7:00)

**On screen:** Three-link chain (tests → traceability matrix → live behavior) + one SMART
sandbox launch screenshot (**re-run the sandbox with the new James bundle first** — F15).

> "How do you know it's right? Three things. One: 207 automated tests check that the code
> follows its rules — every threshold, every boundary. Two: a traceability matrix links every
> rule to its guideline source, the exact code, and the test that proves it. Three: I launched
> it from the public SMART Health IT sandbox, where it signed in with real OAuth, read live
> FHIR data, and returned the right verdicts. And here's what I won't claim: it has never been
> used on a real patient. The honest headline is that it's provably *consistent* — not yet
> clinically *validated*. My next step is to run it silently against real charts and compare
> it to expert review."

*Optional half-sentence if time allows (pre-empts a FHIR purist on CQL):* "I wrote the
rules as plain, tested code rather than CQL so every boundary could have its own test."

## Slide 5 — Vision and the ask (7:00–7:30)

**On screen:** The vote line + a large QR code to https://oncovte-guard.pages.dev

> "If you take one thing away: every recommendation here traces from guideline, to code, to
> test — and when a drug is unsafe, the engine finds the safe one. OncoVTE Guard is one use
> case, but the architecture points to something broader: clinical guidelines that don't
> live in PDFs — they live in the EHR as transparent, testable, executable logic. If that's
> the decision support you'd want in your EHR, I'd be grateful for your vote — and the demo
> is behind this QR code."

**10-second fallback if running long:** "Every recommendation here traces from guideline,
to code, to test — and it finds the safe drug instead of just alerting. If that's what you'd
want in your EHR, please vote."

---

## Setup and stage hygiene

- Open the live demo full-screen with **Presentation mode** (`?present=true`), window ~1440 px.
- Notifications off, one tab, laptop on power, browser zoom checked on the projector.
- **Backups, in order:** (1) the app run locally (`npm run preview` after `npm run build`) —
  no network needed; (2) a 3-minute screen recording of this exact demo; (3) the five
  verdict screenshots.
- If you mis-click into a "Custom" scenario, click the patient chip again to reset.

## Never say on stage

"Clinically validated," "accurate" (for the interaction table), "proven to improve
outcomes," "used by clinicians," any NCCN table content, or anything about ibrutinib
blocking DOACs (corrected — F15), or a weight-based heparin dose for James (corrected — F16).
