import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, Shape, TubeGeometry, Vector2, Vector3 } from "three";
import { HOUSE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { MAT, std } from "../config/materials";
import { GateWall, InfoBoard as Board } from "./parts";
import Batch from "./Batch";
import { Kit, curvedRoofOn } from "./kit";
import { paintPlanks, useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY } from "./textures";
import { FLOOR_GRID } from "../config/world";

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

/**
 * The three hall walls, framed like a hanok: dark timber posts on a cut-stone
 * base, a middle rail and a head rail with white plaster between, a band of
 * lattice paper transoms (교창) under the top beam, and a short tiled coping
 * on top. One kit, built once (a few instanced draws instead of plain slabs).
 */
function wallsKit(): Kit {
  const k = new Kit();
  const T = 0.4; // wall thickness
  const STONE = 0.5;
  const HEAD = 2.12; // underside of the head rail
  const BEAM = WALL_H - 0.12; // underside of the top beam
  // Each wall: its middle line, along x (back) or z (sides), and which way is in.
  const walls = [
    { along: "x" as const, at: -HD - T / 2, from: -HW - T, to: HW + T, inward: 1 },
    { along: "z" as const, at: -HW - T / 2, from: -HD - T / 2, to: HD + T / 2, inward: 1 },
    { along: "z" as const, at: HW + T / 2, from: -HD - T / 2, to: HD + T / 2, inward: -1 },
  ];
  type V3 = [number, number, number];
  for (const w of walls) {
    const len = w.to - w.from;
    const mid = (w.from + w.to) / 2;
    const face = w.at + w.inward * (T / 2); // the inner face
    // a point u along the wall, y up, o out from the inner face (into the room)
    const at = (u: number, y: number, o: number): V3 => (w.along === "x" ? [u, y, face + w.inward * o] : [face + w.inward * o, y, u]);
    const size = (a: number, h: number, d: number): V3 => (w.along === "x" ? [a, h, d] : [d, h, a]);
    k.box("plaster", w.along === "x" ? [mid, WALL_H / 2, w.at] : [w.at, WALL_H / 2, mid], size(len, WALL_H, T), true);
    // Cut-stone base, a little proud, with a darker joint line on top.
    k.box("stoneWarm", at(mid, STONE / 2, 0.02), size(len, STONE, 0.06));
    // The inner span, corner post to corner post.
    const a0 = w.along === "x" ? -HW : -HD;
    const a1 = w.along === "x" ? HW : HD;
    const bays = 6;
    const bay = (a1 - a0) / bays;
    for (let i = 0; i <= bays; i++) {
      const u = a0 + i * bay;
      // Posts: corner posts a touch heavier.
      const pw = i === 0 || i === bays ? 0.26 : 0.2;
      k.box("woodDark", at(u, WALL_H / 2, 0.05), size(pw, WALL_H, 0.1), true);
      // A round stone foot under each post.
      k.box("stoneWarm", at(u, 0.09, 0.08), size(pw + 0.14, 0.18, 0.16));
    }
    // Rails: middle rail on the stone base, head rail, top beam.
    k.box("woodDark", at(0, STONE + 0.05, 0.035), size(a1 - a0, 0.1, 0.07));
    k.box("woodDark", at(0, HEAD + 0.06, 0.035), size(a1 - a0, 0.12, 0.07));
    k.box("woodDark", at(0, BEAM + 0.06, 0.04), size(a1 - a0, 0.12, 0.08));
    // Lattice paper transoms between head rail and top beam, one per bay.
    const ty0 = HEAD + 0.12;
    const ty1 = BEAM;
    const th = ty1 - ty0;
    const ty = (ty0 + ty1) / 2;
    for (let i = 0; i < bays; i++) {
      const c = a0 + (i + 0.5) * bay;
      const pw = bay - 0.2 - 0.16; // clear of the posts, with a frame
      k.box("paper", at(c, ty, 0.012), size(pw, th - 0.06, 0.012));
      // Frame (stiles) and the lattice: thin upright bars, two cross bars.
      for (const s of [-1, 1]) k.box("woodDark", at(c + s * (pw / 2 + 0.03), ty, 0.03), size(0.06, th, 0.05));
      const n = Math.max(6, Math.round(pw / 0.17));
      for (let j = 1; j < n; j++) k.box("woodDark", at(c - pw / 2 + (j * pw) / n, ty, 0.026), size(0.022, th - 0.04, 0.025));
      for (const f of [1 / 3, 2 / 3]) k.box("woodDark", at(c, ty0 + 0.03 + f * (th - 0.06), 0.026), size(pw, 0.022, 0.025));
    }
    // Plaster panel below the head rail is the wall itself. A short tiled
    // coping along the top, like the courtyard's walls.
    curvedRoofOn(k, w.along === "x" ? mid : w.at, WALL_H, w.along === "x" ? w.at : mid, w.along === "x" ? len + 0.5 : 1.15, w.along === "x" ? 1.15 : len + 0.5, 0.48, true);
  }
  return k;
}

function Walls() {
  const kit = useMemo(() => wallsKit(), []);
  return <Batch kit={kit} />;
}

/**
 * The clover itself: four heart-shaped leaves with soft, bevelled edges,
 * their points meeting in the middle, on a gently curved stem, standing
 * upright and facing the door like the Klovers mark. Built once.
 */
function useCloverGeometry() {
  return useMemo(() => {
    // A heart, point at the origin, lobes 0.4 m out along +y.
    const heart = new Shape();
    const pts: Vector2[] = [];
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push(new Vector2(hx * 0.0125, (hy + 17) * 0.0125));
    }
    heart.setFromPoints(pts);
    const leaf = new ExtrudeGeometry(heart, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 3, curveSegments: 12 });
    leaf.translate(0, 0, -0.02);
    const stem = new TubeGeometry(
      new CatmullRomCurve3([new Vector3(0, 0.4, 0), new Vector3(0.05, 0.62, 0.02), new Vector3(0.02, 0.82, 0), new Vector3(0, 0.98, -0.02)]),
      20, 0.024, 8, false,
    );
    return { leaf, stem };
  }, []);
}

