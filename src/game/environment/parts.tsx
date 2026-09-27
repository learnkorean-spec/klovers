import { useMemo } from "react";
import { PALETTE } from "../config/world";
import Instanced, { type Part } from "./Instanced";
import { useSignTexture } from "./signTexture";
import { ACCENT, MAT, std } from "../config/materials";

/**
 * Scenery pieces shared by the KLOVERS World rooms: signboards with real
 * Hangul, street lamps and gate walls. Floor textures live in textures.ts.
 */

/** Two back-to-back planes so the sign reads correctly from both sides. */
export function Signboard({ text, w, h, aspect = 1 }: { text: string; w: number; h: number; aspect?: number }) {
  const tex = useSignTexture(text, aspect);
  return (
    <>
      {[0, Math.PI].map((ry) => (
        <mesh key={ry} rotation={[0, ry, 0]} position={[0, 0, ry ? -0.011 : 0.011]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      <mesh castShadow>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.02]} />
        <primitive object={std(PALETTE.woodDark, 0.8)} attach="material" />
      </mesh>
    </>
  );
}

/** Street lamps (post, stone foot, paper lantern, cap) — four draw calls for any number. */
export function Lamps({ spots, size = 0.28 }: { spots: { x: number; z: number }[]; size?: number }) {
  const parts = useMemo(() => {
    const post: Part[] = [], foot: Part[] = [], light: Part[] = [], cap: Part[] = [];
    for (const { x, z } of spots) {
      post.push({ p: [x, 1.1, z], s: [size * 0.5, 2.2, size * 0.5] });
      foot.push({ p: [x, 0.08, z], s: [size, 0.16, size] });
      light.push({ p: [x, 2.42, z], s: [0.36, 0.44, 0.36] });
      cap.push({ p: [x, 2.7, z], s: [0.48, 0.08, 0.48] });
    }
    return { post, foot, light, cap };
  }, [spots, size]);
  return (
    <>
      <Instanced parts={parts.post} material={MAT.woodDark} castShadow />
      <Instanced parts={parts.foot} material={MAT.stone} receiveShadow />
      <Instanced parts={parts.light} material={MAT.lanternPaper} />
      <Instanced parts={parts.cap} material={MAT.charcoal} />
    </>
  );
}

/**
 * An end wall across a room of half-width `halfWidth`, with a gate in the
 * middle. `facing` points into the room. Open gates show daylight and
 * doors swung outward; shut gates show closed doors.
 */
export function GateWall({ z, facing, open, sign, halfWidth }: { z: number; facing: 1 | -1; open: boolean; sign?: string; halfWidth: number }) {
  const gateHalf = 1.8;
  const segW = halfWidth + 0.6 - gateHalf;
  const segX = gateHalf + segW / 2;
  const inner = z + facing * 0.12;
  return (
    <group>
      {[-segX, segX].map((x) => (
        <group key={x}>
          <mesh receiveShadow position={[x, 1.4, z]}>
            <boxGeometry args={[segW, 2.8, 0.4]} />
            <primitive object={std(PALETTE.ivory, 0.95)} attach="material" />
          </mesh>
          <mesh position={[x, 0.45, z]}>
            <boxGeometry args={[segW + 0.02, 0.9, 0.42]} />
            <primitive object={std(PALETTE.charcoal, 0.85)} attach="material" />
          </mesh>
          <mesh castShadow position={[x, 2.92, z]}>
            <boxGeometry args={[segW + 0.4, 0.2, 1.1]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Yellow gate frame — unlit so it renders as exact Klovers yellow. */}
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} castShadow position={[x, 1.5, inner]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <primitive object={ACCENT} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.05, inner]}>
        <boxGeometry args={[3.6, 0.22, 0.22]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      {open ? (
        <>
          {/* Daylight through the open gate */}
          <mesh position={[0, 1.45, z - facing * 0.3]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[3.2, 2.9]} />
            <meshBasicMaterial color={PALETTE.ivory} toneMapped={false} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} castShadow position={[sx * 1.55, 1.35, z - facing * 0.85]}>
              <boxGeometry args={[0.1, 2.7, 1.5]} />
              <primitive object={std(PALETTE.woodDark, 0.75)} attach="material" />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh castShadow receiveShadow position={[0, 1.35, z]}>
            <boxGeometry args={[3.2, 2.7, 0.14]} />
            <primitive object={std(PALETTE.woodDark, 0.75)} attach="material" />
          </mesh>
          <mesh position={[0, 1.35, z + facing * 0.075]}>
            <boxGeometry args={[0.05, 2.7, 0.02]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </>
      )}
      {sign && (
        <group position={[0, 2.25, z + facing * 0.12]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
          <Signboard text={sign} w={1.3} h={0.65} aspect={2} />
        </group>
      )}
    </group>
  );
}


/**
 * A freestanding gate set against a wall: local +z faces into the room.
 * Open gates show daylight; shut ones show closed doors, and a gate to a
 * world that does not exist yet gets a bar across. Yellow frames mark only
 * gates the learner can use — yellow is navigation, never decoration.
 */
export function Gate({ x, z, rotY, open, accent, barred = false, sign }: {
  x: number;
  z: number;
  rotY: number;
  open: boolean;
  accent: boolean;
  barred?: boolean;
  sign?: string;
}) {
  const frame = accent ? ACCENT : MAT.woodDark;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {[-1.7, 1.7].map((fx) => (
        <mesh key={fx} castShadow position={[fx, 1.5, 0]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <primitive object={frame} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.05, 0]}>
        <boxGeometry args={[3.6, 0.22, 0.22]} />
        <primitive object={frame} attach="material" />
      </mesh>
      {open ? (
        <mesh position={[0, 1.45, -0.09]}>
          <planeGeometry args={[3.2, 2.9]} />
          <meshBasicMaterial color={PALETTE.ivory} toneMapped={false} />
        </mesh>
      ) : (
        <>
          <mesh receiveShadow position={[0, 1.35, -0.05]}>
            <boxGeometry args={[3.2, 2.7, 0.1]} />
            <primitive object={MAT.woodDark} attach="material" />
          </mesh>
          <mesh position={[0, 1.35, 0.005]}>
            <boxGeometry args={[0.04, 2.7, 0.02]} />
            <primitive object={MAT.charcoal} attach="material" />
          </mesh>
          {barred && (
            <mesh position={[0, 1.35, 0.03]}>
              <boxGeometry args={[3.5, 0.18, 0.08]} />
              <primitive object={MAT.charcoal} attach="material" />
            </mesh>
          )}
        </>
      )}
      {sign && (
        <group position={[0, 3.55, 0.05]}>
          <Signboard text={sign} w={1.5} h={0.6} aspect={2.5} />
        </group>
      )}
    </group>
  );
}
