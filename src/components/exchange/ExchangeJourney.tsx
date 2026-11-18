/**
 * "The journey continues" (Re, 19 Nov 2026: "add my characters to continue
 * the journey to meet people to share interests"). Lina, Adam and Cluby, who
 * learned Korean together across the KLOVERS worlds, now meet learners from
 * other places who share their interests, and the visitor is invited along.
 *
 * Canon fit (src/config/klovers-world.ts): no new lore. It reuses the
 * standing rule that story scenes show the trio plus new people from
 * different places, each wearing KLOVERS yellow, and every picture here is
 * an existing canon scene. Each character speaks to their own canon role:
 *   Lina  - culture and real-life conversation
 *   Adam  - plans, structure, confidence
 *   Cluby - encouragement and celebrating progress
 * What the learner gets from it is real: a partner to practise with. Adam
 * and Lina stay friends and study companions, never posed as a couple.
 *
 * Colours: PolyglotMatch's night palette fused with KLOVERS yellow
 * (.pm-fuse / .pm-fuse-text in index.css).
 */

type Chapter = {
  who: "lina" | "adam" | "cluby";
  img: string;
  face: string;
  name: { en: string; ar: string };
  title: { en: string; ar: string };
  line: { en: string; ar: string };
  tags: { en: string; ar: string }[];
};

const CHAPTERS: Chapter[] = [
  {
    who: "lina",
    img: "/assets/exchange/exchange-meetup.webp",
    face: "/assets/exchange/avatars/lina-cafe-yellow.webp",
    name: { en: "Lina", ar: "لينا" },
    title: { en: "Chapter 1 · The café table", ar: "الفصل ١ · طاولة المقهى" },
    line: {
      en: "After Seoul, I wanted more than lessons. I found people who love K-dramas as much as I do, and now we talk about them in Korean.",
      ar: "بعد سيول أردت أكثر من الدروس. وجدت أشخاصًا يحبون الدراما الكورية مثلي، والآن نتحدث عنها بالكورية.",
    },
    tags: [
      { en: "K-dramas", ar: "الدراما الكورية" },
      { en: "Cafés", ar: "المقاهي" },
      { en: "Culture", ar: "الثقافة" },
    ],
  },
  {
    who: "adam",
    img: "/assets/story/world-seoul-journey.webp",
    face: "/assets/exchange/avatars/adam-classic.webp",
    name: { en: "Adam", ar: "آدم" },
    title: { en: "Chapter 2 · Friends from everywhere", ar: "الفصل ٢ · أصدقاء من كل مكان" },
    line: {
      en: "I plan a weekly chat with a partner who shares my interests. Same time, same table, a little more Korean every week.",
      ar: "أرتّب محادثة أسبوعية مع شريك يشاركني اهتماماتي. نفس الموعد، نفس الطاولة، وكورية أكثر قليلًا كل أسبوع.",
    },
    tags: [
      { en: "Travel", ar: "السفر" },
      { en: "Food", ar: "الطعام" },
      { en: "Weekly practice", ar: "تمرين أسبوعي" },
    ],
  },
  {
    who: "cluby",
    img: "/assets/cluby/picnic.webp",
    face: "/assets/exchange/avatars/cluby-celebrate.webp",
    name: { en: "Cluby", ar: "كلوبي" },
    title: { en: "Chapter 3 · Your turn", ar: "الفصل ٣ · دورك أنت" },
    line: {
      en: "Every new friend is a reason to celebrate! Tell us what you love, and I will help you find someone who loves it too.",
      ar: "كل صديق جديد سبب للاحتفال! قل لنا ماذا تحب، وسأساعدك تجد من يحبه أيضًا.",
    },
    tags: [
      { en: "Music", ar: "الموسيقى" },
      { en: "Games", ar: "الألعاب" },
      { en: "Your interests", ar: "اهتماماتك" },
    ],
  },
];

