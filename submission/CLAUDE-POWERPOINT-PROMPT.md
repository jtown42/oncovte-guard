# Prompt for Claude in PowerPoint — OncoVTE Guard AMIA deck

> **How to use:** Open the **AMIA 2026 speaker template** in PowerPoint first, so Claude builds inside its theme. Then paste everything below the line into Claude. Insert the images and the video yourself when Claude asks for them; the files are in `talk-assets/`.

---

## Role and goal

You are building the slide deck for an **8-minute finalist talk at the AMIA 2026 / HL7 FHIR App Competition** (Dallas, Nov 10, 2026). There is no Q&A, and the audience votes for their top 3 apps at the end of the session. The app is **OncoVTE Guard**: FHIR-native clinical decision support for preventing blood clots (venous thromboembolism, VTE) in patients with cancer.

The audience is informaticians, FHIR developers and clinicians. The talk is **an argument, not a product tour**. The deck has to make one idea stick until the vote:

> **GUIDELINE → RULE → CODE → TEST → DECISION**

**Thesis (the whole talk in two sentences):** Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to executable logic, to an automated test, and when one treatment is ruled out, the engine evaluates the remaining options.

The script is **frozen**. Use the on-slide text below exactly; don't add claims, statistics or wording. Put the spoken text for each slide into that slide's **speaker notes** word for word.

## Hard constraints

1. **Use the AMIA template** that is open: its theme, fonts, title/disclosure layouts and logo rules. Don't replace the master. Logos go on the title slide only (an academic logo is allowed there).
2. **16:9 widescreen.** It will be shown on a projector in a large hall from a provided **Windows PC with no internet**.
3. **Fonts:** use only the template fonts, or Windows-safe ones (Calibri, Segoe UI, Arial). No web fonts and nothing Mac-only, because they get substituted on Windows.
4. **Legibility from the back of the room:** body text 24 pt minimum, headlines 36–44 pt, and the chain 40 pt or larger. Keep to about 25 words of on-slide text per slide; the speaker carries the detail.
5. **Few words, lots of space.** This deck should look calm and confident, not dense. No clip art, stock photos, emoji, or decorative icons that add nothing.
6. **Animations:** only the builds listed below, using plain **Appear** or a quick **Fade**. No flying, spinning or bouncing, and no slide transitions beyond Fade or none.
7. **Never link media; embed it.** The video must be embedded in the file (see Slide 6).
8. **Synthetic data only.** Don't invent patient details beyond what's written here.
9. **Don't call any blood thinner "safe".** Use "recommended," "eligible," or "appropriate remaining option."

## Visual system

Work within the template. Where it leaves choices open:

