import type { RoomId } from "./rooms";

/**
 * Short notes that appear once, the first time a learner walks up to
 * something worth noticing. A handful only — the world should mostly be
 * discovered, not explained.
 */
export type DiscoveryKey = "marketStalls" | "hubSignpost" | "villageLetters";

export interface Discovery {
  key: DiscoveryKey;
  room: RoomId;
  x: number;
  z: number;
  radius: number;
}

export const DISCOVERIES: Discovery[] = [
  { key: "villageLetters", room: "hangul-village", x: -3.4, z: 5.0, radius: 2.4 },
  { key: "marketStalls", room: "vocabulary-market", x: 0, z: 2.5, radius: 4 },
  { key: "hubSignpost", room: "hub", x: 0, z: 0, radius: 3.6 },
];
