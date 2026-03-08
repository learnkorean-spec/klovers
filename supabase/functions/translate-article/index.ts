import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { slug } = await req.json();
    if (!slug) throw new Error("slug is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the English article
    const { data: post, error: fetchErr } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("lang", "en")
      .single();

    if (fetchErr || !post) throw new Error("Article not found: " + (fetchErr?.message || slug));

    // Check if Arabic version already exists
    const arSlug = `${slug}-ar`;
    const { data: existing } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", arSlug)
      .maybeSingle();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Translate using AI
    const prompt = `You are a professional Arabic translator specializing in Korean language education content. Translate the following blog article from English to Arabic (Modern Standard Arabic). 

IMPORTANT RULES:
- Translate ALL text naturally into Arabic
- Keep Korean words/phrases in their original form (한글, 안녕하세요, etc.)
- Keep markdown formatting intact (##, **, -, links, etc.)
- Keep any URLs unchanged
- Make the Arabic text flow naturally, not word-for-word translation
- Use appropriate Arabic punctuation

Translate each field separately and return a JSON object with these keys:
- title (string)
- description (string) 
- content (string - full markdown)
- hero_alt (string)
- hero_caption (string)
- hero_alt_2 (string, can be empty)
- hero_caption_2 (string, can be empty)
- cta_text (string)
- keywords (array of Arabic keyword strings)

Here is the article to translate:

TITLE: ${post.title}
DESCRIPTION: ${post.description}
HERO_ALT: ${post.hero_alt || ""}
HERO_CAPTION: ${post.hero_caption || ""}
HERO_ALT_2: ${post.hero_alt_2 || ""}
HERO_CAPTION_2: ${post.hero_caption_2 || ""}
CTA_TEXT: ${post.cta_text || ""}
KEYWORDS: ${(post.keywords || []).join(", ")}

CONTENT:
${post.content}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} - ${errText}`);
    }

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from the response
    let translated;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      translated = JSON.parse(jsonMatch[0]);
    } catch (e) {
      throw new Error("Failed to parse AI translation response: " + e.message);
    }

    const arPost = {
      title: translated.title || post.title,
      slug: arSlug,
      description: translated.description || post.description,
      keywords: translated.keywords || post.keywords,
      article_type: post.article_type,
      hero_image: post.hero_image,
      hero_alt: translated.hero_alt || post.hero_alt,
      hero_caption: translated.hero_caption || post.hero_caption,
      hero_image_2: post.hero_image_2,
      hero_alt_2: translated.hero_alt_2 || post.hero_alt_2,
      hero_caption_2: translated.hero_caption_2 || post.hero_caption_2,
      cta_text: translated.cta_text || post.cta_text,
      cta_url: post.cta_url,
      content: translated.content || post.content,
      author: post.author,
      lang: "ar",
      published: post.published,
      published_at: post.published_at,
      seo_score: post.seo_score,
    };

    let result;
    if (existing) {
      // Update existing Arabic version
      const { data, error } = await supabase
        .from("blog_posts")
        .update(arPost)
        .eq("id", existing.id)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new Arabic version
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(arPost)
        .select("id, slug")
        .single();
      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify({ success: true, slug: arSlug, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
