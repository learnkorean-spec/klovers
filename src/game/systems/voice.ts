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

export function stopVoice(): void {
  current?.pause();
  current = null;
}

/** Play a person's line. Call from the tap/click itself (phones need that). */
export function playVoice(id: VoiceLine, fallback: () => void): void {
  stopVoice();
  if (!base || typeof Audio === "undefined") return fallback();
  const a = new Audio(stored(id));
  current = a;
  let fellBack = false;
  const giveUp = () => {
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
