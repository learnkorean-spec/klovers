import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The illustrated icon set (public/assets/icons/*.webp).
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
  | "badge-blossom"
  | "bibimbap"
  | "books-stack"
  | "calendar-blossom"
  | "calendar-check"
  | "chat-annyeong"
  | "chat-annyeonghaseyo"
  | "diploma-scroll"
  | "flag-korea"
  | "flashcard-ga"
  | "globe-plane"
  | "growth-chart"
  | "hanok-cherry-tree"
  | "klobi-headphones"
  | "klobi-reading"
  | "lightbulb-sprout"
  | "namsan-tower"
  | "palace-blossoms"
  | "sprout"
  | "student-boy-thumbsup"
  | "student-girl-heart"
  // Disc-and-drawing set for the games (each stands on its own pastel disc):
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
  | "game-virtual-korea"
  // Drawn from the 1024px icon library (public/assets/icons/library):
  | "reward-gift";

interface KloverIconProps {
  name: KloverIconName;
  className?: string;
}

/**
 * Names whose drawing lives only in the 1024px icon library. There is no
 * 128px WebP for them, so they go through Vercel's image optimizer instead
 * (the same path BrandIcon uses). Before this map, "reward-gift" pointed at a
 * /assets/icons/reward-gift.webp that never existed and showed a broken image.
 */
const LIBRARY_FILE: Partial<Record<KloverIconName, string>> = {
  "reward-gift": "08-rewards",
};

function librarySrc(file: string, width: number) {
  const path = `/assets/icons/library/${file}.png`;
  return import.meta.env.PROD ? `/_vercel/image?url=${encodeURIComponent(path)}&w=${width}&q=75` : path;
}

const KloverIcon = ({ name, className }: KloverIconProps) => {
  const [failed, setFailed] = useState(false);
  // A missing file collapses to an empty slot rather than a broken-image glyph.
  if (failed) return <span aria-hidden="true" className={cn("inline-block shrink-0", className)} />;
  const libraryFile = LIBRARY_FILE[name];
  return (
    <img
      src={libraryFile ? librarySrc(libraryFile, 320) : `/assets/icons/${name}.webp`}
      srcSet={libraryFile ? undefined : `/assets/icons/${name}@2x.webp 2x`}
      alt=""
      aria-hidden="true"
      width={128}
      height={128}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("shrink-0 select-none object-contain", className)}
    />
  );
};

export default KloverIcon;
