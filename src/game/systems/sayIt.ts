/**
 * "Say it" practice: the browser's own speech recognition listens once in
 * Korean, and the learner hears how close they came. Nothing is recorded or
 * sent anywhere by this code (the browser's recogniser may use its own
 * service, as with any dictation). Where the browser cannot listen, the
 * button is simply not shown.
 */

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const canListen = (): boolean => ctor() !== null;

/** Hangul syllables (and Latin letters, digits) only: spaces and marks don't count. */
const clean = (s: string) => s.replace(/[^\p{Script=Hangul}a-z0-9]/giu, "").toLowerCase();

function distance(a: string, b: string): number {
  const A = [...a];
  const B = [...b];
  let prev = Array.from({ length: B.length + 1 }, (_, j) => j);
  for (let i = 1; i <= A.length; i++) {
    const cur = [i];
    for (let j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[B.length];
}

/** 0…1: how close what was heard is to the target (1 = the same syllables). */
export function similarity(target: string, heard: string): number {
  const t = clean(target);
  const h = clean(heard);
  if (!t || !h) return 0;
  if (h.includes(t)) return 1;
  return Math.max(0, 1 - distance(t, h) / Math.max([...t].length, [...h].length));
}

export type SayResult = { score: number; heard: string } | { error: "blocked" | "nothing" };

/** Listens once (Korean) and scores the best of the browser's guesses. */
export function listenFor(target: string): { done: Promise<SayResult>; stop: () => void } {
  const C = ctor();
  if (!C) return { done: Promise.resolve({ error: "nothing" }), stop: () => {} };
  const r = new C();
  r.lang = "ko-KR";
  r.interimResults = false;
  r.continuous = false;
  r.maxAlternatives = 4;
  let settled = false;
  const done = new Promise<SayResult>((resolve) => {
    const finish = (v: SayResult) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    r.onresult = (e) => {
      let best = { score: 0, heard: "" };
      const res = e.results[0];
      for (let i = 0; res && i < res.length; i++) {
        const heard = res[i].transcript;
        const score = similarity(target, heard);
        if (score > best.score || !best.heard) best = { score, heard };
      }
      finish(best.heard ? best : { error: "nothing" });
    };
    r.onerror = (e) => finish({ error: e.error === "not-allowed" || e.error === "service-not-allowed" ? "blocked" : "nothing" });
    r.onend = () => finish({ error: "nothing" });
    try {
      r.start();
    } catch {
      finish({ error: "nothing" });
    }
  });
  return {
    done,
    stop: () => {
      try {
        r.abort();
      } catch {
        /* already stopped */
      }
    },
  };
}
