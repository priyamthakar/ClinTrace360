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

export function DatabaseLockChecklist({ checklist, setChecklist }) {
  const categories = [...new Set(checklist.map(item => item.category))];

  const toggleTask = (id) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const total = checklist.length;
  const completed = checklist.filter(item => item.checked).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const nextActions = checklist.filter(item => !item.checked);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
      {/* Left side: Checklist Grouped by Category */}
      <div style={{ display: "grid", gap: 15 }}>
        {/* Progress Section */}
        <div className="section-block" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0 }}>Database Lock Readiness</h4>
            <span style={{ fontWeight: "600", fontSize: "1.1rem", color: percent === 100 ? "var(--success)" : "var(--accent)" }}>
              Readiness: {percent}%
            </span>
          </div>
          <div style={{ width: "100%", height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ width: `${percent}%`, height: "100%", background: percent === 100 ? "var(--success)" : "var(--accent)", transition: "width 0.3s ease" }} />
          </div>
          <div style={{ marginTop: 8, fontSize: "0.85rem", color: "var(--muted)" }}>
            {completed} of {total} criteria met. {percent === 100 ? "Database is ready for lock." : "Resolve pending criteria before locking database."}
          </div>
        </div>

        {/* Categories and checklist items */}
        {categories.map(category => (
          <div className="section-block" key={category}>
            <div className="section-block-head" style={{ padding: "10px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{category}</h4>
            </div>
            <div className="section-block-body" style={{ padding: "10px 16px", display: "grid", gap: 12 }}>
              {checklist
                .filter(item => item.category === category)
                .map(item => (
                  <label key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleTask(item.id)}
                      style={{ marginTop: 3 }}
                    />
                    <div>
                      <div style={{ fontWeight: "500", textDecoration: item.checked ? "line-through" : "none", color: item.checked ? "var(--muted)" : "var(--fg)" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
                        {item.description}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right side: Next Actions / Remaining Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div className="section-block" style={{ height: "100%" }}>
          <div className="section-block-head">
            <h4 style={{ margin: 0 }}>Next Actions</h4>
          </div>
          <div className="section-block-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {nextActions.length > 0 ? (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Please address the following remaining tasks:</p>
                {nextActions.map(item => (
                  <div key={item.id} style={{ borderLeft: "3px solid var(--warning)", paddingLeft: 8, paddingY: 4 }}>
                    <div style={{ fontWeight: "500", fontSize: "0.88rem" }}>{item.label}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{item.category}</div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--success)" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>✓</div>
                <div style={{ fontWeight: "600" }}>All Criteria Completed!</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}>Database lock process can proceed.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
