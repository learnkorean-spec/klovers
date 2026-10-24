import { DoubleSide } from "three";
import { CAFE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { GateWall, Signboard } from "./parts";
import { paintPlanks, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { ACCENT, std } from "../config/materials";
import { FLOOR_GRID } from "../config/world";

/**
 * Conversation Café — the third world (canon: worlds[2]).
 *
 * "Warm Korean café designed around small real-life conversation
 * situations": a counter with a menu board (메뉴 · 커피 · 녹차 · 케이크),
 * four tables for two, pendant lamps on wooden beams. The barista takes
 * orders (config/interactions "shop-cafe"); two students at a table talk.
 * What the learner has ordered appears on the tables, once it is a word
 * they know (canon memorySystem: 커피 → coffee).
 */

const HW = CAFE.halfWidth;
const HD = CAFE.halfDepth;
const WALL_H = 2.8;
const BEAM_Z = [CAFE.tables[0].z, CAFE.tables[2].z];

function Walls() {
  type V3 = [number, number, number];
  const walls: { pos: V3; size: V3 }[] = [
    { pos: [0, WALL_H / 2, -HD - 0.2], size: [HW * 2 + 0.8, WALL_H, 0.4] },
    { pos: [-HW - 0.2, WALL_H / 2, 0], size: [0.4, WALL_H, HD * 2 + 0.4] },
    { pos: [HW + 0.2, WALL_H / 2, 0], size: [0.4, WALL_H, HD * 2 + 0.4] },
  ];
  return (
    <>
      {walls.map((w, i) => (
        <group key={i}>
          <mesh receiveShadow position={w.pos}>
            <boxGeometry args={w.size} />
            <primitive object={std(PALETTE.ivory, 0.95)} attach="material" />
          </mesh>
          <mesh position={[w.pos[0], 0.45, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.9, w.size[2] + 0.02]} />
            <primitive object={std(PALETTE.charcoal, 0.85)} attach="material" />
          </mesh>
          <mesh castShadow position={[w.pos[0], WALL_H + 0.12, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.7, 0.2, w.size[2] + 0.7]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Paper windows on the side walls */}
      {[-1, 1].flatMap((side) =>
        [-2.5, 2.5].map((z) => (
          <group key={`${side}${z}`} position={[side * (HW - 0.01), 1.65, z]} rotation={[0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh>
              <boxGeometry args={[2, 1.1, 0.04]} />
              <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[1.86, 0.96]} />
              <primitive object={std(PALETTE.white, 0.95, { emissive: PALETTE.ivory, emissiveIntensity: 0.35 })} attach="material" />
            </mesh>
            {[-0.31, 0.31].map((x) => (
              <mesh key={x} position={[x, 0, 0.03]}>
                <boxGeometry args={[0.03, 0.96, 0.02]} />
                <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
              </mesh>
            ))}
          </group>
        )),
      )}
    </>
  );
}

function Counter() {
  const { x, z, w, d } = CAFE.counter;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.52, 0]}>
        <boxGeometry args={[w, 1.04, d]} />
        <primitive object={std(PALETTE.woodWarm, 0.7)} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.07, 0]}>
        <boxGeometry args={[w + 0.1, 0.06, d + 0.1]} />
        <primitive object={std(PALETTE.charcoal, 0.5)} attach="material" />
      </mesh>
      {/* Coffee machine */}
      <mesh castShadow position={[-1.9, 1.36, -0.1]}>
        <boxGeometry args={[0.7, 0.52, 0.45]} />
        <primitive object={std(PALETTE.charcoal, 0.35, { metalness: 0.3 })} attach="material" />
      </mesh>
      <mesh position={[-1.9, 1.5, 0.13]}>
        <boxGeometry args={[0.5, 0.06, 0.02]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      {/* Cups waiting on the counter */}
      {[0.2, 0.55, 0.9, 1.25].map((cx) => (
        <mesh key={cx} castShadow position={[cx, 1.15, 0.15]}>
          <cylinderGeometry args={[0.055, 0.045, 0.11, 12]} />
          <primitive object={std(PALETTE.white, 0.4)} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

const cupMat = std(PALETTE.white, 0.35);
const coffeeMat = std("#5A3418", 0.25);
const teaMat = std("#8DB255", 0.3);
const saucerMat = std(PALETTE.white, 0.4);
const spongeMat = std("#F3DDB8", 0.8);
const creamMat = std("#F2A7B8", 0.6);
const berryMat = std("#C8242B", 0.35);

/** A cup on its saucer, filled with coffee or green tea. */
function Cup({ x, z, tea }: { x: number; z: number; tea?: boolean }) {
  return (
    <group position={[x, 0.765, z]}>
      <mesh castShadow position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.085, 0.07, 0.012, 28]} />
        <primitive object={saucerMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.048, 0.036, 0.08, 28, 1, true]} />
        <primitive object={cupMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.045, 28]} />
        <primitive object={tea ? teaMat : coffeeMat} attach="material" />
      </mesh>
      <mesh position={[0.055, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.018, 0.006, 8, 16, Math.PI]} />
        <primitive object={cupMat} attach="material" />
      </mesh>
    </group>
  );
}

/** A slice of strawberry cake on a plate. */
function Cake({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.765, z]}>
      <mesh castShadow position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.09, 0.08, 0.01, 28]} />
        <primitive object={saucerMat} attach="material" />
      </mesh>
      {/* A wedge: a third of a short cylinder. */}
      <mesh castShadow position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.06, 20, 1, false, 0, Math.PI / 3]} />
        <primitive object={spongeMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.074, 0]}>
        <cylinderGeometry args={[0.076, 0.076, 0.012, 20, 1, false, 0, Math.PI / 3]} />
        <primitive object={creamMat} attach="material" />
      </mesh>
      <mesh position={[Math.sin(Math.PI / 6) * 0.045, 0.092, Math.cos(Math.PI / 6) * 0.045]}>
        <sphereGeometry args={[0.014, 12, 10]} />
        <primitive object={berryMat} attach="material" />
      </mesh>
    </group>
  );
}

