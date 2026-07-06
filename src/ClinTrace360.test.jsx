import { describe, expect, it } from "vitest";
import {
  CRF_TEMPLATES,
  SAMPLE_PROTOCOL_TEXT,
  extractProtocolSignals,
  formatCrfFields,
  generateDqpPackage,
  generateFindings,
  generateReconciliation,
  generateSyntheticTrialData,
  mapCrfField,
  parseCrfInput,
} from "./ClinTrace360.jsx";

describe("synthetic trial generation", () => {
  it("generates a stable seeded dataset", () => {
    const first = generateSyntheticTrialData();
    const second = generateSyntheticTrialData();

    expect(first).toEqual(second);
    expect(first.dm).toHaveLength(40);
    expect(first.safety).toHaveLength(5);
    expect(first.localLabs.length).toBeGreaterThan(50);
  });
});

describe("data review rule engine", () => {
  it("surfaces the seeded clinical data quality findings", () => {
    const findings = generateFindings(generateSyntheticTrialData());

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: "DM", variable: "AGE", severity: "Critical" }),
        expect.objectContaining({ domain: "DM", variable: "RFSTDTC", severity: "Critical" }),
        expect.objectContaining({ domain: "SV", variable: "VISIT", category: "MISSING" }),
        expect.objectContaining({ domain: "SV", variable: "SVSTDTC", category: "TIMING" }),
        expect.objectContaining({ domain: "LB", variable: "ALT", severity: "Critical" }),
        expect.objectContaining({ domain: "LB", variable: "HGB", severity: "Critical" }),
        expect.objectContaining({ domain: "AE", variable: "AESTDTC", category: "TIMING" }),
        expect.objectContaining({ domain: "AE", variable: "AEENDTC", category: "TIMING" }),
        expect.objectContaining({ domain: "AE", SITEID: "SITE-104", USUBJID: "Site-level" }),
        expect.objectContaining({ domain: "EX", variable: "EXDOSE", severity: "Critical" }),
      ])
    );
  });

  it("flags a Drug A dose that deviates from the protocol dose", () => {
    const data = generateSyntheticTrialData();
    const drugSubject = data.dm.find((subject) => subject.ARMCD === "DRUG A");
    const exposure = data.ex.find((row) => row.USUBJID === drugSubject.USUBJID);
    exposure.EXDOSE = 75;

    const findings = generateFindings(data);

    expect(findings).toContainEqual(
      expect.objectContaining({
        USUBJID: drugSubject.USUBJID,
        domain: "EX",
        variable: "EXDOSE",
        severity: "Major",
      })
    );
  });
});

describe("SAE and lab reconciliation", () => {
  it("classifies every seeded mismatch family", () => {
    const reconciliation = generateReconciliation(generateSyntheticTrialData());
    const saeTypes = reconciliation.saeFindings.map((row) => row.mismatchType);
    const labTypes = reconciliation.labFindings.map((row) => row.mismatchType);

    expect(saeTypes).toEqual(
      expect.arrayContaining([
        "MISSING_IN_AE",
        "MISSING_IN_SAFETY",
        "TERM_MISMATCH",
        "DATE_MISMATCH",
        "REPORTING_BREACH",
      ])
    );
    expect(labTypes).toEqual(expect.arrayContaining(["LAB_MISSING_IN_EDC", "LAB_VALUE_MISMATCH", "LAB_UNIT_MISMATCH"]));
    expect(reconciliation.queries).toHaveLength(reconciliation.saeFindings.length + reconciliation.labFindings.length);
  });

  it("treats same-subject same-term SAE date drift as DATE_MISMATCH, not missing", () => {
    const data = generateSyntheticTrialData();
    const reconciliation = generateReconciliation(data);
    const dateMismatch = reconciliation.saeFindings.find((row) => row.mismatchType === "DATE_MISMATCH");

    expect(dateMismatch).toEqual(
      expect.objectContaining({
        SAETERM: "Syncope",
        edcValue: expect.any(String),
        safetyValue: expect.any(String),
      })
    );
    expect(reconciliation.saeFindings).not.toContainEqual(
      expect.objectContaining({
        mismatchType: "MISSING_IN_SAFETY",
        USUBJID: dateMismatch.USUBJID,
        AETERM: "Syncope",
      })
    );
  });
});

describe("CRF to SDTM mapper", () => {
  it("round-trips template fields and maps core SDTM targets", () => {
    const text = formatCrfFields(CRF_TEMPLATES.demographics.fields);
    const fields = parseCrfInput(text);
    const mappings = fields.map(mapCrfField);

    expect(fields).toHaveLength(CRF_TEMPLATES.demographics.fields.length);
    expect(mappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ crfField: "Subject Identifier", domain: "DM", variable: "USUBJID", confidence: "High" }),
        expect.objectContaining({ crfField: "Date of Informed Consent", domain: "DS", variable: "DSSTDTC", confidence: "Medium" }),
      ])
    );
  });

  it("routes unknown fields to supplemental qualifier review", () => {
    expect(mapCrfField({ label: "Sponsor Custom Flag", type: "Char" }, 0)).toEqual(
      expect.objectContaining({ domain: "SUPP--", variable: "QNAM/QVAL", confidence: "Low" })
    );
  });
});

describe("protocol to DQP generation", () => {
  it("extracts protocol signals and emits the expected DQP sections", () => {
    const signals = extractProtocolSignals(SAMPLE_PROTOCOL_TEXT);
    const dqp = generateDqpPackage(signals);

    expect(signals.phase).toBe("Phase 2");
    expect(signals.visits).toEqual(expect.arrayContaining(["Screening", "Baseline", "Week 12", "End of Treatment"]));
    expect(signals.labs).toEqual(expect.arrayContaining(["ALT", "creatinine", "hemoglobin"]));
    expect(dqp.dqpSections.map((row) => row.section)).toEqual(
      expect.arrayContaining(["4.0 Edit Check Plan", "7.0 Medical Coding Plan", "9.0 Database Lock Checklist"])
    );
    expect(dqp.editChecks).toHaveLength(8);
    expect(dqp.uatCases.length).toBeGreaterThanOrEqual(6);
    expect(dqp.reviewChecklist.length).toBeGreaterThanOrEqual(6);
  });
});
