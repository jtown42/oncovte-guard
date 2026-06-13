/**
 * CDS Hooks 1.0 wire types (subset used by OncoVTE Guard).
 * Spec: https://cds-hooks.org/specification/current/
 */

export interface CdsService {
  hook: string;
  id: string;
  title?: string;
  description: string;
  /** FHIR read/search templates the EHR resolves and sends in `prefetch`. */
  prefetch?: Record<string, string>;
}

export interface CdsDiscovery {
  services: CdsService[];
}

export interface CdsHookRequest {
  hook: string;
  hookInstance: string;
  fhirServer?: string;
  fhirAuthorization?: {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    subject: string;
  };
  context: CdsContext;
  /** Resolved prefetch resources keyed by the template names we declared. */
  prefetch?: Record<string, unknown>;
}

export interface CdsContext {
  userId?: string;
  patientId?: string;
  encounterId?: string;
  /** order-select / order-sign: the draft orders the clinician is composing. */
  draftOrders?: unknown;
  selections?: string[];
  [k: string]: unknown;
}

export type CdsIndicator = "info" | "warning" | "critical";

export interface CdsSource {
  label: string;
  url?: string;
}

export interface CdsCard {
  uuid?: string;
  summary: string; // <= 140 characters per spec
  detail?: string; // markdown
  indicator: CdsIndicator;
  source: CdsSource;
  links?: { label: string; url: string; type: "absolute" | "smart" }[];
}

export interface CdsResponse {
  cards: CdsCard[];
}
