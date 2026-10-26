import { useEffect, useMemo, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { AdditiveBlending, AnimationMixer, Color, DoubleSide, Frustum, LoopOnce, LoopRepeat, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Sphere, SphereGeometry, Vector3, type Camera, type AnimationAction, type AnimationClip, type Bone, type BufferGeometry, type Group, type Material, type SkinnedMesh, type Texture } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { isTouchFirst } from "../systems/webgl";
import { pickQuality } from "../systems/quality";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * A real, rigged person (a Mixamo character) driven by a small set of
 * shared motions. The owner says which looping motion to play (`clip`) and
 * may ask for a one-off (`once`: a wave, a hop); the body cross-fades.
 *
 * Assets: public/assets/world/people — people ≈0.8–1.7 MB each (meshopt
 * geometry, WebP textures; skin and faces 2K, upscaled 23 Oct 2026), motions 25–250 KB, shared by everyone.
 */
const BASE = "/assets/world/people/";

const extend = (loader: GLTFLoader) => {
  loader.setMeshoptDecoder(MeshoptDecoder);
};

export type Clip = "idle" | "walk" | "run" | "talk" | "wave" | "jump" | "sit" | "look";
const CLIPS: Clip[] = ["idle", "walk", "run", "talk", "wave", "jump", "sit", "look"];
const ONCE = new Set<Clip>(["wave", "jump"]);

/** Recolour clothes by mesh name. The fabric stays: see `dye`. `keepMap` tints the texture as it is (hair). */
export type DressRule = {
  match: RegExp;
  color: string;
  keepMap?: boolean;
  /** How much of the texture's light and dark shows (default 0.6). */
  contrast?: number;
  /**
   * Tint instead of dye: shift the texture's own average colour to `color`,
   * keeping every other colour in it (skin: lips stay rosier, brows darker,
   * the whites of the eyes white).
   */
  tint?: boolean;
};

const LIMITS = typeof window !== "undefined" ? pickQuality() : { maxTexture: 4096, maxDetail: 4096 };
const fitted = new WeakSet<Texture>();

/**
 * Shrinks a texture whose side is over the tier's limit (systems/quality),
 * once, before it is first drawn: on phones the people's 2048² colour maps
 * go to the graphics card at 1024² and their 1024² relief and shine maps
 * at 512², a quarter of the memory each. Only images without see-through
 * parts are ever over the limit (the hair's colour map is 1024²), so
 * drawing through a 2D canvas loses nothing.
 */
function fitTexture(t: Texture, max: number) {
  if (fitted.has(t)) return;
  fitted.add(t);
  const img = t.image as (CanvasImageSource & { width: number; height: number; close?: () => void }) | undefined;
  if (!img || typeof document === "undefined") return;
  const side = Math.max(img.width, img.height);
  if (!side || side <= max) return;
  const k = max / side;
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * k);
  cv.height = Math.round(img.height * k);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  try {
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
  } catch {
    return;
  }
  // Each picture belongs to this one texture (the glTF loader makes one per
  // image), and an ImageBitmap holds its memory until it is closed.
  img.close?.();
  t.image = cv;
  t.needsUpdate = true;
}

/** Small greyscale copies of textures, read once, for measuring brightness. */
const pixels = new WeakMap<Texture, { w: number; h: number; lum: Float32Array; alpha: Uint8Array; rgb: Float32Array } | null>();

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function readLuminance(tex: Texture) {
  if (pixels.has(tex)) return pixels.get(tex) ?? null;
  let out: { w: number; h: number; lum: Float32Array; alpha: Uint8Array; rgb: Float32Array } | null = null;
  try {
    const img = tex.image as CanvasImageSource | undefined;
    if (img && typeof document !== "undefined") {
      const w = 128;
      const h = 128;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const d = ctx.getImageData(0, 0, w, h).data;
        const lum = new Float32Array(w * h);
        const alpha = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) alpha[i] = d[i * 4 + 3];
        const rgb = new Float32Array(w * h * 3);
        for (let i = 0; i < w * h; i++) {
          rgb[i * 3] = toLinear(d[i * 4] / 255);
          rgb[i * 3 + 1] = toLinear(d[i * 4 + 1] / 255);
          rgb[i * 3 + 2] = toLinear(d[i * 4 + 2] / 255);
          lum[i] = 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2];
        }
        out = { w, h, lum, alpha, rgb };
      }
    }
  } catch {
    out = null;
  }
  pixels.set(tex, out);
  return out;
}

