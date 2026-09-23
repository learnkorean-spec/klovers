import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { readConsent, saveConsent, type ConsentChoice } from "@/lib/consent";

/**
 * 24 Sep 2026: a real choice. Analytics (GA4 Consent Mode v2, Meta Pixel)
 * stay off until Accept; Decline is offered at the same size and weight.
 * There is no close button any more - closing used to count as accepting.
 */
const CookieBanner = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setShow(true);
  }, []);

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label={isAr ? "إشعار ملفات تعريف الارتباط" : "Cookie notice"}
      dir={isAr ? "rtl" : "ltr"}
      className="fixed top-0 inset-x-0 z-[150] p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          {isAr
            ? "بنستخدم كوكيز التحليلات عشان نحسّن تجربتك. تقدر توافق أو ترفض، والموقع هيشتغل عادي في الحالتين. اعرف أكتر في "
            : "We use analytics cookies to improve your experience. You can accept or decline; the site works the same either way. See our "}
          <a href="/privacy-policy" className="underline hover:text-foreground transition-colors">
            {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
          </a>
          {isAr ? "." : "."}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => choose("denied")}
            className="h-8 min-w-[5.5rem] text-xs font-semibold"
          >
            {isAr ? "رفض" : "Decline"}
          </Button>
          <Button
            size="sm"
            onClick={() => choose("granted")}
            className="h-8 min-w-[5.5rem] text-xs font-semibold"
          >
            {isAr ? "موافق" : "Accept"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
