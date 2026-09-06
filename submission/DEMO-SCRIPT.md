# OncoVTE Guard — 8-minute live demo script

**Format:** 8 minutes, no Q&A, audience votes at the end. So the arc is
**Problem → Design → Live demo (the wow) → Maturity → Ask.** Spend the most time
in the live demo; the audience remembers the tool *doing something*, not slides.

**Setup before you start:**
- Open the live demo full-screen: `https://oncovte-guard.pages.dev`
- Click **Presentation mode** (top right) for the larger, cleaner demo view.
- Have the standalone editor on **Maria** to begin.
- Fallback if the network dies: the five decision-state screenshots in
  `docs/screenshots/` — walk those instead; the script still works.

---

## 0:00 – 1:00 · The problem (hook — one slide, no app yet)
> "A 58-year-old on chemo for pancreatic cancer. To safely start blood-thinner
> prophylaxis, her oncologist has to — *in one visit* — compute a Khorana risk
> score, cross-check every chemo drug against the anticoagulant for CYP3A4 and
> P-glycoprotein interactions, check kidney function, and rule out
> contraindications. That's four reasoning tasks under time pressure, and it's
> offloaded to human memory. Cancer-associated clot is the second leading cause of
> death in these patients — after the cancer itself — and anticoagulating the
> *wrong* one causes bleeding."

## 1:00 – 2:15 · The design (your differentiator — one or two slides)
> "OncoVTE Guard's core idea is **verifiable decision support** — the opposite of a
> black box. Every recommendation traces through three links you can check:
> **tests** prove the engine faithfully applies its rules; a
> **rule → source → code → test traceability matrix** proves those rules trace to
> the guideline literature; and — as you'll see in a moment — the engine's live
> behavior proves those rules are *clinically intelligent*, not just consistent.
>
> That one engine is exposed **two ways**: an interactive SMART-on-FHIR dashboard
> the clinician pulls up, and a CDS Hooks service the EHR pushes at order entry —
> **identical by construction**, so they can never disagree."

*(Lead with the matrix / verifiability — that provenance story is what a FHIR panel
rewards. Treat the test count as supporting evidence, never the headline: tests only
prove the code does what you intended, the matrix proves the intent is guideline-true.)*

---

## 2:15 – 6:15 · Live demo (the core — stay here)

### Beat 1 — a clean recommendation (Maria) · ~45s
- **Maria** is already loaded. Point to the green **"Prophylaxis recommended."**
> "Pancreatic cancer, Khorana **5** — the app scores it against the trial-validated
> ≥2 threshold (ITAC and NCCN), confirms kidneys are fine, screens her chemo, and recommends
> apixaban or rivaroxaban with the exact prophylaxis dose. Every card cites its
> source."

### Beat 2 — the wow: a drug interaction rewrites the plan (James) · ~2:00
- Click **James**. He's a 72-year-old with lymphoma **on Ibrutinib**.
- Point to the red banner: **"Major DOAC interaction: Ibrutinib"** and the verdict
  **"Prophylaxis recommended — LMWH (DOACs blocked)."**
> "Same risk threshold met — but Ibrutinib has a *major* interaction with both
> preferred DOACs. So the engine **blocks apixaban and rivaroxaban** and falls
> back to LMWH — and it explicitly refuses to substitute dabigatran or edoxaban,
> which aren't NCCN prophylaxis options."
- **Now make it live:** in the left panel, click the **×** on **Ibrutinib**.
> "Take the interacting drug away —" *(the verdict flips back to DOACs recommended
> in real time)* "— and the DOACs come right back."
- **Re-add it:** medication dropdown → **Ibrutinib**.
> "Put it back — and we're back to LMWH. This isn't a lookup table; the real
> engine re-runs on every change."
- Click **See all interactions** to show the DDI matrix (52 agents × 4 DOACs),
  then close it.
> "The interaction knowledge base is curated from the AHA 2022 Scientific
> Statement and Hellfritzsch 2024, and it's honest about what it is — a curation
> date, not a clinician sign-off."

### Beat 3 — a hard stop (real-time safety) · ~45s
- Back to **Maria**. Toggle **"Is the patient actively bleeding?"** on.
> "One clinician-confirmed flag — active bleeding — and every drug option
> disappears: absolute contraindication, instantly." *(Toggle back off.)*
- *(Optional if time:)* click **Dorothy** — platelets below 50k, an absolute
  contraindication with severe renal impairment; the brick-red band makes it
  unmissable.

---

## 6:15 – 7:15 · Maturity & honesty (this audience rewards candor)
> "This is a rigorous **prototype**, and I hold it to a three-tier claim standard,
> so I'll be precise: the honest headline is **provably consistent — not clinically
> validated.** **185 automated tests** cover every clinical threshold boundary, and
> **five synthetic FHIR patients** exercise all five decision states end to end. It
> has **not** been used on live EHR data or validated with clinicians — no patients,
> no clinician evaluation, synthetic data only. And here's exactly what would move it
> to the next tier: the prospective study I'd run next would measure
> appropriate-prophylaxis rate, symptomatic VTE, major bleeding, and alert-override rate.
>
> It's built entirely on open standards — FHIR R4, SMART App Launch, CDS Hooks —
> so it's portable across EHRs, and I've agreed to publish it in the SMART App
> Gallery."

## 7:15 – 8:00 · The ask (vote line)
> "Here's the one thing to remember: **every recommendation OncoVTE Guard makes can
> be traced — live, in this room — from a guideline, to a line of code, to a test
> that proves it; and when a drug is unsafe, the engine narrows to the safe option
> instead of just firing an alert.** That's decision support you can *audit*, at the
> point of care, in the tools clinicians already use. If that's what you'd want in
> your EHR, I'd be grateful for your vote."

---

## Timing cheat-sheet
| Segment | Time | On screen |
|---|---|---|
| Problem | 1:00 | Slide |
| Design | 1:15 | Slide (dual-surface + traceability) |
| Demo — Maria recommend | 0:45 | App |
| Demo — James LMWH wow (live toggle) | 2:00 | App |
| Demo — bleeding hard-stop | 0:45 | App |
| Maturity & honesty | 1:00 | Slide or app |
| Ask / vote | 0:45 | Slide |

**Rehearse the James toggle until it's smooth — that 20 seconds is the whole talk.**
