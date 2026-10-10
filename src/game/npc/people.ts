import {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Ambient people for KLOVERS World, built cheaply.
 *
 * Every person is a handful of simple shapes baked into at most five merged
 * meshes (body, two arms, two legs) with per-vertex colours, all sharing ONE
 * material. A seated reader or a shopkeeper is a single draw call; a walker
 * is five. Variety comes from the spec: skin, hair style and colour,
 * clothing, an accessory, and height — never random soup.
 */

export type HairStyle = "short" | "bun" | "long" | "bob" | "cap" | "bald-grey";
export type Lower = { kind: "trousers"; color: string } | { kind: "skirt"; color: string };
export type Prop = "none" | "book" | "cup" | "box" | "can" | "bag" | "phone";
export type Pose = "stand" | "talk" | "read" | "sit" | "sitRead" | "carry" | "walk" | "browse" | "water" | "drink";

export interface PersonSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  /** Apron, vest or jacket front, if any. */
  over?: string;
  lower: Lower;
  shoes: string;
  prop?: Prop;
  propColor?: string;
  /** Shirt sleeves rolled to the elbow (forearms show). */
  rolledSleeves?: boolean;
  /** A lanyard with a white ID card, in this colour. */
  lanyard?: string;
  /** 0.92–1.06: realistic height variation. */
  scale?: number;
}

/** One shared material for every person in the world. */
export const PEOPLE_MATERIAL = new MeshStandardMaterial({ vertexColors: true, roughness: 0.82 });

export interface PersonParts {
  core: BufferGeometry;
  armL?: BufferGeometry;
  armR?: BufferGeometry;
  legL?: BufferGeometry;
  legR?: BufferGeometry;
  /** Pivot heights (y) for animated limbs. */
  shoulderY: number;
  hipY: number;
}

type V3 = [number, number, number];

function part(geo: BufferGeometry, color: string, p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]): BufferGeometry {
  const g = geo.index ? geo : geo;
  const m = new Matrix4().compose(new Vector3(...p), new Quaternion().setFromEuler(new Euler(...r)), new Vector3(...s));
  g.applyMatrix4(m);
  const c = new Color(color);
  const n = g.getAttribute("position").count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new BufferAttribute(arr, 3));
  return g;
}

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const ball = (r: number, ws = 12, hs = 10) => new SphereGeometry(r, ws, hs);
const cap = (r: number, l: number) => new CapsuleGeometry(r, l, 4, 10);
const cyl = (rt: number, rb: number, h: number, seg = 12) => new CylinderGeometry(rt, rb, h, seg);

function merge(list: BufferGeometry[]): BufferGeometry {
  const g = mergeGeometries(list, false);
  list.forEach((x) => x.dispose());
  return g ?? new BoxGeometry(0, 0, 0);
}

/**
 * Builds a person in a pose. Coordinates: feet at y 0, facing +z. Limbs that
 * animate are returned separately, positioned relative to their pivot
 * (shoulder or hip) so rotating the mesh swings the limb naturally.
 */
