import { cn } from "@/lib/utils";

/**
 * The illustrated icon set (public/assets/icons/*.webp).
 *
 * ONLY THE `game-*` DRAWINGS ARE LISTED HERE. The rest of the set (dashboard
 * icons: klobi-reading, badge-blossom, ...) lands with the illustrated-icons PR;
 * when it does, add its names to this union - the component needs no change.
 *
 * Each icon ships at 128px and 256px (@2x) as transparent WebP, ~8-18 KB each,
 * so a card row of them does not move LCP. They are decorative — the card's own
 * title carries the meaning — so alt is empty and the image is aria-hidden.
 *
 * MOBILE: `shrink-0` is in the base class so a flex row can never squash the
 * drawing on a 360px screen. Give every call site a responsive size where it
 * sits beside text (e.g. `h-12 w-12 sm:h-14 sm:w-14`), and hide big
 * decorative ones below `sm` rather than shrinking them under ~40px.
 *
 * ON BACKGROUNDS: the drawings carry their own dark outline and are meant to
 * stand on Ivory, Mint or white. On brand Yellow they lose their edge (the
 * outfits are a warmer yellow than #FFFF00), so on a yellow surface put them on
 * an Ivory tile — see the palette rule in 2026-09-20-palette-decisions.
 */
export type KloverIconName =
  | "game-chat-smile"
  | "game-checklist-pencil"
  | "game-crown"
  | "game-flashcard-han"
  | "game-flashcards-love"
  | "game-hanbok"
  | "game-hangeul-spelling"
  | "game-hanok-cloud"
  | "game-headphones-music"
  | "game-hello-bubble"
  | "game-klobi-han"
  | "game-klobi-thumbsup"
  | "game-korea-map"
  | "game-lucky-bag"
  | "game-map-tower"
  | "game-particle-puzzle"
  | "game-subway"
  | "game-time-dates"
  | "game-topik-sheet"
  | "game-virtual-korea";

interface KloverIconProps {
  name: KloverIconName;
  className?: string;
}

const KloverIcon = ({ name, className }: KloverIconProps) => (
  <img
    src={`/assets/icons/${name}.webp`}
    srcSet={`/assets/icons/${name}@2x.webp 2x`}
    alt=""
    aria-hidden="true"
    width={128}
    height={128}
    loading="lazy"
    decoding="async"
    draggable={false}
    className={cn("shrink-0 select-none object-contain", className)}
  />
);

export default KloverIcon;
