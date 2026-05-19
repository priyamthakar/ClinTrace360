# ClinTrace360

> Clinical Data Quality & Protocol-to-DQP Workbench

ClinTrace360 is a browser-based clinical data quality workbench built to demonstrate practical Clinical Data Scientist workflows: protocol-to-DQP generation, CRF-to-SDTM mapping, clinical data review, anomaly detection, SAE reconciliation, local lab reconciliation, and audit-ready query logging.

The app is designed as a pharma-facing portfolio project. It uses synthetic data only and is not a validated clinical system.

## Modules

- **Protocol to DQP**: paste a protocol synopsis or load public ClinicalTrials.gov metadata by NCT ID, then generate a DQP skeleton, edit checks, UAT cases, and a risk-based review checklist.
- **CRF to SDTM Mapper**: map preset or pasted CRF fields to suggested SDTM domains, variables, controlled terminology, mapping notes, confidence labels, and references.
- **Data Review Dashboard**: review synthetic CDISC-style DM, SV, LB, AE, and EX data with rule-based anomaly detection and visual site/lab/visit summaries.
- **SAE/Lab Reconciliation**: compare EDC AE/LB records against synthetic safety and local lab feeds, generate mismatch findings, and produce query-log exports.
- **Methodology**: documents honest boundaries and intended training/portfolio use.

## Tech Stack

- Vite
- React 19
- Recharts
- lucide-react
- Plain CSS
- Browser `localStorage` for lightweight local history

## Run Locally

```powershell
npm install
npm run dev -- --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

Build:

```powershell
npm run build
```

## Data and Methodology

The current build uses deterministic synthetic trial data. It includes intentional anomalies such as missing visits, abnormal lab trajectories, AE timing issues, zero-AE site behavior, exposure inconsistencies, SAE reconciliation mismatches, and local lab discrepancies.

The current Protocol-to-DQP and CRF-to-SDTM modules are deterministic/rule-based. LLM assistance can be added later for sponsor-specific ambiguity, but all generated outputs should still be reviewed by qualified clinical data management staff.

## Limitations

- Not validated for production use.
- No real patient data is used or stored.
- No EDC, safety database, or lab vendor integration.
- ClinicalTrials.gov lookup depends on browser network/CORS availability.
- CDISC/SDTM suggestions are portfolio-grade starting points, not final submission mappings.

## Project Context

See `PROJECT_CONTEXT.md` for the current implementation state and next steps.

Additional docs:

- `docs/DATA_MODEL.md`: synthetic data model and rule checks.
- `docs/DEPLOYMENT.md`: static build and GitHub Pages deployment notes.
