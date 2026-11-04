import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Group, Matrix4, Quaternion, Vector3 } from "three";
import { PALETTE, type Box2 } from "../game/config/world";
import { std } from "../game/config/materials";
import { isBlocked, pushOutOfBox } from "../game/systems/collision";
import { damp, stepVelocity, stepYaw, yawFromDirection } from "../game/systems/movement";
import RiggedBody, { type BodyControl, type DressRule } from "../game/player/RiggedBody";
import AvatarBoundary from "../game/player/AvatarBoundary";
import { realPerson } from "../game/npc/realCast";
import type { CastId } from "../game/npc/cast";

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

/** One line of a short, real exchange in a room — the "practice the
 * conversation" feature, distinct from the single-word vocab hotspots: a
 * learner sees how those same words actually get used in a back-and-forth,
 * not just in isolation.
 *
 * Re, 4 Nov 2026: this used to always be Adam talking to Lina (or vice
 * versa); now that only one human renders in any World2 scene (see
 * `PlayableAvatar`'s doc comment above), the exchange is between whichever
 * learner the visitor picked ("player") and Cluby — who hints, encourages,
 * and reacts, per his own canon role (`give_hints`, `companion`,
 * `motivation` in klovers-world.ts), never ordering or shopping himself. */
export type DialogueLine = {
  speaker: "player" | "cluby";
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
 * canon character occupies which slot changes.
 *
 * Re, 4 Nov 2026: "student must choose a character and move with one only" —
 * the second human (the stationary `Learner` companion described above) has
 * been removed from the entrance and both rooms entirely, not just made
 * non-walking (it was already stationary; only the keyboard-controlled
 * `Player` ever moved). Now exactly one human renders in any World2 scene —
 * whichever one `playerAvatar` names. Cluby, who's in every room regardless,
 * takes over the companion's old role as the dialogue partner for "Practice
 * the conversation" (see `DialogueLine`'s `speaker` below: `"player" |
 * "cluby"`, not `"adam" | "lina"`) and as who "explains"/reacts to a vocab
 * hotspot click (see `useLearnerReactions`'s `clubyReact` below). This also
 * reads more naturally with canon: Cluby is the one companion present no
 * matter which learner is walking, where the old setup made Lina (say) a
 * mute prop standing next to the camera whenever Adam was the chosen player. */
export type PlayableAvatar = "adam" | "lina";

/** Matches the live game's own `DEFAULT_AVATAR` (characters.ts). */
export const DEFAULT_PLAYER_AVATAR: PlayableAvatar = "adam";

/** The companion standing alongside whoever the learner is playing as.
 * Kept for reference/possible reuse — no longer called anywhere as of
 * 4 Nov 2026 (see the note on `PlayableAvatar` above this one). */
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
  colliders,
  radius = 0.35,
  acceleration = 10,
  deceleration = 12,
  turnRate = 12,
}: {
  bounds: { x: [number, number]; z: [number, number] };
  control: MutableRefObject<BodyControl>;
  speed?: number;
  /** Lets a parent (e.g. a FollowCamera mounted alongside this player) read
   * the same transform this hook drives, instead of creating its own ref
   * that nothing outside this hook could ever see. */
  externalRef?: MutableRefObject<Group | null>;
  /** Re, 4 Nov 2026 ("movement is so bad"): the entrance's new kit scenery
   * (trees, lanterns, the bed, the bench) had no collision at all — the
   * learner could walk straight into a lantern, and the chase camera
   * (sitting just behind them) ended up with the lantern's own geometry
   * between it and everything else, the clipped-through mess Re screenshot.
   * This is the live game's own circle-vs-box player collision
   * (systems/collision.ts's `pushOutOfBox`), reused as-is rather than
   * reinvented — a scene with no solid decor just omits it. */
  colliders?: Box2[];
  /** The learner's own circular footprint, metres — matches the live
   * game's own `PLAYER.radius` (config/world.ts). */
  radius?: number;
  /** Re, 4 Nov 2026 ("why can't you just copy the world1 code"): movement
   * here used to be instant speed with a linear turn lerp — snappy, but not
   * what the live game actually feels like. These three default to the
   * live game's own `PLAYER` tuning (config/world.ts) and drive the exact
   * same velocity/turn maths (systems/movement.ts's `stepVelocity`/
   * `stepYaw`, reused unmodified, not reimplemented) — acceleration and
   * braking instead of an instant stop/start, and a turn that eases instead
   * of snapping to face the new direction. */
  acceleration?: number;
  deceleration?: number;
  turnRate?: number;
}) {
  const internalRef = useRef<Group>(null);
  const g = externalRef ?? internalRef;
  const pressed = useRef<Set<string>>(new Set());
  const velocity = useRef({ x: 0, z: 0 });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (!MOVE_KEYS[key]) return;
      // Re, 4 Nov 2026: with the stage now taller than the window, walking
      // with the arrow keys also scrolled the whole page (the browser's own
      // default for those keys) — the scene jumped away mid-walk. The live
      // game is full-screen so never hit this. Arrow keys only (WASD has no
      // default to cancel), and never while the learner is typing somewhere.
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      if (key.startsWith("arrow")) e.preventDefault();
      pressed.current.add(key);
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
    const len = Math.hypot(dx, dz) || 1;
    const wish = moving ? { x: dx / len, z: dz / len } : { x: 0, z: 0 };
    const dt = Math.min(delta, 0.05); // clamp so a dropped frame can't teleport the player
    // Re, 4 Nov 2026: the live game's own velocity/turn maths
    // (systems/movement.ts), reused unmodified — acceleration and braking
    // instead of an instant stop/start speed, a turn that eases toward the
    // new heading instead of snapping to it.
    velocity.current = stepVelocity(velocity.current, wish, speed, acceleration, deceleration, dt);
    if (velocity.current.x !== 0 || velocity.current.z !== 0) {
      const nx = group.position.x + velocity.current.x * dt;
      const nz = group.position.z + velocity.current.z * dt;
      const p = { x: nx, z: nz };
      if (colliders && colliders.length) {
        // Two passes settle corners where two boxes meet — same as the
        // live game's own `resolveCollisions`.
        for (let pass = 0; pass < 2; pass++) {
          let moved = false;
          for (const b of colliders) if (pushOutOfBox(p, radius, b)) moved = true;
          if (!moved) break;
        }
      }
      group.position.x = Math.min(bounds.x[1], Math.max(bounds.x[0], p.x));
      group.position.z = Math.min(bounds.z[1], Math.max(bounds.z[0], p.z));
    }
    if (moving) {
      const targetRot = yawFromDirection(dx, dz);
      group.rotation.y = stepYaw(group.rotation.y, targetRot, turnRate, dt);
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
 * (getWorldPosition/getWorldQuaternion) rather than local coordinates —
 * originally so it still tracked correctly under World2Page's old
 * "SlowOrbit" idle sway (removed 4 Nov 2026, see World2Page.tsx), kept now
 * because reading world transforms is simply more correct than local ones.
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
  povEyeHeight = 1.6,
  cameraColliders,
}: {
  /** The moving character's own transform (Player's `exposedRef`, or the
   * ref returned directly by usePlayerMovement). */
  target: MutableRefObject<Group | null>;
  control: MutableRefObject<BodyControl>;
  behind?: number;
  height?: number;
  ahead?: number;
  eyeHeight?: number;
  /** Eye height used only in POV mode — see the doc comment on `povMode`
   * above and the fix note on the POV branch below for why this is a
   * separate knob from `eyeHeight` (the chase camera's look-at height). */
  povEyeHeight?: number;
  /** Re, 4 Nov 2026 ("movement is so bad"): the chase camera had no idea the
   * entrance's new scenery (lanterns, trees) existed, so walking past one
   * put its own geometry between the camera and everything else — the
   * clipped-through mess Re screenshot. The live game's own camera avoids
   * exactly this (ThirdPersonCamera.tsx's `cameraBlocked`/`isBlocked`
   * against `CAMERA_COLLIDERS`, i.e. tall props only — low furniture the
   * camera can see over is left out); same idea here, just sampled along
   * the line to the desired spot instead of walled rooms with portals. */
  cameraColliders?: Box2[];
}) {
  const { camera } = useThree();
  const staticPos = useRef(new Vector3());
  const staticQuat = useRef(new Quaternion());
  const capturedStatic = useRef(false);
  const curPos = useRef(new Vector3());
  const curQuat = useRef(new Quaternion());
  // Re, 4 Nov 2026 ("movement is so bad"): the camera used to drop the chase
  // view and snap straight back to this captured opening shot the instant
  // the learner let go of a key — jarring mid-room, and the likely source
  // of half of "so bad". The live game's own camera never does this: once
  // it's following, it keeps following. `everMoved` mirrors that — the
  // opening shot plays once, then the chase camera owns the view for good.
  const everMoved = useRef(false);
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
    if (!pov && control.current.clip === "walk") everMoved.current = true;
    const moving = !pov && everMoved.current && target.current;
    if (pov && target.current) {
      target.current.getWorldPosition(worldPos.current);
      target.current.getWorldQuaternion(worldQuat.current);
      forward.current.set(0, 0, 1).applyQuaternion(worldQuat.current);
      // Re, 4 Nov 2026: two bugs here, found live on production back to
      // back. First, a -0.12 "behind centre" nudge (copied from the live
      // game's POV_EYE recipe, which relies on being *inside* a head mesh
      // whose backfaces are culled — not true of this rig) put the camera
      // inside the hair/face geometry. Widening it to -0.35 cleared the
      // geometry, but that's when the real bug showed: this function's own
      // doc comment above says POV "sits just in front of the character's
      // face... looking the way they're facing" — the *opposite* side from
      // "behind centre" — and the code had never matched that comment. With
      // the camera behind the head looking further out, the character's own
      // skull sat directly on the sightline to the look-ahead point and
      // blocked it: every frame rendered the back of their own head at
      // point-blank range, not an outward view. The fix the comment always
      // described: stand slightly *ahead* of the face (clear of the nose and
      // any hair) and look further along the same forward direction — nothing
      // of their own body is ever in front of their own face, so this can't
      // clip into them from any facing angle, and it reads as seeing what
      // they see rather than seeing them.
      const povAhead = 0.4;
      desiredPos.current.set(
        worldPos.current.x + forward.current.x * povAhead,
        povEyeHeight,
        worldPos.current.z + forward.current.z * povAhead,
      );
      lookAt.current.set(
        desiredPos.current.x + forward.current.x * 3,
        povEyeHeight,
        desiredPos.current.z + forward.current.z * 3,
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
      if (cameraColliders && cameraColliders.length) {
        // Walk the line from the learner out to the full "behind" distance
        // in steps, and stop at the furthest one still clear — the same
        // "back off until clear" idea as the live game's own wall-avoidance,
        // just sampled rather than solved against room portals.
        //
        // Re, 4 Nov 2026: shipped this with the floor at t=0 (right on top
        // of the learner) and a 0.3 pad. Standing flush against a lantern —
        // exactly the collision fix above now lets happen, where before the
        // learner would have slid past it — put the learner's own position
        // inside that padded zone too, so every sample came back "blocked"
        // and the camera collapsed to point-blank, the extreme close-up Re
        // screenshot. A smaller pad (closer to the geometry's own footprint)
        // plus a floor well short of zero means a worst case still frames
        // the learner from a short but usable distance instead of their own
        // collar.
        const hugeBounds = { minX: -1e6, maxX: 1e6, minZ: -1e6, maxZ: 1e6 };
        const steps = 8;
        const minStep = 3; // t=3/8=0.375 of `behind` — the closest the camera will ever sit
        let bestT = minStep / steps;
        for (let i = steps; i >= minStep; i--) {
          const t = i / steps;
          const tx = worldPos.current.x - forward.current.x * behind * t;
          const tz = worldPos.current.z - forward.current.z * behind * t;
          if (!isBlocked(tx, tz, 0.15, cameraColliders, hugeBounds)) {
            bestT = t;
            break;
          }
        }
        desiredPos.current.x = worldPos.current.x - forward.current.x * behind * bestT;
        desiredPos.current.z = worldPos.current.z - forward.current.z * behind * bestT;
      }
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
    const k = damp(pov || moving ? 3.2 : 1.8, dt);
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

/** Muted, varied outfit tones for `BackgroundFigure` — picked to read as
 * "a street/store full of other people", never close to Adam/Lina/Cluby's
 * own canon palette (KLOVERS yellow, ivory) so a background figure is never
 * mistaken for a chosen character at a glance. */
const BG_FIGURE_TONES = ["#5C6B8A", "#8A6B5C", "#6B8A6F", "#8A5C76", "#6E6458"];

/** A generic, unnamed background figure — the "more people" Re asked for
 * (4 Nov 2026: "add more people and tigstures and detailsa") without
 * introducing any named character. CLAUDE.md's story-canon check applies to
 * any new character in a World2 scene: the Story Bible's draft Book-1 cast
 * (Jihoon, Ms. Park, Mr. Kim, Yuna, Seoyeon, Taeyang, Hana) is explicitly
 * scoped to Book 1's "Vocabulary Market" world with its own visual direction
 * "still undecided... must be pinned down before any of them appear in
 * production artwork" — not World2, and not ready either way. A plain,
 * faceless, unnamed silhouette sidesteps that entirely: it reads as "this
 * place has other people in it" the way a crowded street or a late-night
 * store would, purely set dressing, never a speaking or clickable character
 * (no Hotspot, no dialogue, no canon role to conflict with).
 *
 * Deliberately much simpler than RiggedBody's real rig — a handful of
 * primitives, same philosophy as Cluby's own hand-built geometry — since
 * this never needs to walk, talk, or be identified, only to stand there and
 * breathe a little. */
function SimpleFigure({
  x,
  z,
  rotY = 0,
  toneIndex = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  rotY?: number;
  /** Picks a muted outfit tone from `BG_FIGURE_TONES` so a handful of these
   * standing near each other don't look cloned. */
  toneIndex?: number;
  scale?: number;
}) {
  const g = useRef<Group>(null);
  // A random-but-stable phase so several figures don't bob in lockstep.
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useFrame(({ clock }) => {
    if (!g.current) return;
    g.current.position.y = 0.012 * Math.sin(clock.elapsedTime * 1.1 + phase);
    g.current.rotation.y = 0.05 * Math.sin(clock.elapsedTime * 0.35 + phase);
  });
  const tone = BG_FIGURE_TONES[toneIndex % BG_FIGURE_TONES.length];
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]} scale={scale}>
      <group ref={g}>
        {/* legs */}
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.08, 0.095, 0.68, 10]} />
          <meshStandardMaterial color="#2E2E2E" roughness={0.9} />
        </mesh>
        {/* torso, a simple coat/hanbok-adjacent silhouette, never canon dress */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <capsuleGeometry args={[0.155, 0.5, 4, 10]} />
          <meshStandardMaterial color={tone} roughness={0.88} />
        </mesh>
        {/* arms, resting */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.19, 0.78, 0]} rotation={[0, 0, s * 0.12]}>
            <capsuleGeometry args={[0.04, 0.38, 4, 8]} />
            <meshStandardMaterial color={tone} roughness={0.88} />
          </mesh>
        ))}
        {/* head + simple dark hair cap */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.115, 14, 12]} />
          <meshStandardMaterial color="#caa07a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.45, -0.015]} scale={[1, 0.65, 1.02]}>
          <sphereGeometry args={[0.12, 14, 12]} />
          <meshStandardMaterial color="#241b14" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** The roles World1's own extras play (npc/cast.ts) — unnamed, no lines. */
const BG_CASTS: CastId[] = ["shopper", "porter", "student1", "readerB", "auntie", "vendor", "walker", "student2"];

/**
 * Re, 4 Nov 2026 ("i need world 1 quality"): these were faceless capsule
 * dolls. The live game fills its rooms with real rigged people instead —
 * realCast.ts's `realPerson` gives each an own body model, skin, hair,
 * clothes, height and face shape, stable for its id ("every person looks
 * different and Korean", Re's standing ask). Same unnamed extras World1
 * places (shopper, vendor, student…): no name, no line, no story role, so
 * this stays the set dressing the original note above describes. The old
 * primitive figure is kept as what shows while a body downloads (and if
 * one ever fails, via the same AvatarBoundary World1's Npc uses).
 */
export function BackgroundFigure({
  x,
  z,
  rotY = 0,
  toneIndex = 0,
  scale = 1,
}: {
  x: number;
  z: number;
  rotY?: number;
  toneIndex?: number;
  scale?: number;
}) {
  const look = useMemo(
    () => realPerson(BG_CASTS[toneIndex % BG_CASTS.length], `w2-bg-${x.toFixed(2)}-${z.toFixed(2)}`),
    [toneIndex, x, z],
  );
  const control = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const fallback = <SimpleFigure x={x} z={z} rotY={rotY} toneIndex={toneIndex} scale={scale} />;
  return (
    <AvatarBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <group position={[x, 0, z]} rotation={[0, rotY, 0]} scale={scale * look.scale}>
          <RiggedBody model={look.model} rules={look.rules} female={look.female} control={control} head={look.head} face={look.face} />
        </group>
      </Suspense>
    </AvatarBoundary>
  );
}

/** Wraps a clickable prop: a subtle hover highlight (scale pulse) plus a
 * pointer cursor, so it reads as "tap this to learn the word" rather than a
 * hidden easter egg. Shared by every room's clickable props.
 *
 * Re, 4 Nov 2026: tested World2's hotspots live and found them hard to hit —
 * several of the food props (a tray of 0.012-radius skewer sticks, a 0.11m
 * pot) were nearly unclickable by mouse, let alone touch, because the only
 * thing raycast-able was the tiny visual mesh itself. The live /world game's
 * own interactables never have this problem: MarketShop.tsx wraps every
 * clickable item in "an easy target: the thing's whole footprint, invisible"
 * — a generous invisible box sized for a comfortable tap, independent of
 * however small or oddly-shaped the actual prop is. `hitSize`/`hitCenter`
 * bring that exact technique here, defaulting to a reasonable hand-sized
 * box so existing call sites that don't pass one still get some padding. */
export function Hotspot({
  onSelect,
  hitSize = [0.4, 0.4, 0.4],
  hitCenter = [0, 0, 0],
  children,
}: {
  onSelect: () => void;
  /** Size (x, y, z, metres) of the invisible click/tap target placed over
   * the visual prop. Err generous — it's invisible, so it only ever makes
   * the prop easier to hit, never changes how the scene looks. */
  hitSize?: [number, number, number];
  /** Where that invisible box sits, in the same local space as `children` —
   * usually the prop's own centre, since most of these props are small and
   * off to one side of this Hotspot's own origin. */
  hitCenter?: [number, number, number];
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
      <mesh position={hitCenter} visible={false}>
        <boxGeometry args={hitSize} />
        <meshBasicMaterial />
      </mesh>
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
export function Cluby({
  x,
  y = 0,
  z,
  reactRef,
}: {
  x: number;
  y?: number;
  z: number;
  /** Re, 4 Nov 2026: Cluby is now the dialogue/reaction partner everywhere
   * the companion learner used to stand in (see `PlayableAvatar`'s doc
   * comment) — he has no talk/wave animation clips the way RiggedBody's
   * humans do, so instead of a cross-faded clip this is a simple decaying
   * "pulse" added on top of his existing idle bob: set `reactRef.current.
   * pulse = 1` (see `useLearnerReactions`'s `react()` below) for a quick,
   * self-resetting little hop whenever he "speaks" or reacts to a hotspot. */
  reactRef?: MutableRefObject<{ pulse: number }>;
}) {
  const g = useRef<Group>(null);
  useFrame(({ clock }, dt) => {
    if (!g.current) return;
    let hop = 0;
    if (reactRef?.current) {
      reactRef.current.pulse = Math.max(0, reactRef.current.pulse - dt * 2.5);
      hop = reactRef.current.pulse * 0.07;
    }
    g.current.position.y = y + 0.02 * Math.sin(clock.elapsedTime * 1.6) + hop;
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

/** A shared hook: the player's own BodyControl ref, plus Cluby's `reactRef`
 * pulse, plus a `react()` helper that fires both — every room's
 * `handleSelect` calls this instead of re-deriving the same two lines.
 *
 * Re, 4 Nov 2026: this used to also hold a second, "companion" BodyControl
 * (Adam's or Lina's, whichever wasn't the player) so clicking a vocab
 * hotspot could play a "the companion explains it" talk clip. Now that the
 * companion learner is gone from every scene (see `PlayableAvatar`'s doc
 * comment), that role moved to Cluby's `reactRef` pulse instead — the
 * player still gets the same "wave" reaction clip as before. */
export function useLearnerReactions() {
  const playerControl = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const clubyReact = useRef<{ pulse: number }>({ pulse: 0 });
  const react = () => {
    playerControl.current.once = "wave";
    clubyReact.current.pulse = 1;
  };
  return { playerControl, clubyReact, react };
}
