# OpenEvidence review 4 — full clinical audit (2026-10-09)

Verbatim record of OpenEvidence's answer to the 22 questions in the clinical audit brief
(Claude Doc "OncoVTE Guard — Clinical Audit Brief for OpenEvidence",
https://claude.ai/code/artifact/a4574c90-597d-41bd-9eeb-b3a14e77b66a). Reference markers
[1]–[53] are as returned; the numbered list itself was **not** included in the paste
(OpenEvidence said it was "appended automatically"). What was applied is at the end.

---

Nine rule changes are warranted and most of the rest confirm as coded — and two of the changes touch a live demo verdict (Maria's CrCl and Dorothy's apixaban-at-CrCl-13). The single most important structural finding is that your 14 "major" cells conflate two opposite mechanisms: strong inhibitors raise DOAC levels (bleeding), while enzalutamide/apalutamide/mitotane are inducers that lower DOAC levels (treatment failure/thrombosis). The action ("don't use that DOAC") can be the same, but the alert reason and the word "blocks" are mechanistically wrong for the inducers. Each question is answered below in your requested format.

Hepatic thresholds are the one place I can tell you the app is exactly right against its cited source, so that's worth stating up front: NCCN VTE-D-5 matches your per-DOAC transaminase/bilirubin cutoffs verbatim. [1]

## Section A — The cells that block a DOAC

### Q1. The 14 recommendation-changing cells

The governing label logic: both DOAC labels trigger "avoid" only for a combined P-gp AND strong CYP3A4 perpetrator — apixaban §7.1 (inhibitors) / §7.2 (inducers), rivaroxaban §7.2 (inhibitors) / §7.3 (inducers). Apixaban at 2.5 mg BID is a flat "avoid" (no dose-reduction path); rivaroxaban is a flat "avoid." [2-3]

| Agent | Mechanism | Apixaban | Rivaroxaban | Verdict | References |
|---|---|---|---|---|---|
| Ketoconazole | Combined P-gp + strong CYP3A4 inhibitor | Avoid (named, §7.1) | Avoid (named, §7.2) | Correct | [2-3] |
| Itraconazole | Combined P-gp + strong CYP3A4 inhibitor | Avoid (named, §7.1) | Avoid (class, §7.2) | Correct | [2-3] |
| Posaconazole | Combined P-gp + strong CYP3A4 inhibitor | Avoid (class; ACF lists explicitly) | Avoid (class) | Correct | [4-5] |
| Idelalisib | Strong CYP3A4 inhibitor; NOT clinically relevant P-gp inhibitor | Label silent; AHA says avoid apixaban | Label silent | Change (not a label "avoid") | [4, 6-7] |
| Enzalutamide | Strong CYP3A4 inducer; P-gp inhibitor (not inducer) | Label silent; AHA/USPI say avoid | Label silent; AHA/USPI say avoid | Change mechanism; keep avoid | [4, 7-8] |
| Apalutamide | Strong CYP3A4 inducer + P-gp inducer | Avoid (ACF) | Avoid (ACF) | Correct | [4, 9] |
| Mitotane | Strong CYP3A4 inducer; P-gp effect conflicting | Not a label "avoid"; ACF "consider risk" | Same | Change (defensible but not label-based) | [4, 10-11] |

Ketoconazole, itraconazole, posaconazole: label says avoid for both DOACs — your "major" is correct. [2-4]

Idelalisib: its metabolite is a strong CYP3A4 inhibitor (midazolam AUC ↑5.4-fold) but it is not a clinically relevant P-gp inhibitor (no digoxin effect), so it does not meet either DOAC label's "combined" avoid criterion. The ACF 2026 classifies it as "strong CYP3A4 (no P-gp)" → "consider bleeding risk mitigation," not avoid. The AHA 2022 statement does specifically recommend avoiding apixaban + idelalisib, so keeping it "major" is defensible on expert-statement grounds — but label the basis as expert guidance, not FDA label. [4][6-7]

Enzalutamide: this is an inducer, not inhibitor, and it is a P-gp inhibitor — so it does not formally meet the "combined P-gp and strong CYP3A4 inducer" criterion. PBPK predicts apixaban AUC ↓31% and rivaroxaban AUC ↓45%, and both the AHA statement and the USPI interpretation recommend avoidance. Keep the "avoid" action but fix the mechanism text and the alert reason (thrombosis/efficacy loss, not bleeding). [7-8]

Apalutamide: strong CYP3A4 inducer and a (weak) P-gp inducer → meets the combined criterion; ACF 2026 says "avoid use." Your rating is the most defensible of the three inducers. [4][9]

Mitotane: a profound CYP3A4 inducer (midazolam AUC ↓~18-fold) with conflicting P-gp data; ACF places it in "strong CYP3A4 inducer (no P-gp)" → "consider thrombotic risk," not a categorical avoid. Keeping "major" is clinically reasonable given the magnitude of induction, but flag it as not a label-based avoid. [10-11]

Does the label say "avoid" or "caution"? Avoid: ketoconazole, itraconazole, posaconazole, apalutamide. Label-silent (expert guidance drives the call): idelalisib, enzalutamide, mitotane.

### Q2. Voriconazole × apixaban

Verdict: Correct as coded (moderate) — and this corrects my own prior-round advice. No FDA label section directs avoidance of apixaban 2.5 mg BID with voriconazole. Voriconazole is a strong CYP3A4 inhibitor but is not a P-gp inhibitor or substrate (no digoxin effect), so it does not meet the apixaban label's "combined P-gp and strong CYP3A4 inhibitor" avoid criterion. [12] ACF 2026 classifies it as "strong CYP3A4 (no P-gp inhibition)" → "limited data; consider bleeding risk mitigation strategies," and the "avoid" recommendation exists only at the review/consensus level (e.g., the Capiau ambulatory consensus list). [4][13] Source: apixaban label §7.1; ACF 2026. Demo impact: none directly, but this is decisive for the Q21 antifungal choice — do not switch James to voriconazole expecting both DOACs to block (it won't block rivaroxaban at all).

