import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { ACCENT, MAT, std } from "../config/materials";
import { CULTURE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { REDUCED_MOTION } from "../systems/motion";
import Batch from "./Batch";
import { Kit, bunting, curvedRoofOn, flowers, hanokHouse, jitter, pot, shopfront, tree, wallRun } from "./kit";
import { GateWall, Lamps, Signboard, Sway } from "./parts";
import { paintPaving, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { FLOOR_GRID } from "../config/world";

/**
 * Culture Street — canon worlds[4] (course Level 3): "a refined Korean
 * cultural street combining modern Seoul and traditional details".
 *
 * West side: hanok fronts (the elder's doorway, the food stall's house);
 * east side: modern two-storey shops with a hanok step and the hanbok shop.
 * North end: a festival arch with a string of lanterns. Each stop is in
 * config/interactions ("Culture Street"); what the learner learns shows:
 * the dishes they know appear on the table, and the festival lanterns
 * light up once 설날 or 추석 is learned (canon: the world changes with
 * real learning, never by itself).
 */

const HW = CULTURE.halfWidth;
const HL = CULTURE.halfLength;
const FACE_X = HW + 0.15;

const STREET_KIT: Kit = (() => {
  const k = new Kit();
  // West: three hanok fronts.
  ([[8.2, 2.5], [1.2, 2.8], [-6.0, 2.6]] as const).forEach(([z, h], n) => {
    const w = 4.2 + jitter(n + 3, 0.3);
    hanokHouse(k, { x: -(FACE_X + w / 2), z, w, d: 6.2, h, face: "+x", door: n === 0 ? -0.8 : 0.6, roofH: 1.05 + (n % 2) * 0.2 });
  });
  // East: modern shops, with a lower hanok between them (the shoe step).
  shopfront(k, { x: FACE_X + 1.9, z: 9.4, w: 3.6, d: 4.4, h: 4.2, face: "-x" });
  hanokHouse(k, { x: FACE_X + 2.2, z: CULTURE.step.z, w: 4.2, d: 4.8, h: 2.4, face: "-x", door: 0, roofH: 1.0 });
  shopfront(k, { x: FACE_X + 1.9, z: -1.6, w: 3.6, d: 4.6, h: 3.6, face: "-x" });
  shopfront(k, { x: FACE_X + 1.9, z: -7.0, w: 3.6, d: 5.2, h: 4.6, face: "-x" });

  // The hanok step: a wide stone, shoes lined up on it.
  const s = CULTURE.step;
  k.box("stoneWarm", [s.x, 0.12, s.z], [s.w, 0.24, s.d], true);
  k.box("woodLight", [s.x + 0.35, 0.38, s.z], [0.9, 0.06, s.d - 0.2], true);
  for (let i = 0; i < 3; i++) {
    const z = s.z - 0.7 + i * 0.7;
    for (const dz of [-0.07, 0.07]) {
      k.box(i === 1 ? "charcoal" : "woodDark", [s.x - 0.25, 0.3, z + dz], [0.26, 0.09, 0.1], true);
      k.box(i === 1 ? "charcoal" : "woodDark", [s.x - 0.18, 0.36, z + dz], [0.1, 0.05, 0.1]);
    }
  }

  // The food stall: a counter under a striped canopy, against the hanok.
  const st = CULTURE.stall;
  k.box("woodLight", [st.x, 0.46, st.z], [st.w, 0.92, st.d], true);
  k.box("woodDark", [st.x, 0.95, st.z], [st.w + 0.1, 0.06, st.d + 0.1]);
  for (const sz of [-1, 1]) k.box("woodDark", [st.x + st.w / 2 - 0.05, 1.5, st.z + sz * (st.d / 2 - 0.05)], [0.08, 3.0, 0.08], true);
  for (let i = 0; i < 6; i++) {
    const z = st.z - st.d / 2 - 0.1 + (i + 0.5) * ((st.d + 0.2) / 6);
    k.box(i % 2 ? "fabric" : "clothRed", [st.x + 0.2, 2.75, z], [st.w + 0.9, 0.05, (st.d + 0.2) / 6], true, [0, 0, -0.2]);
  }

  // The table across the street: two stools.
  const t = CULTURE.table;
  k.add("woodLight", "cyl", [t.x, 0.72, t.z], [t.r * 2, 0.05, t.r * 2], undefined, true);
  k.add("charcoal", "cyl", [t.x, 0.36, t.z], [0.1, 0.72, 0.1]);
  for (const sx of [-1, 1]) k.add("woodDark", "cyl", [t.x + sx * 0.85, 0.23, t.z], [0.4, 0.46, 0.4], undefined, true);

  // The festival arch: two red posts, a beam, a little tiled roof.
  const az = CULTURE.arch.z;
  for (const sx of [-1, 1]) {
    k.add("stoneWarm", "oct", [sx * (HW - 0.6), 0.15, az], [0.6, 0.3, 0.6], undefined, true);
    k.box("clothRed", [sx * (HW - 0.6), 2.4, az], [CULTURE.arch.post, 4.8, CULTURE.arch.post], true);
  }
  k.box("woodDark", [0, 4.6, az], [HW * 2 + 0.2, 0.24, 0.34], true);
  k.box("accent", [0, 4.35, az + 0.18], [HW * 2 - 1.6, 0.03, 0.015]);
  curvedRoofOn(k, 0, 4.75, az, HW * 2 + 1.4, 1.4, 0.6);
  // Behind the arch, a big hanok closes the street: the festival hall.
  hanokHouse(k, { x: 0, z: -HL - 3.4, w: 9, d: 4.2, h: 3.0, face: "+z", roofH: 1.2 });

  // Planting: flowers by doors, onggi pots, trees beyond the roofs.
  flowers(k, -4.5, 4.6, 0.7, 3);
  flowers(k, 4.5, 6.6, 0.6, 5);
  pot(k, -4.5, -3.4, 0.8, true);
  pot(k, 4.55, 0.9, 0.75, false);
  for (const [tx, tz] of [[-12, 4], [12.5, -3], [-11.5, -9], [12, 9]] as const) tree(k, tx, tz, 1.3, false, tx + tz);
  // Bunting across the street, and the south wall around the Hub gate.
  bunting(k, -HW, 5.2, HW, 5.2, 4.1, 2);
  wallRun(k, -HW - 0.2, HL + 0.3, -HW - 0.2, HL - 2.0, 2.0, 0.35);
  wallRun(k, HW + 0.2, HL + 0.3, HW + 0.2, HL - 2.0, 2.0, 0.35);
  return k;
})();

/* ── The stops' own things, finer than the kit ── */

const dishWhite = std(PALETTE.white, 0.35);
const kimchiMat = std("#C8321E", 0.6);
const riceMat = std("#FFFFFF", 0.75);
const eggMat = std("#F5C842", 0.4);
const greensMat = std("#4E8A2E", 0.6);
const carrotMat = std("#E37A26", 0.55);
const sauceMat = std("#B11E1E", 0.35);
const cakeMat = std("#F0E2C8", 0.55);
const bowlDark = std("#2E2E2E", 0.3);

/** A dish by its word: kimchi, bibimbap or tteokbokki. */
function Dish({ word, x, z, y }: { word: string; x: number; z: number; y: number }) {
  return (
    <group position={[x, y, z]}>
      {word === "비빔밥" ? (
        <>
          <mesh castShadow position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.08, 0.1, 28, 1, true]} />
            <primitive object={bowlDark} attach="material" />
          </mesh>
          <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.112, 28]} />
            <primitive object={riceMat} attach="material" />
          </mesh>
          {(
            [
              [0.05, 0.03, greensMat],
              [-0.05, 0.03, carrotMat],
              [0, -0.055, greensMat],
            ] as const
          ).map(([dx, dz, m], i) => (
            <mesh key={i} position={[dx, 0.092, dz]} scale={[1, 0.3, 1]}>
              <sphereGeometry args={[0.035, 12, 8]} />
              <primitive object={m} attach="material" />
            </mesh>
          ))}
          <mesh position={[-0.02, 0.095, 0.01]} scale={[1, 0.25, 1]}>
            <sphereGeometry args={[0.03, 14, 10]} />
            <primitive object={eggMat} attach="material" />
          </mesh>
        </>
      ) : (
        <>
          <mesh castShadow position={[0, 0.012, 0]}>
            <cylinderGeometry args={[0.13, 0.11, 0.024, 28]} />
            <primitive object={dishWhite} attach="material" />
          </mesh>
          {word === "김치"
            ? [0, 1, 2, 3].map((i) => (
                <mesh key={i} position={[Math.cos(i * 1.7) * 0.04, 0.04, Math.sin(i * 1.7) * 0.04]} rotation={[0.3 * i, i, 0.4]} scale={[1, 0.35, 0.7]}>
                  <sphereGeometry args={[0.05, 12, 8]} />
                  <primitive object={kimchiMat} attach="material" />
                </mesh>
              ))
            : [0, 1, 2, 3, 4].map((i) => (
                <group key={i} position={[Math.cos(i * 1.3) * 0.05, 0.035, Math.sin(i * 1.3) * 0.05]} rotation={[0, i * 0.9, Math.PI / 2]}>
                  <mesh>
                    <cylinderGeometry args={[0.016, 0.016, 0.09, 12]} />
                    <primitive object={cakeMat} attach="material" />
                  </mesh>
                  <mesh scale={1.15}>
                    <cylinderGeometry args={[0.016, 0.016, 0.07, 12]} />
                    <primitive object={sauceMat} attach="material" />
                  </mesh>
                </group>
              ))}
        </>
      )}
    </group>
  );
}

