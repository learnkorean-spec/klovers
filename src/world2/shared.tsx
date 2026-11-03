import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Group, Matrix4, Quaternion, Vector3 } from "three";
import { PALETTE } from "../game/config/world";
import { std } from "../game/config/materials";
import RiggedBody, { type BodyControl, type DressRule } from "../game/player/RiggedBody";

/**
 * Shared building blocks for every World2 hackathon room (the street-food
 * cart, the convenience store, and any future one): the real rigged
 * Adam/Lina characters, the clickable-hotspot wrapper, and Cluby. Kept in
 * one place so a second room reuses the exact same characters instead of a
 * copy that could quietly drift from canon (see CLAUDE.md's "check if it
 * already exists" rule — this file exists so the next room doesn't
 * reinvent it).
 */

/** A single clickable vocabulary item a room can teach: the word said in
 * the scene, what it means, and how to say it. */
export type VocabItem = {
  id: string;
  korean: string;
  pronunciation: string;
  arabic: string;
  english: string;
};

/** One line of a short, real exchange between Adam and Lina in a room — the
 * "practice the conversation" feature, distinct from the single-word vocab
 * hotspots: a learner sees how those same words actually get used back and
 * forth between two study companions, not just in isolation. Per canon
 * (CLAUDE.md / klovers-world.ts), Adam and Lina are friends and study
 * companions, never a romantic pair — lines stay practical (ordering,
 * prices, "let's go together"), never romantic. */
export type DialogueLine = {
  speaker: "adam" | "lina";
  korean: string;
  /** Romanized pronunciation guide — the "English reading" of the Korean line. */
  reading: string;
  english: string;
};

/** Speaks a line aloud with the browser's own TTS (ko-KR voice) — no
 * backend, no API key, works everywhere Web Speech is supported. Silently
 * does nothing where it isn't (older Safari/Firefox), rather than erroring.
 * Shared by the vocab flashcard and the dialogue card so both "Hear it"
 * buttons use the exact same voice and rate. */
export function speakKorean(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  } catch {
    // Best-effort: pronunciation audio is a bonus, never block the flashcard on it.
  }
}

/** Which of the two canon learners the visitor is currently walking as —
 * same idea as the live /world game's own `AvatarId`/onboarding picker
 * (src/game/player/characters.ts, src/game/environment/Onboarding.tsx):
 * "the learner picks which one to walk as," the other stands in as a
 * companion. World2 previously hardcoded Adam as the only walkable
 * character with Lina as a fixed companion everywhere — Re, 4 Nov 2026:
 * "the visitor is either lena or adam" (i.e. make this a real choice, the
 * way World1 already does it, not always-Adam). `World2Page` owns the
 * single choice for the whole visit and threads it down as a prop; every
 * scene swaps which character is `Player` (keyboard-controlled, camera
 * target) and which is `Learner` (stationary companion) accordingly — the
 * position/pose "slots" each room already had stay the same, only which
 * canon character occupies which slot changes. */
export type PlayableAvatar = "adam" | "lina";

/** Matches the live game's own `DEFAULT_AVATAR` (characters.ts). */
export const DEFAULT_PLAYER_AVATAR: PlayableAvatar = "adam";

/** The companion standing alongside whoever the learner is playing as. */
export function companionOf(avatar: PlayableAvatar): PlayableAvatar {
  return avatar === "adam" ? "lina" : "adam";
}

/** Canon dress rules, copied from player/RealAvatar.tsx (not exported there). */
export const DRESS: Record<"adam" | "lina", DressRule[]> = {
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
    { match: /HairLong/, color: "#7A3520", contrast: 0.4 },
    { match: /Hair/, color: "#5E2A17", contrast: 0.35 },
  ],
};

/** A learner, standing and talking — same rig the live game uses. Takes its
 * control ref from the parent (instead of owning one) so clicking a vocab
 * hotspot can trigger a one-off reaction animation on both Adam and Lina. */
export function Learner({
  avatar,
  x,
  z,
  rotY,
  control,
}: {
  avatar: "adam" | "lina";
  x: number;
  z: number;
  rotY: number;
  control: MutableRefObject<BodyControl>;
}) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} />
    </group>
  );
}

/** Arrow keys and WASD both move the player, mapped to an [x, z] direction. */
const MOVE_KEYS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