### Q3. Itraconazole × dabigatran

Verdict: Change (upgrade toward major, CrCl-dependent). The US Pradaxa label does not name itraconazole and gives specific dose-reduction guidance only for dronedarone and systemic ketoconazole, but it also states P-gp-inhibitor results "should not be extrapolated to other P-gp inhibitors" and sets CrCl-gated avoidance: for AF, reduce to 75 mg BID at CrCl 30–50 with dronedarone/ketoconazole and avoid any P-gp inhibitor at CrCl <30; for VTE, avoid any P-gp inhibitor at CrCl <50. [14] The EU SPC outright contraindicates itraconazole with dabigatran, and PBPK modeling predicts a ~3.5–5.9-fold dabigatran AUC increase. [15-16] Source: Pradaxa label §7.1; EU SPC. Demo impact: negligible — dabigatran is reference-only in your engine and never recommended, so this never changes a verdict; fix it for correctness of the matrix.

### Q4. Missing drugs that should be added

| Drug | Apixaban | Rivaroxaban | Rating basis | References |
|---|---|---|---|---|
| Rifampin | Avoid | Avoid | Combined P-gp + strong CYP3A4 inducer, named in both labels; AUC ↓~54%/~50% | [2-3, 17] |
| Carbamazepine | Avoid | Avoid | Named in both labels (§7.2/§7.3) | [2-3] |
| Phenytoin | Avoid | Avoid | Named in both labels (§7.2/§7.3) | [2-3] |
| Clarithromycin | None / no action | None / no action | Both labels explicitly carve it out ("no dose adjustment"/"no precautions") | [2-3] |
| Fluconazole | None (no significant PK change) | Caution (AUC ↑~42%) | Moderate CYP3A4, not P-gp | [18-19] |
| Isavuconazole | Caution (AUC ↑~33%) | Avoid if CrCl 15–80 (ACF) | Combined P-gp + moderate CYP3A4 | [4, 18] |
| Lorlatinib | Caution | Caution | Moderate CYP3A4 + moderate P-gp inducer (not strong) | [20-21] |
| Venetoclax | Caution | Caution | P-gp inhibitor only (no CYP3A4 inhibition) | [7] |
| Carfilzomib | None | None | IV, rapid clearance; midazolam PK unaffected in vivo | [22-23] |
| Lapatinib | Caution | Caution | P-gp inhibitor + weak in-vivo CYP3A4 | [24] |

