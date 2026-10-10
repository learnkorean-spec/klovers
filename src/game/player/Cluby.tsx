import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { std } from "../config/materials";
import type { RoomLayout } from "../config/rooms";
import { PALETTE, PROPS } from "../config/world";
import { resolveCollisions } from "../systems/collision";
import { angleDelta, damp } from "../systems/movement";
import type { PlayerState } from "../systems/state";
import type { StoryState } from "../systems/story";
import ShadowBlob from "../npc/ShadowBlob";

/**
 * Cluby — companion, memory-keeper and discovery guide (canon). Never a pet.
 *
 * Built from simple shapes to the canon look: mint plush body, two short
 * butter-yellow horns, pointed ears with pink insides, warm brown eyes,
 * rose cheeks, two small fangs, an ivory mini-hanbok top, a Klovers-yellow
 * wrap skirt with the green four-leaf clover, a short spiky mint tail.
 * The mint, butter, pink and brown are his own colours, fixed by the canon.
 *
 * Behaviour is deliberately small: pop out of the egg, stand, hop down, then
 * follow a step behind the learner (straight-line follow with the same
 * collision as the player, teleporting back if ever stuck). No pathfinding.
 */

const MINT = "#9FDDBE";
const BUTTER = "#F3D46A";
const PINK = "#F4B3C2";
const EYES = "#4A2E1F";
const RADIUS = 0.22;

const easeOutBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};

interface Props {
  story: MutableRefObject<StoryState>;
  player: MutableRefObject<PlayerState>;
  layout: RoomLayout;
  /** The next meaningful place in this room — where he points, now and then. */
  guide: { x: number; z: number } | null;
  /** Things worth a glance in this room (interactables). */
  interests: { x: number; z: number }[];
}

/** Seconds of the learner standing still before he offers a direction. */
const GUIDE_AFTER_IDLE = 9;
const GUIDE_EVERY = 16;

