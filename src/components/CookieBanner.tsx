import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { readConsent, saveConsent, type ConsentChoice } from "@/lib/consent";
import { useBottomSlot } from "@/lib/bottomLayer";

/**
 * 24 Sep 2026: a real choice. Analytics (GA4 Consent Mode v2, Meta Pixel)
 * stay off until Accept; Decline is offered at the same size and weight.
 * There is no close button any more - closing used to count as accepting.
 *
 * 4 Oct 2026: it moved from the top of the viewport to the bottom.
 *
 * It was `fixed top-0 z-[150]`, and the header is `fixed top-0 z-50`, so the
 * notice painted over it: on desktop it covered the entire nav, and on a phone
 * it covered the logo and the first line of the h1 - the site introduced
 * itself by hiding its own name and headline until the visitor answered a
 * question about analytics. A bottom-anchored notice cannot do that, whatever
 * the viewport height.
 *
 * It also now claims a slot in src/lib/bottomLayer.ts, at the top of the
 * priority list. Four overlays already compete for the bottom of the screen
 * and the notice was not one of them; without the slot it would simply have
 * inherited the old pile-up problem at the other end of the screen.
 */
const CookieBanner = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // Read synchronously. This was `useState(false)` plus a `useEffect`, which
  // painted the page once without the notice and then pushed it in - a layout
  // shift for something whose answer is already known on the first render.
  const [show, setShow] = useState(() => {
    try {
      return readConsent() === null;
    } catch {
      return false;
    }
  });

  const allowed = useBottomSlot("consent", show);

  const choose = (choice: ConsentChoice) => {
    saveConsent(choice);
    setShow(false);
  };

  if (!show || !allowed) return null;

  return (
    <div
      role="region"
      aria-label={isAr ? "إشعار ملفات تعريف الارتباط" : "Cookie notice"}
      dir={isAr ? "rtl" : "ltr"}
      className="fixed bottom-0 inset-x-0 z-[150] p-3 sm:p-4 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 pointer-events-auto">
        <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
          {isAr
            ? "نستخدم ملفات تعريف الارتباط للتحليلات لتحسين التجربة. القبول أو الرفض متاح، ويعمل الموقع بشكل طبيعي في الحالتين. التفاصيل في "
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
