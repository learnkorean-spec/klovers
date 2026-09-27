import { useLayoutEffect, useMemo, useRef } from "react";
import { InstancedMesh, Object3D } from "three";
import { PALETTE, POSTS, PROPS, ROOM } from "../config/world";
import type { MutableRefObject } from "react";
import type { StoryState } from "../systems/story";
import { MAT } from "../config/materials";
import CloverEgg from "./CloverEgg";
import Instanced, { UNIT, type Part } from "./Instanced";
import { paintPlanks, useTiledTexture } from "./textures";
import { ACCENT, std } from "../config/materials";

/**
 * The prototype lobby: a quiet hanok courtyard, 22 m × 18 m.
 *
 * Wooden maru floor around a pale stone madang, ivory walls on a charcoal
 * base, dark wood columns, paper lattice windows (changsal) and a charcoal
 * eave all round. The dormant clover egg rests on a plinth in the middle.
 * Simple geometry, one procedural 256 px texture, no downloads.
 */

const { halfWidth: HW, halfDepth: HD, wallHeight: WH, wallThickness: WT } = ROOM;

interface Bay {
  /** Centre of the bay along the wall. */
  cx: number;
  cz: number;
  width: number;
  /** Rotation about y so the panel faces into the room. */
  rotY: number;
  /** The bay behind the egg is a closed gate, not a window. */
  gate: boolean;
}

/** Wall bays between neighbouring columns, all four walls. */
function computeBays(): Bay[] {
  const bays: Bay[] = [];
  const along = (from: number, to: number, spacing: number) => {
    const out: number[] = [];
    for (let v = from; v < to - 1e-6; v += spacing) out.push(v + spacing / 2);
    return out;
  };
  for (const x of along(-HW, HW, PROPS.postSpacingX)) {
    bays.push({ cx: x, cz: -HD, width: PROPS.postSpacingX, rotY: 0, gate: false });
    bays.push({ cx: x, cz: HD, width: PROPS.postSpacingX, rotY: Math.PI, gate: false });
  }
  for (const z of along(-HD, HD, PROPS.postSpacingZ)) {
    bays.push({ cx: -HW, cz: z, width: PROPS.postSpacingZ, rotY: Math.PI / 2, gate: false });
    bays.push({ cx: HW, cz: z, width: PROPS.postSpacingZ, rotY: -Math.PI / 2, gate: false });
  }
  // The two middle bays of the far (north) wall become one gate.
  const north = bays.filter((b) => b.cz === -HD).sort((a, b) => Math.abs(a.cx) - Math.abs(b.cx));
  north[0].gate = true;
  north[1].gate = true;
  return bays;
}

/** All lattice bars of every window in a single instanced draw call. */
function Lattice({ bays }: { bays: Bay[] }) {
  const ref = useRef<InstancedMesh>(null);
  const windows = bays.filter((b) => !b.gate);
  const panelW = 2.4;
  const panelH = 1.3;
  const panelY = 1.75;
  const cols = 6;
  const rows = 4;
  const perWindow = cols + 1 + rows + 1;
  const count = windows.length * perWindow;

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    let i = 0;
    for (const b of windows) {
      const inward = 0.045; // just proud of the wall's inner face
      const nx = Math.sin(b.rotY);
      const nz = Math.cos(b.rotY);
      const baseX = b.cx + nx * inward;
      const baseZ = b.cz + nz * inward;
      // Unit vector along the wall.
      const ax = Math.cos(b.rotY);
      const az = -Math.sin(b.rotY);
      for (let c = 0; c <= cols; c++) {
        const off = -panelW / 2 + (panelW * c) / cols;
        o.position.set(baseX + ax * off, panelY, baseZ + az * off);
        o.rotation.set(0, b.rotY, 0);
        o.scale.set(0.045, panelH, 0.05);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
      for (let r = 0; r <= rows; r++) {
        o.position.set(baseX, panelY - panelH / 2 + (panelH * r) / rows, baseZ);
        o.rotation.set(0, b.rotY, 0);
        o.scale.set(panelW + 0.045, 0.045, 0.05);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [windows, cols, rows]);

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <boxGeometry args={[1, 1, 1]} />
        <primitive object={std(PALETTE.charcoal, 0.6)} attach="material" />
      </instancedMesh>
      {/* Hanji paper behind the lattice */}
      {windows.map((b, i) => (
        <mesh
          key={i}
          position={[b.cx + Math.sin(b.rotY) * 0.02, panelY, b.cz + Math.cos(b.rotY) * 0.02]}
          rotation={[0, b.rotY, 0]}
        >
          <planeGeometry args={[panelW, panelH]} />
          <primitive object={std(PALETTE.white, 0.95, { emissive: PALETTE.ivory, emissiveIntensity: 0.25 })} attach="material" />
        </mesh>
      ))}
    </>
  );
}

/**
 * The open gate in the north wall — the way into Hangul Village. The doors
 * stand folded back against the wall; daylight fills the opening.
 */
function Gate() {
  const z = -HD + WT / 2 + 0.02;
  return (
    <group position={[0, 0, z]}>
      {/* Daylight in the opening (just proud of the wall's inner face) */}
      <mesh position={[0, 1.35, -0.2]}>
        <planeGeometry args={[3.2, 2.7]} />
        <meshBasicMaterial color={PALETTE.white} toneMapped={false} />
      </mesh>
      {/* Doors: dark wood, folded open against the wall */}
      {[-1, 1].map((side) => (
        <mesh key={side} castShadow receiveShadow position={[side * 2.62, 1.35, -0.1]}>
          <boxGeometry args={[1.6, 2.7, 0.1]} />
          <primitive object={std(PALETTE.woodDark, 0.75)} attach="material" />
        </mesh>
      ))}
      {/* Yellow frame — the one bold brand accent in the room. Unlit and not
          tone-mapped, so it renders as exact Klovers yellow #FFFF00. */}
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} castShadow position={[x, 1.45, 0.08]}>
          <boxGeometry args={[0.2, 2.9, 0.2]} />
          <primitive object={ACCENT} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.95, 0.08]}>
        <boxGeometry args={[3.6, 0.22, 0.22]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
    </group>
  );
}

