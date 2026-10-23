import { supabase } from "@/integrations/supabase/client";

/**
 * Recorded voices for the people of KLOVERS World (see the world-voice edge
 * function): each line is voiced once, in a voice that fits the speaker —
 * Minsu and the other men with a man's voice — and kept in public storage.
 *
 * Playing tries the stored recording first; if it is not there yet, the
 * function voices it (once, for everyone) and it plays. If anything fails,
 * the caller's fallback (the browser's own voice) speaks instead.
 */

/** Line ids the function knows (supabase/functions/world-voice/lines.ts). */
export type VoiceLine = "minsu" | "adam" | "lina" | "auntie" | "vendor" | "shopkeeper" | "baker" | "hubFriend" | "hubReader" | "shopper";

const VERSION = "v1";
const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const stored = (id: VoiceLine) => `${base}/storage/v1/object/public/lesson-scenes/world-voice/${VERSION}/${id}.mp3`;

let current: HTMLAudioElement | null = null;
/** Lines that could not be played this visit: go straight to the browser's voice. */
const unavailable = new Set<VoiceLine>();

/**
 * Phones only let a page make sound from inside a tap. Two things keep that
 * true even when the recording has to be fetched first (the fallback then
 * speaks after a wait, outside the tap):
 * - the browser's speech is "unlocked" during the tap with a silent line;
 * - on iPhone (Safari 17+), the page asks to play as media, so sound is not
 *   muted by the ring/silent switch.
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

/** Play a person's line. Call from the tap/click itself (phones need that). */
export function playVoice(id: VoiceLine, fallback: () => void): void {
  stopVoice();
  unlock();
  // Known missing this visit: speak now, inside the tap, with no wait.
  if (!base || typeof Audio === "undefined" || unavailable.has(id)) return fallback();
  const a = new Audio(stored(id));
  current = a;
  let fellBack = false;
  const giveUp = () => {
    unavailable.add(id);
    if (fellBack || current !== a) return;
    fellBack = true;
    fallback();
  };
  a.play().catch(async () => {
    if (current !== a) return;
    try {
      const { data, error } = await supabase.functions.invoke("world-voice", { body: { id } });
      const url = (data as { url?: string } | null)?.url;
      if (error || !url || current !== a) return giveUp();
      a.src = url;
      await a.play();
    } catch {
      giveUp();
    }
  });
}
