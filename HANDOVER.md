# ClinTrace360 — Agent Handover

> Last updated: 2026-06-20. Read this first, then `PROJECT_CONTEXT.md` (quick state) and `ClinTrace360_PROJECT_PLAN.md` (authoritative roadmap).

---

## 1. What this project is

ClinTrace360 is a **browser-based Clinical Data Quality & Protocol-to-DQP workbench**, built as a **portfolio piece** to demonstrate Clinical Data Scientist workflows (the user, Priyam, is targeting Novartis-style CDM/clinical-data-science roles).

- **No backend, no API key, no real data.** Everything runs client-side.
- All data is **synthetic CDISC-style**, generated deterministically in-app (seeded — same output every load).
- Positioning: feels like an internal clinical ops/data-management tool, **not** a consumer landing page. Keep it sober, dense, audit-friendly.
- **Do not claim** production validation, real patient data handling, or real EDC integration anywhere in code or copy.

---

## 2. Stack & key facts

| Thing | Value |
|---|---|
| Framework | React **19** + Vite **7** |
| Charts | Recharts 3.5 |
| Icons | lucide-react 0.556 |
| Styling | Plain CSS, `src/styles.css` (~1094 lines, dark design system) |
| App code | `src/ClinTrace360.jsx` — **single file, ~1752 lines** |
| Entry | `src/main.jsx` (mounts root + ErrorBoundary), `index.html` (DM Sans + DM Mono fonts) |
| Build config | `vite.config.js` — `base: "/"`, manualChunks: recharts→`charts`, lucide-react→`icons` |
| Repo | https://github.com/priyamthakar/ClinTrace360 (branch `main`) |
| Live deploy | https://clin-trace360.vercel.app (Vercel, **auto-deploys on push to `main`**) |
| Design tokens | `--bg: #0E0F11`, `--accent: #5E6AD2` (dark enterprise, Linear × Sentry hybrid) |

### Run / build
```powershell
npm install
npm run dev          # → http://127.0.0.1:5173
npm run build        # production build to dist/
npm run preview      # serve the built dist/
```

### ⚠️ Critical gotcha (has bitten before, twice)
**Never import a Lucide icon whose name shadows a JS built-in** (`Map`, `Set`, `URL`, etc.). It silently overrides the global constructor and breaks the app. Always alias:
```js
import { Map as MapIcon } from "lucide-react";
```
This exact bug (the `Map` icon shadowing the `Map` constructor) was a real production break — see commit `8f12174`.

---

## 3. Current state (verified 2026-06-20)

### Build: ✅ passing
`npm run build` → `✓ built in 7.16s`, 2340 modules. Bundle: index 260 kB (gzip 79 kB), charts 384 kB (gzip 114 kB), icons 12 kB. No errors, no chunk-size warnings.

### Git: working tree has **3 uncommitted modified files**, branch is **0 commits ahead of origin**
```
 M .gitignore          → added ".vercel"
 M PROJECT_CONTEXT.md   → doc updates (Vercel URL, responsive CSS notes, caveats)
 M src/styles.css       → responsive CSS hardening (768px + 480px breakpoints)
```
**These changes are real, build-verified, and NOT yet committed.** The CSS changes add: horizontally scrollable tab rows, wrapping card-head actions, mobile topbar simplification, full-width mobile controls, one-column 480px layouts, and `min-width: 760px` on tables for horizontal scroll. Decide with the user whether to commit (see §7).

> Note: `git diff` warns "LF will be replaced by CRLF" — benign Windows line-ending noise, ignore.

### Last commit
`528b0f8 Add Rule Library module; fix CDISC mapper inaccuracies`

---

## 4. App architecture (`src/ClinTrace360.jsx`)

Single-file React app. Top-level export `ClinTrace360()` holds module state and memoizes all synthetic data. **Five modules**, switched by `activeModule` state (default `"review"`):

| `activeModule` | Component | Line | Purpose |
|---|---|---|---|
| `review` (default) | `DataReviewDashboard` | ~953 | KPIs, site findings bar chart, lab trajectories, AE panel, visit heatmap, audit findings log, CSV export |
| `recon` | `ReconciliationModule` | ~1173 | SAE/Lab reconciliation tabs + query log + CSV export |
| `dqp` | `ProtocolDqpModule` | ~1408 | Protocol synopsis → DQP package (sections, edit checks, UAT, risk checklist); NCT lookup; clipboard/TXT export; local history |
| `mapper` | `CrfMapperModule` | ~1268 | CRF → SDTM mapping (presets + freeform rows); CSV export; local history |
| `rules` | `RuleLibrary` | ~1674 | Reference catalog of all deterministic edit-check rules (newest module) |

### Shared building blocks
- `AppShell` (~860) — topbar, mobile nav, sidebar nav, main area. Reads a `modules` array (id/label/icon).
- `Kpi` (~909), `Card` (~919), `Badge` (~936), `ModuleHead` (~940) — reusable UI primitives.
- DQP helper tables: `DqpSections`, `EditCheckTable`, `UatTable`, `RiskChecklistTable` (~1605–1673).

