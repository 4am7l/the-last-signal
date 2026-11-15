import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

function initialTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme;
    if (current === "light" || current === "dark") return current;
  }
  try {
    const saved = window.localStorage.getItem("tls-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

/** Theme state lives outside the WebGL tree to avoid unnecessary scene rerenders. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#12151d" : "#f8f9ff");
    try {
      window.localStorage.setItem("tls-theme", theme);
    } catch {
      // Private browsing can disable storage; the toggle still works this session.
    }
  }, [theme]);

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? "فعّل الوضع الفاتح" : "فعّل الوضع الداكن"}
      title={dark ? "الوضع الفاتح" : "الوضع الداكن"}
      aria-pressed={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        {dark ? "light_mode" : "dark_mode"}
      </span>
      <span className="theme-toggle__label">{dark ? "فاتح" : "داكن"}</span>
    </button>
  );
}
