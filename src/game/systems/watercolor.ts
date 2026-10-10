import { type Material, type Mesh, MeshStandardMaterial, type Object3D } from "three";
import type { WatercolorMode } from "./styleMode";
export { watercolorMode, type WatercolorMode } from "./styleMode";

/**
 * Watercolour look (DRAFT, preview only — /world?style=wc or ?style=wcall).
 *
 * A cheap painterly finish on the existing lit materials, with no
 * post-processing pass: soft value bands (washes instead of smooth
 * gradients), pigment granulation that varies over the surface in world
 * space, a warm paper tint that lifts the shadows, and a darker edge where
 * the surface turns away (the pooled pigment at a wash's border).
 *
 *   wc     the place only (buildings, ground, plants) — inside the canon,
 *          whose environments are "soft painterly storybook"
 *   wcall  the place and the people and Cluby — needs a canon change
 *          (visualSystem.humans is photorealistic today), so it is only a
 *          draft until Re decides
 */
const VERT_DECL = "varying vec3 vWcPos;\n";
const VERT_BODY = `
  vec4 wcP = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wcP = instanceMatrix * wcP;
  #endif
  vWcPos = (modelMatrix * wcP).xyz;
`;

const FRAG_DECL = `
varying vec3 vWcPos;
float wcHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wcNoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(wcHash(i), wcHash(i + vec2(1.0, 0.0)), u.x), mix(wcHash(i + vec2(0.0, 1.0)), wcHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
`;

const FRAG_BODY = `
  {
    vec3 c = gl_FragColor.rgb;
    vec2 q = vWcPos.xz + vec2(vWcPos.y * 0.7, -vWcPos.y * 0.5);
    float l = max(dot(c, vec3(0.299, 0.587, 0.114)), 1e-3);
    // Washes: pull the value toward a few soft bands.
    float band = (floor(l * 4.0) + smoothstep(0.3, 0.7, fract(l * 4.0))) / 4.0;
    c *= mix(1.0, band / l, 0.5);
    // Transparent pigment: lighter and a little more saturated than paint.
    l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 1.3);
    c = 1.0 - (1.0 - c) * 0.92;
    // Blooms: large uneven patches with a slight warm/cool shift, then grain.
    float bloom = wcNoise(q * 0.45) * 0.6 + wcNoise(q * 1.6) * 0.4;
    float grain = wcNoise(q * 16.0);
    c *= mix(vec3(0.9, 0.94, 1.02), vec3(1.06, 1.0, 0.93), bloom);
    c *= 0.93 + 0.12 * grain;
    // Pigment pools at the edge of each wash (where the surface turns away).
    float rim = 1.0 - abs(dot(normalize(normal), normalize(vViewPosition)));
    c = mix(c, c * c * 1.1, 0.55 * pow(rim, 2.0));
    // Paper shows through the lightest washes.
    c = mix(c, vec3(1.0, 0.975, 0.93), 0.12 * smoothstep(0.6, 1.0, l));
    gl_FragColor.rgb = clamp(c, 0.0, 1.0);
  }
`;

const patched = new WeakSet<Material>();

function patch(m: MeshStandardMaterial): void {
  if (patched.has(m)) return;
  patched.add(m);
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, renderer) => {
    prev?.call(m, shader, renderer);
    shader.vertexShader = VERT_DECL + shader.vertexShader.replace("#include <project_vertex>", `#include <project_vertex>\n${VERT_BODY}`);
    shader.fragmentShader = FRAG_DECL + shader.fragmentShader.replace("#include <dithering_fragment>", `${FRAG_BODY}\n#include <dithering_fragment>`);
  };
  const key = m.customProgramCacheKey?.bind(m);
  m.customProgramCacheKey = () => `${key ? key() : ""}|wc1`;
  m.needsUpdate = true;
}

/** Characters (player, Cluby, people) mark their root group with userData.character. */
function isCharacter(o: Object3D): boolean {
  for (let p: Object3D | null = o; p; p = p.parent) if (p.userData?.character) return true;
  return false;
}

