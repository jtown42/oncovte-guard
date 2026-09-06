# OncoVTE Guard — OpenEvidence Review (verbatim) + our response index

> Source: OpenEvidence review of `NARRATIVE-BRIEF-FOR-OPENEVIDENCE.md`, returned 2026-09-06.
> Saved verbatim below. Citation markers `[n]` are OpenEvidence's; the numbered
> reference list was not returned inline. NCCN is cited by name only (no tables
> reproduced), consistent with our licensing constraint. Action plan lives in
> `docs/POST-OE-ACTION-PLAN.md`.

---

## Verbatim review

Everything in the brief checks out against current evidence with only a handful of substantive refinements needed — and the good news is that several of your "deliberate divergences" are actually defensible sophistication you should foreground, not hide. Below is the narrative recommendation first, then a claim-by-claim stress-test answering §10, each flagged polish or substantive, and a consolidated action table.

### Narrative: endorse A+C as the spine, with a sharpened hook

Your working instinct is right, and I would commit to it harder. For a live, in-person, informatics audience judged on the §2 rubric, the winning move is the fusion of A ("verifiable CDS / anti-black-box") as the intellectual spine and C (the appliesTo safety reasoning) as the demo that makes it visceral. Here is the strategic logic:

A maps directly onto three of the five judged dimensions — Data Validation, Evaluation & sustainability, and (partly) Innovation. Critically, "verifiable" is the only claim in your whole submission the judges can confirm in the room during a 10-minute live demo. That is an enormous, underused advantage: most competitors ask judges to believe their app works; you can ask them to watch it prove itself.

The genuinely novel artifact is not "185 tests" — every competent engineer writes tests, and informaticians know tests only prove the code does what the author intended, not that the intent is clinically correct. Your novel move is elevating guideline fidelity itself into an externally auditable object: the rule→source→code→test traceability matrix. That is a provenance/reproducibility story, and provenance is exactly what an informatics audience prizes. Lead with the matrix, treat the test count as supporting evidence.

C is your demo climax because it is clinically legible in five seconds. The James Chen → LMWH-fallback moment (HIT removes only LMWH; APS/pregnancy remove only the DOAC class; ibrutinib blocks both DOACs → the engine narrows to the safe drug instead of firing a red alert and quitting) is the one thing that makes a non-programmer judge lean forward. It shows the engine "reasons like a pharmacist," which is a far stronger differentiator than a Khorana calculator (which exists in a dozen apps).

B is the interoperability payoff, not the headline. "One tested engine, two surfaces, identical by construction" is a clean sentence for the FHIR-usage dimension — say it once, prove it with the CapabilityStatement + CDS Hooks demo, move on.

D (honesty) is an asset with this audience — but as texture, never as headline. In front of informaticians who know there is no validation study, claiming "clinically validated" is a fatal credibility hit; your three-tier claim standard signals maturity and disarms the obvious skeptical question ("what's your evidence it helps patients?") before it's asked. But you don't win by advertising limitations — you win by being impressive and credible. Deploy D in one confident sentence ("We hold ourselves to a three-tier claim standard; today's honest headline is provably consistent, not clinically validated — and here's exactly what would move it to the next tier") and let it do its work.

One risk to manage: do not let "provably consistent / 185 tests" dominate to the point that judges hear software correctness rather than clinical value. Tests prove faithfulness to your rules; the traceability matrix proves those rules trace to the literature; the LMWH-fallback demo proves the rules produce clinically intelligent behavior. Tell all three links of that chain or the story collapses into "nicely engineered."

**The one sentence the judges should remember:**

"Every recommendation OncoVTE Guard makes can be traced — live, in this room — from a guideline, to a line of code, to a test that proves it, and when a drug is unsafe the engine narrows to the safe option instead of just firing an alert."

Your current hook is good but long and front-loads "audit"; the tightened version leads with the verifiable-provenance idea and lands on the safety-reasoning payoff. Substantive-lite: I'd swap the current promotional title's "so clinicians don't have to wing it" (slightly flip for this audience) for something that signals auditability, e.g. "When Chemo Meets Anticoagulation: A FHIR Engine Whose Every Recommendation You Can Audit."

### Evidence stress-test (answering §10)