export default function Cluby({ story, player, layout, guide, interests }: Props) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const hopPhase = useRef(0);
  // Small behaviour memory, outside React.
  const mem = useRef({
    idleFor: 0,
    lastGuide: -99,
    glanceAt: null as { x: number; z: number } | null,
    glanceUntil: 0,
    nextGlance: 4,
    stuckFor: 0,
    lastD: 0,
    /** 0 → 1 while vanishing, then 1 → 0 reappearing (hidden reposition). */
    poof: 0,
    poofing: false,
  });

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const c = story.current.cluby;
    const g = root.current;
    if (!g) return;
    if (c.mode === "hidden") {
      g.visible = false;
      return;
    }
    g.visible = true;
    const now = performance.now();
    const p = player.current.position;
    let scale = 1;
    let hop = 0;
    let faceX = p.x;
    let faceZ = p.z;

    if (c.mode === "emerge") {
      // Stand in the open shell, then hop down beside the plinth.
      const t = (now - c.t0) / 1000;
      const shell = { x: PROPS.eggPlinth.x, y: 0.62, z: PROPS.eggPlinth.z };
      scale = t < 0.45 ? 0.2 + 0.8 * easeOutBack(t / 0.45) : 1;
      const k = Math.min(Math.max((t - 3.4) / 0.8, 0), 1);
      g.position.set(shell.x + (c.x - shell.x) * k, shell.y * (1 - k) + Math.sin(k * Math.PI) * 0.6, shell.z + (c.z - shell.z) * k);
      if (c.look && t > 3.4) {
        faceX = c.look.x;
        faceZ = c.look.z;
      }
    } else {
      // Follow: at the learner's side (screen right, where the view opens),
      // level with them — never between the learner and the camera.
      const m = mem.current;
      const pl = player.current;
      const moving = Math.hypot(pl.velocity.x, pl.velocity.z) > 0.2;
      const t = now / 1000;
      m.idleFor = moving ? 0 : m.idleFor + dt;
      const yaw = pl.yaw;
      const fx = Math.sin(yaw);
      const fz = Math.cos(yaw);
      const tx = p.x - fx * 0.25 - fz * 1.0;
      const tz = p.z - fz * 0.25 + fx * 1.0;
      const dx = tx - c.x;
      const dz = tz - c.z;
      const d = Math.hypot(dx, dz);

      // Stuck behind something, or left far behind: slip out of view and
      // reappear at the learner's side (a quick shrink/grow, never a pop).
      m.stuckFor = d > 2.5 && Math.abs(m.lastD - d) < 0.4 * dt ? m.stuckFor + dt : 0;
      m.lastD = d;
      if (!m.poofing && (d > 9 || m.stuckFor > 1.2)) m.poofing = true;
      if (m.poofing) {
        m.poof = Math.min(m.poof + dt * 5, 2);
        if (m.poof >= 1 && m.poof - dt * 5 < 1) {
          c.x = tx;
          c.z = tz;
          m.stuckFor = 0;
        }
        if (m.poof >= 2) {
          m.poof = 0;
          m.poofing = false;
        }
        scale = m.poof < 1 ? 1 - m.poof : m.poof - 1;
      } else if (d > 0.08) {
        // Eases in close, jogs when behind; never pushes into the learner.
        const speed = Math.min(d * 2.4, d > 4 ? 8.5 : 6.5);
        const step = Math.min(speed * dt, d);
        const next = { x: c.x + (dx / d) * step, z: c.z + (dz / d) * step };
        const personal = [{ minX: p.x - 0.55, maxX: p.x + 0.55, minZ: p.z - 0.55, maxZ: p.z + 0.55 }];
        resolveCollisions(next, RADIUS, [...layout.colliders, ...personal], layout.bounds);
        c.x = next.x;
        c.z = next.z;
        if (d > 0.35) {
          faceX = c.x + dx;
          faceZ = c.z + dz;
          hopPhase.current += dt * (d > 4 ? 16 : 12);
          hop = Math.abs(Math.sin(hopPhase.current)) * (d > 4 ? 0.12 : 0.07);
        }
      }

      if (d <= 0.35) {
        // Settled. Now and then: a glance at something worth a look nearby,
        // and — if the learner has stood still a while — a point toward the
        // next place. Rarely, quietly; never a lecture.
        if (!c.look && m.idleFor > GUIDE_AFTER_IDLE && guide && t - m.lastGuide > GUIDE_EVERY) {
          m.lastGuide = t;
          c.look = guide;
          const g0 = guide;
          window.setTimeout(() => {
            if (story.current.cluby.look === g0) story.current.cluby.look = null;
          }, 2600);
        }
        if (!c.look && t > m.nextGlance) {
          const near = interests.filter((it) => Math.hypot(it.x - c.x, it.z - c.z) < 5);
          m.glanceAt = near.length ? near[Math.floor(t) % near.length] : null;
          m.glanceUntil = t + 1.6;
          m.nextGlance = t + 7 + (Math.floor(t * 13) % 5);
        }
        if (m.glanceAt && t < m.glanceUntil) {
          faceX = m.glanceAt.x;
          faceZ = m.glanceAt.z;
        }
      }
      if (c.look) {
        faceX = c.look.x;
        faceZ = c.look.z;
      }
      // Spoken to: he turns to the learner (and hops, below).
      if (now < c.ackUntil) {
        faceX = p.x;
        faceZ = p.z;
      }
      g.position.set(c.x, 0, c.z);
      // A little personality while waiting: a slow side-to-side sway.
      if (body.current) {
        const sway = d <= 0.35 && m.idleFor > 3 && !c.look ? Math.sin(t * 1.4) * 0.07 : 0;
        body.current.rotation.z += (sway - body.current.rotation.z) * damp(4, dt);
      }
    }

    // A happy hop (a right answer, a new place).
    if (now < c.hopUntil) hop = Math.abs(Math.sin(now / 110)) * 0.22;
    else if (now < c.ackUntil) hop = Math.abs(Math.sin(now / 140)) * 0.1;
    if (body.current) {
      body.current.position.y = hop + Math.sin(now / 600) * 0.01;
    }
    const targetYaw = Math.atan2(faceX - g.position.x, faceZ - g.position.z);
    c.yaw += angleDelta(c.yaw, targetYaw) * damp(8, dt);
    g.rotation.y = c.yaw;
    g.scale.setScalar(scale);
    // Point with the right arm while showing the way.
    if (armR.current) {
      const target = c.look ? -2.3 : 0;
      armR.current.rotation.x += (target - armR.current.rotation.x) * damp(8, dt);
    }
  });

  const mint = std(MINT, 0.95);
  const m = (o: ReturnType<typeof std>) => <primitive object={o} attach="material" />;

  return (
    <group ref={root} visible={false} userData={{ character: true }}>
      <ShadowBlob size={0.5} />
      <group ref={body}>
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
        {/* Ivory mini-hanbok top (jeogori): a short jacket that follows the
            round body from the chest to the waist, with a darker collar band
            and a yellow ribbon tie (goreum). */}
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
        {/* Klovers-yellow wrap skirt (chima): from the waist, flaring to the
            feet, with the green four-leaf clover on the front. */}
        <mesh castShadow position={[0, 0.125, 0]} scale={[1, 1, 0.92]}>
          <cylinderGeometry args={[0.168, 0.205, 0.17, 22, 1, true]} />
          {m(std(PALETTE.yellow, 0.85))}
        </mesh>
        <mesh position={[0, 0.205, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.92, 1]}>
          <torusGeometry args={[0.168, 0.012, 6, 24]} />
          {m(std(PALETTE.yellow, 0.85))}
        </mesh>
        {/* Four-leaf clover emblem on the skirt */}
        {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
          <mesh key={i} position={[sx * 0.015, 0.12 + sy * 0.015, 0.194]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <meshBasicMaterial color={PALETTE.cloverGreen} toneMapped={false} />
          </mesh>
        ))}
        {/* Arms (the right one points the way) */}
        <group position={[-0.17, 0.3, 0]} rotation={[0, 0, 0.6]}>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
            {m(mint)}
          </mesh>
        </group>
        <group ref={armR} position={[0.17, 0.3, 0]}>
          <group rotation={[0, 0, -0.6]}>
            <mesh position={[0, -0.06, 0]}>
              <capsuleGeometry args={[0.035, 0.08, 4, 8]} />
              {m(mint)}
            </mesh>
          </group>
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
                {m(std(EYES, 0.3))}
              </mesh>
              <mesh position={[s * 0.055, 0.035, 0.173]}>
                <sphereGeometry args={[0.009, 6, 4]} />
                <meshBasicMaterial color={PALETTE.white} />
              </mesh>
              {/* Rose cheeks */}
              <mesh position={[s * 0.105, -0.03, 0.13]} scale={[1, 0.6, 0.4]}>
                <sphereGeometry args={[0.026, 8, 6]} />
                {m(std(PINK, 0.9))}
              </mesh>
              {/* Two short butter-yellow horns */}
              <mesh position={[s * 0.07, 0.16, 0.02]} rotation={[0, 0, -s * 0.35]}>
                <coneGeometry args={[0.03, 0.09, 10]} />
                {m(std(BUTTER, 0.7))}
              </mesh>
              {/* Pointed ears, pink inside */}
              <group position={[s * 0.16, 0.06, 0]} rotation={[0, 0, -s * 1.15]}>
                <mesh>
                  <coneGeometry args={[0.05, 0.13, 10]} />
                  {m(mint)}
                </mesh>
                <mesh position={[0, -0.005, 0.018]} scale={[0.65, 0.8, 0.4]}>
                  <coneGeometry args={[0.05, 0.13, 10]} />
                  {m(std(PINK, 0.9))}
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
            {m(std(EYES, 0.5))}
          </mesh>
        </group>
        {/* Short spiky tail */}
        <group position={[0, 0.14, -0.17]} rotation={[-1.9, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.05, 0.16, 10]} />
            {m(mint)}
          </mesh>
          {[0.02, -0.03].map((y, i) => (
            <mesh key={i} position={[0, y, 0.04]} rotation={[0.9, 0, 0]}>
              <coneGeometry args={[0.018, 0.04, 6]} />
              {m(mint)}
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
