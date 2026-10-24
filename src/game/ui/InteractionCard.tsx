import { useEffect, useRef, useState } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import { SHOP_ITEMS, SHOP_PRICES, wonInKorean, type QuizId, type ShopId } from "../config/interactions";
import { playClip, playClips, shopClip, stopVoice } from "../systems/voice";
import { useSpeech } from "@/hooks/useSpeech";
import type { NoticeKey } from "../config/rooms";

/**
 * The small web-UI cards opened from the 3D world (E / the round button).
 * Real learning stays in the site's lessons; these are one-step moments that
 * end in a real action. One language per screen; Korean stays Korean.
 * (People's lines and single words use the lighter DialogueBubble, which
 * does not stop the world.)
 */
/** "review" is the Memory Garden's memory stone (game/ui/GardenReview.tsx), not drawn here. */
export type CardKind = "egg" | "letter" | "word" | "locked" | "quiz" | "shop" | "review";

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
  /** Shop: which of the market's shops (its three things). */
  shop?: ShopId;
  /** Shop: the thing already pressed in the scene (opens with it chosen). */
  shopPick?: string;
  /** Shop: paid for (the world cheers). */
  onShopPaid?: () => void;
  /** Shop: a thing was chosen (its word is learned; the world reacts). */
  onShopPick?: (ko: string) => void;
}

