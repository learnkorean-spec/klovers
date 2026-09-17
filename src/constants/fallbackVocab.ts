/**
 * Shared fallback vocabulary for the three games that need a word bank before
 * a student has enough lesson progress of their own (see useGameData.ts):
 * Match, Flashcard, and Scramble each used to keep their own hardcoded list,
 * and those lists overlapped heavily (사랑/친구/학교/가족/음식/행복/여행/음악 all
 * appeared in two or more of them). A guest — or a new student who hasn't
 * studied enough vocabulary yet — playing several of these games back to
 * back would see the same dozen words recycled almost immediately.
 *
 * This is one 36-word bank, partitioned into three non-overlapping sets of
 * 12, so no filler word repeats across games in a single sitting. All words
 * are two syllables (safe for WordScrambleGame's scrambleKorean(), which is
 * a no-op on single-character input) and use the same Revised-Romanization
 * style already used elsewhere in these files (no diacritics, e.g. "eo" for
 * ㅓ, "eu" for ㅡ).
 */

export interface FallbackVocabItem {
  korean: string;
  romanization: string;
  meaning: string;
}

/** Used by KoreanMatchGame. */
export const MATCH_FALLBACK_VOCAB: FallbackVocabItem[] = [
  { korean: "사랑", romanization: "sarang", meaning: "Love" },
  { korean: "친구", romanization: "chingu", meaning: "Friend" },
  { korean: "학교", romanization: "hakgyo", meaning: "School" },
  { korean: "가족", romanization: "gajok", meaning: "Family" },
  { korean: "나라", romanization: "nara", meaning: "Country" },
  { korean: "사람", romanization: "saram", meaning: "Person" },
  { korean: "이름", romanization: "ireum", meaning: "Name" },
  { korean: "나무", romanization: "namu", meaning: "Tree" },
  { korean: "바람", romanization: "baram", meaning: "Wind" },
  { korean: "날씨", romanization: "nalssi", meaning: "Weather" },
  { korean: "사진", romanization: "sajin", meaning: "Photo" },
  { korean: "노래", romanization: "norae", meaning: "Song" },
];

/** Used by FlashcardGame. Keeps the two greeting phrases — they're common
 *  fixed expressions rather than single nouns, which fits flashcards. */
export const FLASHCARD_FALLBACK_VOCAB: FallbackVocabItem[] = [
  { korean: "안녕하세요", romanization: "annyeonghaseyo", meaning: "Hello" },
  { korean: "감사합니다", romanization: "gamsahamnida", meaning: "Thank you" },
  { korean: "음식", romanization: "eumsik", meaning: "Food" },
  { korean: "공부", romanization: "gongbu", meaning: "Study" },
  { korean: "한국", romanization: "hanguk", meaning: "Korea" },
  { korean: "행복", romanization: "haengbok", meaning: "Happiness" },
  { korean: "여행", romanization: "yeohaeng", meaning: "Travel" },
  { korean: "음악", romanization: "eumak", meaning: "Music" },
  { korean: "문화", romanization: "munhwa", meaning: "Culture" },
  { korean: "역사", romanization: "yeoksa", meaning: "History" },
  { korean: "세계", romanization: "segye", meaning: "World" },
  { korean: "자연", romanization: "jayeon", meaning: "Nature" },
];

/** Used by WordScrambleGame. Only two-syllable words — every entry here
 *  scrambles meaningfully. */
export const SCRAMBLE_FALLBACK_VOCAB: FallbackVocabItem[] = [
  { korean: "시간", romanization: "sigan", meaning: "Time" },
  { korean: "미래", romanization: "mirae", meaning: "Future" },
  { korean: "바다", romanization: "bada", meaning: "Ocean" },
  { korean: "하늘", romanization: "haneul", meaning: "Sky" },
  { korean: "창문", romanization: "changmun", meaning: "Window" },
  { korean: "마음", romanization: "maeum", meaning: "Heart/Mind" },
  { korean: "하루", romanization: "haru", meaning: "Day" },
  { korean: "아침", romanization: "achim", meaning: "Morning" },
  { korean: "저녁", romanization: "jeonyeok", meaning: "Evening" },
  { korean: "계절", romanization: "gyejeol", meaning: "Season" },
  { korean: "요일", romanization: "yoil", meaning: "Day of week" },
  { korean: "영화", romanization: "yeonghwa", meaning: "Movie" },
];
