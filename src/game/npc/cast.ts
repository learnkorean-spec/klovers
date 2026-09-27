import { PALETTE } from "../config/world";
import type { PersonSpec } from "./people";

/**
 * The people of KLOVERS World. Clothing stays within the world's palette —
 * ivory, charcoal, the woods, stone, a muted pine — with Klovers yellow kept
 * for the learners (Adam's blazer, Lina's skirt) so they stand out. Skin and
 * hair are people's own colours.
 */
const SKIN = ["#E8C4A0", "#D9A77E", "#F1D3B8", "#C68A62", "#EBC9A9", "#DDB08A"] as const;
const HAIR = { black: "#1F1A17", dark: "#3E2A1E", brown: "#6B4A33", grey: "#B9B4AC" } as const;
const SLATE = "#5B6573";
const SAND = "#CBB89A";
const OLIVE = "#7A7F5A";

export const CAST = {
  /** Minsu (민수) — canon koreanFriend. Provisional look. */
  // From Re's Book 1 artwork (27 Sep 2026): pale periwinkle shirt, sleeves
  // rolled, near-black trousers, a navy lanyard with a white card.
  minsu: { skin: SKIN[2], hair: HAIR.black, hairStyle: "short", top: "#BCC6F2", rolledSleeves: true, lanyard: "#2C3550", lower: { kind: "trousers", color: "#26272B" }, shoes: PALETTE.charcoal, scale: 1.03 },
  gardener: { skin: SKIN[3], hair: HAIR.grey, hairStyle: "cap", top: OLIVE, lower: { kind: "trousers", color: "#6B4A33" }, shoes: PALETTE.charcoal, prop: "can", propColor: "#7D8790", scale: 0.97 },
  readerA: { skin: SKIN[0], hair: HAIR.dark, hairStyle: "bob", top: PALETTE.ivory, lower: { kind: "skirt", color: SLATE }, shoes: PALETTE.charcoal, propColor: PALETTE.white, scale: 0.97 },
  readerB: { skin: SKIN[1], hair: HAIR.black, hairStyle: "short", top: SAND, lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.white, propColor: PALETTE.ivory },
  student1: { skin: SKIN[4], hair: HAIR.brown, hairStyle: "long", top: SLATE, lower: { kind: "trousers", color: SAND }, shoes: PALETTE.white, prop: "bag", propColor: PALETTE.charcoal, scale: 0.98 },
  student2: { skin: SKIN[5], hair: HAIR.black, hairStyle: "short", top: PALETTE.white, over: OLIVE, lower: { kind: "trousers", color: SLATE }, shoes: PALETTE.charcoal, prop: "phone" },
  elder: { skin: SKIN[2], hair: HAIR.grey, hairStyle: "bald-grey", top: "#8C7A66", lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.charcoal, scale: 0.95 },
  auntie: { skin: SKIN[0], hair: HAIR.dark, hairStyle: "bun", top: PALETTE.ivory, over: "#8C5A4A", lower: { kind: "skirt", color: PALETTE.charcoal }, shoes: PALETTE.charcoal, scale: 0.96 },
  vendor: { skin: SKIN[3], hair: HAIR.black, hairStyle: "cap", top: PALETTE.white, over: SAND, lower: { kind: "trousers", color: "#4A4A4A" }, shoes: PALETTE.charcoal, scale: 1.01 },
  porter: { skin: SKIN[1], hair: HAIR.dark, hairStyle: "short", top: SAND, lower: { kind: "trousers", color: SLATE }, shoes: PALETTE.charcoal, propColor: PALETTE.woodWarm, scale: 1.03 },
  walker: { skin: SKIN[4], hair: HAIR.brown, hairStyle: "bob", top: PALETTE.charcoal, lower: { kind: "skirt", color: SAND }, shoes: PALETTE.white, prop: "bag", propColor: "#8C5A4A" },
  shopper: { skin: SKIN[5], hair: HAIR.black, hairStyle: "long", top: "#9C8469", lower: { kind: "trousers", color: PALETTE.ivory }, shoes: PALETTE.charcoal, prop: "bag", propColor: PALETTE.ivory, scale: 0.97 },
  barista: { skin: SKIN[2], hair: HAIR.dark, hairStyle: "bun", top: PALETTE.white, over: PALETTE.charcoal, lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.charcoal },
  friendA: { skin: SKIN[0], hair: HAIR.brown, hairStyle: "short", top: SLATE, lower: { kind: "trousers", color: PALETTE.ivory }, shoes: PALETTE.white, prop: "cup", propColor: PALETTE.white },
  friendB: { skin: SKIN[3], hair: HAIR.black, hairStyle: "long", top: PALETTE.ivory, lower: { kind: "skirt", color: OLIVE }, shoes: PALETTE.charcoal },
} satisfies Record<string, PersonSpec>;

export type CastId = keyof typeof CAST;
