import { useEffect, useMemo, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { AdditiveBlending, AnimationMixer, Color, DoubleSide, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, SphereGeometry, Vector3, type AnimationAction, type AnimationClip, type Bone, type BufferGeometry, type Group, type Material, type SkinnedMesh, type Texture } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
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
export type DressRule = { match: RegExp; color: string; keepMap?: boolean; /** How much of the texture's light and dark shows (default 0.6). */ contrast?: number };

/** Small greyscale copies of textures, read once, for measuring brightness. */
const pixels = new WeakMap<Texture, { w: number; h: number; lum: Float32Array; alpha: Uint8Array } | null>();

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function readLuminance(tex: Texture) {
  if (pixels.has(tex)) return pixels.get(tex) ?? null;
  let out: { w: number; h: number; lum: Float32Array; alpha: Uint8Array } | null = null;
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
        for (let i = 0; i < w * h; i++) lum[i] = 0.2126 * toLinear(d[i * 4] / 255) + 0.7152 * toLinear(d[i * 4 + 1] / 255) + 0.0722 * toLinear(d[i * 4 + 2] / 255);
        out = { w, h, lum, alpha };
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
    const eye = new Mesh(new SphereGeometry(r, 24, 16), CORNEA);
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

function prepare(root: Group, rules: DressRule[]) {
  root.traverse((o) => {
    // Mixamo numbers the rig per character ("mixamorig9:Hips"); the shared
    // motions use the plain name, so every rig is renamed to match.
    o.name = o.name.replace(/^mixamorig\d+/, "mixamorig");
    const m = o as Mesh;
    if (!m.isMesh) return;
    m.castShadow = true;
    m.receiveShadow = true;
    // Skinned bounds follow the bind pose, not the motion: never cull.
    m.frustumCulled = false;
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
    if (/_Body$/.test(m.name)) skin(mat);
    const isHair = /hair|eyelash/i.test(m.name);
    const rule = rules.find((r) => r.match.test(m.name));
    if (rule) {
      const ref = !rule.keepMap && mat.map ? meanUnder(m.geometry, mat.map) : null;
      if (rule.keepMap) mat.color = new Color(rule.color);
      else if (ref !== null) dye(mat, rule.color, ref, rule.contrast);
      else {
        // Could not read the texture: the old flat colour.
        mat.map = null;
        mat.color = new Color(rule.color);
      }
    }
    // After the dye (which sets its own shader change): the rim on top.
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

export default function RiggedBody({ model, rules, female, control }: { model: string; rules: DressRule[]; female: boolean; control: MutableRefObject<BodyControl> }) {
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
    return r;
  }, [person, rules]);

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

  const st = useMemo(() => ({ base: null as Clip | null, once: null as Clip | null, onceEnd: 0, t: 0 }), []);

  useEffect(
    () => () => {
      mixer.stopAllAction();
    },
    [mixer],
  );

  useFrame((_, dt) => {
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
    mixer.update(d);
  });

  return <primitive object={root} />;
}
