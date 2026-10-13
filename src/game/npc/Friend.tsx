import { useMemo, useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type Group } from "three";
import LearnerAvatar from "../player/LearnerAvatar";
import RealAvatar from "../player/RealAvatar";
import { REAL_PEOPLE } from "../systems/styleMode";
import { Suspense } from "react";
import type { AvatarId } from "../player/characters";
import { angleDelta, damp } from "../systems/movement";
import type { PlayerState } from "../systems/state";
import ShadowBlob from "./ShadowBlob";

/**
 * The other learner, waiting by the egg where the two friends found it.
 * If the learner walks as Adam, Lina is here — and the other way round.
 * Same body as the player's avatar, standing still (idle breathing), and
 * turning to greet the learner who comes close.
 */
export default function Friend({ avatar, x, z, yaw, player }: { avatar: AvatarId; x: number; z: number; yaw: number; player?: MutableRefObject<PlayerState> }) {
  const other: AvatarId = avatar === "adam" ? "lina" : "adam";
  const still = useRef<PlayerState>({
    position: new Vector3(x, 0, z),
    velocity: { x: 0, z: 0 },
    yaw,
    animation: "idle",
    frozen: false,
    paused: false,
    autoTarget: null,
  });
  const root = useRef<Group>(null);
  const facing = useRef(yaw);
  useFrame((_, rawDt) => {
    if (!player || !root.current) return;
    const dt = Math.min(rawDt, 0.05);
    const p = player.current.position;
    const d = Math.hypot(p.x - x, p.z - z);
    const target = d < 3.6 ? Math.atan2(p.x - x, p.z - z) : yaw;
    facing.current += angleDelta(facing.current, target) * damp(d < 3.6 ? 5 : 2, dt);
    root.current.rotation.y = facing.current;
  });
  const pos = useMemo(() => [x, 0, z] as [number, number, number], [x, z]);
  return (
    <group ref={root} position={pos} rotation={[0, yaw, 0]} userData={{ character: true }}>
      {REAL_PEOPLE ? (
        <Suspense fallback={<LearnerAvatar player={still} avatar={other} />}>
          <RealAvatar key={other} player={still} avatar={other} greet={player} />
        </Suspense>
      ) : (
        <LearnerAvatar player={still} avatar={other} />
      )}
      <ShadowBlob size={0.9} />
    </group>
  );
}
