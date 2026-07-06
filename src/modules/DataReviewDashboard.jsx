import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Download, X, AlertCircle, Upload as UploadIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SITES, VISITS, ANALYTES } from "../constants/sites.js";
import {
  buildSiteSummary,
  buildVisitHeatmap,
  findingQueryText,
  buildSiteSignals,
} from "../engines/ruleEngine.js";
import { downloadCsv } from "../utils/csv.js";
import { Kpi } from "../components/Kpi.jsx";
import { Badge } from "../components/Badge.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { FileUpload } from "../components/FileUpload.jsx";

export function DataReviewDashboard({
  data,
  findings,
  dataTypeSource,
  setDataTypeSource,
  importedData,
  onImportData,
  onResetImport,
}) {
  const [tab, setTab] = useState("findings");
  const [analyte, setAnalyte] = useState("ALT");
  const [site, setSite] = useState("All sites");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [visitFilter, setVisitFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const siteSummary = useMemo(() => buildSiteSummary(findings), [findings]);
  const heatmap = useMemo(() => buildVisitHeatmap(data), [data]);
  const siteSignals = useMemo(() => buildSiteSignals(findings), [findings]);

  const expectedVisits = data.dm.length * VISITS.length;
  const missingVisits = findings.filter((f) => f.category === "MISSING").length;
  const criticalFindings = findings.filter((f) => f.severity === "Critical").length;

  const filteredLabRows = data.lb
    .filter((r) => r.LBTESTCD === analyte && (site === "All sites" || r.SITEID === site))
    .map((r) => ({ ...r, flagged: r.LBORRES < r.LBORNRLO || r.LBORRES > r.LBORNRHI }));

  const timingRows = findings.filter((f) => f.domain === "AE" && f.category === "TIMING");

  const visibleFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSite = site === "All sites" || f.SITEID === site;
      const matchSev = severityFilter === "All" || f.severity === severityFilter;
      const matchCat = categoryFilter === "All" || f.category === categoryFilter;
      const matchVisit = visitFilter === "All" || (f.description && f.description.toLowerCase().includes(visitFilter.toLowerCase()));
      return matchSite && matchSev && matchCat && matchVisit;
    });
  }, [findings, site, severityFilter, categoryFilter, visitFilter]);

  const clearFilters = () => {
    setSite("All sites");
    setSeverityFilter("All");
    setCategoryFilter("All");
    setVisitFilter("All");
  };

  const hasActiveFilters = site !== "All sites" || severityFilter !== "All" || categoryFilter !== "All" || visitFilter !== "All";

  const columns = [
    {
      key: "findingId",
      label: "ID",
      sortable: true,
      width: "80px",
      render: (val, row) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)" }}>
          {expandedId === row.findingId ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {val}
        </span>
      ),
    },
    { key: "category", label: "Category", sortable: true },
    { key: "USUBJID", label: "Subject", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "SITEID", label: "Site", sortable: true },
    { key: "domain", label: "Domain", sortable: true },
    { key: "variable", label: "Variable", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "description", label: "Description", sortable: true },
    {
      key: "severity",
      label: "Severity",
      sortable: true,
      render: (val) => <Badge tone={val === "Critical" ? "critical" : "warning"}>{val}</Badge>,
    },
    { key: "status", label: "Status", sortable: true },
  ];

  const handleRowClick = (row) => {
    setExpandedId((prev) => (prev === row.findingId ? null : row.findingId));
  };

  const renderExpandedRow = (row) => (
    <div className="detail-grid">
      <div className="detail-box">
        <h5>Evidence</h5>
        <p>{row.domain}.{row.variable} — {row.description}</p>
      </div>
      <div className="detail-box">
        <h5>Query Text</h5>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--muted)" }}>{findingQueryText(row)}</p>
      </div>
    </div>
  );

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 1 · Live" title="Data Review Dashboard" sub="Rule-based findings across DM, SV, LB, AE, EX domains — 40 subjects, 5 sites">
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn${showImport ? " active" : ""}`} onClick={() => setShowImport(p => !p)}>
            <UploadIcon size={14} />{showImport ? "Hide Import" : "Import CSV"}
          </button>
          <button className="btn" onClick={() => downloadCsv("clintrace360_findings.csv", visibleFindings)}>
            <Download size={14} />Export CSV
          </button>
        </div>
      </ModuleHead>

      {showImport && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3>Import Custom Domain Data</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.76rem", marginBottom: 12 }}>
            Upload a CSV file containing clinical trial records for a specific domain. The system will auto-detect the domain and run all automated data checks on your imported data.
          </p>
          <FileUpload onImport={(domain, rows) => { onImportData(domain, rows); setShowImport(false); }} />
        </div>
      )}

      {dataTypeSource === "imported" && (
        <div className="card" style={{ padding: 12, marginBottom: 16, border: "1px solid var(--warning)", background: "rgba(247,107,21,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={16} style={{ color: "var(--warning)" }} />
            <span style={{ fontSize: "0.78rem", color: "var(--fg)" }}>
              <strong>Custom Data Source Active:</strong> Running checks on imported domain data.
            </span>
          </div>
          <button className="btn" style={{ padding: "4px 10px", fontSize: "0.72rem", height: "auto", minHeight: 0 }} onClick={onResetImport}>
            Reset to Synthetic Data
          </button>
        </div>
      )}

      <div className="kpi-grid">
        <div style={{ cursor: "pointer" }} onClick={clearFilters}>
          <Kpi label="Total Subjects" value={data.dm.length} sub="Click to reset filters" />
        </div>
        <div style={{ cursor: "pointer" }} onClick={clearFilters}>
          <Kpi label="Expected Visits" value={expectedVisits} sub={`${data.sv.length} captured`} />
        </div>
        <div style={{ cursor: "pointer" }} onClick={() => { setCategoryFilter("MISSING"); setTab("findings"); }}>
          <Kpi label="Missing Visits" tone="warning" value={missingVisits} sub={`${Math.round((missingVisits / expectedVisits) * 100)}% gap rate`} />
        </div>
        <div style={{ cursor: "pointer" }} onClick={() => { clearFilters(); setTab("findings"); }}>
          <Kpi label="Open Queries" tone="accent" value={findings.length} sub="From rule checks" />
        </div>
        <div style={{ cursor: "pointer" }} onClick={() => { setSeverityFilter("Critical"); setTab("findings"); }}>
          <Kpi label="Critical Findings" tone="critical" value={criticalFindings} sub="Immediate review" />
        </div>
      </div>

      <div className="card elevated">
        <div className="card-head">
          <div>
            <h3>Findings &amp; Site Analysis</h3>
            <p>Finding log, site anomaly signals, and lab trajectory</p>
          </div>
          <div className="card-head-actions">
            {tab === "findings" && (
              <div style={{ display: "flex", gap: 8 }}>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} aria-label="Severity">
                  <option value="All">All Severities</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Category">
                  <option value="All">All Categories</option>
                  <option value="PROTOCOL">Protocol</option>
                  <option value="TIMING">Timing</option>
                  <option value="MISSING">Missing</option>
                  <option value="RANGE">Range</option>
                  <option value="CONSISTENCY">Consistency</option>
                </select>
              </div>
            )}
            {tab === "lab" && (
              <>
                <select value={analyte} onChange={(e) => setAnalyte(e.target.value)} aria-label="Analyte">
                  {Object.keys(ANALYTES).map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site">
                  <option value="All sites">All sites</option>
                  {SITES.map((s) => <option value={s} key={s}>{s}</option>)}
                </select>
              </>
            )}
          </div>
        </div>
        <div style={{ borderBottom: "1px solid var(--border)", padding: "0 18px" }}>
          <div className="tab-row" style={{ borderBottom: "none" }}>
            <button className={`tab${tab === "findings" ? " active" : ""}`} onClick={() => setTab("findings")}>Findings</button>
            <button className={`tab${tab === "sites" ? " active" : ""}`} onClick={() => setTab("sites")}>Site Signals</button>
            <button className={`tab${tab === "lab" ? " active" : ""}`} onClick={() => setTab("lab")}>Lab Trend</button>
          </div>
        </div>
        <div>
          {tab === "findings" && (
            <div>
              {hasActiveFilters && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "10px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600, marginRight: 4 }}>Active Filters:</span>
                  {site !== "All sites" && (
                    <Badge tone="accent">Site: {site} <X size={10} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSite("All sites")} /></Badge>
                  )}
                  {severityFilter !== "All" && (
                    <Badge tone="critical">Severity: {severityFilter} <X size={10} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setSeverityFilter("All")} /></Badge>
                  )}
                  {categoryFilter !== "All" && (
                    <Badge tone="warning">Category: {categoryFilter} <X size={10} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setCategoryFilter("All")} /></Badge>
                  )}
                  {visitFilter !== "All" && (
                    <Badge tone="info">Visit: {visitFilter} <X size={10} style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setVisitFilter("All")} /></Badge>
                  )}
                  <button className="btn ghost" style={{ padding: "2px 6px", fontSize: "0.7rem", height: "auto", minHeight: 0, marginLeft: "auto" }} onClick={clearFilters}>
                    Clear All
                  </button>
                </div>
              )}
              <DataTable
                columns={columns}
                data={visibleFindings}
                searchable={true}
                searchPlaceholder="Filter findings by text..."
                rowKeyField="findingId"
                onRowClick={handleRowClick}
                renderExpandedRow={renderExpandedRow}
                expandedRowId={expandedId}
              />
            </div>
          )}
          {tab === "sites" && (
            <div style={{ padding: "18px" }}>
              <div className="two-col">
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
                    Finding Distribution by Site <AlertCircle size={12} title="Click bars to filter findings" style={{ cursor: "help", color: "var(--muted-2)" }} />
                  </div>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={siteSummary}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="site" tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Missing" stackId="a" fill="#F76B15" onClick={(data) => { if (data) { setSite(data.site); setCategoryFilter("MISSING"); setTab("findings"); } }} style={{ cursor: "pointer" }} />
                        <Bar dataKey="Range" stackId="a" fill="#E5484D" onClick={(data) => { if (data) { setSite(data.site); setCategoryFilter("RANGE"); setTab("findings"); } }} style={{ cursor: "pointer" }} />
                        <Bar dataKey="Timing" stackId="a" fill="#8B5CF6" onClick={(data) => { if (data) { setSite(data.site); setCategoryFilter("TIMING"); setTab("findings"); } }} style={{ cursor: "pointer" }} />
                        <Bar dataKey="Protocol" stackId="a" fill="#0EA5E9" onClick={(data) => { if (data) { setSite(data.site); setCategoryFilter("PROTOCOL"); setTab("findings"); } }} style={{ cursor: "pointer" }} />
                        <Bar dataKey="Consistency" stackId="a" fill="#30A46C" radius={[3, 3, 0, 0]} onClick={(data) => { if (data) { setSite(data.site); setCategoryFilter("CONSISTENCY"); setTab("findings"); } }} style={{ cursor: "pointer" }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Anomaly Load (Click to Filter)</div>
                  <div className="mini-list" style={{ marginBottom: 24 }}>
                    {siteSignals.map((s) => (
                      <div className="mini-item" key={s.site} style={{ cursor: "pointer" }} onClick={() => { setSite(s.site); setTab("findings"); }}>
                        <span className="site-id">{s.site}</span>
                        <div className="bar-track"><div className={`bar-fill ${s.tone}`} style={{ width: `${s.pct}%` }} /></div>
                        <span className="pct">{s.count}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Visit Compliance (Click Cells to Investigate)</div>
                  <div className="heatmap">
                    <div className="heatmap-row header">
                      <span>Site</span>
                      {VISITS.map((v) => <span key={v.num}>{v.name}</span>)}
                    </div>
                    {heatmap.map((siteRow) => (
                      <div className="heatmap-row" key={siteRow.site}>
                        <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--fg)" }}>{siteRow.site}</strong>
                        {siteRow.visits.map((v) => (
                          <span
                            className={`heat-cell ${v.pct >= 90 ? "good" : v.pct >= 70 ? "medium" : "bad"}`}
                            key={v.visit}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              setSite(siteRow.site);
                              setVisitFilter(v.visit);
                              setCategoryFilter("MISSING");
                              setTab("findings");
                            }}
                          >
                            {v.pct}%
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === "lab" && (
            <div style={{ padding: "18px" }}>
              <div className="two-col">
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{analyte} — {ANALYTES[analyte].name}</div>
                  <div className="chart-wrap tall">
                    <ResponsiveContainer width="100%" height={280}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="VISITNUM" name="Visit" type="number" domain={[1, 7]} ticks={VISITS.map((v) => v.num)} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="LBORRES" name={analyte} unit={` ${ANALYTES[analyte].unit}`} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v) => [`${v} ${ANALYTES[analyte].unit}`, analyte]} labelFormatter={(v) => `Visit ${v}`} contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-strong)", borderRadius: 6, fontFamily: "var(--font-mono)", fontSize: 12 }} />
                        <ReferenceArea y1={ANALYTES[analyte].low} y2={ANALYTES[analyte].high} fill="#30A46C" fillOpacity={0.1} />
                        <Scatter data={filteredLabRows} name={analyte}>
                          {filteredLabRows.map((r) => (
                            <Cell key={`${r.USUBJID}-${r.VISITNUM}-${r.LBTESTCD}`} fill={r.flagged ? "#E5484D" : r.SITEID === "SITE-103" ? "#0EA5E9" : "#5E6AD2"} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 10, fontSize: "0.72rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>AE Timing Issues</div>
                  <div className="table-wrap max-h-400">
                    <table>
                      <thead><tr><th>Subject</th><th>Issue</th><th>Sev.</th></tr></thead>
                      <tbody>
                        {timingRows.map((r) => (
                          <tr key={r.findingId} style={{ cursor: "pointer" }} onClick={() => { setSite(r.SITEID); setCategoryFilter("TIMING"); setTab("findings"); }}>
                            <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>{r.USUBJID}</td>
                            <td>{r.description}</td>
                            <td><Badge tone="warning">{r.severity}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