- **Palette:** deep teal-green `#2F6B57` as the primary accent (the app's color), dark green-black `#1F3D33` for headings, pale green `#EEF4F1` for callout fills, and white or off-white backgrounds. Use a muted red `#B03A2E` **only** for "ruled out / avoid" and amber `#B7791F` **only** for "caution." Never use color as the only signal; pair it with a word.
- **The chain motif** `GUIDELINE → RULE → CODE → TEST → DECISION` is the visual signature. Draw it the same way every time it appears (Slides 3, 8 and 9): a row of rounded boxes or chevrons in teal with white bold all-caps text and arrows between them. Where only part of the chain appears (Slide 8 uses SOURCE → RULE → CODE → TEST), keep the same style.
- **Screenshots** are 16:9 (3840×2160). Show them as large as possible: full width under a short headline, or full-bleed with a semi-transparent caption bar. Never crop out the verdict, and don't stretch them. Add a thin 1 px neutral border if they sit on white.
- **Annotation callouts on screenshots:** a teal rounded rectangle outline (3 pt) around the region plus a short label of at most 6 words in a teal pill. Use at most 2–3 callouts per screenshot.
- **Footnotes/citations:** 12–14 pt, gray, bottom-left. **Slide numbers** bottom-right if the template supports them.

## Assets (I will insert these; leave clearly labeled placeholders)

| File (in `talk-assets/`) | Use on |
|---|---|
| `01-maria-recommend.png` | Slide 5 |
| `02-james-lmwh-start.png` | Slide 6 (starting still) |
| `05-james-toggle.mp4` (14.5 s, silent, H.264, 1920×1080) | Slide 6 (embedded video) |
| `03-dorothy-42k-contraindicated.png` | Slide 7 (left) |
| `04-dorothy-55k-apixaban-caution.png` | Slide 7 (right) |
| `06-qr-live-demo.png` (opens https://oncovte-guard.pages.dev/) | Slide 9 |

If you can't insert a file directly, add a placeholder rectangle of the right size and position labeled `[INSERT 02-james-lmwh-start.png]`, and keep building.

## Slide-by-slide

There are **9 slides**. Slide 7 (Dorothy) is a backup that is skipped in the normal run, so it must make sense on its own and not break the flow from 6 to 8. Mark it in its speaker notes as `BACKUP — skip unless running short`.

Times are cumulative, for the speaker's reference. Put them at the top of each slide's notes.

---

### Slide 1 — Title  (0:00–0:20)

**Layout:** AMIA title layout.

**On slide:**
- Title: **OncoVTE Guard**
- Subtitle: **FHIR-native decision support for cancer-associated VTE prophylaxis**
- Presenter: **Justin Chestang** · [built at [school]; now PGY-1, [program]] (leave the brackets for me to fill in)
- **2026 AMIA / HL7 FHIR App Competition**
- Small supporting stat in a corner, about 14–16 pt, gray: *Only ~6 in 10 high-risk patients receive prophylaxis* (Holmes et al., *JCO Oncology Practice* 2026)

**Speaker notes:**
"We know how to prevent many blood clots in high-risk patients with cancer, but prophylaxis remains underused. Part of the challenge is that this isn't one decision — it's risk, bleeding, kidney function, drug interactions, and contraindications, all at once. I built OncoVTE Guard to do that reasoning from the EHR, on FHIR, and show exactly how it got there."

---

### Slide 2 — Disclosure  (0:20–0:30)

**Layout:** the AMIA disclosure layout, if the template has one.

**On slide:**
- **Disclosures**
- No financial relationships to disclose
- Student project · synthetic data only · not used on real patients

**Speaker notes:**
"Quick disclosure: I have no financial relationships to report. OncoVTE Guard is a student project. It runs entirely on synthetic data and has never touched a real patient."

---

### Slide 3 — The problem → the thesis  (0:30–1:35)

**Layout:** a headline, then lines that **build one at a time on click**. The final reveal is the chain, large, across the full width.

**On slide (each bullet is one build step):**
1. VTE: major preventable morbidity and mortality in cancer
2. Prevention works — pooled AVERT + CASSINI cut overall VTE risk ~half in higher-risk patients
3. But prescribing safely means combining **5 things at once**:
   risk score · bleeding risk · kidney function · drug interactions · contraindications
   (show these five as a row of small labeled tiles, not a bullet list)
4. Wrong one way → **clot**. Other way → **bleed**.
5. *(Reveal. Dim steps 1–4 to about 40% opacity, or move them to a new section of the slide.)*
   **The challenge isn't just making a recommendation.**
   **It's making the reasoning inspectable and testable.**
6. *(Final reveal: the chain motif, large)* **GUIDELINE → RULE → CODE → TEST → DECISION**

**Footnote:** ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56

**Speaker notes:**
"Here's why that question is hard. In cancer, blood clots are a major and preventable source of illness and death. And we *can* prevent them — pooled data from the AVERT and CASSINI trials cut overall clotting risk by nearly half in higher-risk patients.

But to prescribe safely, you have to combine five things at once: a risk score, bleeding risk, kidney function, how the chemo interacts with the blood thinner, and contraindications. Get it wrong one way, the patient clots. The other way, she bleeds.

So this is the idea behind the whole app. Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to a rule, to the code that runs it, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options. Everything I show you from here backs up that sentence."

---

### Slide 4 — How it uses FHIR: two doors, one engine  (1:35–2:55)

**Layout:** **one diagram, built as native PowerPoint shapes** (not an image), so the text stays sharp. Read left to right:

```
 [ Clinician opens app ]            ┐
 [   SMART App Launch   ]  ───────► │
                                     ├──►  [ Normalizer ] ──► [ ONE engine ] ──► [ One verdict + its source ]
 [ EHR invokes at a workflow event ] │
 [        CDS Hooks         ] ─────► ┘
```

- Headline: **Two doors, one engine**
- Make the two "door" boxes visually equal, stacked on the left. Their arrows converge on one prominent "ONE engine" box in teal. The output box on the right reads "One verdict + its source."
- Underneath, a strip of four labeled chips: **Reads 4 FHIR resources (read-only): Patient · Condition · Observation · MedicationRequest**
- Optional small gray caption under the engine: *No clinical logic anywhere else — the dashboard and the EHR alert can't disagree.*
- Build: the diagram can appear all at once. If you animate it, use two steps: the doors, then the engine plus output.

**Speaker notes:**
"First, how it reads the chart. OncoVTE Guard gets its patient data through FHIR — the standard used by modern EHR APIs to expose structured clinical information to applications.

FHIR hands an app standardized records: a *Condition* for each diagnosis, an *Observation* for each lab, a *MedicationRequest* for each active drug, and a *Patient* for age and sex. My app reads exactly those four, read-only — it never writes to the chart. And it's strict about meaning: it takes a diagnosis only from a coded Condition and a lab only from a coded Observation, so a procedure can't be read as a diagnosis, and a stopped drug can't change the advice.

It connects two ways. One: SMART App Launch — the clinician opens it inside the chart, and the record authorizes it the way a website authorizes a 'sign in with Google' app. Two: CDS Hooks, which allows the same engine to be invoked automatically at a workflow event — a chart opening, or a chemo order being signed — and to return an advice card.

Here's the part that matters for this room, and it's the same point I just made with the chain. Both paths feed one normalizer, which builds one patient object, which goes to one decision function. No clinical logic lives anywhere else — so the dashboard and the EHR alert can't disagree, by construction. One engine, two doors."

---

### Slide 5 — Demo: Maria (the clean case)  (2:55–3:30)

**Layout:** short headline, then the screenshot as large as possible.

**On slide:**
- Headline: **Watch it reason — Maria**
- Subhead (small): *Synthetic patient · real output from the app, not a mock-up*
- Screenshot: `01-maria-recommend.png`
- Callouts (at most 3):
  - around the risk score: **"Risk score 5"**
  - around the verdict: **"Apixaban or rivaroxaban"**
  - around a card's "Source:" line: **"Guideline source on every card"**

**Speaker notes:**
"Let me show you the engine reasoning through two synthetic patients. These are real outputs from the application — not mock-ups.

Maria has pancreatic cancer. Her risk score is 5. The engine checks interactions, renal function and platelets; nothing rules out the oral options, so it recommends apixaban or rivaroxaban, with the guideline source shown on screen."

---

### Slide 6 — Demo: James (the one slide with motion)  (3:30–4:50)

This is the most important slide in the deck. Build it carefully.

**Layout:** the headline at the top, with the **starting still and the video in the same position and size**, stacked exactly on top of each other. When the video starts it should look as if the still has come to life.

**On slide:**
- Headline: **James — one medication changes the decision**
- Bottom (or a slim side panel), small caption: *72 · relapsed mantle cell lymphoma · on itraconazole*
- Starting still: `02-james-lmwh-start.png`, visible when the slide opens. Optional callouts on the still:
  - around the verdict: **"LMWH recommended"**
  - around the struck-through oral cards: **"Avoid — itraconazole interaction (FDA labeling)"**
- Video: `05-james-toggle.mp4`. **Embed it** (Insert → Video → This Device; never link it), with the same size and position as the still and placed above it.
  - Playback: **Start: On Click**. No audio (the clip is silent). Don't loop. Don't use "hide while not playing" if that would show a blank frame; the still underneath covers the frame before playback.
  - Set the poster frame to the first frame so nothing flashes.
  - If you can't insert video, leave a placeholder labeled `[EMBED 05-james-toggle.mp4 here — On Click]` and tell me in your summary.
- No other animation on this slide.

Note: the app shows **"Enoxaparin or Dalteparin."** Any on-slide text about the LMWH result must say **"LMWH (enoxaparin or dalteparin)"** or just **"LMWH,"** so it matches the screenshot.

**Speaker notes:**
"James is 72 with relapsed lymphoma. He's also taking itraconazole for a serious fungal infection, and his VTE risk qualifies him for prophylaxis.

But watch the engine work through his meds. It checks every drug he's on against every blood thinner — and it catches that itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling tells us to avoid *both* oral options in this setting. Detecting the interaction is only half the problem. The engine then evaluates the remaining options and selects an injectable heparin, enoxaparin — and tells you exactly why each pill was ruled out.

[CLICK — play the clip. Narrate calmly across it:]

Watch one thing. Remove itraconazole — the oral options return. Add it back — we're back to enoxaparin. Same patient. One medication changed. Different recommendation.

[Pause.]

The entire decision is re-evaluated each time.

[IF THE VIDEO WON'T PLAY: the still is already up. Say: 'If I take the itraconazole off his list, the engine re-runs and the oral options come back; add it again, back to the injectable.' Move on.]"

---

### Slide 7 — Dorothy (BACKUP, skipped by default)

**Layout:** two screenshots side by side, the same size, with an arrow between them labeled **"Platelets 42k → 55k."**

**On slide:**
- Headline: **Dorothy — it reasons about degree**
- Left: `03-dorothy-42k-contraindicated.png`, labeled underneath **"42,000 → Contraindicated"** (red)
- Right: `04-dorothy-55k-apixaban-caution.png`, labeled underneath **"55,000 → Apixaban with caution; rivaroxaban and LMWH avoided"** (amber)
- Small caption: *Lung cancer · severe kidney impairment (CrCl ≈ 18)*

**Speaker notes:**
"BACKUP — skip unless running short (under ~7:00).

One more, quickly. Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes — but not to a simple yes. Her kidneys are severely impaired, so the engine allows one pill *with caution* and rules the others out. It reasons about degree — the difference between 'appropriate' and 'appropriate, with conditions.'"

**Also:** hide this slide (Slide Show → Hide Slide) so the default run goes from 6 to 8, and tell me you did. I can unhide it.

---

### Slide 8 — Proof and honesty  (4:50–6:35)

**Layout:** a top line, then two equal panels side by side, then a limits strip at the bottom. Build in 3 + 1 steps.

**On slide:**
- **Top line (appears with the slide):** *Clinical software only matters if you can trust **how** it reaches the answer.*
- **Build 1, left panel: the boundary example, large:**
  - **349 ×10⁹/L → 0 points**
  - **350 ×10⁹/L → +1 point**
  - small caption: *Platelet threshold in the risk score — both sides tested*
- **Build 2, right panel: the chain motif:** **SOURCE → RULE → CODE → TEST**
  - small caption: *Every clinical rule linked to its guideline, its code, and its test*
- **Build 3:** one line: **Evaluates the remaining options, not just a red alert**
- **Build 4, limits strip:** a quiet, full-width pale band, not red and not a warning style: *Prototype · synthetic data only · interaction table needs pharmacist review*
- **Small corner badge (always visible):** **208 automated tests**

**Speaker notes:**
"Now — why trust it? Clinical software only matters if you can trust how it reaches the answer, so I built verification into the architecture. The tests I care about most check the exact decision boundaries — the points where the recommendation flips. A platelet count of 350 adds a risk point; 349 doesn't — and both are tested, because that's precisely where a quiet bug would change a recommendation. Every clinical rule is linked to its guideline source, the code that implements it, and a test that checks its behavior. And what you just watched is part of that: it evaluates the remaining options instead of firing a red alert.

Let me be honest about the limits. This is still a prototype. It's only been evaluated on synthetic data, and the medication-interaction knowledge base still needs independent pharmacist validation. The next step is silent-mode validation on real charts, compared against expert review.

[OPTIONAL, only if under 7:10: 'While building it I found 22 drug codes pointing at the wrong medication — one chemo code was actually a blood-pressure pill. My own tests missed it because the test data shared the codes. That's exactly why terminology needs outside validation.']"

---

### Slide 9 — The ask  (6:35–7:10; stays up through applause)

**Layout:** left two-thirds is a vertical flow; right third is a **large QR code**, at least 9 cm / 3.5 in square, with a white quiet zone around it.

**On slide:**
- Vertical flow (same chain styling, stacked):
  - **PATIENT DATA**
  - ↓
  - **GUIDELINE → RULE → CODE → TEST**
  - ↓
  - **EXPLAINABLE DECISION**
- QR: `06-qr-live-demo.png`, with the caption under it: **Try it live: oncovte-guard.pages.dev**
- Bottom: **Vote for us** (confident and clear, not shouty)
- No animation. Everything is visible as soon as the slide appears.

**Speaker notes:**
"OncoVTE Guard turns structured EHR data and clinical guidance into an inspectable, patient-specific decision. Every clinical rule is traceable from its source, to its implementation, to its test. And when one treatment option is ruled out, the engine reevaluates what remains. If that's the kind of FHIR application you'd like to see move forward, I'd be grateful for your vote. The app is live — scan the code and try it yourself. Thank you.

[Leave this slide up through applause. Eye contact on 'Thank you.']"

---

## Before you finish, check and report

1. All 9 slides exist in order. Slide 7 is hidden.
2. The on-slide text matches this prompt exactly. Nothing was added: no extra stats, claims, or "safe."
3. Every slide's speaker notes contain the spoken text above, word for word.
4. The chain motif is styled the same way on Slides 3, 8 and 9.
5. Slide 6: the still and the video are exactly the same size and position, and the video is **embedded** and set to **On Click**. If not, say so.
6. Body text is at least 24 pt and footnotes at least 12 pt. Nothing overflows its box, and no text sits on top of a screenshot's verdict.
7. Only template and Windows-safe fonts are used.
8. List every placeholder I still need to fill: images, video, and my school/program.
