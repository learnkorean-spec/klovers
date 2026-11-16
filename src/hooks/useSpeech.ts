import { useState, useCallback, useEffect, useRef } from "react";
import { cloudVoiceFits, currentCloudVoice, playCloudKorean, stopCloudVoice } from "@/lib/cloudVoice";

interface UseSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
  gender?: "male" | "female";
  /**
   * Korean is read by the cloud voice (Amazon Polly via the `tts-ko` edge
   * function, cached) with the browser voice as fallback. Default true; pass
   * false to keep the browser voice only.
   */
  cloud?: boolean;
}

/* âââ Voice picker: best-effort male / female for a given language âââ */

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender?: "male" | "female",
): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;

  // Normalise e.g. "ko-KR" â "ko"
  const shortLang = lang.split("-")[0].toLowerCase();

  // Filter voices that match the language
  const langVoices = voices.filter((v) => {
    const vLang = v.lang.toLowerCase();
    return vLang === lang.toLowerCase() || vLang.startsWith(shortLang);
  });

  if (!langVoices.length) return undefined;
  if (!gender) return langVoices[0];

  // Heuristic: many browsers include gender hints in the voice name
  const genderHints: Record<string, { female: string[]; male: string[] }> = {
    ko: {
      female: ["yuna", "sunhi", "sora", "heami", "female", "woman", "ì¬ì", "ì¬ì±"],
      male: ["junwoo", "jian", "male", "man", "ë¨ì", "ë¨ì±", "hyunbin"],
    },
    en: {
      female: [
        "samantha", "victoria", "karen", "moira", "tessa", "fiona", "kate",
        "susan", "zira", "jenny", "aria", "female", "woman",
      ],
      male: [
        "daniel", "james", "thomas", "oliver", "david", "alex", "aaron",
        "male", "man", "google uk english male",
      ],
    },
  };

  const hints = genderHints[shortLang] || genderHints["en"];
  const targetHints = hints?.[gender] || [];
  const oppositeHints = hints?.[gender === "male" ? "female" : "male"] || [];

  // 1) Try to find a voice whose name matches a target hint
  const nameMatch = langVoices.find((v) =>
    targetHints.some((h) => v.name.toLowerCase().includes(h)),
  );
  if (nameMatch) return nameMatch;

  // 2) Exclude voices that match the OPPOSITE gender hints
  const filtered = langVoices.filter(
    (v) => !oppositeHints.some((h) => v.name.toLowerCase().includes(h)),
  );
  if (filtered.length) return filtered[0];

  // 3) Fallback: return first matching-language voice
  return langVoices[0];
}

/**
 * Hook for text-to-speech with gendered voice support.
 *
 * The interviewer should call speak / speakKorean / speakEnglish with
 * `{ gender: "male" }` and Reham's lines with `{ gender: "female" }`.
 *
 * Convenience helpers: speakAsMale / speakAsFemale for quick use.
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const { language = "ko-KR", rate = 1, pitch = 1, cloud = true } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load available voices (they may arrive async in some browsers)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;

    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      if (voicesRef.current.length) setVoicesReady(true);
    };

    load(); // many browsers have voices ready synchronously
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  /**
   * Speak text with optional overrides including gender.
   */
  const speak = useCallback(
    (text: string, opts?: UseSpeechOptions) => {
      const finalLang = opts?.language || language;
      const finalRate = opts?.rate || rate;
      const finalPitch = opts?.pitch || pitch;
      const finalGender = opts?.gender;
      const useCloud = (opts?.cloud ?? cloud) && finalLang.toLowerCase().startsWith("ko") && cloudVoiceFits(text);

      stopCloudVoice();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setIsPaused(false);

      const browserSpeak = () => {
      if (!("speechSynthesis" in window)) {
        console.warn("Speech Synthesis API not supported in this browser");
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = finalLang;
      utterance.rate = finalRate;
      utterance.pitch = finalPitch;

      // Try to assign a gendered voice
      const voice = pickVoice(voicesRef.current, finalLang, finalGender);
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
      utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };

      window.speechSynthesis.speak(utterance);
      };

      if (!useCloud) return browserSpeak();
      setIsSpeaking(true);
      playCloudKorean(text, {
        gender: finalGender,
        rate: finalRate,
        onEnd: () => { setIsSpeaking(false); setIsPaused(false); },
        onFail: browserSpeak,
      });
    },
    [language, rate, pitch, cloud],
  );

  const pause = useCallback(() => {
    const a = currentCloudVoice();
    if (a && !a.paused) {
      a.pause();
      setIsPaused(true);
      return;
    }
    if ("speechSynthesis" in window && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    const a = currentCloudVoice();
    if (a && a.paused) {
      void a.play().catch(() => {});
      setIsPaused(false);
      return;
    }
    if ("speechSynthesis" in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const togglePause = useCallback(() => {
    if (isPaused) resume();
    else pause();
  }, [isPaused, pause, resume]);

  const cancel = useCallback(() => {
    stopCloudVoice();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  /* âââ Convenience: language helpers âââ */
  const speakKorean = useCallback(
    (text: string, opts?: Omit<UseSpeechOptions, "language">) => {
      speak(text, { ...opts, language: "ko-KR" });
    },
    [speak],
  );

  const speakEnglish = useCallback(
    (text: string, opts?: Omit<UseSpeechOptions, "language">) => {
      speak(text, { ...opts, language: "en-US" });
    },
    [speak],
  );

  /* âââ Convenience: gendered helpers âââ */
  const speakAsMale = useCallback(
    (text: string, opts?: Omit<UseSpeechOptions, "gender">) => {
      speak(text, { ...opts, gender: "male" });
    },
    [speak],
  );

  const speakAsFemale = useCallback(
    (text: string, opts?: Omit<UseSpeechOptions, "gender">) => {
      speak(text, { ...opts, gender: "female" });
    },
    [speak],
  );

  return {
    speak,
    speakKorean,
    speakEnglish,
    speakAsMale,
    speakAsFemale,
    pause,
    resume,
    togglePause,
    cancel,
    isSpeaking,
    isPaused,
    voicesReady,
  };
}
