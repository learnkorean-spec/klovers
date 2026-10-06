import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { X, Download } from "lucide-react";
import { capture } from "@/lib/analytics";
import { useBottomSlot } from "@/lib/bottomLayer";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * PWA install prompt — shows a non-intrusive banner when the browser fires
 * the `beforeinstallprompt` event. Dismissed state is persisted so it never
 * shows again after the user explicitly dismisses it.
 *
 * Mounted app-wide in App.tsx, so on most routes it is the only thing asking
 * for the bottom of the screen. On the homepage it is not: it sits at
 * bottom-20 with z-[200], which put it on top of the exit nudge and the enrol
 * bar rather than beside them. It now takes its turn through the shared
 * bottom layer like the other three (see src/lib/bottomLayer.ts).
 *
 * Never inside the booking and payment steps (6 Oct 2026): a second box asking
 * for something else in the middle of choosing a class or paying is a reason to
 * leave. It waits until the student is on another page.
 *
 * Analytics: fires `pwa_installed` on successful install.
 */
const FUNNEL_PATHS = ["/enroll", "/enroll-now", "/trial-booking", "/trial-book", "/free-trial", "/checkout", "/login", "/signup", "/sign-up", "/forgot-password"];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const { language } = useLanguage();
  const isAr = language === "ar";

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwa_install_dismissed") === "1"
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Delay banner by 30s so it doesn't interrupt first visit
      setTimeout(() => setVisible(true), 30_000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const { pathname } = useLocation();
  const inFunnel = FUNNEL_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.endsWith(p));
  const allowed = useBottomSlot("installPrompt", visible && prompt !== null && !inFunnel);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      capture({ event: "pwa_installed" });
    }
    setVisible(false);
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!allowed) return null;

  return (
    <div
      role="dialog"
      aria-label={isAr ? "تثبيت تطبيق كلوفرز" : "Install Klovers app"}
      aria-modal="false"
      className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[200] bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
        <img src="/klovers-logo.jpg" alt="Klovers" className="w-full h-full object-cover" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground leading-tight">{isAr ? "تثبيت تطبيق كلوفرز" : "Install Klovers App"}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "الدراسة دون إنترنت، وتذكيرات الأيام المتتالية، ودخول أسرع." : "Study offline, get streak reminders, faster access."}</p>
        <button
          onClick={handleInstall}
          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Download className="w-3 h-3" aria-hidden="true" />
          {isAr ? "الإضافة إلى الشاشة الرئيسية" : "Add to Home Screen"}
        </button>
      </div>

      <button
        onClick={handleDismiss}
        aria-label={isAr ? "إغلاق نافذة التثبيت" : "Dismiss install prompt"}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
