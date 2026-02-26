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

    const { level, day_name, start_time, duration_min, seats_left, urgency_label, size, group_id } = await req.json();
    if (!level) throw new Error("Level is required");

    // Size dimensions
    const sizeMap: Record<string, { w: number; h: number; ratio: string }> = {
      "1x1": { w: 1080, h: 1080, ratio: "1:1 square" },
      "4x5": { w: 1080, h: 1350, ratio: "4:5 portrait" },
      "story": { w: 1080, h: 1920, ratio: "9:16 vertical story" },
    };
    const dims = sizeMap[size] || sizeMap["1x1"];

    const prompt = `Create a professional, clean, modern social media marketing image for a Korean language course.

Image specifications:
- Aspect ratio: ${dims.ratio}
- Style: Modern, clean, premium education brand
- Color scheme: White/light background with gold/yellow (#EAB308) accents and dark text
- NO text overlays - the image should be a visual background only

Visual elements to include:
- Korean cultural elements (subtle): hanbok patterns, traditional motifs, or Korean calligraphy brush strokes as decorative elements
- Modern education feel: clean geometric shapes, soft gradients
- Korean flag colors subtly incorporated
- Professional, inviting atmosphere that conveys structured learning
- Premium feel suitable for Instagram/Facebook marketing

The image should work as a background for a course announcement post about "${level}" Korean course, scheduled on ${day_name}s at ${start_time}.
Make it feel aspirational, modern, and professional. No clipart, no stock photo feel. High quality, editorial style.`;

    console.log("Generating marketing image:", { level, size, dims });

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
      throw new Error(`AI gateway returned ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error("No image generated");

    // Extract base64 and upload
    const base64Match = imageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) throw new Error("Invalid image format");

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Data = base64Match[2];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const slug = level.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const fileName = `${slug}-${size}-${Date.now()}.${ext}`;

    const { error: uploadError } = await adminClient.storage
      .from("marketing-images")
      .upload(fileName, bytes, {
        contentType: `image/${base64Match[1]}`,
        upsert: false,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: urlData } = adminClient.storage
      .from("marketing-images")
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        image_url: urlData.publicUrl,
        size,
        group_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("generate-marketing-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
