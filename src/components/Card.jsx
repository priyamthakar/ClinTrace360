import React from "react";

export function Card({ title, subtitle, action, children, elevated, bodyPadding = true }) {
  return (
    <div className={`card${elevated ? " elevated" : ""}`}>
      {(title || action) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action && <div className="card-head-actions">{action}</div>}
        </div>
      )}
      <div className="card-body" style={bodyPadding ? undefined : { padding: 0 }}>{children}</div>
    </div>
  );
}
