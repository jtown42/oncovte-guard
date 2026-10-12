/**
 * Write the FHIR output bundles (F19) for the demo patients to fhir-output/,
 * for the HL7 validator and the sandbox round trip.
 *
 *   npx tsx scripts/export-fhir-output.ts
 *
 * Validate with the official HL7 validator (Java 11+):
 *   java -jar validator_cli.jar fhir-output/*.json -version 4.0.1 -tx n/a
 * Result 2026-10-11: all 7 bundles 0 errors. The only warnings are that the
 * local finding CodeSystem (non-drug DetectedIssue codes) is unpublished.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadSyntheticPatient, listSyntheticPatients } from "../src/fhir/standalone-loader";
import { assemblePatientData } from "../src/fhir/fhir-parser";
import { generateRecommendation } from "../src/core/recommendation";
import { buildFhirOutput } from "../src/fhir-output/build";
import { patientToScenario, scenarioToPatient } from "../src/standalone/scenario";
import type { PatientData } from "../src/types/patient";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fhir-output");
const NOW = new Date();
fs.mkdirSync(OUT, { recursive: true });

function write(file: string, p: PatientData, source?: PatientData) {
  const bundle = buildFhirOutput(p, generateRecommendation(p), { now: NOW, source });
  fs.writeFileSync(path.join(OUT, file), JSON.stringify(bundle, null, 2) + "\n");
  console.log("  ▸", file, "—", bundle.entry!.map((e) => e.resource!.resourceType).join(", "));
}

const slug = (n: string) => n.toLowerCase().replace(/[^a-z]+/g, "-");
const patients = listSyntheticPatients().map((s) => assemblePatientData(loadSyntheticPatient(s.index), NOW));
patients.forEach((p, i) => write(`${i + 1}-${slug(p.name)}.json`, p));

// The two what-if states the talk shows.
const james = patients[1];
const s = patientToScenario(james);
write("2b-james-chen-itraconazole-removed.json", scenarioToPatient({ ...s, medCodes: s.medCodes.filter((c) => c !== "28031") }), james);
const d = patients[2];
write("3b-dorothy-williams-platelets-55.json", { ...d, labs: { ...d.labs, platelets: { ...d.labs.platelets!, value: 55 } } }, d);