export function buildPerson(spec: PersonSpec, pose: Pose): PersonParts {
  const HIP = 0.88;
  const SH = 1.36;
  const HEAD = 1.61;
  const seated = pose === "sit" || pose === "sitRead";
  const dy = seated ? -0.4 : 0; // a seated body drops onto the seat
  const core: BufferGeometry[] = [];
  const skirt = spec.lower.kind === "skirt";

  // Torso and clothing.
  core.push(part(cyl(0.2, 0.17, 0.52, 14), spec.top, [0, 1.1 + dy, 0], [0, 0, 0], [1, 1, 0.72]));
  core.push(part(ball(0.2, 14, 8), spec.top, [0, 1.35 + dy, 0], [0, 0, 0], [1, 0.32, 0.72]));
  // Shoulders: rounded caps where the arms meet the body.
  for (const sx of [-1, 1]) core.push(part(ball(0.062, 10, 8), spec.top, [sx * 0.2, 1.33 + dy, 0]));
  // Hips: trousers join both legs in a seat (a skirt covers it).
  if (!skirt && !seated) core.push(part(cyl(0.18, 0.17, 0.16, 14), spec.lower.color, [0, 0.88, 0], [0, 0, 0], [1, 1, 0.72]));
  if (spec.over) core.push(part(box(0.3, 0.5, 0.03), spec.over, [0, 1.05 + dy, 0.13]));
  if (spec.lanyard) {
    for (const sx of [-1, 1]) core.push(part(box(0.014, 0.3, 0.01), spec.lanyard, [sx * 0.045, 1.28 + dy, 0.142], [-0.12, 0, sx * 0.16]));
    core.push(part(box(0.07, 0.1, 0.01), "#FFFFFF", [0, 1.08 + dy, 0.152]));
  }
  if (skirt) core.push(part(cyl(0.17, 0.3, 0.55, 14), spec.lower.color, [0, (seated ? 0.62 : 0.6) + dy + (seated ? 0.18 : 0), seated ? 0.12 : 0], seated ? [-0.9, 0, 0] : [0, 0, 0], [1, 1, 0.85]));
  // Neck, head, face.
  core.push(part(cyl(0.048, 0.055, 0.16, 8), spec.skin, [0, 1.48 + dy, 0]));
  core.push(part(ball(0.125, 14, 12), spec.skin, [0, HEAD + dy, 0], [0, 0, 0], [0.95, 1.08, 1]));
  // Ears and a small nose: the head stops reading as a ball.
  for (const sx of [-1, 1]) core.push(part(ball(0.028, 6, 5), spec.skin, [sx * 0.118, HEAD - 0.005 + dy, 0], [0, 0, 0], [0.5, 1, 0.7]));
  core.push(part(ball(0.013, 6, 5), spec.skin, [0, HEAD - 0.015 + dy, 0.12], [0.35, 0, 0], [0.6, 1.4, 0.7]));
  for (const sx of [-1, 1]) {
    // Eye whites behind a dark iris: eyes read at a distance.
    core.push(part(ball(0.016, 8, 6), "#F4EFE6", [sx * 0.04, HEAD + 0.012 + dy, 0.106], [0, 0, 0], [1.35, 0.85, 0.6]));
    core.push(part(ball(0.011, 6, 5), "#3B2618", [sx * 0.04, HEAD + 0.011 + dy, 0.114]));
    core.push(part(box(0.035, 0.008, 0.01), spec.hair === "#E9E4DA" ? "#8A8580" : spec.hair, [sx * 0.042, HEAD + 0.04 + dy, 0.113], [0, 0, -sx * 0.1]));
  }
  core.push(part(box(0.03, 0.008, 0.01), "#8C5A4A", [0, HEAD - 0.058 + dy, 0.114]));
  // Hair / headwear.
  const hy = HEAD + dy;
  if (spec.hairStyle === "cap") {
    core.push(part(cyl(0.135, 0.135, 0.08, 14), spec.hair, [0, hy + 0.09, 0]));
    core.push(part(cyl(0.2, 0.2, 0.015, 14), spec.hair, [0, hy + 0.055, 0.04]));
  } else {
    core.push(part(new SphereGeometry(0.137, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), spec.hair, [0, hy + 0.01, -0.01], [-0.55, 0, 0]));
    if (spec.hairStyle === "bun") core.push(part(ball(0.06, 8, 6), spec.hair, [0, hy + 0.13, -0.08]));
    if (spec.hairStyle === "long") core.push(part(cap(0.1, 0.26), spec.hair, [0, hy - 0.2, -0.07], [0, 0, 0], [1.3, 1, 0.6]));
    if (spec.hairStyle === "bob") for (const sx of [-1, 1]) core.push(part(box(0.06, 0.2, 0.2), spec.hair, [sx * 0.11, hy - 0.07, -0.02]));
  }

  // Legs.
  const legColor = skirt ? spec.skin : spec.lower.color;
  const legR = skirt ? 0.058 : 0.075;
  const legs: BufferGeometry[][] = [[], []];
  [-1, 1].forEach((sx, i) => {
    const target = pose === "walk" ? legs[i] : core;
    const off: V3 = pose === "walk" ? [0, -HIP, 0] : [0, 0, 0];
    if (seated) {
      // Thigh forward along the seat, shin down to the ground.
      core.push(part(cap(legR, 0.34), legColor, [sx * 0.1, 0.48, 0.2], [Math.PI / 2, 0, 0]));
      core.push(part(cap(legR, 0.34), legColor, [sx * 0.1, 0.24, 0.42]));
      core.push(part(box(0.11, 0.08, 0.24), spec.shoes, [sx * 0.1, 0.04, 0.47]));
    } else {
      // Thigh tapering into the shin; a shoe with a rounded toe.
      target.push(part(cap(legR, 0.34), legColor, [sx * 0.1, HIP - 0.22 + off[1], 0]));
      target.push(part(cap(legR * 0.82, 0.36), legColor, [sx * 0.1, HIP - 0.64 + off[1], 0]));
      target.push(part(box(0.11, 0.085, 0.19), spec.shoes, [sx * 0.1, 0.043 + off[1], 0.02]));
      target.push(part(ball(0.056, 8, 6), spec.shoes, [sx * 0.1, 0.035 + off[1], 0.11], [0, 0, 0], [1, 0.7, 1.1]));
    }
  });
  if (pose === "walk") {
    // Legs pivot at the hip: shift so the pivot is the origin, x relative.
    legs.forEach((l, i) => l.forEach((g) => g.translate(-[-1, 1][i] * 0.1, 0, 0)));
  }

  // Arms. Held poses bake the arms into the body; gesturing ones stay loose.
  const armColor = spec.top;
  const arm = (sx: number, rx: number, rz: number, handProp = false): BufferGeometry[] => {
    const out: BufferGeometry[] = [];
    const len = 0.5;
    const pieces = spec.rolledSleeves
      ? [
          part(cap(0.057, 0.16), armColor, [0, -0.13, 0]),
          part(cyl(0.06, 0.06, 0.05, 10), armColor, [0, -0.27, 0]),
          part(cap(0.044, 0.16), spec.skin, [0, -0.37, 0]),
        ]
      : [part(cap(0.055, len - 0.1), armColor, [0, -len / 2, 0])];
    const h = part(ball(0.05, 8, 6), spec.skin, [0, -len + 0.01, 0.01], [0, 0, 0], [0.72, 1.15, 0.5]);
    const rot = new Matrix4().makeRotationFromEuler(new Euler(rx, 0, rz));
    pieces.forEach((g) => g.applyMatrix4(rot));
    h.applyMatrix4(rot);
    out.push(...pieces, h);
    if (handProp) {
      const hp = new Vector3(0, -len + 0.02, 0.06).applyMatrix4(rot);
      const pc = spec.propColor ?? "#FFF9EC";
      if (spec.prop === "cup") out.push(part(cyl(0.035, 0.03, 0.09, 8), pc, [hp.x, hp.y + 0.03, hp.z]));
      if (spec.prop === "phone") out.push(part(box(0.06, 0.11, 0.012), "#2E2E2E", [hp.x, hp.y + 0.04, hp.z], [rx * 0.5, 0, 0]));
      if (spec.prop === "can") {
        out.push(part(cyl(0.07, 0.08, 0.16, 10), pc, [hp.x, hp.y - 0.06, hp.z + 0.02]));
        out.push(part(cyl(0.012, 0.012, 0.2, 6), pc, [hp.x, hp.y - 0.04, hp.z + 0.14], [1.1, 0, 0]));
      }
      if (spec.prop === "bag") out.push(part(box(0.22, 0.26, 0.08), pc, [hp.x, hp.y - 0.14, hp.z - 0.02]));
    }
    return out.map((g) => {
      g.translate(sx * 0.25, SH + dy, 0);
      return g;
    });
  };
  const loose = (pose === "walk" || pose === "talk" || pose === "drink" || pose === "water" || pose === "stand") && !seated;
  let armLParts: BufferGeometry[] = [];
  let armRParts: BufferGeometry[] = [];
  if (pose === "read" || pose === "sitRead") {
    core.push(...arm(-1, -1.1, 0.35), ...arm(1, -1.1, -0.35));
    const by = (seated ? 1.02 : 1.12) + (seated ? 0 : 0);
    core.push(part(box(0.26, 0.2, 0.03), spec.propColor ?? "#FFF9EC", [0, by - 0.05, 0.36], [-0.9, 0, 0]));
    core.push(part(box(0.27, 0.21, 0.02), "#6B4A33", [0, by - 0.055, 0.345], [-0.9, 0, 0]));
  } else if (pose === "carry") {
    core.push(...arm(-1, -1.25, 0.12), ...arm(1, -1.25, -0.12));
    core.push(part(box(0.42, 0.3, 0.32), spec.propColor ?? "#B7875A", [0, 1.05, 0.42]));
  } else if (pose === "browse") {
    core.push(...arm(-1, 0.35, 0.1), ...arm(1, 0.35, -0.1)); // hands behind the back
  } else if (seated) {
    core.push(...arm(-1, -0.7, 0.2), ...arm(1, -0.7, -0.2));
  } else if (loose) {
    armLParts = arm(-1, 0, 0.08, spec.prop === "bag");
    armRParts = arm(1, 0, -0.08, spec.prop === "cup" || spec.prop === "can" || spec.prop === "phone");
    // Loose arms pivot at the shoulder.
    armLParts.forEach((g) => g.translate(0.25, -(SH + dy), 0));
    armRParts.forEach((g) => g.translate(-0.25, -(SH + dy), 0));
  }

  const s = spec.scale ?? 1;
  const out: PersonParts = {
    core: merge(core),
    armL: armLParts.length ? merge(armLParts) : undefined,
    armR: armRParts.length ? merge(armRParts) : undefined,
    legL: legs[0].length ? merge(legs[0]) : undefined,
    legR: legs[1].length ? merge(legs[1]) : undefined,
    shoulderY: SH + dy,
    hipY: HIP,
  };
  if (s !== 1) {
    // Scale is applied by the component (uniformly), keeping pivots right.
  }
  return out;
}

/** Throwaway helper for cone-shaped props (kept for future hats). */
export const cone = (r: number, h: number) => new ConeGeometry(r, h, 10);
