# AMIA / HL7 FHIR App Competition — Submission Pack

Paste-ready answers for the official submission form. Each field is its own
plain-text file so it can be copied directly, and every character-limited field
is verified by `npm run check:submission` (counts raw characters **including
spaces and newlines** — the conservative measure a form textarea enforces).

> Last verified: **all fields within limits.** Re-run `npm run check:submission`
> after any edit, then `npm run build:submission` to regenerate the combined doc.

**One-file copy-paste version:** `SUBMISSION-FULL.md` (generated — do not edit by
hand) stitches every field below into one document, each labeled with its live
character count. Edit the `.txt` source files, then run `npm run build:submission`
to regenerate it.

**Advisor attestation:** fill in `advisor-attestation-template.md`, print on
letterhead, sign, and upload as PDF (student-category requirement).

## Field → file map

| Form field | Limit | File | Chars |
| --- | --- | --- | --- |
| Project abstract | 1,000 | `01-abstract.txt` | 975 |
| Project rationale, impact and innovation | 3,500 | `02-rationale.txt` | 3,370 |
| Project design and implementation | 7,000 | `03-design.txt` | 4,678 |
| Project evaluation and sustainability | 3,500 | `04-evaluation.txt` | 2,705 |
| Intended user/audience | — | `05-audience.txt` | 598 |
| Twitter project summary | 140 | `06-twitter.txt` | 138 |
| How is FHIR being used? | 500 | `07-fhir-usage.txt` | 476 |
| FHIR release & resources | 500 | `08-fhir-release-resources.txt` | 461 |
| Data source & access | 500 | `09-data-source.txt` | 471 |
| Any other information | 1,500 | `10-other-info.txt` | 1,159 |
| Structured / short-answer fields | — | `00-short-answers.txt` | — |

(Counts are a snapshot; the script is the source of truth.)

## Supporting artifacts (already in the repo)

- **FHIR Capability Statement:** `public/capability-statement.json` (R4 client, lists Patient/Condition/Observation/MedicationRequest).
- **Promotional photos:** `docs/screenshots/patient-1..5-*.png` — the five decision states (recommend, LMWH fallback, contraindicated, not indicated, excluded).
- **Verification evidence:** `VERIFICATION.md` — rule→source→code→test traceability matrix, errata compliance, and the 106-test inventory referenced in the evaluation field.

## Items the submitter must still supply (flagged with `[ ]` in `00-short-answers.txt`)

1. **Advisor attestation PDF** (student category) — program name/address, primary advisor, co-authors + contributions, attestation of the student's contribution.
2. **Dates** — when conceived / when implemented.
3. **Website/URL** (repo or demo).
4. **Logo and student headshot.**