/** The on-screen touch D-pad's current direction (see `TouchPad` below).
 * A plain mutable object, not a ref or React state — `usePlayerMovement`
 * reads it every frame same as the keyboard `pressed` set, and `TouchPad`
 * writes it on pointer events. A module-level singleton is safe here
 * because World2 only ever has one active, keyboard/touch-controlled
 * player on screen at a time (the entrance, the cart, and the store are
 * three *separate* mounts of this hook, never simultaneous). */
export const touchDir = { x: 0, z: 0 };

/** A small on-screen D-pad for touch devices — World2's only movement
 * input was the keyboard (arrow keys / WASD), which simply doesn't exist
 * on a phone or tablet, so a touch-only visitor had no way to walk Adam at
 * all. Shown only when the browser reports a coarse (touch) primary
 * pointer (checked via `matchMedia` in JS, not a Tailwind variant — this
 * Tailwind install (3.4.17) turns out not to ship `pointer-coarse:`/
 * `any-pointer-coarse:` despite the docs for later versions; verified by
 * grepping the installed package for "coarse" and finding nothing) — kept
 * out of the way on desktop, where the keyboard still works exactly as
 * before. Writes directly into `touchDir`; a held button keeps moving
 * every frame, same as a held key. */
export function TouchPad() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setCoarse(mq.matches);
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const set = (x: number, z: number) => {
    touchDir.x = x;
    touchDir.z = z;
  };
  const clear = () => set(0, 0);
  const btn =
    "absolute flex items-center justify-center w-12 h-12 rounded-full bg-[#2E2E2E]/70 text-[#FFF9EC] text-xl select-none touch-none active:bg-[#FFFF00] active:text-[#2E2E2E]";
  if (!coarse) return null;
  return (
    <div className="absolute bottom-3 left-3 w-40 h-40 pointer-events-none">
      <button
        aria-label="Walk up"
        className={`${btn} left-14 top-0 pointer-events-auto`}
        onPointerDown={() => set(0, -1)}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
      >
        ↑
      </button>
      <button
        aria-label="Walk left"
        className={`${btn} left-0 top-14 pointer-events-auto`}
        onPointerDown={() => set(-1, 0)}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
      >
        ←
      </button>
      <button
        aria-label="Walk right"
        className={`${btn} left-28 top-14 pointer-events-auto`}
        onPointerDown={() => set(1, 0)}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
      >
        →
      </button>
      <button
        aria-label="Walk down"
        className={`${btn} left-14 top-28 pointer-events-auto`}
        onPointerDown={() => set(0, 1)}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
      >
        ↓
      </button>
    </div>
  );
}

/** Lets the learner actually walk a character around a room with the
 * keyboard (arrow keys or WASD) — the thing that makes a room read as a game
 * you play rather than a slideshow of click targets. Held keys live in a
 * plain ref (not React state), so movement never triggers a re-render —
 * only the Three.js transform updates, every frame, while a key is down.
 * Returns the group ref to mount the moving body on. */
export function usePlayerMovement({
  bounds,
  control,
  speed = 1.7,
  externalRef,
}: {
  bounds: { x: [number, number]; z: [number, number] };
  control: MutableRefObject<BodyControl>;
  speed?: number;
  /** Lets a parent (e.g. a FollowCamera mounted alongside this player) read
   * the same transform this hook drives, instead of creating its own ref
   * that nothing outside this hook could ever see. */
  externalRef?: MutableRefObject<Group | null>;
}) {
  const internalRef = useRef<Group>(null);
  const g = externalRef ?? internalRef;
  const pressed = useRef<Set<string>>(new Set());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (MOVE_KEYS[key]) pressed.current.add(key);
    };
    const up = (e: KeyboardEvent) => pressed.current.delete(e.key.toLowerCase());
    const clearAll = () => pressed.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearAll);
    // Reset any direction left over from whichever room/player last read
    // this shared singleton (see `touchDir`'s own doc comment).
    touchDir.x = 0;
    touchDir.z = 0;
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearAll);
      touchDir.x = 0;
      touchDir.z = 0;
    };
  }, []);
  useFrame((_, delta) => {
    const group = g.current;
    if (!group) return;
    let dx = touchDir.x;
    let dz = touchDir.z;
    for (const key of pressed.current) {
      const dir = MOVE_KEYS[key];
      if (!dir) continue;
      dx += dir[0];
      dz += dir[1];
    }
    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const len = Math.hypot(dx, dz) || 1;
      const step = speed * Math.min(delta, 0.05); // clamp delta so a dropped frame can't teleport the player
      const nx = group.position.x + (dx / len) * step;
      const nz = group.position.z + (dz / len) * step;
      group.position.x = Math.min(bounds.x[1], Math.max(bounds.x[0], nx));
      group.position.z = Math.min(bounds.z[1], Math.max(bounds.z[0], nz));
      const targetRot = Math.atan2(dx, dz);
      let diff = targetRot - group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      group.rotation.y += diff * Math.min(1, delta * 10);
      if (control.current.clip !== "walk") control.current.clip = "walk";
    } else if (control.current.clip === "walk") {
      control.current.clip = "idle";
    }
  });
  return g;
}

