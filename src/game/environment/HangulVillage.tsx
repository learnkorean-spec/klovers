import { MAT } from "../config/materials";
import { VILLAGE } from "../config/rooms";
import { PALETTE } from "../config/world";
import Batch from "./Batch";
import { Kit, hanokHouse, hanokRoof, jitter, pot, steppingStones, wallRun } from "./kit";
import { Gate, GateWall, Lamps, Signboard, Sway } from "./parts";
import { paintPaving, useTiledTexture } from "./textures";

/**
 * Room 2 — Hangul Village, the first learning world (canon: worlds[0]).
 *
 * "I am walking inside the Korean language": one street of hanok houses,
 * each a little different in size and roof, every door with a hanging
 * signboard carrying one of the first letters a learner reads (ㄱ ㄴ ㄷ ㄹ ㅁ
 * on the left, ㅏ ㅓ ㅗ ㅜ on the right). The 한글 마을 gate is the landmark,
 * the well marks the middle. Where the last house on the right would be, a
 * yellow-framed lane leads to the KLOVERS Hub (open to all); at the far end
 * the market gate, 시장, opens at Level 1. The ㄱ sign — the one a learner
 * can read closely — carries a thin yellow edge: noticed, not announced.
 */

const HW = VILLAGE.halfWidth;
const HL = VILLAGE.halfLength;
const FACE_X = HW + 0.3;
const ARCH_Z = VILLAGE.arch.z;
const ARCH_X = VILLAGE.arch.x;
const LAMP_SPOTS = VILLAGE.lampZ.flatMap((z) => [
  { x: -VILLAGE.lampX, z },
  { x: VILLAGE.lampX, z },
]);

interface SignSpot {
  x: number;
  z: number;
  letter: string;
  learn: boolean;
}

/** Houses on both sides (the right side stops at the Hub lane). */
const HOUSES: { side: -1 | 1; z: number; i: number }[] = VILLAGE.houseZ.flatMap((z, i) => {
  const out: { side: -1 | 1; z: number; i: number }[] = [{ side: -1, z, i }];
  if (z !== VILLAGE.hubLaneZ) out.push({ side: 1, z, i });
  return out;
});

const SIGNS: SignSpot[] = HOUSES.map(({ side, z, i }) => {
  const letters = side < 0 ? VILLAGE.lettersLeft : VILLAGE.lettersRight;
  // South → north: the house nearest the village gate carries the first letter.
  const southIndex = VILLAGE.houseZ.length - 1 - i;
  const letter = letters[southIndex] ?? "";
  return { x: side * FACE_X - side * 0.62, z: z + 0.9, letter, learn: side < 0 && southIndex === 0 };
}).filter((s) => s.letter);