### Data & logic (all deterministic, top of file)
- Constants: `SITES`, `VISITS`, `ANALYTES`, `QUERY_TEMPLATES`, `CRF_TEMPLATES`, `SAMPLE_PROTOCOL_TEXT`, `RULE_LIBRARY` (~line 159).
- `generateSyntheticTrialData()` → DM, SV, LB, AE, EX domains.
- `generateFindings(data)` → runs all edit-check rules (this is the engine `RuleLibrary` documents).
- `generateReconciliation(data)` → SAE/lab mismatch records + query log.

### Rule engine coverage (in `generateFindings`)
Missing visits · visit window violations · lab range violations · ALT >3× ULN · implausibly low hemoglobin · AE start before first dose · AE end before start · zero-AE site underreporting · age eligibility · first dose before consent · placebo-arm non-zero dosing · Drug A dose inconsistency.

`RULE_LIBRARY` (the reference table) mirrors these with rule IDs, domain, variable, condition/threshold, severity, and ICH/FDA regulatory basis.

---

## 5. What's DONE

- ✅ All 5 modules implemented and functional.
- ✅ Synthetic CDISC data (DM/SV/LB/AE/EX) + SAE safety DB + local lab feed.
- ✅ Full rule-based findings engine + reconciliation engine.
- ✅ Deterministic CRF→SDTM mapper (presets + freeform) with confidence + SDTMIG refs.
- ✅ Deterministic Protocol→DQP generator with ClinicalTrials.gov NCT lookup.
- ✅ CSV / TXT / clipboard exports across modules.
- ✅ Local-browser history for DQP packages and mapping sessions.
- ✅ Rule Library reference module.
- ✅ Dark enterprise design system; error boundary; vendor chunk splitting.
- ✅ Live on Vercel, auto-deploy on push to `main`.
- ✅ README with recruiter evaluation guide + skill-evidence mapping.
- ✅ Docs: `docs/DATA_MODEL.md`, `docs/DEPLOYMENT.md`.
- ✅ Responsive CSS hardening (768px/480px) — **uncommitted, build-verified** (see §3).

---

## 6. What's REMAINING (next-agent backlog)

Priority order suggested:

1. **Decide on the uncommitted changes** (§7) — commit or discard before any new work, so the tree is clean.
2. **Screenshots** — `docs/screenshots/` exists but is **EMPTY**. Capture from the live Vercel URL (or a real browser) and wire into README. Headless Chromium screenshotting **failed/crashed locally** in this environment (GPU init hang) — do not retry headless capture here; use the live site or ask the user to capture.
3. **Visual responsive QA** — verify the new 768px/480px CSS actually looks right on desktop + mobile widths (it builds, but was never eyeballed in a browser).
4. **Unit tests** — none exist yet. Target the pure functions: `generateFindings`, `generateReconciliation`, CRF mapping logic, DQP generation. These are deterministic, so they test cleanly.
5. **Optional/future** — LLM assistance for ambiguous sponsor-specific Protocol→DQP and CRF→SDTM content (currently 100% rule-based). Only if the user asks — it would add an API dependency the project deliberately avoids.

---

## 7. Open decisions for the next agent

- **Commit the working tree?** The 3 modified files (responsive CSS + docs + `.gitignore`) are coherent, build-verified, and already described in `PROJECT_CONTEXT.md` as done. A reasonable commit message: `Add responsive CSS hardening for tablet/mobile; ignore .vercel`. **Confirm with the user before committing or pushing** — pushing to `main` triggers a live Vercel redeploy.
- The repo working dir contains gitignored scratch artifacts (`cLINEVAL.zip`, `new index.html`, `dist/`, `node_modules/`). They're correctly gitignored; leave them or clean locally, but they won't enter the repo.

---

## 8. Conventions & guardrails

- Keep the **single-file React artifact** (`ClinTrace360.jsx`) unless the user explicitly asks for a larger refactor.
- Prefer **transparent, deterministic, rule-based** checks for any review/reconciliation feature.
- Honest limitations only: synthetic data, not a validated CDMS, no EDC integration, training/portfolio use.
- Editing the single JSX file: when using Edit, find the exact current string fresh (a past failed Edit left dead `Panel`/`KpiCard` aliases — don't trust remembered snippets).
- Codex review previously caught a mobile-nav regression (sidebar hidden with no fallback) — keep the `.mobile-nav` path working whenever you touch nav/layout CSS.
- Pushing to `main` = production deploy. Treat it as outward-facing; confirm first.

---

## 9. Quick orientation checklist for the next agent

```
[ ] git status                          # confirm the 3 uncommitted files still present
[ ] npm install (if node_modules stale) # node_modules currently present
[ ] npm run build                       # confirm still green
[ ] read PROJECT_CONTEXT.md             # detailed feature inventory
[ ] read ClinTrace360_PROJECT_PLAN.md   # authoritative roadmap
[ ] decide: commit working tree? (§7)   # ask user before push
```
