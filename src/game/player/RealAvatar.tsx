import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { PALETTE } from "../config/world";
import type { PlayerState } from "../systems/state";
import type { AvatarId } from "./characters";
import RiggedBody, { type BodyControl, type DressRule } from "./RiggedBody";

/**
 * The learners as real, rigged people: Adam (Mixamo "Josh") and Lina
 * ("Kate"), dressed to the canon (Adam: yellow blazer, ivory tee and
 * trousers, white trainers; Lina: ivory top, yellow below, long wavy copper
 * hair — added to the model as hair cards on her own head and upper back,
 * since "Kate" comes with short hair).
 * Standing, walking and running blend by speed; a hop plays the jump; the
 * other learner waves when the player arrives, then talks while near.
 */
const DRESS: Record<AvatarId, DressRule[]> = {
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
    // Canon: long, wavy, auburn copper. Dyed (not tinted) so the crown and
    // the long strands, cut from different parts of the texture, match; the
    // crown a shade deeper, as it takes the sun from above.
    { match: /HairLong/, color: "#7A3520", contrast: 0.4 },
    { match: /Hair/, color: "#5E2A17", contrast: 0.35 },
  ],
};

export default function RealAvatar({
  player,
  avatar,
  greet,
}: {
  player: MutableRefObject<PlayerState>;
  avatar: AvatarId;
  /** Someone to greet: wave when they arrive, then talk while they stay near. */
  greet?: MutableRefObject<PlayerState>;
}) {
  const control = useRef<BodyControl>({ clip: "idle", once: null, rate: 1 });
  const s = useRef({ greeted: false, wasAir: false });

  useFrame(() => {
    const p = player.current;
    const c = control.current;
    const speed = Math.hypot(p.velocity.x, p.velocity.z);
    let clip: BodyControl["clip"] = p.animation === "run" ? "run" : p.animation === "walk" ? "walk" : "idle";
    if (greet && clip === "idle") {
      const g = greet.current.position;
      const d = Math.hypot(g.x - p.position.x, g.z - p.position.z);
      if (d < 2.6 && !s.current.greeted) {
        s.current.greeted = true;
        c.once = "wave";
      } else if (d > 4) s.current.greeted = false;
      if (d < 2.6) clip = "talk";
    }
    const air = p.position.y > 0.02;
    if (air && !s.current.wasAir) c.once = "jump";
    s.current.wasAir = air;
    c.clip = clip;
    c.rate = clip === "walk" ? Math.min(1.5, Math.max(0.6, speed / 1.5)) : clip === "run" ? Math.min(1.3, Math.max(0.8, speed / 5.5)) : 1;
  });

  return <RiggedBody model={avatar} rules={DRESS[avatar]} female={avatar === "lina"} control={control} look={greet} />;
}
