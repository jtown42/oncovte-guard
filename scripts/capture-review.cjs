#!/usr/bin/env node
/**
 * Capture high-resolution screenshots + text extractions of the running app,
 * for an external design/UX review. Drives the locally-installed Chrome via
 * playwright-core (no browser download). Run against `npm run preview`:
 *
 *   npm install --no-save playwright-core   # one-time (not a project dep)
 *   npm run build && npm run preview -- --port 4173   # in one shell
 *   node scripts/capture-review.cjs                   # in another
 *
 * Output: docs/review/*.png  +  docs/review/text/*.txt
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = process.env.REVIEW_URL || "http://localhost:4173";
const OUT = path.join(__dirname, "..", "docs", "review");
const TEXT = path.join(OUT, "text");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const PRESETS = [
  { name: "Maria Santos", slug: "1-maria-recommend" },
  { name: "James Chen", slug: "2-james-lmwh-fallback" },
  { name: "Dorothy Williams", slug: "3-dorothy-contraindicated" },
  { name: "Robert Johnson", slug: "4-robert-not-indicated" },
  { name: "Priya Patel", slug: "5-priya-excluded" },
];

function chromePath() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error("No Chrome/Edge found at known paths.");
}

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(450);
}

async function snap(page, file) {
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  console.log("  ▸", file);
}

async function dumpText(page, file) {
  const txt = await page.evaluate(() => document.body.innerText);
  fs.writeFileSync(path.join(TEXT, file), txt, "utf8");
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TEXT, { recursive: true });

  const browser = await chromium.launch({ executablePath: chromePath() });

  // ---------- Desktop @2x ----------
  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await desktop.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await settle(page);

  console.log("Desktop (1440×900 @2x):");
  for (const preset of PRESETS) {
    await page.click(`button:has-text("${preset.name}")`);
    await settle(page);
    await snap(page, `desktop-${preset.slug}.png`);
    await dumpText(page, `desktop-${preset.slug}.txt`);
  }

  // Editor collapsed (Maria), to show the dashboard without the control clutter.
  await page.click(`button:has-text("Maria Santos")`);
  await settle(page);
  await page.click('button:has-text("Hide controls")').catch(() => {});
  await settle(page);
  await snap(page, "desktop-editor-collapsed.png");
  await page.click('button:has-text("Show controls")').catch(() => {});

  // Just the editor region (top of page), normal scroll position.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(OUT, "desktop-editor-viewport.png"),
    fullPage: false,
  });
  console.log("  ▸ desktop-editor-viewport.png");

  await desktop.close();

  // ---------- Mobile @3x ----------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
  });
  const mpage = await mobile.newPage();
  await mpage.goto(BASE, { waitUntil: "domcontentloaded" });
  await settle(mpage);
  console.log("Mobile (390×844 @3x):");
  await snap(mpage, "mobile-1-maria-editor.png");
  await mpage.click(`button:has-text("Dorothy Williams")`);
  await settle(mpage);
  await snap(mpage, "mobile-3-dorothy-contraindicated.png");
  await mobile.close();

  await browser.close();
  console.log("\nDone. Screenshots in docs/review/, text in docs/review/text/.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