/** Small drawings of the shop's three things, matching the 3D ones. */
function ShopIcon({ ko, size = 44 }: { ko: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 44 44", "aria-hidden": true } as const;
  if (ko === "사과")
    return (
      <svg {...common}>
        <path d="M22 13c-3-3-11-3-12 6-1 8 5 17 9 17 2 0 2-1 3-1s1 1 3 1c4 0 10-9 9-17-1-9-9-9-12-6z" fill="#C8242B" />
        <path d="M14 18c1-3 4-4 6-3" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M22 13c0-3 1-5 3-6" stroke="#5A3A1E" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M24 10c3-3 7-2 8 0-3 2-6 2-8 0z" fill="#4E8A2E" />
      </svg>
    );
  if (ko === "물")
    return (
      <svg {...common}>
        <rect x="19" y="5" width="6" height="4" rx="1" fill="#2F6FC4" />
        <path d="M18 9h8l3 5v22a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V14z" fill="#CFE8FF" stroke="#7DB8EA" strokeWidth="1.5" />
        <path d="M16 20h12v15a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z" fill="#7DB8EA" />
        <rect x="15.5" y="22" width="13" height="6" fill="#EAF4FF" />
      </svg>
    );
  if (ko === "빵")
    return (
      <svg {...common}>
        <path d="M6 26c0-9 7-14 16-14s16 5 16 14c0 4-3 6-6 6H12c-3 0-6-2-6-6z" fill="#C98B4A" />
        <path d="M15 17l-3 6M22 15l-2 7M29 17l-2 6" stroke="#F3D3A2" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  if (ko === "밥")
    return (
      <svg {...common}>
        <path d="M9 22h26a13 13 0 0 1-26 0z" fill="#2E2E2E" />
        <path d="M10 22c0-6 5-10 12-10s12 4 12 10z" fill="#FFFFFF" stroke="#E5E0D5" />
        <path d="M30 6l-6 14M34 8l-8 13" stroke="#8C5A32" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  if (ko === "커피")
    return (
      <svg {...common}>
        <path d="M10 18h20v10a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#FFFFFF" stroke="#2E2E2E" strokeWidth="1.5" />
        <path d="M30 21h3a4 4 0 0 1 0 8h-3" fill="none" stroke="#2E2E2E" strokeWidth="2" />
        <ellipse cx="20" cy="18" rx="10" ry="2.4" fill="#6B3E1E" />
        <path d="M16 8c-2 3 2 4 0 7M22 7c-2 3 2 4 0 7" stroke="#B9A48C" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M6 38h28" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (ko === "녹차")
    return (
      <svg {...common}>
        <path d="M11 17h22l-2 16a5 5 0 0 1-5 4h-8a5 5 0 0 1-5-4z" fill="#E9F2DA" stroke="#5B7F2B" strokeWidth="1.5" />
        <path d="M12 21h20l-1 7H13z" fill="#8DB255" />
        <path d="M24 6c6 0 8 5 4 8-3 2-7 1-8-2 0-3 2-6 4-6z" fill="#5B8A2E" />
      </svg>
    );
  if (ko === "케이크")
    return (
      <svg {...common}>
        <path d="M8 30l14-14 14 14z" fill="#F7E3C7" />
        <path d="M8 30h28v6H8z" fill="#E9C9A0" />
        <path d="M8 25h28v3H8z" fill="#F2A7B8" />
        <circle cx="22" cy="13" r="3.2" fill="#D7263D" />
        <path d="M5 38h34" stroke="#2E2E2E" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  if (ko === "우유")
    return (
      <svg {...common}>
        <path d="M14 14l4-7h8l4 7v24H14z" fill="#FFFFFF" stroke="#BFD8F2" strokeWidth="1.5" />
        <path d="M14 22h16v10H14z" fill="#5AA0E0" />
        <path d="M18 7h8" stroke="#2F6FC4" strokeWidth="2" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M22 22v8" stroke="#4E8A2E" strokeWidth="2" />
      <path d="M22 27c-3-3-7-2-7-2 1 3 4 4 7 3" fill="#4E8A2E" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="22" cy="10" rx="3.6" ry="6" fill="#F27BA6" transform={`rotate(${a} 22 15)`} />
      ))}
      <circle cx="22" cy="15" r="3.2" fill="#FFFF00" stroke="#2E2E2E" strokeOpacity=".15" />
      <path d="M13 30h18l-2 9H15z" fill="#B5653A" />
    </svg>
  );
}

/** A small "hear it" button beside a Korean line. */
function Hear({ label, onPlay }: { label: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPlay}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal text-ivory align-middle transition-transform motion-safe:active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

const btn = "min-h-11 rounded-full px-5 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function InteractionCard({
  lang,
  kind,
  notice,
  quiz,
  signedIn,
  solved,
  onClose,
  onGo,
  onWordRight,
  onWordSeen,
  onQuizRight,
  shop = "fruit",
  shopPick,
  onShopPick,
  onShopPaid,
}: Props) {
  const copy = WORLD_COPY[lang];
  const first = useRef<HTMLButtonElement>(null);
  const { speakKorean } = useSpeech({ rate: 0.85 });
  /** Play a recorded line; the browser's voice if it cannot. */
  const say = (path: string, ko: string) => playClip(path, () => speakKorean(ko));
  const hearLabel = copy.card.listen;
  useEffect(() => () => stopVoice(), []);
  const [picked, setPicked] = useState<number | null>(solved && kind === "word" ? 0 : kind === "shop" && shopPick ? Math.max(0, SHOP_ITEMS[shop].indexOf(shopPick)) : null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** Shop, step two: how many (0 → one, 1 → two, 2 → three). */
  const [count, setCount] = useState<number | null>(null);
  /** Shop, step three: the notes handed over so far (won), and whether paid. */
  const [given, setGiven] = useState<number[]>([]);
  const [paid, setPaid] = useState(false);
  /** Café: for here or to go (asked before the price). */
  const [stay, setStay] = useState<"here" | "go" | null>(null);
  const [short, setShort] = useState(false);
  const resetPay = () => {
    setStay(null);
    setGiven([]);
    setPaid(false);
    setShort(false);
  };

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
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={q.question}>
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
              className={`h-14 min-w-14 rounded-2xl border-2 px-3 font-bold transition-colors ${o.label.length > 3 ? "font-ko text-base" : "font-display text-xl"} ${
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
  } else if (kind === "shop") {
    // Two choices, like at a real stall: which thing, then how many.
    const c = copy.shop;
    // The café counter is the same three steps, plus "for here or to go?".
    const cafe = shop === "cafe";
    const ask = cafe ? c.cafe.ask : c.ask;
    const list = SHOP_ITEMS[shop];
    const ko = picked === null ? null : list[picked];
    const item = ko ? c.items[ko] : null;
    const tile = (on: boolean) =>
      `flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-3 transition-transform motion-safe:active:scale-95 ${
        on ? "border-charcoal bg-klovers-yellow shadow-md" : "border-charcoal/25 bg-white hover:-translate-y-0.5 hover:border-charcoal hover:shadow"
      }`;
    body = (
      <>
        <p lang="ko" dir="ltr" className="flex items-center justify-center gap-2 font-ko text-xl font-bold">
          {item ? c.howMany.ko : ask.ko}
          <Hear label={hearLabel} onPlay={() => (item ? say(shopClip.howMany(cafe), c.howMany.ko) : say(shopClip.ask(cafe), ask.ko))} />
        </p>
        <p className="-mt-2 text-sm text-charcoal/70">{item ? c.howMany.gloss : ask.gloss}</p>
        {!item ? (
          <div className="grid w-full grid-cols-3 gap-2" role="group" aria-label={c.line}>
            {list.map((k, i) => (
              <button
                key={k}
                ref={i === 0 ? first : undefined}
                type="button"
                onClick={() => {
                  setPicked(i);
                  setCount(null);
                  resetPay();
                  onShopPick?.(k);
                }}
                className={tile(false)}
              >
                <ShopIcon ko={k} />
                <span lang="ko" dir="ltr" className="font-ko text-2xl font-bold leading-none">
                  {k}
                </span>
                <span className="text-xs text-charcoal/70">{c.items[k].meaning}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {/* The chosen thing, small, then three counts to pick from. */}
            <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1">
              <ShopIcon ko={ko!} size={30} />
              <span lang="ko" dir="ltr" className="font-ko text-lg font-bold">
                {ko}
              </span>
              <span className="text-xs text-charcoal/70">{item.meaning}</span>
            </div>
            <div className="grid w-full grid-cols-3 gap-2" role="group" aria-label={c.howMany.gloss}>
              {c.counts.map((n, i) => (
                <button
                  key={n.ko}
                  ref={i === 0 ? first : undefined}
                  type="button"
                  aria-pressed={count === i}
                  onClick={() => {
                    setCount(i);
                    resetPay();
                    // The learner's request, then the seller names the price.
                    const req = `${ko} ${n.ko} ${item.counter} 주세요.`;
                    const won = SHOP_PRICES[ko!] * (i + 1);
                    setStay(null);
                    // At the café the barista asks "for here?" before the price.
                    if (cafe) playClips([shopClip.request(ko!, i + 1), shopClip.stay("q")], () => speakKorean(`${req} ${c.cafe.stay.ko}`));
                    else playClips([shopClip.request(ko!, i + 1), shopClip.price(won)], () => speakKorean(`${req} ${wonInKorean(won)}${c.price.suffix}`));
                  }}
                  className={tile(count === i)}
                >
                  <span className="flex h-7 items-center gap-0.5" aria-hidden="true">
                    {Array.from({ length: i + 1 }, (_, d) => (
                      <ShopIcon key={d} ko={ko!} size={24} />
                    ))}
                  </span>
                  <span lang="ko" dir="ltr" className="font-ko text-xl font-bold leading-none">
                    {n.ko} {item.counter}
                  </span>
                  <span className="text-xs text-charcoal/70">
                    {i + 1} · {n.roman}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {item &&
          count !== null &&
          (() => {
            // Step three: hear the price, hand over notes, get change.
            const price = SHOP_PRICES[ko!] * (count + 1);
            const total = given.reduce((a, b) => a + b, 0);
            const fmt = (won: number) => won.toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
            const change = total - price;
            const note = (won: number) => (
              <button
                key={won}
                type="button"
                // Enough handed over: the seller takes it from here.
                disabled={paid || total >= price}
                onClick={() => {
                  setGiven((g) => [...g, won]);
                  setShort(false);
                }}
                className={`flex h-12 min-w-[6.5rem] items-center justify-center gap-1 rounded-lg border-2 border-charcoal/30 px-2 font-ko text-sm font-bold shadow-sm transition-transform motion-safe:active:scale-95 disabled:opacity-50 ${won === 1000 ? "bg-[#CFE3F5]" : "bg-[#F6D9B5]"}`}
              >
                <span aria-hidden="true" className="rounded bg-white/70 px-1 text-[10px] tracking-wide">
                  ₩
                </span>
                <span lang="ko" dir="ltr">
                  {wonInKorean(won)}
                </span>
              </button>
            );
            return (
              <div role="status" className="flex w-full flex-col gap-1 rounded-2xl bg-white/70 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">{c.youSay}</p>
                <p lang="ko" dir="ltr" className="flex items-center justify-center gap-2 font-ko text-2xl font-bold">
                  {ko} {c.counts[count].ko} {item.counter} 주세요.
                  <Hear label={hearLabel} onPlay={() => say(shopClip.request(ko!, count + 1), `${ko} ${c.counts[count].ko} ${item.counter} 주세요.`)} />
                </p>
                <p className="text-sm text-charcoal/80">{item.gloss[count]}</p>
                <p className="text-xs text-charcoal/60">
                  {item.counterNote} · {c.note}
                </p>
                {cafe && !stay ? (
                  <>
                    {/* The barista: "for here?" — the learner answers. */}
                    <p lang="ko" dir="ltr" className="flex items-center justify-center gap-2 pt-2 font-ko text-xl font-bold">
                      {c.cafe.stay.ko}
                      <Hear label={hearLabel} onPlay={() => say(shopClip.stay("q"), c.cafe.stay.ko)} />
                    </p>
                    <p className="text-sm text-charcoal/80">{c.cafe.stay.gloss}</p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {(["here", "go"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          className={tile(false)}
                          onClick={() => {
                            setStay(k);
                            playClips([shopClip.stay(k), shopClip.price(price, true)], () => speakKorean(`${c.cafe[k].ko} ${wonInKorean(price)}${c.price.suffix}`));
                          }}
                        >
                          <span lang="ko" dir="ltr" className="font-ko text-base font-bold leading-tight">
                            {c.cafe[k].ko}
                          </span>
                          <span className="text-xs text-charcoal/70">{c.cafe[k].gloss}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {cafe && stay && (
                      <p lang="ko" dir="ltr" className="pt-1 font-ko text-base font-bold text-charcoal/80">
                        {c.cafe.stay.ko} → {c.cafe[stay].ko}
                      </p>
                    )}
                    {/* The seller names the price, in Korean only: the learner works it out. */}
                    <p lang="ko" dir="ltr" className="flex items-center justify-center gap-2 pt-2 font-ko text-xl font-bold">
                      <span>
                        {wonInKorean(price)}
                        {c.price.suffix}
                      </span>
                      <Hear label={hearLabel} onPlay={() => say(shopClip.price(price, cafe), `${wonInKorean(price)}${c.price.suffix}`)} />
                    </p>
                    {paid && <p className="text-sm text-charcoal/80">{c.price.gloss(fmt(price))}</p>}
                    {!paid ? (
                      <>
                        <p className="pt-1 text-xs font-semibold text-charcoal/60">{c.pay}</p>
                        <div className="flex justify-center gap-2">{[1000, 5000].map(note)}</div>
                        <p className="pt-1 text-sm font-semibold" dir="ltr">
                          {c.paid}: ₩{fmt(total)}
                        </p>
                        {short && <p className="text-xs font-semibold text-charcoal/80">{c.notEnough}</p>}
                        <div className="flex justify-center gap-2">
                          {given.length > 0 && (
                            <button
                              type="button"
                              className={`${btn} border-2 border-charcoal/30 text-charcoal outline-charcoal`}
                              onClick={() => {
                                // Hand the notes back; the order itself stays.
                                setGiven([]);
                                setShort(false);
                              }}
                            >
                              {c.undo}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={total === 0}
                            className={`${btn} bg-klovers-yellow text-charcoal outline-charcoal disabled:opacity-40`}
                            onClick={() => {
                              if (total < price) return setShort(true);
                              setPaid(true);
                              onShopPaid?.();
                              const back = total - price;
                              playClips([back > 0 ? shopClip.change(back, cafe) : "", shopClip.thanks(cafe)], () =>
                                speakKorean(`${back > 0 ? c.change.ko(wonInKorean(back)) + " " : ""}${cafe ? c.cafe.thanks.ko : `${c.reply.ko} ${c.thanks.ko}`}`),
                              );
                            }}
                          >
                            {c.payNow}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {change > 0 && (
                          <>
                            <p lang="ko" dir="ltr" className="pt-1 font-ko text-lg font-bold">
                              {c.change.ko(wonInKorean(change))}
                            </p>
                            <p className="text-sm text-charcoal/80">{c.change.gloss(fmt(change))}</p>
                          </>
                        )}
                        <p lang="ko" dir="ltr" className="pt-1 font-ko text-lg font-bold">
                          {cafe ? c.cafe.thanks.ko : `${c.reply.ko} ${c.thanks.ko}`}
                        </p>
                        <p className="text-sm text-charcoal/80">{cafe ? c.cafe.thanks.gloss : `${c.reply.gloss} ${c.thanks.gloss}`}</p>
                        <p className="pt-1 text-xs text-charcoal/70">{c.numbersNote}</p>
                        {cafe && <p className="text-xs text-charcoal/70">{c.cafe.note}</p>}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        <div className="flex flex-wrap justify-center gap-2">
          {item && (
            <button
              type="button"
              className={`${btn} border-2 border-charcoal/30 text-charcoal outline-charcoal`}
              onClick={() => {
                setPicked(null);
                setCount(null);
                resetPay();
              }}
            >
              {c.back}
            </button>
          )}
          <button type="button" className={`${btn} border-2 border-charcoal text-charcoal outline-charcoal`} onClick={onClose}>
            {c.close}
          </button>
        </div>
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
              lang="ko"
              dir="ltr"
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
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col items-center gap-3 overflow-y-auto rounded-3xl bg-ivory p-6 text-center text-charcoal shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {body}
      </div>
    </div>
  );
}
