# PowerPoint-side finishing that python-pptx cannot do. Run after scripts/finalize-deck.py,
# then run scripts/apply-deck-notes.py. Safe to re-run on an already-finished deck.
# - Make the embedded James clip play on the presenter's next click (main sequence).
# - Remove the problem slide's "Dim overlay": a 60%-white box that faded the first lines
#   to gray at the last build and made them hard to read on a projector.
# - Insert a "Why it matters" slide before "The problem" (three stat tiles + takeaway).
#   powershell -File scripts/set-clip-on-click.ps1 C:\path\to\OncoVTE-final.pptx
param([string]$Deck)
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open((Resolve-Path $Deck).Path, $false, $false, $false)

function Title-Of($slide) {
  foreach ($sh in $slide.Shapes) { if ($sh.Name -eq "Title 2" -and $sh.HasTextFrame) { return $sh.TextFrame.TextRange.Text } }
  return ""
}

# 1. James clip: play on click.
foreach ($s in $p.Slides) {
  foreach ($sh in $s.Shapes) {
    if ($sh.Name -like "James toggle clip*") {
      $seq = $s.TimeLine.MainSequence
      for ($j = $seq.Count; $j -ge 1; $j--) { $seq.Item($j).Delete() }
      $null = $seq.AddEffect($sh, 83, 0, 1)   # msoAnimEffectMediaPlay, on page click
      "clip set to play on click (slide $($s.SlideIndex))"
    }
  }
}

# 2. Problem slide: drop the dim overlay.
$problem = $null; $why = $null
foreach ($s in $p.Slides) {
  $t = Title-Of $s
  if ($t -eq "The problem") { $problem = $s }
  if ($t -eq "Why it matters") { $why = $s }
}
for ($i = $problem.Shapes.Count; $i -ge 1; $i--) {
  if ($problem.Shapes.Item($i).Name -eq "Dim overlay") { $problem.Shapes.Item($i).Delete(); "removed dim overlay" }
}

# 3. "Why it matters", built from a copy of the problem slide so it keeps the template.
if (-not $why) {
  $why = $problem.Duplicate().Item(1)
  $why.MoveTo($problem.SlideIndex)          # lands just before "The problem"
  for ($i = $why.Shapes.Count; $i -ge 1; $i--) {
    $n = $why.Shapes.Item($i).Name
    if ($n -ne "Title 2" -and $n -ne "Picture 10") { $why.Shapes.Item($i).Delete() }
  }
  $seq = $why.TimeLine.MainSequence
  for ($j = $seq.Count; $j -ge 1; $j--) { $seq.Item($j).Delete() }
  foreach ($sh in $why.Shapes) { if ($sh.Name -eq "Title 2") { $sh.TextFrame.TextRange.Text = "Why it matters" } }

  $INK = 0x38141E; $PURPLE = 0x8C2A4B; $GRAY = 0x404040; $WASH = 0xF8EDF1; $RED = 0x2E3AB0  # BGR
  $tiles = @(
    @{ big = "~" + [char]0x00BD; bigColor = $PURPLE; label = "fewer clots with prophylaxis in higher-risk patients"; src = "Pooled AVERT + CASSINI " + [char]0x00B7 + " ITAC 2022" },
    @{ big = "~6 in 10"; bigColor = $PURPLE; label = "high-risk patients got it, even in a dedicated prevention program"; src = "Holmes et al., JCO Oncol Pract 2026" },
    @{ big = "Bleeding"; bigColor = $RED; label = "is the risk on the other side: a blood thinner in the wrong patient causes harm"; src = "" }
  )
  $x = 72; $w = 272; $gap = 18; $y = 140; $h = 196
  $k = 0
  foreach ($t in $tiles) {
    $box = $why.Shapes.AddShape(5, $x + $k * ($w + $gap), $y, $w, $h)   # rounded rectangle
    $box.Name = "Why tile $($k + 1)"
    $box.Adjustments.Item(1) = 0.12
    $box.Fill.ForeColor.RGB = $WASH
    $box.Line.ForeColor.RGB = $PURPLE; $box.Line.Weight = 0.75
    $tf = $box.TextFrame
    $tf.MarginLeft = 14; $tf.MarginRight = 14; $tf.MarginTop = 12; $tf.MarginBottom = 12
    $tf.VerticalAnchor = 1; $tf.WordWrap = -1; $tf.AutoSize = 0
    $text = $t.big + "`r" + $t.label
    if ($t.src) { $text += "`r" + $t.src }
    $tf.TextRange.Text = $text
    $tf.TextRange.ParagraphFormat.Alignment = 1
    $tf.TextRange.Font.Name = "Segoe UI"
    $p1 = $tf.TextRange.Paragraphs(1); $p1.Font.Size = 46; $p1.Font.Bold = -1; $p1.Font.Color.RGB = $t.bigColor
    $p2 = $tf.TextRange.Paragraphs(2); $p2.Font.Size = 18; $p2.Font.Bold = 0; $p2.Font.Color.RGB = $INK; $p2.ParagraphFormat.SpaceBefore = 4
    if ($t.src) { $p3 = $tf.TextRange.Paragraphs(3); $p3.Font.Size = 12; $p3.Font.Bold = 0; $p3.Font.Color.RGB = $GRAY; $p3.ParagraphFormat.SpaceBefore = 10 }
    $k++
  }
  $take = $why.Shapes.AddTextbox(1, 72, 366, 852, 80)
  $take.Name = "Why takeaway"
  $take.TextFrame.MarginLeft = 0; $take.TextFrame.WordWrap = -1
  $take.TextFrame.TextRange.Text = "The hard part isn" + [char]0x2019 + "t knowing prophylaxis works.`rIt" + [char]0x2019 + "s picking the right patient " + [char]0x2014 + " and the right drug."
  $take.TextFrame.TextRange.Font.Name = "Segoe UI"
  $l1 = $take.TextFrame.TextRange.Paragraphs(1); $l1.Font.Size = 24; $l1.Font.Bold = 0; $l1.Font.Color.RGB = $INK
  $l2 = $take.TextFrame.TextRange.Paragraphs(2); $l2.Font.Size = 26; $l2.Font.Bold = -1; $l2.Font.Color.RGB = $PURPLE
  "inserted 'Why it matters' at slide $($why.SlideIndex)"
}

$p.Save(); $p.Close(); $pp.Quit()
