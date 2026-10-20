import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from "@/lib/siteConfig";
import LegalDocument, { type LegalContent } from "@/components/LegalDocument";

/**
 * /privacy-policy — linked from the footer and the cookie banner.
 *
 * Every processor named here was checked against the code on 24 Sep 2026:
 * Supabase (auth, database, file storage, edge functions), Vercel (hosting),
 * Google Analytics 4 and the Meta Pixel (index.html, production host only),
 * Google Fonts (index.html), Resend (email, supabase/functions), Stripe
 * (create-checkout) and OpenAI, which the interview-practice tools
 * (generate-korean-interview) call directly through
 * supabase/functions/_shared/ai.ts. Rechecked 28 Sep 2026: the old Lovable
 * AI gateway is gone from the stack. If a service is added or removed, update
 * this list and the matching fragment in scripts/prerender-meta.mjs.
 */

const WHATSAPP = `+${WHATSAPP_NUMBER}`;

const EN: LegalContent = {
  title: "Privacy Policy",
  updated: "Last updated: 28 September 2026",
  intro:
    "This policy explains what personal information Klovers collects when you use kloversegy.com and our classes, why we collect it, who we share it with, and the choices you have.",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        `Klovers is an online Korean academy operated from Egypt. You can reach us by email at ${CONTACT_EMAIL} or on WhatsApp at ${WHATSAPP}.`,
      ],
    },
    {
      heading: "What we collect",
      bullets: [
        "Account details: your name, email address and password (the password is handled by our authentication provider), your site language, and optionally your Korean level. Your browser's time zone, and the country it indicates, are saved to your profile.",
        "Trial class bookings: your name, email, phone (WhatsApp) number, country, level, learning goal, the time slot you choose and your time zone.",
        "Enrolment and payment: the plan and schedule you choose and your country of residence. For manual payments, the payment method, payment date, the receipt you upload and any transaction reference. Card payments are made on Stripe's checkout page; we do not receive your card number.",
        "Learning activity: placement test answers and results, lesson progress, games and quiz scores, and class attendance.",
        "Interview-practice tools: the job title, experience and other details you enter.",
        "Messages: what you send us by email, WhatsApp or Telegram.",
        "Usage data: pages you visit and buttons you click on the site, the link or campaign that brought you (for example UTM tags and the referring page), and a random session identifier.",
      ],
    },
    {
      heading: "Why we use it",
      bullets: [
        "To run your classes and your account, and to give you access to lessons and practice tools.",
        "To manage trial bookings and send confirmations and class reminders.",
        "To review payments and activate your enrolment.",
        "To answer your questions and support you.",
        "To understand how the site is used and improve it, and to measure our advertising.",
        "To send occasional news about classes. Every such email has an unsubscribe link.",
      ],
    },
    {
      heading: "Cookies and analytics",
      paragraphs: [
        "On kloversegy.com we use Google Analytics 4 and the Meta Pixel to measure visits and the results of our advertising. These tools use cookies and similar technologies.",
        "The site also keeps a few small items in your browser's local storage: to keep you signed in, to remember your language and your answer to the cookie notice, and to link a visit to a later booking.",
        "You can block or delete cookies and local storage in your browser settings. Blocking them may sign you out or reset your preferences.",
      ],
    },
    {
      heading: "Who we share it with",
      paragraphs: [
        "We do not sell your personal information. We share it only with the service providers that run the site for us, and only for the purposes above:",
      ],
      bullets: [
        "Supabase: accounts, database, file storage (such as payment receipts) and server functions.",
        "Vercel: website hosting.",
        "Google: Google Analytics 4, and Google Fonts, which loads the site's typefaces.",
        "Meta: the Meta Pixel, for measuring advertising.",
        "Resend: sending our emails.",
        "Stripe: card payments made through our checkout.",
        "OpenAI: only the details you type into the interview-practice tools, to generate questions and feedback.",
        "WhatsApp and Telegram: when you choose to contact us there, those services' own policies apply.",
      ],
    },
    {
      heading: "How long we keep it",
      paragraphs: [
        "We keep your information while your account is active. You can ask us to delete it at any time and we will do so, except where we must keep a record, for example of a payment.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: [
        `You can ask to see the personal information we hold about you, to correct it, or to delete it. Email us at ${CONTACT_EMAIL} and we will reply.`,
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Learners under 18 need the consent of a parent or guardian to create an account or join classes.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "If we change this policy, we will post the new version on this page and update the date at the top.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `Questions about your privacy? Email ${CONTACT_EMAIL} or message us on WhatsApp at ${WHATSAPP}.`,
      ],
    },
  ],
};

