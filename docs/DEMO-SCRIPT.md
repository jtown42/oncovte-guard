# OncoVTE Guard — 8-Minute Live Demo Script

**Venue:** AMIA / HL7 FHIR App Competition (Student), live on stage, no Q&A.
**Goal:** prove this is a *deterministic clinical reasoning engine* — not a chart
viewer — exposed through SMART-on-FHIR and CDS Hooks.

**Setup before you start:**

1. Open the live site and turn on **Presentation mode** (top-right toggle, or
   add `?present=true`). This enlarges the verdict, Khorana score, and CrCl for
   the back of the room and hides chrome.
2. Confirm you're on the **Maria** chip. The left control rail holds the
   scenarios + knobs; the right side is the clinician's dashboard. The verdict
   stays in the top-right as you drag a slider — your body never blocks it.
3. Window at ~1440px wide so the rail and dashboard sit side by side.

Demo **three** patients only — Maria → James → Dorothy. Robert and Priya stay in
the rail as "also handled" but are not walked through (they slow the arc).

---

## [0:00–1:30] The crisis

> "Every year, venous thromboembolism kills more cancer patients than almost any
> chemotherapy side effect. Guidelines say: score every ambulatory patient with
> the Khorana model, then pick a safe anticoagulant. But that means hunting down
> a lab panel, adjusting for BMI, computing creatinine clearance by hand, and
> checking every chemo agent against every DOAC. In a busy clinic, those steps
> get skipped. OncoVTE Guard does them the instant the chart opens."

Gesture to the rail: "Everything on the left is the live patient. Watch the
right react."

## [1:30–3:15] Maria — the clean success

Click **Maria**.

> "Maria has pancreatic cancer. The app has pulled her labs from FHIR, scored
> Khorana **5 — high risk**, confirmed normal renal function, screened her
> therapy, and landed on a clean recommendation: **prophylaxis recommended**,
> apixaban or rivaroxaban. Standard, safe, immediate."

Point to the green verdict, the Khorana **5**, the two preferred option cards.

## [3:15–5:00] James — the landmine

Click **James**.

> "Real oncology is rarely that clean. James has non-Hodgkin lymphoma and is on
> **ibrutinib**. A generic dashboard would still say 'high risk, give a DOAC.'
> Watch what this engine does."

Point to the **DOAC–therapy interactions** card: *"1 major interaction detected
— ibrutinib."* Click **View full matrix**.

> "Ibrutinib is a **major** interaction with both apixaban and rivaroxaban via
> P-glycoprotein. So the engine pulls both DOACs off the table and falls back to
> **LMWH** — and critically, it never substitutes dabigatran or edoxaban, which
> aren't NCCN prophylaxis options. That's a guideline rule enforced in code."

Close the modal (Esc). The dashboard already shows LMWH as the alternative.

## [5:00–6:45] Dorothy — the threshold flip (the wow moment)

Click **Dorothy**.

> "Dorothy is our hardest patient: lung cancer, Khorana high risk, severe renal
> impairment — CrCl **13** — and a platelet count of **42,000**. The engine
> flags an **absolute contraindication**: you cannot anticoagulate her safely."

Verdict is **red — contraindicated**. Pause on it.

> "Now her morning labs come back. Platelets have recovered from their nadir."

Grab the **Platelets** slider in the rail and drag it from **42 up past 50**
(land around **55**).

> "Watch the verdict."

The banner **flashes and flips to green — prophylaxis recommended**. Apixaban
returns as the **preferred** option, tagged **renal: caution**; rivaroxaban
stays off the table because of her CrCl.

> "Two things just happened. The contraindication lifted the moment platelets
> crossed 50,000 — that's the engine, recomputing live, not a pre-baked page.
> And it didn't just flip a switch: it still flags her severe renal impairment,
> so apixaban comes back *with caution* and rivaroxaban stays avoided. That
> nuance — the difference between 'safe' and 'safe with conditions' — is the
> whole point."

*(Threshold note for the presenter: severe thrombocytopenia is platelets
< 50 ×10³/µL; anything ≥ 50 lifts that specific contraindication. Apixaban is
"caution" rather than "avoid" below CrCl 30; rivaroxaban and LMWH are "avoid".
These are the real engine thresholds — `contraindications.ts` and
`doac-renal-thresholds.ts`.)*

## [6:45–8:00] The architecture & the two surfaces

> "Everything you saw runs on one pure, framework-free reasoning core — the same
> `generateRecommendation` function, covered by **121 automated tests** that
> encode the guideline rules. That core has no idea whether it's talking to a
> screen or a machine."

> "Here it's a **SMART-on-FHIR dashboard** the clinician opens. The *same* engine
> also runs as a **CDS Hooks service** — so when a clinician signs a chemo order,
> the EHR can fire an alert *without anyone opening anything*. Passive
> surveillance and an interactive workspace, one engine, zero divergence."

*(If showing the CDS Hooks card: present it as a screenshot/slide at the very
end — do not spin up a terminal on stage.)*

Close: *"OncoVTE Guard — the Khorana score, the interaction matrix, and the
renal math, done the moment the chart opens, every time."*

---

## Stage hygiene

- **Presentation mode on** the whole time.
- Drag **one** slider live (Dorothy's platelets). Don't fiddle with others on
  stage — the flip is the moment; protect it.
- The DDI modal and the "Demographics & body metrics" section are there if a
  judge asks, but stay collapsed during the arc.
- If you mis-click into a "Custom" scenario, the chip turns amber — just click
  the patient chip again to reset.