const VILLAGE_KIT: Kit = (() => {
  const k = new Kit();
  HOUSES.forEach(({ side, z, i }, n) => {
    const w = 4.4 + jitter(n + 1, 0.35);
    const d = VILLAGE.houseLength + jitter(n + 7, 0.3);
    hanokHouse(k, {
      x: side * (FACE_X + w / 2),
      z,
      w,
      d,
      h: 2.35 + ((i + (side > 0 ? 1 : 0)) % 3) * 0.2,
      face: side < 0 ? "+x" : "-x",
      door: 0.9,
      roofH: 1.0 + ((i + n) % 2) * 0.25,
    });
    // Bracket for the hanging signboard.
    k.box("woodDark", [side * FACE_X - side * 0.4, 2.62, z + 0.9], [0.8, 0.07, 0.07]);
    // An onggi pot or two by some doors.
    if ((i + n) % 2 === 0) pot(k, side * (FACE_X - 0.55), z - 1.6, 0.7, n % 3 !== 0);
  });

  // The lane to the Hub: short walls either side, and the Hub's roofs beyond.
  const laneZ = VILLAGE.hubLaneZ;
  wallRun(k, HW + 0.3, laneZ - 1.9, HW + 6, laneZ - 1.9, 2.2);
  wallRun(k, HW + 0.3, laneZ + 1.9, HW + 6, laneZ + 1.9, 2.2);
  steppingStones(k, HW + 0.4, laneZ, HW + 5.4, laneZ, 0.9, 41, "stoneWarm");
  hanokRoof(k, HW + 9, laneZ, 3.2, 5, 6, 1.4);

  // The landmark gate: two posts, a double beam, a small tiled roof.
  for (const x of [-ARCH_X, ARCH_X]) {
    k.add("stoneWarm", "oct", [x, 0.15, ARCH_Z], [0.55, 0.3, 0.55], undefined, true);
    k.box("woodDark", [x, 1.9, ARCH_Z], [VILLAGE.arch.post, 3.8, VILLAGE.arch.post], true);
  }
  k.box("woodDark", [0, 3.35, ARCH_Z], [ARCH_X * 2 + 0.6, 0.2, 0.3], true);
  k.box("woodDark", [0, 3.75, ARCH_Z], [ARCH_X * 2 + 1.2, 0.24, 0.34], true);
  k.box("accent", [0, 3.35, ARCH_Z + 0.16], [ARCH_X * 2 - 0.6, 0.03, 0.015]);
  k.add("roof", "hip", [0, 4.1, ARCH_Z], [ARCH_X * 2 + 2, 0.55, 1.3], undefined, true);

  // A slate path up the middle of the street.
  steppingStones(k, 0, HL - 1, 0, 1.4, 1.1, 5, "stoneWarm");
  steppingStones(k, 0, -1.4, 0, -HL + 1, 1.1, 29, "stoneWarm");
  return k;
})();

function Well() {
  const { x, z } = VILLAGE.well;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.37, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.8, 0.86, 0.74, 8]} />
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      <mesh position={[0, 0.745, 0]} rotation={[0, Math.PI / 8, 0]}>
        <cylinderGeometry args={[0.84, 0.84, 0.06, 8]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.66, 16]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} castShadow position={[sx * 0.72, 1.2, 0]}>
          <boxGeometry args={[0.1, 1.7, 0.1]} />
          <primitive object={MAT.woodDark} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.15, 0]} scale={[2.1, 0.45, 1.3]}>
        <coneGeometry args={[Math.SQRT1_2, 1, 4, 1]} />
        <primitive object={MAT.roofTile} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 8]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
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
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      {/* Kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow position={[s * (HW + 0.15), 0.08, 0]} scale={[0.3, 0.16, HL * 2]}>
          <boxGeometry />
          <primitive object={MAT.charcoal} attach="material" />
        </mesh>
      ))}
      <Batch kit={VILLAGE_KIT} />
      <Lamps spots={LAMP_SPOTS} size={VILLAGE.lampSize} />
      <Well />

      {/* Hanging signboards, one letter per door, gently swaying. */}
      {SIGNS.map((s, i) => (
        <group key={`${s.x}${s.z}`} position={[s.x, 2.58, s.z]}>
          <Sway amp={0.045} speed={1.1 + (i % 3) * 0.17} phase={i * 1.7} axis="z">
            <group position={[0, -0.46, 0]}>
              {s.learn && (
                // The sign a learner can read up close: a thin yellow edge.
                <mesh position={[0, 0, 0]} scale={[0.74, 0.74, 0.012]}>
                  <boxGeometry />
                  <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
                </mesh>
              )}
              <Signboard text={s.letter} w={0.62} h={0.62} />
            </group>
          </Sway>
        </group>
      ))}

      <group position={[0, 2.95, ARCH_Z]}>
        <Signboard text={VILLAGE.entranceSign} w={2.6} h={0.72} aspect={3.4} />
      </group>

      {/* East: the lane to the KLOVERS Hub (yellow: the way on). */}
      <Gate x={HW + 0.25} z={VILLAGE.hubLaneZ} rotY={-Math.PI / 2} open accent sign={VILLAGE.hubSign} />
      {/* North: the market (Level 1). South: back to the courtyard. */}
      <GateWall z={-HL - 0.2} facing={1} open={marketOpen} sign={VILLAGE.marketSign} halfWidth={HW} />
      <GateWall z={HL + 0.2} facing={-1} open halfWidth={HW} />
    </group>
  );
}
