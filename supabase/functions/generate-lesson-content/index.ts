import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Get all lessons
  const { data: lessons } = await supabase
    .from("textbook_lessons")
    .select("id, sort_order, title_en, title_ko, description")
    .eq("is_published", true)
    .order("sort_order");

  if (!lessons || lessons.length === 0) {
    return new Response(JSON.stringify({ error: "No lessons found" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check which lessons already have vocab content
  const { data: existingVocab } = await supabase
    .from("lesson_vocabulary")
    .select("lesson_id");
  const populatedIds = new Set((existingVocab || []).map((v: any) => v.lesson_id));

  const unpopulated = lessons.filter((l: any) => !populatedIds.has(l.id));

  if (unpopulated.length === 0) {
    return new Response(JSON.stringify({ message: "All lessons already have content", total: lessons.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let generated = 0;
  const errors: string[] = [];

  // Process lessons in batches of 3
  for (let i = 0; i < unpopulated.length; i += 3) {
    const batch = unpopulated.slice(i, i + 3);
    
    await Promise.all(batch.map(async (lesson: any) => {
      try {
        const prompt = `Generate Korean language lesson content for TOPIK Level 1, Lesson ${lesson.sort_order}: "${lesson.title_en}" (${lesson.title_ko}). Description: ${lesson.description}.

Return a JSON object with these exact keys:
{
  "vocabulary": [{"korean":"...","romanization":"...","meaning":"..."}],
  "grammar": [{"title":"...","structure":"...","explanation":"...","examples":[{"korean":"...","english":"..."}]}],
  "dialogue": [{"speaker":"...","korean":"...","romanization":"...","english":"..."}],
  "exercises": [{"question":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"..."}],
  "reading": [{"korean_text":"...","english_text":"..."}]
}

Requirements:
- vocabulary: 8-12 items relevant to the lesson topic
- grammar: 2-3 grammar points with 2-3 examples each
- dialogue: 4-6 lines of natural conversation
- exercises: 4-5 multiple choice questions
- reading: 1 short paragraph (4-6 sentences) with translation
- All Korean must be accurate and natural
- Romanization should follow standard romanization
- Content should be appropriate for TOPIK 1 (beginner) level
- Return ONLY valid JSON, no markdown or extra text`;

        const aiRes = await fetch("https://lovable.dev/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });

        if (!aiRes.ok) {
          errors.push(`Lesson ${lesson.sort_order}: AI request failed (${aiRes.status})`);
          return;
        }

        const aiData = await aiRes.json();
        let content: any;
        try {
          const text = aiData.choices?.[0]?.message?.content || aiData.content || "";
          content = JSON.parse(text.replace(/```json\n?|\n?```/g, "").trim());
        } catch {
          errors.push(`Lesson ${lesson.sort_order}: Failed to parse AI response`);
          return;
        }

        // Insert vocabulary
        if (content.vocabulary?.length > 0) {
          await supabase.from("lesson_vocabulary").insert(
            content.vocabulary.map((v: any, idx: number) => ({
              lesson_id: lesson.id,
              korean: v.korean,
              romanization: v.romanization || "",
              meaning: v.meaning,
              sort_order: idx + 1,
            }))
          );
        }

        // Insert grammar
        if (content.grammar?.length > 0) {
          await supabase.from("lesson_grammar").insert(
            content.grammar.map((g: any, idx: number) => ({
              lesson_id: lesson.id,
              title: g.title,
              structure: g.structure || "",
              explanation: g.explanation || "",
              examples: g.examples || [],
              sort_order: idx + 1,
            }))
          );
        }

        // Insert dialogue
        if (content.dialogue?.length > 0) {
          await supabase.from("lesson_dialogues").insert(
            content.dialogue.map((d: any, idx: number) => ({
              lesson_id: lesson.id,
              speaker: d.speaker,
              korean: d.korean,
              romanization: d.romanization || "",
              english: d.english,
              sort_order: idx + 1,
            }))
          );
        }

        // Insert exercises
        if (content.exercises?.length > 0) {
          await supabase.from("lesson_exercises").insert(
            content.exercises.map((e: any, idx: number) => ({
              lesson_id: lesson.id,
              question: e.question,
              options: e.options || [],
              correct_index: e.correct_index ?? 0,
              explanation: e.explanation || "",
              sort_order: idx + 1,
            }))
          );
        }

        // Insert reading
        if (content.reading?.length > 0) {
          await supabase.from("lesson_reading").insert(
            content.reading.map((r: any, idx: number) => ({
              lesson_id: lesson.id,
              korean_text: r.korean_text,
              english_text: r.english_text || "",
              sort_order: idx + 1,
            }))
          );
        }

        generated++;
      } catch (err) {
        errors.push(`Lesson ${lesson.sort_order}: ${err.message}`);
      }
    }));
  }

  return new Response(
    JSON.stringify({ generated, remaining: unpopulated.length - generated, errors }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
