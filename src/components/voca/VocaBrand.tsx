import { Link, useNavigate } from "react-router-dom";
import { Globe, LogOut, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * Voca — the English-lessons sibling brand of Klovers (like maktub is for
 * Arabic). Shared pieces live here so the public page (/learn-english) and
 * the logged-in English student's page (My Lessons) look like the same brand.
 *
 * Re, 23 Oct 2026: English private students "are not in Klovers anymore, they
 * are under Voca" — so once signed in they get Voca's header and footer, not
 * the sitewide Klovers ones (whose account menu is full of Korean-course
 * items: KLOVERS World, Daily Quiz, Vocab Review).
 */

export const VOCA_INK = "#650000"; // maroon
export const VOCA_SIGNAL = "#FFFF00"; // yellow (same hex as klovers-yellow)
export const VOCA_PAPER = "#FFF9EC"; // cream

export const VocaLogoMark = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" className={className} role="img" aria-label="Voca">
    <rect x="0" y="0" width="200" height="200" rx="44" fill={VOCA_INK} />
    <circle cx="100" cy="92" r="58" fill={VOCA_SIGNAL} />
    <circle cx="100" cy="92" r="34" fill={VOCA_INK} />
    <rect x="78" y="76" width="8" height="32" rx="4" fill={VOCA_SIGNAL} />
    <rect x="91" y="64" width="8" height="56" rx="4" fill={VOCA_SIGNAL} />
    <rect x="104" y="72" width="8" height="40" rx="4" fill={VOCA_SIGNAL} />
    <rect x="117" y="80" width="8" height="24" rx="4" fill={VOCA_SIGNAL} />
    <path d="M120 142 L150 142 L128 168 Z" fill={VOCA_SIGNAL} />
  </svg>
);

type TrFn = (en: string, ar: string) => string;

/** Header for a signed-in Voca (English) student: their lessons, language, log out. */
export const VocaStudentHeader = ({ tr, toggleLanguage }: { tr: TrFn; toggleLanguage: () => void }) => {
  const navigate = useNavigate();
  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/learn-english");
  };
  return (
    <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: VOCA_INK, borderColor: "#4A0000" }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ backgroundColor: VOCA_SIGNAL, color: "#111111" }}
      >
        {tr("Skip to content", "الانتقال إلى المحتوى")}
      </a>
      <div className="container mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/dashboard" className="inline-flex items-center gap-2" aria-label={tr("Voca — my lessons", "Voca — حصصي")}>
          <VocaLogoMark className="h-8 w-8 shrink-0 rounded-lg ring-1 ring-white/20" />
          <span className="text-xl font-extrabold tracking-tight text-white">Voca</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-white hover:bg-white/10 hover:text-white">
            <Link to="/dashboard">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tr("My lessons", "حصصي")}</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-1.5 text-xs text-white hover:bg-white/10 hover:text-white">
            <Globe className="h-3.5 w-3.5" />
            {tr("العربية", "English")}
          </Button>
          <Button
            size="sm"
            onClick={logout}
            className="gap-1.5 rounded-full text-xs font-semibold hover:brightness-95"
            style={{ backgroundColor: VOCA_SIGNAL, color: "#111111" }}
          >
            <LogOut className="h-3.5 w-3.5" />
            {tr("Log out", "تسجيل الخروج")}
          </Button>
        </div>
      </div>
    </header>
  );
};

/** Compact Voca footer for the signed-in English student's pages. */
export const VocaStudentFooter = ({ tr }: { tr: TrFn }) => (
  <footer className="py-8 px-4" style={{ backgroundColor: "#0a0a0a", color: "#d9d9d9" }}>
    <div className="container mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <VocaLogoMark className="h-6 w-6" />
        <span className="text-[15px] font-bold text-white">Voca</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/20 text-white/60">
          {tr("by Klovers", "من كلوفرز")}
        </span>
      </div>
      <p className="text-xs text-white/60">
        {tr("English, explained in Arabic.", "الإنجليزية، بشرح بالعربية.")}{" "}
        <Link to="/learn-english" className="underline hover:text-white" style={{ color: VOCA_SIGNAL }}>
          {tr("About Voca lessons", "عن دروس Voca")}
        </Link>
      </p>
    </div>
  </footer>
);
