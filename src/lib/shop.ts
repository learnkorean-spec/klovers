/**
 * Klovers shop — client side (27 Sep 2026).
 *
 * Products, prices and payments all live in Stripe; this file only asks the
 * two edge functions for them:
 *   shop-products  → the catalogue (Stripe products with klovers_shop=true)
 *   shop-checkout  → a Stripe Checkout page for the cart (signed-in buyers), or
 *                    straight download links when everything in it is free
 * The metadata a Stripe product needs is documented in
 * supabase/functions/shop-products/index.ts.
 *
 * Only /shop routes import this module, so no other page pays for it.
 */
import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { localPrice, shopCurrency, type ShopPrice } from "@/lib/shopCurrency";

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
  /** Already in the visitor's currency (USD, or EGP in Egypt): see src/lib/shopCurrency.ts. */
  price: ShopPrice;
}

/** The journey categories, in order. A category shows only once it has products. */
export const SHOP_CATEGORIES = ["start", "study", "carry", "play", "collect", "gift"] as const;

/** Is this product sold on the page in this language (one language per page)? */
export function visibleIn(p: ShopProduct, isAr: boolean): boolean {
  if (isAr) return p.lang !== "en" && !!p.nameAr;
  return p.lang !== "ar";
}

export function productName(p: ShopProduct, isAr: boolean) {
  return isAr ? (p.nameAr as string) : p.name;
}

export function productDescription(p: ShopProduct, isAr: boolean) {
  return isAr ? p.descriptionAr : p.description;
}

export function formatPrice(amount: number, currency: string, isAr: boolean) {
  // A price of 0 is a free item (no card, no account): say so in words.
  if (amount === 0) return isAr ? "مجاني" : "Free";
  try {
    return new Intl.NumberFormat(isAr ? "ar-EG" : "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      // Arabic pages carry no Latin letters, so the currency is written out.
      currencyDisplay: isAr ? "name" : "symbol",
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export async function fetchShopProducts(): Promise<ShopProduct[]> {
  const { data, error } = await supabase.functions.invoke("shop-products", { method: "GET" });
  if (error || !data || !Array.isArray(data.products)) throw new Error("shop_unavailable");
  // The free Hangul sheet has no Stripe photo: show its own cover from the site.
  return (data.products as ShopProduct[]).map((p0) => {
    // Every price on the page is in the visitor's currency: USD, or EGP in Egypt.
    const p = { ...p0, price: localPrice(p0.price) };
    return p.bookId === "hangul-starter" && p.images.length === 0
      ? { ...p, images: [`${window.location.origin}/assets/shop/hangul-sheet-cover-${document.documentElement.lang === "en" ? "en" : "ar"}.webp`] }
      : p;
  });
}

/** The catalogue, shared by every /shop page and cached for five minutes. */
export function useShopProducts() {
  return useQuery({ queryKey: ["shop-products"], queryFn: fetchShopProducts, staleTime: 5 * 60_000, retry: 1 });
}

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: true; free: true; downloads: { bookId: string; url: string }[]; signedIn: boolean }
  | { ok: false; reason: "sign_in" | "owned" | "unavailable" };

export async function startCheckout(lines: CartLine[]): Promise<CheckoutResult> {
  const { data, error } = await supabase.functions.invoke("shop-checkout", {
    body: {
      items: lines.map((l) => ({ priceId: l.priceId, quantity: l.quantity })),
      lang: typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ar",
      // Charge in the currency the shop showed (USD, or EGP in Egypt).
      currency: shopCurrency(),
    },
  });
  if (data?.free && Array.isArray(data.downloads)) {
    return { ok: true, free: true, downloads: data.downloads, signedIn: !!data.signedIn };
  }
  if (data?.url) return { ok: true, url: data.url as string };
  // functions.invoke hides the JSON body of a non-2xx reply inside error.context.
  let reason: string | undefined = data?.error;
  if (!reason && error && "context" in error) {
    try { reason = (await (error.context as Response).json())?.error; } catch { /* keep undefined */ }
  }
  if (reason === "sign_in" || reason === "owned") return { ok: false, reason };
  return { ok: false, reason: "unavailable" };
}

// ─── Cart: a small store kept in this browser ────────────────────────────────

export interface CartLine {
  priceId: string;
  productId: string;
  quantity: number;
}

const CART_KEY = "kl_shop_cart";
let cart: CartLine[] = readCart();
const listeners = new Set<() => void>();

function readCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.priceId === "string") : [];
  } catch {
    return [];
  }
}

function writeCart(next: CartLine[]) {
  cart = next;
  try { localStorage.setItem(CART_KEY, JSON.stringify(next)); } catch { /* memory only */ }
  listeners.forEach((l) => l());
}

export const cartActions = {
  /** A book is one copy per buyer, so its quantity stays at 1. */
  add(p: ShopProduct, quantity = 1) {
    const existing = cart.find((l) => l.priceId === p.price.id);
    if (existing) {
      const q = p.bookId ? 1 : Math.min(existing.quantity + quantity, 10);
      writeCart(cart.map((l) => (l.priceId === p.price.id ? { ...l, quantity: q } : l)));
    } else {
      writeCart([...cart, { priceId: p.price.id, productId: p.id, quantity: p.bookId ? 1 : Math.min(quantity, 10) }]);
    }
  },
  setQuantity(priceId: string, quantity: number) {
    if (quantity <= 0) return cartActions.remove(priceId);
    writeCart(cart.map((l) => (l.priceId === priceId ? { ...l, quantity: Math.min(quantity, 10) } : l)));
  },
  remove(priceId: string) {
    writeCart(cart.filter((l) => l.priceId !== priceId));
  },
  clear() {
    writeCart([]);
  },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => cart,
    () => cart,
  );
}
