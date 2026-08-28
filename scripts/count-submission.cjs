#!/usr/bin/env node
/**
 * Verify each AMIA submission field is within its character limit.
 * Counts raw characters INCLUDING spaces and newlines (the conservative measure
 * a form textarea maxlength would enforce). Run: node scripts/count-submission.cjs
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "submission");

// Limit per field file, mirroring the ACTUAL AMIA portal. The portal enforces
// WORD limits on the abstract and the two "other info" fields, and CHARACTER
// limits on the FHIR narratives and Twitter field. { chars } / { words } / null.
const LIMITS = {
  "00-short-answers.txt": null,
  "01-abstract.txt": { words: 250 },
  "02-rationale.txt": { chars: 3500 },
  "03-design.txt": { chars: 7000 },
  "04-evaluation.txt": { chars: 3500 },
  "04b-data-validation.txt": { chars: 3500 },
  "05-audience.txt": null,
  "06-twitter.txt": { chars: 140 },
  "07-fhir-usage.txt": { chars: 500 },
  "08-fhir-release-resources.txt": { chars: 500 },
  "09-data-source.txt": { chars: 500 },
  "10-other-info.txt": { words: 250 },
};

const wordCount = (t) => (t.trim() === "" ? 0 : t.trim().split(/\s+/).length);

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
  const cfg = LIMITS[file];
  let measure, unit, limit;
  if (cfg == null) {
    measure = text.length;
    unit = "chars";
    limit = null;
  } else if (cfg.words != null) {
    measure = wordCount(text);
    unit = "words";
    limit = cfg.words;
  } else {
    measure = text.length;
    unit = "chars";
    limit = cfg.chars;
  }
  let status;
  if (limit == null) {
    status = "(no limit)";
  } else if (measure > limit) {
    status = "OVER";
    anyOver = true;
  } else {
    status = `${limit - measure} left`;
  }
  rows.push([
    file,
    `${measure} ${unit}`,
    limit == null ? "-" : `${limit} ${unit}`,
    status,
  ]);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("field", 32) + pad("size", 14) + pad("limit", 14) + "status");
console.log("-".repeat(66));
for (const r of rows) {
  console.log(pad(r[0], 32) + pad(r[1], 14) + pad(r[2], 14) + r[3]);
}
console.log("-".repeat(66));
console.log(anyOver ? "RESULT: one or more fields OVER limit" : "RESULT: all fields within limits");
process.exit(anyOver ? 1 : 0);