/**
 * Mean (linear) brightness of the texture where this mesh is drawn: sampled
 * at triangle centres (corners of hair cards sit on their see-through
 * edges), each sample weighted by how opaque the texture is there.
 */
function meanUnder(geometry: BufferGeometry, tex: Texture): number | null {
  const px = readLuminance(tex);
  const uv = geometry.getAttribute("uv");
  if (!px || !uv) return null;
  const index = geometry.getIndex();
  const tris = index ? index.count / 3 : uv.count / 3;
  const step = Math.max(1, Math.floor(tris / 1500));
  let sum = 0;
  let weight = 0;
  for (let t = 0; t < tris; t += step) {
    let u = 0;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      const i = index ? index.getX(t * 3 + k) : t * 3 + k;
      u += uv.getX(i) / 3;
      v += uv.getY(i) / 3;
    }
    const x = Math.min(px.w - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * px.w)));
    const y = Math.min(px.h - 1, Math.max(0, Math.floor((((v % 1) + 1) % 1) * px.h)));
    const a = px.alpha[y * px.w + x] / 255;
    sum += px.lum[y * px.w + x] * a;
    weight += a;
  }
  return weight > 0.5 ? sum / weight : null;
}

/** The texture's average colour (linear RGB) over the faces of this mesh, or null. */
/** The most a skin tone may brighten the texture, per channel. */
const SKIN_LIMIT = 2.6;

function meanColorUnder(geometry: BufferGeometry, tex: Texture): [number, number, number] | null {
  const px = readLuminance(tex);
  const uv = geometry.getAttribute("uv");
  if (!px || !uv) return null;
  const index = geometry.getIndex();
  const tris = index ? index.count / 3 : uv.count / 3;
  const step = Math.max(1, Math.floor(tris / 1500));
  const sum = [0, 0, 0];
  let weight = 0;
  for (let t = 0; t < tris; t += step) {
    let u = 0;
    let v = 0;
    for (let k = 0; k < 3; k++) {
      const i = index ? index.getX(t * 3 + k) : t * 3 + k;
      u += uv.getX(i) / 3;
      v += uv.getY(i) / 3;
    }
    const x = Math.min(px.w - 1, Math.max(0, Math.floor((((u % 1) + 1) % 1) * px.w)));
    const y = Math.min(px.h - 1, Math.max(0, Math.floor((((v % 1) + 1) % 1) * px.h)));
    const j = y * px.w + x;
    const [r, g, b] = [px.rgb[j * 3], px.rgb[j * 3 + 1], px.rgb[j * 3 + 2]];
    // Skin only: the body's texture also holds the scalp under the hair,
    // brows, lashes and the dark of the eyes. Counted in, they pulled the
    // average so low that every tone hit the brightening limit and the
    // texture's own hue (tan on some bodies) stayed as it was.
    if (r < 0.1 || r < g || g < b * 0.8) continue;
    const a = px.alpha[j] / 255;
    sum[0] += r * a;
    sum[1] += g * a;
    sum[2] += b * a;
    weight += a;
  }
  return weight > 0.5 ? [sum[0] / weight, sum[1] / weight, sum[2] / weight] : null;
}

/**
 * Dye a garment: its colour becomes `color`, but the texture's light and
 * dark (folds, seams, weave, stitching) stay, measured against the garment's
 * own average so the result averages to the colour asked for. A flat colour
 * with only the normal map left read as plastic.
 */
function dye(mat: MeshStandardMaterial, color: string, ref: number, contrast = 0.6) {
  mat.color = new Color(color);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.dyeRef = { value: Math.max(ref, 0.002) };
    shader.uniforms.dyeContrast = { value: contrast };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float dyeRef;\nuniform float dyeContrast;\nvoid main() {")
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec4 dyeTex = texture2D( map, vMapUv );
  float dyeLum = dot( dyeTex.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  diffuseColor.rgb *= clamp( pow( dyeLum / dyeRef, dyeContrast ), 0.45, 1.3 );
#endif`,
      );
  };
  mat.customProgramCacheKey = () => "klovers-dye";
}

