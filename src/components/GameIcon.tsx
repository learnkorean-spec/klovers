import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One flat illustration per game, each on the same brand-Yellow disc with a
 * Charcoal ring — the look of the games concept board. They replace the
 * emoji that used to stand in for a game: emoji draw differently on every
 * phone and share nothing with the rest of the illustrated set
 * (KloverIcon). Drawn as inline SVG so they are crisp at any size, add no
 * requests, and inherit nothing from the OS.
 *
 * Palette is deliberately small: Charcoal line, white and one accent each.
 * Keyed by GAMES_CATALOG id; an unknown id falls back to a star so a new
 * game never renders an empty disc.
 */
const C = "#2E2E2E"; // Charcoal
const W = "#FFFFFF";
const G = "#34A874"; // green
const B = "#4B7BE5"; // blue
const O = "#F0784E"; // coral
const P = "#7B5CD6"; // purple

const line = { stroke: C, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" } as const;

const GLYPHS: Record<string, ReactNode> = {
  match: (
    <>
      <g transform="rotate(-10 20 24)"><rect x="12" y="15" width="14" height="19" rx="2.5" fill={W} {...line} /></g>
      <g transform="rotate(10 28 24)"><rect x="22" y="14" width="14" height="19" rx="2.5" fill={G} {...line} /></g>
      <path d="M29 26.5c-2.6-1.6-3.6-3-2.4-4.2 1-.9 2.1-.4 2.4.5.3-.9 1.4-1.4 2.4-.5 1.2 1.2.2 2.6-2.4 4.2z" fill={W} />
    </>
  ),
  hangul: (
    <>
      <rect x="12" y="12" width="24" height="24" rx="5" fill={W} {...line} />
      <path d="M17 18.5h8c0 4.5-1 8-3.5 11M30 16.5v15M30 24h4" fill="none" {...line} strokeWidth={2.4} />
    </>
  ),
  sentence: (
    <path d="M13 17H21a3.2 3.2 0 0 1 6.4 0H35V25a3.2 3.2 0 0 0 0 6.4V36H13Z" fill={G} {...line} />
  ),
  numbers: (
    <text x="24" y="30" textAnchor="middle" fontSize="15" fontWeight="800" fill={C} fontFamily="Poppins, system-ui, sans-serif">123</text>
  ),
  colors: (
    <>
      <path d="M24 12c9.5 0 14 6.5 12.6 13-1 4.8-5.6 2.2-6.4 6.2C29 36.4 20 37 15 32.5 9.5 27.5 13 12 24 12Z" fill={W} {...line} />
      <circle cx="19" cy="20" r="2.4" fill={O} />
      <circle cx="25.5" cy="17.5" r="2.4" fill={B} />
      <circle cx="31" cy="22" r="2.4" fill={G} />
      <circle cx="21.5" cy="28.5" r="2.4" fill="#FFFF00" stroke={C} strokeWidth="1.4" />
    </>
  ),
  verbs: (
    <>
      <rect x="12" y="12" width="17" height="24" rx="2.5" fill={W} {...line} />
      <path d="M16 19h9M16 24h9M16 29h6" fill="none" {...line} strokeWidth={1.8} />
      <g transform="rotate(38 33 26)">
        <rect x="30.5" y="14" width="5" height="17" rx="1" fill={O} {...line} strokeWidth={1.8} />
        <path d="M30.5 31h5l-2.5 5z" fill={W} {...line} strokeWidth={1.8} />
      </g>
    </>
  ),
  greetings: (
    <>
      <path d="M15 14h18a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H25l-6 5v-5h-4a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3Z" fill={W} {...line} />
      <circle cx="20" cy="21" r="1.4" fill={C} />
      <circle cx="28" cy="21" r="1.4" fill={C} />
      <path d="M19.5 25.2q4.5 3.6 9 0" fill="none" {...line} strokeWidth={1.8} />
    </>
  ),
  opposites: (
    <>
      <path d="M12 19h22M28 13l6 6-6 6" fill="none" stroke={B} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 31H14M20 25l-6 6 6 6" fill="none" stroke={O} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  fillblank: (
    <>
      <rect x="11" y="17" width="16" height="10" rx="2.5" fill={W} stroke={C} strokeWidth="1.8" strokeDasharray="3 2.4" />
      <path d="M11 33h17" fill="none" {...line} />
      <g transform="rotate(40 33 24)">
        <rect x="30.5" y="12" width="5" height="17" rx="1" fill={O} {...line} strokeWidth={1.8} />
        <path d="M30.5 29h5l-2.5 5z" fill={W} {...line} strokeWidth={1.8} />
      </g>
    </>
  ),
  scramble: (
    <>
      <path d="M11 18h6c6 0 8 12 14 12h4M31 26l4 4-4 4" fill="none" stroke={B} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 30h6c6 0 8-12 14-12h4M31 14l4 4-4 4" fill="none" stroke={G} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  counters: (
    <>
      <rect x="12" y="13" width="24" height="22" rx="3" fill={W} {...line} />
      <path d="M12 21h24M12 28h24" fill="none" stroke={C} strokeWidth="1.4" />
      <circle cx="18" cy="17" r="2.3" fill={O} />
      <circle cx="24" cy="17" r="2.3" fill={O} />
      <circle cx="21" cy="24.5" r="2.3" fill={B} />
      <circle cx="29" cy="24.5" r="2.3" fill={B} />
      <circle cx="18" cy="31.5" r="2.3" fill={G} />
      <circle cx="26" cy="31.5" r="2.3" fill={G} />
    </>
  ),
  kdrama: (
    <>
      <rect x="12" y="22" width="24" height="14" rx="2.5" fill={P} {...line} />
      <g transform="rotate(-12 12 21)">
        <rect x="12" y="14" width="24" height="6.5" rx="1.5" fill={C} />
        <path d="M17 14l-3 6.5M23 14l-3 6.5M29 14l-3 6.5M35 14l-3 6.5" stroke={W} strokeWidth="2" fill="none" />
      </g>
      <path d="M24 33c-3.4-2-4.6-3.7-3.1-5.2 1.3-1.1 2.7-.5 3.1.7.4-1.2 1.8-1.8 3.1-.7 1.5 1.5.3 3.2-3.1 5.2z" fill={W} />
    </>
  ),
  time: (
    <>
      <circle cx="24" cy="24" r="12" fill={W} {...line} />
      <path d="M24 24v-7M24 24l5 3" fill="none" {...line} strokeWidth={2.4} />
      <circle cx="24" cy="24" r="1.4" fill={O} />
    </>
  ),
  typekorean: (
    <>
      <rect x="10" y="16" width="28" height="17" rx="3.5" fill={W} {...line} />
      <path d="M15 21h2M20 21h2M25 21h2M30 21h3M15 25.5h2M20 25.5h2M25 25.5h2M30 25.5h3M18 29.5h12" fill="none" {...line} strokeWidth={2} />
    </>
  ),
  romanization: (
    <>
      <text x="24" y="29" textAnchor="middle" fontSize="17" fontWeight="800" fill={C} fontFamily="Poppins, system-ui, sans-serif">Aa</text>
      <path d="M15 33h18" stroke={O} strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  flashcard: (
    <>
      <rect x="16" y="12" width="20" height="20" rx="3" fill={G} {...line} />
      <rect x="12" y="17" width="20" height="20" rx="3" fill={W} {...line} />
      <path d="M17 23.5h7c0 4-1 6.5-3 9M27 22v12M27 28h3" fill="none" {...line} strokeWidth={2} />
    </>
  ),
  speedread: (
    <path d="M27.5 11 15.5 26H23l-2.5 11L33 21h-7.5Z" fill={O} {...line} />
  ),
  readingchoice: (
    <path d="M17 12v23l5.5-5 4 8 3.6-1.7-4-7.8H33Z" fill={W} {...line} />
  ),
  sentenceread: (
    <>
      <path d="M24 17c-4-3-9-3-12-2v19c3-1 8-1 12 2 4-3 9-3 12-2V15c-3-1-8-1-12 2Z" fill={W} {...line} />
      <path d="M24 17v19M16 21h5M16 26h5M27 21h5M27 26h5" fill="none" {...line} strokeWidth={1.6} />
    </>
  ),
  phonics: (
    <>
      <path d="M14 28v-4a10 10 0 0 1 20 0v4" fill="none" {...line} strokeWidth={3} />
      <rect x="11.5" y="26" width="7" height="11" rx="3.2" fill={G} {...line} />
      <rect x="29.5" y="26" width="7" height="11" rx="3.2" fill={G} {...line} />
    </>
  ),
  conversation: (
    <>
      <path d="M22 13h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-2v4l-4.5-4H22a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill={G} {...line} />
      <path d="M12 21h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-6l-5 4v-4h-3a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z" fill={W} {...line} />
      <circle cx="15" cy="28" r="1.3" fill={C} />
      <circle cx="19.5" cy="28" r="1.3" fill={C} />
      <circle cx="24" cy="28" r="1.3" fill={C} />
    </>
  ),
  storygap: (
    <>
      <rect x="14" y="12" width="22" height="25" rx="2.5" fill={W} {...line} />
      <path d="M14 18h-2.5M14 24h-2.5M14 30h-2.5" fill="none" {...line} />
      <path d="M19 19h12M19 24h5" fill="none" {...line} strokeWidth={1.8} />
      <rect x="25.5" y="21.5" width="7" height="5" rx="1.5" fill="none" stroke={C} strokeWidth="1.5" strokeDasharray="2.4 2" />
      <path d="M19 30h12" fill="none" {...line} strokeWidth={1.8} />
    </>
  ),
};

const FALLBACK = (
  <path d="m24 12 3.6 7.6 8.4 1.1-6.1 5.8 1.5 8.3L24 30.7l-7.4 4.1 1.5-8.3L12 20.7l8.4-1.1Z" fill={W} {...line} />
);

const GameIcon = ({ id, className }: { id: string; className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    aria-hidden="true"
    focusable="false"
    className={cn("shrink-0 select-none", className)}
  >
    <circle cx="24" cy="24" r="22.5" fill="#FFFF00" stroke={C} strokeWidth="2" />
    {GLYPHS[id] ?? FALLBACK}
  </svg>
);

export default GameIcon;
