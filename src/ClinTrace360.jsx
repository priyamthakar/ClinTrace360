import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  Map,
  ShieldCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

const SITES = ["SITE-101", "SITE-102", "SITE-103", "SITE-104", "SITE-105"];
const VISITS = [
  { num: 1, name: "Screening", day: -14 },
  { num: 2, name: "Baseline", day: 0 },
  { num: 3, name: "Week 4", day: 28 },
  { num: 4, name: "Week 8", day: 56 },
  { num: 5, name: "Week 12", day: 84 },
  { num: 6, name: "Week 16", day: 112 },
  { num: 7, name: "EOT", day: 140 },
];
const ANALYTES = {
  ALT: { name: "Alanine Aminotransferase", unit: "U/L", low: 7, high: 55 },
  CREA: { name: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.3 },
  HGB: { name: "Hemoglobin", unit: "g/dL", low: 12, high: 17.5 },
};

const QUERY_TEMPLATES = {
  MISSING_IN_AE:
    "SAE record for subject {USUBJID} with term '{SAETERM}' dated {SAESTDTC} exists in the safety database but no corresponding AE record with AESER='Y' was found in the EDC. Please enter the AE record or provide clarification.",
  MISSING_IN_SAFETY:
    "AE record for subject {USUBJID} with term '{AETERM}' is marked as serious (AESER='Y') in the EDC but no corresponding SAE record was found in the safety database. Please submit the SAE form or update the AE seriousness field.",
  TERM_MISMATCH:
    "For subject {USUBJID}, the AE verbatim term '{AETERM}' in EDC does not match the SAE verbatim term '{SAETERM}' in the safety database. Please reconcile the terms and update the appropriate record.",
  DATE_MISMATCH:
    "For subject {USUBJID}, the AE start date ({AESTDTC}) in EDC differs from the SAE onset date ({SAESTDTC}) in the safety database by more than 1 day. Please verify and correct the dates.",
  REPORTING_BREACH:
    "SAE for subject {USUBJID} with term '{SAETERM}' was reported on {SAERPTDT}, which is more than 24 hours after site awareness ({SAESTDTC}). This may represent a regulatory reporting timeline breach. Please provide justification.",
  LAB_MISSING_IN_EDC:
    "Local lab result for subject {USUBJID}, test {LBTESTCD} on {LBDT} with value {LBORRES} {LBSTRESU} is present in the local lab file but has no corresponding entry in the EDC laboratory domain. Please enter the result or provide clarification.",
  LAB_VALUE_MISMATCH:
    "For subject {USUBJID}, test {LBTESTCD} on {LBDT}: EDC value is {EDC_VALUE} {EDC_UNIT} but local lab file shows {LOCAL_VALUE} {LOCAL_UNIT}. Please verify and correct.",
  LAB_UNIT_MISMATCH:
    "For subject {USUBJID}, test {LBTESTCD} on {LBDT}: EDC unit is '{EDC_UNIT}' but local lab file unit is '{LOCAL_UNIT}'. Please verify the conversion and ensure consistency.",
};

const CRF_TEMPLATES = {
  demographics: {
    label: "Demographics CRF",
    fields: [
      { label: "Subject Identifier", type: "Char" },
      { label: "Date of Birth", type: "Date" },
      { label: "Sex", type: "Char", codelist: "Male, Female, Unknown" },
      { label: "Race", type: "Char", codelist: "White, Black or African American, Asian, Other, Multiple" },
      { label: "Ethnicity", type: "Char", codelist: "Hispanic or Latino, Not Hispanic or Latino, Not Reported, Unknown" },
      { label: "Country", type: "Char" },
      { label: "Date of Informed Consent", type: "Date" },
      { label: "Age at Screening", type: "Num" },
    ],
  },
  vitals: {
    label: "Vital Signs CRF",
    fields: [
      { label: "Vital Signs Date", type: "Date" },
      { label: "Vital Signs Time", type: "Time" },
      { label: "Systolic Blood Pressure (mmHg)", type: "Num" },
      { label: "Diastolic Blood Pressure (mmHg)", type: "Num" },
      { label: "Heart Rate (bpm)", type: "Num" },
      { label: "Body Temperature (C)", type: "Num" },
      { label: "Respiratory Rate (breaths/min)", type: "Num" },
      { label: "Weight (kg)", type: "Num" },
      { label: "Height (cm)", type: "Num" },
      { label: "Position", type: "Char", codelist: "Supine, Sitting, Standing" },
    ],
  },
  adverse_events: {
    label: "Adverse Events CRF",
    fields: [
      { label: "Adverse Event Term (Verbatim)", type: "Char" },
      { label: "AE Start Date", type: "Date" },
      { label: "AE End Date", type: "Date" },
      { label: "Severity", type: "Char", codelist: "Mild, Moderate, Severe" },
      { label: "Serious?", type: "Char", codelist: "Yes, No" },
      { label: "Causality (Relationship to Study Drug)", type: "Char" },
      { label: "Action Taken with Study Drug", type: "Char" },
      { label: "Outcome", type: "Char" },
      { label: "SAE Criteria Met", type: "Char" },
    ],
  },
  conmeds: {
    label: "Concomitant Medications CRF",
    fields: [
      { label: "Medication Name (Generic)", type: "Char" },
      { label: "ATC Code", type: "Char" },
      { label: "Indication", type: "Char" },
      { label: "Dose", type: "Num" },
      { label: "Dose Unit", type: "Char", codelist: "mg, mcg, mL, IU, g" },
      { label: "Route", type: "Char" },
      { label: "Frequency", type: "Char" },
      { label: "Start Date", type: "Date" },
      { label: "End Date", type: "Date" },
      { label: "Ongoing?", type: "Char", codelist: "Yes, No" },
    ],
  },
  labs: {
    label: "Lab Results CRF",
    fields: [
      { label: "Lab Test Name", type: "Char" },
      { label: "Lab Test Code (LOINC)", type: "Char" },
      { label: "Specimen Collection Date", type: "Date" },
      { label: "Result (Original Units)", type: "Num" },
      { label: "Original Units", type: "Char" },
      { label: "Result (Standard Units)", type: "Num" },
      { label: "Standard Units", type: "Char" },
      { label: "Normal Range Low", type: "Num" },
      { label: "Normal Range High", type: "Num" },
      { label: "Clinical Significance", type: "Char" },
      { label: "Fasting Status", type: "Char", codelist: "Yes, No" },
    ],
  },
};

const SAMPLE_PROTOCOL_TEXT = `Phase 2, randomized, double-blind, placebo-controlled study of Drug A 100 mg in adults with chronic inflammatory disease.

Primary endpoint: change from baseline in disease activity score at Week 12.
Secondary endpoints: ALT, creatinine, hemoglobin safety trends, adverse events, and treatment discontinuation through Week 16.

Eligibility: adults age 18 to 75 years, signed informed consent, confirmed diagnosis, and adequate renal and hepatic function. Exclusion criteria include pregnancy, ALT or AST greater than 2x ULN at screening, uncontrolled infection, recent investigational drug use, and serious cardiovascular disease.

Visit schedule: Screening, Baseline, Week 4, Week 8, Week 12, Week 16, and End of Treatment. Labs, vitals, adverse events, concomitant medications, and study drug accountability are reviewed at each post-baseline visit.

Safety monitoring includes AE and SAE collection from consent through follow-up. SAEs must be reported within 24 hours. Central laboratory testing includes ALT, AST, bilirubin, creatinine, and hemoglobin.`;

const modules = [
  { id: "protocol", label: "Protocol to DQP", icon: FileText, phase: "Phase 3" },
  { id: "mapper", label: "CRF to SDTM Mapper", icon: Map, phase: "Phase 3" },
  { id: "review", label: "Data Review Dashboard", icon: LayoutDashboard, phase: "Phase 1" },
  { id: "recon", label: "SAE/Lab Reconciliation", icon: GitCompareArrows, phase: "Phase 2" },
  { id: "about", label: "Methodology", icon: ShieldCheck, phase: "Always" },
];

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000);
}

function fillTemplate(template, values) {
  return template.replaceAll(/\{([^}]+)\}/g, (_, key) => values[key] ?? "");
}

function normalizeTerm(term) {
  return String(term ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCrfInput(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, type = "", codelist = ""] = line.split("|").map((part) => part.trim());
      return { label, type, codelist };
    });
}

function formatCrfFields(fields) {
  return fields.map((field) => [field.label, field.type, field.codelist].filter(Boolean).join(" | ")).join("\n");
}

