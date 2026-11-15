import { useExplorerText, useLanguage } from "./explorer-language";

export function LanguageToggle({ onToggle }: { onToggle: () => void }) {
  const t = useExplorerText();
  const language = useLanguage();
  return (
    <button
      type="button"
      className="language-toggle theme-toggle"
      onClick={onToggle}
      aria-label={t("Switch to English", "التبديل إلى العربية")}
      lang={language === "en" ? "ar" : "en"}
    >
      {t("EN", "AR")}
    </button>
  );
}
