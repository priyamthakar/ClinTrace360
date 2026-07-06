# ClinTrace360 Project Context

## Purpose

ClinTrace360 is a browser-based Clinical Data Quality and Protocol-to-DQP Workbench. It is designed to demonstrate practical Clinical Data Scientist (CDS) and Clinical Data Manager (CDM) workflows: protocol analysis, Data Quality Plan (DQP) compilation, CRF-to-SDTM mapping, clinical data review, anomaly detection, SAE PV reconciliation, local lab normalization, and audit-ready query lifecycle tracking.

The application serves as a high-fidelity portfolio piece illustrating standard clinical operations, data validation rules, and CDISC standards in an internal workbench style.

---

## Current Stack

- **Build Tooling**: Vite 7
- **UI Framework**: React 19 (Functional Components, Hooks)
- **Data Visualizations**: Recharts 3.5 (Scatter plots, stacked bars, cell heatmaps)
- **Icons**: Lucide-react 0.556
- **Styling**: Standard CSS Custom Properties in `src/styles.css` (supporting persistent Light/Dark themes)
- **Persistence**: Browser `localStorage` for active session caching (session history, queries)
- **Test Framework**: Vitest (for unit and logic coverage)

---

## Modularized Architecture

The application has been fully refactored from a single-file monolith into a clean, modular structure. Below is the directory map:

```
src/
├── main.jsx                 # Application entry point with ErrorBoundary
├── ClinTrace360.jsx         # Root orchestrator and active module router
├── styles.css               # Dark & light theme variables and layout designs
├── components/              # Reusable presentational & operational UI elements
│   ├── AppShell.jsx         # Core layout containing the sidebar and navigation
│   ├── DataTable.jsx        # Data table with sorting and fuzzy search filter
│   ├── FileUpload.jsx       # CSV Importer with drag-and-drop file support
│   ├── ThemeToggle.jsx      # Theme switcher (Light / Dark)
│   ├── Kpi.jsx              # Statistical KPI numeric display card
│   ├── Badge.jsx            # Status, severity, and category labels
│   ├── EmptyState.jsx       # Generic visual fallback for empty data
│   ├── LoadingState.jsx     # Loading skeletons and spinners
│   ├── ModuleHead.jsx       # Standard header block for workspace modules
│   └── Tooltip.jsx          # Reusable tooltip overlay
├── constants/               # Controlled lists, clinical schemas, and templates
│   ├── crfTemplates.js      # Raw CRF templates (AE, DM, conmed, labs, vital signs)
│   ├── sampleProtocol.js    # Pre-loaded clinical study synopsis
│   ├── ruleLibrary.js       # Out-of-the-box data check rule definitions
│   ├── sites.js             # Site numbers, Visit names, and Lab analyte normal ranges
│   └── queryTemplates.js    # Pre-written query strings for discrepancies
├── engines/                 # Core logic, parsing, and analysis engines
│   ├── ruleEngine.js        # Evaluates synthetic trial data for quality flags
│   ├── reconciliation.js    # Cross-compares EDC and Safety database records
│   ├── queryEngine.js       # Manages state changes for EDC Kanban simulation
│   ├── csvParser.js         # Parses uploaded CSV text and detects domains
│   ├── sdtmMapper.js        # Maps CRF fields to CDISC SDTM domains
│   ├── dqpGenerator.js      # Extracts protocol text and builds DQP documents
│   └── dataGenerator.js     # Creates 40 synthetic subject profiles
└── utils/                   # Clean utility functions
    ├── csv.js               # In-browser CSV downloads
    ├── date.js              # Timing calculations and date intervals
    ├── storage.js           # Read/write access to browser LocalStorage
    ├── text.js              # Term normalization and string formatting
    └── prng.js              # Seeded pseudo-random number generator
```

---

## Core Operational Engines

ClinTrace360's interactive workflows are powered by three core engines:

### 1. Rule Engine (`src/engines/ruleEngine.js`)
The rule engine runs dynamic data quality checks against clinical domains (`DM`, `SV`, `LB`, `AE`, `EX`) to identify protocol deviations, data inconsistencies, and clinical signals.

- **Automated Validation Checks**:
  - **Eligibility**: Identifies subjects enrolled under age 18 (e.g. `AGE < 18` in DM).
  - **Informed Consent Timing**: Verifies that the first dose date (`RFSTDTC`) is at or after the informed consent date (`CONSENTDTC`).
  - **Missing Visit Tracking**: Checks visits (`SV` domain) for each subject against the protocol-defined schedule (Visit 1 to Visit 7).
  - **Visit Windows**: Detects visit date compliance breaches (where visit date `SVSTDTC` drifts by more than +/- 7 days from the expected date).
  - **Lab Ranges**: Compares lab results (`LBORRES`) against analyte-specific reference intervals (low/high) defined in `constants/sites.js` (for ALT, AST, HGB, PLT, etc.).
  - **Critical Signals**:
    - **Drug-Induced Liver Injury (DILI)**: Triggers a critical finding if ALT exceeds 3x the Upper Limit of Normal (ULN).
    - **Implausible Values**: Flags critical data entry errors, such as Hemoglobin (HGB) values below 5 g/dL.
  - **AE Violations**: Identifies Adverse Events that start before the first dose date (`AESTDTC < RFSTDTC`) or end before they start (`AEENDTC < AESTDTC`).
  - **Site-Level AE Underreporting**: Flags entire sites (e.g., SITE-104) that have enrolled subjects but recorded zero adverse events, highlighting potential compliance or reporting anomalies.
  - **Dosing Consistency**: Flags placebo subjects receiving non-zero doses, or active arm subjects dosed outside of protocol specifications (e.g. active arm dose ≠ 100 mg).
