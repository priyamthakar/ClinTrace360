# ClinTrace360 Synthetic Data Model

ClinTrace360 uses deterministic synthetic data only. No real patient data is included, processed, or stored.

## Core EDC Domains

- `DM`: 40 subjects across five sites, including age, sex, race, ethnicity, arm, first dose date, and consent date.
- `SV`: scheduled subject visits from Screening through End of Treatment, with missing visit and visit-window anomalies.
- `LB`: ALT, creatinine, and hemoglobin values by visit, including out-of-range and implausible-value anomalies.
- `AE`: adverse event records, including timing issues, serious AE flags, and a site-level underreporting signal.
- `EX`: exposure/dosing records, including dose inconsistencies and placebo non-zero dose anomalies.

## External Reconciliation Feeds

- Safety database SAE records: synthetic SAE records used to exercise missing-in-EDC, missing-in-safety, term mismatch, date mismatch, and late-reporting checks.
- Local lab records: synthetic external lab feed used to exercise missing-in-EDC, result mismatch, and unit mismatch checks.

## Rule-Based Checks

The app uses transparent rule checks rather than machine learning. Checks are intentionally audit-friendly and map to common clinical data management workflows:

- missing visits
- visit window violations
- lab range violations
- ALT greater than 3x ULN
- implausibly low hemoglobin
- AE start before first dose
- AE end before AE start
- zero-AE site signal
- eligibility and consent timing issues
- exposure consistency issues
- SAE and local lab reconciliation mismatch categories

## Persistence

Generated DQP packages and CRF-to-SDTM mapping sessions are saved in browser `localStorage` only. This is local convenience storage, not validated persistence.