const AR: LegalContent = {
  title: "سياسة الخصوصية",
  updated: "آخر تحديث: 28 سبتمبر 2026",
  intro:
    "توضح هذه السياسة المعلومات الشخصية التي تجمعها كلوفرز عند استخدام موقع kloversegy.com وحضور حصصها، وسبب جمعها، والجهات التي تُشارَك معها، والخيارات المتاحة لصاحب البيانات.",
  sections: [
    {
      heading: "من نحن",
      paragraphs: [
        `كلوفرز أكاديمية لتعليم اللغة الكورية عبر الإنترنت تُدار من مصر. للتواصل: البريد الإلكتروني ${CONTACT_EMAIL}، أو واتساب على الرقم ${WHATSAPP}.`,
      ],
    },
    {
      heading: "المعلومات التي نجمعها",
      bullets: [
        "بيانات الحساب: الاسم والبريد الإلكتروني وكلمة المرور (يتولى مزوّد خدمة تسجيل الدخول معالجتها)، ولغة الموقع المستخدمة، ومستوى الكورية عند إضافته. كما تُحفظ في الملف الشخصي المنطقة الزمنية للمتصفح والدولة التي تدل عليها.",
        "حجز الحصة التجريبية: الاسم والبريد الإلكتروني ورقم الهاتف (واتساب) والدولة والمستوى والهدف من التعلم والموعد المختار والمنطقة الزمنية.",
        "التسجيل والدفع: الباقة والمواعيد المختارة ودولة الإقامة. وفي حالة الدفع اليدوي: طريقة الدفع وتاريخه والإيصال المرفوع وأي رقم مرجعي للمعاملة. أما الدفع بالبطاقة فيتم على صفحة الدفع الخاصة بـ Stripe، ولا نتلقى رقم البطاقة.",
        "نشاط التعلم: إجابات اختبار تحديد المستوى ونتائجه، والتقدم في الدروس، ونتائج الألعاب والاختبارات، وحضور الحصص.",
        "أدوات التدريب على المقابلات: المسمى الوظيفي والخبرة وغيرها من التفاصيل المُدخلة.",
        "الرسائل: ما يُرسل إلينا عبر البريد الإلكتروني أو واتساب أو تيليجرام.",
        "بيانات الاستخدام: الصفحات التي تُزار والأزرار التي يُضغط عليها في الموقع، والرابط أو الحملة التي أوصلت الزائر إلينا (مثل وسوم UTM والصفحة المُحيلة)، ومعرّف جلسة عشوائي.",
      ],
    },
    {
      heading: "لماذا نستخدمها",
      bullets: [
        "لتقديم الحصص وإدارة الحساب، ولإتاحة الدروس وأدوات التدريب.",
        "لإدارة حجوزات الحصص التجريبية وإرسال التأكيدات وتذكيرات الحصص.",
        "لمراجعة المدفوعات وتفعيل الاشتراك.",
        "للرد على الأسئلة وتقديم المساعدة.",
        "لفهم طريقة استخدام الموقع وتحسينه، ولقياس نتائج إعلاناتنا.",
        "لإرسال أخبار عن الحصص من حين لآخر. وتحتوي كل رسالة من هذا النوع على رابط لإلغاء الاشتراك.",
      ],
    },
    {
      heading: "ملفات تعريف الارتباط والتحليلات",
      paragraphs: [
        "نستخدم في موقع kloversegy.com خدمة Google Analytics 4 وبكسل Meta لقياس الزيارات ونتائج إعلاناتنا. وتستخدم هذه الأدوات ملفات تعريف الارتباط وتقنيات مشابهة.",
        "كما يحفظ الموقع بعض البيانات الصغيرة في التخزين المحلي للمتصفح: لإبقاء تسجيل الدخول، ولتذكّر لغة الموقع والرد على إشعار ملفات تعريف الارتباط، ولربط الزيارة بحجز لاحق.",
        "يمكن حظر ملفات تعريف الارتباط والتخزين المحلي أو حذفها من إعدادات المتصفح. وقد يؤدي ذلك إلى تسجيل الخروج أو إعادة ضبط التفضيلات.",
      ],
    },
    {
      heading: "الجهات التي تُشارَك معها البيانات",
      paragraphs: [
        "لا نبيع المعلومات الشخصية. ونشاركها فقط مع مزوّدي الخدمات الذين يشغّلون الموقع لصالحنا، وللأغراض المذكورة أعلاه فقط:",
      ],
      bullets: [
        "Supabase: الحسابات وقاعدة البيانات وتخزين الملفات (مثل إيصالات الدفع) ووظائف الخادم.",
        "Vercel: استضافة الموقع.",
        "Google: خدمة Google Analytics 4، وخدمة Google Fonts التي تُحمِّل خطوط الموقع.",
        "Meta: بكسل Meta لقياس الإعلانات.",
        "Resend: إرسال رسائل البريد الإلكتروني.",
        "Stripe: المدفوعات بالبطاقة عبر صفحة الدفع.",
        "OpenAI: ويقتصر ذلك على التفاصيل التي تُكتب في أدوات التدريب على المقابلات، لإنشاء الأسئلة والملاحظات.",
        "واتساب وتيليجرام: عند التواصل عبرهما، تسري سياسات هاتين الخدمتين.",
      ],
    },
    {
      heading: "مدة الاحتفاظ بالبيانات",
      paragraphs: [
        "نحتفظ بالمعلومات ما دام الحساب نشطًا. ويمكن طلب حذفها في أي وقت فتُحذف، إلا ما يلزمنا الاحتفاظ به من سجلات، مثل سجلات المدفوعات.",
      ],
    },
    {
      heading: "الحقوق",
      paragraphs: [
        `يحق لكل صاحب بيانات طلب الاطلاع على معلوماته الشخصية التي نحتفظ بها، أو تصحيحها، أو حذفها. تُرسل الطلبات إلى ${CONTACT_EMAIL} ويُرد عليها.`,
      ],
    },
    {
      heading: "الأطفال",
      paragraphs: [
        "يحتاج المتعلمون دون سن 18 عامًا إلى موافقة أحد الوالدين أو الوصي لإنشاء حساب أو الانضمام إلى الحصص.",
      ],
    },
    {
      heading: "التغييرات على هذه السياسة",
      paragraphs: [
        "إذا غيّرنا هذه السياسة، فسننشر النسخة الجديدة في هذه الصفحة ونحدّث التاريخ في أعلاها.",
      ],
    },
    {
      heading: "للتواصل",
      paragraphs: [
        `للاستفسار عن الخصوصية: البريد الإلكتروني ${CONTACT_EMAIL}، أو واتساب على الرقم ${WHATSAPP}.`,
      ],
    },
  ],
};

const PrivacyPolicyPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "سياسة الخصوصية" : "Privacy Policy",
    description: isAr
      ? "كيف تجمع كلوفرز بياناتك الشخصية وتستخدمها وتحميها، والخدمات التي تُشارَك معها، وطريقة الاطلاع عليها أو حذفها."
      : "How Klovers collects, uses and protects your personal information, which services we share it with, and how to access or delete it.",
    canonical: isAr ? "https://kloversegy.com/ar/privacy-policy" : "https://kloversegy.com/privacy-policy",
    alternates: { en: "https://kloversegy.com/privacy-policy", ar: "https://kloversegy.com/ar/privacy-policy" },
  });
  return <LegalDocument content={isAr ? AR : EN} isAr={isAr} />;
};

export default PrivacyPolicyPage;
