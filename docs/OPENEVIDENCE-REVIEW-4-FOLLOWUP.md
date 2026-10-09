# OpenEvidence review 4 — follow-up (2026-10-09)

Verbatim record of OpenEvidence's answer after being told what was applied from review 4
(including Dorothy's creatinine change and the 22 RxNorm code errors). Reference markers
are as returned. **OpenEvidence explains below that its numbered reference list is a block
the interface shows under each answer, separate from the answer text, so it has to be
copied separately.**

---

Keep Dorothy at creatinine 2.0 — that's the right call, and it's guideline-concordant, not a fudge. At 52 kg, age 82, female, Cockcroft-Gault gives CrCl ≈ 18 mL/min at Cr 2.0 (versus ≈ 13 at Cr 2.8), and because she isn't obese the adjusted-body-weight change you made doesn't alter her number — actual weight applies, so 18 is correct. At CrCl 18 the engine landing on apixaban "caution," rivaroxaban and LMWH "avoid" reproduces NCCN VTE-B-2 exactly: that table lists apixaban as caution if CrCl <30 (with a footnote that these patients were excluded from the prophylaxis trials and it may be used "in extenuating circumstances"), while rivaroxaban, dalteparin, and enoxaparin are all avoid if CrCl <30. [1] So the post-slider screen shows precisely what a guideline-faithful engine should show, and tuning a synthetic vignette's creatinine to land in a specific teaching band is entirely legitimate for a labeled synthetic case — no judge can call that deceptive.

One subtlety worth understanding so you can defend the choice. The only reason you needed to touch Dorothy's creatinine is that you adopted the EMA-based "avoid apixaban <15" rule from the last audit. That rule is the better clinical call — apixaban's dose-adjusted serum concentration runs roughly 3.3-fold higher in CKD stage 4 (GFR 15–29) than in normal renal function, and the EMA accordingly reduces the dose at 15–29 and avoids it <15, whereas the FDA label makes no renal adjustment at all. [2-3] Given that rule, CrCl 13 correctly yields "no safe agent," and shifting to CrCl 18 restores the nuance moment. Your three real options:

- Cr 2.0 / CrCl 18 (what you did): apixaban caution, others avoid — the "safe-with-conditions" beat. Best demo, fully NCCN-concordant. [1]
- Cr 2.8 / CrCl 13, keep EMA rule: "no safe agent" — a legitimate humility beat that fits your "we don't overstate" narrative, but visually anticlimactic (slider flips, nothing appears).
- Cr 2.8 / CrCl 13, drop the EMA rule back to plain NCCN caution-<30: apixaban would show caution even at 13, no data edit needed — but that's the weaker clinical choice, since apixaban at CrCl 13 is where concentrations climb and the EMA says avoid. [2]

Recommendation: keep option A. It's the strongest teaching moment and the most defensible encoding simultaneously.

The DOAC-in-renal-impairment logic your engine now implements — apixaban as the last DOAC standing as function declines, with an avoid floor at CrCl 15 — is captured cleanly in this decision diagram, which is a good reference for your traceability matrix:

> *[Figure as returned by OpenEvidence:]* Figure 1. DOAC use in kidney disease. Direct Oral Anticoagulants: Navigating Through Clinical Challenges. Cardiovasc Drugs Ther. June 1, 2024. Used under license from Springer Nature.

## The 22 drug-code errors are a bigger deal than the audit — and a gift for the talk

This finding is more important than any single interaction cell, and you should foreground it rather than bury it. nab-paclitaxel coded as carvedilol, dalteparin as desflurane, ramucirumab as dabrafenib, epoetin as dipyridamole — these are exactly the silent failures that make or break real FHIR CDS, because the terminology binding is the safety layer. A SMART app that trusts RxNorm/LOINC/ICD-10 codes is only as safe as those codes, and a mis-mapped RxCUI means a real enzalutamide order sails through without blocking a DOAC, or a real lenalidomide order never triggers the myeloma pathway — the app fails silently on live data while looking perfect in the demo.

The deeper lesson, which you should state plainly: your tests all passed because the synthetic fixtures carried the same wrong codes, so the suite was validating the engine against itself. That's a tautology, not verification. Catching it required checking every code against an external source of truth (RxNav), and the fix — a test that locks each code to the national database — is what actually closes the loop. That is a mature-engineering story the FHIR audience will respect, and it directly strengthens your "traceable, honest, won't overstate" positioning. Reframe it on stage in one line: "When I validated every code against the national RxNorm database, I found 22 wrong mappings my own tests couldn't catch — because the fixtures shared the codes. Terminology binding is the safety layer, so I added external validation." It turns a bug into proof of rigor.

## The applied clinical changes all check out

Everything you listed is consistent with the audit and with the primary sources: rifampin/carbamazepine/phenytoin blocking both DOACs (named in both labels), clarithromycin deliberately not blocking (both labels exempt it), tucatinib and itraconazole×dabigatran upgraded to major, doxorubicin/vinblastine/dexamethasone downgraded, and the three expert-guidance-not-label blocks (idelalisib, enzalutamide, mitotane). [1] Separating the opposite mechanisms so inducers trigger a clot alert rather than a bleed alert is the single most important structural fix — that was the conceptual error hiding in the original 14 "major" cells, and it's now right. James's mild, resolving LFTs kept below 3× ULN is correct: that preserves itraconazole as the sole reason both DOACs are blocked, so the "remove the drug, DOACs return" toggle stays clean and isn't confounded by a second hepatic block. [1]

## None of the "not done" items is a show-stopper

All four deferred items are safe to document as known limitations rather than fix before November, because no demo patient triggers any of them: no patient has HIT (so the missing fondaparinux-for-HIT fallback never fires — though NCCN HIT-B does list DOACs and fondaparinux as options, so it's a legitimate roadmap item), none is on cyclosporine or isavuconazole with rivaroxaban (the CrCl-dependent cells stated-but-not-applied), and none has cirrhosis with normal transaminases (the Child-Pugh gap). [1] State them once, confidently, in your limitations slide. The only one I'd flag as clinically meaningful for a future real deployment is the Child-Pugh gap, because a cirrhotic with normal ALT/AST would currently slip past your hepatic block — worth a sentence in the limitations file.

## Go-ahead: commit, redeploy, re-run the sandbox — with this check

Yes, proceed. Two must-dos before you call it done: (1) since all five bundles changed, recapture every sandbox screenshot — the old Maria/James/Dorothy captures are now stale and would misrepresent the live app; and (2) confirm the corrected RxNorm codes actually resolve in the sandbox's FHIR server, because the whole point of the code fix is that it only matters against a real terminology-bound server. Re-run the full Provider EHR Launch end-to-end and verify Maria (recommend), James (LMWH fallback), and Dorothy (contraindicated → slider → apixaban caution) all return the expected verdicts on live reads.

## Why your reference list keeps "not coming through"

This is a display mechanic, not a dropped output. The numbered sources are rendered by the interface as a block appended below each answer — they are generated from the inline [N] markers and are not part of the message body text. When you save an answer "word for word" into a markdown file, you're capturing only the body; you need to also copy the references block that appears beneath it in the interface. For your error-log purposes, the key sources behind this answer's clinical calls are named inline above: NCCN Cancer-Associated VTE v1.2026 VTE-B-2 (apixaban caution <30) and VTE-D-5 (DOAC renal/hepatic contraindications), the AVERT trial exclusion of GFR <30, and the EMA-versus-FDA apixaban renal dosing divergence — cite those by name and they'll survive the copy. [1-4]

### References (as shown under the answer in OpenEvidence)

1. Cancer-Associated Venous Thromboembolic Disease. National Comprehensive Cancer Network. Updated 2026-05-05. Guideline.
2. Serum Concentration of Apixaban in Relation to Renal Function in Older Hospitalized Patients. Drugs & Aging. 2025. Mellingsæter TC, Molden E, Steihaug OM. Observational.
3. Direct Oral Anticoagulants: Navigating Through Clinical Challenges. Cardiovascular Drugs and Therapy. 2024. Ioannou M, Leonidou E, Chaziri I, Mouzarou A. Review.
4. Apixaban to Prevent Venous Thromboembolism in Patients with Cancer. The New England Journal of Medicine. 2019. Carrier M, Abou-Nassar K, Mallick R, et al. RCT.

A consolidated bibliography for all audit rounds is in `docs/REFERENCES.md`.

---

## What was done

- Dorothy kept at creatinine 2.0 (option A).
- The apixaban <15 rule is now labelled as EMA SmPC-sourced in code and in the master document.
- The Child-Pugh gap now has its own sentence in the master document's limitations.
- The RxNorm-code finding was added to the talk script, Slide 4.
- Sandbox screenshots for Maria and Dorothy were re-captured alongside James's (`docs/screenshots/sandbox-*-2026-10-09.png`).
- **On "confirm the codes resolve in the sandbox's FHIR server":** the SMART sandbox server (Smile CDR) stores whatever codes it is sent; it is not bound to RxNorm and does not validate them. RxNav (NLM) is the terminology authority, and every code was checked there by name, so that is the external check that applies. The sandbox run confirms the app reads the corrected codes from a live server and acts on them; for example, nab-paclitaxel under 486610 was recognized as a minor interaction.
- **Dorothy's slider in the SMART view:** the EHR-launched view has no edit rail; that mode only reads chart data. The platelet what-if is shown in the standalone demo and locked by the test "live demo what-if: platelets 55 → apixaban with renal caution".
