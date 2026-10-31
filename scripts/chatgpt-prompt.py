import importlib.util
import os

os.chdir(r"C:\Users\jtown\Documents\amia-app-competition")
spec = importlib.util.spec_from_file_location("n", "scripts/deck-notes.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

slides = {
    2: 'Title. On screen: OncoVTE Guard · FHIR-native decision support for cancer-associated VTE prophylaxis · Justin Chestang · NYU Langone Health · 2026 AMIA / HL7 FHIR App Competition · small corner stat: "Even in a dedicated prevention program, only ~6 in 10 high-risk patients received prophylaxis" (Holmes et al., JCO Oncol Pract 2026).',
    3: "Disclosures. On screen: No financial relationships to disclose · Student project · synthetic data only · not used on real patients.",
    4: "Why it matters. On screen: three tiles. ~½ fewer clots with prophylaxis in higher-risk patients (Pooled AVERT + CASSINI · ITAC 2022) · ~6 in 10 high-risk patients got it, even in a dedicated prevention program (Holmes et al., JCO Oncol Pract 2026) · Bleeding is the risk on the other side: a blood thinner in the wrong patient causes harm. Takeaway: The hard part isn't knowing prophylaxis works. It's picking the right patient — and the right drug.",
    5: "The problem. On screen (builds): Four checks, in a single visit: four tiles (Is the clot risk high enough? (Khorana score) · Is another drug in the way? (DOAC–drug interaction) · Do the kidneys allow it? (CrCl) · Can the patient be anticoagulated at all? (bleeding, platelets, contraindications)) / The answers interact — one drug can rule out both oral options. / Wrong one way → clot. Other way → bleed. / The challenge isn't making a recommendation. It's making the logic inspectable and testable. / GUIDELINE → RULE → CODE → TEST → DECISION. Footnote: ITAC 2022; pooled AVERT + CASSINI, overall VTE RR 0.56.",
    6: "Two doors, one engine. On screen: a diagram. IN · read-only: Patient, Condition, Observation, MedicationRequest → DOORS: SMART App Launch (clinician opens it), CDS Hooks (EHR invokes it) → ONE engine → OUT · returned, no chart writes: GuidanceResponse, RiskAssessment, DetectedIssue, MedicationRequest · draft, Provenance. Caption: Structured FHIR in, structured FHIR out.",
    7: "Maria — clear risk, clear recommendation. On screen: a screenshot of the app with three numbered callouts: Risk score 5 · Apixaban or rivaroxaban · Guideline source on every card.",
    8: 'James — one medication changes the decision. On screen: a screenshot (LMWH recommended; apixaban and rivaroxaban struck through, "Avoid — itraconazole interaction (FDA labeling)"). A 15-second silent video on top plays on click: itraconazole removed → apixaban or rivaroxaban; added back → LMWH.',
    9: 'Full-slide image: "James\'s decision, written back as standard FHIR." Top: the struck-through apixaban/rivaroxaban rows the clinician sees. Bottom: the FHIR R4 DetectedIssue JSON (status final, severity high, code DRG from v3-ActCode, implicated → MedicationRequest/medrx-itraconazole-2 highlighted, mitigation "Use Enoxaparin or Dalteparin").',
    10: 'Full-slide image: "Same engine, whole panel." FHIR Bulk Data $export → the same engine → a worklist. 40 synthetic patients screened · 19 flagged (meet the threshold, no anticoagulant on file). Labeled SYNTHETIC PANEL. Optional; the first slide to cut if long.',
    11: "Title: Clinical software only matters if you can trust how it reaches the answer. On screen: 349 ×10⁹/L → 0 points / 350 ×10⁹/L → +1 point (both sides tested) · SOURCE → RULE → CODE → TEST · FHIR output validated against R4 (HL7 validator: 0 errors) · limits strip: Prototype · synthetic data only · interaction table needs pharmacist review · diagnoses must be ICD-10-coded today · Next: silent-mode validation on real charts · SNOMED CT support · CDS Hooks order suggestions · badge: 229 automated tests.",
    12: "Close. On screen: PATIENT DATA (FHIR) ↓ GUIDELINE → RULE → CODE → TEST ↓ EXPLAINABLE DECISION (FHIR) · a large QR code · Try it live: oncovte-guard.pages.dev · Vote for us.",
    13: "HIDDEN backup. Dorothy: two screenshots, Platelets 42k → 55k: 42,000 → Contraindicated; 55,000 → Apixaban with caution; rivaroxaban and LMWH avoided. Lung cancer · severe kidney impairment (CrCl ≈ 18).",
}

PROMPT = """You're a speechwriter and presentation coach for a technical healthcare audience. Help me polish an 8-minute competition talk that I'll read almost word for word from my speaker notes. I'm a nervous presenter, so every line has to be easy to say out loud, sound spoken rather than written, and make me sound sharp and confident.

**The event:** AMIA 2026 Annual Symposium, FHIR App Competition finals (Nov 10, Dallas). About 9 finalists give 8-minute talks back to back with no Q&A, and the audience votes for the top 3 right after. I present first. The audience is clinical informaticians, HL7/FHIR standards people, developers and some clinicians. The other finalists are strong and technical. Reviewer feedback on my abstract: too much clinical background and not enough about the FHIR app; explain FHIR in plain language. Another reviewer called the demo outstanding.

**The app (describe it accurately):** OncoVTE Guard is a deterministic, rules-based clinical decision support app, **not AI or machine learning**, for primary VTE prophylaxis in ambulatory adults with cancer. It reads FHIR R4 Patient, Condition, Observation and MedicationRequest (read-only) through SMART App Launch or CDS Hooks (patient-view, order-select). Both paths go through the same normalizer and rule engine. The engine scores Khorana (threshold ≥2), checks bleeding risk, platelets, Cockcroft-Gault CrCl, contraindications and DOAC drug–drug interactions, then recommends apixaban or rivaroxaban, falls back to LMWH when both DOACs are blocked, or says prophylaxis is contraindicated or not indicated. The app returns its decision as FHIR (RiskAssessment, a DetectedIssue pointing at the interacting MedicationRequest, a draft/proposal MedicationRequest, GuidanceResponse, Provenance). CDS Hooks currently returns cards; order suggestions are future work. All 7 demo bundles pass the HL7 validator with 0 errors and round-trip through a public FHIR server. It can screen a synthetic panel through Bulk Data $export. 229 automated tests. Synthetic data only. The live demo (QR code) opens on James on a phone, with sliders and toggles that update the verdict live.

**Hard rules (do not break these):**
1. No new statistics, numbers or clinical claims, and don't strengthen the existing ones. If you think a claim is weak, say so in your notes instead of rewriting it into something new.
2. Keep "pooled data from the AVERT and CASSINI trials" (never "each trial showed").
3. Never call the engine "reasoning," "thinking," "intelligent" or "AI." Use verbs like checks, flags, scores, rules out, evaluates, re-runs.
4. The patients are synthetic; never say "real patient." Only slide 8 has video, so don't say "watch" on still slides.
5. Keep these lines (light edits are OK): "Structured FHIR in. Structured FHIR out." · "Both doors run through the same engine, so the dashboard and the EHR alert can't disagree." · guideline, to rule, to code, to test · "when one option is ruled out, the engine evaluates the ones that remain."
6. Don't say a stopped drug can't change the advice (itraconazole has a 2-week washout).
7. Total spoken length 900–960 words across the timed slots below. One sentence per line. Keep the [PAUSE] and [CLICK] cues where they make sense.
8. Keep my self-introduction and disclosure facts as they are (first-year medicine resident at NYU Langone; built as a project in my fourth year of medical school).
9. American English. No rhetorical-question gimmicks, no "imagine a world," no hype words ("revolutionary," "game-changing," "seamless").

**What I want from you:**
1. Read it as an audience member who has just heard eight other talks. Where does attention drop? Which lines sound written rather than spoken? Where would a FHIR expert roll their eyes? Where would a clinician?
2. A revised script in exactly the same format (slide by slide, the time at the top, one sentence per line, cues kept). Mark every line you changed with ✎.
3. A short table of your changes: old line → new line → why.
4. The 3 lines most likely to win votes, and the 3 most likely to lose them.
5. Any line that's hard to say out loud (tongue-twisters, too many stressed syllables, long noun stacks), with an easier version.

**Slides and current speaker notes:**
"""

out = ["# ChatGPT prompt — polish the talk script (2026-10-31)", "",
       "Copy everything between the two lines into ChatGPT. Bring the whole answer back to Claude: every change gets checked against the app and the verified evidence before it goes into the deck.",
       "", "---", "", PROMPT]
for k, v in m.NOTES.items():
    out.append(f"\nSLIDE {k} — {slides[k]}\nNOTES:\n{v.strip()}\n")
out += ["", "---", ""]
open("docs/CHATGPT-SCRIPT-REVIEW-PROMPT.md", "w", encoding="utf-8").write("\n".join(out))
print("ok")
