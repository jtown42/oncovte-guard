# Evaluation evidence (WS-8)

The interface previously had **no** evaluation of any kind (F13). This document moves that
from zero toward non-zero. It is deliberately honest about what is measured vs. what is a
protocol awaiting a participant — **no think-aloud transcript or timing number in this file
is invented.** Empty result tables are empty on purpose.

---

## 1. Measured contrast audit — DONE

A full WCAG 2.1 AA contrast audit across all five decision states and presentation mode is
**complete and passing** — every text/background pair clears 4.5:1 (normal) / 3:1 (large).
Full table and method in [`ACCESSIBILITY.md`](./ACCESSIBILITY.md). Tightest margin 4.55:1
(slate-500 muted on the slate-50 canvas).

This is a genuine, reproducible measurement — the one part of interface evaluation that does
not require a human participant.

---

## 2. Think-aloud with one clinician — PROTOCOL READY, PARTICIPANT PENDING

> **Status: not yet run.** This requires one oncology pharmacist or advanced-practice
> provider (APP). The CDS literature explicitly calls for including end-user opinion in
> alert selection; a single think-aloud changes the honest sentence from "no clinician has
> used this" to "one clinician evaluated three scenarios." Do not fill the results table with
> anything but observed data.

**Protocol (≈20 min):**
1. Open the standalone demo. Give no instructions beyond "think aloud as you decide."
2. Walk three scenarios in order: **Maria** (clean recommend) → **James** (DOACs blocked → LMWH) → **Dorothy** (contraindicated, platelet flip).
3. For each: record **time to correct verdict** and note any point of confusion or misread.
4. Afterward, ask: was the bleeding-risk panel understood as *qualitative, not a score*? Did the two-channel alerting feel like the right amount?

**Results (fill from the session):**

| Scenario | Time to verdict | Confusions / misreads observed |
|---|---|---|
| Maria (recommend) | _pending_ | _pending_ |
| James (LMWH fallback) | _pending_ | _pending_ |
| Dorothy (contraindicated) | _pending_ | _pending_ |

**Summary:** _pending — 2–3 sentences once the session is run._

---

## 3. Task-completion timing baseline (n=2) — PROTOCOL READY, RUN PENDING

> **Status: not yet run.** A legitimate, honestly-scoped efficiency signal at n=2 with full
> disclosure of limitations. Time reaching the correct verdict for **James Chen** two ways.

**Protocol:**
- **Arm A (app):** open the standalone demo on James; time to correct verdict + safe agent.
- **Arm B (manual):** same decision using the NCCN VTE PDF + a DOAC interaction reference open, no app.
- Repeat with a second person. Report both, with n and limitations stated.

**Results (fill in):**

| Participant | Arm A (app) | Arm B (manual) | Notes |
|---|---|---|---|
| P1 | _pending_ | _pending_ | |
| P2 | _pending_ | _pending_ | |

**Limitations (state up front):** n=2, non-blinded, authors/convenience sample, single
scenario, learning effect between arms not controlled. This is a directional signal, **not**
an efficacy claim.

---

## Honest summary of evaluation status

- ✅ **Contrast:** measured, AA-passing, reproducible.
- ⏳ **Usability (think-aloud):** protocol ready; needs one clinician.
- ⏳ **Efficiency (timing):** protocol ready; needs to be run at n=2.

Until §2 and §3 carry real data, the app's claim remains **"designed for clinician
readability, with stated rationale and measured contrast"** — never "clinician-validated"
or "usable by clinicians." See `MASTER-DOCUMENT.md` §11.3 and F13.
