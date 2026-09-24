import { Facebook, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * The `level` field on each review is OUR badge, not the student's words — the
 * quoted text is theirs and is never edited here.
 *
 * It used to be CEFR: "A1 → A2", "A1 → B1", and one "A0 ← A1" using a band
 * that does not exist in CEFR at all. Those are the same journeys stated in a
 * vocabulary the site no longer uses, so they now read in Klovers levels. No
 * outcome has been changed — A1 → A2 is Level 1 → Level 2, one for one.
 *
 * 2026-09-18: the cards no longer show a five-star row. These reviews are
 * dated 2021–2024 and come from Facebook, which replaced star ratings with
 * Recommendations in 2018 — so not one of these reviewers was ever shown a
 * five-point scale to rate anything on. Each card now carries what Facebook
 * itself displays beside the name, "👍 Recommends", which is the endorsement
 * they actually gave.
 *
 * 2026-09-20 (a): the section no longer borrows Facebook's blue, or the green
 * ticks. Klovers owns five colours and this page uses only those; the
 * Facebook icon is what names the platform, not the paint.
 *
 * 2026-09-20 (b): ONE ROW, IN THE READER'S OWN LANGUAGE. Two rows of twelve
 * cards was too much section, and the half of it a given visitor could not
 * read was the half doing no work: an Arabic visitor watched six English
 * cards slide past, an English visitor six Arabic ones. Filtering by language
 * halves the height and makes every remaining card legible at the same time.
 *
 * NO REVIEW WAS DELETED to achieve that. All twelve are still here, still
 * real, still unedited; the other language's six are simply not rendered to
 * someone who cannot read them. If you add a review, add it with its `lang`
 * and it appears for that audience.
 *
 * 2026-09-20 (c): ONE COUNT, IN ONE PLACE. The badge read "100% Recommend ·
 * 16 Facebook Reviews" while the line directly beneath it read "from 20
 * reviews on Facebook" — both on screen at once, on the section whose whole
 * job is to be believed. The badge has stopped counting; it is the link to
 * the reviews page and nothing else.
 */
const reviews = [
  {
    name: "Nada Tamer",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "en",
    text: "Very professional and fun at the same time! Makes learning very easy and enjoyable. I highly recommend it to anyone ❤️",
    date: "Dec 2021",
    duration: "3 months",
    level: "Level 1 → Level 2",
  },
  {
    name: "Ayaya Salah",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "en",
    text: "The course is absolutely entertaining. I enjoy every second of it — educational, not boring and I can already see progress. Highly recommend it!",
    date: "Dec 2021",
    duration: "4 months",
    level: "Level 1 → Level 2",
  },
  {
    name: "Maged M. Aziz",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "en",
    text: "Very effective. Reham is soo awesome and I learnt a lot from her. I give her 10/10. Thank you for making things easier! 👊👊",
    date: "Jul 2023",
    duration: "6 months",
    level: "Level 1 → Level 3",
  },
  {
    name: "Nami Waka",
    flag: "\u{1F30D}",
    lang: "en",
    text: "Reham is a wonderful teacher. She has a really nice smile. I'm looking forward to having her teach me Korean from now on.",
    date: "Jul 2024",
    duration: "2 months",
    level: "Beginner",
  },
  {
    name: "Kholoud Al-Bahay",
    flag: "\u{1F1F8}\u{1F1E6}",
    lang: "en",
    text: "One of the best courses I've ever enrolled in ❤️❤️❤️ How much I love how she strives and cares for us and our learning process. Highly recommend!",
    date: "Aug 2022",
    duration: "4 months",
    level: "Level 1 → Level 2",
  },
  {
    name: "Jomana Azouz",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "en",
    text: "She is amazing and really a good teacher. She simplifies everything to make it understandable, and doing the homework you will notice the development in your accent!",
    date: "Jul 2023",
    duration: "5 months",
    level: "Level 1 → Level 3",
  },
  {
    name: "حياة مصطفى",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "ميرسي جداً على تعليمنا اللغة الكورية 😍 متشكرة جداً على المستويات اللي وصلنالها من الصفر — تعليم الحروف والكتابة والقراءة والكلام. الكلام ده مايوصفش جهدك وصبرك 선생님 감사합니다",
    date: "Jul 2023",
    duration: "٦ أشهر",
    level: "من المستوى الأول للثالث",
  },
  {
    name: "يمنى دراهم",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "من الكورسات اللذيذة والممتعة جداً! طريقتها حلوة جداً وبتوضح الحاجة بصورة بسيطة وسهلة، دا غير شخصيتها العسولة وأنها هتساعدك في أي وقت 💕💕💕",
    date: "Jul 2023",
    duration: "٤ أشهر",
    level: "من المستوى الأول للثاني",
  },
  {
    name: "سامة آدم",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "بجد أحلى سونتسينيم في الدنيا 😍 الكورس خفيف وبستمتع بيه جداً. قربت أكمل سنة وبجد اتحسنت كتير في الكوري والجرامر بتسهله جداً علينا ❤️❤️❤️",
    date: "Nov 2022",
    duration: "١١ شهر",
    level: "من المستوى الأول للرابع",
  },
  {
    name: "مريم ميرا",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "بجد يستفاد كتير في الكورس ده ويتعلم أكتر. ممكن اني أكتب جملة كاملة بالكوري رغم اني مكنتش أعرف أقرأ أو أكتب كوري من قبل! 선생님 감사합니다 ❤️",
    date: "Nov 2022",
    duration: "٣ أشهر",
    level: "من الصفر للمستوى الأول",
  },
  {
    name: "بوسي محمد",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "تعلمت الحروف والأرقام وأبدأت أحس بالفرق! بالصدفة شوفت البوست وكنت فخورة جداً. أجرب وحقيقي انا من أوائل المحاضرين حسيت بفرق جامد ❤️❤️",
    date: "Nov 2022",
    duration: "٢ شهر",
    level: "مبتدئ",
  },
  {
    name: "نهال أشرف",
    flag: "\u{1F1EA}\u{1F1EC}",
    lang: "ar",
    text: "استفدت حلو أوي وبجد المستوى هايل ❤️",
    date: "Nov 2022",
    duration: "٣ أشهر",
    level: "من المستوى الأول للثاني",
  },
];

/**
 * The reviews this visitor can read. Falls back to all of them rather than
 * render a thin rail if a language ever has fewer than three — six and six
 * today, so the fallback never fires.
 */
const reviewsFor = (lang: string) => {
  const mine = reviews.filter((r) => r.lang === lang);
  return mine.length >= 3 ? mine : reviews;
};

const ReviewCard = ({ review, isAr }: { review: (typeof reviews)[0]; isAr: boolean }) => {
  const initials = review.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex-shrink-0 w-72 bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
      dir={review.lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-klovers-yellow flex items-center justify-center text-charcoal font-bold text-sm flex-shrink-0 border border-charcoal/10">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground truncate">{review.name}</span>
              <span className="text-base leading-none">{review.flag}</span>
            </div>
            {/* What Facebook shows beside the name. Not a rating — see the
                block comment at the top of this file. */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <ThumbsUp className="h-3.5 w-3.5 text-foreground/70 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-foreground/80">
                {isAr ? "توصية" : "Recommends"}
              </span>
              <span className="text-xs text-muted-foreground">· {review.date}</span>
            </div>
            {/* 25 Sep 2026 (QA): the "Verified Student · N months · Level X → Y"
                line is gone. It was our badge, not the reviewer's words, and
                nothing on Facebook verifies it (decision 23 Sep: never invent
                reviews). `duration` and `level` stay in the data, unrendered. */}
          </div>
        </div>
        <Facebook className="h-4 w-4 text-foreground/40 flex-shrink-0 mt-0.5" />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{review.text}</p>
    </div>
  );
};

const ScrollRow = ({
  items,
  direction,
  isAr,
}: {
  items: (typeof reviews)[0][];
  direction: "left" | "right";
  isAr: boolean;
}) => {
  const doubled = [...items, ...items]; // duplicate for seamless loop

  return (
    <div className="overflow-hidden relative">
      {/* fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />

      <div
        className={`flex gap-4 w-max ${
          direction === "left" ? "animate-scroll-left" : "animate-scroll-right"
        }`}
      >
        {doubled.map((r, i) => (
          <ReviewCard key={i} review={r} isAr={isAr} />
        ))}
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const shown = reviewsFor(isAr ? "ar" : "en");

  return (
    <section className="py-20 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 mb-10 text-center">
        {/* The badge is the LINK, not a second scoreboard. It used to read
            "100% Recommend · 16 Facebook Reviews" from translations.ts while
            the summary below said 20 — see note (c) at the top of this file. */}
        <a
          href="https://www.facebook.com/kloversegy/reviews"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-klovers-yellow border border-charcoal/10 rounded-full px-4 py-1.5 mb-5 hover:bg-klovers-yellow/80 transition-colors"
        >
          <Facebook className="h-4 w-4 text-charcoal" />
          <span className="text-sm font-semibold text-charcoal">
            {isAr ? "المراجعات على فيسبوك" : "Reviews on Facebook"}
          </span>
        </a>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-3">
          {t("testimonialsSection.title")}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base">
          {t("testimonialsSection.subtitle")}
        </p>

        {/* Summary — Facebook's own words, because this is the Facebook section,
            and now the ONLY place on this section carrying a count.

            It read "★★★★★ 4.9 / 5.0 · 200+ students" (translations.ts,
            `testimonialsSection.ratingSuffix`). Checked against the page on
            2026-09-18: Facebook shows "100% recommend (20 reviews)". It does
            not show 4.9, and it cannot - Facebook replaced star ratings with
            Recommendations in 2018, so there is no five-point scale on that
            page for a 4.9 to be an average of. The student count also has no
            business here; it is the hero's claim, and repeating it under a
            rating invited the reading that 200 students had reviewed.

            The Google Business Profile is the one with stars - 5.0 from 7
            reviews - and that one is quoted in the hero strip
            (HeroSection.tsx). One number, one named source, each.

            Written inline rather than through the dictionary because these
            two strings are a measurement with a date attached, like the hero
            stats beside them, and both need to change together the day either
            platform's number moves. `ratingSuffix` and `badge` are left in
            translations.ts, unused. */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <ThumbsUp className="h-5 w-5 text-foreground/70 shrink-0" aria-hidden="true" />
          <span className="text-lg font-bold text-foreground">
            {isAr ? "١٠٠٪ يوصون بها" : "100% recommend"}
          </span>
          <span className="text-muted-foreground text-sm">
            {isAr ? "من ٢٠ مراجعة على فيسبوك" : "from 20 reviews on Facebook"}
          </span>
        </div>
      </div>

      {/* One rail, in the reader's language. */}
      <ScrollRow items={shown} direction="left" isAr={isAr} />
    </section>
  );
};

export default TestimonialsSection;
