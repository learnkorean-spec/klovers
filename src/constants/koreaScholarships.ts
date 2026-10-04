/**
 * The Korean scholarships Klovers is willing to stand behind.
 *
 * WHY THIS FILE LOOKS SO CAREFUL
 *
 * Scholarships are the one subject on this site where a wrong number costs a
 * reader a year: someone reads "٩٠٠٬٠٠٠ وون شهريًا", plans around it, and finds
 * out in Seoul that their university pays ٨٠٠٬٠٠٠. So the rule this file
 * follows is the site's usual one, applied strictly:
 *
 *   ONE OFFICIAL SOURCE PER CLAIM, OR NO CLAIM.
 *
 * Verified against provider pages on 4 October 2026 (see VERIFIED_AT below):
 * NIIED / Study in Korea, KOICA, the Korea Foundation, KAIST's own admission
 * site, and the Korean Embassy in Cairo for the Egypt quotas. What that check
 * turned up is the reason `figures` is optional and mostly absent:
 *
 *   - NIIED and KOICA publish their benefit amounts in PDF guidelines, not in
 *     HTML. They could not be read first-hand at verification time, so NO
 *     amount for GKS or KOICA appears here.
 *   - Official university pages contradict each other on the GKS monthly
 *     allowance (University of Seoul says 800,000 KRW, Kumoh 900,000 for the
 *     undergraduate track; Sunchon says 1,000,000 and Kumoh about 1,130,000 for
 *     the graduate track). Quoting one of those as "the" figure would be
 *     quoting a disagreement.
 *   - Where a single provider page DOES state an amount — KAIST's scholarship
 *     page, the Korea Foundation fellowship page, the GKS exchange page — the
 *     amount is recorded in `figures`, attributed to that provider.
 *
 * Every entry therefore carries `officialUrl`, which is the number a reader
 * should trust, and the UI shows the verification date next to it.
 *
 * MAINTENANCE: these are annual cycles. Re-check each `officialUrl` before a
 * new intake and move VERIFIED_AT forward — the UI prints that date to the
 * reader, so a stale date is visible rather than silent.
 */

export type ScholarshipKind = "bachelor" | "graduate" | "language" | "exchange";

export interface Scholarship {
  id: string;
  /** The programme's own name, not a translation of it. */
  name: { ar: string; en: string };
  provider: { ar: string; en: string };
  /** Filters the panel offers. A programme can belong to more than one. */
  kinds: ScholarshipKind[];
  /** The provider's own page — the source of every claim on the card. */
  officialUrl: string;
  /** What the award covers. Categories only, unless a figure is confirmed. */
  covers: { ar: string[]; en: string[] };
  /**
   * Amounts, ONLY where one official page states them itself. Never filled in
   * from an agency blog or from a university page that disagrees with another
   * university page. When absent the card points at the official guideline.
   */
  figures?: { ar: string; en: string };
  eligibility: { ar: string; en: string };
  language: { ar: string; en: string };
  timeline: { ar: string; en: string };
  /** Egypt-specific or caveat facts worth surfacing on the card. */
  note?: { ar: string; en: string };
  whoFor: { ar: string; en: string };
}

/** Shown to the reader, so a stale list is visible instead of silent. */
export const VERIFIED_AT = { ar: "٤ أكتوبر ٢٠٢٦", en: "4 October 2026" };

export const SCHOLARSHIP_KINDS: { id: ScholarshipKind; label: { ar: string; en: string } }[] = [
  { id: "bachelor", label: { ar: "بكالوريوس", en: "Bachelor's" } },
  { id: "graduate", label: { ar: "دراسات عليا", en: "Graduate" } },
  { id: "language", label: { ar: "لغة كورية", en: "Korean language" } },
  { id: "exchange", label: { ar: "تبادل طلابي", en: "Exchange" } },
];

