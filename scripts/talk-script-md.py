"""submission/FINAL-TALK-SCRIPT.md from scripts/deck-notes.py (the deck's speaker notes).

  python scripts/talk-script-md.py
"""
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("deck_notes", ROOT / "scripts" / "deck-notes.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

TITLES = {2: "Title", 3: "Disclosures", 4: "Why it matters", 5: "The problem", 6: "Two doors, one engine",
          7: "Maria — clear risk, clear recommendation", 8: "James — one medication changes the decision (VIDEO)",
          9: "James's decision, written back as standard FHIR", 10: "Same engine, whole panel (first to cut)",
          11: "Proof and limits", 12: "The close (QR code)", 13: "Dorothy (HIDDEN backup)"}

out = [
    "# OncoVTE Guard — Talk script v3 (reading copy)", "",
    "> These are word for word the speaker notes in `OncoVTE-final.pptx`, generated from "
    "`scripts/deck-notes.py` by `scripts/talk-script-md.py`. Earlier versions are in git history.", "",
    "**How to use it:** read one line at a time. Each line is one breath. **[PAUSE]** = stop for one full "
    "second. **[CLICK]** = advance. The time at the top of each slide is where you should be when the slide comes up.", "",
    "**Length:** about 950 spoken words, about 7:00 at a calm pace with the 14-second video. "
    "Over 7:15 in rehearsal → hide slide 10 (panel), which saves about 25 s.", "",
    "**Lines to know cold:** the first two sentences, \"Structured FHIR in. Structured FHIR out.\", the James clip lines, and the whole close.",
    "", "---", "",
]
for k, v in m.NOTES.items():
    lines = v.strip().split("\n")
    out += [f"## Slide {k} — {TITLES[k]}", "", f"**{lines[0].strip()}**", ""]
    quoted = []
    for line in lines[1:]:
        line = line.strip()
        if not line:
            continue
        for cue in ("[PAUSE]", "[CLICK — PLAY THE VIDEO]", "[CLICK]"):
            line = line.replace(cue, f"**{cue}**")
        quoted += ["> " + line, ">"]
    out += quoted[:-1] + ["", "---", ""]

out += [
    "## Claims in this script and where they come from",
    "- Prophylaxis roughly halved clots in higher-risk patients: pooled AVERT + CASSINI, overall VTE RR 0.56 (95% CI 0.35–0.89), ITAC 2022 (OpenEvidence round 5). Say \"pooled\", never \"each trial showed\".",
    "- Only about six in ten high-risk patients got prophylaxis, even in a dedicated program: Holmes et al., JCO Oncol Pract 2026 (round 5). \"High-risk\" there means Khorana or PROTECHT ≥3, so never tie it to the app's ≥2 threshold.",
    "- Clots are a leading cause of death in cancer, second only to the cancer itself: Khorana et al., J Thromb Haemost 2007. **Pending OpenEvidence check (docs/OPENEVIDENCE-FACTCHECK-7.md); spoken only, not on a slide.**",
    "- Itraconazole: FDA labels say avoid with apixaban 2.5 mg BID and with rivaroxaban (round 5). The itraconazole label also says avoid for 2 weeks after stopping (round 6), so the script never says a stopped drug can't change the advice.",
    "- 350 vs 349 platelets: Khorana ≥350 ×10⁹/L (round 5). Maria: Khorana 5, high risk (round 5). Dorothy: platelets <50k contraindicated; CrCl ~18 → apixaban with caution (round 5).",
    "- FHIR claims: 7/7 demo bundles 0 validator errors; sandbox round trip; 229 tests. All verified in the repo.",
    "", "## If something goes wrong",
    "- **The video won't play:** the still is already up. Read the [IF THE VIDEO WON'T PLAY] line and move on.",
    "- **You lose your place:** look at the slide title, find that slide here, and start at its first line. Every slide stands alone.",
    "- **Running long:** skip slide 10 (one click past it), then cut Maria to her first and last lines.",
    "- **Running short:** add the optional 22-codes line on slide 11.", "",
]
(ROOT / "submission" / "FINAL-TALK-SCRIPT.md").write_text("\n".join(out), encoding="utf-8")
print("wrote submission/FINAL-TALK-SCRIPT.md")
