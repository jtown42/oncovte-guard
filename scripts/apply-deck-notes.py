"""Write scripts/deck-notes.py into the finished deck's speaker notes.

  python scripts/apply-deck-notes.py <path to OncoVTE-final.pptx>
"""
import importlib.util
import sys
from pathlib import Path

from pptx import Presentation

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("deck_notes", ROOT / "scripts" / "deck-notes.py")
deck_notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deck_notes)

deck = sys.argv[1]
prs = Presentation(deck)
slides = list(prs.slides)
assert len(slides) == 13, f"expected 13 slides (with 'Why it matters'), found {len(slides)}"
for pos, text in deck_notes.NOTES.items():
    slides[pos - 1].notes_slide.notes_text_frame.text = text.strip()
prs.save(deck)
print("notes written to", deck)
