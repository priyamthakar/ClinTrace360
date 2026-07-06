export const RULE_LIBRARY = [
  {
    ruleId: "RULE-DM-001",
    domain: "DM",
    variable: "AGE",
    description: "Subject age below adult eligibility threshold",
    condition: "AGE < 18 years",
    severity: "Critical",
    basis: "Protocol eligibility criteria; ICH E6(R2) GCP §4.1",
    rationale: "Pediatric subjects are excluded from this study. Verification of age is required to prevent major eligibility deviations."
  },
  {
    ruleId: "RULE-DM-002",
    domain: "DM",
    variable: "RFSTDTC",
    description: "First dose date precedes informed consent date",
    condition: "RFSTDTC < CONSENTDTC",
    severity: "Critical",
    basis: "ICH E6(R2) GCP §4.8 Informed Consent",
    rationale: "Subject must provide written informed consent prior to receiving the first dose of study drug. Dosing before consent is a severe GCP violation."
  },
  {
    ruleId: "RULE-DM-003",
    domain: "DM",
    variable: "CONSENTDTC",
    description: "Informed consent date in the future relative to baseline",
    condition: "CONSENTDTC > RFSTDTC",
    severity: "Critical",
    basis: "ICH E6(R2) GCP §4.8.8; consent workflow protocol",
    rationale: "Informed consent cannot occur after the initiation of study procedures. First dose must occur on or after the consent date."
  },
  {
    ruleId: "RULE-DM-004",
    domain: "DM",
    variable: "CONSENTDTC",
    description: "Informed consent date is after the current system date",
    condition: "CONSENTDTC > CURRENT_DATE",
    severity: "Major",
    basis: "Temporal logic constraints; source data verification",
    rationale: "Consent dates cannot occur in the future relative to the data entry date. Typographical error suspected."
  },
  {
    ruleId: "RULE-SV-001",
    domain: "SV",
    variable: "VISIT",
    description: "Missing scheduled visit record",
    condition: "No SV record for expected VISITNUM",
    severity: "Critical / Major",
    basis: "Protocol-defined visit schedule; ICH E9 §5.2 data completeness",
    rationale: "Missing scheduled visits impacts primary and secondary endpoint assessments. Site must document reason for missed visits."
  },
  {
    ruleId: "RULE-SV-002",
    domain: "SV",
    variable: "SVSTDTC",
    description: "Visit date outside protocol-defined window",
    condition: "|SVSTDTC − expected| > 7 days",
    severity: "Major",
    basis: "Protocol visit window; ICH E9(R1) data quality requirements",
    rationale: "Assessments must occur within protocol-defined time intervals. Violations may result in data exclusion from per-protocol analyses."
  },
  {
    ruleId: "RULE-SV-003",
    domain: "SV",
    variable: "SVSTDTC",
    description: "Subsequent visit date precedes earlier visit date",
    condition: "SVSTDTC(Visit N) > SVSTDTC(Visit N+1)",
    severity: "Major",
    basis: "Chronological visit flow; protocol compliance",
    rationale: "Visits must occur in sequential chronological order. Out-of-sequence dates suggest data entry errors or rescheduling anomalies."
  },
  {
    ruleId: "RULE-LB-001",
    domain: "LB",
    variable: "LBORRES",
    description: "Lab result outside central laboratory reference range",
    condition: "LBORRES < LBORNRLO or > LBORNRHI",
    severity: "Major",
    basis: "Central lab reference range (CLRR); sponsor clinical monitoring plan",
    rationale: "Values outside normal limits are flagged to ensure clinical investigator review and assessment of clinical significance."
  },
  {
    ruleId: "RULE-LB-002",
    domain: "LB",
    variable: "ALT (LBORRES)",
    description: "ALT exceeds 3× ULN — hepatotoxicity signal (Hy's Law precursor)",
    condition: "ALT > 165 U/L (3 × 55 U/L ULN)",
    severity: "Critical",
    basis: "FDA DILI Guidance (2009); Hy's Law: ALT > 3× ULN + bilirubin > 2× ULN",
    rationale: "Substantial ALT elevation is a primary marker for drug-induced liver injury. Prompt clinical investigation is mandatory."
  },
  {
    ruleId: "RULE-LB-003",
    domain: "LB",
    variable: "HGB (LBORRES)",
    description: "Hemoglobin implausibly low — likely data entry or transfer error",
    condition: "HGB < 5.0 g/dL",
    severity: "Critical",
    basis: "Clinical implausibility threshold; incompatible with outpatient participation; source verification required",
    rationale: "A hemoglobin value below 5 g/dL represents critical anemia and is typically incompatible with ambulatory trial participation. Query site to verify."
  },
  {
    ruleId: "RULE-LB-004",
    domain: "LB",
    variable: "LBORNRLO / LBORNRHI",
    description: "Central/local reference ranges missing for clinical lab evaluation",
    condition: "LBORNRLO is null or LBORNRHI is null",
    severity: "Major",
    basis: "ICH E6(R2) §8.2.14 laboratory certification and normal ranges",
    rationale: "Without normal reference ranges, the clinical significance of lab values cannot be automatically evaluated, blocking safety reviews."
  },
  {
    ruleId: "RULE-AE-001",
    domain: "AE",
    variable: "AESTDTC",
    description: "AE onset date before first dose — medical history or data entry error",
    condition: "AESTDTC < RFSTDTC",
    severity: "Major",
    basis: "AE temporal plausibility; ICH E6(R2) §8.3 source data integrity",
    rationale: "Events starting before the first dose are medical history, not treatment-emergent adverse events, unless worsening is noted."
  },
  {
    ruleId: "RULE-AE-002",
    domain: "AE",
    variable: "AEENDTC",
    description: "AE resolution date before onset date — temporal impossibility",
    condition: "AEENDTC < AESTDTC",
    severity: "Major",
    basis: "Temporal data integrity; data entry error requiring source document review",
    rationale: "Resolution date cannot precede start date. This indicates a data entry error that must be resolved via source query."
  },
  {
    ruleId: "RULE-AE-003",
    domain: "AE",
    variable: "SITEID",
    description: "Site with zero AE records — possible underreporting signal",
    condition: "Count of AE records for SITEID = 0",
    severity: "Critical",
    basis: "ICH E2A expedited reporting; WHO pharmacovigilance underreporting detection",
    rationale: "A site enrolling multiple subjects with zero adverse events is a strong statistical anomaly. Query to verify if AEs are underreported."
  },
  {
    ruleId: "RULE-AE-004",
    domain: "AE",
    variable: "AEOUT",
    description: "Adverse event outcome is fatal but no death disposition record exists",
    condition: "AEOUT = FATAL and DSDECOD ≠ DEATH",
    severity: "Critical",
    basis: "ICH E3 study termination and death reporting requirements",
    rationale: "Fatal adverse events must correspond directly to a subject's disposition record of death to maintain reconciliation safety integrity."
  },
  {
    ruleId: "RULE-AE-005",
    domain: "AE",
    variable: "AEENDTC",
    description: "Serious Adverse Event duration anomaly",
    condition: "AESER = Y and AE duration > 365 days",
    severity: "Major",
    basis: "Clinical review guidelines; data query validation threshold",
    rationale: "SAEs remaining active for more than a year require monitoring verification to ensure that resolution was not missed."
  },
  {
    ruleId: "RULE-EX-001",
    domain: "EX",
    variable: "EXDOSE",
    description: "Placebo-arm subject has non-zero exposure dose",
    condition: "ARMCD = PLACEBO and EXDOSE > 0",
    severity: "Critical",
    basis: "Protocol dosing specification; potential unblinding / randomization integrity issue",
    rationale: "Placebo subjects should never receive active drug. This suggests a potential misdosing event or blinding breach."
  },
  {
    ruleId: "RULE-EX-002",
    domain: "EX",
    variable: "EXDOSE",
    description: "Drug A dose deviates from protocol-specified 100 mg",
    condition: "ARMCD = DRUG A and EXDOSE ≠ 100 mg",
    severity: "Major",
    basis: "Protocol-defined dose; treatment compliance and exposure consistency monitoring",
    rationale: "Standard dose is 100 mg. Deviations must be flagged to track dose adjustments, compliance, or data entry errors."
  },
  {
    ruleId: "RULE-EX-003",
    domain: "EX",
    variable: "EXDOSE",
    description: "Cumulative exposure exceeds protocol limit",
    condition: "Cumulative dose > 120% of protocol expected dose",
    severity: "Critical",
    basis: "Protocol dosing limits; FDA safety monitoring compliance",
    rationale: "Subject received an investigational drug dosage exceeding protocol limits, which represents a patient safety risk."
  },
  {
    ruleId: "RULE-EX-004",
    domain: "EX",
    variable: "EXSTDTC",
    description: "Study drug exposure begins prior to informed consent date",
    condition: "EXSTDTC < CONSENTDTC",
    severity: "Critical",
    basis: "ICH E6(R2) §4.8 Informed Consent; patient safety requirements",
    rationale: "Administration of investigational product before written consent is signed is an ethical and GCP regulatory breach."
  }
];
