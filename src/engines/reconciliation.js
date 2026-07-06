import { QUERY_TEMPLATES } from "../constants/queryTemplates.js";
import { daysBetween } from "../utils/date.js";
import { fillTemplate, normalizeTerm } from "../utils/text.js";

export function generateReconciliation(data) {
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
    const sameTerm = sameSubject.find((ae) => normalizeTerm(ae.AETERM) === normalizeTerm(sae.SAETERM));
    if (!exact && !near && !sameTerm) {
      const queryText = fillTemplate(QUERY_TEMPLATES.MISSING_IN_AE, sae);
      const queryId = addQuery("SAE", "MISSING_IN_AE", "Critical", sae.USUBJID, "Safety database has SAE with no matching serious AE in EDC.", queryText, sae.SAESSION);
      saeFindings.push({ findingId: `SAE-${String(saeFindings.length + 1).padStart(3, "0")}`, mismatchType: "MISSING_IN_AE", severity: "Critical", queryId, edcValue: "No matching AESER='Y' AE", safetyValue: `${sae.SAETERM} / ${sae.SAESTDTC}`, ...sae });
      return;
    }
    const matchedAe = exact ?? near ?? sameTerm;
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
    const matchingSae = data.safety.find((sae) => sae.USUBJID === ae.USUBJID && (Math.abs(daysBetween(ae.AESTDTC, sae.SAESTDTC)) <= 1 || normalizeTerm(ae.AETERM) === normalizeTerm(sae.SAETERM)));
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
