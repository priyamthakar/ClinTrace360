import { useState } from "react";
import { ClipboardCheck, Download, FileText, Printer } from "lucide-react";
import { SAMPLE_PROTOCOL_TEXT } from "../constants/sampleProtocol.js";
import { extractProtocolSignals, generateDqpPackage, formatDqpForExport } from "../engines/dqpGenerator.js";
import { readStorage, saveHistoryItem } from "../utils/storage.js";
import { Kpi } from "../components/Kpi.jsx";
import { ModuleHead } from "../components/ModuleHead.jsx";
import { DqpSections, EditCheckTable, UatTable, RiskChecklistTable, DatabaseLockChecklist } from "./DqpSubComponents.jsx";
import { CHECKLIST_TEMPLATES } from "../constants/checklistTemplates.js";

export function ProtocolDqpModule() {
  const [protocolText, setProtocolText] = useState(SAMPLE_PROTOCOL_TEXT);
  const [nctId, setNctId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fetchMessage, setFetchMessage] = useState("");
  const [activeOutput, setActiveOutput] = useState("dqp");
  const [signals, setSignals] = useState(() => extractProtocolSignals(SAMPLE_PROTOCOL_TEXT));
  const [dqp, setDqp] = useState(() => generateDqpPackage(extractProtocolSignals(SAMPLE_PROTOCOL_TEXT)));
  const [history, setHistory] = useState(() => readStorage("clintrace360:dqpHistory", []));
  const [lockChecklist, setLockChecklist] = useState(CHECKLIST_TEMPLATES);

  const generate = (text = protocolText, nctRecord) => {
    setIsGenerating(true);
    setTimeout(() => {
      const nextSignals = extractProtocolSignals(text, nctRecord);
      const nextDqp = generateDqpPackage(nextSignals);
      setSignals(nextSignals);
      setDqp(nextDqp);
      setLockChecklist(CHECKLIST_TEMPLATES.map(item => ({ ...item, checked: false })));
      setHistory(saveHistoryItem("clintrace360:dqpHistory", {
        id: `DQPH-${Date.now()}`,
        generatedAt: new Date().toLocaleString(),
        title: nextSignals.title,
        phase: nextSignals.phase,
        sourceText: text,
        signals: nextSignals,
        dqp: nextDqp,
      }));
      setIsGenerating(false);
    }, 520);
  };

  const restoreDqp = (item) => {
    setProtocolText(item.sourceText);
    setSignals(item.signals);
    setDqp(item.dqp);
    setActiveOutput("dqp");
    setFetchMessage(`Restored local DQP history item from ${item.generatedAt}.`);
  };

  const [showRetry, setShowRetry] = useState(false);

  const fetchNct = async () => {
    const cleanId = nctId.trim().toUpperCase();
    if (!/^NCT\d{8}$/.test(cleanId)) {
      setFetchMessage("Enter an NCT ID in the format NCT12345678.");
      setShowRetry(false);
      return;
    }
    setIsFetching(true);
    setFetchMessage("Connecting to ClinicalTrials.gov...");
    setShowRetry(false);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10000);

    try {
      const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${cleanId}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Registry record not found (404).");
        } else if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment.");
        } else {
          throw new Error(`Server returned error status ${response.status}.`);
        }
      }
      const study = await response.json();
      const protocol = study.protocolSection ?? {};
      const id = protocol.identificationModule ?? {};
      const design = protocol.designModule ?? {};
      const outcomes = protocol.outcomesModule ?? {};
      const eligibility = protocol.eligibilityModule ?? {};
      const arms = protocol.armsInterventionsModule ?? {};
      const nctRecord = {
        nctId: cleanId,
        title: id.briefTitle || id.officialTitle || cleanId,
        phase: design.phases?.join(", ") || "Phase not specified",
        design: [design.studyType, design.designInfo?.allocation, design.designInfo?.interventionModel, design.designInfo?.maskingInfo?.masking].filter(Boolean).join(" / "),
      };
      const fetchedText = [
        nctRecord.title,
        `Phase: ${nctRecord.phase}`,
        `Design: ${nctRecord.design}`,
        ...(outcomes.primaryOutcomes ?? []).map((row) => `Primary endpoint: ${row.measure ?? ""} ${row.timeFrame ?? ""}`),
        ...(outcomes.secondaryOutcomes ?? []).map((row) => `Secondary endpoint: ${row.measure ?? ""} ${row.timeFrame ?? ""}`),
        `Eligibility: ${eligibility.eligibilityCriteria ?? ""}`,
        ...(arms.armGroups ?? []).map((row) => `Arm: ${row.label ?? ""} ${row.description ?? ""}`),
      ].join("\n");
      setProtocolText(fetchedText);
      generate(fetchedText, nctRecord);
      setFetchMessage(`Loaded public metadata for ${cleanId}. Review generated outputs before use.`);
    } catch (error) {
      clearTimeout(timeoutId);
      let errMsg = error.message;
      if (error.name === "AbortError") {
        errMsg = "Request timed out after 10 seconds.";
      } else if (errMsg.includes("Failed to fetch")) {
        errMsg = "Network error or CORS restriction.";
      }
      setFetchMessage(`Lookup failed: ${errMsg}`);
      setShowRetry(true);
    } finally {
      setIsFetching(false);
    }
  };

  const exportText = () => {
    const blob = new Blob([formatDqpForExport(signals, dqp)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clintrace360_dqp_skeleton.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyText = async () => {
    const text = formatDqpForExport(signals, dqp);
    try {
      await navigator.clipboard.writeText(text);
      setFetchMessage("DQP package copied to clipboard.");
    } catch {
      exportText();
      setFetchMessage("Clipboard access was blocked, so the DQP package was exported as a text file instead.");
    }
  };

  return (
    <div className="workspace">
      <ModuleHead eyebrow="Phase 3 · Live" title="Protocol → DQP Generator" sub="Deterministic signal extraction from protocol synopsis to CDM deliverables">
        <button className="btn" onClick={() => window.print()}><Printer size={14} />Export PDF</button>
        <button className="btn" onClick={copyText}><ClipboardCheck size={14} />Copy Package</button>
        <button className="btn" onClick={exportText}><Download size={14} />Export TXT</button>
      </ModuleHead>

      <div className="kpi-grid cols4">
        <Kpi label="Phase" value={signals.phase.replace("Phase ", "")} sub={signals.design.slice(0, 48) || "—"} />
        <Kpi label="Visits" tone="accent" value={signals.visits.length} sub={signals.visits.slice(0, 3).join(", ")} />
        <Kpi label="Priority Labs" tone="warning" value={signals.labs.length} sub={signals.labs.join(", ")} />
        <Kpi label="Edit Checks" tone="accent" value={dqp.editChecks.length} sub="Generated checks" />
      </div>

      <div className="form-grid">
        <div className="card elevated">
          <div className="card-head">
            <div><h3>Protocol Input</h3><p>Paste a synopsis or load public ClinicalTrials.gov metadata</p></div>
            <div className="card-head-actions">
              <input type="text" value={nctId} onChange={(e) => setNctId(e.target.value)} placeholder="NCT12345678" aria-label="NCT ID" style={{ width: 140 }} />
              <button className="btn" onClick={fetchNct} disabled={isFetching}>
                <Download size={14} />{isFetching ? "Loading…" : "Load NCT"}
              </button>
            </div>
          </div>
          <div className="card-body">
            <textarea className="code-input" value={protocolText} onChange={(e) => setProtocolText(e.target.value)} spellCheck="false" style={{ minHeight: 320 }} />
            <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
              <button className="btn primary" onClick={() => generate()} disabled={isGenerating}>
                <FileText size={14} />{isGenerating ? "Generating…" : "Generate DQP"}
              </button>
            </div>
            {fetchMessage && (
              <div className="inline-msg" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span>{fetchMessage}</span>
                {showRetry && (
                  <button className="btn primary" style={{ padding: "4px 10px", fontSize: "0.72rem", height: "auto", minHeight: 0 }} onClick={fetchNct}>
                    Retry Lookup
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div><h3>Extracted Signals</h3><p>Transparent heuristic extraction</p></div></div>
          <div className="card-body">
            <div className="signal-list">
              <div className="signal-item"><div><strong>Study</strong><span>{signals.title}</span></div></div>
              <div className="signal-item"><div><strong>Endpoints</strong><span>{signals.endpoints.slice(0, 2).join(" ")}</span></div></div>
              <div className="signal-item"><div><strong>Eligibility</strong><span>{signals.eligibility.slice(0, 2).join(" ")}</span></div></div>
              <div className="signal-item"><div><strong>Safety</strong><span>{signals.safety.join(", ")}</span></div></div>
              <div className="signal-item"><div><strong>Dosing</strong><span>{signals.dosing}</span></div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="card elevated">
        <div className="card-head">
          <div><h3>Generated DQP Package</h3><p>Skeleton for human CDM review — not validated for production use</p></div>
          <div className="card-head-actions">
            <div className="tab-row" style={{ borderBottom: "none", gap: 2 }}>
              <button className={`tab${activeOutput === "dqp" ? " active" : ""}`} onClick={() => setActiveOutput("dqp")}>DQP</button>
              <button className={`tab${activeOutput === "checks" ? " active" : ""}`} onClick={() => setActiveOutput("checks")}>Edit Checks</button>
              <button className={`tab${activeOutput === "uat" ? " active" : ""}`} onClick={() => setActiveOutput("uat")}>UAT</button>
              <button className={`tab${activeOutput === "lock" ? " active" : ""}`} onClick={() => setActiveOutput("lock")}>Database Lock Checklist</button>
              <button className={`tab${activeOutput === "risk" ? " active" : ""}`} onClick={() => setActiveOutput("risk")}>Risk Review</button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {isGenerating ? (
            <div className="spinner-wrap"><div className="spinner" /><span>Generating DQP package…</span></div>
          ) : (
            <>
              {activeOutput === "dqp" && <DqpSections rows={dqp.dqpSections} />}
              {activeOutput === "checks" && <EditCheckTable rows={dqp.editChecks} />}
              {activeOutput === "uat" && <UatTable rows={dqp.uatCases} />}
              {activeOutput === "lock" && <DatabaseLockChecklist checklist={lockChecklist} setChecklist={setLockChecklist} />}
              {activeOutput === "risk" && <RiskChecklistTable rows={dqp.reviewChecklist} />}
            </>
          )}
        </div>
      </div>

      {history.length ? (
        <div className="card">
          <div className="card-head"><div><h3>Recent Sessions</h3><p>Saved locally in this browser</p></div></div>
          <div className="card-body">
            <div className="history-grid">
              {history.map((item) => (
                <button className="history-item" key={item.id} onClick={() => restoreDqp(item)}>
                  <strong>{item.title}</strong><span>{item.phase}</span><small>{item.generatedAt}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