The high-priority additions are rifampin, carbamazepine, and phenytoin as major (avoid) — these are the only missing agents that should block a DOAC, and all three are named verbatim in both labels. [2-3] Clarithromycin is the critical false-positive to avoid: despite being a combined P-gp/strong CYP3A4 inhibitor, both labels explicitly exempt it, so a naive "combined inhibitor → block" rule would wrongly fire. [2-3] For dabigatran/edoxaban (reference-only), lorlatinib and the azoles are P-gp inducers/inhibitors that ACF flags as avoid, but that won't affect your prophylaxis verdicts. [4] Source: apixaban §7.1–7.2, rivaroxaban §7.2–7.3, ACF 2026.

## Section B — The other interaction ratings

### Q5. Doxorubicin and vinblastine as "strong P-gp inducers"

Verdict: Change (downgrade; overstated). The "strong P-gp inducer" label rests on in-vitro and animal data (PXR-mediated ABCB1 upregulation); there are no human clinical PK studies showing reduced oral DOAC exposure, both are given IV, and the 2025 systematic review found no P-gp inducer qualifies as "potent" in humans (induction runs roughly one category below CYP3A induction). [25-27] The ACF 2026 requires both in-vitro evidence and a clinical ≥20% AUC decrease to call a drug a P-gp inducer — doxorubicin and vinblastine fail the second test. [4] Downgrade both to minor/theoretical (not moderate). Source: JACC P-gp reviews; Coumau & Csajka 2025. Demo impact: Maria is on nab-paclitaxel/gemcitabine (not these), so no verdict change.

### Q6. Dexamethasone at antiemetic doses

