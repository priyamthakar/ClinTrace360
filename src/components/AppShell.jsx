import React from "react";
import { Database } from "lucide-react";
import { modules } from "../constants/modules.js";
import { ThemeToggle } from "./ThemeToggle.jsx";

export function AppShell({ activeModule, setActiveModule, children }) {
  const active = modules.find((m) => m.id === activeModule);
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">CT</div>
          <span>ClinTrace360</span>
        </div>
        <div className="topbar-status">
          <span className="dot" />
          <span>{active?.label ?? "—"}</span>
        </div>
        <div className="topbar-meta" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Synthetic CDISC · v0.1</span>
          <ThemeToggle />
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Module navigation">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <button key={m.id} className={`mobile-nav-item${activeModule === m.id ? " active" : ""}`} onClick={() => setActiveModule(m.id)}>
              <Icon size={14} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </nav>
      <aside className="sidebar">
        <div className="nav-section-label">Modules</div>
        <nav aria-label="Modules" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} className={`nav-item${activeModule === m.id ? " active" : ""}`} onClick={() => setActiveModule(m.id)}>
                <Icon size={15} />
                <span className="nav-item-label">{m.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-footer" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Database size={12} />
          <span>Synthetic data only</span>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
