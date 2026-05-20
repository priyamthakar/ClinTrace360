import {
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Database,
  Download,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  Map as MapIcon,
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
import { Fragment, useMemo, useState } from "react";

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
  { id: "review", label: "Data Review", icon: LayoutDashboard },
  { id: "recon", label: "SAE / Lab Recon", icon: GitCompareArrows },
  { id: "dqp", label: "Protocol → DQP", icon: FileText },
  { id: "mapper", label: "CRF → SDTM", icon: MapIcon },
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

function findingQueryText(finding) {
  const templates = {
    MISSING: `Visit record absent for subject ${finding.USUBJID}. Please confirm whether the visit was completed and enter all assessments, or document a protocol deviation.`,
    TIMING: `Timing discrepancy for subject ${finding.USUBJID}: ${finding.description} Please verify source documents and correct the affected record.`,
    RANGE: `Out-of-range lab value for subject ${finding.USUBJID}: ${finding.description} Please verify source data, assess clinical significance, and enter a clinician comment if applicable.`,
    PROTOCOL: `Protocol deviation for subject ${finding.USUBJID}: ${finding.description} Please review eligibility or site compliance and document the deviation if required.`,
    CONSISTENCY: `Data inconsistency for subject ${finding.USUBJID}: ${finding.description} Please verify treatment assignment and correct the affected record.`,
  };
  return templates[finding.category] ?? `Finding ${finding.findingId}: ${finding.description} Please review and respond.`;
}

function buildSiteSignals(findings) {
  const counts = SITES.map((site) => findings.filter((f) => f.SITEID === site).length);
  const max = Math.max(...counts, 1);
  return SITES.map((site, i) => {
    const count = counts[i];
    const critCount = findings.filter((f) => f.SITEID === site && f.severity === "Critical").length;
    return { site, count, critCount, pct: Math.round((count / max) * 100), tone: critCount > 0 ? "critical" : count > 5 ? "warning" : "success" };
  });
}

function AppShell({ activeModule, setActiveModule, children }) {
  const active = modules.find((m) => m.id === activeModule);
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">CT</div>
          <span>ClinTrace360</span>
        </div>
        <div className="topbar-status">
          <span className="dot" />
          <span>{active?.label ?? "—"}</span>
        </div>
        <div className="topbar-meta">Synthetic CDISC · v0.1</div>
      </header>
      <nav className="mobile-nav" aria-label="Module navigation">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} className={`mobile-nav-item${activeModule === m.id ? " active" : ""}`} onClick={() => setActiveModule(m.id)}>
              <Icon size={14} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>
      <aside className="sidebar">
        <div className="nav-section-label">Modules</div>
        <nav aria-label="Modules" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} className={`nav-item${activeModule === m.id ? " active" : ""}`} onClick={() => setActiveModule(m.id)}>
                <Icon size={15} />
                <span className="nav-item-label">{m.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Database size={12} />
          <span>Synthetic data only</span>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}