/** The stone dais and the clover on it (four yellow leaves). */
function CloverDais() {
  const { x, z, r } = HOUSE.dais;
  const { leaf, stem } = useCloverGeometry();
  // The dais, turned like cut stone: a broad foot with a chamfer, a cove up
  // into the drum, and a lipped top with a softened edge.
  const dais = useMemo(() => {
    const p: [number, number][] = [
      [0, 0], [r + 0.2, 0], [r + 0.2, 0.05], [r + 0.15, 0.08], [r + 0.06, 0.095], [r + 0.02, 0.11], [r, 0.13],
      [r, 0.27], [r + 0.03, 0.285], [r + 0.06, 0.3], [r + 0.065, 0.33], [r + 0.05, 0.35], [r + 0.02, 0.36], [0, 0.36],
    ];
    return new LatheGeometry(p.map(([a, b]) => new Vector2(a, b)), 64);
  }, [r]);
  useEffect(() => () => { leaf.dispose(); stem.dispose(); dais.dispose(); }, [leaf, stem, dais]);
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow geometry={dais}>
        <primitive object={MAT.stoneWarm} attach="material" />
      </mesh>
      {/* A brass ring round the inlaid wooden top. */}
      <mesh receiveShadow position={[0, 0.372, 0]}>
        <cylinderGeometry args={[r - 0.17, r - 0.17, 0.03, 48]} />
        <primitive object={std("#C9A646", 0.35, { metalness: 0.6 })} attach="material" />
      </mesh>
      <mesh receiveShadow position={[0, 0.38, 0]}>
        <cylinderGeometry args={[r - 0.22, r - 0.22, 0.03, 48]} />
        <primitive object={MAT.woodWarm} attach="material" />
      </mesh>
      {/* Four leaves in an X, each tipped a little toward the door. */}
      <group position={[0, 1.02, -0.02]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, Math.PI / 4 + (i * Math.PI) / 2]}>
            <mesh castShadow geometry={leaf} rotation={[0.18, 0, 0]}>
              {/* Lit brand yellow (not the flat unlit accent), so the
                  leaves' bevels and curve read as a real sculpture. */}
              <primitive object={std(PALETTE.yellow, 0.42, { emissive: PALETTE.yellow, emissiveIntensity: 0.22 })} attach="material" />
            </mesh>
          </group>
        ))}
      </group>
      <mesh castShadow geometry={stem}>
        <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
      </mesh>
    </group>
  );
}

/**
 * A hanging paper lantern (청사초롱-style drum): a rounded barrel with the
 * bamboo hoops showing as soft ridges, under and over small wooden caps.
 */
function useLanternGeometry() {
  return useMemo(() => {
    const prof: Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const y = -0.16 + 0.32 * t;
      const round = Math.sqrt(Math.max(0, 1 - Math.pow((y / 0.19), 2)));
      const hoop = 1 + 0.035 * Math.cos(t * Math.PI * 2 * 4);
      prof.push(new Vector2(0.17 * round * hoop, y));
    }
    return new LatheGeometry(prof, 28);
  }, []);
}
/** Paper lanterns hanging from two beams. */
function Beams() {
  const lantern = useLanternGeometry();
  useEffect(() => () => lantern.dispose(), [lantern]);
  // The beam by the door keeps its middle lantern out of the way: it hung
  // right at the top of the view as the learner walked in.
  const rows = [
    { z: -2.2, xs: [-3.5, 0, 3.5] },
    { z: 2.4, xs: [-3.5, 3.5] },
  ];
  return (
    <>
      {rows.map(({ z, xs }) => (
        <group key={z}>
          <mesh castShadow position={[0, WALL_H - 0.05, z]}>
            <boxGeometry args={[HW * 2 + 0.4, 0.18, 0.2]} />
            <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
          </mesh>
          {xs.map((x) => (
            <group key={x} position={[x, 0, z]}>
              <mesh position={[0, 2.64, 0]}>
                <cylinderGeometry args={[0.008, 0.008, 0.36, 6]} />
                <primitive object={std(PALETTE.charcoal, 0.8)} attach="material" />
              </mesh>
              <mesh position={[0, 2.46, 0]}>
                <cylinderGeometry args={[0.07, 0.1, 0.04, 16]} />
                <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
              </mesh>
              <mesh geometry={lantern} position={[0, 2.3, 0]}>
                <primitive object={std(PALETTE.white, 0.9, { emissive: PALETTE.ivory, emissiveIntensity: 0.8 })} attach="material" />
              </mesh>
              <mesh position={[0, 2.13, 0]}>
                <cylinderGeometry args={[0.1, 0.07, 0.04, 16]} />
                <primitive object={std(PALETTE.woodDark, 0.7)} attach="material" />
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
      {HOUSE.boards.map((b) => (
        <group key={b.id} position={[b.x, 0, b.z]} rotation={[0, b.yaw, 0]}>
          <Board text={b.id === "about" ? HOUSE.signs.about.replace(" ", "\n") : HOUSE.signs[b.id]} w={b.w} tall={b.id === "about"} icon={HOUSE.icons[b.id]} />
        </group>
      ))}
      <CloverDais />
      <Beams />
      {/* The door back to the Hub, with the house's name over it (inside). */}
      <GateWall z={HD + 0.2} facing={-1} open accent={false} halfWidth={HW} sign={HOUSE.sign} />
    </group>
  );
}
