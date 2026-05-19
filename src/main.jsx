import React from "react";
import { createRoot } from "react-dom/client";
import ClinTrace360 from "./ClinTrace360.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClinTrace360 />
  </React.StrictMode>
);
