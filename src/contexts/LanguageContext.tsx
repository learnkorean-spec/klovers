import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Language = "en" | "ar";

/** CLDR plural categories (subset used in this app) */
type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * Returns the CLDR plural category for `count` in the given language.
 *
 * English: one → 1, other → everything else
 * Arabic:  zero → 0, one → 1, two → 2, few → 3-10, many → 11-99, other → 100+
 * (Arabic has 6 plural forms — the richest plural system of any major language.)
 */
function getPluralCategory(count: number, lang: Language): PluralCategory {
  if (lang === "ar") {
    if (count === 0) return "zero";
    if (count === 1) return "one";
    if (count === 2) return "two";
    if (count >= 3 && count <= 10) return "few";
    if (count >= 11 && count <= 99) return "many";
    return "other";
  }
  // English (and fallback for other languages)
  return count === 1 ? "one" : "other";
}

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (sectionOrPath: string, key?: string) => string;
  tArray: (sectionOrPath: string, key?: string) => any[];
  /**
   * Pluralization-aware translation.
   * The translation value must be an object with CLDR plural keys.
   * Supports {{count}} and any other {{variable}} interpolation.
   *
   * Example translation:
   *   { lessons: { one: "{{count}} lesson", other: "{{count}} lessons" } }
   * Usage:
   *   tPlural("lessons", 5) → "5 lessons"
   */
  tPlural: (
    sectionOrPath: string,
    count: number,
    vars?: Record<string, string | number>
  ) => string;
  /**
   * Interpolate `{{variable}}` placeholders in a translated string.
   * Usage: tInterpolate(t("greeting"), { name: "أحمد" })
   */
  tInterpolate: (template: string, vars: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations as baseTranslations } from "@/i18n/translations";
import { dashboardPageExtra } from "@/i18n/dashboardPageExtra";

// The student-dashboard strings live in their own file; fold them into
// `dashboardPage` once, at load, so every t("dashboardPage.…") sees them.
const translations = {
  en: { ...baseTranslations.en, dashboardPage: { ...baseTranslations.en.dashboardPage, ...dashboardPageExtra.en } },
  ar: { ...baseTranslations.ar, dashboardPage: { ...baseTranslations.ar.dashboardPage, ...dashboardPageExtra.ar } },
};

/**
 * The last `userId:language` this browser successfully wrote to profiles.
 *
 * The effect below runs on mount as well as on change, so without this every
 * page load by a signed-in visitor issued a PATCH writing the value that was
 * already there - a write on a read-only visit to the homepage.
 *
 * Keyed by user id so a second account on the same browser is not mistaken
 * for the first. Only written after a successful UPDATE, so a failure retries
 * on the next load.
 */
const LANG_SYNCED_KEY = "k-lovers-lang-synced";

const alreadySynced = (stamp: string): boolean => {
  try {
    return localStorage.getItem(LANG_SYNCED_KEY) === stamp;
  } catch {
    // Privacy mode throws rather than returning null. Falling back to "not
    // synced" keeps the old always-write behaviour, which is the safe side:
    // a redundant write costs a request, a skipped one costs correctness.
    return false;
  }
};

const rememberSynced = (stamp: string): void => {
  try {
    localStorage.setItem(LANG_SYNCED_KEY, stamp);
  } catch {
    /* privacy mode — reverts to writing on every load */
  }
};

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

  // The language the website is displayed in IS the language this person reads
  // Klovers in, so it is the language Klovers writes to them in. Nothing else
  // decides it — not a name, not a country, not which language a class is
  // taught in.
  //
  // Until 14 Sep nothing recorded it at all: profiles.language sat on its 'ar'
  // default across all 107 rows while this provider was defaulting the display
  // to English. The two were never the same fact, so every language-aware
  // letter went out in Arabic. Signup now records the display language, and
  // this keeps it true afterwards — a signed-in person who switches the site
  // has changed the answer, and the next letter should follow them.
  //
  // Fire-and-forget, and nothing at all for a signed-out visitor: switching the
  // site language must stay instant, and a failed write is not worth a toast.
  //
  // 2026-09-18: and nothing at all when the value has not changed either. This
  // effect runs on mount too, so it was issuing a PATCH on every page load to
  // write what was already stored. See LANG_SYNCED_KEY above.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) {
          // Signed out is not an error here, but a real auth failure is worth
          // seeing rather than silently reading as "nobody is logged in".
          console.error("language: could not read the session:", userError.message);
          return;
        }
        const userId = data.user?.id;
        if (!userId || cancelled) return;

        const stamp = `${userId}:${language}`;
        if (alreadySynced(stamp)) return;

        const { error: writeError } = await supabase
          .from("profiles")
          .update({ language })
          .eq("user_id", userId);
        if (writeError) {
          console.error("language: profile write failed:", writeError.message);
          return;
        }
        rememberSynced(stamp);
      } catch {
        // Non-critical — the display language still changed for them.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  const resolve = (sectionOrPath: string, key?: string): any => {
    let allKeys: string[];
    if (key !== undefined) {
      // Legacy: t("section", "nested.key")
      allKeys = [sectionOrPath, ...key.split(".")];
    } else {
      // New: t("section.nested.key")
      allKeys = sectionOrPath.split(".");
    }
    let result: any = translations[language] as any;
    for (const k of allKeys) {
      result = result?.[k];
    }
    return result;
  };

  const t = (sectionOrPath: string, key?: string): string => {
    const result = resolve(sectionOrPath, key);
    return typeof result === "string" ? result : (key ?? sectionOrPath);
  };

  const tArray = (sectionOrPath: string, key?: string): any[] => {
    const result = resolve(sectionOrPath, key);
    return Array.isArray(result) ? result : [];
  };

  const tInterpolate = (template: string, vars: Record<string, string | number>): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      vars[key] !== undefined ? String(vars[key]) : `{{${key}}}`
    );
  };

  const tPlural = (
    sectionOrPath: string,
    count: number,
    vars?: Record<string, string | number>
  ): string => {
    const pluralObj = resolve(sectionOrPath);
    if (typeof pluralObj !== "object" || pluralObj === null) {
      return sectionOrPath; // Fallback to key if shape is wrong
    }
    const category = getPluralCategory(count, language);
    // Walk through CLDR categories in priority order, falling back to "other"
    const categories: PluralCategory[] = [category, "other", "many", "few", "one"];
    let template = "";
    for (const cat of categories) {
      if (typeof pluralObj[cat] === "string") {
        template = pluralObj[cat];
        break;
      }
    }
    if (!template) return sectionOrPath;
    return tInterpolate(template, { count, ...vars });
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, tArray, tPlural, tInterpolate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
