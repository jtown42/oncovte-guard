/**
 * Sandbox round trip for the FHIR output layer (F19): write James's decision
 * to the public SMART Health IT R4 sandbox as a transaction, then read every
 * created resource back. Sandbox only; never a live chart.
 *
 *   npx tsx scripts/post-fhir-output.ts [patientIndex=1]
 *
 * Step 1 re-uploads the patient's source bundle (PUT, idempotent), because the
 * public sandbox periodically wipes uploaded data and the output references
 * those Observations/Conditions/MedicationRequests by id.
 */
import { loadSyntheticPatient } from "../src/fhir/standalone-loader";
import { assemblePatientData } from "../src/fhir/fhir-parser";
import { generateRecommendation } from "../src/core/recommendation";
import { buildFhirOutput, asTransaction } from "../src/fhir-output/build";
import type { Bundle } from "fhir/r4";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const BASE = process.env.FHIR_BASE ?? "https://r4.smarthealthit.org";
const index = Number(process.argv[2] ?? 1);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fhir(method: string, url: string, body?: unknown): Promise<any> {
  const res = await fetch(url.startsWith("http") ? url : `${BASE}/${url}`, {
    method,
    headers: { "Content-Type": "application/fhir+json", Accept: "application/fhir+json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}\n${JSON.stringify(json, null, 2).slice(0, 2000)}`);
  return json;
}

(async () => {
  // 1. Source data (idempotent PUTs).
  const files = fs.readdirSync(path.join(ROOT, "synthetic-patients")).filter((f) => f.startsWith(`patient-${index + 1}-`));
  const source: Bundle = JSON.parse(fs.readFileSync(path.join(ROOT, "synthetic-patients", files[0]), "utf8"));
  await fhir("POST", "", {
    resourceType: "Bundle",
    type: "transaction",
    entry: source.entry!.map((e) => ({
      resource: e.resource,
      request: { method: "PUT", url: `${e.resource!.resourceType}/${e.resource!.id}` },
    })),
  });
  console.log(`1. source bundle ${files[0]}: ${source.entry!.length} resources PUT`);

  // 2. The decision, as a transaction.
  const patient = assemblePatientData(loadSyntheticPatient(index));
  const rec = generateRecommendation(patient);
  const tx = asTransaction(buildFhirOutput(patient, rec));
  const resp = await fhir("POST", "", tx);
  const locations: string[] = resp.entry.map((e: any) => e.response.location.replace(/\/_history\/.*$/, ""));
  console.log(`2. FHIR output: ${tx.entry!.length} entries in → ${locations.length} created/updated`);
  for (const l of locations) console.log("     ", l);

  // 3. Read every one back and check the references were rewritten to server ids.
  let back = 0;
  for (const l of locations) {
    const r = await fhir("GET", l);
    if (JSON.stringify(r).includes("urn:uuid:")) throw new Error(`${l} still contains a urn:uuid reference`);
    back++;
  }
  console.log(`3. read back: ${back} / ${locations.length} resources, all references resolved to server ids`);

  const gr = locations.find((l) => l.startsWith("GuidanceResponse/"));
  console.log(`\nView: ${BASE}/${gr}`);
  const prov = locations.find((l) => l.startsWith("Provenance/"));
  console.log(`      ${BASE}/${prov}`);
})().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
