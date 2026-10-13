import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { AnimationMixer, Color, DoubleSide, LoopOnce, LoopRepeat, MeshStandardMaterial, type AnimationAction, type AnimationClip, type Group, type Material, type Mesh } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { PALETTE } from "../config/world";
import type { PlayerState } from "../systems/state";
import type { AvatarId } from "./characters";

/**
 * The learners as real, rigged people (Mixamo characters and motion), with
 * smooth blends between standing, walking and running, a hop, a wave and
 * talking. Dressed to the canon (Adam: yellow blazer, ivory tee and
 * trousers, white trainers; Lina: ivory top, yellow below, copper hair).
 *
 * Assets live in public/assets/world/people (≈1.3 MB per person with
 * meshopt geometry and WebP textures; the motions are 25–250 KB each) and
 * load only with the world.
 */
const BASE = "/assets/world/people/";

const extend = (loader: GLTFLoader) => {
  loader.setMeshoptDecoder(MeshoptDecoder);
};

type Clip = "idle" | "walk" | "run" | "talk" | "wave" | "jump";

/** Tints that put each person in their canon clothes (by mesh name). */
const DRESS: Record<AvatarId, { match: RegExp; color: string; keepMap?: boolean }[]> = {
  adam: [
    { match: /Suit/, color: "#F2E200" },
    { match: /Shirt/, color: PALETTE.ivory },
    { match: /Pants/, color: "#EFE6D2" },
    { match: /Shoes/, color: PALETTE.white },
  ],
  lina: [
    { match: /Shirt/, color: PALETTE.ivory },
    { match: /Pants/, color: "#F2E200" },
    { match: /Shoes/, color: PALETTE.ivory },
    { match: /Hair/, color: "#C9672F", keepMap: true },
  ],
};

function dress(root: Group, avatar: AvatarId) {
  root.traverse((o) => {
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
    m.material = mat as Material;
    const rule = DRESS[avatar].find((r) => r.match.test(m.name));
    if (!rule) return;
    if (!rule.keepMap) mat.map = null;
    mat.color = new Color(rule.color);
    mat.needsUpdate = true;
    m.material = mat as Material;
  });
}

/** Strips the hips' travel from a clip (the world moves the body; a hop lifts it). */
function inPlace(clip: AnimationClip, keepHeight: boolean): AnimationClip {
  const c = clip.clone();
  c.tracks = c.tracks.filter((t) => !(/Hips\.position$/.test(t.name) && !keepHeight));
  if (keepHeight) {
    for (const t of c.tracks) {
      if (!/Hips\.position$/.test(t.name)) continue;
      // Keep the up-and-down only: x and z pinned to the first frame.
      const v = t.values;
      for (let i = 0; i < v.length; i += 3) {
        v[i] = v[0];
        v[i + 2] = v[2];
      }
    }
  }
  return c;
}

export default function RealAvatar({
  player,
  avatar,
  greet,
}: {
  player: MutableRefObject<PlayerState>;
  avatar: AvatarId;
  /** Someone to greet: wave when they arrive, then talk while they stay near. */
  greet?: MutableRefObject<PlayerState>;
}) {
  const person = useLoader(GLTFLoader, `${BASE}${avatar}.glb`, extend) as GLTF;
  const anims = useLoader(
    GLTFLoader,
    ["idle", avatar === "lina" ? "walk-f" : "walk-m", "run", "talk", "wave", "jump"].map((n) => `${BASE}anim-${n}.glb`),
    extend,
  ) as GLTF[];

  const root = useMemo(() => {
    const r = cloneSkinned(person.scene) as Group;
    dress(r, avatar);
    return r;
  }, [person, avatar]);

  const { mixer, actions } = useMemo(() => {
    const mx = new AnimationMixer(root);
    const names: Clip[] = ["idle", "walk", "run", "talk", "wave", "jump"];
    const acts = {} as Record<Clip, AnimationAction>;
    names.forEach((n, i) => {
      const src = anims[i].animations[0];
      const clip = inPlace(src, n === "idle" || n === "walk" || n === "run" || n === "talk");
      clip.name = n;
      const a = mx.clipAction(clip);
      if (n === "wave" || n === "jump") {
        a.setLoop(LoopOnce, 1);
        a.clampWhenFinished = false;
      } else a.setLoop(LoopRepeat, Infinity);
      acts[n] = a;
    });
    acts.idle.play();
    return { mixer: mx, actions: acts };
  }, [root, anims]);

  useEffect(() => () => {
    mixer.stopAllAction();
  }, [mixer]);

  const state = useRef<{ base: Clip; oneShot: Clip | null; greeted: boolean; wasAir: boolean }>({ base: "idle", oneShot: null, greeted: false, wasAir: false });

  const fadeTo = (next: Clip, t = 0.25) => {
    const s = state.current;
    if (s.base === next) return;
    const from = actions[s.base];
    const to = actions[next];
    to.reset().setEffectiveWeight(1).fadeIn(t).play();
    from.fadeOut(t);
    s.base = next;
  };

  const oneShot = (clip: Clip) => {
    const s = state.current;
    const a = actions[clip];
    a.reset().setEffectiveWeight(1).fadeIn(0.15).play();
    s.oneShot = clip;
    actions[s.base].fadeOut(0.15);
    const done = () => {
      mixer.removeEventListener("finished", done);
      if (state.current.oneShot !== clip) return;
      state.current.oneShot = null;
      a.fadeOut(0.25);
      actions[state.current.base].reset().fadeIn(0.25).play();
    };
    mixer.addEventListener("finished", done);
  };

  useFrame((_, dt) => {
    const p = player.current;
    const s = state.current;
    const speed = Math.hypot(p.velocity.x, p.velocity.z);
    let base: Clip = p.animation === "run" ? "run" : p.animation === "walk" ? "walk" : "idle";
    if (greet && base === "idle") {
      const g = greet.current.position;
      const near = Math.hypot(g.x - p.position.x, g.z - p.position.z) < 2.6;
      if (near && !s.greeted) {
        s.greeted = true;
        oneShot("wave");
      } else if (!near && Math.hypot(g.x - p.position.x, g.z - p.position.z) > 4) s.greeted = false;
      if (near) base = "talk";
    }
    // A hop: the jump pose once, as the feet leave the ground.
    const air = p.position.y > 0.02;
    if (air && !s.wasAir) oneShot("jump");
    s.wasAir = air;
    if (!s.oneShot) fadeTo(base);
    else s.base = base;
    // Feet keep pace with the ground.
    actions.walk.timeScale = base === "walk" ? Math.min(1.5, Math.max(0.6, speed / 1.5)) : 1;
    actions.run.timeScale = base === "run" ? Math.min(1.3, Math.max(0.8, speed / 5.5)) : 1;
    mixer.update(Math.min(dt, 0.1));
  });

  return <primitive object={root} />;
}
