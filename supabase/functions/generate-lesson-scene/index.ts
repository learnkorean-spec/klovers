import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageDataUrl, getAiKey } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lesson_id } = await req.json();
    if (!lesson_id) throw new Error("lesson_id required");

    const AI_API_KEY = getAiKey();
    if (!AI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the lesson and its vocabulary
    const { data: lesson, error: lessonErr } = await supabase
      .from("textbook_lessons")
      .select("*")
      .eq("id", lesson_id)
      .single();

    if (lessonErr || !lesson) throw new Error("Lesson not found");

    const { data: vocab } = await supabase
      .from("lesson_vocabulary")
      .select("korean, meaning")
      .eq("lesson_id", lesson_id)
      .order("sort_order")
      .limit(8);

    const vocabList = (vocab || []).map((v: any) => `${v.korean} (${v.meaning})`).join(", ");

    const prompt = `Generate a colorful isometric illustration for a Korean language textbook. The scene theme is "${lesson.title_en}" (${lesson.title_ko}). ${lesson.description}. 

The illustration should be in a clean, modern Korean textbook style with an isometric 3D perspective showing a scene related to the topic. Include cute cartoon characters performing actions related to these Korean vocabulary words: ${vocabList}.

Style: Clean lines, Klovers palette only — ivory #FFF9EC background, bright yellow #FFFF00 and charcoal #2E2E2E accents, isometric perspective, educational illustration style, no text labels (we will add them digitally).`;

    console.log("Generating scene for lesson:", lesson.title_en);

    const aiResponse = await generateImageDataUrl(prompt, AI_API_KEY);

    if (!aiResponse.ok) {
      const errText = aiResponse.errorText;
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI image API error: ${aiResponse.status}`);
    }

    const imageData = (aiResponse.ok ? aiResponse.dataUrl : undefined);

    if (!imageData) throw new Error("No image generated");

    // Extract base64 and upload to storage
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const fileName = `lesson-${lesson_id}-scene.png`;

    const { error: uploadErr } = await supabase.storage
      .from("lesson-scenes")
      .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);

    const { data: publicUrl } = supabase.storage
      .from("lesson-scenes")
      .getPublicUrl(fileName);

    // Update lesson with the scene image URL
    const { error: updateErr } = await supabase
      .from("textbook_lessons")
      .update({ scene_image_url: publicUrl.publicUrl })
      .eq("id", lesson_id);

    if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

    return new Response(JSON.stringify({ success: true, url: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
