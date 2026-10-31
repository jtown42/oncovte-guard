# Make the embedded James clip play on the presenter's next click (main sequence),
# which python-pptx cannot set. Run after scripts/finalize-deck.py.
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
$p.Save(); $p.Close(); $pp.Quit()
"clip set to play on click"
