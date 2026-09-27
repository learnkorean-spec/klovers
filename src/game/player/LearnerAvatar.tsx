import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { std } from "../config/materials";
import { PALETTE, PLAYER } from "../config/world";
import { damp } from "../systems/movement";
import type { PlayerState } from "../systems/state";
import { AVATARS, type AvatarId, type AvatarLook } from "./characters";

interface AvatarProps {
  player: MutableRefObject<PlayerState>;
  avatar: AvatarId;
}

/* Body proportions (metres, feet at y = 0, front is +z). */
const HIP_Y = 0.92;
const SHOULDER_Y = 1.43;
const HEAD_Y = 1.66;
const HEAD_R = 0.13;
/** Radians of stride per metre travelled — keeps feet from sliding. */
const STRIDE_PER_METRE = 1.9;

/**
 * Adam or Lina, built from simple shapes to the canon look. Arms and legs
 * swing with real speed (walk / run), the body leans into a run and breathes
 * at rest. A rigged GLB can replace this later with the same props.
 */
export default function LearnerAvatar({ player, avatar }: AvatarProps) {
  const look = AVATARS[avatar];
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const skirt = useRef<Group>(null);
  const phase = useRef(0);
  const amp = useRef(0);
  const lean = useRef(0);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = player.current;
    const speed = Math.hypot(p.velocity.x, p.velocity.z);
    const moving = p.animation === "walk" || p.animation === "run";
    const run01 = Math.min(speed / PLAYER.runSpeed, 1);

    phase.current += speed * STRIDE_PER_METRE * dt;
    const targetAmp = moving ? 0.25 + 0.5 * run01 : 0;
    amp.current += (targetAmp - amp.current) * damp(10, dt);
    lean.current += (run01 * 0.14 - lean.current) * damp(8, dt);

    const s = Math.sin(phase.current);
    const legSwing = s * amp.current;
    const armSwing = s * amp.current * 0.85;

    if (legL.current) legL.current.rotation.x = legSwing;
    if (legR.current) legR.current.rotation.x = -legSwing;
    if (armL.current) armL.current.rotation.x = -armSwing;
    if (armR.current) armR.current.rotation.x = armSwing;
    if (skirt.current) skirt.current.rotation.z = s * amp.current * 0.06;

    if (body.current) {
      const bob = moving
        ? Math.abs(Math.cos(phase.current)) * (p.animation === "run" ? 0.05 : 0.03)
        : Math.sin(performance.now() / 800) * 0.008; // breathing
      body.current.position.y = bob;
      body.current.rotation.x = lean.current;
    }
  });

  return (
    <group ref={body}>
      <Legs look={look} left={legL} right={legR} />
      <Torso look={look} skirt={skirt} />
      <Arm look={look} side={-1} group={armL} />
      <Arm look={look} side={1} group={armR} />
      <Head look={look} />
    </group>
  );
}

/** Shared, cached material per colour/finish (see config/materials.ts). */
function Mat({ color, rough = 0.8 }: { color: string; rough?: number }) {
  return <primitive object={std(color, rough)} attach="material" />;
}

