import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { WorldIcon } from "./icons";
import { useFrame } from "@react-three/fiber";
import { BoxGeometry, MeshBasicMaterial, PlaneGeometry, type BufferGeometry, type Group } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETTE } from "../config/world";
import Instanced, { type Part } from "./Instanced";
import { useSignTexture } from "./signTexture";
import { REDUCED_MOTION } from "../systems/motion";
import { ACCENT, MAT, std } from "../config/materials";
import Batch from "./Batch";
import { Kit } from "./kit";

/**
 * Scenery pieces shared by the KLOVERS World rooms: signboards with real
 * Hangul, street lamps and gate walls. Floor textures live in textures.ts.
 */

const signGeometries = new Map<string, BufferGeometry>();

/**
 * A two-sided sign as one mesh, one draw call: the face, the back (turned
 * round, so it reads correctly from behind) and the thin wooden frame
 * between them, whose UVs all sit on the board's own painted wooden border.
 * It was three meshes — busy rooms carry twenty-odd signs, ≈40 draw calls
 * on a phone for nothing (measured 25 Oct 2026).
 */
function signGeometry(w: number, h: number): BufferGeometry {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}`;
  let g = signGeometries.get(key);
  if (!g) {
    const front = new PlaneGeometry(w, h).translate(0, 0, 0.011);
    const back = new PlaneGeometry(w, h).rotateY(Math.PI).translate(0, 0, -0.011);
    const frame = new BoxGeometry(w + 0.04, h + 0.04, 0.02);
    const uv = frame.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.004, 0.5);
    g = mergeGeometries([front, back, frame]) ?? front;
    if (g !== front) front.dispose();
    back.dispose();
    frame.dispose();
    signGeometries.set(key, g);
  }
  return g;
}

/** A sign with real Hangul, readable from both sides (or only the front, over gates). */
export function Signboard({ text, w, h, aspect = 1, oneSided = false, icon }: { text: string; w: number; h: number; aspect?: number; oneSided?: boolean; icon?: WorldIcon }) {
  const tex = useSignTexture(text, aspect, icon);
  const mat = useMemo(() => new MeshBasicMaterial({ map: tex, toneMapped: false }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  // One-sided boards (over gates) have no back and no frame box: from outside
  // the room — where only the camera ever goes — they are simply not there.
  if (oneSided)
    return (
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[w, h]} />
        <primitive object={mat} attach="material" />
      </mesh>
    );
  return <mesh geometry={signGeometry(w, h)} material={mat} castShadow dispose={null} />;
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
  // Built as a kit (one instanced draw per finish, ≈7) instead of ≈18 meshes:
  // every room has one or two of these walls.
  const kit = useMemo(() => gateWallKit(z, facing, open, halfWidth, accent), [z, facing, open, halfWidth, accent]);
  return (
    <group>
      <Batch kit={kit} />
      {sign && (
        <group position={[0, 2.25, z + facing * 0.12]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
          <Signboard text={sign} w={1.3} h={0.65} aspect={2} oneSided />
        </group>
      )}
    </group>
  );
}

function gateWallKit(z: number, facing: 1 | -1, open: boolean, halfWidth: number, accent: boolean): Kit {
  const k = new Kit();
  const gateHalf = 1.8;
  const segW = halfWidth + 0.6 - gateHalf;
  const segX = gateHalf + segW / 2;
  const inner = z + facing * 0.12;
  for (const x of [-segX, segX]) {
    k.box("plaster", [x, 1.4, z], [segW, 2.8, 0.4], true);
    k.box("stoneWarm", [x, 0.45, z], [segW + 0.04, 0.9, 0.46]);
    k.box("woodDark", [x, 2.72, z], [segW + 0.02, 0.14, 0.44]);
    k.add("roofSoft", "roof:9", [x, 2.8, z], [(segW + 0.5) / 9, 0.5, 1.2], undefined, true);
  }
  // Gate frame: dark timber on stone feet; a usable gate adds one thin yellow line.
  for (const x of [-1.7, 1.7]) {
    k.box("woodDark", [x, 1.6, inner], [0.26, 3.2, 0.26], true);
    k.box("stoneWarm", [x, 0.14, inner], [0.44, 0.28, 0.44]);
  }
  k.box("woodDark", [0, 3.12, inner], [3.9, 0.24, 0.3], true);
  if (accent) k.box("accent", [0, 2.96, inner + facing * 0.155], [3.2, 0.045, 0.02]);
  // The little tiled roof over the gate.
  k.box("woodLight", [0, 3.25, inner], [4.3, 0.1, 0.8], true);
  k.add("roofSoft", "roof:4", [0, 3.3, inner], [4.6 / 4, 0.62, 1.3], undefined, true);
  if (!open) {
    // A shut gate: two doors, closed.
    k.box("woodDark", [0, 1.35, z], [3.2, 2.7, 0.14], true);
    k.box("charcoal", [0, 1.35, z + facing * 0.075], [0.05, 2.7, 0.02]);
  }
  return k;
}

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
export function InfoBoard({ text, w, tall, icon }: { text: string; w: number; tall?: boolean; icon?: WorldIcon }) {
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
        <Signboard text={text} w={w} h={h} aspect={aspect} icon={icon} />
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
