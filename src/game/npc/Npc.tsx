import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh } from "three";
import { INTERACTABLES } from "../config/interactions";
import type { NpcPlacement } from "../config/npcs";
import type { PlayerState } from "../systems/state";
import { cheerAmount } from "../systems/reactions";
import { angleDelta, damp } from "../systems/movement";
import { REDUCED_MOTION } from "../systems/motion";
import { CAST } from "./cast";
import { buildPerson, PEOPLE_MATERIAL, type PersonSpec } from "./people";
import ShadowBlob from "./ShadowBlob";

const WALK_SPEED = 1.15;
/** People who can be spoken to notice the learner inside this distance. */
const NOTICE = 3.4;
const TALKERS = new Set(INTERACTABLES.map((i) => i.npc).filter(Boolean) as string[]);

/**
 * One ambient person: a merged body plus, only when they move, arms and
 * legs. Behaviour is a tiny deterministic loop per pose — no AI, no paths
 * beyond two points — so a dozen of them cost almost nothing.
 */
export default function Npc({ n, player }: { n: NpcPlacement; player?: MutableRefObject<PlayerState> }) {
  const spec: PersonSpec = CAST[n.cast];
  const parts = useMemo(() => buildPerson(spec, n.pose), [spec, n.pose]);
  useEffect(
    () => () => {
      parts.core.dispose();
      parts.armL?.dispose();
      parts.armR?.dispose();
      parts.legL?.dispose();
      parts.legR?.dispose();
    },
    [parts],
  );

  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const armL = useRef<Mesh>(null);
  const armR = useRef<Mesh>(null);
  const legL = useRef<Mesh>(null);
  const legR = useRef<Mesh>(null);
  const walk = useRef({ t: 0, dir: 1, pause: 0, yaw: n.yaw, x: n.x, z: n.z });
  const talker = TALKERS.has(n.id);
  const seated = n.pose === "sit" || n.pose === "sitRead";

  useFrame(({ clock }, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDt, 0.05);
    const t = clock.elapsedTime + (n.phase ?? 0) * 3;
    const calm = REDUCED_MOTION ? 0 : 1;

    if (n.path) {
      const w = walk.current;
      const [a, b] = n.path;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (w.pause > 0) {
        w.pause -= dt;
      } else {
        w.t += ((WALK_SPEED * dt) / len) * w.dir;
        if (w.t >= 1 || w.t <= 0) {
          w.t = Math.min(Math.max(w.t, 0), 1);
          w.dir *= -1;
          w.pause = 1.8;
        }
      }
      w.x = a[0] + (b[0] - a[0]) * w.t;
      w.z = a[1] + (b[1] - a[1]) * w.t;
      const target = w.dir > 0 ? Math.atan2(b[0] - a[0], b[1] - a[1]) : Math.atan2(a[0] - b[0], a[1] - b[1]);
      w.yaw += angleDelta(w.yaw, target) * damp(4, dt);
      g.position.set(w.x, 0, w.z);
      g.rotation.y = w.yaw;
      const moving = w.pause <= 0 ? 1 : 0;
      const s = Math.sin(t * 6.2) * 0.45 * moving * calm;
      if (legL.current) legL.current.rotation.x = s;
      if (legR.current) legR.current.rotation.x = -s;
      if (armL.current) armL.current.rotation.x = -s * 0.8;
      if (armR.current) armR.current.rotation.x = s * 0.8;
      if (body.current) body.current.position.y = Math.abs(Math.cos(t * 6.2)) * 0.025 * moving * calm;
      return;
    }

    // Someone who can be spoken to turns toward the learner coming close
    // (seated people only half-turn), and back to what they were doing after.
    if (talker && player) {
      const p = player.current.position;
      const d = Math.hypot(p.x - n.x, p.z - n.z);
      const w = walk.current;
      let target = n.yaw;
      if (d < NOTICE) {
        const toward = Math.atan2(p.x - n.x, p.z - n.z);
        const turn = angleDelta(n.yaw, toward);
        target = n.yaw + (seated ? Math.max(-0.6, Math.min(0.6, turn)) : turn);
      }
      w.yaw += angleDelta(w.yaw, target) * damp(d < NOTICE ? 5 : 2, dt);
      g.rotation.y = w.yaw;
    }

    // A reaction (answered, or pleased): a wave and a small lift.
    const cheer = cheerAmount(n.id, performance.now());
    if (cheer > 0) {
      if (body.current) body.current.position.y = Math.abs(Math.sin(t * 9)) * 0.05 * cheer * calm;
      if (armR.current) {
        armR.current.rotation.x = -2.5 * cheer;
        armR.current.rotation.z = (0.25 + Math.sin(t * 10) * 0.25) * cheer * calm;
      }
      return;
    }

    // Breathing for everyone; a pose-specific gesture on top.
    if (body.current) body.current.position.y = Math.sin(t * 1.6) * 0.006 * calm;
    if (n.pose === "talk" && armR.current) {
      // Talking with one hand: small lifts every couple of seconds.
      const k = Math.max(0, Math.sin(t * 1.3)) * calm;
      armR.current.rotation.x = -0.35 - 0.5 * k;
      armR.current.rotation.z = 0.25 * k;
      if (body.current) body.current.rotation.y = Math.sin(t * 0.7) * 0.12 * calm;
    } else if (n.pose === "drink" && armR.current) {
      // A sip now and then.
      const cyc = (t % 6) / 6;
      const up = cyc < 0.25 ? Math.sin((cyc / 0.25) * Math.PI) : 0;
      armR.current.rotation.x = -0.3 - 1.9 * up * calm;
    } else if (n.pose === "water" && armR.current) {
      armR.current.rotation.x = -0.95 + Math.sin(t * 0.9) * 0.08 * calm;
    } else if (n.pose === "stand" && armR.current && armL.current) {
      armR.current.rotation.x = Math.sin(t * 0.8) * 0.04 * calm;
      armL.current.rotation.x = -Math.sin(t * 0.8) * 0.04 * calm;
      if (body.current) body.current.rotation.y = Math.sin(t * 0.25) * 0.3 * calm;
    } else if ((n.pose === "read" || n.pose === "sitRead" || n.pose === "browse") && body.current) {
      body.current.rotation.x = 0.06 + Math.sin(t * 0.5) * 0.02 * calm;
    }
  });

  const sc = spec.scale ?? 1;
  return (
    <group ref={root} position={[n.x, 0, n.z]} rotation={[0, n.yaw, 0]} scale={sc}>
      <group ref={body}>
        <mesh geometry={parts.core} material={PEOPLE_MATERIAL} castShadow dispose={null} />
        {parts.armL && <mesh ref={armL} geometry={parts.armL} material={PEOPLE_MATERIAL} position={[-0.25, parts.shoulderY, 0]} castShadow dispose={null} />}
        {parts.armR && <mesh ref={armR} geometry={parts.armR} material={PEOPLE_MATERIAL} position={[0.25, parts.shoulderY, 0]} castShadow dispose={null} />}
        {parts.legL && <mesh ref={legL} geometry={parts.legL} material={PEOPLE_MATERIAL} position={[-0.1, parts.hipY, 0]} castShadow dispose={null} />}
        {parts.legR && <mesh ref={legR} geometry={parts.legR} material={PEOPLE_MATERIAL} position={[0.1, parts.hipY, 0]} castShadow dispose={null} />}
      </group>
      <ShadowBlob size={seated ? 1.0 : 0.85} stretch={seated ? 1.1 : 1} />
    </group>
  );
}
