/**
 * SMART-on-FHIR launch handling (Part 17).
 * Wraps fhirclient's OAuth2 handshake. launch.html calls FHIR.oauth2.authorize();
 * after the EHR redirects back, initSmartClient() resolves the ready client.
 */

import FHIR from "fhirclient";
import type Client from "fhirclient/lib/Client";

export const SMART_CLIENT_ID = "oncovte-guard";
export const SMART_SCOPE =
  "launch patient/Patient.read patient/Condition.read patient/Observation.read patient/MedicationRequest.read";

/** True when the current URL looks like a SMART launch/redirect. */
export function isSmartLaunch(
  search: string = typeof window !== "undefined" ? window.location.search : "",
): boolean {
  const params = new URLSearchParams(search);
  return params.has("iss") || params.has("launch") || params.has("code");
}

/** Begin the SMART authorization handshake (called from launch.html). */
export function beginSmartAuthorization(redirectUri = "/index.html"): void {
  FHIR.oauth2.authorize({
    clientId: SMART_CLIENT_ID,
    scope: SMART_SCOPE,
    redirectUri,
  });
}

/** Resolve the authorized FHIR client after the OAuth2 redirect. */
export async function initSmartClient(): Promise<Client> {
  return FHIR.oauth2.ready();
}
