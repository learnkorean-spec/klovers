import { useEffect, useRef, useState } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import type { QuizId } from "../config/interactions";
import type { NoticeKey } from "../config/rooms";

/**
 * The small web-UI cards opened from the 3D world (E / the round button).
 * Real learning stays in the site's lessons; these are one-step moments that
 * end in a real action. One language per screen; Korean stays Korean.
 * (People's lines and single words use the lighter DialogueBubble, which
 * does not stop the world.)
 */
export type CardKind = "egg" | "letter" | "word" | "locked" | "quiz";

interface Props {
  lang: WorldLang;
  kind: CardKind;
  /** For a locked gate: which notice to show. */
  notice?: NoticeKey;
  /** For a quiz card: which question. */
  quiz?: QuizId;
  signedIn: boolean;
  /** The bread sign is already back up (the word card opens solved). */
  solved: boolean;
  onClose: () => void;
  onGo: (href: string) => void;
  onWordRight: () => void;
  /** A word met on the way (a wrong pick still teaches that word). */
  onWordSeen?: (ko: string) => void;
  /** The quiz was answered right. */
  onQuizRight?: () => void;
}

const btn = "min-h-11 rounded-full px-5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function InteractionCard({ lang, kind, notice, quiz, signedIn, solved, onClose, onGo, onWordRight, onWordSeen, onQuizRight }: Props) {
  const copy = WORLD_COPY[lang];
  const first = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<number | null>(solved && kind === "word" ? 0 : null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  let body: JSX.Element;
  if (kind === "locked" && notice) {
    // A learning gate, not a paywall: say what opens it, kindly, and offer
    // the real way there to someone already learning.
    const n = copy.notices[notice];
    const levelGate = notice === "marketLocked" || notice === "cafeLocked";
    body = (
      <>
        <h2 className="font-display text-xl font-bold">{n.title}</h2>
        <p className="text-sm text-charcoal/80">{n.line}</p>
        {"more" in n && <p className="text-sm text-charcoal/70">{(n as { more: string }).more}</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {levelGate && signedIn && (
            <button type="button" className={`${btn} bg-klovers-yellow text-charcoal outline-charcoal`} onClick={() => onGo("/dashboard")}>
              {copy.lockedCard.learn}
            </button>
          )}
          <button ref={first} type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
            {copy.lockedCard.close}
          </button>
        </div>
      </>
    );
  } else if (kind === "quiz" && quiz) {
    // One question, no penalty: a wrong pick says which sound it was.
    const q = copy.quiz[quiz];
    const chosen = picked === null ? null : q.options[picked];
    body = (
      <>
        <p lang="ko" dir="ltr" className="font-ko text-6xl font-bold leading-none">
          {q.ko}
        </p>
        <h2 className="font-display text-lg font-bold">{q.question}</h2>
        <div className="flex justify-center gap-3" role="group" aria-label={q.question}>
          {q.options.map((o, i) => (
            <button
              key={o.label}
              ref={i === 0 ? first : undefined}
              type="button"
              disabled={chosen?.right === true}
              onClick={() => {
                setPicked(i);
                if (o.right) onQuizRight?.();
              }}
              className={`h-14 min-w-14 rounded-2xl border-2 px-3 font-display text-xl font-bold transition-colors ${
                picked === i
                  ? o.right
                    ? "border-charcoal bg-klovers-green text-charcoal"
                    : "border-charcoal bg-ivory text-charcoal"
                  : "border-charcoal/30 bg-white text-charcoal hover:border-charcoal"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {chosen && (
          <p role="status" className="text-sm font-semibold">
            {chosen.feedback}
          </p>
        )}
        <button type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
          {copy.card.close}
        </button>
      </>
    );
  } else if (kind === "egg") {
    const c = copy.egg;
    body = (
      <>
        <h2 className="font-display text-xl font-bold">{c.title}</h2>
        <p className="text-sm text-charcoal/80">{c.line}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button ref={first} type="button" className={`${btn} bg-klovers-yellow text-charcoal outline-charcoal`} onClick={() => onGo(signedIn ? "/dashboard" : "/hangul-starter")}>
            {signedIn ? c.ctaStudent : c.ctaGuest}
          </button>
          <button type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
            {c.close}
          </button>
        </div>
      </>
    );
  } else if (kind === "letter") {
    const c = copy.letter;
    body = (
      <>
        <p lang="ko" dir="ltr" className="font-ko text-6xl font-bold leading-none">
          ㄱ
        </p>
        <p className="font-semibold">{c.name}</p>
        <p className="text-sm text-charcoal/80">{c.sound}</p>
        <p className="text-sm text-charcoal/80">{c.shape}</p>
        <p className="font-ko text-lg font-bold">{c.example}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          <button ref={first} type="button" className={`${btn} bg-klovers-yellow text-charcoal outline-charcoal`} onClick={() => onGo("/hangul-starter")}>
            {c.cta}
          </button>
          <button type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
            {c.close}
          </button>
        </div>
      </>
    );
  } else if (kind === "word") {
    const c = copy.word;
    const chosen = picked === null ? null : c.options[picked];
    body = (
      <>
        <h2 className="font-display text-xl font-bold">{c.title}</h2>
        <p className="text-sm text-charcoal/80">{c.line}</p>
        <div className="flex justify-center gap-3 pt-1" role="group" aria-label={c.title}>
          {c.options.map((o, i) => (
            <button
              key={o.ko}
              ref={i === 0 ? first : undefined}
              type="button"
              lang="ko" dir="ltr"
              disabled={chosen?.right === true}
              onClick={() => {
                setPicked(i);
                onWordSeen?.(o.ko);
                if (o.right) onWordRight();
              }}
              className={`h-16 w-16 rounded-2xl border-2 font-ko text-2xl font-bold transition-colors ${
                picked === i
                  ? o.right
                    ? "border-charcoal bg-klovers-green text-charcoal"
                    : "border-charcoal bg-ivory text-charcoal"
                  : "border-charcoal/30 bg-white text-charcoal hover:border-charcoal"
              }`}
            >
              {o.ko}
            </button>
          ))}
        </div>
        {/* Review is never failure: a wrong pick just says what that word is. */}
        {chosen && (
          <p role="status" className="text-sm font-semibold">
            {chosen.feedback}
          </p>
        )}
        <button type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
          {c.close}
        </button>
      </>
    );
  } else {
    body = <></>;
  }

  return (
    // The world stays in view: a light veil, and on wider screens the card
    // sits to one side like a note held up beside the scene.
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-charcoal/20 p-4 sm:justify-end sm:pe-10 lg:pe-20" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-ivory p-6 text-center text-charcoal shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
}
