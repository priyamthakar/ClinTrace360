import React from "react";
import { FolderOpen } from "lucide-react";

export function EmptyState({
  icon: Icon = FolderOpen,
  title = "No data available",
  description = "There are no records matching your active filters or selection.",
  action = null,
}) {
  return (
    <div className="empty-state">
      <Icon size={32} style={{ strokeWidth: 1.5, marginBottom: 8 }} />
      <h4 style={{ margin: 0, fontWeight: 600, color: "var(--fg)" }}>{title}</h4>
      <p style={{ margin: 0, color: "var(--muted)", maxWidth: 360, fontSize: "0.78rem" }}>{description}</p>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}
export default EmptyState;
