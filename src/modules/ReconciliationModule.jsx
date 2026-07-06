import { useState } from "react";
import { Download, GitCompareArrows, ClipboardList } from "lucide-react";
import { downloadCsv } from "../utils/csv.js";
import { Kpi } from "../components/Kpi.jsx";
import { Badge } from "../components/Badge.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";
import { DataTable } from "../components/DataTable.jsx";

export function ReconciliationModule({ reconciliation }) {
  const [activeTab, setActiveTab] = useState("sae");
  const [selectedId, setSelectedId] = useState(null);
  const { saeFindings, labFindings, queries } = reconciliation;
  const criticalQueries = queries.filter((r) => r.severity === "Critical").length;

  const queueRows = activeTab === "sae" ? saeFindings : activeTab === "lab" ? labFindings : [];
  const exportRows = activeTab === "sae" ? saeFindings : activeTab === "lab" ? labFindings : queries;
  const selectedRow = queueRows.find((r) => (r.findingId ?? r.queryId ?? r.rowId) === selectedId);

  const handleRowClick = (row) => {
    const id = row.findingId ?? row.queryId ?? row.rowId;
    setSelectedId((p) => (p === id ? null : id));
  };

  const auditEntries = queries.map((q) => ({
    ts: q.generatedAt,
    msg: `${q.mismatchType} raised for ${q.USUBJID} — ${q.description}`
  }));

  const saeColumns = [
    { key: "USUBJID", label: "Subject", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "mismatchType", label: "Mismatch Type", sortable: true },
    { key: "SAETERM", label: "AE Term", sortable: true },
    { key: "SAESTDTC", label: "Date", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      render: (val) => <Badge tone={val === "Critical" ? "critical" : "warning"}>{val}</Badge>,
    },
  ];

  const labColumns = [
    { key: "USUBJID", label: "Subject", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "mismatchType", label: "Mismatch Type", sortable: true },
    { key: "LBTESTCD", label: "Lab Test", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "LBDT", label: "Date", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      render: (val) => <Badge tone={val === "Critical" ? "critical" : "warning"}>{val}</Badge>,
    },
  ];

  const auditColumns = [
    { key: "ts", label: "Timestamp", sortable: true, width: "180px", render: (val) => <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted-2)", fontSize: "0.75rem" }}>{val}</span> },
    { key: "msg", label: "Audit Event Description", sortable: true },
  ];

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 2 · Live" title="SAE / Lab Reconciliation" sub="Synthetic safety database and local lab feed matched against EDC domains">
        <button className="btn" onClick={() => downloadCsv(`clintrace360_${activeTab}_recon.csv`, exportRows)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid cols4">
        <Kpi label="SAE Findings" tone="critical" value={saeFindings.length} sub="EDC AE vs safety DB" />
        <Kpi label="Lab Findings" tone="warning" value={labFindings.length} sub="EDC LB vs local labs" />
        <Kpi label="Open Queries" tone="accent" value={queries.length} sub="Timestamped, traceable" />
        <Kpi label="Critical Queries" tone="critical" value={criticalQueries} sub="Regulatory / safety priority" />
      </div>

      <div className="recon-layout">
        <div className="card elevated" style={{ overflow: "hidden" }}>
          <div className="card-head" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
            <div>
              <h3>Reconciliation Queue</h3>
              <p>Select a row to inspect details and query text</p>
            </div>
            <div className="card-head-actions">
              <div className="tab-row" style={{ borderBottom: "none", gap: 2 }}>
                <button className={`tab${activeTab === "sae" ? " active" : ""}`} onClick={() => { setActiveTab("sae"); setSelectedId(null); }}>SAE ({saeFindings.length})</button>
                <button className={`tab${activeTab === "lab" ? " active" : ""}`} onClick={() => { setActiveTab("lab"); setSelectedId(null); }}>Local Lab ({labFindings.length})</button>
                <button className={`tab${activeTab === "audit" ? " active" : ""}`} onClick={() => { setActiveTab("audit"); setSelectedId(null); }}>Audit Log</button>
              </div>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {activeTab === "sae" && (
              <DataTable
                columns={saeColumns}
                data={saeFindings}
                searchable={true}
                searchPlaceholder="Filter SAE mismatches..."
                rowKeyField="findingId"
                onRowClick={handleRowClick}
              />
            )}
            {activeTab === "lab" && (
              <DataTable
                columns={labColumns}
                data={labFindings}
                searchable={true}
                searchPlaceholder="Filter Lab mismatches..."
                rowKeyField="findingId"
                onRowClick={handleRowClick}
              />
            )}
            {activeTab === "audit" && (
              <DataTable
                columns={auditColumns}
                data={auditEntries}
                searchable={true}
                searchPlaceholder="Filter audit trail..."
                rowKeyField="ts"
              />
            )}
          </div>
        </div>

        <div className="card elevated" style={{ position: "sticky", top: "calc(var(--topbar-h) + 24px)", alignSelf: "start" }}>
          <div className="card-head"><div><h3>Mismatch Detail</h3><p>Investigation and Query Panel</p></div></div>
          <div className="card-body">
            {!selectedRow ? (
              <div className="empty-state">
                <GitCompareArrows size={24} />
                <span>Select a queue item to investigate</span>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <div className="detail-box"><h5>Subject ID</h5><p style={{ fontFamily: "var(--font-mono)" }}>{selectedRow.USUBJID}</p></div>
                <div className="detail-box"><h5>Mismatch Category</h5><p>{selectedRow.mismatchType}</p></div>
                <div className="detail-box"><h5>Severity Level</h5><p><Badge tone={selectedRow.severity === "Critical" ? "critical" : "warning"}>{selectedRow.severity}</Badge></p></div>
                {selectedRow.edcValue !== undefined && <div className="detail-box"><h5>EDC System Value</h5><p>{selectedRow.edcValue}</p></div>}
                {selectedRow.safetyValue !== undefined && <div className="detail-box"><h5>Safety DB Value</h5><p>{selectedRow.safetyValue}</p></div>}
                {selectedRow.localValue !== undefined && <div className="detail-box"><h5>Local Lab Source Value</h5><p>{selectedRow.localValue}</p></div>}
                <div className="detail-box">
                  <h5>Programmed Query Draft</h5>
                  <div className="code-block" style={{ fontSize: "0.74rem" }}>
                    {queries.find((q) => q.queryId === selectedRow.queryId)?.queryText ?? "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