- **Outputs**:
  - **Findings Array**: Individual objects with finding ID, subject ID, site, domain, variable, severity (Critical/Major), category, and description.
  - **Site Summaries & Signals**: Aggregates finding counts by site and category to drive the Site Signals bar chart and the visit compliance heatmap.

### 2. Reconciliation Engine (`src/engines/reconciliation.js`)
The reconciliation engine runs comparisons across independent data sources (EDC clinical data vs. Safety PV Database vs. Local Labs) to identify discrepancies that could delay database lock or violate regulatory timelines.

- **EDC vs. Safety PV Reconciliation**:
  - Compares serious adverse events in EDC (`AESER = 'Y'`) against Safety database records.
  - **Discrepancy Checks**:
    - **Missing in EDC**: Safety SAE record is present, but no matching EDC serious AE is found.
    - **Missing in Safety**: EDC AE is marked serious, but no Safety PV database record exists.
    - **Verbatim Term Mismatch**: Verbatim term in EDC does not match the Safety term (e.g. "Severe Migraine" vs. "Headache"). Normalization is performed to ignore casing and white spaces.
    - **Onset Date Mismatch**: EDC AE start date drifts from Safety database onset date by more than 1 day.
    - **Reporting Timeline Breach**: SAE reporting date exceeds 24 hours from the onset/awareness date, violating regulatory timelines.
- **EDC vs. Local Lab Reconciliation**:
  - Compares local lab raw files with EDC laboratory records (`LB` domain) matching on subject, test, and date.
  - **Discrepancy Checks**:
    - **Missing in EDC**: Local lab result is missing from the clinical database.
    - **Unit Mismatch**: Local lab units do not match EDC units (e.g., U/L vs. µkat/L), triggering normalization and conversion queries.
    - **Value Mismatch**: The numeric values recorded in EDC and the local lab file differ.
- **Outputs**:
  - **SAE / Lab Findings logs**: Populates discrepancy data tables.
  - **Query Templates Compilation**: Compiles detailed, regulatory-compliant query texts based on predefined templates (e.g., formatting site number, subject ID, variable names, and dates).

### 3. Query Engine (`src/engines/queryEngine.js`)
The query engine manages the query lifecycle, simulating how clinical data managers and site coordinators resolve discrepancies.

- **State Hookup**:
  - On application startup or custom data import, the query engine aggregates all findings from the **Rule Engine** and discrepancies from the **Reconciliation Engine** into a unified query array.
  - The unified array is stored in `localStorage` under `clintrace360_queries_v1` to persist user updates across page refreshes.
- **Lifecycle Phases**:
  - **OPEN**: Query is generated. Awaiting site review.
  - **ANSWERED**: Simulated Site action. The site coordinator responds by verifying source documents, correcting entry typos, or updating safety databases. The query transitions to the "Ready to Review" column, and the site's response is appended with a timestamp.
  - **CLOSED**: Clinical Data Manager (CDM) review action. The CDM verifies the correction against source records, inputs a closing review comment, and closes the query.
- **Fuzzy Filtering**:
  - Supports searching queries by ID, subject ID, description, or mismatch type.

---

## Interactive Feature Workflows

The application includes several interactive workflows:

### 1. Data Review & Chart Drill-downs
The Data Review Dashboard acts as the primary operations screen, integrating visual charting with direct actions:
- **Site Signals Tab**: 
  - Displays a stacked bar chart of finding categories (Missing, Range, Timing, Protocol, Consistency) by site.
  - **Interactive Action**: Clicking a bar segment filters the findings table to that specific site and category, and switches to the "Findings" tab.
  - Clicking a site's name in the Anomaly Load list isolates that site's logs.
  - Clicking a compliance percentage block in the Heatmap filters for that site's missing visit records.
- **Lab Trend Tab**:
  - Displays a Recharts scatter plot showing lab results by visit.
  - A green reference area visualizes the normal range. Out-of-range values are marked in red.
  - Selecting an analyte or site updates the plot instantly.

### 2. CSV File Importer with Auto-detection
- Located in the Data Review Dashboard, the importer allows users to upload custom trial data.
- **Parsing**: `csvParser.js` parses comma-separated values, stripping quotation marks and converting numeric fields.
- **Auto-Detection**: Scans the header row for key terms. If it finds `AGE`, `ARMCD`, or `BRTHDTC`, it auto-detects `dm`; if it finds `VISITNUM` or `SVSTDTC`, it detects `sv`; if it finds `LBTESTCD` or `LBORRES`, it detects `lb`.
- **Validation**: Once imported, the Rule Engine automatically executes all validation rules against the new dataset, updating the dashboard, charts, and Query Workbench.

---

## Known Caveats & Handoff Guidance

- **Synthetic Data Generation**: The synthetic dataset is generated deterministically on load using a custom pseudo-random number generator (`utils/prng.js`) to guarantee consistent results across test runs and environments.
- **ClinicalTrials.gov lookup**: Uses the public API. It is client-side, meaning it is subject to the user's internet connection and API uptime.
- **Vitest Coverage**: The Vitest suite verifies the stability of synthetic data generation, rule-engine findings, SAE reconciliation mismatch logic, and SDTM mapping. Ensure `npm test` passes before pushing changes.
- **Vercel Deployment**: Configured to auto-deploy changes pushed to `main`. Always preview production builds locally with `npm run preview` to verify bundle splits.
