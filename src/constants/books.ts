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
 */
export const BOOKS = {
  "hangul-a0": {
    path: "books/hangul-a0.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الكتاب الكوري للمبتدئين — المستوى A0",
    titleEn: "Korean for Beginners — Level A0",
    subtitleAr: "تمهيد الهانغُل · 4 حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "hangul-a0-en": {
    path: "books/hangul-a0-en.pdf",
    fileName: "Klovers-A0-Hangul-English.pdf",
    badge: "A0",
    titleAr: "الكتاب الكوري للمبتدئين — المستوى A0 (النسخة الإنجليزية)",
    titleEn: "Korean for Beginners — Level A0 (English edition)",
    subtitleAr: "تمهيد الهانغُل · 4 حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "trial-guide-ar": {
    path: "books/trial-guide-ar.pdf",
    fileName: "Klovers-Trial-Guide-AR.pdf",
    badge: "دليل",
    titleAr: "دليل الحصة التجريبية",
    titleEn: "Trial class guide (Arabic)",
    subtitleAr: "ما يحدث في الحصة التجريبية · 7 صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
  "trial-guide-en": {
    path: "books/trial-guide-en.pdf",
    fileName: "Klovers-Trial-Guide-EN.pdf",
    badge: "Guide",
    titleAr: "دليل الحصة التجريبية (النسخة الإنجليزية)",
    titleEn: "Trial class guide",
    subtitleAr: "ما يحدث في الحصة التجريبية · 7 صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
} as const;

export type BookId = keyof typeof BOOKS;
