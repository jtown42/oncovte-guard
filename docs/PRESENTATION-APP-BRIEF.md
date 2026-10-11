# Presentation-readiness brief for the app (received 2026-10-11)

> Saved verbatim. It lists what the app must show so screenshots and the James clip match
> `submission/FINAL-TALK-SCRIPT.md`. The status of each item is recorded at the end.

## Purpose

The AMIA presentation script is **frozen**. This brief tells you (the coding agent) exactly what the app must show on screen so that the screenshots and the one embedded video match the spoken words. Every item below is a thing the presenter *says out loud* — if the app's output disagrees with the script by even a word (a different verdict label, a missing source line, a wrong number), the screenshot is wrong and the talk breaks.

Two hard constraints from the venue:
- **The demo is pre-captured.** No live internet, provided Windows PC. The app is used only to (a) capture still screenshots and (b) record one ~15-second clip of the James toggle. It will **not** run live on stage.
- **The live site must still work on a phone over cellular**, because the final slide has a QR code the audience scans to try it themselves.

Do not refactor the clinical engine or change any rule. The clinical logic was audited and locked in prior rounds. This is an **alignment + presentation-readiness** pass only. If you believe a rule is wrong, flag it — do not silently change it.

---

## 1. Presentation mode must be screenshot-grade

The script relies on a presentation mode that enlarges the **verdict, risk score, and CrCl** so they're legible from the back of a conference hall.