type Shader = Parameters<NonNullable<Material["onBeforeCompile"]>>[0];

/** Add a shader change to a material, keeping any it already has (dye, skin, rim). */
function tweak(mat: MeshStandardMaterial, key: string, fn: (shader: Shader) => void) {
  const prev = mat.onBeforeCompile;
  const prevKey = mat.customProgramCacheKey();
  mat.onBeforeCompile = (shader, renderer) => {
    prev.call(mat, shader, renderer);
    fn(shader);
  };
  mat.customProgramCacheKey = () => `${prevKey}|${key}`;
}

/**
 * A soft rim of warm light at the edges of people (where the surface turns
 * away from the camera): they separate from walls and crowds the way a lit
 * figure does in a photograph, without any extra light in the scene.
 */
function rim(mat: MeshStandardMaterial, strength = 0.2) {
  tweak(mat, `rim${strength}`, (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `{
  float rimF = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
  outgoingLight += vec3(1.0, 0.89, 0.72) * pow(rimF, 3.0) * ${strength.toFixed(2)};
}
#include <opaque_fragment>`,
    );
  });
}

/**
 * Skin: Mixamo's gloss maps read as wet, oily skin under the sky light
 * (bright patches on foreheads and noses). A floor on roughness keeps a soft
 * sheen without the shine.
 */
function skin(mat: MeshStandardMaterial) {
  tweak(mat, "skin", (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = max( roughnessFactor, 0.5 );");
  });
}

/** One unit sphere shared by every cornea (scaled per eye): a new one per person was never freed. */
const CORNEA_SPHERE = new SphereGeometry(1, 24, 16);

/** One glossy, see-through cornea for every eye: catches the sky as a small bright highlight. */
const CORNEA = new MeshStandardMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, transparent: true, blending: AdditiveBlending, depthWrite: false, envMapIntensity: 2.2 });

/**
 * Eyes that look alive: the models' eyes are painted, so they never catch
 * the light. A small glossy cornea over each eye adds the highlight a real
 * eye has. Mixamo rigs have no eye bones, so the eyes are found from the
 * eyelashes (one cluster each side) and the corneas ride on the head bone.
 */
function addCorneas(root: Group) {
  let lashes: SkinnedMesh | null = null;
  let head: Bone | null = null;
  root.traverse((o) => {
    if ((o as SkinnedMesh).isSkinnedMesh && /eyela/i.test(o.name)) lashes = o as SkinnedMesh;
    // GLTFLoader drops the ":" from "mixamorig:Head".
    if ((o as Bone).isBone && /Head$/.test(o.name)) head = o as Bone;
  });
  const l = lashes as SkinnedMesh | null;
  const h = head as Bone | null;
  if (!l || !h) return;
  root.updateMatrixWorld(true);
  l.skeleton.update();
  const pos = l.geometry.getAttribute("position");
  const v = new Vector3();
  const headX = new Vector3().setFromMatrixPosition(h.matrixWorld).x;
  const sides = [
    { sum: new Vector3(), n: 0, minX: Infinity, maxX: -Infinity },
    { sum: new Vector3(), n: 0, minX: Infinity, maxX: -Infinity },
  ];
  for (let i = 0; i < pos.count; i++) {
    l.getVertexPosition(i, v);
    v.applyMatrix4(l.matrixWorld);
    const s = sides[v.x < headX ? 0 : 1];
    s.sum.add(v);
    s.n++;
    s.minX = Math.min(s.minX, v.x);
    s.maxX = Math.max(s.maxX, v.x);
  }
  for (const s of sides) {
    if (s.n < 4) continue;
    const c = s.sum.divideScalar(s.n);
    const r = (s.maxX - s.minX) * 0.42;
    if (!(r > 0) || r > 0.05) continue;
    const eye = new Mesh(CORNEA_SPHERE, CORNEA);
    eye.scale.setScalar(r);
    eye.name = "cornea";
    eye.renderOrder = 2;
    // The lashes sit on the lid edge, at the front of the eye: the cornea's
    // front just there, its centre one radius behind.
    eye.position.set(c.x, c.y, c.z + 0.0015 - r);
    root.add(eye);
    eye.updateMatrixWorld(true);
    h.attach(eye);
  }
}

