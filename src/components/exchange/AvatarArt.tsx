/**
 * Language Exchange avatar art (Re's request, 4 Nov 2026): cartoon
 * characters, not real photos and not plain icons -- a small, varied cast of
 * original flat-vector faces (never a known character, never anything
 * romantic, per CLAUDE.md's story canon for how Klovers draws people).
 *
 * Each avatar is plain inline SVG, drawn with a shared parametric face so the
 * cast stays visually consistent while still looking like different people:
 * varied skin tones, hairstyles and hair colors, a couple of boy/girl
 * presets with glasses, and -- since Klovers' audience is Arabic-speaking /
 * Egyptian -- one hijab-wearing character, drawn the same simple flat style
 * as the rest of the cast.
 *
 * Deliberately excluded for every avatar: a mouth/eye expression that reads
 * as flirtatious, jewelry or makeup styled as attractiveness cues, and any
 * two avatars drawn as a couple -- these are meant to read as "a person", not
 * "a dating-app photo".
 */

export type HairStyle = "short" | "buzz" | "curly" | "long" | "ponytail" | "bob" | "braids" | "hijab";

export interface FaceDef {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  glasses?: boolean;
}

export interface AvatarDef {
  key: string;
  gender: "male" | "female";
  bg: string;
  face: FaceDef;
}

export const EXCHANGE_AVATAR_DEFS: AvatarDef[] = [
  { key: "boy_dark_short", gender: "male", bg: "#BFDBFE", face: { skin: "#C68642", hair: "#2B1B12", hairStyle: "short" } },
  { key: "boy_olive_curly", gender: "male", bg: "#A7F3D0", face: { skin: "#E0AC69", hair: "#5A3825", hairStyle: "curly" } },
  { key: "boy_deep_buzz", gender: "male", bg: "#FDE68A", face: { skin: "#8D5524", hair: "#1A1A1A", hairStyle: "buzz" } },
  { key: "boy_fair_short", gender: "male", bg: "#DDD6FE", face: { skin: "#F1C27D", hair: "#B8860B", hairStyle: "short" } },
  { key: "boy_tan_glasses", gender: "male", bg: "#99F6E4", face: { skin: "#D8A26A", hair: "#2B1B12", hairStyle: "short", glasses: true } },
  { key: "boy_red_curly", gender: "male", bg: "#FECACA", face: { skin: "#F1C27D", hair: "#B5471B", hairStyle: "curly" } },
  { key: "girl_dark_long", gender: "female", bg: "#FBCFE8", face: { skin: "#C68642", hair: "#1A1A1A", hairStyle: "long" } },
  { key: "girl_olive_ponytail", gender: "female", bg: "#E9D5FF", face: { skin: "#E0AC69", hair: "#3B2414", hairStyle: "ponytail" } },
  { key: "girl_fair_bob", gender: "female", bg: "#C7D2FE", face: { skin: "#F1C27D", hair: "#D9A441", hairStyle: "bob" } },
  { key: "girl_tan_curly", gender: "female", bg: "#FDBA74", face: { skin: "#D8A26A", hair: "#5A3825", hairStyle: "curly" } },
  { key: "girl_deep_braids", gender: "female", bg: "#93C5FD", face: { skin: "#8D5524", hair: "#1A1A1A", hairStyle: "braids" } },
  { key: "girl_hijab_teal", gender: "female", bg: "#5EEAD4", face: { skin: "#E0AC69", hair: "#2F6F62", hairStyle: "hijab" } },
  { key: "girl_hijab_rose", gender: "female", bg: "#FDA4AF", face: { skin: "#F1C27D", hair: "#8E3B46", hairStyle: "hijab" } },
  { key: "girl_fair_glasses", gender: "female", bg: "#D9F99D", face: { skin: "#F1C27D", hair: "#3B2414", hairStyle: "ponytail", glasses: true } },
];

function Hair({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case "buzz":
      return <path d="M22,38 Q22,22 50,22 Q78,22 78,38 Z" fill={color} />;
    case "short":
      return <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" fill={color} />;
    case "curly":
      return (
        <g fill={color}>
          <circle cx="28" cy="30" r="9" />
          <circle cx="40" cy="22" r="10" />
          <circle cx="52" cy="20" r="10" />
          <circle cx="64" cy="22" r="10" />
          <circle cx="73" cy="32" r="9" />
          <path d="M23 40 a27 24 0 0 1 54 0 v-4 h-54 z" />
        </g>
      );
    case "long":
      return (
        <g fill={color}>
          <path d="M21 46 a29 27 0 0 1 58 0 v30 a7 7 0 0 1 -14 0 v-20 h-30 v20 a7 7 0 0 1 -14 0 z" />
        </g>
      );
    case "ponytail":
      return (
        <g fill={color}>
          <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" />
          <path d="M74 32 q14 4 10 24 q-2 10 -10 8 q4 -14 -4 -26 z" />
        </g>
      );
    case "bob":
      return (
        <g fill={color}>
          <path d="M20 46 a30 28 0 0 1 60 0 v14 q-6 6 -10 0 v-10 h-40 v10 q-4 6 -10 0 z" />
        </g>
      );
    case "braids":
      return (
        <g fill={color}>
          <path d="M20,39 Q20,10 50,10 Q80,10 80,39 Z" />
          <rect x="18" y="38" width="7" height="30" rx="3.5" />
          <rect x="75" y="38" width="7" height="30" rx="3.5" />
        </g>
      );
    case "hijab":
      return (
        <path
          d="M50 10 a34 34 0 0 1 34 34 v38 a8 8 0 0 1 -8 8 h-6 v-24 a20 20 0 0 0 -40 0 v24 h-6 a8 8 0 0 1 -8 -8 v-38 a34 34 0 0 1 34 -34 z"
          fill={color}
        />
      );
    default:
      return null;
  }
}

/** One flat-vector cartoon face, centered in a 100x100 viewBox, transparent background. */
export function FaceSvg({ face, className }: { face: FaceDef; className?: string }) {
  const { skin, hair, hairStyle, glasses } = face;
  const hairBehind = hairStyle === "long" || hairStyle === "ponytail" || hairStyle === "braids" || hairStyle === "hijab";
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden="true">
      {hairBehind && <Hair style={hairStyle} color={hair} />}
      {/* shoulders */}
      <path d="M30 86 q20 -14 40 0 v6 h-40 z" fill={hairStyle === "hijab" ? face.hair : skin} />
      {/* head */}
      <circle cx="50" cy="46" r="26" fill={skin} />
      {/* ears */}
      <circle cx="24" cy="48" r="4.5" fill={skin} />
      <circle cx="76" cy="48" r="4.5" fill={skin} />
      {!hairBehind && <Hair style={hairStyle} color={hair} />}
      {/* face */}
      <circle cx="41" cy="45" r="3" fill="#2B2B2B" />
      <circle cx="59" cy="45" r="3" fill="#2B2B2B" />
      <path d="M41 58 q9 7 18 0" stroke="#7A4A2B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {glasses && (
        <g stroke="#2B2B2B" strokeWidth="2.2" fill="none">
          <circle cx="41" cy="45" r="7" />
          <circle cx="59" cy="45" r="7" />
          <path d="M48 45 h4" />
        </g>
      )}
      {hairBehind && <Hair style={hairStyle} color={hair} />}
    </svg>
  );
}

export function AvatarArt({ avatarKey, className }: { avatarKey: string; className?: string }) {
  const def = EXCHANGE_AVATAR_DEFS.find((a) => a.key === avatarKey);
  if (!def) return null;
  return <FaceSvg face={def.face} className={className} />;
}