Verdict: Change (downgrade for short antiemetic courses). At 8–12 mg for 1–3 days, dexamethasone is at most a weak CYP3A4 inducer, and meaningful induction requires ≥5 days; human P-gp induction is unproven. [28] Clinical data (a dexamethasone-DOAC level study and the N3C nested case-control) show no meaningful DOAC level reduction or thrombotic signal even with longer courses, and the NCCN Antiemesis guideline states short (<4-day) antiemetic regimens would not produce clinically relevant interactions. [29-31] Downgrade to minor/none for antiemetic use; a "moderate" rating may remain reasonable only for chronic high-dose dexamethasone (e.g., myeloma Rd). Source: Smythe et al. 2022; NCCN Antiemesis 2026. Demo impact: none (no demo patient is on short-course dexamethasone affecting a DOAC verdict; Priya's dexamethasone is in the excluded myeloma pathway).

### Q7. Which "moderate" agents should be major?

Verdict: Change for tucatinib; conditional change for cyclosporine; others confirmed moderate.

- Tucatinib is a combined P-gp + strong CYP3A4 inhibitor (mechanism-based CYP3A inhibition; ACF lists it as avoid) → upgrade to major for both DOACs. [4][32]
- Cyclosporine is a combined P-gp + moderate CYP3A4 inhibitor; ACF/ACC advise avoiding rivaroxaban at CrCl 15–80 mL/min, with no apixaban dose reduction → make it a renal-conditional major for rivaroxaban, moderate for apixaban. [4][33]
- Ceritinib is a strong CYP3A4 inhibitor but not a P-gp inhibitor — a gray zone; "consider bleeding mitigation" rather than formal avoid, so moderate-to-strong caution is acceptable. [4][34]
- Imatinib, nilotinib, crizotinib, ribociclib, aprepitant, abiraterone, tacrolimus, neratinib: appropriately moderate. Source: ACF 2026; AHA 2022. Demo impact: none of the five demo patients are on these. [4][35]

### Q8. Pharmacodynamic bleeding flags

Verdict: Change (add agents). Acalabrutinib and zanubrutinib share the BTK/GPVI platelet-inhibition class effect and should carry a pharmacodynamic additive-bleeding flag like ibrutinib; ACF 2026 lists "Bruton's TKIs" as a class, and the 2025 ACC guidance states second-generation BTKis also increase bleeding risk (lower than ibrutinib, but real). [4][36-37] Add pirtobrutinib by the same logic. The VEGF-pathway agents you already flag (bevacizumab, ramucirumab, lenvatinib, cabozantinib) are correct; you may extend the PD flag to other VEGF-TKIs (sunitinib, sorafenib, pazopanib, axitinib, regorafenib). [38] Source: ACF 2026; ACC 2025 §BTK bleeding. Demo impact: if you keep James on rituximab only, none; if you make James's relapsed-MCL regimen BTKi-based (more realistic — see Q21), that BTKi would itself carry a PD flag.

### Q9. The 19 agents rated "none"

Verdict: Correct (with one framing caveat). None of the 19 (platinums, antimetabolites, pemetrexed, taxane docetaxel, anti-HER2/CD20 mAbs, checkpoint inhibitors, bendamustine, bleomycin) has a clinically meaningful PK interaction with apixaban or rivaroxaban, so "none" is right for the PK axis. [7][35] Caveat: several carry independent thrombotic or bleeding risk (e.g., cisplatin's arterial/VTE risk, VEGF agents' bleeding) that is a patient-level risk factor, not a drug-level DOAC interaction — keep that in the bleeding-risk panel, not the interaction matrix. Source: AHA 2022; Truong et al. 2023.

## Section C — Clinical rules

### Q10. Khorana site lists

Verdict: Correct. Stomach and pancreas = 2; lung, lymphoma, gynecologic, bladder, testis = 1; renal-cell carcinoma = 0 — all faithful to the original Khorana derivation (Blood 2008) and NCCN's Khorana table. [1][39] Lymphoma at 1 point is confirmed, and RCC = 0 is the original (some modified scores add RCC = 1 and brain = 2, but those are not the validated original — your advisory-note approach for RCC is the right compromise). [40] Source: Khorana 2008; NCCN VTE-C.

### Q11. Exclusion list and CLL/CML

Verdict: Change (route CML; reconsider CLL scoring). Myeloma, acute leukemia, MPN, and primary/metastatic brain tumor exclusions are directly supported by NCCN VTE-2. [1] Two refinements:

- CML (C92.1) is classified as a myeloproliferative neoplasm by WHO and was not in the Khorana derivation; your MPN exclusion (D45, D47.1/3/4) misses it because CML carries a C-code. Route C92.1 to the MPN/disease-specific pathway rather than scoring it. [1]
- CLL is not explicitly excluded by any guideline (NCCN says "acute leukemia"), so not excluding it is defensible — but CLL has among the lowest cancer VTE rates (~1.6–2% at 12 months), so scoring it as "lymphoma" (+1) overestimates risk. Consider either excluding CLL/SLL or scoring it 0. Source: NCCN VTE-2; Lam 2026. Demo impact: none of the five patients is CLL/CML. [41-42]

### Q12. Per-DOAC hepatic thresholds

Verdict: Correct (exact match to the cited source). NCCN VTE-D-5 lists apixaban (Child-Pugh B/C or ALT/AST >3× ULN or bilirubin >2× ULN), rivaroxaban (Child-Pugh B/C or ALT/AST >3× ULN), dabigatran (Child-Pugh C or ALT/AST >2× ULN or active hepatitis/cirrhosis), and edoxaban (Child-Pugh B/C or AST/ALT >3× ULN and bilirubin >2× ULN, or cirrhosis/active hepatitis) — your coded thresholds reproduce this verbatim. [1] One limitation worth a caveat line: because you don't compute Child-Pugh, a cirrhotic with normal transaminases (Child-Pugh B by ascites/INR/albumin) would be missed; NCCN's criterion is transaminases OR Child-Pugh. Note also the EMA/pivotal-trial thresholds are stricter (2× ULN), but since you cite NCCN, the 3× cutoffs are internally correct. [1][43] Source: NCCN VTE-D-5.

### Q13. Renal rules (and "30 mg vs avoid")

Verdict: Correct for the app's ambulatory scope. For ambulatory primary prophylaxis, NCCN VTE-B-2 says avoid dalteparin and enoxaparin at CrCl <30 (because the ambulatory LMWH regimens are weight-based/near-therapeutic), avoid rivaroxaban, and caution for apixaban — matching your table. [1] Enoxaparin 30 mg daily at CrCl <30 is the inpatient prophylaxis dose (VTE-B-1) and the FDA label dose, not an ambulatory recommendation, so keeping "avoid" is right for your use case. [1][44] Source: NCCN VTE-B-2 / VTE-B-1; enoxaparin label. Demo impact: Dorothy (CrCl 13) — see Q20 for the apixaban-caution concern.

### Q14. Cockcroft-Gault body weight

Verdict: Change. Actual body weight overestimates CrCl in obesity — by ~20% up to ~100% in class III obesity — risking misclassification into a higher renal tier. [45] Use adjusted body weight (0.4 factor) for BMI 30–39.9 and adjusted or lean body weight for BMI ≥40; KDIGO 2024 also endorses non-indexed eGFR at weight extremes for narrow-therapeutic-index drugs. [45-47] Source: Choudhary 2026; Hart & Anderson 2018; KDIGO 2024. Demo impact: Maria (95 kg, BMI 36.2) — actual-weight CG gives ~115 mL/min, but adjusted-weight CG gives ~85 mL/min. Her verdict doesn't change (both >30), but your displayed CrCl is inflated by ~30 mL/min, which would matter for a patient sitting near the 30 threshold. Your existing "weight <60 kg may overestimate" warning has the direction backwards for obesity — overestimation is the high-weight problem.

### Q15. LMWH dosing at weight extremes

Verdict: Change (add logic), per NCCN VTE-B-1: [1]

- BMI ≥40: enoxaparin 40 mg SC q12h or 0.5 mg/kg actual weight daily; dalteparin 7,500 units daily (or 5,000 q12h / 40–75 units/kg daily); fondaparinux 5 mg daily. (For ambulatory prophylaxis, the weight-based VTE-B-2 regimen self-adjusts.)
- Low weight: 25–40 kg → enoxaparin 20 mg daily; 41–50 kg → 30 mg daily; dalteparin 25–50 kg → 2,500 units daily or 100 units/kg; fondaparinux contraindicated <50 kg; avoid apixaban <40 kg. Source: NCCN VTE-B-1. Demo impact: Dorothy is 52 kg (just above the low-weight tier); no one is BMI ≥40. [1]

### Q16. Fondaparinux

Verdict: Correct for ambulatory scope, with a recommended addition. Fondaparinux is not on NCCN VTE-B-2 for ambulatory primary prophylaxis, so omitting it there is concordant; it is a category 1 inpatient option (VTE-B-1) and a myeloma option. [1] However, because it is the logical agent when LMWH is blocked specifically by HIT (no heparin cross-reactivity), consider adding fondaparinux 2.5 mg daily as the fallback in your HIT branch rather than landing on "no agent." Source: NCCN VTE-B-1 / VTE-D-5. [1] Demo impact: none of the five triggers HIT.

### Q17. Duration wording

Verdict: Correct. NCCN VTE-2 specifies prophylaxis for 6 months or longer if risk persists, and AVERT/CASSINI used a planned 180 days — your "up to 6 months, longer if VTE risk persists" is faithful. [1][48-49] Source: NCCN VTE-2; AVERT/CASSINI.

### Q18. GI/GU caution list

Verdict: Change (expand). NCCN VTE-D-5 warns that DOACs raise GI and genitourinary bleeding risk and should be used with caution in patients with GU or GI tract lesions, pathology, or instrumentation — broader than your current C15/C16/C67. [1] Extend the DOAC caution to include unresected/intact luminal colorectal tumors (C18–C20), gastroesophageal (already partly covered), and upper-tract urothelial/GU (C65–C66) in addition to bladder. [1] Source: NCCN VTE-D-5. Demo impact: Robert (colon C18.4, primary in place, on bevacizumab) would acquire a GI-bleeding caution — though his verdict stays "not indicated" (Khorana 0), so no conflict.

### Q19. The 50,000 platelet floor

Verdict: Correct for prophylaxis. NCCN VTE-A lists platelets <50,000/μL as a contraindication to prophylactic anticoagulation for all agents, so applying the floor equally to LMWH and DOACs is right within your prophylaxis scope. [1] Two nuances: NCCN footnote b permits prophylaxis down to 25,000/μL in high-risk patients (so your hard block at 50,000 is slightly more conservative than NCCN), and the LMWH-vs-DOAC divergence (half-dose LMWH at 25–50k; DOACs not recommended <50k) applies to treatment, which is out of your scope. [1] Source: NCCN VTE-A. Demo impact: Dorothy (42k) correctly lands "contraindicated."

## Section D — The demo patients

### Q20. Are the five verdicts guideline-concordant?

Four of five are clean; one has a defensible objection.

- Maria (pancreatic, Khorana 5) — Recommend DOAC: concordant, and pancreatic is the one site where LMWH has the strongest (ITAC 1A) evidence, so offering LMWH as a co-equal option is reasonable; CASSINI included pancreatic patients, so DOAC is fine. Fix the displayed CrCl (Q14). [49-50]
- James (MCL, Khorana 2, itraconazole) — Recommend LMWH: concordant. Itraconazole is a genuine combined P-gp/strong CYP3A4 inhibitor → both DOACs avoid → enoxaparin 40 mg daily is correct. Backstory caveat in Q21. [1-3]
- Dorothy (NSCLC, platelets 42k, CrCl 13) — Contraindicated: correct. But the live platelet-flip to 55k showing apixaban "caution" is the one objection a hematologist/pharmacist would raise: at CrCl 13, apixaban has no prophylaxis trial support (AVERT excluded CrCl <30) and NCCN VTE-D-5 lists apixaban CrCl <30 as a contraindication (with only an observational-data footnote for dialysis). For a prophylaxis engine, apixaban at CrCl 13 should read "avoid," not "caution." Recommend tightening apixaban to avoid at CrCl <15 (or <25) for prophylaxis while keeping your "caution 15–30" note. This is a verdict-level change to the Dorothy what-if. [1][48]
- Robert (colon, Khorana 0) — Not indicated: correct (below threshold); bevacizumab's PD bleeding and the GI caution (Q18) are moot here. [1]
- Priya (myeloma) — Excluded: correct. [1]

### Q21. Is James's backstory consistent, and should his labs show liver injury?

Verdict: Change (two fixes).

The antifungal choice draws a legitimate ID objection. Itraconazole is not a standard switch for active invasive pulmonary aspergillosis — first-line is voriconazole or isavuconazole, with liposomal amphotericin B, posaconazole, or an echinocandin as the usual salvage/intolerance options; itraconazole is reserved for step-down/less-severe disease. Two clean ways to make it bulletproof while preserving the "both DOACs blocked → LMWH" climax: (a) keep itraconazole but frame it as oral step-down/consolidation after stabilization on a more potent agent ("switched off voriconazole for hepatotoxicity, continued on oral itraconazole consolidation"), which keeps itraconazole's advantage of being named in the apixaban label; or (b) switch to posaconazole as authentic salvage therapy — it is a bona fide combined P-gp/strong CYP3A4 inhibitor that blocks both DOACs and is clinically routine in hematology, at the cost of a slightly weaker on-screen label quote (posaconazole isn't in the label example list). Do not switch to voriconazole or isavuconazole — neither reliably blocks rivaroxaban, so the verdict would break (Q2, Q4). [4-5][18][51-52]

