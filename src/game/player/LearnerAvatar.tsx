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
const HEAD_Y = 1.7;
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
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);
  const elbowL = useRef<Group>(null);
  const elbowR = useRef<Group>(null);
  const head = useRef<Group>(null);
  const eyes = useRef<Group>(null);
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
    // Knees bend on the leg that swings forward (never backward).
    const kneeK = 0.25 + 0.9 * amp.current;
    if (kneeL.current) kneeL.current.rotation.x = Math.max(0, -Math.cos(phase.current)) * amp.current * kneeK * 1.6;
    if (kneeR.current) kneeR.current.rotation.x = Math.max(0, Math.cos(phase.current)) * amp.current * kneeK * 1.6;
    if (armL.current) armL.current.rotation.x = -armSwing;
    if (armR.current) armR.current.rotation.x = armSwing;
    // Elbows: softly bent at rest, more when running.
    const elbow = -(0.16 + 0.9 * run01 * amp.current);
    if (elbowL.current) elbowL.current.rotation.x = elbow;
    if (elbowR.current) elbowR.current.rotation.x = elbow;
    if (skirt.current) skirt.current.rotation.z = s * amp.current * 0.06;

    // Life at rest: an unhurried look around, and a blink every few seconds.
    const t = performance.now() / 1000;
    if (head.current) {
      const look = moving ? 0 : Math.sin(t * 0.37) * 0.28 + Math.sin(t * 0.13) * 0.12;
      head.current.rotation.y += (look - head.current.rotation.y) * damp(3, dt);
      head.current.rotation.x = moving ? 0.05 : Math.sin(t * 0.21) * 0.04;
    }
    if (eyes.current) {
      const blink = t % 3.7 < 0.12 ? 0.15 : 1;
      eyes.current.scale.y = blink;
    }

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
      <Legs look={look} left={legL} right={legR} kneeL={kneeL} kneeR={kneeR} />
      <Torso look={look} skirt={skirt} />
      <Arm look={look} side={-1} group={armL} elbow={elbowL} />
      <Arm look={look} side={1} group={armR} elbow={elbowR} />
      <Head look={look} head={head} eyes={eyes} />
    </group>
  );
}

/** Shared, cached material per colour/finish (see config/materials.ts). */
function Mat({ color, rough = 0.8 }: { color: string; rough?: number }) {
  return <primitive object={std(color, rough)} attach="material" />;
}

