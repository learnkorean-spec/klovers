import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText, analysisResult } = await req.json();
    if (!cvText || !analysisResult) {
      return new Response(JSON.stringify({ error: "cvText and analysisResult are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const weakCategories = analysisResult.categories
      ?.filter((c: any) => c.status === "warning" || c.status === "critical")
      ?.map((c: any) => `${c.name} (score: ${c.score}/100): ${c.feedback}`)
      .join("\n") || "No specific weak areas identified";

    const systemPrompt = `You are an expert CV coach. Based on the CV analysis results showing weak areas, generate targeted questions to gather missing information from the user. Each question should help fill a specific gap that would improve their CV score.

The weak areas are:
${weakCategories}

Top fixes needed:
${(analysisResult.topFixes || []).join("\n")}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "question": "The specific question to ask",
      "hint": "A helpful hint about what kind of answer would strengthen the CV",
      "category": "The category this improves (e.g. Work Experience, Skills, etc.)"
    }
  ]
}

Generate 4-7 questions targeting the weakest areas. Questions should be specific and actionable, not generic. Focus on gathering quantifiable achievements, missing skills, and concrete details.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the CV text:\n\n${cvText.slice(0, 4000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const parsed = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cv-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed to generate questions" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
