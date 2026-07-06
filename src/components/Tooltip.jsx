import React from "react";

export function Tooltip({ content, children }) {
  if (!content) return children;
  return (
    <span className="tooltip-trigger">
      {children}
      <span className="tooltip-content">{content}</span>
    </span>
  );
}
