/**
 * Panel screening over FHIR Bulk Data (F20). See src/panel/screen.ts.
 *
 *   npx tsx scripts/panel-screen.ts --dir synthetic-panel
 *   npx tsx scripts/panel-screen.ts --export https://bulk-data.smarthealthit.org/fhir
 *
 * --export runs a real Bulk Data kick-off ($export, Prefer: respond-async),
 * polls the status URL, and downloads the NDJSON files. --dir reads NDJSON
 * already on disk (e.g. the synthetic panel from scripts/gen-panel.ts).
 */
import fs from "fs";
import path from "path";
import type { FhirResource } from "fhir/r4";
import { screenPanel } from "../src/panel/screen";

const TYPES = ["Patient", "Condition", "Observation", "MedicationRequest"];
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};

async function bulkExport(base: string, dir: string): Promise<void> {
  const kick = await fetch(`${base}/Patient/$export?_type=${TYPES.join(",")}`, {
    headers: { Accept: "application/fhir+json", Prefer: "respond-async" },
  });
  if (kick.status !== 202) throw new Error(`kick-off → ${kick.status}`);
  const status = kick.headers.get("content-location")!;
  console.log(`  kick-off 202 Accepted → polling ${status}`);
  for (;;) {
    const r = await fetch(status);
    if (r.status === 200) {
      const manifest = await r.json();
      fs.mkdirSync(dir, { recursive: true });
      for (const o of manifest.output) {
        const body = await (await fetch(o.url, { headers: { Accept: "application/fhir+ndjson" } })).text();
        fs.appendFileSync(path.join(dir, `${o.type}.ndjson`), body.endsWith("\n") ? body : body + "\n");
      }
      console.log(`  downloaded ${manifest.output.length} NDJSON files to ${dir}`);
      return;
    }
    if (r.status !== 202) throw new Error(`status → ${r.status}`);
    await new Promise((res) => setTimeout(res, 3000));
  }
}

function readNdjson(dir: string): FhirResource[] {
  const all: FhirResource[] = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".ndjson"))) {
    for (const line of fs.readFileSync(path.join(dir, f), "utf8").split("\n")) {
      if (line.trim()) all.push(JSON.parse(line));
    }
  }
  return all;
}

(async () => {
  let dir = arg("dir");
  const base = arg("export");
  if (base) {
    dir = path.join("panel-screen-output", "export-" + new Date().toISOString().slice(0, 10));
    fs.rmSync(dir, { recursive: true, force: true });
    await bulkExport(base, dir);
  }
  if (!dir) throw new Error("use --dir <ndjson dir> or --export <FHIR base>");

  const result = screenPanel(readNdjson(dir));
  const flagged = result.rows.filter((r) => r.flagged).length;
  const NL = "\n";
  console.log(`${NL}  ${result.screened} patients in export · ${result.withCancer} with an ICD-10-CM cancer Condition · ${flagged} flagged`);

  const outDir = "panel-screen-output";
  fs.mkdirSync(outDir, { recursive: true });
  const name = path.basename(dir);
  const cols = ["patient", "id", "cancer", "khorana", "verdict", "onAnticoagulant", "flagged"] as const;
  const csv = [cols.join(","), ...result.rows.map((r) => cols.map((c) => `"${String(r[c]).replace(/"/g, '""')}"`).join(","))];
  fs.writeFileSync(path.join(outDir, `${name}.csv`), csv.join(NL) + NL);
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({ source: base ?? dir, ...result, flagged }, null, 2) + NL);
  console.log(`  wrote ${outDir}/${name}.csv and .json`);
  for (const r of result.rows.slice(0, 12))
    console.log(`   ${r.flagged ? "▸" : " "} ${r.patient.padEnd(18)} K=${String(r.khorana).padEnd(3)} ${(r.onAnticoagulant ? "yes" : "no").padEnd(3)} ${r.verdict}`);
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
