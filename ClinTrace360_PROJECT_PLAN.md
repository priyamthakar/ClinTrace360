# ClinTrace360: Clinical Data Quality & Protocol-to-DQP Workbench

## Project Plan v1.0

---

## 1. PURPOSE & POSITIONING

### 1.1 What It Is

A deployed, browser-based clinical data quality workbench that demonstrates end-to-end Clinical Data Scientist competence: from protocol interpretation to DQP generation, CRF-to-SDTM mapping, clinical data review with anomaly detection, and SAE/lab reconciliation with audit-ready query logs.

### 1.2 Why It Exists

Target role: Novartis Associate Clinical Data Scientist, Hyderabad (REQ-10078087).

The JD explicitly requires: eCRF design input, Data Quality Plan preparation, UAT, ongoing data review including third-party/local lab data, SAE reconciliation, coding activities, GCP compliance, and audit readiness. ClinTrace360 demonstrates working knowledge of every one of these, deployed as a live tool.

### 1.3 Differentiator Statement

"I built and deployed ClinTrace360, a GCP-aware clinical data quality workbench that converts protocol metadata into DQP/edit-check/UAT outputs, maps CRF fields to SDTM-style domains, detects anomalies in synthetic clinical trial datasets, and simulates SAE/local lab reconciliation with audit-ready query logs."

---

## 2. TECH STACK

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React (single .jsx artifact) | Deploys directly in Claude artifact renderer; also exportable to GitHub Pages via Vite |
| Styling | Tailwind CSS (utility classes) | Available in Claude artifact environment |
| Charts | Recharts | Available in artifact env; handles bar, line, scatter, heatmap |
| Data processing | lodash, papaparse | Available; needed for CSV parsing and data manipulation |
| LLM Backend | Anthropic API (claude-sonnet-4-20250514) | For Module 1 (protocol parsing) and Module 2 (SDTM mapping) |
| State management | React useState/useReducer | No external state library needed |
| Persistent storage | window.storage API | For saving generated DQPs, mapping histories, review sessions |
| Export | Blob/download | For exporting DQP documents, query logs, reconciliation reports |

---

## 3. APPLICATION ARCHITECTURE

### 3.1 Navigation Structure

```
ClinTrace360
├── Header (app name, version, active module indicator)
├── Sidebar Navigation
│   ├── Module 1: Protocol → DQP
│   ├── Module 2: CRF → SDTM Mapper
│   ├── Module 3: Data Review Dashboard
│   └── Module 4: SAE/Lab Reconciliation
└── Main Content Area (renders active module)
```

### 3.2 Design Direction