**Q1 — Mortality framing: you are under-claiming, and can safely upgrade**
"Second leading cause of death in patients with cancer (after cancer progression)" is the standard, guideline-endorsed phrasing, used verbatim by ITAC 2019 and 2022, the 2022 ESC Cardio-Oncology guideline, and multiple contemporary reviews. [1-4] Your corrected copy retreated to "a leading cause," which is safe but leaves impact on the table. You can restore "the second leading cause of death in patients with cancer, after cancer progression itself" and cite ITAC/ESC directly. Even stronger for your specific population: Brito-Dellan et al. note VTE is the leading cause of death in ambulatory patients undergoing chemotherapy specifically (second in hospitalized patients) — that is precisely your target population, so a defensible, population-tuned line is available. [5] The "4–7-fold" risk figure is also conservative: it comes from ITAC, but contemporary population data put it higher (Danish cohort HR 8.5, 95% CI 8.2–8.8; up to 15× in the first year). [2][6] Contemporary US incidence to anchor scale: 12-month VTE incidence 3.7% overall and 5.7% in patients on systemic therapy (Lam et al. 2026, Epic Cosmos, n=1.6M). [7] Verdict: **polish — but a high-value one; the correction over-corrected. Keep "second leading cause" and add the Lam 2026 scale figure.**

**Q2 — Khorana ≥2 vs ≥3: defensible, but "the prophylaxis threshold" slightly overstates consensus**
Both pivotal trials enrolled at Khorana ≥2 — AVERT (apixaban 2.5 mg BID) and CASSINI (rivaroxaban 10 mg) — and ITAC (grade 1B), NCCN v1.2026, and ESC 2022 all use ≥2. [1][3][8-10] So ≥2 is well-grounded. The nuance a thrombosis expert will raise: ASH 2021 preserves the original 3-tier Khorana classification and treats a score of 2 as intermediate — for which it suggests either DOAC or no prophylaxis (conditional recommendation, a zone of equipoise), reserving a clearer prophylaxis recommendation for ≥3. [11] The effect size supports this caution: pooled NNT roughly doubles from ~17 at KS ≥3 to ~34 at KS = 2 (Bosch et al.), and the Agnelli NEJM editorial pegged the combined symptomatic-VTE NNT at ~40 — "only marginally more favorable" than trials using no risk score at all. [12-13] Real-world Danish validation found only ~3.6% 6-month VTE at KS ≥2 after accounting for competing death risk. [14] Verdict: **substantive (framing). Your rule (offer at ≥2) is correct and trial-aligned — don't change it. But change how you describe it: not "the prophylaxis threshold" (implies universal consensus) but "the trial-validated threshold used by ITAC and NCCN, distinct from the original ≥3 high-risk label, with the strongest net benefit at ≥3."** Bonus: this nuance is a gift for the live Q&A — being able to explain why ≥2 is defensible and where ASH dissents demonstrates exactly the rigor the Student category rewards.

**Q3 — Efficacy framing: your instinct is exactly right**
Crediting the pooled AVERT+CASSINI analysis rather than either trial's primary result is the honest and correct move. The pooled estimate is RR 0.56 (95% CI 0.35–0.89) for overall VTE, but not significant for symptomatic VTE (RR 0.58, 95% CI 0.29–1.13), with no significant excess of major bleeding (RR 1.96, 95% CI 0.80–4.82). [1] Your recollection that CASSINI's primary endpoint over the full period was non-significant (HR 0.66, 95% CI 0.40–1.09) and significant only on-treatment (HR 0.40, 95% CI 0.20–0.80) is accurate. [9][15] For a stronger, Khorana-stratified citation, add Bosch et al. (Blood Advances 2020): 6 RCTs, RR 0.51 (KS ≥2), with explicit NNT by tier. [12] Verdict: **polish. Keep the pooled framing; consider citing both the ITAC-reported pooled RR and Bosch for the stratified numbers. One honesty note: the pooled symptomatic VTE result is not significant, so if you cite RR 0.56 make clear it is for overall (including screen-detected) VTE.**

**Q4 — DDI evidence base: your sourcing is defensible and roughly state-of-the-art**
The candid framing in §4.3 is correct and, frankly, more honest than most published tools. The evidence base for DOAC–antineoplastic interactions is thin and largely extrapolated from in-vitro CYP3A4/P-gp data, with no outcome RCTs; pharmacovigilance (FAERS) and real-world cohorts show no class-level bleeding signal, flagging only isolated agents. [16-17] Hellfritzsch et al. 2024 is, as far as the literature shows, the most granular per-agent/per-DOAC reference available (400 pairs) and has not been superseded — so anchoring on it plus the AHA 2022 statement and FDA labeling is defensible. [18-19] Nowinski & Chaireti 2025 is best used exactly as you use it — to document inter-source disagreement (35% of pairs flagged by ≥1 source), not as a competing table. [16] Additions worth making: the EHRA Practical Guide DOAC interaction table is the most widely cited clinical reference and would strengthen your provenance array; and cite [20] ITAC 2022 ("DOACs recommended… in the absence of strong drug–drug interactions," grade 1A) and [1] ACC 2026 (switch to LMWH when DDIs exist) as the [21] decision-framework authorities that justify your LMWH-fallback logic. Verdict: **polish (add EHRA + ITAC/ACC framing). Strategically: because this is your weakest-evidence module, keep it out of the headline narrative and let the transparency framing (single named source set, 16 major cells individually anchored) be its defense — which is exactly your plan.**

