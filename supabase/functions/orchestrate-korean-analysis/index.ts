import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

// The 7 orchestra sections — each generates a different content layer
const SECTIONS = [
  "vocabulary",
  "grammar",
  "pronunciation",
  "dialogue",
  "reading",
  "cultural",
  "professional",
] as const;

type Section = typeof SECTIONS[number];

function levelDesc(topikLevel: number): string {
  const map: Record<number, string> = {
    0: "Hangul Foundation (absolute beginner — focus on letter recognition)",
    1: "TOPIK 1 / A1 (basic greetings, simple sentences, everyday vocabulary)",
    2: "TOPIK 2 / A2 (simple conversations, daily life, basic grammar patterns)",
    3: "TOPIK 3 / B1 (intermediate — real-life topics, complex grammar, opinions)",
    4: "TOPIK 4 / B2 (upper-intermediate — professional, idiomatic, nuanced)",
    5: "TOPIK 5 / C1 (advanced — academic, literary, sophisticated nuance)",
    6: "TOPIK 6 / C2 (near-native — classical, broadcasting, expert mastery)",
  };
  return map[topikLevel] ?? "TOPIK 1 / A1";
}

function buildPrompt(lesson: {
  title_en: string; title_ko: string; description: string; book: string; topik_level: number;
}): string {
  const lvl = levelDesc(lesson.topik_level);
  const isProfessional = lesson.topik_level >= 4;
  const bookCtx = lesson.book === "daily-routine"
    ? "This is a Daily Routine Korean lesson — focus on practical everyday vocabulary and action verbs."
    : lesson.book === "kdrama"
    ? "This is a K-Drama Korean lesson — use dramatic, emotional dialogue inspired by Korean dramas."
    : lesson.book === "grammar-mastery"
    ? "This is a Grammar Mastery lesson — deeply explain the grammar pattern, its structure, usage rules, and common mistakes."
    : "";

  return `You are a PhD-level Korean language expert. Generate comprehensive educational content for:

LESSON: "${lesson.title_en}" (${lesson.title_ko})
DESCRIPTION: ${lesson.description}
LEVEL: ${lvl}
BOOK CONTEXT: ${bookCtx}

Return ONLY valid JSON with exactly these keys:

{
  "vocabulary": [
    {
      "korean": "한국어 단어",
      "romanization": "han-gug-eo dan-eo",
      "meaning": "English meaning",
      "part_of_speech": "noun|verb|adjective|adverb|particle|expression",
      "example_sentence": "완전한 예문.",
      "example_english": "Complete example sentence."
    }
  ],
  "grammar": [
    {
      "title": "Grammar Pattern Name",
      "structure": "V-stem + ending (formula)",
      "explanation": "Detailed explanation of when and how to use this pattern.",
      "formal_example": "Formal usage example in Korean.",
      "informal_example": "Informal/casual usage example.",
      "common_mistakes": "Common mistakes learners make.",
      "examples": [
        { "korean": "예문 1.", "english": "Example 1." },
        { "korean": "예문 2.", "english": "Example 2." }
      ]
    }
  ],
  "pronunciation": {
    "title": "Pronunciation Guide",
    "notes": "Specific pronunciation rules for vocabulary in this lesson.",
    "batchim_rules": "Any batchim (final consonant) rules that apply.",
    "liaison_patterns": "연음 (liaison) patterns relevant to this lesson.",
    "minimal_pairs": [{ "word1": "비", "word2": "피", "distinction": "b vs p sound" }]
  },
  "dialogue": [
    {
      "speaker": "A",
      "korean": "안녕하세요!",
      "romanization": "annyeonghaseyo!",
      "english": "Hello!"
    }
  ],
  "reading_short": {
    "korean_text": "Short 4-6 sentence passage in Korean relevant to lesson topic.",
    "english_text": "English translation of the short passage."
  },
  "reading_extended": {
    "korean_text": "Longer 6-10 sentence passage at level-appropriate complexity.",
    "english_text": "English translation of the extended passage."
  },
  "reading_cultural": {
    "korean_text": "Cultural context note in Korean — explain relevant Korean customs, honorifics, or social norms.",
    "english_text": "English translation of the cultural note."
  },
  "exercises": [
    {
      "question": "Quiz question in English or Korean?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Why this answer is correct."
    }
  ]${isProfessional ? `,
  "professional_exercises": [
    {
      "question": "Professional/academic scenario question for TOPIK ${lesson.topik_level}.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Professional language explanation."
    }
  ]` : ""}
}

REQUIREMENTS:
- vocabulary: 12-18 items, ordered by frequency/importance
- grammar: ${lesson.topik_level >= 3 ? "4-5" : "2-3"} patterns with full explanations
- dialogue: ${lesson.topik_level >= 3 ? "10-14" : "6-10"} lines, realistic and natural
- exercises: 4-5 multiple choice questions testing lesson content
- All Korean must be accurate and natural
- Level: ${lvl}
- Return ONLY the JSON object, no markdown fences`;
}

