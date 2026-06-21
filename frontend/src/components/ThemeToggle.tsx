import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-[60px] saturate-[180%] bg-[var(--color-glass-button)] border-2 border-[var(--color-glass-border)] hover:bg-[var(--color-glass-button-hover)] hover:border-[var(--color-separator)] hover:scale-105 active:scale-95 shadow-[0_4px_16px_rgba(0,0,0,0.1)] group"
      aria-label="Toggle theme"
    >
      {theme === "light" ? (
        <Sun size={20} className="text-[var(--color-ios-yellow)] transition-transform group-hover:rotate-45" />
      ) : (
        <Moon size={20} className="text-[var(--color-ios-blue)] transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