**Q5 — APS + DOACs: correct direction, but reflect the positivity nuance**
Contraindicating the DOAC class in APS is well-supported and near-universal in guidelines: TRAPS (rivaroxaban stopped early, 12% vs 0% thromboembolic events in triple-positive APS), Ordi-Ros (excess stroke), ASTRO-APS (apixaban stopped early for stroke), and meta-analyses showing [22-24] OR 5.43 (95% CI 1.87–15.75) for arterial thrombosis with DOACs vs VKA, confirmed in the 2025 Celia et al. analysis. [25-26] EULAR, ISTH SSC, and ACC 2026 all prefer VKA. [21][27-28] The nuance: the evidence is strongest for triple-positive / high-risk APS (prior arterial thrombosis, valve disease); for single/double-positive, VTE-only disease the data are weaker — subgroup analyses are underpowered, observational data suggest comparable outcomes, and ISTH 2020 permits continuing a DOAC in an adherent low-risk patient already on one. [28-30] NCCN itself footnotes that the concern is "particularly true in triple-positive… but has also been seen in single- and double-positive disease". [10] Verdict: **substantive-lite. A blanket class contraindication is conservative but defensible — keep it as the safe default, but consider surfacing an advisory noting the evidence is strongest in triple-positive/high-risk APS.** That refinement actually showcases your appliesTo sophistication and pre-empts the exact objection an APS-savvy judge would raise.

**Q6 — RCC non-scoring: confirmed, and it's a strength, not a liability**
The Khorana model scores only bladder and testicular among GU cancers (both +1); RCC falls into the "all other → 0" bucket — your implementation matches NCCN VTE-C exactly. [10] But RCC risk is genuinely elevated: in the treated cohort, 12-month VTE incidence reaches ~7.6% (Lam 2026), higher than bladder (~4.8%) and testicular (~3.8%) — cancers that do score. [7] Older data concur (kidney cancer 5.6%/hospitalization in Khorana 2007; elevated SEER-Medicare rates), and the [31-32] 2026 ACC statement specifically lists metastatic RCC among high-bleeding-risk tumors where LMWH may be preferred. [21] Notably, one metastatic-RCC cohort found the Khorana score itself did not predict thromboembolism. [33] Verdict: **polish / validated. Your choice to not let RCC cross the ≥2 threshold by fiat (avoiding an off-guideline score inflation) while surfacing it as an advisory + bleeding-risk factor is exactly the defensible, guideline-faithful call — and it doubles as a concrete example of your engine's disciplined "score the guideline, flag the gap" philosophy.** The Lam 2026 figure directly supports this decision, showing kidney cancer's incidence relative to the cancers that do score (Figure 4, Cumulative incidence at 12 months, stratified by cancer type; Lam et al., Am J Hematol., May 1, 2026; used under license from Wiley).

**Q7 — Lung discrimination: your advisory is accurate**
The van Es individual-patient-data meta-analysis is correctly characterized: the dichotomized Khorana score gave OR ~1.1 (95% CI 0.72–1.7) in lung cancer vs ~3.2 (95% CI 1.8–5.6) in other cancers, P-interaction = 0.002. [34] This is corroborated by a 24-study lung-specific meta-analysis (poor sensitivity/specificity at any cutoff), Mansfield, and Danish validation showing no stratification at ≥2 in lung. [14][35-36] Verdict: **polish (confirmed accurate). Keep the caveat verbatim; it's one of the most defensible statements in the brief. You could add that biomarker-driven approaches (D-dimer/fibrinogen, as in TARGET-TP) outperform Khorana in lung/GI — useful "we know the frontier" texture.** [37]

**Q8 — Currency: cite the 2025–2026 updates, but none forces a rule change**
Nothing published in 2024–2026 changes your primary ambulatory prophylaxis rules (threshold ≥2, apixaban/rivaroxaban preferred, LMWH fallback all stand). But three items let you demonstrate currency:

- API-CAT (NEJM 2025): reduced-dose apixaban 2.5 mg BID was noninferior to 5 mg BID for extended secondary prevention with less bleeding; NCCN v1.2026 incorporated this (consider dose reduction after 6 months), and ACC 2026 endorses it. This is treatment/secondary prophylaxis, outside your app's primary-prophylaxis scope — cite it to show you know the boundary, not as a rule change. [10][21][38]
- TARGET-TP (JAMA Oncol 2023; JNCI 2026 extended follow-up): biomarker-guided prophylaxis in lung/GI, first trial to show a survival signal — reinforces your lung caveat and the "Khorana is imperfect" framing. [37][39]
- Emerging factor XI inhibitors (abelacimab: ASTER, MAGNOLIA trials) as the future of CAT anticoagulation. [4][40]

ASCO 2023 was a focused update that left ambulatory prophylaxis recommendations unchanged (added apixaban for treatment and postoperative extended prophylaxis). Verdict: **substantive-lite — add a one-line "current as of NCCN v1.2026, ITAC 2022, ASCO 2023, ACC 2026" currency statement and a sentence acknowledging API-CAT/factor XI as out-of-scope-but-tracked. This is cheap credibility.** [41]

**Q9 — What a thrombosis/oncology expert would flag, ranked by clinical severity**
1. "Second leading cause" retreat (Q1) — you weakened a correct, better-supported claim; restore it. Polish, high value.
2. Calling ≥2 "the" prophylaxis threshold (Q2) — reframe to acknowledge ASH's equipoise at KS=2 and the NNT gradient; the rule stays. Substantive framing.
3. APS blanket class contraindication (Q5) — defensible default, but add the triple-positive-strongest nuance. Substantive-lite.
4. Pooled symptomatic-VTE result is non-significant (Q3) — if citing RR 0.56, label it overall VTE, not symptomatic. Polish.

No clinically-validated point I found is outright wrong. Your Khorana components/boundaries, the exclusions (MM, acute leukemia, MPN, brain), platelets <50k universal contraindication, weight <40 kg targeted to apixaban, and CrCl <30 handling all match NCCN v1.2026. That is a strong result to be able to state. [10]

### Language / overclaiming watch (per §9)
Your three-tier standard holds up, and I found no drift toward "validated" in the brief itself. Two guardrails for the presentation: (1) when you say "provably consistent," pair it immediately with "not clinically validated — no patients, no clinician evaluation, synthetic data only," so the distinction is unmissable to the audience; (2) avoid the word "accurate" unqualified for the DDI module — say "faithful to a single named source set," since the underlying evidence is inconsistent across sources. [16] The phrase "thinks through… so clinicians don't have to wing it" in the live title flirts with implying the app replaces clinical judgment — soften to "supports" for this audience.

### Consolidated: polish vs. substantive

| Item (§) | Finding | Action | Type |
|---|---|---|---|
| Mortality framing (Q1) | "Second leading cause" is guideline-standard; you over-corrected to "a leading cause" | Restore "second leading cause… after progression"; add Lam 2026 scale (5.7% on therapy) | Polish (high value) |
| Risk magnitude (Q1) | 4–7× is conservative; contemporary ~8–9× | Keep 4–7× (guideline-safe) or note "and higher in recent cohorts" | Polish |
| Khorana ≥2 label (Q2) | Rule correct; "the threshold" overstates consensus (ASH equipoise, NNT 34 vs 17) | Reframe wording, not the rule; prep Q&A answer | Substantive (framing) |
| Pooled efficacy (Q3) | Framing correct; symptomatic VTE pooled result NS | Keep pooled RR 0.56 but label "overall VTE"; add Bosch NNT | Polish |
| DDI sources (Q4) | AHA 2022 + Hellfritzsch + FDA defensible; Hellfritzsch is best available | Add EHRA guide + ITAC/ACC framework citations; keep out of headline | Polish |
| APS class contraindication (Q5) | Correct default; evidence strongest in triple-positive | Add advisory noting positivity nuance | Substantive-lite |
| RCC non-scoring (Q6) | Confirmed; RCC risk exceeds some scored GU cancers | Keep advisory-only + bleeding factor; showcase as design discipline | Polish / validated |
| Lung caveat (Q7) | van Es numbers accurate | Keep verbatim; optionally add biomarker-model note | Polish |
| Currency (Q8) | No primary-prophylaxis rule changes; API-CAT/TARGET-TP/factor XI are current context | Add currency statement + out-of-scope acknowledgment | Substantive-lite |
| Core rules audit (Q9) | Khorana, exclusions, platelets, weight, renal all match NCCN v1.2026 | No change; state the match as a strength | — |

Net: your engineering and clinical logic are sound; the fixes are mostly wording, plus two framing refinements (≥2 threshold, APS positivity) that will actually strengthen you in live Q&A. Lead with verifiable provenance, prove it with the LMWH-fallback demo, and let honesty be the credibility texture.