async function callAI(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`AI API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let lessonId: number | null = null;
  let bookFilter: string | null = null;
  let topikFilter: number | null = null;
  let limit = 1;
  let forceRegenerate = false;

  try {
    const body = await req.json();
    lessonId = body.lesson_id ?? null;
    bookFilter = body.book ?? null;
    topikFilter = body.topik_level ?? null;
    limit = Math.min(body.limit ?? 1, 5);
    forceRegenerate = body.force_regenerate === true;
  } catch { /* no body */ }

  // Fetch lessons to process
  let query = supabase
    .from("textbook_lessons")
    .select("id, sort_order, title_en, title_ko, description, book, topik_level")
    .eq("is_published", true)
    .order("sort_order");

  if (lessonId) query = query.eq("id", lessonId);
  else if (bookFilter) query = query.eq("book", bookFilter);
  if (topikFilter !== null) query = query.eq("topik_level", topikFilter);

  const { data: lessons, error: fetchErr } = await (query as any);
  if (fetchErr || !lessons?.length) {
    return new Response(JSON.stringify({ error: fetchErr?.message ?? "No lessons found" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filter to unpopulated unless force_regenerate
  let toProcess = lessons;
  if (!forceRegenerate) {
    const { data: existingVocab } = await supabase.from("lesson_vocabulary").select("lesson_id");
    const populated = new Set((existingVocab ?? []).map((v: any) => v.lesson_id));
    toProcess = lessons.filter((l: any) => !populated.has(l.id));
  }

  if (!toProcess.length) {
    return new Response(JSON.stringify({ message: "All lessons already have content", total: lessons.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const batch = toProcess.slice(0, limit);
  const results: { lesson_id: number; title: string; sections: string[]; error?: string }[] = [];

  for (const lesson of batch) {
    const sectionsGenerated: string[] = [];
    try {
      const prompt = buildPrompt(lesson);
      const rawText = await callAI(apiKey, prompt);

      let content: any;
      try {
        content = JSON.parse(rawText.replace(/```json\n?|\n?```/g, "").trim());
      } catch {
        results.push({ lesson_id: lesson.id, title: lesson.title_en, sections: [], error: "JSON parse failed" });
        continue;
      }

      // 🎹 Section 1: Vocabulary Maestro
      if (content.vocabulary?.length > 0) {
        await supabase.from("lesson_vocabulary").insert(
          content.vocabulary.map((v: any, i: number) => ({
            lesson_id: lesson.id, korean: v.korean, romanization: v.romanization ?? "",
            meaning: v.meaning, sort_order: i + 1,
          }))
        );
        sectionsGenerated.push("vocabulary");
      }

      // 🎸 Section 2: Grammar Architect + 🎻 Section 3: Pronunciation Coach
      const grammarItems: any[] = [];
      if (content.grammar?.length > 0) {
        content.grammar.forEach((g: any, i: number) => {
          grammarItems.push({
            lesson_id: lesson.id, title: g.title, structure: g.structure ?? "",
            explanation: `${g.explanation ?? ""}\n\nFormal: ${g.formal_example ?? ""}\nInformal: ${g.informal_example ?? ""}\n\nCommon mistakes: ${g.common_mistakes ?? ""}`,
            examples: g.examples ?? [], sort_order: i + 1,
          });
        });
        sectionsGenerated.push("grammar");
      }
      if (content.pronunciation) {
        const p = content.pronunciation;
        grammarItems.push({
          lesson_id: lesson.id, title: p.title ?? "Pronunciation Guide",
          structure: "Pronunciation",
          explanation: `${p.notes ?? ""}\n\nBatchim rules: ${p.batchim_rules ?? "N/A"}\nLiaison (연음): ${p.liaison_patterns ?? "N/A"}`,
          examples: (p.minimal_pairs ?? []).map((mp: any) => ({
            korean: `${mp.word1} vs ${mp.word2}`, english: mp.distinction ?? "",
          })),
          sort_order: grammarItems.length + 1,
        });
        sectionsGenerated.push("pronunciation");
      }
      if (grammarItems.length > 0) {
        await supabase.from("lesson_grammar").insert(grammarItems);
      }

      // 🎤 Section 4: Conversation Director
      if (content.dialogue?.length > 0) {
        await supabase.from("lesson_dialogues").insert(
          content.dialogue.map((d: any, i: number) => ({
            lesson_id: lesson.id, speaker: d.speaker ?? "A", korean: d.korean,
            romanization: d.romanization ?? "", english: d.english, sort_order: i + 1,
          }))
        );
        sectionsGenerated.push("dialogue");
      }

      // 📖 Section 5: Reading Analyst + 🌸 Section 6: Cultural Contextualist
      const readingItems: any[] = [];
      if (content.reading_short) {
        readingItems.push({ lesson_id: lesson.id, korean_text: content.reading_short.korean_text, english_text: content.reading_short.english_text ?? "", sort_order: 1 });
        sectionsGenerated.push("reading");
      }
      if (content.reading_extended) {
        readingItems.push({ lesson_id: lesson.id, korean_text: content.reading_extended.korean_text, english_text: content.reading_extended.english_text ?? "", sort_order: 2 });
      }
      if (content.reading_cultural) {
        readingItems.push({ lesson_id: lesson.id, korean_text: `[문화 노트]\n${content.reading_cultural.korean_text}`, english_text: `[Cultural Note]\n${content.reading_cultural.english_text ?? ""}`, sort_order: 3 });
        sectionsGenerated.push("cultural");
      }
      if (readingItems.length > 0) {
        await supabase.from("lesson_reading").insert(readingItems);
      }

      // ✏️ Standard Exercises + 👔 Section 7: Professional Expert
      const exerciseItems: any[] = [];
      if (content.exercises?.length > 0) {
        content.exercises.forEach((e: any, i: number) => {
          exerciseItems.push({
            lesson_id: lesson.id, question: e.question, options: e.options ?? [],
            correct_index: e.correct_index ?? 0, explanation: e.explanation ?? "", sort_order: i + 1,
          });
        });
        sectionsGenerated.push("exercises");
      }
      if (content.professional_exercises?.length > 0) {
        content.professional_exercises.forEach((e: any, i: number) => {
          exerciseItems.push({
            lesson_id: lesson.id, question: `[Professional] ${e.question}`, options: e.options ?? [],
            correct_index: e.correct_index ?? 0, explanation: e.explanation ?? "",
            sort_order: exerciseItems.length + 1,
          });
        });
        sectionsGenerated.push("professional");
      }
      if (exerciseItems.length > 0) {
        await supabase.from("lesson_exercises").insert(exerciseItems);
      }

      results.push({ lesson_id: lesson.id, title: lesson.title_en, sections: sectionsGenerated });
    } catch (err: any) {
      results.push({ lesson_id: lesson.id, title: lesson.title_en, sections: [], error: err.message });
    }
  }

  return new Response(
    JSON.stringify({
      lessons_processed: results.length,
      remaining: toProcess.length - results.length,
      results,
      orchestra_sections: SECTIONS,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
