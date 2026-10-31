// KLOVERS AI Room Lab — generates two candidate learning-room concepts
// (concept image + structured design brief) from a short text prompt, so an
// admin can A/B two new 3D room designs before a developer builds either one
// into KLOVERS World.
//
// This is the Meta Global AI Developer Hackathon build: it calls Meta's
// Model API directly (Muse Image for the concept art, Muse Spark for the
// structured room brief) rather than the OpenAI path the rest of Klovers
// uses for blog/marketing images (see _shared/ai.ts).
//
// Admin-only. Does not touch the live learner-facing World — it is a design
// tool that proposes rooms for a human to review and build, not a story
// feature that changes what a learner experiences.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_BASE = "https://api.meta.ai/v1";
const MUSE_IMAGE_MODEL = "muse-image-1.0";
const MUSE_SPARK_MODEL = "muse-spark-1.3";

const KLOVERS_STYLE =
  "Clean lines, Klovers palette only — ivory #FFF9EC background, bright yellow " +
  "#FFFF00 and charcoal #2E2E2E accents, isometric 3D perspective, cute cartoon " +
  "Korean-styled characters, educational illustration style, no text labels.";

type Variant = { label: "A" | "B"; angle: string };

const VARIANTS: Variant[] = [
  { label: "A", angle: "a warm, cozy, lamp-lit version of the scene" },
  { label: "B", angle: "a bright, airy, daylight version of the scene with more open space" },
];

interface DesignBrief {
  roomName: string;
  vocabularyFocus: string[];
  keyProps: string[];
  colorPalette: string[];
  learnerAction: string;
}

function getMetaApiKey(): string | undefined {
  return Deno.env.get("META_MODEL_API_KEY");
}

async function generateConceptImage(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${META_API_BASE}/images/generations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MUSE_IMAGE_MODEL,
      prompt,
      n: 1,
      size: "1536x1024",
      response_format: "b64_json",
      output_format: "png",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Muse Image error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Muse Image returned no image");
  return `data:image/png;base64,${b64}`;
}

async function generateDesignBrief(
  theme: string,
  angle: string,
  apiKey: string,
): Promise<DesignBrief> {
  const systemPrompt =
    "You design rooms for KLOVERS, a 3D Korean-language learning game for Arabic-speaking " +
    "learners. Given a room theme, respond with ONLY a single JSON object (no markdown, no " +
    "prose) with exactly these keys: " +
    '"roomName" (short English name), ' +
    '"vocabularyFocus" (4-8 Korean vocabulary words in context, each as "한국어 (meaning)"), ' +
    '"keyProps" (4-8 short strings naming physical objects/furniture to model), ' +
    '"colorPalette" (3-5 hex colors, must stay close to ivory #FFF9EC, yellow #FFFF00, ' +
    'charcoal #2E2E2E), ' +
    '"learnerAction" (one sentence describing what the learner practices in this room).';

  const userPrompt = `Room theme: ${theme}\nArt direction for this variant: ${angle}`;

  const res = await fetch(`${META_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MUSE_SPARK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Muse Spark error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Muse Spark returned no content");

  // Muse Spark is asked for raw JSON but models sometimes wrap it in a
  // ```json fence anyway — strip that defensively before parsing.
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(cleaned) as DesignBrief;
  } catch {
    throw new Error(`Muse Spark returned non-JSON content: ${cleaned.slice(0, 200)}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const metaApiKey = getMetaApiKey();
    if (!metaApiKey) throw new Error("META_MODEL_API_KEY not configured");

    // Admin-only, same check as the other AI generator functions.
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader || "" } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) throw new Error("Unauthorized: admin only");

    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("prompt is required");
    }
    const theme = prompt.trim().slice(0, 500);

    console.log("Generating AI room concepts for theme:", theme);

    const results = await Promise.all(
      VARIANTS.map(async (variant) => {
        const imagePrompt =
          `Isometric illustration of a Korean-language-learning room scene: ${theme}. ${variant.angle}. ${KLOVERS_STYLE}`;

        const [imageDataUrl, designBrief] = await Promise.all([
          generateConceptImage(imagePrompt, metaApiKey),
          generateDesignBrief(theme, variant.angle, metaApiKey),
        ]);

        return { label: variant.label, imageDataUrl, designBrief };
      }),
    );

    return new Response(JSON.stringify({ theme, variants: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ai-room-concept error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
