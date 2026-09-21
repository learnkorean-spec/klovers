import { Link } from "react-router-dom";
import { Landmark, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logLeadEvent } from "@/lib/leadTracking";
import OptimizedImage from "@/components/OptimizedImage";

/**
 * CultureHeritageSection — "Korean isn't just grammar, it's a whole culture."
 *
 * Every tile here is a real, already-published Klovers blog post — verified
 * live in `blog_posts` (Supabase) before this was written, both EN and AR
 * versions, `published = true`. That matters because a sibling component,
 * WhyLearnKorean.tsx, deliberately ships with an empty image map and a
 * comment explaining why: "putting images of unchecked provenance on the
 * homepage is not a thing to do quietly." These images aren't unchecked —
 * they're the same photos already live on kloversegy.com/blog, just given a
 * second, better-lit home on the page that's supposed to hook a new visitor.
 *
 * Deliberately NOT used here: the older local files in public/assets/blog
 * (gyeongbokgung.jpg, joseon-dynasty.jpg, dangun-myth.jpg, hwarang-warriors.jpg
 * and a few others) that would have made a richer "history" set. They don't
 * appear as `hero_image` on any published post — the two posts that cover
 * that ground (Gumiho, Dokkaebi) actually serve their images from Supabase
 * Storage instead, which is a strong signal these particular local files are
 * orphaned from an earlier content pipeline, not vetted for this. Same
 * standard as WhyLearnKorean: don't add unverified images quietly. If Re
 * confirms where they're from, they're a natural follow-up to this section.
 *
 * Placement: after CommunityBand, before WhyLearnKorean — "Interest" band in
 * the page's existing AIDA ordering (see comments in Index.tsx), deepening
 * the "K-Culture" motivation card right before it's presented as a reason.
 *
 * 2026-09-20: the ground was #141414 and the scrims pure black. Neither is in
 * the brand's five colours, so both are Charcoal now and the text is Ivory.
 */

interface Tile {
  image: string;
  kickerEn: string;
  kickerAr: string;
  titleEn: string;
  titleAr: string;
  blurbEn: string;
  blurbAr: string;
  slugEn: string;
  slugAr: string;
  altEn: string;
  altAr: string;
}