function Walls() {
  type V3 = [number, number, number];
  const walls: { pos: V3; size: V3 }[] = [
    { pos: [0, WH / 2, -HD - WT / 2], size: [HW * 2 + WT * 2, WH, WT] },
    { pos: [0, WH / 2, HD + WT / 2], size: [HW * 2 + WT * 2, WH, WT] },
    { pos: [-HW - WT / 2, WH / 2, 0], size: [WT, WH, HD * 2] },
    { pos: [HW + WT / 2, WH / 2, 0], size: [WT, WH, HD * 2] },
  ];
  return (
    <>
      {walls.map((w, i) => (
        <group key={i}>
          <mesh receiveShadow position={w.pos}>
            <boxGeometry args={w.size} />
            <primitive object={std(PALETTE.ivory, 0.95)} attach="material" />
          </mesh>
          {/* Charcoal base band (wainscot) */}
          <mesh position={[w.pos[0], 0.45, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.9, w.size[2] + 0.02]} />
            <primitive object={std(PALETTE.charcoal, 0.85)} attach="material" />
          </mesh>
          {/* Eave: a dark overhang that frames the open sky */}
          <mesh castShadow position={[w.pos[0], WH + 0.12, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 1.6, 0.24, w.size[2] + 1.6]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Posts() {
  const s = PROPS.postSize;
  return (
    <>
      {POSTS.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh castShadow position={[0, WH / 2, 0]}>
            <boxGeometry args={[s, WH, s]} />
            <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
          </mesh>
          {/* Stone footing (chotdol) */}
          <mesh receiveShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[s + 0.16, 0.16, s + 0.16]} />
            <primitive object={std(PALETTE.stone, 1)} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Benches() {
  return (
    <>
      {PROPS.benches.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh castShadow receiveShadow position={[0, 0.45, 0]}>
            <boxGeometry args={[b.w, 0.1, b.d]} />
            <primitive object={std(PALETTE.woodWarm, 0.7)} attach="material" />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * (b.w / 2 - 0.2), 0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, b.d - 0.1]} />
              <primitive object={std(PALETTE.woodDark, 0.8)} attach="material" />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

/** Low stone lanterns with a warm paper light box. Emissive only — no lights. */
function Lanterns() {
  const s = PROPS.lanternSize;
  return (
    <>
      {PROPS.lanterns.map((l, i) => (
        <group key={i} position={[l.x, 0, l.z]}>
          <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[s * 0.55, 0.6, s * 0.55]} />
            <primitive object={std(PALETTE.stone, 1)} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0]}>
            <boxGeometry args={[s * 0.8, 0.44, s * 0.8]} />
            <primitive object={std(PALETTE.white, 0.9, { emissive: PALETTE.ivory, emissiveIntensity: 0.35 })} attach="material" />
          </mesh>
          <mesh castShadow position={[0, 1.1, 0]}>
            <boxGeometry args={[s, 0.1, s]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/**
 * Village rooftops just beyond the courtyard walls, so the first room reads
 * as part of the same world as Hangul Village (and the north gate reads as
 * the way into it). Two draw calls.
 */
const NEIGHBOURS: { body: Part[]; roof: Part[] } = (() => {
  const body: Part[] = [], roof: Part[] = [];
  const spots: [number, number, number, number][] = [
    // x, z, width (x), depth (z)
    [-8, -HD - 4, 6, 4.6], [8, -HD - 4, 6, 4.6],
    [-HW - 4, -3, 4.6, 6], [-HW - 4, 5, 4.6, 5], [HW + 4, -3, 4.6, 6], [HW + 4, 5, 4.6, 5],
    [-6, HD + 4, 6, 4.6], [6, HD + 4, 6, 4.6],
  ];
  for (const [x, z, w, d] of spots) {
    body.push({ p: [x, 1.6, z], s: [w, 3.2, d] });
    roof.push({ p: [x, 3.2 + 0.9, z], s: [w + 1.5, 1.8, d + 1.5] });
  }
  return { body, roof };
})();

export default function Lobby({ story }: { story: MutableRefObject<StoryState> }) {
  const plank = useTiledTexture(paintPlanks, HW / 1.5, HD / 1.5);
  const bays = useMemo(computeBays, []);

  return (
    <group>
      {/* Maru floor */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2]} />
        <meshStandardMaterial map={plank} roughness={0.8} />
      </mesh>
      {/* Stone madang in the centre */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[8, 8]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      {/* Ground beyond the walls, seen past the eaves */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>

      <Walls />
      <Posts />
      <Lattice bays={bays} />
      <Gate />
      <Benches />
      <Lanterns />
      <CloverEgg story={story} />
      <Instanced parts={NEIGHBOURS.body} material={MAT.plaster} />
      <Instanced parts={NEIGHBOURS.roof} material={MAT.roofTile} geometry={UNIT.hipRoof} />
    </group>
  );
}