/**
 * Cloth: the converter's gloss maps left sweaters and trousers shining like
 * wet rubber under the sky light. Real cloth is matte; a floor on roughness.
 */
function cloth(mat: MeshStandardMaterial) {
  tweak(mat, "cloth", (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\n  roughnessFactor = max( roughnessFactor, 0.68 );");
  });
}

/**
 * The npc-elizabeth hair stood out from the head like a wide puff (it read
 * as a curly 80s volume, not a Korean bob). Its cards are drawn in, sideways
 * and front-to-back, toward the head (once per geometry: clones share it, and
 * the light copies get the same change).
 */
const TAME_HAIR = /^Ch26_Hair$/;
const tamed = new WeakSet<BufferGeometry>();
function tameHair(name: string, geo: BufferGeometry) {
  if (!TAME_HAIR.test(name) || tamed.has(geo)) return;
  tamed.add(geo);
  const pos = geo.getAttribute("position");
  // Positions are quantised per mesh to -1…1 round the hair's own middle (y up); anything else is left alone.
  if (!pos.normalized) return;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    // Most at the crown and sides, none at the ends hanging below the ears.
    const t = Math.min(1, Math.max(0, (y + 0.6) / 1.4));
    const f = 1 - 0.15 * t;
    pos.setXYZ(i, x * f, y - (y > 0.4 ? (y - 0.4) * 0.12 : 0), z * (1 - 0.1 * t));
  }
  pos.needsUpdate = true;
  geo.computeBoundingSphere();
}

/**
 * People are drawn only when on screen: their skinned bounds used to follow
 * the bind pose, so they were never culled — everyone behind the camera
 * still cost their full triangles. A sphere round the rest pose, generously
 * enlarged for sitting, reaching and walking, is safe to cull by.
 */
function cullable(root: Group) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    const m = o as SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    m.computeBoundingSphere();
    if (m.boundingSphere) m.boundingSphere.radius = m.boundingSphere.radius * 1.5 + 0.3;
    m.frustumCulled = true;
  });
}

/** A face's own proportions: the head bone scaled a little (width, height, depth). */
export type HeadShape = [number, number, number];

