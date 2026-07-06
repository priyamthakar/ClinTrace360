import React from "react";

export function Kpi({ label, value, sub, tone = "" }) {
  return (
    <div className={`kpi${tone ? ` ${tone}` : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