/** A keyboard-controlled learner — same rig as `Learner`, but the player
 * actually drives it around the room with arrow keys / WASD instead of it
 * sitting at a fixed spot. `initial` only sets the starting pose; after that
 * the group's own transform (moved every frame in `usePlayerMovement`) owns
 * position and facing. */
export function Player({
  avatar,
  initial,
  bounds,
  control,
  exposedRef,
}: {
  avatar: "adam" | "lina";
  initial: { x: number; z: number; rotY: number };
  bounds: { x: [number, number]; z: [number, number] };
  control: MutableRefObject<BodyControl>;
  /** Optional: a ref a FollowCamera (or anything else outside this
   * component) can read this player's live transform from. */
  exposedRef?: MutableRefObject<Group | null>;
}) {
  const g = usePlayerMovement({ bounds, control, externalRef: exposedRef });
  return (
    <group ref={g} position={[initial.x, 0, initial.z]} rotation={[0, initial.rotY, 0]}>
      <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} />
    </group>
  );
}

/** A lightweight third-person follow camera for a World2 room — built from
 * scratch for this hackathon diorama rather than reusing the live game's
 * own ThirdPersonCamera (src/game/camera/ThirdPersonCamera.tsx), which
 * turned out to be tightly coupled to World1's own PlayerState/CameraState/
 * RoomLayout and wall-collision system; porting it would mean building an
 * equivalent room-layout/collider model for every World2 room just to drive
 * a camera, real work with no reuse payoff for a two-room tech demo.
 *
 * Behaviour: each room's existing static establishing shot (the
 * `cameraPosition`/`cameraFov` already set on its <Canvas>) is captured,
 * live, the first frame this mounts — so it always matches whatever that
 * room already had, no duplicated numbers to keep in sync. While the
 * learner is standing still, the camera eases back to exactly that shot.
 * While they're walking (driven off the same BodyControl the movement rig
 * already flips to "walk"), it eases into a chase position behind and
 * slightly above them, looking a little ahead of their facing direction —
 * reading their world position/rotation through Three's own world-matrix
 * (getWorldPosition/getWorldQuaternion) rather than local coordinates, so
 * it tracks correctly even with World2Page's own SlowOrbit gently swaying
 * the room around them.
 *
 * Re also asked for a "character POV" view, separate from this chase
 * camera: a `povMode` toggle (World2Page.tsx renders the button; mirrors
 * the `touchDir` singleton above for the same reason — only one player/
 * camera is ever active across the entrance/cart/store at a time, so a
 * module-level flag is safe and avoids threading a prop through all three
 * Scene components just for this). When it's on, `FollowCamera` ignores
 * the walk/idle chase-vs-static logic entirely and instead sits just in
 * front of the character's face at eye height, looking the way they're
 * facing — an approximation of first-person rather than a literal
 * in-the-skull camera (which would clip into their own head/hair mesh;
 * RiggedBody has no "hide for this viewer" toggle to port here safely
 * this close to the deadline), but it reads as "seeing through their
 * eyes" for a demo. */
export const povMode = { firstPerson: false };

const UP = new Vector3(0, 1, 0);

