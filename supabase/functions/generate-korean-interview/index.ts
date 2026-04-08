import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify user from JWT
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { job_title, years_experience, industry, languages_spoken, count, session_id } = await req.json();

    if (!job_title || typeof job_title !== "string") throw new Error("job_title is required");
    const requestedCount = Math.min(Math.max(Number(count) || 2, 1), 7);

    // Find or create session
    let session;
    if (session_id) {
      const { data, error } = await supabaseAdmin
        .from("interview_training_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user.id)
        .single();
      if (error || !data) throw new Error("Session not found");
      session = data;
    } else {
      // Check for existing session with same job title
      const { data: existing } = await supabaseAdmin
        .from("interview_training_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("job_title", job_title)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        session = existing;
      } else {
        const { data: newSession, error: insertErr } = await supabaseAdmin
          .from("interview_training_sessions")
          .insert({
            user_id: user.id,
            job_title,
            years_experience: Number(years_experience) || 0,
            industry: industry || null,
            languages_spoken: languages_spoken || [],
          })
          .select("*")
          .single();
        if (insertErr) throw new Error("Failed to create session: " + insertErr.message);
        session = newSession;
      }
    }

    // Enforce quotas
    const existingQuestions = session.questions || [];
    const freeUsed = session.free_used || 0;
    const paidPurchased = session.paid_purchased || 0;
    const totalAllowed = 2 + paidPurchased; // 2 free + paid
    const totalGenerated = existingQuestions.length;

    if (totalGenerated >= totalAllowed) {
      return new Response(JSON.stringify({
        session_id: session.id,
        questions: existingQuestions,
        free_remaining: Math.max(0, 2 - freeUsed),
        paid_remaining: Math.max(0, paidPurchased - Math.max(0, totalGenerated - 2)),
        quota_reached: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toGenerate = Math.min(requestedCount, totalAllowed - totalGenerated);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const langList = (languages_spoken || []).join(", ") || "English";
    const prompt = `You are a Korean interview preparation expert. Generate exactly ${toGenerate} realistic Korean job interview question-and-answer pairs for a "${job_title}" with ${years_experience || 0} years of experience${industry ? ` in the ${industry} industry` : ""}.

The candidate speaks: ${langList}

For EACH question, return a JSON object with these exact fields:
- interviewer_question_kr: The interviewer's question in Korean (formal polite style)
- interviewer_question_en: English translation
- interviewer_question_romanization: Romanized Korean pronunciation
- model_answer_kr: A strong model answer in Korean (formal polite style, 2-3 sentences)
- model_answer_en: English translation of the answer
- model_answer_romanization: Romanized Korean pronunciation of the answer

Requirements:
- Questions should be appropriate for Korean workplace culture and interview norms
- Answers should demonstrate professionalism and relevant experience
- Use formal Korean (존댓말/합니다체)
- Make questions diverse: include self-introduction, experience, strengths, motivation, situational questions
- Do NOT repeat questions that already exist: ${existingQuestions.map((q: any) => q.interviewer_question_en).join("; ")}

Return ONLY a JSON array of objects, no other text.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} - ${errText}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let newQuestions;
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("No JSON array found in AI response");
      newQuestions = JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error("Failed to parse AI response: " + (e as Error).message);
    }

    // Add IDs and merge with existing
    const tagged = newQuestions.map((q: any, i: number) => ({
      ...q,
      id: `q_${totalGenerated + i + 1}`,
      is_free: totalGenerated + i < 2,
    }));

    const allQuestions = [...existingQuestions, ...tagged];
    const newFreeUsed = Math.min(allQuestions.length, 2);

    const { error: updateErr } = await supabaseAdmin
      .from("interview_training_sessions")
      .update({
        questions: allQuestions,
        free_used: newFreeUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    if (updateErr) throw new Error("Failed to save questions: " + updateErr.message);

    return new Response(JSON.stringify({
      session_id: session.id,
      questions: allQuestions,
      free_remaining: Math.max(0, 2 - newFreeUsed),
      paid_remaining: Math.max(0, paidPurchased - Math.max(0, allQuestions.length - 2)),
      quota_reached: false,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
