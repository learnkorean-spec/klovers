import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "cookie_consent";

const CookieBanner = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const accept = () => {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch { /* private mode: just hide it */ }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label={isAr ? "إشعار ملفات تعريف الارتباط" : "Cookie notice"}
      dir={isAr ? "rtl" : "ltr"}
      // Bottom, like every cookie notice: at the top it sat over the logo and
      // the nav on first load. The safe-area padding keeps it clear of the
      // iPhone home bar.
      className="fixed bottom-0 inset-x-0 z-[150] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl px-4 py-3 sm:px-5 sm:py-4 flex flex-row items-center gap-3 sm:gap-4 pointer-events-auto">
        <p className="text-xs sm:text-sm text-muted-foreground flex-1 leading-relaxed">
          {isAr
            ? "بنستخدم كوكيز لتحسين تجربتك. باستمرارك في استخدام الموقع، بتوافق على "
            : "We use cookies to improve your experience. By continuing, you agree to our "}
          <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </a>
          {isAr ? "." : "."}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" onClick={accept} className="h-8 text-xs font-semibold">
            {isAr ? "موافق" : "Got it"}
          </Button>
          <button
            onClick={accept}
            aria-label={isAr ? "إغلاق" : "Dismiss"}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