- Confirm `?present=true` (or equivalent) exists and enlarges: the verdict banner, the Khorana score, CrCl, and the per-agent recommendation cards.
- In this mode, **every per-agent card must show its guideline source text** (e.g., the NCCN/ITAC/label basis). The whole talk is "guideline → rule → code → test → decision" — if a screenshot shows a recommendation with no visible source, the central claim is unsupported on screen. This is the single most important visual requirement.
- Struck-through / ruled-out agents must show a **short reason inline** (e.g., "avoid — itraconazole interaction"), not just a strikethrough.
- Verify it renders cleanly at the projector resolution (assume 1920×1080) with no clipped text, no horizontal scroll, and no tooltip-only information (tooltips don't appear in screenshots).

---

## 2. Commit exact demo patient data (screenshots must be reproducible)

All five synthetic FHIR R4 bundles must be committed with the **corrected RxNorm codes** from the 22-code fix, so the screenshots show the committed state and never drift. Add/confirm a test that locks each demo bundle's codes to the intended drug by name (you already added this — confirm it covers all five patients).

The two patients in the default spoken run, plus the backup, must produce these exact outputs:

### Maria Santos (clean DOAC case)
- Pancreatic cancer (C25.x), Khorana **5**.
- Verdict must read: **Recommend — apixaban 2.5 mg PO BID or rivaroxaban 10 mg PO daily.**
- Both oral cards must display their guideline source.
- Nothing ruled out; CrCl computed with the adjusted-body-weight rule (her result is unchanged — confirm the verdict is identical before and after the ABW change so the screenshot is stable).

### James Chen (the money case — must be perfect)
- Mantle cell lymphoma (C83.1x), on **itraconazole** + rituximab, Khorana **2**, CrCl ~67.
- With itraconazole present, verdict must read: **Recommend LMWH — enoxaparin 40 mg SC daily.**
- **Both** apixaban and rivaroxaban must be struck through, each with the reason shown as an interaction with itraconazole.
- The interaction reason text must be consistent with the spoken line: itraconazole is a **strong CYP3A4 + P-gp inhibitor → avoid both oral agents** (label-based). The card wording should say "avoid" and attribute it to the drug labeling, not say "blocks clearance." Match the script's pharmacology so a pharmacist in the room sees agreement between slide and voice.
- James's liver labs show **mild, recovering injury below** any hepatic block threshold — confirm the hepatic rules do NOT fire for him (they must not add a second reason that muddies the toggle).

### Dorothy Williams (backup slide — but screenshots still needed)
- **Change creatinine to 2.0** (if not already committed). At 2.8, CrCl ≈13 falls below the apixaban CrCl-15 floor, which makes apixaban *avoided* and yields "no safe agent" — this **contradicts the narration.** At 2.0, CrCl ≈18, so raising platelets past 50,000 gives: **apixaban — caution; rivaroxaban and LMWH — avoided.**
- Capture two states: platelets 42,000 → **contraindicated**; platelets >50,000 → the caution verdict above.

### Robert Johnson / Priya Patel
- Not in the spoken run, but keep them working and committed (Khorana 0 → not indicated; myeloma → excluded) in case of a backup question or deck fallback.

---

## 3. The what-if editor must be flawless for the James clip

This is the only moment with motion, and it's the thing both reviewers praised. The clip records: start on LMWH verdict → remove itraconazole → verdict re-runs to oral agents → add itraconazole back → returns to LMWH.

Requirements:
- **The toggle must re-run the full engine, not animate a cached result.** The whole point is that it re-decides deterministically. Confirm removing/adding itraconazole in the editor triggers a real re-evaluation.
- **It must be fully deterministic:** removing itraconazole always yields the identical oral-agent verdict; adding it back always yields the identical LMWH verdict. No flicker, no race, no partial render. Record only after you've confirmed it's stable across ~10 repetitions.
- **Transition should be visually clean** — the verdict and the two oral cards should update in one settled step, not a staggered cascade, so a 15-second silent clip reads clearly.
- No other UI should move during the toggle (no unrelated re-layout, no scroll jump, no spinner that lingers).
- Works in presentation mode at projector resolution with large type.

---

## 4. Traceability must be real and inspectable

The close is "every clinical rule is traceable from its source, to its implementation, to its test." That must be literally true in the repo, because a judge may open it.

- Confirm `VERIFICATION.md` (traceability matrix) maps **every** clinical rule → guideline source → code location → test name, with no orphan rules.
- Confirm it's current after the recent changes (CML exclusion, GI/GU caution expansion, rifampin/carbamazepine/phenytoin blocks, tucatinib + itraconazole×dabigatran as major, doxorubicin/vinblastine/dexamethasone downgrades, the three expert-guidance-based blocks, the adjusted-body-weight CrCl, the apixaban CrCl-15 floor, the weight-based LMWH dosing).
- Any rule changed in the last two rounds must have its matrix row and its test updated in the same commit.

---

## 5. Tests — boundary cases are the ones that matter on stage

The presenter does **not** recite "207 tests." He points to *what the important tests check*. Make sure those specific tests exist, are named clearly, and pass.

- **The 349 vs 350 platelet boundary is called out explicitly on the Proof slide.** There must be two named tests proving platelets 349 → 0 points and 350 → +1 point. If they're bundled into one parametrized test, split or name them so a reader finds exactly that boundary.
- Confirm boundary tests exist for every other Khorana threshold the audit specified (Hgb <10 vs 10.0, WBC >11 vs 11.0, BMI ≥35).
- Confirm the full suite passes and the count badge (currently 207) matches the actual passing count. If the number drifts, update the badge wherever it's displayed — do not let the slide badge and the real count disagree.
- Confirm the regression test that locks the 22 corrected RxNorm codes is present and passing.

---

## 6. Live deployment + QR + mobile

The final slide's QR code sends voters to the live app on their phones over cellular.

- Confirm the production site (oncovte-guard.pages.dev or current URL) is deployed from the latest commit with all five corrected patient bundles.
- **Mobile-responsive:** the landing + at least the demo patient views must be usable on a phone screen. A voter tapping the QR mid-session should reach a working demo in one or two taps, not a desktop-only layout.
- The URL encoded in the QR must be the exact live URL — generate the QR from the final deployed URL, not a staging one.
- Re-run the SMART Health IT sandbox launch against the updated bundles and capture a fresh sandbox screenshot; the old one is stale because all five records changed. (For the Proof slide's "launched on a real FHIR server" claim to hold, the current bundles must be the ones that launched.)

---

## 7. Capture outputs the presenter needs (deliverables)

Produce these and hand them back, named clearly:

1. **Stills (presentation mode, high-res):** Maria verdict; James *with* itraconazole (the starting still — LMWH, both orals struck through with reasons); Dorothy at 42k and at >50k; fresh sandbox-launch screenshot.
2. **James clip:** ~15 s, silent, MP4 / H.264, clean browser (no bookmarks bar, notifications off, single tab), projector resolution. Sequence: LMWH verdict hold ~2 s → remove itraconazole, re-run to orals, hold ~3 s → add back, return to LMWH, hold ~2 s → stop. Trim dead frames hard. No cursor drift, no scrolling, no stray clicks.
3. Confirm each still shows the **committed** patient data (not a locally edited state).

---

## Acceptance checklist (run before you hand back)

- [ ] Every recommendation card shows a visible guideline source in presentation mode.
- [ ] Maria → "Recommend: apixaban or rivaroxaban," sources shown, verdict identical pre/post ABW change.
- [ ] James → "Recommend LMWH (enoxaparin 40 mg SC daily)," both orals struck through with an itraconazole "avoid" reason attributed to labeling; hepatic rules do NOT fire.
- [ ] James toggle re-runs the real engine, deterministic across 10 repetitions, clean single-step transition.
- [ ] Dorothy creatinine = 2.0; 42k → contraindicated; >50k → apixaban caution, rivaroxaban + LMWH avoided.
- [ ] 349/350 boundary tests exist, are individually identifiable, and pass.
- [ ] Full test suite passes; displayed test-count badge matches reality.
- [ ] 22-code regression test passes; all five bundles committed with corrected codes.
- [ ] VERIFICATION.md current, no orphan rules, reflects all recent changes.
- [ ] Live site deployed from latest commit, mobile-usable, QR points to exact live URL.
- [ ] Fresh sandbox launch screenshot captured against updated bundles.
- [ ] All stills + James clip delivered and named.

---

## Do NOT do

- Do not change any clinical rule, threshold, or interaction rating. Flag, don't fix.
- Do not alter demo patient clinical values except the one approved change (Dorothy creatinine 2.8 → 2.0).
- Do not add features, UI tours, or animations beyond the single James toggle.
- Do not let the displayed test count, the traceability matrix, or the deployed bundles drift out of sync with each other.

---

## Status (2026-10-11)

| Checklist item | Status |
|---|---|
| Every card shows a guideline source in presentation mode | **Done.** Apixaban "NCCN VTE-B-2 · AVERT trial", rivaroxaban "NCCN VTE-B-2 · CASSINI trial", LMWH "NCCN VTE-B-2" (pancreatic: "NCCN VTE-B-2 footnote · CONKO-004 / FRAGEM"; weight-adjusted: "NCCN VTE-B-1"). Display only; no rule changed. |
| Maria: apixaban or rivaroxaban, sources shown, verdict unchanged by the ABW rule | **Done.** CrCl 115 → 85; both are "standard", so the verdict is identical. The hero now reads "Apixaban 2.5 mg PO BID **or** Rivaroxaban 10 mg PO daily". |
| James: LMWH, both orals struck through with an itraconazole "avoid" reason attributed to labeling; no hepatic rule | **Done.** Each struck-through oral reads "Avoid — Itraconazole interaction (FDA labeling). Strong dual CYP3A4 + P-gp inhibition markedly increases … exposure." Hepatic rule does not fire (test). |
| James toggle: real re-run, deterministic, single step | **Done.** Every edit calls `generateRecommendation` again (no cache). 10 remove/add cycles gave one identical outcome pair. |
| Dorothy creatinine 2.0; 42k contraindicated; >50k apixaban caution, rivaroxaban + LMWH avoided | **Done.** |
| 349/350 boundary tests named individually | **Already present:** "Test 5: platelets exactly 350 score (>= boundary)", "Test 6: platelets 349 do not score"; also Hgb 10.0/9.9, WBC 11.0/11.1, BMI 35.0/34.9 (`tests/core/khorana-engine.test.ts`). |
| Suite passes; badge matches | **208 / 208.** The script badge was updated to 208. |
| 22-code regression test; five bundles committed | **Done** ("F17: RxNav-verified ingredient codes"). |
| VERIFICATION.md current | **Done.** Rows added for F17, every F18 rule, and the card-source display. |
| Live site, mobile, QR | **Done.** On phones the verdict now comes first, with a patient switcher above it (desktop unchanged). QR `talk-assets/06-qr-live-demo.png` decodes to `https://oncovte-guard.pages.dev/`. |
| Fresh sandbox screenshots | `docs/screenshots/sandbox-james-2026-10-11.png` (after this pass, with the card sources and avoid reasons) plus `sandbox-{maria,james,dorothy}-2026-10-09.png`. **Note:** the public sandbox wiped uploaded data and its default practitioner on 2026-10-10. Bundles were re-uploaded on 2026-10-11, and the launch used encounter "NONE" with another practitioner. Re-upload before any future sandbox run. |
| Stills + clip delivered | `talk-assets/01…06` (see below). |

**Deliverables in `talk-assets/` (regenerate with `node scripts/capture-talk-assets.cjs`):**
- `01-maria-recommend.png`, `02-james-lmwh-start.png`, `03-dorothy-42k-contraindicated.png`, `04-dorothy-55k-apixaban-caution.png`: 1920×1080 presentation mode, captured at 2× (3840×2160).
- `05-james-toggle.mp4`: 14.5 s, silent, H.264, 1920×1080. LMWH for about 3.5 s, then the oral options for about 5.5 s, then LMWH again for about 4.5 s.
- `06-qr-live-demo.png`: QR code for the live URL.

**Flags (not changed, because the presenter's words or a rule are involved):**
1. **"Selects enoxaparin."** The app offers **enoxaparin or dalteparin** (both NCCN VTE-B-2 options) and shows both. To match the screen exactly, say "selects an injectable heparin, enoxaparin" or "the injectable heparins". The engine has no reason to prefer one LMWH, so this was not changed.
2. **The rest of the page moves during the clip.** The verdict area stays fixed, but the interaction alerts below it disappear and reappear as the decision changes. That is the engine changing its output; it is not a rendering glitch.
3. **"Edited" chip.** After any edit (the James toggle, Dorothy's slider), the rail shows an "Edited" chip next to the patient buttons. This is accurate, since the scenario was modified.
4. **Statistics in the script that are not yet in `docs/REFERENCES.md`:** Holmes et al., *JCO Oncology Practice* 2026 ("~6 in 10"), Butera et al., *ASH Education Program* 2025, and the pooled AVERT + CASSINI "RR 0.56". Verify each against the paper before it goes on a slide.
