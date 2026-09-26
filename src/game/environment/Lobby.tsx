import { useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, InstancedMesh, Object3D, RepeatWrapping, SRGBColorSpace } from "three";
import { PALETTE, POSTS, PROPS, ROOM } from "../config/world";
import CloverEgg from "./CloverEgg";

/**
 * The prototype lobby: a quiet hanok courtyard, 22 m × 18 m.
 *
 * Wooden maru floor around a pale stone madang, ivory walls on a charcoal
 * base, dark wood columns, paper lattice windows (changsal) and a charcoal
 * eave all round. The dormant clover egg rests on a plinth in the middle.
 * Simple geometry, one procedural 256 px texture, no downloads.
 */

const { halfWidth: HW, halfDepth: HD, wallHeight: WH, wallThickness: WT } = ROOM;

/** Plank pattern drawn once on a small canvas (no image download). */
function usePlankTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = PALETTE.woodWarm;
      ctx.fillRect(0, 0, size, size);
      const rows = 8;
      for (let r = 0; r < rows; r++) {
        const y = (r * size) / rows;
        // Subtle per-plank tone so the floor is not a flat colour.
        ctx.fillStyle = r % 2 ? "rgba(107,74,51,0.10)" : "rgba(255,249,236,0.06)";
        ctx.fillRect(0, y, size, size / rows);
        ctx.fillStyle = "rgba(46,46,46,0.35)";
        ctx.fillRect(0, y, size, 1.5);
        const seam = ((r * 97) % size) + 20;
        ctx.fillRect(seam % size, y, 1.5, size / rows);
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(HW / 1.5, HD / 1.5);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

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
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.6} />
      </instancedMesh>
      {/* Hanji paper behind the lattice */}
      {windows.map((b, i) => (
        <mesh
          key={i}
          position={[b.cx + Math.sin(b.rotY) * 0.02, panelY, b.cz + Math.cos(b.rotY) * 0.02]}
          rotation={[0, b.rotY, 0]}
        >
          <planeGeometry args={[panelW, panelH]} />
          <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.ivory} emissiveIntensity={0.25} roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

/** The closed gate in the north wall — the way on, for a later stage. */
function Gate() {
  const z = -HD + WT / 2 + 0.02;
  return (
    <group position={[0, 0, z]}>
      {/* Doors: dark wood, closed */}
      <mesh castShadow receiveShadow position={[0, 1.35, 0.02]}>
        <boxGeometry args={[3.2, 2.7, 0.12]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.35, 0.09]}>
        <boxGeometry args={[0.05, 2.7, 0.02]} />
        <meshStandardMaterial color={PALETTE.charcoal} />
      </mesh>
      {/* Yellow frame — the one bold brand accent in the room. Unlit and not
          tone-mapped, so it renders as exact Klovers yellow #FFFF00. */}
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} castShadow position={[x, 1.45, 0.08]}>
          <boxGeometry args={[0.2, 2.9, 0.2]} />
          <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.95, 0.08]}>
        <boxGeometry args={[3.6, 0.22, 0.22]} />
        <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
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
            <meshStandardMaterial color={PALETTE.ivory} roughness={0.95} />
          </mesh>
          {/* Charcoal base band (wainscot) */}
          <mesh position={[w.pos[0], 0.45, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.9, w.size[2] + 0.02]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.85} />
          </mesh>
          {/* Eave: a dark overhang that frames the open sky */}
          <mesh castShadow position={[w.pos[0], WH + 0.12, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 1.6, 0.24, w.size[2] + 1.6]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
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
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
          </mesh>
          {/* Stone footing (chotdol) */}
          <mesh receiveShadow position={[0, 0.08, 0]}>
            <boxGeometry args={[s + 0.16, 0.16, s + 0.16]} />
            <meshStandardMaterial color={PALETTE.stone} roughness={1} />
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
            <meshStandardMaterial color={PALETTE.woodWarm} roughness={0.7} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} castShadow position={[side * (b.w / 2 - 0.2), 0.2, 0]}>
              <boxGeometry args={[0.12, 0.4, b.d - 0.1]} />
              <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />
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
            <meshStandardMaterial color={PALETTE.stone} roughness={1} />
          </mesh>
          <mesh castShadow position={[0, 0.82, 0]}>
            <boxGeometry args={[s * 0.8, 0.44, s * 0.8]} />
            <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.ivory} emissiveIntensity={0.35} roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 1.1, 0]}>
            <boxGeometry args={[s, 0.1, s]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function Lobby() {
  const plank = usePlankTexture();
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
        <meshStandardMaterial color={PALETTE.stone} roughness={1} />
      </mesh>
      {/* Ground beyond the walls, seen past the eaves */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={1} />
      </mesh>

      <Walls />
      <Posts />
      <Lattice bays={bays} />
      <Gate />
      <Benches />
      <Lanterns />
      <CloverEgg />
    </group>
  );
}
