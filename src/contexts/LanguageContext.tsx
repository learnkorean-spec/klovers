import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (section: string, key: string) => string;
  tArray: (section: string, key: string) => any[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations } from "@/i18n/translations";

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("k-lovers-lang");
    return (saved === "ar" ? "ar" : "en") as Language;
  });

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    localStorage.setItem("k-lovers-lang", language);
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  const t = (section: string, key: string): string => {
    const keys = key.split(".");
    let result: any = (translations[language] as any)?.[section];
    for (const k of keys) {
      result = result?.[k];
    }
    return typeof result === "string" ? result : key;
  };

  const tArray = (section: string, key: string): any[] => {
    const keys = key.split(".");
    let result: any = (translations[language] as any)?.[section];
    for (const k of keys) {
      result = result?.[k];
    }
    return Array.isArray(result) ? result : [];
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
