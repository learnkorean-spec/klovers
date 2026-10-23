import { describe, expect, it } from "vitest";
import { TAXI, newTaxi, stepTaxi, type TaxiState } from "../traffic";

const run = (s: TaxiState, seconds: number, inLane: boolean, px: number) => {
  for (let t = 0; t < seconds; t += 1 / 30) s = stepTaxi(s, 1 / 30, inLane, px, () => 0.5);
  return s;
};

describe("Seoul Journey taxi", () => {
  it("waits, then drives the length of the road and comes round again", () => {
    let s = run(newTaxi(), 5, false, 0);
    expect(s.x).toBeGreaterThan(-TAXI.end);
    s = run(s, 30, false, 0);
    // Having reached the far end, it is back at the start, pausing.
    expect(s.x).toBeLessThan(0);
  });

  it("never drives into someone standing in its lane", () => {
    for (const px of [-20, -3, 0, 4, 9]) {
      let s = newTaxi();
      for (let t = 0; t < 40; t += 1 / 30) {
        s = stepTaxi(s, 1 / 30, true, px, () => 0.5);
        // Its front never reaches the person.
        expect(s.x + TAXI.half, `px ${px}`).toBeLessThan(px);
      }
      expect(s.v).toBeCloseTo(0, 3);
    }
  });

  it("drives on once the lane is clear", () => {
    const stopped = run(newTaxi(), 30, true, 0);
    const later = run(stopped, 3, false, 0);
    expect(later.x).toBeGreaterThan(stopped.x + 5);
  });
});
