/**
 * Application shell. Two launch modes share the exact same parsing + rendering
 * path (assemblePatientData → Dashboard):
 *
 *   1. SMART-on-FHIR — when the page is loaded as an OAuth2 redirect (a `code`
 *      param is present, or fhirclient has stored launch state), resolve the
 *      authorized client and fetch live data.
 *   2. Standalone demo — otherwise, present a picker over the five synthetic
 *      patients so the app is fully explorable without an EHR sandbox.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { PatientData } from "./types/patient";
import { Dashboard } from "./components/Dashboard";
import { ScenarioEditor } from "./components/ScenarioEditor";
import { assemblePatientData } from "./fhir/fhir-parser";
import {
  listSyntheticPatients,
  loadSyntheticPatient,
} from "./fhir/standalone-loader";
import {
  type Scenario,
  scenarioToPatient,
  patientToScenario,
} from "./standalone/scenario";
import { initSmartClient } from "./fhir/smart-launch";
import { fetchPatientData } from "./fhir/fhir-client";
import { getAsOfDate } from "./ui/asof";
import { useNarrow, NARROW_QUERY } from "./ui/useNarrow";

type Mode = "smart" | "standalone";

function detectMode(): Mode {
  if (typeof window === "undefined") return "standalone";
  const params = new URLSearchParams(window.location.search);
  // A `code`/`state` param means we returned from the EHR's auth server;
  // SMART_KEY in sessionStorage means fhirclient has an in-flight launch.
  if (params.has("code") || params.has("state")) return "smart";
  if (sessionStorage.getItem("SMART_KEY")) return "smart";
  return "standalone";
}

/** Presentation mode is opt-in via `?present=true` or the on-screen toggle. */
function detectPresent(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("present") === "true";
}

export function App() {
  const mode = useMemo(detectMode, []);
  const [present, setPresent] = useState(detectPresent);

  const togglePresent = () => {
    setPresent((v) => {
      const next = !v;
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (next) url.searchParams.set("present", "true");
        else url.searchParams.delete("present");
        window.history.replaceState({}, "", url);
      }
      return next;
    });
  };

  return (
    <div className={`min-h-screen ${present ? "present" : ""}`}>
      <TopBar mode={mode} present={present} onTogglePresent={togglePresent} />
      <main
        className={`mx-auto px-4 pb-24 pt-4 lg:pb-4 ${mode === "standalone" ? "max-w-7xl" : "max-w-6xl"}`}
      >
        {mode === "smart" ? <SmartView /> : <StandaloneView />}
      </main>
    </div>
  );
}

function TopBar({
  mode,
  present,
  onTogglePresent,
}: {
  mode: Mode;
  present: boolean;
  onTogglePresent: () => void;
}) {
  return (
    <header className="relative border-b border-clinical-border bg-clinical-panel">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-clinical-brand text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden
          >
            <path d="M16 5l9 3v6c0 6-4 10-9 13-5-3-9-7-9-13V8z" fill="#fff" />
            <path
              d="M11 15l3.5 3.5L21 12"
              stroke="#3A6B5C"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="font-serif text-base font-semibold tracking-tight text-clinical-ink">
            OncoVTE Guard
          </p>
          <p className="present-hide hidden text-xs text-clinical-muted sm:block">
            Cancer-associated VTE prophylaxis · DOAC interaction CDS
          </p>
        </div>
        <button
          onClick={onTogglePresent}
          className={`ml-auto hidden rounded-sm px-2.5 py-1 text-xs font-medium transition lg:inline-block ${
            present
              ? "bg-clinical-brand text-white"
              : "border border-clinical-border text-clinical-muted hover:border-clinical-brand hover:text-clinical-brand"
          }`}
          aria-pressed={present}
          title="Enlarge type and reduce chrome for stage projection"
        >
          {present ? "Exit presentation" : "Presentation mode"}
        </button>
        <span className="present-hide ml-auto rounded-sm border border-clinical-hairline lg:ml-0 bg-clinical-bg px-2.5 py-1 text-xs font-medium text-clinical-muted">
          {mode === "smart" ? "SMART-on-FHIR" : "Standalone demo"}
        </span>
      </div>
    </header>
  );
}

/* ---------- SMART mode ---------- */

