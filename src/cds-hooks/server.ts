/**
 * CDS Hooks service endpoint (Express).
 *
 *   GET  /cds-services                       → discovery document
 *   POST /cds-services/oncovte-prophylaxis   → patient-view cards
 *   POST /cds-services/oncovte-ddi-check     → order-select DOAC-interaction cards
 *
 * Run with: npm run cds-server  (tsx src/cds-hooks/server.ts)
 */
import express, { type Request, type Response } from "express";
import cors from "cors";
import type { Bundle, MedicationRequest } from "fhir/r4";
import { DISCOVERY } from "./discovery";
import { prefetchToRawFHIRData } from "./prefetch";
import { assemblePatientData } from "../fhir/fhir-parser";
import { buildPatientViewCards, buildOrderSelectCards } from "./cards";
import type { CdsHookRequest, CdsResponse } from "./types";

const RXNORM_SYSTEM = "http://www.nlm.nih.gov/research/umls/rxnorm";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "4mb" }));

  // Discovery.
  app.get("/cds-services", (_req: Request, res: Response) => {
    res.json(DISCOVERY);
  });

  // patient-view: full prophylaxis assessment.
  app.post(
    "/cds-services/oncovte-prophylaxis",
    (req: Request, res: Response) => {
      try {
        const body = req.body as CdsHookRequest;
        const raw = prefetchToRawFHIRData(body.prefetch);
        const patient = assemblePatientData(raw, new Date());
        const response: CdsResponse = { cards: buildPatientViewCards(patient) };
        res.json(response);
      } catch (e) {
        res.status(400).json({ error: messageOf(e) });
      }
    },
  );

  // order-select: DOAC interaction screening for the order being composed.
  app.post(
    "/cds-services/oncovte-ddi-check",
    (req: Request, res: Response) => {
      try {
        const body = req.body as CdsHookRequest;
        const raw = prefetchToRawFHIRData(body.prefetch);
        const patient = assemblePatientData(raw, new Date());
        const ordered = extractOrderedMeds(body.context.draftOrders);
        const response: CdsResponse = {
          cards: buildOrderSelectCards(patient, ordered),
        };
        res.json(response);
      } catch (e) {
        res.status(400).json({ error: messageOf(e) });
      }
    },
  );

  return app;
}

/** Pull RxNorm-coded medications out of an order-select draftOrders Bundle. */
export function extractOrderedMeds(
  draftOrders: unknown,
): { rxnormCode: string; display: string }[] {
  const bundle = draftOrders as Bundle | undefined;
  if (!bundle || bundle.resourceType !== "Bundle" || !bundle.entry) return [];
  const out: { rxnormCode: string; display: string }[] = [];
  for (const entry of bundle.entry) {
    const r = entry.resource;
    if (!r || r.resourceType !== "MedicationRequest") continue;
    const mr = r as MedicationRequest;
    const coding = mr.medicationCodeableConcept?.coding?.find(
      (c) => c.system === RXNORM_SYSTEM,
    );
    if (!coding?.code) continue;
    out.push({
      rxnormCode: coding.code,
      display:
        coding.display ?? mr.medicationCodeableConcept?.text ?? coding.code,
    });
  }
  return out;
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// Start the server when invoked directly (tsx src/cds-hooks/server.ts).
const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  /server\.(ts|js)$/.test(process.argv[1]);

if (isMain) {
  const port = Number(process.env.PORT ?? 3000);
  createServer().listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(
      `OncoVTE Guard CDS Hooks service listening on http://localhost:${port}/cds-services`,
    );
  });
}