His labs should show the liver injury — but keep it sub-threshold. Voriconazole causes transaminase elevations >3× ULN in ~18% of patients, so a hepatotoxicity-driven switch implies documented ALT/AST rises. Add LFTs to his bundle, but set them normal or mildly elevated (<3× ULN, i.e., resolving after voriconazole discontinuation) — if you enter ALT/AST >3× ULN, your own (correct) NCCN hepatic rule would block apixaban/rivaroxaban for a second reason, muddying the clean "itraconazole is why" teaching point. Also realistic-detail note: relapsed MCL in a 72-year-old is more commonly on a BTK-inhibitor-based regimen than rituximab alone; if you add a BTKi, remember it now carries its own PD bleeding flag (Q8). Demo impact: both fixes strengthen James without changing his LMWH verdict. [1][12]

## Section E — Citations

### Q22. Reference list

The complete numbered reference list is appended automatically below this answer and covers every source cited above. Per your "retrieved DOIs only" rule: DOIs were actually retrieved for the KDIGO 2024 CKD guideline (10.1016/j.kint.2023.10.018) [47] and the THSNA 2024 abstract proceedings (10.1002/ajh.27535). [53] For the 2025 ACC Concise Clinical Guidance (Ganatra et al., JACC) carried from the prior round, the title, journal, and year are confirmed but the volume, page range, and DOI remain unconfirmed (indexed as online-ahead-of-print) — do not transcribe a fabricated identifier; verify against JACC before printing it on a slide. [36]