const TILES: Tile[] = [
  {
    image: "/assets/blog/hangul-science.jpg",
    kickerEn: "Est. 1443",
    kickerAr: "منذ ١٤٤٣",
    titleEn: "Hangul: Built to Be Learned in a Day",
    titleAr: "الهانغول: أبجدية صُممت لتُتعلّم في يوم",
    blurbEn: "King Sejong commissioned it so ordinary people, not just scholars, could read and write.",
    blurbAr: "أمر بها الملك سيجونغ عشان الناس العاديين، مش بس العلماء، يقدروا يقرأوا ويكتبوا.",
    slugEn: "learn-korean-alphabet-hangul-guide",
    slugAr: "learn-korean-alphabet-hangul-guide-ar",
    altEn: "Korean Hangul characters written on paper",
    altAr: "حروف الهانغول مكتوبة على ورقة",
  },
  {
    image: "/assets/blog/hanbok-fashion.jpg",
    kickerEn: "Tradition",
    kickerAr: "تقليد",
    titleEn: "Hanbok, Korea's Traditional Dress",
    titleAr: "الهانبوك: الزي الكوري التقليدي",
    blurbEn: "How it went from everyday wear to the outfit worn at every major celebration today.",
    blurbAr: "قصة تحوّله من لباس يومي إلى الزي اللي بيتلبس في كل مناسبة كبيرة.",
    slugEn: "hanbok-korean-traditional-clothing",
    slugAr: "hanbok-korean-traditional-clothing-ar",
    altEn: "Traditional Korean Hanbok dress",
    altAr: "الزي التقليدي الكوري الهانبوك",
  },
  {
    image: "/assets/blog/seollal-new-year.jpg",
    kickerEn: "Holidays",
    kickerAr: "أعياد",
    titleEn: "Seollal & Chuseok",
    titleAr: "سولال وتشوسوك",
    blurbEn: "Korea's two biggest holidays — the rituals, the foods, and the words every learner should know.",
    blurbAr: "أهم عيدين في الثقافة الكورية: طقوسهما وأطباقهما الخاصة.",
    slugEn: "korean-traditional-holidays-chuseok-seollal",
    slugAr: "korean-traditional-holidays-chuseok-seollal-ar",
    altEn: "Colorful Korean traditional Chuseok harvest festival table with rice cakes and fruit",
    altAr: "مائدة عيد تشوسوك الكوري التقليدي مع كعك الأرز والفواكه الملونة",
  },
  {
    image: "/assets/blog/korean-wedding.jpg",
    kickerEn: "Ceremony",
    kickerAr: "طقوس",
    titleEn: "Inside a Korean Wedding",
    titleAr: "داخل حفل زفاف كوري",
    blurbEn: "From the modern Western-style ceremony to the traditional Pyebaek ritual.",
    blurbAr: "من الحفل الحديث بالطراز الغربي إلى طقس البييباك التقليدي.",
    slugEn: "korean-wedding-traditions-guide",
    slugAr: "korean-wedding-traditions-guide-ar",
    altEn: "Traditional Korean wedding hanbok and pyebaek ceremony setting",
    altAr: "هانبوك زفاف كوري تقليدي وطقس البييباك",
  },
  {
    image: "/assets/blog/korean-honorifics.jpg",
    kickerEn: "Language & Respect",
    kickerAr: "اللغة والاحترام",
    titleEn: "Why Korean Has 7 Speech Levels",
    titleAr: "لماذا للكورية ٧ مستويات كلام؟",
    blurbEn: "Formal, polite, casual — how the language itself encodes who you're speaking to.",
    blurbAr: "الرسمي والمهذب والعادي: كيف تعكس اللغة نفسها علاقتك بمن تتحدث معه.",
    slugEn: "korean-speech-levels-honorifics-guide",
    slugAr: "korean-speech-levels-honorifics-guide-ar",
    altEn: "Korean business professionals bowing respectfully showing formal speech level usage",
    altAr: "محترفون كوريون ينحنون باحترام يظهرون مستويات الكلام الرسمي",
  },
  {
    image: "/assets/blog/korean-music.jpg",
    kickerEn: "Hallyu",
    kickerAr: "الموجة الكورية",
    titleEn: "Learning Korean Through K-Pop",
    titleAr: "تعلّم الكورية عبر الكيبوب",
    blurbEn: "Millions of fans are already absorbing Korean by accident — how to turn that into real fluency.",
    blurbAr: "ملايين المعجبين بيتعلموا كورية من غير ما يحسوا — إزاي تحوّلها لطلاقة حقيقية.",
    slugEn: "learn-korean-through-kpop-bts-blackpink",
    slugAr: "learn-korean-through-kpop-bts-blackpink-ar",
    altEn: "Concert stage with colorful lights and a massive crowd of fans",
    altAr: "ميكروفون على مسرح حفل موسيقى كيبوب مع أضواء ملونة",
  },
  {
    image: "/assets/blog/korean-superstitions.jpg",
    kickerEn: "Folklore",
    kickerAr: "فولكلور",
    titleEn: "Korean Zodiac & Fortune-Telling",
    titleAr: "الأبراج والتنجيم الكوري",
    blurbEn: "Saju, the 12 animal signs, and gunghap compatibility readings — still very much alive today.",
    blurbAr: "الساجو، والحيوانات الاثني عشرية، وقراءات التوافق — تقليد ما زال حاضرًا اليوم.",
    slugEn: "korean-zodiac-fortune-telling-guide",
    slugAr: "korean-zodiac-fortune-telling-guide-ar",
    altEn: "Traditional Korean zodiac animal illustrations representing fortune telling",
    altAr: "رسوم حيوانات الأبراج الكورية التقليدية ترمز للتنجيم",
  },
  {
    image: "/assets/blog/tteokbokki.jpg",
    kickerEn: "Street Food",
    kickerAr: "أكل الشارع",
    titleEn: "A Taste of Korean Street Food",
    titleAr: "طعم أكل الشارع الكوري",
    blurbEn: "From tteokbokki to hotteok — the dishes, the carts, and the words to order with confidence.",
    blurbAr: "من التوكبوكي إلى الهوتوك: الأطباق والمفردات اللي تحتاجها تطلب بثقة.",
    slugEn: "korean-street-food-guide",
    slugAr: "korean-street-food-guide-ar",
    altEn: "Korean street food stall with tteokbokki and skewers",
    altAr: "عربة أكل شارع كورية تعرض التوكبوكي والأسياخ",
  },
];

