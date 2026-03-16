import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { question, userAnswer, sampleAnswer, category, difficulty } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!userAnswer?.trim()) {
      return new Response(JSON.stringify({ error: "Please write an answer before scoring." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert interview coach. Score the candidate's answer to an interview question. Be constructive, specific, and encouraging. Evaluate based on:
- Relevance and directness
- Use of concrete examples (STAR method for behavioral)
- Depth and specificity
- Communication clarity
- Professional tone

Return structured feedback using the provided tool.`;

    const userPrompt = `Interview Question: ${question}
Category: ${category}
Difficulty: ${difficulty}

Candidate's Answer:
${userAnswer}

Reference Sample Answer (for comparison):
${sampleAnswer}

Score the answer 1-10 and provide:
1. Overall score with brief justification
2. What was done well (2-3 points)
3. What could be improved (2-3 specific, actionable suggestions)
4. A rewritten/improved version of their answer that keeps their style but strengthens weak areas`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_score",
              description: "Return the interview answer score and feedback",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Score from 1-10" },
                  summary: { type: "string", description: "One sentence overall assessment" },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 things done well",
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-3 actionable improvement suggestions",
                  },
                  improvedAnswer: {
                    type: "string",
                    description: "A rewritten stronger version of their answer",
                  },
                },
                required: ["score", "summary", "strengths", "improvements", "improvedAnswer"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_score" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
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
    console.error("Score error:", e);
    return new Response(JSON.stringify({ error: e.message || "Failed to score answer" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
