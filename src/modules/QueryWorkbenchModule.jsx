import { useState, useMemo } from "react";
import { Download, RefreshCw, MessageSquareWarning, Search } from "lucide-react";
import { answerQuery, closeQuery, resetQueries } from "../engines/queryEngine.js";
import { downloadCsv } from "../utils/csv.js";
import { Kpi } from "../components/Kpi.jsx";
import { Badge } from "../components/Badge.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";

export function QueryWorkbenchModule({ queries, setQueries, findings, reconciliationQueries }) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleAnswer = (id) => {
    setQueries((prev) => answerQuery(prev, id));
  };

  const handleClose = (id) => {
    setQueries((prev) => closeQuery(prev, id));
  };

  const handleReset = () => {
    setQueries(resetQueries(findings, reconciliationQueries));
  };

  const filteredQueries = useMemo(() => {
    if (!searchTerm) return queries;
    const term = searchTerm.toLowerCase();
    return queries.filter(
      (q) =>
        q.queryId.toLowerCase().includes(term) ||
        q.USUBJID.toLowerCase().includes(term) ||
        q.description.toLowerCase().includes(term) ||
        q.mismatchType.toLowerCase().includes(term)
    );
  }, [queries, searchTerm]);

  const openQueries = useMemo(() => filteredQueries.filter((q) => q.status === "OPEN"), [filteredQueries]);
  const answeredQueries = useMemo(() => filteredQueries.filter((q) => q.status === "ANSWERED"), [filteredQueries]);
  const closedQueries = useMemo(() => filteredQueries.filter((q) => q.status === "CLOSED"), [filteredQueries]);

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 4 · Live" title="Query Workbench" sub="Simulate EDC query lifecycle management and site communications">
        <button className="btn" onClick={handleReset}>
          <RefreshCw size={14} />Reset Workbench
        </button>
        <button className="btn" onClick={() => downloadCsv("clintrace360_queries.csv", queries)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid cols4">
        <Kpi label="Total Queries" value={queries.length} sub="Overall logs" />
        <Kpi label="Open (Pending Site)" tone="warning" value={queries.filter((q) => q.status === "OPEN").length} sub="Awaiting site response" />
        <Kpi label="Answered (Pending Review)" tone="accent" value={queries.filter((q) => q.status === "ANSWERED").length} sub="Ready for CDM verification" />
        <Kpi label="Closed" tone="success" value={queries.filter((q) => q.status === "CLOSED").length} sub="Successfully reconciled" />
      </div>

      <div className="card elevated" style={{ padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={14} style={{ color: "var(--muted)" }} />
        <input
          type="text"
          placeholder="Filter queries by ID, subject, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--fg)",
            outline: "none",
            fontSize: "0.8rem",
            width: "100%",
          }}
        />
      </div>

      <div className="kanban-board">
        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Open Queries</span>
            <span className="kanban-column-count">{openQueries.length}</span>
          </div>
          <div className="kanban-cards">
            {openQueries.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}><MessageSquareWarning size={20} /><span>No open queries</span></div>
            ) : (
              openQueries.map((q) => (
                <div className="kanban-card" key={q.queryId}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="kanban-card-id">{q.queryId}</span>
                    <Badge tone={q.severity === "Critical" ? "critical" : "warning"}>{q.severity}</Badge>
                  </div>
                  <div className="kanban-card-title">{q.USUBJID} ({q.SITEID})</div>
                  <div className="kanban-card-text">{q.description}</div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn primary" style={{ width: "100%", fontSize: "0.74rem", padding: "4px 8px", minHeight: 0 }} onClick={() => handleAnswer(q.queryId)}>
                      Simulate Site Answer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Answered (Ready to Review)</span>
            <span className="kanban-column-count">{answeredQueries.length}</span>
          </div>
          <div className="kanban-cards">
            {answeredQueries.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}><MessageSquareWarning size={20} /><span>No queries to review</span></div>
            ) : (
              answeredQueries.map((q) => (
                <div className="kanban-card" key={q.queryId}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="kanban-card-id">{q.queryId}</span>
                    <Badge tone={q.severity === "Critical" ? "critical" : "warning"}>{q.severity}</Badge>
                  </div>
                  <div className="kanban-card-title">{q.USUBJID} ({q.SITEID})</div>
                  <div className="kanban-card-text">{q.description}</div>
                  <div className="kanban-card-response">
                    <strong>Site Response:</strong><br />
                    {q.siteResponse}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn success" style={{ width: "100%", fontSize: "0.74rem", padding: "4px 8px", minHeight: 0 }} onClick={() => handleClose(q.queryId)}>
                      Verify &amp; Close Query
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header">
            <span className="kanban-column-title">Closed Queries</span>
            <span className="kanban-column-count">{closedQueries.length}</span>
          </div>
          <div className="kanban-cards">
            {closedQueries.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}><MessageSquareWarning size={20} /><span>No closed queries</span></div>
            ) : (
              closedQueries.map((q) => (
                <div className="kanban-card" key={q.queryId} style={{ opacity: 0.8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="kanban-card-id">{q.queryId}</span>
                    <Badge tone="success">Closed</Badge>
                  </div>
                  <div className="kanban-card-title">{q.USUBJID} ({q.SITEID})</div>
                  <div className="kanban-card-text" style={{ textDecoration: "line-through" }}>{q.description}</div>
                  <div className="kanban-card-closed">
                    <strong>Review Closing Comment:</strong><br />
                    {q.reviewerComment}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
