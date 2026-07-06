# ClinTrace360

[![CI](https://github.com/priyamthakar/ClinTrace360/actions/workflows/ci.yml/badge.svg)](https://github.com/priyamthakar/ClinTrace360/actions/workflows/ci.yml)

**Clinical Data Quality & Protocol-to-DQP Workbench**

A portfolio-grade clinical data operations platform demonstrating CDM workflows, CDISC SDTM standards, SAE/lab reconciliation, and audit-ready data quality practices.

> All data is synthetic. No API key required. The DQP generator and CRF mapper are fully rule-based and work offline.

**[Live Demo → clin-trace360.vercel.app](https://clin-trace360.vercel.app)**

---

## How to Evaluate This Project

*For Clinical Data Scientists and CDM hiring managers — here is the fastest path through the app.*

### 1. Data Review Dashboard (default screen)
- KPI cards show total subjects, missing visits, open queries, and critical findings across 40 subjects at 5 sites.
- **Click any row** in the Findings table to expand it and see the auto-generated query text.
- **Site Signals tab** → see SITE-103's elevated anomaly load (DILI signal) and SITE-104's AE underreporting flag.
- **Lab Trend tab** → select ALT, filter to SITE-103 → rising values from Visit 4 onward, several >3× ULN (red dots).

### 2. SAE / Lab Reconciliation
- **Click any mismatch row** to load the detail panel: EDC value vs. safety DB value, mismatch type, severity badge, and full regulatory query text.
- **Audit Log tab** shows timestamped query generation entries with source references.
- Export findings as CSV.

### 3. Protocol → DQP Generator
- Pre-loaded with a Phase 2 protocol synopsis. Click **Generate DQP**.
- Tabs: Data Quality Plan · Edit Checks · UAT Cases · Risk-Based Review Checklist.
- Paste an NCT ID (e.g. `NCT03071809`) to load live public metadata from ClinicalTrials.gov.
- **Copy Package** or **Export TXT** to take the output out of the app.

### 4. CRF → SDTM Mapper
- Select a template CRF (Demographics, Vital Signs, AE, Conmeds, Labs) or paste your own fields.
- Output: SDTM domain, variable, variable label, controlled terminology, mapping notes, confidence score, and SDTMIG reference per field.
- Session history is saved in localStorage.

---

## What This Demonstrates

| Area | Evidence in the App |
|---|---|
| CDISC SDTM | CRF→SDTM mapper: domain, variable, CT source, SDTMIG reference, confidence |
| SAE reconciliation | EDC vs safety DB: term mismatch, date mismatch, AESER=Y without SAE form, 24-hour reporting breach |
| Local lab reconciliation | Value mismatch, unit mismatch, record missing in EDC |
| Data quality rules | Rule engine across DM, SV, LB, AE, EX: missing visits, range checks, timing, protocol deviations, consistency |
| DQP authoring | Protocol text → DQP skeleton, edit check pseudocode, UAT cases, risk checklist |
| Risk-based monitoring | Site anomaly bar chart, visit compliance heatmap, finding distribution by site |
| Audit trail | Timestamped query log, mismatch type, source ref, severity, open/closed status |
| React + data viz | Recharts scatter (lab trend), stacked bar (site findings), cell heatmap (visit compliance) |

---

## Seeded Data Signals

The synthetic dataset surfaces realistic clinical data quality issues:

| Signal | Site | Domain | Detail |
|---|---|---|---|
| Drug-induced liver injury | SITE-103 | LB | Rising ALT from Visit 4 onward; several values >3× ULN |
| AE underreporting | SITE-104 | AE | Zero AE records across all 8 subjects — triggers site-level finding |
| Implausible lab values | SITE-105 | LB | Hemoglobin <5 g/dL — flagged as likely data-entry error |
| Pre-consent dosing | SITE-101 | DM | Subject 001: RFSTDTC before CONSENTDTC |
| Underage enrolment | SITE-101 | DM | Age 17 subject enrolled — protocol eligibility violation |
| SAE term mismatch | Various | AE/Safety | EDC AETERM ≠ safety DB SAETERM for same event |
| 24-hour breach | Various | Safety | SAE report date >1 day after onset — regulatory timeline flag |
| Local lab discrepancy | Various | LB | Unit mismatch (U/L vs ukat/L), value off, or record missing in EDC |
| Dose inconsistency | SITE-103/104 | EX | Placebo subjects with non-zero EXDOSE; Drug A subjects dosed at wrong amount |

---

## Stack

| Layer | Technology |
|---|---|
| Build | Vite 7 |
| UI | React 19, plain CSS custom properties |
| Charts | Recharts 3.5 |
| Icons | Lucide-react 0.556 |
| Typography | DM Sans + DM Mono (Google Fonts) |
| Storage | Browser `localStorage` for session history |
| Backend | None — fully client-side |

---

## Run Locally

```bash
git clone https://github.com/priyamthakar/ClinTrace360.git
cd ClinTrace360
npm install
npm run dev
```

Open **http://localhost:5173**

```bash
npm run build    # production build → dist/
npm test         # deterministic unit tests
npm run preview  # serve the production build locally
```

---

## Project Structure

```
src/
  ClinTrace360.jsx   # data generation, rule engine, all 4 modules (~1660 lines)
  styles.css         # dark design system, CSS custom properties (~1060 lines)
  main.jsx           # React entry point with ErrorBoundary
index.html           # Google Fonts preconnect (DM Sans, DM Mono)
vite.config.js       # chunk splitting: recharts → charts, lucide-react → icons
```

---

## Design

Dark enterprise UI — Linear × Sentry hybrid. Built for clinical data managers and data scientists, not a marketing audience.

- Background `#0E0F11`, primary accent `#5E6AD2`
- No gradients — depth through borders and spacing only
- `DM Sans` for UI, `DM Mono` for subject IDs, dates, SDTM codes, query text
- Responsive: sidebar collapses at ≤768px, replaced by a sticky horizontal module tab bar

---

*Synthetic data only. No real patient data. No PHI. Not validated for production clinical use.*