function prepare(root: Group, rules: DressRule[]) {
  root.traverse((o) => {
    // Mixamo numbers the rig per character ("mixamorig9:Hips"); the shared
    // motions use the plain name, so every rig is renamed to match.
    o.name = o.name.replace(/^mixamorig\d+/, "mixamorig");
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    // Culled by a padded rest-pose sphere (cullable, below), not the bind-pose bounds.
    m.frustumCulled = false;
    tameHair(m.name, m.geometry);
    if (!(m.material instanceof MeshStandardMaterial)) return;
    // The converter reads Mixamo's gloss map as metal (dark, mirror-like
    // skin) and leaves hair at zero opacity: skin and cloth are not metal,
    // and hair is cut-out cards.
    const mat = (m.material as MeshStandardMaterial).clone();
    mat.metalness = 0;
    mat.metalnessMap = null;
    mat.color = new Color(1, 1, 1);
    if (/hair|eyelash/i.test(m.name) || mat.transparent || mat.opacity < 1) {
      mat.transparent = false;
      mat.opacity = 1;
      mat.alphaTest = 0.45;
      // Soft strand edges where the canvas is multisampled (it is).
      mat.alphaToCoverage = true;
      mat.side = DoubleSide;
      mat.depthWrite = true;
      // Hair came in at roughness ≈0.16 once its fake metal was gone: a
      // wet, plastic shine. Real hair has a soft sheen.
      mat.roughness = 0.62;
      // Layered cards shadow each other into dark patches: hair still casts
      // on the body and the ground, but does not take shadows itself.
      m.receiveShadow = false;
    }
    // Sharp at a slant and at a distance: glTF textures arrive unfiltered
    // (1×), so skin, cloth and hair went soft the moment a person turned or
    // stood a few metres off — whatever resolution they were made at. The
    // renderer clamps this to what the graphics card allows.
    const aniso = isTouchFirst() ? 4 : 16;
    for (const t of [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap]) {
      if (t) fitTexture(t, t === mat.map ? LIMITS.maxTexture : LIMITS.maxDetail);
      if (t && t.anisotropy < aniso) {
        t.anisotropy = aniso;
        t.needsUpdate = true;
      }
    }
    if (/_Body$/.test(m.name)) skin(mat);
    const isHair = /hair|eyelash/i.test(m.name);
    const rule = rules.find((r) => r.match.test(m.name));
    if (rule?.tint) {
      // Skin: shift the texture's average to the person's tone, keep the rest.
      const mean = mat.map ? meanColorUnder(m.geometry, mat.map) : null;
      if (mean) {
        const target = new Color(rule.color);
        const f = [target.r / Math.max(mean[0], 0.004), target.g / Math.max(mean[1], 0.004), target.b / Math.max(mean[2], 0.004)];
        // Never brighten past the limit, but scale all three together when
        // it is reached, so the shift in hue (toward the tone) survives.
        const k = Math.min(1, SKIN_LIMIT / Math.max(...f));
        mat.color = new Color(...(f.map((x) => Math.max(0.35, x * k)) as [number, number, number]));
      }
    } else if (rule) {
      const ref = !rule.keepMap && mat.map ? meanUnder(m.geometry, mat.map) : null;
      if (rule.keepMap) mat.color = new Color(rule.color);
      else if (ref !== null) dye(mat, rule.color, ref, rule.contrast);
      else {
        // Could not read the texture: the old flat colour.
        mat.map = null;
        mat.color = new Color(rule.color);
      }
    }
    // After the dye (which sets its own shader change): matte cloth and the rim on top.
    if (/Shirt|Sweater|Suit|Pants|Collar|Tie/.test(m.name)) cloth(mat);
    if (!isHair) rim(mat, /_Body$/.test(m.name) ? 0.16 : 0.22);
    mat.needsUpdate = true;
    m.material = mat as Material;
  });
}

/** Hips travel is the world's job: keep only the up-and-down (or nothing). */
function inPlace(clip: AnimationClip, keepHeight: boolean): AnimationClip {
  const c = clip.clone();
  c.tracks = c.tracks.filter((t) => keepHeight || !/Hips\.position$/.test(t.name));
  for (const t of c.tracks) {
    if (!/Hips\.position$/.test(t.name)) continue;
    const v = t.values;
    for (let i = 0; i < v.length; i += 3) {
      v[i] = v[0];
      v[i + 2] = v[2];
    }
  }
  return c;
}

export interface BodyControl {
  /** The looping motion to show now. */
  clip: Clip;
  /** A one-off to play once (cleared by the body when it starts). */
  once: Clip | null;
  /** Playback speed for walk / run (feet keep pace with the ground). */
  rate: number;
}

/** Where a person may look: someone's position (the learner), or nobody. */
export type LookTarget = MutableRefObject<{ position: { x: number; y: number; z: number } }> | undefined;

const UP = new Vector3(0, 1, 0);
const _fwd = new Vector3();
const _pos = new Vector3();
const _q = new Quaternion();
const _qw = new Quaternion();
const _qp = new Quaternion();

/**
 * Turn the head (and a little of the neck) toward `target` after the
 * motion has posed the body: people notice the learner walking past, follow
 * them with their eyes while near, then look back to what they were doing.
 */
function lookToward(bone: Bone, yaw: number, pitch: number) {
  if (!bone.parent) return;
  bone.getWorldQuaternion(_qw);
  _q.setFromAxisAngle(UP, yaw);
  _qw.premultiply(_q);
  if (pitch) {
    // Nod about the bone's own sideways axis (its local x).
    _q.setFromAxisAngle(new Vector3(1, 0, 0), pitch);
    _qw.multiply(_q);
  }
  bone.parent.getWorldQuaternion(_qp).invert();
  bone.quaternion.copy(_qp.multiply(_qw));
}