function mapCrfField(field, index) {
  const label = field.label;
  const lower = label.toLowerCase();
  const contains = (...terms) => terms.some((term) => lower.includes(term));
  const base = {
    rowId: `MAP-${String(index + 1).padStart(3, "0")}`,
    crfField: label,
    dataType: field.type || "Not specified",
    codelist: field.codelist || "",
    domain: "SUPP--",
    variable: "QNAM/QVAL",
    variableLabel: "Supplemental Qualifier",
    controlledTerminology: "Sponsor-defined; review against CDISC CT",
    notes: "No confident standard SDTM target found. Route to supplemental qualifier or sponsor-defined mapping review.",
    confidence: "Low",
    reference: "SDTMIG v3.4, Supplemental Qualifiers",
  };

  const high = (mapping) => ({ ...base, confidence: "High", ...mapping });
  const medium = (mapping) => ({ ...base, confidence: "Medium", ...mapping });

  if (contains("subject identifier", "subject id", "usubjid")) return high({ domain: "DM", variable: "USUBJID", variableLabel: "Unique Subject Identifier", controlledTerminology: "N/A", notes: "Populate from sponsor/study/site/subject identifier convention.", reference: "SDTMIG v3.4, DM" });
  if (contains("date of birth", "birth date", "dob")) return high({ domain: "DM", variable: "BRTHDTC", variableLabel: "Date/Time of Birth", controlledTerminology: "ISO 8601 date", notes: "Convert collected birth date to ISO 8601 partial or full date as permitted.", reference: "SDTMIG v3.4, DM" });
  if (contains("sex")) return high({ domain: "DM", variable: "SEX", variableLabel: "Sex", controlledTerminology: "CDISC CT C66731", notes: "Normalize collected values to CDISC sex terminology.", reference: "SDTMIG v3.4, DM" });
  if (contains("race")) return high({ domain: "DM", variable: "RACE", variableLabel: "Race", controlledTerminology: "CDISC CT C74457", notes: "Map collected race values to CDISC controlled terminology.", reference: "SDTMIG v3.4, DM" });
  if (contains("ethnicity")) return high({ domain: "DM", variable: "ETHNIC", variableLabel: "Ethnicity", controlledTerminology: "CDISC CT C66790", notes: "Map to ethnicity codelist.", reference: "SDTMIG v3.4, DM" });
  if (contains("country")) return high({ domain: "DM", variable: "COUNTRY", variableLabel: "Country", controlledTerminology: "ISO 3166 / CDISC country terms", notes: "Store subject country in standardized country terminology.", reference: "SDTMIG v3.4, DM" });
  if (contains("informed consent", "consent")) return medium({ domain: "DS", variable: "DSSTDTC", variableLabel: "Start Date/Time of Disposition Event", controlledTerminology: "DSDECOD sponsor/CDISC disposition event", notes: "Often represented as informed consent disposition or trial milestone; confirm study convention.", reference: "SDTMIG v3.4, DS" });
  if (contains("age")) return high({ domain: "DM", variable: "AGE", variableLabel: "Age", controlledTerminology: "AGEU uses CDISC age unit terminology", notes: "Derive or map age at reference time point with AGEU.", reference: "SDTMIG v3.4, DM" });

  if (contains("systolic")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='SYSBP'", notes: "Map as VS record where VSTESTCD is SYSBP and VSORRESU captures mmHg.", reference: "SDTMIG v3.4, VS" });
  if (contains("diastolic")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='DIABP'", notes: "Map as VS record where VSTESTCD is DIABP.", reference: "SDTMIG v3.4, VS" });
  if (contains("heart rate", "pulse")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='HR'", notes: "Map as VS heart rate with unit beats/min.", reference: "SDTMIG v3.4, VS" });
  if (contains("temperature")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='TEMP'", notes: "Map as VS body temperature and preserve collected unit.", reference: "SDTMIG v3.4, VS" });
  if (contains("respiratory")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='RESP'", notes: "Map as respiratory rate.", reference: "SDTMIG v3.4, VS" });
  if (contains("weight")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='WEIGHT'", notes: "Map as VS weight with VSORRESU.", reference: "SDTMIG v3.4, VS" });
  if (contains("height")) return high({ domain: "VS", variable: "VSORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "VSTESTCD='HEIGHT'", notes: "Map as VS height with VSORRESU.", reference: "SDTMIG v3.4, VS" });
  if (contains("position")) return high({ domain: "VS", variable: "VSPOS", variableLabel: "Vital Signs Position of Subject", controlledTerminology: "CDISC position terminology", notes: "Normalize position values such as sitting, standing, supine.", reference: "SDTMIG v3.4, VS" });
  if (contains("vital signs date", "vital sign date")) return high({ domain: "VS", variable: "VSDTC", variableLabel: "Date/Time of Measurements", controlledTerminology: "ISO 8601 date/time", notes: "Use as VS assessment date.", reference: "SDTMIG v3.4, VS" });
  if (contains("time") && contains("vital")) return medium({ domain: "VS", variable: "VSDTC", variableLabel: "Date/Time of Measurements", controlledTerminology: "ISO 8601 date/time", notes: "Combine date and time into VSDTC when both are collected.", reference: "SDTMIG v3.4, VS" });

  if (contains("adverse event term", "ae term", "verbatim")) return high({ domain: "AE", variable: "AETERM", variableLabel: "Reported Term for the Adverse Event", controlledTerminology: "Verbatim; coded to MedDRA separately", notes: "Collected verbatim AE term maps to AETERM.", reference: "SDTMIG v3.4, AE" });
  if (contains("ae start", "start date") && !contains("medication")) return high({ domain: "AE", variable: "AESTDTC", variableLabel: "Start Date/Time of Adverse Event", controlledTerminology: "ISO 8601 date/time", notes: "Map AE onset date to AESTDTC.", reference: "SDTMIG v3.4, AE" });
  if (contains("ae end", "end date") && !contains("medication")) return high({ domain: "AE", variable: "AEENDTC", variableLabel: "End Date/Time of Adverse Event", controlledTerminology: "ISO 8601 date/time", notes: "Map AE end/resolution date to AEENDTC.", reference: "SDTMIG v3.4, AE" });
  if (contains("severity")) return high({ domain: "AE", variable: "AESEV", variableLabel: "Severity/Intensity", controlledTerminology: "MILD, MODERATE, SEVERE", notes: "Normalize severity values to CDISC AE severity terms.", reference: "SDTMIG v3.4, AE" });
  if (contains("serious")) return high({ domain: "AE", variable: "AESER", variableLabel: "Serious Event", controlledTerminology: "Y/N", notes: "Map seriousness flag to AESER.", reference: "SDTMIG v3.4, AE" });
  if (contains("causality", "relationship")) return high({ domain: "AE", variable: "AEREL", variableLabel: "Causality", controlledTerminology: "Sponsor-defined relationship terms", notes: "Map relationship to study drug to AEREL.", reference: "SDTMIG v3.4, AE" });
  if (contains("action taken")) return high({ domain: "AE", variable: "AEACN", variableLabel: "Action Taken with Study Treatment", controlledTerminology: "CDISC action taken terminology", notes: "Map treatment action for AE.", reference: "SDTMIG v3.4, AE" });
  if (contains("outcome")) return high({ domain: "AE", variable: "AEOUT", variableLabel: "Outcome of Adverse Event", controlledTerminology: "CDISC outcome terminology", notes: "Normalize outcome terms.", reference: "SDTMIG v3.4, AE" });
  if (contains("sae criteria", "hospitalization", "life-threatening")) return medium({ domain: "AE", variable: "AESLIFE/AESHOSP/AESMIE", variableLabel: "Serious Event Criteria Flags", controlledTerminology: "Y/N", notes: "Split selected SAE criterion into the corresponding seriousness criterion flag.", reference: "SDTMIG v3.4, AE" });

  if (contains("medication name", "generic")) return high({ domain: "CM", variable: "CMTRT", variableLabel: "Reported Name of Drug, Med, or Therapy", controlledTerminology: "Verbatim; coded with WHO Drug/ATC separately", notes: "Map collected medication name to CMTRT.", reference: "SDTMIG v3.4, CM" });
  if (contains("atc")) return medium({ domain: "CM", variable: "CMCLASCD", variableLabel: "Medication Class Code", controlledTerminology: "ATC", notes: "ATC may be represented in coding variables depending on study standards.", reference: "SDTMIG v3.4, CM" });
  if (contains("indication")) return high({ domain: "CM", variable: "CMINDC", variableLabel: "Indication", controlledTerminology: "Sponsor-defined or MedDRA-coded", notes: "Map reason for medication use to CMINDC.", reference: "SDTMIG v3.4, CM" });
  if (contains("dose unit")) return high({ domain: "CM", variable: "CMDOSU", variableLabel: "Dose Units", controlledTerminology: "CDISC unit terminology", notes: "Normalize collected dose unit.", reference: "SDTMIG v3.4, CM" });
  if (contains("dose")) return high({ domain: "CM", variable: "CMDOSE", variableLabel: "Dose per Administration", controlledTerminology: "Numeric", notes: "Map medication dose amount to CMDOSE.", reference: "SDTMIG v3.4, CM" });
  if (contains("route")) return high({ domain: "CM", variable: "CMROUTE", variableLabel: "Route of Administration", controlledTerminology: "CDISC route terminology", notes: "Normalize route values.", reference: "SDTMIG v3.4, CM" });
  if (contains("frequency")) return high({ domain: "CM", variable: "CMDOSFRQ", variableLabel: "Dosing Frequency per Interval", controlledTerminology: "CDISC frequency terminology", notes: "Normalize frequency values such as QD/BID/PRN.", reference: "SDTMIG v3.4, CM" });
  if (contains("ongoing")) return medium({ domain: "CM", variable: "CMENRF", variableLabel: "End Relative to Reference Period", controlledTerminology: "AFTER/ONGOING convention", notes: "Use to derive ongoing/end-relative status depending on study standard.", reference: "SDTMIG v3.4, CM" });
  if (contains("start date")) return medium({ domain: "CM", variable: "CMSTDTC", variableLabel: "Start Date/Time of Medication", controlledTerminology: "ISO 8601 date/time", notes: "Ambiguous generic start date; mapped to CM only if source CRF is conmeds.", reference: "SDTMIG v3.4, CM" });
  if (contains("end date")) return medium({ domain: "CM", variable: "CMENDTC", variableLabel: "End Date/Time of Medication", controlledTerminology: "ISO 8601 date/time", notes: "Ambiguous generic end date; mapped to CM only if source CRF is conmeds.", reference: "SDTMIG v3.4, CM" });

  if (contains("lab test name")) return high({ domain: "LB", variable: "LBTEST", variableLabel: "Lab Test or Examination Name", controlledTerminology: "CDISC LB test terminology where applicable", notes: "Map descriptive lab test name to LBTEST.", reference: "SDTMIG v3.4, LB" });
  if (contains("loinc", "lab test code")) return high({ domain: "LB", variable: "LBLOINC/LBTESTCD", variableLabel: "LOINC Code / Lab Test Short Name", controlledTerminology: "LOINC and CDISC LBTESTCD", notes: "Preserve LOINC separately where collected; map CDISC short code to LBTESTCD.", reference: "SDTMIG v3.4, LB" });
  if (contains("specimen collection", "collection date")) return high({ domain: "LB", variable: "LBDTC", variableLabel: "Date/Time of Specimen Collection", controlledTerminology: "ISO 8601 date/time", notes: "Map specimen collection datetime to LBDTC.", reference: "SDTMIG v3.4, LB" });
  if (contains("original units")) return high({ domain: "LB", variable: "LBORRESU", variableLabel: "Original Units", controlledTerminology: "CDISC unit terminology", notes: "Map original collected units.", reference: "SDTMIG v3.4, LB" });
  if (contains("standard units")) return high({ domain: "LB", variable: "LBSTRESU", variableLabel: "Standard Units", controlledTerminology: "CDISC unit terminology", notes: "Map standardized analysis units.", reference: "SDTMIG v3.4, LB" });
  if (contains("standard") && contains("result")) return high({ domain: "LB", variable: "LBSTRESN", variableLabel: "Numeric Result/Finding in Standard Units", controlledTerminology: "Numeric", notes: "Map numeric standardized result.", reference: "SDTMIG v3.4, LB" });
  if (contains("result")) return high({ domain: "LB", variable: "LBORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "Original result", notes: "Map collected original result.", reference: "SDTMIG v3.4, LB" });
  if (contains("normal range low")) return high({ domain: "LB", variable: "LBORNRLO", variableLabel: "Reference Range Lower Limit in Original Units", controlledTerminology: "Numeric", notes: "Map local/original lower reference limit.", reference: "SDTMIG v3.4, LB" });
  if (contains("normal range high")) return high({ domain: "LB", variable: "LBORNRHI", variableLabel: "Reference Range Upper Limit in Original Units", controlledTerminology: "Numeric", notes: "Map local/original upper reference limit.", reference: "SDTMIG v3.4, LB" });
  if (contains("clinical significance")) return medium({ domain: "LB", variable: "LBNRIND", variableLabel: "Reference Range Indicator", controlledTerminology: "LOW/NORMAL/HIGH or sponsor convention", notes: "Clinical significance may map to interpretation/supplemental qualifier depending on CRF design.", reference: "SDTMIG v3.4, LB" });
  if (contains("fasting")) return high({ domain: "LB", variable: "LBFAST", variableLabel: "Fasting Status", controlledTerminology: "Y/N", notes: "Map fasting flag to LBFAST.", reference: "SDTMIG v3.4, LB" });

  return base;
}

function extractProtocolSignals(text, nctRecord) {
  const source = text || "";
  const lower = source.toLowerCase();
  const phaseMatch = source.match(/phase\s*(1\/2|2\/3|1|2|3|4|i\/ii|ii\/iii|i|ii|iii|iv)/i);
  const visitTerms = ["Screening", "Baseline", "Week 4", "Week 8", "Week 12", "Week 16", "End of Treatment", "EOT", "Follow-up"].filter((visit) => lower.includes(visit.toLowerCase()));
  const labTerms = ["ALT", "AST", "bilirubin", "creatinine", "hemoglobin", "platelets", "glucose"].filter((lab) => lower.includes(lab.toLowerCase()));
  const safetyTerms = ["adverse event", "sae", "serious adverse event", "24 hours", "pregnancy", "concomitant medication"].filter((term) => lower.includes(term));
  const endpointLines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /endpoint|primary|secondary/i.test(line))
    .slice(0, 5);
  const eligibilityLines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /eligib|inclusion|exclusion|adult|pregnan|consent|age/i.test(line))
    .slice(0, 5);

  return {
    title: nctRecord?.title || "Protocol-derived study",
    nctId: nctRecord?.nctId || "",
    phase: nctRecord?.phase || (phaseMatch ? `Phase ${phaseMatch[1].toUpperCase()}` : "Phase not specified"),
    design: nctRecord?.design || (lower.includes("randomized") ? "Randomized controlled study" : "Interventional clinical study"),
    endpoints: endpointLines.length ? endpointLines : ["Primary endpoint not explicitly detected; review protocol synopsis."],
    eligibility: eligibilityLines.length ? eligibilityLines : ["Eligibility criteria require manual review from full protocol."],
    visits: visitTerms.length ? [...new Set(visitTerms.map((visit) => (visit === "EOT" ? "End of Treatment" : visit)))] : ["Screening", "Baseline", "Scheduled treatment visits", "End of Treatment"],
    labs: labTerms.length ? labTerms : ["ALT", "Creatinine", "Hemoglobin"],
    safety: safetyTerms.length ? safetyTerms : ["adverse event", "serious adverse event", "concomitant medication"],
    dosing: lower.includes("placebo") ? "Study treatment with placebo comparator detected." : "Study dosing requires manual confirmation.",
  };
}

function generateDqpPackage(signals) {
  const labList = signals.labs.join(", ");
  const visitList = signals.visits.join(", ");
  return {
    dqpSections: [
      { section: "1.0 Study Overview", content: `${signals.title}. ${signals.phase}. Design summary: ${signals.design}. Key endpoints: ${signals.endpoints.join(" ")}` },
      { section: "2.0 Data Sources and Flow", content: "EDC CRFs, central/local laboratory transfers, safety database SAE records, concomitant medication coding, and exposure accountability will be reviewed through programmed edit checks and periodic clinical data review." },
      { section: "3.0 CRF Completion Guidelines", content: `Sites should complete visit, AE, CM, EX, VS, and LB forms contemporaneously for scheduled visits: ${visitList}. Missing pages and late data entry should be monitored weekly.` },
      { section: "4.0 Edit Check Plan", content: `Edit checks should cover eligibility, visit windows, AE/SAE timing, lab reference ranges, protocol dosing, missing endpoint assessments, and external data consistency. Priority labs: ${labList}.` },
      { section: "5.0 External Data Handling", content: "External lab files should be reconciled against EDC LB records using subject, collection date, test code, result value, and unit. Unit mismatches require conversion review before database lock." },
      { section: "6.0 SAE Reconciliation Plan", content: "SAEs in the safety database must reconcile to EDC AE records marked serious. Missing, date-mismatched, and term-mismatched events generate major or critical queries." },
      { section: "7.0 Medical Coding Plan", content: "AE and medical history terms should be coded with MedDRA. Concomitant medications should be coded with WHO Drug or ATC where applicable." },
      { section: "8.0 Data Review Schedule", content: "Critical safety and eligibility checks should be reviewed weekly. Endpoint completeness and site-level anomalies should be reviewed at least biweekly." },
      { section: "9.0 Database Lock Checklist", content: "Confirm all critical queries are closed, SAE/lab reconciliation is complete, endpoint data are present, coding is finalized, protocol deviations are reviewed, and audit trail exports are retained." },
    ],
    editChecks: [
      { checkId: "EC-001", domain: "DM", variable: "AGE", logic: "IF AGE < 18 THEN QUERY", severity: "Hard", queryText: "Subject appears below adult eligibility threshold. Please verify age and eligibility." },
      { checkId: "EC-002", domain: "DS", variable: "DSSTDTC", logic: "IF RFSTDTC < CONSENTDTC THEN QUERY", severity: "Hard", queryText: "First dose date precedes informed consent date. Please verify dates." },
      { checkId: "EC-003", domain: "SV", variable: "SVSTDTC", logic: "IF ABS(SVSTDTC - EXPECTED_VISIT_DATE) > 7 DAYS THEN QUERY", severity: "Soft", queryText: "Visit date is outside the protocol-defined window. Please confirm or document deviation." },
      { checkId: "EC-004", domain: "LB", variable: "LBORRES", logic: `IF LBTESTCD IN (${signals.labs.join("|")}) AND LBORRES OUTSIDE NORMAL RANGE THEN QUERY`, severity: "Soft", queryText: "Laboratory value is outside normal range. Please verify result and clinical significance." },
      { checkId: "EC-005", domain: "LB", variable: "ALT", logic: "IF ALT > 3 * ULN THEN CRITICAL QUERY", severity: "Hard", queryText: "ALT exceeds 3x ULN. Please verify source data and assess safety follow-up." },
      { checkId: "EC-006", domain: "AE", variable: "AESTDTC", logic: "IF AESTDTC < RFSTDTC THEN QUERY", severity: "Soft", queryText: "AE start date occurs before first dose. Please confirm whether this is medical history or pre-treatment AE." },
      { checkId: "EC-007", domain: "AE", variable: "AESER", logic: "IF AESER='Y' AND NO MATCHING SAFETY SAE THEN QUERY", severity: "Hard", queryText: "Serious AE in EDC has no matching safety database SAE record. Please reconcile." },
      { checkId: "EC-008", domain: "EX", variable: "EXDOSE", logic: "IF PLACEBO ARM AND EXDOSE > 0 THEN QUERY", severity: "Hard", queryText: "Placebo-arm subject has non-zero exposure dose. Please verify treatment assignment and dosing record." },
    ],
    uatCases: [
      { testId: "UAT-001", module: "Eligibility", description: "Enter subject age below allowed threshold.", input: "AGE = 17", expected: "Eligibility edit check fires and requires confirmation.", result: "" },
      { testId: "UAT-002", module: "Consent/Dosing", description: "Enter first dose before informed consent.", input: "RFSTDTC before CONSENTDTC", expected: "Hard query fires.", result: "" },
      { testId: "UAT-003", module: "Visits", description: "Enter Week 12 visit outside +/- 7 day window.", input: "SVSTDTC = expected date + 14 days", expected: "Visit window query fires.", result: "" },
      { testId: "UAT-004", module: "Labs", description: "Enter ALT greater than 3x ULN.", input: "ALT = 220 U/L, ULN = 55 U/L", expected: "Critical lab query fires.", result: "" },
      { testId: "UAT-005", module: "AE/SAE", description: "Mark AE serious without safety SAE match.", input: "AESER = Y, no SAE record", expected: "SAE reconciliation query generated.", result: "" },
      { testId: "UAT-006", module: "Exposure", description: "Enter non-zero dose for placebo arm.", input: "ARM = PLACEBO, EXDOSE = 100", expected: "Dose consistency query fires.", result: "" },
    ],
    reviewChecklist: [
      { riskArea: "Eligibility violations", priority: "High", frequency: "Weekly", responsible: "Lead CDM", indicators: "Age, consent, inclusion/exclusion deviations" },
      { riskArea: "Missing primary endpoint", priority: "High", frequency: "Biweekly", responsible: "Lead CDM + study team", indicators: "Endpoint form completion at key visit" },
      { riskArea: "Safety lab trends", priority: "High", frequency: "Weekly", responsible: "Clinical data scientist", indicators: `${labList} outliers and trend alerts` },
      { riskArea: "SAE reconciliation", priority: "High", frequency: "Weekly", responsible: "Safety + CDM", indicators: "Missing SAE, term/date mismatch, late reporting" },
      { riskArea: "Visit compliance", priority: "Medium", frequency: "Biweekly", responsible: "CDM + CRA", indicators: "Missing visits, out-of-window visits, site-level patterns" },
      { riskArea: "Exposure consistency", priority: "Medium", frequency: "Monthly", responsible: "CDM", indicators: "Dose mismatch, placebo dosing, interruption records" },
    ],
  };
}

function formatDqpForExport(signals, dqp) {
  const sectionText = dqp.dqpSections.map((row) => `${row.section}\n${row.content}`).join("\n\n");
  const checks = dqp.editChecks.map((row) => `${row.checkId} | ${row.domain} | ${row.variable} | ${row.logic} | ${row.severity} | ${row.queryText}`).join("\n");
  const uat = dqp.uatCases.map((row) => `${row.testId} | ${row.module} | ${row.description} | ${row.input} | ${row.expected}`).join("\n");
  const review = dqp.reviewChecklist.map((row) => `${row.riskArea} | ${row.priority} | ${row.frequency} | ${row.responsible} | ${row.indicators}`).join("\n");
  return `ClinTrace360 DQP Skeleton\nStudy: ${signals.title}\nPhase: ${signals.phase}\nDesign: ${signals.design}\n\n${sectionText}\n\nEdit Checks\n${checks}\n\nUAT Cases\n${uat}\n\nRisk-Based Review Checklist\n${review}\n\nLimitation: This is a generated skeleton for demonstration and must be reviewed by qualified clinical data management staff.`;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => escapeCell(row[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is optional; app should continue if storage is blocked.
  }
}

function saveHistoryItem(key, item, limit = 8) {
  const current = readStorage(key, []);
  const next = [item, ...current].slice(0, limit);
  writeStorage(key, next);
  return next;
}

function generateSyntheticTrialData() {
  const rand = seededRandom(360);
  const dm = [];
  const sv = [];
  const lb = [];
  const ae = [];
  const ex = [];
  let subjectIndex = 1;

  SITES.forEach((site, siteIndex) => {
    for (let i = 0; i < 8; i += 1) {
      const usubjid = `CT360-${site.slice(-3)}-${String(i + 1).padStart(3, "0")}`;
      const armcd = subjectIndex <= 20 ? "DRUG A" : "PLACEBO";
      const baseline = addDays(new Date("2026-01-15"), siteIndex * 3 + i);
      const consentDate = iso(addDays(baseline, subjectIndex === 2 ? 2 : -7));
      const rfstdtc = iso(baseline);
      const age = subjectIndex === 1 ? 17 : 22 + Math.floor(rand() * 47);

      dm.push({
        USUBJID: usubjid,
        SITEID: site,
        BRTHDTC: `${2026 - age}-06-15`,
        AGE: age,
        SEX: rand() > 0.5 ? "F" : "M",
        RACE: ["White", "Asian", "Black or African American", "Other"][Math.floor(rand() * 4)],
        ETHNIC: rand() > 0.75 ? "Hispanic or Latino" : "Not Hispanic or Latino",
        ARMCD: armcd,
        ARM: armcd === "DRUG A" ? "DRUG A 100mg" : "Placebo",
        RFSTDTC: rfstdtc,
        RFENDTC: iso(addDays(baseline, 140)),
        COUNTRY: "IND",
        CONSENTDTC: consentDate,
      });

      VISITS.forEach((visit) => {
        const forcedMissing = site === "SITE-104" && visit.num === 5 && i < 5;
        const randomMissing = rand() < 0.035 && visit.num > 2;
        if (!forcedMissing && !randomMissing) {
          const windowOffset = [9, -10, 12].includes(subjectIndex + visit.num) ? 10 : Math.floor(rand() * 7) - 3;
          const visitDate = iso(addDays(baseline, visit.day + windowOffset));
          sv.push({ USUBJID: usubjid, SITEID: site, VISITNUM: visit.num, VISIT: visit.name, SVSTDTC: visitDate, EXPECTED_DTC: iso(addDays(baseline, visit.day)) });

          Object.entries(ANALYTES).forEach(([code, meta]) => {
            let value;
            if (code === "ALT") value = 18 + Math.round(rand() * 25);
            if (code === "CREA") value = Number((0.7 + rand() * 0.45).toFixed(2));
            if (code === "HGB") value = Number((12.5 + rand() * 3.2).toFixed(1));
            if (site === "SITE-103" && code === "ALT" && visit.num >= 4) value = 80 + Math.round(rand() * 170);
            if (site === "SITE-105" && code === "HGB" && rand() < 0.3) value = Number((3 + rand() * 3).toFixed(1));
            if (subjectIndex === 7 && code === "CREA" && visit.num === 6) value = 2.4;
            lb.push({
              USUBJID: usubjid,
              SITEID: site,
              VISITNUM: visit.num,
              VISIT: visit.name,
              LBDT: visitDate,
              LBTESTCD: code,
              LBTEST: meta.name,
              LBORRES: value,
              LBORNRLO: meta.low,
              LBORNRHI: meta.high,
              LBSTRESU: meta.unit,
            });
          });

          ex.push({
            USUBJID: usubjid,
            SITEID: site,
            VISITNUM: visit.num,
            EXTRT: armcd === "DRUG A" ? "Drug A" : "Placebo",
            EXDOSE: armcd === "PLACEBO" ? 0 : 100,
            EXDOSU: "mg",
            EXSTDTC: visitDate,
            EXENDTC: visitDate,
          });
        }
      });

      if (site !== "SITE-104") {
        const count = 1 + Math.floor(rand() * 4);
        for (let n = 0; n < count; n += 1) {
          const startOffset = 6 + Math.floor(rand() * 120);
          const term = ["Headache", "Nausea", "Fatigue", "Injection site reaction", "Dizziness"][Math.floor(rand() * 5)];
          ae.push({
            USUBJID: usubjid,
            SITEID: site,
            AETERM: term,
            AEDECOD: term.toUpperCase(),
            AEBODSYS: term === "Nausea" ? "GASTROINTESTINAL DISORDERS" : "GENERAL DISORDERS",
            AESTDTC: iso(addDays(baseline, startOffset)),
            AEENDTC: iso(addDays(baseline, startOffset + 3 + Math.floor(rand() * 20))),
            AESEV: ["MILD", "MODERATE", "SEVERE"][Math.floor(rand() * 3)],
            AESER: "N",
            AEREL: rand() > 0.65 ? "POSSIBLE" : "NOT RELATED",
            AEACN: "NONE",
            AEOUT: "RECOVERED/RESOLVED",
          });
        }
      }
      subjectIndex += 1;
    }
  });

  ae.push(
    { ...ae[0], USUBJID: dm[5].USUBJID, SITEID: dm[5].SITEID, AETERM: "Migraine", AESTDTC: iso(addDays(new Date(dm[5].RFSTDTC), -3)), AEENDTC: iso(addDays(new Date(dm[5].RFSTDTC), 2)) },
    { ...ae[1], USUBJID: dm[12].USUBJID, SITEID: dm[12].SITEID, AETERM: "Vomiting", AESTDTC: iso(addDays(new Date(dm[12].RFSTDTC), -2)), AEENDTC: iso(addDays(new Date(dm[12].RFSTDTC), 4)) },
    { ...ae[2], USUBJID: dm[18].USUBJID, SITEID: dm[18].SITEID, AETERM: "Rash", AESTDTC: iso(addDays(new Date(dm[18].RFSTDTC), 40)), AEENDTC: iso(addDays(new Date(dm[18].RFSTDTC), 35)) },
    { ...ae[3], USUBJID: dm[24].USUBJID, SITEID: dm[24].SITEID, AETERM: "Severe dehydration", AESER: "Y", AESEV: "SEVERE", AESTDTC: iso(addDays(new Date(dm[24].RFSTDTC), 34)), AEENDTC: iso(addDays(new Date(dm[24].RFSTDTC), 41)) }
  );
  [
    { subject: dm[22].USUBJID, visit: 3, dose: 50 },
    { subject: dm[28].USUBJID, visit: 4, dose: 25 },
    { subject: dm[27].USUBJID, visit: 3, dose: 100 },
  ].forEach((override) => {
    const row = ex.find((record) => record.USUBJID === override.subject && record.VISITNUM === override.visit);
    if (row) row.EXDOSE = override.dose;
  });

  const seriousAe = ae.find((row) => row.AESER === "Y");
  const relatedSubject = dm[10];
  const lateSubject = dm[14];
  const safety = [
    {
      USUBJID: seriousAe.USUBJID,
      SAESSION: "SAE-001",
      SAETERM: "Severe dehydration",
      SAESTDTC: seriousAe.AESTDTC,
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(seriousAe.AESTDTC), 0)),
    },
    {
      USUBJID: dm[8].USUBJID,
      SAESSION: "SAE-002",
      SAETERM: "Acute pancreatitis",
      SAESTDTC: iso(addDays(new Date(dm[8].RFSTDTC), 46)),
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(dm[8].RFSTDTC), 46)),
    },
    {
      USUBJID: relatedSubject.USUBJID,
      SAESSION: "SAE-003",
      SAETERM: "Drug-related liver injury",
      SAESTDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
      SAESER: "Y",
      SAECRIT: "Other Medically Important",
      SAERPTDT: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
    },
    {
      USUBJID: lateSubject.USUBJID,
      SAESSION: "SAE-004",
      SAETERM: "Syncope",
      SAESTDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 28)),
      SAESER: "Y",
      SAECRIT: "Life-threatening",
      SAERPTDT: iso(addDays(new Date(lateSubject.RFSTDTC), 30)),
    },
    {
      USUBJID: dm[3].USUBJID,
      SAESSION: "SAE-005",
      SAETERM: "Pneumonia",
      SAESTDTC: iso(addDays(new Date(dm[3].RFSTDTC), 91)),
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(dm[3].RFSTDTC), 91)),
    },
  ];

  ae.push(
    {
      USUBJID: relatedSubject.USUBJID,
      SITEID: relatedSubject.SITEID,
      AETERM: "Hepatic injury",
      AEDECOD: "HEPATIC INJURY",
      AEBODSYS: "HEPATOBILIARY DISORDERS",
      AESTDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
      AEENDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 80)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "PROBABLE",
      AEACN: "DRUG INTERRUPTED",
      AEOUT: "RECOVERING/RESOLVING",
    },
    {
      USUBJID: lateSubject.USUBJID,
      SITEID: lateSubject.SITEID,
      AETERM: "Syncope",
      AEDECOD: "SYNCOPE",
      AEBODSYS: "NERVOUS SYSTEM DISORDERS",
      AESTDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 25)),
      AEENDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 29)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "POSSIBLE",
      AEACN: "DRUG INTERRUPTED",
      AEOUT: "RECOVERED/RESOLVED",
    },
    {
      USUBJID: dm[20].USUBJID,
      SITEID: dm[20].SITEID,
      AETERM: "Anaphylactic reaction",
      AEDECOD: "ANAPHYLACTIC REACTION",
      AEBODSYS: "IMMUNE SYSTEM DISORDERS",
      AESTDTC: iso(addDays(new Date(dm[20].RFSTDTC), 51)),
      AEENDTC: iso(addDays(new Date(dm[20].RFSTDTC), 53)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "POSSIBLE",
      AEACN: "DRUG WITHDRAWN",
      AEOUT: "RECOVERED/RESOLVED",
    }
  );

  const localLabs = lb
    .filter((row) => row.SITEID !== "SITE-104" && row.VISITNUM >= 3 && row.LBTESTCD !== "CREA")
    .slice(0, 56)
    .map((row) => ({
      USUBJID: row.USUBJID,
      SITEID: row.SITEID,
      LABSRC: "Local",
      LBTESTCD: row.LBTESTCD,
      LBDT: row.LBDT,
      LBORRES: row.LBORRES,
      LBSTRESU: row.LBSTRESU,
    }));
  localLabs.push(
    { USUBJID: dm[6].USUBJID, SITEID: dm[6].SITEID, LABSRC: "Local", LBTESTCD: "ALT", LBDT: iso(addDays(new Date(dm[6].RFSTDTC), 67)), LBORRES: 144, LBSTRESU: "U/L" },
    { USUBJID: dm[16].USUBJID, SITEID: dm[16].SITEID, LABSRC: "Local", LBTESTCD: "HGB", LBDT: iso(addDays(new Date(dm[16].RFSTDTC), 73)), LBORRES: 9.8, LBSTRESU: "g/dL" },
    { USUBJID: dm[31].USUBJID, SITEID: dm[31].SITEID, LABSRC: "Local", LBTESTCD: "ALT", LBDT: iso(addDays(new Date(dm[31].RFSTDTC), 82)), LBORRES: 88, LBSTRESU: "U/L" }
  );
  if (localLabs[3]) localLabs[3] = { ...localLabs[3], LBORRES: Number(localLabs[3].LBORRES) + 15 };
  if (localLabs[11]) localLabs[11] = { ...localLabs[11], LBORRES: Number(localLabs[11].LBORRES) - 2 };
  if (localLabs[18]) localLabs[18] = { ...localLabs[18], LBSTRESU: localLabs[18].LBTESTCD === "ALT" ? "ukat/L" : "mmol/L" };

  return { dm, sv, lb, ae, ex, safety, localLabs };
}