/** Full section for the PolyglotMatch landing page. */
export function ExchangeJourney({ isAr }: { isAr: boolean }) {
  const t = (v: { en: string; ar: string }) => (isAr ? v.ar : v.en);
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-24" aria-labelledby="pm-journey-title">
      <div className="mb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FFE600]/40 bg-[#FFE600]/10 px-4 py-1.5 text-[13px] font-bold text-[#FFE600]">
          🍀 {isAr ? "رحلة كلوفرز مستمرة" : "The KLOVERS journey continues"}
        </span>
        <h2 id="pm-journey-title" className="pm-display mt-5 text-[26px] font-bold sm:text-[34px]">
          {isAr ? (
            <>
              لينا وآدم وكلوبي <span className="pm-fuse-text">يقابلون أصدقاء جددًا</span>
            </>
          ) : (
            <>
              Lina, Adam and Cluby <span className="pm-fuse-text">meet new friends</span>
            </>
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-[1.8] text-[#C3BEDB]">
          {isAr
            ? "تعلّموا الكورية معًا من قرية الهانغول حتى سيول. الآن تبدأ الرحلة التالية: أشخاص حقيقيون من بلاد مختلفة يشاركونهم نفس الاهتمامات. وأنت معهم."
            : "They learned Korean together, from Hangul Village all the way to Seoul. Now the next trip starts: real people from different places who share the same interests. And you are coming too."}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {CHAPTERS.map((c) => (
          <article
            key={c.who}
            className="pm-step-card group overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#171329]"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={c.img}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171329] via-[#171329]/20 to-transparent" />
              <span className="absolute start-4 top-4 rounded-full bg-[#0C0A16]/70 px-3 py-1 text-[11px] font-bold text-[#FFE600] backdrop-blur">
                {t(c.title)}
              </span>
            </div>
            <div className="relative -mt-8 p-5 pt-0">
              <div className="flex items-end gap-3">
                <span className="pm-fuse inline-block shrink-0 rounded-full p-[3px]">
                  <img
                    src={c.face}
                    alt={t(c.name)}
                    width={64}
                    height={64}
                    loading="lazy"
                    className="h-16 w-16 rounded-full border-2 border-[#171329] object-cover"
                  />
                </span>
                <p className="pb-1 text-[15px] font-extrabold text-[#FFE600]">{t(c.name)}</p>
              </div>
              <p className="mt-3 text-[14.5px] leading-[1.8] text-[#D9D4F0]">“{t(c.line)}”</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.tags.map((tag) => (
                  <span
                    key={tag.en}
                    className="rounded-full border border-[#FF3EA5]/30 bg-[#FF3EA5]/10 px-3 py-1 text-[12px] font-bold text-[#FFB3DA]"
                  >
                    {t(tag)}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Slim version for the top of the app (/exchange/app) and the home card. */
export function ExchangeJourneyStrip({ isAr, className = "" }: { isAr: boolean; className?: string }) {
  const faces = CHAPTERS.map((c) => ({ src: c.face, alt: isAr ? c.name.ar : c.name.en }));
  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className={`flex items-center gap-3 rounded-2xl border border-[#FFE600]/25 bg-gradient-to-r from-[#FF3EA5]/10 via-[#8B5CF6]/10 to-[#FFE600]/10 px-4 py-3 text-start ${className}`}
    >
      <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
        {faces.map((f) => (
          <img
            key={f.src}
            src={f.src}
            alt={f.alt}
            width={40}
            height={40}
            loading="lazy"
            className="h-10 w-10 rounded-full border-2 border-[#FFE600] object-cover"
          />
        ))}
      </div>
      <p className="text-[13px] leading-relaxed text-[#E7E3F7]">
        {isAr ? (
          <>
            <span className="font-extrabold text-[#FFE600]">رحلتنا مستمرة:</span> بعد كوريا نقابل أصدقاء يشاركوننا اهتماماتنا. اختر اهتماماتك وتعالَ معنا.
          </>
        ) : (
          <>
            <span className="font-extrabold text-[#FFE600]">Our journey continues:</span> after Korea, we meet friends who share our interests. Pick yours and come along.
          </>
        )}
      </p>
    </div>
  );
}

export default ExchangeJourney;
