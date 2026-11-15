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
  // Book 1's new Korean people (canon supportingKoreanCast.book1; Re, 4 Nov 2026), met in the
  // Vocabulary Market. Provisional in-game looks, like Minsu's first one: each dressed for
  // their role, until Re pins down their artwork.
  /** Jihoon (지훈) — a passer-by who gives directions: a student on his way, backpack on. */
  jihoon: { skin: SKIN[4], hair: HAIR.black, hairStyle: "short", top: PALETTE.ivory, over: SLATE, lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.white, prop: "bag", propColor: PALETTE.charcoal, scale: 1.02 },
  /** Ms. Park (박 아주머니) — a market vendor: work apron, hair up. */
  park: { skin: SKIN[1], hair: HAIR.dark, hairStyle: "bun", top: PALETTE.ivory, over: OLIVE, lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.charcoal, scale: 0.95 },
  /** Mr. Kim (김 선생님) — the information-desk clerk: dark jacket, white shirt, staff card. */
  kim: { skin: SKIN[2], hair: HAIR.black, hairStyle: "short", top: PALETTE.white, over: PALETTE.charcoal, lanyard: "#6B4A33", lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.charcoal, scale: 1.0 },
  /** Yuna (유나) — a café barista: white shirt, brown apron. */
  yuna: { skin: SKIN[0], hair: HAIR.dark, hairStyle: "bun", top: PALETTE.white, over: "#6B4A33", lower: { kind: "trousers", color: PALETTE.charcoal }, shoes: PALETTE.white, prop: "cup", propColor: PALETTE.white, scale: 0.98 },
  /** Seoyeon (서연) — a classmate making plans: knit top, skirt, book bag. */
  seoyeon: { skin: SKIN[5], hair: HAIR.black, hairStyle: "long", top: SAND, lower: { kind: "skirt", color: SLATE }, shoes: PALETTE.white, prop: "bag", propColor: "#8C5A4A", scale: 0.97 },
  /** Taeyang (태양) — a friend proposing a weekend trip: casual jacket, phone in hand. */
  taeyang: { skin: SKIN[3], hair: HAIR.dark, hairStyle: "short", top: PALETTE.white, over: "#8C7A66", lower: { kind: "trousers", color: SLATE }, shoes: PALETTE.white, prop: "phone", scale: 1.04 },
  /** Hana (하나) — a neighbour out shopping: soft cardigan, a full shopping bag. */
  hana: { skin: SKIN[2], hair: HAIR.brown, hairStyle: "bob", top: PALETTE.ivory, over: "#9C8469", lower: { kind: "trousers", color: SAND }, shoes: PALETTE.charcoal, prop: "bag", propColor: PALETTE.ivory, scale: 0.96 },
} satisfies Record<string, PersonSpec>;

export type CastId = keyof typeof CAST;
