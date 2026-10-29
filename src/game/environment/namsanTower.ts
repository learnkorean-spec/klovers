import { type BufferGeometry, Color, DoubleSide, LatheGeometry, MeshStandardMaterial, Vector2 } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { std } from "../config/materials";

/**
 * N Seoul Tower, shared by Seoul Journey part 3 (the tower up close on
 * Namsan) and part 1 (the same tower far off on its hill to the north).
 */

export type Profile = [number, number][];

/**
 * Turns profiles (radius, height) about the y axis and merges them. Each
 * profile is shaded smoothly along its length; where one profile meets the
 * next the edge stays crisp (a ledge, a lip, a band).
 */
export function turned(profiles: Profile[], segs: number): BufferGeometry {
  const parts = profiles.map((pr) => {
    const g = new LatheGeometry(pr.map(([r, y]) => new Vector2(r, y)), segs);
    g.deleteAttribute("uv");
    return g;
  });
  return mergeGeometries(parts) ?? parts[0];
}

/**
 * Tinted glass that shows the sky: the reflected view direction picks a
 * colour between the hazy horizon and the blue above, strongest at grazing
 * angles (Fresnel). There is no environment map in the world, so plain
 * glass read as flat grey plastic.
 */
export function skyGlass(color: string): MeshStandardMaterial {
  const m = new MeshStandardMaterial({ color: new Color(color), roughness: 0.2, metalness: 0.1, side: DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `{
  vec3 toCam = normalize(vViewPosition);
  vec3 nn = gl_FrontFacing ? normal : -normal;
  float fres = pow(1.0 - clamp(abs(dot(nn, toCam)), 0.0, 1.0), 3.0);
  vec3 rw = (vec4(reflect(-toCam, nn), 0.0) * viewMatrix).xyz;
  float up = clamp(rw.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 sky = mix(vec3(0.78, 0.76, 0.72), vec3(0.50, 0.64, 0.82), smoothstep(0.5, 0.95, up));
  sky = mix(vec3(0.30, 0.33, 0.34), sky, smoothstep(0.38, 0.52, up));
  outgoingLight = mix(outgoingLight, sky, 0.22 + 0.6 * fres);
}
#include <opaque_fragment>`,
    );
  };
  m.customProgramCacheKey = () => "klovers-sky-glass";
  return m;
}

export const TOWER_WHITE = std("#F2F0EA", 0.5);
TOWER_WHITE.side = DoubleSide;
export const TOWER_RED = std("#C8463C", 0.6);
TOWER_RED.side = DoubleSide;
export const DECK_GLASS = skyGlass("#4F6577");

/**
 * N Seoul Tower, by its real silhouette: a white shaft tapering as it rises
 * and flaring like a trumpet bell under the observation deck; two leaning
 * window bands split by a ledge; a lipped roof sloping in to the mast
 * housing; then the mast — white, with service platforms, and red and white
 * bands to the tip. Built as turned profiles: three shapes in all.
 *
 * `segs`: segments round the turn (fewer for the far view from the street).
 */
export function towerGeometry(segs: number): { white: BufferGeometry; red: BufferGeometry; glass: BufferGeometry } {
  const shaft: Profile = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    shaft.push([1.12 + 0.68 * Math.pow(1 - t, 1.6), 2 + t * 27]);
  }
  // The bell under the deck, continuing the shaft without a crease.
  for (let i = 1; i <= 10; i++) {
    const s = i / 10;
    shaft.push([1.12 + 1.88 * Math.pow(s, 2.4), 29 + 3.2 * s]);
  }
  const white: Profile[] = [
    shaft,
    [[3.0, 32.2], [3.14, 32.2]],
    [[3.14, 32.2], [3.14, 32.32]],
    [[3.14, 32.32], [2.98, 32.32]],
    // The ledge between the two window bands.
    [[3.08, 33.3], [3.42, 33.3]],
    [[3.42, 33.3], [3.42, 33.6]],
    [[3.42, 33.6], [3.2, 33.6]],
    // The roof: a lip, then sloping in to the mast housing.
    [[3.32, 34.6], [3.52, 34.6]],
    [[3.52, 34.6], [3.52, 34.8]],
    [[3.52, 34.8], [3.1, 35.02], [2.4, 35.28], [1.42, 35.46]],
    [[1.42, 35.46], [1.42, 36.6]],
    [[1.42, 36.6], [0.62, 36.76]],
    [[0.62, 36.76], [0.5, 40.0]],
  ];
  // Service platforms on the mast.
  for (const [y, r] of [[40.0, 1.0], [44.6, 0.74]] as const) {
    white.push([[0.3, y], [r, y]], [[r, y], [r, y + 0.16]], [[r, y + 0.16], [0.3, y + 0.16]]);
  }
  // Bands, red and white, narrowing to the tip.
  const red: Profile[] = [];
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const y0 = 40.16 + i * 1.05;
    const r0 = 0.44 - i * 0.03;
    const band: Profile = [[r0, y0], [r0 - 0.03, y0 + 1.05]];
    (i % 2 ? white : red).push(band);
  }
  white.push([[0.12, 49.6], [0.05, 52.4]]);
  const glass: Profile[] = [
    [[2.98, 32.32], [3.12, 33.3]],
    [[3.2, 33.6], [3.34, 34.6]],
  ];
  return { white: turned(white, segs), red: turned(red, segs), glass: turned(glass, segs) };
}
