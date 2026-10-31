import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE } from "../game/config/world";
import RiggedBody, { type BodyControl, type DressRule } from "../game/player/RiggedBody";

/**
 * KLOVERS World 2 — hackathon tech-demo scene: a Korean street-food cart at
 * dusk (포장마차), the room Meta's Muse Image/Spark designed in AI Room Lab.
 *
 * Deliberately isolated from src/game/* room logic (no production progression
 * or story-canon gating touched), but reuses the game's own RiggedBody
 * component for Adam and Lina — the same rigged, dyed, real-animation
 * characters the live KLOVERS World uses — rather than a crude standalone
 * GLB loader, so they stay pixel-for-pixel the same Adam and Lina.
 *
 * Palette: ivory #FFF9EC, KLOVERS yellow #FFFF00, charcoal #2E2E2E.
 */

/** Canon dress rules, copied from player/RealAvatar.tsx (not exported there). */
const DRESS: Record<"adam" | "lina", DressRule[]> = {
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

/** A learner, standing and talking at the cart — same rig the live game uses. */
function Learner({ avatar, x, z, rotY }: { avatar: "adam" | "lina"; x: number; z: number; rotY: number }) {
  const control = useRef<BodyControl>({ clip: "talk", once: null, rate: 1 });
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} />
    </group>
  );
}

/** Cluby, built from simple primitives matching the canon description exactly
 * (mint green plush, two short butter-yellow horns, pink inner ears, rosy
 * cheeks, ivory hanbok top, yellow wrap skirt, green clover emblem) — there
 * is no Cluby GLB yet, so this is a faithful low-poly stand-in, not an
 * invented character. */
function Cluby({ x, z }: { x: number; z: number }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = 0.02 * Math.sin(clock.elapsedTime * 1.6);
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

/** The food cart itself: wooden counter, fabric awning on poles, hanging lights, a hand-drawn menu board. */
function FoodCart() {
  const lights = useMemo(() => [-0.8, -0.3, 0.3, 0.8].map((x) => ({ x, y: 2.05 + 0.04 * Math.sin(x * 5), z: 0 })), []);
  return (
    <group>
      {/* counter */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.0, 0.6]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[2.3, 0.05, 0.65]} />
        <meshStandardMaterial color="#6b4423" roughness={0.8} />
      </mesh>
      {/* skewers tray (어묵) */}
      <mesh position={[-0.6, 1.08, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.3]} />
        <meshStandardMaterial color="#d9a441" roughness={0.6} />
      </mesh>
      {/* tteokbokki pot (떡볶이) */}
      <mesh position={[0.1, 1.1, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 20]} />
        <meshStandardMaterial color="#c43b2e" roughness={0.5} />
      </mesh>
      {/* kimbap tray (김밥) */}
      <mesh position={[0.7, 1.07, 0]}>
        <boxGeometry args={[0.4, 0.04, 0.22]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.4} />
      </mesh>
      {/* awning poles */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.4]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
          <meshStandardMaterial color="#2E2E2E" roughness={0.6} />
        </mesh>
      ))}
      {/* fabric awning */}
      <mesh position={[0, 2.3, -0.2]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[2.6, 0.06, 1.4]} />
        <meshStandardMaterial color="#FFF9EC" roughness={0.9} />
      </mesh>
      {/* menu board */}
      <mesh position={[-1.3, 1.3, -0.2]} rotation={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.04]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      {/* three stools */}
      {[-0.9, 0, 0.9].map((x) => (
        <mesh key={x} position={[x, 0.25, 0.7]} castShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.5, 16]} />
          <meshStandardMaterial color="#6b4423" roughness={0.8} />
        </mesh>
      ))}
      {/* hanging lights */}
      {lights.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]}>
          <sphereGeometry args={[0.04, 12, 10]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFD24C" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function World2Scene() {
  return (
    <group>
      <ambientLight intensity={0.55} color="#FFF3DD" />
      <directionalLight position={[3, 5, 2]} intensity={1.1} color="#FFE7B0" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#2E2E2E" roughness={0.95} />
      </mesh>
      <FoodCart />
      <Suspense fallback={null}>
        {/* Adam ordering at the counter */}
        <Learner avatar="adam" x={-0.6} z={1.1} rotY={Math.PI} />
        {/* Lina pointing at the menu */}
        <Learner avatar="lina" x={0.5} z={1.1} rotY={Math.PI - 0.3} />
      </Suspense>
      {/* Cluby sitting on the stool beside them */}
      <Cluby x={0.9} z={0.75} />
    </group>
  );
}
