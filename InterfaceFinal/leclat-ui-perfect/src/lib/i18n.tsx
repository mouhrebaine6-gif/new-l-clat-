/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "fr" | "en" | "ar";
export type Localized<T = string> = Record<Lang, T>;

export const languages: Array<{ id: Lang; short: string; nativeName: string; label: string }> = [
  { id: "fr", short: "FR", nativeName: "Français", label: "Français" },
  { id: "en", short: "EN", nativeName: "English", label: "English" },
  { id: "ar", short: "AR", nativeName: "العربية", label: "Arabic" },
];

const fallbackLang: Lang = "fr";
const storageKey = "eclat_lang";

const isLang = (value: string | null): value is Lang =>
  value === "fr" || value === "en" || value === "ar";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: "ltr" | "rtl";
  tr: <T>(value: Localized<T> | T) => T;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return fallbackLang;
    const saved = localStorage.getItem(storageKey);
    return isLang(saved) ? saved : fallbackLang;
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem(storageKey, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.dataset.lang = lang;
  }, [dir, lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang: setLangState,
      dir,
      tr: (text) => {
        if (text && typeof text === "object" && "fr" in text && "en" in text && "ar" in text) {
          return (text as Localized)[lang] as never;
        }
        return text as never;
      },
    }),
    [dir, lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider.");
  return value;
};

export const text = <T,>(fr: T, en: T, ar: T): Localized<T> => ({ fr, en, ar });
