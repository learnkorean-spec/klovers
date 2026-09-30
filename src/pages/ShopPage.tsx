/**
 * Klovers shop — /shop and /shop/:category (27 Sep 2026).
 *
 * World mode: the door into the world. Lina (culture, real life) leads the
 * page: she keeps a bag packed by the courtyard gate. Cluby appears once, in
 * the "more than a file" section, as the keeper of the books.
 *
 * Everything sold comes from Stripe (see src/lib/shop.ts). Categories show
 * only once they hold a product, so the page never advertises an empty shelf.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import { ProductCard } from "@/components/shop/ProductCard";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { capture } from "@/lib/analytics";
import { SHOP_CATEGORIES, cartActions, useCart, useShopProducts, visibleIn, type ShopProduct } from "@/lib/shop";
import type { BrandIconName } from "@/lib/dashboardProgress";

type Copy = { en: string; ar: string };
const CATEGORY_COPY: Record<(typeof SHOP_CATEGORIES)[number], { icon: BrandIconName; title: Copy; line: Copy }> = {
  start:   { icon: "open-book",    title: { en: "Start",   ar: "البداية" },   line: { en: "Begin your Korean journey", ar: "الخطوة الأولى في الرحلة الكورية" } },
  study:   { icon: "notebook",     title: { en: "Study",   ar: "الدراسة" },   line: { en: "Tools made for everyday learning", ar: "أدوات للتعلّم اليومي" } },
  carry:   { icon: "passport",     title: { en: "Carry",   ar: "في الحقيبة" }, line: { en: "Take Korean with you", ar: "الكورية في كل طريق" } },
  play:    { icon: "controller",   title: { en: "Play",    ar: "اللعب" },     line: { en: "Practise differently", ar: "تدريب بطريقة مختلفة" } },
  collect: { icon: "cluby",        title: { en: "Collect", ar: "المقتنيات" }, line: { en: "Meet the Cluby collection", ar: "مجموعة كلوبي" } },
  gift:    { icon: "reward-gift",  title: { en: "Gift",    ar: "الهدايا" },   line: { en: "Give someone their Korean beginning", ar: "بداية كورية تُهدى لشخص عزيز" } },
};

function categoryCopy(cat: string) {
  return (CATEGORY_COPY as Record<string, (typeof CATEGORY_COPY)["start"] | undefined>)[cat];
}

export function ShopBar({ isAr, products }: { isAr: boolean; products: ShopProduct[] }) {
  const cart = useCart();
  // /shop?bag=1 (from a story page's "add to bag") opens the bag straight away.
  const [open, setOpen] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("bag") === "1"; } catch { return false; }
  });
  const count = cart.filter((l) => products.some((p) => p.price.id === l.priceId)).reduce((n, l) => n + l.quantity, 0);
  return (
    <>
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="container mx-auto flex h-12 items-center justify-between px-4">
          <Link to="/shop" className="font-display text-sm font-bold tracking-wide text-foreground">
            {isAr ? "متجر كلوفرز" : "Klovers Supply"}
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isAr ? "الحقيبة" : "Bag"}
            <span className="grid min-w-6 place-items-center rounded-full bg-klovers-yellow px-1.5 text-xs font-bold text-charcoal">
              {count}
            </span>
          </button>
        </div>
      </div>
      <CartDrawer open={open} onOpenChange={setOpen} products={products} isAr={isAr} />
    </>
  );
}

function ProductGrid({ products, isAr, loading }: { products: ShopProduct[]; isAr: boolean; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/6] rounded-2xl" />)}
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-ivory/60 px-6 py-12 text-center dark:bg-muted/30">
        <p className="font-display text-lg font-semibold text-foreground">
          {isAr ? "يُجهَّز هذا الرف الآن." : "This shelf is being stocked."}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAr ? "تصل أولى الكتب قريبًا." : "The first books arrive soon."}
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p.id} product={p} isAr={isAr} />)}
    </div>
  );
}

function ShopUnavailable({ isAr }: { isAr: boolean }) {
  return (
    <div role="status" className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold text-foreground">
        {isAr ? "المتجر يستريح قليلًا." : "The shop is taking a short break."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAr ? "يُرجى العودة بعد دقائق." : "Please come back in a few minutes."}
      </p>
    </div>
  );
}

export default function ShopPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const { category } = useParams<{ category?: string }>();
  const [params, setParams] = useSearchParams();
  const order = params.get("order");
  const { data, isLoading, isError } = useShopProducts();

  const all = useMemo(() => (data ?? []).filter((p) => visibleIn(p, isAr)), [data, isAr]);
  const cat = category?.toLowerCase();
  const shown = cat ? all.filter((p) => p.category === cat) : all;
  const catCopy = cat ? categoryCopy(cat) : undefined;
  const liveCategories = SHOP_CATEGORIES.filter((c) => all.some((p) => p.category === c));

  const catTitle = cat ? (catCopy ? tr(catCopy.title.en, catCopy.title.ar) : tr(cat.replace(/-/g, " "), "مجموعة موسمية")) : "";
  useSEO({
    title: cat ? tr(`${catTitle} · Klovers Supply`, `${catTitle} · متجر كلوفرز`) : tr("Klovers Supply — Korean books and study goods", "متجر كلوفرز — كتب ومستلزمات لتعلّم الكورية"),
    description: cat && catCopy
      ? tr(`${catCopy.line.en}. Klovers books and study goods for learning Korean.`, `${catCopy.line.ar}. كتب ومستلزمات من كلوفرز لتعلّم الكورية.`)
      : tr("Klovers books and study goods that take Korean beyond the classroom. Digital books go straight to My books in the student dashboard.",
           "كتب ومستلزمات من كلوفرز تحمل الكورية إلى ما بعد الحصة. الكتب الرقمية تُضاف مباشرة إلى «كتبي» في لوحة الطالب."),
    canonical: cat ? `https://kloversegy.com/shop/${cat}` : "https://kloversegy.com/shop",
  });

  useEffect(() => {
    capture(cat ? { event: "collection_view", category: cat } : { event: "shop_view" });
  }, [cat]);

  useEffect(() => {
    if (order === "success") {
      cartActions.clear();
      capture({ event: "purchase" });
    }
  }, [order]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        <ShopBar isAr={isAr} products={data ?? []} />

        {order && (
          <div role="status" className={`border-b border-border ${order === "success" ? "bg-klovers-green" : "bg-ivory dark:bg-muted"}`}>
            <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-charcoal dark:text-foreground">
              <p className="font-medium">
                {order === "success"
                  ? tr("Payment received. The books are on their way to My books in your dashboard.", "تم استلام الدفع. تُضاف الكتب الآن إلى «كتبي» في لوحة الطالب.")
                  : tr("Checkout was closed. The bag is still here.", "أُغلقت صفحة الدفع، والحقيبة ما زالت كما هي.")}
              </p>
              <div className="flex gap-2">
                {order === "success" && (
                  <Button asChild size="sm" variant="secondary"><Link to="/dashboard">{tr("Open My books", "فتح «كتبي»")}</Link></Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { params.delete("order"); setParams(params, { replace: true }); }}>
                  {tr("Close", "إغلاق")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {cat ? (
          <section className="py-10 md:py-14">
            <div className="container mx-auto max-w-6xl px-4">
              <nav aria-label={tr("Breadcrumb", "مسار الصفحة")} className="mb-4 text-sm text-muted-foreground">
                <Link to="/shop" className="hover:text-foreground hover:underline">{tr("Shop", "المتجر")}</Link>
                <span aria-hidden="true" className="mx-2">/</span>
                <span className="text-foreground">{catTitle}</span>
              </nav>
              <div className="mb-8 flex items-center gap-4">
                {catCopy && <BrandIcon name={catCopy.icon} className="h-14 w-14" eager />}
                <div>
                  <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{catTitle}</h1>
                  {catCopy && <p className="mt-1 text-muted-foreground">{tr(catCopy.line.en, catCopy.line.ar)}</p>}
                </div>
              </div>
              {isError ? <ShopUnavailable isAr={isAr} /> : <ProductGrid products={shown} isAr={isAr} loading={isLoading} />}
            </div>
          </section>
        ) : (
          <>
            {/* 1 · Hero — Lina packs her study tote on the hanok veranda (Re's
                image, 27 Sep 2026). Desktop: the scene fills the band and the
                copy sits on the calm side, which is mirrored for Arabic so the
                text never covers her. Mobile: the 4:5 scene, then the copy. */}
            <section className="relative overflow-hidden bg-ivory dark:bg-muted">
              <div className="relative md:absolute md:inset-0">
                <picture>
                  <source media="(min-width: 768px)" srcSet="/assets/story/shop-hero-lina.webp" width={1600} height={900} />
                  <img
                    src="/assets/story/shop-hero-lina-mobile.webp"
                    alt={tr(
                      "Lina packing a study tote with a book, notebook and flashcards on a hanok veranda at sunset",
                      "لينا تجهّز حقيبة الدراسة بكتاب ودفتر وبطاقات على شرفة بيت كوري تقليدي عند الغروب",
                    )}
                    width={900}
                    height={1125}
                    fetchPriority="high"
                    decoding="async"
                    className="block aspect-[4/5] w-full object-cover md:aspect-auto md:h-full md:object-[70%_22%] rtl:md:-scale-x-100"
                  />
                </picture>
                {/* Blend: the scene fades into the page instead of ending on a hard edge. */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-ivory to-transparent dark:from-muted md:hidden" />
                <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-ivory via-ivory/85 to-transparent rtl:bg-gradient-to-l md:block md:w-[62%] rtl:md:right-0 rtl:md:left-auto" />
              </div>

              <div className="container relative mx-auto max-w-6xl px-4 pb-12 pt-2 md:py-28">
                <div className="max-w-md text-foreground md:text-charcoal">
                  <p className="mb-4 inline-block rounded-full bg-klovers-yellow px-3 py-1 text-xs font-semibold tracking-wide text-charcoal">
                    {tr("Learn it. Carry it. Live it.", "تعلُّمها، وحملها، وعيشها.")}
                  </p>
                  <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">
                    {tr("Pack Your Korean Journey.", "حقيبة الرحلة الكورية.")}
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-charcoal/80">
                    {tr(
                      "By the courtyard gate, Lina keeps a bag ready for the next lesson. These are the books that go in it, made to take Korean beyond the classroom.",
                      "عند بوابة الفناء، تُبقي لينا حقيبة جاهزة للدرس التالي. وهذه هي الكتب التي توضع فيها، لتمتدّ الكورية إلى ما بعد الحصة.",
                    )}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Button asChild size="lg" className="h-12 bg-klovers-yellow font-semibold text-charcoal hover:bg-klovers-yellow/90">
                      <a href="#shelf">{tr("Shop the Journey", "تصفّح المتجر")}</a>
                    </Button>
                    {liveCategories.includes("start") && (
                      <Button asChild size="lg" variant="outline" className="h-12 border-charcoal/40 bg-transparent text-foreground hover:bg-charcoal/5 md:text-charcoal">
                        <Link to="/shop/start">{tr("Explore Starter Kits", "مجموعات البداية")}</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* 2 · Shop by journey — only categories that hold a product */}
            {liveCategories.length > 0 && (
              <section className="py-12 md:py-16">
                <div className="container mx-auto max-w-6xl px-4">
                  <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{tr("Shop by journey", "حسب مرحلة الرحلة")}</h2>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {liveCategories.map((c) => {
                      const cc = CATEGORY_COPY[c];
                      return (
                        <Link
                          key={c}
                          to={`/shop/${c}`}
                          className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <BrandIcon name={cc.icon} className="h-12 w-12" />
                          <span>
                            <span className="block font-display font-semibold text-foreground">{tr(cc.title.en, cc.title.ar)}</span>
                            <span className="block text-sm text-muted-foreground">{tr(cc.line.en, cc.line.ar)}</span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 3 · The shelf */}
            <section id="shelf" className="scroll-mt-32 bg-ivory py-12 dark:bg-muted/30 md:py-16">
              <div className="container mx-auto max-w-6xl px-4">
                <h2 className="mb-6 font-display text-2xl font-bold text-foreground md:text-3xl">{tr("On the shelf", "على الرف")}</h2>
                {isError ? <ShopUnavailable isAr={isAr} /> : <ProductGrid products={all} isAr={isAr} loading={isLoading} />}
              </div>
            </section>

            {/* 3b · How it works + what it costs (store review, 30 Sep 2026) */}
            <section className="py-12 md:py-16" aria-labelledby="shop-how">
              <div className="container mx-auto max-w-6xl px-4">
                <h2 id="shop-how" className="font-display text-2xl font-bold text-foreground md:text-3xl">
                  {tr("How it works", "كيف يصل الكتاب")}
                </h2>
                <ol className="mt-6 grid gap-3 md:grid-cols-3">
                  {[
                    { n: 1, en: "Pick a book and add it to the bag.", ar: "اختيار الكتاب وإضافته إلى الحقيبة." },
                    { n: 2, en: "Pay safely by card: in Egyptian pounds inside Egypt, in US dollars everywhere else.", ar: "الدفع الآمن بالبطاقة: بالجنيه المصري داخل مصر، وبالدولار الأمريكي خارجها." },
                    { n: 3, en: "The book waits in My books at once, ready to download and print.", ar: "يصل الكتاب فورًا إلى «كتبي»، جاهزًا للتحميل والطباعة." },
                  ].map((step) => (
                    <li key={step.n} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-klovers-yellow text-sm font-extrabold text-charcoal">
                        {isAr ? String(step.n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]) : step.n}
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{tr(step.en, step.ar)}</span>
                    </li>
                  ))}
                </ol>

                {isAr && (
                  <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border-2 border-charcoal bg-ivory p-5 text-center dark:bg-card sm:flex-row sm:text-start">
                    <img src="/assets/cluby/cluby-wave.webp" alt="" width={314} height={440} loading="lazy"
                      className="h-20 w-auto shrink-0 origin-bottom motion-safe:animate-cluby-jump" />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold text-foreground">هدية من كلوبي</p>
                      <p className="text-sm text-muted-foreground">
                        كتاب التلوين «كلوبي والبيضة المضيئة» مجاني مع حساب في كلوفرز: ١٥ صفحة للأعمار من ٤ إلى ٧.
                      </p>
                    </div>
                    <Button asChild className="h-11 shrink-0 rounded-full border-2 border-charcoal bg-klovers-yellow font-bold text-charcoal hover:bg-klovers-yellow hover:brightness-95">
                      <Link to="/gift/cluby">الحصول على الكتاب مجانًا</Link>
                    </Button>
                  </div>
                )}
              </div>
            </section>

            {/* 4 · More than a file — Cluby keeps the books */}
            <section className="py-12 md:py-16">
              <div className="container mx-auto grid max-w-5xl items-center gap-8 px-4 md:grid-cols-2">
                <img
                  src="/assets/cluby/cluby-reading.webp"
                  alt={tr("Cluby reading a Klovers book", "كلوبي يقرأ كتابًا")}
                  width={480}
                  height={480}
                  loading="lazy"
                  decoding="async"
                  className="mx-auto w-full max-w-xs rounded-[28px]"
                />
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">{tr("More than a file.", "أكثر من ملف.")}</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {tr(
                      "Every Klovers book bought here waits under My books in the student dashboard, next to the classes, the games and the review that Cluby keeps.",
                      "كل كتاب يُشترى من هنا يُحفَظ ضمن «كتبي» في لوحة الطالب، بجانب الحصص والألعاب والمراجعة التي يحفظها كلوبي.",
                    )}
                  </p>
                  <p className={isAr ? "mt-4 text-sm font-semibold text-foreground" : "mt-4 font-script text-lg text-foreground"}>
                    {tr("I keep every page safe. — Cluby", "أحفظ كل صفحة. — كلوبي")}
                  </p>
                  <Button asChild variant="outline" className="mt-5 h-11">
                    <Link to="/free-trial">{tr("Book a free class", "حجز حصة مجانية")}</Link>
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
