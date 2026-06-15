#!/usr/bin/env node
/**
 * Regenerate the five README decision-state screenshots in docs/screenshots/,
 * driving the locally-installed Chrome via playwright-core. Run against the
 * production preview build:
 *
 *   npm run build && npm run preview -- --port 4173   # in one shell
 *   node scripts/capture-screenshots.cjs              # in another
 *
 * Output: docs/screenshots/patient-{1..5}-*.png (full-page, desktop @2x).
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright-core");

const BASE = process.env.REVIEW_URL || "http://localhost:4173";
const OUT = path.join(__dirname, "..", "docs", "screenshots");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const PRESETS = [
  { name: "Maria", file: "patient-1-maria-recommend.png" },
  { name: "James", file: "patient-2-james-lmwh-fallback.png" },
  { name: "Dorothy", file: "patient-3-dorothy-contraindicated.png" },
  { name: "Robert", file: "patient-4-robert-not-indicated.png" },
  { name: "Priya", file: "patient-5-priya-excluded.png" },
];

function chromePath() {
  for (const p of CHROME_CANDIDATES) if (fs.existsSync(p)) return p;
  throw new Error("No Chrome/Edge found at known paths.");
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: chromePath() });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(500); // let webfonts settle

  for (const preset of PRESETS) {
    await page.locator("button", { hasText: preset.name }).first().click();
    await page.waitForTimeout(450);
    await page.screenshot({
      path: path.join(OUT, preset.file),
      fullPage: true,
    });
    console.log("  ▸", preset.file);
  }

  await browser.close();
  console.log("\nDone. Screenshots refreshed in docs/screenshots/.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
