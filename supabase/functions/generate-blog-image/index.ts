import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized: admin only");

    const { title, description, article_type, keywords } = await req.json();
    if (!title) throw new Error("Title is required");

    // Build an SEO-optimized image prompt
    const keywordStr = (keywords || []).slice(0, 5).join(", ");
    const typeHint: Record<string, string> = {
      howto: "step-by-step tutorial style",
      listicle: "clean infographic style",
      longform: "editorial magazine style",
      news: "journalistic news style",
      review: "product comparison style",
    };
    const style = typeHint[article_type] || "professional editorial style";

    const prompt = `Create a 1920x1080 pixel, photorealistic hero blog image for an article titled "${title}". ${
      description ? `The article is about: ${description}.` : ""
    } ${keywordStr ? `Related topics: ${keywordStr}.` : ""} Style: ${style}. Requirements: vibrant colors, sharp detail, high contrast, no text or watermarks, suitable as a blog hero banner. Theme: Korean language learning, K-culture, and education. The image must be visually striking and professional enough for social media sharing.`;

    console.log("Generating image with prompt:", prompt);

    // Call Lovable AI image generation
    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway returned ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image generated");

    // Extract base64 data and upload to storage
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image format");

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Data = base64Match[2];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const fileName = `hero-${slug}-${Date.now()}.${ext}`;

    const { error: uploadError } = await adminClient.storage
      .from("blog-images")
      .upload(fileName, bytes, {
        contentType: `image/${base64Match[1]}`,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = adminClient.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    // Generate SEO alt text
    const altText = `${title} - ${description || "Korean language learning"}`.slice(0, 125);

    return new Response(
      JSON.stringify({
        hero_image: urlData.publicUrl,
        hero_alt: altText,
        hero_caption: description
          ? description.slice(0, 100)
          : `${title} | K-Lovers Blog`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-blog-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
