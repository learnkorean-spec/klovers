import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { cvText, analysisResult } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const systemPrompt = `You are an expert career coach and interview preparation specialist. Based on the user's CV and analysis, generate a comprehensive set of interview questions across multiple categories. These should be the kinds of questions actually asked in real interviews for their field.

Return structured data using the provided tool.`;

    const userPrompt = `Here is the candidate's CV:
${cvText}

${analysisResult ? `CV Analysis Score: ${analysisResult.overallScore}/100\nStrengths: ${analysisResult.strengths?.join(", ")}\nAreas to improve: ${analysisResult.topFixes?.join(", ")}` : ""}

Generate 15-20 interview questions across these categories:
1. **Behavioral** (STAR format) - teamwork, leadership, conflict resolution, problem-solving
2. **Technical** - based on the skills and experience in their CV
3. **Personality/Soft Skills** - communication, adaptability, work ethic, time management
4. **Situational** - hypothetical scenarios relevant to their field
5. **Motivation** - career goals, company fit, passion

For each question, provide:
- The question itself
- Category
- Difficulty level (easy/medium/hard)
- A hint on what interviewers are looking for
- A sample strong answer outline (key points to cover)`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_interview_questions",
              description: "Return interview practice questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        question: { type: "string" },
                        category: { type: "string", enum: ["behavioral", "technical", "personality", "situational", "motivation"] },
                        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
                        hint: { type: "string", description: "What the interviewer is looking for" },
                        sampleAnswer: { type: "string", description: "Key points of a strong answer" },
                      },
                      required: ["id", "question", "category", "difficulty", "hint", "sampleAnswer"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_interview_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up your workspace usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI request failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e.message || "Failed to generate questions" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
