import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { PALETTE } from "../config/world";
import Instanced, { type Part } from "./Instanced";
import { useSignTexture } from "./signTexture";
import { REDUCED_MOTION } from "../systems/motion";
import { ACCENT, MAT, std } from "../config/materials";
import { curvedRoof } from "./shapes";

/** A small tiled roof over a gate (curved, corners lifted). */
function GateRoof({ y, w, d = 1.3 }: { y: number; w: number; d?: number }) {
  const a = 4;
  return (
    <group position={[0, y, 0]}>
      <mesh castShadow position={[0, -0.05, 0]}>
        <boxGeometry args={[w - 0.3, 0.1, d - 0.5]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
      <mesh castShadow geometry={curvedRoof(a)} scale={[w / a, 0.62, d]} dispose={null}>
        <primitive object={MAT.roofSoft} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * The one yellow a usable gate carries: a thin line along the lintel's
 * face — "this way", said quietly. Shut gates carry none.
 */
function LintelLine({ y, z, w }: { y: number; z: number; w: number }) {
  return (
    <mesh position={[0, y, z]}>
      <boxGeometry args={[w, 0.045, 0.02]} />
      <primitive object={ACCENT} attach="material" />
    </mesh>
  );
}

/**
 * Scenery pieces shared by the KLOVERS World rooms: signboards with real
 * Hangul, street lamps and gate walls. Floor textures live in textures.ts.
 */

/** Two back-to-back planes so the sign reads correctly from both sides. */
export function Signboard({ text, w, h, aspect = 1, oneSided = false }: { text: string; w: number; h: number; aspect?: number; oneSided?: boolean }) {
  const tex = useSignTexture(text, aspect);
  // One-sided boards (over gates) have no back and no frame box: from outside
  // the room — where only the camera ever goes — they are simply not there.
  if (oneSided)
    return (
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    );
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
      <Instanced parts={parts.foot} material={MAT.stoneWarm} receiveShadow />
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
export function GateWall({ z, facing, open, sign, halfWidth, accent = open }: { z: number; facing: 1 | -1; open: boolean; sign?: string; halfWidth: number; accent?: boolean }) {
  const gateHalf = 1.8;
  const segW = halfWidth + 0.6 - gateHalf;
  const segX = gateHalf + segW / 2;
  const inner = z + facing * 0.12;
  return (
    <group>
      {[-segX, segX].map((x) => (
        <group key={x}>
          <mesh receiveShadow castShadow position={[x, 1.4, z]}>
            <boxGeometry args={[segW, 2.8, 0.4]} />
            <primitive object={MAT.plaster} attach="material" />
          </mesh>
          <mesh receiveShadow position={[x, 0.45, z]}>
            <boxGeometry args={[segW + 0.04, 0.9, 0.46]} />
            <primitive object={MAT.stoneWarm} attach="material" />
          </mesh>
          <mesh position={[x, 2.72, z]}>
            <boxGeometry args={[segW + 0.02, 0.14, 0.44]} />
            <primitive object={MAT.woodDark} attach="material" />
          </mesh>
          <mesh castShadow position={[x, 2.8, z]} geometry={curvedRoof(9)} scale={[(segW + 0.5) / 9, 0.5, 1.2]} dispose={null}>
            <primitive object={MAT.roofSoft} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Gate frame: dark timber on stone feet; a usable gate adds one thin yellow line. */}
      {[-1.7, 1.7].map((x) => (
        <group key={x}>
          <mesh castShadow position={[x, 1.6, inner]}>
            <boxGeometry args={[0.26, 3.2, 0.26]} />
            <primitive object={MAT.woodDark} attach="material" />
          </mesh>
          <mesh receiveShadow position={[x, 0.14, inner]}>
            <boxGeometry args={[0.44, 0.28, 0.44]} />
            <primitive object={MAT.stoneWarm} attach="material" />
          </mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 3.12, inner]}>
        <boxGeometry args={[3.9, 0.24, 0.3]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      {accent && <LintelLine y={2.96} z={inner + facing * 0.155} w={3.2} />}
      <group position={[0, 0, inner]}>
        <GateRoof y={3.3} w={4.6} />
      </group>
      {open ? (
        <>
          {/* An open gateway: the doors stand folded out of sight. */}
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
          <Signboard text={sign} w={1.3} h={0.65} aspect={2} oneSided />
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
export function Gate({ x, z, rotY, sign }: { x: number; z: number; rotY: number; sign?: string }) {
  // The gatehouse itself is drawn by the room's kit (kit.ts, gatehouse());
  // only the name board, with its painted Hangul, is a separate mesh.
  if (!sign) return null;
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <group position={[0, 2.72, 0.2]}>
        <Signboard text={sign} w={1.5} h={0.6} aspect={2.5} oneSided />
      </group>
    </group>
  );
}



/**
 * A gentle sway for hanging things (signs, banners): children hang from the
 * group's origin. Cheap (one rotation per frame) and switched off when the
 * learner prefers reduced motion.
 */
export function Sway({ children, amp = 0.05, speed = 1.3, phase = 0, axis = "z" }: {
  children: ReactNode;
  amp?: number;
  speed?: number;
  phase?: number;
  axis?: "x" | "z";
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (REDUCED_MOTION || !ref.current) return;
    ref.current.rotation[axis] = Math.sin(clock.elapsedTime * speed + phase) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * A free-standing board on two posts under a little tiled cap, with the
 * yellow rail that marks things to walk up to: the information house
 * (안내소) and the Klovers tour in the village.
 */
export function InfoBoard({ text, w, tall }: { text: string; w: number; tall?: boolean }) {
  const h = tall ? 1.25 : 0.95;
  const y = tall ? 1.75 : 1.65;
  const aspect = w / h;
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * (w / 2 + 0.06), (y + h / 2 + 0.12) / 2, -0.04]}>
          <boxGeometry args={[0.1, y + h / 2 + 0.12, 0.1]} />
          <primitive object={std(PALETTE.woodDark, 0.75)} attach="material" />
        </mesh>
      ))}
      <group position={[0, y, 0]}>
        <Signboard text={text} w={w} h={h} aspect={aspect} />
      </group>
      {/* The yellow rail: these boards are the ones to walk up to. */}
      <mesh position={[0, y - h / 2 - 0.08, 0.02]}>
        <boxGeometry args={[w, 0.05, 0.03]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      <mesh castShadow position={[0, y + h / 2 + 0.16, -0.04]}>
        <boxGeometry args={[w + 0.5, 0.08, 0.42]} />
        <primitive object={std(PALETTE.charcoal, 0.7)} attach="material" />
      </mesh>
    </group>
  );
}
