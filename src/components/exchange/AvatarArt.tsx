/**
 * Language Exchange avatar art (Re's request, 4 Nov 2026; polish pass 4 Nov
 * 2026): cartoon characters, not real photos and not plain icons -- a small,
 * varied cast of original flat-vector faces (never a known character, never
 * anything romantic, per CLAUDE.md's story canon for how Klovers draws
 * people).
 *
 * Each avatar is plain inline SVG, drawn with a shared parametric face so the
 * cast stays visually consistent while still looking like different people:
 * varied skin tones, hairstyles and hair colors, a couple of boy/girl
 * presets with glasses, and -- since Klovers' audience is Arabic-speaking /
 * Egyptian -- one hijab-wearing character, drawn the same simple flat style
 * as the rest of the cast.
 *
 * Deliberately kept cartoon/illustrated, never photorealistic (confirmed with
 * Re 4 Nov 2026): this feature is a stranger-matching swipe deck, and the
 * site's own AI Room Lab generates photoreal character art for KLOVERS World
 * story scenes -- reusing that *style* here, even as new original faces,
 * would read as "real-looking photo" and bring back exactly the catfishing
 * risk choosing avatars-only was meant to prevent. The polish asked for is
 * richer linework and the real Klovers brand palette, not photorealism.
 *
 * Deliberately excluded for every avatar: a mouth/eye expression that reads
 * as flirtatious, jewelry or makeup styled as attractiveness cues, and any
 * two avatars drawn as a couple -- these are meant to read as "a person", not
 * "a dating-app photo".
 *
 * Brand palette (matches src/game/player/Cluby.tsx's canon Cluby colors and
 * the KLOVERS World2 room palette, so this feature's art sits in the same
 * family as the rest of the site instead of generic/off-brand pastel):
 *   mint   #9FDDBE (Cluby's own color)   butter #F3D46A
 *   pink   #F4B3C2                        ink    #4A2E1F (Cluby's eyes)
 *   ivory  #FFF9EC                        yellow #FFE99A / #FFFF00 (brand yellow)
 */

export type HairStyle = "short" | "buzz" | "curly" | "long" | "ponytail" | "bob" | "braids" | "hijab";

export interface FaceDef {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  /** Shirt/top color shown on the shoulders. Defaults to a muted ink tone. */
  shirt?: string;
  glasses?: boolean;
}

export interface AvatarDef {
  key: string;
  gender: "male" | "female";
  bg: string;
  face: FaceDef;
}

// Pastel tints of the Klovers brand set (mint #9FDDBE, butter #F3D46A, pink
// #F4B3C2, ivory #FFF9EC) blended toward white, plus two deeper brand accents
// for variety -- replaces the earlier arbitrary Tailwind swatches (blue-200,
// violet-200, etc.) that didn't match the site's own warm palette anywhere.
const BG_MINT_1 = "#DFF5EA";
const BG_MINT_2 = "#CDEEDF";
const BG_BUTTER_1 = "#FDEFC4";
const BG_BUTTER_2 = "#FFE99A"; // World2's own room-palette yellow
const BG_PINK_1 = "#FCE1E6";
const BG_PINK_2 = "#F6D7DE";
const BG_IVORY = "#FFF9EC"; // World2's own room-palette ivory

// Shirt colors drawn from the same brand set, kept a shade deeper than the
// matching background tint so the character reads as a distinct foreground
// shape rather than blending into the card behind it.
const SHIRT_MINT = "#7FC8A5";
const SHIRT_BUTTER = "#E3B94A";
const SHIRT_PINK = "#E598A8";
const SHIRT_INK = "#4A2E1F"; // Cluby's own eye-ink, doubles as a warm charcoal

