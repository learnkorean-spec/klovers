/**
 * The downloadable books a student can be given (book_assignments.book_id).
 *
 * Each file lives in the PRIVATE `student-materials` bucket at `path`; the
 * student downloads it through a one-hour signed link from the dashboard.
 * To add a level: upload the PDF under books/, add an entry here.
 *
 * Each level has one book per class language: Arabic groups get the Arabic
 * edition, English groups the English one (app_private.level_book_id picks
 * it from schedule_packages.class_language when a group starts).
 *
 * `hangul-1` (the old web book at /hangul-book, removed 27 Sep 2026) is
 * deliberately absent: it is not a file, so the dashboard card skips it.
 *
 * `use` sorts the admin Books library (28 Sep 2026):
 *   teaching — level books, a free gift when a group starts
 *   store    — store editions sold in /shop (a Stripe product's book_id);
 *              same content, written for self-study, answer key open,
 *              licence = personal use of the buyer
 *   free     — trial-class guides
 */
export const BOOKS = {
  "hangul-a0": {
    use: "teaching",
    lang: "ar",
    path: "books/hangul-a0.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الكتاب الكوري للمبتدئين — المستوى A0",
    titleEn: "Korean for Beginners — Level A0",
    subtitleAr: "تمهيد الهانغُل · 4 حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "hangul-a0-en": {
    use: "teaching",
    lang: "en",
    path: "books/hangul-a0-en.pdf",
    fileName: "Klovers-A0-Hangul-English.pdf",
    badge: "A0",
    titleAr: "الكتاب الكوري للمبتدئين — المستوى A0 (النسخة الإنجليزية)",
    titleEn: "Korean for Beginners — Level A0 (English edition)",
    subtitleAr: "تمهيد الهانغُل · 4 حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "book-1": {
    use: "teaching",
    lang: "ar",
    path: "books/book-1.pdf",
    fileName: "Klovers-Level-1-Korean.pdf",
    badge: "1",
    titleAr: "الكورية: أول محادثة — المستوى 1",
    titleEn: "Korean: First Conversation — Level 1 (Arabic edition)",
    subtitleAr: "سوق المفردات · 24 حصة",
    subtitleEn: "Vocabulary Market · 24 classes",
  },
  "trial-guide-ar": {
    use: "free",
    lang: "ar",
    path: "books/trial-guide-ar.pdf",
    fileName: "Klovers-Trial-Guide-AR.pdf",
    badge: "دليل",
    titleAr: "دليل الحصة التجريبية",
    titleEn: "Trial class guide (Arabic)",
    subtitleAr: "ما يحدث في الحصة التجريبية · 7 صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
  "trial-guide-en": {
    use: "free",
    lang: "en",
    path: "books/trial-guide-en.pdf",
    fileName: "Klovers-Trial-Guide-EN.pdf",
    badge: "Guide",
    titleAr: "دليل الحصة التجريبية (النسخة الإنجليزية)",
    titleEn: "Trial class guide",
    subtitleAr: "ما يحدث في الحصة التجريبية · 7 صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
  "hangul-a0-store": {
    use: "store",
    lang: "ar",
    path: "books/hangul-a0-store.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر — المستوى A0",
    titleEn: "Hangeul from Zero — Level A0 (store, Arabic)",
    subtitleAr: "نسخة الدراسة الذاتية · 78 صفحة",
    subtitleEn: "Self-study edition · 78 pages",
  },
  "hangul-a0-en-store": {
    use: "store",
    lang: "en",
    path: "books/hangul-a0-en-store.pdf",
    fileName: "Klovers-A0-Hangeul-English.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر — المستوى A0 (النسخة الإنجليزية)",
    titleEn: "Hangeul from Zero — Level A0 (store, English)",
    subtitleAr: "نسخة الدراسة الذاتية · 78 صفحة",
    subtitleEn: "Self-study edition · 78 pages",
  },
} as const;

export type BookId = keyof typeof BOOKS;

/** Cover thumbnails (300×388 WebP, ~12 KB) in the public marketing-images bucket —
 *  the cover is not secret; the book itself stays private. */
const COVER_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/storage/v1/object/public/marketing-images";
export const BOOK_COVERS: Record<BookId, string> = {
  "hangul-a0": `${COVER_BASE}/hangul-a0-cover.webp`,
  "hangul-a0-en": `${COVER_BASE}/hangul-a0-en-cover.webp`,
  "book-1": `${COVER_BASE}/book-1-cover.webp`,
  "trial-guide-ar": `${COVER_BASE}/trial-guide-ar-cover.webp`,
  "trial-guide-en": `${COVER_BASE}/trial-guide-en-cover.webp`,
  // Store editions share the student editions' covers.
  "hangul-a0-store": `${COVER_BASE}/hangul-a0-cover.webp`,
  "hangul-a0-en-store": `${COVER_BASE}/hangul-a0-en-cover.webp`,
};
