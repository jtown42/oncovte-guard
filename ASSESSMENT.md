# OncoVTE Guard — Independent Assessment Brief

**Purpose of this document.** This is a self-contained briefing for an
independent reviewer — human or LLM — asked to judge three things:

1. **What is this?** (What does the app do, and what problem does it solve?)
2. **Is it good?** (Clinical accuracy, engineering quality, scope honesty.)
3. **Is it worth submitting** to the AMIA / HL7 FHIR App Competition (Student
   category) — and if not, what would have to change?

It is deliberately written to enable *critical* assessment, not to sell. It
states the claims, points to the evidence that backs each one, and lays out the
weaknesses plainly. A reviewer should be able to read only this file plus
`VERIFICATION.md` and reach a defensible verdict. Where you want to verify a
claim yourself, the reproduction commands are in §8.

> **One-sentence summary.** OncoVTE Guard is a SMART-on-FHIR + CDS Hooks
> clinical decision support app that decides whether an ambulatory cancer
> patient warrants pharmacologic VTE prophylaxis and, if so, which anticoagulant
> is safe — by combining Khorana risk scoring, a 52-agent DOAC–chemotherapy
> interaction knowledge base, renal dosing, and contraindication screening into
> one tested reasoning engine exposed through two EHR surfaces.

---

## 1. The clinical problem (why this is non-trivial)

Venous thromboembolism is a leading cause of death in people with cancer and
accounts for roughly one in five of all VTE events. Active malignancy raises VTE
risk ~4–7×, and many systemic therapies raise it further. Ambulatory
chemotherapy patients are a high-yield prevention target — **but blanket
prophylaxis is wrong**: anticoagulation must be reserved for patients whose
thrombotic risk outweighs their bleeding risk.

Making that call correctly at the point of care requires the clinician to, in
one sitting:

- compute a multi-variable **Khorana score** from diagnosis + a current CBC + BMI;
- know that DOACs are **CYP3A4/P-gp** substrates and that specific antineoplastic
  and supportive-care agents induce or inhibit those pathways enough to cause
  bleeding or therapeutic failure;
- account for **renal function, thrombocytopenia, hepatic impairment,
  antiphospholipid syndrome, luminal GI/GU tumors, and HIT**;
- recognize the malignancies (**myeloma, primary brain tumor, acute leukemia,
  MPN**) that fall *outside* the Khorana model entirely.

This is exactly the kind of multi-factor, guideline-bound decision that human
memory offloads poorly under time pressure — i.e., a good CDS target. The
*affected population* is the ~2M people newly diagnosed with cancer in the US
each year who receive ambulatory systemic therapy; the *users* are oncologists,
heme-onc physicians, oncology pharmacists, and APPs.

**Reviewer test:** Is the problem real, important, and a genuine fit for CDS (as
opposed to something already solved by a simple order set)? Judge whether the
multi-factor reasoning above actually warrants software.

---

## 2. What was actually built (scope — claims vs. reality)

To prevent over-claiming, here is the honest scope boundary.

| Capability | Built? | Evidence |
|---|---|---|
| Khorana scoring from FHIR data, with per-criterion breakdown & risk tiering | ✅ | `src/core/khorana-engine.ts`; 24 tests |
| 4-DOAC × 52-agent interaction matrix with mechanism + management per cell | ✅ | `src/core/ddi-checker.ts`, `src/data/ddi-knowledge-base.json`; 13 tests |
| Cockcroft-Gault CrCl + per-anticoagulant renal guidance | ✅ | `src/core/renal-dosing.ts`; 11 tests |
| `appliesTo`-aware contraindication screening (targeted vs. universal) | ✅ | `src/core/contraindications.ts`; 11 tests |
| Stale-lab guarding (>30 days) | ✅ | `src/core/stale-lab.ts`; 9 tests |
| Synthesized recommendation (preferred / alternative / avoid + ranked alerts) | ✅ | `src/core/recommendation.ts`; 6 tests |
| FHIR R4 parsing (Patient/Condition/Observation/MedicationRequest, US Core ext.) | ✅ | `src/fhir/fhir-parser.ts` |
| SMART-on-FHIR launch (OAuth2) | ✅ (code complete) | `src/fhir/smart-launch.ts`, `public/launch.html` |
| CDS Hooks 1.0 service (`patient-view` + `order-select`, discovery, prefetch) | ✅ | `src/cds-hooks/*`; 11 tests |
| React clinical dashboard, 5 decision states | ✅ | `src/components/*`; screenshots in `docs/screenshots/` |
| 5 synthetic FHIR R4 patient bundles, end-to-end | ✅ | `tests/integration/patients.test.ts`; 18 tests |

