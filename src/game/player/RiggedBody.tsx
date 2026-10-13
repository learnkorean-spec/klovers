import { useEffect, useMemo, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { AnimationMixer, Color, DoubleSide, LoopOnce, LoopRepeat, MeshStandardMaterial, type AnimationAction, type AnimationClip, type Group, type Material, type Mesh } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/**
 * A real, rigged person (a Mixamo character) driven by a small set of
 * shared motions. The owner says which looping motion to play (`clip`) and
 * may ask for a one-off (`once`: a wave, a hop); the body cross-fades.
 *
 * Assets: public/assets/world/people — people ≈0.6–1.5 MB each (meshopt
 * geometry, WebP 1K textures), motions 25–250 KB, shared by everyone.
 */
const BASE = "/assets/world/people/";

const extend = (loader: GLTFLoader) => {
  loader.setMeshoptDecoder(MeshoptDecoder);
};

export type Clip = "idle" | "walk" | "run" | "talk" | "wave" | "jump" | "sit" | "look";
const CLIPS: Clip[] = ["idle", "walk", "run", "talk", "wave", "jump", "sit", "look"];
const ONCE = new Set<Clip>(["wave", "jump"]);

/** Recolour clothes by mesh name (the texture goes; folds stay in the normal map). */
export type DressRule = { match: RegExp; color: string; keepMap?: boolean };

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
      mat.side = DoubleSide;
      mat.depthWrite = true;
    }
    const rule = rules.find((r) => r.match.test(m.name));
    if (rule) {
      if (!rule.keepMap) mat.map = null;
      mat.color = new Color(rule.color);
    }
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
