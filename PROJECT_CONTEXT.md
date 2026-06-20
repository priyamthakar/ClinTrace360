# ClinTrace360 Project Context

## Purpose

ClinTrace360 is a browser-based Clinical Data Quality and Protocol-to-DQP Workbench. It is being built to demonstrate practical Clinical Data Scientist workflows: protocol interpretation, Data Quality Plan generation, CRF-to-SDTM mapping, clinical data review, anomaly detection, SAE reconciliation, local lab reconciliation, and audit-ready query logging.

The target positioning is a pharma-facing portfolio tool for Clinical Data Scientist work. The app should feel like an internal clinical operations/data management workbench, not a consumer landing page.

## Current Stack

- Vite
- React 19
- Recharts
- lucide-react
- Plain CSS in `src/styles.css`
- Synthetic in-app data only for the current build

## Current Files

- `ClinTrace360_PROJECT_PLAN.md`: full original project plan and phase roadmap.
- `README.md`: project overview, modules, setup commands, methodology, and limitations.
- `LICENSE`: MIT license.
- `.gitignore`: excludes dependencies, build output, local env files, and OS noise.
- `vite.config.js`: Vite React config with relative static base and manual chunks for chart/icon vendor code.
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow.
- `docs/DATA_MODEL.md`: synthetic data model and rule-check documentation.
- `docs/DEPLOYMENT.md`: local build/preview and GitHub Pages deployment notes.
- `package.json`: Vite/React scripts and dependencies.
- `package-lock.json`: installed dependency lockfile.
- `index.html`: Vite entry HTML.
- `src/main.jsx`: React root mount.
- `src/ClinTrace360.jsx`: single-file React application, synthetic data generation, dashboard logic, reconciliation logic, CRF-to-SDTM mapping logic, and Protocol-to-DQP generation logic.
- `src/styles.css`: application styling.
- `dist/`: local production build output from `npm run build`.
- `node_modules/`: local dependencies from `npm install`.

## What Is Done Now

Phase 1 foundation, Phase 2 reconciliation, and the Phase 3 local assistant modules are now implemented in the runnable app.

Implemented so far:

- Vite React app scaffolded.
- Pharma-style app shell with dark sidebar navigation and white clinical work area.
- Module navigation added for:
  - Protocol to DQP
  - CRF to SDTM Mapper
  - Data Review Dashboard
  - SAE/Lab Reconciliation
  - Methodology
- Phase 1 Data Review Dashboard implemented as the active/default module.
- Synthetic CDISC-style data generation implemented for:
  - `DM` demographics
  - `SV` subject visits
  - `LB` laboratory results
  - `AE` adverse events
  - `EX` exposure/dosing
- Rule-based findings engine implemented for:
  - Missing visits
  - Visit window violations
  - Lab range violations
  - ALT greater than 3x ULN
  - Implausibly low hemoglobin
  - AE start before first dose
  - AE end before AE start
  - Zero-AE site underreporting signal
  - Age eligibility violation
  - First dose before consent
  - Placebo-arm non-zero dosing
  - Drug A dose inconsistency
- Dashboard UI implemented with:
  - KPI cards
  - Site-level findings stacked bar chart
  - Lab trajectory review panel
  - AE analysis panel
  - Visit compliance heatmap
  - Audit-style findings log table
- CSV export for visible findings implemented.
- Placeholder screens added for Phase 2 and Phase 3 modules so the navigation reflects the full roadmap without claiming unfinished functionality is complete.
- Phase 2 SAE/Lab Reconciliation module implemented.
- Synthetic safety database/SAE records added.
- Synthetic local lab feed added.
- SAE reconciliation implemented for:
  - Safety SAE missing from EDC serious AE records.
  - EDC serious AE missing from safety database.
  - SAE/AE term mismatch.
  - SAE/AE date mismatch.
  - SAE reporting timeline breach.
- Local lab reconciliation implemented for:
  - Local lab result missing from EDC LB domain.
  - EDC/local value mismatch.
  - EDC/local unit mismatch.
- Query log implemented with query ID, type, mismatch type, subject, query text, severity, status, timestamp, and source reference.
- CSV export implemented for the active reconciliation tab.
- CRF-to-SDTM Mapper implemented as a local deterministic module.
- Preset CRF templates implemented for:
  - Demographics
  - Vital signs
  - Adverse events
  - Concomitant medications
  - Lab results
- Freeform CRF field input implemented using `Label | Data Type | Codelist` rows.
- Mapping output table implemented with:
  - CRF field
  - data type
  - SDTM domain
  - SDTM variable
  - variable label
  - controlled terminology
  - mapping notes
  - confidence
  - SDTMIG reference