/**
 * Lighter copies of each body (made by scripts/world-lod — geometry only,
 * same skin), worn by people who stand far from the camera: a light copy
 * (≈40–50% of the triangles) past 3.5 m on a phone / 10 m on a computer,
 * and a far copy (≈15%) past 9 m / 20 m, where a person is a few dozen
 * pixels tall. A busy room drew ≈50k triangles per person whatever their size on
 * screen: 10 people were half a million triangles on a phone. Swapping the
 * geometry keeps the one skeleton, motion and clothes. Adam and Lina have
 * copies too: the other learner often waits across a room.
 */
const LOD_MODELS = new Set(["npc-joe", "npc-leonard", "npc-brian", "npc-elizabeth", "npc-megan", "adam", "lina"]);

/** Checks only: ?lod=all puts everyone in the light copy, ?lod=far in the far one, ?lod=off nobody. */
function lodFlag(): "all" | "far" | "off" | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("lod");
  return v === "all" || v === "far" || v === "off" ? v : null;
}

/**
 * Where (metres from the camera) a person changes into the light and then
 * the far copy. Phones sooner: on a phone screen the light copy cannot be
 * told from the full one past a few metres (compared side by side, 25 Oct
 * 2026), so only whoever stands right by the camera — someone being talked
 * to — wears the full one.
 */
const lodSteps = () => (isTouchFirst() ? [3.5, 9] : [10, 20]);

const _cam = new Vector3();

type Level = 0 | 1 | 2;

function useLod(root: Group, model: string) {
  const flag = useMemo(lodFlag, []);
  const use = LOD_MODELS.has(model) && flag !== "off";
  // Always the same hook calls: the copies of a body that has none are never fetched.
  const light = useLoader(GLTFLoader, use ? `${BASE}${model}.lod.glb` : `${BASE}${model}.glb`, extend) as GLTF;
  const farOne = useLoader(GLTFLoader, use ? `${BASE}${model}.far.glb` : `${BASE}${model}.glb`, extend) as GLTF;
  const swaps = useMemo(() => {
    if (!use) return [];
    const named = (g: GLTF) => {
      const byName = new Map<string, BufferGeometry>();
      g.scene.traverse((o) => {
        if (!(o as Mesh).isMesh) return;
        const name = o.name.replace(/^mixamorig\d+/, "mixamorig");
        tameHair(name, (o as Mesh).geometry);
        byName.set(name, (o as Mesh).geometry);
      });
      return byName;
    };
    const lite = named(light);
    const farG = named(farOne);
    const out: { mesh: Mesh; geo: [BufferGeometry, BufferGeometry, BufferGeometry] }[] = [];
    const corneas: Mesh[] = [];
    root.traverse((o) => {
      const m = o as Mesh;
      if (m.name === "cornea") corneas.push(m);
      if (!(m as SkinnedMesh).isSkinnedMesh) return;
      const ok = (g?: BufferGeometry) => (g && g !== m.geometry && g.getAttribute("position")?.count ? g : undefined);
      const l = ok(lite.get(m.name));
      const f = ok(farG.get(m.name)) ?? l;
      if (l && f) out.push({ mesh: m, geo: [m.geometry, l, f] });
    });
    return out.length ? out.map((s, i) => ({ ...s, corneas: i === 0 ? corneas : [] })) : [];
  }, [use, light, farOne, root]);
  const st = useMemo(() => ({ level: 0 as Level, first: true }), []);
  const steps = useMemo(lodSteps, []);
  useFrame(({ camera }) => {
    if (!swaps.length) return;
    let next: Level;
    if (flag === "all") next = 1;
    else if (flag === "far") next = 2;
    else {
      root.getWorldPosition(_pos);
      camera.getWorldPosition(_cam);
      const d = _pos.distanceTo(_cam);
      // A metre of give either way: nobody flickers between two copies at the line.
      const at = (step: number, level: Level) => (st.level >= level ? d > step - 1 : d > step + 1);
      next = at(steps[1], 2) ? 2 : at(steps[0], 1) ? 1 : 0;
    }
    if (next === st.level && !st.first) return;
    st.level = next;
    st.first = false;
    for (const s of swaps) {
      s.mesh.geometry = s.geo[next];
      // An eye's highlight is a pixel or less that far off: not worth its sphere.
      for (const c of s.corneas) c.visible = next === 0;
    }
  });
  return st;
}