function Kpi({ label, value, sub, tone = "" }) {
  return (
    <div className={`kpi${tone ? ` ${tone}` : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, action, children, elevated, bodyPadding = true }) {
  return (
    <div className={`card${elevated ? " elevated" : ""}`}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div className="card-head-actions">{action}</div>}
        </div>
      )}
      <div className="card-body" style={bodyPadding ? undefined : { padding: 0 }}>{children}</div>
    </div>
  );
}

function Badge({ tone = "neutral", children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function ModuleHead({ eyebrow, title, sub, children }) {
  return (
    <div className="module-head">
      <div className="module-title">
        {eyebrow && <div className="module-eyebrow">{eyebrow}</div>}
        <div className="module-h">{title}</div>
        {sub && <div className="module-sub">{sub}</div>}
      </div>
      {children && <div className="module-actions">{children}</div>}
    </div>
  );
}

function DataReviewDashboard({ data, findings }) {
  const [tab, setTab] = useState("findings");
  const [analyte, setAnalyte] = useState("ALT");
  const [site, setSite] = useState("All sites");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);

  const siteSummary = useMemo(() => buildSiteSummary(findings), [findings]);
  const heatmap = useMemo(() => buildVisitHeatmap(data), [data]);
  const siteSignals = useMemo(() => buildSiteSignals(findings), [findings]);

  const expectedVisits = data.dm.length * VISITS.length;
  const missingVisits = findings.filter((f) => f.category === "MISSING").length;
  const criticalFindings = findings.filter((f) => f.severity === "Critical").length;
  const filteredLabRows = data.lb
    .filter((r) => r.LBTESTCD === analyte && (site === "All sites" || r.SITEID === site))
    .map((r) => ({ ...r, flagged: r.LBORRES < r.LBORNRLO || r.LBORRES > r.LBORNRHI }));
  const timingRows = findings.filter((f) => f.domain === "AE" && f.category === "TIMING");
  const visibleFindings = severityFilter === "All" ? findings : findings.filter((f) => f.severity === severityFilter);

  const toggleRow = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 1 · Live" title="Data Review Dashboard" sub="Rule-based findings across DM, SV, LB, AE, EX domains — 40 subjects, 5 sites">
        <button className="btn" onClick={() => downloadCsv("clintrace360_findings.csv", visibleFindings)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid">
        <Kpi label="Total Subjects" value={data.dm.length} sub="5 sites · 2 arms" />
        <Kpi label="Expected Visits" value={expectedVisits} sub={`${data.sv.length} captured`} />
        <Kpi label="Missing Visits" tone="warning" value={missingVisits} sub={`${Math.round((missingVisits / expectedVisits) * 100)}% gap rate`} />
        <Kpi label="Open Queries" tone="accent" value={findings.length} sub="From rule checks" />
        <Kpi label="Critical Findings" tone="critical" value={criticalFindings} sub="Immediate review" />
      </div>

      <div className="card elevated">
        <div className="card-head">
          <div>
            <h3>Findings &amp; Site Analysis</h3>
            <p>Finding log, site anomaly signals, and lab trajectory</p>
          </div>
          <div className="card-head-actions">
            {tab === "findings" && (
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} aria-label="Severity">
                <option>All</option><option>Critical</option><option>Major</option>
              </select>
            )}
            {tab === "lab" && (
              <>
                <select value={analyte} onChange={(e) => setAnalyte(e.target.value)} aria-label="Analyte">
                  {Object.keys(ANALYTES).map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
                  <option>All sites</option>
                  {SITES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </>
            )}
          </div>
        </div>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "0 18px" }}>
          <div className="tab-row" style={{ borderBottom: "none" }}>
            <button className={`tab${tab === "findings" ? " active" : ""}`} onClick={() => setTab("findings")}>Findings</button>
            <button className={`tab${tab === "sites" ? " active" : ""}`} onClick={() => setTab("sites")}>Site Signals</button>
            <button className={`tab${tab === "lab" ? " active" : ""}`} onClick={() => setTab("lab")}>Lab Trend</button>
          </div>
        </div>
        <div>
          {tab === "findings" && (
            <div className="table-wrap max-h-520">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 28 }} />
                    <th>ID</th><th>Cat.</th><th>Subject</th><th>Site</th>
                    <th>Domain</th><th>Variable</th><th>Description</th>
                    <th>Severity</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleFindings.map((row) => (
                    <Fragment key={row.findingId}>
                      <tr className={expandedId === row.findingId ? "expanded" : ""} onClick={() => toggleRow(row.findingId)} style={{ cursor: "pointer" }}>
                        <td style={{ color: "var(--muted-2)", textAlign: "center" }}>
                          {expandedId === row.findingId ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </td>
                        <td>{row.findingId}</td>
                        <td>{row.category}</td>
                        <td>{row.USUBJID}</td>
                        <td>{row.SITEID}</td>
                        <td>{row.domain}</td>
                        <td>{row.variable}</td>
                        <td>{row.description}</td>
                        <td><Badge tone={row.severity === "Critical" ? "critical" : "warning"}>{row.severity}</Badge></td>
                        <td>{row.status}</td>
                      </tr>
                      {expandedId === row.findingId && (
                        <tr className="detail-row">
                          <td colSpan={10}>
                            <div className="detail-grid">
                              <div className="detail-box">
                                <h5>Evidence</h5>
                                <p>{row.domain}.{row.variable} — {row.description}</p>
                              </div>
                              <div className="detail-box">
                                <h5>Query Text</h5>
                                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--muted)" }}>{findingQueryText(row)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {tab === "sites" && (
            <div style={{ padding: "18px" }}>
              <div className="two-col">
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Finding Distribution by Site</div>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={siteSummary}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="site" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Missing" stackId="a" fill="#F76B15" />
                        <Bar dataKey="Range" stackId="a" fill="#E5484D" />
                        <Bar dataKey="Timing" stackId="a" fill="#8B5CF6" />
                        <Bar dataKey="Protocol" stackId="a" fill="#0EA5E9" />
                        <Bar dataKey="Consistency" stackId="a" fill="#30A46C" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Anomaly Load</div>
                  <div className="mini-list" style={{ marginBottom: 24 }}>
                    {siteSignals.map((s) => (
                      <div className="mini-item" key={s.site}>
                        <span className="site-id">{s.site}</span>
                        <div className="bar-track"><div className={`bar-fill ${s.tone}`} style={{ width: `${s.pct}%` }} /></div>
                        <span className="pct">{s.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visit Compliance</div>
                  <div className="heatmap">
                    <div className="heatmap-row header">
                      <span>Site</span>
                      {VISITS.map((v) => <span key={v.num}>{v.name}</span>)}
                    </div>
                    {heatmap.map((siteRow) => (
                      <div className="heatmap-row" key={siteRow.site}>
                        <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--fg)" }}>{siteRow.site}</strong>
                        {siteRow.visits.map((v) => (
                          <span className={`heat-cell ${v.pct >= 90 ? "good" : v.pct >= 70 ? "medium" : "bad"}`} key={v.visit}>{v.pct}%</span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === "lab" && (
            <div style={{ padding: "18px" }}>
              <div className="two-col">
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{analyte} — {ANALYTES[analyte].name}</div>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="VISITNUM" name="Visit" type="number" domain={[1, 7]} ticks={VISITS.map((v) => v.num)} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="LBORRES" name={analyte} unit={` ${ANALYTES[analyte].unit}`} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v) => [`${v} ${ANALYTES[analyte].unit}`, analyte]} labelFormatter={(v) => `Visit ${v}`} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                        <ReferenceArea y1={ANALYTES[analyte].low} y2={ANALYTES[analyte].high} fill="#30A46C" fillOpacity={0.1} />
                        <Scatter data={filteredLabRows} name={analyte}>
                          {filteredLabRows.map((r) => (
                            <Cell key={`${r.USUBJID}-${r.VISITNUM}-${r.LBTESTCD}`} fill={r.flagged ? "#E5484D" : r.SITEID === "SITE-103" ? "#0EA5E9" : "#5E6AD2"} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AE Timing Issues</div>
                  <div className="table-wrap max-h-400">
                    <table>
                      <thead><tr><th>Subject</th><th>Issue</th><th>Sev.</th></tr></thead>
                      <tbody>
                        {timingRows.map((r) => (
                          <tr key={r.findingId}>
                            <td>{r.USUBJID}</td><td>{r.description}</td>
                            <td><Badge tone="warning">{r.severity}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReconciliationModule({ reconciliation }) {
  const [activeTab, setActiveTab] = useState("sae");
  const [selectedId, setSelectedId] = useState(null);
  const { saeFindings, labFindings, queries } = reconciliation;
  const criticalQueries = queries.filter((r) => r.severity === "Critical").length;

  const queueRows = activeTab === "sae" ? saeFindings : activeTab === "lab" ? labFindings : [];
  const exportRows = activeTab === "sae" ? saeFindings : activeTab === "lab" ? labFindings : queries;
  const selectedRow = queueRows.find((r) => (r.findingId ?? r.queryId) === selectedId);
  const handleSelect = (row) => { const id = row.findingId ?? row.queryId; setSelectedId((p) => (p === id ? null : id)); };
  const auditEntries = queries.map((q) => ({ ts: q.generatedAt, msg: `${q.mismatchType} raised for ${q.USUBJID} — ${q.description}` }));

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 2 · Live" title="SAE / Lab Reconciliation" sub="Synthetic safety database and local lab feed matched against EDC domains">
        <button className="btn" onClick={() => downloadCsv(`clintrace360_${activeTab}_recon.csv`, exportRows)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid cols4">
        <Kpi label="SAE Findings" tone="critical" value={saeFindings.length} sub="EDC AE vs safety DB" />
        <Kpi label="Lab Findings" tone="warning" value={labFindings.length} sub="EDC LB vs local labs" />
        <Kpi label="Open Queries" tone="accent" value={queries.length} sub="Timestamped, traceable" />
        <Kpi label="Critical Queries" tone="critical" value={criticalQueries} sub="Regulatory / safety priority" />
      </div>

      <div className="recon-layout">
        <div className="card elevated">
          <div className="card-head">
            <div><h3>Mismatch Queue</h3><p>Click a row to inspect detail and query text</p></div>
            <div className="card-head-actions">
              <div className="tab-row" style={{ borderBottom: "none", gap: 2 }}>
                <button className={`tab${activeTab === "sae" ? " active" : ""}`} onClick={() => { setActiveTab("sae"); setSelectedId(null); }}>SAE</button>
                <button className={`tab${activeTab === "lab" ? " active" : ""}`} onClick={() => { setActiveTab("lab"); setSelectedId(null); }}>Local Lab</button>
                <button className={`tab${activeTab === "audit" ? " active" : ""}`} onClick={() => { setActiveTab("audit"); setSelectedId(null); }}>Audit Log</button>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: "12px" }}>
            {activeTab !== "audit" && (
              <div className="recon-queue">
                {queueRows.map((row) => {
                  const id = row.findingId ?? row.queryId;
                  return (
                    <div key={id} className={`recon-row${selectedId === id ? " active" : ""}`} onClick={() => handleSelect(row)}>
                      <div>
                        <div className="recon-row-title">{row.USUBJID} — {row.mismatchType}</div>
                        <div className="recon-row-sub">{row.SAETERM ?? row.LBTESTCD ?? "—"} · {row.SAESTDTC ?? row.LBDT ?? "—"}</div>
                      </div>
                      <Badge tone={row.severity === "Critical" ? "critical" : "warning"}>{row.severity}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
            {activeTab === "audit" && (
              <div style={{ maxHeight: 420, overflowY: "auto" }}>
                {auditEntries.map((e, i) => (
                  <div key={i} className="audit-entry">
                    <div className="audit-ts">{e.ts}</div>
                    <div className="audit-msg">{e.msg}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card elevated" style={{ position: "sticky", top: "calc(var(--topbar-h) + 24px)", alignSelf: "start" }}>
          <div className="card-head"><div><h3>Detail</h3><p>Select a row to inspect</p></div></div>
          <div className="card-body">
            {!selectedRow ? (
              <div className="empty-state"><GitCompareArrows size={24} /><span>Select a mismatch to view detail</span></div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div className="detail-box"><h5>Subject</h5><p>{selectedRow.USUBJID}</p></div>
                <div className="detail-box"><h5>Mismatch Type</h5><p>{selectedRow.mismatchType}</p></div>
                <div className="detail-box"><h5>Severity</h5><p><Badge tone={selectedRow.severity === "Critical" ? "critical" : "warning"}>{selectedRow.severity}</Badge></p></div>
                {selectedRow.edcValue !== undefined && <div className="detail-box"><h5>EDC Value</h5><p>{selectedRow.edcValue}</p></div>}
                {selectedRow.safetyValue !== undefined && <div className="detail-box"><h5>Safety DB Value</h5><p>{selectedRow.safetyValue}</p></div>}
                {selectedRow.localValue !== undefined && <div className="detail-box"><h5>Local Lab Value</h5><p>{selectedRow.localValue}</p></div>}
                <div className="detail-box">
                  <h5>Query Text</h5>
                  <div className="code-block">{queries.find((q) => q.queryId === selectedRow.queryId)?.queryText ?? "—"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CrfMapperModule() {
  const [selectedTemplate, setSelectedTemplate] = useState("demographics");
  const [inputText, setInputText] = useState(formatCrfFields(CRF_TEMPLATES.demographics.fields));
  const [mappings, setMappings] = useState(() => CRF_TEMPLATES.demographics.fields.map(mapCrfField));
  const [isMapping, setIsMapping] = useState(false);
  const [history, setHistory] = useState(() => readStorage("clintrace360:mappingHistory", []));
  const highConfidence = mappings.filter((r) => r.confidence === "High").length;
  const reviewNeeded = mappings.filter((r) => r.confidence !== "High").length;

  const loadTemplate = (key) => {
    setSelectedTemplate(key);
    const text = formatCrfFields(CRF_TEMPLATES[key].fields);
    setInputText(text);
    setMappings(CRF_TEMPLATES[key].fields.map(mapCrfField));
  };

  const runMapping = () => {
    setIsMapping(true);
    setTimeout(() => {
      setSelectedTemplate("custom");
      const next = parseCrfInput(inputText).map(mapCrfField);
      setMappings(next);
      setHistory(saveHistoryItem("clintrace360:mappingHistory", {
        id: `MAPH-${Date.now()}`,
        generatedAt: new Date().toLocaleString(),
        fieldCount: next.length,
        highConfidence: next.filter((r) => r.confidence === "High").length,
        inputText,
        mappings: next,
      }));
      setIsMapping(false);
    }, 420);
  };

  const restoreMapping = (item) => {
    setSelectedTemplate("custom");
    setInputText(item.inputText);
    setMappings(item.mappings);
  };

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 3 · Live" title="CRF → SDTM Mapper" sub="Deterministic rule-based field-level mapping to CDISC SDTM domains">
        <button className="btn" onClick={() => downloadCsv("clintrace360_sdtm_mapping.csv", mappings)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid cols3">
        <Kpi label="CRF Fields" value={mappings.length} sub="Current mapping set" />
        <Kpi label="High Confidence" tone="success" value={highConfidence} sub="Direct SDTM matches" />
        <Kpi label="Needs Review" tone={reviewNeeded ? "warning" : "success"} value={reviewNeeded} sub="Medium or low confidence" />
      </div>

      <div className="form-grid">
        <div className="card elevated">
          <div className="card-head">
            <div><h3>CRF Field Input</h3><p>One field per line — Label | Data Type | Codelist</p></div>
            <div className="card-head-actions">
              <select value={selectedTemplate} onChange={(e) => { if (e.target.value !== "custom") loadTemplate(e.target.value); }} aria-label="Template">
                {Object.entries(CRF_TEMPLATES).map(([key, tpl]) => (
                  <option value={key} key={key}>{tpl.label}</option>
                ))}
                <option value="custom">Custom input</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <textarea className="code-input" value={inputText} onChange={(e) => setInputText(e.target.value)} spellCheck="false" style={{ minHeight: 260 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={runMapping} disabled={isMapping}>
                <MapIcon size={14} />{isMapping ? "Mapping…" : "Map to SDTM"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Mapping Notes</h3><p>Confidence levels and review guidance</p></div></div>
          <div className="card-body">
            <div className="signal-list">
              <div className="signal-item"><div><strong>Confidence levels</strong><span>High = direct SDTM target found. Medium = plausible but context-dependent. Low = sponsor review required.</span></div></div>
              <div className="signal-item"><div><strong>Human review required</strong><span>Mappings are starting points and must be checked against the current CDISC SDTMIG and study-specific standards before use.</span></div></div>
            </div>
          </div>
        </div>
      </div>

      {history.length ? (
        <div className="card">
          <div className="card-head"><div><h3>Recent Sessions</h3><p>Saved locally in this browser</p></div></div>
          <div className="card-body">
            <div className="history-grid">
              {history.map((item) => (
                <button className="history-item" key={item.id} onClick={() => restoreMapping(item)}>
                  <strong>{item.fieldCount} fields</strong>
                  <span>{item.highConfidence} high-confidence</span>
                  <small>{item.generatedAt}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card elevated">
        <div className="card-head"><div><h3>SDTM Mapping Results</h3><p>Domain, variable, terminology, notes, confidence, and SDTMIG reference</p></div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {isMapping ? (
            <div className="spinner-wrap"><div className="spinner" /><span>Mapping fields to SDTM…</span></div>
          ) : (
            <div className="table-wrap max-h-560">
              <table>
                <thead>
                  <tr>
                    <th>Row</th><th>CRF Field</th><th>Type</th><th>Domain</th><th>Variable</th>
                    <th>Variable Label</th><th>Controlled Terminology</th><th>Mapping Notes</th>
                    <th>Confidence</th><th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((row) => (
                    <tr key={row.rowId}>
                      <td>{row.rowId}</td><td>{row.crfField}</td><td>{row.dataType}</td>
                      <td>{row.domain}</td><td>{row.variable}</td><td>{row.variableLabel}</td>
                      <td>{row.controlledTerminology}</td><td>{row.notes}</td>
                      <td><Badge tone={row.confidence === "High" ? "success" : row.confidence === "Medium" ? "warning" : "critical"}>{row.confidence}</Badge></td>
                      <td>{row.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtocolDqpModule() {
  const [protocolText, setProtocolText] = useState(SAMPLE_PROTOCOL_TEXT);
  const [nctId, setNctId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");
  const [activeOutput, setActiveOutput] = useState("dqp");
  const [signals, setSignals] = useState(() => extractProtocolSignals(SAMPLE_PROTOCOL_TEXT));
  const [dqp, setDqp] = useState(() => generateDqpPackage(extractProtocolSignals(SAMPLE_PROTOCOL_TEXT)));
  const [history, setHistory] = useState(() => readStorage("clintrace360:dqpHistory", []));

  const generate = (text = protocolText, nctRecord) => {
    setIsGenerating(true);
    setTimeout(() => {
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
      setIsGenerating(false);
    }, 520);
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
      <ModuleHead eyebrow="Phase 3 · Live" title="Protocol → DQP Generator" sub="Deterministic signal extraction from protocol synopsis to CDM deliverables">
        <button className="btn" onClick={copyText}><ClipboardCheck size={14} />Copy Package</button>
        <button className="btn" onClick={exportText}><Download size={14} />Export TXT</button>
      </ModuleHead>

      <div className="kpi-grid cols4">
        <Kpi label="Phase" value={signals.phase.replace("Phase ", "")} sub={signals.design.slice(0, 48) || "—"} />
        <Kpi label="Visits" tone="accent" value={signals.visits.length} sub={signals.visits.slice(0, 3).join(", ")} />
        <Kpi label="Priority Labs" tone="warning" value={signals.labs.length} sub={signals.labs.join(", ")} />
        <Kpi label="Edit Checks" tone="accent" value={dqp.editChecks.length} sub="Generated checks" />
      </div>

      <div className="form-grid">
        <div className="card elevated">
          <div className="card-head">
            <div><h3>Protocol Input</h3><p>Paste a synopsis or load public ClinicalTrials.gov metadata</p></div>
            <div className="card-head-actions">
              <input type="text" value={nctId} onChange={(e) => setNctId(e.target.value)} placeholder="NCT12345678" aria-label="NCT ID" style={{ width: 140 }} />
              <button className="btn" onClick={fetchNct} disabled={isFetching}>
                <Download size={14} />{isFetching ? "Loading…" : "Load NCT"}
              </button>
            </div>
          </div>
          <div className="card-body">
            <textarea className="code-input" value={protocolText} onChange={(e) => setProtocolText(e.target.value)} spellCheck="false" style={{ minHeight: 320 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={() => generate()} disabled={isGenerating}>
                <FileText size={14} />{isGenerating ? "Generating…" : "Generate DQP"}
              </button>
            </div>
            {fetchMessage && <div className="inline-msg">{fetchMessage}</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Extracted Signals</h3><p>Transparent heuristic extraction</p></div></div>
          <div className="card-body">
            <div className="signal-list">
              <div className="signal-item"><div><strong>Study</strong><span>{signals.title}</span></div></div>
              <div className="signal-item"><div><strong>Endpoints</strong><span>{signals.endpoints.slice(0, 2).join(" ")}</span></div></div>
              <div className="signal-item"><div><strong>Eligibility</strong><span>{signals.eligibility.slice(0, 2).join(" ")}</span></div></div>
              <div className="signal-item"><div><strong>Safety</strong><span>{signals.safety.join(", ")}</span></div></div>
              <div className="signal-item"><div><strong>Dosing</strong><span>{signals.dosing}</span></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card elevated">
        <div className="card-head">
          <div><h3>Generated DQP Package</h3><p>Skeleton for human CDM review — not validated for production use</p></div>
          <div className="card-head-actions">
            <div className="tab-row" style={{ borderBottom: "none", gap: 2 }}>
              <button className={`tab${activeOutput === "dqp" ? " active" : ""}`} onClick={() => setActiveOutput("dqp")}>DQP</button>
              <button className={`tab${activeOutput === "checks" ? " active" : ""}`} onClick={() => setActiveOutput("checks")}>Edit Checks</button>
              <button className={`tab${activeOutput === "uat" ? " active" : ""}`} onClick={() => setActiveOutput("uat")}>UAT</button>
              <button className={`tab${activeOutput === "risk" ? " active" : ""}`} onClick={() => setActiveOutput("risk")}>Risk Review</button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {isGenerating ? (
            <div className="spinner-wrap"><div className="spinner" /><span>Generating DQP package…</span></div>
          ) : (
            <>
              {activeOutput === "dqp" && <DqpSections rows={dqp.dqpSections} />}
              {activeOutput === "checks" && <EditCheckTable rows={dqp.editChecks} />}
              {activeOutput === "uat" && <UatTable rows={dqp.uatCases} />}
              {activeOutput === "risk" && <RiskChecklistTable rows={dqp.reviewChecklist} />}
            </>
          )}
        </div>
      </div>

      {history.length ? (
        <div className="card">
          <div className="card-head"><div><h3>Recent Sessions</h3><p>Saved locally in this browser</p></div></div>
          <div className="card-body">
            <div className="history-grid">
              {history.map((item) => (
                <button className="history-item" key={item.id} onClick={() => restoreDqp(item)}>
                  <strong>{item.title}</strong><span>{item.phase}</span><small>{item.generatedAt}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DqpSections({ rows }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div className="section-block" key={row.section}>
          <div className="section-block-head"><h4>{row.section}</h4></div>
          <div className="section-block-body">{row.content}</div>
        </div>
      ))}
    </div>
  );
}

function EditCheckTable({ rows }) {
  return (
    <div className="table-wrap max-h-520">
      <table>
        <thead><tr><th>Check ID</th><th>Domain</th><th>Variable</th><th>Logic</th><th>Severity</th><th>Query Text</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.checkId}>
              <td>{row.checkId}</td><td>{row.domain}</td><td>{row.variable}</td><td>{row.logic}</td>
              <td><Badge tone={row.severity === "Hard" ? "critical" : "warning"}>{row.severity}</Badge></td>
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
    <div className="table-wrap max-h-520">
      <table>
        <thead><tr><th>TC ID</th><th>Module</th><th>Description</th><th>Input</th><th>Expected Result</th><th>Pass/Fail</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.testId}>
              <td>{row.testId}</td><td>{row.module}</td><td>{row.description}</td>
              <td>{row.input}</td><td>{row.expected}</td><td>—</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RiskChecklistTable({ rows }) {
  return (
    <div className="table-wrap max-h-520">
      <table>
        <thead><tr><th>Risk Area</th><th>Priority</th><th>Frequency</th><th>Responsible</th><th>Indicators</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.riskArea}>
              <td>{row.riskArea}</td>
              <td><Badge tone={row.priority === "High" ? "critical" : "warning"}>{row.priority}</Badge></td>
              <td>{row.frequency}</td><td>{row.responsible}</td><td>{row.indicators}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
      {activeModule === "recon" && <ReconciliationModule reconciliation={reconciliation} />}
      {activeModule === "dqp" && <ProtocolDqpModule />}
      {activeModule === "mapper" && <CrfMapperModule />}
    </AppShell>
  );
}
