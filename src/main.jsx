import React from "react";
import { createRoot } from "react-dom/client";
import ClinTrace360 from "./ClinTrace360.jsx";
import "./styles.css";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", color: "#E5484D", background: "#0E0F11", minHeight: "100vh", whiteSpace: "pre-wrap" }}>
          <strong>React crash:</strong>{"\n"}{this.state.error.message}{"\n\n"}{this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ClinTrace360 />
    </ErrorBoundary>
  </React.StrictMode>
);
