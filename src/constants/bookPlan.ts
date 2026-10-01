/**
 * The Klovers book plan — what exists, what is half-built, and the rules any
 * new book follows.
 *
 * This is the data behind Admin → Book Plan. It is deliberately a constant and
 * not a database table: these are editorial decisions that change a few times a
 * month and are reviewed in a pull request, not operational state.
 *
 * Keep it honest. A book listed as `done` here is one Re can hand a student
 * today. If a book is half-built, say which classes are in it — a cell that
 * reads "in progress" for months is how a shelf rots without anyone noticing.
 *
 * Covers come from the picture library (public/picture-library/scenes), so a
 * restyled cover shows up here the moment it is saved there.
 */

export type BookState = "done" | "partial" | "missing";

export interface PlannedBook {
  /** Picture-library file name, without extension. Omit for a book with no cover yet. */
  cover?: string;
  titleAr: string;
  /** One line: classes, pages, what it is. */
  noteAr: string;
  state: BookState;
  /** Short status word shown on the card. */
  statusAr: string;
  /** Its entry in BOOKS (src/constants/books.ts), when it has one. */
  bookId?: string;
}

export const BOOK_SHELF: PlannedBook[] = [
  {
    cover: "cover_hangul_starter",
    titleAr: "ورقة الهانغُل",
    noteAr: "مجانية · ٥ صفحات · صفحة جذب",
    state: "done",
    statusAr: "منشورة",
  },
  {
    cover: "cover_trial_ar",
    titleAr: "دليل الحصة التجريبية · عربي",
    noteAr: "مجاني · ٧ صفحات",
    state: "done",
    statusAr: "منشور",
    bookId: "trial-guide-ar",
  },
  {
    cover: "cover_trial_en",
    titleAr: "دليل الحصة التجريبية · إنجليزي",
    noteAr: "مجاني · ٧ صفحات",
    state: "done",
    statusAr: "منشور",
    bookId: "trial-guide-en",
  },
  {
    cover: "cover_a0_ar",
    titleAr: "الهانغُل من الصفر · عربي",
    noteAr: "٤ حصص · ٨٤ صفحة",
    state: "done",
    statusAr: "منشور",
    bookId: "hangul-a0",
  },
  {
    cover: "cover_a0_en",
    titleAr: "الهانغُل من الصفر · إنجليزي",
    noteAr: "٤ حصص · ٨٤ صفحة",
    state: "done",
    statusAr: "منشور",
    bookId: "hangul-a0-en",
  },
  {
    cover: "cover_b1",
    titleAr: "المستوى ١ · سوق المفردات",
    noteAr: "٢٤ حصة · القواعد ١–٣٢ · ١٨٦ صفحة",
    state: "done",
    statusAr: "مكتمل",
    bookId: "book-1",
  },
  {
    cover: "cover_b2",
    titleAr: "المستوى ٢ · مقهى المحادثة",
    noteAr: "١٢ حصة من ٢٤ · القواعد ٣٣–٥١ · ١٣٨ صفحة",
    state: "partial",
    statusAr: "نصف مبنيّ",
  },
  {
    titleAr: "المستوى ٣",
    noteAr: "٢٤ حصة · توزيع القواعد لم يُحدَّد",
    state: "missing",
    statusAr: "لم يُبدأ",
  },
];

export interface PlannedLevel {
  nameAr: string;
  /** TOPIK band, or null for Hangul, which sits before the ladder. */
  topik: number | null;
  classes: number;
  statusAr: string;
  state: BookState;
}

export const BOOK_LADDER: PlannedLevel[] = [
  { nameAr: "تأسيس الهانغول", topik: null, classes: 4, statusAr: "منشور", state: "done" },
  { nameAr: "المستوى الأول", topik: 1, classes: 24, statusAr: "مكتمل", state: "done" },
  { nameAr: "المستوى الثاني", topik: 2, classes: 24, statusAr: "١٢ حصة من ٢٤", state: "partial" },
  { nameAr: "المستوى الثالث", topik: 3, classes: 24, statusAr: "لم يُبدأ", state: "missing" },
  { nameAr: "المستوى الرابع", topik: 4, classes: 24, statusAr: "لم يُبدأ", state: "missing" },
  { nameAr: "المستوى الخامس", topik: 5, classes: 24, statusAr: "لم يُبدأ", state: "missing" },
  { nameAr: "المستوى السادس", topik: 6, classes: 24, statusAr: "لم يُبدأ", state: "missing" },
];

