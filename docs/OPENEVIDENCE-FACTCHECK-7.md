# OpenEvidence fact-check, round 7 (2026-10-31)

Copy everything between the two lines into OpenEvidence. Paste back the whole answer **and**
the numbered reference block under it.

---

I'm giving an 8-minute talk on a clinical decision support app for primary VTE prophylaxis in ambulatory adults with cancer. You've already checked the rest of the script in earlier rounds. Please check only the five items below against primary sources. For each one, give a verdict (accurate as written / needs a wording change / wrong), the exact replacement wording if it needs one, and the citation.

**1. Mortality claim (spoken, not on a slide):** "Clots are a leading cause of death in cancer — second only to the cancer itself."
- Is VTE (or thromboembolism) the second leading cause of death in patients with cancer, after cancer progression?
- Which primary source supports it (I believe Khorana et al., *J Thromb Haemost* 2007, in ambulatory patients on chemotherapy), and does that source count venous and arterial events together?
- If the claim only holds for a narrower group, or only for arterial and venous events combined, give me the most accurate sentence of about the same length that I can say out loud.

**2. New slide tile:** "~½ fewer clots with prophylaxis in higher-risk patients" (source line: "Pooled AVERT + CASSINI · ITAC 2022"). You approved the spoken version, "pooled AVERT and CASSINI data roughly halved VTE in higher-risk patients" (overall VTE RR 0.56, 95% CI 0.35–0.89). Is the shorthand "~½ fewer clots" an acceptable on-slide rendering of RR 0.56, or should it say something like "~44% fewer"?

**3. New slide tile:** "~6 in 10 high-risk patients got it, even in a dedicated prevention program" (Holmes et al., *JCO Oncol Pract* 2026; 340 of 573, 59%; high-risk = Khorana or PROTECHT ≥3). Is that wording accurate?

**4. New slide tile:** "Bleeding is the risk on the other side: a blood thinner in the wrong patient causes harm." Is it fair to present major bleeding as the main harm of primary prophylaxis in this population? In AVERT and CASSINI, was major bleeding higher with the DOAC than with placebo?

**5. Synthetic patient realism:** my synthetic patient James (72, non-Hodgkin lymphoma on rituximab, on itraconazole for a fungal infection) now also lists **acyclovir, allopurinol, ondansetron and pantoprazole** as supportive care. Do any of these four have a clinically relevant interaction with **apixaban or rivaroxaban** at prophylactic doses (CYP3A4 / P-gp or otherwise)? The app treats all four as non-interacting.

---

## Outcome (2026-10-31)

| # | Item | Verdict | Applied |
|---|---|---|---|
| 1 | "second only to the cancer itself" | **Needs change.** Khorana 2007 (4,466 chemo outpatients, 141 deaths): progression 71%, infection 9%, arterial TE 5.6%, VTE 3.5%. "Second" holds only for venous + arterial combined, tied with infection | Spoken line now: "In patients on chemotherapy, blood clots are one of the leading causes of death after the cancer itself." Still spoken only, not on a slide |
| 2 | "~½ fewer clots" tile | Accurate, but a number on a slide reads as precise | Tile: **~44%** "fewer VTE with prophylaxis in higher-risk patients", source "Pooled AVERT + CASSINI (overall VTE, RR 0.56) · ITAC 2022". Spoken: "cut clots by about 44 percent" |
| 3 | "~6 in 10" tile | Accurate | "got it" → "received prophylaxis" (tile and notes) |
| 4 | Bleeding tile | Fair, soften "causes". AVERT major bleeding 3.5% vs 1.8% (HR 2.00); CASSINI 2.0% vs 1.0% (HR 1.96, NS); small absolute increase, no mortality difference | Tile and notes: "in the wrong patient, a blood thinner can cause serious bleeding" |
| 5 | James's supportive drugs | No DOAC interaction for ondansetron, allopurinol, pantoprazole; acyclovir not anchored. **Pantoprazole reduces itraconazole capsule absorption** (itraconazole label: use with caution) | Pantoprazole removed from James. The other three are not in the DDI KB, so the app shows them as "Unknown — verify manually" (DDI card: 1 Major · 1 No interaction · 3 Unknown). Kept that way on purpose: rating them "none" for all four DOACs would be unverified clinical content. Not visible on any slide or in the clip |