/** Shared per frame: the camera's view, to tell who is on screen. */
const _frustum = new Frustum();
const _vp = new Matrix4();
const _sphere = new Sphere();
const _at = new Vector3();
/** The frame the view above was taken for (the clock's time: the same for every person in one frame). */
let frustumFrame = -1;
/** Room around a person still counted as on screen: with shadows, theirs reaches in from beyond the edge. */
const VIEW_MARGIN = typeof window !== "undefined" && pickQuality().shadows ? 4 : 1.6;

function onScreen(camera: Camera, frame: number, at: Vector3): boolean {
  if (frame !== frustumFrame) {
    frustumFrame = frame;
    _vp.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    _frustum.setFromProjectionMatrix(_vp);
  }
  _sphere.center.set(at.x, at.y + 0.9, at.z);
  _sphere.radius = VIEW_MARGIN;
  return _frustum.intersectsSphere(_sphere);
}

/**
 * A face of one's own: the bodies carry face blend shapes (rounder or longer,
 * jaw, cheekbones, eyes, nose, mouth, chin — scripts/world-faces/morph.py);
 * each person sets them once. The light copies have none, and from that far
 * no one can tell.
 */
function setFace(root: Group, face: Record<string, number>) {
  root.traverse((o) => {
    const m = o as Mesh;
    const dict = m.morphTargetDictionary;
    if (!dict || !m.morphTargetInfluences) return;
    for (const [name, v] of Object.entries(face)) {
      const i = dict[name];
      if (i !== undefined) m.morphTargetInfluences[i] = v;
    }
  });
}

