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
 *   topik    — official TOPIK past papers (NIIED), kept for teachers and for
 *              TOPIK practice; assigned to a student by hand only
 *
 * `titleAr` / `titleEn` are the titles PRINTED ON THE COVER, not descriptions
 * of the book. Four of them drifted and were corrected on 6 Oct 2026: the A0
 * teaching pair said "الكتاب الكوري للمبتدئين" while their covers say
 * "الهانغُل من الصفر", and the trial pair said "دليل الحصة التجريبية" while
 * their covers say "حصتك التجريبية" / "Your First Korean Class". A student
 * reading a title here that is not the title on the file they downloaded has
 * no way to tell the two apart. The store editions were already right, which
 * is how the drift was found. If a cover is restyled, this is the second
 * place to update.
 */
export const BOOKS = {
  "hangul-a0": {
    use: "teaching",
    lang: "ar",
    path: "books/hangul-a0.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر: المستوى A0",
    titleEn: "Hangeul from Zero: Level A0 (Arabic edition)",
    subtitleAr: "تمهيد الهانغُل · ٤ حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "hangul-a0-en": {
    use: "teaching",
    lang: "en",
    path: "books/hangul-a0-en.pdf",
    fileName: "Klovers-A0-Hangul-English.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر: المستوى A0 (النسخة الإنجليزية)",
    titleEn: "Hangeul from Zero: Level A0",
    subtitleAr: "تمهيد الهانغُل · ٤ حصص",
    subtitleEn: "Hangul primer · 4 classes",
  },
  "book-1": {
    use: "teaching",
    lang: "ar",
    path: "books/book-1.pdf",
    fileName: "Klovers-Level-1-Korean.pdf",
    badge: "1",
    titleAr: "الكورية: أول محادثة، المستوى ١",
    titleEn: "Korean: First Conversation, Level 1 (Arabic edition)",
    subtitleAr: "سوق المفردات · ٢٤ حصة",
    subtitleEn: "Vocabulary Market · 24 classes",
  },
  "book-2": {
    use: "teaching",
    lang: "ar",
    path: "books/book-2.pdf",
    fileName: "Klovers-Level-2-Korean.pdf",
    badge: "2",
    titleAr: "الكوريّة: مقهى المحادثة، المستوى ٢",
    titleEn: "Korean: Conversation Café, Level 2 (Arabic edition)",
    subtitleAr: "مقهى المحادثة · ٢٤ حصة",
    subtitleEn: "Conversation Café · 24 classes",
  },
  "book-2-en": {
    use: "teaching",
    lang: "en",
    path: "books/book-2-en.pdf",
    fileName: "Klovers-Level-2-Korean-English.pdf",
    badge: "2",
    titleAr: "الكوريّة: مقهى المحادثة، المستوى ٢ (النسخة الإنجليزية)",
    titleEn: "Korean: Conversation Café, Level 2",
    subtitleAr: "مقهى المحادثة · ٢٤ حصة",
    subtitleEn: "Conversation Café · 24 classes",
  },
  "trial-guide-ar": {
    use: "free",
    lang: "ar",
    path: "books/trial-guide-ar.pdf",
    fileName: "Klovers-Trial-Guide-AR.pdf",
    badge: "دليل",
    titleAr: "حصتك التجريبية",
    titleEn: "Your First Korean Class (Arabic edition)",
    subtitleAr: "ما يحدث في الحصة التجريبية · ٧ صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
  "trial-guide-en": {
    use: "free",
    lang: "en",
    path: "books/trial-guide-en.pdf",
    fileName: "Klovers-Trial-Guide-EN.pdf",
    badge: "Guide",
    titleAr: "حصتك التجريبية (النسخة الإنجليزية)",
    titleEn: "Your First Korean Class",
    subtitleAr: "ما يحدث في الحصة التجريبية · ٧ صفحات",
    subtitleEn: "What happens in the trial class · 7 pages",
  },
  "hangul-a0-store": {
    use: "store",
    lang: "ar",
    path: "books/hangul-a0-store.pdf",
    fileName: "Klovers-A0-Hangul.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر: المستوى A0",
    titleEn: "Hangeul from Zero: Level A0 (store, Arabic)",
    subtitleAr: "نسخة الدراسة الذاتية · ٧١ صفحة",
    subtitleEn: "Self-study edition · 71 pages",
  },
  "hangul-a0-en-store": {
    use: "store",
    lang: "en",
    path: "books/hangul-a0-en-store.pdf",
    fileName: "Klovers-A0-Hangeul-English.pdf",
    badge: "A0",
    titleAr: "الهانغُل من الصفر: المستوى A0 (النسخة الإنجليزية)",
    titleEn: "Hangeul from Zero: Level A0 (store, English)",
    subtitleAr: "نسخة الدراسة الذاتية · ٧١ صفحة",
    subtitleEn: "Self-study edition · 71 pages",
  },
  "cluby-coloring-1": {
    use: "store",
    lang: "ar",
    path: "books/cluby-coloring-1.pdf",
    fileName: "Klovers-Cluby-Coloring-Book-1.pdf",
    badge: "تلوين",
    titleAr: "كلوبي والبيضة المضيئة: كتاب تلوين",
    titleEn: "Cluby and the Glowing Egg: colouring book 1 (Arabic)",
    subtitleAr: "قصة وتلوين للأعمار ٤–٧ · ١٥ صفحة",
    subtitleEn: "Story colouring book, ages 4–7 · 15 pages",
  },
  "topik-i-91-reading": {
    use: "topik",
    lang: "ko",
    path: "books/topik-i-91-reading.pdf",
    fileName: "TOPIK-I-91-Reading.pdf",
    badge: "TOPIK",
    titleAr: "توبيك ١: القراءة، الامتحان ٩١",
    titleEn: "TOPIK I: Reading, test 91",
    subtitleAr: "امتحان سابق رسمي · الأسئلة ٣١–٧٠ · ١٧ صفحة",
    subtitleEn: "Official past paper · questions 31–70 · 17 pages",
  },
  "topik-i-96-reading": {
    use: "topik",
    lang: "ko",
    path: "books/topik-i-96-reading.pdf",
    fileName: "TOPIK-I-96-Reading.pdf",
    badge: "TOPIK",
    titleAr: "توبيك ١: القراءة، الامتحان ٩٦",
    titleEn: "TOPIK I: Reading, test 96",
    subtitleAr: "امتحان سابق رسمي · الأسئلة ٣١–٧٠ · ١٧ صفحة",
    subtitleEn: "Official past paper · questions 31–70 · 17 pages",
  },
  "topik-i-102-reading": {
    use: "topik",
    lang: "ko",
    path: "books/topik-i-102-reading.pdf",
    fileName: "TOPIK-I-102-Reading.pdf",
    badge: "TOPIK",
    titleAr: "توبيك ١: القراءة، الامتحان ١٠٢",
    titleEn: "TOPIK I: Reading, test 102",
    subtitleAr: "امتحان سابق رسمي · الأسئلة ٣١–٧٠ · ١٩ صفحة",
    subtitleEn: "Official past paper · questions 31–70 · 19 pages",
  },
} as const;

export type BookId = keyof typeof BOOKS;

/**
 * Cover thumbnails (300px wide WebP, ~20 KB), shipped with the site.
 *
 * These were remade on 5 Oct 2026 from the restyled covers. The range was put
 * on one cover template on 1 Oct, but these thumbnails still pointed at the
 * pre-restyle files in the marketing-images bucket — so Admin -> Book Plan
 * showed the new aligned covers while the shop shelf, the Books screen and a
 * student's My Books all showed the old mismatched ones. Re spotted it from
 * the shelf.
 *
 * They are generated from public/picture-library/scenes/cover_*.jpg, which is
 * where a restyled cover lands first. Restyle a cover and this is the second
 * place to update; nothing derives it automatically.
 */
export const BOOK_COVERS: Record<BookId, string> = {
  "hangul-a0": "/book-covers/hangul-a0.webp",
  "hangul-a0-en": "/book-covers/hangul-a0-en.webp",
  "book-1": "/book-covers/book-1.webp",
  "book-2": "/book-covers/book-2.webp",
  "book-2-en": "/book-covers/book-2-en.webp",
  "trial-guide-ar": "/book-covers/trial-guide-ar.webp",
  "trial-guide-en": "/book-covers/trial-guide-en.webp",
  // Store editions share the student editions' covers.
  "hangul-a0-store": "/book-covers/hangul-a0.webp",
  "hangul-a0-en-store": "/book-covers/hangul-a0-en.webp",
  // Colouring books: covers shipped with the site.
  "cluby-coloring-1": "/book-covers/cluby-coloring-1.webp",
  // TOPIK past papers: plain Klovers thumbnails shipped with the site.
  "topik-i-91-reading": "/book-covers/topik-i-91.webp",
  "topik-i-96-reading": "/book-covers/topik-i-96.webp",
  "topik-i-102-reading": "/book-covers/topik-i-102.webp",
};