function generateFindings(data) {
  const findings = [];
  const addFinding = (category, row) => findings.push({ findingId: `F-${String(findings.length + 1).padStart(3, "0")}`, status: "Open", ...row, category });
  const dmBySubject = new Map(data.dm.map((row) => [row.USUBJID, row]));

  data.dm.forEach((subject) => {
    if (subject.AGE < 18) {
      addFinding("PROTOCOL", { USUBJID: subject.USUBJID, SITEID: subject.SITEID, domain: "DM", variable: "AGE", description: `Subject age is ${subject.AGE}, below adult eligibility threshold.`, severity: "Critical" });
    }
    if (subject.RFSTDTC < subject.CONSENTDTC) {
      addFinding("TIMING", { USUBJID: subject.USUBJID, SITEID: subject.SITEID, domain: "DM", variable: "RFSTDTC", description: "First dose date precedes informed consent date.", severity: "Critical" });
    }
    VISITS.forEach((visit) => {
      const present = data.sv.some((row) => row.USUBJID === subject.USUBJID && row.VISITNUM === visit.num);
      if (!present) {
        addFinding("MISSING", { USUBJID: subject.USUBJID, SITEID: subject.SITEID, domain: "SV", variable: "VISIT", description: `${visit.name} visit is missing.`, severity: visit.num <= 2 ? "Critical" : "Major" });
      }
    });
  });

  data.sv.forEach((row) => {
    if (Math.abs(daysBetween(row.SVSTDTC, row.EXPECTED_DTC)) > 7) {
      addFinding("TIMING", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "SV", variable: "SVSTDTC", description: `${row.VISIT} is outside the +/- 7 day visit window.`, severity: "Major" });
    }
  });

  data.lb.forEach((row) => {
    if (row.LBORRES > row.LBORNRHI || row.LBORRES < row.LBORNRLO) {
      addFinding("RANGE", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "LB", variable: row.LBTESTCD, description: `${row.LBTESTCD} result ${row.LBORRES} ${row.LBSTRESU} is outside normal range (${row.LBORNRLO}-${row.LBORNRHI}).`, severity: "Major" });
    }
    if (row.LBTESTCD === "ALT" && row.LBORRES > 3 * row.LBORNRHI) {
      addFinding("RANGE", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "LB", variable: "ALT", description: `ALT ${row.LBORRES} U/L exceeds 3x ULN.`, severity: "Critical" });
    }
    if (row.LBTESTCD === "HGB" && row.LBORRES < 5) {
      addFinding("RANGE", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "LB", variable: "HGB", description: `Hemoglobin ${row.LBORRES} g/dL is implausibly low and likely requires source verification.`, severity: "Critical" });
    }
  });

  data.ae.forEach((row) => {
    const subject = dmBySubject.get(row.USUBJID);
    if (row.AESTDTC < subject.RFSTDTC) {
      addFinding("TIMING", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "AE", variable: "AESTDTC", description: `${row.AETERM} starts before first dose.`, severity: "Major" });
    }
    if (row.AEENDTC < row.AESTDTC) {
      addFinding("TIMING", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "AE", variable: "AEENDTC", description: `${row.AETERM} end date is before start date.`, severity: "Major" });
    }
  });

  SITES.forEach((site) => {
    if (!data.ae.some((row) => row.SITEID === site)) {
      addFinding("PROTOCOL", { USUBJID: "Site-level", SITEID: site, domain: "AE", variable: "AETERM", description: "Site has zero AE records across all enrolled subjects; possible underreporting.", severity: "Critical" });
    }
  });

  data.ex.forEach((row) => {
    const subject = dmBySubject.get(row.USUBJID);
    if (subject.ARMCD === "PLACEBO" && row.EXDOSE > 0) {
      addFinding("CONSISTENCY", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "EX", variable: "EXDOSE", description: "Placebo-arm subject has non-zero exposure dose.", severity: "Critical" });
    }
    if (subject.ARMCD === "DRUG A" && row.EXDOSE !== 100) {
      addFinding("CONSISTENCY", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "EX", variable: "EXDOSE", description: `Drug A dose is ${row.EXDOSE} mg instead of the scheduled 100 mg.`, severity: "Major" });
    }
  });

  return findings;
}

