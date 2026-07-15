# OncoVTE Guard — Design & Demo Review Brief

**For an external reviewer (human or LLM).** I'm preparing to give a short **live
demo on stage at the AMIA / HL7 FHIR App Competition (Student category)** and I
want blunt, concrete, opinionated feedback on how to make the interface a
**cool, meaningful, high-impact demo** — not a generic dashboard walkthrough.

This folder gives you the site "in high detail" without needing to open it:
high-resolution screenshots of every state, plus the exact on-screen text.

- **Live site:** https://oncovte-guard.pages.dev
- **Repo:** https://github.com/jtown42/oncovte-guard

---

## 1. What the app is (30-second version)

A SMART-on-FHIR + CDS Hooks clinical decision support tool that decides whether
an ambulatory cancer patient should get pharmacologic VTE prophylaxis and, if
so, which anticoagulant is safe — by combining:

- **Khorana VTE risk score** (cancer site + platelets/Hgb/WBC/BMI)
- a **52-agent DOAC–chemotherapy interaction** knowledge base
- **Cockcroft-Gault renal dosing**
- **contraindication screening** (bleeding, thrombocytopenia, HIT, hepatic, etc.)

The thesis I want the demo to *prove*: **"This is not a dashboard that displays
data — it is a clinical reasoning engine (123 automated tests prove guideline
fidelity), exposed through both a SMART dashboard and a CDS Hooks service."**

The standalone demo now wraps that engine in a **live "what-if" editor**: every
input is editable and the full recommendation recomputes instantly.

---

## 2. Artifacts in this folder (look at these)

**Screenshots (PNG, 2× desktop / 3× mobile, full-page):**

| File | What it shows |
| --- | --- |
| `desktop-editor-viewport.png` | The above-the-fold view as the page loads — the editor + start of the recommendation. **This is the view I think is cluttered.** |
| `desktop-1-maria-recommend.png` | Full page, Maria Santos — pancreatic, Khorana 5 → **recommend** apixaban + rivaroxaban |
| `desktop-2-james-lmwh-fallback.png` | James Chen — ibrutinib blocks **both** DOACs → **LMWH fallback** |
| `desktop-3-dorothy-contraindicated.png` | Dorothy Williams — platelets 42k → **contraindicated** (severe renal too) |
| `desktop-4-robert-not-indicated.png` | Robert Johnson — Khorana 0 → **not indicated** + stale labs |
| `desktop-5-priya-excluded.png` | Priya Patel — myeloma → **excluded** + IMiD pathway pointer |
| `desktop-editor-collapsed.png` | Same page with the editor **collapsed** — i.e., the dashboard on its own |
| `mobile-1-maria-editor.png`, `mobile-3-dorothy-contraindicated.png` | Mobile (390 px) |

**Exact on-screen text:** `docs/review/text/*.txt` — the literal copy for each
desktop state (so you can critique wording, not just layout).

---

## 3. How the screen is currently laid out (top → bottom)

1. **Top bar:** logo "OncoVTE Guard", tagline, "Standalone demo" chip.
2. **Live patient editor** (a card):
   - "LIVE PATIENT EDITOR" header with a pulsing green dot + "Hide controls".
   - **Start-from preset chips:** Maria / James / Dorothy / Robert / Priya.
   - **Cancer diagnosis** dropdown, **Sex** toggle, **Age** slider.
   - **Labs & vitals** — a grid of **six sliders**: Platelets, Hemoglobin, WBC,
     BMI, Weight, Serum creatinine (each with a "clear/set" affordance).
   - **ESA toggle** + **active medications** (removable chips + "Add a medication" select).
3. **Patient banner** (name, age/sex, diagnosis, weight/height/BMI, flag pills).
4. **Recommendation hero** — colored verdict ("Prophylaxis recommended", etc.).
5. **Preferred / Alternative / Avoid** anticoagulant option cards.
6. **Khorana score card** (big number + per-criterion breakdown) and **Renal
   function** table (CrCl + per-agent standard/caution/avoid), side by side.
