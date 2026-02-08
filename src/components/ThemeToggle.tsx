import { toggleTheme, getTheme } from "../lib/theme";
import { useState } from "react";

export function ThemeToggle() {
  const [t, setT] = useState(getTheme());
  return (
    <button
      className="rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white dark:bg-slate-900"
      onClick={() => {
        toggleTheme();
        setT(getTheme());
      }}
      type="button"
      title="Toggle theme"
    >
      {t === "dark" ? "Dark" : "Light"}
    </button>
  );
}
