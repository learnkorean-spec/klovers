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
  // "idle" reads naturally in a frozen frame; "talk" mid-gesture looked like
  // reaching for the props on the counter.
  const control = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} />
    </group>
  );
}

/** Shown while Adam/Lina's real models (≈1.3MB each) are still downloading,
 * so the scene never looks broken or empty during the first load. */
function LearnerPlaceholder({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.22, 1.1, 4, 8]} />
        <meshStandardMaterial color="#FFF9EC" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/** Cluby, built from simple primitives matching the canon description exactly
 * (mint green plush, two short butter-yellow horns, pink inner ears, rosy
 * cheeks, ivory hanbok top, yellow wrap skirt, green clover emblem) — there
 * is no Cluby GLB yet, so this is a faithful low-poly stand-in, not an
 * invented character. */
function Cluby({ x, y = 0, z }: { x: number; y?: number; z: number }) {
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

/** The alley backdrop: a single wide, curved-feeling wall of hanok storefronts
 * directly behind the cart, close enough and wide enough to stay in frame
 * through the camera's gentle orbit (unlike scattered background props,
 * which can swing out of a narrow FOV) — gives the cart somewhere to stand
 * instead of a void, echoing the alley in the Meta concept image above it. */
function Alley() {
  const windowXs = useMemo(() => [-2.6, -1.9, -1.2, 1.2, 1.9, 2.6], []);
  return (
    <group position={[0, 0, -2.2]}>
      {/* dusk sky, well back and wide so it fills the frame at any orbit angle */}
      <mesh position={[0, 3, -4]}>
        <planeGeometry args={[26, 10]} />
        <meshBasicMaterial color="#2f2a3d" />
      </mesh>
      {/* storefront wall directly behind the cart */}
      <mesh position={[0, 1.4, 0]} receiveShadow>
        <boxGeometry args={[9, 2.8, 0.4]} />
        <meshStandardMaterial color="#2a2019" roughness={0.9} />
      </mesh>
      {/* roofline: a long low ridge along the top of the wall */}
      <mesh position={[0, 2.95, 0.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[9.4, 0.3, 0.9]} />
        <meshStandardMaterial color="#1a130f" roughness={0.9} />
      </mesh>
      {/* a row of warm, lit storefront windows, each with a thin dark frame so
          they read as windows rather than flat glowing cards */}
      {windowXs.map((x) => (
        <group key={x} position={[x, 1.45, 0.21]}>
          <mesh>
            <planeGeometry args={[0.42, 0.6]} />
            <meshStandardMaterial color="#1a130f" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.34, 0.5]} />
            <meshStandardMaterial color="#FFD98A" emissive="#FFB23C" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
      {/* soft glow from the storefronts, picking out the characters' silhouettes against the wall */}
      {[-2.2, 2.2].map((x) => (
        <pointLight key={x} position={[x, 1.8, 1.2]} intensity={0.5} color="#FFB84D" distance={4} />
      ))}
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
      {/* skewers tray (어묵): a wooden tray of upright skewer sticks, set
          toward the back-centre of the counter, clear of where the
          characters' hands rest. */}
      <group position={[-0.15, 1.05, -0.12]}>
        <mesh>
          <boxGeometry args={[0.38, 0.03, 0.22]} />
          <meshStandardMaterial color="#d9a441" roughness={0.6} />
        </mesh>
        {[-0.12, -0.04, 0.04, 0.12].map((sx) => (
          <mesh key={sx} position={[sx, 0.09, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
            <meshStandardMaterial color="#f0c24a" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* tteokbokki pot (떡볶이): a shallow bowl, red sauce visible. */}
      <group position={[0.25, 1.05, -0.12]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.11, 0.08, 24]} />
          <meshStandardMaterial color="#5a4a3a" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
          <meshStandardMaterial color="#c43b2e" roughness={0.4} />
        </mesh>
      </group>
      {/* kimbap tray (김밥): a few dark rice-roll cylinders lying on a board. */}
      <group position={[0.45, 1.04, -0.12]}>
        <mesh>
          <boxGeometry args={[0.26, 0.02, 0.18]} />
          <meshStandardMaterial color="#1f1f1f" roughness={0.4} />
        </mesh>
        {[-0.08, 0, 0.08].map((sx) => (
          <mesh key={sx} position={[sx, 0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
            <meshStandardMaterial color="#2a2a1a" roughness={0.5} />
          </mesh>
        ))}
      </group>
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
      {/* three stools, tucked under the counter's overhang — set back from
          where Adam and Lina stand (z 1.1) so nothing clips their legs */}
      {[-1.1, -0.3, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.25, 1.5]} castShadow>
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
      {/* light dusk haze, far enough out that it only softens the alley wall,
          not the cart or characters in the foreground */}
      <fog attach="fog" args={["#2a2438", 7, 16]} />
      <ambientLight intensity={0.8} color="#FFF0DD" />
      <directionalLight position={[3, 5, 2.5]} intensity={1.7} color="#FFE7B0" castShadow />
      <pointLight position={[0, 2.1, 0.3]} intensity={0.9} color="#FFD24C" distance={4.5} />
      <Alley />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#3a2f24" roughness={0.95} />
      </mesh>
      <FoodCart />
      <Suspense
        fallback={
          <>
            <LearnerPlaceholder x={-0.6} z={1.1} />
            <LearnerPlaceholder x={0.5} z={1.1} />
          </>
        }
      >
        {/* Adam ordering at the counter, angled toward camera and Lina */}
        <Learner avatar="adam" x={-0.6} z={1.1} rotY={Math.PI * 0.8} />
        {/* Lina beside him, pointing at the menu */}
        <Learner avatar="lina" x={0.5} z={1.1} rotY={Math.PI * 0.65} />
      </Suspense>
      {/* Cluby sitting on its own stool (the one at x=1.1, z=1.5), raised to
          seat height so it reads as sitting rather than floating. */}
      <Cluby x={1.1} y={0.5} z={1.4} />
    </group>
  );
}
