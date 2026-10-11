import { HOUSE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { ACCENT, std } from "../config/materials";
import { GateWall, Signboard } from "./parts";
import { paintPlanks, useTiledTexture } from "./textures";

/**
 * Klovers House (안내소) — the Hub's information house. Not a world.
 *
 * A bright hanok hall, open to the sky like the café. "우리는 클로버스"
 * (we are Klovers) faces the door; every other board stands on two posts
 * under a little tiled cap and names one part of the site in Korean. In the
 * middle, a stone dais carries the clover. Walking up to a board opens its
 * card (what it is, and a link to the page).
 */

const HW = HOUSE.halfWidth;
const HD = HOUSE.halfDepth;
const WALL_H = 2.9;

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
          <mesh position={[w.pos[0], 0.4, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.02, 0.8, w.size[2] + 0.02]} />
            <primitive object={std(PALETTE.woodDark, 0.8)} attach="material" />
          </mesh>
          <mesh castShadow position={[w.pos[0], WALL_H + 0.12, w.pos[2]]}>
            <boxGeometry args={[w.size[0] + 0.7, 0.2, w.size[2] + 0.7]} />
            <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** A board on two posts with a small tiled cap and a thin yellow rail. */
function Board({ text, w, tall }: { text: string; w: number; tall?: boolean }) {
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

/** The stone dais and the clover on it (four yellow leaves). */
function CloverDais() {
  const { x, z, r } = HOUSE.dais;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
        <cylinderGeometry args={[r, r + 0.12, 0.32, 40]} />
        <primitive object={std("#EFE6D4", 0.9)} attach="material" />
      </mesh>
      <mesh receiveShadow position={[0, 0.36, 0]}>
        <cylinderGeometry args={[r - 0.25, r - 0.2, 0.1, 40]} />
        <primitive object={std(PALETTE.woodWarm, 0.7)} attach="material" />
      </mesh>
      <group position={[0, 0.95, 0]} rotation={[0, Math.PI / 4, 0]}>
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2;
          return (
            <mesh key={i} castShadow position={[Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 28]} />
              <primitive object={ACCENT} attach="material" />
            </mesh>
          );
        })}
      </group>
      <mesh castShadow position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 0.6, 8]} />
        <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
      </mesh>
    </group>
  );
}

/** Paper lanterns hanging from two beams. */
function Beams() {
  const zs = [-2.2, 2.4];
  return (
    <>
      {zs.map((z) => (
        <group key={z}>
          <mesh castShadow position={[0, WALL_H - 0.05, z]}>
            <boxGeometry args={[HW * 2 + 0.4, 0.18, 0.2]} />
            <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
          </mesh>
          {[-3.5, 0, 3.5].map((x) => (
            <group key={x} position={[x, 0, z]}>
              <mesh position={[0, 2.62, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.4, 6]} />
                <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
              </mesh>
              <mesh position={[0, 2.3, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 0.32, 16]} />
                <primitive object={std(PALETTE.white, 0.9, { emissive: PALETTE.ivory, emissiveIntensity: 0.8 })} attach="material" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </>
  );
}

export default function KloversHouse() {
  const planks = useTiledTexture(paintPlanks, HW / 1.5, HD / 1.5);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2]} />
        <meshStandardMaterial map={planks} roughness={0.8} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[70, 70]} />
        <primitive object={std(PALETTE.stone, 1)} attach="material" />
      </mesh>
      <Walls />
      {HOUSE.boards.map((b) => (
        <group key={b.id} position={[b.x, 0, b.z]} rotation={[0, b.yaw, 0]}>
          <Board text={b.id === "about" ? HOUSE.signs.about.replace(" ", "\n") : HOUSE.signs[b.id]} w={b.w} tall={b.id === "about"} />
        </group>
      ))}
      <CloverDais />
      <Beams />
      {/* The door back to the Hub, with the house's name over it (inside). */}
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} sign={HOUSE.sign} />
    </group>
  );
}
