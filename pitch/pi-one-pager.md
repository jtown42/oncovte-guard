# OncoVTE Guard — one-page brief for advisor review

**A SMART-on-FHIR + CDS Hooks clinical decision support app for cancer-associated VTE
prophylaxis with DOAC–chemotherapy drug-interaction checking.**
Student entry, AMIA / HL7 FHIR App Competition.

- **Live demo:** https://oncovte-guard.pages.dev  ·  **Source:** https://github.com/jtown42/oncovte-guard
- **Built by:** [Your name], [program / year]  ·  **Advisor (proposed):** Dr. [Last name]

---

### The problem
VTE is the second leading cause of death in cancer, after cancer progression (~1 in 5 of all VTE events); active malignancy
raises risk ~4–7×. Ambulatory chemo patients are a high-yield prevention target, but
**blanket prophylaxis is wrong** — anticoagulation only helps when thrombotic risk
outweighs bleeding risk (AVERT, CASSINI). The point-of-care judgment is genuinely hard:
compute a Khorana score, know which chemo agents shift CYP3A4 / P-gp enough to make a
DOAC bleed or fail, and weigh renal function, platelets, hepatic function, and
contraindications — all at once.

### What the app decides
1. **Prophylaxis or not?** — Khorana risk score vs. the NCCN **≥2** threshold, after
   routing out malignancies outside the Khorana model.
2. **If yes, which drug is safe *for this patient now*?** — apixaban/rivaroxaban-first,
   LMWH fallback, checked against renal function, active-chemo interactions,
   thrombocytopenia, and contraindications. Five terminal decision states:
   *recommend · caution · contraindicated · not indicated · excluded.*

### Why it's credible engineering
| | |
|---|---|
| **One reasoning engine, not a dashboard** | All guideline logic is pure, framework-free TypeScript; every rule is unit-testable in isolation. |
| **123 automated tests, all passing** | The SMART dashboard, CDS Hooks service, and standalone demo all converge on **one code path** — identical by construction, not copied logic. |
| **Standards-conformant** | SMART-on-FHIR (OAuth2), CDS Hooks 1.0, FHIR R4. Synthetic data only, no PHI. |
| **Drug-interaction base** | 52 agents × 4 DOACs. The 16 recommendation-changing "major" cells reduce to **two clean mechanisms**: strong CYP3A4/P-gp inhibitors → bleeding; strong CYP3A4 inducers → therapeutic failure. |

### What it does *not* yet claim — where I need an advisor
- **No clinician has validated the content.** The drug-interaction knowledge base hasn't
  been reviewed cell by cell by a domain expert. **This is the specific ask.**
- **No usability or alert-fatigue evaluation.** No clinician has used it in a workflow.
- **A few rules are conservative surrogates I built** (e.g., a lab-only hepatic proxy),
  not published scores — each is flagged as such, not dressed up as guideline-derived.
- The app states these limitations on-screen and in its documentation, on purpose.

I keep an internal reference document that **grades the evidence behind every rule** on an
explicit scale and lists **all 14 known weaknesses** (I found three myself while auditing).
Happy to hand that over — it's the opposite of a sales sheet.

### The ask
~30 minutes: click the live demo, skim this brief, let me walk you through the
drug-interaction logic. If you're satisfied, **advise the submission and let me name you.**
Anything you flag on the clinical content, I correct before submitting.
**Deadline: [DATE].**