const FOODS = ["김치", "비빔밥", "떡볶이"] as const;

const HANBOK = [
  { top: "#F2D0DC", skirt: "#B72C4A", ribbon: "#B72C4A" },
  { top: "#E8F0C8", skirt: "#2F5F8F", ribbon: "#F2C230" },
];

/** A hanbok on a dress stand: short jacket (jeogori) over a full skirt (chima). */
function HanbokStand({ x, z, c }: { x: number; z: number; c: (typeof HANBOK)[number] }) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 20]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.6, 0]}>
        <coneGeometry args={[0.36, 1.05, 28, 1, true]} />
        <primitive object={std(c.skirt, 0.75)} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.14, 0.17, 0.26, 20]} />
        <primitive object={std(c.top, 0.7)} attach="material" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} castShadow position={[s * 0.2, 1.17, 0]} rotation={[0, 0, s * 0.5]}>
          <cylinderGeometry args={[0.05, 0.07, 0.3, 12]} />
          <primitive object={std(c.top, 0.7)} attach="material" />
        </mesh>
      ))}
      <mesh position={[0.04, 1.12, 0.15]} rotation={[0.2, 0, -0.2]}>
        <boxGeometry args={[0.04, 0.22, 0.01]} />
        <primitive object={std(c.ribbon, 0.6)} attach="material" />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <sphereGeometry args={[0.07, 14, 10]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
    </group>
  );
}