function Legs({ look, left, right }: { look: AvatarLook; left: MutableRefObject<Group | null>; right: MutableRefObject<Group | null> }) {
  const trousers = look.lower.kind === "trousers";
  const legColor = trousers ? look.lower.color : look.skin;
  const r = trousers ? 0.082 : 0.062;
  return (
    <>
      {([-1, 1] as const).map((side) => (
        <group key={side} ref={side < 0 ? left : right} position={[side * 0.1, HIP_Y, 0]}>
          <mesh castShadow position={[0, -0.45, 0]}>
            <capsuleGeometry args={[r, 0.74, 4, 12]} />
            <Mat color={legColor} />
          </mesh>
          {/* Shoe: Adam's white sneakers, Lina's ivory flats */}
          <mesh castShadow position={[0, -HIP_Y + 0.05, 0.05]}>
            <boxGeometry args={[0.12, trousers ? 0.1 : 0.07, 0.27]} />
            <Mat color={look.shoes} rough={0.6} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Torso({ look, skirt }: { look: AvatarLook; skirt: MutableRefObject<Group | null> }) {
  if (look.lower.kind === "trousers") {
    // Tailored yellow blazer over an ivory tee.
    return (
      <group>
        {/* Tapered jacket body, rounded across the shoulders */}
        <mesh castShadow position={[0, 1.14, 0]} scale={[1, 1, 0.62]}>
          <cylinderGeometry args={[0.22, 0.2, 0.62, 20]} />
          <Mat color={look.top} />
        </mesh>
        <mesh castShadow position={[0, 1.45, 0]} scale={[1, 0.35, 0.62]}>
          <sphereGeometry args={[0.22, 20, 12]} />
          <Mat color={look.top} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} castShadow position={[side * 0.228, 1.41, 0]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            <Mat color={look.top} />
          </mesh>
        ))}
        {look.inner && (
          <mesh position={[0, 1.32, 0.147]} rotation={[-0.06, 0, 0]}>
            <boxGeometry args={[0.12, 0.26, 0.012]} />
            <Mat color={look.inner} rough={0.9} />
          </mesh>
        )}
        {/* Lapel edges and buttons */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.055, 1.3, 0.149]} rotation={[-0.06, 0, -side * 0.3]}>
            <boxGeometry args={[0.018, 0.3, 0.014]} />
            <Mat color={PALETTE.charcoal} rough={0.6} />
          </mesh>
        ))}
        {[1.07, 0.97].map((y) => (
          <mesh key={y} position={[0, y, 0.138]}>
            <sphereGeometry args={[0.014, 8, 6]} />
            <Mat color={PALETTE.charcoal} rough={0.4} />
          </mesh>
        ))}
      </group>
    );
  }

  const { color, embroidery, sash } = look.lower;
  return (
    <group>
      {/* Hanbok-inspired ivory wrap top */}
      <mesh castShadow position={[0, 1.21, 0]} scale={[1, 1, 0.7]}>
        <cylinderGeometry args={[0.2, 0.17, 0.5, 20]} />
        <Mat color={look.top} rough={0.9} />
      </mesh>
      <mesh castShadow position={[0, 1.46, 0]} scale={[1, 0.35, 0.7]}>
        <sphereGeometry args={[0.2, 20, 12]} />
        <Mat color={look.top} rough={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow position={[side * 0.2, 1.42, 0]}>
          <sphereGeometry args={[0.068, 14, 10]} />
          <Mat color={look.top} rough={0.9} />
        </mesh>
      ))}
      {/* Wrap collar (git): two white bands meeting in a V on the chest */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.042, 1.36, 0.14]} rotation={[-0.1, 0, -side * 0.5]}>
          <boxGeometry args={[0.03, 0.2, 0.012]} />
          <Mat color={PALETTE.white} rough={0.7} />
        </mesh>
      ))}
      {/* Yellow sash with a bow on the right */}
      <mesh castShadow position={[0, 0.99, 0]} scale={[1, 1, 0.75]}>
        <cylinderGeometry args={[0.185, 0.185, 0.08, 20]} />
        <Mat color={sash} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.08 + side * 0.04, 0.99, 0.142]} rotation={[0, 0, side * 0.5]}>
          <boxGeometry args={[0.07, 0.045, 0.03]} />
          <Mat color={sash} />
        </mesh>
      ))}
      <mesh position={[0.1, 0.91, 0.16]} rotation={[-0.2, 0, 0.12]}>
        <boxGeometry args={[0.035, 0.16, 0.012]} />
        <Mat color={sash} />
      </mesh>
      {/* Yellow midi skirt with white floral embroidery near the hem */}
      <group ref={skirt} position={[0, 0.95, 0]}>
        <mesh castShadow position={[0, -0.3, 0]} scale={[1, 1, 0.86]}>
          <cylinderGeometry args={[0.18, 0.34, 0.6, 24]} />
          <Mat color={color} />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => {
          const a = (i / 10) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.322, -0.5, Math.cos(a) * 0.322 * 0.86]}>
              <sphereGeometry args={[0.022, 8, 6]} />
              <Mat color={embroidery} rough={0.7} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Arm({ look, side, group }: { look: AvatarLook; side: -1 | 1; group: MutableRefObject<Group | null> }) {
  const slim = look.lower.kind === "skirt";
  const x = side * (slim ? 0.222 : 0.27);
  return (
    <group ref={group} position={[x, SHOULDER_Y - (slim ? 0.03 : 0), 0]} rotation={[0, 0, side * 0.07]}>
      <mesh castShadow position={[0, -0.27, 0]}>
        <capsuleGeometry args={[slim ? 0.05 : 0.058, 0.42, 4, 10]} />
        <Mat color={look.sleeves} rough={0.85} />
      </mesh>
      <mesh castShadow position={[0, -0.56, 0.01]}>
        <sphereGeometry args={[0.052, 12, 10]} />
        <Mat color={look.skin} rough={0.7} />
      </mesh>
    </group>
  );
}

