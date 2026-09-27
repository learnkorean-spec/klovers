import { useEffect, useRef, useState } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import type { NoticeKey } from "../config/rooms";
import type { AvatarId } from "../player/characters";

/**
 * The small web-UI cards opened from the 3D world (E / the round button).
 * Real learning stays in the site's lessons; these are one-step moments that
 * end in a real action. One language per screen; Korean stays Korean.
 */
export type CardKind = "egg" | "letter" | "word" | "locked" | "talk";

interface Props {
  lang: WorldLang;
  kind: CardKind;
  /** For a locked gate: which notice to show. */
  notice?: NoticeKey;
  /** For a talk card: who is speaking. The friend is the learner not chosen. */
  who?: "friend" | "minsu";
  avatar?: AvatarId;
  signedIn: boolean;
  /** The bread sign is already back up (the word card opens solved). */
  solved: boolean;
  onClose: () => void;
  onGo: (href: string) => void;
  onWordRight: () => void;
}

const btn = "min-h-11 rounded-full px-5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function InteractionCard({ lang, kind, notice, who, avatar, signedIn, solved, onClose, onGo, onWordRight }: Props) {
  const copy = WORLD_COPY[lang];
  const first = useRef<HTMLButtonElement>(null);
  const [picked, setPicked] = useState<number | null>(solved ? 0 : null);

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
  } else if (kind === "talk" && who) {
    // A first greeting: the Korean line, its meaning, one short line of
    // direction. Continue returns to the world.
    const c = copy.talk;
    const friendId = avatar === "lina" ? "adam" : "lina";
    const hello = who === "minsu" ? c.minsu : c[friendId];
    const name = who === "minsu" ? copy.names.minsu : copy.names[friendId];
    body = (
      <>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal/60">{name}</p>
        <p lang="ko" className="font-ko text-2xl font-bold leading-snug" style={{ wordBreak: "keep-all" }}>
          {hello.ko}
        </p>
        <p className="font-semibold">{hello.gloss}</p>
        <p className="text-sm text-charcoal/80">{who === "minsu" ? c.minsuLine : c.friendLine}</p>
        <p className="rounded-xl bg-white px-3 py-2 text-xs text-charcoal/70">{c.note}</p>
        <button ref={first} type="button" className={`${btn} bg-klovers-yellow text-charcoal outline-charcoal`} onClick={onClose}>
          {c.next}
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
        <p lang="ko" className="font-ko text-6xl font-bold leading-none">
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
              lang="ko"
              disabled={chosen?.right === true}
              onClick={() => {
                setPicked(i);
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
