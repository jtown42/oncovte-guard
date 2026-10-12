# OncoVTE Guard — Final talk script v2 (AMIA 2026 FHIR App Competition)

> Rewritten 2026-10-12 after the FHIR write-back (F19) and panel screening (F20) were built.
> It supersedes v1 (commit 6d4ee90 and earlier), which is in git history. The plan behind
> the changes is in `docs/COMPETITIVE-UPGRADE-PLAN.md`.

**What changed from v1, and why:**
- **Less clinical setup, more technology.** The abstract leaned on the clinical problem, and Reviewer 1 asked for more FHIR. The problem slide is about 25 s shorter, and that time goes to FHIR in/out.
- **New slide 7: James's decision written back as FHIR.** The answer to "it only reads FHIR."
- **New slide 8: the same engine across a whole panel (Bulk Data).** It's optional and the first thing to cut.
- **The problem is re-aimed at the hard part.** The difficulty isn't the risk score; it's interactions, kidney function and contraindications colliding. James shows exactly that.
- **Dorothy moves to the end as a hidden backup slide.** No credentials or personal framing anywhere; the evidence carries the talk.

**Format:** about 8 minutes, no Q&A, provided Windows PC, no internet. Images throughout plus **one embedded ~15 s silent clip** (the James toggle). No UI tour.
**Target runtime:** about 7:05 (buffer against the 8-minute cap). **Spoken length:** about 825 words (870 with the optional 22-codes line).
**Slides:** 11 in the deck. **10 in the spoken run**; slide 11 (Dorothy) is hidden. Slide 8 (panel) is the first cut if a rehearsal runs long.
**Deadline:** upload in the AMIA template by **Fri Oct 16, 11:59 p.m. EST**. Slides can't be changed on site.