/** The Korea Foundation fellowship's own two published living-expense tiers. */
export const KOREA_SCHOLARSHIPS: Scholarship[] = [
  {
    id: "gks-undergraduate",
    name: {
      ar: "منحة الحكومة الكورية — البكالوريوس (GKS-U)",
      en: "Global Korea Scholarship — Undergraduate (GKS-U)",
    },
    provider: {
      ar: "وزارة التعليم الكورية، عبر المعهد الوطني للتعليم الدولي (NIIED)",
      en: "Korean Ministry of Education, through NIIED",
    },
    kinds: ["bachelor"],
    officialUrl: "https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1",
    covers: {
      ar: [
        "تذاكر الطيران ذهابًا وعودة",
        "سنة كاملة لتدريس اللغة الكورية",
        "الرسوم الدراسية كاملة",
        "مصروف شهري",
        "تأمين صحي",
        "بدل استقرار عند الوصول",
      ],
      en: [
        "Round-trip airfare",
        "A full year of Korean language training",
        "Full tuition",
        "A monthly allowance",
        "Health insurance",
        "A settlement allowance on arrival",
      ],
    },
    eligibility: {
      ar: "السن أقل من ٢٥ سنة، وشهادة الثانوية، ومعدل تراكمي ٨٠٪ أو ضمن أفضل ٢٠٪ من الدفعة. من يحمل شهادة جامعية غير مؤهل لهذا المسار.",
      en: "Under 25 years old, a high-school certificate, and a cumulative score of 80% or a top-20% class rank. Holding a bachelor's degree makes an applicant ineligible for this track.",
    },
    language: {
      ar: "لا يُشترط أي مستوى في TOPIK عند التقديم، والمنحة تشمل سنة لغة كورية كاملة. النتيجة العليا في TOPIK تضيف مكافأة.",
      en: "No TOPIK level is required to apply, and the award includes a full year of Korean language training. A high TOPIK score carries a bonus award.",
    },
    timeline: {
      ar: "التقديم في سبتمبر–أكتوبر من كل عام. في مصر كانت نافذة مسار السفارة ١٥–٣٠ سبتمبر في دورة ٢٠٢٦، وهي أقصر من الموعد العام، وللمسار الجامعي موعد مختلف.",
      en: "Applications run September to October each year. For Egypt the embassy track closed 15–30 September in the 2026 cycle — narrower than the global window — and the university track follows a different date.",
    },
    note: {
      ar: "لمصر حصة سنوية في هذا المسار: مقعدان في دورة ٢٠٢٦ (مقعد للمسار العام ومقعد لمسار R-GKS).",
      en: "Egypt has its own annual quota on this track: two places in the 2026 cycle — one general and one R-GKS.",
    },
    whoFor: {
      ar: "لطلاب الثانوية المتفوقين الذين يريدون دراسة البكالوريوس في كوريا بتمويل حكومي كامل.",
      en: "Strong high-school students who want a fully government-funded bachelor's degree in Korea.",
    },
  },
  {
    id: "gks-graduate",
    name: {
      ar: "منحة الحكومة الكورية — الدراسات العليا (GKS-G)",
      en: "Global Korea Scholarship — Graduate (GKS-G)",
    },
    provider: {
      ar: "وزارة التعليم الكورية، عبر المعهد الوطني للتعليم الدولي (NIIED)",
      en: "Korean Ministry of Education, through NIIED",
    },
    kinds: ["graduate"],
    officialUrl: "https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1",
    covers: {
      ar: [
        "تذاكر الطيران ذهابًا وعودة",
        "سنة كاملة لتدريس اللغة الكورية",
        "الرسوم الدراسية كاملة",
        "مصروف شهري",
        "تأمين صحي",
        "بدل استقرار عند الوصول",
      ],
      en: [
        "Round-trip airfare",
        "A full year of Korean language training",
        "Full tuition",
        "A monthly allowance",
        "Health insurance",
        "A settlement allowance on arrival",
      ],
    },
    eligibility: {
      ar: "السن أقل من ٤٠ سنة، ومعدل ٨٠٪ في آخر مؤهل دراسي، وبكالوريوس للماجستير أو ماجستير للدكتوراه.",
      en: "Under 40 years old, a GPA of at least 80% in the most recent degree, and a bachelor's for a master's or a master's for a doctorate.",
    },
    language: {
      ar: "لا يُشترط TOPIK عند التقديم، والمنحة تشمل سنة لغة كورية. مسار «الشبكة العالمية» للماجستير يُدرَّس بالإنجليزية دون سنة اللغة.",
      en: "No TOPIK level is required to apply, and a year of Korean language training is included. The Global Network master's track is taught in English with no language year.",
    },
    timeline: {
      ar: "التقديم في فبراير–مارس من كل عام، والنتائج النهائية في يونيو. يمكن التقديم عبر السفارة الكورية أو مباشرة إلى إحدى جامعات GKS.",
      en: "Applications run February to March each year with final results in June. Apply through the Korean embassy or directly to a GKS-designated university.",
    },
    note: {
      ar: "حصة مصر في دورة ٢٠٢٦: ٧ مقاعد عبر السفارة و٨ عبر الجامعات.",
      en: "Egypt's 2026 quota: seven places through the embassy and eight through the universities.",
    },
    whoFor: {
      ar: "لخريجي الجامعات الذين يريدون دراسة الماجستير أو الدكتوراه في كوريا بتمويل حكومي كامل.",
      en: "University graduates who want a fully government-funded master's or doctorate in Korea.",
    },
  },
  {
    id: "kaist",
    name: {
      ar: "منحة معهد كوريا المتقدم للعلوم والتقنية (KAIST)",
      en: "KAIST Scholarship for international undergraduates",
    },
    provider: {
      ar: "جامعة KAIST، من ميزانيتها",
      en: "KAIST, from its own budget",
    },
    kinds: ["bachelor"],
    officialUrl: "https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist",
    covers: {
      ar: ["إعفاء كامل من الرسوم الدراسية", "مصروف شهري", "تأمين صحي وطني"],
      en: ["A full tuition exemption", "A monthly allowance", "National health insurance"],
    },
    figures: {
      ar: "إعفاء من الرسوم لثمانية فصول دراسية، و٣٥٠٬٠٠٠ وون شهريًا، وتأمين صحي — حسب صفحة المنحة في موقع KAIST.",
      en: "Tuition exempt for eight semesters, KRW 350,000 a month, and medical insurance — as stated on KAIST's own scholarship page.",
    },
    eligibility: {
      ar: "يُمنح تلقائيًا لكل طالب دولي مقبول في مرحلة البكالوريوس، بشرط الحفاظ على معدل ٢٫٧ من ٤٫٣ بعد السنة الأولى.",
      en: "Granted automatically to every admitted international undergraduate, provided the student keeps a GPA above 2.7 out of 4.3 after the first year.",
    },
    language: {
      ar: "الإنجليزية هي لغة التعليم والتواصل في KAIST، ولا يُشترط TOPIK. حد أدنى محدد لاختبار الإنجليزية غير منشور على صفحات القبول.",
      en: "English is the language of instruction and communication at KAIST and no TOPIK level is required. A specific English-test cut-off is not published on the admission pages.",
    },
    timeline: {
      ar: "لا يوجد تقديم منفصل للمنحة: تُختار مع طلب القبول نفسه، والمواعيد هي مواعيد القبول لكل فصل.",
      en: "There is no separate scholarship application: it is selected with the admission application itself, on the admission calendar for each intake.",
    },
    whoFor: {
      ar: "لطلاب الثانوية المتفوقين في العلوم والهندسة الذين يريدون دراسة مجانية ومصروفًا شهريًا في كوريا.",
      en: "Strong high-school students in science and engineering who want free study and a monthly stipend in Korea.",
    },
  },
  {
    id: "kf-language",
    name: {
      ar: "زمالة تدريب اللغة الكورية — مؤسسة كوريا",
      en: "Korean Language Training Fellowship — The Korea Foundation",
    },
    provider: {
      ar: "مؤسسة كوريا (The Korea Foundation)",
      en: "The Korea Foundation (KF)",
    },
    kinds: ["language"],
    officialUrl: "https://kf.or.kr/kfEng/cm/cntnts/cntntsView.do?cntntsId=1637&mi=2221",
    covers: {
      ar: [
        "مصروف معيشة شهري",
        "بدل سفر لمرة واحدة",
        "الرسوم الدراسية لبرنامج اللغة",
        "تأمين صحي",
      ],
      en: [
        "A monthly living allowance",
        "A one-time travel allowance",
        "Tuition for the language programme",
        "Health insurance",
      ],
    },
    figures: {
      ar: "١٬٠٠٠٬٠٠٠ وون شهريًا لحاملي البكالوريوس أو من لديهم أقل من ثلاث سنوات خبرة، و١٬٢٠٠٬٠٠٠ وون لحاملي الماجستير أو الدكتوراه أو من لديهم ثلاث سنوات خبرة فأكثر، مع ٣٠٠٬٠٠٠ وون بدل سفر — حسب صفحة الزمالة في موقع المؤسسة.",
      en: "KRW 1,000,000 a month for bachelor's holders or those with under three years of experience, and KRW 1,200,000 for doctoral candidates or those with three years or more, plus a KRW 300,000 travel allowance — as stated on the Foundation's own page.",
    },
    eligibility: {
      ar: "زمالة للغة فقط وليست درجة علمية: ستة أشهر قابلة للتمديد إلى اثني عشر. تشمل منطقة الشرق الأوسط بالاسم. غير متاحة لمن يخطط للالتحاق ببرنامج درجة في كوريا أو من سبق أن حصل عليها.",
      en: "A language-only fellowship, not a degree: six months, extendable to twelve. The Middle East is named as an eligible region. It is not open to anyone planning to enrol in a degree programme in Korea, or to previous recipients.",
    },
    language: {
      ar: "يجب فهم الكلام الكوري الأساسي والتحدث به عند التقديم، دون مستوى TOPIK محدد، والترقي مستوى واحدًا في كل فصل دراسي.",
      en: "Applicants must already understand and speak basic Korean; no TOPIK level is specified, and a recipient must advance one level each term.",
    },
    timeline: {
      ar: "البداية في مارس أو سبتمبر، وتُعلن المواعيد في إعلان سنوي على موقع المؤسسة، ولا يمكن تأجيل الزمالة إلى العام التالي.",
      en: "Training starts in March or September; dates are published in the Foundation's annual call, and an award cannot be deferred to the following year.",
    },
    whoFor: {
      ar: "لدارسي الدراسات الكورية والباحثين الذين يريدون تعلم اللغة الكورية في كوريا ستة أشهر بتمويل كامل.",
      en: "Korean-studies students and researchers who want six funded months of Korean language training in Korea.",
    },
  },
  {
    id: "koica",
    name: {
      ar: "برنامج منح الوكالة الكورية للتعاون الدولي (KOICA)",
      en: "KOICA Scholarship Program (CIAT)",
    },
    provider: {
      ar: "الوكالة الكورية للتعاون الدولي (KOICA)، بوزارة الخارجية",
      en: "Korea International Cooperation Agency (KOICA), under the Ministry of Foreign Affairs",
    },
    kinds: ["graduate"],
    officialUrl: "https://www.koica.go.kr/ciat/7806/subview.do",
    covers: {
      ar: [
        "الرسوم الدراسية كاملة",
        "تذاكر الطيران ذهابًا وعودة",
        "بدل استقرار",
        "السكن الجامعي",
        "مصروف شهري",
        "التأمين الصحي والطبي",
        "منحة إتمام الدراسة",
        "دروس في اللغة الكورية",
      ],
      en: [
        "Full tuition",
        "Round-trip airfare",
        "A settlement allowance",
        "Dormitory accommodation",
        "A monthly allowance",
        "National and private medical insurance",
        "A completion grant",
        "Korean language classes",
      ],
    },
    eligibility: {
      ar: "الترشيح الرسمي من الجهة الحكومية إلزامي، والسن المفضل أقل من ٤٠ سنة، وإتقان جيد للإنجليزية. البرنامج للموظفين الحكوميين في الدول الشريكة التي تختارها كوريا سنويًا.",
      en: "Official nomination by the applicant's government is mandatory, the preferred age is under 40, and a strong command of English is required. It is for public officials from the partner countries Korea selects each year.",
    },
    language: {
      ar: "الإنجليزية شرط أساسي للتقديم والدراسة، وتُضاف دروس في اللغة الكورية، ولا يُشترط TOPIK.",
      en: "English is required to apply and to study; Korean classes are added, and no TOPIK level is required.",
    },
    timeline: {
      ar: "الفرز في مارس عبر مكتب KOICA أو السفارة الكورية، ثم فرز الجامعات من أبريل إلى يونيو، والقبول في يوليو.",
      en: "Screening runs in March through the KOICA office or Korean embassy, university screening from April to June, and admission in July.",
    },
    note: {
      ar: "قائمة الدول المعنية تُعلن سنويًا من KOICA، ولم تكن مصر مؤكدة على صفحات الوكالة عند التحقق. يجب تأكيد الأهلية من مكتب KOICA أو السفارة الكورية في القاهرة قبل التقديم.",
      en: "KOICA re-issues the list of eligible countries every year, and Egypt was not confirmed on the Agency's pages at verification time. Eligibility must be confirmed with the KOICA office or the Korean embassy in Cairo before applying.",
    },
    whoFor: {
      ar: "لموظفي الحكومة والقطاع العام الذين ترشحهم جهاتهم لدراسة الماجستير في كوريا.",
      en: "Public-sector officials nominated by their own government for a master's degree in Korea.",
    },
  },
  {
    id: "gks-exchange",
    name: {
      ar: "برنامج الطلاب المتبادلين المتميزين (GKS Exchange)",
      en: "GKS Exchange Students Program",
    },
    provider: {
      ar: "وزارة التعليم الكورية، عبر المعهد الوطني للتعليم الدولي (NIIED)",
      en: "Korean Ministry of Education, through NIIED",
    },
    kinds: ["exchange"],
    officialUrl: "https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab3",
    covers: {
      ar: ["مصروف شهري", "تذكرة طيران ذهابًا وعودة بالدرجة الاقتصادية"],
      en: ["A monthly allowance", "Round-trip economy airfare"],
    },
    figures: {
      ar: "٦٣٠٬٠٠٠ وون شهريًا، وتذكرة طيران ذهابًا وعودة بالدرجة الاقتصادية حسب التكلفة الفعلية — حسب صفحة البرنامج الرسمية.",
      en: "KRW 630,000 a month, and round-trip economy airfare at actual cost — as stated on the programme's official page.",
    },
    eligibility: {
      ar: "أن يكون الطالب مسجلًا في جامعة أجنبية لها اتفاق مع إحدى الجامعات الكورية المعتمدة، وبمعدل ٨٠٪ أو أعلى، وفي برنامج تبادل يؤدي إلى درجة. الدراسة في كوريا حاليًا أو الحصول على منحة كورية سابقة يمنع التقديم.",
      en: "The student must be enrolled at an overseas university that holds an agreement with one of the designated Korean universities, with a score of 80% or above, and in a degree exchange programme. Studying in Korea already, or a previous Korean government scholarship, disqualifies an applicant.",
    },
    language: {
      ar: "لا يُعلن شرط لغوي محدد في صفحة البرنامج، ويُحدَّد مع الجامعة الكورية المضيفة.",
      en: "No specific language requirement is published on the programme page; it is set with the Korean host university.",
    },
    timeline: {
      ar: "لا يمكن للطالب التقديم مباشرة: جامعته الأم هي التي ترشحه، بعد أن تختار NIIED الجامعات المشاركة في كل دورة.",
      en: "A student cannot apply directly: their home university nominates them, after NIIED selects the participating Korean universities for each cycle.",
    },
    whoFor: {
      ar: "للطلاب المسجلين في جامعة شريكة الذين يريدون فصلًا دراسيًا واحدًا في كوريا بمصروف وتذكرة.",
      en: "Students at a partner university who want a single semester in Korea, with an allowance and airfare.",
    },
  },
];
