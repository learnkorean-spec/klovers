import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText, jobTitle, jobDescription, improvementAnswers, analysisResult } = await req.json();
    if (!cvText || !jobTitle) {
      return new Response(JSON.stringify({ error: "cvText and jobTitle are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert CV/Resume writer and ATS optimization specialist. 

The user has an existing CV and wants to apply for a specific job. Your tasks:

1. Calculate a MATCH PERCENTAGE (0-100) showing how well the current CV matches the target job
2. Identify GAPS between the CV and job requirements
3. Generate a FULLY REWRITTEN, job-tailored version of the CV that would score close to 100% match

The tailored CV should:
- Reorganize and rewrite bullet points to highlight relevant experience
- Add relevant keywords from the job description naturally
- Adjust the professional summary to target the specific role
- Reorder sections to prioritize the most relevant qualifications
- Use strong action verbs and quantified achievements
- Be ATS-friendly with proper formatting
- Keep it truthful — enhance presentation of existing skills, don't fabricate experience

Return ONLY valid JSON in this exact format:
{
  "matchPercentage": number (0-100),
  "gaps": ["gap 1", "gap 2", ...],
  "suggestions": ["suggestion to improve match 1", ...],
  "tailoredCV": {
    "personalInfo": {
      "fullName": "...",
      "title": "tailored professional title",
      "email": "...",
      "phone": "...",
      "location": "...",
      "summary": "rewritten professional summary targeting the job",
      "linkedin": "...",
      "website": "..."
    },
    "experience": [
      {
        "company": "...",
        "position": "...",
        "startDate": "...",
        "endDate": "...",
        "current": boolean,
        "description": "rewritten bullets targeting the job"
      }
    ],
    "education": [
      {
        "institution": "...",
        "degree": "...",
        "field": "...",
        "startDate": "...",
        "endDate": "...",
        "description": "..."
      }
    ],
    "skills": ["skill1", "skill2", ...],
    "certifications": [
      {
        "name": "...",
        "issuer": "...",
        "date": "..."
      }
    ]
  }
}`;

    let answersSection = "";
    if (improvementAnswers && Object.keys(improvementAnswers).length > 0) {
      const answersText = Object.entries(improvementAnswers)
        .filter(([_, v]) => (v as string).trim())
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      answersSection = `\n\nAdditional information the user provided to strengthen their CV:\n${answersText}`;
    }

    let analysisSection = "";
    if (analysisResult) {
      analysisSection = `\n\nPrevious CV analysis score: ${analysisResult.overallScore}/100`;
      if (analysisResult.strengths?.length) analysisSection += `\nStrengths: ${analysisResult.strengths.join(", ")}`;
      if (analysisResult.topFixes?.length) analysisSection += `\nAreas to fix: ${analysisResult.topFixes.join(", ")}`;
    }

    const userMessage = `Here is my current CV:\n\n${cvText.slice(0, 8000)}\n\nTarget Job Title: ${jobTitle}\n${jobDescription ? `Job Description:\n${jobDescription}` : ""}${answersSection}${analysisSection}\n\nIMPORTANT: Incorporate ALL the additional information provided above into the tailored CV. The tailored CV should reflect these improvements and the match percentage should account for the enhanced CV with this extra info included.`;

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
          { role: "user", content: userMessage },
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

    const parsed = JSON.parse(jsonStr.trim());

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tailor-cv error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
