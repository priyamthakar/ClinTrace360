import { SITES, VISITS } from "../constants/sites.js";
import { daysBetween } from "../utils/date.js";

export function generateFindings(data) {
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
    if (subject) {
      if (row.AESTDTC < subject.RFSTDTC) {
        addFinding("TIMING", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "AE", variable: "AESTDTC", description: `${row.AETERM} starts before first dose.`, severity: "Major" });
      }
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
    if (subject) {
      if (subject.ARMCD === "PLACEBO" && row.EXDOSE > 0) {
        addFinding("CONSISTENCY", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "EX", variable: "EXDOSE", description: "Placebo-arm subject has non-zero exposure dose.", severity: "Critical" });
      }
      if (subject.ARMCD === "DRUG A" && row.EXDOSE !== 100) {
        addFinding("CONSISTENCY", { USUBJID: row.USUBJID, SITEID: row.SITEID, domain: "EX", variable: "EXDOSE", description: `Drug A dose is ${row.EXDOSE} mg instead of the scheduled 100 mg.`, severity: "Major" });
      }
    }
  });

  return findings;
}

export function buildSiteSummary(findings) {
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

export function buildVisitHeatmap(data) {
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

export function findingQueryText(finding) {
  const templates = {
    MISSING: `Visit record absent for subject ${finding.USUBJID}. Please confirm whether the visit was completed and enter all assessments, or document a protocol deviation.`,
    TIMING: `Timing discrepancy for subject ${finding.USUBJID}: ${finding.description} Please verify source documents and correct the affected record.`,
    RANGE: `Out-of-range lab value for subject ${finding.USUBJID}: ${finding.description} Please verify source data, assess clinical significance, and enter a clinician comment if applicable.`,
    PROTOCOL: `Protocol deviation for subject ${finding.USUBJID}: ${finding.description} Please review eligibility or site compliance and document the deviation if required.`,
    CONSISTENCY: `Data inconsistency for subject ${finding.USUBJID}: ${finding.description} Please verify treatment assignment and correct the affected record.`,
  };
  return templates[finding.category] ?? `Finding ${finding.findingId}: ${finding.description} Please review and respond.`;
}

export function buildSiteSignals(findings) {
  const counts = SITES.map((site) => findings.filter((f) => f.SITEID === site).length);
  const max = Math.max(...counts, 1);
  return SITES.map((site, i) => {
    const count = counts[i];
    const critCount = findings.filter((f) => f.SITEID === site && f.severity === "Critical").length;
    return { site, count, critCount, pct: Math.round((count / max) * 100), tone: critCount > 0 ? "critical" : count > 5 ? "warning" : "success" };
  });
}
