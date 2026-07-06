import React, { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { parseCSV, detectDomain, convertRowsToObjects } from "../engines/csvParser.js";

const DOMAIN_LABELS = {
  dm: "Demographics (DM)",
  sv: "Subject Visits (SV)",
  lb: "Laboratory Results (LB)",
  ae: "Adverse Events (AE)",
  ex: "Exposure (EX)",
  safety: "Safety Database SAEs (safety)",
  localLabs: "Local Lab Results (localLabs)",
};

export function FileUpload({ onImport }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    if (!file) return;
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please select a valid CSV file.");
      setFileDetails(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const allRows = parseCSV(text);
        if (allRows.length < 2) {
          throw new Error("CSV file must contain a header row and at least one data row.");
        }

        const headers = allRows[0];
        const dataRows = allRows.slice(1);
        const domain = detectDomain(headers);
        const parsedData = convertRowsToObjects(headers, dataRows);

        setFileDetails({
          fileName: file.name,
          domain: domain || "unknown",
          headers,
          rowCount: parsedData.length,
          data: parsedData,
        });
        setError("");
      } catch (err) {
        setError(err.message || "Failed to parse CSV file.");
        setFileDetails(null);
      }
    };
    reader.onerror = () => {
      setError("Error reading file.");
      setFileDetails(null);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleImportSubmit = () => {
    if (!fileDetails || fileDetails.domain === "unknown") return;
    onImport(fileDetails.domain, fileDetails.data);
    setFileDetails(null);
  };

  const handleDomainChange = (e) => {
    setFileDetails((prev) => ({
      ...prev,
      domain: e.target.value,
    }));
  };

  return (
    <div className="file-upload-workbench" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        className={`file-drop-zone ${dragActive ? "active" : ""}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed var(--border-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "30px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragActive ? "var(--accent-dim)" : "var(--surface-2)",
          transition: "background-color 0.2s, border-color 0.2s",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleChange}
          style={{ display: "none" }}
        />
        <Upload size={24} style={{ color: "var(--muted)", marginBottom: 8 }} />
        <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--fg)" }}>
          Drag &amp; drop your domain CSV file here
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: 4 }}>
          or click to browse your local files
        </div>
      </div>

      {error && (
        <div className="inline-msg error" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--critical)", borderColor: "var(--critical)" }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {fileDetails && (
        <div className="card" style={{ padding: 12, background: "var(--surface-3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <FileText size={16} style={{ color: "var(--accent)" }} />
            <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "var(--fg)" }}>{fileDetails.fileName}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: "0.76rem", color: "var(--muted)" }}>
            <div>Rows Parsed: <strong>{fileDetails.rowCount}</strong></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Detected Domain:</span>
              <select
                value={fileDetails.domain}
                onChange={handleDomainChange}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--fg)",
                  padding: "2px 6px",
                  fontSize: "0.72rem",
                  borderRadius: "var(--radius)",
                }}
              >
                <option value="unknown">Select domain category...</option>
                {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--muted-2)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Columns: {fileDetails.headers.join(", ")}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn primary"
              disabled={fileDetails.domain === "unknown"}
              onClick={handleImportSubmit}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <CheckCircle2 size={14} />
              Import to Workbench
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default FileUpload;
