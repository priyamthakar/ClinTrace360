export function mapCrfField(field, index) {
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
  if (contains("sae criteria", "hospitalization", "life-threatening")) return medium({ domain: "AE", variable: "AESDTH / AESLIFE / AESHOSP / AESDISAB / AESCONG / AESMIE", variableLabel: "SAE Criterion Flags — 6 Variables", controlledTerminology: "Y/N per criterion flag", notes: "A single 'SAE Criteria Met' CRF field maps to six distinct SDTM AE criterion flags: AESDTH (death), AESLIFE (life-threatening), AESHOSP (hospitalization), AESDISAB (persistent disability), AESCONG (congenital anomaly), AESMIE (other medically important). CDASH IG v2.0 recommends individual checkboxes per criterion for direct 1:1 mapping. Decompose at specification time.", reference: "SDTMIG v3.4, AE §7.2.6; CDASH IG v2.0, AE" });

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
  if (contains("loinc", "lab test code")) return high({ domain: "LB", variable: "LBTESTCD + LBLOINC", variableLabel: "Lab Test Short Name + LOINC Code", controlledTerminology: "CDISC LBTESTCD; LOINC 2.x", notes: "Map the CDISC standard short name to LBTESTCD (required). LOINC code, when separately collected, maps to LBLOINC — a permissible variable in SDTMIG v3.4 LB. Both variables can coexist on the same LB observation record.", reference: "SDTMIG v3.4, LB; LOINC" });
  if (contains("specimen collection", "collection date")) return high({ domain: "LB", variable: "LBDTC", variableLabel: "Date/Time of Specimen Collection", controlledTerminology: "ISO 8601 date/time", notes: "Map specimen collection datetime to LBDTC.", reference: "SDTMIG v3.4, LB" });
  if (contains("original units")) return high({ domain: "LB", variable: "LBORRESU", variableLabel: "Original Units", controlledTerminology: "CDISC unit terminology", notes: "Map original collected units.", reference: "SDTMIG v3.4, LB" });
  if (contains("standard units")) return high({ domain: "LB", variable: "LBSTRESU", variableLabel: "Standard Units", controlledTerminology: "CDISC unit terminology", notes: "Map standardized analysis units.", reference: "SDTMIG v3.4, LB" });
  if (contains("standard") && contains("result")) return high({ domain: "LB", variable: "LBSTRESN", variableLabel: "Numeric Result/Finding in Standard Units", controlledTerminology: "Numeric", notes: "Map numeric standardized result.", reference: "SDTMIG v3.4, LB" });
  if (contains("result")) return high({ domain: "LB", variable: "LBORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "Original result", notes: "Map collected original result.", reference: "SDTMIG v3.4, LB" });
  if (contains("normal range low")) return high({ domain: "LB", variable: "LBORNRLO", variableLabel: "Reference Range Lower Limit in Original Units", controlledTerminology: "Numeric", notes: "Map local/original lower reference limit.", reference: "SDTMIG v3.4, LB" });
  if (contains("normal range high")) return high({ domain: "LB", variable: "LBORNRHI", variableLabel: "Reference Range Upper Limit in Original Units", controlledTerminology: "Numeric", notes: "Map local/original upper reference limit.", reference: "SDTMIG v3.4, LB" });
  if (contains("clinical significance")) return medium({ domain: "LB", variable: "LBNRIND", variableLabel: "Reference Range Indicator", controlledTerminology: "LOW/NORMAL/HIGH or sponsor convention", notes: "Clinical significance may map to interpretation/supplemental qualifier depending on CRF design.", reference: "SDTMIG v3.4, LB" });
  if (contains("fasting")) return high({ domain: "LB", variable: "LBFAST", variableLabel: "Fasting Status", controlledTerminology: "Y/N", notes: "Map fasting flag to LBFAST.", reference: "SDTMIG v3.4, LB" });

  // Medical History (MH)
  if (contains("medical history term", "condition verbatim", "mhterm")) return high({ domain: "MH", variable: "MHTERM", variableLabel: "Reported Term for the Medical History", controlledTerminology: "Verbatim; coded to MedDRA", notes: "Verbatim term of medical history condition.", reference: "SDTMIG v3.4, MH" });
  if (contains("medical history start", "condition start", "mhstdtc")) return high({ domain: "MH", variable: "MHSTDTC", variableLabel: "Start Date/Time of History Event", controlledTerminology: "ISO 8601 date/time", notes: "Start date of medical history condition.", reference: "SDTMIG v3.4, MH" });
  if (contains("medical history end", "condition end", "mhendtc")) return high({ domain: "MH", variable: "MHENDTC", variableLabel: "End Date/Time of History Event", controlledTerminology: "ISO 8601 date/time", notes: "End date of medical history condition.", reference: "SDTMIG v3.4, MH" });
  if (contains("history ongoing", "condition ongoing", "mhongo")) return medium({ domain: "MH", variable: "MHENRF", variableLabel: "End Relative to Reference Period", controlledTerminology: "BEFORE/ONGOING", notes: "Maps to MHENRF if the condition is ongoing.", reference: "SDTMIG v3.4, MH" });
  if (contains("history category", "mhcat")) return high({ domain: "MH", variable: "MHCAT", variableLabel: "Category for Medical History", controlledTerminology: "Sponsor-defined", notes: "Broad category of medical history.", reference: "SDTMIG v3.4, MH" });
  if (contains("body system", "mhbodsys")) return high({ domain: "MH", variable: "MHBODSYS", variableLabel: "Body System or Organ Class", controlledTerminology: "MedDRA SOC", notes: "Mapped from MedDRA coding coding process.", reference: "SDTMIG v3.4, MH" });
  if (contains("history location", "mhloc")) return medium({ domain: "MH", variable: "MHLOC", variableLabel: "Location of Physical Entity", controlledTerminology: "Anatomical Location CT", notes: "Location of the history condition if applicable.", reference: "SDTMIG v3.4, MH" });

  // Disposition (DS)
  if (contains("disposition event", "reason for discontinuation", "dsdecod")) return high({ domain: "DS", variable: "DSDECOD", variableLabel: "Standardized Disposition Term", controlledTerminology: "CDISC CT C150824", notes: "Map standardized disposition terms (e.g. COMPLETED, ADVERSE EVENT, WITHDRAWAL BY SUBJECT).", reference: "SDTMIG v3.4, DS" });
  if (contains("disposition date", "discontinuation date", "dsstdtc")) return high({ domain: "DS", variable: "DSSTDTC", variableLabel: "Start Date/Time of Disposition Event", controlledTerminology: "ISO 8601 date/time", notes: "Date when disposition event occurred.", reference: "SDTMIG v3.4, DS" });
  if (contains("disposition category", "dscat")) return high({ domain: "DS", variable: "DSCAT", variableLabel: "Category for Disposition Event", controlledTerminology: "Sponsor-defined", notes: "Category of disposition (e.g., PROTOCOL MILESTONE, DISPOSITION EVENT).", reference: "SDTMIG v3.4, DS" });
  if (contains("disposition epoch", "epoch")) return medium({ domain: "DS", variable: "EPOCH", variableLabel: "Epoch", controlledTerminology: "SCREENING/TREATMENT/FOLLOW-UP", notes: "Epoch in which the event occurred.", reference: "SDTMIG v3.4, DS" });
  
  // Subject Characteristics (SC)
  if (contains("characteristic", "sctest")) return high({ domain: "SC", variable: "SCTEST", variableLabel: "Subject Characteristic Test Name", controlledTerminology: "Sponsor-defined", notes: "Name of the collected characteristic (e.g., EYE COLOR, EDUCATION YEARS).", reference: "SDTMIG v3.4, SC" });
  if (contains("characteristic result", "scorres")) return high({ domain: "SC", variable: "SCORRES", variableLabel: "Result or Finding in Original Units", controlledTerminology: "Original result", notes: "Collected verbatim value of the characteristic.", reference: "SDTMIG v3.4, SC" });
  if (contains("characteristic date", "scdtc")) return high({ domain: "SC", variable: "SCDTC", variableLabel: "Date/Time of Collection", controlledTerminology: "ISO 8601 date/time", notes: "Date when the characteristic was collected.", reference: "SDTMIG v3.4, SC" });

  return base;
}
