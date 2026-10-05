import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { logLeadEvent } from "@/lib/leadTracking";

/**
 * "More than live classes" - the one section that says why Klovers and not
 * any other video-call language school.
 *
 * 23 Sep 2026 (a): replaced four homepage sections (culture, eras, games,
 * journal) that told the culture story three times.
 *
 * 23 Sep 2026 (b), CRO pass: six doors instead of four - the whole Klovers
 * ecosystem at a glance: live classes, practice, games, Cluby, culture, and
 * the learning path. Each is one line and a link to a page that already
 * exists; nothing is rebuilt here. The free Hangul starter sheet (moved out of
 * the hero so it no longer competes with Book a Free Class) and the Journal
 * are linked underneath.
 *
 * 24 Sep 2026: no flat characters. Games uses the headphones drawing, the
 * Cluby door shows the 3D Cluby himself, and the hanok-alley scene stands
 * beside the grid on lg+ with softly dissolved edges.
 *
 * Palette: Yellow, Charcoal, Ivory, white cards.
 */

type Door = {
  to: string;
  /** A painted object icon, or - for the Cluby door only - the 3D Cluby. */
  icon?: KloverIconName;
  cluby?: boolean;
  tone: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
};

const DOORS: Door[] = [
  {
    to: "/free-trial",
    icon: "chat-annyeong",
    tone: "bg-klovers-yellow",
    titleEn: "Live classes",
    titleAr: "حصص مباشرة",
    bodyEn: "Learn with a real teacher, in a small group.",
    bodyAr: "تعلّم مع معلمة حقيقية في مجموعة صغيرة.",
  },
  {
    to: "/review",
    icon: "flashcard-ga",
    tone: "bg-ivory",
    titleEn: "Practice",
    titleAr: "تدريب",
    bodyEn: "Review your vocabulary between classes so it sticks.",
    bodyAr: "مراجعة المفردات بين الحصص لتثبت في الذاكرة.",
  },
  {
    to: "/games",
    icon: "game-headphones-music",
    tone: "bg-ivory",
    titleEn: "Games",
    titleAr: "الألعاب",
    bodyEn: "Hangul, words and grammar as games. Free to start.",
    bodyAr: "الهانغول والمفردات والقواعد في شكل ألعاب. مجانية للبدء.",
  },
  {
    to: "/games",
    cluby: true,
    tone: "bg-klovers-yellow",
    titleEn: "Cluby",
    titleAr: "كلوبي",
    bodyEn: "Your study buddy, cheering you on in every game world.",
    bodyAr: "رفيق المذاكرة، يشجّع المتعلّم في كل عالم من عوالم الألعاب.",
  },
  {
    to: "/journey/before-korea",
    icon: "namsan-tower",
    tone: "bg-ivory",
    titleEn: "Culture",
    titleAr: "الثقافة",
    bodyEn: "Korea's story, from the first legend to today.",
    bodyAr: "حكاية كوريا، من أول أسطورة حتى اليوم.",
  },
  {
    to: "/courses",
    icon: "growth-chart",
    tone: "bg-ivory",
    titleEn: "Learning path",
    titleAr: "مسار التعلّم",
    bodyEn: "Hangul, then Levels 1 to 6. Always know what comes next.",
    bodyAr: "الهانغول، ثم المستويات من ١ إلى ٦، وتعرف دائمًا الخطوة التالية.",
  },
];

/** Soft radial edge: inset images dissolve into the surface they sit on. */
const SOFT_EDGE = {
  WebkitMaskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)",
  maskImage: "radial-gradient(ellipse 50% 50% at 50% 50%, #000 58%, transparent 100%)",
};

const MoreThanAClass = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section id="more-than-a-class" className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="mb-4 inline-block rounded-full border border-charcoal/10 bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
            {isAr ? "أكثر من مجرد حصص" : "More than live classes"}
          </span>
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground md:text-4xl">
            {isAr ? "كل ما يلزم للاستمرار" : "Everything that keeps you going"}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">
            {isAr
              ? "الحصة هي البداية، والتدريب والألعاب والثقافة لتثبيت الدروس."
              : "The class is where it starts. Practice, games and culture make it stick."}
          </p>
        </div>

        <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-center lg:gap-8">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {DOORS.map((d) => (
              <Link
                key={d.titleEn}
                to={d.to}
                className={`group flex flex-col rounded-2xl border border-charcoal/10 p-4 sm:p-5 text-charcoal shadow-[0_18px_40px_-28px_rgba(46,46,46,0.75)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal ${d.tone}`}
              >
                {d.cluby ? (
                  <img
                    src="/assets/cluby/cluby-wave.webp"
                    alt=""
                    aria-hidden="true"
                    width={314}
                    height={440}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="mb-2 h-11 w-auto shrink-0 select-none self-start object-contain drop-shadow-[0_4px_6px_rgba(46,46,46,0.3)] sm:h-12"
                  />
                ) : d.icon ? (
                  <KloverIcon name={d.icon} className="mb-2 h-11 w-11 sm:h-12 sm:w-12" />
                ) : null}
                <h3 className="flex items-center gap-1 font-display text-base font-bold">
                  {isAr ? d.titleAr : d.titleEn}
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                </h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-charcoal/70">{isAr ? d.bodyAr : d.bodyEn}</p>
              </Link>
            ))}
          </div>

          {/* The hanok-alley scene, end side, large screens only. */}
          <img
            src="/assets/cluby/scene-hanok.webp"
            alt={isAr ? "لينا وكلوبي يعبران بوابة هانوك تقليدية" : "Lina and Cluby stepping through a hanok gate"}
            width={1086}
            height={1448}
            loading="lazy"
            decoding="async"
            className="hidden h-auto w-full lg:block"
            style={SOFT_EDGE}
          />
        </div>

        <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link
            to="/hangul-starter"
            onClick={() => { try { logLeadEvent({ source_type: "free_resource", cta_label: "more_than_class_hangul_sheet" }); } catch {} }}
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/70"
          >
            <KloverIcon name="flashcard-ga" className="h-6 w-6" />
            {isAr ? "بداية مع الهانغول؟ ورقة البداية المجانية" : "New to Hangul? Get the free starter sheet"}
          </Link>
          <Link
            to="/blog"
            className="inline-flex min-h-11 items-center gap-2 font-semibold text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/70"
          >
            {isAr ? "قراءة المدونة" : "Read the Journal"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </p>
      </div>
    </section>
  );
};

export default MoreThanAClass;