The net of this audit: your hepatic rules, Khorana sites, duration text, platelet floor, aspirin restriction, and ambulatory renal/LMWH logic are confirmed; the actionable changes are adding rifampin/carbamazepine/phenytoin as avoid (and clarithromycin as an explicit non-block), upgrading tucatinib (and CrCl-conditional cyclosporine) and itraconazole×dabigatran, downgrading doxorubicin/vinblastine/short-course dexamethasone, adding BTKi pharmacodynamic flags, fixing the Cockcroft-Gault weight, tightening apixaban at CrCl <15 for Dorothy, expanding the GI/GU caution, routing CML, and shoring up James's antifungal story and LFTs.

---

## What was applied (2026-10-09)

| Q | Change | Where |
|---|---|---|
| 1 | Majors kept; idelalisib, enzalutamide and mitotane now state they rest on expert guidance (AHA 2022), not FDA label text. Enzalutamide P-gp effect corrected to inhibitor. Every major cell records `exposure` (increased/decreased) and inducer alerts say "lowers DOAC levels … (clots), not bleeding" | KB v1.2.0; `recommendation.ts: majorDetail` |
| 2 | Voriconazole × apixaban kept moderate (confirmed) | — |
| 3 | Itraconazole × dabigatran → major (reference-only) | KB |
| 4 | Added rifampin, carbamazepine, phenytoin (major); clarithromycin (minor, deliberate non-block); fluconazole, isavuconazonium, lorlatinib, venetoclax, lapatinib, carfilzomib. Their dabigatran/edoxaban cells are "unknown" except rifampin (major, label-named) | KB |
| 5 | Doxorubicin, vinblastine → minor | KB |
| 6 | Dexamethasone → minor (antiemetic courses) | KB |
| 7 | Tucatinib → major (ACF 2026). Cyclosporine/isavuconazonium rivaroxaban CrCl 15–80 avoid stated in text only | KB |
| 8 | Added acalabrutinib, zanubrutinib, pirtobrutinib, sunitinib, sorafenib, pazopanib, axitinib, regorafenib as pharmacodynamic | KB |
| 11 | CML (C92.1) → MPN exclusion | `icd10-cancer-map.ts` |
| 14 | Cockcroft-Gault uses adjusted body weight at BMI ≥30 (Maria 115 → 85 mL/min) | `renal-dosing.ts` |
| 15 | LMWH weight-extreme doses (BMI ≥40; ≤50 kg) | `recommendation.ts: lmwhPresentation` |
| 18 | GI/GU caution adds C18–C20, C65–C66 | `contraindications.ts` |
| 20 | Apixaban avoid at CrCl <15, caution 15–29; Dorothy creatinine 2.8 → 2.0 (CrCl ~18) so the live what-if still lands on apixaban-with-caution | `doac-renal-thresholds.ts`; bundle |
| 21 | James: ALT 68, AST 54, bilirubin 0.9 (sub-threshold); itraconazole framed as oral step-down after voriconazole hepatotoxicity | bundle; `submission/DEMO-SCRIPT.md` |

**Found while applying (F17):** checking every code against RxNav showed 22 wrong or retired RxNorm codes, several pointing at other drugs (nab-paclitaxel → carvedilol, ramucirumab → dabrafenib, dalteparin → desflurane, epoetin → dipyridamole). All fixed and locked by a test.

**Not applied:**
- Q11 CLL: already scores 0 (C91.1 is not in the lymphoma list); SLL coded C83.0 still scores 1.
- Q16 fondaparinux as the HIT fallback: needs a new agent in the engine.
- Renal-conditional DDI rules (cyclosporine and isavuconazonium with rivaroxaban at CrCl 15–80): need a CrCl-aware severity.
- Q12 Child-Pugh: still a caveat only.
- James on a BTK inhibitor instead of rituximab: not done, as it would add a pharmacodynamic warning to the climax screen.
- Reference list [1]–[53]: the per-number list was never captured, because it is a separate block shown under the answer in OpenEvidence. A consolidated, de-duplicated bibliography for all rounds is now in `docs/REFERENCES.md`.

Tests: 189 → 207 (`tests/core/openevidence-review-4.test.ts` plus the RxNorm code-lock test).
