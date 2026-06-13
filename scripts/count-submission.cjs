#!/usr/bin/env node
/**
 * Verify each AMIA submission field is within its character limit.
 * Counts raw characters INCLUDING spaces and newlines (the conservative measure
 * a form textarea maxlength would enforce). Run: node scripts/count-submission.cjs
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "submission");

// Limit per field file. null = no stated limit (informational only).
const LIMITS = {
  "00-short-answers.txt": null,
  "01-abstract.txt": 1000,
  "02-rationale.txt": 3500,
  "03-design.txt": 7000,
  "04-evaluation.txt": 3500,
  "05-audience.txt": null,
  "06-twitter.txt": 140,
  "07-fhir-usage.txt": 500,
  "08-fhir-release-resources.txt": 500,
  "09-data-source.txt": 500,
  "10-other-info.txt": 1500,
};

let anyOver = false;
const rows = [];
for (const file of Object.keys(LIMITS)) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) {
    rows.push([file, "MISSING", "", "FAIL"]);
    anyOver = true;
    continue;
  }
  const text = fs.readFileSync(p, "utf8");
  const len = text.length;
  const limit = LIMITS[file];
  let status = "ok";
  if (limit != null) {
    if (len > limit) {
      status = "OVER";
      anyOver = true;
    } else {
      status = `${limit - len} left`;
    }
  } else {
    status = "(no limit)";
  }
  rows.push([file, String(len), limit == null ? "-" : String(limit), status]);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(
  pad("field", 32) + pad("chars", 8) + pad("limit", 8) + "status",
);
console.log("-".repeat(60));
for (const r of rows) {
  console.log(pad(r[0], 32) + pad(r[1], 8) + pad(r[2], 8) + r[3]);
}
console.log("-".repeat(60));
console.log(anyOver ? "RESULT: one or more fields OVER limit" : "RESULT: all fields within limits");
process.exit(anyOver ? 1 : 0);