export function FollowCamera({
  target,
  control,
  behind = 2.4,
  height = 1.75,
  ahead = 1.0,
  eyeHeight = 1.05,
}: {
  /** The moving character's own transform (Player's `exposedRef`, or the
   * ref returned directly by usePlayerMovement). */
  target: MutableRefObject<Group | null>;
  control: MutableRefObject<BodyControl>;
  behind?: number;
  height?: number;
  ahead?: number;
  eyeHeight?: number;
}) {
  const { camera } = useThree();
  const staticPos = useRef(new Vector3());
  const staticQuat = useRef(new Quaternion());
  const capturedStatic = useRef(false);
  const curPos = useRef(new Vector3());
  const curQuat = useRef(new Quaternion());
  // Scratch objects, reused every frame in the "moving" branch only — not
  // on the far more common idle path, where nothing new is allocated.
  const worldPos = useRef(new Vector3());
  const worldQuat = useRef(new Quaternion());
  const forward = useRef(new Vector3());
  const desiredPos = useRef(new Vector3());
  const lookAt = useRef(new Vector3());
  const lookMatrix = useRef(new Matrix4());
  const desiredQuat = useRef(new Quaternion());

  useFrame((_, rawDt) => {
    if (!capturedStatic.current) {
      staticPos.current.copy(camera.position);
      staticQuat.current.copy(camera.quaternion);
      curPos.current.copy(camera.position);
      curQuat.current.copy(camera.quaternion);
      capturedStatic.current = true;
    }
    const dt = Math.min(rawDt, 0.05);
    const pov = povMode.firstPerson && target.current;
    const moving = !pov && control.current.clip === "walk" && target.current;
    if (pov && target.current) {
      target.current.getWorldPosition(worldPos.current);
      target.current.getWorldQuaternion(worldQuat.current);
      forward.current.set(0, 0, 1).applyQuaternion(worldQuat.current);
      // Just in front of the face, not literally at it — see this
      // function's doc comment on why this is an approximation.
      desiredPos.current.set(
        worldPos.current.x + forward.current.x * 0.15,
        eyeHeight,
        worldPos.current.z + forward.current.z * 0.15,
      );
      lookAt.current.set(
        worldPos.current.x + forward.current.x * 3,
        eyeHeight,
        worldPos.current.z + forward.current.z * 3,
      );
      lookMatrix.current.lookAt(desiredPos.current, lookAt.current, UP);
      desiredQuat.current.setFromRotationMatrix(lookMatrix.current);
    } else if (moving && target.current) {
      target.current.getWorldPosition(worldPos.current);
      target.current.getWorldQuaternion(worldQuat.current);
      // The player's own forward convention is local +Z (see
      // usePlayerMovement's atan2(dx, dz)), not Three's usual -Z.
      forward.current.set(0, 0, 1).applyQuaternion(worldQuat.current);
      desiredPos.current.set(
        worldPos.current.x - forward.current.x * behind,
        height,
        worldPos.current.z - forward.current.z * behind,
      );
      lookAt.current.set(
        worldPos.current.x + forward.current.x * ahead,
        eyeHeight,
        worldPos.current.z + forward.current.z * ahead,
      );
      lookMatrix.current.lookAt(desiredPos.current, lookAt.current, UP);
      desiredQuat.current.setFromRotationMatrix(lookMatrix.current);
    } else {
      desiredPos.current.copy(staticPos.current);
      desiredQuat.current.copy(staticQuat.current);
    }
    const k = 1 - Math.exp(-(pov || moving ? 3.2 : 1.8) * dt);
    curPos.current.lerp(desiredPos.current, k);
    curQuat.current.slerp(desiredQuat.current, k);
    camera.position.copy(curPos.current);
    camera.quaternion.copy(curQuat.current);
  }, -1);

  return null;
}

/** Shown while Adam/Lina's real models (≈1.3MB each) are still downloading,
 * so the scene never looks broken or empty during the first load. */
export function LearnerPlaceholder({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.22, 1.1, 4, 8]} />
        <meshStandardMaterial color="#FFF9EC" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/** Wraps a clickable prop: a subtle hover highlight (scale pulse) plus a
 * pointer cursor, so it reads as "tap this to learn the word" rather than a
 * hidden easter egg. Shared by every room's clickable props. */