function Legs({
  look,
  left,
  right,
  kneeL,
  kneeR,
}: {
  look: AvatarLook;
  left: MutableRefObject<Group | null>;
  right: MutableRefObject<Group | null>;
  kneeL: MutableRefObject<Group | null>;
  kneeR: MutableRefObject<Group | null>;
}) {
  const trousers = look.lower.kind === "trousers";
  const legColor = trousers ? look.lower.color : look.skin;
  // Thigh tapers into the knee, the shin into the ankle (two segments, so
  // the knee bends): the legs stop reading as two straight sticks.
  const thighR = trousers ? 0.085 : 0.066;
  const shinR = trousers ? 0.07 : 0.052;
  const KNEE = 0.45;
  return (
    <>
      {/* Hips: the trousers' seat joins both legs (a skirt covers it). */}
      {trousers && (
        <>
          <mesh castShadow position={[0, HIP_Y + 0.02, 0]} scale={[1, 1, 0.72]}>
            <cylinderGeometry args={[0.19, 0.18, 0.18, 18]} />
            <Mat color={legColor} />
          </mesh>
          <mesh position={[0, HIP_Y + 0.1, 0]} scale={[1, 1, 0.72]}>
            <cylinderGeometry args={[0.193, 0.193, 0.035, 18]} />
            <Mat color="#6B4A33" rough={0.6} />
          </mesh>
        </>
      )}
      {([-1, 1] as const).map((side) => (
        <group key={side} ref={side < 0 ? left : right} position={[side * 0.1, HIP_Y, 0]}>
          <mesh castShadow position={[0, -KNEE / 2, 0]}>
            <capsuleGeometry args={[thighR, KNEE - thighR * 1.2, 4, 12]} />
            <Mat color={legColor} />
          </mesh>
          <group ref={side < 0 ? kneeL : kneeR} position={[0, -KNEE, 0]}>
            <mesh castShadow position={[0, -0.21, 0]}>
              <capsuleGeometry args={[shinR, 0.36, 4, 12]} />
              <Mat color={legColor} />
            </mesh>
            {/* Shoe: a rounded toe on a flat sole (sneakers / flats) */}
            <group position={[0, -(HIP_Y - KNEE) + 0.005, 0.03]}>
              <mesh castShadow position={[0, trousers ? 0.05 : 0.035, -0.02]}>
                <boxGeometry args={[0.11, trousers ? 0.09 : 0.055, 0.2]} />
                <Mat color={look.shoes} rough={0.6} />
              </mesh>
              <mesh castShadow position={[0, trousers ? 0.04 : 0.03, 0.08]} scale={[1, trousers ? 0.75 : 0.5, 1.1]}>
                <sphereGeometry args={[0.058, 12, 8]} />
                <Mat color={look.shoes} rough={0.6} />
              </mesh>
              <mesh position={[0, 0.006, 0.02]}>
                <boxGeometry args={[0.118, 0.014, 0.29]} />
                <Mat color="#B9B0A2" rough={0.9} />
              </mesh>
            </group>
          </group>
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
        <mesh castShadow position={[0, 1.44, 0]} scale={[1, 0.3, 0.62]}>
          <sphereGeometry args={[0.22, 20, 12]} />
          <Mat color={look.top} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} castShadow position={[side * 0.215, 1.41, 0]}>
            <sphereGeometry args={[0.066, 14, 10]} />
            <Mat color={look.top} />
          </mesh>
        ))}
        <mesh position={[0, 1.495, -0.01]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <torusGeometry args={[0.07, 0.022, 8, 18]} />
          <Mat color={look.top} />
        </mesh>
        {look.inner && (
          <mesh position={[0, 1.32, 0.147]} rotation={[-0.06, 0, 0]}>
            <boxGeometry args={[0.12, 0.26, 0.012]} />
            <Mat color={look.inner} rough={0.9} />
          </mesh>
        )}
        {/* Lapel edges and buttons */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.055, 1.3, 0.149]} rotation={[-0.06, 0, -side * 0.3]}>
            <boxGeometry args={[0.03, 0.3, 0.014]} />
            <Mat color="#D9D400" rough={0.75} />
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
      <mesh castShadow position={[0, 1.45, 0]} scale={[1, 0.3, 0.7]}>
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

function Arm({ look, side, group, elbow }: { look: AvatarLook; side: -1 | 1; group: MutableRefObject<Group | null>; elbow: MutableRefObject<Group | null> }) {
  const slim = look.lower.kind === "skirt";
  const x = side * (slim ? 0.222 : 0.255);
  const r = slim ? 0.05 : 0.058;
  return (
    <group ref={group} position={[x, SHOULDER_Y - (slim ? 0.03 : 0), 0]} rotation={[0, 0, side * 0.08]}>
      {/* Upper arm, then the forearm from a bending elbow, then a hand. */}
      <mesh castShadow position={[0, -0.14, 0]}>
        <capsuleGeometry args={[r, 0.2, 4, 10]} />
        <Mat color={look.sleeves} rough={0.85} />
      </mesh>
      <group ref={elbow} position={[0, -0.29, 0]}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <capsuleGeometry args={[r * 0.9, 0.18, 4, 10]} />
          <Mat color={look.sleeves} rough={0.85} />
        </mesh>
        {/* Cuff: a darker edge where the sleeve ends */}
        <mesh position={[0, -0.235, 0]}>
          <cylinderGeometry args={[r * 0.93, r * 0.93, 0.025, 10]} />
          <Mat color={slim ? PALETTE.white : PALETTE.ivory} rough={0.8} />
        </mesh>
        {/* Hand: a flattened palm with the thumb toward the body */}
        <group position={[0, -0.3, 0.01]}>
          <mesh castShadow scale={[0.7, 1.15, 0.45]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <Mat color={look.skin} rough={0.7} />
          </mesh>
          <mesh position={[-side * 0.028, 0.012, 0.018]} rotation={[0, 0, side * 0.5]}>
            <capsuleGeometry args={[0.012, 0.03, 3, 6]} />
            <Mat color={look.skin} rough={0.7} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function Head({ look, head, eyes }: { look: AvatarLook; head: MutableRefObject<Group | null>; eyes: MutableRefObject<Group | null> }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.56, 0]}>
        <cylinderGeometry args={[0.05, 0.058, 0.16, 12]} />
        <Mat color={look.skin} rough={0.7} />
      </mesh>
      <group ref={head} position={[0, HEAD_Y, 0]}>
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
        {/* Eyes (white, iris, catch-light — they blink), brows, nose */}
        <group ref={eyes} position={[0, 0.012, 0]}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <mesh position={[side * 0.043, 0, 0.112]} scale={[1.35, 0.85, 0.6]}>
                <sphereGeometry args={[0.017, 12, 8]} />
                <Mat color="#F7F3EC" rough={0.4} />
              </mesh>
              <mesh position={[side * 0.043, -0.001, 0.12]}>
                <sphereGeometry args={[0.0115, 10, 8]} />
                <Mat color="#3B2618" rough={0.3} />
              </mesh>
              {/* Catch-light: keeps the eyes alive at a distance */}
              <mesh position={[side * 0.043 + 0.004, 0.004, 0.131]}>
                <sphereGeometry args={[0.0035, 6, 4]} />
                <Mat color={PALETTE.white} rough={0.2} />
              </mesh>
            </group>
          ))}
        </group>
        {[-1, 1].map((side) => (
          <group key={side}>
            <mesh position={[side * 0.045, 0.045, 0.118]} rotation={[0, 0, side * -0.12]}>
              <boxGeometry args={[0.04, 0.009, 0.01]} />
              <Mat color={look.hair} />
            </mesh>
          </group>
        ))}
        {/* Nose: a small bridge and tip, barely darker than the face */}
        <mesh position={[0, -0.012, 0.124]} rotation={[0.35, 0, 0]} scale={[0.6, 1.4, 0.7]}>
          <sphereGeometry args={[0.014, 10, 8]} />
          <Mat color={look.skin} rough={0.7} />
        </mesh>
        {/* A small, friendly smile (lower half of a thin ring) */}
        <mesh position={[0, -0.052, 0.117]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.017, 0.0032, 6, 12, Math.PI]} />
          <Mat color="#8C4A3C" rough={0.6} />
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
      {!long && (
        // Side-swept fringe (cover art): a soft wave across the forehead.
        <mesh castShadow position={[0.025, 0.085, 0.092]} rotation={[0.35, 0, -0.32]} scale={[1.7, 0.55, 0.75]}>
          <sphereGeometry args={[0.052, 12, 8]} />
          <Mat color={look.hair} rough={0.9} />
        </mesh>
      )}
      {long && (
        <>
          {/* Fuller crown and side volume */}
          {[-1, 1].map((side) => (
            <mesh key={`v${side}`} castShadow position={[side * 0.1, 0.02, -0.03]} scale={[0.8, 1.15, 1]}>
              <sphereGeometry args={[0.07, 12, 8]} />
              <Mat color={look.hair} rough={0.9} />
            </mesh>
          ))}
          {/* Side part: a sweep of hair across one side of the forehead */}
          <mesh castShadow position={[-0.035, 0.09, 0.088]} rotation={[0.35, 0, 0.35]} scale={[1.6, 0.5, 0.7]}>
            <sphereGeometry args={[0.05, 12, 8]} />
            <Mat color={look.hair} rough={0.9} />
          </mesh>
          {/* Waves along the back */}
          {[
            [-0.07, -0.36, -0.1], [0.07, -0.33, -0.1], [0, -0.42, -0.11],
          ].map((w, i) => (
            <mesh key={`w${i}`} castShadow position={w as [number, number, number]}>
              <sphereGeometry args={[0.06, 10, 8]} />
              <Mat color={look.hair} rough={0.9} />
            </mesh>
          ))}
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
