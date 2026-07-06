export const CHECKLIST_TEMPLATES = [
  {
    id: "edc-data-entry",
    label: "EDC Data Entry (100%)",
    category: "Data Entry & Completion",
    description: "Verify that all pages for all enrolled subjects have been entered into the EDC and marked complete.",
    checked: false
  },
  {
    id: "sae-reconciliation",
    label: "SAE Reconciliation",
    category: "Safety & Reconciliation",
    description: "Reconcile serious adverse events (SAEs) between the clinical database (EDC) and the safety database.",
    checked: false
  },
  {
    id: "local-lab-normalization",
    label: "Local Lab Normalization",
    category: "Data Quality & Clearance",
    description: "Normalize local laboratory results against site-specific reference ranges and apply standardized units.",
    checked: false
  },
  {
    id: "query-workbench-clearance",
    label: "Query Workbench Clearance",
    category: "Data Quality & Clearance",
    description: "Address, resolve, and close all queries (system-generated and manual) in the EDC query workbench.",
    checked: false
  },
  {
    id: "protocol-deviation-approval",
    label: "Protocol Deviation Approval",
    category: "Review & Sign-off",
    description: "Review, classify, and approve all protocol deviations prior to determining the evaluable patient populations.",
    checked: false
  },
  {
    id: "medical-coding",
    label: "Medical Coding Coded to MedDRA/WHO-Drug",
    category: "Coding & Reconciliation",
    description: "Finalize medical coding for Adverse Events (MedDRA), Medical History (MedDRA), and Concomitant Medications (WHO-Drug).",
    checked: false
  },
  {
    id: "pi-ecrf-signoff",
    label: "PI eCRF Sign-off",
    category: "Review & Sign-off",
    description: "Obtain electronic signatures from Principal Investigators (PIs) for all completed and reviewed case report forms.",
    checked: false
  }
];

export default CHECKLIST_TEMPLATES;
