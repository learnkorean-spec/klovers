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
import { AI_CHAT_URL, getAiKey } from "../_shared/ai.ts";

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

interface VocabWord {
  korean: string;
  english: string;
  picture: string;
}

/** Muse Spark: `count` concrete, picturable Korean words for a topic. */
async function generateVocabWords(topic: string, count: number, apiKey: string): Promise<VocabWord[]> {
  const systemPrompt =
    "You write vocabulary sheets for KLOVERS, a Korean course for Arabic-speaking learners. " +
    "Given a topic and a number N, respond with ONLY a JSON array (no markdown, no prose) of " +
    "exactly N objects with keys: " +
    '"korean" (the everyday Korean word as Koreans actually say it, Hangul only, 1-3 words), ' +
    '"english" (short lowercase English meaning, 1-3 words), ' +
    '"picture" (one short English description of a SINGLE concrete physical object that shows the ' +
    'word clearly when painted alone, e.g. "an open spiral notebook with a pencil on it"). ' +
    "Only concrete, drawable nouns a learner would use for this topic; no abstract ideas, no people, " +
    "no duplicates, no two items that would look alike.";
  const res = await fetch(`${META_API_BASE}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MUSE_SPARK_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Topic: ${topic}\nN: ${count}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Muse Spark error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Muse Spark returned no content");
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Muse Spark returned non-JSON content: ${cleaned.slice(0, 200)}`);
  }
  const list = Array.isArray(parsed) ? parsed : [];
  return list
    .map((w) => ({
      korean: String((w as VocabWord).korean ?? "").trim(),
      english: String((w as VocabWord).english ?? "").trim(),
      picture: String((w as VocabWord).picture ?? "").trim(),
    }))
    .filter((w) => w.korean && w.english && w.picture)
    .slice(0, count);
}

/**
 * One vocabulary icon in the KLOVERS "Everyday Korean" sheet style (the
 * Valentine's and beauty sheets Re shared, 12 Nov 2026): a single object,
 * detailed realistic watercolor, soft natural colour, centred on a plain warm
 * off-white ground with room around it, a faint shadow, no text at all.
 */
function vocabIconPrompt(picture: string): string {
  return (
    `A single ${picture}, centred, painted as a detailed, realistic watercolor illustration: ` +
    "soft natural colours, delicate wet-on-wet washes with crisp fine details and gentle " +
    "highlights, visible watercolor paper grain, warm soft light from the upper left, and a " +
    "faint soft shadow beneath the object. Isolated on a plain, even, warm off-white background " +
    "(#FAF6EC) with generous empty space on every side; the object fills about 70 percent of " +
    "the frame. Only this one object: no other objects, no people, no hands, no table or " +
    "scenery, no border or frame, and absolutely no text, letters, numbers, labels or logos " +
    "anywhere. Square 1:1 composition."
  );
}

/**
 * Style 2 (Re, 12 Nov 2026, sharing a Seollal room and a bank waiting room):
 * one isometric cutaway room, painted in watercolor, whose objects get big
 * Korean/English callouts laid over it on the page. The image itself must
 * carry no text; the labels are drawn on the canvas, larger than the
 * originals ("writing in my picture is so small").
 */
function roomScenePrompt(setting: string, objects: string[]): string {
  return (
    `An isometric cutaway illustration of ${setting}, shown as a single cube-shaped room ` +
    "diorama seen from above at a 30 degree isometric angle: two back walls and the floor, " +
    "the front walls removed, with thick pale grey cut wall edges outlining a hexagon. " +
    "Painted as a detailed, delicate watercolor illustration: soft washes, fine ink-free " +
    "details, gentle light from a window, warm cream walls, a soft butter-yellow wooden floor, " +
    "sage green and warm wood accents. The room clearly contains each of these, each one " +
    `large, fully visible and well separated from the others: ${objects.join("; ")}. ` +
    "The room is centred and fills about 85 percent of a square frame, on a plain, even, warm " +
    "off-white background (#FBF8F0) outside the room. No people, no animals, and absolutely no " +
    "text, letters, numbers, labels, signs or logos anywhere. Square 1:1 composition."
  );
}