const plainClones = new WeakMap<Material, Material>();

/**
 * Walks the scene and gives every lit surface the watercolour finish. In
 * "wc" mode a material shared with a character is cloned for the character
 * first, so people keep their plain finish.
 */
export function applyWatercolor(root: Object3D, mode: WatercolorMode): void {
  if (mode === "off") return;
  const meshes: { mesh: Mesh; char: boolean }[] = [];
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (mesh.isMesh) meshes.push({ mesh, char: isCharacter(mesh) });
  });
  const each = (mesh: Mesh, f: (m: Material, set: (n: Material) => void) => void) => {
    if (Array.isArray(mesh.material)) mesh.material.forEach((m, i) => f(m, (n) => ((mesh.material as Material[])[i] = n)));
    else f(mesh.material, (n) => (mesh.material = n));
  };
  // The place first; then the characters, which in "wc" keep a plain copy.
  for (const { mesh, char } of meshes) {
    if (char && mode === "wc") continue;
    each(mesh, (m) => {
      if (m instanceof MeshStandardMaterial && !plainClones.has(m)) patch(m);
    });
  }
  if (mode !== "wc") return;
  for (const { mesh, char } of meshes) {
    if (!char) continue;
    each(mesh, (m, set) => {
      if (!(m instanceof MeshStandardMaterial) || !patched.has(m)) return;
      let c = plainClones.get(m);
      if (!c) {
        c = m.clone();
        plainClones.set(m, c);
        plainClones.set(c, c);
      }
      set(c);
    });
  }
}

/**
 * The screen pass of the draft: soft, slightly wobbly pigment edges (where
 * colours meet, as a watercolourist's wash borders do) and a touch of
 * bleeding between neighbouring colours. Drawn after the scene; preview only.
 */
export const WATERCOLOR_SCREEN = {
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: [1, 1] as [number, number] },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    varying vec2 vUv;
    float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float n(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y); }
    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
    void main() {
      vec2 px = 1.0 / resolution;
      vec2 w = (vec2(n(vUv * 90.0), n(vUv * 90.0 + 7.3)) - 0.5) * px * 3.0;
      vec2 uv = vUv + w;
      float tl = lum(texture2D(tDiffuse, uv + px * vec2(-1, 1)).rgb);
      float t = lum(texture2D(tDiffuse, uv + px * vec2(0, 1)).rgb);
      float tr = lum(texture2D(tDiffuse, uv + px * vec2(1, 1)).rgb);
      float l = lum(texture2D(tDiffuse, uv + px * vec2(-1, 0)).rgb);
      float r = lum(texture2D(tDiffuse, uv + px * vec2(1, 0)).rgb);
      float bl = lum(texture2D(tDiffuse, uv + px * vec2(-1, -1)).rgb);
      float b = lum(texture2D(tDiffuse, uv + px * vec2(0, -1)).rgb);
      float br = lum(texture2D(tDiffuse, uv + px * vec2(1, -1)).rgb);
      float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
      float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
      float edge = smoothstep(0.06, 0.3, length(vec2(gx, gy)));
      // A little bleed: blend toward a soft neighbourhood average.
      vec3 c = texture2D(tDiffuse, uv).rgb;
      vec3 soft = (texture2D(tDiffuse, uv + px * vec2(1.5, 0.5)).rgb + texture2D(tDiffuse, uv - px * vec2(1.5, 0.5)).rgb
        + texture2D(tDiffuse, uv + px * vec2(-0.5, 1.5)).rgb + texture2D(tDiffuse, uv - px * vec2(-0.5, 1.5)).rgb) * 0.25;
      c = mix(c, soft, 0.35);
      // Pigment pools along the borders (darker, same hue), broken by grain.
      float g = 0.6 + 0.4 * n(vUv * resolution * 0.35);
      c = mix(c, c * c * 0.9, edge * 0.75 * g);
      // Keep the washes clear and bright, not muddy.
      float lc = lum(c);
      c = mix(vec3(lc), c, 1.12);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};
