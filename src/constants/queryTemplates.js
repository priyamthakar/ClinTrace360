export const QUERY_TEMPLATES = {
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
