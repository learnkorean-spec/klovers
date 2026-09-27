import { useEffect, useMemo } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import type { LearnId, SayId } from "../config/interactions";
import type { AvatarId } from "../player/characters";

/**
 * The one small card for people and words, shown over the world without
 * stopping it: the Korean, what it means, one short note — and "Listen"
 * where the browser can speak Korean. Walking away (or E, or Close) puts it
 * away; the learner never has to leave the world to learn something in it.
 *
 *  say   a person's line (name · Korean · meaning · Cluby's note)
 *  talk  a named character's greeting (the other learner, Minsu)
 *  learn a word or a letter (Korean · how it sounds · meaning · example)
 */
export type Bubble =
  | { kind: "say"; id: SayId }
  | { kind: "talk"; who: "friend" | "minsu" }
  | { kind: "learn"; id: LearnId };

interface LearnText {
  ko: string;
  roman: string;
  meaning: string;
  note?: string;
  example?: { ko: string; gloss: string };
}

const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

export default function DialogueBubble({
  lang,
  bubble,
  avatar,
  clubyHere,
  onClose,
}: {
  lang: WorldLang;
  bubble: Bubble;
  avatar: AvatarId;
  /** Cluby is awake and following: the note is his. Otherwise it is just a note. */
  clubyHere: boolean;
  onClose: () => void;
}) {
  const copy = WORLD_COPY[lang];
  const { speakKorean } = useSpeech({ rate: 0.85 });
  const speakable = useMemo(canSpeak, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (canSpeak()) window.speechSynthesis.cancel();
    };
  }, [onClose]);

  let name: string | null = null;
  let ko: string;
  let lines: JSX.Element;
  let big = false;

  if (bubble.kind === "learn") {
    const t = copy.learn[bubble.id] as LearnText;
    ko = t.ko;
    big = true;
    lines = (
      <>
        <p className="text-xs font-semibold tracking-wide text-charcoal/60">{t.roman}</p>
        <p className="font-display text-lg font-bold leading-tight">{t.meaning}</p>
        {t.note && <p className="text-sm text-charcoal/75">{t.note}</p>}
        {t.example && (
          <p className="rounded-xl bg-white px-3 py-1.5 text-sm">
            <span lang="ko" dir="ltr" className="font-ko font-bold">
              {t.example.ko}
            </span>
            <span className="block text-xs text-charcoal/70">{t.example.gloss}</span>
          </p>
        )}
      </>
    );
  } else if (bubble.kind === "say") {
    const t = copy.say[bubble.id];
    name = t.name;
    ko = t.ko;
    lines = (
      <>
        <p className="font-semibold">{t.gloss}</p>
        <p className="text-sm text-charcoal/75">
          {clubyHere && <span className="font-bold">{copy.clubyName}: </span>}
          {t.note}
        </p>
      </>
    );
  } else {
    const c = copy.talk;
    const friendId = avatar === "lina" ? "adam" : "lina";
    const hello = bubble.who === "minsu" ? c.minsu : c[friendId];
    name = bubble.who === "minsu" ? copy.names.minsu : copy.names[friendId];
    ko = hello.ko;
    lines = (
      <>
        <p className="font-semibold">{hello.gloss}</p>
        <p className="text-sm text-charcoal/80">{bubble.who === "minsu" ? c.minsuLine : c.friendLine}</p>
        <p className="text-xs text-charcoal/65">{c.note}</p>
      </>
    );
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={name ?? ko}
      // Beside the learner, never over them: the learner stands left of
      // centre (over-the-shoulder camera), so the note sits to the right —
      // on a portrait phone, under the top bar. Short screens get a compact
      // card that always fits.
      className="pointer-events-auto absolute left-1/2 top-[6rem] flex max-h-[calc(100dvh-9rem)] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-1.5 overflow-y-auto rounded-3xl border-b-4 border-klovers-yellow bg-ivory/95 px-5 pb-3 pt-3 text-center text-charcoal shadow-xl motion-safe:animate-in motion-safe:fade-in landscape:left-auto landscape:right-[max(1rem,4vw)] landscape:top-1/2 landscape:-translate-y-1/2 landscape:translate-x-0 [@media(max-height:500px)]:max-h-[calc(100dvh-5.5rem)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:py-2"
    >
      {name && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/60">{name}</p>}
      <p lang="ko" dir="ltr" className={`font-ko font-bold leading-snug ${big ? "text-5xl [@media(max-height:500px)]:text-3xl" : "text-2xl [@media(max-height:500px)]:text-xl"}`} style={{ wordBreak: "keep-all" }}>
        {ko}
      </p>
      {lines}
      <div className="flex items-center gap-2 pt-1">
        {speakable && (
          <button
            type="button"
            onClick={(e) => {
              speakKorean(ko);
              e.currentTarget.blur();
            }}
            className="min-h-9 rounded-full bg-charcoal px-4 text-xs font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
          >
            {copy.card.listen}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            onClose();
            e.currentTarget.blur();
          }}
          className="min-h-9 rounded-full border-2 border-charcoal/30 px-4 text-xs font-bold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal"
        >
          {copy.card.close}
        </button>
      </div>
    </div>
  );
}