const lanternOff = std("#E9DCC6", 0.85);
const lanternOn = std("#FFD7A0", 0.7, { emissive: "#FF9E3D", emissiveIntensity: 1.4 });
const lanternRed = std("#C8242B", 0.7, { emissive: "#D7263D", emissiveIntensity: 0.9 });

/** The festival lanterns under the arch: dark paper until a holiday is learned. */
function FestivalLanterns({ lit }: { lit: boolean }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!g.current || REDUCED_MOTION) return;
    g.current.children.forEach((c, i) => {
      c.rotation.z = Math.sin(clock.elapsedTime * 1.3 + i) * 0.05;
    });
  });
  const xs = useMemo(() => Array.from({ length: 9 }, (_, i) => -HW + 1.2 + (i * (HW * 2 - 2.4)) / 8), []);
  return (
    <group position={[0, 0, CULTURE.arch.z + 0.05]}>
      <mesh position={[0, 4.1, 0]}>
        <boxGeometry args={[HW * 2 - 1.2, 0.02, 0.02]} />
        <primitive object={MAT.charcoal} attach="material" />
      </mesh>
      <group ref={g}>
        {xs.map((x, i) => (
          <group key={x} position={[x, 4.1, 0]}>
            <mesh position={[0, -0.32, 0]} scale={[1, 1.25, 1]}>
              <sphereGeometry args={[0.2, 20, 14]} />
              <primitive object={lit ? (i % 3 === 1 ? lanternRed : lanternOn) : lanternOff} attach="material" />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 6]} />
              <primitive object={ACCENT} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
      {lit && <pointLight position={[0, 3.6, 1.2]} color="#FFB060" intensity={3} distance={9} decay={2} />}
    </group>
  );
}

