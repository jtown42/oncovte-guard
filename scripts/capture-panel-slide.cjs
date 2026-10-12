#!/usr/bin/env node
/**
 * Slide image for the panel-screening demo (F20):
 *   npx tsx scripts/panel-screen.ts --dir synthetic-panel
 *   node scripts/capture-panel-slide.cjs      → talk-assets/09-panel-worklist.png
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const ROOT = path.join(__dirname, "..");
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "panel-screen-output", "synthetic-panel.json"), "utf8"));

const SITE = [
  [/pancrea/i, "Pancreatic"], [/stomach/i, "Gastric"], [/lung|bronch/i, "Lung"], [/lymphoma/i, "Lymphoma"],
  [/ovary/i, "Ovarian"], [/bladder/i, "Bladder"], [/colon/i, "Colon"], [/breast/i, "Breast"],
  [/prostate/i, "Prostate"], [/myeloma/i, "Myeloma"],
];
const site = (s) => (SITE.find(([re]) => re.test(s)) || [0, s])[1];
const short = (v) => {
  const [head, regimen] = v.split(": ");
  if (!regimen) return head.replace("Routine prophylaxis not indicated", "Not indicated").replace("Khorana not applicable", "Disease-specific pathway");
  const agents = regimen.split(" or ").map((x) => x.split(" ")[0]).join(" or ");
  return head.startsWith("Recommended with cautions") ? `${agents} (with cautions)` : head.includes("LMWH") ? `LMWH: ${agents}` : agents;
};
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const flaggedCount = data.rows.filter((r) => r.flagged).length;
const shown = [...data.rows.filter((r) => r.flagged).slice(0, 7), ...data.rows.filter((r) => !r.flagged).slice(0, 3)];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; }
body { width: 1920px; height: 1080px; background: #fff; font-family: "Segoe UI", Calibri, Arial, sans-serif; color: #1F3D33; padding: 52px 72px; position: relative; }
h1 { font-size: 44px; font-weight: 700; letter-spacing: -0.5px; }
.sub { font-size: 25px; color: #4a5f57; margin-top: 8px; }
.flow { display: flex; gap: 14px; align-items: center; margin-top: 26px; font-size: 21px; font-weight: 600; }
.flow span.box { background: #EEF4F1; border: 1px solid #cfe0d8; border-radius: 8px; padding: 8px 14px; }
.flow span.arr { color: #2F6B57; }
.stats { display: flex; gap: 18px; margin-top: 24px; }
.stat { border: 1px solid #d5ddd9; border-radius: 10px; padding: 12px 20px; font-size: 20px; color: #4a5f57; }
.stat b { display: block; font-size: 38px; color: #1F3D33; }
.stat.hl { border-color: #2F6B57; background: #EEF4F1; } .stat.hl b { color: #2F6B57; }
table { width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 21px; }
th { text-align: left; font-size: 16px; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7c75; padding: 6px 12px; border-bottom: 2px solid #d5ddd9; }
td { padding: 8px 12px; border-bottom: 1px solid #e6ece9; }
tr.flag td { background: #F4F8F6; } tr.flag td:first-child { border-left: 5px solid #2F6B57; }
.tag { font-size: 15px; font-weight: 700; color: #2F6B57; letter-spacing: 0.5px; }
.muted { color: #8a9a93; }
.synthetic { position: absolute; top: 56px; right: 72px; font-size: 17px; font-weight: 700; letter-spacing: 1px; color: #8a5a00; background: #FDF1DC; border: 1px solid #f0d9a8; border-radius: 6px; padding: 6px 12px; }
.foot { position: absolute; left: 72px; right: 72px; bottom: 30px; font-size: 17px; color: #6b7c75; }
</style></head><body>
<div class="synthetic">SYNTHETIC PANEL · DEMONSTRATES THE FLOW</div>
<h1>Same engine, whole panel</h1>
<div class="sub">Who in clinic meets the guideline threshold but isn't on prophylaxis?</div>
<div class="flow"><span class="box">FHIR Bulk Data $export</span><span class="arr">→</span><span class="box">every patient through the same, unchanged engine</span><span class="arr">→</span><span class="box">worklist for the clinic</span></div>
<div class="stats">
  <div class="stat"><b>${data.screened}</b>patients screened</div>
  <div class="stat hl"><b>${flaggedCount}</b>eligible, no anticoagulant on file</div>
</div>
<table>
<tr><th>Patient</th><th>Cancer</th><th>Khorana</th><th>Engine recommendation</th><th>Anticoagulant on file</th><th></th></tr>
${shown
  .map(
    (r) => `<tr class="${r.flagged ? "flag" : ""}"><td>${esc(r.patient)}</td><td>${esc(site(r.cancer))}</td><td>${esc(r.khorana)}</td><td>${esc(short(r.verdict))}</td><td>${r.onAnticoagulant ? "yes" : "no"}</td><td>${r.flagged ? '<span class="tag">FLAGGED</span>' : '<span class="muted">—</span>'}</td></tr>`,
  )
  .join("\n")}
</table>
<div class="foot">Synthetic oncology panel generated for this demo (${data.screened} patients, NDJSON as a $export returns it). Counts reflect the generator, not a real population. First ${shown.length} of ${data.rows.length} rows shown.</div>
</body></html>`;

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: path.join(ROOT, "talk-assets", "09-panel-worklist.png") });
  console.log("  ▸ 09-panel-worklist.png");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
