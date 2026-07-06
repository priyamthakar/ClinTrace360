import { useState, useMemo, useEffect } from "react";
import { AppShell } from "./components/AppShell.jsx";
import { DataReviewDashboard } from "./modules/DataReviewDashboard.jsx";
import { ReconciliationModule } from "./modules/ReconciliationModule.jsx";
import { ProtocolDqpModule } from "./modules/ProtocolDqpModule.jsx";
import { CrfMapperModule } from "./modules/CrfMapperModule.jsx";
import { RuleLibrary } from "./modules/RuleLibrary.jsx";
import { QueryWorkbenchModule } from "./modules/QueryWorkbenchModule.jsx";

// Import query engine
import { initializeQueries } from "./engines/queryEngine.js";

// Import storage utilities for persistence
import { readStorage, writeStorage } from "./utils/storage.js";

// Import named exports for backward compatibility and test coverage
import { CRF_TEMPLATES } from "./constants/crfTemplates.js";
import { RULE_LIBRARY } from "./constants/ruleLibrary.js";
import { SAMPLE_PROTOCOL_TEXT } from "./constants/sampleProtocol.js";
import {
  extractProtocolSignals,
  generateDqpPackage,
} from "./engines/dqpGenerator.js";
import {
  formatCrfFields,
  parseCrfInput,
} from "./utils/crfParser.js";
import { generateFindings } from "./engines/ruleEngine.js";
import { generateReconciliation } from "./engines/reconciliation.js";
import { generateSyntheticTrialData } from "./engines/dataGenerator.js";
import { mapCrfField } from "./engines/sdtmMapper.js";

export {
  CRF_TEMPLATES,
  RULE_LIBRARY,
  SAMPLE_PROTOCOL_TEXT,
  extractProtocolSignals,
  formatCrfFields,
  generateDqpPackage,
  generateFindings,
  generateReconciliation,
  generateSyntheticTrialData,
  mapCrfField,
  parseCrfInput,
};

export default function ClinTrace360() {
  const [activeModule, setActiveModuleState] = useState(() => readStorage("ct360_activeModule", "review"));
  const data = useMemo(() => generateSyntheticTrialData(), []);
  
  // Custom data import states
  const [dataTypeSource, setDataTypeSource] = useState("synthetic");
  const [importedData, setImportedData] = useState({
    dm: [], sv: [], lb: [], ae: [], ex: [], safety: [], localLabs: []
  });

  const activeData = useMemo(() => {
    if (dataTypeSource === "synthetic") return data;
    return {
      dm: importedData.dm.length ? importedData.dm : data.dm,
      sv: importedData.sv.length ? importedData.sv : data.sv,
      lb: importedData.lb.length ? importedData.lb : data.lb,
      ae: importedData.ae.length ? importedData.ae : data.ae,
      ex: importedData.ex.length ? importedData.ex : data.ex,
      safety: importedData.safety.length ? importedData.safety : data.safety,
      localLabs: importedData.localLabs.length ? importedData.localLabs : data.localLabs,
    };
  }, [dataTypeSource, data, importedData]);

  const findings = useMemo(() => generateFindings(activeData), [activeData]);
  const reconciliation = useMemo(() => generateReconciliation(activeData), [activeData]);

  // Query workbench state
  const [queries, setQueries] = useState(() => initializeQueries(findings, reconciliation.queries));

  // Sync queries state when findings update due to data source toggle or import
  useEffect(() => {
    setQueries(initializeQueries(findings, reconciliation.queries));
  }, [findings, reconciliation.queries]);

  const handleImportData = (domain, rows) => {
    setImportedData((prev) => ({
      ...prev,
      [domain]: rows
    }));
    setDataTypeSource("imported");
  };

  const handleResetImport = () => {
    setImportedData({
      dm: [], sv: [], lb: [], ae: [], ex: [], safety: [], localLabs: []
    });
    setDataTypeSource("synthetic");
  };

  const setActiveModule = (module) => {
    setActiveModuleState(module);
    writeStorage("ct360_activeModule", module);
  };

  return (
    <AppShell activeModule={activeModule} setActiveModule={setActiveModule}>
      {activeModule === "review" && (
        <DataReviewDashboard
          data={activeData}
          findings={findings}
          dataTypeSource={dataTypeSource}
          setDataTypeSource={setDataTypeSource}
          importedData={importedData}
          onImportData={handleImportData}
          onResetImport={handleResetImport}
        />
      )}
      {activeModule === "recon" && <ReconciliationModule reconciliation={reconciliation} />}
      {activeModule === "queries" && (
        <QueryWorkbenchModule
          queries={queries}
          setQueries={setQueries}
          findings={findings}
          reconciliationQueries={reconciliation.queries}
        />
      )}
      {activeModule === "dqp" && <ProtocolDqpModule />}
      {activeModule === "mapper" && <CrfMapperModule />}
      {activeModule === "rules" && <RuleLibrary />}
    </AppShell>
  );
}
