import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { BOOKS, BOOK_COVERS, type BookId } from "@/constants/books";
import { logEngagementEvent } from "@/lib/leadTracking";
import { currencyForLanguage, localPrice, type ShopPrice } from "@/lib/shopCurrency";

/**
 * Homepage → the shop (28 Sep 2026, Re: "build the way to present the shop
 * from the front page, matching my style").
 *
 * World mode: the shop is a door into the world, not a narrative slot, so it
 * sits outside homepageNarrative (like the FAQ). It reuses the /shop story
 * beat: Lina leads — she keeps a bag packed by the courtyard gate — and the
 * scene is the same image as the /shop hero, so the two pages read as one
 * place. One main character; Cluby does not appear here.
 *
 * Honest by construction: the shelf shows the book written for this language
 * (the store edition, BOOKS[*].use === "store"). Its price and link come from
 * Stripe (shop-products) only once a product with that book_id is live; until
 * then the card says the book is on its way to the shelf. The catalogue is
 * asked for only when the section scrolls near, so the homepage's first load
 * does not wait on it.
 */

type Listing = { slug: string; bookId: string | null; lang: "ar" | "en" | null; price: ShopPrice };

/** Every edge dissolves into the ivory band, so the scene meets the page instead of sitting on it. */
const FADE = "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), linear-gradient(to bottom, transparent, #000 12%, #000 82%, transparent)";
const SOFT_EDGE = {
  WebkitMaskImage: FADE,
  WebkitMaskComposite: "source-in",
  maskImage: FADE,
  maskComposite: "intersect",
} as const;

function money(amount: number, currency: string, isAr: boolean) {
  try {
    return new Intl.NumberFormat(isAr ? "ar-EG" : "en-GB", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

const HomeShopShelf = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  const sectionRef = useRef<HTMLElement>(null);
  const [listings, setListings] = useState<Listing[] | null>(null);

  // Ask Stripe for the catalogue once, when the section is about to be seen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      try { logEngagementEvent({ source_type: "homepage", cta_label: "section_shop_shelf" }); } catch { /* analytics never blocks */ }
      supabase.functions
        .invoke("shop-products", { method: "GET" })
        .then(({ data }) => setListings(Array.isArray(data?.products)
          ? (data.products as Listing[]) // every currency kept; the page language picks one at render
          : []))
        .catch(() => setListings([]));
    }, { rootMargin: "300px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // The store edition written in this page's language.
  const bookId = (Object.keys(BOOKS) as BookId[]).find(
    (id) => BOOKS[id].use === "store" && BOOKS[id].lang === (isAr ? "ar" : "en"),
  );
  const book = bookId ? BOOKS[bookId] : null;
  const listing = listings?.find((p) => p.bookId === bookId);

  return (
    <section
      id="shop-shelf"
      ref={sectionRef}
      aria-labelledby="shop-shelf-title"
      className="relative overflow-hidden bg-ivory py-16 dark:bg-muted md:py-24"
    >
      <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
        {/* The scene: Lina packing her study tote on the hanok veranda (same image as the /shop hero). */}
        <picture className="block">
          <source media="(min-width: 1024px)" srcSet="/assets/story/shop-hero-lina.webp" width={1600} height={900} />
          <img
            src="/assets/story/shop-hero-lina-mobile.webp"
            alt={tr(
              "Lina packing a study tote with a book, notebook and flashcards on a hanok veranda at sunset",
              "لينا تجهّز حقيبة الدراسة بكتاب ودفتر وبطاقات على شرفة بيت كوري تقليدي عند الغروب",
            )}
            width={900}
            height={1125}
            loading="lazy"
            decoding="async"
            className="mx-auto h-auto w-full max-w-sm object-cover sm:max-w-md lg:max-w-none rtl:-scale-x-100"
            style={SOFT_EDGE}
          />
        </picture>

        <div className="text-foreground">
          <span className="mb-4 inline-block rounded-full border border-charcoal/10 bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
            {tr("Klovers Supply", "متجر كلوفرز")}
          </span>
          <h2 id="shop-shelf-title" className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {tr("The bag by the courtyard gate", "الحقيبة عند بوابة الفناء")}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {tr(
              "Lina never leaves for a lesson empty-handed. In her bag are the books Klovers writes for its own classes, now in self-study editions that go straight to My books.",
              "لا تخرج لينا إلى درسٍ بيدين فارغتين. في حقيبتها الكتب التي تكتبها كلوفرز لحصصها، وقد صارت الآن في نسخ للدراسة الذاتية تُضاف مباشرة إلى «كتبي».",
            )}
          </p>

          {/* The shelf: the first book, as it is sold. */}
          {book && bookId && (
            <div className="mt-8 flex items-end gap-4 border-b-4 border-charcoal/80 pb-3 dark:border-foreground/60">
              <img
                src={BOOK_COVERS[bookId]}
                alt={tr("Cover of Hangeul from Zero, Level A0", "غلاف كتاب الهانغُل من الصفر، المستوى A0")}
                width={300}
                height={388}
                loading="lazy"
                decoding="async"
                className="h-40 w-auto shrink-0 rounded-md shadow-[6px_8px_0_0_hsl(var(--klovers-yellow))] ring-1 ring-charcoal/15 sm:h-44"
              />
              <div className="min-w-0 pb-1">
                <p className="font-display text-lg font-bold leading-snug">
                  {tr("Hangeul from Zero · Level A0", "الهانغُل من الصفر · المستوى A0")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr("Self-study edition · 78 pages · digital book", "نسخة الدراسة الذاتية · 78 صفحة · كتاب رقمي")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tr("Answer key included. Opens in My books after purchase.", "مع مفتاح الإجابات. يُفتح في «كتبي» بعد الشراء.")}
                </p>
                <div className="mt-3">
                  {listing ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-klovers-green bg-ivory px-3 py-1 text-sm font-bold text-charcoal">
                      <span className="h-2 w-2 rounded-full bg-klovers-green" aria-hidden="true" />
                      {(() => { const p = localPrice(listing.price, currencyForLanguage(isAr)); return money(p.amount, p.currency, isAr); })()}
                    </span>
                  ) : listings !== null ? (
                    <span className="inline-block rounded-full bg-klovers-yellow px-3 py-1 text-xs font-bold text-charcoal">
                      {tr("On its way to the shelf", "في الطريق إلى الرف")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to={listing ? `/shop/products/${listing.slug}` : "/shop"}
              onClick={() => { try { logEngagementEvent({ source_type: "homepage", cta_label: "shop_shelf_visit" }); } catch { /* never blocks */ } }}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-klovers-yellow px-6 font-semibold text-charcoal shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal"
            >
              {listing ? tr("See the book", "عرض الكتاب") : tr("Visit the shop", "زيارة المتجر")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            {listing && (<Link
              to="/shop"
              className="inline-flex min-h-11 items-center font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/70"
            >
              {tr("Everything in Klovers Supply", "كل ما في متجر كلوفرز")}
            </Link>)}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeShopShelf;
