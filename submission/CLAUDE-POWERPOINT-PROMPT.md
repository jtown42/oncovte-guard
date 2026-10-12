# Prompt for Claude in PowerPoint — OncoVTE Guard AMIA deck (v2)

> **How to use:** open the **AMIA 2026 speaker template** in PowerPoint first. Paste everything below the line into Claude. Insert the images and the video yourself when Claude leaves placeholders; the files are in `talk-assets/`.
> v2 (2026-10-12) matches `submission/FINAL-TALK-SCRIPT.md` v2: 11 slides, with the new FHIR write-back slide (7) and panel slide (8), and Dorothy moved to a hidden slide 11.

---

## Role and goal

You are building the slide deck for an **8-minute finalist talk at the AMIA 2026 / HL7 FHIR App Competition** (no Q&A; the audience votes for its top 3 apps at the end). The app is **OncoVTE Guard**: FHIR-native clinical decision support for preventing blood clots (VTE) in patients with cancer.

The audience is informaticians, FHIR developers and clinicians, and it rewards real FHIR depth. The talk is **an argument, not a product tour**. Two ideas must stick until the vote:

> **GUIDELINE → RULE → CODE → TEST → DECISION**
> **Structured FHIR in, structured FHIR out.**

**Thesis:** Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to executable logic, to an automated test, and when one treatment is ruled out, the engine evaluates the remaining options.

The script is **frozen**. Use the on-slide text below exactly; don't add claims, statistics or wording. Put the spoken text for each slide into its **speaker notes** word for word.

## Hard constraints

1. **Use the open AMIA template:** its theme, fonts, title/disclosure layouts and logo rules. Don't replace the master.
2. **16:9.** It will be projected in a large hall from a provided **Windows PC with no internet**. Slides can't be changed on site.
3. **Fonts:** template fonts or Windows-safe ones (Calibri, Segoe UI, Arial, Consolas for code). No web or Mac-only fonts.
4. **Legibility:** body text 24 pt minimum, headlines 36–44 pt, the chain 40 pt or larger, footnotes at least 12 pt. Keep to about 25 words of on-slide text per slide, not counting the image slides.
5. **Calm and spacious.** No clip art, stock photos, emoji or decorative icons.
6. **Animations:** only the builds listed, using plain Appear or a quick Fade. Transitions: Fade or none.
7. **The video must be embedded, never linked** (slide 6).
8. **No credentials or personal background anywhere** beyond the name and institution on the title slide. Never call a blood thinner "safe"; use "recommended," "eligible," or "appropriate remaining option."
9. **Never imply real patients or a real population.** Patients are synthetic; the panel on slide 8 is synthetic and labeled as such.

## Visual system

- **Palette:** teal-green `#2F6B57` (primary accent), dark green-black `#1F3D33` (headings), pale green `#EEF4F1` (callout fills), and a white background. Muted red `#B03A2E` **only** for "ruled out / avoid"; amber `#B7791F` **only** for "caution." Never use color alone; always pair it with a word.
- **The chain motif** `GUIDELINE → RULE → CODE → TEST → DECISION`: rounded teal boxes or chevrons, white bold all-caps text, arrows between them. Draw it the same way on slides 3, 9 and 10.
- **FHIR resource names** (Patient, Condition, DetectedIssue, …) appear as small rounded "chips" in Consolas on a pale green fill, styled the same everywhere (slides 4 and 9).
- **Screenshots and slide images** are 16:9 (3840×2160). Show them as large as possible and never stretch them. Slides 7 and 8 are complete, designed slide images: place them full-bleed and add nothing on top except the slide number.
- **Callouts on screenshots:** a 3 pt teal rounded rectangle plus a pill label of at most 6 words. At most 3 per screenshot.

## Assets (I insert these; leave labeled placeholders sized and positioned correctly)

