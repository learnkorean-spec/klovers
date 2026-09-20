import { Button } from "@/components/ui/button";
import imgJeju from "@/assets/blog/jeju-island.jpg";
import imgBBQ from "@/assets/blog/korean-bbq.jpg";
import imgTemple from "@/assets/blog/korean-temple.jpg";
import imgHanbok from "@/assets/blog/hanbok-fashion.jpg";
import imgKpop from "@/assets/blog/kpop-concert.jpg";
import imgTea from "@/assets/blog/korean-tea.jpg";
import imgMarket from "@/assets/blog/korean-market.jpg";

const VOCAB_OF_THE_DAY = [
  { ko: "안녕하세요", rom: "annyeonghaseyo", en: "Hello / Good day", ar: "مرحبًا / أهلًا", emoji: "👋", img: imgTemple },
  { ko: "감사합니다", rom: "gamsahamnida", en: "Thank you", ar: "شكرًا لك", emoji: "🙏", img: imgTea },
  { ko: "사랑해요", rom: "saranghaeyo", en: "I love you", ar: "أحبك", emoji: "❤️", img: imgHanbok },
  { ko: "공부하다", rom: "gongbuhada", en: "To study", ar: "يذاكر / يدرس", emoji: "📚", img: imgMarket },
  { ko: "맛있어요", rom: "massisseoyo", en: "It's delicious", ar: "إنه لذيذ", emoji: "😋", img: imgBBQ },
  { ko: "화이팅", rom: "hwaiting", en: "Fighting! / You can do it!", ar: "هيا! / تقدر تعملها!", emoji: "💪", img: imgKpop },
  { ko: "천천히", rom: "cheoncheonhi", en: "Slowly", ar: "ببطء", emoji: "🐢", img: imgJeju },
];

// Was an inline IIFE directly in StudentDashboard's JSX. Pulled out as a
// named component during the dashboard-page split; behavior is unchanged.
// `onClaim` is passed in because claiming XP needs the parent's
// awardGameXp/vocabStorageKey/setVocabClaimed state, which stays owned by
// StudentDashboard itself.
export const VocabOfTheDayCard = ({
  language, vocabClaimed, onClaim, t,
}: {
  language: string;
  vocabClaimed: boolean;
  onClaim: () => void;
  t: (key: string) => string;
}) => {
  const today = VOCAB_OF_THE_DAY[new Date().getDay() % VOCAB_OF_THE_DAY.length];
  return (
    <div className="relative overflow-hidden rounded-xl min-h-28">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${today.img})` }} />
      <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-black/80 via-black/50 to-black/15" />
      <div className="relative flex flex-wrap items-center gap-3 p-4 sm:p-5">
        <div className="text-3xl drop-shadow">{today.emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{t("dashboardPage.wordOfDay")}</p>
          <p className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight">{today.ko}</p>
          <p className="text-xs text-white/70"><span dir="ltr">{today.rom}</span> · {language === "ar" ? today.ar : today.en}</p>
        </div>
        <Button size="sm" disabled={vocabClaimed} onClick={onClaim}
          className={`shrink-0 ${vocabClaimed ? "bg-white/20 text-white/60 hover:bg-white/20" : "bg-white text-black hover:bg-white/90"}`}
          variant={vocabClaimed ? "outline" : "default"}>
          {vocabClaimed ? t("dashboardPage.claimedXp") : t("dashboardPage.claimXp")}
        </Button>
      </div>
    </div>
  );
};

export default VocabOfTheDayCard;
