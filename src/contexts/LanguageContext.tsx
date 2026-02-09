import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  // Header
  "nav.home": { en: "Home", ar: "الرئيسية" },
  "nav.courses": { en: "Courses", ar: "الدورات" },
  "nav.pricing": { en: "Pricing", ar: "الأسعار" },
  "nav.enroll": { en: "How to Enroll", ar: "كيفية التسجيل" },
  "nav.faq": { en: "FAQ", ar: "الأسئلة الشائعة" },
  "nav.enrollNow": { en: "Enroll Now", ar: "سجّل الآن" },

  // Hero
  "hero.badge": {
    en: "🎓 Learn Korean. Connect with Culture. Speak with Confidence.",
    ar: "🎓 تعلم الكورية. تواصل مع الثقافة. تحدث بثقة.",
  },
  "hero.title1": { en: "Learn Korean Your Way —", ar: "تعلّم الكورية بطريقتك —" },
  "hero.title2": {
    en: "From Hangul to Advanced Fluency",
    ar: "من الهانغول إلى الطلاقة المتقدمة",
  },
  "hero.description": {
    en: "Join K-Lovers and start your Korean language journey with structured courses, expert guidance, and a supportive learning community.",
    ar: "انضم إلى K-Lovers وابدأ رحلتك في تعلم اللغة الكورية مع دورات منظمة وإرشاد من خبراء ومجتمع تعليمي داعم.",
  },
  "hero.viewCourses": { en: "View Courses", ar: "عرض الدورات" },

  // Why K-Lovers
  "why.title": { en: "Why K-Lovers?", ar: "لماذا K-Lovers؟" },
  "why.subtitle": {
    en: "Everything you need to master Korean in one place",
    ar: "كل ما تحتاجه لإتقان الكورية في مكان واحد",
  },
  "why.structured": { en: "Structured Levels", ar: "مستويات منظمة" },
  "why.structuredDesc": { en: "From Hangul to Advanced fluency", ar: "من الهانغول إلى الطلاقة المتقدمة" },
  "why.flexible": { en: "Flexible Classes", ar: "فصول مرنة" },
  "why.flexibleDesc": { en: "Group & private options available", ar: "خيارات جماعية وخاصة متاحة" },
  "why.speaking": { en: "Speaking-Focused", ar: "تركيز على المحادثة" },
  "why.speakingDesc": { en: "Practical conversation lessons", ar: "دروس محادثة عملية" },
  "why.topik": { en: "TOPIK Prep", ar: "التحضير لـ TOPIK" },
  "why.topikDesc": { en: "Exam preparation courses", ar: "دورات تحضيرية للامتحان" },
  "why.community": { en: "Supportive Community", ar: "مجتمع داعم" },
  "why.communityDesc": { en: "Learn with fellow K-Lovers", ar: "تعلم مع زملائك في K-Lovers" },
  "why.discounts": { en: "Special Discounts", ar: "خصومات خاصة" },
  "why.discountsDesc": { en: "For Egyptian students 🇪🇬", ar: "للطلاب المصريين 🇪🇬" },

  // Courses
  "courses.badge": { en: "📚 Courses & Levels", ar: "📚 الدورات والمستويات" },
  "courses.title": {
    en: "Choose the Level That Matches Your Journey",
    ar: "اختر المستوى الذي يناسب رحلتك",
  },
  "courses.subtitle": {
    en: "From complete beginners to advanced learners, we have the perfect course for you",
    ar: "من المبتدئين تمامًا إلى المتعلمين المتقدمين، لدينا الدورة المثالية لك",
  },
  // Course items
  "course.hangul.title": { en: "Hangul Course", ar: "دورة الهانغول" },
  "course.hangul.desc": { en: "Learn the Korean alphabet", ar: "تعلم الأبجدية الكورية" },
  "course.hangul.f1": { en: "Hangul reading & writing", ar: "قراءة وكتابة الهانغول" },
  "course.hangul.f2": { en: "Sound and pronunciation practice", ar: "تمارين النطق والأصوات" },
  "course.hangul.f3": { en: "Basic words", ar: "كلمات أساسية" },
  "course.hangul.f4": { en: "Writing guides, audio & worksheets", ar: "أدلة الكتابة والصوتيات وأوراق العمل" },

  "course.beginner.title": { en: "Beginner Course", ar: "دورة المبتدئين" },
  "course.beginner.desc": { en: "Build your basics", ar: "ابنِ أساسياتك" },
  "course.beginner.f1": { en: "Self-introduction & daily conversations", ar: "التعريف بالنفس والمحادثات اليومية" },
  "course.beginner.f2": { en: "Essential grammar and vocabulary", ar: "القواعد والمفردات الأساسية" },
  "course.beginner.f3": { en: "Beginner learning materials", ar: "مواد تعليمية للمبتدئين" },
  "course.beginner.f4": { en: "Speaking practice", ar: "تمارين المحادثة" },

  "course.intermediate.title": { en: "Intermediate Course", ar: "دورة المتوسطين" },
  "course.intermediate.desc": { en: "Use Korean with confidence", ar: "استخدم الكورية بثقة" },
  "course.intermediate.f1": { en: "Grammar in real conversations", ar: "القواعد في المحادثات الحقيقية" },
  "course.intermediate.f2": { en: "Reading texts & comprehension", ar: "قراءة النصوص والفهم" },
  "course.intermediate.f3": { en: "Practice tests", ar: "اختبارات تدريبية" },
  "course.intermediate.f4": { en: "TOPIK-style questions", ar: "أسئلة بأسلوب TOPIK" },

  "course.advanced.title": { en: "Advanced Course", ar: "دورة المتقدمين" },
  "course.advanced.desc": { en: "Master fluency & cultural depth", ar: "أتقن الطلاقة والعمق الثقافي" },
  "course.advanced.f1": { en: "Advanced grammar structures", ar: "تراكيب نحوية متقدمة" },
  "course.advanced.f2": { en: "Reading articles", ar: "قراءة المقالات" },
  "course.advanced.f3": { en: "Cultural discussions", ar: "نقاشات ثقافية" },
  "course.advanced.f4": { en: "Idiomatic expressions", ar: "تعبيرات اصطلاحية" },

  "course.reading.title": { en: "Reading & Speaking", ar: "القراءة والمحادثة" },
  "course.reading.desc": { en: "Improve fluency and pronunciation", ar: "حسّن الطلاقة والنطق" },
  "course.reading.f1": { en: "Speaking & pronunciation practice", ar: "تمارين المحادثة والنطق" },
  "course.reading.f2": { en: "Reading Korean texts", ar: "قراءة النصوص الكورية" },
  "course.reading.f3": { en: "Building confidence in conversation", ar: "بناء الثقة في المحادثة" },

  "course.topik.title": { en: "TOPIK Preparation", ar: "التحضير لـ TOPIK" },
  "course.topik.desc": { en: "Prepare for the official exam", ar: "استعد للامتحان الرسمي" },
  "course.topik.f1": { en: "Listening, Reading & Writing practice", ar: "تمارين الاستماع والقراءة والكتابة" },
  "course.topik.f2": { en: "Exam strategies & tips", ar: "استراتيجيات ونصائح الامتحان" },
  "course.topik.f3": { en: "Full mock tests", ar: "اختبارات تجريبية كاملة" },
  "course.topik.f4": { en: "Complete preparation materials", ar: "مواد تحضيرية كاملة" },

  // Pricing
  "pricing.badge": { en: "💰 Pricing", ar: "💰 الأسعار" },
  "pricing.title": { en: "Choose Group or Individual Classes", ar: "اختر فصول جماعية أو فردية" },
  "pricing.subtitle": {
    en: "Flexible pricing options to fit your learning style and budget",
    ar: "خيارات أسعار مرنة تناسب أسلوب تعلمك وميزانيتك",
  },
  "pricing.group": { en: "Group Classes", ar: "الفصول الجماعية" },
  "pricing.groupBadge": { en: "Discounted for Egyptian Students 🇪🇬", ar: "خصم للطلاب المصريين 🇪🇬" },
  "pricing.private": { en: "Private Classes", ar: "الفصول الخاصة" },
  "pricing.individual": { en: "Individual", ar: "فردي" },
  "pricing.mostPopular": { en: "Most Popular", ar: "الأكثر شيوعًا" },
  "pricing.getStarted": { en: "Get Started", ar: "ابدأ الآن" },
  "pricing.1month": { en: "1 Month", ar: "شهر واحد" },
  "pricing.3months": { en: "3 Months", ar: "3 أشهر" },
  "pricing.6months": { en: "6 Months", ar: "6 أشهر" },
  "pricing.4classes": { en: "4 classes", ar: "4 حصص" },
  "pricing.12classes": { en: "12 classes", ar: "12 حصة" },
  "pricing.24classes": { en: "24 classes", ar: "24 حصة" },
  "pricing.oncePerWeek": { en: "Once per week", ar: "مرة في الأسبوع" },
  "pricing.currency": { en: "EGP", ar: "جنيه" },

  // Enroll
  "enroll.badge": { en: "📝 How to Enroll", ar: "📝 كيفية التسجيل" },
  "enroll.title": { en: "Join K-Lovers Korean Courses Today", ar: "انضم لدورات K-Lovers الكورية اليوم" },
  "enroll.subtitle": {
    en: "At K-Lovers, enrolling is simple and fast. Follow these 3 steps to secure your spot!",
    ar: "التسجيل في K-Lovers بسيط وسريع. اتبع هذه الخطوات الثلاث لتأمين مكانك!",
  },
  "enroll.step1.title": { en: "Join Our Telegram Group", ar: "انضم لمجموعتنا على تيليجرام" },
  "enroll.step1.desc": { en: "Stay updated with announcements and course news.", ar: "ابقَ على اطلاع بالإعلانات وأخبار الدورات." },
  "enroll.step1.button": { en: "Join Telegram", ar: "انضم لتيليجرام" },
  "enroll.step2.title": { en: "Complete the Registration Form", ar: "أكمل استمارة التسجيل" },
  "enroll.step2.desc": { en: "Fill in your details so we can reserve your spot.", ar: "املأ بياناتك حتى نتمكن من حجز مكانك." },
  "enroll.step2.button": { en: "Fill Form", ar: "املأ الاستمارة" },
  "enroll.step3.title": { en: "Confirm Your Enrollment", ar: "تأكيد تسجيلك" },
  "enroll.step3.desc": {
    en: "After joining and submitting the form, our team will contact you with the next steps.",
    ar: "بعد الانضمام وتقديم الاستمارة، سيتواصل معك فريقنا بالخطوات التالية.",
  },
  "enroll.step3.status": { en: "We'll reach out to you!", ar: "سنتواصل معك!" },

  // FAQ
  "faq.badge": { en: "❓ FAQ", ar: "❓ الأسئلة الشائعة" },
  "faq.title": { en: "Frequently Asked Questions", ar: "الأسئلة الشائعة" },
  "faq.subtitle": { en: "Got questions? We've got answers!", ar: "عندك أسئلة؟ عندنا الإجابات!" },
  "faq.q1": { en: "Do I need prior knowledge of Korean?", ar: "هل أحتاج معرفة مسبقة بالكورية؟" },
  "faq.a1": {
    en: "No — we offer a Hangul course specifically designed for absolute beginners. You'll learn the Korean alphabet from scratch before moving on to vocabulary and grammar.",
    ar: "لا — نقدم دورة هانغول مصممة خصيصًا للمبتدئين تمامًا. ستتعلم الأبجدية الكورية من الصفر قبل الانتقال إلى المفردات والقواعد.",
  },
  "faq.q2": { en: "Are classes online or offline?", ar: "هل الحصص أونلاين أم حضوري؟" },
  "faq.a2": {
    en: "All our classes are conducted online, making it convenient for you to learn from anywhere. You just need a stable internet connection and a device to join the sessions.",
    ar: "جميع حصصنا تُقدم أونلاين، مما يسهل عليك التعلم من أي مكان. كل ما تحتاجه هو اتصال إنترنت مستقر وجهاز للانضمام.",
  },
  "faq.q3": { en: "Is there a placement test?", ar: "هل يوجد اختبار تحديد مستوى؟" },
  "faq.a3": {
    en: "Yes, we offer a placement test to help you choose the right level. This ensures you're placed in a class that matches your current Korean proficiency.",
    ar: "نعم، نقدم اختبار تحديد مستوى لمساعدتك في اختيار المستوى المناسب. هذا يضمن وضعك في فصل يتناسب مع مستواك الحالي في الكورية.",
  },
  "faq.q4": { en: "Do I get a certificate?", ar: "هل أحصل على شهادة؟" },
  "faq.a4": {
    en: "Yes, after successfully completing your course, you will receive a certificate of completion from K-Lovers that you can add to your portfolio or resume.",
    ar: "نعم، بعد إتمام الدورة بنجاح، ستحصل على شهادة إتمام من K-Lovers يمكنك إضافتها إلى سيرتك الذاتية.",
  },
  "faq.q5": { en: "What is the class schedule?", ar: "ما هو جدول الحصص؟" },
  "faq.a5": {
    en: "Classes are held once per week. The specific day and time will be coordinated with your group or instructor to find the most convenient schedule for everyone.",
    ar: "تُقام الحصص مرة في الأسبوع. سيتم تنسيق اليوم والوقت المحددين مع مجموعتك أو المدرب لإيجاد الجدول الأنسب للجميع.",
  },
  "faq.q6": { en: "Can I switch from group to private classes?", ar: "هل يمكنني التحويل من جماعي إلى خاص؟" },
  "faq.a6": {
    en: "Yes! You can switch between class types. Simply contact our team and we'll help you make the transition smoothly.",
    ar: "نعم! يمكنك التحويل بين أنواع الفصول. تواصل مع فريقنا وسنساعدك في الانتقال بسلاسة.",
  },

  // Footer
  "footer.tagline": {
    en: "Learn Korean. Love the Culture. Speak with Confidence.",
    ar: "تعلم الكورية. أحب الثقافة. تحدث بثقة.",
  },
  "footer.quickLinks": { en: "Quick Links", ar: "روابط سريعة" },
  "footer.community": { en: "Join Our Community", ar: "انضم لمجتمعنا" },
  "footer.copyright": {
    en: "K-Lovers Korean Courses. All rights reserved.",
    ar: "K-Lovers لدورات الكورية. جميع الحقوق محفوظة.",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("en");

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-sans" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
