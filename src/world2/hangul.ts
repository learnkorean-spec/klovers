/**
 * KLOVERS World 2 — "Learn the Alphabet" with Cluby.
 *
 * Re, 4 Nov 2026: the last piece of a bundled request ("real converstations
 * to help a person study korean from the alphabit") — everything else
 * World2 taught so far (the cart and store rooms) was vocabulary *in
 * context* (어묵, 과자, 얼마예요?...), never the writing/sound system itself.
 * This is the genuinely new thing: all 24 basic Hangul jamo (14 consonants,
 * 10 vowels), each introduced as a short line from Cluby — a real teaching
 * moment, not just a flashcard grid.
 *
 * Story-canon note (CLAUDE.md's mandatory check before any story/world
 * content): the live /world game's own canon already has a dedicated world
 * for exactly this — "Hangul Village... the Korean writing/sound system,
 * lead: male learner + Cluby" (klovers-world.ts / KLOVERS-STORY-BIBLE.md
 * §5). This is NOT that world and doesn't claim to be: World2 is an
 * explicitly off-canon hackathon demo page (memory: "kept separate from the
 * live game"), this feature is labelled "Learn the Alphabet" here, never
 * "Hangul Village," introduces no new characters, places, or progression
 * logic, and touches no production room or canon world file. It's Cluby —
 * already in every World2 scene, already canon-cast for exactly this job
 * (`give_hints`, `companion`) — teaching real linguistic content, same as
 * his existing vocab/dialogue role, just for the alphabet instead of a word.
 */

export type HangulLetter = {
  id: string;
  letter: string;
  kind: "consonant" | "vowel";
  /** The letter's own Korean name (기역, 니은, 아, 야, ...). */
  name: string;
  /** Romanized reading of `name`. */
  reading: string;
  /** A short, plain-English approximation of the sound — not IPA, just
   * enough for a learner to get the idea on a first pass. */
  sound: string;
  example: { korean: string; reading: string; english: string };
};

/** The 14 basic consonants (자음), in their traditional teaching order. */
const CONSONANTS: HangulLetter[] = [
  { id: "g", letter: "ㄱ", kind: "consonant", name: "기역", reading: "gi-yeok", sound: "g, like in 'go'", example: { korean: "가방", reading: "ga-bang", english: "bag" } },
  { id: "n", letter: "ㄴ", kind: "consonant", name: "니은", reading: "ni-eun", sound: "n, like in 'no'", example: { korean: "노래", reading: "no-rae", english: "song" } },
  { id: "d", letter: "ㄷ", kind: "consonant", name: "디귿", reading: "di-geut", sound: "d, like in 'do'", example: { korean: "다리", reading: "da-ri", english: "leg/bridge" } },
  { id: "r", letter: "ㄹ", kind: "consonant", name: "리을", reading: "ri-eul", sound: "a soft r/l, like in 'run'", example: { korean: "라면", reading: "ra-myeon", english: "ramyeon noodles" } },
  { id: "m", letter: "ㅁ", kind: "consonant", name: "미음", reading: "mi-eum", sound: "m, like in 'mom'", example: { korean: "모자", reading: "mo-ja", english: "hat" } },
  { id: "b", letter: "ㅂ", kind: "consonant", name: "비읍", reading: "bi-eup", sound: "b, like in 'boy'", example: { korean: "바나나", reading: "ba-na-na", english: "banana" } },
  { id: "s", letter: "ㅅ", kind: "consonant", name: "시옷", reading: "si-ot", sound: "s, like in 'sun'", example: { korean: "사과", reading: "sa-gwa", english: "apple" } },
  { id: "ng", letter: "ㅇ", kind: "consonant", name: "이응", reading: "i-eung", sound: "silent at the start of a syllable, 'ng' at the end", example: { korean: "사랑", reading: "sa-rang", english: "love" } },
  { id: "j", letter: "ㅈ", kind: "consonant", name: "지읒", reading: "ji-eut", sound: "j, like in 'jam'", example: { korean: "주스", reading: "ju-seu", english: "juice" } },
  { id: "ch", letter: "ㅊ", kind: "consonant", name: "치읓", reading: "chi-eut", sound: "ch, like in 'chip'", example: { korean: "치즈", reading: "chi-jeu", english: "cheese" } },
  { id: "k", letter: "ㅋ", kind: "consonant", name: "키읔", reading: "ki-euk", sound: "a sharp k, like in 'kite'", example: { korean: "커피", reading: "keo-pi", english: "coffee" } },
  { id: "t", letter: "ㅌ", kind: "consonant", name: "티읕", reading: "ti-eut", sound: "a sharp t, like in 'top'", example: { korean: "토끼", reading: "to-kki", english: "rabbit" } },
  { id: "p", letter: "ㅍ", kind: "consonant", name: "피읖", reading: "pi-eup", sound: "a sharp p, like in 'pig'", example: { korean: "피자", reading: "pi-ja", english: "pizza" } },
  { id: "h", letter: "ㅎ", kind: "consonant", name: "히읗", reading: "hi-eut", sound: "h, like in 'hat'", example: { korean: "학교", reading: "hak-gyo", english: "school" } },
];