| File (in `talk-assets/`) | Slide |
|---|---|
| `01-maria-recommend.png` | 5 |
| `02-james-lmwh-start.png` | 6 (starting still) |
| `05-james-toggle.mp4` (14.5 s, silent, H.264) | 6 (embedded video, on top of the still) |
| `08-james-card-to-fhir.png` (complete slide image) | 7, full-bleed |
| `09-panel-worklist.png` (complete slide image) | 8, full-bleed |
| `06-qr-live-demo.png` (opens https://oncovte-guard.pages.dev/) | 10 |
| `03-dorothy-42k-contraindicated.png`, `04-dorothy-55k-apixaban-caution.png` | 11 (hidden) |

If you can't insert a file, add a placeholder rectangle labeled `[INSERT 08-james-card-to-fhir.png — full bleed]` and keep going.

## Slide-by-slide

Put the cumulative time at the top of each slide's speaker notes.

---

### Slide 1 — Title (0:00–0:15)
**Layout:** AMIA title layout.
**On slide:**
- **OncoVTE Guard**
- **FHIR-native decision support for cancer-associated VTE prophylaxis**
- Justin Chestang · NYU Langone Health
- 2026 AMIA / HL7 FHIR App Competition
- Small gray corner stat, 14–16 pt: *Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis* (Holmes et al., *JCO Oncology Practice* 2026)

**Speaker notes:** "We know how to prevent many blood clots in patients with cancer, but prophylaxis is still underused — partly because it isn't one decision. It's risk, bleeding, kidney function, drug interactions and contraindications, all at once. OncoVTE Guard does that reasoning from the EHR, on FHIR, and shows exactly how it got there."

---

### Slide 2 — Disclosure (0:15–0:25)
**Layout:** the AMIA disclosure layout, if there is one.
**On slide:** **Disclosures** · No financial relationships to disclose · Student project · synthetic data only · not used on real patients
**Speaker notes:** "Quick disclosure: no financial relationships. This is a student project. It runs entirely on synthetic data and has never touched a real patient."

---

### Slide 3 — The problem → the thesis (0:25–1:05)
**Layout:** a headline, then builds one line at a time. Finish with the chain, large, across the full width.
**On slide (one build step each):**
1. Prevention works — but prescribing it safely means resolving **5 things at once**:
   a row of five small tiles: **risk score · bleeding risk · kidney function · drug interactions · contraindications**
2. One interacting drug can rule out **both** oral options. Kidney function narrows what's left.
3. Wrong one way → **clot**. Other way → **bleed**.
4. *(dim steps 1–3 to ~40%)* **The challenge isn't making a recommendation. It's making the reasoning inspectable and testable.**
5. **GUIDELINE → RULE → CODE → TEST → DECISION** (chain motif)

**Footnote:** ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56

**Speaker notes:** "Prevention works — pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients. The hard part is prescribing it safely, because five things have to be resolved at once: a risk score, bleeding risk, kidney function, drug interactions, and contraindications. One interacting drug can rule out both oral options; kidney function narrows what's left. Get it wrong one way, the patient clots. The other way, she bleeds.

So here's the idea behind the whole app. Clinical guidelines are written for humans, but implementing them reliably in software is hard. OncoVTE Guard makes that implementation explicit: every recommendation traces from a guideline, to a rule, to the code that runs it, to an automated test — and when one treatment is ruled out, the engine evaluates the remaining options."

---

### Slide 4 — FHIR: two doors, one engine (1:05–2:15)
**Layout:** one diagram built from **native PowerPoint shapes** (not an image), reading left to right:

```
 IN (read-only)              DOORS                         OUT
 [Patient]            [SMART App Launch]  ─┐
 [Condition]     ──►   clinician opens it   ├──► [ ONE engine ] ──►  [GuidanceResponse]
 [Observation]        [CDS Hooks]         ─┘                         [RiskAssessment]
 [MedicationRequest]   EHR invokes it                                [DetectedIssue]
                                                                     [MedicationRequest · draft]
                                                                     [Provenance]
```
- Headline: **Two doors, one engine**
- The left and right columns are resource chips. The engine box is the most prominent element (teal fill).
- Caption under the diagram, 28 pt: ***Structured FHIR in, structured FHIR out.***
- Optional build in 2 steps: (1) inputs, doors and engine; (2) the output column plus the caption.

**Speaker notes:** "Here's how it uses FHIR. FHIR gives an app standardized records: a Condition for each diagnosis, an Observation for each lab, a MedicationRequest for each active drug, and the Patient. The app reads exactly those four, read-only, and it's strict about meaning — a diagnosis only from a coded Condition, a lab only from a coded Observation, and a stopped drug can't change the advice.

It connects two ways. SMART App Launch, when a clinician opens it inside the chart. And CDS Hooks, when the EHR calls the same engine automatically at a workflow event — a chart opening, or a new drug order being entered.

Both doors run through the same normalizer and the same engine, so the dashboard and the EHR alert can't disagree.

And the output is FHIR too. Structured FHIR in, structured FHIR out. I'll show you what that means with a real patient."

---

### Slide 5 — Maria (2:15–2:35)
**Layout:** short headline; the screenshot as large as possible.
**On slide:** Headline **Watch it reason — Maria** · subhead *Synthetic patient · real output from the app* · `01-maria-recommend.png` · callouts: **"Risk score 5"** (score), **"Apixaban or rivaroxaban"** (verdict), **"Guideline source on every card"** (a card's Source line).
**Speaker notes:** "Two synthetic patients — real output from the app, not mock-ups. Maria has pancreatic cancer and a risk score of 5. Nothing rules out the oral options, so it recommends apixaban or rivaroxaban, with the guideline source on every card."

---

### Slide 6 — James: one drug changes the decision (2:35–3:50)
**The most important slide.** The headline sits at the top. The **starting still and the video are exactly the same size and position, stacked**, with the video above the still.
**On slide:**
- Headline: **James — one medication changes the decision**
- Small caption: *72 · lymphoma · on itraconazole*
- `02-james-lmwh-start.png`, visible on entry. Optional callouts: **"LMWH recommended"** (verdict) and **"Avoid — itraconazole interaction"** (struck-through rows).
- `05-james-toggle.mp4`: **embedded** (Insert → Video → This Device), **Start: On Click**, no loop, no audio, poster frame = first frame.
- Any on-slide wording about the result says **"LMWH"** or **"enoxaparin or dalteparin,"** matching the screenshot.
- No other animation.

**Speaker notes:** "James is 72, with lymphoma, and he's taking itraconazole for a serious fungal infection. His risk qualifies him for prophylaxis.

The engine checks every drug he's on against every blood thinner. It catches that itraconazole strongly inhibits CYP3A4 and P-gp, so the drug labeling says to avoid both oral options. Detecting that is only half the problem — the engine then evaluates what's left and recommends an injectable heparin, and shows exactly why each pill was ruled out.

[CLICK — play the clip.] Watch one thing. Remove itraconazole — the oral options come back. Add it back — we're back to the injectable. Same patient, one medication changed, different recommendation. The whole decision is re-evaluated every time.

[IF THE VIDEO WON'T PLAY: 'If I take itraconazole off his list, the engine re-runs and the oral options come back; add it again, and it's back to the injectable.']"

---

### Slide 7 — James's decision, written back as FHIR (3:50–4:20)
**Layout:** `08-james-card-to-fhir.png` **full-bleed**. It's a finished slide (headline, what the clinician sees, the DetectedIssue JSON, footers). Add nothing on top.
**Speaker notes:** "And here's that decision as FHIR. Each blocked drug becomes a DetectedIssue that points at the exact medication order that caused it — here, his itraconazole. The risk score becomes a RiskAssessment that points at the lab results it used. The recommendation becomes a draft proposal, never a signed order, and a Provenance record ties it all to the engine version. Every demo bundle passes the official HL7 validator, and it round-trips through a public FHIR server."

---

### Slide 8 — Same engine, whole panel (4:20–4:50) — first to cut
**Layout:** `09-panel-worklist.png` **full-bleed** (a finished slide, already labeled "synthetic panel"). Add nothing on top.
**Speaker notes:** "Because it's FHIR in and FHIR out, the same engine can run across a whole clinic panel through Bulk Data export. Here, on a synthetic panel I generated, it produces a worklist: patients who meet the guideline threshold with no anticoagulant on file. That's the underuse problem, at the population level.

[FIRST CUT: if the timed run is over ~7:15, hide this slide.]"

---

### Slide 9 — Proof and honesty (4:50–6:25)
**Layout:** a top line; two equal panels; a FHIR line; a limits strip; a "next" line. Build 3 + 1.
**On slide:**
- Top line (with the slide): *Clinical software only matters if you can trust **how** it reaches the answer.*
- Build 1, left panel, large: **349 ×10⁹/L → 0 points** / **350 ×10⁹/L → +1 point** · caption *Platelet threshold — both sides tested*
- Build 2, right panel: chain motif **SOURCE → RULE → CODE → TEST** · caption *Every clinical rule linked to its guideline, code and test*
- Build 3: **FHIR output validated against R4 (HL7 validator: 0 errors)**
- Build 4: a quiet pale full-width strip (not a warning style): *Prototype · synthetic data only · interaction table needs pharmacist review · diagnoses must be ICD-10-coded today*, and under it, small: *Next: silent-mode validation on real charts · SNOMED CT support · CDS Hooks order suggestions*
- Small corner badge, always visible: **229 automated tests**

**Speaker notes:** "Why trust it? I built verification into the architecture. The tests I care about most check the exact points where a recommendation flips. A platelet count of 350 adds a risk point; 349 doesn't — and both are tested, because that's precisely where a quiet bug would change the advice. Every clinical rule is linked to its guideline source, the code that implements it, and a test that checks its behavior.

Now the limits. It's a prototype, evaluated only on synthetic data. The interaction table still needs independent pharmacist review. And today it reads diagnoses coded in ICD-10 — supporting SNOMED is next, along with silent-mode validation on real charts compared against expert review.

[OPTIONAL, only if under 7:00: 'While building it, I found 22 drug codes pointing at the wrong medication — one chemo code was actually a blood-pressure pill. My own tests missed it, because the test data shared the codes. That's exactly why terminology needs outside validation.']"

---

### Slide 10 — The ask (6:25–7:05; stays up through applause)
**Layout:** the left two-thirds is a vertical flow in the chain style; the right third is a **large QR code**, at least 9 cm / 3.5 in, with a white quiet zone.
**On slide:**
- **PATIENT DATA (FHIR)** ↓ **GUIDELINE → RULE → CODE → TEST** ↓ **EXPLAINABLE DECISION (FHIR)**
- QR `06-qr-live-demo.png`, captioned **Try it live: oncovte-guard.pages.dev**
- **Vote for us**
- No animation.

**Speaker notes:** "OncoVTE Guard turns structured EHR data and clinical guidance into an inspectable, patient-specific decision — and hands that decision back as standard FHIR. Every clinical rule is traceable from its source, to its implementation, to its test. And when one treatment is ruled out, the engine re-evaluates what remains. If that's the kind of FHIR application you'd like to see move forward, I'd be grateful for your vote. The app is live — scan the code and try it yourself. Thank you."

---

### Slide 11 — Dorothy (HIDDEN backup)
**Layout:** two equal screenshots side by side, with an arrow between them labeled **"Platelets 42k → 55k."** Headline **Dorothy — it reasons about degree** · left `03-…` labeled **"42,000 → Contraindicated"** (red) · right `04-…` labeled **"55,000 → Apixaban with caution; rivaroxaban and LMWH avoided"** (amber) · caption *Lung cancer · severe kidney impairment (CrCl ≈ 18)*.
**Hide this slide** (Slide Show → Hide Slide).
**Speaker notes:** "BACKUP — only if running very short. One more. Dorothy has lung cancer and platelets of 42,000 — too low to anticoagulate, so: contraindicated. Raise her platelets past 50,000 and the verdict changes, but not to a simple yes. Her kidneys are severely impaired, so the engine allows one pill with caution and rules out the others. It reasons about degree."

---

## Before you finish, check and report
1. 11 slides in order; slide 11 hidden.
2. On-slide text matches this prompt exactly: no added stats, claims, credentials, or "safe."
3. Every slide's speaker notes contain the spoken text above, word for word.
4. The chain motif is the same on slides 3, 9 and 10, and the FHIR chips are the same on slides 4 and 9.
5. Slide 6: the still and the video are the same size and position, and the video is **embedded**, **On Click**.
6. Slides 7 and 8 are full-bleed images with nothing layered on top.
7. Text is at least 24 pt (footnotes at least 12 pt), nothing overflows, and no text covers a screenshot's verdict.
8. Only template or Windows-safe fonts are used.
9. List every placeholder I still need to fill.
