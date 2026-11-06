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
 *   wcall  the place and the people and Cluby — canon now has a separate
 *          in-game rule for this (visualSystem.humans.inGame3d: "stylized
 *          low-poly matching painterly storybook environments", settled
 *          5 Nov 2026 — only visualSystem.humans.marketing stays
 *          photorealistic), so a painterly pass on people is canon-
 *          compatible; still a draft pending its own visual review, not a
 *          canon blocker anymore
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
    c *= mix(1.0, band / l, 0.35);
    // Transparent pigment: lighter and a little more saturated than paint.
    l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 1.3);
    c = 1.0 - (1.0 - c) * 0.92;
    // Blooms: large uneven patches with a slight warm/cool shift, then grain.
    float bloom = wcNoise(q * 0.45) * 0.6 + wcNoise(q * 1.6) * 0.4;
    float grain = wcNoise(q * 16.0);
    c *= mix(vec3(0.95, 0.97, 1.01), vec3(1.03, 1.0, 0.96), bloom);
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
    float fbm(vec2 p) { return n(p) * 0.5 + n(p * 2.03 + 1.7) * 0.3 + n(p * 4.1 + 3.1) * 0.2; }
    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

    // Kuwahara (4 quadrants, radius 2 px — small enough that signs stay readable): flat, brush-like patches of colour
    // with crisp borders — the "painted" part of the look.
    vec3 kuwahara(vec2 uv, vec2 px) {
      vec3 m[4]; vec3 s2[4];
      for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s2[k] = vec3(0.0); }
      for (int j = 0; j <= 2; j++) {
        for (int i = 0; i <= 2; i++) {
          vec3 a = texture2D(tDiffuse, uv + px * vec2(-i, -j)).rgb; m[0] += a; s2[0] += a * a;
          vec3 b = texture2D(tDiffuse, uv + px * vec2(i, -j)).rgb;  m[1] += b; s2[1] += b * b;
          vec3 c = texture2D(tDiffuse, uv + px * vec2(i, j)).rgb;   m[2] += c; s2[2] += c * c;
          vec3 d = texture2D(tDiffuse, uv + px * vec2(-i, j)).rgb;  m[3] += d; s2[3] += d * d;
        }
      }
      vec3 best = m[0] / 9.0; float bestV = 1e9;
      for (int k = 0; k < 4; k++) {
        vec3 mean = m[k] / 9.0;
        vec3 v = abs(s2[k] / 9.0 - mean * mean);
        float vs = v.r + v.g + v.b;
        if (vs < bestV) { bestV = vs; best = mean; }
      }
      return best;
    }

    void main() {
      vec2 px = 1.0 / resolution;
      vec2 fragPx = vUv * resolution;
      // Wet paper: the image drifts a little, unevenly.
      vec2 w = (vec2(fbm(fragPx / 40.0), fbm(fragPx / 40.0 + 9.2)) - 0.5) * px * 3.5;
      vec2 uv = vUv + w;
      vec3 c = kuwahara(uv, px);

      // Borders between washes (Sobel on luminance), slightly broken.
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
      float edge = smoothstep(0.08, 0.35, length(vec2(gx, gy))) * (0.55 + 0.45 * n(fragPx / 3.0));

      // Transparent pigment: a touch more colour, then lifted toward paper.
      float lc = lum(c);
      c = mix(vec3(lc), c, 1.15);
      // Wet edge: pigment pools at the border of each wash (same hue, deeper).
      c = mix(c, c * c * 0.92, edge * 0.6);
      // Granulation: darker washes show the paper's tooth more.
      float tooth = fbm(fragPx / 2.2);
      c *= 1.0 - (1.0 - lc) * 0.22 * tooth;
      // Paper: warm white, fibres in the lights, a soft unpainted margin.
      vec3 paper = vec3(1.0, 0.982, 0.945);
      float fibre = fbm(fragPx * vec2(0.9, 0.12)) * 0.5 + fbm(fragPx * vec2(0.12, 0.9)) * 0.5;
      c *= mix(vec3(1.0), paper, 0.6) * (0.965 + 0.035 * fibre);
      c = mix(c, paper, smoothstep(0.82, 1.0, lc) * 0.45);
      vec2 q = vUv - 0.5;
      float margin = smoothstep(0.44, 0.8, length(q * vec2(1.0, 1.25)) + (fbm(fragPx / 60.0) - 0.5) * 0.12);
      c = mix(c, paper, margin * 0.4);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }
  `,
};
