import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logEngagementEvent } from "@/lib/leadTracking";

/**
 * Cluby's gift pop-up (Re, 30 Sep 2026): Cluby hops in and offers the
 * colouring book that waits in the shop — «كلوبي والبيضة المضيئة», 99 EGP there —
 * for free.
 *
 * Who sees it (Re: "for signed-in too, and those who did not download the book;
 * show to all"):
 *   - visitors who are not signed in  → create an account (or sign in), then
 *     /gift/cluby adds the book to "My books";
 *   - signed-in accounts without the book → get it now on /gift/cluby;
 *   - signed-in accounts that have the book but never downloaded it → a
 *     reminder that it waits in "My books".
 * Accounts that have downloaded it never see the pop-up again. Whether an
 * account has the book / downloaded it comes from edge function
 * shop-claim-gift (action "status").
 *
 * The card opens by itself after 12 s (or 45% scroll), at most once a day;
 * closed, a small hopping Cluby stays in the corner and follows the visitor.
 * Every opening and every button tap is logged (lead_events, source_type
 * "cluby_gift"); claims and downloads are logged by the edge function, and the
 * admin Books library shows the totals.
 *
 * Voice: Modern Standard Arabic, neutral in gender (buttons are verbal nouns).
 */

const BOOK_ID = "cluby-coloring-1";
const SEEN_KEY = "kl_cluby_gift_seen_at";
const REOPEN_AFTER_MS = 24 * 60 * 60 * 1000;
const OPEN_AFTER_MS = 12_000;
const GIFT_PATH = "/gift/cluby";

/** Pages where the gift would get in the way (forms, payment, admin, the gift page itself). */
const QUIET = /^\/(ar\/)?(login|signup|forgot-password|reset-password|gift|admin|enroll|enroll-now|trial-booking|checkout|payment|pay\/|complete-profile)/;

type Mode = "guest" | "claim" | "download" | null;

function readSeen(): number {
  try { return Number(localStorage.getItem(SEEN_KEY)) || 0; } catch { return 0; }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch { /* memory only */ }
}
function track(label: string) {
  try { void logEngagementEvent({ source_type: "cluby_gift", cta_label: label }); } catch { /* never blocks */ }
}

