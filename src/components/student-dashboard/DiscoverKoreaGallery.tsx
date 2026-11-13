import { useLanguage } from "@/contexts/LanguageContext";
import imgJeju from "@/assets/blog/jeju-island.jpg";
import imgBBQ from "@/assets/blog/korean-bbq.jpg";
import imgTemple from "@/assets/blog/korean-temple.jpg";
import imgHanbok from "@/assets/blog/hanbok-fashion.jpg";
import imgKpop from "@/assets/blog/kpop-concert.jpg";
import imgNightMarket from "@/assets/blog/korean-nightmarket.jpg";
import imgTea from "@/assets/blog/korean-tea.jpg";
import imgMarket from "@/assets/blog/korean-market.jpg";

/**
 * The "Discover Korea" photo strip. Moved out of StudentDashboard.tsx
 * (13 Nov 2026) and lazy-loaded, so its eight photos are only fetched when
 * the Explore tab is opened.
 */
export function DiscoverKoreaGallery() {
  const { t, language } = useLanguage();
  const SCENES = [
    { img: imgJeju,        ko: "제주도",   en: "Jeju Island",       caption: "Volcanic paradise",    arName: "جزيرة جيجو",      arCaption: "جنة بركانية" },
    { img: imgBBQ,         ko: "삼겹살",   en: "Korean BBQ",         caption: "Grilled pork belly",   arName: "الشواء الكوري",   arCaption: "لحم مشوي على الطريقة الكورية" },
    { img: imgTemple,      ko: "사찰",     en: "Buddhist Temple",    caption: "Mountain temples",     arName: "معبد بوذي",       arCaption: "معابد بين الجبال" },
    { img: imgHanbok,      ko: "한복",     en: "Traditional Hanbok", caption: "Centuries of fashion", arName: "الهانبوك التقليدي", arCaption: "أزياء عمرها قرون" },
    { img: imgKpop,        ko: "케이팝",   en: "K-Pop Concert",      caption: "Global music wave",    arName: "حفلة كيبوب",      arCaption: "موجة موسيقية عالمية" },
    { img: imgNightMarket, ko: "야시장",   en: "Night Market",       caption: "Street food & vibes",  arName: "السوق الليلي",    arCaption: "أكل الشارع وأجواء مميزة" },
    { img: imgTea,         ko: "차 문화",  en: "Tea Culture",        caption: "Calm & tradition",     arName: "ثقافة الشاي",     arCaption: "هدوء وتقاليد" },
    { img: imgMarket,      ko: "전통시장", en: "Traditional Market", caption: "Colors & local life",  arName: "السوق التقليدي",  arCaption: "ألوان وحياة محلية" },
  ].map(({ en, caption, arName, arCaption, ...rest }) =>
    language === "ar" ? { ...rest, en: arName, caption: arCaption } : { ...rest, en, caption }
  );
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("dashboardPage.discoverKorea")}</h2>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground" tabIndex={0} role="region" aria-label={t("dashboardPage.discoverKorea")}>
        {SCENES.map(({ img, ko, en, caption }) => (
          <div key={ko} className="relative flex-none w-36 h-44 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
            <img src={img} alt={`${en} (${ko})`} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-2.5">
              <p className="text-white font-bold text-base leading-tight" lang="ko">{ko}</p>
              <p className="text-white/75 text-[10px] leading-tight">{en}</p>
              <p className="text-white/50 text-[9px] mt-0.5">{caption}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