const CultureHeritageSection = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-20 md:py-28 bg-charcoal relative overflow-hidden">
      {/* Faint decorative Korean text, echoing the hero's backdrop treatment
          so this section reads as part of the same visual system. */}
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 select-none pointer-events-none font-ko-hand font-normal leading-none"
        style={{ fontSize: "clamp(140px, 22vw, 320px)", color: "rgba(255,255,0,0.03)" }}
      >
        문화
      </span>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 md:mb-16 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-ivory/10 border border-ivory/15 px-4 py-2 rounded-full text-sm font-medium text-ivory">
            <Landmark className="h-4 w-4 text-klovers-yellow" />
            {isAr ? "ثقافة وتاريخ" : "Culture & History"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-ivory tracking-tight leading-tight">
            {isAr ? "لغة تفتح لك ثقافة كاملة" : "A Language Opens a Culture"}
          </h2>
          <p className="text-ivory/70 text-base md:text-lg leading-relaxed">
            {isAr
              ? "الكورية مش مجرد قواعد ومفردات، هي تاريخ ممتد وتقاليد حية وثقافة بيحبها ملايين حول العالم. كل درس هنا بيوصّلك بحاجة حقيقية."
              : "Korean isn't just grammar and vocabulary — it's centuries of history, living traditions, and a culture millions of people are falling for. Every lesson here touches something real."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-6xl mx-auto">
          {TILES.map((tile) => {
            const slug = isAr ? tile.slugAr : tile.slugEn;
            const title = isAr ? tile.titleAr : tile.titleEn;
            const kicker = isAr ? tile.kickerAr : tile.kickerEn;
            const blurb = isAr ? tile.blurbAr : tile.blurbEn;
            const alt = isAr ? tile.altAr : tile.altEn;

            return (
              <Link
                key={tile.slugEn}
                to={`/blog/${slug}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal"
                onClick={() => { try { logLeadEvent({ source_type: "culture_section", cta_label: `culture_${tile.slugEn}` }); } catch {} }}
              >
                <div className="relative w-full aspect-[3/4] overflow-hidden">
                  <OptimizedImage
                    src={tile.image}
                    alt={alt}
                    variant="card"
                    // OptimizedImage's card variant hardcodes aspect-video
                    // (16:9) on its own wrapper div; without `!` this outer
                    // aspect-[3/4] card would show a letterboxed image with
                    // empty space below it rather than filling the tile.
                    className="!aspect-[3/4] h-full w-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(to bottom, rgba(46,46,46,0.05) 0%, rgba(46,46,46,0.30) 45%, rgba(46,46,46,0.94) 100%)",
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-4">
                    <span className="inline-block w-fit mb-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-klovers-yellow bg-charcoal/60 rounded-full px-2 py-0.5">
                      {kicker}
                    </span>
                    <h3 className="text-ivory font-bold text-sm md:text-base leading-snug mb-1">
                      {title}
                    </h3>
                    <p className="hidden md:block text-ivory/75 text-xs leading-relaxed line-clamp-2">
                      {blurb}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-10 md:mt-12">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-ivory/80 hover:text-ivory text-sm font-semibold underline underline-offset-4 decoration-ivory/30 hover:decoration-ivory/60 transition-colors"
          >
            {isAr ? "اكتشف المزيد عن ثقافة كوريا" : "Discover more of Korean culture"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CultureHeritageSection;