/** Where each review falls inside a 24-class level. */
export const REVIEW_CLASSES = [6, 12, 18, 24];

/** Grammar ranges that are actually decided. Levels 3–6 are deliberately absent. */
export const GRAMMAR_RANGES = [
  { levelAr: "المستوى الأول", rangeAr: "القواعد ١ إلى ٣٢", sourceAr: "ترتيب سيجونغ ١" },
  { levelAr: "المستوى الثاني", rangeAr: "القواعد ٣٣ إلى ٦٥", sourceAr: "ترتيب سيجونغ ٢" },
];

export interface PlanRule {
  titleAr: string;
  pointsAr: string[];
}

/**
 * The standing rules. Every one of these was a mistake first — keep the reason
 * attached, because a rule without its reason gets "simplified" away.
 */
export const BOOK_RULES: PlanRule[] = [
  {
    titleAr: "الغلاف",
    pointsAr: [
      "هيكل واحد لكل الكتب: شعار K مدموج مع فقاعة المستوى، العنوان ذائب في الصورة، شريحة صفراء، فوتر",
      "فقاعة المستوى برقم لاتيني — الصفر العربي «٠» نقطة ويُقرأ كعيب طباعة في حجم الـthumbnail",
      "صورة مختلفة لكل كتاب، لا تتكرّر بين غلافين",
      "قرص «مجانًا» بلغة الغلاف نفسه — عربي على العربي وFREE على الإنجليزي",
    ],
  },
  {
    titleAr: "الصفحات",
    pointsAr: [
      "الماركر النيون الأخضر خط رفيع تحت الكلمة المهمة وحدها، لا خلف عنوان ولا شريحة",
      "كلوبي مرة واحدة في الحصة، لا بجانب كل ملاحظة",
      "الكوري من اليسار والرقم على اليسار · الأرقام هندية",
      "لا خلط بين العربية والإنجليزية في كتاب واحد",
      "النسخ الإنجليزية بخط Poppins، والعربية بخط Cairo",
    ],
  },
  {
    titleAr: "حدّ تقني لا يُنسى",
    pointsAr: [
      "أي تدرّج لوني CSS فوق صورة يُحوِّله كروميوم إلى soft mask، وبعض عارضات الـPDF ترسمه بمبي فاقع",
      "كل تظليل فوق صورة يُخبز داخل الصورة، والظلال تُحذف",
      "يُفحص كل ملف بعد البناء: صفر pattern وصفر soft mask",
      "اكتُشف مرتين — ٢٥ سبتمبر في A0، ثم ١ أكتوبر في الأغلفة وفي ٥٩ صفحة من كتاب ٢",
    ],
  },
];

export interface PlanBlocker {
  titleAr: string;
  bodyAr: string;
}

export const BOOK_BLOCKERS: PlanBlocker[] = [
  {
    titleAr: "الكوري في كتاب ٢ لم يُراجَع",
    bodyAr:
      "كتاب لغة لا يُسلَّم لطالب قبل أن تقرأ مؤلفته كل سطر كوري فيه. هذا أوّل ما يمنع البيع.",
  },
  {
    titleAr: "كتاب ٢ نصف مبنيّ",
    bodyAr:
      "اثنتا عشرة حصة من أربع وعشرين. والحصص ١٣–٢٤ لم يُكتب محتواها بعد — كتابة لا تنضيد.",
  },
  {
    titleAr: "المستوى الأول والثاني لا يتشابهان",
    bodyAr:
      "كتاب المستوى الأول بلا افتتاحيات مصوّرة ولا رمز استماع ولا ماركر، وملاحظة كلوبي فيه صندوق أصفر لا غامق. التوحيد يحتاج مولّد المستوى الأول، وهو غير متاح.",
  },
  {
    titleAr: "مولّدات مفقودة",
    bodyAr:
      "A0 وأدلة الحصة التجريبية: بُدِّلت أغلفتها فقط. صفحاتها الداخلية لا يمكن تحديثها حتى يُعاد بناء مولّدها.",
  },
];
