/**
 * Seoul Journey's taxi, as plain numbers: where it is, how fast it goes,
 * and how long until it comes round again. Kept apart from the drawing
 * (environment/SeoulJourney) so the one rule that matters — it always stops
 * for someone standing in its lane — can be tested.
 */

export interface TaxiState {
  /** Centre of the car along the road (x), metres. */
  x: number;
  /** Speed, metres per second (eastbound, +x). */
  v: number;
  /** Seconds before it sets off again (it is off the street meanwhile). */
  wait: number;
}

export const TAXI = {
  /** Half the car's length: its front is at x + half. */
  half: 2.2,
  cruise: 7.5,
  brake: 16,
  accel: 4,
  /** It starts and finishes this far down the road, out of sight. */
  end: 62,
  /** How close (metres, ahead of its front) someone in the lane makes it wait. */
  gap: 5.5,
} as const;

export function newTaxi(): TaxiState {
  return { x: -TAXI.end, v: 0, wait: 4 };
}

/**
 * One step. `inLane` is whether the person is standing in the taxi's lane
 * (the caller decides with the lane's own width); `px` is where along it.
 * `rand` picks the pause before the next run.
 */
export function stepTaxi(s: TaxiState, dt: number, inLane: boolean, px: number, rand: () => number = Math.random): TaxiState {
  if (s.wait > 0) return { ...s, wait: s.wait - dt };
  const gap = px - (s.x + TAXI.half);
  // Waits for anyone ahead of it, or beside it (never drives through a person).
  const blocked = inLane && gap > -TAXI.half * 2 - 0.2 && gap < TAXI.gap;
  const target = blocked ? 0 : TAXI.cruise;
  const rate = target < s.v ? TAXI.brake : TAXI.accel;
  const v = s.v + Math.sign(target - s.v) * Math.min(Math.abs(target - s.v), rate * dt);
  const x = s.x + v * dt;
  if (x > TAXI.end) return { x: -TAXI.end, v: TAXI.cruise, wait: 7 + rand() * 9 };
  return { x, v, wait: 0 };
}
