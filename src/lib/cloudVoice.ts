/**
 * The site's Korean "listen" voice: Amazon Polly through the `tts-ko` edge
 * function (cached MP3s, paid from the AWS credits), with the browser's own
 * voice as the fallback whenever the cloud voice can't play.
 *
 * One clip plays at a time across the whole site.
 */

const BASE = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/functions/v1/tts-ko`;
const MAX_CHARS = 150;
const HANGUL = /[가-힣ᄀ-ᇿ㄰-㆏]/;

let current: HTMLAudioElement | null = null;

export function cloudVoiceUrl(text: string, gender?: "male" | "female"): string {
  const t = text.normalize("NFC").replace(/\s+/g, " ").trim();
  return `${BASE}?v=${gender === "male" ? "m" : "f"}&t=${encodeURIComponent(t)}`;
}

/** True when the cloud voice will take this text (Korean, short enough). */
export function cloudVoiceFits(text: string): boolean {
  const t = text.trim();
  return !!import.meta.env.VITE_SUPABASE_URL && typeof Audio !== "undefined" && t.length > 0 && t.length <= MAX_CHARS && HANGUL.test(t);
}

export function stopCloudVoice(): void {
  if (current) {
    current.onended = current.onerror = null;
    current.pause();
    current = null;
  }
}

export function currentCloudVoice(): HTMLAudioElement | null {
  return current;
}

type PlayOpts = {
  gender?: "male" | "female";
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  /** Called instead of onEnd when the clip never started — play the fallback here. */
  onFail?: () => void;
};

/**
 * Plays `text` with the cloud voice. Must be called from a tap/click so mobile
 * browsers allow the sound. Falls back via `onFail` if it can't start in 8 s.
 */
export function playCloudKorean(text: string, opts: PlayOpts = {}): void {
  stopCloudVoice();
  const a = new Audio(cloudVoiceUrl(text, opts.gender));
  current = a;
  if (opts.rate && opts.rate !== 1) a.playbackRate = opts.rate;
  let started = false;
  const giveUp = () => {
    if (started || current !== a) return;
    stopCloudVoice();
    opts.onFail?.();
  };
  const timer = window.setTimeout(giveUp, 8000);
  a.onplaying = () => {
    if (started) return;
    started = true;
    window.clearTimeout(timer);
    opts.onStart?.();
  };
  a.onended = () => {
    if (current === a) current = null;
    opts.onEnd?.();
  };
  a.onerror = () => {
    window.clearTimeout(timer);
    if (started) {
      if (current === a) current = null;
      opts.onEnd?.();
    } else giveUp();
  };
  void a.play().catch(() => {
    window.clearTimeout(timer);
    giveUp();
  });
}
