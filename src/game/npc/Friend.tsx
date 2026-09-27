import { useMemo, useRef } from "react";
import { Vector3 } from "three";
import LearnerAvatar from "../player/LearnerAvatar";
import type { AvatarId } from "../player/characters";
import type { PlayerState } from "../systems/state";
import ShadowBlob from "./ShadowBlob";

/**
 * The other learner, waiting by the egg where the two friends found it.
 * If the learner walks as Adam, Lina is here — and the other way round.
 * Same body as the player's avatar, standing still (idle breathing).
 */
export default function Friend({ avatar, x, z, yaw }: { avatar: AvatarId; x: number; z: number; yaw: number }) {
  const other: AvatarId = avatar === "adam" ? "lina" : "adam";
  const still = useRef<PlayerState>({
    position: new Vector3(x, 0, z),
    velocity: { x: 0, z: 0 },
    yaw,
    animation: "idle",
    frozen: false,
    paused: false,
  });
  const pos = useMemo(() => [x, 0, z] as [number, number, number], [x, z]);
  return (
    <group position={pos} rotation={[0, yaw, 0]}>
      <LearnerAvatar player={still} avatar={other} />
      <ShadowBlob size={0.9} />
    </group>
  );
}