Professional pharma-grade UI. Dark sidebar (#0F172A) with teal/cyan accent (#0EA5E9). White content area. Monospace for data tables. Clean, clinical, trustworthy. Think: internal pharma tooling, not a consumer app.

Typography: IBM Plex Sans for headings, system monospace for data/tables/code.

---

## 4. MODULE 1: PROTOCOL → DATA QUALITY PLAN GENERATOR

### 4.1 Purpose

Takes protocol text or a ClinicalTrials.gov NCT ID summary and generates:
- Data Quality Plan (DQP) skeleton with sections
- Edit check specifications (programmatic validation rules)
- UAT test cases for eCRF validation
- Risk-based data review checklist

### 4.2 User Flow

```
User Input
├── Option A: Paste protocol synopsis text (free text area)
├── Option B: Enter NCT ID → app fetches study title/design/endpoints/arms
│   (via ClinicalTrials.gov API: https://clinicaltrials.gov/api/v2/studies/{nctId})
└── Click "Generate DQP"

Processing
├── Extract structured fields via LLM:
│   ├── Study Phase
│   ├── Primary/Secondary Endpoints
│   ├── Visit Schedule (visits, windows, assessments per visit)
│   ├── Eligibility Criteria (inclusion/exclusion)
│   ├── Lab Panel (which labs at which visits)
│   ├── Safety Monitoring (AE collection, SAE criteria, DSMB)
│   └── Dosing Regimen
└── Generate outputs via LLM with structured prompting

Output (tabbed view)
├── Tab 1: DQP Document
│   ├── 1.0 Study Overview
│   ├── 2.0 Data Sources & Flow
│   ├── 3.0 CRF Completion Guidelines
│   ├── 4.0 Edit Check Plan
│   │   ├── Range checks (labs, vitals)
│   │   ├── Cross-form checks (AE dates vs visit dates)
│   │   ├── Conditional checks (if pregnant, then no drug X)
│   │   └── Protocol deviation checks
│   ├── 5.0 External Data Handling (central lab, ECG, imaging)
│   ├── 6.0 SAE Reconciliation Plan
│   ├── 7.0 Medical Coding Plan (MedDRA version, WHO-DD)
│   ├── 8.0 Data Review Schedule
│   └── 9.0 Database Lock Checklist
├── Tab 2: Edit Check Specifications Table
│   Columns: Check ID | Domain | Variable | Check Logic (pseudocode) | Severity (Hard/Soft) | Query Text
│   Example rows:
│   EC-001 | LB | LBORRES (ALT) | IF LBORRES > 3x ULN THEN QUERY | Hard | "ALT value of [VALUE] exceeds 3x ULN. Please verify."
│   EC-002 | AE | AESTDTC | IF AESTDTC < RFSTDTC THEN QUERY | Hard | "AE start date is before first dose. Please confirm."
│   EC-003 | VS | VSORRES (SBP) | IF VSORRES < 70 OR > 200 THEN QUERY | Soft | "SBP value appears out of expected range. Please verify."
├── Tab 3: UAT Test Cases
│   Columns: TC ID | Module | Test Description | Input | Expected Result | Pass/Fail (blank for user)
│   Example:
│   UAT-001 | Demographics | Enter age < 18 | DOB = 2010-01-01 | System fires "Subject does not meet age criterion" | ___
│   UAT-002 | Lab Results | Enter ALT = 999 | LBORRES = 999 | Range check query fires | ___
│   UAT-003 | AE Form | Enter AE start before consent | AESTDTC < DSSTDTC | System blocks entry or fires hard edit | ___
└── Tab 4: Risk-Based Data Review Checklist
    Columns: Risk Area | Priority (High/Med/Low) | Review Frequency | Responsible | Key Indicators
    Example:
    Eligibility violations | High | Weekly | Lead CDM | I/E criteria deviations count
    Missing primary endpoint | High | Biweekly | Lead CDM | % missing efficacy assessments
    Site enrollment anomalies | Medium | Monthly | CDM + CRA | Enrollment rate vs mean
```

### 4.3 LLM Prompt Strategy

System prompt instructs Claude to act as a senior Clinical Data Manager generating GCP-compliant CDM deliverables. The user message contains the extracted protocol fields. Response format is strictly JSON with keys: `dqp_sections`, `edit_checks`, `uat_cases`, `review_checklist`.

### 4.4 Data Sources

- ClinicalTrials.gov API v2: `https://clinicaltrials.gov/api/v2/studies/{nctId}` (public, no auth needed)
- Note: The CT.gov API returns JSON with fields: protocolSection.identificationModule, designModule, armsInterventionsModule, outcomesModule, eligibilityModule, contactsLocationsModule

### 4.5 Limitations to Disclose

- Generated DQP is a skeleton requiring human review by qualified CDM staff
- Edit checks are illustrative, not validated against a specific EDC system
- Not connected to a real CDMS; intended as a planning and training aid

---

## 5. MODULE 2: CRF/eCRF → SDTM MAPPING ASSISTANT

### 5.1 Purpose

User pastes eCRF field names/labels, and the tool suggests SDTM domain, variable name, controlled terminology, and mapping notes with confidence levels.

### 5.2 User Flow

```
User Input
├── Option A: Paste CRF fields as a list (one per line)
│   Format: Field Label | Data Type | Codelist (optional)
│   Example:
│   "Date of Birth | Date"
│   "Sex | Char | M, F, U"
│   "Systolic Blood Pressure | Num"
│   "Adverse Event Term | Char"
│   "Concomitant Medication Name | Char"
├── Option B: Select from preset CRF templates
│   ├── Demographics CRF
│   ├── Vital Signs CRF
│   ├── Adverse Events CRF
│   ├── Concomitant Medications CRF
│   └── Lab Results CRF
└── Click "Map to SDTM"

Processing
└── LLM maps each field to SDTM with structured output

Output Table
Columns:
├── CRF Field Label
├── SDTM Domain (e.g., DM, AE, CM, LB, VS, EX, MH, DS)
├── SDTM Variable (e.g., BRTHDTC, SEX, SYSBP → VSORRES where VSTESTCD='SYSBP')
├── SDTM Variable Label
├── Controlled Terminology (if applicable, e.g., CDISC CT codelist C66731 for SEX)
├── Mapping Notes (transformation logic, if any)
├── Confidence (High / Medium / Low)
└── CDISC IG Reference (e.g., SDTMIG v3.4, Section 6.1)
```

### 5.3 Preset CRF Templates (hardcoded)

```javascript
const CRF_TEMPLATES = {
  demographics: [
    { label: "Subject Identifier", type: "Char" },
    { label: "Date of Birth", type: "Date" },
    { label: "Sex", type: "Char", codelist: "Male, Female, Unknown" },
    { label: "Race", type: "Char", codelist: "White, Black or African American, Asian, American Indian or Alaska Native, Native Hawaiian or Other Pacific Islander, Other, Multiple" },
    { label: "Ethnicity", type: "Char", codelist: "Hispanic or Latino, Not Hispanic or Latino, Not Reported, Unknown" },
    { label: "Country", type: "Char" },
    { label: "Date of Informed Consent", type: "Date" },
    { label: "Age at Screening", type: "Num" },
  ],
  vitals: [
    { label: "Vital Signs Date", type: "Date" },
    { label: "Vital Signs Time", type: "Time" },
    { label: "Systolic Blood Pressure (mmHg)", type: "Num" },
    { label: "Diastolic Blood Pressure (mmHg)", type: "Num" },
    { label: "Heart Rate (bpm)", type: "Num" },
    { label: "Body Temperature (°C)", type: "Num" },
    { label: "Respiratory Rate (breaths/min)", type: "Num" },
    { label: "Weight (kg)", type: "Num" },
    { label: "Height (cm)", type: "Num" },
    { label: "Position", type: "Char", codelist: "Supine, Sitting, Standing" },
  ],
  adverse_events: [
    { label: "Adverse Event Term (Verbatim)", type: "Char" },
    { label: "AE Start Date", type: "Date" },
    { label: "AE End Date", type: "Date" },
    { label: "Severity", type: "Char", codelist: "Mild, Moderate, Severe" },
    { label: "Serious?", type: "Char", codelist: "Yes, No" },
    { label: "Causality (Relationship to Study Drug)", type: "Char", codelist: "Not Related, Unlikely, Possible, Probable, Definite" },
    { label: "Action Taken with Study Drug", type: "Char", codelist: "None, Dose Reduced, Drug Interrupted, Drug Withdrawn" },
    { label: "Outcome", type: "Char", codelist: "Recovered/Resolved, Recovering/Resolving, Not Recovered/Not Resolved, Recovered with Sequelae, Fatal, Unknown" },
    { label: "SAE Criteria Met", type: "Char", codelist: "Death, Life-threatening, Hospitalization, Disability, Congenital Anomaly, Other Medically Important" },
  ],
  conmeds: [
    { label: "Medication Name (Generic)", type: "Char" },
    { label: "ATC Code", type: "Char" },
    { label: "Indication", type: "Char" },
    { label: "Dose", type: "Num" },
    { label: "Dose Unit", type: "Char", codelist: "mg, mcg, mL, IU, g" },
    { label: "Route", type: "Char", codelist: "Oral, Intravenous, Subcutaneous, Intramuscular, Topical, Inhalation" },
    { label: "Frequency", type: "Char", codelist: "QD, BID, TID, QID, PRN, QW, Q2W" },
    { label: "Start Date", type: "Date" },
    { label: "End Date", type: "Date" },
    { label: "Ongoing?", type: "Char", codelist: "Yes, No" },
  ],
  labs: [
    { label: "Lab Test Name", type: "Char" },
    { label: "Lab Test Code (LOINC)", type: "Char" },
    { label: "Specimen Collection Date", type: "Date" },
    { label: "Result (Original Units)", type: "Num" },
    { label: "Original Units", type: "Char" },
    { label: "Result (Standard Units)", type: "Num" },
    { label: "Standard Units", type: "Char" },
    { label: "Normal Range Low", type: "Num" },
    { label: "Normal Range High", type: "Num" },
    { label: "Clinical Significance", type: "Char", codelist: "Clinically Significant, Not Clinically Significant" },
    { label: "Fasting Status", type: "Char", codelist: "Yes, No" },
  ],
};
```

### 5.4 SDTM Domain Reference (hardcoded knowledge)

```javascript
const SDTM_DOMAINS = {
  DM: { label: "Demographics", class: "Special Purpose", variables: ["USUBJID", "SUBJID", "SITEID", "BRTHDTC", "SEX", "RACE", "ETHNIC", "COUNTRY", "RFSTDTC", "RFENDTC", "AGE", "AGEU", "ARMCD", "ARM", "DTHFL", "DTHDTC"] },
  AE: { label: "Adverse Events", class: "Events", variables: ["AETERM", "AEDECOD", "AEBODSYS", "AESTDTC", "AEENDTC", "AESEV", "AESER", "AEREL", "AEACN", "AEOUT", "AESCONG", "AESDISAB", "AESDTH", "AESHOSP", "AESLIFE", "AESMIE"] },
  CM: { label: "Concomitant Medications", class: "Interventions", variables: ["CMTRT", "CMDECOD", "CMINDC", "CMDOSE", "CMDOSU", "CMROUTE", "CMDOSFRQ", "CMSTDTC", "CMENDTC", "CMENRF"] },
  LB: { label: "Laboratory Test Results", class: "Findings", variables: ["LBTESTCD", "LBTEST", "LBCAT", "LBORRES", "LBORRESU", "LBSTRESC", "LBSTRESN", "LBSTRESU", "LBNRIND", "LBORNRLO", "LBORNRHI", "LBDTC", "LBSPEC", "LBFAST"] },
  VS: { label: "Vital Signs", class: "Findings", variables: ["VSTESTCD", "VSTEST", "VSORRES", "VSORRESU", "VSPOS", "VSDTC", "VSTPT"] },
  EX: { label: "Exposure", class: "Interventions", variables: ["EXTRT", "EXDOSE", "EXDOSU", "EXROUTE", "EXDOSFRQ", "EXSTDTC", "EXENDTC"] },
  MH: { label: "Medical History", class: "Events", variables: ["MHTERM", "MHDECOD", "MHBODSYS", "MHSTDTC", "MHENDTC", "MHENRF"] },
  DS: { label: "Disposition", class: "Events", variables: ["DSTERM", "DSDECOD", "DSCAT", "DSSTDTC"] },
  SV: { label: "Subject Visits", class: "Special Purpose", variables: ["VISITNUM", "VISIT", "SVSTDTC", "SVENDTC"] },
  SC: { label: "Subject Characteristics", class: "Findings", variables: ["SCTESTCD", "SCTEST", "SCORRES", "SCORRESU"] },
};
```

### 5.5 Confidence Scoring Logic

- High: CRF field label contains an exact or near-exact CDISC variable label keyword
- Medium: Semantic match via LLM but label is ambiguous or non-standard
- Low: No clear domain match; multiple domains could apply; custom/sponsor-defined

---

## 6. MODULE 3: CLINICAL DATA REVIEW DASHBOARD

### 6.1 Purpose

Uses synthetic SDTM-style data (generated in-app, mimicking PHUSE/safetyData structure) to demonstrate clinical data review capabilities: flagging missing visits, abnormal lab trajectories, AE timing issues, site-level anomalies, and dosing inconsistencies.

### 6.2 Synthetic Data Model

All data generated at app initialization using seeded random functions. No external data fetches required.

#### 6.2.1 DM (Demographics) — 40 subjects across 5 sites

```
Fields: USUBJID, SITEID, BRTHDTC, AGE, SEX, RACE, ETHNIC, ARMCD, ARM, RFSTDTC, RFENDTC, COUNTRY
- 8 subjects per site
- Arms: "DRUG A 100mg" (20 subjects), "PLACEBO" (20 subjects)
- Injected anomalies:
  - 1 subject with AGE = 17 (below eligibility)
  - 1 subject with RFSTDTC before consent date
```

#### 6.2.2 SV (Subject Visits) — ~280 records

```
Fields: USUBJID, SITEID, VISITNUM, VISIT, SVSTDTC
- 7 planned visits per subject (Screening, Baseline, Wk4, Wk8, Wk12, Wk16, EOT)
- Injected anomalies:
  - ~8% missing visits (random dropout)
  - SITE-104: systematically missing Week 12 for 5/8 subjects
  - 3 subjects with visit dates outside visit window (+/- 7 days)
```

#### 6.2.3 LB (Lab Results) — ~840 records

```
Fields: USUBJID, SITEID, VISITNUM, VISIT, LBDT, LBTESTCD, LBTEST, LBORRES, LBORNRLO, LBORNRHI, LBSTRESU, FLAG
- 3 analytes: ALT, Creatinine, Hemoglobin (per visit per subject)
- Injected anomalies:
  - SITE-103: ALT values 80-250 U/L after Visit 3 (drug-induced liver signal)
  - SITE-105: HGB values 3-6 g/dL in 30% of records (implausible — data entry error)
  - Random individual outliers
```

#### 6.2.4 AE (Adverse Events) — ~120 records

```
Fields: USUBJID, SITEID, AETERM, AEDECOD, AEBODSYS, AESTDTC, AEENDTC, AESEV, AESER, AEREL, AEACN, AEOUT
- Injected anomalies:
  - SITE-104: ZERO adverse events across all 8 subjects (underreporting signal)
  - 3 AEs with AESTDTC before RFSTDTC (pre-dose AE)
  - 2 AEs where AEENDTC < AESTDTC (end before start)
  - 1 SAE (AESER="Y") with no matching SAE record in safety dataset
```

#### 6.2.5 EX (Exposure/Dosing) — ~280 records

```
Fields: USUBJID, SITEID, VISITNUM, EXTRT, EXDOSE, EXDOSU, EXSTDTC, EXENDTC
- Injected anomalies:
  - 2 subjects with dose change not matching protocol schedule
  - 1 subject on PLACEBO arm with non-zero EXDOSE
```

#### 6.2.6 Safety/SAE Records (for Module 4) — separate dataset

```
Fields: USUBJID, SAESSION (SAE sequence), SAETERM, SAESTDTC, SAESER, SAECRIT (criteria), SAERPTDT (report date)
- 8 SAE records total
- Injected mismatches vs AE domain:
  - 1 SAE present in safety DB but missing from AE domain
  - 1 AE marked AESER="Y" but no matching SAE record
  - 1 SAE with different verbatim term vs AE term
  - 1 SAE reported date > 24 hours after awareness (regulatory timeline breach)
```

#### 6.2.7 Local Lab Records (for Module 4) — separate dataset

```
Fields: USUBJID, SITEID, LABSRC ("Central" or "Local"), LBTESTCD, LBDT, LBORRES, LBSTRESU
- 60 local lab records
- Injected mismatches vs LB domain:
  - 3 records present in local lab file but missing from EDC LB domain
  - 2 records with different result values (local vs EDC)
  - 1 record with unit mismatch (mg/dL vs mmol/L without conversion)
```

### 6.3 Dashboard Panels

```
Layout: 2-column grid with expandable detail panels

Row 1: Summary KPIs
├── Total Subjects: 40
├── Total Visits Expected: 280
├── Missing Visits: X (Y%)
├── Open Queries: Z
├── Critical Findings: N
└── Last Review Date: auto-generated

Row 2: Site-Level Overview (Bar Chart)
├── X-axis: Sites
├── Stacked bars: Findings by category (Missing Data, Range Violations, Timing Issues, Protocol Deviations)
└── Click bar → drill down to site detail

Row 3: Lab Trajectory Panel (Line Chart)
├── Selector: Choose analyte (ALT, Creatinine, Hemoglobin)
├── Selector: Choose site or all sites
├── Lines: Individual subject trajectories
├── Shaded band: Normal range
├── Red dots: Flagged values
└── Hover: shows USUBJID, visit, value

Row 4: AE Analysis
├── Left: AE count by site (horizontal bar) — SITE-104 will show 0
├── Right: AE timing check results table
│   Columns: USUBJID | AETERM | Issue | AESTDTC | RFSTDTC | Status
│   Issues: "AE start before first dose", "AE end before AE start"
└── Click row → detail popup

Row 5: Visit Compliance Heatmap
├── Rows: Sites
├── Columns: Visit 1-7
├── Cells: % completion (green >90%, yellow 70-90%, red <70%)
└── SITE-104 / Visit 5 (Week 12) will show red

Row 6: Data Findings Log (Table — scrollable)
├── Columns: Finding ID | Category | USUBJID | Domain | Variable | Description | Severity | Status
├── Sortable and filterable
├── Categories: RANGE, TIMING, MISSING, PROTOCOL, CONSISTENCY
└── Export as CSV button
```

### 6.4 Anomaly Detection Logic (Rule-Based, Not ML)

All checks are transparent, auditable rules — matching how actual CDM edit checks work:

```
CHECK-001: Missing Visit
  IF subject has no SV record for a planned VISITNUM → flag MISSING

CHECK-002: Visit Window Violation
  IF |SVSTDTC - expected_date| > 7 days → flag TIMING

CHECK-003: Lab Range Check
  IF LBORRES > LBORNRHI OR LBORRES < LBORNRLO → flag RANGE

CHECK-004: Lab Trajectory Alert (Grade 3+ elevation)
  IF LBTESTCD = "ALT" AND LBORRES > 3 * LBORNRHI → flag RANGE (CRITICAL)

CHECK-005: Implausible Lab Value
  IF LBTESTCD = "HGB" AND LBORRES < 5 → flag RANGE (CRITICAL, likely data entry error)

CHECK-006: AE Start Before First Dose
  IF AESTDTC < RFSTDTC → flag TIMING

CHECK-007: AE End Before Start
  IF AEENDTC < AESTDTC → flag TIMING

CHECK-008: Zero AE Site
  IF site has 0 AE records across all subjects → flag PROTOCOL (underreporting)

CHECK-009: Eligibility Violation
  IF AGE < 18 → flag PROTOCOL

CHECK-010: Consent Date Check
  IF RFSTDTC < consent_date → flag TIMING

CHECK-011: Placebo Dose Check
  IF ARMCD = "PLACEBO" AND EXDOSE > 0 → flag CONSISTENCY
```

---

## 7. MODULE 4: SAE / LOCAL LAB RECONCILIATION SIMULATOR

### 7.1 Purpose

Demonstrates the SAE reconciliation and external data reconciliation workflow that the Novartis JD explicitly requires. Compares:
- AE domain (EDC) vs Safety database (SAE records)
- EDC Lab records vs Local Lab file

Flags mismatches and generates query text with audit trail.

### 7.2 User Flow

```
Tab A: SAE Reconciliation
├── Side-by-side view: AE Domain (left) | Safety DB (right)
├── Auto-matching on: USUBJID + event term similarity + date proximity
├── Mismatch categories:
│   ├── MISSING_IN_AE: SAE exists in safety DB but no AESER="Y" record in AE domain
│   ├── MISSING_IN_SAFETY: AE has AESER="Y" but no SAE record in safety DB
│   ├── TERM_MISMATCH: Matched pair but verbatim terms differ
│   ├── DATE_MISMATCH: Matched pair but start dates differ by >1 day
│   └── REPORTING_BREACH: SAE report date > 24 hours after site awareness
├── For each mismatch:
│   ├── Mismatch Type
│   ├── Details (side-by-side values)
│   ├── Auto-generated Query Text
│   └── Severity (Critical / Major / Minor)
└── Export: Reconciliation report with all findings

Tab B: Local Lab Reconciliation
├── Side-by-side view: EDC Lab Domain (left) | Local Lab File (right)
├── Auto-matching on: USUBJID + LBTESTCD + LBDT
├── Mismatch categories:
│   ├── MISSING_IN_EDC: Record in local lab file, no matching EDC record
│   ├── MISSING_IN_LOCAL: EDC record exists, no local lab source
│   ├── VALUE_MISMATCH: Matched pair but LBORRES values differ
│   └── UNIT_MISMATCH: Matched pair but units differ without proper conversion
├── Query text auto-generated for each mismatch
└── Export: Lab reconciliation report

Tab C: Query Log
├── All auto-generated queries from both tabs
├── Columns: Query ID | Type (SAE/Lab) | USUBJID | Description | Query Text | Severity | Status (Open) | Generated Timestamp
├── Mimics real CDM query management workflow
└── Audit trail: every query has timestamp, finding reference, and traceability to source records
```

### 7.3 Query Text Templates

```javascript
const QUERY_TEMPLATES = {
  MISSING_IN_AE: "SAE record for subject {USUBJID} with term '{SAETERM}' dated {SAESTDTC} exists in the safety database but no corresponding AE record with AESER='Y' was found in the EDC. Please enter the AE record or provide clarification.",

  MISSING_IN_SAFETY: "AE record for subject {USUBJID} with term '{AETERM}' is marked as serious (AESER='Y') in the EDC but no corresponding SAE record was found in the safety database. Please submit the SAE form or update the AE seriousness field.",

  TERM_MISMATCH: "For subject {USUBJID}, the AE verbatim term '{AETERM}' in EDC does not match the SAE verbatim term '{SAETERM}' in the safety database. Please reconcile the terms and update the appropriate record.",

  DATE_MISMATCH: "For subject {USUBJID}, the AE start date ({AESTDTC}) in EDC differs from the SAE onset date ({SAESTDTC}) in the safety database by more than 1 day. Please verify and correct the dates.",

  REPORTING_BREACH: "SAE for subject {USUBJID} with term '{SAETERM}' was reported on {SAERPTDT}, which is more than 24 hours after site awareness ({SAESTDTC}). This may represent a regulatory reporting timeline breach. Please provide justification.",

  LAB_MISSING_IN_EDC: "Local lab result for subject {USUBJID}, test {LBTESTCD} on {LBDT} with value {LBORRES} {LBSTRESU} is present in the local lab file but has no corresponding entry in the EDC laboratory domain. Please enter the result or provide clarification.",

  LAB_VALUE_MISMATCH: "For subject {USUBJID}, test {LBTESTCD} on {LBDT}: EDC value is {EDC_VALUE} {EDC_UNIT} but local lab file shows {LOCAL_VALUE} {LOCAL_UNIT}. Please verify and correct.",

  LAB_UNIT_MISMATCH: "For subject {USUBJID}, test {LBTESTCD} on {LBDT}: EDC unit is '{EDC_UNIT}' but local lab file unit is '{LOCAL_UNIT}'. Please verify the conversion and ensure consistency.",
};
```

---

## 8. PERSISTENT STORAGE SCHEMA

Using `window.storage` API for cross-session data:

```javascript
// Module 1: Saved DQP generations
await window.storage.set("dqp:history", JSON.stringify([
  { id: "dqp_001", nctId: "NCT12345678", title: "...", generatedAt: "...", dqp: {...} }
]));

// Module 2: Mapping history
await window.storage.set("mapping:history", JSON.stringify([
  { id: "map_001", crfFields: [...], mappings: [...], generatedAt: "..." }
]));

// Module 3: Review sessions
await window.storage.set("review:session", JSON.stringify({
  lastRun: "...", findingsCount: N, resolvedCount: M
}));

// Module 4: Query log
await window.storage.set("queries:log", JSON.stringify([
  { queryId: "Q-001", type: "SAE", usubjid: "...", text: "...", status: "Open", timestamp: "..." }
]));
```

---

## 9. EXPORT CAPABILITIES

Each module supports data export:

| Module | Export Format | Content |
|--------|-------------|---------|
| Module 1 | Copy-to-clipboard (structured text) | DQP document, edit check table, UAT cases |
| Module 2 | CSV download | CRF-to-SDTM mapping table |
| Module 3 | CSV download | Data findings log with all flagged records |
| Module 4 | CSV download | Reconciliation report + query log |

Export implementation: Build CSV string → create Blob → trigger download via hidden anchor element.

---

## 10. IMPLEMENTATION PHASES

### Phase 1: Foundation (build first)
- [ ] App shell: sidebar navigation, module routing, theme/styling
- [ ] Synthetic data generation functions (all datasets from Section 6.2)
- [ ] Module 3: Data Review Dashboard (no LLM needed, pure frontend)
  - All anomaly detection rules
  - All chart panels
  - Findings log table with export

### Phase 2: Reconciliation Engine
- [ ] Module 4: SAE Reconciliation tab
- [ ] Module 4: Local Lab Reconciliation tab
- [ ] Module 4: Query log with audit trail
- [ ] Export for reconciliation reports

### Phase 3: LLM-Powered Modules
- [ ] Module 2: CRF-to-SDTM Mapper (Anthropic API call)
  - Preset templates + freeform input
  - Structured JSON response parsing
  - Mapping results table with confidence
- [ ] Module 1: Protocol-to-DQP Generator (Anthropic API call)
  - ClinicalTrials.gov API integration for NCT ID lookup
  - LLM-powered extraction and generation
  - Tabbed output display

### Phase 4: Polish
- [ ] Persistent storage for history across sessions
- [ ] Loading states, error handling, empty states
- [ ] Responsive layout refinements
- [ ] README-style "About" section within the app explaining methodology

---

## 11. CONSTRAINTS & HONEST LIMITATIONS

Document these in the app's "About" panel:

1. **Not validated for production use.** This is a demonstration/training tool, not a validated CDMS.
2. **Synthetic data only.** No real patient data is used or stored.
3. **LLM outputs require human review.** Generated DQPs, edit checks, and SDTM mappings are starting points, not final deliverables.
4. **No EDC integration.** The app simulates CDM workflows but does not connect to Medidata Rave, Oracle InForm, or any production system.
5. **CDISC version reference.** Mappings reference SDTMIG v3.4 and CDISC CT as of 2025. Always verify against the current IG version.

---

## 12. GITHUB REPOSITORY STRUCTURE (for deployment)

```
ClinTrace360/
├── README.md           # Project overview, screenshots, live demo link
├── LICENSE             # MIT
├── index.html          # Entry point
├── src/
│   └── ClinTrace360.jsx  # Single-file React app (artifact-compatible)
├── docs/
│   ├── PROJECT_PLAN.md    # This document
│   ├── DATA_MODEL.md      # Synthetic data specifications
│   └── SCREENSHOTS/       # App screenshots for README
└── package.json        # Vite config for GitHub Pages deployment
```

### README Structure

```markdown
# ClinTrace360
> Clinical Data Quality & Protocol-to-DQP Workbench

## Problem
Clinical Data Scientists spend significant time manually creating DQPs, mapping CRFs to SDTM, reviewing data for anomalies, and reconciling SAE/lab records. These workflows are well-defined and partially automatable.

## Solution
A deployed web application that demonstrates 4 core CDM competencies...

## Live Demo
[Link to deployed app]

## Modules
[Screenshots + brief description of each]

## Data Sources
- Synthetic CDISC-style data (PHUSE/safetyData inspired)
- ClinicalTrials.gov API for protocol lookup
- Anthropic Claude API for NLP-powered generation

## Technical Stack
React | Tailwind | Recharts | Anthropic API

## Limitations
[Honest disclosure per Section 11]

## Author
Priyam Thakar | PhD Student, Dept. of Pharmaceutics, Nirma University
```

---

## 13. ESTIMATED EFFORT

| Phase | Scope | Estimated Size |
|-------|-------|---------------|
| Phase 1 | Shell + Data + Module 3 | ~800 lines |
| Phase 2 | Module 4 | ~400 lines |
| Phase 3 | Modules 1 & 2 | ~500 lines |
| Phase 4 | Polish & storage | ~200 lines |
| **Total** | | **~1900 lines** |

Single-file React artifact. Build iteratively, test each phase before proceeding.

---

## 14. SUCCESS CRITERIA

The app succeeds if a Novartis hiring manager can:

1. Enter an NCT ID and get a plausible DQP skeleton they would recognize as structurally correct
2. See CRF fields mapped to correct SDTM domains/variables with high accuracy
3. Explore a clinical data dashboard and immediately spot the injected anomalies (SITE-103 liver signal, SITE-104 zero AEs, SITE-105 implausible HGB)
4. Walk through SAE reconciliation findings and recognize the query text as realistic
5. Conclude: "This person understands what a Clinical Data Scientist actually does day-to-day"