function Head({ look }: { look: AvatarLook }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.54, 0]}>
        <cylinderGeometry args={[0.052, 0.058, 0.13, 12]} />
        <Mat color={look.skin} rough={0.7} />
      </mesh>
      <group position={[0, HEAD_Y, 0]}>
        <mesh castShadow scale={[0.95, 1.08, 1]}>
          <sphereGeometry args={[HEAD_R, 24, 18]} />
          <Mat color={look.skin} rough={0.7} />
        </mesh>
        {/* Ears */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.122, -0.005, 0]} scale={[0.5, 1, 0.7]}>
            <sphereGeometry args={[0.03, 10, 8]} />
            <Mat color={look.skin} rough={0.7} />
          </mesh>
        ))}
        {/* Eyes, brows, nose */}
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.043, 0.012, 0.118]}>
              <sphereGeometry args={[0.016, 10, 8]} />
              <Mat color={PALETTE.charcoal} rough={0.3} />
            </mesh>
            <mesh position={[side * 0.045, 0.045, 0.118]} rotation={[0, 0, side * -0.12]}>
              <boxGeometry args={[0.04, 0.009, 0.01]} />
              <Mat color={look.hair} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.022, 0.13]}>
          <sphereGeometry args={[0.017, 10, 8]} />
          <Mat color={look.skin} rough={0.7} />
        </mesh>
        <mesh position={[0, -0.062, 0.118]}>
          <boxGeometry args={[0.035, 0.008, 0.01]} />
          <Mat color={PALETTE.charcoal} rough={0.6} />
        </mesh>
        {look.freckles &&
          [
            [-0.062, -0.022], [-0.078, -0.035], [-0.052, -0.04],
            [0.062, -0.022], [0.078, -0.035], [0.052, -0.04],
          ].map(([fx, fy], i) => (
            <mesh key={i} position={[fx, fy, 0.106]}>
              <sphereGeometry args={[0.0055, 6, 4]} />
              <Mat color={PALETTE.woodWarm} />
            </mesh>
          ))}
        <Hair look={look} />
      </group>
    </group>
  );
}

function Hair({ look }: { look: AvatarLook }) {
  const long = look.hairStyle === "long-wavy";
  // Waves: soft bumps over the crown.
  const waves: [number, number, number][] = long
    ? []
    : [
        [0.055, 0.095, 0.075], [-0.045, 0.105, 0.075], [0, 0.125, 0.02],
        [0.075, 0.075, -0.04], [-0.075, 0.075, -0.04], [0, 0.1, -0.08],
      ];
  return (
    <group>
      {/* Cap tilted back: hairline above the brows, lower at the nape. */}
      <mesh castShadow rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[HEAD_R + 0.014, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <Mat color={look.hair} rough={0.9} />
      </mesh>
      {waves.map((w, i) => (
        <mesh key={i} castShadow position={w}>
          <sphereGeometry args={[0.042, 10, 8]} />
          <Mat color={look.hair} rough={0.9} />
        </mesh>
      ))}
      {long && (
        <>
          {/* Long waves down the back to the shoulder blades */}
          <mesh castShadow position={[0, -0.22, -0.075]} scale={[1.35, 1, 0.62]}>
            <capsuleGeometry args={[0.11, 0.3, 6, 14]} />
            <Mat color={look.hair} rough={0.9} />
          </mesh>
          {/* Side locks framing the face */}
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * 0.108, -0.21, -0.02]} rotation={[0.2, 0, side * -0.06]}>
              <capsuleGeometry args={[0.034, 0.3, 4, 10]} />
              <Mat color={look.hair} rough={0.9} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
