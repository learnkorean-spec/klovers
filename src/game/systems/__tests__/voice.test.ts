import { describe, expect, it } from "vitest";
import { WORLD_COPY } from "../../config/copy";
import { LINES } from "../../../../supabase/functions/world-voice/lines";

describe("recorded voices", () => {
  it("voice exactly the Korean the world shows, in both languages", () => {
    for (const lang of ["en", "ar"] as const) {
      const c = WORLD_COPY[lang];
      for (const id of ["auntie", "vendor", "shopkeeper", "baker", "hubFriend", "hubReader", "shopper", "cafeA", "cafeB", "cook", "twoHands", "newYear"] as const) expect(LINES[id].ko).toBe(c.say[id].ko);
      expect(LINES.minsu.ko).toBe(c.talk.minsu.ko);
      expect(LINES.adam.ko).toBe(c.talk.adam.ko);
      expect(LINES.lina.ko).toBe(c.talk.lina.ko);
    }
  });

  it("gives the men a man's voice", () => {
    const men = ["ash", "echo", "onyx"];
    for (const id of ["minsu", "adam", "vendor", "shopkeeper", "hubFriend", "cafeA", "twoHands"]) expect(men).toContain(LINES[id].voice);
    for (const id of ["lina", "auntie", "baker", "hubReader", "shopper"]) expect(men).not.toContain(LINES[id].voice);
  });
});

import { existsSync } from "fs";
import { resolve } from "path";
import { shopClip } from "../voice";
import { SHOP_ITEMS, SHOP_PRICES } from "../../config/interactions";

describe("recorded files", () => {
  const file = (p: string) => existsSync(resolve(__dirname, "../../../../public/assets/world/voice", p));
  it("has every person's line", () => {
    for (const id of Object.keys(LINES)) expect(file(`${id}.mp3`), id).toBe(true);
  });
  it("has every shop request, price, change and reply the card can play", () => {
    for (const cafe of [false, true]) {
      for (const item of cafe ? SHOP_ITEMS.cafe : [...SHOP_ITEMS.fruit, ...SHOP_ITEMS.food])
        for (const n of [1, 2, 3]) {
          expect(file(shopClip.request(item, n)), `${item} ${n}`).toBe(true);
          expect(file(shopClip.price(SHOP_PRICES[item] * n, cafe)), `price ${item} ${n}`).toBe(true);
        }
      for (const won of [1000, 2000, 3000, 4000]) expect(file(shopClip.change(won, cafe))).toBe(true);
      for (const p of [shopClip.ask(cafe), shopClip.howMany(cafe), shopClip.thanks(cafe)]) expect(file(p), p).toBe(true);
    }
    for (const part of ["q", "here", "go"] as const) expect(file(shopClip.stay(part))).toBe(true);
  });
});
