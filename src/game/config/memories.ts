import type { ChapterId } from "./chapters";
import type { WorldLang } from "./copy";

/**
 * Cluby's returning memories — "The Forgotten Clovers" (canon
 * longTermStory.memories; Re, 16 Nov 2026: "continue as a full story").
 * One per chapter. Each is something small Cluby senses again, never an
 * explanation, and each carries one Korean word. Only the last touches the
 * mystery's premise, and it explains nothing (canon: reveal very slowly).
 *
 * The six canon questions:
 * 1 what is learned: the memory's one Korean word;
 * 2 why now: the learner has just finished this chapter of the road;
 * 3 whose moment: Cluby's (memory keeper), told about him, not by him as an
 *   oracle;
 * 4 which world: the chapter's own place, where the memory returns;
 * 5 what real data: Cluby has hatched (the learner's real progress) and the
 *   place is open (the learner's real course level) — see memoryDue();
 * 6 what changes: the memory is kept under its chapter in the story card.
 *
 * Nobody who has not hatched Cluby ever sees a word of this (canon: he is not
 * shown before the hatch).
 */
export type MemoryId = "warmth" | "strokes" | "apple" | "answer" | "table" | "journey" | "setdown" | "light";

export const MEMORY_OF: Record<ChapterId, MemoryId> = {
  egg: "warmth",
  hangul: "strokes",
  market: "apple",
  cafe: "answer",
  culture: "table",
  seoul: "journey",
  alley: "setdown",
  namsan: "light",
};

export const MEMORY_ORDER = Object.values(MEMORY_OF);

export interface Memory {
  title: string;
  text: string;
  /** The memory's word. */
  ko: string;
  gloss: string;
}

/**
 * Is this chapter's memory ready to return? Only when Cluby is awake and out
 * of the egg (real progress), the chapter is finished, and it has not
 * returned already. The caller checks the place itself is open and that the
 * learner is standing in it.
 */
export function memoryDue(chapter: ChapterId, o: { clubyHere: boolean; chapterDone: boolean; remembered: readonly string[] }): MemoryId | null {
  const id = MEMORY_OF[chapter];
  return o.clubyHere && o.chapterDone && !o.remembered.includes(id) ? id : null;
}

const KO: Record<MemoryId, string> = { warmth: "따뜻해요", strokes: "글자", apple: "기억", answer: "대답", table: "같이", journey: "멀리", setdown: "조심히", light: "빛" };

const EN: Record<MemoryId, Omit<Memory, "ko">> = {
  warmth: { title: "Warmth", text: "Cluby touches the empty shell and goes quiet. He remembers being warm for a very long time, and voices outside practising the same sounds, again and again.", gloss: "it is warm" },
  strokes: { title: "Strokes in the dark", text: "In front of the letter signs Cluby stands very still. He remembers shapes like these, drawn in the dark one stroke at a time. He never saw who drew them.", gloss: "a letter, a written character" },
  apple: { title: "A word before the thing", text: "At the fruit stand Cluby knows a word before he sees the thing. Someone once said it to him, slowly, twice. He remembers the voice, not the face.", gloss: "memory" },
  answer: { title: "Someone answered", text: "Two people talking over their cups. Cluby remembers that he was never alone with the sounds: when a word was said, someone answered.", gloss: "an answer" },
  table: { title: "More than one place", text: "A holiday table. Cluby remembers small places laid side by side, more than one, and the feeling of waiting together.", gloss: "together" },
  journey: { title: "A long way", text: "From the train window Cluby remembers moving: carried a long way, wrapped in something ivory, the sound of the rails underneath.", gloss: "far" },
  setdown: { title: "Set down gently", text: "Among the stalls Cluby remembers being set down, very gently. A voice said one word. He still cannot make it out.", gloss: "carefully, gently" },
  light: { title: "A green light", text: "From the tower, far below, a small green light answers once from another roof. Then it is gone. Cluby says nothing for a long time.", gloss: "light" },
};

const AR: Record<MemoryId, Omit<Memory, "ko">> = {
  warmth: { title: "الدفء", text: "يلمس كلوبي القشرة الفارغة ويصمت. يتذكّر أنه كان دافئًا زمنًا طويلًا جدًا، وأصواتًا في الخارج تردّد الأصوات نفسها مرة بعد مرة.", gloss: "الجو دافئ" },
  strokes: { title: "خطوط في العتمة", text: "أمام لافتات الحروف يقف كلوبي ساكنًا تمامًا. يتذكّر أشكالًا كهذه تُرسم في العتمة، خطًّا بعد خط. لم يرَ قط من كان يرسمها.", gloss: "حرف مكتوب" },
  apple: { title: "كلمة قبل الشيء", text: "عند بسطة الفاكهة يعرف كلوبي كلمة قبل أن يرى الشيء. قالها له أحدهم ذات مرة، ببطء، مرتين. يتذكّر الصوت لا الوجه.", gloss: "ذكرى" },
  answer: { title: "أحدهم أجاب", text: "شخصان يتحدثان فوق فنجانيهما. يتذكّر كلوبي أنه لم يكن وحده مع الأصوات قط: حين كانت تُقال كلمة، كان أحدهم يجيب.", gloss: "جواب" },
  table: { title: "أكثر من مكان", text: "مائدة عيد. يتذكّر كلوبي أماكن صغيرة مصفوفة جنبًا إلى جنب، أكثر من مكان واحد، وشعور الانتظار معًا.", gloss: "معًا" },
  journey: { title: "طريق طويل", text: "من نافذة القطار يتذكّر كلوبي أنه كان يتحرك: محمولًا مسافة طويلة، ملفوفًا في شيء عاجيّ، وصوت السكة تحته.", gloss: "بعيدًا" },
  setdown: { title: "وُضع برفق", text: "بين البسطات يتذكّر كلوبي أنه وُضع في مكانه، برفق شديد. قال صوتٌ كلمة واحدة. ما زال لا يستطيع تمييزها.", gloss: "بحذر، برفق" },
  light: { title: "ضوء أخضر", text: "من البرج، بعيدًا في الأسفل، يجيب ضوء أخضر صغير مرة واحدة من فوق سطح آخر. ثم يختفي. يبقى كلوبي صامتًا طويلًا.", gloss: "ضوء" },
};

export function memory(lang: WorldLang, id: MemoryId): Memory {
  return { ...(lang === "ar" ? AR : EN)[id], ko: KO[id] };
}
