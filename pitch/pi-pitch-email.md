# Pitch email to PI — OncoVTE Guard / AMIA submission

> Draft. Edit the bracketed bits. Two versions below: **(A) short** — the one to actually
> send first; **(B) longer** — if he replies "tell me more" or you'd rather lead with detail.
> Live demo: https://oncovte-guard.pages.dev · Source: https://github.com/jtown42/oncovte-guard

---

## (A) Short version — send this

**Subject:** Quick look? Cancer-VTE clinical decision support I built — want to submit to AMIA

Hi Dr. [Last name],

Over the last few weeks I built a working clinical decision support app, **OncoVTE Guard**, and I'd like your read on it before I submit it to the AMIA / HL7 FHIR App Competition (Student category). I want you onboard as advisor, and I'd rather you kick the tires than take my word for anything.

**What it does, in one line:** at the point of care for an ambulatory cancer patient on chemo, it answers two coupled questions — *should this patient get VTE prophylaxis?* (Khorana score vs. the NCCN ≥2 threshold) and *if yes, which anticoagulant is actually safe for them right now?* (renal function, drug–drug interactions with their active chemo, thrombocytopenia, contraindications).

**Why I think it's worth your time:**
- It's not a mockup. It's a live app you can click: **https://oncovte-guard.pages.dev**
- All the clinical logic is one deterministic engine covered by **123 automated tests**, exposed through two real FHIR surfaces (a SMART-on-FHIR dashboard and a CDS Hooks service).
- I wrote a blunt internal document that grades the evidence behind *every* rule and lists every known weakness — I'd hand you that, not a sales sheet.

**Being straight with you about what it is and isn't:** the software and traceability are strong. What it does *not* yet have is clinician validation — no expert has reviewed the drug-interaction knowledge base cell by cell, and that's exactly where I need you. The app says so, everywhere, on purpose.

**What I'm asking:** 20–30 minutes for you to look at the demo and the one-page brief I've attached, and — if you're comfortable after that — to advise the submission and let me name you. If parts of the clinical content need correcting, I'd rather fix them now with you than have a reviewer find them.

Could I grab 20 minutes this [week / at your next open slot]? Deadline is [DATE].

Thanks,
[Your name]

---

## (B) Longer version — if he wants detail first

**Subject:** Cancer-associated VTE decision support — asking you to advise an AMIA submission

Hi Dr. [Last name],

I've built a clinical decision support system I'd like to submit to the **AMIA / HL7 FHIR App Competition (Student category)**, and I want your read — both because I'd like you as advisor and because you're the person most likely to catch anything wrong before a reviewer does.

**The clinical problem.** VTE is the second leading cause of death in cancer, after cancer progression, and accounts for roughly one in five of all VTE events; active malignancy raises risk ~4–7×. Ambulatory chemo patients are a high-yield prevention target, but blanket prophylaxis is wrong — anticoagulation only helps patients whose thrombotic risk outweighs their bleeding risk (AVERT, CASSINI). Getting that judgment right at the point of care means computing a Khorana score, knowing which chemo agents induce/inhibit CYP3A4 and P-gp enough to make a DOAC bleed or fail, and accounting for renal function, platelets, hepatic function, and contraindications — all in one sitting.

**What I built.** OncoVTE Guard does exactly that reasoning:
1. *Should this patient get pharmacologic prophylaxis?* — Khorana risk vs. the NCCN ≥2 threshold, after routing out malignancies outside the Khorana model.
2. *If yes, which anticoagulant is safe for this patient right now?* — apixaban/rivaroxaban-first with LMWH fallback, checked against renal function, active-chemo drug interactions, thrombocytopenia, and other contraindications.

**Why it's more than a demo:**
- **Live, clickable app:** https://oncovte-guard.pages.dev (five synthetic patients, no PHI).
- **One reasoning engine, not a dashboard.** Every guideline rule lives in pure, framework-free TypeScript and is unit-testable in isolation — **123 automated tests, all passing.** The SMART dashboard, the CDS Hooks service, and a standalone what-if demo all converge on a single code path, so the three surfaces are identical by construction, not by copied logic.
- **Standards-conformant:** SMART-on-FHIR (OAuth2), CDS Hooks 1.0, FHIR R4.

**Where I need you — stated honestly.** The strength here is software correctness and traceability. The gap is clinical validation: no clinician has reviewed the 52-agent drug-interaction knowledge base cell by cell, there's no usability or alert-fatigue evaluation, and a couple of rules are conservative surrogates I built rather than published scores (I've flagged each one). I keep an internal document that grades the evidence behind every single rule on an explicit scale and lists all 14 known weaknesses — I found three of them myself while writing it. I'd give you that document, not a pitch deck.

**The ask.** Would you spend ~30 minutes on the live demo and a one-page brief, and — if you're satisfied — advise the submission and let me name you? Concretely that means: a look at the clinical logic (I can walk you through the drug-interaction rules, which reduce to two clean pharmacologic mechanisms), and your sign-off or corrections on the content. Anything you flag, I fix before submitting.

Deadline is [DATE]. Could we find 30 minutes [this week / whenever suits you]?

Thanks for considering it,
[Your name]

---

### Attach or link when you send

- **One-page brief:** `pitch/pi-one-pager.md` (or exported PDF)
- **Live demo:** https://oncovte-guard.pages.dev
- **The honest full document** (only if he asks for depth): `MASTER-DOCUMENT.md` — lead him to §5 (evidence graded) and §12 (flaw register)
