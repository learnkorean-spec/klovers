import { useState, useCallback } from "react";

interface UseSpeechOptions {
  language?: string;
  rate?: number;
  pitch?: number;
}

/**
 * Hook for text-to-speech functionality using Web Speech API
 * Supports Korean pronunciation and other languages
 */
export function useSpeech(options: UseSpeechOptions = {}) {
  const { language = "ko-KR", rate = 1, pitch = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);

  /**
   * Speak text using Web Speech API
   */
  const speak = useCallback(
    (text: string, opts?: UseSpeechOptions) => {
      if (!("speechSynthesis" in window)) {
        console.warn("Speech Synthesis API not supported in this browser");
        return;
      }

      const finalLang = opts?.language || language;
      const finalRate = opts?.rate || rate;
      const finalPitch = opts?.pitch || pitch;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = finalLang;
      utterance.rate = finalRate;
      utterance.pitch = finalPitch;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [language, rate, pitch]
  );

  /**
   * Cancel current speech
   */
  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  /**
   * Speak Korean text (convenience method)
   */
  const speakKorean = useCallback((text: string) => {
    speak(text, { language: "ko-KR" });
  }, [speak]);

  /**
   * Speak English text (convenience method)
   */
  const speakEnglish = useCallback((text: string) => {
    speak(text, { language: "en-US" });
  }, [speak]);

  return {
    speak,
    speakKorean,
    speakEnglish,
    cancel,
    isSpeaking,
  };
}