export default function CultureStreet({ words = [] }: { words?: string[] }) {
  const paving = useTiledTexture(paintPaving, HW, HL);
  const photo = usePhotoFloor("paving", HW, HL);
  const foods = FOODS.filter((f) => words.includes(f));
  const lit = words.includes("설날") || words.includes("추석");
  const st = CULTURE.stall;
  const t = CULTURE.table;
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HL * 2, ...FLOOR_GRID]} />
        <meshStandardMaterial key={photo ? "photo" : "painted"} map={photo?.map ?? paving} normalMap={photo?.normal ?? null} roughnessMap={photo?.rough ?? null} roughness={photo ? 1 : 0.95} color={photo ? "#F4EBDD" : "#ffffff"} onBeforeCompile={floorBreakup} customProgramCacheKey={FLOOR_BREAKUP_KEY} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80, ...FLOOR_GRID]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={STREET_KIT} />

      {/* The stall's three dishes, always shown: they are what it sells. */}
      {FOODS.map((f, i) => (
        <Dish key={f} word={f} x={st.x + 0.15} y={0.98} z={st.z + (i - 1) * 1.0} />
      ))}
      <group position={[st.x + st.w / 2 + 0.02, 2.0, st.z]} rotation={[0, Math.PI / 2, 0]}>
        <Signboard text="분식" w={1.0} h={0.42} aspect={2.4} />
      </group>
      {/* The table: whatever food the learner knows is served here. */}
      {foods.map((f, i) => (
        <Dish key={f} word={f} x={t.x + (i - (foods.length - 1) / 2) * 0.3} y={0.745} z={t.z + (i % 2 ? 0.12 : -0.08)} />
      ))}

      {/* The hanbok shop's door: two dressed stands and its sign. */}
      <HanbokStand x={CULTURE.hanbok.x} z={CULTURE.hanbok.z - 0.5} c={HANBOK[0]} />
      <HanbokStand x={CULTURE.hanbok.x + 0.05} z={CULTURE.hanbok.z + 0.45} c={HANBOK[1]} />
      <group position={[FACE_X + 0.02, 3.2, CULTURE.hanbok.z]} rotation={[0, -Math.PI / 2, 0]}>
        <Signboard text="한복" w={1.0} h={0.5} aspect={2} />
      </group>

      {/* The street's name over the arch, and its lanterns. */}
      <group position={[0, 5.2, CULTURE.arch.z + 0.2]}>
        <Signboard text={CULTURE.sign} w={1.8} h={0.5} aspect={3.6} />
      </group>
      <FestivalLanterns lit={lit} />
      {[-1, 1].map((sx, i) => (
        <group key={sx} position={[sx * (HW - 0.6) + sx * -0.25, 3.9, CULTURE.arch.z + 0.25]}>
          <Sway axis="x" amp={0.07} speed={1.4} phase={i * 1.7}>
            <mesh position={[0, -0.7, 0]}>
              <boxGeometry args={[0.4, 1.4, 0.02]} />
              <primitive object={std(i ? "#2F5F8F" : "#C8242B", 0.8)} attach="material" />
            </mesh>
          </Sway>
        </group>
      ))}

      <Lamps spots={CULTURE.lamps as unknown as { x: number; z: number }[]} size={0.28} />
      {/* South: back to the Hub. */}
      <GateWall z={HL + 0.2} facing={-1} open accent={false} halfWidth={HW} />
    </group>
  );
}
