/**
 * Recorded voices for KLOVERS World: every person's line, and the market
 * shop's lines (requests, prices, change, thanks), shipped with the site as
 * small MP3s in public/assets/world/voice. Recorded 23 Oct 2026 with Korean
 * neural voices (a man's voice for Minsu and the other men, a woman's for
 * the women, pitched apart so no two people sound alike).
 *
 * They are files of the site itself, so they start at once inside the tap
 * (phones only allow sound from a tap) and cost nothing per play. If one
 * cannot play, the caller's fallback (the browser's own voice) speaks.
 *
 * The world-voice edge function (OpenAI TTS into storage) is no longer
 * called from here: its account had no credits and no line was ever stored.
 */

/** Line ids (supabase/functions/world-voice/lines.ts has the Korean). */
export type VoiceLine = "minsu" | "adam" | "lina" | "auntie" | "vendor" | "shopkeeper" | "baker" | "hubFriend" | "hubReader" | "shopper";

const BASE = "/assets/world/voice/";

let current: HTMLAudioElement | null = null;
/** Files that could not be played this visit: go straight to the browser's voice. */
const unavailable = new Set<string>();

/**
 * On iPhone (Safari 17+), play as media, so the ring/silent switch does not
 * mute the world. Set at load and again on every tap.
 */
function playAsMedia(): void {
  try {
    const nav = navigator as Navigator & { audioSession?: { type: string } };
    if (nav.audioSession && nav.audioSession.type !== "playback") nav.audioSession.type = "playback";
  } catch {
    /* older browsers: nothing to do */
  }
}
if (typeof navigator !== "undefined") playAsMedia();

/** Unlock the browser's speech inside the tap, so a late fallback may still speak. */
function unlock(): void {
  playAsMedia();
  try {
    if ("speechSynthesis" in window && !window.speechSynthesis.speaking) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    }
  } catch {
    /* no speech here: the recording is the only voice */
  }
}

export function stopVoice(): void {
  current?.pause();
  current = null;
}

/** Play a recorded file (path under /assets/world/voice/). Call from the tap itself. */
export function playClip(path: string, fallback: () => void): void {
  stopVoice();
  unlock();
  if (typeof Audio === "undefined" || unavailable.has(path)) return fallback();
  const a = new Audio(BASE + path);
  current = a;
  let fellBack = false;
  const giveUp = () => {
    unavailable.add(path);
    if (fellBack || current !== a) return;
    fellBack = true;
    fallback();
  };
  a.addEventListener("error", giveUp, { once: true });
  a.play().catch(giveUp);
}

/** Play a person's line. Call from the tap/click itself (phones need that). */
export function playVoice(id: VoiceLine, fallback: () => void): void {
  playClip(`${id}.mp3`, fallback);
}

/** Romanised file names for the shop's things. */
const SHOP_FILE: Record<string, string> = { 사과: "sagwa", 물: "mul", 꽃: "kkot", 빵: "ppang", 밥: "bap", 우유: "uyu" };

/** The market shop's recorded lines. */
export const shopClip = {
  ask: () => "shop/ask.mp3",
  howMany: () => "shop/howmany.mp3",
  /** "사과 두 개 주세요." — count 1…3. */
  request: (item: string, count: number) => (SHOP_FILE[item] ? `shop/req-${SHOP_FILE[item]}-${count}.mp3` : ""),
  /** "삼천 원이에요." — won in whole thousands, 1,000…9,000. */
  price: (won: number) => `shop/price-${Math.round(won / 1000)}.mp3`,
  /** "거스름돈 천 원이에요." — 1,000…4,000. */
  change: (won: number) => `shop/change-${Math.round(won / 1000)}.mp3`,
  thanks: () => "shop/thanks.mp3",
};

/**
 * Play several clips one after another on one audio element (a phone lets
 * the element that started in the tap carry on). Missing ones are skipped.
 */
export function playClips(paths: string[], fallback: () => void): void {
  const list = paths.filter((p) => p && !unavailable.has(p));
  if (!list.length) return fallback();
  stopVoice();
  unlock();
  if (typeof Audio === "undefined") return fallback();
  const a = new Audio(BASE + list[0]);
  current = a;
  let i = 0;
  a.addEventListener("ended", () => {
    i += 1;
    if (current !== a || i >= list.length) return;
    a.src = BASE + list[i];
    a.play().catch(() => undefined);
  });
  a.addEventListener("error", () => {
    unavailable.add(list[i]);
    if (i === 0 && current === a) fallback();
  }, { once: true });
  a.play().catch(() => {
    if (current === a) fallback();
  });
}
