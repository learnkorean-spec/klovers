import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText } = await req.json();
    if (!cvText || typeof cvText !== "string") {
      return new Response(JSON.stringify({ error: "cvText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert CV/Resume reviewer and career coach specializing in modern hiring practices for 2025-2026. Analyze the CV text provided and return a detailed JSON review.

Your analysis must cover these categories:
1. **Overall Score** (0-100)
2. **ATS Compatibility** - Is this CV likely to pass Applicant Tracking Systems?
3. **Content Quality** - Are achievements quantified? Action verbs used?
4. **Format & Structure** - Clear sections, logical flow, appropriate length?
5. **Modern Standards** - Does it follow current hiring trends?
6. **Missing Elements** - What's missing that modern recruiters expect?

Return ONLY valid JSON in this exact format:
{
  "overallScore": number,
  "summary": "2-3 sentence overall assessment",
  "categories": [
    {
      "name": "category name",
      "score": number (0-100),
      "status": "good" | "warning" | "critical",
      "feedback": "specific actionable feedback",
      "fixes": ["specific fix 1", "specific fix 2"]
    }
  ],
  "topFixes": ["most important fix 1", "most important fix 2", "most important fix 3", "most important fix 4", "most important fix 5"],
  "strengths": ["strength 1", "strength 2"],
  "modernTips": ["tip about current hiring trends 1", "tip 2", "tip 3"]
}

Categories to evaluate:
- ATS Compatibility
- Professional Summary
- Work Experience
- Skills & Keywords
- Education & Certifications
- Contact Information
- Formatting & Layout
- Achievement Quantification`;

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
          { role: "user", content: `Please analyze this CV/Resume:\n\n${cvText.slice(0, 8000)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const analysis = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Analysis failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
