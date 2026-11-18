import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { cloudVoiceFits, playCloudKorean } from "@/lib/cloudVoice";

/**
 * Tap Cluby (Re, 19 Nov 2026: "press on cluby so he jumps").
 *
 * Wraps a Cluby picture that is ALREADY on a page and makes it answer a tap:
 * he hops and says one short Korean line out loud, with the reading and the
 * meaning in a small note. Every tap is a tiny lesson, so he stays a
 * companion who teaches (canon roles), never a toy or random decoration.
 * Five quick taps make him spin once and say 어지러워요 ("I'm dizzy"),
 * which is also a real word to learn.
 *
 * Rules this keeps:
 *  - It never ADDS Cluby anywhere. Use it only where a Cluby image already
 *    renders, and never on the egg-gated surfaces (games, hub, leaderboard,
 *    XP celebration) before lib/clubyAwake.ts says he hatched.
 *  - Never inside a link or another button (a tap there must navigate).
 *  - Reduced motion: the short hop still plays, because the visitor asked
 *    for it with a tap (Re, 19 Nov: "not moving" on a reduced-motion PC);
 *    only the dizzy spin is skipped.
 *  - Sound only after a tap (mobile autoplay rules), one clip at a time.
 */

type Line = { ko: string; rom: string; en: string; ar: string };

/** A0 / Book 1 level lines only: short, useful, and kind. */
const LINES: Line[] = [
  { ko: "안녕하세요!", rom: "annyeonghaseyo", en: "Hello!", ar: "مرحبًا!" },
  { ko: "화이팅!", rom: "hwaiting", en: "You can do it!", ar: "تقدر تعملها!" },
  { ko: "반가워요!", rom: "bangawoyo", en: "Nice to meet you!", ar: "سعيد بلقائك!" },
  { ko: "잘했어요!", rom: "jalhaesseoyo", en: "Well done!", ar: "أحسنت!" },
  { ko: "같이 공부해요!", rom: "gachi gongbuhaeyo", en: "Let's study together!", ar: "يلا نذاكر سوا!" },
  { ko: "괜찮아요!", rom: "gwaenchanayo", en: "It's okay!", ar: "ولا يهمك!" },
  { ko: "고마워요!", rom: "gomawoyo", en: "Thank you!", ar: "شكرًا!" },
  { ko: "오늘도 좋은 하루!", rom: "oneuldo joeun haru", en: "Have a good day!", ar: "يومك سعيد!" },
  { ko: "한국어 재미있어요!", rom: "hangugeo jaemiisseoyo", en: "Korean is fun!", ar: "الكوري ممتع!" },
  { ko: "다시 만나요!", rom: "dasi mannayo", en: "See you again!", ar: "نشوفك تاني!" },
];

const DIZZY: Line = { ko: "어지러워요!", rom: "eojireowoyo", en: "I'm dizzy!", ar: "أنا دايخ!" };

function sayKorean(text: string) {
  const browser = () => {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch {
      /* the voice is a bonus; the note still shows */
    }
  };
  if (cloudVoiceFits(text)) playCloudKorean(text, { rate: 0.9, onFail: browser });
  else browser();
}

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "onClick"> & {
  src: string;
  alt: string;
  /** Classes for the outer button (layout: margins, alignment, shrink). */
  wrapperClassName?: string;
  /** Where the note pops up. Default above. */
  notePlacement?: "top" | "bottom";
  /** Speak the line aloud on tap. Default true. */
  voice?: boolean;
};

export function TapCluby({
  src, alt, className, wrapperClassName, notePlacement = "top", voice = true, ...img
}: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [line, setLine] = useState<Line | null>(null);
  const [anim, setAnim] = useState<"" | "hop" | "spin">("");
  const [nonce, setNonce] = useState(0);
  const next = useRef(Math.floor(Math.random() * LINES.length));
  const taps = useRef<number[]>([]);
  const hideTimer = useRef<number>();

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    const dizzy = taps.current.length >= 5;
    let picked: Line;
    if (dizzy) {
      taps.current = [];
      picked = DIZZY;
    } else {
      picked = LINES[next.current % LINES.length];
      next.current += 1;
    }
    setLine(picked);
    setAnim(dizzy ? "spin" : "hop");
    setNonce((n) => n + 1);
    if (voice) sayKorean(picked.ko);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setLine(null), 3200);
  };

  const label = isAr ? `${alt}، اضغط ليقول جملة كورية` : `${alt}. Tap to hear a Korean phrase`;

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className={cn(
        "group/cluby relative inline-flex cursor-pointer touch-manipulation select-none items-center justify-center rounded-2xl bg-transparent p-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        wrapperClassName,
      )}
    >
      <img
        key={nonce}
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        {...img}
        className={cn(
          "transition-transform duration-200 group-hover/cluby:-rotate-3 group-hover/cluby:scale-105",
          anim === "hop" && "animate-cluby-hop",
          anim === "spin" && "motion-safe:animate-cluby-dizzy",
          className,
        )}
        onAnimationEnd={() => setAnim("")}
      />
      {line && (
        <span
          role="status"
          className={cn(
            "pointer-events-none absolute -inset-x-24 z-30 flex justify-center",
            notePlacement === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          <span className="block w-max max-w-[14rem] rounded-2xl border border-charcoal/10 border-b-4 border-b-primary bg-background px-3 py-2 text-center shadow-lg motion-safe:animate-scale-in">
            <span lang="ko" className="block text-base font-bold leading-tight text-foreground">
              {line.ko}
            </span>
            <span className="block text-[11px] italic leading-tight text-muted-foreground">{line.rom}</span>
            <span lang={isAr ? "ar" : "en"} className="mt-0.5 block text-xs font-semibold leading-tight text-foreground/80">
              {isAr ? line.ar : line.en}
            </span>
          </span>
        </span>
      )}
    </button>
  );
}

export default TapCluby;
