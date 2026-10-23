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
  shopper: { ko: "이거 얼마예요?", voice: "coral", who: "a curious Korean woman shopping at a market" },
  cafeA: { ko: "커피 좋아해요?", voice: "echo", who: "a friendly young Korean man at a café table" },
  cafeB: { ko: "네, 좋아해요! 녹차도 좋아해요.", voice: "nova", who: "a cheerful young Korean woman at a café table" },
  cook: { ko: "맛있게 드세요!", voice: "sage", who: "a warm Korean street-food cook, a woman in her fifties" },
  twoHands: { ko: "여기 있습니다.", voice: "onyx", who: "a polite Korean hanbok shop owner, a man in his forties" },
  newYear: { ko: "새해 복 많이 받으세요!", voice: "shimmer", who: "a cheerful young Korean woman wishing a happy new year" },
};

