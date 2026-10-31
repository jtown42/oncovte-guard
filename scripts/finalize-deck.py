"""Apply the final fixes to the AMIA deck without touching its design.

  python scripts/finalize-deck.py <in.pptx> <out.pptx>

- swaps in the re-captured images (01 Maria, 02 James, 08 FHIR, 09 panel)
- embeds the James clip over the James still (plays on click), removes the placeholder
- slide 4: "reasoning" -> "logic"; "DOAC–cancer-drug" -> "DOAC–drug"
- replaces every speaker note with scripts/deck-notes.py
"""
import importlib.util
import sys
from pathlib import Path

from pptx import Presentation

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "talk-assets"

spec = importlib.util.spec_from_file_location("deck_notes", ROOT / "scripts" / "deck-notes.py")
deck_notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deck_notes)

src, dst = sys.argv[1], sys.argv[2]
prs = Presentation(src)
slides = list(prs.slides)


def picture(slide, name):
    return next(sh for sh in slide.shapes if sh.name == name)


def swap_image(slide, name, png):
    pic = picture(slide, name)
    part = slide.part.related_part(pic._element.blipFill.blip.rEmbed)
    part._blob = (ASSETS / png).read_bytes()


swap_image(slides[5], "Picture 1", "01-maria-recommend.png")
swap_image(slides[6], "James still (02-james-lmwh-start)", "02-james-lmwh-start.png")
swap_image(slides[7], "Slide image 08-james-card-to-fhir", "08-james-card-to-fhir.png")
swap_image(slides[8], "Slide image 09-panel-worklist", "09-panel-worklist.png")

# The James clip, exactly over the still; the still stays underneath as the fallback.
james = slides[6]
still = picture(james, "James still (02-james-lmwh-start)")
for sh in list(james.shapes):
    if sh.name.startswith("VIDEO PLACEHOLDER"):
        sh._element.getparent().remove(sh._element)
movie = james.shapes.add_movie(
    str(ASSETS / "05-james-toggle.mp4"),
    still.left, still.top, still.width, still.height,
    poster_frame_image=str(ASSETS / "02-james-lmwh-start.png"),
    mime_type="video/mp4",
)
movie.name = "James toggle clip (05-james-toggle.mp4)"

for sh in slides[3].shapes:
    if sh.has_text_frame:
        for para in sh.text_frame.paragraphs:
            for run in para.runs:
                if "the reasoning inspectable" in run.text:
                    run.text = run.text.replace("the reasoning inspectable", "the logic inspectable")
                # James's blocker is an antifungal, not a cancer drug.
                if "cancer-drug" in run.text:
                    run.text = run.text.replace("cancer-drug", "drug")

for pos, text in deck_notes.NOTES.items():
    slides[pos - 1].notes_slide.notes_text_frame.text = text.strip()

prs.save(dst)
print("wrote", dst)
