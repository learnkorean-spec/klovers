import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/siteConfig";
import LegalDocument, { type LegalContent } from "@/components/LegalDocument";

/**
 * /terms — linked from the footer.
 *
 * The payment, refund and missed-class wording repeats promises the site
 * already makes, and must stay in step with them: payment methods from
 * faq4A, the first-class refund-or-rebook promise and prorated refunds from
 * faq3A, and missed classes from faq2A (src/i18n/translations.ts, "home"
 * FAQ). If one of those changes, change this page and the matching fragment
 * in scripts/prerender-meta.mjs with it.
 */

const WHATSAPP = `+${WHATSAPP_NUMBER}`;

const EN: LegalContent = {
  title: "Terms of Service",
  updated: "Last updated: 28 September 2026",
  intro:
    "These terms apply when you use kloversegy.com or take classes with Klovers. By creating an account or booking a class, you agree to them.",
  sections: [
    {
      heading: "The service",
      paragraphs: [
        "Klovers teaches live online classes with a teacher, in groups or privately. The first trial class is free. The site also offers learning materials, a placement test and practice games.",
      ],
    },
    {
      heading: "Your account",
      paragraphs: [
        "Please give accurate details and keep your password private. You are responsible for what happens under your account. Learners under 18 need the consent of a parent or guardian.",
      ],
    },
    {
      heading: "Payments",
      paragraphs: [
        "We accept bank transfer, Vodafone Cash and InstaPay (Egypt), and card payment through Stripe outside Egypt.",
        "Payments in Egypt are checked by hand before your enrolment is activated; card payments through Stripe are activated automatically. Every payment is one-time, with no automatic charges.",
      ],
    },
    {
      heading: "First class guarantee and refunds",
      paragraphs: [
        "If you are not satisfied after your first class, we will refund you or rebook you — no questions asked.",
        "After that, refunds are prorated for unused sessions.",
      ],
    },
    {
      heading: "Missed classes",
      paragraphs: [
        "Group classes are recorded and shared with enrolled students. Private students can reschedule with 24 hours' notice.",
      ],
    },
    {
      heading: "Conduct",
      paragraphs: [
        "Please be respectful to teachers and other students. We may remove anyone from a class, or close an account, for harassment, abuse or disruptive behaviour.",
      ],
    },
    {
      heading: "Course materials",
      paragraphs: [
        "Lessons, recordings, textbooks and other materials are for your personal learning only. Please do not share, sell or republish them.",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. The current version is always on this page, with the date it was last updated at the top.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `Questions about these terms? Email ${CONTACT_EMAIL} or message us on WhatsApp at ${WHATSAPP}.`,
      ],
    },
  ],
};

const AR: LegalContent = {
  title: "الشروط والأحكام",
  updated: "آخر تحديث: 28 سبتمبر 2026",
  intro:
    "تسري هذه الشروط عند استخدام موقع kloversegy.com أو حضور الحصص مع كلوفرز. ويُعدّ إنشاء حساب أو حجز حصة موافقةً عليها.",
  sections: [
    {
      heading: "الخدمة",
      paragraphs: [
        "تقدّم كلوفرز حصصًا مباشرة عبر الإنترنت مع معلم، ضمن مجموعات أو بشكل خاص. الحصة التجريبية الأولى مجانية. كما يوفّر الموقع مواد تعليمية واختبارًا لتحديد المستوى وألعابًا للتدريب.",
      ],
    },
    {
      heading: "حسابك",
      paragraphs: [
        "يُرجى إدخال بيانات صحيحة والحفاظ على سرية كلمة المرور. وأنت مسؤول عمّا يحدث من خلال حسابك. ويحتاج المتعلمون دون سن 18 عامًا إلى موافقة أحد الوالدين أو الوصي.",
      ],
    },
    {
      heading: "الدفع",
      paragraphs: [
        "نقبل التحويل البنكي وفودافون كاش وإنستا باي (في مصر)، والدفع بالبطاقة عبر Stripe خارج مصر.",
        "تُراجَع المدفوعات داخل مصر يدويًا قبل تفعيل الاشتراك، ويُفعَّل الدفع بالبطاقة عبر Stripe تلقائيًا. وكل دفعة تتم مرة واحدة، دون أي سحب تلقائي.",
      ],
    },
    {
      heading: "ضمان الحصة الأولى واسترداد المبلغ",
      paragraphs: [
        "إذا لم تكن راضيًا بعد الحصة الأولى، فسنرد لك المبلغ أو نعيد حجز الحصة لك — دون أي أسئلة.",
        "بعد ذلك، يُحتسب المبلغ المسترد بشكل تناسبي عن الحصص غير المستخدمة.",
      ],
    },
    {
      heading: "الحصص الفائتة",
      paragraphs: [
        "تُسجَّل الحصص الجماعية وتُشارَك مع الطلاب المسجلين. ويمكن لطلاب الحصص الخاصة إعادة جدولة الحصة بإشعار مسبق قبل 24 ساعة.",
      ],
    },
    {
      heading: "السلوك",
      paragraphs: [
        "يُرجى احترام المعلمين والطلاب الآخرين. ويحق لنا استبعاد أي شخص من الحصة أو إغلاق حسابه في حالات المضايقة أو الإساءة أو السلوك الذي يعطّل الحصة.",
      ],
    },
    {
      heading: "المواد التعليمية",
      paragraphs: [
        "الدروس والتسجيلات والكتب وغيرها من المواد مخصّصة لتعلّمك الشخصي فقط. يُرجى عدم مشاركتها أو بيعها أو إعادة نشرها.",
      ],
    },
    {
      heading: "التغييرات على هذه الشروط",
      paragraphs: [
        "قد نحدّث هذه الشروط. وتتوفر النسخة الحالية دائمًا في هذه الصفحة، مع تاريخ آخر تحديث في أعلاها.",
      ],
    },
    {
      heading: "التواصل معنا",
      paragraphs: [
        `لديك سؤال عن هذه الشروط؟ راسلنا على ${CONTACT_EMAIL} أو تواصل معنا عبر واتساب على الرقم ${WHATSAPP}.`,
      ],
    },
  ],
};

const TermsPage = () => {
  useSEO({
    title: "Terms of Service",
    description:
      "The terms for Klovers' live online Korean classes: accounts, payments, the first class guarantee, refunds, missed classes and conduct.",
    canonical: "https://kloversegy.com/terms",
  });
  const { language } = useLanguage();
  const isAr = language === "ar";
  return <LegalDocument content={isAr ? AR : EN} isAr={isAr} />;
};

export default TermsPage;
