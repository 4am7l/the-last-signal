import { useExplorerText } from "./explorer-language";
import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

function savedTheme(): ThemeMode | null {
  try {
    const saved = window.localStorage.getItem("tls-theme");
    return saved === "light" || saved === "dark" ? saved : null;
  } catch {
    return null;
  }
}

function initialTheme(): ThemeMode {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme;
    if (current === "light" || current === "dark") return current;
  }
  return savedTheme() ??
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}

/** A small independent theme control: the WebGL scene never rerenders for UI theme changes. */
export function ThemeToggle() {
 const t = useExplorerText();
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#12151c" : "#f8f9ff");
  }, [theme]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemThemeChanged = () => {
      if (!savedTheme()) setTheme(preference.matches ? "dark" : "light");
    };
    preference.addEventListener("change", onSystemThemeChanged);
    return () => preference.removeEventListener("change", onSystemThemeChanged);
  }, []);

  const dark = theme === "dark";
  const toggle = () => {
    const next: ThemeMode = dark ? "light" : "dark";
    setTheme(next);
    try {
      window.localStorage.setItem("tls-theme", next);
    } catch {
      // Storage is optional; the toggle works for the current page.
    }
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? t("فعّل الوضع الفاتح", "Switch to light mode") : t("فعّل الوضع الداكن", "Switch to dark mode")}
      title={dark ? t("الوضع الفاتح", "Light mode") : t("الوضع الداكن", "Dark mode")}
      aria-pressed={dark}
      onClick={toggle}
    >
      <span className="material-symbols-rounded" aria-hidden="true">
        {dark ? "light_mode" : "dark_mode"}
      </span>
      <span className="theme-toggle__label">{dark ? t("فاتح", "Light") : t("داكن", "Dark")}</span>
    </button>
  );
}
