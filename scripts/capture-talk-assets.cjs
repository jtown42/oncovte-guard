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

/**
 * The James clip, made to be read from the back of a room: the app zoomed 1.5x
 * (laid out as if 1280x720, filling a 1920x1080 frame), the medication
 * list and the verdict both in view, a visible cursor with a click ring, and a
 * caption bar naming each step. Only the overlay is added; the app is untouched.
 */
async function clip(browser) {
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  await page.goto(BASE + "&patient=james", { waitUntil: "networkidle" });
  // Zoom 1.5x (layout as if 1280x720). The caption bar replaces the app's top
  // bar, and the rail gets a height that fits the zoomed frame so it can scroll.
  await page.addStyleTag({ content: `
    #root { zoom: 1.5; }
    #root > div > header:first-child { display: none; }
    main { padding-top: 92px !important; }
    aside { top: 92px !important; max-height: calc(720px - 100px) !important; }
  ` });
  await page.waitForTimeout(400);
  // Bring "Current medications" near the top of the rail.
  await page.evaluate(() => {
    const rail = document.querySelector("aside");
    const meds = [...rail.querySelectorAll("*")].find((e) => e.textContent.trim() === "Current medications");
    rail.scrollTop += (meds.getBoundingClientRect().top - rail.getBoundingClientRect().top) / 1.5 - 260;
  });
  await page.addStyleTag({ content: `
    #cap { position: fixed; z-index: 99; top: 0; left: 0; right: 0; height: 120px; display: flex; align-items: center;
           padding: 0 44px; background: #1F3D33; color: #fff; font: 600 44px/1.1 "Segoe UI", Calibri, Arial, sans-serif; letter-spacing: -0.2px; }
    #cap b { color: #F7D58B; font-weight: 700; }
    #cur { position: fixed; z-index: 100; width: 46px; height: 46px; left: 1650px; top: 960px; pointer-events: none;
           transition: left 0.9s cubic-bezier(.45,0,.2,1), top 0.9s cubic-bezier(.45,0,.2,1); }
    #ring { position: fixed; z-index: 99; width: 84px; height: 84px; margin: -42px 0 0 -42px; border-radius: 50%;
            border: 6px solid #E0A526; opacity: 0; pointer-events: none; }
    #ring.go { animation: ring 0.7s ease-out; }
    @keyframes ring { from { transform: scale(0.3); opacity: 1; } to { transform: scale(1.6); opacity: 0; } }
  ` });
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend",
      '<div id="cap"></div><div id="ring"></div>' +
      '<svg id="cur" viewBox="0 0 24 24"><path d="M4 2l15 11-6.5 1.2L16 21l-3 1.4-3.4-6.6L4 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>');
  });
  const caption = (html) => page.evaluate((h) => { document.getElementById("cap").innerHTML = "<span>" + h + "</span>"; }, html);
  const pointAt = async (locator) => {
    const b = await locator.boundingBox();
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await page.evaluate(([x, y]) => { const c = document.getElementById("cur"); c.style.left = x - 4 + "px"; c.style.top = y - 2 + "px"; }, [x, y]);
    await page.waitForTimeout(1000);
    await page.evaluate(([x, y]) => { const r = document.getElementById("ring"); r.style.left = x + "px"; r.style.top = y + "px";
      r.classList.remove("go"); void r.offsetWidth; r.classList.add("go"); }, [x, y]);
    await page.waitForTimeout(150);
  };

  await caption("James is on <b>itraconazole</b> &nbsp;→&nbsp; both pills ruled out &nbsp;→&nbsp; injectable heparin");
  const lead = (Date.now() - t0) / 1000;
  await page.waitForTimeout(3600);

  await caption("Remove <b>itraconazole</b> &nbsp;→&nbsp; the engine re-runs");
  await pointAt(page.getByRole("button", { name: /remove itraconazole/i }));
  await removeMed(page, "Itraconazole");
  await page.waitForTimeout(1300);
  await caption("The oral options are back: <b>apixaban or rivaroxaban</b>");
  await page.waitForTimeout(3400);

  await caption("Add <b>itraconazole</b> back &nbsp;→&nbsp; injectable heparin again");
  await pointAt(page.locator("select").filter({ hasText: /Add a medication/i }).first());
  await addMed(page, "Itraconazole");
  await page.waitForTimeout(3600);

  const video = page.video();
  await ctx.close();
  const webm = path.join(OUT, "05-james-toggle.webm");
  fs.renameSync(await video.path(), webm);
  console.log("  ▸ 05-james-toggle.webm");
  try {
    // Trim the page-load lead-in and encode H.264 for PowerPoint.
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", lead.toFixed(2), "-i", webm, "-an",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "16",
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