7. **DOAC ↔ therapy interaction matrix** (per-drug severity cells).
8. **Contraindications & cautions.**
9. **Disclaimers.**

---

## 4. My own read (please challenge or confirm)

- **Working well:** the *output* — Khorana "5", the color-coded recommendation,
  the option cards, the DDI matrix, the renal table — reads cleanly and is
  interpretable at a glance. I don't think the dashboard is the problem.
- **Not working:** the **editor at the top feels cluttered and confusing**, and
  it **pushes the actual recommendation below the fold**. On a projector, in
  front of people, that's a lot of knobs competing for attention before anyone
  sees the payoff. (See `desktop-editor-viewport.png`.)

---

## 5. The five built-in scenarios (the demo's natural story beats)

| Patient | Trigger | Verdict the engine reaches |
| --- | --- | --- |
| Maria Santos | Pancreatic, Khorana 5 | Recommend apixaban + rivaroxaban |
| James Chen | Lymphoma + **ibrutinib** | Both DOACs blocked → **LMWH** (never dabigatran/edoxaban) |
| Dorothy Williams | Lung, **platelets 42k**, CrCl 12.9 | **Contraindicated** |
| Robert Johnson | Colon, Khorana 0, old labs | **Not indicated** + stale-lab warning |
| Priya Patel | **Multiple myeloma** + lenalidomide | **Excluded** from Khorana → myeloma-specific pathway pointer |

---

## 6. What I want from you (be specific and opinionated)

1. **Demo narrative.** What is the strongest ~8-minute arc across these
   scenarios? Where's the single **"wow" moment** I should engineer and land?
2. **Declutter the editor.** How do I make the input controls legible on stage?
   Progressive disclosure? A compact "scenario knobs" rail? Show only 2–3
   controls at a time? Hide the editor until I invoke it?
3. **Input ↔ output relationship.** Should the recommendation stay in view while
   I tweak inputs (split-screen / sticky verdict)? Should the editor live beside
   the output instead of above it?
4. **The killer interaction.** What ONE live manipulation best *proves* "reasoning
   engine, not a viewer"? (My candidate: drag Dorothy's platelets up across 50k
   and watch the verdict flip from *contraindicated* → *recommend* in real time.)
5. **Motion/feel.** What would make the live recompute feel alive and credible
   (not gimmicky)? Currently the recommendation card does a small rise-in
   animation when the verdict changes.
6. **Cut list.** Anything on screen that is noise for a live audience and should
   be hidden or moved to a "details" disclosure?
7. **Room legibility.** Font sizes, contrast, density for a projector viewed from
   the back of a room — what must change?
8. **The two-surface story.** I also have a CDS Hooks service (EHR "push"
   alerts) in addition to this dashboard ("pull"). Is it worth showing both live,
   and if so how, without doubling the complexity?

---

## 7. Hard constraints (do **not** recommend breaking these)

- **Clinical accuracy is non-negotiable.** Do not suggest faking, pre-baking, or
  simplifying outputs into being wrong. Every shown value must come from the real
  engine.
- Keep the guideline rules intact: apixaban/rivaroxaban-only prophylaxis with
  **LMWH (never dabigatran/edoxaban)** fallback; Khorana tiers 0 Low / 1–2
  Intermediate / ≥3 High; prophylaxis threshold ≥2.
- **Synthetic data only — no PHI.**
- It must remain a real **SMART-on-FHIR + CDS Hooks** app (not a mockup).

---

## 8. Tech context (for any implementation suggestions)

- **Stack:** React 18 + TypeScript (strict) + Tailwind 3 + Vite.
- **Pure clinical engine:** `src/core/*` (framework-free, deterministic). Editing
  inputs rebuilds a `PatientData` and re-runs `generateRecommendation` — no
  duplicated logic.
- **Editor:** `src/components/ScenarioEditor.tsx` + `src/standalone/scenario.ts`.
- **Dashboard:** `src/components/Dashboard.tsx` + sibling panels.
- Concrete, file-level suggestions are welcome.
