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
import { AI_CHAT_URL, AI_TEXT_MODEL, getAiKey } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const META_API_BASE = "https://api.meta.ai/v1";
const MUSE_IMAGE_MODEL = "muse-image-1.0";
const MUSE_SPARK_MODEL = "muse-spark-1.3";

// Per docs/KLOVERS-STORY-BIBLE.md "Visual style" (and the 5 Oct 2026 standing
// rule retiring flat/illustrated character art sitewide): humans are
// photorealistic, Cluby is a realistic-cute 3D plush with a specific look,
// environments are soft painterly Korean storybook — never flat/isometric
// cartoon.
//
// Fidelity fix (1 Nov 2026): relying on the reference images alone was not
// enough — generated output drifted (Adam/Lina's outfits changed, and Cluby
// came back as a generic yellow teddy bear instead of the canon mint-green
// plush). Muse Image's edit endpoint doesn't guarantee pixel-level identity
// preservation from reference images on its own, so this prompt now ALSO
// spells out each character's distinguishing features in text, as a
// redundant anchor alongside the reference images — the two reference
// images are explicitly labelled (reference image 1 vs. 2) so the model
// doesn't conflate or guess which description applies to which image.
const CHARACTER_DESCRIPTIONS =
  "Reference image 1 shows Adam and Lina, two real people — match their real " +
  "faces, skin, and hair exactly. Adam wears a bright yellow blazer, cream " +
  "trousers, and white sneakers. Lina wears an ivory-and-yellow floral " +
  "hanbok-style dress. Keep these exact outfits unless the room theme " +
  "requires a specific activity outfit change. " +
  "Reference image 2 shows Cluby — match it exactly, it is NOT a generic " +
  "teddy bear or plush toy: Cluby is a mint-green furry creature with a " +
  "round head, two short butter-yellow horns, pointed ears with pink inner " +
  "ear, warm dark-brown eyes, soft rosy cheeks, two tiny visible fangs, and " +
  "a short mint tail with small spikes, wearing an ivory mini hanbok top, a " +
  "bright KLOVERS-yellow wrap skirt, and a small green four-leaf-clover " +
  "emblem on the chest. Cluby's body and fur must stay mint green at all " +
  "times — never beige, tan, or yellow-brown like an ordinary teddy bear.";

const KLOVERS_STYLE =
  "The room/environment: soft, warm, premium Korean-storybook atmosphere and " +
  "lighting, clean and uncluttered. Klovers palette: ivory #FFF9EC, bright yellow " +
  "#FFFF00, charcoal #2E2E2E accents. The PEOPLE (Adam and Lina) must stay fully " +
  "photorealistic — real human skin texture, real hair, real fabric, exactly like " +
  "actual photographed people, not illustrated, not painted, not cartoon, not " +
  "anime, not an isometric icon. Cluby stays a realistic-cute 3D plush creature " +
  "exactly like its reference image, not flattened into 2D art, and never redrawn " +
  "as a different species, color, or toy. No text or labels in the image.";

// Canonical character reference images, served from the live site, passed to
// Muse Image's edit endpoint so generated scenes use Reham's actual
// characters instead of inventing new ones.
const CHARACTER_REFS = {
  // Adam (male learner) + Lina (female learner) together, photoreal, canon reference.
  learners: "https://kloversegy.com/assets/cluby/learners-reference.webp",
  // Cluby, canon reference (realistic-cute plush, mint green, yellow horns, ivory/yellow hanbok).
  cluby: "https://kloversegy.com/assets/cluby/cluby-wave.webp",
};

type Variant = { label: "A" | "B"; angle: string };

const VARIANTS: Variant[] = [
  { label: "A", angle: "a warm, cozy, lamp-lit version of the scene" },
  { label: "B", angle: "a bright, airy, daylight version of the scene with more open space" },
];

