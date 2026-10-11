# OncoVTE Guard — Final talk script (AMIA 2026 FHIR App Competition)

> Saved 2026-10-11. This is the frozen presenter script. It supersedes
> `submission/DEMO-SCRIPT.md` for rehearsal. The matching app brief is
> `docs/PRESENTATION-APP-BRIEF.md`.

**Format:** ~8 minutes, no Q&A, provided PC, no internet. Demo = annotated screenshot for Maria, plus **one short embedded video (~15 s) of the James toggle** — the only moment that needs motion. (Dorothy is an optional backup slide.) No UI tour.
**Target runtime:** 7:10 (buffer against the 8-minute cap). **Spoken length:** ~830 words.
**The spine:** one argument, stated once in the problem build and once as the close. Every slide earns its place by serving that one sentence. Nothing here is a "demo trick" — the demo is the evidence.

**The thesis (memorize this cold — it's the whole talk):**
> *Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to executable logic, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options.*

**Slides:** 9 in the deck (Title, Disclosure, Problem→Thesis, FHIR, Maria, James, Dorothy, Proof, Ask); **8 in the default spoken run** — Dorothy is held as an optional backup.
**Deadline:** Upload in the AMIA template by **Fri Oct 16, 11:59 p.m. EST**. Test on a Windows PC for font/image substitution.

---

## The shape of the argument

Problem — the decision is genuinely hard, and reliably implementing the guideline in software is harder.
Thesis — make the implementation explicit: `guideline → rule → code → test → decision`.
Demo — proof you can watch it reason, not a highlight reel.
Rigor — proof the reasoning is faithful to the guideline, built into the architecture.
Honesty — proof you're not overselling.
Ask — the thesis, one more time, plus the QR code.

No slide needs to "wow." The argument does the work. You present from a calm place: *here's something I built carefully — let me show you why it holds up.* The biggest risk now isn't that the project isn't impressive — it's trying too hard to tell them it's profound. Show FHIR, show James change, show what the tests actually check, and let them reach the conclusion themselves.

---

## Run of show

| Time | Slide | Segment | Spoken words |
|---|---|---|---|
| 0:00–0:20 | 1. Title | Hook (evidence-based) | ~60 |
| 0:20–0:30 | 2. Disclosure | Verbal disclosure | ~35 |
| 0:30–1:35 | 3. Problem→Thesis | Hard to do, hard to implement | ~130 |
| 1:35–2:55 | 4. FHIR | Two doors, one engine | ~190 |
| 2:55–4:50 | 5–6. Demo | Maria → James (video) | ~215 |
| 4:50–6:35 | 8. Proof | Rigor + honesty | ~135 |
| 6:35–7:10 | 9. Ask | Thesis + QR | ~70 |

Default spoken path: **Maria → James → Proof**. Slide 7 (Dorothy) stays in the deck as an optional backup — add her only if you're running short.

---

## SLIDE 1 — TITLE  (0:00–0:20)

**On slide (large type; academic/university logo OK on title slide):**
- OncoVTE Guard
- FHIR-native decision support for cancer-associated VTE prophylaxis
- Justin Chestang · [built at [school]; now PGY-1, [program]]
- 2026 AMIA / HL7 FHIR App Competition
- *(small supporting stat, corner: only ~6 in 10 high-risk patients get prophylaxis — Holmes et al., JCO Oncology Practice 2026)*

**Say (calm, evidence-first):**

> "We know how to prevent many blood clots in high-risk patients with cancer, but prophylaxis remains underused. Part of the challenge is that this isn't one decision — it's risk, bleeding, kidney function, drug interactions, and contraindications, all at once. I built OncoVTE Guard to do that reasoning from the EHR, on FHIR, and show exactly how it got there."

**Delivery note:** The authority here is the *evidence*, not you — you're a developer citing a published gap, not a trainee telling oncologists how their clinic runs. The underuse figure now lives on the slide as a small supporting stat rather than in your first sentence, so the opening doesn't hinge on one number (and doesn't imply the data proves causation). Don't mention the student/PGY-1 point aloud — eligibility was set at submission; just let the title slide state your affiliation. (Underuse figure: Holmes et al., *JCO Oncology Practice* 2026; implementation gap: Butera et al., *ASH Education Program* 2025.)

---

## SLIDE 2 — DISCLOSURE  (0:20–0:30)

**On slide (AMIA template disclosure slide, immediately after the title):**
- Disclosures
- No financial relationships to disclose
- Student project · synthetic data only · not used on real patients

**Say (quick, don't dwell):**

> "Quick disclosure: I have no financial relationships to report. OncoVTE Guard is a student project. It runs entirely on synthetic data and has never touched a real patient."

**Delivery note:** Required on the slide *and* verbally. 10 seconds, then move with energy.

---

## SLIDE 3 — THE PROBLEM → THESIS  (0:30–1:35)

**On slide (build the lines one at a time):**
- VTE: major preventable morbidity and mortality in cancer
- Prevention works — pooled AVERT + CASSINI cut overall VTE risk ~half in higher-risk patients
- But prescribing safely means combining 5 things at once:
- → risk score · bleeding risk · kidney function · drug interactions · contraindications
- Wrong one way → clot. Other way → bleed.
- *(reveal, after the complexity lands:)*
- **The challenge isn't just making a recommendation.**
- **It's making the reasoning inspectable and testable.**
- **GUIDELINE → RULE → CODE → TEST → DECISION**
- *(footnote: ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56)*

**Say:**

> "Here's why that question is hard. In cancer, blood clots are a major and preventable source of illness and death. And we *can* prevent them — pooled data from the AVERT and CASSINI trials cut overall clotting risk by nearly half in higher-risk patients.
>
> But to prescribe safely, you have to combine five things at once: a risk score, bleeding risk, kidney function, how the chemo interacts with the blood thinner, and contraindications. Get it wrong one way, the patient clots. The other way, she bleeds.
>
> So this is the idea behind the whole app. Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to a rule, to the code that runs it, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options. Everything I show you from here backs up that sentence."

**Delivery note:** This merges the clinical problem and the thesis so the argument lands as the *answer* to a tension you just created — no separate thesis slide, which also saves ~30 seconds and keeps you from going self-serious before you've shown anything. Capped at ~65 seconds; Reviewer 1 said don't over-explain the clinical case. The `guideline → rule → code → test → decision` chain is the thing you want them repeating at the ballot — reveal it last and let it sit.

---

## SLIDE 4 — HOW IT USES FHIR  (1:35–2:55)

**On slide (one diagram — two arrows into one box):**
- Two doors, one engine
- [Clinician opens app — SMART App Launch] ↘
- [EHR invokes it at a workflow event — CDS Hooks] ↗
- → ONE engine → one verdict + its source
- Reads 4 resources: Patient · Condition · Observation · MedicationRequest

**Say:**

> "First, how it reads the chart. OncoVTE Guard gets its patient data through FHIR — the standard used by modern EHR APIs to expose structured clinical information to applications.
>
> FHIR hands an app standardized records: a *Condition* for each diagnosis, an *Observation* for each lab, a *MedicationRequest* for each active drug, and a *Patient* for age and sex. My app reads exactly those four, read-only — it never writes to the chart. And it's strict about meaning: it takes a diagnosis only from a coded Condition and a lab only from a coded Observation, so a procedure can't be read as a diagnosis, and a stopped drug can't change the advice.
>
> It connects two ways. One: SMART App Launch — the clinician opens it inside the chart, and the record authorizes it the way a website authorizes a 'sign in with Google' app. Two: CDS Hooks, which allows the same engine to be invoked automatically at a workflow event — a chart opening, or a chemo order being signed — and to return an advice card.
>
> Here's the part that matters for this room, and it's the same point I just made with the chain. Both paths feed one normalizer, which builds one patient object, which goes to one decision function. No clinical logic lives anywhere else — so the dashboard and the EHR alert can't disagree, by construction. One engine, two doors."

**Delivery note:** This is your "for the FHIR audience" section — Reviewer 1 wanted *more* here, in plain language. The CDS Hooks wording says "allows the same engine to be invoked" — present-capable, not "a hospital is calling it right now," which would overclaim. "One engine, two doors" is the anchor; land it with a pause before the demo. If running long, the one sentence to cut is the "sign in with Google" aside.

---

## SLIDES 5–7 — DEMO: WATCH IT REASON  (2:55–4:50)

**Framing — this is not a tour of the UI, it's evidence.** Your job here is to reason out loud while the engine's output is on screen. Narrate the *thinking*, not the buttons. Reviewer 2 praised that the reasoning is *inspectable* — so make the reasoning audible.

**Before the first screenshot, say:**

> "Let me show you the engine reasoning through two synthetic patients. These are real outputs from the application — not mock-ups."

### Slide 5 — Maria (the clean case: establish what "reasoning" looks like)

**On slide:** Maria's verdict — risk score 5, "Recommend: apixaban or rivaroxaban," each card showing its guideline source.

**Say:**

> "Maria has pancreatic cancer. Her risk score is 5. The engine checks interactions, renal function and platelets; nothing rules out the oral options, so it recommends apixaban or rivaroxaban, with the guideline source shown on screen."

### Slide 6 — James (the case that proves the second half of the thesis) — **THE EMBEDDED VIDEO**

**This is the one slide with motion.** A still can show a verdict; it can't show the engine *re-deciding* when the data changes — and that re-run is exactly what Reviewer 2 praised ("re-runs the full recommendation as clinical data changes"). So James is a **~15-second embedded clip**, bracketed by a starting still, with the video doing the toggle. Everything else in the demo stays static.

**On slide:**
- A **starting still** (state A): James *with* itraconazole → "Recommend LMWH (enoxaparin)," both oral drugs struck through: "avoid — itraconazole interaction." Hold this while you set up the case.
- The **embedded video** (plays on click): itraconazole removed → verdict re-runs → oral agents reappear → itraconazole added back → returns to LMWH. Silent; you narrate live over it.

**The clip itself (record this exactly — see capture spec in the rehearsal plan):** ~15 s, no audio, presentation mode, clean browser. Start on the LMWH verdict (hold ~2 s) → remove itraconazole, let the verdict re-run to the oral agents (hold ~3 s) → add it back, return to LMWH (hold ~2 s). Stop. No cursor wandering, no scrolling, no other clicks.

**Say (over the starting still, before you play the clip):**

> "James is 72 with relapsed lymphoma. He's also taking itraconazole for a serious fungal infection, and his VTE risk qualifies him for prophylaxis.
>
> But watch the engine work through his meds. It checks every drug he's on against every blood thinner — and it catches that itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling tells us to avoid *both* oral options in this setting. Detecting the interaction is only half the problem. The engine then evaluates the remaining options and selects enoxaparin — and tells you exactly why each pill was ruled out."

**[Play the clip. Narrate across it, calm, no drumroll:]**

> "Watch one thing. Remove itraconazole — the oral options return. Add it back — we're back to enoxaparin. Same patient. One medication changed. Different recommendation."

**[Pause.]**

> "The entire decision is re-evaluated each time."

### Slide 7 — Dorothy (OPTIONAL / BACKUP — not in the default spoken run)

**Status:** Keep this slide in the submitted deck, but the default talk goes **Maria → James → Proof**. James already proves the sophisticated reasoning; Dorothy adds another phenotype but no new thesis, and the 15 seconds is better spent letting the 349-vs-350 boundary point breathe on the Proof slide. Use Dorothy only if you're running *short* (under ~7:00) and want a third case.

**On slide:** Dorothy at platelets 42,000 ("contraindicated"), then at >50,000 ("apixaban — caution; rivaroxaban and LMWH avoided").

**Say (only if you include her):**

> "One more, quickly. Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes — but not to a simple yes. Her kidneys are severely impaired, so the engine allows one pill *with caution* and rules the others out. It reasons about degree — the difference between 'appropriate' and 'appropriate, with conditions.'"

**Delivery note:** This is half your talk. Narrate the engine's *reasoning*, never the clicks — "it checks… it catches… it moves to," not "now I click here." Avoid calling any anticoagulant simply "safe" — say "eligible alternative" or "appropriate remaining option." The James clip is evidence that the logic is deterministic and re-runs on every change — not a reveal to perform; narrate across it calmly. **The video is the single moment that can technically fail** — if it won't play, you have the starting still up already, so just describe the toggle in words ("remove the itraconazole and the oral options come back") and keep moving; the story still lands. The default run ends the demo on James and goes straight to Proof; only add Dorothy if you're running short. Never cut James.

---

## SLIDE 8 — PROOF & HONESTY  (4:50–6:35)

**On slide (build 3 + 1):**
- Clinical software only matters if you can trust *how* it reaches the answer.
- *(boundary example, large, side by side with the chain:)*
- **349 ×10⁹/L → 0 points · 350 ×10⁹/L → +1 point** — both tested
- **SOURCE → RULE → CODE → TEST**
- Evaluates the remaining options, not just a red alert
- Prototype · synthetic data only · interaction table needs pharmacist review
- *(small badge, corner: 208 automated tests)*

**Say:**

> "Now — why trust it? Clinical software only matters if you can trust how it reaches the answer, so I built verification into the architecture. The tests I care about most check the exact decision boundaries — the points where the recommendation flips. A platelet count of 350 adds a risk point; 349 doesn't — and both are tested, because that's precisely where a quiet bug would change a recommendation. Every clinical rule is linked to its guideline source, the code that implements it, and a test that checks its behavior. And what you just watched is part of that: it evaluates the remaining options instead of firing a red alert.
>
> Let me be honest about the limits. This is still a prototype. It's only been evaluated on synthetic data, and the medication-interaction knowledge base still needs independent pharmacist validation. The next step is silent-mode validation on real charts, compared against expert review."

**Delivery note:** Lead with *why* the tests exist and *what* the important ones check — not a count. You are not reciting "200-something tests" on stage; the boundary example (349 vs 350) is what makes an engineer trust you, and it's concrete. The honesty line is a strength, not an apology — chin up; Reviewer 2 praised exactly this. **Optional add if you're under 7:10:** "While building it I found 22 drug codes pointing at the wrong medication — one 'chemo' code was actually a blood-pressure pill. My own tests missed it because the test data shared the codes. That's exactly why terminology needs outside validation." Volunteering a bug you caught is the most credible thing you can say to a room of developers — include it if time allows.

---

## SLIDE 9 — THE ASK  (6:35–7:10)

**On slide (leave this up through applause):**
- **PATIENT DATA**
- ↓
- **GUIDELINE → RULE → CODE → TEST**
- ↓
- **EXPLAINABLE DECISION**
- [QR code to live demo — large]
- Vote for us

**Say:**

> "OncoVTE Guard turns structured EHR data and clinical guidance into an inspectable, patient-specific decision. Every clinical rule is traceable from its source, to its implementation, to its test. And when one treatment option is ruled out, the engine reevaluates what remains. If that's the kind of FHIR application you'd like to see move forward, I'd be grateful for your vote. The app is live — scan the code and try it yourself. Thank you."

**Delivery note:** This closes on the chain, deliberately repeated — that repetition is what makes it stick for the vote. It reads as AMIA, not as a startup pitch. Memorize these sentences cold. Leave the QR code up through any applause; phones use cellular, so it works even though the room has no internet. End on "Thank you" with eye contact — don't trail off at the laptop.

---

## Why this version holds up

- **It's an argument, not a tour.** Nine apps blur together; a single repeatable chain — `guideline → rule → code → test → decision` — survives to the ballot. It's stated in the problem build, threaded through FHIR and the demo, and closed on the last slide.
- **No swipes at the field.** The thesis is "implementing guidelines reliably in software is hard," not "everyone else is a black box." That's more sophisticated and much harder for an AMIA/HL7 room to object to.
- **"Test," not "proof."** A test verifies the code behaves as specified for the cases you check — it doesn't mathematically prove the clinical rule is correct. The language is now "a test that checks its behavior," which an engineer in the room won't flinch at.
- **The rigor means something without a number.** Framed as *why* the tests exist and *what* the boundary cases catch, it reads as judgment, not jargon — and you never recite a test count.
- **Honesty is a closer, not a disclaimer** — it pre-empts the objection every informatics person is already forming.

---

## Rehearsal plan

1. **Capture the screenshots AND record the James clip first (by Oct 15):**
   - **Screenshots (presentation mode, large verdict/score/CrCl):** Maria's verdict; James *with* itraconazole (the starting still); Dorothy at 42k and at >50k. Confirm each shows the committed patient data.
   - **James clip (~15 s, silent):** record in presentation mode, clean browser (no bookmarks bar, notifications off, one tab), at the resolution the room projector will use. Sequence: start on the LMWH verdict (hold ~2 s) → remove itraconazole, let it re-run to the oral agents (hold ~3 s) → add it back, return to LMWH (hold ~2 s) → stop. No cursor drift, no scrolling, no stray clicks. Trim dead frames off both ends hard.
   - **Embed the clip IN the PowerPoint file** (Insert → Video → This Device), do **not** link an external file — linked videos break when the deck moves to AMIA's machine. Set it to play **On Click** so you control timing.
   - **Verify the embed survives:** open the finished deck on a *different* computer than the one you built it on and confirm the video still plays. This is the single most common failure mode. Also bring the clip on the USB per AMIA's rules as a loose backup.
2. **Memorize three things cold:** the thesis + chain (Slide 3), the "trust *how* it reaches the answer" line (Slide 8), and the final sentences (Slide 9). If nerves hit, these carry you.
3. **Run it out loud with a timer, 5+ times.** Splits: ~1:35 at the end of the Problem→Thesis slide, ~2:55 at the end of FHIR, ~4:50 when the demo ends on James (add Dorothy only if you're short).
4. **One full run in front of someone who doesn't know FHIR.** If they can repeat your `guideline → rule → code → test` chain back, it's working.
5. **Test the deck on a Windows PC before you travel** — you likely built on a Mac; PowerPoint can substitute fonts and rescale images, and an embedded video encoded on a Mac can fail to play on Windows. Confirm every screenshot renders sharp, the James starting still advances into the clip in order, and **the embedded clip actually plays on Windows** (MP4/H.264 is the safest codec). This is also what the AMIA Speaker Ready room upload needs to preserve — after you upload by Oct 16, re-open the uploaded version if you can to confirm the video survived.
6. **At the venue:** arrive 15 min early, meet the moderator, click through the whole deck once on the provided PC, check the clicker.

## Dorothy data check (before you screenshot)
Her "raise platelets → apixaban with caution" moment only holds if her creatinine is **2.0** (CrCl ≈18, above your apixaban CrCl-15 floor). The **old 2.8** (CrCl ≈13) makes apixaban *avoided* → "no safe agent," which contradicts your narration. Screenshot the version that matches what you say.

## If something goes wrong on stage
- **The James clip won't play:** this is the only piece that can fail, and you're covered — the starting still is already on screen. Just say the toggle in words: "If I take the itraconazole off his list, the engine re-runs and the oral options come back; add it again, back to the injectable." The point lands without the motion. (Also confirm at the venue click-through that the clip plays *before* you're live.)
- **Clicker fails / a slide won't advance:** everything except the James clip is a static screenshot — just describe the next state and keep moving.
- **You lose your place:** each slide names its segment; every segment is self-contained — pick up the next line.
- **Running long at the demo:** end on James, skip Dorothy, go to Proof.
- **Running short:** add the 22-codes line on the Proof slide.

## Cut list (if any rehearsal runs over ~7:30)
- Dorothy is already out of the default run — leaving her out is the first ~30s you've already banked.
- Cut the "sign in with Google" aside on Slide 4 (saves ~8s).
- Trim the Maria intro to one sentence (saves ~10s).
- Do **not** cut: the thesis + chain (Slide 3), the "one engine, two doors" line, the James case, the honesty line, or the closing ask.

## Add list (only if you're genuinely short)
- Finishing calmly at **7:00–7:10 is better than stuffing in another case.** Don't reflexively add Dorothy just because you landed at 6:55.
- Add the 22-wrong-drug-codes line on the Proof slide (~15s) first — a very credible point for a developer audience, and lower-risk than a whole new patient.
- Add Dorothy (Slide 7) back into the demo (~30s) **only if your natural delivery is closer to ~6:30.** She adds a phenotype, not a new argument — James already carries the thesis.
