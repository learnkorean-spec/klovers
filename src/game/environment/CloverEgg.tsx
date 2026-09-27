import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ACCENT, MAT, std } from "../config/materials";
import { PALETTE, PROPS } from "../config/world";
import { HATCH, type StoryState } from "../systems/story";
import { REDUCED_MOTION } from "../systems/motion";

/**
 * The clover egg on its plinth in the middle of the courtyard.
 *
 * Canon (originStory): ivory shell, a small green four-leaf clover mark,
 * dormant until real learning wakes it. Phases come from StoryState:
 * - dormant  : perfectly still (guests, and learners whose egg has not
 *              hatched on the dashboard yet)
 * - stirring : Cluby has really hatched but the learner has not seen it here
 *              yet — a small rock now and then, inviting a closer look
 * - hatching : rocks harder, the cap cracks off (≈ 2.3 s), Cluby appears
 * - open     : the two halves of the shell rest in the nest
 * A thin yellow line on the platform is the only accent: navigation, not glow.
 */
const PLINTH_H = 0.5;
const EGG_R = 0.42;
const EGG_Y = PLINTH_H + EGG_R * 1.25;
const SPLIT = Math.PI * 0.42; // where the cap breaks off

export default function CloverEgg({ story }: { story: MutableRefObject<StoryState> }) {
  const { x, z, w } = PROPS.eggPlinth;
  const egg = useRef<Group>(null);
  const cap = useRef<Group>(null);

  useFrame(() => {
    const s = story.current;
    const now = performance.now();
    let rock = 0;
    let capOff = 0; // 0 = on, 1 = lying beside the nest
    if (s.egg === "stirring" && !REDUCED_MOTION) {
      const t = (now % 3200) / 3200;
      rock = t < 0.25 ? Math.sin(t * Math.PI * 16) * 0.05 * (1 - t / 0.25) : 0;
    } else if (s.egg === "hatching") {
      const t = now - s.eggT0;
      const k = Math.min(t / HATCH.crackAt, 1);
      rock = t < HATCH.crackAt ? Math.sin(t / 55) * (0.03 + 0.11 * k) : 0;
      capOff = t < HATCH.crackAt ? 0 : Math.min((t - HATCH.crackAt) / 600, 1);
    } else if (s.egg === "open") {
      capOff = 1;
    }
    if (egg.current) egg.current.rotation.z = rock;
    if (cap.current) {
      const e = 1 - (1 - capOff) ** 3;
      cap.current.position.set(e * 0.62, -e * 0.38 + Math.sin(e * Math.PI) * 0.3, e * 0.25);
      cap.current.rotation.set(e * 0.4, 0, -e * 2.2);
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Octagonal ceremonial platform: warm stone base, dark timber top,
          a thin Klovers-yellow line round the top edge — the room's one
          pointer. It frames the egg rather than overpowering it. */}
      <mesh castShadow receiveShadow position={[0, 0.14, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[w / 2 / Math.cos(Math.PI / 8), w / 2 / Math.cos(Math.PI / 8) + 0.08, 0.28, 8]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.39, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[w / 2 - 0.28, w / 2 - 0.2, 0.22, 8]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, PLINTH_H + 0.004, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 8]}>
        <ringGeometry args={[w / 2 - 0.42, w / 2 - 0.36, 8, 1]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      {/* A low step on the arrival side */}
      <mesh receiveShadow position={[0, 0.07, w / 2 + 0.28]}>
        <boxGeometry args={[1.2, 0.14, 0.4]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh castShadow position={[0, PLINTH_H + 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.07, 10, 32]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
      <group ref={egg} position={[0, PLINTH_H + 0.05, 0]}>
        <group position={[0, EGG_Y - PLINTH_H - 0.05, 0]} scale={[1, 1.3, 1]}>
          {/* Lower shell */}
          <mesh castShadow>
            <sphereGeometry args={[EGG_R, 32, 24, 0, Math.PI * 2, SPLIT, Math.PI - SPLIT]} />
            <primitive object={std(PALETTE.ivory, 0.55)} attach="material" />
          </mesh>
          {/* Cap */}
          <group ref={cap}>
            <mesh castShadow>
              <sphereGeometry args={[EGG_R, 32, 12, 0, Math.PI * 2, 0, SPLIT]} />
              <primitive object={std(PALETTE.ivory, 0.55)} attach="material" />
            </mesh>
          </group>
          {/* Four-leaf clover mark, facing the spawn point (+z) */}
          <group position={[0, -0.02, EGG_R + 0.004]}>
            {[
              [0.035, 0.035],
              [-0.035, 0.035],
              [0.035, -0.035],
              [-0.035, -0.035],
            ].map(([dx, dy], i) => (
              <mesh key={i} position={[dx, dy, 0]}>
                <circleGeometry args={[0.04, 16]} />
                <meshBasicMaterial color={PALETTE.cloverGreen} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  );
}