/**
 * One question about one or more images. The OpenAI key has been invalid in
 * production (401 on 12 Nov 2026, the reason Style 2's first dots were only
 * placeholders), so this tries Muse Spark on the Meta account first, then
 * Amazon Nova (Pro, then Lite) on Bedrock, then OpenAI gpt-4o, and only
 * fails if all of them do.
 */
async function askVision(
  prompt: string,
  images: string[],
  metaApiKey: string,
  openAiKey: string | undefined,
): Promise<{ text: string; provider: string }> {
  const errors: string[] = [];
  const openAiStyle = (model: string) => ({
    model,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.map((url) => ({ type: "image_url", image_url: { url } })),
        ],
      },
    ],
  });
  try {
    const res = await fetch(`${META_API_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${metaApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(openAiStyle(MUSE_SPARK_MODEL)),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    const text = (await res.json())?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.includes("{")) return { text, provider: "muse-spark" };
    throw new Error("no JSON in reply");
  } catch (e) {
    errors.push(`Muse Spark: ${String((e as Error)?.message ?? e)}`);
  }
  const ak = Deno.env.get("AWS_ACCESS_KEY_ID");
  const sk = Deno.env.get("AWS_SECRET_ACCESS_KEY");
  const region = Deno.env.get("AWS_REGION");
  if (ak && sk && region) {
    const { BedrockRuntimeClient, ConverseCommand } = await import("npm:@aws-sdk/client-bedrock-runtime@3");
    const client = new BedrockRuntimeClient({ region, credentials: { accessKeyId: ak, secretAccessKey: sk } });
    const imageBlocks = images.map((url) => {
      const [head, b64] = url.split(",");
      // Typed as the literal union Bedrock's ImageBlock expects; as a plain
      // `string` the block matched no ContentBlock member and failed deno check.
      const format: "png" | "jpeg" = /png/.test(head) ? "png" : "jpeg";
      return { image: { format, source: { bytes: Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0)) } } };
    });
    for (const modelId of ["amazon.nova-pro-v1:0", "amazon.nova-lite-v1:0"]) {
      try {
        const res = await client.send(
          new ConverseCommand({
            modelId,
            messages: [{ role: "user", content: [...imageBlocks, { text: prompt }] }],
            inferenceConfig: { temperature: 0 },
          }),
        );
        // deno-lint-ignore no-explicit-any
        const text = res.output?.message?.content?.find((b: any) => typeof b.text === "string")?.text;
        if (text && text.includes("{")) return { text, provider: modelId };
        throw new Error("no JSON in reply");
      } catch (e) {
        errors.push(`${modelId}: ${String((e as Error)?.message ?? e).slice(0, 200)}`);
      }
    }
  }
  if (openAiKey) {
    try {
      const res = await fetch(AI_CHAT_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${openAiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(openAiStyle("gpt-4o")),
      });
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
      const text = (await res.json())?.choices?.[0]?.message?.content ?? "";
      if (text.includes("{")) return { text, provider: "gpt-4o" };
      throw new Error("no JSON in reply");
    } catch (e) {
      errors.push(`OpenAI: ${String((e as Error)?.message ?? e)}`);
    }
  }
  throw new Error(`No vision model could read the picture. ${errors.join(" | ")}`);
}

/**
 * Points at each object in the painted room. The page sends a copy of the
 * picture with a lettered 12 x 12 grid drawn over it (columns A-L, rows
 * 1-12); naming a grid square is far more reliable for a vision model than
 * guessing raw coordinates (the first live test put the refrigerator's dot on
 * the microwave). Returns each object's square centre as 0-1 fractions.
 */
const GRID_N = 12;
async function locateRoomObjects(
  cleanImageDataUrl: string,
  gridImageDataUrl: string,
  objects: string[],
  metaApiKey: string,
  openAiKey: string | undefined,
): Promise<({ x: number; y: number } | null)[]> {
  const ask =
    "You get two copies of the same isometric room illustration: the first is clean, the " +
    "second has a grid over it (columns A to L from left to right, rows 1 to 12 from top to " +
    "bottom, each square labelled in its corner). For EACH object in the list below, work " +
    "separately: first look at the clean picture and say in a few words where that exact " +
    "object is (e.g. 'bottom left, on the floor in front of the table'), then use the grid " +
    "copy to name the ONE square that contains the middle of that object. Never give two " +
    "different objects the same square unless they really overlap. If an object is not in " +
    "the picture, use null for its square.\n" +
    'Respond with ONLY a JSON object of the form {"items": [{"n": 1, "object": "<name>", ' +
    '"where": "<few words>", "square": "C7"}, ...]} with one item per object, in the same ' +
    "order and with the same numbers as the list.\n" +
    objects.map((o, i) => `${i + 1}. ${o}`).join("\n");
  const { text: content } = await askVision(ask, [cleanImageDataUrl, gridImageDataUrl], metaApiKey, openAiKey);
  const json = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1) || "{}";
  const items: { n?: number; square?: string | null }[] = JSON.parse(json)?.items ?? [];
  return objects.map((_, i) => {
    const it = items.find((x) => Number(x?.n) === i + 1) ?? items[i];
    const m = /^([A-La-l])\s*(\d{1,2})$/.exec(String(it?.square ?? "").trim());
    if (!m) return null;
    const col = m[1].toUpperCase().charCodeAt(0) - 65;
    const row = Number(m[2]) - 1;
    if (row < 0 || row >= GRID_N) return null;
    return { x: (col + 0.5) / GRID_N, y: (row + 0.5) / GRID_N };
  });
}

/**
 * Book watercolor pictures (Re, 12 Nov 2026): her fixed style brief, applied
 * to every prompt she pastes. Each image is a 2 x 2 grid of four separate
 * illustrations with white gutters, so the page can crop the cells apart.
 */
const BOOK_GRID_STYLE =
  "Create ONE square image divided into a clean 2-column by 2-row grid of 4 equal square " +
  "cells, with a thin pure-white gutter/margin separating every cell so each one can be " +
  "cropped out individually later. No grid lines, no numbers, no labels, no text anywhere in " +
  "the image. Each cell is its own centered watercolor illustration on a pure white " +
  "background, soft pastel palette, loose gentle watercolor brush texture with visible paper " +
  "grain, no hard black outlines, warm soft lighting from the upper left, a faint light-gray " +
  "watercolor shadow under each object, matching a children's Korean-language-learning " +
  "picture book. High resolution, square 1:1 overall image.";

function bookGridPrompt(prompt: string): string {
  return `${BOOK_GRID_STYLE}\n\nThe four cells (top-left, top-right, bottom-left, bottom-right): ${prompt}`;
}

/**
 * Style 10, "make it like my picture" (Re, 13 Nov 2026: "make that i can
 * upload a picture and add a prompt to create similar style picture"). The
 * uploaded picture is a STYLE reference only: a vision model first writes
 * down its art style (never its subject), then Muse Image paints Re's prompt
 * with the picture attached as a reference plus those style notes. If Meta
 * won't take the picture inline it is put in the public marketing-images
 * bucket and passed by URL; if editing fails altogether the notes alone
 * drive a plain generation, so a picture still comes back.
 */
async function describeStyle(imageDataUrl: string, metaApiKey: string, openAiKey: string | undefined): Promise<string> {
  const ask =
    "Describe ONLY the visual art style of this picture so an illustrator could paint a " +
    "completely different subject in exactly the same style. Cover: medium and technique " +
    "(e.g. watercolor, 3D render, flat vector, photo), line work and outlines, colour palette " +
    "(name the main colours), lighting and shadows, texture, level of detail, proportions of " +
    "any characters (e.g. chibi, big eyes), background treatment and framing. Do NOT describe " +
    'what the picture shows. Reply as JSON: {"style": "<one dense paragraph, max 120 words>"}';
  const { text } = await askVision(ask, [imageDataUrl], metaApiKey, openAiKey);
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  const style = String(JSON.parse(json)?.style ?? "").trim();
  if (!style) throw new Error("no style description");
  return style.slice(0, 900);
}

async function museImage(endpoint: "images/edits" | "images/generations", body: Record<string, unknown>, apiKey: string): Promise<string> {
  const res = await fetch(`${META_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MUSE_IMAGE_MODEL, n: 1, response_format: "b64_json", output_format: "png", ...body }),
  });
  if (!res.ok) throw new Error(`Muse Image error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const b64 = (await res.json())?.data?.[0]?.b64_json;
  if (!b64) throw new Error("Muse Image returned no image");
  return `data:image/png;base64,${b64}`;
}

function styleCopyPrompt(prompt: string, style: string, withReference: boolean): string {
  return (
    (withReference
      ? "Use the attached image ONLY as a style reference: match its art style, technique, colour " +
        "palette, lighting, texture and level of detail exactly, but do NOT copy its subject, " +
        "characters, objects or layout. "
      : "") +
    `Create a new picture of: ${prompt}.` +
    (style ? ` Art style to match: ${style}` : "") +
    " No text, letters, numbers, watermarks or logos unless the request asks for them."
  );
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
// 100 to rate covers". Scored by a vision model looking at the actual rendered
// image, not just the prompt. Since 13 Nov 2026 this goes through askVision
// (Muse Spark, then Amazon Nova, then OpenAI), because the OpenAI key alone
// was returning 401 and every cover batch failed.
const PASS_SCORE = 99;
const MAX_ATTEMPTS = 3;

async function scoreCoverImage(
  imageDataUrl: string,
  theme: string,
  extraCharacter: string | undefined,
  metaApiKey: string,
  openAiKey: string | undefined,
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

  const { text: content } = await askVision(rubric, [imageDataUrl], metaApiKey, openAiKey);
  const cleaned = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
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
  openAiKey: string | undefined,
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
    const { score, issues } = await scoreCoverImage(imageDataUrl, theme, extraCharacter, apiKey, openAiKey);

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

    // Watercolor vocabulary sheets (Re, 12 Nov 2026: "write for example 16
    // pictures about studying, they must give me similar pictures to this
    // style"). Two small modes, called by the Watercolor Vocabulary Sheet
    // panel on /admin/ai-room-lab. The page asks for the word list first so
    // Re can edit it, then requests ONE icon per call (a few in parallel),
    // so no single call runs long, and lays the sheet out itself.
    if (body.mode === "vocab-words") {
      const topic = String(body.topic ?? "").trim().slice(0, 200);
      const count = Math.min(16, Math.max(4, Number(body.count) || 9));
      if (!topic) throw new Error("topic is required");
      const words = await generateVocabWords(topic, count, metaApiKey);
      return new Response(JSON.stringify({ topic, words }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.mode === "vocab-icon") {
      const picture = String(body.picture ?? "").trim().slice(0, 300);
      if (!picture) throw new Error("picture is required");
      const imageDataUrl = await generateConceptImage(vocabIconPrompt(picture), metaApiKey, false, "1024x1024");
      return new Response(JSON.stringify({ imageDataUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "style-copy") {
      const prompt = String(body.prompt ?? "").trim().slice(0, 1500);
      const ref = String(body.referenceImage ?? "");
      const size = ["1024x1024", "1024x1536", "1536x1024"].includes(String(body.size)) ? String(body.size) : "1024x1024";
      if (!prompt) throw new Error("prompt is required");
      if (!/^data:image\/(png|jpe?g|webp);base64,/.test(ref)) throw new Error("upload a PNG, JPG or WebP picture");
      if (ref.length > 8_000_000) throw new Error("picture is too large; use one under about 5 MB");

      let style = "";
      try {
        style = await describeStyle(ref, metaApiKey, openAiKey);
      } catch (e) {
        console.warn("style-copy: describeStyle failed", e);
      }
      const notes: string[] = [];
      let imageDataUrl = "";
      try {
        imageDataUrl = await museImage("images/edits", { prompt: styleCopyPrompt(prompt, style, true), size, images: [{ image_url: ref }] }, metaApiKey);
        notes.push("reference picture attached");
      } catch (inlineErr) {
        notes.push(`inline reference refused (${String((inlineErr as Error).message).slice(0, 120)})`);
        try {
          const [head, b64] = ref.split(",");
          const ext = /png/.test(head) ? "png" : /webp/.test(head) ? "webp" : "jpg";
          const bytes = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
          const path = `ai-room-lab/style-refs/${crypto.randomUUID()}.${ext}`;
          const up = await adminClient.storage.from("marketing-images").upload(path, bytes, { contentType: head.slice(5, head.indexOf(";")) });
          if (up.error) throw up.error;
          const url = adminClient.storage.from("marketing-images").getPublicUrl(path).data.publicUrl;
          imageDataUrl = await museImage("images/edits", { prompt: styleCopyPrompt(prompt, style, true), size, images: [{ image_url: url }] }, metaApiKey);
          notes.push("reference picture attached by URL");
        } catch (urlErr) {
          notes.push(`reference by URL failed (${String((urlErr as Error).message).slice(0, 120)})`);
          if (!style) throw new Error(`Couldn't use the picture as a reference: ${notes.join("; ")}`);
          imageDataUrl = await museImage("images/generations", { prompt: styleCopyPrompt(prompt, style, false), size }, metaApiKey);
          notes.push("painted from the style notes only");
        }
      }
      return new Response(JSON.stringify({ imageDataUrl, style, notes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.mode === "book-grid") {
      const prompt = String(body.prompt ?? "").trim().slice(0, 2000);
      if (!prompt) throw new Error("prompt is required");
      const imageDataUrl = await generateConceptImage(bookGridPrompt(prompt), metaApiKey, false, "1024x1024");
      return new Response(JSON.stringify({ imageDataUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.mode === "room-scene") {
      const setting = String(body.setting ?? "").trim().slice(0, 300);
      const objects = (Array.isArray(body.objects) ? body.objects : [])
        .map((o: unknown) => String(o ?? "").trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 10);
      if (!setting || !objects.length) throw new Error("setting and objects are required");
      const imageDataUrl = await generateConceptImage(roomScenePrompt(setting, objects), metaApiKey, false, "1024x1024");
      return new Response(JSON.stringify({ imageDataUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.mode === "room-locate") {
      const cleanUrl = String(body.cleanImageDataUrl ?? "");
      const gridUrl = String(body.imageDataUrl ?? "");
      const objects = (Array.isArray(body.objects) ? body.objects : []).map((o: unknown) => String(o ?? "").slice(0, 120)).slice(0, 10);
      if (!gridUrl.startsWith("data:image/") || !objects.length) throw new Error("imageDataUrl and objects are required");
      const points = await locateRoomObjects(cleanUrl.startsWith("data:image/") ? cleanUrl : gridUrl, gridUrl, objects, metaApiKey, openAiKey);
      return new Response(JSON.stringify({ points }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch mode: body.batch is a list of { theme, extraCharacter? } and the
    // response is a list of single book-cover images (one per theme), not
    // the two-variant room-design flow below. Used by the "Generate all book
    // covers" button so a whole set of cover ideas can be produced in one
    // request instead of one admin click per theme.
    if (Array.isArray(body.batch)) {

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