const ClubyGiftPopup = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  const [mode, setMode] = useState<Mode>(null);
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(() => readSeen() > 0);

  // Decide who this visitor is: guest, account without the book, or account
  // that has the book but has not downloaded it (asked once per sign-in).
  useEffect(() => {
    if (loading) return;
    if (!user) { setMode("guest"); return; }
    let alive = true;
    setMode(null);
    supabase.functions
      .invoke("shop-claim-gift", { body: { bookId: BOOK_ID, action: "status" } })
      .then(({ data }) => {
        if (!alive || !data) return;
        if (!data.owned) setMode("claim");
        else if (!data.downloaded) setMode("download");
        else setMode(null);
      })
      .catch(() => { /* no pop-up when the status is unknown */ });
    return () => { alive = false; };
  }, [loading, user?.id]);

  const eligible = mode !== null && !QUIET.test(pathname) && !pathname.startsWith("/admin");

  // Open by itself once the visitor has had a moment on the page.
  useEffect(() => {
    if (!eligible || open) return;
    if (Date.now() - readSeen() < REOPEN_AFTER_MS) return;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setOpen(true);
      markSeen();
      track(`popup_shown_${mode}`);
    };
    const timer = window.setTimeout(show, OPEN_AFTER_MS);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max > 0.45) show();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, [eligible, open, mode]);

  // Escape closes the card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setBubble(true);
    markSeen();
  }

  if (!eligible) return null;

  const signUpHref = `/signup?redirect=${encodeURIComponent(GIFT_PATH)}`;
  const loginHref = `/login?redirect=${encodeURIComponent(GIFT_PATH)}`;

  const title =
    mode === "download"
      ? tr("Your colouring book is waiting", "كتاب التلوين ينتظر في «كتبي»")
      : tr("The colouring book is waiting in the shop", "كتاب التلوين ينتظر في المتجر");
  const text =
    mode === "guest"
      ? tr("“Cluby and the Glowing Egg” (Arabic edition): 15 pages to colour, with the first two Korean words. Free with a new Klovers account.",
           "«كلوبي والبيضة المضيئة»: ١٥ صفحة للتلوين، مع أول كلمتين كوريتين. الكتاب مجاني عند إنشاء حساب في كلوفرز.")
      : mode === "claim"
        ? tr("“Cluby and the Glowing Egg” (Arabic edition): 15 pages to colour, with the first two Korean words. Free for this account.",
             "«كلوبي والبيضة المضيئة»: ١٥ صفحة للتلوين، مع أول كلمتين كوريتين. الكتاب مجاني لهذا الحساب.")
        : tr("“Cluby and the Glowing Egg” is already in My books and has not been downloaded yet. Print it and start colouring.",
             "«كلوبي والبيضة المضيئة» موجود في «كتبي» ولم يُحمَّل بعد، وهو جاهز للطباعة والتلوين.");
  const cta =
    mode === "guest"
      ? tr("Create a free account and get the book", "إنشاء حساب مجاني والحصول على الكتاب")
      : mode === "claim"
        ? tr("Get the book free", "الحصول على الكتاب مجانًا")
        : tr("Download the book", "تحميل الكتاب");

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="cluby-gift-title"
          dir={isAr ? "rtl" : "ltr"}
          className="fixed bottom-4 left-4 right-4 z-[120] mx-auto max-w-sm sm:right-auto sm:mx-0 sm:w-[22rem]"
        >
          <div className="relative rounded-2xl border-2 border-charcoal bg-ivory pt-16 shadow-2xl dark:bg-card">
            {/* Cluby hops on top of the card. */}
            <img
              src="/assets/cluby/cluby-wave.webp"
              alt=""
              width={314}
              height={440}
              className="pointer-events-none absolute -top-20 left-1/2 h-32 w-auto -translate-x-1/2 origin-bottom motion-safe:animate-cluby-jump"
            />
            <button
              type="button"
              onClick={close}
              aria-label={tr("Close", "إغلاق")}
              className="absolute top-2 end-2 flex h-9 w-9 items-center justify-center rounded-full text-charcoal hover:bg-charcoal/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="flex flex-col gap-3 px-5 pb-5 text-center">
              <p className="mx-auto rounded-full bg-klovers-yellow px-3 py-0.5 text-xs font-bold text-charcoal">
                {tr("A gift from Cluby", "هدية من كلوبي")}
              </p>
              <h2 id="cluby-gift-title" className="text-lg font-extrabold leading-snug text-charcoal dark:text-foreground">
                {title}
              </h2>
              <div className="flex items-center gap-3 text-start">
                <img
                  src="/book-covers/cluby-coloring-1.webp"
                  alt={tr("Cover of Cluby and the Glowing Egg", "غلاف كتاب كلوبي والبيضة المضيئة")}
                  width={300}
                  height={388}
                  className="h-24 w-auto shrink-0 rounded-md border border-charcoal/20"
                />
                <p className="text-sm leading-relaxed text-charcoal/80 dark:text-muted-foreground">{text}</p>
              </div>
              <Link
                to={mode === "guest" ? signUpHref : GIFT_PATH}
                onClick={() => { setOpen(false); markSeen(); track(`popup_cta_${mode}`); }}
                className="rounded-full border-2 border-charcoal bg-klovers-yellow px-5 py-2.5 text-sm font-extrabold text-charcoal shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {cta}
              </Link>
              {mode === "guest" && (
                <Link
                  to={loginHref}
                  onClick={() => { setOpen(false); markSeen(); track("popup_cta_login"); }}
                  className="text-xs font-semibold text-charcoal underline underline-offset-4 dark:text-foreground"
                >
                  {tr("Already have an account? Sign in", "يوجد حساب بالفعل؟ تسجيل الدخول")}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* After the card is closed, Cluby keeps hopping in the corner and follows the visitor. */}
      {!open && bubble && (
        <button
          type="button"
          onClick={() => { setOpen(true); track(`bubble_open_${mode}`); }}
          aria-label={tr("Open Cluby's gift", "فتح هدية كلوبي")}
          className="group fixed bottom-5 left-4 z-50 flex h-16 w-16 items-end justify-center rounded-full border-2 border-charcoal bg-klovers-yellow shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src="/assets/cluby/cluby-wave.webp"
            alt=""
            width={314}
            height={440}
            className="pointer-events-none -mb-0.5 h-[4.6rem] w-auto origin-bottom motion-safe:animate-cluby-jump"
          />
          <span className="sr-only">{tr("A gift from Cluby", "هدية من كلوبي")}</span>
        </button>
      )}
    </>
  );
};

export default ClubyGiftPopup;
