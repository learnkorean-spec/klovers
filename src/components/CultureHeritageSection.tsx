import { Link } from "react-router-dom";
import { Landmark, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { logEngagementEvent } from "@/lib/leadTracking";
import OptimizedImage from "@/components/OptimizedImage";

/**
 * CultureHeritageSection â€” "Korean isn't just grammar, it's a whole culture."
 *
 * Every tile here is a real, already-published Klovers blog post â€” verified
 * live in `blog_posts` (Supabase) before this was written, both EN and AR
 * versions, `published = true`. That matters because a sibling component,
 * WhyLearnKorean.tsx, deliberately ships with an empty image map and a
 * comment explaining why: "putting images of unchecked provenance on the
 * homepage is not a thing to do quietly." These images aren't unchecked â€”
 * they're the same photos already live on kloversegy.com/blog, just given a
 * second, better-lit home on the page that's supposed to hook a new visitor.
 *
 * Deliberately NOT used here: the older local files in public/assets/blog
 * (gyeongbokgung.jpg, joseon-dynasty.jpg, dangun-myth.jpg, hwarang-warriors.jpg
 * and a few others) that would have made a richer "history" set. They don't
 * appear as `hero_image` on any published post â€” the two posts that cover
 * that ground (Gumiho, Dokkaebi) actually serve their images from Supabase
 * Storage instead, which is a strong signal these particular local files are
 * orphaned from an earlier content pipeline, not vetted for this. Same
 * standard as WhyLearnKorean: don't add unverified images quietly. If Re
 * confirms where they're from, they're a natural follow-up to this section.
 *
 * Placement: after CommunityBand, before WhyLearnKorean â€” "Interest" band in
 * the page's existing AIDA ordering (see comments in Index.tsx), deepening
 * the "K-Culture" motivation card right before it's presented as a reason.
 *
 * 2026-09-20: the ground was #141414 and the scrims pure black. Neither is in
 * the brand's five colours, so both are Charcoal now and the text is Ivory.
 *
 * 2026-09-22: tile clicks were calling logLeadEvent (source_type
 * "culture_section", not even a member of the LeadSource union), mirroring
 * every click to the Meta Pixel / GA4 as a `Lead` conversion. Browsing a
 * culture blog post from the homepage is curiosity, not the same intent
 * signal as booking a trial â€” at tile-click volume this quietly dilutes real
 * ad-optimisation data. Switched to logEngagementEvent, which still writes
 * to lead_events for funnel analysis but fires no pixel. See leadTracking.ts.
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
    kickerAr: "Ù…Ù†Ø° Ù¡Ù¤Ù¤Ù£",
    titleEn: "Hangul: Built to Be Learned in a Day",
    titleAr: "Ø§Ù„Ù‡Ø§Ù†ØºÙˆÙ„: Ø£Ø¨Ø¬Ø¯ÙŠØ© ØµÙÙ…Ù…Øª Ù„ØªÙØªØ¹Ù„Ù‘Ù… ÙÙŠ ÙŠÙˆÙ…",
    blurbEn: "King Sejong commissioned it so ordinary people, not just scholars, could read and write.",
    blurbAr: "Ø£Ù…Ø± Ø¨Ù‡Ø§ Ø§Ù„Ù…Ù„Ùƒ Ø³ÙŠØ¬ÙˆÙ†Øº Ø¹Ø´Ø§Ù† Ø§Ù„Ù†Ø§Ø³ Ø§Ù„Ø¹Ø§Ø¯ÙŠÙŠÙ†ØŒ Ù…Ø´ Ø¨Ø³ Ø§Ù„Ø¹Ù„Ù…Ø§Ø¡ØŒ ÙŠÙ‚Ø¯Ø±ÙˆØ§ ÙŠÙ‚Ø±Ø£ÙˆØ§ ÙˆÙŠÙƒØªØ¨ÙˆØ§.",
    slugEn: "learn-korean-alphabet-hangul-guide",
    slugAr: "learn-korean-alphabet-hangul-guide-ar",
    altEn: "Korean Hangul characters written on paper",
    altAr: "Ø­Ø±ÙˆÙ Ø§Ù„Ù‡Ø§Ù†ØºÙˆÙ„ Ù…ÙƒØªÙˆØ¨Ø© Ø¹Ù„Ù‰ ÙˆØ±Ù‚Ø©",
  },
  {
    image: "/assets/blog/hanbok-fashion.jpg",
    kickerEn: "Tradition",
    kickerAr: "ØªÙ‚Ù„ÙŠØ¯",
    titleEn: "Hanbok, Korea's Traditional Dress",
    titleAr: "Ø§Ù„Ù‡Ø§Ù†Ø¨ÙˆÙƒ: Ø§Ù„Ø²ÙŠ Ø§Ù„ÙƒÙˆØ±ÙŠ Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠ",
    blurbEn: "How it went from everyday wear to the outfit worn at every major celebration today.",
    blurbAr: "Ù‚ØµØ© ØªØ­ÙˆÙ‘Ù„Ù‡ Ù…Ù† Ù„Ø¨Ø§Ø³ ÙŠÙˆÙ…ÙŠ Ø¥Ù„Ù‰ Ø§Ù„Ø²ÙŠ Ø§Ù„Ù„ÙŠ Ø¨ÙŠØªÙ„Ø¨Ø³ ÙÙŠ ÙƒÙ„ Ù…Ù†Ø§Ø³Ø¨Ø© ÙƒØ¨ÙŠØ±Ø©.",
    slugEn: "hanbok-korean-traditional-clothing",
    slugAr: "hanbok-korean-traditional-clothing-ar",
    altEn: "Traditional Korean Hanbok dress",
    altAr: "Ø§Ù„Ø²ÙŠ Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠ Ø§Ù„ÙƒÙˆØ±ÙŠ Ø§Ù„Ù‡Ø§Ù†Ø¨ÙˆÙƒ",
  },
  {
    image: "/assets/blog/seollal-new-year.jpg",
    kickerEn: "Holidays",
    kickerAr: "Ø£Ø¹ÙŠØ§Ø¯",
    titleEn: "Seollal & Chuseok",
    titleAr: "Ø³ÙˆÙ„Ø§Ù„ ÙˆØªØ´ÙˆØ³ÙˆÙƒ",
    blurbEn: "Korea's two biggest holidays â€” the rituals, the foods, and the words every learner should know.",
    blurbAr: "Ø£Ù‡Ù… Ø¹ÙŠØ¯ÙŠÙ† ÙÙŠ Ø§Ù„Ø«Ù‚Ø§ÙØ© Ø§Ù„ÙƒÙˆØ±ÙŠØ©: Ø·Ù‚ÙˆØ³Ù‡Ù…Ø§ ÙˆØ£Ø·Ø¨Ø§Ù‚Ù‡Ù…Ø§ Ø§Ù„Ø®Ø§ØµØ©.",
    slugEn: "korean-traditional-holidays-chuseok-seollal",
    slugAr: "korean-traditional-holidays-chuseok-seollal-ar",
    altEn: "Colorful Korean traditional Chuseok harvest festival table with rice cakes and fruit",
    altAr: "Ù…Ø§Ø¦Ø¯Ø© Ø¹ÙŠØ¯ ØªØ´ÙˆØ³ÙˆÙƒ Ø§Ù„ÙƒÙˆØ±ÙŠ Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠ Ù…Ø¹ ÙƒØ¹Ùƒ Ø§Ù„Ø£Ø±Ø² ÙˆØ§Ù„ÙÙˆØ§ÙƒÙ‡ Ø§Ù„Ù…Ù„ÙˆÙ†Ø©",
  },
  {
    image: "/assets/blog/korean-wedding.jpg",
    kickerEn: "Ceremony",
    kickerAr: "Ø·Ù‚ÙˆØ³",
    titleEn: "Inside a Korean Wedding",
    titleAr: "Ø¯Ø§Ø®Ù„ Ø­ÙÙ„ Ø²ÙØ§Ù ÙƒÙˆØ±ÙŠ",
    blurbEn: "From the modern Western-style ceremony to the traditional Pyebaek ritual.",
    blurbAr: "Ù…Ù† Ø§Ù„Ø­ÙÙ„ Ø§Ù„Ø­Ø¯ÙŠØ« Ø¨Ø§Ù„Ø·Ø±Ø§Ø² Ø§Ù„ØºØ±Ø¨ÙŠ Ø¥Ù„Ù‰ Ø·Ù‚Ø³ Ø§Ù„Ø¨ÙŠÙŠØ¨Ø§Ùƒ Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠ.",
    slugEn: "korean-wedding-traditions-guide",
    slugAr: "korean-wedding-traditions-guide-ar",
    altEn: "Traditional Korean wedding hanbok and pyebaek ceremony setting",
    altAr: "Ù‡Ø§Ù†Ø¨ÙˆÙƒ Ø²ÙØ§Ù ÙƒÙˆØ±ÙŠ ØªÙ‚Ù„ÙŠØ¯ÙŠ ÙˆØ·Ù‚Ø³ Ø§Ù„Ø¨ÙŠÙŠØ¨Ø§Ùƒ",
  },
  {
    image: "/assets/blog/korean-honorifics.jpg",
    kickerEn: "Language & Respect",
    kickerAr: "Ø§Ù„Ù„ØºØ© ÙˆØ§Ù„Ø§Ø­ØªØ±Ø§Ù…",
    titleEn: "Why Korean Has 7 Speech Levels",
    titleAr: "Ù„Ù…Ø§Ø°Ø§ Ù„Ù„ÙƒÙˆØ±ÙŠØ© Ù§ Ù…Ø³ØªÙˆÙŠØ§Øª ÙƒÙ„Ø§Ù…ØŸ",
    blurbEn: "Formal, polite, casual â€” how the language itself encodes who you're speaking to.",
    blurbAr: "Ø§Ù„Ø±Ø³Ù…ÙŠ ÙˆØ§Ù„Ù…Ù‡Ø°Ø¨ ÙˆØ§Ù„Ø¹Ø§Ø¯ÙŠ: ÙƒÙŠÙ ØªØ¹ÙƒØ³ Ø§Ù„Ù„ØºØ© Ù†ÙØ³Ù‡Ø§ Ø¹Ù„Ø§Ù‚ØªÙƒ Ø¨Ù…Ù† ØªØªØ­Ø¯Ø« Ù…Ø¹Ù‡.",
    slugEn: "korean-speech-levels-honorifics-guide",
    slugAr: "korean-speech-levels-honorifics-guide-ar",
    altEn: "Korean business professionals bowing respectfully showing formal speech level usage",
    altAr: "Ù…Ø­ØªØ±ÙÙˆÙ† ÙƒÙˆØ±ÙŠÙˆÙ† ÙŠÙ†Ø­Ù†ÙˆÙ† Ø¨Ø§Ø­ØªØ±Ø§Ù… ÙŠØ¸Ù‡Ø±ÙˆÙ† Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„ÙƒÙ„Ø§Ù… Ø§Ù„Ø±Ø³Ù…ÙŠ",
  },
  {
    image: "/assets/blog/korean-music.jpg",
    kickerEn: "Hallyu",
    kickerAr: "Ø§Ù„Ù…ÙˆØ¬Ø© Ø§Ù„ÙƒÙˆØ±ÙŠØ©",
    titleEn: "Learning Korean Through K-Pop",
    titleAr: "ØªØ¹Ù„Ù‘Ù… Ø§Ù„ÙƒÙˆØ±ÙŠØ© Ø¹Ø¨Ø± Ø§Ù„ÙƒÙŠØ¨ÙˆØ¨",
    blurbEn: "Millions of fans are already absorbing Korean by accident â€” how to turn that into real fluency.",
    blurbAr: "Ù…Ù„Ø§ÙŠÙŠÙ† Ø§Ù„Ù…Ø¹Ø¬Ø¨ÙŠÙ† Ø¨ÙŠØªØ¹Ù„Ù…ÙˆØ§ ÙƒÙˆØ±ÙŠØ© Ù…Ù† ØºÙŠØ± Ù…Ø§ ÙŠØ­Ø³ÙˆØ§ â€” Ø¥Ø²Ø§ÙŠ ØªØ­ÙˆÙ‘Ù„Ù‡Ø§ Ù„Ø·Ù„Ø§Ù‚Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ©.",
    slugEn: "learn-korean-through-kpop-bts-blackpink",
    slugAr: "learn-korean-through-kpop-bts-blackpink-ar",
    altEn: "Concert stage with colorful lights and a massive crowd of fans",
    altAr: "Ù…ÙŠÙƒØ±ÙˆÙÙˆÙ† Ø¹Ù„Ù‰ Ù…Ø³Ø±Ø­ Ø­ÙÙ„ Ù…ÙˆØ³ÙŠÙ‚Ù‰ ÙƒÙŠØ¨ÙˆØ¨ Ù…Ø¹ Ø£Ø¶ÙˆØ§Ø¡ Ù…Ù„ÙˆÙ†Ø©",
  },
  {
    image: "/assets/blog/korean-superstitions.jpg",
    kickerEn: "Folklore",
    kickerAr: "ÙÙˆÙ„ÙƒÙ„ÙˆØ±",
    titleEn: "Korean Zodiac & Fortune-Telling",
    titleAr: "Ø§Ù„Ø£Ø¨Ø±Ø§Ø¬ ÙˆØ§Ù„ØªÙ†Ø¬ÙŠÙ… Ø§Ù„ÙƒÙˆØ±ÙŠ",
    blurbEn: "Saju, the 12 animal signs, and gunghap compatibility readings â€” still very much alive today.",
    blurbAr: "Ø§Ù„Ø³Ø§Ø¬ÙˆØŒ ÙˆØ§Ù„Ø­ÙŠÙˆØ§Ù†Ø§Øª Ø§Ù„Ø§Ø«Ù†ÙŠ Ø¹Ø´Ø±ÙŠØ©ØŒ ÙˆÙ‚Ø±Ø§Ø¡Ø§Øª Ø§Ù„ØªÙˆØ§ÙÙ‚ â€” ØªÙ‚Ù„ÙŠØ¯ Ù…Ø§ Ø²Ø§Ù„ Ø­Ø§Ø¶Ø±Ù‹Ø§ Ø§Ù„ÙŠÙˆÙ….",
    slugEn: "korean-zodiac-fortune-telling-guide",
    slugAr: "korean-zodiac-fortune-telling-guide-ar",
    altEn: "Traditional Korean zodiac animal illustrations representing fortune telling",
    altAr: "Ø±Ø³ÙˆÙ… Ø­ÙŠÙˆØ§Ù†Ø§Øª Ø§Ù„Ø£Ø¨Ø±Ø§Ø¬ Ø§Ù„ÙƒÙˆØ±ÙŠØ© Ø§Ù„ØªÙ‚Ù„ÙŠØ¯ÙŠØ© ØªØ±Ù…Ø² Ù„Ù„ØªÙ†Ø¬ÙŠÙ…",
  },
  {
    image: "/assets/blog/tteokbokki.jpg",
    kickerEn: "Street Food",
    kickerAr: "Ø£ÙƒÙ„ Ø§Ù„Ø´Ø§Ø±Ø¹",
    titleEn: "A Taste of Korean Street Food",
    titleAr: "Ø·Ø¹Ù… Ø£ÙƒÙ„ Ø§Ù„Ø´Ø§Ø±Ø¹ Ø§Ù„ÙƒÙˆØ±ÙŠ",
    blurbEn: "From tteokbokki to hotteok â€” the dishes, the carts, and the words to order with confidence.",
    blurbAr: "Ù…Ù† Ø§Ù„ØªÙˆÙƒØ¨ÙˆÙƒÙŠ Ø¥Ù„Ù‰ Ø§Ù„Ù‡ÙˆØªÙˆÙƒ: Ø§Ù„Ø£Ø·Ø¨Ø§Ù‚ ÙˆØ§Ù„Ù…ÙØ±Ø¯Ø§Øª Ø§Ù„Ù„ÙŠ ØªØ­ØªØ§Ø¬Ù‡Ø§ ØªØ·Ù„Ø¨ Ø¨Ø«Ù‚Ø©.",
    slugEn: "korean-street-food-guide",
    slugAr: "korean-street-food-guide-ar",
    altEn: "Korean street food stall with tteokbokki and skewers",
    altAr: "Ø¹Ø±Ø¨Ø© Ø£ÙƒÙ„ Ø´Ø§Ø±Ø¹ ÙƒÙˆØ±ÙŠØ© ØªØ¹Ø±Ø¶ Ø§Ù„ØªÙˆÙƒØ¨ÙˆÙƒÙŠ ÙˆØ§Ù„Ø£Ø³ÙŠØ§Ø®",
  },
  {
    image: "/assets/blog/dokkaebi-goblin.jpg",
    kickerEn: "K-Drama Icon",
    kickerAr: "أيقونة درامية",
    titleEn: "Dokkaebi: The Korean Goblin Myth",
    titleAr: "دوكايبي: أسطورة العفريت الكوري",
    blurbEn: "Origins, powers, and how the 2016 K-drama Goblin made this folklore figure a global icon.",
    blurbAr: "أصل الأسطورة وقدراتها، وكيف حوّلها مسلسل ٢٠١٦ إلى أيقونة عالمية.",
    slugEn: "dokkaebi-korean-goblin-myth-kdrama",
    slugAr: "dokkaebi-korean-goblin-myth-kdrama-ar",
    altEn: "Dokkaebi Korean goblin from folklore",
    altAr: "عفريت Dokkaebi الكوري من الفولكلور",
  },
  {
    image: "/assets/blog/gumiho-legend.jpg",
    kickerEn: "1,000-Year Myth",
    kickerAr: "أسطورة ألفية",
    titleEn: "Gumiho: The Nine-Tailed Fox",
    titleAr: "الغوميهو: الثعلب ذو الذيول التسعة",
    blurbEn: "The legend behind Korea's most iconic shapeshifter, and why K-dramas still return to her.",
    blurbAr: "أسطورة عمرها ألف عام وراء أشهر كائن متحوّل في الفولكلور الكوري.",
    slugEn: "gumiho-nine-tailed-fox-korean-folklore",
    slugAr: "gumiho-nine-tailed-fox-korean-folklore-ar",
    altEn: "Gumiho nine-tailed fox in Korean folklore",
    altAr: "غوميهو ثعلب ذو تسعة ذيول في الفولكلور الكوري",
  },];

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
        ë¬¸í™”
      </span>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12 md:mb-16 space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-ivory/10 border border-ivory/15 px-4 py-2 rounded-full text-sm font-medium text-ivory">
            <Landmark className="h-4 w-4 text-klovers-yellow" />
            {isAr ? "Ø«Ù‚Ø§ÙØ© ÙˆØªØ§Ø±ÙŠØ®" : "Culture & History"}
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-ivory tracking-tight leading-tight">
            {isAr ? "Ù„ØºØ© ØªÙØªØ­ Ù„Ùƒ Ø«Ù‚Ø§ÙØ© ÙƒØ§Ù…Ù„Ø©" : "A Language Opens a Culture"}
          </h2>
          <p className="text-ivory/70 text-base md:text-lg leading-relaxed">
            {isAr
              ? "Ø§Ù„ÙƒÙˆØ±ÙŠØ© Ù…Ø´ Ù…Ø¬Ø±Ø¯ Ù‚ÙˆØ§Ø¹Ø¯ ÙˆÙ…ÙØ±Ø¯Ø§ØªØŒ Ù‡ÙŠ ØªØ§Ø±ÙŠØ® Ù…Ù…ØªØ¯ ÙˆØªÙ‚Ø§Ù„ÙŠØ¯ Ø­ÙŠØ© ÙˆØ«Ù‚Ø§ÙØ© Ø¨ÙŠØ­Ø¨Ù‡Ø§ Ù…Ù„Ø§ÙŠÙŠÙ† Ø­ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù…. ÙƒÙ„ Ø¯Ø±Ø³ Ù‡Ù†Ø§ Ø¨ÙŠÙˆØµÙ‘Ù„Ùƒ Ø¨Ø­Ø§Ø¬Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ©."
              : "Korean isn't just grammar and vocabulary â€” it's centuries of history, living traditions, and a culture millions of people are falling for. Every lesson here touches something real."}
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
                onClick={() => { try { logEngagementEvent({ source_type: "culture_section", cta_label: `culture_${tile.slugEn}` }); } catch {} }}
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
            {isAr ? "Ø§ÙƒØªØ´Ù Ø§Ù„Ù…Ø²ÙŠØ¯ Ø¹Ù† Ø«Ù‚Ø§ÙØ© ÙƒÙˆØ±ÙŠØ§" : "Discover more of Korean culture"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CultureHeritageSection;