function generateReconciliation(data) {
  const saeFindings = [];
  const labFindings = [];
  const queries = [];
  const seriousAes = data.ae.filter((row) => row.AESER === "Y");

  const addQuery = (source, type, severity, usubjid, description, queryText, sourceRef) => {
    const query = {
      queryId: `Q-${String(queries.length + 1).padStart(3, "0")}`,
      type: source,
      mismatchType: type,
      USUBJID: usubjid,
      description,
      queryText,
      severity,
      status: "Open",
      generatedAt: "2026-05-19T06:15:00+05:30",
      sourceRef,
    };
    queries.push(query);
    return query.queryId;
  };

  data.safety.forEach((sae) => {
    const sameSubject = seriousAes.filter((ae) => ae.USUBJID === sae.USUBJID);
    const exact = sameSubject.find((ae) => normalizeTerm(ae.AETERM) === normalizeTerm(sae.SAETERM) && Math.abs(daysBetween(ae.AESTDTC, sae.SAESTDTC)) <= 1);
    const near = sameSubject.find((ae) => Math.abs(daysBetween(ae.AESTDTC, sae.SAESTDTC)) <= 1);
    if (!exact && !near) {
      const queryText = fillTemplate(QUERY_TEMPLATES.MISSING_IN_AE, sae);
      const queryId = addQuery("SAE", "MISSING_IN_AE", "Critical", sae.USUBJID, "Safety database has SAE with no matching serious AE in EDC.", queryText, sae.SAESSION);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "MISSING_IN_AE", severity: "Critical", queryId, edcValue: "No matching AESER='Y' AE", safetyValue: `${sae.SAETERM} / ${sae.SAESTDTC}`, ...sae });
      return;
    }
    const matchedAe = exact ?? near;
    if (normalizeTerm(matchedAe.AETERM) !== normalizeTerm(sae.SAETERM)) {
      const queryText = fillTemplate(QUERY_TEMPLATES.TERM_MISMATCH, { ...matchedAe, ...sae });
      const queryId = addQuery("SAE", "TERM_MISMATCH", "Major", sae.USUBJID, "EDC AE term differs from safety database SAE term.", queryText, sae.SAESSION);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "TERM_MISMATCH", severity: "Major", queryId, edcValue: matchedAe.AETERM, safetyValue: sae.SAETERM, ...sae });
    }
    if (Math.abs(daysBetween(matchedAe.AESTDTC, sae.SAESTDTC)) > 1) {
      const queryText = fillTemplate(QUERY_TEMPLATES.DATE_MISMATCH, { ...matchedAe, ...sae });
      const queryId = addQuery("SAE", "DATE_MISMATCH", "Major", sae.USUBJID, "EDC AE start date differs from safety onset date by more than one day.", queryText, sae.SAESSION);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "DATE_MISMATCH", severity: "Major", queryId, edcValue: matchedAe.AESTDTC, safetyValue: sae.SAESTDTC, ...sae });
    }
    if (daysBetween(sae.SAERPTDT, sae.SAESTDTC) > 1) {
      const queryText = fillTemplate(QUERY_TEMPLATES.REPORTING_BREACH, sae);
      const queryId = addQuery("SAE", "REPORTING_BREACH", "Critical", sae.USUBJID, "SAE report date is more than 24 hours after awareness/onset date.", queryText, sae.SAESSION);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "REPORTING_BREACH", severity: "Critical", queryId, edcValue: "24-hour expectation", safetyValue: `${sae.SAESTDTC} to ${sae.SAERPTDT}`, ...sae });
    }
  });

  seriousAes.forEach((ae) => {
    const matchingSae = data.safety.find((sae) => sae.USUBJID === ae.USUBJID && Math.abs(daysBetween(ae.AESTDTC, sae.SAESTDTC)) <= 1);
    if (!matchingSae) {
      const queryText = fillTemplate(QUERY_TEMPLATES.MISSING_IN_SAFETY, ae);
      const queryId = addQuery("SAE", "MISSING_IN_SAFETY", "Critical", ae.USUBJID, "EDC AE is marked serious but no corresponding safety SAE record was found.", queryText, `${ae.USUBJID}-${ae.AETERM}`);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "MISSING_IN_SAFETY", severity: "Critical", queryId, edcValue: `${ae.AETERM} / ${ae.AESTDTC}`, safetyValue: "No matching SAE record", ...ae });
    }
  });

  data.localLabs.forEach((local) => {
    const edc = data.lb.find((row) => row.USUBJID === local.USUBJID && row.LBTESTCD === local.LBTESTCD && row.LBDT === local.LBDT);
    if (!edc) {
      const queryText = fillTemplate(QUERY_TEMPLATES.LAB_MISSING_IN_EDC, local);
      const queryId = addQuery("Lab", "LAB_MISSING_IN_EDC", "Major", local.USUBJID, "Local lab file contains a result absent from EDC LB domain.", queryText, `${local.USUBJID}-${local.LBTESTCD}-${local.LBDT}`);
      labFindings.push({ findingId: `LAB-${String(labFindings.length + 1).padStart(3, "0")}`, mismatchType: "LAB_MISSING_IN_EDC", severity: "Major", queryId, edcValue: "Missing in EDC", localValue: `${local.LBORRES} ${local.LBSTRESU}`, ...local });
      return;
    }
    if (edc.LBSTRESU !== local.LBSTRESU) {
      const queryText = fillTemplate(QUERY_TEMPLATES.LAB_UNIT_MISMATCH, { ...local, EDC_UNIT: edc.LBSTRESU, LOCAL_UNIT: local.LBSTRESU });
      const queryId = addQuery("Lab", "LAB_UNIT_MISMATCH", "Major", local.USUBJID, "EDC and local lab units differ.", queryText, `${local.USUBJID}-${local.LBTESTCD}-${local.LBDT}`);
      labFindings.push({ findingId: `LAB-${String(labFindings.length + 1).padStart(3, "0")}`, mismatchType: "LAB_UNIT_MISMATCH", severity: "Major", queryId, edcValue: `${edc.LBORRES} ${edc.LBSTRESU}`, localValue: `${local.LBORRES} ${local.LBSTRESU}`, ...local });
      return;
    }
    if (Number(edc.LBORRES) !== Number(local.LBORRES)) {
      const queryText = fillTemplate(QUERY_TEMPLATES.LAB_VALUE_MISMATCH, { ...local, EDC_VALUE: edc.LBORRES, EDC_UNIT: edc.LBSTRESU, LOCAL_VALUE: local.LBORRES, LOCAL_UNIT: local.LBSTRESU });
      const queryId = addQuery("Lab", "LAB_VALUE_MISMATCH", "Major", local.USUBJID, "EDC and local lab result values differ.", queryText, `${local.USUBJID}-${local.LBTESTCD}-${local.LBDT}`);
      labFindings.push({ findingId: `LAB-${String(labFindings.length + 1).padStart(3, "0")}`, mismatchType: "LAB_VALUE_MISMATCH", severity: "Major", queryId, edcValue: `${edc.LBORRES} ${edc.LBSTRESU}`, localValue: `${local.LBORRES} ${local.LBSTRESU}`, ...local });
    }
  });

  return { saeFindings, labFindings, queries };
}