**What it is NOT (important for an honest verdict):**

- It has **not** been run against a live production EHR or the SMART App Gallery
  sandbox by an external party — SMART launch is code-complete and standards-
  conformant, but the demonstrated, screenshot-verified path is the standalone
  synthetic mode. (Both modes share one parsing pipeline, so behavior is
  identical, but a reviewer should not assume a live-EHR deployment has been
  exercised.)
- The DDI knowledge base is **curated**, not a live interaction service (see §5).
- It has **no users, no paying customers, no clinical validation study** — it is
  a student competition entry, not a deployed product.

---

## 3. The core design claim, and why it matters

> *This is not a dashboard that displays data. It is a clinical reasoning engine,
> proven by 123 automated tests, exposed through two surfaces.*

The clinical logic lives in `src/core/` as **pure, framework-free,
deterministic** functions. The SMART dashboard, the standalone demo, and the CDS
Hooks service all converge on **one seam**: `assemblePatientData()` →
`generateRecommendation()`. Consequences a reviewer should weigh:

- **Testability.** Because the engine is UI- and transport-agnostic, every
  clinical rule is unit-testable in isolation — which is why a 123-test suite can
  meaningfully claim guideline fidelity.
- **Dual-surface coherence.** "Clinician pull" (SMART dashboard) and "EHR push"
  (CDS Hooks) produce *identical* clinical output by construction, not by
  duplicated logic. This is the project's strongest architectural argument.
- **Auditability.** `VERIFICATION.md` traces every rule
  *clinical rule → published source → code (`file:function`) → test*. This is
  unusual rigor for a student entry and is the project's strongest *credibility*
  argument.

**Reviewer test:** Open `src/core/recommendation.ts` and one test file. Decide
whether the "reasoning engine, not a viewer" claim is real or marketing.

---

## 4. How it maps to likely AMIA judging dimensions

The competition scores on innovation, FHIR usage, clinical value/impact,
technical execution, and sustainability. A reviewer can use this as a starting
rubric (adjust weights to the official criteria).

| Dimension | Self-assessed strength | Where to verify | Honest caveat |
|---|---|---|---|
| **Clinical value / impact** | High — addresses a real, high-mortality, high-volume decision with RCT-backed interventions (AVERT, CASSINI) | §1; `submission/02-rationale.txt` | Impact is *potential*, not measured |
| **Innovation** | Medium-High — unifies risk scoring **and** DDI checking in one recommendation; `appliesTo`-aware contraindications; dual-surface | §3; `submission/02-rationale.txt` | Each component individually is known art; the *integration* is the novelty |
| **FHIR usage** | Solid — R4, real resources, US Core extensions, SMART launch, CDS Hooks 1.0, capability statement | `VERIFICATION.md` §7–8; `public/capability-statement.json` | Not yet exercised against a live external EHR |
| **Technical execution** | High — TS strict, 123 tests, typecheck-clean build, traceability matrix | §8; `VERIFICATION.md` §1–2 | — |
| **Sustainability** | Medium — clean separation makes the KB extensible; but the DDI KB needs ongoing curation | §5; `submission/04-evaluation.txt` | A curated KB is a maintenance liability without a steward |

---

## 5. The single most important caveat: the knowledge base

**Read this before judging clinical accuracy.** The DDI knowledge base and the
clinical rule thresholds were **curated from supplied structured clinical input
and published labeling**, encoded against an authoritative project contract
(`plan/errata-contract-reconciliation.md`). The engineering guarantees that the
encoded rules are applied *faithfully and consistently* (that is what the 123
tests prove). The engineering does **not** independently guarantee that the
underlying pharmacology is itself correct or current — that rests on the source
content and would need clinician/pharmacist sign-off for real use.

This is disclosed everywhere it matters (`VERIFICATION.md` §9–10, the in-app
disclaimers, every submission field). A reviewer should treat the claim as:
*"faithful, tested implementation of a curated guideline set,"* **not**
*"independently validated drug-interaction service."* The app says so itself.

