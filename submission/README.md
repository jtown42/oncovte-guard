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

Limits mirror the ACTUAL AMIA portal: the abstract and "other info" fields are
capped by **words**, the FHIR narratives and Twitter field by **characters**.

| Form field | Limit | File |
| --- | --- | --- |
| Project abstract | 250 words | `01-abstract.txt` |
| Project rationale, impact and innovation | 3,500 chars | `02-rationale.txt` |
| Project design and implementation | 7,000 chars | `03-design.txt` |
| Project evaluation and sustainability | 3,500 chars | `04-evaluation.txt` |
| Data validation, terminology and provenance | 3,500 chars | `04b-data-validation.txt` |
| Intended user/audience | — | `05-audience.txt` |
| Twitter project summary | 140 chars | `06-twitter.txt` |
| How is FHIR being used? | 500 chars | `07-fhir-usage.txt` |
| Data source & access | 500 chars | `09-data-source.txt` |
| List of FHIR resources (supplementary) | 500 chars | `08-fhir-release-resources.txt` |
| Any other information | 250 words | `10-other-info.txt` |
| Structured / short-answer fields | — | `00-short-answers.txt` |

Run `npm run check:submission` for live sizes — the script is the source of truth.
A field-by-field portal walkthrough (radios, uploads, affirmations) is in
`SUBMISSION-CHECKLIST.md`.

## Supporting artifacts (already in the repo)

- **FHIR Capability Statement:** `public/capability-statement.json` (R4 client, lists Patient/Condition/Observation/MedicationRequest).
- **Promotional photos:** `docs/screenshots/patient-1..5-*.png` — the five decision states (recommend, LMWH fallback, contraindicated, not indicated, excluded).
- **Verification evidence:** `VERIFICATION.md` — rule→source→code→test traceability matrix, errata compliance, and the 180-test inventory referenced in the evaluation field.

## Items the submitter must still supply

Dates and URLs are now filled in `00-short-answers.txt`. What still requires a
human is tracked, with its portal location, in **`SUBMISSION-CHECKLIST.md`**:

1. **Advisor attestation PDF** (student category) — signed on program letterhead.
2. **Logo** and **student headshot** — image uploads.
3. **Fix the "Ga​urd" title typo** in the portal.
4. **Replace the stale portal abstract** (it still says 121 tests / "second leading cause").
