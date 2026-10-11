#!/usr/bin/env node
/**
 * Capture the stills and the James toggle clip used in the AMIA talk
 * (submission/FINAL-TALK-SCRIPT.md), in presentation mode at 1920x1080.
 *
 *   npm run build && npm run preview -- --port 4173   # in one shell
 *   node scripts/capture-talk-assets.cjs              # in another
 *
 * Output: talk-assets/  (stills as PNG; the clip as WebM, converted to MP4/H.264
 * with ffmpeg when it is on PATH). Set CHECK_ONLY=1 to run only the 10x
 * determinism check of the James toggle.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { chromium } = require("playwright-core");

const BASE = (process.env.REVIEW_URL || "http://localhost:4173") + "/?present=true";
const OUT = path.join(__dirname, "..", "talk-assets");
const W = 1920, H = 1080;
const CHROME = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => fs.existsSync(p));

const verdict = (page) => page.locator("h2.verdict-hero").first().innerText();

async function pick(page, name) {
  await page.locator("button", { hasText: name }).first().click();
  await page.waitForTimeout(500);
}

async function removeMed(page, label) {
  await page.getByRole("button", { name: new RegExp(`remove ${label}`, "i") }).click();
}

async function addMed(page, label) {
  const sel = page.locator("select").filter({ hasText: /Add a medication/i }).first();
  const value = await sel.locator("option", { hasText: label }).first().getAttribute("value");
  await sel.selectOption(value);
}

async function stills(browser) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const shot = async (file) => {
    await page.screenshot({ path: path.join(OUT, file) });
    console.log("  ▸", file, "—", (await verdict(page)).replace(/\s+/g, " "));
  };

  await pick(page, "Maria");
  await shot("01-maria-recommend.png");
  await pick(page, "James");
  await shot("02-james-lmwh-start.png");
  await pick(page, "Dorothy");
  await shot("03-dorothy-42k-contraindicated.png");

  // Dorothy what-if: platelets 42 -> 55 (slider), the backup slide's second state.
  const slider = page
    .locator("span", { hasText: /^Platelets$/ })
    .locator("xpath=ancestor::div[2]")
    .locator('input[type="range"]');
  await slider.fill("55");
  await page.waitForTimeout(600);
  await shot("04-dorothy-55k-apixaban-caution.png");
  await ctx.close();
}

async function determinism(browser) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await pick(page, "James");
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    await removeMed(page, "Itraconazole");
    await page.waitForTimeout(250);
    const off = await verdict(page);
    await addMed(page, "Itraconazole");
    await page.waitForTimeout(250);
    const on = await verdict(page);
    seen.add(`${off} | ${on}`.replace(/\s+/g, " "));
  }
  console.log("  determinism (10 toggles), distinct outcomes:", [...seen]);
  await ctx.close();
  if (seen.size !== 1) throw new Error("James toggle is not deterministic");
}

async function clip(browser) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await pick(page, "James");
  await page.mouse.move(W - 10, H - 10); // park the cursor out of frame
  await page.waitForTimeout(4500); // LMWH verdict hold (~3 s after the trimmed lead-in)
  await removeMed(page, "Itraconazole");
  await page.mouse.move(W - 10, H - 10);
  await page.waitForTimeout(5500); // oral agents hold
  await addMed(page, "Itraconazole");
  await page.mouse.move(W - 10, H - 10);
  await page.waitForTimeout(4500); // back to LMWH
  const video = page.video();
  await ctx.close();
  const webm = path.join(OUT, "05-james-toggle.webm");
  fs.renameSync(await video.path(), webm);
  console.log("  ▸ 05-james-toggle.webm");
  try {
    // Trim the page-load lead-in (first ~1.5 s) and encode H.264 for PowerPoint.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", "1.5", "-i", webm, "-an",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "18",
      "-movflags", "+faststart", path.join(OUT, "05-james-toggle.mp4")]);
    console.log("  ▸ 05-james-toggle.mp4 (H.264)");
    fs.unlinkSync(webm);
  } catch (e) {
    console.log("  ffmpeg not available; convert the WebM to MP4 manually.", e.message);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME });
  await determinism(browser);
  if (!process.env.CHECK_ONLY) {
    await stills(browser);
    await clip(browser);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
