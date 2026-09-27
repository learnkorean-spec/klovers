import { useMemo } from "react";
import { MAT, std } from "../config/materials";
import { VILLAGE } from "../config/rooms";
import { PALETTE } from "../config/world";
import Instanced, { UNIT, type Part } from "./Instanced";
import { GateWall, Lamps, Signboard } from "./parts";
import { paintPaving, useTiledTexture } from "./textures";

/**
 * Hangul Village — the first learning world (canon: worlds[0]).
 *
 * One quiet street of hanok houses. Every door carries a hanging signboard
 * with one of the first letters a learner reads (ㄱ ㄴ ㄷ ㄹ ㅁ · ㅏ ㅓ ㅗ ㅜ ㅣ),
 * a well sits in the middle, and a banner arch reads 한글 마을. South: the
 * open gate back to the courtyard. North: the shut gate of 시장, the
 * Vocabulary Market, which opens only on a real Hangul milestone.
 */

const HW = VILLAGE.halfWidth;
const HL = VILLAGE.halfLength;
const HOUSE_D = VILLAGE.houseDepth;
const HOUSE_L = VILLAGE.houseLength;
const WALL_H = 2.6;
/** x of the street-facing house wall. */
const FACE_X = HW + 0.3;
const ARCH_Z = VILLAGE.arch.z;
const ARCH_X = VILLAGE.arch.x;
const LAMP_SPOTS = VILLAGE.lampZ.flatMap((z) => [
  { x: -VILLAGE.lampX, z },
  { x: VILLAGE.lampX, z },
]);

type P3 = [number, number, number];

/**
 * Every house on the street as instanced parts: ten houses cost six draw
 * calls instead of about 140. Signboards stay separate (each has a letter).
 */
function useHouseParts() {
  return useMemo(() => {
    const out = { plaster: [] as Part[], charcoal: [] as Part[], wood: [] as Part[], roof: [] as Part[], paper: [] as Part[] };
    VILLAGE.houseZ.forEach((z) => {
      ([-1, 1] as const).forEach((side) => {
        const cx = side * (FACE_X + HOUSE_D / 2);
        const face = cx - side * (HOUSE_D / 2); // x of the street-facing wall
        const at = (dx: number, y: number, dz: number): P3 => [face - side * dx, y, z + dz];
        out.plaster.push({ p: [cx, WALL_H / 2, z], s: [HOUSE_D, WALL_H, HOUSE_L] });
        out.charcoal.push({ p: [cx, 0.3, z], s: [HOUSE_D + 0.02, 0.6, HOUSE_L + 0.02] });
        out.charcoal.push({ p: at(0.02, 1.55, -1.3), s: [0.04, 0.8, 1.1] });
        out.paper.push({ p: at(0.045, 1.55, -1.3), s: [0.02, 0.68, 0.98] });
        for (const pz of [-HOUSE_L / 2, 0, HOUSE_L / 2]) out.wood.push({ p: at(0.05, WALL_H / 2, pz), s: [0.2, WALL_H, 0.2] });
        out.wood.push({ p: [cx, WALL_H + 0.08, z], s: [HOUSE_D + 1.2, 0.16, HOUSE_L + 1.2] });
        out.wood.push({ p: at(0.03, 1.0, 0.9), s: [0.08, 2.0, 1.1] });
        out.wood.push({ p: at(0.4, 2.5, 0.9), s: [0.8, 0.07, 0.07] });
        out.roof.push({ p: [cx, WALL_H + 0.16 + 0.65, z], s: [HOUSE_D + 1.5, 1.3, HOUSE_L + 1.5] });
      });
    });
    return out;
  }, []);
}

function Houses() {
  const parts = useHouseParts();
  return (
    <>
      <Instanced parts={parts.plaster} material={MAT.plaster} castShadow receiveShadow />
      <Instanced parts={parts.charcoal} material={MAT.charcoal} />
      <Instanced parts={parts.wood} material={MAT.woodDark} castShadow />
      <Instanced parts={parts.roof} material={MAT.roofTile} geometry={UNIT.hipRoof} castShadow />
      <Instanced parts={parts.paper} material={MAT.paper} />
      {/* Hanging signboards, square to the street so they read while
          walking; high enough to pass beneath. */}
      {VILLAGE.houseZ.map((z, i) =>
        ([-1, 1] as const).map((side) => {
          const letters = side < 0 ? VILLAGE.lettersLeft : VILLAGE.lettersRight;
          const face = side * FACE_X;
          return (
            <group key={`${side}${z}`} position={[face - side * 0.62, 2.12, z + 0.9]}>
              <Signboard text={letters[letters.length - 1 - i]} w={0.62} h={0.62} />
            </group>
          );
        }),
      )}
    </>
  );
}

function Well() {
  const { x, z } = VILLAGE.well;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 0.74, 24]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      <mesh position={[0, 0.745, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.76, 0.06, 8, 28]} />
        <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <primitive object={std(PALETTE.charcoal, 0.2)} attach="material" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} castShadow position={[sx * 0.72, 1.2, 0]}>
          <boxGeometry args={[0.1, 1.7, 0.1]} />
          <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.05, 0]}>
        <boxGeometry args={[1.9, 0.12, 1.1]} />
        <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 10]} />
        <primitive object={std(PALETTE.woodWarm, 0.7)} attach="material" />
      </mesh>
    </group>
  );
}

function Arch() {
  return (
    <group position={[0, 0, ARCH_Z]}>
      {[-ARCH_X, ARCH_X].map((x) => (
        <mesh key={x} castShadow position={[x, 1.75, 0]}>
          <boxGeometry args={[VILLAGE.arch.post, 3.5, VILLAGE.arch.post]} />
          <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[ARCH_X * 2 + 0.8, 0.26, 0.34]} />
        <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
      </mesh>
      <group position={[0, 2.85, 0]}>
        <Signboard text={VILLAGE.entranceSign} w={2.6} h={1} aspect={2.6} />
      </group>
    </group>
  );
}

export default function HangulVillage({ marketOpen }: { marketOpen: boolean }) {
  const paving = useTiledTexture(paintPaving, HW, HL);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2 + 0.6, HL * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[90, 90]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      {/* Kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow position={[s * (HW + 0.15), 0.08, 0]}>
          <boxGeometry args={[0.3, 0.16, HL * 2]} />
          <primitive object={std(PALETTE.charcoal, 0.9)} attach="material" />
        </mesh>
      ))}

      <Houses />
      <Lamps spots={LAMP_SPOTS} size={VILLAGE.lampSize} />
      <Well />
      <Arch />
      {/* North: the market gate, shut. South: open, back to the courtyard. */}
      <GateWall z={-HL - 0.2} facing={1} open={marketOpen} sign={VILLAGE.marketSign} halfWidth={HW} />
      <GateWall z={HL + 0.2} facing={-1} open halfWidth={HW} />
    </group>
  );
}