function Table({ x, z, words }: { x: number; z: number; words: string[] }) {
  const coffee = words.includes("커피");
  const tea = words.includes("녹차");
  const cake = words.includes("케이크");
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 24]} />
        <primitive object={std(PALETTE.woodWarm, 0.6)} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.05, 0.22, 0.72, 12]} />
        <primitive object={std(PALETTE.charcoal, 0.6)} attach="material" />
      </mesh>
      {/* Two places at the table: a drink each, and a cake between them. */}
      {(coffee || tea) && <Cup x={-0.24} z={0.05} tea={!coffee} />}
      {(coffee || tea) && <Cup x={0.24} z={-0.05} tea={tea} />}
      {cake && <Cake x={0} z={0.18} />}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.82, 0, 0]}>
          <mesh castShadow position={[0, 0.46, 0]}>
            <boxGeometry args={[0.42, 0.06, 0.42]} />
            <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
          </mesh>
          <mesh castShadow position={[side * 0.19, 0.72, 0]}>
            <boxGeometry args={[0.05, 0.5, 0.42]} />
            <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
          </mesh>
          {[-1, 1].flatMap((lx) =>
            [-1, 1].map((lz) => (
              <mesh key={`${lx}${lz}`} position={[lx * 0.17, 0.22, lz * 0.17]}>
                <boxGeometry args={[0.04, 0.44, 0.04]} />
                <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
              </mesh>
            )),
          )}
        </group>
      ))}
    </group>
  );
}

/** Wooden beams across the room with a pendant lamp over each table. */
function BeamsAndLamps() {
  return (
    <>
      {BEAM_Z.map((z) => (
        <mesh key={z} castShadow position={[0, WALL_H - 0.05, z]}>
          <boxGeometry args={[HW * 2 + 0.4, 0.18, 0.2]} />
          <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
        </mesh>
      ))}
      {CAFE.tables.map((t) => (
        <group key={`${t.x}${t.z}`} position={[t.x, 0, t.z]}>
          <mesh position={[0, 2.45, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.7, 6]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <coneGeometry args={[0.2, 0.18, 18, 1, true]} />
            <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} side={DoubleSide} />
          </mesh>
          <mesh position={[0, 1.98, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <primitive object={std(PALETTE.white, 0.8, { emissive: PALETTE.ivory, emissiveIntensity: 1 })} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function ConversationCafe({ words = [] }: { words?: string[] }) {
  const planks = useTiledTexture(paintPlanks, HW / 1.5, HD / 1.5);
  const photo = usePhotoFloor("planks", HW / 1.5, HD / 1.5);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? planks} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.8} color={photo ? "#FFF4E6" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[70, 70, ...FLOOR_GRID]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      <Walls />
      <Counter />
      {/* 카페 over the counter; the menu on the wall beside it */}
      <group position={[0, 2.25, -HD + 0.03]}>
        <Signboard text={CAFE.sign} w={1.8} h={0.7} aspect={2.6} />
      </group>
      <group position={[-4.9, 1.75, -HD + 0.03]}>
        <Signboard text={CAFE.menu} w={1.8} h={1.3} aspect={1.4} />
      </group>
      {CAFE.tables.map((t) => (
        <Table key={`${t.x}${t.z}`} x={t.x} z={t.z} words={words} />
      ))}
      <BeamsAndLamps />
      {/* The door back to the Hub */}
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}
