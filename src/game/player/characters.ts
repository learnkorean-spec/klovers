import { KLOVERS_WORLD } from "@/config/klovers-world";
import { PALETTE } from "../config/world";

/**
 * The two playable learners, dressed from the canon
 * (KLOVERS_WORLD.characters.maleLearner / femaleLearner). Friends and study
 * companions — the learner picks which one to walk as.
 *
 * Skin and hair are the only colours outside the brand palette: they are the
 * characters' natural colouring, fixed by the canon (wavy dark-brown hair for
 * Adam, long wavy auburn-copper hair for Lina; neither Korean nor Asian).
 */
export type AvatarId = "adam" | "lina";

export interface AvatarLook {
  id: AvatarId;
  name: { en: string; ar: string };
  skin: string;
  hair: string;
  hairStyle: "short-wavy" | "long-wavy";
  /** Torso layer (Adam: blazer; Lina: hanbok-inspired wrap top). */
  top: string;
  sleeves: string;
  /** Visible under the top at the chest (Adam's tee), if any. */
  inner?: string;
  /** Lower body: trousers (legs) or a midi skirt over the legs. */
  lower: { kind: "trousers"; color: string } | { kind: "skirt"; color: string; embroidery: string; sash: string };
  shoes: string;
  freckles: boolean;
}

const { maleLearner, femaleLearner } = KLOVERS_WORLD.characters;

export const AVATARS: Record<AvatarId, AvatarLook> = {
  adam: {
    id: "adam",
    name: { en: maleLearner.name.en, ar: maleLearner.name.ar },
    skin: "#E3BC9A",
    hair: "#3E2A1E",
    hairStyle: "short-wavy",
    // klovers_yellow_tailored_blazer · ivory_tshirt · ivory_trousers · white_sneakers
    top: PALETTE.yellow,
    sleeves: PALETTE.yellow,
    inner: PALETTE.ivory,
    lower: { kind: "trousers", color: PALETTE.ivory },
    shoes: PALETTE.white,
    freckles: false,
  },
  lina: {
    id: "lina",
    name: { en: femaleLearner.name.en, ar: femaleLearner.name.ar },
    skin: "#F0CDB2",
    hair: "#9C4A22",
    hairStyle: "long-wavy",
    // ivory_hanbok_inspired_wrap_top · klovers_yellow_midi_skirt ·
    // white_floral_embroidery · yellow_floral_sash · ivory_flats
    top: PALETTE.ivory,
    sleeves: PALETTE.ivory,
    lower: { kind: "skirt", color: PALETTE.yellow, embroidery: PALETTE.white, sash: PALETTE.yellow },
    shoes: PALETTE.ivory,
    freckles: true,
  },
};

export const DEFAULT_AVATAR: AvatarId = "adam";

export const isAvatarId = (v: unknown): v is AvatarId => v === "adam" || v === "lina";
