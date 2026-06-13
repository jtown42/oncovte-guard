/**
 * Generator for the 5 synthetic FHIR R4 patient bundles (Part 7 + Part 18).
 * RxNorm codes follow ERRATA Issue 3 (Maria's nab-paclitaxel = 686924).
 * Run: node scripts/gen-patients.cjs
 */
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "synthetic-patients");
fs.mkdirSync(OUT, { recursive: true });

const RACE = {
  white: { code: "2106-3", display: "White" },
  black: { code: "2054-5", display: "Black or African American" },
  asian: { code: "2028-9", display: "Asian" },
};
const ETHNICITY = {
  hispanic: { code: "2135-2", display: "Hispanic or Latino" },
  nonHispanic: { code: "2186-5", display: "Not Hispanic or Latino" },
};

function raceExt(r) {
  return {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
    extension: [
      {
        url: "ombCategory",
        valueCoding: {
          system: "urn:oid:2.16.840.1.113883.6.238",
          code: r.code,
          display: r.display,
        },
      },
      { url: "text", valueString: r.display },
    ],
  };
}
function ethnicityExt(e) {
  return {
    url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
    extension: [
      {
        url: "ombCategory",
        valueCoding: {
          system: "urn:oid:2.16.840.1.113883.6.238",
          code: e.code,
          display: e.display,
        },
      },
      { url: "text", valueString: e.display },
    ],
  };
}

function patientResource(p) {
  return {
    resource: {
      resourceType: "Patient",
      id: p.id,
      name: [{ use: "official", family: p.family, given: [p.given] }],
      gender: p.gender,
      birthDate: p.birthDate,
      extension: [raceExt(p.race), ethnicityExt(p.ethnicity)],
    },
  };
}

function conditionResource(p, idx) {
  return {
    resource: {
      resourceType: "Condition",
      id: `condition-${idx}`,
      clinicalStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/condition-clinical",
            code: "active",
            display: "Active",
          },
        ],
      },
      verificationStatus: {
        coding: [
          {
            system:
              "http://terminology.hl7.org/CodeSystem/condition-ver-status",
            code: "confirmed",
            display: "Confirmed",
          },
        ],
      },
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-category",
              code: "encounter-diagnosis",
              display: "Encounter Diagnosis",
            },
          ],
        },
      ],
      code: {
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10-cm",
            code: p.condition.code,
            display: p.condition.display,
          },
        ],
        text: p.condition.text,
      },
      subject: { reference: `Patient/${p.id}` },
    },
  };
}

function obs(p, id, category, loinc, loincDisplay, value, unit, date) {
  return {
    resource: {
      resourceType: "Observation",
      id,
      status: "final",
      category: [
        {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/observation-category",
              code: category,
              display: category === "laboratory" ? "Laboratory" : "Vital Signs",
            },
          ],
        },
      ],
      code: {
        coding: [
          { system: "http://loinc.org", code: loinc, display: loincDisplay },
        ],
      },
      subject: { reference: `Patient/${p.id}` },
      effectiveDateTime: date,
      valueQuantity: {
        value,
        unit,
        system: "http://unitsofmeasure.org",
        code: unit,
      },
    },
  };
}

function medResource(p, med) {
  return {
    resource: {
      resourceType: "MedicationRequest",
      id: `medrx-${med.id}-${p.id.split("-")[1]}`,
      status: "active",
      intent: "order",
      medicationCodeableConcept: {
        coding: [
          {
            system: "http://www.nlm.nih.gov/research/umls/rxnorm",
            code: med.code,
            display: med.display,
          },
        ],
        text: med.text || med.display,
      },
      subject: { reference: `Patient/${p.id}` },
    },
  };
}

function buildBundle(p) {
  const d = p.labDate;
  const entries = [
    patientResource(p),
    conditionResource(p, p.id.split("-")[1]),
    obs(p, `obs-platelets-${p.n}`, "laboratory", "777-3", "Platelets [#/volume] in Blood by Automated count", p.labs.plt, "10*3/uL", d),
    obs(p, `obs-hemoglobin-${p.n}`, "laboratory", "718-7", "Hemoglobin [Mass/volume] in Blood", p.labs.hgb, "g/dL", d),
    obs(p, `obs-wbc-${p.n}`, "laboratory", "6690-2", "Leukocytes [#/volume] in Blood by Automated count", p.labs.wbc, "10*3/uL", d),
    obs(p, `obs-creatinine-${p.n}`, "laboratory", "2160-0", "Creatinine [Mass/volume] in Serum or Plasma", p.labs.scr, "mg/dL", d),
    obs(p, `obs-weight-${p.n}`, "vital-signs", "29463-7", "Body weight", p.weightKg, "kg", d),
    obs(p, `obs-height-${p.n}`, "vital-signs", "8302-2", "Body height", p.heightCm, "cm", d),
    ...p.meds.map((m) => medResource(p, m)),
  ];
  return { resourceType: "Bundle", type: "collection", entry: entries };
}

