import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";

/**
 * /gift/cluby — where Cluby's gift pop-up lands after sign-up or sign-in
 * (Re, 30 Sep 2026; see src/components/ClubyGiftPopup.tsx).
 *
 * A visitor without an account is sent to sign-up, which comes back here.
 * A signed-in account claims the colouring book once (edge function
 * shop-claim-gift): it goes into "My books" and can be downloaded right away.
 *
 * Voice: Modern Standard Arabic, neutral in gender. One language per page.
 */

const GIFT_BOOK = "cluby-coloring-1";
type State =
  | { kind: "working" }
  | { kind: "done"; download: string | null; alreadyHad: boolean }
  | { kind: "error" };

const ClubyGiftPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const { user, loading } = useAuth();
  const [state, setState] = useState<State>({ kind: "working" });
  const asked = useRef(false);

  useSEO({
    title: tr("Cluby's gift · Klovers", "هدية كلوبي · كلوفرز"),
    description: tr("The Cluby colouring book, free with a Klovers account.", "كتاب تلوين كلوبي مجانًا مع حساب في كلوفرز."),
    noindex: true,
  });

  useEffect(() => {
    if (loading || !user || asked.current) return;
    asked.current = true;
    supabase.functions
      .invoke("shop-claim-gift", { body: { bookId: GIFT_BOOK } })
      .then(({ data, error }) => {
        if (error || !data?.ok) return setState({ kind: "error" });
        setState({ kind: "done", download: data.download ?? null, alreadyHad: !!data.alreadyHad });
      })
      .catch(() => setState({ kind: "error" }));
  }, [loading, user]);

  if (!loading && !user) return <Navigate to={`/signup?redirect=${encodeURIComponent("/gift/cluby")}`} replace />;

  return (
    <div className="flex min-h-screen flex-col bg-ivory dark:bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border-2 border-charcoal bg-card px-6 pb-8 pt-24 text-center shadow-xl relative">
          <img
            src="/assets/cluby/cluby-wave.webp"
            alt=""
            width={314}
            height={440}
            className="pointer-events-none absolute -top-20 left-1/2 h-40 w-auto -translate-x-1/2 origin-bottom motion-safe:animate-cluby-jump"
          />

          {state.kind === "working" && (
            <div role="status" className="flex flex-col items-center gap-3">
              <h1 className="text-xl font-extrabold text-foreground">{tr("Cluby is bringing the book…", "كلوبي يحضر الكتاب…")}</h1>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-klovers-yellow border-t-transparent" aria-hidden="true" />
            </div>
          )}

          {state.kind === "done" && (
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-extrabold text-foreground">
                {state.alreadyHad ? tr("The book is already yours", "الكتاب موجود في الحساب بالفعل") : tr("The book is yours!", "وصل الكتاب!")}
              </h1>
              <img
                src="/book-covers/cluby-coloring-1.webp"
                alt={tr("Cover of Cluby and the Glowing Egg", "غلاف كتاب كلوبي والبيضة المضيئة")}
                width={300}
                height={388}
                className="h-40 w-auto rounded-lg border border-charcoal/20"
              />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {tr(
                  "“Cluby and the Glowing Egg” is now in My books on the dashboard, ready to print and colour.",
                  "«كلوبي والبيضة المضيئة» الآن في «كتبي» داخل لوحة الطالب، جاهز للطباعة والتلوين.",
                )}
              </p>
              <div className="flex w-full flex-col gap-2">
                {state.download && (
                  <Button asChild className="h-11 rounded-full border-2 border-charcoal bg-klovers-yellow font-extrabold text-charcoal hover:bg-klovers-yellow hover:brightness-95">
                    <a href={state.download}>{tr("Download the book", "تحميل الكتاب")}</a>
                  </Button>
                )}
                <Button asChild variant="outline" className="h-11 rounded-full border-2 border-charcoal font-bold">
                  <Link to="/dashboard">{tr("Open My books", "فتح «كتبي»")}</Link>
                </Button>
                <Link to="/free-trial" className="mt-1 text-sm font-semibold text-foreground underline underline-offset-4">
                  {tr("Next with Cluby: a free Korean class", "الخطوة التالية مع كلوبي: حصة كورية تجريبية مجانية")}
                </Link>
              </div>
            </div>
          )}

          {state.kind === "error" && (
            <div role="alert" className="flex flex-col items-center gap-3">
              <h1 className="text-xl font-extrabold text-foreground">{tr("Cluby could not bring the book just now", "لم يصل الكتاب هذه المرة")}</h1>
              <p className="text-sm text-muted-foreground">
                {tr("Please try again in a minute, or message us on WhatsApp.", "يُرجى المحاولة بعد دقيقة، أو التواصل معنا عبر واتساب.")}
              </p>
              <Button className="h-11 rounded-full" onClick={() => { asked.current = false; setState({ kind: "working" }); window.location.reload(); }}>
                {tr("Try again", "إعادة المحاولة")}
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClubyGiftPage;
