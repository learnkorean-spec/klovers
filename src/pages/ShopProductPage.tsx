/**
 * Klovers shop — one product, /shop/products/:slug (27 Sep 2026).
 * Data, price and availability come from Stripe via useShopProducts().
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/shop/ProductCard";
import { ShopBar } from "@/pages/ShopPage";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { capture } from "@/lib/analytics";
import {
  cartActions, formatPrice, productDescription, productName, useCart, useShopProducts, visibleIn,
} from "@/lib/shop";

export default function ShopProductPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const { slug = "" } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useShopProducts();
  const cart = useCart();
  const [imageIndex, setImageIndex] = useState(0);

  const product = useMemo(
    () => (data ?? []).find((p) => (p.slug === slug || p.id === slug) && visibleIn(p, isAr)),
    [data, slug, isAr],
  );
  const related = useMemo(
    () => (data ?? []).filter((p) => p.id !== product?.id && p.category && p.category === product?.category && visibleIn(p, isAr)).slice(0, 4),
    [data, product, isAr],
  );
  const inBag = !!product && cart.some((l) => l.priceId === product.price.id);
  const canonical = `https://kloversegy.com/shop/products/${product?.slug ?? slug}`;
  const name = product ? productName(product, isAr) : "";
  const description = product ? productDescription(product, isAr) : null;

  useSEO({
    title: product ? tr(`${name} · Klovers Supply`, `${name} · متجر محبي الكورية`) : tr("Klovers Supply", "متجر محبي الكورية"),
    description: description?.slice(0, 155) || undefined,
    canonical,
    ogImage: product?.images[0],
    noindex: !isLoading && !product,
  });

  // Product structured data, from the live Stripe price only.
  useEffect(() => {
    if (!product) return;
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.dataset.shopProduct = "true";
    el.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name,
      ...(description ? { description } : {}),
      ...(product.images.length ? { image: product.images } : {}),
      brand: { "@type": "Brand", name: "Klovers" },
      url: canonical,
      offers: {
        "@type": "Offer",
        price: (product.price.amount / 100).toFixed(2),
        priceCurrency: product.price.currency.toUpperCase(),
        availability: "https://schema.org/InStock",
        url: canonical,
      },
    });
    document.head.appendChild(el);
    capture({ event: "product_view", productId: product.id, price: product.price.amount / 100, currency: product.price.currency });
    return () => el.remove();
  }, [product, name, description, canonical]);

  const add = () => {
    if (!product) return;
    cartActions.add(product);
    capture({ event: "add_to_cart", productId: product.id, price: product.price.amount / 100, currency: product.price.currency });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        <ShopBar isAr={isAr} products={data ?? []} />
        <div className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
          <nav aria-label={tr("Breadcrumb", "مسار الصفحة")} className="mb-6 text-sm text-muted-foreground">
            <Link to="/shop" className="hover:text-foreground hover:underline">{tr("Shop", "المتجر")}</Link>
            {product && (<><span aria-hidden="true" className="mx-2">/</span><span className="text-foreground">{name}</span></>)}
          </nav>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2">
              <Skeleton className="aspect-[4/5] rounded-2xl" />
              <div className="space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-1/4" /><Skeleton className="h-24 w-full" /></div>
            </div>
          ) : !product ? (
            <div role="status" className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
              <h1 className="font-display text-2xl font-bold text-foreground">
                {isError ? tr("The shop is taking a short break.", "المتجر يستريح قليلًا.") : tr("This item is not on the shelf.", "هذا المنتج غير موجود على الرف.")}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isError ? tr("Please come back in a few minutes.", "يُرجى العودة بعد دقائق.") : tr("It may have sold out or moved.", "ربما نفد أو نُقل إلى مكان آخر.")}
              </p>
              <Button asChild className="mt-6 h-11"><Link to="/shop">{tr("Back to the shop", "العودة إلى المتجر")}</Link></Button>
            </div>
          ) : (
            <>
              <div className="grid gap-8 md:grid-cols-2 md:gap-12">
                {/* Gallery */}
                <div>
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-ivory dark:bg-muted">
                    {product.images[imageIndex] && (
                      <img
                        src={product.images[imageIndex]}
                        alt={name}
                        width={800}
                        height={1000}
                        loading="eager"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  {product.images.length > 1 && (
                    <div className="mt-3 flex gap-2">
                      {product.images.map((src, i) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setImageIndex(i)}
                          aria-label={tr(`Show image ${i + 1}`, `عرض الصورة ${i + 1}`)}
                          aria-pressed={i === imageIndex}
                          className={`h-20 w-16 overflow-hidden rounded-lg border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${i === imageIndex ? "border-charcoal dark:border-ivory" : "border-transparent"}`}
                        >
                          <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                  {product.bookId && (
                    <span className="mb-3 w-fit rounded-full bg-klovers-yellow px-3 py-1 text-xs font-semibold text-charcoal">
                      {tr("Digital book", "كتاب رقمي")}
                    </span>
                  )}
                  <h1 className="font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">{name}</h1>
                  <p className="mt-3 text-2xl font-semibold text-foreground">
                    {formatPrice(product.price.amount, product.price.currency, isAr)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.bookId
                      ? tr("Available now. After payment the book is added to My books in the student dashboard.", "متوفر الآن. بعد الدفع يُضاف الكتاب إلى «كتبي» في لوحة الطالب.")
                      : tr("Available now.", "متوفر الآن.")}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Button className="h-12 flex-1 text-base font-semibold" onClick={add} disabled={inBag}>
                      {inBag ? tr("In your bag", "موجود في الحقيبة") : tr("Add to bag", "إضافة إلى الحقيبة")}
                    </Button>
                  </div>

                  {description && (
                    <div className="mt-8 border-t border-border pt-6">
                      <h2 className="mb-2 font-display text-lg font-semibold text-foreground">{tr("About this item", "عن المنتج")}</h2>
                      <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{description}</p>
                    </div>
                  )}
                </div>
              </div>

              {related.length > 0 && (
                <section className="mt-14">
                  <h2 className="mb-5 font-display text-xl font-bold text-foreground">{tr("From the same shelf", "من الرف نفسه")}</h2>
                  <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                    {related.map((p) => <ProductCard key={p.id} product={p} isAr={isAr} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
