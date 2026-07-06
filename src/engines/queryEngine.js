import { readStorage, writeStorage } from "../utils/storage.js";

const MOCK_SITE_RESPONSES = {
  MISSING: "Subject missed this visit due to vacation. Missed visit documentation filed in source files.",
  TIMING: "Subject rescheduled visit due to transportation delay. Visit completed outside the protocol window.",
  RANGE: "Re-test scheduled. Investigator has reviewed the result and assessed it as not clinically significant.",
  PROTOCOL: "Birth date verified in source documents. Typo in birth year corrected in EDC; subject is eligible.",
  CONSISTENCY: "EDC entry error corrected to align with drug accountability log.",
  MISSING_IN_AE: "EDC adverse event log updated. Serious AE marker set to 'Yes' to match safety database.",
  MISSING_IN_SAFETY: "SAE form submitted to Safety database department. Safety database reference updated.",
  TERM_MISMATCH: "EDC AE verbatim term corrected to align with safety database verbatim term.",
  DATE_MISMATCH: "EDC AE onset date corrected to match safety database onset date.",
  REPORTING_BREACH: "Dosing occurred on Friday evening; site coordinator notified on Monday. Deviation log updated.",
  LAB_MISSING_IN_EDC: "Local laboratory worksheet uploaded to EDC laboratory transfer panel.",
  LAB_VALUE_MISMATCH: "EDC lab value corrected to match local laboratory source printout.",
  LAB_UNIT_MISMATCH: "EDC unit adjusted to standardized SI units to resolve lab conversion discrepancy."
};

const MOCK_CDI_REVIEWS = {
  MISSING: "Missed visit documented. Query closed.",
  TIMING: "Out-of-window visit documented. Query closed.",
  RANGE: "Repeat test reviewed by investigator. Query closed.",
  PROTOCOL: "GCP eligibility correction verified. Query closed.",
  CONSISTENCY: "Dose correction verified against source. Query closed.",
  MISSING_IN_AE: "EDC updated. AE/SAE reconciled. Query closed.",
  MISSING_IN_SAFETY: "SAE submission verified. AE/SAE reconciled. Query closed.",
  TERM_MISMATCH: "AE verbatim term aligned. AE/SAE reconciled. Query closed.",
  DATE_MISMATCH: "AE/SAE onset dates aligned. Query closed.",
  REPORTING_BREACH: "Late reporting rationale documented. Query closed.",
  LAB_MISSING_IN_EDC: "Local lab data upload verified. Query closed.",
  LAB_VALUE_MISMATCH: "Lab value correction verified. Query closed.",
  LAB_UNIT_MISMATCH: "Lab unit normalization verified. Query closed."
};

export function initializeQueries(findings = [], reconciliationQueries = []) {
  const stored = readStorage("clintrace360_queries_v1", null);
  if (stored) return stored;

  const initial = [];

  findings.forEach((finding) => {
    initial.push({
      queryId: finding.findingId,
      type: "Data Review",
      mismatchType: finding.category,
      USUBJID: finding.USUBJID,
      SITEID: finding.SITEID,
      description: finding.description,
      queryText: finding.description,
      severity: finding.severity,
      status: "OPEN",
      openedAt: "2026-06-15T09:00:00Z",
      answeredAt: null,
      closedAt: null,
      siteResponse: "",
      reviewerComment: ""
    });
  });

  reconciliationQueries.forEach((q) => {
    const siteId = q.USUBJID.startsWith("CT360-") ? `SITE-${q.USUBJID.split("-")[1]}` : "SITE-101";
    initial.push({
      queryId: q.queryId,
      type: q.type,
      mismatchType: q.mismatchType,
      USUBJID: q.USUBJID,
      SITEID: siteId,
      description: q.description,
      queryText: q.queryText,
      severity: q.severity,
      status: "OPEN",
      openedAt: q.generatedAt || "2026-06-15T09:00:00Z",
      answeredAt: null,
      closedAt: null,
      siteResponse: "",
      reviewerComment: ""
    });
  });

  writeStorage("clintrace360_queries_v1", initial);
  return initial;
}

export function answerQuery(queries, queryId) {
  const next = queries.map((q) => {
    if (q.queryId === queryId && q.status === "OPEN") {
      const responseTemplate = MOCK_SITE_RESPONSES[q.mismatchType] || "Source documents verified. EDC record updated accordingly.";
      return {
        ...q,
        status: "ANSWERED",
        siteResponse: responseTemplate,
        answeredAt: new Date().toISOString()
      };
    }
    return q;
  });
  writeStorage("clintrace360_queries_v1", next);
  return next;
}

export function closeQuery(queries, queryId, comment = "") {
  const next = queries.map((q) => {
    if (q.queryId === queryId && q.status === "ANSWERED") {
      const reviewTemplate = comment || MOCK_CDI_REVIEWS[q.mismatchType] || "Verified against source document. Query closed.";
      return {
        ...q,
        status: "CLOSED",
        reviewerComment: reviewTemplate,
        closedAt: new Date().toISOString()
      };
    }
    return q;
  });
  writeStorage("clintrace360_queries_v1", next);
  return next;
}

export function resetQueries(findings = [], reconciliationQueries = []) {
  window.localStorage.removeItem("clintrace360_queries_v1");
  return initializeQueries(findings, reconciliationQueries);
}
