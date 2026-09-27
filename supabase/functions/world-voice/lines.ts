/**
 * The lines KLOVERS World can voice, by id, with the voice that fits each
 * speaker (OpenAI TTS voices: ash / echo / onyx are men's, coral / sage /
 * nova / shimmer women's). The Korean must match src/game/config/copy.ts —
 * src/game/systems/__tests__/voice.test.ts checks it.
 */
export const LINES: Record<string, { ko: string; voice: string; who: string }> = {
  minsu: { ko: "안녕하세요! 저는 민수예요. 반가워요!", voice: "ash", who: "a friendly young Korean man in his early twenties" },
  adam: { ko: "안녕하세요! 저는 아담이에요.", voice: "echo", who: "a friendly young man, a Korean learner" },
  lina: { ko: "안녕하세요! 저는 리나예요.", voice: "coral", who: "a friendly young woman, a Korean learner" },
  auntie: { ko: "안녕하세요!", voice: "sage", who: "a warm Korean woman in her fifties" },
  vendor: { ko: "감사합니다!", voice: "onyx", who: "a cheerful Korean street vendor, a man in his forties" },
  shopkeeper: { ko: "어서 오세요! 뭐 드릴까요?", voice: "onyx", who: "a welcoming Korean shopkeeper, a man in his thirties" },
  baker: { ko: "고마워요! 빵 드세요.", voice: "nova", who: "a kind Korean baker, a woman in her forties" },
  hubFriend: { ko: "어디 가요?", voice: "echo", who: "a relaxed Korean university student, a young man" },
  hubReader: { ko: "한국어를 공부해요.", voice: "shimmer", who: "a calm young woman reading" },
};

