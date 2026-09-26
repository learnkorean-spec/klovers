/**
 * All words the World shows, per language. Arabic is Modern Standard Arabic
 * and gender-neutral (verbal nouns on buttons, nothing aimed at the reader as
 * male or female). One language per screen: nothing here mixes the two.
 */
export const WORLD_COPY = {
  en: {
    seoTitle: "Klovers World",
    seoDescription: "Walk into the hanok courtyard where the clover egg sleeps — the first room of the Klovers world.",
    loadingTitle: "Opening the courtyard…",
    loadingLine: "The clover egg is still asleep. The courtyard is quiet.",
    exit: "Back to Klovers",
    lookHint: "Click the scene to look around",
    controls: [
      { keys: ["W", "A", "S", "D"], label: "walk" },
      { keys: ["Shift"], label: "run" },
      { keys: ["Mouse"], label: "look" },
      { keys: ["Wheel"], label: "zoom" },
      { keys: ["Esc"], label: "free the mouse" },
    ],
    touchNote: "Walking needs a keyboard in this first preview. Dragging still turns the view.",
    noWebglTitle: "This device can't open the 3D world yet",
    noWebglLine: "Everything else on Klovers works as usual.",
    errorTitle: "The world didn't load this time",
    errorLine: "Nothing is lost. Try again, or carry on with the games.",
    retry: "Try again",
    backToGames: "Back to the games",
    entryEyebrow: "New · first preview",
    entryTitle: "Step into the courtyard",
    entryLine: "Walk the hanok courtyard where the two friends found the clover egg. It is still asleep.",
    entryCta: "Enter KLOVERS World",
    entryNote: "Best on a computer with a keyboard.",
  },
  ar: {
    seoTitle: "عالم محبي الكورية",
    seoDescription: "جولة في ساحة الهانوك حيث تنام بيضة البرسيم: الغرفة الأولى في عالم محبي الكورية.",
    loadingTitle: "جارٍ فتح الساحة…",
    loadingLine: "ما زالت بيضة البرسيم نائمة، والساحة هادئة.",
    exit: "العودة إلى الموقع",
    lookHint: "النقر على المشهد يتيح النظر في الأرجاء",
    // Arabic screens carry no Latin: keys by their Arabic names. W A S D
    // still work (matched by physical key), the arrows are simply named here.
    controls: [
      { keys: ["الأسهم"], label: "المشي" },
      { keys: ["التبديل"], label: "الركض" },
      { keys: ["الفأرة"], label: "النظر" },
      { keys: ["العجلة"], label: "التقريب" },
      { keys: ["الهروب"], label: "تحرير الفأرة" },
    ],
    touchNote: "يحتاج المشي في هذه النسخة التجريبية الأولى إلى لوحة مفاتيح، ويبقى تدوير المشهد بالسحب متاحًا.",
    noWebglTitle: "لا يدعم هذا الجهاز العالم ثلاثي الأبعاد بعد",
    noWebglLine: "تعمل بقية أقسام الموقع كالمعتاد.",
    errorTitle: "تعذّر تحميل العالم هذه المرة",
    errorLine: "لم يضِع شيء. يمكن إعادة المحاولة أو متابعة الألعاب.",
    retry: "إعادة المحاولة",
    backToGames: "العودة إلى الألعاب",
    entryEyebrow: "جديد · نسخة تجريبية أولى",
    entryTitle: "خطوة إلى داخل الساحة",
    entryLine: "جولة في ساحة الهانوك حيث وجد الصديقان بيضة البرسيم. ما زالت البيضة نائمة.",
    entryCta: "دخول عالم محبي الكورية",
    entryNote: "التجربة أفضل على حاسوب بلوحة مفاتيح.",
  },
} as const;

export type WorldLang = keyof typeof WORLD_COPY;
