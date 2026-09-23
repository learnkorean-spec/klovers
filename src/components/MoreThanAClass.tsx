import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";

/**
 * "More Than a Class" - one compact section for everything Klovers gives a
 * learner besides the live class.
 *
 * 23 Sep 2026 homepage review: the page was ~16,100px with 16 H2s, and the
 * culture story was told three times - "A Language Opens a Culture"
 * (CultureHeritageSection), the eras timeline (KoreaTimeSection) and the
 * Journal (HomeBlogSection) - with the games section beside them. The
 * homepage plan (English + Arabic growth) keeps Games, Cluby, Culture and the
 * Journal, but in ONE compact section. This is that section.
 *
 * Each card is a door to a page that already exists. The four old components
 * are still in the repo and still used by nothing on this page; the pages they
 * point to (/games, /journey/:era, /blog) are unchanged.
 *
 * Palette: Yellow, Charcoal, Ivory (plus white cards). Cluby's handwritten
 * voice is used for the one short note, via .cluby-note, which switches to
 * Cairo in Arabic.
 */

type Door = {
  to: string;
  icon: KloverIconName;
  tone: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  ctaEn: string;
  ctaAr: string;
};

const DOORS: Door[] = [
  {
    to: "/games",
    icon: "klobi-headphones",
    tone: "bg-klovers-yellow",
    titleEn: "Games",
    titleAr: "الألعاب",
    bodyEn: "Practise Hangul, words and grammar between classes. Free to start, no download.",
    bodyAr: "تدرّب على الهانغول والمفردات والقواعد بين الحصص. مجانية للبدء، ومن غير تحميل.",
    ctaEn: "Play now",
    ctaAr: "العب الآن",
  },
  {
    to: "/games",
    icon: "klobi-reading",
    tone: "bg-white",
    titleEn: "Cluby, your study buddy",
    titleAr: "كلوبي، رفيق مذاكرتك",
    bodyEn: "Cluby cheers you on in every game world, and new outfits are on the way.",
    bodyAr: "كلوبي بيشجّعك في كل عالم من عوالم الألعاب، وأزياء جديدة في الطريق.",
    ctaEn: "Meet Cluby",
    ctaAr: "تعرّف على كلوبي",
  },
  {
    to: "/journey/before-korea",
    icon: "namsan-tower",
    tone: "bg-white",
    titleEn: "Korea's story",
    titleAr: "حكاية كوريا",
    bodyEn: "Five stops from the first legend to today, with the words that belong to each one.",
    bodyAr: "خمس محطات من أول أسطورة حتى اليوم، ومع كل محطة الكلمات اللي تخصّها.",
    ctaEn: "Start the journey",
    ctaAr: "ابدأ الرحلة",
  },
  {
    to: "/blog",
    icon: "globe-plane",
    tone: "bg-klovers-yellow",
    titleEn: "The Journal",
    titleAr: "المدونة",
    bodyEn: "Short reads on Korean culture, K-drama words and study tips, in English and Arabic.",
    bodyAr: "مقالات قصيرة عن الثقافة الكورية وكلمات الدراما ونصائح المذاكرة، بالعربي والإنجليزي.",
    ctaEn: "Read the Journal",
    ctaAr: "اقرأ المدونة",
  },
];

const MoreThanAClass = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section id="more-than-a-class" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-charcoal/10 bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
            {isAr ? "أكتر من مجرد حصة" : "More than a class"}
          </span>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            {isAr ? "كوريا معاك بين الحصص كمان" : "Korean keeps going between classes"}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isAr
              ? "ألعاب، وحكاية كوريا، ومدونة، كلها مجانية ومتاحة لكل طالب."
              : "Games, Korea's story and the Journal. Free, and open to every learner."}
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOORS.map((d) => (
            <Link
              key={d.titleEn}
              to={d.to}
              className={`group flex flex-col rounded-2xl border border-charcoal/10 p-5 text-charcoal shadow-[0_18px_40px_-28px_rgba(46,46,46,0.75)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${d.tone}`}
            >
              <KloverIcon name={d.icon} className="mb-3 h-14 w-14" />
              <h3 className="font-display text-lg font-bold">{isAr ? d.titleAr : d.titleEn}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-charcoal/70">{isAr ? d.bodyAr : d.bodyEn}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold">
                {isAr ? d.ctaAr : d.ctaEn}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </span>
            </Link>
          ))}
        </div>

        <p className="cluby-note mt-8 text-center text-foreground/70" lang={isAr ? "ar" : "en"}>
          {isAr ? "شوية كل يوم، وهتفرق معاك" : "A little every day adds up"}
        </p>
      </div>
    </section>
  );
};

export default MoreThanAClass;
