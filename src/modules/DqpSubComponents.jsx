import React from "react";
import { Badge } from "../components/Badge.jsx";
import { DataTable } from "../components/DataTable.jsx";

export function DqpSections({ rows }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map((row) => (
        <div className="section-block" key={row.section}>
          <div className="section-block-head"><h4>{row.section}</h4></div>
          <div className="section-block-body">{row.content}</div>
        </div>
      ))}
    </div>
  );
}

export function EditCheckTable({ rows }) {
  const columns = [
    { key: "checkId", label: "Check ID", sortable: true, width: "100px", render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "domain", label: "Domain", sortable: true, width: "80px", render: (val) => <Badge tone="neutral">{val}</Badge> },
    { key: "variable", label: "Variable", sortable: true, width: "100px", render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "logic", label: "Logic", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{val}</span> },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      width: "100px",
      render: (val) => <Badge tone={val === "Hard" ? "critical" : "warning"}>{val}</Badge>
    },
    { key: "queryText", label: "Query Text" },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchable={true}
      searchPlaceholder="Filter edit checks..."
      rowKeyField="checkId"
    />
  );
}

export function UatTable({ rows }) {
  const columns = [
    { key: "testId", label: "TC ID", sortable: true, width: "90px", render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "module", label: "Module", sortable: true, width: "120px" },
    { key: "description", label: "Description", sortable: true },
    { key: "input", label: "Input", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{val}</span> },
    { key: "expected", label: "Expected Result" },
    { key: "result", label: "Pass/Fail", render: (val) => val || "—" },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchable={true}
      searchPlaceholder="Filter UAT cases..."
      rowKeyField="testId"
    />
  );
}

export function RiskChecklistTable({ rows }) {
  const columns = [
    { key: "riskArea", label: "Risk Area", sortable: true },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      width: "100px",
      render: (val) => <Badge tone={val === "High" ? "critical" : "warning"}>{val}</Badge>
    },
    { key: "frequency", label: "Frequency", sortable: true, width: "100px" },
    { key: "responsible", label: "Responsible", sortable: true, width: "150px" },
    { key: "indicators", label: "Indicators" },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchable={true}
      searchPlaceholder="Filter risk items..."
      rowKeyField="riskArea"
    />
  );
}
