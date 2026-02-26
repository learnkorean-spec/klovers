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

    const urgencyText = urgency_label === "Last Seats" ? `Only ${seats_left} seats left!` : seats_left <= 3 ? `${seats_left} seats remaining` : "Limited Seats Available";

    const prompt = `Create a professional social media marketing image for a Korean language course with these EXACT specifications:

Image specs:
- Aspect ratio: ${dims.ratio} (${dims.w}x${dims.h} pixels)
- Background: Solid bright pure yellow (#FFFF00) as the PRIMARY background color, filling the entire image. NOT orange, NOT gold, NOT amber — pure vivid yellow like hsl(60,100%,50%).
- Style: Clean, modern, premium education brand

MUST include these TEXT elements clearly readable on the yellow background:
- Main title in large bold dark text: "${level}"
- Schedule line: "${day_name} • ${start_time}"
- Duration: "${duration_min} min per session"
- Urgency line in a dark badge or banner: "${urgencyText}"
- Small text: "Register Now"

DO NOT include any email address, website URL, or domain name on the image.

Design rules:
- Bright pure yellow (#FFFF00) background must cover at least 80% of the image
- All text must be dark (black or very dark brown) for high contrast against yellow
- Use subtle Korean cultural decorative elements (traditional patterns, brush stroke accents) as light overlays or border decorations
- Clean modern typography, bold and easy to read
- Include subtle geometric shapes or soft white/light-yellow gradient accents
- Professional Instagram/Facebook marketing quality
- Text must be centered and well-spaced
- No photos, no clipart, no stock images
- The image should look like a branded course announcement poster`;

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