- CSV export implemented for SDTM mapping results.
- Protocol-to-DQP Generator implemented as a local deterministic module.
- Protocol synopsis textarea added with sample protocol content.
- Optional ClinicalTrials.gov NCT ID lookup UI added using the public API endpoint from the browser.
- Protocol signal extraction implemented for:
  - study title
  - phase
  - study design
  - endpoints
  - eligibility language
  - visit schedule terms
  - priority labs
  - safety monitoring terms
  - dosing/comparator signal
- Generated DQP output implemented with:
  - DQP document sections
  - edit check specifications
  - UAT test cases
  - risk-based data review checklist
- Copy-to-clipboard and TXT export implemented for the generated DQP package.
- Local browser history implemented for generated DQP packages.
- Local browser history implemented for CRF-to-SDTM mapping sessions.
- README created with setup instructions, module summary, methodology, and limitations.
- Vite config added for static deployment and cleaner vendor chunking.
- GitHub Pages workflow added.
- MIT license added.
- `.gitignore` added.
- Data model and deployment docs added.
- Stale About-panel wording corrected so it no longer describes implemented modules as future work.
- Methodology/About screen added with honest limitations: synthetic data only, not a validated CDMS, no EDC integration, and training/portfolio use only.
- README updated with recruiter evaluation guide, signal table, skill-evidence mapping, and the live Vercel demo link.
- Repo cleanup rules added to `.gitignore` for `.claude/`, ZIP scratch files, and the old `new index.html` working artifact.
- Responsive CSS hardening added for tablet/mobile widths: wrapped card actions, horizontally scrollable tabs, mobile topbar simplification, full-width mobile action controls, one-column 480px sections, and horizontal table scrolling.
- Production Vercel URL confirmed: `https://clin-trace360.vercel.app/`.

## Verification So Far

- `npm install` completed successfully.
- `npm run build` passed successfully.
- `npm run build` passed again after Phase 2 reconciliation was added.
- `npm run build` passed again after the CRF-to-SDTM Mapper was added.
- `npm run build` passed again after the Protocol-to-DQP Generator was added.
- `npm run build` passed again after local persistence and README work.
- `npm run build` passed after deployment packaging and Vite chunk configuration.
- `npm run build` passed after responsive CSS hardening.
- Prior bundle-size warning was resolved by splitting Recharts and lucide-react into separate chunks.
- The dev server responded with HTTP 200 at `http://127.0.0.1:5173`.
- The live Vercel deployment responded at `https://clin-trace360.vercel.app/`.
- Headless Chrome/Edge screenshot capture failed locally because Chromium GPU initialization crashed/hung in this environment; visual screenshot capture is still pending from a normal browser or Vercel preview context.

Useful commands:

```powershell
npm install
npm run dev -- --port 5173
npm run build
```

Local app URL:

```text
http://127.0.0.1:5173
```

Live app URL:

```text
https://clin-trace360.vercel.app/
```

## Known Caveats

- Git repository is initialized and has `origin` set to `https://github.com/priyamthakar/ClinTrace360.git`.
- `dist/` and `node_modules/` exist locally because dependencies were installed and the production build was run.
- CRF-to-SDTM mapping is currently deterministic/rule-based, not LLM-backed.
- Protocol-to-DQP generation is currently deterministic/rule-based, not LLM-backed.
- ClinicalTrials.gov lookup depends on browser network access and CORS behavior.
- Phase 2 uses deterministic synthetic external data, not real safety or laboratory systems.
- Browser-level visual screenshot QA still needs to be completed in a browser that does not block/crash Chromium headless.
- GitHub Pages workflow assumes the repository default branch is `main` and Pages source is configured for GitHub Actions.

## Next Plan

### Phase 4: Polish and Deployment

Completed additions:

- Persistent local browser storage for DQP and mapping session history.
- README with run instructions and module summary.
- Deployment docs and GitHub Pages workflow.
- Vite static build config and manual chunking.
- Project license and `.gitignore`.
- Synthetic data model docs.
- Vercel deployment live URL.
- Recruiter-facing README evaluation guide and skill-evidence mapping.
- Source-level responsive CSS hardening for 768px and 480px breakpoints.

Remaining additions:

- Screenshots from the live Vercel URL.
- Visual responsive QA across desktop and mobile using a browser that can render the live site.
- Rule Library screen.
- Unit tests for rule checks, reconciliation, CRF mapping, and DQP generation.
- Optional future enhancement: add LLM assistance to Protocol-to-DQP and CRF-to-SDTM workflows for ambiguous sponsor-specific content.


## Implementation Guidance For Future Sessions

- Treat `ClinTrace360_PROJECT_PLAN.md` as the authoritative product roadmap.
- Treat `PROJECT_CONTEXT.md` as the quick current-state handoff.
- Keep implementation conservative and pharma-tool-like: dense, clear, audit-friendly, and sober.
- Do not claim production validation, real patient data handling, or real EDC integration.
- Prefer transparent rule-based checks for review/reconciliation features.
- Preserve the current single-file React artifact direction unless the user asks for a larger refactor.