// --- Book Cover Batch mode -------------------------------------------------
//
// A second entry point into the same generator: instead of one theme -> two
// 3D-room-design variants, this takes a LIST of themes and renders each as a
// single clean, text-free portrait photo meant to sit behind a book title
// (trial guide, Hangul A0, conversation-cafe books, etc). Reuses the exact
// same character-fidelity machinery (reference images + CHARACTER_DESCRIPTIONS
// + KLOVERS_STYLE) so cover photos stay visually consistent with the room
// concepts and with the site's existing character art.
//
// Per Re's standing request (2 Nov 2026): book-cover ideas should keep
// introducing NEW supporting people into the conversations/scenes, not just
// recycle Adam + Lina every time, so each batch item can carry an optional
// `extraCharacter` describing a new, original side character (a vendor, a
// teacher, a fellow student, ...). These new people are NOT drawn from any
// reference image (none exists yet) — Muse Image invents them fresh per the
// instruction below, consistently "a different-looking Korean person" per
// the KLOVERS World canon goal that every background person looks distinct
// and Korean. They are new ORIGINAL characters, not a change to Adam, Lina,
// or Cluby's canon relationships/origin/responsibilities.
const COVER_STYLE =
  "This image is a BOOK COVER photo, not a 3D room design reference. It must " +
  "be completely free of text: no letters, numbers, words, captions, labels, " +
  "signage, logos, watermarks, subtitles, or writing of any kind anywhere in " +
  "the image, on any surface, sign, book, or screen. Clean portrait photo " +
  "composition, subject centered with soft, uncluttered empty margin at the " +
  "very top and very bottom of the frame so a title can be overlaid " +
  "afterward by a designer. Shallow depth of field, soft bokeh background.";

function newCharacterInstruction(extraCharacter: string): string {
  return (
    `Also include, naturally part of the scene, ONE new original supporting ` +
    `character who is NOT Adam, Lina, or Cluby and must not resemble them: ` +
    `${extraCharacter}. Give this new person their own distinct Korean face, ` +
    `hairstyle, and outfit, clearly different from Adam and Lina and from any ` +
    `other person already in the scene — per KLOVERS World's standing rule ` +
    `that every background person looks different and Korean. This is a new ` +
    `side character for the scene, not a replacement for Adam, Lina, or Cluby.`
  );
}

interface BatchItem {
  theme: string;
  extraCharacter?: string;
}

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

