import { useEffect, useMemo, useRef, useState } from "react";
import WorldIconView from "./WorldIconView";
import { HOUSE } from "../config/rooms";
import { useSpeech } from "@/hooks/useSpeech";
import { playVoice, stopVoice, type VoiceLine } from "../systems/voice";
import { canListen, listenFor, type SayResult } from "../systems/sayIt";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import type { LearnId, SayId } from "../config/interactions";
import type { InfoId } from "../config/rooms";
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
 *  info  a Klovers House board (Korean name · what it is · link to the page)
 */
export type Bubble =
  | { kind: "say"; id: SayId }
  | { kind: "talk"; who: "friend" | "minsu" }
  | { kind: "learn"; id: LearnId }
  | { kind: "info"; id: InfoId };

interface LearnText {
  ko: string;
  roman: string;
  meaning: string;
  note?: string;
  example?: { ko: string; gloss: string };
}

const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Who speaks each line: men and boys get a man's voice. */
const MALE_SAY = new Set<SayId>(["vendor", "shopkeeper", "hubFriend", "cafeA", "twoHands", "attendant"]);

/** A Korean voice that is clearly a man's, if this device has one. */
const hasMaleKoreanVoice = () =>
  canSpeak() &&
  window.speechSynthesis
    .getVoices()
    .some((v) => v.lang.toLowerCase().startsWith("ko") && /(^|[^e])male|junwoo|jian|hyunbin|injoon|남/i.test(v.name));

