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
    noteAr: "٢٤ حصة · القواعد ١–٣٢ · ١٨٨ صفحة",
    state: "done",
    statusAr: "مكتمل",
    bookId: "book-1",
  },
  {
    cover: "cover_b2",
    titleAr: "المستوى ٢ · مقهى المحادثة",
    noteAr: "٢٤ حصة · القواعد ٣٣–٦٥ · ٢٩٤ صفحة · كل المشاهد مركّبة",
    state: "partial",
    statusAr: "ينتظر مراجعة الكوري",
    bookId: "book-2",
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
  { nameAr: "المستوى الثاني", topik: 2, classes: 24, statusAr: "مكتوب ومصوَّر · ينتظر مراجعة الكوري", state: "partial" },
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
    titleAr: "افتتاحيّات كتاب ٢ تكرّر صور المحادثة",
    bodyAr:
      "كل مشاهد المحادثة الأربعة والعشرين وصلت في ٨ أكتوبر ٢٠٢٦ ورُكّبت في "
      + "النسختين — لا بطاقة ولا مشهد فارغ في الكتاب. لكن المولّد يسقط إلى مشهد "
      + "المحادثة حين لا يجد افتتاحيّة، فصارت تسع حصص (١٣–١٨ و٢٠ و٢٣ "
      + "و٢٤) تعرض الصورة نفسها مرّتين: مرّة ملء صفحة الافتتاح ومرّة في المحادثة. "
      + "الحصص ١٩ و٢١ و٢٢ أُغلقت بالنسخ البديلة. الباقي يحتاج إحدى عشرة صورة، "
      + "b2s_op_06 وb2s_op_12 إلى b2s_op_18 وb2s_op_20 وb2s_op_23 وb2s_op_24.",
  },
  {
    titleAr: "رأس صفحات الكتب — خلفية الرأس الكريمي أُصلحت ومؤكّدة الآن في الكتب الثمانية، 3 نوفمبر 2026",
    bodyAr:
      "البند اللي كان هنا يقول إن خلفية الرأس الكريمي اتصلّحت بالكامل في كل "
      + "الكتب الثمانية في 3 نوفمبر — ده كان غير دقيق. السكريبت القديم كان "
      + "بيدوّر على ترتيب حروف محدد بالظبط (RG قبل rg، مع سطر جديد قبل "
      + "/G3 gs)، لكن أجزاء كبيرة من الملفات فيها نفس اللون الكريمي بترتيب "
      + "معكوس وبدون سطر جديد، فالسكريبت كان بيعدّي عليها من غير ما يلاحظ "
      + "— رغم إنه كان بيقول 'تم الإصلاح'. الإصلاح الصحيح استبدال كل ظهور "
      + "لقيمة RGB الكريمي (1 .9765 .9255) بالأبيض، في أي ترتيب كتابة، "
      + "بغضّ النظر عن الصياغة المحيطة. اتطبّق على مرحلتين في نفس اليوم: "
      + "أولًا كتاب ١ (١٠٨٥ مكان، ١٨٥ صفحة) وكتاب ٢ عربي/إنجليزي (١٨٦ مكان "
      + "لكل نسخة، ٩٠ صفحة) ضمن جولة إضافة الصفحات التمهيدية (البند "
      + "التالي)؛ ثم بعد ما طلبت Re فحص الباقي بالبكسل، تبيّن إن نفس الخلل "
      + "فعلًا موجود في hangul-a0 (٤٦٨ مكان، ٨٣ صفحة)، hangul-a0-en (٤٦٢ "
      + "مكان، ٨٣ صفحة)، ودليلا الحصة التجريبية عربي/إنجليزي (٤٧ و٤٥ مكانًا، "
      + "٦ صفحات لكل واحد) — رغم إن البند القديم كان يدّعي إصلاحهم أصلًا. "
      + "أُصلحت الأربعة ورُفعت، وتأكّدت بمطابقة الحجم بالبايت في "
      + "storage.objects. **الحالة الآن: الخلفية الكريمية مُصلَحة ومؤكَّدة "
      + "بفحص بكسلات فعلي على الكتب الثمانية جميعًا** — ما عدا ورقة الهانغُل "
      + "المجانية الثابتة في الريبو (أُصلحت بنفس تعديل الرأس في الجولة "
      + "الأولى لكن لم تُفحص بنفس الدقة لاحقًا) وصفحة الغلاف الخلفي لكتاب ٢ "
      + "(مستثناة عمدًا، كريميتها جزء من التصميم). التفاصيل الكاملة في "
      + "claude/klovers-book-cover-style-guide.md.",
  },
  {
    titleAr: "صفحات تمهيدية جديدة + إعادة ترقيم كاملة — 3 نوفمبر 2026",
    bodyAr:
      "أُضيفت صفحة «ماذا ستتعلّم في هذا الكتاب» (أربع نقاط تلخّص محتوى "
      + "الكتاب) لكتاب ١ وكتاب ٢ (عربي وإنجليزي)، وصفحة افتتاح مصوَّرة "
      + "للحصة الأولى في كتاب ١ (آدم ولينا وكلوبي في سوق الهانوك، من مكتبة "
      + "الصور b1s_01) على غرار افتتاحيّات كتاب ٢. إدراج الصفحات زوّد عدد "
      + "صفحات كتاب ١ من ١٨٦ إلى ١٨٨ وكتاب ٢ (كل نسخة) من ٢٩٣ إلى ٢٩٤. "
      + "بناءً على قرار Re، اتعمل ترقيم كامل بدل ترك الصفحات الجديدة بلا "
      + "رقم: رقم كل صفحة في الفوتر (الصفحة س من المجموع) ورقم كل سطر في "
      + "جدول خطة الكتاب (الفهرس) اتصحّحوا ليطابقوا الموضع الفعلي الجديد. "
      + "التعديل تم مباشرة على بايتات كل PDF، بخطوط كاملة (مش subset) "
      + "لضمان توفّر كل الأرقام المطلوبة. اتضغطت الملفات الثلاثة بعدها "
      + "لتفضل تحت حد الرفع ١٠ ميجا. تفاصيل كاملة في "
      + "claude/klovers-book-cover-style-guide.md.",
  },
  {
    titleAr: "ثلاثة أنماط للأيقونات في المدى",
    bodyAr:
      "قرار ١٠ أكتوبر ٢٠٢٦ (Re): نمط الأيقونات في المدى كلّه صار "
      + "<b>الألوان المائية على ورق عاجي</b>، ويحلّ محلّ الطين واللمّاع معًا. "
      + "<b>المستوى الأول اكتمل بالكامل</b> — ١٠٧ أيقونة مائية، محفوظة "
      + "بالبادئة b1i (أُنجز في ١٠ أكتوبر ٢٠٢٦). "
      + "<b>المستوى الثاني قيد التحويل من اللمّاع/الطيني إلى المائي</b>، "
      + "حصة بحصة — تم تحويل الحصص ٣، ٤، ٥، ٧، ٨، ٩، ١٠، ١١، ١٣، ١٤، ١٥، "
      + "١٦، ١٧ و٢١ (١٤ من ٢٠)، وتوقّف العمل عند ١٤ أكتوبر ٢٠٢٦ — الحصص "
      + "١، ٢، ٦، ١٢، ١٨، ١٩، ٢٠، ٢٢، ٢٣ ما زالت على نمطها القديم (لمّاع أو طيني). "
      + "A0 لسه على ١٣٩ أيقونة إيموجي ثلاثيّة لمّاعة، ومؤجَّل لأن مولّده مفقود. "
      + "أثناء التحويل اتكشفت مشاكل محتاجة مراجعة بصرية: أزواج أيقونات "
      + "متشابهة بصعوبة تتفرّق (مثلاً 켜다/끄다 نفس مفتاح الإنارة، 들어가다/나가다 "
      + "نفس الباب، 조금/많이 نفس الإبريق) ولازم تتأكد كل واحدة منهم مقروءة "
      + "لوحدها قبل اعتمادها.",
  },
  {
    titleAr: "لا نسخة إنجليزية للمستوى الأول",
    bodyAr:
      "المستوى الثاني صار له نسختان من مولّد واحد (٧ أكتوبر ٢٠٢٦)، وله الآن "
      + "سطره book-2-en في السجل. يبقى المستوى الأول عربيًّا فقط — ومجموعة "
      + "تدرس بالإنجليزية فيه لا تجد كتابًا — لأن مولّده فُقد، فالنسخة "
      + "الإنجليزية تنتظر إعادة بنائه على مولّد كتاب ٢.",
  },
  {
    titleAr: "المستوى الأول والثاني لا يتشابهان",
    bodyAr:
      "كتاب المستوى الأول بلا افتتاحيات مصوّرة ولا رمز استماع ولا ماركر، وملاحظة كلوبي فيه صندوق أصفر لا غامق، وغلافه بلا فقاعة مستوى. التوحيد يحتاج مولّد المستوى الأول، وهو غير متاح.",
  },
  {
    titleAr: "مولّدات مفقودة",
    bodyAr:
      "A0 وأدلة الحصة التجريبية: بُدِّلت أغلفتها فقط. صفحاتها الداخلية لا "
      + "يمكن تحديثها حتى يُعاد بناء مولّدها. هذا ما يؤجّل تحويل أيقونات A0 "
      + "الـ١٣٩ إلى الألوان المائية: الصور ستُولَّد بلا مكان توضع فيه. "
      + "إعادة البناء تتبع طريقة المستوى الأول — الكوري يُقرأ من الـPDF سليمًا "
      + "والعربي يُكتب من جديد لأنه غير قابل للاستخراج.",
  },
];
