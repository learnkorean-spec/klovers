/**
 * What the shop shows beyond Stripe's name/price/photo (30 Sep 2026, store
 * review): quick facts, inside-page previews and the Cluby gift flag, keyed by
 * the product's book_id. Facts must stay true to the file (page counts, ages);
 * change them here when a book changes.
 */
export interface ShopExtras {
  facts: { en: string; ar: string }[];
  /** Inside pages shipped with the site (public/book-previews), shown after the Stripe photos. */
  previews?: string[];
  /** Free through Cluby's gift (/gift/cluby) for any account. */
  gift?: boolean;
}

export const SHOP_EXTRAS: Record<string, ShopExtras> = {
  "cluby-coloring-1": {
    facts: [
      { en: "15 printable pages", ar: "١٥ صفحة للطباعة" },
      { en: "Ages 4–7", ar: "للأعمار من ٤ إلى ٧" },
      { en: "Arabic story", ar: "قصة بالعربية" },
      { en: "2 Korean words to trace", ar: "كلمتان كوريتان للكتابة" },
    ],
    previews: [1, 2, 3, 4].map((n) => `/book-previews/cluby-coloring-1-${n}.webp`),
    gift: true,
  },
  "hangul-a0-store": {
    facts: [
      { en: "78 pages", ar: "٧٨ صفحة" },
      { en: "Self-study edition", ar: "نسخة للدراسة الذاتية" },
      { en: "Answer key included", ar: "مفتاح الإجابات في آخر الكتاب" },
    ],
  },
  "hangul-a0-en-store": {
    facts: [
      { en: "78 pages", ar: "٧٨ صفحة" },
      { en: "Self-study edition", ar: "نسخة للدراسة الذاتية" },
      { en: "Answer key included", ar: "مفتاح الإجابات في آخر الكتاب" },
    ],
  },
  "hangul-starter": {
    facts: [
      { en: "5 pages", ar: "٥ صفحات" },
      { en: "Free download", ar: "تحميل مجاني" },
    ],
  },
};

export function shopExtras(bookId: string | null | undefined): ShopExtras | null {
  return bookId ? SHOP_EXTRAS[bookId] ?? null : null;
}

/**
 * Every picture of a product for this page language: Stripe photos first, then
 * inside-page previews. The free Hangul sheet has no Stripe photo, so its cover
 * comes from the site in the page's own language (one language per page).
 */
export function productImages(p: { bookId: string | null; images: string[] }, isAr: boolean): string[] {
  const base = p.bookId === "hangul-starter" && p.images.length === 0
    ? [`/assets/shop/hangul-sheet-cover-${isAr ? "ar" : "en"}.webp`]
    : p.images;
  return [...base, ...(shopExtras(p.bookId)?.previews ?? [])];
}