## Answer (summary of the verbatim body)

Two of the five need a wording change (the mortality line and the bleeding tile); the efficacy tile is accurate but better as "~44% fewer"; the Holmes tile is accurate. James's four supportive drugs don't interact with either DOAC, but pantoprazole lowers itraconazole absorption, which an ID physician or pharmacist would notice. Drop it; allopurinol is optional. The submitted abstract's "second leading cause" can't be changed, but don't repeat it on stage.

## References (as given)
1. Khorana AA, Mackman N, Falanga A, et al. Cancer-associated venous thromboembolism. Nat Rev Dis Primers. 2022;8(1):11. doi:10.1038/s41572-022-00336-y.
2. Lyon AR, López-Fernández T, Couch LS, et al. 2022 ESC Guidelines on cardio-oncology. Eur Heart J. 2022;43(41):4229-4361. doi:10.1093/eurheartj/ehac244.
3. Di Leo G, Bordonaro CA, Capodanno D. Antithrombotic therapy for cancer-associated venous thromboembolism. Clin Res Cardiol. 2026. doi:10.1007/s00392-026-02872-z.
4. Kahale LA, Matar CF, Hakoum MB, et al. Anticoagulation for the initial treatment of VTE in people with cancer. Cochrane Database Syst Rev. 2021. doi:10.1002/14651858.cd006649.pub8.
5. Alikhan R, Gomez K, Maraveyas A, et al. Cancer-associated venous thrombosis in adults (second edition): a BSH guideline. Br J Haematol. 2024;205(1):71-87. doi:10.1111/bjh.19414.
6. VTE Prevention in Ambulatory Cancer Patients. Anticoagulation Forum. 2026.
7. Holmes CE, Martin KA, Devine D, et al. JCO Oncol Pract. 2026:OP2501211. doi:10.1200/OP-25-01211.
8. Carrier M, Abou-Nassar K, Mallick R, et al. Apixaban to prevent VTE in patients with cancer (AVERT). N Engl J Med. 2019;380(8):711-719. doi:10.1056/NEJMoa1814468.
9. Khorana AA, Soff GA, Kakkar AK, et al. Rivaroxaban for thromboprophylaxis in high-risk ambulatory patients with cancer (CASSINI). N Engl J Med. 2019;380(8):720-728. doi:10.1056/NEJMoa1814630.
10. Key NS, Khorana AA, Kuderer NM, et al. ASCO guideline update. J Clin Oncol. 2023;41(16):3063-3071. doi:10.1200/JCO.23.00294.
11. Agnelli G. DOACs for thromboprophylaxis in ambulatory patients with cancer. N Engl J Med. 2019;380(8):781-783. doi:10.1056/NEJMe1816060.
12. Ondansetron. FDA label, updated 2025-09-03.
13. Aloprim. FDA label, updated 2022-02-18.
14. Allopurinol. FDA label, updated 2026-05-21.
15. Kurlander JE, Barnes GD, Fisher A, et al. Antisecretory drugs and upper GI bleeding on oral anticoagulants. Am J Med. 2022;135(10):1231-1243.e8. doi:10.1016/j.amjmed.2022.05.031.
16. Apixaban. FDA label, updated 2024-05-23.
17. Itraconazole. FDA label, updated 2025-01-28.
18–20. Dong 2019 (J Thromb Thrombolysis); Michalopoulou 2023 (J Thromb Thrombolysis); Tao 2020 (Eur J Haematol).
