import { createContext, useContext } from "react";

export type Language = "ar" | "en";

export const ExplorerLanguage = createContext<Language>("ar");

export function useExplorerText() {
  const language = useContext(ExplorerLanguage);
  return (arabic: string, english: string) => language === "en" ? english : arabic;
}

export function useLanguage() {
  return useContext(ExplorerLanguage);
}
