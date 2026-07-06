import { useState, useRef } from "react";
import { Download, Map as MapIcon, Upload } from "lucide-react";
import { CRF_TEMPLATES } from "../constants/crfTemplates.js";
import { mapCrfField } from "../engines/sdtmMapper.js";
import { parseCrfInput, formatCrfFields } from "../utils/crfParser.js";
import { readStorage, saveHistoryItem } from "../utils/storage.js";
import { downloadCsv } from "../utils/csv.js";
import { Kpi } from "../components/Kpi.jsx";
import { Badge } from "../components/Badge.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";
import { DataTable } from "../components/DataTable.jsx";
import { parseCSV } from "../engines/csvParser.js";

export function CrfMapperModule() {
  const [selectedTemplate, setSelectedTemplate] = useState("demographics");
  const [inputText, setInputText] = useState(formatCrfFields(CRF_TEMPLATES.demographics.fields));
  const [mappings, setMappings] = useState(() => CRF_TEMPLATES.demographics.fields.map(mapCrfField));
  const [isMapping, setIsMapping] = useState(false);
  const [history, setHistory] = useState(() => readStorage("clintrace360:mappingHistory", []));
  const highConfidence = mappings.filter((r) => r.confidence === "High").length;
  const reviewNeeded = mappings.filter((r) => r.confidence !== "High").length;

  const fileInputRef = useRef(null);

  const handleImportCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = parseCSV(text);
        
        let startIndex = 0;
        const firstCol = rows[0]?.[0]?.toLowerCase() || "";
        if (firstCol.includes("label") || firstCol.includes("field") || firstCol.includes("name")) {
          startIndex = 1;
        }
        
        const fields = rows.slice(startIndex).map(row => {
          const label = row[0] || "";
          const type = row[1] || "";
          const codelist = row[2] || "";
          return [label, type, codelist].filter(Boolean).join(" | ");
        }).join("\n");
        
        setInputText(fields);
        setSelectedTemplate("custom");
      } catch (err) {
        alert("Failed to parse CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const loadTemplate = (key) => {
    setSelectedTemplate(key);
    const text = formatCrfFields(CRF_TEMPLATES[key].fields);
    setInputText(text);
    setMappings(CRF_TEMPLATES[key].fields.map(mapCrfField));
  };

  const runMapping = () => {
    setIsMapping(true);
    setTimeout(() => {
      setSelectedTemplate("custom");
      const next = parseCrfInput(inputText).map(mapCrfField);
      setMappings(next);
      setHistory(saveHistoryItem("clintrace360:mappingHistory", {
        id: `MAPH-${Date.now()}`,
        generatedAt: new Date().toLocaleString(),
        fieldCount: next.length,
        highConfidence: next.filter((r) => r.confidence === "High").length,
        inputText,
        mappings: next,
      }));
      setIsMapping(false);
    }, 420);
  };

  const restoreMapping = (item) => {
    setSelectedTemplate("custom");
    setInputText(item.inputText);
    setMappings(item.mappings);
  };

  const columns = [
    { key: "rowId", label: "Row", sortable: true, width: "60px", render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "crfField", label: "CRF Field", sortable: true },
    { key: "dataType", label: "Type", sortable: true },
    { key: "domain", label: "Domain", sortable: true, render: (val) => <Badge tone="neutral">{val}</Badge> },
    { key: "variable", label: "Variable", sortable: true, render: (val) => <span style={{ fontFamily: "var(--font-mono)" }}>{val}</span> },
    { key: "variableLabel", label: "Variable Label" },
    { key: "controlledTerminology", label: "Controlled Terminology" },
    { key: "notes", label: "Mapping Notes" },
    {
      key: "confidence",
      label: "Confidence",
      sortable: true,
      render: (val) => <Badge tone={val === "High" ? "success" : val === "Medium" ? "warning" : "critical"}>{val}</Badge>,
    },
    { key: "reference", label: "Reference" },
  ];

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 3 · Live" title="CRF → SDTM Mapper" sub="Deterministic rule-based field-level mapping to CDISC SDTM domains">
        <button className="btn" onClick={() => downloadCsv("clintrace360_sdtm_mapping.csv", mappings)}>
          <Download size={14} />Export CSV
        </button>
      </ModuleHead>

      <div className="kpi-grid cols3">
        <Kpi label="CRF Fields" value={mappings.length} sub="Current mapping set" />
        <Kpi label="High Confidence" tone="success" value={highConfidence} sub="Direct SDTM matches" />
        <Kpi label="Needs Review" tone={reviewNeeded ? "warning" : "success"} value={reviewNeeded} sub="Medium or low confidence" />
      </div>

      <div className="form-grid">
        <div className="card elevated">
          <div className="card-head">
            <div><h3>CRF Field Input</h3><p>One field per line — Label | Data Type | Codelist</p></div>
            <div className="card-head-actions">
              <select value={selectedTemplate} onChange={(e) => { if (e.target.value !== "custom") loadTemplate(e.target.value); }} aria-label="Template">
                {Object.entries(CRF_TEMPLATES).map(([key, tpl]) => (
                  <option value={key} key={key}>{tpl.label}</option>
                ))}
                <option value="custom">Custom input</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <textarea className="code-input" value={inputText} onChange={(e) => setInputText(e.target.value)} spellCheck="false" style={{ minHeight: 260 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                style={{ display: "none" }}
                onChange={handleImportCsv}
              />
              <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Upload size={14} />Import CSV Spec
              </button>
              <button className="btn primary" onClick={runMapping} disabled={isMapping} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapIcon size={14} />{isMapping ? "Mapping…" : "Map to SDTM"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Mapping Notes</h3><p>Confidence levels and review guidance</p></div></div>
          <div className="card-body">
            <div className="signal-list">
              <div className="signal-item"><div><strong>Confidence levels</strong><span>High = direct SDTM target found. Medium = plausible but context-dependent. Low = sponsor review required.</span></div></div>
              <div className="signal-item"><div><strong>Human review required</strong><span>Mappings are starting points and must be checked against the current CDISC SDTMIG and study-specific standards before use.</span></div></div>
            </div>
          </div>
        </div>
      </div>

      {history.length ? (
        <div className="card">
          <div className="card-head"><div><h3>Recent Sessions</h3><p>Saved locally in this browser</p></div></div>
          <div className="card-body">
            <div className="history-grid">
              {history.map((item) => (
                <button className="history-item" key={item.id} onClick={() => restoreMapping(item)}>
                  <strong>{item.fieldCount} fields</strong>
                  <span>{item.highConfidence} high-confidence</span>
                  <small>{item.generatedAt}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="card elevated">
        <div className="card-head" style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12 }}><div><h3>SDTM Mapping Results</h3><p>Domain, variable, terminology, notes, confidence, and SDTMIG reference</p></div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {isMapping ? (
            <div className="spinner-wrap"><div className="spinner" /><span>Mapping fields to SDTM…</span></div>
          ) : (
            <DataTable
              columns={columns}
              data={mappings}
              searchable={true}
              searchPlaceholder="Filter mapping results..."
              rowKeyField="rowId"
            />
          )}
        </div>
      </div>
    </div>
  );
}
