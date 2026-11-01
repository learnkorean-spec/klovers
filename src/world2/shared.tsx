import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE } from "../game/config/world";
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
}: {
  bounds: { x: [number, number]; z: [number, number] };
  control: MutableRefObject<BodyControl>;
  speed?: number;
}) {
  const g = useRef<Group>(null);
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
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearAll);
    };
  }, []);
  useFrame((_, delta) => {
    const group = g.current;
    if (!group) return;
    let dx = 0;
    let dz = 0;
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
}: {
  avatar: "adam" | "lina";
  initial: { x: number; z: number; rotY: number };
  bounds: { x: [number, number]; z: [number, number] };
  control: MutableRefObject<BodyControl>;
}) {
  const g = usePlayerMovement({ bounds, control });
  return (
    <group ref={g} position={[initial.x, 0, initial.z]} rotation={[0, initial.rotY, 0]}>
      <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} />
    </group>
  );
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

/** Cluby, built from simple primitives matching the canon description exactly
 * (mint green plush, two short butter-yellow horns, pink inner ears, rosy
 * cheeks, ivory hanbok top, yellow wrap skirt, green clover emblem) — there
 * is no Cluby GLB yet, so this is a faithful low-poly stand-in, not an
 * invented character. Shared by every room Cluby appears in. */
export function Cluby({ x, y = 0, z }: { x: number; y?: number; z: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = y + 0.02 * Math.sin(clock.elapsedTime * 1.6);
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={g}>
        {/* body */}
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.28, 24, 20]} />
          <meshStandardMaterial color="#8FD6B4" roughness={0.9} />
        </mesh>
        {/* ivory hanbok top */}
        <mesh position={[0, 0.22, 0]}>
          <sphereGeometry args={[0.24, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FFF9EC" roughness={0.8} />
        </mesh>
        {/* yellow wrap skirt */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.14, 20]} />
          <meshStandardMaterial color="#FFFF00" roughness={0.7} />
        </mesh>
        {/* head */}
        <mesh position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.2, 24, 20]} />
          <meshStandardMaterial color="#8FD6B4" roughness={0.9} />
        </mesh>
        {/* rosy cheeks */}
        {[-0.1, 0.1].map((dx) => (
          <mesh key={dx} position={[dx, 0.55, 0.17]}>
            <circleGeometry args={[0.035, 12]} />
            <meshStandardMaterial color="#F8B4B4" />
          </mesh>
        ))}
        {/* horns */}
        {[-0.08, 0.08].map((dx) => (
          <mesh key={dx} position={[dx, 0.76, 0]} rotation={[0, 0, dx > 0 ? -0.3 : 0.3]}>
            <coneGeometry args={[0.03, 0.1, 10]} />
            <meshStandardMaterial color="#FFD24C" roughness={0.5} />
          </mesh>
        ))}
        {/* clover emblem */}
        <mesh position={[0, 0.24, 0.23]}>
          <circleGeometry args={[0.04, 12]} />
          <meshStandardMaterial color="#2E7D4F" />
        </mesh>
      </group>
    </group>
  );
}

/** A shared hook: two BodyControl refs (Adam, Lina) plus a `react(vocab)`
 * helper that plays Lina "explains it" / Adam "reacts" one-off animations,
 * cross-fading back to idle automatically once the clip finishes (see
 * RiggedBody's own `once` handling) — every room's handleSelect calls this
 * instead of re-deriving the same two lines. */
export function useLearnerReactions() {
  const adamControl = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const linaControl = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const react = () => {
    linaControl.current.once = "talk";
    adamControl.current.once = "wave";
  };
  return { adamControl, linaControl, react };
}
