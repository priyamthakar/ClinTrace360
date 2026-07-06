export const SITES = ["SITE-101", "SITE-102", "SITE-103", "SITE-104", "SITE-105"];

export const VISITS = [
  { num: 1, name: "Screening", day: -14 },
  { num: 2, name: "Baseline", day: 0 },
  { num: 3, name: "Week 4", day: 28 },
  { num: 4, name: "Week 8", day: 56 },
  { num: 5, name: "Week 12", day: 84 },
  { num: 6, name: "Week 16", day: 112 },
  { num: 7, name: "EOT", day: 140 },
];

export const ANALYTES = {
  ALT: { name: "Alanine Aminotransferase", unit: "U/L", low: 7, high: 55 },
  CREA: { name: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.3 },
  HGB: { name: "Hemoglobin", unit: "g/dL", low: 12, high: 17.5 },
};