function SmartView() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "ready"; patient: PatientData }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const client = await initSmartClient();
        const raw = await fetchPatientData(client);
        const patient = assemblePatientData(raw, getAsOfDate());
        if (!cancelled) setState({ kind: "ready", patient });
      } catch (e) {
        if (!cancelled)
          setState({
            kind: "error",
            message: e instanceof Error ? e.message : String(e),
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading")
    return <Centered>Loading patient data…</Centered>;
  if (state.kind === "error")
    return (
      <Centered>
        <p className="font-semibold text-sev-danger">Could not load EHR data</p>
        <p className="mt-1 text-sm text-clinical-muted">{state.message}</p>
      </Centered>
    );
  return <Dashboard patient={state.patient} />;
}

/* ---------- Standalone demo mode ---------- */

/** Parse preset `index` from its FHIR bundle. */
function presetPatient(index: number): PatientData {
  return assemblePatientData(loadSyntheticPatient(index), getAsOfDate());
}

/** Load preset `index` and seed an editable scenario from it. */
function presetScenario(index: number): Scenario {
  return patientToScenario(presetPatient(index));
}

/**
 * Which preset to open first: `?patient=<first name>` if given, otherwise
 * James on a phone (the QR code from the talk lands on the story the audience
 * just heard) and Maria on a wide screen.
 */
function initialPreset(roster: { index: number; name: string }[]): number {
  if (typeof window === "undefined") return 0;
  const want = new URLSearchParams(window.location.search).get("patient");
  if (want) {
    const hit = roster.find(
      (p) => p.name.split(" ")[0].toLowerCase() === want.toLowerCase(),
    );
    if (hit) return hit.index;
  }
  if (window.matchMedia(NARROW_QUERY).matches) {
    const james = roster.find((p) => p.name.startsWith("James"));
    if (james) return james.index;
  }
  return 0;
}

function StandaloneView() {
  const roster = useMemo(() => listSyntheticPatients(), []);
  const narrow = useNarrow();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [first] = useState(() => initialPreset(roster));
  const [scenario, setScenario] = useState<Scenario>(() =>
    presetScenario(first),
  );
  // The currently-loaded preset, or null once the user diverges ("custom").
  const [activePreset, setActivePreset] = useState<number | null>(first);
  // The preset the scenario was seeded from (kept after edits), so the FHIR
  // output can point at that patient's real source resources.
  const [sourceIndex, setSourceIndex] = useState(first);
  const source = useMemo(() => presetPatient(sourceIndex), [sourceIndex]);

  const patient = useMemo(() => scenarioToPatient(scenario), [scenario]);

  const loadPreset = (index: number) => {
    setScenario(presetScenario(index));
    setActivePreset(index);
    setSourceIndex(index);
  };
  const change = (patch: Partial<Scenario>) => {
    setScenario((s) => ({ ...s, ...patch }));
    setActivePreset(null);
  };

  const editor = (
    <ScenarioEditor
      scenario={scenario}
      presets={roster.map((p) => ({ index: p.index, name: p.name }))}
      activePreset={activePreset}
      onLoadPreset={loadPreset}
      onChange={change}
      showPresets={!narrow}
    />
  );

  if (narrow) {
    // Phone layout (the talk's QR code): the controls come first so a visitor
    // can change something the moment the page loads; the verdict stays in
    // view through the pinned bar at the bottom (RecommendationPanel), and the
    // full dashboard follows. Patients live in a pull-up sheet. Same engine,
    // same components as the wide layout — only the order differs.
    const current = sourceIndex;
    return (
      <div>
        <div className="mb-3 flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm leading-snug text-clinical-muted">
            <span className="font-semibold text-clinical-ink">
              Synthetic patient.
            </span>{" "}
            Change anything — the verdict at the bottom updates live.
            {activePreset !== null &&
              roster[activePreset]?.name.startsWith("James") && (
                <>
                  {" "}
                  Try removing{" "}
                  <span className="font-medium text-clinical-ink">
                    itraconazole
                  </span>
                  .
                </>
              )}
          </p>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="min-h-[44px] shrink-0 rounded-md border border-clinical-border bg-white px-3 text-sm font-medium text-clinical-ink"
            aria-haspopup="dialog"
          >
            {roster[current].name.split(" ")[0]}
             ▾
          </button>
        </div>
        {editor}
        <div className="mt-3">
          <Dashboard patient={patient} source={source} />
        </div>
        {sheetOpen && (
          <PatientSheet
            roster={roster}
            active={activePreset}
            onPick={(i) => {
              loadPreset(i);
              setSheetOpen(false);
              window.scrollTo({ top: 0 });
            }}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[20rem_minmax(0,1fr)] items-start gap-4">
      {/* Sticky control rail — the verdict on the right stays in view while
          a slider is dragged. */}
      <aside className="sticky top-4 max-h-[calc(100vh-1.5rem)] overflow-y-auto pr-1">
        {editor}
        <p className="present-hide mt-3 px-1 text-xs text-clinical-muted">
          Synthetic data — no PHI. Every edit re-runs the real clinical engine.
        </p>
      </aside>
      <div className="min-w-0">
        <Dashboard patient={patient} source={source} />
      </div>
    </div>
  );
}

/** Phone-only pull-up list of the example patients. */
function PatientSheet({
  roster,
  active,
  onPick,
  onClose,
}: {
  roster: { index: number; name: string }[];
  active: number | null;
  onPick: (index: number) => void;
  onClose: () => void;
}) {
  const details = useMemo(
    () =>
      roster.map((r) => {
        const p = presetPatient(r.index);
        const dx = p.activeCancerConditions[0]?.display ?? "No active cancer";
        return `${p.age} ${p.gender === "female" ? "F" : "M"} · ${dx}`;
      }),
    [roster],
  );
  return (
    <div
      className="fixed inset-0 z-40 flex items-end bg-black/40"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Example patients"
    >
      <div
        className="w-full rounded-t-2xl bg-clinical-panel px-4 pb-6 pt-3 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-clinical-border" />
        <p className="mb-2 text-sm font-semibold text-clinical-ink">
          Example patients (synthetic)
        </p>
        <ul className="divide-y divide-clinical-hairline">
          {roster.map((r, i) => (
            <li key={r.index}>
              <button
                type="button"
                onClick={() => onPick(r.index)}
                className={`flex min-h-[56px] w-full flex-col justify-center px-2 text-left ${
                  active === r.index
                    ? "text-clinical-brand"
                    : "text-clinical-ink"
                }`}
              >
                <span className="text-base font-semibold">
                  {r.name}
                  {active === r.index && " ✓"}
                </span>
                <span className="text-sm text-clinical-muted">
                  {details[i]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">{children}</div>
  );
}
