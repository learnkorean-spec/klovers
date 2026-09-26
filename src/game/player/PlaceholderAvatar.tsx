import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE, PLAYER } from "../config/world";
import { damp } from "../systems/movement";
import type { PlayerState } from "../systems/state";

interface AvatarProps {
  player: MutableRefObject<PlayerState>;
}

const BODY_RADIUS = 0.3;
const BODY_LENGTH = PLAYER.height - BODY_RADIUS * 2 - 0.25;

/**
 * Placeholder learner: a charcoal capsule with a yellow scarf and a small
 * yellow visor that shows which way it faces. Bob and lean come from the
 * animation state, so the state machine is exercised before a real rig
 * exists. Replace with a GLB avatar taking the same `player` prop.
 */
export default function PlaceholderAvatar({ player }: AvatarProps) {
  const body = useRef<Group>(null);
  const phase = useRef(0);
  const lean = useRef(0);

  useFrame((_, dt) => {
    const p = player.current;
    const speed = Math.hypot(p.velocity.x, p.velocity.z);
    const stride = p.animation === "run" ? 11 : p.animation === "walk" ? 8 : 0;
    phase.current += stride * Math.min(dt, 0.05);

    const bob = p.animation === "idle"
      ? Math.sin(performance.now() / 700) * 0.012 // breathing
      : Math.abs(Math.sin(phase.current)) * (p.animation === "run" ? 0.07 : 0.04);

    const targetLean = Math.min(speed / PLAYER.runSpeed, 1) * 0.12;
    lean.current += (targetLean - lean.current) * damp(8, dt);

    if (body.current) {
      body.current.position.y = bob;
      body.current.rotation.x = lean.current;
    }
  });

  const hip = BODY_RADIUS + 0.02;

  return (
    <group ref={body}>
      <mesh castShadow position={[0, hip + BODY_LENGTH / 2, 0]}>
        <capsuleGeometry args={[BODY_RADIUS, BODY_LENGTH, 6, 16]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.7} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, PLAYER.height - 0.2, 0]}>
        <sphereGeometry args={[0.2, 20, 16]} />
        <meshStandardMaterial color={PALETTE.ivory} roughness={0.8} />
      </mesh>
      {/* Visor — faces +z, the avatar's front */}
      <mesh position={[0, PLAYER.height - 0.19, 0.16]}>
        <boxGeometry args={[0.22, 0.07, 0.08]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.4} />
      </mesh>
      {/* Scarf */}
      <mesh castShadow position={[0, PLAYER.height - 0.44, 0]}>
        <torusGeometry args={[0.24, 0.06, 10, 24]} />
        <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0.1, PLAYER.height - 0.62, 0.24]} rotation={[0.2, 0, 0.1]}>
        <boxGeometry args={[0.12, 0.3, 0.05]} />
        <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
      </mesh>
    </group>
  );
}