function buildSiteSummary(findings) {
  return SITES.map((site) => {
    const rows = findings.filter((finding) => finding.SITEID === site);
    return {
      site,
      Missing: rows.filter((row) => row.category === "MISSING").length,
      Range: rows.filter((row) => row.category === "RANGE").length,
      Timing: rows.filter((row) => row.category === "TIMING").length,
      Protocol: rows.filter((row) => row.category === "PROTOCOL").length,
      Consistency: rows.filter((row) => row.category === "CONSISTENCY").length,
    };
  });
}

function buildVisitHeatmap(data) {
  return SITES.map((site) => {
    const subjects = data.dm.filter((row) => row.SITEID === site).map((row) => row.USUBJID);
    return {
      site,
      visits: VISITS.map((visit) => {
        const completed = subjects.filter((id) => data.sv.some((row) => row.USUBJID === id && row.VISITNUM === visit.num)).length;
        return { visit: visit.name, pct: Math.round((completed / subjects.length) * 100) };
      }),
    };
  });
}

function AppShell({ activeModule, setActiveModule, children }) {
  const active = modules.find((module) => module.id === activeModule);
  const phaseLabel = activeModule === "review" ? "Phase 1 live" : activeModule === "recon" ? "Phase 2 live" : activeModule === "mapper" || activeModule === "protocol" ? "Phase 3 live" : active?.phase;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CT</div>
          <div>
            <h1>ClinTrace360</h1>
            <p>Clinical Data Quality Workbench</p>
          </div>
        </div>
        <nav className="nav-list" aria-label="Modules">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button className={activeModule === module.id ? "nav-item active" : "nav-item"} key={module.id} onClick={() => setActiveModule(module.id)}>
                <Icon size={18} />
                <span>{module.label}</span>
                <small>{module.phase}</small>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <Database size={16} />
          <span>Synthetic CDISC-style data only</span>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">v0.1 foundation build</p>
            <h2>{active?.label}</h2>
          </div>
          <div className="status-pill">
            <Activity size={16} />
            {phaseLabel}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

function KpiCard({ label, value, detail, tone = "neutral", icon: Icon }) {
  return (
    <section className={`kpi-card ${tone}`}>
      <div className="kpi-icon">{Icon ? <Icon size={20} /> : null}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </section>
  );
}

function Panel({ title, subtitle, action, children }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DataReviewDashboard({ data, findings }) {
  const [analyte, setAnalyte] = useState("ALT");
  const [site, setSite] = useState("All sites");
  const [severityFilter, setSeverityFilter] = useState("All");
  const siteSummary = useMemo(() => buildSiteSummary(findings), [findings]);
  const heatmap = useMemo(() => buildVisitHeatmap(data), [data]);
  const expectedVisits = data.dm.length * VISITS.length;
  const missingVisits = findings.filter((row) => row.category === "MISSING").length;
  const criticalFindings = findings.filter((row) => row.severity === "Critical").length;
  const filteredLabRows = data.lb
    .filter((row) => row.LBTESTCD === analyte && (site === "All sites" || row.SITEID === site))
    .map((row) => ({ ...row, flagged: row.LBORRES < row.LBORNRLO || row.LBORRES > row.LBORNRHI }));
  const timingRows = findings.filter((row) => row.domain === "AE" && row.category === "TIMING");
  const aeBySite = SITES.map((siteId) => ({ site: siteId, count: data.ae.filter((row) => row.SITEID === siteId).length }));
  const visibleFindings = severityFilter === "All" ? findings : findings.filter((row) => row.severity === severityFilter);

  return (
    <div className="workspace">
      <div className="kpi-grid">
        <KpiCard label="Total Subjects" value={data.dm.length} detail="5 sites, 2 arms" icon={Database} />
        <KpiCard label="Expected Visits" value={expectedVisits} detail={`${data.sv.length} captured`} icon={ClipboardCheck} />
        <KpiCard label="Missing Visits" value={missingVisits} detail={`${Math.round((missingVisits / expectedVisits) * 100)}% gap rate`} tone="warn" icon={AlertTriangle} />
        <KpiCard label="Open Queries" value={findings.length} detail="Generated from rule checks" tone="accent" icon={ListChecks} />
        <KpiCard label="Critical Findings" value={criticalFindings} detail="Needs immediate review" tone="danger" icon={ShieldCheck} />
      </div>

      <div className="two-column">
        <Panel title="Site-Level Finding Overview" subtitle="Stacked by transparent CDM review rule category">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteSummary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="site" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Missing" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Range" stackId="a" fill="#ef4444" />
                <Bar dataKey="Timing" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="Protocol" stackId="a" fill="#0ea5e9" />
                <Bar dataKey="Consistency" stackId="a" fill="#14b8a6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel
          title="Lab Trajectory Review"
          subtitle="Individual subject trajectories with normal range overlay"
          action={
            <div className="control-row">
              <select value={analyte} onChange={(event) => setAnalyte(event.target.value)} aria-label="Analyte">
                {Object.keys(ANALYTES).map((code) => (
                  <option key={code}>{code}</option>
                ))}
              </select>
              <select value={site} onChange={(event) => setSite(event.target.value)} aria-label="Site">
                <option>All sites</option>
                {SITES.map((siteId) => (
                  <option key={siteId}>{siteId}</option>
                ))}
              </select>
            </div>
          }
        >
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="VISITNUM" name="Visit" type="number" domain={[1, 7]} ticks={VISITS.map((visit) => visit.num)} />
                <YAxis dataKey="LBORRES" name={analyte} unit={` ${ANALYTES[analyte].unit}`} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value) => [`${value} ${ANALYTES[analyte].unit}`, analyte]} labelFormatter={(value) => `Visit ${value}`} />
                <ReferenceArea y1={ANALYTES[analyte].low} y2={ANALYTES[analyte].high} fill="#d1fae5" fillOpacity={0.45} />
                <Scatter data={filteredLabRows} name={analyte}>
                  {filteredLabRows.map((row) => (
                    <Cell key={`${row.USUBJID}-${row.VISITNUM}-${row.LBTESTCD}`} fill={row.flagged ? "#dc2626" : row.SITEID === "SITE-103" ? "#0ea5e9" : "#64748b"} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="two-column">
        <Panel title="AE Analysis" subtitle="SITE-104 intentionally shows zero AE records as an underreporting signal">
          <div className="chart-box compact-chart">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aeBySite} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="site" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mini-table">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Issue</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {timingRows.map((row) => (
                  <tr key={row.findingId}>
                    <td>{row.USUBJID}</td>
                    <td>{row.description}</td>
                    <td><span className="badge danger">{row.severity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Visit Compliance Heatmap" subtitle="Percent completion by site and planned visit">
          <div className="heatmap">
            <div className="heatmap-row header">
              <span>Site</span>
              {VISITS.map((visit) => (
                <span key={visit.num}>{visit.name}</span>
              ))}
            </div>
            {heatmap.map((siteRow) => (
              <div className="heatmap-row" key={siteRow.site}>
                <strong>{siteRow.site}</strong>
                {siteRow.visits.map((visit) => (
                  <span className={`heat-cell ${visit.pct >= 90 ? "good" : visit.pct >= 70 ? "medium" : "bad"}`} key={visit.visit}>
                    {visit.pct}%
                  </span>
                ))}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel
        title="Data Findings Log"
        subtitle="Audit-ready finding list generated from explicit rules, ready for query management"
        action={
          <div className="control-row">
            <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} aria-label="Severity filter">
              <option>All</option>
              <option>Critical</option>
              <option>Major</option>
            </select>
            <button className="icon-button" onClick={() => downloadCsv("clintrace360_findings.csv", visibleFindings)} title="Export visible findings">
              <Download size={17} />
              Export CSV
            </button>
          </div>
        }
      >
        <div className="findings-table">
          <table>
            <thead>
              <tr>
                <th>Finding ID</th>
                <th>Category</th>
                <th>Subject</th>
                <th>Site</th>
                <th>Domain</th>
                <th>Variable</th>
                <th>Description</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleFindings.map((row) => (
                <tr key={row.findingId}>
                  <td>{row.findingId}</td>
                  <td>{row.category}</td>
                  <td>{row.USUBJID}</td>
                  <td>{row.SITEID}</td>
                  <td>{row.domain}</td>
                  <td>{row.variable}</td>
                  <td>{row.description}</td>
                  <td><span className={`badge ${row.severity === "Critical" ? "danger" : "warn"}`}>{row.severity}</span></td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ReconciliationModule({ reconciliation }) {
  const [activeTab, setActiveTab] = useState("sae");
  const { saeFindings, labFindings, queries } = reconciliation;
  const criticalQueries = queries.filter((row) => row.severity === "Critical").length;
  const activeRows = activeTab === "sae" ? saeFindings : activeTab === "lab" ? labFindings : queries;

  return (
    <div className="workspace">
      <div className="kpi-grid recon-kpis">
        <KpiCard label="SAE Findings" value={saeFindings.length} detail="EDC AE vs safety DB" tone="danger" icon={GitCompareArrows} />
        <KpiCard label="Lab Findings" value={labFindings.length} detail="EDC LB vs local labs" tone="warn" icon={Database} />
        <KpiCard label="Open Queries" value={queries.length} detail="Timestamped and traceable" tone="accent" icon={ListChecks} />
        <KpiCard label="Critical Queries" value={criticalQueries} detail="Regulatory or safety priority" tone="danger" icon={AlertTriangle} />
      </div>

      <Panel
        title="SAE and Local Lab Reconciliation"
        subtitle="Synthetic external data is matched against EDC domains with audit-ready query text."
        action={
          <div className="control-row">
            <button className={activeTab === "sae" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("sae")}>SAE Reconciliation</button>
            <button className={activeTab === "lab" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("lab")}>Local Lab</button>
            <button className={activeTab === "queries" ? "tab-button active" : "tab-button"} onClick={() => setActiveTab("queries")}>Query Log</button>
            <button className="icon-button" onClick={() => downloadCsv(`clintrace360_${activeTab}_reconciliation.csv`, activeRows)} title="Export active reconciliation tab">
              <Download size={17} />
              Export CSV
            </button>
          </div>
        }
      >
        {activeTab === "sae" && <SaeReconciliationTable rows={saeFindings} />}
        {activeTab === "lab" && <LabReconciliationTable rows={labFindings} />}
        {activeTab === "queries" && <QueryLogTable rows={queries} />}
      </Panel>
    </div>
  );
}

function CrfMapperModule() {
  const [selectedTemplate, setSelectedTemplate] = useState("demographics");
  const [inputText, setInputText] = useState(formatCrfFields(CRF_TEMPLATES.demographics.fields));
  const [mappings, setMappings] = useState(() => CRF_TEMPLATES.demographics.fields.map(mapCrfField));
  const [history, setHistory] = useState(() => readStorage("clintrace360:mappingHistory", []));
  const highConfidence = mappings.filter((row) => row.confidence === "High").length;
  const reviewNeeded = mappings.filter((row) => row.confidence !== "High").length;

  const loadTemplate = (templateKey) => {
    setSelectedTemplate(templateKey);
    const text = formatCrfFields(CRF_TEMPLATES[templateKey].fields);
    setInputText(text);
    setMappings(CRF_TEMPLATES[templateKey].fields.map(mapCrfField));
  };

  const runMapping = () => {
    setSelectedTemplate("custom");
    const nextMappings = parseCrfInput(inputText).map(mapCrfField);
    setMappings(nextMappings);
    setHistory(saveHistoryItem("clintrace360:mappingHistory", {
      id: `MAPH-${Date.now()}`,
      generatedAt: new Date().toLocaleString(),
      fieldCount: nextMappings.length,
      highConfidence: nextMappings.filter((row) => row.confidence === "High").length,
      inputText,
      mappings: nextMappings,
    }));
  };

  const restoreMapping = (item) => {
    setSelectedTemplate("custom");
    setInputText(item.inputText);
    setMappings(item.mappings);
  };

  return (
    <div className="workspace">
      <div className="kpi-grid mapper-kpis">
        <KpiCard label="CRF Fields" value={mappings.length} detail="Current mapping set" icon={Map} />
        <KpiCard label="High Confidence" value={highConfidence} detail="Direct SDTM matches" tone="accent" icon={ShieldCheck} />
        <KpiCard label="Needs Review" value={reviewNeeded} detail="Medium or low confidence" tone={reviewNeeded ? "warn" : "accent"} icon={AlertTriangle} />
      </div>

      <div className="mapper-layout">
        <Panel
          title="CRF Field Input"
          subtitle="Paste one field per line as Label | Data Type | Codelist."
          action={
            <select value={selectedTemplate} onChange={(event) => loadTemplate(event.target.value)} aria-label="CRF template">
              {Object.entries(CRF_TEMPLATES).map(([key, template]) => (
                <option value={key} key={key}>{template.label}</option>
              ))}
              <option value="custom">Custom input</option>
            </select>
          }
        >
          <textarea className="crf-input" value={inputText} onChange={(event) => setInputText(event.target.value)} spellCheck="false" />
          <div className="mapper-actions">
            <button className="icon-button" onClick={runMapping}>
              <Map size={17} />
              Map to SDTM
            </button>
            <button className="icon-button" onClick={() => downloadCsv("clintrace360_sdtm_mapping.csv", mappings)}>
              <Download size={17} />
              Export CSV
            </button>
          </div>
        </Panel>

        <Panel title="Mapping Notes" subtitle="This local build uses deterministic CDISC-oriented rules. LLM assistance can be added later for ambiguous sponsor-specific fields.">
          <div className="note-list">
            <section>
              <strong>Confidence</strong>
              <p>High means a direct SDTM target was found. Medium means the field is plausible but context-dependent. Low means sponsor review is needed.</p>
            </section>
            <section>
              <strong>Human review</strong>
              <p>Mappings are starting points for portfolio demonstration and must be checked against the current CDISC IG and study standards.</p>
            </section>
          </div>
        </Panel>
      </div>

      {history.length ? (
        <Panel title="Recent Mapping Sessions" subtitle="Saved locally in this browser only.">
          <div className="history-list">
            {history.map((item) => (
              <button className="history-item" key={item.id} onClick={() => restoreMapping(item)}>
                <strong>{item.fieldCount} fields</strong>
                <span>{item.highConfidence} high-confidence mappings</span>
                <small>{item.generatedAt}</small>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title="CRF to SDTM Mapping Results" subtitle="Suggested domain, variable, terminology, mapping note, confidence, and reference.">
        <div className="findings-table mapping-table">
          <table>
            <thead>
              <tr>
                <th>Row</th>
                <th>CRF Field</th>
                <th>Type</th>
                <th>Domain</th>
                <th>Variable</th>
                <th>Variable Label</th>
                <th>Controlled Terminology</th>
                <th>Mapping Notes</th>
                <th>Confidence</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((row) => (
                <tr key={row.rowId}>
                  <td>{row.rowId}</td>
                  <td>{row.crfField}</td>
                  <td>{row.dataType}</td>
                  <td>{row.domain}</td>
                  <td>{row.variable}</td>
                  <td>{row.variableLabel}</td>
                  <td>{row.controlledTerminology}</td>
                  <td>{row.notes}</td>
                  <td><span className={`badge ${row.confidence === "High" ? "good" : row.confidence === "Medium" ? "warn" : "danger"}`}>{row.confidence}</span></td>
                  <td>{row.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function ProtocolDqpModule() {
  const [protocolText, setProtocolText] = useState(SAMPLE_PROTOCOL_TEXT);
  const [nctId, setNctId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");
  const [activeOutput, setActiveOutput] = useState("dqp");
  const [signals, setSignals] = useState(() => extractProtocolSignals(SAMPLE_PROTOCOL_TEXT));
  const [dqp, setDqp] = useState(() => generateDqpPackage(extractProtocolSignals(SAMPLE_PROTOCOL_TEXT)));
  const [history, setHistory] = useState(() => readStorage("clintrace360:dqpHistory", []));

  const generate = (text = protocolText, nctRecord) => {
    const nextSignals = extractProtocolSignals(text, nctRecord);
    const nextDqp = generateDqpPackage(nextSignals);
    setSignals(nextSignals);
    setDqp(nextDqp);
    setHistory(saveHistoryItem("clintrace360:dqpHistory", {
      id: `DQPH-${Date.now()}`,
      generatedAt: new Date().toLocaleString(),
      title: nextSignals.title,
      phase: nextSignals.phase,
      sourceText: text,
      signals: nextSignals,
      dqp: nextDqp,
    }));
  };

  const restoreDqp = (item) => {
    setProtocolText(item.sourceText);
    setSignals(item.signals);
    setDqp(item.dqp);
    setActiveOutput("dqp");
    setFetchMessage(`Restored local DQP history item from ${item.generatedAt}.`);
  };

  const fetchNct = async () => {
    const cleanId = nctId.trim().toUpperCase();
    if (!/^NCT\d{8}$/.test(cleanId)) {
      setFetchMessage("Enter an NCT ID in the format NCT12345678.");
      return;
    }
    setIsFetching(true);
    setFetchMessage("");
    try {
      const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${cleanId}`);
      if (!response.ok) throw new Error(`ClinicalTrials.gov returned ${response.status}`);
      const study = await response.json();
      const protocol = study.protocolSection ?? {};
      const id = protocol.identificationModule ?? {};
      const design = protocol.designModule ?? {};
      const outcomes = protocol.outcomesModule ?? {};
      const eligibility = protocol.eligibilityModule ?? {};
      const arms = protocol.armsInterventionsModule ?? {};
      const nctRecord = {
        nctId: cleanId,
        title: id.briefTitle || id.officialTitle || cleanId,
        phase: design.phases?.join(", ") || "Phase not specified",
        design: [design.studyType, design.designInfo?.allocation, design.designInfo?.interventionModel, design.designInfo?.maskingInfo?.masking].filter(Boolean).join(" / "),
      };
      const fetchedText = [
        nctRecord.title,
        `Phase: ${nctRecord.phase}`,
        `Design: ${nctRecord.design}`,
        ...(outcomes.primaryOutcomes ?? []).map((row) => `Primary endpoint: ${row.measure ?? ""} ${row.timeFrame ?? ""}`),
        ...(outcomes.secondaryOutcomes ?? []).map((row) => `Secondary endpoint: ${row.measure ?? ""} ${row.timeFrame ?? ""}`),
        `Eligibility: ${eligibility.eligibilityCriteria ?? ""}`,
        ...(arms.armGroups ?? []).map((row) => `Arm: ${row.label ?? ""} ${row.description ?? ""}`),
      ].join("\n");
      setProtocolText(fetchedText);
      generate(fetchedText, nctRecord);
      setFetchMessage(`Loaded public metadata for ${cleanId}. Review generated outputs before use.`);
    } catch (error) {
      setFetchMessage(`NCT lookup failed. Paste protocol text instead. ${error.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const exportText = () => {
    const blob = new Blob([formatDqpForExport(signals, dqp)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clintrace360_dqp_skeleton.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async () => {
    const text = formatDqpForExport(signals, dqp);
    try {
      await navigator.clipboard.writeText(text);
      setFetchMessage("DQP package copied to clipboard.");
    } catch {
      exportText();
      setFetchMessage("Clipboard access was blocked, so the DQP package was exported as a text file instead.");
    }
  };

  return (
    <div className="workspace">
      <div className="kpi-grid protocol-kpis">
        <KpiCard label="Detected Phase" value={signals.phase.replace("Phase ", "")} detail={signals.design} icon={FileText} />
        <KpiCard label="Visits" value={signals.visits.length} detail={signals.visits.join(", ")} tone="accent" icon={ClipboardCheck} />
        <KpiCard label="Priority Labs" value={signals.labs.length} detail={signals.labs.join(", ")} tone="warn" icon={Database} />
        <KpiCard label="Edit Checks" value={dqp.editChecks.length} detail="Generated DQP checks" tone="accent" icon={ListChecks} />
      </div>

      <div className="protocol-layout">
        <Panel
          title="Protocol Input"
          subtitle="Paste a synopsis or load public ClinicalTrials.gov metadata by NCT ID."
          action={
            <div className="control-row nct-row">
              <input value={nctId} onChange={(event) => setNctId(event.target.value)} placeholder="NCT12345678" aria-label="NCT ID" />
              <button className="icon-button" onClick={fetchNct} disabled={isFetching}>
                <Download size={17} />
                {isFetching ? "Loading" : "Load NCT"}
              </button>
            </div>
          }
        >
          <textarea className="crf-input protocol-input" value={protocolText} onChange={(event) => setProtocolText(event.target.value)} spellCheck="false" />
          <div className="mapper-actions">
            <button className="icon-button" onClick={() => generate()}>
              <FileText size={17} />
              Generate DQP
            </button>
            <button className="icon-button" onClick={copyText}>
              <ClipboardCheck size={17} />
              Copy Package
            </button>
            <button className="icon-button" onClick={exportText}>
              <Download size={17} />
              Export TXT
            </button>
          </div>
          {fetchMessage ? <p className="inline-message">{fetchMessage}</p> : null}
        </Panel>

        <Panel title="Extracted Protocol Signals" subtitle="Transparent heuristic extraction used to drive the generated CDM deliverables.">
          <div className="signal-list">
            <section><strong>Study</strong><span>{signals.title}</span></section>
            <section><strong>Endpoints</strong><span>{signals.endpoints.join(" ")}</span></section>
            <section><strong>Eligibility</strong><span>{signals.eligibility.join(" ")}</span></section>
            <section><strong>Safety</strong><span>{signals.safety.join(", ")}</span></section>
            <section><strong>Dosing</strong><span>{signals.dosing}</span></section>
          </div>
        </Panel>
      </div>

      <Panel
        title="Generated DQP Package"
        subtitle="Skeleton outputs for human CDM review; not validated for production use."
        action={
          <div className="control-row">
            <button className={activeOutput === "dqp" ? "tab-button active" : "tab-button"} onClick={() => setActiveOutput("dqp")}>DQP</button>
            <button className={activeOutput === "checks" ? "tab-button active" : "tab-button"} onClick={() => setActiveOutput("checks")}>Edit Checks</button>
            <button className={activeOutput === "uat" ? "tab-button active" : "tab-button"} onClick={() => setActiveOutput("uat")}>UAT</button>
            <button className={activeOutput === "risk" ? "tab-button active" : "tab-button"} onClick={() => setActiveOutput("risk")}>Risk Review</button>
          </div>
        }
      >
        {activeOutput === "dqp" && <DqpSections rows={dqp.dqpSections} />}
        {activeOutput === "checks" && <EditCheckTable rows={dqp.editChecks} />}
        {activeOutput === "uat" && <UatTable rows={dqp.uatCases} />}
        {activeOutput === "risk" && <RiskChecklistTable rows={dqp.reviewChecklist} />}
      </Panel>

      {history.length ? (
        <Panel title="Recent DQP Generations" subtitle="Saved locally in this browser only.">
          <div className="history-list">
            {history.map((item) => (
              <button className="history-item" key={item.id} onClick={() => restoreDqp(item)}>
                <strong>{item.title}</strong>
                <span>{item.phase}</span>
                <small>{item.generatedAt}</small>
              </button>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function DqpSections({ rows }) {
  return (
    <div className="dqp-sections">
      {rows.map((row) => (
        <section key={row.section}>
          <h4>{row.section}</h4>
          <p>{row.content}</p>
        </section>
      ))}
    </div>
  );
}

function EditCheckTable({ rows }) {
  return (
    <div className="findings-table">
      <table>
        <thead>
          <tr>
            <th>Check ID</th>
            <th>Domain</th>
            <th>Variable</th>
            <th>Logic</th>
            <th>Severity</th>
            <th>Query Text</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.checkId}>
              <td>{row.checkId}</td>
              <td>{row.domain}</td>
              <td>{row.variable}</td>
              <td>{row.logic}</td>
              <td><span className={`badge ${row.severity === "Hard" ? "danger" : "warn"}`}>{row.severity}</span></td>
              <td>{row.queryText}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UatTable({ rows }) {
  return (
    <div className="findings-table">
      <table>
        <thead>
          <tr>
            <th>TC ID</th>
            <th>Module</th>
            <th>Description</th>
            <th>Input</th>
            <th>Expected Result</th>
            <th>Pass/Fail</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.testId}>
              <td>{row.testId}</td>
              <td>{row.module}</td>
              <td>{row.description}</td>
              <td>{row.input}</td>
              <td>{row.expected}</td>
              <td>___</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskChecklistTable({ rows }) {
  return (
    <div className="findings-table">
      <table>
        <thead>
          <tr>
            <th>Risk Area</th>
            <th>Priority</th>
            <th>Frequency</th>
            <th>Responsible</th>
            <th>Indicators</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.riskArea}>
              <td>{row.riskArea}</td>
              <td><span className={`badge ${row.priority === "High" ? "danger" : "warn"}`}>{row.priority}</span></td>
              <td>{row.frequency}</td>
              <td>{row.responsible}</td>
              <td>{row.indicators}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SaeReconciliationTable({ rows }) {
  return (
    <div className="findings-table">
      <table>
        <thead>
          <tr>
            <th>Finding ID</th>
            <th>Mismatch</th>
            <th>Subject</th>
            <th>EDC Value</th>
            <th>Safety DB Value</th>
            <th>Severity</th>
            <th>Query</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.findingId}>
              <td>{row.findingId}</td>
              <td>{row.mismatchType}</td>
              <td>{row.USUBJID}</td>
              <td>{row.edcValue}</td>
              <td>{row.safetyValue}</td>
              <td><span className={`badge ${row.severity === "Critical" ? "danger" : "warn"}`}>{row.severity}</span></td>
              <td>{row.queryId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LabReconciliationTable({ rows }) {
  return (
    <div className="findings-table">
      <table>
        <thead>
          <tr>
            <th>Finding ID</th>
            <th>Mismatch</th>
            <th>Subject</th>
            <th>Test</th>
            <th>Date</th>
            <th>EDC Value</th>
            <th>Local Value</th>
            <th>Severity</th>
            <th>Query</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.findingId}>
              <td>{row.findingId}</td>
              <td>{row.mismatchType}</td>
              <td>{row.USUBJID}</td>
              <td>{row.LBTESTCD}</td>
              <td>{row.LBDT}</td>
              <td>{row.edcValue}</td>
              <td>{row.localValue}</td>
              <td><span className="badge warn">{row.severity}</span></td>
              <td>{row.queryId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QueryLogTable({ rows }) {
  return (
    <div className="findings-table query-log">
      <table>
        <thead>
          <tr>
            <th>Query ID</th>
            <th>Type</th>
            <th>Subject</th>
            <th>Mismatch</th>
            <th>Query Text</th>
            <th>Severity</th>
            <th>Status</th>
            <th>Generated</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.queryId}>
              <td>{row.queryId}</td>
              <td>{row.type}</td>
              <td>{row.USUBJID}</td>
              <td>{row.mismatchType}</td>
              <td>{row.queryText}</td>
              <td><span className={`badge ${row.severity === "Critical" ? "danger" : "warn"}`}>{row.severity}</span></td>
              <td>{row.status}</td>
              <td>{row.generatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaceholderModule({ title, icon: Icon, phase, bullets }) {
  return (
    <div className="placeholder">
      <div className="placeholder-mark"><Icon size={28} /></div>
      <p className="eyebrow">{phase}</p>
      <h3>{title}</h3>
      <div className="placeholder-grid">
        {bullets.map((item) => (
          <section key={item.title}>
            <h4>{item.title}</h4>
            <p>{item.copy}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function AboutModule() {
  return (
    <div className="workspace">
      <Panel title="Methodology and Honest Boundaries" subtitle="What this build demonstrates, and what it deliberately does not claim">
        <div className="about-grid">
          <section>
            <h4>Current build</h4>
            <p>Phase 1 implements a browser-based clinical data review dashboard using synthetic CDISC-style DM, SV, LB, AE, and EX data. Every finding is generated from explicit rule logic, making the result explainable and audit-friendly.</p>
          </section>
          <section>
            <h4>Limitations</h4>
            <p>This is a training and portfolio workbench, not a validated CDMS. It uses synthetic data, has no patient data, and is not connected to Medidata Rave, Oracle InForm, or a production safety database.</p>
          </section>
          <section>
            <h4>Next phases</h4>
            <p>The core four-module workflow is implemented locally. Remaining work is production polish: screenshots, deployment setup, responsive visual QA, and optional LLM-backed upgrades for sponsor-specific ambiguity.</p>
          </section>
        </div>
      </Panel>
    </div>
  );
}

export default function ClinTrace360() {
  const [activeModule, setActiveModule] = useState("review");
  const data = useMemo(() => generateSyntheticTrialData(), []);
  const findings = useMemo(() => generateFindings(data), [data]);
  const reconciliation = useMemo(() => generateReconciliation(data), [data]);

  return (
    <AppShell activeModule={activeModule} setActiveModule={setActiveModule}>
      {activeModule === "review" && <DataReviewDashboard data={data} findings={findings} />}
      {activeModule === "protocol" && <ProtocolDqpModule />}
      {activeModule === "mapper" && <CrfMapperModule />}
      {activeModule === "recon" && <ReconciliationModule reconciliation={reconciliation} />}
      {activeModule === "about" && <AboutModule />}
    </AppShell>
  );
}
