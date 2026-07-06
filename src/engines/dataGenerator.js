import { SITES, VISITS, ANALYTES } from "../constants/sites.js";
import { seededRandom } from "../utils/prng.js";
import { addDays, iso } from "../utils/date.js";

export function generateSyntheticTrialData() {
  const rand = seededRandom(360);
  const dm = [];
  const sv = [];
  const lb = [];
  const ae = [];
  const ex = [];
  let subjectIndex = 1;

  SITES.forEach((site, siteIndex) => {
    for (let i = 0; i < 8; i += 1) {
      const usubjid = `CT360-${site.slice(-3)}-${String(i + 1).padStart(3, "0")}`;
      const armcd = subjectIndex <= 20 ? "DRUG A" : "PLACEBO";
      const baseline = addDays(new Date("2026-01-15"), siteIndex * 3 + i);
      const consentDate = iso(addDays(baseline, subjectIndex === 2 ? 2 : -7));
      const rfstdtc = iso(baseline);
      const age = subjectIndex === 1 ? 17 : 22 + Math.floor(rand() * 47);

      dm.push({
        USUBJID: usubjid,
        SITEID: site,
        BRTHDTC: `${2026 - age}-06-15`,
        AGE: age,
        SEX: rand() > 0.5 ? "F" : "M",
        RACE: ["White", "Asian", "Black or African American", "Other"][Math.floor(rand() * 4)],
        ETHNIC: rand() > 0.75 ? "Hispanic or Latino" : "Not Hispanic or Latino",
        ARMCD: armcd,
        ARM: armcd === "DRUG A" ? "DRUG A 100mg" : "Placebo",
        RFSTDTC: rfstdtc,
        RFENDTC: iso(addDays(baseline, 140)),
        COUNTRY: "IND",
        CONSENTDTC: consentDate,
      });

      VISITS.forEach((visit) => {
        const forcedMissing = site === "SITE-104" && visit.num === 5 && i < 5;
        const randomMissing = rand() < 0.035 && visit.num > 2;
        if (!forcedMissing && !randomMissing) {
          const windowOffset = [9, -10, 12].includes(subjectIndex + visit.num) ? 10 : Math.floor(rand() * 7) - 3;
          const visitDate = iso(addDays(baseline, visit.day + windowOffset));
          sv.push({ USUBJID: usubjid, SITEID: site, VISITNUM: visit.num, VISIT: visit.name, SVSTDTC: visitDate, EXPECTED_DTC: iso(addDays(baseline, visit.day)) });

          Object.entries(ANALYTES).forEach(([code, meta]) => {
            let value;
            if (code === "ALT") value = 18 + Math.round(rand() * 25);
            if (code === "CREA") value = Number((0.7 + rand() * 0.45).toFixed(2));
            if (code === "HGB") value = Number((12.5 + rand() * 3.2).toFixed(1));
            if (site === "SITE-103" && code === "ALT" && visit.num >= 4) value = 80 + Math.round(rand() * 170);
            if (site === "SITE-105" && code === "HGB" && rand() < 0.3) value = Number((3 + rand() * 3).toFixed(1));
            if (subjectIndex === 7 && code === "CREA" && visit.num === 6) value = 2.4;
            lb.push({
              USUBJID: usubjid,
              SITEID: site,
              VISITNUM: visit.num,
              VISIT: visit.name,
              LBDT: visitDate,
              LBTESTCD: code,
              LBTEST: meta.name,
              LBORRES: value,
              LBORNRLO: meta.low,
              LBORNRHI: meta.high,
              LBSTRESU: meta.unit,
            });
          });

          ex.push({
            USUBJID: usubjid,
            SITEID: site,
            VISITNUM: visit.num,
            EXTRT: armcd === "DRUG A" ? "Drug A" : "Placebo",
            EXDOSE: armcd === "PLACEBO" ? 0 : 100,
            EXDOSU: "mg",
            EXSTDTC: visitDate,
            EXENDTC: visitDate,
          });
        }
      });

      if (site !== "SITE-104") {
        const count = 1 + Math.floor(rand() * 4);
        for (let n = 0; n < count; n += 1) {
          const startOffset = 6 + Math.floor(rand() * 120);
          const term = ["Headache", "Nausea", "Fatigue", "Injection site reaction", "Dizziness"][Math.floor(rand() * 5)];
          ae.push({
            USUBJID: usubjid,
            SITEID: site,
            AETERM: term,
            AEDECOD: term.toUpperCase(),
            AEBODSYS: term === "Nausea" ? "GASTROINTESTINAL DISORDERS" : "GENERAL DISORDERS",
            AESTDTC: iso(addDays(baseline, startOffset)),
            AEENDTC: iso(addDays(baseline, startOffset + 3 + Math.floor(rand() * 20))),
            AESEV: ["MILD", "MODERATE", "SEVERE"][Math.floor(rand() * 3)],
            AESER: "N",
            AEREL: rand() > 0.65 ? "POSSIBLE" : "NOT RELATED",
            AEACN: "NONE",
            AEOUT: "RECOVERED/RESOLVED",
          });
        }
      }
      subjectIndex += 1;
    }
  });

  ae.push(
    { ...ae[0], USUBJID: dm[5].USUBJID, SITEID: dm[5].SITEID, AETERM: "Migraine", AESTDTC: iso(addDays(new Date(dm[5].RFSTDTC), -3)), AEENDTC: iso(addDays(new Date(dm[5].RFSTDTC), 2)) },
    { ...ae[1], USUBJID: dm[12].USUBJID, SITEID: dm[12].SITEID, AETERM: "Vomiting", AESTDTC: iso(addDays(new Date(dm[12].RFSTDTC), -2)), AEENDTC: iso(addDays(new Date(dm[12].RFSTDTC), 4)) },
    { ...ae[2], USUBJID: dm[18].USUBJID, SITEID: dm[18].SITEID, AETERM: "Rash", AESTDTC: iso(addDays(new Date(dm[18].RFSTDTC), 40)), AEENDTC: iso(addDays(new Date(dm[18].RFSTDTC), 35)) },
    { ...ae[3], USUBJID: dm[23].USUBJID, SITEID: dm[23].SITEID, AETERM: "Severe dehydration", AESER: "Y", AESEV: "SEVERE", AESTDTC: iso(addDays(new Date(dm[23].RFSTDTC), 34)), AEENDTC: iso(addDays(new Date(dm[23].RFSTDTC), 41)) }
  );

  [
    { subject: dm[22].USUBJID, visit: 3, dose: 50 },
    { subject: dm[28].USUBJID, visit: 4, dose: 25 },
    { subject: dm[27].USUBJID, visit: 3, dose: 100 },
  ].forEach((override) => {
    const row = ex.find((record) => record.USUBJID === override.subject && record.VISITNUM === override.visit);
    if (row) row.EXDOSE = override.dose;
  });

  const seriousAe = ae.find((row) => row.AESER === "Y");
  const relatedSubject = dm[10];
  const lateSubject = dm[14];
  const safety = [
    {
      USUBJID: seriousAe.USUBJID,
      SAESSION: "SAE-001",
      SAETERM: "Severe dehydration",
      SAESTDTC: seriousAe.AESTDTC,
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(seriousAe.AESTDTC), 0)),
    },
    {
      USUBJID: dm[8].USUBJID,
      SAESSION: "SAE-002",
      SAETERM: "Acute pancreatitis",
      SAESTDTC: iso(addDays(new Date(dm[8].RFSTDTC), 46)),
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(dm[8].RFSTDTC), 46)),
    },
    {
      USUBJID: relatedSubject.USUBJID,
      SAESSION: "SAE-003",
      SAETERM: "Drug-related liver injury",
      SAESTDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
      SAESER: "Y",
      SAECRIT: "Other Medically Important",
      SAERPTDT: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
    },
    {
      USUBJID: lateSubject.USUBJID,
      SAESSION: "SAE-004",
      SAETERM: "Syncope",
      SAESTDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 28)),
      SAESER: "Y",
      SAECRIT: "Life-threatening",
      SAERPTDT: iso(addDays(new Date(lateSubject.RFSTDTC), 30)),
    },
    {
      USUBJID: dm[3].USUBJID,
      SAESSION: "SAE-005",
      SAETERM: "Pneumonia",
      SAESTDTC: iso(addDays(new Date(dm[3].RFSTDTC), 91)),
      SAESER: "Y",
      SAECRIT: "Hospitalization",
      SAERPTDT: iso(addDays(new Date(dm[3].RFSTDTC), 91)),
    },
  ];

  ae.push(
    {
      USUBJID: relatedSubject.USUBJID,
      SITEID: relatedSubject.SITEID,
      AETERM: "Hepatic injury",
      AEDECOD: "HEPATIC INJURY",
      AEBODSYS: "HEPATOBILIARY DISORDERS",
      AESTDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 72)),
      AEENDTC: iso(addDays(new Date(relatedSubject.RFSTDTC), 80)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "PROBABLE",
      AEACN: "DRUG INTERRUPTED",
      AEOUT: "RECOVERING/RESOLVING",
    },
    {
      USUBJID: lateSubject.USUBJID,
      SITEID: lateSubject.SITEID,
      AETERM: "Syncope",
      AEDECOD: "SYNCOPE",
      AEBODSYS: "NERVOUS SYSTEM DISORDERS",
      AESTDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 25)),
      AEENDTC: iso(addDays(new Date(lateSubject.RFSTDTC), 29)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "POSSIBLE",
      AEACN: "DRUG INTERRUPTED",
      AEOUT: "RECOVERED/RESOLVED",
    },
    {
      USUBJID: dm[20].USUBJID,
      SITEID: dm[20].SITEID,
      AETERM: "Anaphylactic reaction",
      AEDECOD: "ANAPHYLACTIC REACTION",
      AEBODSYS: "IMMUNE SYSTEM DISORDERS",
      AESTDTC: iso(addDays(new Date(dm[20].RFSTDTC), 51)),
      AEENDTC: iso(addDays(new Date(dm[20].RFSTDTC), 53)),
      AESEV: "SEVERE",
      AESER: "Y",
      AEREL: "POSSIBLE",
      AEACN: "DRUG WITHDRAWN",
      AEOUT: "RECOVERED/RESOLVED",
    }
  );

  const localLabs = lb
    .filter((row) => row.SITEID !== "SITE-104" && row.VISITNUM >= 3 && row.LBTESTCD !== "CREA")
    .slice(0, 56)
    .map((row) => ({
      USUBJID: row.USUBJID,
      SITEID: row.SITEID,
      LABSRC: "Local",
      LBTESTCD: row.LBTESTCD,
      LBDT: row.LBDT,
      LBORRES: row.LBORRES,
      LBSTRESU: row.LBSTRESU,
    }));

  localLabs.push(
    { USUBJID: dm[6].USUBJID, SITEID: dm[6].SITEID, LABSRC: "Local", LBTESTCD: "ALT", LBDT: iso(addDays(new Date(dm[6].RFSTDTC), 67)), LBORRES: 144, LBSTRESU: "U/L" },
    { USUBJID: dm[16].USUBJID, SITEID: dm[16].SITEID, LABSRC: "Local", LBTESTCD: "HGB", LBDT: iso(addDays(new Date(dm[16].RFSTDTC), 73)), LBORRES: 9.8, LBSTRESU: "g/dL" },
    { USUBJID: dm[31].USUBJID, SITEID: dm[31].SITEID, LABSRC: "Local", LBTESTCD: "ALT", LBDT: iso(addDays(new Date(dm[31].RFSTDTC), 82)), LBORRES: 88, LBSTRESU: "U/L" }
  );

  if (localLabs[3]) localLabs[3] = { ...localLabs[3], LBORRES: Number(localLabs[3].LBORRES) + 15 };
  if (localLabs[11]) localLabs[11] = { ...localLabs[11], LBORRES: Number(localLabs[11].LBORRES) - 2 };
  if (localLabs[18]) localLabs[18] = { ...localLabs[18], LBSTRESU: localLabs[18].LBTESTCD === "ALT" ? "ukat/L" : "mmol/L" };

  return { dm, sv, lb, ae, ex, safety, localLabs };
}