**The thesis (memorize this cold — it's the whole talk):**
> *Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to executable logic, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options.*

**The chain the room should repeat at the ballot:** `GUIDELINE → RULE → CODE → TEST → DECISION`, and now one more line: **structured FHIR in, structured FHIR out.**

---

## Run of show

| Time | Slide | Segment | Spoken words |
|---|---|---|---|
| 0:00–0:15 | 1. Title | Hook | ~45 |
| 0:15–0:25 | 2. Disclosure | Verbal disclosure | ~30 |
| 0:25–1:05 | 3. Problem → Thesis | The hard part, then the chain | ~125 |
| 1:05–2:15 | 4. FHIR | Two doors, one engine; FHIR in, FHIR out | ~150 |
| 2:15–2:35 | 5. Maria | The clean case | ~40 |
| 2:35–3:50 | 6. James + clip | One drug changes the decision | ~115 + clip |
| 3:50–4:20 | 7. James in FHIR | The decision written back | ~75 |
| 4:20–4:50 | 8. Panel *(cut first)* | Same engine, whole panel | ~50 |
| 4:50–6:25 | 9. Proof & honesty | Tests, traceability, limits | ~110 (+45 optional) |
| 6:25–7:05 | 10. Ask | Thesis + QR | ~80 |
| — | 11. Dorothy *(hidden backup)* | Only if very short | ~60 |

---

## SLIDE 1 — TITLE  (0:00–0:15)

**On slide:**
- OncoVTE Guard
- FHIR-native decision support for cancer-associated VTE prophylaxis
- Justin Chestang · NYU Langone Health
- 2026 AMIA / HL7 FHIR App Competition
- *(small corner stat: Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis — Holmes et al., JCO Oncology Practice 2026)*

**Say:**

> "We know how to prevent many blood clots in patients with cancer, but prophylaxis is still underused — partly because it isn't one decision. It's risk, bleeding, kidney function, drug interactions and contraindications, all at once. OncoVTE Guard does that reasoning from the EHR, on FHIR, and shows exactly how it got there."

**Delivery note:** Calm and evidence-first. The underuse number lives on the slide, not in your mouth. Holmes defined "high-risk" as a Khorana *or* PROTECHT score ≥3 (573 patients, 59% treated), so never tie that number to the app's ≥2 threshold; ≥2 is the trial and guideline threshold (AVERT, CASSINI, ITAC, NCCN, ASCO). No credentials or personal background; your name and institution on the slide are enough.

---

## SLIDE 2 — DISCLOSURE  (0:15–0:25)

**On slide:**
- Disclosures
- No financial relationships to disclose
- Student project · synthetic data only · not used on real patients

**Say:**

> "Quick disclosure: no financial relationships. This is a student project. It runs entirely on synthetic data and has never touched a real patient."

**Delivery note:** Required on the slide and out loud. Ten seconds, then move.

---

## SLIDE 3 — THE PROBLEM → THESIS  (0:25–1:05)

**On slide (build one line at a time):**
- Prevention works — but prescribing it safely means resolving **5 things at once**:
- → risk score · bleeding risk · kidney function · drug interactions · contraindications
- One interacting drug can rule out **both** oral options. Kidney function narrows what's left.
- Wrong one way → **clot**. Other way → **bleed**.
- *(reveal)* **The challenge isn't making a recommendation. It's making the reasoning inspectable and testable.**
- *(final reveal, large)* **GUIDELINE → RULE → CODE → TEST → DECISION**
- *(footnote: ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56)*

**Say:**

> "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients. The hard part is prescribing it safely, because five things have to be resolved at once: a risk score, bleeding risk, kidney function, drug interactions, and contraindications. One interacting drug can rule out both oral options; kidney function narrows what's left. Get it wrong one way, the patient clots. The other way, she bleeds.
>
> So here's the idea behind the whole app. Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to a rule, to the code that runs it, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options."

**Delivery note:** "Pooled … roughly halved" is deliberate: CASSINI's intention-to-treat primary endpoint alone wasn't significant (OpenEvidence round 5), so don't say the trials each "showed" it. This is shorter than v1 on purpose. Don't explain the risk score; the hard part is the collision, and James will show it. Reveal the chain last and let it sit for a beat.

---

## SLIDE 4 — FHIR: TWO DOORS, ONE ENGINE · STRUCTURED FHIR IN, STRUCTURED FHIR OUT  (1:05–2:15)

**On slide (one diagram):**
- Left, in: **Patient · Condition · Observation · MedicationRequest** (read-only)
- Two doors: **SMART App Launch** (clinician opens it) and **CDS Hooks** (EHR invokes it at a workflow event)
- Center: **ONE engine**
- Right, out: **GuidanceResponse · RiskAssessment · DetectedIssue · draft MedicationRequest · Provenance**
- Caption: *Structured FHIR in, structured FHIR out.*

**Say:**

> "Here's how it uses FHIR. FHIR gives an app standardized records: a Condition for each diagnosis, an Observation for each lab, a MedicationRequest for each active drug, and the Patient. The app reads exactly those four, read-only, and it's strict about meaning — a diagnosis only from a coded Condition, a lab only from a coded Observation, and a stopped drug can't change the advice.
>
> It connects two ways. SMART App Launch, when a clinician opens it inside the chart. And CDS Hooks, when the EHR calls the same engine automatically at a workflow event — a chart opening, or a new drug order being entered.
>
> Both doors run through the same normalizer and the same engine, so the dashboard and the EHR alert can't disagree.
>
> And the output is FHIR too. Structured FHIR in, structured FHIR out. I'll show you what that means with a real patient."

**Delivery note:** This is the slide for the FHIR audience; Reviewer 1 asked for more here. "One engine, two doors" and "structured FHIR in, structured FHIR out" are the two lines to land. Present-capable wording for CDS Hooks ("calls the same engine"), not "a hospital is calling it." The hooks are `patient-view` (chart opening) and `order-select` (an order being entered, not signed); the service runs, but it isn't hosted publicly.

---

## SLIDE 5 — MARIA, THE CLEAN CASE  (2:15–2:35)

**On slide:** `01-maria-recommend.png`: risk score 5, "apixaban or rivaroxaban," a guideline source on every card.

**Say:**

> "Two synthetic patients — real output from the app, not mock-ups. Maria has pancreatic cancer and a risk score of 5. Nothing rules out the oral options, so it recommends apixaban or rivaroxaban, with the guideline source on every card."

---

## SLIDE 6 — JAMES: ONE DRUG CHANGES THE DECISION  (2:35–3:50) — **THE EMBEDDED VIDEO**

**On slide:** the starting still `02-james-lmwh-start.png` (LMWH recommended, both pills struck through, "Avoid — itraconazole interaction (FDA labeling)"). The clip `05-james-toggle.mp4` sits exactly on top of it and plays **on click**.

**Say (over the still):**

> "James is 72, with lymphoma, and he's taking itraconazole for a serious fungal infection. His risk qualifies him for prophylaxis.
>
> The engine checks every drug he's on against every blood thinner. It catches that itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling says to avoid both oral options. Detecting that is only half the problem — the engine then evaluates what's left and recommends an injectable heparin, and shows exactly why each pill was ruled out."

**[Click — play the clip. Narrate calmly across it:]**

> "Watch one thing. Remove itraconazole — the oral options come back. Add it back — we're back to the injectable. Same patient, one medication changed, different recommendation. The whole decision is re-evaluated every time."

**If the clip won't play:** the still is already up. Say: "If I take itraconazole off his list, the engine re-runs and the oral options come back; add it again, and it's back to the injectable." Then move on.

**Delivery note:** Narrate the reasoning, never the clicks. Say "injectable heparin" or "the injectable," not "enoxaparin" alone; the screen shows enoxaparin *or* dalteparin.

---

## SLIDE 7 — JAMES'S DECISION, WRITTEN BACK AS FHIR  (3:50–4:20)

**On slide:** `08-james-card-to-fhir.png`. On top, what the clinician sees (the struck-through pills). Below it, what the EHR receives: the DetectedIssue JSON, with `"MedicationRequest/medrx-itraconazole-2"` highlighted.

**Say:**

> "And here's that decision as FHIR. Each blocked drug becomes a DetectedIssue that points at the exact medication order that caused it — here, his itraconazole. The risk score becomes a RiskAssessment that points at the lab results it used. The recommendation becomes a draft proposal, never a signed order, and a Provenance record ties it all to the engine version. Every demo bundle passes the official HL7 validator, and it round-trips through a public FHIR server."

**Delivery note:** This is the line that moves you from "an app that reads FHIR" to "a FHIR-native decision system." Point at the highlighted reference. Every claim here is verified: 0 validator errors on all 7 demo bundles; 9 resources in and 9 read back from the SMART sandbox. Note the write-back comes from the app; the CDS Hooks service still returns cards.

---

## SLIDE 8 — SAME ENGINE, WHOLE PANEL  (4:20–4:50) — *first cut if long*

**On slide:** `09-panel-worklist.png` (Bulk Data $export → the same engine → worklist; marked "synthetic panel").

**Say:**

> "Because it's FHIR in and FHIR out, the same engine can run across a whole clinic panel through Bulk Data export. Here, on a synthetic panel I generated, it produces a worklist: patients who meet the guideline threshold with no anticoagulant on file. That's the underuse problem, at the population level."

**Delivery note:** Always say "a synthetic panel I generated." Never present the count (19 of 40) as a finding; it comes from the generator. If a rehearsal runs past ~7:15, cut this slide (hide it) and go straight from 7 to 9.

---

## SLIDE 9 — PROOF & HONESTY  (4:50–6:25)

**On slide (build 3 + 1):**
- Clinical software only matters if you can trust *how* it reaches the answer.
- **349 ×10⁹/L → 0 points · 350 ×10⁹/L → +1 point** — both tested
- **SOURCE → RULE → CODE → TEST**
- FHIR output validated against R4 (HL7 validator: 0 errors)
- *(limits strip)* Prototype · synthetic data only · interaction table needs pharmacist review · diagnoses must be ICD-10-coded today
- *(next)* Silent-mode validation on real charts · SNOMED CT support · CDS Hooks order suggestions
- *(small corner badge: 229 automated tests)*

**Say:**

> "Why trust it? I built verification into the architecture. The tests I care about most check the exact points where a recommendation flips. A platelet count of 350 adds a risk point; 349 doesn't — and both are tested, because that's precisely where a quiet bug would change the advice. Every clinical rule is linked to its guideline source, the code that implements it, and a test that checks its behavior.
>
> Now the limits. It's a prototype, evaluated only on synthetic data. The interaction table still needs independent pharmacist review. And today it reads diagnoses coded in ICD-10 — supporting SNOMED is next, along with silent-mode validation on real charts compared against expert review."

**Optional (only if under 7:00):**

> "While building it, I found 22 drug codes pointing at the wrong medication — one 'chemo' code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation."

**Delivery note:** Lead with *why* the tests exist, not the count. The honesty is a strength. The SNOMED line is there on purpose: a standards person in the room will know the ICD-10 limit, and saying it first takes the objection away.

---

## SLIDE 10 — THE ASK  (6:25–7:05)

**On slide (leave up through applause):**
- **PATIENT DATA (FHIR)** ↓ **GUIDELINE → RULE → CODE → TEST** ↓ **EXPLAINABLE DECISION (FHIR)**
- Large QR code → https://oncovte-guard.pages.dev/
- Vote for us

**Say:**

> "OncoVTE Guard turns structured EHR data and clinical guidance into an inspectable, patient-specific decision — and hands that decision back as standard FHIR. Every clinical rule is traceable from its source, to its implementation, to its test. And when one treatment is ruled out, the engine re-evaluates what remains. If that's the kind of FHIR application you'd like to see move forward, I'd be grateful for your vote. The app is live — scan the code and try it yourself. Thank you."

**Delivery note:** Memorize these sentences cold. Leave the QR up; phones use cellular. End on "Thank you" with eye contact.

---

## SLIDE 11 — DOROTHY (HIDDEN BACKUP)

**On slide:** `03-dorothy-42k-contraindicated.png` and `04-dorothy-55k-apixaban-caution.png` side by side: "42,000 → contraindicated"; "55,000 → apixaban with caution; rivaroxaban and LMWH avoided."

**Say (only if you unhide it because you're running very short):**

> "One more. Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes, but not to a simple yes. Her kidneys are severely impaired, so the engine allows one pill with caution and rules out the others. It reasons about degree."

---

## Rehearsal plan

1. **Assets (all in `talk-assets/`, already captured):** 01 Maria · 02 James still · 05 James clip (MP4/H.264, 14.5 s) · 08 James → FHIR · 09 panel · 03/04 Dorothy · 06 QR. Alternative to 08: `07-james-fhir-output-panel.png` (the app's own FHIR output panel).
2. **Embed the clip** (Insert → Video → This Device; never link it), **On Click**, exactly on top of the James still. Open the finished deck on a *different* Windows computer and confirm the clip plays.
3. **Memorize cold:** the thesis + chain (slide 3), "structured FHIR in, structured FHIR out" (slide 4), the slide 7 paragraph, and the close (slide 10).
4. **Run it out loud with a timer, 5+ times.** Splits: ~1:05 end of slide 3 · ~2:15 end of FHIR · ~3:50 end of James · ~4:50 end of the panel · ~6:25 end of Proof.
5. **Thursday decision:** if the timed run is over ~7:15, hide slide 8 (panel).
6. **At the venue:** arrive 15 min early, click through the whole deck once on the provided PC, check the clip plays.

## Evidence check (OpenEvidence round 5, 2026-10-12): all clinical claims confirmed
- Holmes 2026: real; 340 of 573 (59%) high-risk patients treated in the Vermont prevention program; "high-risk" = Khorana or PROTECHT ≥3. PMID 41941694, doi:10.1200/OP-25-01211.
- Pooled AVERT + CASSINI overall VTE RR 0.56 (95% CI 0.35–0.89): correct, as reported in ITAC 2022 (Farge et al., *Lancet Oncol* 2022;23:e334–e347).
- Label "avoid" for itraconazole with apixaban 2.5 mg BID and rivaroxaban; Khorana ≥350 boundary; Maria's score of 5; Dorothy's renal and platelet calls: all confirmed.
- Wording changed: slide 1 corner stat; slide 3 "pooled … roughly halved"; the fixed-dose LMWH card source now reads "NCCN VTE-B-2 (agent) · VTE-B-1 (standard dose)", because VTE-B-2's printed LMWH doses are the pancreatic weight-based ones.
- Full answer: `docs/OPENEVIDENCE-FACTCHECK-5.md`; references: `docs/REFERENCES.md`.

## If something goes wrong on stage
- **The clip won't play:** the still is up; describe the toggle in words (slide 6 has the line) and move on.
- **Clicker or slide fails:** everything else is a static image; describe it and keep going.
- **Lost your place:** every slide is self-contained; pick up the next line.
- **Running long:** skip slide 8, then trim Maria to one sentence.
- **Running short:** add the 22-codes line on slide 9; only then consider unhiding Dorothy.

## Do not cut
The thesis + chain (slide 3), "one engine, two doors" and "structured FHIR in, structured FHIR out" (slide 4), James (slide 6), the FHIR write-back (slide 7), the honesty lines (slide 9), and the close (slide 10).
