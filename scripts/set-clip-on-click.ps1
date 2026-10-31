# PowerPoint-side finishing that python-pptx cannot do. Run after scripts/finalize-deck.py.
# - Make the embedded James clip play on the presenter's next click (main sequence).
# - Remove slide 4's "Dim overlay": a 60%-white box that faded the first lines to
#   gray at the last build and made them hard to read on a projector.
#   powershell -File scripts/set-clip-on-click.ps1 C:\path\to\OncoVTE-final.pptx
param([string]$Deck)
$pp = New-Object -ComObject PowerPoint.Application
$p = $pp.Presentations.Open((Resolve-Path $Deck).Path, $false, $false, $false)
$s = $p.Slides.Item(7)
$clip = $null
foreach ($sh in $s.Shapes) { if ($sh.Name -like "James toggle clip*") { $clip = $sh } }
if (-not $clip) { throw "clip not found on slide 7" }
$seq = $s.TimeLine.MainSequence
for ($j = $seq.Count; $j -ge 1; $j--) { $seq.Item($j).Delete() }
$null = $seq.AddEffect($clip, 83, 0, 1)   # msoAnimEffectMediaPlay, on page click
$s4 = $p.Slides.Item(4)
for ($i = $s4.Shapes.Count; $i -ge 1; $i--) { if ($s4.Shapes.Item($i).Name -eq "Dim overlay") { $s4.Shapes.Item($i).Delete(); "removed slide 4 dim overlay" } }
$p.Save(); $p.Close(); $pp.Quit()
"clip set to play on click"