export const EXCHANGE_AVATAR_DEFS: AvatarDef[] = [
  { key: "boy_dark_short", gender: "male", bg: BG_MINT_1, face: { skin: "#C68642", hair: "#2B1B12", hairStyle: "short", shirt: SHIRT_MINT } },
  { key: "boy_olive_curly", gender: "male", bg: BG_BUTTER_1, face: { skin: "#E0AC69", hair: "#5A3825", hairStyle: "curly", shirt: SHIRT_BUTTER } },
  { key: "boy_deep_buzz", gender: "male", bg: BG_BUTTER_2, face: { skin: "#8D5524", hair: "#1A1A1A", hairStyle: "buzz", shirt: SHIRT_INK } },
  { key: "boy_fair_short", gender: "male", bg: BG_PINK_1, face: { skin: "#F1C27D", hair: "#B8860B", hairStyle: "short", shirt: SHIRT_PINK } },
  { key: "boy_tan_glasses", gender: "male", bg: BG_MINT_2, face: { skin: "#D8A26A", hair: "#2B1B12", hairStyle: "short", glasses: true, shirt: SHIRT_MINT } },
  { key: "boy_red_curly", gender: "male", bg: BG_PINK_2, face: { skin: "#F1C27D", hair: "#B5471B", hairStyle: "curly", shirt: SHIRT_INK } },
  { key: "girl_dark_long", gender: "female", bg: BG_PINK_1, face: { skin: "#C68642", hair: "#1A1A1A", hairStyle: "long", shirt: SHIRT_PINK } },
  { key: "girl_olive_ponytail", gender: "female", bg: BG_IVORY, face: { skin: "#E0AC69", hair: "#3B2414", hairStyle: "ponytail", shirt: SHIRT_BUTTER } },
  { key: "girl_fair_bob", gender: "female", bg: BG_MINT_1, face: { skin: "#F1C27D", hair: "#D9A441", hairStyle: "bob", shirt: SHIRT_MINT } },
  { key: "girl_tan_curly", gender: "female", bg: BG_BUTTER_1, face: { skin: "#D8A26A", hair: "#5A3825", hairStyle: "curly", shirt: SHIRT_PINK } },
  { key: "girl_deep_braids", gender: "female", bg: BG_MINT_2, face: { skin: "#8D5524", hair: "#1A1A1A", hairStyle: "braids", shirt: SHIRT_INK } },
  { key: "girl_hijab_teal", gender: "female", bg: BG_MINT_1, face: { skin: "#E0AC69", hair: "#2F6F62", hairStyle: "hijab", shirt: SHIRT_MINT } },
  { key: "girl_hijab_rose", gender: "female", bg: BG_PINK_2, face: { skin: "#F1C27D", hair: "#8E3B46", hairStyle: "hijab", shirt: SHIRT_PINK } },
  { key: "girl_fair_glasses", gender: "female", bg: BG_BUTTER_2, face: { skin: "#F1C27D", hair: "#3B2414", hairStyle: "ponytail", glasses: true, shirt: SHIRT_BUTTER } },
];