const patients = [
  {
    n: 1, id: "patient-1", file: "patient-1-maria-santos.json",
    given: "Maria", family: "Santos", gender: "female", birthDate: "1968-03-15",
    race: RACE.white, ethnicity: ETHNICITY.hispanic,
    weightKg: 95, heightCm: 162, labDate: "2026-06-04",
    condition: { code: "C25.1", display: "Malignant neoplasm of body of pancreas", text: "Pancreatic adenocarcinoma" },
    labs: { plt: 410, hgb: 9.2, wbc: 8.5, scr: 0.8 },
    meds: [
      { id: "gemcitabine", code: "12574", display: "gemcitabine", text: "Gemcitabine" },
      { id: "nab-paclitaxel", code: "686924", display: "paclitaxel protein-bound", text: "nab-Paclitaxel (paclitaxel protein-bound)" },
    ],
  },
  {
    n: 2, id: "patient-2", file: "patient-2-james-chen.json",
    given: "James", family: "Chen", gender: "male", birthDate: "1954-01-20",
    race: RACE.asian, ethnicity: ETHNICITY.nonHispanic,
    weightKg: 78, heightCm: 175, labDate: "2026-05-30",
    condition: { code: "C83.1", display: "Mantle cell lymphoma", text: "Mantle cell lymphoma" },
    labs: { plt: 195, hgb: 11.8, wbc: 12.3, scr: 1.1 },
    meds: [
      { id: "ibrutinib", code: "1442981", display: "ibrutinib", text: "Ibrutinib" },
      { id: "rituximab", code: "121191", display: "rituximab", text: "Rituximab" },
    ],
  },
  {
    n: 3, id: "patient-3", file: "patient-3-dorothy-williams.json",
    given: "Dorothy", family: "Williams", gender: "female", birthDate: "1944-09-01",
    race: RACE.black, ethnicity: ETHNICITY.nonHispanic,
    weightKg: 52, heightCm: 155, labDate: "2026-06-06",
    condition: { code: "C34.1", display: "Malignant neoplasm of upper lobe, bronchus or lung", text: "Non-small cell lung cancer" },
    labs: { plt: 42, hgb: 8.9, wbc: 14.2, scr: 2.8 },
    meds: [
      { id: "carboplatin", code: "40048", display: "carboplatin", text: "Carboplatin" },
      { id: "pemetrexed", code: "258702", display: "pemetrexed", text: "Pemetrexed" },
      { id: "pembrolizumab", code: "1547545", display: "pembrolizumab", text: "Pembrolizumab" },
    ],
  },
  {
    n: 4, id: "patient-4", file: "patient-4-robert-johnson.json",
    given: "Robert", family: "Johnson", gender: "male", birthDate: "1960-11-02",
    race: RACE.white, ethnicity: ETHNICITY.nonHispanic,
    weightKg: 82, heightCm: 178, labDate: "2026-04-25",
    condition: { code: "C18.4", display: "Malignant neoplasm of transverse colon", text: "Colorectal adenocarcinoma" },
    labs: { plt: 280, hgb: 12.5, wbc: 7.8, scr: 1.0 },
    meds: [
      { id: "fluorouracil", code: "4492", display: "fluorouracil", text: "5-Fluorouracil" },
      { id: "oxaliplatin", code: "32592", display: "oxaliplatin", text: "Oxaliplatin" },
      { id: "bevacizumab", code: "253337", display: "bevacizumab", text: "Bevacizumab" },
    ],
  },
  {
    n: 5, id: "patient-5", file: "patient-5-priya-patel.json",
    given: "Priya", family: "Patel", gender: "female", birthDate: "1971-02-10",
    race: RACE.asian, ethnicity: ETHNICITY.nonHispanic,
    weightKg: 68, heightCm: 163, labDate: "2026-06-02",
    condition: { code: "C90.00", display: "Multiple myeloma not having achieved remission", text: "Multiple myeloma" },
    labs: { plt: 165, hgb: 9.5, wbc: 5.2, scr: 1.3 },
    meds: [
      { id: "lenalidomide", code: "321191", display: "lenalidomide", text: "Lenalidomide" },
      { id: "dexamethasone", code: "3264", display: "dexamethasone", text: "Dexamethasone" },
      { id: "bortezomib", code: "358258", display: "bortezomib", text: "Bortezomib" },
    ],
  },
];

for (const p of patients) {
  const bundle = buildBundle(p);
  fs.writeFileSync(
    path.join(OUT, p.file),
    JSON.stringify(bundle, null, 2) + "\n",
    "utf8",
  );
  console.log("wrote", p.file, "-", bundle.entry.length, "resources");
}