export default function DialogueBubble({
  lang,
  bubble,
  avatar,
  clubyHere,
  onClose,
  onOpenInfo,
}: {
  lang: WorldLang;
  bubble: Bubble;
  avatar: AvatarId;
  /** Cluby is awake and following: the note is his. Otherwise it is just a note. */
  clubyHere: boolean;
  onClose: () => void;
  /** Info boards: go to that part of the site. */
  onOpenInfo?: (id: InfoId) => void;
}) {
  const copy = WORLD_COPY[lang];
  const { speakKorean } = useSpeech({ rate: 0.85 });
  const speakable = useMemo(canSpeak, []);
  const listenable = useMemo(canListen, []);
  /** Guided practice: 0 listen first, 1 then say it. */
  const [step, setStep] = useState<0 | 1>(0);
  const [hearing, setHearing] = useState(false);
  const [result, setResult] = useState<SayResult | null>(null);
  const stopListening = useRef<() => void>(() => {});
  const bubbleKey = bubble.kind === "talk" ? bubble.who : bubble.id;
  useEffect(() => {
    setStep(0);
    setResult(null);
    setHearing(false);
    stopListening.current();
  }, [bubbleKey]);
  useEffect(() => () => stopListening.current(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (canSpeak()) window.speechSynthesis.cancel();
      stopVoice();
    };
  }, [onClose]);

  let name: string | null = null;
  let ko: string;
  let lines: JSX.Element;
  let big = false;
  /** Whose voice reads the Korean: undefined for words (any voice). */
  let voice: "male" | "female" | undefined;
  /** A recorded line for this speaker, if there is one. */
  let line: VoiceLine | `${VoiceLine}-${string}` | undefined;

  if (bubble.kind === "info") {
    const t = copy.info[bubble.id];
    ko = t.ko;
    big = true;
    lines = (
      <>
        <p className="text-xs font-semibold tracking-wide text-charcoal/60">{t.roman}</p>
        <div className="flex items-center gap-3 text-start">
          <WorldIconView icon={HOUSE.icons[bubble.id]} size={52} />
          <div>
            <p className="font-display text-lg font-bold leading-tight">{t.title}</p>
            <p className="text-sm text-charcoal/80">{t.line}</p>
          </div>
        </div>
        {bubble.id === "about" && (
          <div className="flex justify-center gap-2 pt-1">
            {copy.infoStats.map((st) => (
              <div key={st.label} className="rounded-2xl bg-white px-4 py-1.5">
                <p className="font-display text-2xl font-extrabold leading-none">{st.big}</p>
                <p className="text-[11px] font-semibold text-charcoal/70">{st.label}</p>
              </div>
            ))}
          </div>
        )}
        {onOpenInfo && (
          <button
            type="button"
            onClick={() => onOpenInfo(bubble.id)}
            className="mt-1 min-h-10 rounded-full border-2 border-klovers-yellow bg-charcoal px-5 text-sm font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
          >
            {copy.infoOpen}
          </button>
        )}
      </>
    );
  } else if (bubble.kind === "learn") {
    const t = copy.learn[bubble.id] as LearnText;
    ko = t.ko;
    big = true;
    lines = (
      <>
        <p className="text-xs font-semibold tracking-wide text-charcoal/60">{t.roman}</p>
        <p className="font-display text-lg font-bold leading-tight">{t.meaning}</p>
        {t.note && <p className="text-sm text-charcoal/75 [@media(max-height:500px)]:hidden">{t.note}</p>}
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
    voice = MALE_SAY.has(bubble.id) ? "male" : "female";
    line = bubble.id;
    name = t.name;
    // The other learner's lines: their name and their own voice.
    if (bubble.id === "friendCafe" || bubble.id === "friendCulture" || bubble.id === "friendSeoul") {
      const friendId = avatar === "lina" ? "adam" : "lina";
      name = copy.names[friendId];
      voice = friendId === "adam" ? "male" : "female";
      line = `${bubble.id}-${friendId}`;
    }
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
    voice = bubble.who === "minsu" || friendId === "adam" ? "male" : "female";
    line = bubble.who === "minsu" ? "minsu" : friendId;
    const hello = bubble.who === "minsu" ? c.minsu : c[friendId];
    name = bubble.who === "minsu" ? copy.names.minsu : copy.names[friendId];
    ko = hello.ko;
    lines = (
      <>
        <p className="font-semibold">{hello.gloss}</p>
        <p className="text-sm text-charcoal/80">{bubble.who === "minsu" ? c.minsuLine : c.friendLine}</p>
        <p className="text-xs text-charcoal/65 [@media(max-height:500px)]:hidden">{c.note}</p>
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
      className="pointer-events-auto absolute left-1/2 top-[6rem] flex max-h-[calc(100dvh-9rem)] w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-1.5 overflow-y-auto rounded-3xl border-b-4 border-klovers-yellow bg-ivory/95 px-5 pb-3 pt-3 text-center text-charcoal shadow-xl motion-safe:animate-in motion-safe:fade-in landscape:left-auto landscape:right-[max(1rem,4vw)] landscape:top-1/2 landscape:-translate-y-1/2 landscape:translate-x-0 [@media(max-height:500px)]:max-h-[calc(100dvh-5.5rem)] [@media(max-height:500px)]:landscape:top-[calc(50%+1.6rem)] [@media(max-height:500px)]:gap-1 [@media(max-height:500px)]:py-2"
    >
      {name && <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/60">{name}</p>}
      <p lang="ko" dir="ltr" className={`font-ko font-bold leading-snug ${big ? "text-5xl [@media(max-height:500px)]:text-3xl" : "text-2xl [@media(max-height:500px)]:text-xl"}`} style={{ wordBreak: "keep-all" }}>
        {ko}
      </p>
      {lines}
      {listenable && (
        // The two steps, always named: hear it, then say it.
        <ol dir={lang === "ar" ? "rtl" : "ltr"} className="flex items-center gap-1.5 pt-1 text-[11px] font-bold text-charcoal/60" aria-label={copy.card.steps.join(" → ")}>
          {copy.card.steps.map((label, i) => (
            <li key={label} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true" className="text-charcoal/35">{lang === "ar" ? "←" : "→"}</span>}
              <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${step === i ? "bg-klovers-yellow text-charcoal" : ""}`}>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-[10px] text-ivory">{i + 1}</span>
                {label}
              </span>
            </li>
          ))}
        </ol>
      )}
      {(hearing || result) && (
        <p role="status" className="min-h-5 text-sm font-semibold">
          {hearing
            ? copy.card.listening
            : result && "score" in result
              ? result.score >= 0.8
                ? copy.card.great
                : result.score >= 0.5
                  ? copy.card.near
                  : copy.card.again
              : result && "error" in result && result.error === "blocked"
                ? copy.card.micBlocked
                : copy.card.again}
          {!hearing && result && "heard" in result && result.score < 0.8 && (
            <span className="block text-xs font-normal text-charcoal/65">
              {copy.card.heard}:{" "}
              <span lang="ko" dir="ltr" className="font-ko">
                {result.heard}
              </span>
            </span>
          )}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {(speakable || line) && (
          <button
            type="button"
            onClick={(e) => {
              // People speak in their own recorded voice; words (and any
              // failure) use the browser's Korean voice. Many phones carry only
              // a woman's voice: for a man's line the pitch is then lowered.
              const browser = () =>
                speakKorean(ko, voice === "male" ? { gender: "male", pitch: hasMaleKoreanVoice() ? 1 : 0.6 } : voice ? { gender: "female" } : undefined);
              if (line) playVoice(line, browser);
              else browser();
              if (listenable) setStep(1);
              e.currentTarget.blur();
            }}
            className={`min-h-10 rounded-full px-4 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow ${
              step === 0 || !listenable ? "bg-charcoal text-ivory" : "border-2 border-charcoal text-charcoal"
            }`}
          >
            {listenable && <span className="me-1">1</span>}
            {copy.card.listen}
          </button>
        )}
        {listenable && (
          <button
            type="button"
            disabled={hearing}
            onClick={(e) => {
              e.currentTarget.blur();
              stopVoice();
              if (canSpeak()) window.speechSynthesis.cancel();
              setStep(1);
              setResult(null);
              setHearing(true);
              const l = listenFor(ko);
              stopListening.current = l.stop;
              void l.done.then((r) => {
                setHearing(false);
                setResult(r);
              });
            }}
            className={`min-h-10 rounded-full px-4 text-xs font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal disabled:opacity-70 ${
              step === 1 ? "bg-charcoal text-ivory motion-safe:animate-pulse" : "border-2 border-charcoal text-charcoal"
            } ${hearing ? "!animate-none bg-klovers-yellow !text-charcoal" : ""}`}
          >
            <span className="me-1">2</span>
            {copy.card.say}
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            onClose();
            e.currentTarget.blur();
          }}
          className="min-h-10 rounded-full border-2 border-charcoal/30 px-4 text-xs font-bold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-charcoal"
        >
          {copy.card.close}
        </button>
      </div>
    </div>
  );
}
