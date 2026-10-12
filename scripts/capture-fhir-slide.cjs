#!/usr/bin/env node
/**
 * Images for the talk's FHIR write-back slide (F19).
 *
 *   npm run build && npm run preview -- --port 4173     # one shell
 *   npx tsx scripts/export-fhir-output.ts               # refresh fhir-output/
 *   node scripts/capture-fhir-slide.cjs                 # another shell
 *
 * Output (talk-assets/):
 *   07-james-fhir-output-panel.png  the app's own "FHIR output" panel for James
 *   08-james-card-to-fhir.png       1920x1080 slide: the struck-through cards
 *                                   (cropped from 02-james-lmwh-start.png) beside
 *                                   James's real apixaban DetectedIssue, trimmed
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = (process.env.REVIEW_URL || "http://localhost:4173") + "/?present=true";
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "talk-assets");
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** James's apixaban DetectedIssue from the exported bundle, as compact JSON trimmed to the fields that carry meaning. */
function jamesIssueJson() {
  const bundle = JSON.parse(fs.readFileSync(path.join(ROOT, "fhir-output", "2-james-chen.json"), "utf8"));
  const di = bundle.entry
    .map((e) => e.resource)
    .find((r) => r.resourceType === "DetectedIssue" && r.code.text.startsWith("Apixaban"));
  const j = (v) => JSON.stringify(v).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/\{"/g, '{ "').replace(/"\}/g, '" }').replace(/\}\]/g, '} ]').replace(/\[\{/g, '[ {');
  const lines = [
    "{",
    `  "resourceType": "${di.resourceType}",`,
    `  "severity": "${di.severity}",`,
    `  "code": ${j({ coding: [{ code: di.code.coding[0].code, display: di.code.coding[0].display }] })},`,
    `  "implicated": [`,
    ...di.implicated.map((r, i, a) => `    ${j(r.reference ? { reference: r.reference } : { display: r.display })}${i < a.length - 1 ? "," : ""}`),
    `  ],`,
    `  "detail": ${JSON.stringify(di.detail.split(". ")[0] + ".")},`,
    `  "mitigation": ${j([{ action: { text: di.mitigation[0].action.text } }])}`,
    "}",
  ];
  return lines.join("\n");
}

function highlight(json) {
  return esc(json)
    .replace(/"(severity|implicated|mitigation|code)"/g, '<b class="k">"$1"</b>')
    .replace(/"(high|DRG)"/g, '<b class="v">"$1"</b>')
    .replace(/"(MedicationRequest\/medrx-itraconazole-2)"/g, '<b class="v hl">"$1"</b>')
    .replace(/"(Use Enoxaparin or Dalteparin)"/g, '<b class="v">"$1"</b>');
}

function slideHtml(stillDataUrl, json) {
  // Crop of the "Not recommended here" apixaban + rivaroxaban rows in the 3840x2160 still.
  const crop = { x: 1370, y: 1330, w: 1800, h: 230 };
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1920px; height: 1080px; background: #fff; font-family: "Segoe UI", Calibri, Arial, sans-serif; color: #1F3D33; padding: 52px 72px; position: relative; }
  h1 { font-size: 44px; font-weight: 700; letter-spacing: -0.5px; }
  .sub { font-size: 25px; color: #4a5f57; margin-top: 8px; }
  .label { font-size: 20px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #2F6B57; margin: 30px 0 10px; }
  .crop { width: 1776px; height: ${Math.round((1776 * crop.h) / crop.w)}px; background: url(${stillDataUrl}) no-repeat;
          background-size: ${Math.round((1776 * 3840) / crop.w)}px auto; background-position: -${Math.round((1776 * crop.x) / crop.w)}px -${Math.round((1776 * crop.y) / crop.w)}px;
          border: 1px solid #d5ddd9; border-radius: 10px; }
  .arrow { font-size: 22px; color: #2F6B57; font-weight: 600; margin: 14px 0 0 6px; }
  pre { font-family: Consolas, "Cascadia Mono", monospace; font-size: 23px; line-height: 1.45; background: #F4F8F6; border: 1px solid #d5ddd9; border-left: 6px solid #2F6B57; border-radius: 10px; padding: 18px 26px; white-space: pre; }
  b { font-weight: 700; } .k { color: #1F3D33; } .v { color: #2F6B57; } .hl { background: #FDE9C8; border-radius: 4px; padding: 0 4px; }
  .foot { position: absolute; left: 72px; right: 72px; bottom: 34px; display: flex; justify-content: space-between; font-size: 17px; color: #6b7c75; }
  </style></head><body>
  <h1>James's decision, written back as standard FHIR</h1>
  <div class="sub">Every blocked drug becomes a <b>DetectedIssue</b> that points to the exact order that caused it.</div>
  <div class="label">What the clinician sees</div>
  <div class="crop"></div>
  <div class="label">↓ &nbsp;What the EHR receives (FHIR R4 DetectedIssue)</div>
  <pre>${highlight(json)}</pre>
  <div class="foot"><span>Real output of the app for synthetic patient James Chen · JSON trimmed for the slide</span><span>Validated against FHIR R4 (HL7 validator, 0 errors)</span></div>
  </body></html>`;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });

  // 1. The app's own panel.
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.locator("button", { hasText: "James" }).first().click();
  await page.waitForTimeout(500);
  const panel = page.locator("details", { hasText: "FHIR output" }).first();
  await panel.locator("summary").click();
  await panel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await panel.screenshot({ path: path.join(OUT, "07-james-fhir-output-panel.png") });
  console.log("  ▸ 07-james-fhir-output-panel.png");
  await ctx.close();

  // 2. The composite slide.
  const still = fs.readFileSync(path.join(OUT, "02-james-lmwh-start.png")).toString("base64");
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
  const p2 = await ctx2.newPage();
  await p2.setContent(slideHtml(`data:image/png;base64,${still}`, jamesIssueJson()), { waitUntil: "load" });
  await p2.screenshot({ path: path.join(OUT, "08-james-card-to-fhir.png") });
  console.log("  ▸ 08-james-card-to-fhir.png");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