export function Hotspot({
  onSelect,
  children,
}: {
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  const g = useRef<Group>(null);
  useFrame(() => {
    if (!g.current) return;
    const target = hovered ? 1.08 : 1;
    const s = g.current.scale.x + (target - g.current.scale.x) * 0.25;
    g.current.scale.setScalar(s);
  });
  return (
    <group
      ref={g}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
}

/** Cluby's own canon colours (same literal hex values as the live /world
 * game's src/game/player/Cluby.tsx — kept as local constants here rather
 * than imported, since that file's export also drags in the live game's
 * player/story/collision systems this static diorama doesn't have). */
const CLUBY_MINT = "#9FDDBE";
const CLUBY_BUTTER = "#F3D46A";
const CLUBY_PINK = "#F4B3C2";
const CLUBY_EYES = "#4A2E1F";

/** Cluby — reuses the live /world game's own canon geometry (body, ivory
 * hanbok top with its ribbon tie, Klovers-yellow wrap skirt with the trim
 * ring and four-leaf clover, pointed ears with pink insides, horns, fangs,
 * tail) copied mesh-for-mesh from src/game/player/Cluby.tsx, instead of
 * World2's own earlier simplified stand-in (Re, 3 Nov 2026: "why not use
 * the same Cluby in world 1?" — turns out we can, almost verbatim).
 *
 * What's deliberately NOT reused: the live game's useFrame logic (follow-
 * the-learner movement, emerge-from-egg, pointing/guiding, hiding) — that's
 * all driven by World1's own `story`/`player`/`layout` state, which this
 * hackathon diorama doesn't have and doesn't need. Cluby just sits in place
 * here, with the same gentle idle bob World2 already had. Still built from
 * primitive Three.js geometry, same as World1 — there is no Cluby GLB
 * anywhere in the repo (confirmed), so this isn't a downgrade from "the
 * real one," it IS the real one's shape, just standing still. */
export function Cluby({ x, y = 0, z }: { x: number; y?: number; z: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = y + 0.02 * Math.sin(clock.elapsedTime * 1.6);
  });
  const mint = std(CLUBY_MINT, 0.95);
  const m = (o: ReturnType<typeof std>) => <primitive object={o} attach="material" />;
  return (
    <group position={[x, 0, z]}>
      <group ref={g}>
        {/* Feet */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.07, 0.04, 0.04]} scale={[1, 0.6, 1.3]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            {m(mint)}
          </mesh>
        ))}
        {/* Plush body */}
        <mesh castShadow position={[0, 0.24, 0]} scale={[1, 1.1, 0.95]}>
          <sphereGeometry args={[0.17, 18, 14]} />
          {m(mint)}
        </mesh>
        {/* Ivory mini-hanbok top (jeogori) with a collar band and a yellow
            ribbon tie (goreum). */}
        <mesh castShadow position={[0, 0.24, 0]} scale={[1, 1.1, 0.95]}>
          <sphereGeometry args={[0.176, 20, 12, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.26]} />
          {m(std(PALETTE.ivory, 0.95))}
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.04, 0.315, 0.152]} rotation={[-0.35, 0, -sd * 0.55]}>
            <boxGeometry args={[0.022, 0.11, 0.012]} />
            {m(std("#E9E1CF", 0.9))}
          </mesh>
        ))}
        <mesh position={[0.035, 0.27, 0.17]} rotation={[0.1, 0, -0.35]}>
          <boxGeometry args={[0.018, 0.075, 0.01]} />
          {m(std(PALETTE.yellow, 0.8))}
        </mesh>
        {/* Klovers-yellow wrap skirt (chima) with the green four-leaf
            clover on the front. */}
        <mesh castShadow position={[0, 0.125, 0]} scale={[1, 1, 0.92]}>
          <cylinderGeometry args={[0.168, 0.205, 0.17, 22, 1, true]} />
          {m(std(PALETTE.yellow, 0.85))}
        </mesh>
        <mesh position={[0, 0.205, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]}>
          <torusGeometry args={[0.168, 0.012, 6, 24]} />
          {m(std(PALETTE.yellow, 0.85))}
        </mesh>
        {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
          <mesh key={i} position={[sx * 0.015, 0.12 + sy * 0.015, 0.194]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <meshBasicMaterial color={PALETTE.cloverGreen} toneMapped={false} />
          </mesh>
        ))}
        {/* Arms, resting (World1's right-arm "point the way" rig isn't
            needed here — Cluby never guides in this static diorama). */}
        <group position={[-0.17, 0.3, 0]} rotation={[0, 0, 0.6]}>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
            {m(mint)}
          </mesh>
        </group>
        <group position={[0.17, 0.3, 0]} rotation={[0, 0, -0.6]}>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
            {m(mint)}
          </mesh>
        </group>
        {/* Head */}
        <group position={[0, 0.5, 0]}>
          <mesh castShadow scale={[1.05, 0.95, 1]}>
            <sphereGeometry args={[0.17, 20, 16]} />
            {m(mint)}
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              {/* Warm brown eyes with a small light */}
              <mesh position={[s * 0.062, 0.02, 0.145]}>
                <sphereGeometry args={[0.03, 12, 10]} />
                {m(std(CLUBY_EYES, 0.3))}
              </mesh>
              <mesh position={[s * 0.055, 0.035, 0.173]}>
                <sphereGeometry args={[0.009, 6, 4]} />
                <meshBasicMaterial color={PALETTE.white} />
              </mesh>
              {/* Rose cheeks */}
              <mesh position={[s * 0.105, -0.03, 0.13]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.026, 8, 6]} />
                {m(std(CLUBY_PINK, 0.9))}
              </mesh>
              {/* Two short butter-yellow horns */}
              <mesh position={[s * 0.07, 0.16, 0.02]} rotation={[0, 0, -s * 0.35]}>
                <coneGeometry args={[0.03, 0.09, 10]} />
                {m(std(CLUBY_BUTTER, 0.7))}
              </mesh>
              {/* Pointed ears, pink inside */}
              <group position={[s * 0.16, 0.06, 0]} rotation={[0, 0, -s * 1.15]}>
                <mesh>
                  <coneGeometry args={[0.05, 0.13, 10]} />
                  {m(mint)}
                </mesh>
                <mesh position={[0, -0.005, 0.018]} scale={[0.65, 0.8, 0.4]}>
                  <coneGeometry args={[0.05, 0.13, 10]} />
                  {m(std(CLUBY_PINK, 0.9))}
                </mesh>
              </group>
              {/* Small fangs */}
              <mesh position={[s * 0.013, -0.057, 0.158]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.007, 0.018, 6]} />
                <meshBasicMaterial color={PALETTE.white} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.045, 0.16]}>
            <boxGeometry args={[0.04, 0.008, 0.008]} />
            {m(std(CLUBY_EYES, 0.5))}
          </mesh>
        </group>
        {/* Short spiky tail */}
        <group position={[0, 0.14, -0.17]} rotation={[-1.9, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.05, 0.16, 10]} />
            {m(mint)}
          </mesh>
          {[0.02, -0.03].map((yy, i) => (
            <mesh key={i} position={[0, yy, 0.04]} rotation={[0.9, 0, 0]}>
              <coneGeometry args={[0.018, 0.04, 6]} />
              {m(mint)}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** A shared hook: two BodyControl refs (Adam, Lina) plus a `react(vocab)`
 * helper that plays the companion's "explains it" / the player's "reacts"
 * one-off animations, cross-fading back to idle automatically once the clip
 * finishes (see RiggedBody's own `once` handling) — every room's
 * handleSelect calls this instead of re-deriving the same two lines.
 *
 * Which control is "the player's" vs "the companion's" depends on
 * `playerAvatar` (defaults to Adam, matching the live game's own
 * DEFAULT_AVATAR) — the controls themselves stay keyed by character
 * (adamControl always drives Adam's rig) since that's what RiggedBody
 * needs; `playerControl`/`companionControl` are just the two named by role
 * instead, for call sites that don't care which specific character is
 * walking. */
export function useLearnerReactions(playerAvatar: PlayableAvatar = DEFAULT_PLAYER_AVATAR) {
  const adamControl = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const linaControl = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const playerControl = playerAvatar === "adam" ? adamControl : linaControl;
  const companionControl = playerAvatar === "adam" ? linaControl : adamControl;
  const react = () => {
    companionControl.current.once = "talk";
    playerControl.current.once = "wave";
  };
  return { adamControl, linaControl, playerControl, companionControl, react };
}
