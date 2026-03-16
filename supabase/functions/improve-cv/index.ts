import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText, previousAnalysis, answers } = await req.json();
    if (!cvText || !answers) {
      return new Response(JSON.stringify({ error: "cvText and answers are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const answersText = Object.entries(answers)
      .filter(([_, v]) => (v as string).trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n\n");

    const systemPrompt = `You are an expert CV/Resume reviewer. The user previously had their CV analyzed and scored ${previousAnalysis?.overallScore || "unknown"}/100. They have now provided additional information to improve their CV.

Re-analyze the CV incorporating the new information. The new score should reflect how much better the CV would be WITH the additional details included. Be generous where the user has provided strong, quantifiable answers.

Previous weak areas: ${JSON.stringify(previousAnalysis?.topFixes || [])}

Additional information provided by the user:
${answersText}

Return ONLY valid JSON in this exact format:
{
  "overallScore": number,
  "summary": "2-3 sentence assessment highlighting improvements",
  "categories": [
    {
      "name": "category name",
      "score": number (0-100),
      "status": "good" | "warning" | "critical",
      "feedback": "specific feedback noting improvements",
      "fixes": ["remaining fix 1"]
    }
  ],
  "topFixes": ["remaining important fixes"],
  "strengths": ["strength 1", "strength 2"],
  "modernTips": ["tip 1", "tip 2"],
  "improvements": ["what improved from the additional info"]
}

Categories: ATS Compatibility, Professional Summary, Work Experience, Skills & Keywords, Education & Certifications, Contact Information, Formatting & Layout, Achievement Quantification`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Original CV:\n\n${cvText.slice(0, 8000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
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

    const analysis = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("improve-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
