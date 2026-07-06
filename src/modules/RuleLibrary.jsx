import React from "react";
import { RULE_LIBRARY } from "../constants/ruleLibrary.js";
import { Badge } from "../components/Badge.jsx";
import { Card } from "../components/Card.jsx";
import { Kpi } from "../components/Kpi.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";
import { Tooltip } from "../components/Tooltip.jsx";
import { DataTable } from "../components/DataTable.jsx";

export function RuleLibrary() {
  const critCount = RULE_LIBRARY.filter((r) => r.severity === "Critical").length;
  const majCount = RULE_LIBRARY.filter((r) => r.severity === "Major" || r.severity === "Critical / Major").length;
  const regCount = RULE_LIBRARY.filter((r) => r.basis.includes("ICH") || r.basis.includes("FDA")).length;

  const columns = [
    { key: "ruleId", label: "Rule ID", sortable: true, width: "110px", render: (val) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{val}</span> },
    { key: "domain", label: "Domain", sortable: true, width: "80px", render: (val) => <Badge tone="neutral">{val}</Badge> },
    { key: "variable", label: "Variable", sortable: true, width: "120px", render: (val) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{val}</span> },
    { key: "description", label: "Description", sortable: true },
    { key: "condition", label: "Condition / Threshold", render: (val) => <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{val}</span> },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      width: "110px",
      render: (val) => (
        <Badge tone={val === "Critical" ? "critical" : val.includes("Major") ? "warning" : "neutral"}>
          {val}
        </Badge>
      ),
    },
    {
      key: "basis",
      label: "Regulatory Basis",
      sortable: true,
      render: (val, row) => (
        <Tooltip content={row.rationale}>
          {val}
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="workspace">
      <ModuleHead
        eyebrow="Reference"
        title="Rule Library"
        sub={`Deterministic edit check rules powering the Data Review engine — ${RULE_LIBRARY.length} rules across DM, SV, LB, AE, EX`}
      />

      <div className="kpi-grid cols4">
        <Kpi label="Total Rules" value={RULE_LIBRARY.length} sub="5 SDTM domains" />
        <Kpi label="Critical" tone="critical" value={critCount} sub="Immediate action" />
        <Kpi label="Major" tone="warning" value={majCount} sub="Expedited review" />
        <Kpi label="ICH / FDA Basis" tone="accent" value={regCount} sub="Regulatory-referenced" />
      </div>

      <Card
        elevated
        title="Edit Check Rule Catalog"
        subtitle="All rules are deterministic and transparent — source logic in generateFindings() in ruleEngine.js"
        bodyPadding={false}
      >
        <DataTable
          columns={columns}
          data={RULE_LIBRARY}
          searchable={true}
          searchPlaceholder="Filter rules catalog..."
          rowKeyField="ruleId"
        />
      </Card>
    </div>
  );
}
