/**
 * The downloadable books a student can be given (book_assignments.book_id).
 *
 * Each file lives in the PRIVATE `student-materials` bucket at `path`; the
 * student downloads it through a one-hour signed link from the dashboard.
 * To add a level: upload the PDF under books/, add an entry here.
 *
 * `hangul-1` (the old web book at /hangul-book) is deliberately absent: it is
 * not a file, so the dashboard card skips it.
 */
export const BOOKS = {
  "hangul-a0": {
    path: "books/hangul-a0.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الكتاب الكوري للمبتدئين — المستوى A0",
    titleEn: "Korean for Beginners — Level A0",
    subtitleAr: "تمهيد الهانغُل · 5 حصص",
    subtitleEn: "Hangul primer · 5 classes",
  },
} as const;

export type BookId = keyof typeof BOOKS;