/** The 10 basic vowels (모음), in their traditional teaching order. */
const VOWELS: HangulLetter[] = [
  { id: "a", letter: "ㅏ", kind: "vowel", name: "아", reading: "a", sound: "ah, like in 'father'", example: { korean: "아빠", reading: "a-ppa", english: "dad" } },
  { id: "ya", letter: "ㅑ", kind: "vowel", name: "야", reading: "ya", sound: "ya, like in 'yard'", example: { korean: "야구", reading: "ya-gu", english: "baseball" } },
  { id: "eo", letter: "ㅓ", kind: "vowel", name: "어", reading: "eo", sound: "a soft 'uh', like in 'law'", example: { korean: "얼굴", reading: "eol-gul", english: "face" } },
  { id: "yeo", letter: "ㅕ", kind: "vowel", name: "여", reading: "yeo", sound: "yuh, like in 'young'", example: { korean: "여자", reading: "yeo-ja", english: "woman" } },
  { id: "o", letter: "ㅗ", kind: "vowel", name: "오", reading: "o", sound: "oh, like in 'go'", example: { korean: "오이", reading: "o-i", english: "cucumber" } },
  { id: "yo", letter: "ㅛ", kind: "vowel", name: "요", reading: "yo", sound: "yo, like in 'yo-yo'", example: { korean: "요리", reading: "yo-ri", english: "cooking" } },
  { id: "u", letter: "ㅜ", kind: "vowel", name: "우", reading: "u", sound: "oo, like in 'moon'", example: { korean: "우산", reading: "u-san", english: "umbrella" } },
  { id: "yu", letter: "ㅠ", kind: "vowel", name: "유", reading: "yu", sound: "yoo, like in 'you'", example: { korean: "유리", reading: "yu-ri", english: "glass" } },
  { id: "eu", letter: "ㅡ", kind: "vowel", name: "으", reading: "eu", sound: "a flat, unrounded 'uh'", example: { korean: "그림", reading: "geu-rim", english: "picture" } },
  { id: "i", letter: "ㅣ", kind: "vowel", name: "이", reading: "i", sound: "ee, like in 'see'", example: { korean: "이름", reading: "i-reum", english: "name" } },
];

export const HANGUL: HangulLetter[] = [...CONSONANTS, ...VOWELS];

/** Cluby's own teaching line for a letter — built from a fixed template
 * (branched only on consonant/vowel for correct Korean grammar: a
 * consonant's name always ends in a batchim, "...이라고"; a vowel's name
 * never does, "...라고") rather than 24 hand-written sentences, so every
 * entry stays grammatically consistent. */
export function clubyTeachesLetter(l: HangulLetter): { korean: string; reading: string; english: string } {
  const linker = l.kind === "consonant" ? "이라고" : "라고";
  const linkerReading = l.kind === "consonant" ? "i-ra-go" : "ra-go";
  return {
    korean: `잘 봐! 이 글자는 ${l.letter}, '${l.name}'${linker} 불러. ${l.example.korean}처럼 '${l.sound.split(",")[0]}' 소리가 나!`,
    reading: `jal bwa! i geul-ja-neun ${l.letter}, '${l.reading}' ${linkerReading} bul-leo. ${l.example.reading} cheo-reom so-ri-ga na!`,
    english: `Look! This letter is ${l.letter}, called '${l.name}' (${l.reading}). It makes the ${l.sound} sound — like in ${l.example.english} (${l.example.korean}).`,
  };
}
