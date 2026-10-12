/**
 * Synthetic oncology panel for the Bulk Data screening demo (F20).
 *
 *   npx tsx scripts/gen-panel.ts
 *
 * Writes Bulk Data-style NDJSON (one file per resource type, as a $export
 * produces) to synthetic-panel/. Seeded, so the panel is identical on every run.
 *
 * THIS IS SYNTHETIC DATA WE GENERATED. Any count produced by screening it
 * (e.g. "N eligible patients not on prophylaxis") reflects the generator's
 * distributions, not a real population. It demonstrates the flow only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import kb from "../src/data/ddi-knowledge-base.json";
import { RXNORM } from "../src/data/rxnorm-codes";
import { LOINC } from "../src/data/loinc-codes";

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "synthetic-panel");
const N = 40;
const DATE = "2026-10-05";

// Seeded PRNG (mulberry32) and helpers.
let seed = 20261110;
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(xs: T[]): T => xs[Math.floor(rand() * xs.length)];
const normal = (mean: number, sd: number) => {
  const u = 1 - rand(), v = rand();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

const rx = (name: string) => {
  const a = kb.agents.find((x) => x.agentName === name);
  if (!a) throw new Error(`not in KB: ${name}`);
  return { code: a.rxnormCode, display: a.agentName };
};

// Cancer sites (ICD-10-CM) with a typical regimen; weights skew toward the
// sites an oncology clinic sees most.
const SITES = [
  { code: "C25.0", display: "Malignant neoplasm of head of pancreas", w: 4, chemo: ["Gemcitabine", "Paclitaxel protein-bound (nab-paclitaxel)"] },
  { code: "C16.9", display: "Malignant neoplasm of stomach", w: 2, chemo: ["Oxaliplatin", "Capecitabine"] },
  { code: "C34.1", display: "Malignant neoplasm of upper lobe, bronchus or lung", w: 7, chemo: ["Carboplatin", "Pemetrexed", "Pembrolizumab"] },
  { code: "C83.3", display: "Diffuse large B-cell lymphoma", w: 4, chemo: ["Rituximab", "Doxorubicin"] },
  { code: "C56.9", display: "Malignant neoplasm of ovary", w: 3, chemo: ["Carboplatin", "Paclitaxel"] },
  { code: "C67.9", display: "Malignant neoplasm of bladder", w: 2, chemo: ["Cisplatin", "Gemcitabine"] },
  { code: "C18.7", display: "Malignant neoplasm of sigmoid colon", w: 6, chemo: ["Oxaliplatin", "5-Fluorouracil", "Bevacizumab"] },
  { code: "C50.9", display: "Malignant neoplasm of breast", w: 8, chemo: ["Docetaxel", "Trastuzumab"] },
  { code: "C61", display: "Malignant neoplasm of prostate", w: 3, chemo: ["Docetaxel"] },
  { code: "C90.00", display: "Multiple myeloma not having achieved remission", w: 1, chemo: ["Carfilzomib", "Dexamethasone"] },
];
const weighted = () => {
  const total = SITES.reduce((s, x) => s + x.w, 0);
  let r = rand() * total;
  for (const s of SITES) if ((r -= s.w) < 0) return s;
  return SITES[0];
};

const GIVEN = ["Ana", "Ben", "Carla", "David", "Elena", "Frank", "Grace", "Hector", "Irene", "Jamal", "Keiko", "Luis", "Mei", "Nora", "Omar", "Paula", "Quinn", "Rosa", "Sam", "Tara"];
const FAMILY = ["Alvarez", "Brooks", "Cohen", "Diaz", "Evans", "Fischer", "Garcia", "Hughes", "Ito", "Jensen", "Kim", "Lopez", "Mensah", "Novak", "Okafor", "Patel", "Reyes", "Silva", "Tran", "Walsh"];

const out: Record<string, object[]> = { Patient: [], Condition: [], Observation: [], MedicationRequest: [] };
const ref = (id: string) => ({ reference: `Patient/${id}` });
const cat = (system: string, code: string) => [{ coding: [{ system, code }] }];

function obs(pid: string, key: string, category: string, loinc: string, value: number, unit: string, ucum: string) {
  out.Observation.push({
    resourceType: "Observation",
    id: `${pid}-${key}`,
    status: "final",
    category: cat("http://terminology.hl7.org/CodeSystem/observation-category", category),
    code: { coding: [{ system: "http://loinc.org", code: loinc }] },
    subject: ref(pid),
    effectiveDateTime: DATE,
    valueQuantity: { value, unit, system: "http://unitsofmeasure.org", code: ucum },
  });
}
function med(pid: string, key: string, m: { code: string; display: string }) {
  out.MedicationRequest.push({
    resourceType: "MedicationRequest",
    id: `${pid}-${key}`,
    status: "active",
    intent: "order",
    medicationCodeableConcept: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code: m.code, display: m.display }],
    },
    subject: ref(pid),
    authoredOn: DATE,
  });
}

for (let i = 1; i <= N; i++) {
  const pid = `panel-${String(i).padStart(2, "0")}`;
  const gender = rand() < 0.5 ? "female" : "male";
  const site = weighted();
  const sex = site.code.startsWith("C56") || site.code.startsWith("C50") ? "female" : site.code === "C61" ? "male" : gender;
  const age = Math.round(Math.min(88, Math.max(34, normal(64, 11))));

  out.Patient.push({
    resourceType: "Patient",
    id: pid,
    // Unique name per patient: given cycles every 20, family shifts by one each cycle.
    name: [{ family: FAMILY[((i - 1) * 3 + Math.floor((i - 1) / 20)) % FAMILY.length], given: [GIVEN[(i - 1) % GIVEN.length]] }],
    gender: sex,
    birthDate: `${2026 - age}-0${1 + (i % 9)}-15`,
  });
  out.Condition.push({
    resourceType: "Condition",
    id: `${pid}-cancer`,
    clinicalStatus: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/condition-clinical", code: "active" }] },
    category: cat("http://terminology.hl7.org/CodeSystem/condition-category", "problem-list-item"),
    code: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10-cm", code: site.code, display: site.display }], text: site.display },
    subject: ref(pid),
  });

  const plt = Math.round(rand() < 0.25 ? normal(410, 45) : normal(250, 70));
  const hgb = round(rand() < 0.3 ? normal(9.2, 0.6) : normal(12.2, 1.2));
  const wbc = round(rand() < 0.25 ? normal(13, 1.5) : normal(7.5, 2));
  const scr = round(rand() < 0.12 ? normal(2.0, 0.4) : normal(0.95, 0.2), 2);
  const heightCm = Math.round(sex === "female" ? normal(163, 6) : normal(177, 7));
  const bmi = rand() < 0.2 ? normal(37, 2) : normal(27, 4);
  const weightKg = round(bmi * (heightCm / 100) ** 2);

  obs(pid, "plt", "laboratory", LOINC.PLATELETS, Math.max(20, plt), "10*3/uL", "10*3/uL");
  obs(pid, "hgb", "laboratory", LOINC.HEMOGLOBIN, hgb, "g/dL", "g/dL");
  obs(pid, "wbc", "laboratory", LOINC.WBC, Math.max(1.5, wbc), "10*3/uL", "10*3/uL");
  obs(pid, "scr", "laboratory", LOINC.SERUM_CREATININE, Math.max(0.5, scr), "mg/dL", "mg/dL");
  obs(pid, "wt", "vital-signs", LOINC.BODY_WEIGHT, weightKg, "kg", "kg");
  obs(pid, "ht", "vital-signs", LOINC.BODY_HEIGHT, heightCm, "cm", "cm");

  site.chemo.forEach((c, j) => med(pid, `chemo${j}`, rx(c)));
  if (rand() < 0.1) med(pid, "interacting", rx(pick(["Itraconazole", "Rifampin", "Carbamazepine", "Posaconazole"])));
  // Some patients are already anticoagulated (prophylaxis or treatment).
  if (rand() < 0.3) {
    const a = pick([
      { code: RXNORM.APIXABAN, display: "apixaban" },
      { code: RXNORM.ENOXAPARIN, display: "enoxaparin" },
      { code: RXNORM.RIVAROXABAN, display: "rivaroxaban" },
    ]);
    med(pid, "anticoag", a);
  }
}

fs.mkdirSync(OUT, { recursive: true });
for (const [type, rows] of Object.entries(out)) {
  fs.writeFileSync(path.join(OUT, `${type}.ndjson`), rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  console.log(`  ▸ ${type}.ndjson — ${rows.length}`);
}
