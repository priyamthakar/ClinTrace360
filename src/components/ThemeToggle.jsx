import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { readStorage, writeStorage } from "../utils/storage.js";

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return readStorage("ct360_theme", "dark");
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeStorage("ct360_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      className="btn ghost"
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        padding: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        width: 32,
        height: 32,
        minWidth: 32,
        cursor: "pointer",
        color: "var(--muted)"
      }}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
export default ThemeToggle;