One concrete signal of the curation discipline: resolving the four "special
notes" agents surfaced a latent RxNorm mis-assignment (thalidomide vs.
tamoxifen, `10324`/`10400`) that would have falsely flagged tamoxifen patients
as on an IMiD. It was caught, corrected, and **locked with a regression test**
(`tests/data/rxnorm-codes.test.ts`). That is the kind of error a serious
reviewer should *look for* — and here is one that was found and fenced.

---

## 6. Strengths and weaknesses, stated plainly

**Strengths**
- Genuinely hard, genuinely valuable clinical decision — not a toy.
- Reasoning engine + 123 tests + rule→source→code→test matrix = unusual rigor.
- Dual-surface (SMART + CDS Hooks) from one tested core.
- Safety-conscious by design: apixaban/rivaroxaban-only rule with LMWH (never
  dabigatran/edoxaban) fallback; `contraindicated` only on a *universal*
  absolute; stale-lab guarding; unknown drugs degrade to "verify manually."
- Full, honest disclosure of limitations rather than hiding them.

**Weaknesses / risks (for the reviewer to probe)**
- **Curated KB, not a live service** (§5) — the central scientific dependency.
- **No live-EHR deployment or end-user validation** — synthetic data only.
- **No outcome evidence** — impact is argued from literature, not measured here.
- **Active major bleeding** is a clinician-set boolean, not auto-detected (FHIR
  doesn't reliably encode it) — a deliberate but real gap.
- **Kidney cancer** is scored high-risk with an advisory note that NCCN names
  only bladder/testicular — a documented clinical interpretation, not consensus.
- **Sustainability** depends on someone maintaining the KB over time.

None of these are concealed; all appear in `VERIFICATION.md` §9. The question
for the reviewer is whether they are *acceptable for a student competition entry*
(the bar is a well-engineered, well-reasoned prototype) — not whether they would
block clinical deployment (they would, and the app says so).

---

## 7. Questions a reviewer should answer (verdict rubric)

Score each 1–5; a strong submission should average ≥4 with no 1s.

1. **Problem importance** — Is cancer-associated VTE prophylaxis a real,
   high-impact decision worth software? *(§1)*
2. **CDS fit** — Is this genuinely a decision-support problem, not a lookup? *(§1, §3)*
3. **Clinical reasoning correctness** — Sampling the traceability matrix, do the
   encoded rules match the cited guidelines? *(`VERIFICATION.md` §4)*
4. **Engineering quality** — Do typecheck + 123 tests + build actually pass, and
   is the code clean? *(§8)*
5. **FHIR/standards execution** — Is the FHIR/SMART/CDS-Hooks usage real and
   conformant? *(`VERIFICATION.md` §7–8)*
6. **Innovation** — Is the *integration* (risk + DDI + appliesTo + dual-surface)
   meaningfully novel? *(§3–4)*
7. **Honesty** — Are limitations disclosed and scoped, or hidden? *(§5–6)*
8. **Submission polish** — Are the form fields, screenshots, and artifacts
   competition-ready? *(`submission/`, `docs/screenshots/`)*

**Final question:** *Is this worth submitting to AMIA?* A reasonable verdict,
given the evidence: **yes for the Student category** — it is a well-reasoned,
rigorously tested, standards-conformant prototype of a real clinical problem,
with honest scoping. The honest counter-argument a reviewer might raise is that
the clinical content is curated rather than independently validated and the app
is unproven in a live EHR — both true, both disclosed, and both appropriate to
flag as the natural next steps rather than as disqualifiers for a student
prototype.

---

## 8. Reproduce everything (don't take claims on faith)

```bash
npm install
npm run typecheck     # tsc --noEmit (strict)        → 0 errors
npm test              # vitest run                    → 10 files, 123 tests pass
npm run build         # tsc && vite build             → dist/ (112 modules)
npm run dev           # standalone demo, 5 patients   → http://localhost:5173
npm run cds-server    # CDS Hooks service             → http://localhost:3000/cds-services
```

Then read, in order:

- **`VERIFICATION.md`** — the rule→source→code→test audit and errata compliance.
- **`src/core/recommendation.ts`** — the orchestrator (the actual reasoning).
- **`tests/integration/patients.test.ts`** — five patients end-to-end.
- **`submission/SUBMISSION-FULL.md`** — exactly what will be submitted.
- **`docs/screenshots/`** — the five decision states.

---

*Companion documents: `README.md` (orientation), `VERIFICATION.md` (correctness
proof), `submission/` (the actual entry). This brief is the lens; those are the
evidence.*
