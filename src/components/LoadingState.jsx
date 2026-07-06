import React from "react";

export function LoadingState({ type = "table", rows = 5 }) {
  if (type === "kpis") {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="kpi skeleton-item" key={i} style={{ height: 90, minWidth: 150 }} />
        ))}
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="card skeleton-item" style={{ height: 200, width: "100%", margin: "16px 0" }} />
    );
  }

  // Default: table row skeletons
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16 }}>
      <div className="skeleton-item" style={{ height: 32, width: "30%", marginBottom: 8 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          className="skeleton-item"
          key={i}
          style={{
            height: 24,
            width: "100%",
            opacity: 1 - i * 0.12, // fade out effect
          }}
        />
      ))}
    </div>
  );
}
export default LoadingState;
