export function extractProtocolSignals(text, nctRecord) {
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

export function generateDqpPackage(signals) {
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

export function formatDqpForExport(signals, dqp) {
  const sectionText = dqp.dqpSections.map((row) => `${row.section}\n${row.content}`).join("\n\n");
  const checks = dqp.editChecks.map((row) => `${row.checkId} | ${row.domain} | ${row.variable} | ${row.logic} | ${row.severity} | ${row.queryText}`).join("\n");
  const uat = dqp.uatCases.map((row) => `${row.testId} | ${row.module} | ${row.description} | ${row.input} | ${row.expected}`).join("\n");
  const review = dqp.reviewChecklist.map((row) => `${row.riskArea} | ${row.priority} | ${row.frequency} | ${row.responsible} | ${row.indicators}`).join("\n");
  return `ClinTrace360 DQP Skeleton\nStudy: ${signals.title}\nPhase: ${signals.phase}\nDesign: ${signals.design}\n\n${sectionText}\n\nEdit Checks\n${checks}\n\nUAT Cases\n${uat}\n\nRisk-Based Review Checklist\n${review}\n\nLimitation: This is a generated skeleton for demonstration and must be reviewed by qualified clinical data management staff.`;
}
