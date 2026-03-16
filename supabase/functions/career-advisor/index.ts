import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText, analysisResult, goal } = await req.json();
    if (!cvText || !goal) {
      return new Response(JSON.stringify({ error: "cvText and goal are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const skillsSummary = analysisResult?.categories
      ?.map((c: any) => `${c.name}: ${c.feedback}`)
      .join("\n") || "No analysis available";

    const systemPrompt = goal === "job"
      ? `You are an expert international career advisor. Based on the user's CV and skills, provide personalized advice about:
1. The top 5 best countries where they can find a job matching their skills (with reasons)
2. The best job search platforms and websites for each country
3. Key steps they must take (visa, certifications, language, networking)
4. Tips on improving their CV/LinkedIn for international job markets
5. Advice on checking their career "path" — are they on the right track? What should they learn next?

IMPORTANT: All searchUrls MUST be real, fully working URLs that the user can click and visit. Use actual job search URLs with proper query parameters (e.g. https://www.linkedin.com/jobs/search/?keywords=software+engineer&location=Germany). Never use placeholder or made-up URLs.

Return ONLY valid JSON in this exact format:
{
  "pathAdvice": "A paragraph about their career path assessment and what they should focus on",
  "topCountries": [
    {
      "country": "Country Name",
      "flag": "🇬🇧",
      "reason": "Why this country is great for them",
      "avgSalary": "Estimated salary range in USD",
      "searchPlatforms": ["LinkedIn", "Indeed"],
      "searchUrls": ["https://www.linkedin.com/jobs/search/?keywords=developer&location=United%20Kingdom", "https://uk.indeed.com/jobs?q=developer"],
      "visaInfo": "Brief visa/work permit info"
    }
  ],
  "actionSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "skillsToLearn": ["Skill 1", "Skill 2", "Skill 3"],
  "decisions": [
    {
      "question": "Should you move abroad for work?",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "verdict": "A balanced recommendation"
    }
  ]
}`
      : `You are an expert travel and digital nomad advisor. Based on the user's CV and skills, provide personalized advice about:
1. The top 5 best countries for them to travel/live as a digital nomad or remote worker
2. Cost of living, visa options, and quality of life
3. How they can work remotely or find freelance opportunities while traveling
4. Tips on their career "path" while traveling — staying relevant and growing skills
5. Key decisions they should consider before traveling

IMPORTANT: All searchUrls MUST be real, fully working URLs that the user can click and visit. Use actual platform URLs (e.g. https://remoteok.com/remote-jobs, https://www.upwork.com). Never use placeholder or made-up URLs.

Return ONLY valid JSON in this exact format:
{
  "pathAdvice": "A paragraph about balancing travel with career growth",
  "topCountries": [
    {
      "country": "Country Name",
      "flag": "🇹🇭",
      "reason": "Why this country is ideal for them",
      "costOfLiving": "Estimated monthly cost in USD",
      "searchPlatforms": ["Remote OK", "We Work Remotely"],
      "searchUrls": ["https://remoteok.com/remote-jobs", "https://weworkremotely.com/remote-jobs"],
      "visaInfo": "Digital nomad visa or tourist visa info"
    }
  ],
  "actionSteps": ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"],
  "skillsToLearn": ["Skill 1", "Skill 2", "Skill 3"],
  "decisions": [
    {
      "question": "Should you become a digital nomad?",
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"],
      "verdict": "A balanced recommendation"
    }
  ]
}`;

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
          { role: "user", content: `Here is the CV:\n\n${cvText.slice(0, 4000)}\n\nSkills analysis:\n${skillsSummary}` },
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
    console.error("career-advisor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed to generate advice" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