export default function RiggedBody({ model, rules, female, control, look, head, face }: { model: string; rules: DressRule[]; female: boolean; control: MutableRefObject<BodyControl>; look?: LookTarget; head?: HeadShape; face?: Record<string, number> }) {
  // Fetch the light copy alongside the body, not after it (each load below waits for the one before).
  if (LOD_MODELS.has(model) && lodFlag() !== "off") {
    useLoader.preload(GLTFLoader, `${BASE}${model}.lod.glb`, extend);
    useLoader.preload(GLTFLoader, `${BASE}${model}.far.glb`, extend);
  }
  const person = useLoader(GLTFLoader, `${BASE}${model}.glb`, extend) as GLTF;
  const anims = useLoader(
    GLTFLoader,
    CLIPS.map((n) => `${BASE}anim-${n === "walk" ? (female ? "walk-f" : "walk-m") : n}.glb`),
    extend,
  ) as GLTF[];

  const root = useMemo(() => {
    const r = cloneSkinned(person.scene) as Group;
    prepare(r, rules);
    addCorneas(r);
    if (head) {
      // No motion here moves a bone's scale (rotations only), so this holds.
      r.traverse((o) => {
        if ((o as Bone).isBone && /Head$/.test(o.name)) o.scale.set(...head);
      });
    }
    if (face) setFace(r, face);
    cullable(r);
    return r;
  }, [person, rules, head, face]);
  const lod = useLod(root, model);

  const { mixer, actions } = useMemo(() => {
    const mx = new AnimationMixer(root);
    const acts = {} as Record<Clip, AnimationAction>;
    CLIPS.forEach((n, i) => {
      const clip = inPlace(anims[i].animations[0], n === "idle" || n === "walk" || n === "run" || n === "talk" || n === "sit" || n === "look");
      clip.name = n;
      const a = mx.clipAction(clip);
      if (ONCE.has(n)) {
        a.setLoop(LoopOnce, 1);
        a.clampWhenFinished = false;
      } else a.setLoop(LoopRepeat, Infinity);
      acts[n] = a;
    });
    return { mixer: mx, actions: acts };
  }, [root, anims]);

  // Leaving a room frees this person's GPU state. Each clone has skeletons
  // of its own, and every skeleton uploads a bone texture; <primitive> is
  // never disposed by React Three Fiber, so these piled up visit after visit
  // (≈30 small float textures per room on a phone, measured 25 Oct 2026).
  useEffect(
    () => () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      const seen = new Set<unknown>();
      root.traverse((o) => {
        const sk = (o as SkinnedMesh).skeleton;
        if ((o as SkinnedMesh).isSkinnedMesh && sk && !seen.has(sk)) {
          seen.add(sk);
          sk.dispose();
        }
      });
    },
    [mixer, root],
  );

  const st = useMemo(() => ({ base: null as Clip | null, once: null as Clip | null, onceEnd: 0, t: 0, yaw: 0, pitch: 0, pending: 0, odd: false }), []);
  const bones = useMemo(() => {
    let head: Bone | null = null;
    let neck: Bone | null = null;
    root.traverse((o) => {
      if (!(o as Bone).isBone) return;
      if (/Head$/.test(o.name)) head = o as Bone;
      else if (/Neck$/.test(o.name)) neck = o as Bone;
    });
    return { head: head as Bone | null, neck: neck as Bone | null };
  }, [root]);

  useEffect(
    () => () => {
      mixer.stopAllAction();
    },
    [mixer],
  );

  useFrame(({ camera, clock }, dt) => {
    const c = control.current;
    const d = Math.min(dt, 0.1);
    st.t += d;
    // A one-off: fade it in over the loop, then hand back.
    if (c.once) {
      const a = actions[c.once];
      a.reset().setEffectiveWeight(1).fadeIn(0.15).play();
      if (st.base) actions[st.base].fadeOut(0.15);
      st.once = c.once;
      st.onceEnd = st.t + a.getClip().duration - 0.25;
      c.once = null;
    }
    if (st.once && st.t >= st.onceEnd) {
      actions[st.once].fadeOut(0.25);
      st.once = null;
      if (st.base) actions[st.base].reset().fadeIn(0.25).play();
    }
    if (!st.once && st.base !== c.clip) {
      const to = actions[c.clip];
      to.reset().setEffectiveWeight(1).fadeIn(st.base ? 0.3 : 0).play();
      if (st.base) actions[st.base].fadeOut(0.3);
      st.base = c.clip;
    } else if (st.once) st.base = c.clip;
    actions.walk.timeScale = c.clip === "walk" ? c.rate : 1;
    actions.run.timeScale = c.clip === "run" ? c.rate : 1;
    // Posing a skeleton is the people's main cost on the processor. Nobody
    // sees a pose off screen: it waits there. Far off (a few dozen pixels
    // tall), every other frame is plenty.
    st.pending = Math.min(st.pending + d, 0.1);
    if (!onScreen(camera, clock.elapsedTime, root.getWorldPosition(_at))) return;
    st.odd = !st.odd;
    if (lod.level === 2 && st.odd) return;
    mixer.update(st.pending);
    st.pending = 0;

    // Look at the learner when they are near and in front; otherwise back.
    const { head, neck } = bones;
    if (!head || !look) return;
    let yaw = 0;
    let pitch = 0;
    const tgt = look.current.position;
    root.updateWorldMatrix(true, false);
    head.getWorldPosition(_pos);
    const dx = tgt.x - _pos.x;
    const dz = tgt.z - _pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 5 && dist > 0.35 && !st.once) {
      root.getWorldDirection(_fwd);
      const facing = Math.atan2(_fwd.x, _fwd.z);
      let delta = Math.atan2(dx, dz) - facing;
      delta = Math.atan2(Math.sin(delta), Math.cos(delta));
      // Only what is in front: nobody turns their head right round.
      if (Math.abs(delta) < 1.9) {
        yaw = Math.max(-1.05, Math.min(1.05, delta));
        // Eyes at about 1.55 m: a small nod up or down toward them.
        pitch = Math.max(-0.35, Math.min(0.3, -Math.atan2((tgt.y ?? 0) + 1.55 - _pos.y, dist)));
      }
    }
    const k = 1 - Math.exp(-d * 4);
    st.yaw += (yaw - st.yaw) * k;
    st.pitch += (pitch - st.pitch) * k;
    if (Math.abs(st.yaw) < 0.002 && Math.abs(st.pitch) < 0.002) return;
    if (neck) lookToward(neck, st.yaw * 0.4, st.pitch * 0.3);
    lookToward(head, st.yaw * 0.6, st.pitch * 0.7);
  });

  return <primitive object={root} />;
}