/** Blend a hex color toward white by `amount` (0-1) — used for the hair-shine highlight. */
function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount);
  const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount);
  const b = Math.round((n & 255) + (255 - (n & 255)) * amount);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function Hair({ style, color }: { style: HairStyle; color: string }) {
  const shine = lighten(color, 0.3);
  switch (style) {
    case "buzz":
      return (
        <g fill={color}>
          <path d="M22,38 Q22,22 50,22 Q78,22 78,38 Z" />
          <path d="M30 30 Q50 20 70 30" stroke={shine} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "short":
      return (
        <g fill={color}>
          <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" />
          <path d="M28 24 Q50 13 72 24" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "curly":
      return (
        <g fill={color}>
          <circle cx="28" cy="30" r="9" />
          <circle cx="40" cy="22" r="10" />
          <circle cx="52" cy="20" r="10" />
          <circle cx="64" cy="22" r="10" />
          <circle cx="73" cy="32" r="9" />
          <path d="M23 40 a27 24 0 0 1 54 0 v-4 h-54 z" />
          <circle cx="40" cy="19" r="3" fill={shine} opacity="0.7" />
          <circle cx="56" cy="17" r="3" fill={shine} opacity="0.7" />
        </g>
      );
    case "long":
      return (
        <g fill={color}>
          <path d="M21 46 a29 27 0 0 1 58 0 v30 a7 7 0 0 1 -14 0 v-20 h-30 v20 a7 7 0 0 1 -14 0 z" />
          <path d="M26 42 Q50 24 74 42" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" />
          <path d="M74 32 q14 4 10 24 q-2 10 -10 8 q4 -14 -4 -26 z" />
          <path d="M28 24 Q50 13 72 24" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "bob":
      return (
        <g fill={color}>
          <path d="M20 46 a30 28 0 0 1 60 0 v14 q-6 6 -10 0 v-10 h-40 v10 q-4 6 -10 0 z" />
          <path d="M26 40 Q50 22 74 40" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </g>
      );
    case "braids":
      return (
        <g fill={color}>
          <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" />
          <rect x="18" y="38" width="7" height="30" rx="3.5" />
          <rect x="75" y="38" width="7" height="30" rx="3.5" />
          <path d="M28 24 Q50 13 72 24" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>
      );
    case "hijab":
      return (
        <g fill={color}>
          <path d="M50 10 a34 34 0 0 1 34 34 v38 a8 8 0 0 1 -8 8 h-6 v-24 a20 20 0 0 0 -40 0 v24 h-6 a8 8 0 0 1 -8 -8 v-38 a34 34 0 0 1 34 -34 z" />
          <path d="M26 42 Q50 24 74 42" stroke={shine} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45" />
        </g>
      );
    default:
      return null;
  }
}

/** One flat-vector cartoon face, centered in a 100x100 viewBox, transparent background. */
export function FaceSvg({ face, className }: { face: FaceDef; className?: string }) {
  const { skin, hair, hairStyle, glasses, shirt = "#4A2E1F" } = face;
  const hairBehind = hairStyle === "long" || hairStyle === "ponytail" || hairStyle === "braids" || hairStyle === "hijab";
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden="true">
      {hairBehind && <Hair style={hairStyle} color={hair} />}
      {/* shoulders / shirt */}
      <path d="M30 86 q20 -14 40 0 v6 h-40 z" fill={hairStyle === "hijab" ? hair : shirt} />
      {/* head, with a soft under-chin shadow for depth */}
      <circle cx="50" cy="46" r="26" fill={skin} />
      <path d="M38 62 q12 8 24 0 q-2 6 -12 6 q-10 0 -12 -6 z" fill="#000" opacity="0.06" />
      {/* ears */}
      <circle cx="24" cy="48" r="4.5" fill={skin} />
      <circle cx="76" cy="48" r="4.5" fill={skin} />
      {!hairBehind && <Hair style={hairStyle} color={hair} />}
      {/* eyebrows */}
      <path d="M36 39 q5 -3 10 0" stroke="#3B2414" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
      <path d="M54 39 q5 -3 10 0" stroke="#3B2414" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.75" />
      {/* face */}
      <circle cx="41" cy="45" r="3" fill="#2B2B2B" />
      <circle cx="59" cy="45" r="3" fill="#2B2B2B" />
      {/* blush */}
      <circle cx="33" cy="53" r="4.5" fill="#F4B3C2" opacity="0.45" />
      <circle cx="67" cy="53" r="4.5" fill="#F4B3C2" opacity="0.45" />
      <path d="M41 58 q9 7 18 0" stroke="#7A4A2B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#2B2B2B" strokeWidth="2.2" fill="none">
          <circle cx="41" cy="45" r="7" />
          <circle cx="59" cy="45" r="7" />
          <path d="M48 45 h4" />
        </g>
      )}
      {/* soft forehead highlight for a less flat, more polished finish */}
      <path d="M38 30 q12 -8 24 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.18" />
      {hairBehind && <Hair style={hairStyle} color={hair} />}
    </svg>
  );
}

export function AvatarArt({ avatarKey, className }: { avatarKey: string; className?: string }) {
  const def = EXCHANGE_AVATAR_DEFS.find((a) => a.key === avatarKey);
  if (!def) return null;
  return <FaceSvg face={def.face} className={className} />;
}
