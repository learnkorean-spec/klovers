import { useMemo } from "react";
import { MAT } from "../config/materials";
import { HUB, hubGateSpot, type HubGate } from "../config/rooms";
import Instanced, { UNIT, type Part } from "./Instanced";
import { Gate, Signboard } from "./parts";
import { paintPaving, useTiledTexture } from "./textures";

/**
 * The KLOVERS Hub — the square every path leads to.
 *
 * Gates on three walls, each named in Korean: 카페 (the Conversation Café,
 * open from Level 2), 게임 and 수업 (doors out to the site's games and
 * lessons), and the worlds still ahead — 문화 거리, 서울, 기억 정원 — shut
 * and barred. A signpost in the middle points at every one of them, and
 * rooftops crowd in behind the walls: the world is bigger than this square.
 */

const H = HUB.half;
const WALL_H = 2.8;

/** Where a gate stands (on the wall's inner face) and which way it faces. */
function gatePose(g: HubGate): { x: number; z: number; rotY: number } {
  const s = hubGateSpot(g, 0.12);
  // Gate local +z faces into the room.
  if (g.wall === "north") return { x: s.x, z: s.z, rotY: 0 };
  if (g.wall === "west") return { x: s.x, z: s.z, rotY: Math.PI / 2 };
  return { x: s.x, z: s.z, rotY: -Math.PI / 2 };
}

function useWalls() {
  return useMemo(() => {
    const body: Part[] = [], base: Part[] = [], eave: Part[] = [];
    const walls: { p: [number, number, number]; s: [number, number, number] }[] = [
      { p: [0, WALL_H / 2, -H - 0.2], s: [H * 2 + 0.8, WALL_H, 0.4] },
      { p: [-H - 0.2, WALL_H / 2, 0], s: [0.4, WALL_H, H * 2] },
      { p: [H + 0.2, WALL_H / 2, 0], s: [0.4, WALL_H, H * 2] },
      // South wall in two pieces around the gate back to the market.
      { p: [-(H + 1.8) / 2 - 0.2, WALL_H / 2, H + 0.2], s: [H - 1.8 + 0.4, WALL_H, 0.4] },
      { p: [(H + 1.8) / 2 + 0.2, WALL_H / 2, H + 0.2], s: [H - 1.8 + 0.4, WALL_H, 0.4] },
    ];
    for (const w of walls) {
      body.push({ p: w.p, s: w.s });
      base.push({ p: [w.p[0], 0.45, w.p[2]], s: [w.s[0] + 0.02, 0.9, w.s[2] + 0.02] });
      eave.push({ p: [w.p[0], WALL_H + 0.12, w.p[2]], s: [w.s[0] + 0.8, 0.2, w.s[2] + 0.8] });
    }
    return { body, base, eave };
  }, []);
}

/** Rooftops of the wider world beyond the walls. */
function useSkyline() {
  return useMemo(() => {
    const body: Part[] = [], roof: Part[] = [];
    const ring: [number, number, number][] = [
      [-8, -H - 5, 5.5], [0, -H - 7, 7.5], [8, -H - 5, 6], [-H - 5, -6, 4.5], [-H - 5, 5, 5],
      [H + 5, -6, 5.2], [H + 5, 5, 4.4], [-7, H + 5, 4], [7, H + 5, 4.6],
    ];
    ring.forEach(([x, z, h]) => {
      body.push({ p: [x, h / 2, z], s: [6, h, 5.5] });
      roof.push({ p: [x, h + 0.9, z], s: [7.6, 1.8, 7] });
    });
    return { body, roof };
  }, []);
}

/** Clover inlay: four warm-wood circles set into the paving. */
function Inlay() {
  return (
    <>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[sx * 1.55, 0.006, sz * 1.55]}>
          <circleGeometry args={[2, 32]} />
          <primitive object={MAT.woodWarm} attach="material" />
        </mesh>
      ))}
    </>
  );
}

/** The signpost: one arm per destination, turned toward its gate. */
function Signpost() {
  const arms = HUB.gates.map((g, i) => {
    const s = hubGateSpot(g);
    const yaw = Math.atan2(s.x, s.z);
    return { g, yaw, y: 2.7 - i * 0.34 };
  });
  return (
    <group position={[HUB.post.x, 0, HUB.post.z]}>
      <mesh castShadow position={[0, 1.6, 0]} scale={[0.2, 3.2, 0.2]}>
        <primitive object={UNIT.box} attach="geometry" />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, 0]} scale={[HUB.post.size, 0.2, HUB.post.size]}>
        <primitive object={UNIT.box} attach="geometry" />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      {arms.map(({ g, yaw, y }) => (
        // A board along the arm, read from either side.
        <group key={g.id} position={[0, y, 0]} rotation={[0, yaw - Math.PI / 2, 0]}>
          <group position={[0.62, 0, 0]}>
            <Signboard text={g.sign} w={1.0} h={0.3} aspect={3.3} />
          </group>
        </group>
      ))}
    </group>
  );
}

export default function Hub({ cafeOpen }: { cafeOpen: boolean }) {
  const paving = useTiledTexture(paintPaving, H, H);
  const walls = useWalls();
  const sky = useSkyline();
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[H * 2, H * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Inlay />
      <Instanced parts={walls.body} material={MAT.plaster} receiveShadow />
      <Instanced parts={walls.base} material={MAT.charcoal} />
      <Instanced parts={walls.eave} material={MAT.charcoal} castShadow />
      <Instanced parts={sky.body} material={MAT.plaster} />
      <Instanced parts={sky.roof} material={MAT.roofTile} geometry={UNIT.hipRoof} />

      {HUB.gates.map((g) => {
        const pose = gatePose(g);
        const usable = g.kind === "link" || (g.kind === "room" && cafeOpen);
        return <Gate key={g.id} {...pose} open={usable} accent={usable} barred={g.kind === "future"} sign={g.sign} />;
      })}
      {/* South: the way back to the market */}
      <Gate x={0} z={H + 0.08} rotY={Math.PI} open accent sign="시장" />
      <Signpost />
    </group>
  );
}
