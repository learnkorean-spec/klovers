/**
 * shop-products — the public catalogue for kloversegy.com/shop (27 Sep 2026).
 *
 * Stripe is the only place products live: Re adds a product in the Stripe
 * dashboard and it appears on the site. Nothing about a product (name,
 * price, image) is written in this repo.
 *
 * A Stripe product is in the shop when its metadata has:
 *   klovers_shop = true        required
 *   category     = start | study | carry | play | collect | gift | <any>
 *   slug         = hangul-starter-a0   the page address /shop/products/<slug>
 *                              (optional; the Stripe product id is used without it)
 *   book_id      = hangul-a0   PDF delivered to "My books" (src/constants/books.ts)
 *   name_ar / description_ar   the Arabic copy; without name_ar the product
 *                              is not shown on the Arabic shop (one language
 *                              per page)
 *   lang         = ar | en     optional: show on one language only
 *   ships        = true        physical item — hidden until shipping is set up
 *
 * Price: the product's default price in Stripe. A product without an active
 * default price is not shown (never an invented price).
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const ALLOWED_ORIGINS = ["https://kloversegy.com", "https://www.kloversegy.com"];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  images: string[];
  category: string | null;
  bookId: string | null;
  lang: "ar" | "en" | null;
  price: { id: string; amount: number; currency: string };
}

function toShopProduct(p: Stripe.Product): ShopProduct | null {
  const m = p.metadata ?? {};
  if (!p.active || m.klovers_shop !== "true") return null;
  if (m.ships === "true") return null; // bags later: no shipping set up yet
  const price = p.default_price;
  if (!price || typeof price === "string" || !price.active || price.unit_amount == null) return null;
  return {
    id: p.id,
    slug: m.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || p.id,
    name: p.name,
    nameAr: m.name_ar?.trim() || null,
    description: p.description ?? null,
    descriptionAr: m.description_ar?.trim() || null,
    images: p.images ?? [],
    category: m.category?.trim().toLowerCase() || null,
    bookId: m.book_id?.trim() || null,
    lang: m.lang === "ar" || m.lang === "en" ? m.lang : null,
    price: { id: price.id, amount: price.unit_amount, currency: price.currency },
  };
}

serve(async (req) => {
  const headers = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers });

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
    const products: ShopProduct[] = [];
    for await (const p of stripe.products.list({ active: true, limit: 100, expand: ["data.default_price"] })) {
      const sp = toShopProduct(p);
      if (sp) products.push(sp);
    }
    return new Response(JSON.stringify({ products }), {
      headers: {
        ...headers,
        "Content-Type": "application/json",
        // The catalogue changes rarely; five minutes keeps Stripe calls low.
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  } catch (err) {
    console.error("[shop-products]", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "unavailable" }), {
      status: 503,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
