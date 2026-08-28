# OncoVTE Guard — AMIA / HL7 FHIR App Competition · Submission Checklist

**Application #17227 · Student category · 2026 Annual Symposium (Dallas, TX)**

Single source of truth for finishing and submitting. Walk it top to bottom.
Legend: ✅ ready in repo · ✍️ paste/enter in portal · 📎 file upload · 🔴 blocker · 🟡 decision.

Re-verify field sizes anytime with `npm run check:submission`; regenerate the
combined paste doc with `npm run build:submission` (output: `SUBMISSION-FULL.md`).

---

## 🔴 Fix these first (errors currently live or missing)

- [ ] **Title typo in the portal** — it currently reads **"OncoVTE Ga​urd"**. Correct it to **"OncoVTE Guard"** everywhere it appears. The repo spells it correctly; only the portal entry is wrong.
- [ ] **Replace the stale portal abstract** — the abstract currently in the portal says *"121 automated tests"* and *"second leading cause of death."* Both are wrong. Paste the corrected abstract from `submission/01-abstract.txt` (says **180 tests**, **"a leading cause"** — the wording our own `11-references.txt` supports).
- [ ] **Advisor attestation PDF** — *send the ready email today:* `submission/advisor-email-draft.md` (attach `advisor-attestation-template.md`, now covering all six portal components). Longest-lead item.
- [ ] **Logo** and **headshot** — see Tab 3 uploads. *(Logo directions drafted; awaiting your A/B/C pick + favicon recolor.)*

## ✅ UI decision — RESOLVED
- [x] **Adopted the green "Ink" theme** (pine-green + paper, serif headings). Merged to `main`, pushed, **redeployed live** — `oncovte-guard.pages.dev` verified serving green. All 5 decision-state screenshots re-shot in green.

---

## Tab 1 · Submitter Information

| Field | Value / source | Status |
|---|---|---|
| Title | OncoVTE Guard | ✍️ (fix typo) |
| Promotional Title | *(the "When Chemo Meets Anticoagulation…" hook — already entered, fine as-is)* | ✅ |
| Project Abstract (**250 words**) | `submission/01-abstract.txt` — 216 words | ✍️ (replace stale one) |
| **Mentor/Advisor Statement PDF** | Fill `submission/advisor-attestation-template.md` → letterhead → sign → PDF | 🔴📎 **you + advisor** |
| PowerPoint Presentation | Confirm whether required pre-acceptance or only if accepted | 📎 *(verify need)* |

## Tab 2 · Abstract Information

| Field | Value | Status |
|---|---|---|
| FHIR-accepted-submission agreement (present Nov 10) | **I agree** | ✍️ |
| Category | **Student** | ✍️ |

## Tab 3 · FHIR Application Information

**Long-form fields** — copy from the file named; all verified within the portal's real limits:

| Portal field | Limit | Source file | Size |
|---|---|---|---|
| Project rationale, impact and innovation | 3500 chars | `02-rationale.txt` | 3464 |
| Project design and implementation | 7000 chars | `03-design.txt` | 5047 |
| Project evaluation and sustainability | 3500 chars | `04-evaluation.txt` | 3487 |
| **Data Validation** | 3500 chars | `04b-data-validation.txt` | 3098 |
| Twitter project summary | 140 chars | `06-twitter.txt` | 138 |
| How is FHIR being used? | 500 chars | `07-fhir-usage.txt` | 476 |
| Data source for FHIR resources | 500 chars | `09-data-source.txt` | 471 |
| Any other information | 250 words | `10-other-info.txt` | 193 |
| Additional info / video (optional) | 250 words | *(optional — demo + repo URL)* | — |

**Radio / checkbox answers:**

| Field | Select |
|---|---|
| Intended user/audience | **Provider-facing** *(see `05-audience.txt`)* |
| FHIR release | **R4** |
| FHIR Resources | **Both** (upload CapabilityStatement + it also lists resources) |
| US Core / Other IG / None | **US Core** *(race & ethnicity extensions)* |
| FHIR technologies | **SMART** + **CDS Hooks** |
| Paying customers? | **No** |
| Solution conceived | **June 2026** |
| Solution implemented | **June 2026** (functional prototype) |
| Users / patients impacted | **0 to date — pre-deployment prototype; 5 synthetic patients, no PHI** |
| Website / URL / GitHub | Demo: `https://oncovte-guard.pages.dev` · Source: `https://github.com/jtown42/oncovte-guard` |
| Publish in SMART App Gallery if feasible? | **Yes** |

**Uploads on this tab:**
- [ ] 📎 **FHIR Resources** → upload `public/capability-statement.json` (R4 client; lists Patient, Condition, Observation, MedicationRequest) ✅ *file exists*
- [ ] 📎 **Logo** — *not yet created* (offer: Claude can draft one)
- [ ] 📎 **Headshot / promotional photo** — *your photo*

## Tab 4 · Speaker Information

- [ ] Are you (submitter) the first speaker? → **Yes**
- [ ] Accepted-submission / presenter-registration / consent-to-record affirmations → affirm
- [ ] COI: **"I DO NOT have any relevant financial relationships to disclose"** *(confirm this is true for you)*
- [ ] Attestation statements → agree
- [ ] Electronic signature → **type your full name**

## Tab 5 · Submission Agreements

- [ ] Submission Affirmation → **Yes, I affirm**
- [ ] Speaker Multimedia Release → **give permission**
- [ ] Inclusive Language guidelines → **Yes, I complied where possible**

---

## Outward-facing steps (deploy the green UI before the URL goes in the form)
- [ ] **Push `main`** to GitHub (backs up the theme + screenshots + submission edits).
- [ ] **Redeploy the live demo** so `oncovte-guard.pages.dev` shows green — Cloudflare Pages direct-upload (NOT git-connected, so a push alone won't update it):
  ```
  npm run build
  npx wrangler pages deploy dist --project-name=oncovte-guard --branch=main --commit-dirty=true
  ```
  Do this **before** finalizing the portal, since the demo URL is part of the submission.

---

## Final submit sequence
1. All 🔴 items cleared (typo, abstract, advisor PDF, logo, headshot).
2. Green demo pushed + redeployed (Outward-facing, above) — URL shows green.
3. `npm run check:submission` → all within limits.
4. Paste every long-form + short field from the files above (or from `SUBMISSION-FULL.md`).
5. Set every radio/checkbox per the tables.
6. Upload: advisor PDF · capability statement · logo · headshot · (PowerPoint if required).
7. Complete Tabs 4 & 5 affirmations + signature.
8. **Submit.** ✅

## Supporting artifacts already in the repo
- FHIR CapabilityStatement — `public/capability-statement.json`
- Five decision-state screenshots (green) — `docs/screenshots/`
- Rule→source→code→test traceability — `VERIFICATION.md`
- Full references + defense notes (CASSINI, Khorana ≥2, DDI sources) — `submission/11-references.txt`
- Advisor attestation template (all 6 components) — `submission/advisor-attestation-template.md`
- Advisor email, ready to send — `submission/advisor-email-draft.md`
- 8-minute live demo script — `submission/DEMO-SCRIPT.md`
