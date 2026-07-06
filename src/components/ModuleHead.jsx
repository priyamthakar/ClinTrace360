import React from "react";

export function ModuleHead({ eyebrow, title, sub, children }) {
  return (
    <div className="module-head">
      <div className="module-title">
        {eyebrow && <div className="module-eyebrow">{eyebrow}</div>}
        <div className="module-h">{title}</div>
        {sub && <div className="module-sub">{sub}</div>}
      </div>
      {children && <div className="module-actions">{children}</div>}
    </div>
  );
}
