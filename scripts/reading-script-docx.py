"""Large-print Word reading copy of the talk, from scripts/deck-notes.py.

  python scripts/reading-script-docx.py   ->  submission/OncoVTE-Guard-Reading-Script.docx
"""
import importlib.util
import re
from pathlib import Path

from docx import Document
from docx.shared import Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("deck_notes", ROOT / "scripts" / "deck-notes.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

TITLES = {2: "Title", 3: "Disclosures", 4: "Why it matters", 5: "The problem", 6: "Two doors, one engine",
          7: "Maria", 8: "James (VIDEO)", 9: "James as FHIR", 10: "Whole panel (first to cut)",
          11: "Proof and limits", 12: "Close (QR)", 13: "Dorothy (HIDDEN backup)"}

d = Document()
d.styles["Normal"].font.name = "Calibri"
d.styles["Normal"].font.size = Pt(16)
d.add_heading("OncoVTE Guard — reading script", 0)
d.add_paragraph("One line = one breath. [PAUSE] = one full second. [CLICK] = advance. "
                "Time = where you should be when the slide comes up. About 950 words, about 7:00.").runs[0].font.size = Pt(12)
for k, v in m.NOTES.items():
    lines = [l.strip() for l in v.strip().split("\n")]
    if k > 2:
        d.add_page_break()
    d.add_heading(f"Slide {k} — {TITLES[k]}   ({lines[0]})", 1)
    for l in lines[1:]:
        if not l:
            continue
        p = d.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        for part in re.split(r"(\[[^\]]*\])", l):
            if not part:
                continue
            r = p.add_run(part)
            if part.startswith("["):
                r.bold = True
                r.font.color.rgb = RGBColor(0x8A, 0x2B, 0x00)
                if part.startswith(("[OPTIONAL", "[IF")):
                    r.font.size = Pt(13)
d.save(ROOT / "submission" / "OncoVTE-Guard-Reading-Script.docx")
print("wrote submission/OncoVTE-Guard-Reading-Script.docx")