async function generateConceptImage(
  prompt: string,
  apiKey: string,
  useCharacters: boolean,
  size: string = "1536x1024",
  // When true (and useCharacters is false), reference ONLY Cluby's canon
  // plush image — no Adam/Lina learner refs. Used for marketing art that
  // wants Cluby's exact design (never a generic/invented teddy or bunny)
  // alongside brand-new, non-canon people. Re's standing rule, 10 Nov 2026:
  // any plush/mascot prop in generated art must be Cluby, not a lookalike.
  clubyOnly = false,
): Promise<string> {
  const referencingCharacters = useCharacters || clubyOnly;
  const endpoint = referencingCharacters ? "images/edits" : "images/generations";
  const body: Record<string, unknown> = {
    model: MUSE_IMAGE_MODEL,
    prompt,
    n: 1,
    size,
    response_format: "b64_json",
    output_format: "png",
  };
  if (useCharacters) {
    body.images = [
      { image_url: CHARACTER_REFS.learners },
      { image_url: CHARACTER_REFS.cluby },
    ];
  } else if (clubyOnly) {
    body.images = [{ image_url: CHARACTER_REFS.cluby }];
  }

  const res = await fetch(`${META_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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

interface CoverResult {
  theme: string;
  extraCharacter?: string;
  imageDataUrl: string;
  designBrief: DesignBrief;
  score: number;
  passed: boolean;
  attempts: number;
  issues: string[];
}

interface CoverScore {
  score: number;
  issues: string[];
}

// Minimum score (out of 100) a cover must reach before it's handed back as
// usable — Re's standing requirement (2 Nov 2026): "must pass 99 points of
// 100 to rate covers". Scored by a vision-capable model (OpenAI gpt-4o-mini,
// the same provider the rest of Klovers uses for text/image per
// _shared/ai.ts) looking at the actual rendered image, not just the prompt —
// Muse Spark is text-only and can't see what Muse Image actually drew.
const PASS_SCORE = 99;
const MAX_ATTEMPTS = 3;

async function scoreCoverImage(
  imageDataUrl: string,
  theme: string,
  extraCharacter: string | undefined,
  openAiKey: string,
): Promise<CoverScore> {
  const rubric =
    "You are a strict art director grading a KLOVERS book-cover photo out of " +
    "100. KLOVERS is a Korean-learning brand for Arabic speakers; humans must " +
    "be photorealistic (never illustrated/cartoon/anime), Cluby (if present) " +
    "must be a mint-green furry creature with yellow horns and an ivory/yellow " +
    "hanbok outfit (never a generic teddy bear or any other color). " +
    "AUTOMATIC FAIL (score must be 30 or below) if the image contains ANY " +
    "visible text, letters, numbers, words, captions, labels, signage, logos, " +
    "watermarks, or writing of any kind, anywhere in the image, on any " +
    "surface, sign, book, or screen. Otherwise score based on: character " +
    "photorealism and fidelity, clean uncluttered premium Korean-storybook " +
    "composition, portrait framing with usable empty margin at top and bottom " +
    "for a title to be overlaid later, warm ivory/yellow/charcoal KLOVERS " +
    "palette, and whether the scene matches the requested theme. " +
    `Theme: "${theme}".` +
    (extraCharacter
      ? ` It should include a new supporting character: "${extraCharacter}".`
      : "") +
    ' Respond with ONLY a JSON object: {"score": <0-100 integer>, "issues": ' +
    '[<short strings, empty array if none>]}. No markdown, no prose.';

  const res = await fetch(AI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_TEXT_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: rubric },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cover scoring error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Cover scoring returned no content");

  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    const parsed = JSON.parse(cleaned) as { score: number; issues?: string[] };
    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 10) : [],
    };
  } catch {
    throw new Error(`Cover scoring returned non-JSON content: ${cleaned.slice(0, 200)}`);
  }
}

async function generateBookCover(
  item: BatchItem,
  apiKey: string,
  openAiKey: string,
  useCharacters: boolean,
): Promise<CoverResult> {
  const theme = item.theme.trim().slice(0, 500);
  const extraCharacter = item.extraCharacter?.trim().slice(0, 300);

  // Design brief is informational only (vocab/props/palette for whoever
  // builds the title/layout around the cover) and isn't affected by a
  // regenerate, so it's only fetched once, not re-fetched per attempt.
  const designBriefPromise = generateDesignBrief(
    theme,
    "a clean title-free book-cover portrait",
    apiKey,
  );

  let best: { imageDataUrl: string; score: number; issues: string[] } | null = null;
  let avoidNote = "";
  let attemptsUsed = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    attemptsUsed = attempt;
    const imagePrompt = useCharacters
      ? `Photo-edit the exact same real people and creature from the reference ` +
        `images into a new book-cover scene — do not redraw or restyle them, ` +
        `keep their real faces, real hair, real skin, real outfits, and Cluby's ` +
        `exact plush look pixel-faithful to the references: ${theme}. Place them ` +
        `naturally in the scene, doing something related to the theme. ` +
        `${CHARACTER_DESCRIPTIONS} ${extraCharacter ? newCharacterInstruction(extraCharacter) + " " : ""}` +
        `${KLOVERS_STYLE} ${COVER_STYLE}${avoidNote}`
      : `A Korean-language-learning book cover scene: ${theme}. ` +
        `${extraCharacter ? newCharacterInstruction(extraCharacter) + " " : ""}` +
        `${KLOVERS_STYLE} ${COVER_STYLE}${avoidNote}`;

    const imageDataUrl = await generateConceptImage(imagePrompt, apiKey, useCharacters, "1024x1536");
    const { score, issues } = await scoreCoverImage(imageDataUrl, theme, extraCharacter, openAiKey);

    if (!best || score > best.score) best = { imageDataUrl, score, issues };
    if (score >= PASS_SCORE) break;

    if (attempt < MAX_ATTEMPTS && issues.length > 0) {
      avoidNote = ` IMPORTANT — fix these problems from the previous attempt: ${issues.join("; ")}.`;
    }
  }

  const designBrief = await designBriefPromise;
  return {
    theme,
    extraCharacter,
    imageDataUrl: best!.imageDataUrl,
    designBrief,
    score: best!.score,
    passed: best!.score >= PASS_SCORE,
    attempts: attemptsUsed,
    issues: best!.issues,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const metaApiKey = getMetaApiKey();
    if (!metaApiKey) throw new Error("META_MODEL_API_KEY not configured");
    const openAiKey = getAiKey();

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

    const body = await req.json();
    const useCharacters = body.useCharacters !== false; // default true
    const clubyOnly = body.clubyOnly === true && !useCharacters; // default false

    // Batch mode: body.batch is a list of { theme, extraCharacter? } and the
    // response is a list of single book-cover images (one per theme), not
    // the two-variant room-design flow below. Used by the "Generate all book
    // covers" button so a whole set of cover ideas can be produced in one
    // request instead of one admin click per theme.
    if (Array.isArray(body.batch)) {
      if (!openAiKey) throw new Error("OPENAI_API_KEY not configured (needed to score covers)");

      const items: BatchItem[] = body.batch
        .filter((it: unknown): it is BatchItem =>
          !!it && typeof (it as BatchItem).theme === "string" && (it as BatchItem).theme.trim().length > 0
        )
        // Re's standing cap (2 Nov 2026): 5 covers per batch, not 10+ — each
        // one can now take up to MAX_ATTEMPTS generate+score round trips to
        // clear the 99/100 bar, so a bigger batch risks the edge function's
        // own execution time limit.
        .slice(0, 5);
      if (items.length === 0) throw new Error("batch must contain at least one { theme } item");

      console.log(`Generating ${items.length} book-cover images, useCharacters:`, useCharacters);

      const covers: CoverResult[] = [];
      // Sequential on purpose (see generateBookCover) — a batch run in
      // parallel would hammer the Meta Model API's rate limit, and each item
      // already retries internally against the 99/100 score bar.
      for (const item of items) {
        covers.push(await generateBookCover(item, metaApiKey, openAiKey, useCharacters));
      }

      return new Response(JSON.stringify({ covers, passScore: PASS_SCORE }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt } = body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      throw new Error("prompt is required");
    }
    const theme = prompt.trim().slice(0, 500);

    console.log(
      "Generating AI room concepts for theme:",
      theme,
      "useCharacters:",
      useCharacters,
      "clubyOnly:",
      clubyOnly,
    );

    const results = await Promise.all(
      VARIANTS.map(async (variant) => {
        const imagePrompt = useCharacters
          ? `Photo-edit the exact same real people and creature from the reference images into a new setting — do not redraw or restyle them, keep their real faces, real hair, real skin, real outfits, and Cluby's exact plush look pixel-faithful to the references, as if they were composited/photographed into a new room: ${theme}. ${variant.angle}. Place them naturally in the room, doing something related to the room's theme. ${CHARACTER_DESCRIPTIONS} ${KLOVERS_STYLE}`
          : clubyOnly
          ? `Generate brand-new, original people (never the specific people in the reference image) in a photorealistic scene: ${theme}. ${variant.angle}. Include the exact plush creature from the reference image, pixel-faithful to its design (same colors, ears, face, proportions) — do not redraw, restyle, or invent a different teddy bear, bunny, or plush; it must be recognizably this same character. ${KLOVERS_STYLE}`
          : `A Korean-language-learning room scene: ${theme}. ${variant.angle}. ${KLOVERS_STYLE}`;

        const [imageDataUrl, designBrief] = await Promise.all([
          generateConceptImage(imagePrompt, metaApiKey, useCharacters, "1536x1024", clubyOnly),
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
