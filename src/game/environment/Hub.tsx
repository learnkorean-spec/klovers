import { MAT } from "../config/materials";
import { HUB, hubGateSpot, type HubGate } from "../config/rooms";
import Batch from "./Batch";
import { Kit, hanokHouse, hanokRoof, pine, pot, shopfront, steppingStones, stoneLantern, wallRun } from "./kit";
import { Gate, Signboard } from "./parts";
import { paintPaving, useTiledTexture } from "./textures";

/**
 * Room 4 — the KLOVERS Hub: the square every path leads to.
 *
 * Landmark: a tall octagonal wayfinding pillar with a tiled cap and a thin
 * yellow band, its arms naming every destination in Korean; slate paths
 * radiate from it to each gate. What rises behind each gate says what it
 * leads to — the café's lit upper floor, the academy's big roof (수업), a
 * gate-house for the games (게임), and, for the worlds still ahead, the
 * lantern-strung roofs of Culture Street, the tall blocks of Seoul and the
 * great pines of Cluby's Memory Garden. Gates the learner can use are framed
 * in yellow; the rest are shut, but never grey: they are places to want.
 */

const H = HUB.half;
const GAP = 1.85;

interface Opening {
  wall: "north" | "south" | "west" | "east";
  along: number;
}

const SOUTH_GATES: { along: number; sign: string; id: string }[] = [
  { id: "village", along: HUB.southGates.village, sign: "한글 마을" },
  { id: "market", along: HUB.southGates.market, sign: "시장" },
];

const OPENINGS: Opening[] = [
  ...HUB.gates.map((g) => ({ wall: g.wall, along: g.along })),
  ...SOUTH_GATES.map((g) => ({ wall: "south" as const, along: g.along })),
];

/** Wall runs along one side, broken where gates stand. */
function wallWithGaps(k: Kit, wall: Opening["wall"]) {
  const gaps = OPENINGS.filter((o) => o.wall === wall).map((o) => o.along).sort((a, b) => a - b);
  let from = -H - 0.4;
  const put = (a: number, b: number) => {
    if (b - a < 0.2) return;
    if (wall === "north") wallRun(k, a, -H - 0.2, b, -H - 0.2);
    else if (wall === "south") wallRun(k, a, H + 0.2, b, H + 0.2);
    else if (wall === "west") wallRun(k, -H - 0.2, a, -H - 0.2, b);
    else wallRun(k, H + 0.2, a, H + 0.2, b);
  };
  for (const g of gaps) {
    put(from, g - GAP);
    from = g + GAP;
  }
  put(from, H + 0.4);
}

const HUB_KIT: Kit = (() => {
  const k = new Kit();
  (["north", "south", "west", "east"] as const).forEach((w) => wallWithGaps(k, w));

  // The landmark: octagonal base, pillar, yellow band, tiled cap.
  k.add("stoneWarm", "oct", [0, 0.15, 0], [HUB.post.size, 0.3, HUB.post.size], [0, Math.PI / 8, 0], true);
  k.add("woodLight", "oct", [0, 0.42, 0], [HUB.post.size - 0.5, 0.1, HUB.post.size - 0.5], [0, Math.PI / 8, 0]);
  k.add("stoneWarm", "oct", [0, 2.6, 0], [0.7, 4.3, 0.7], [0, Math.PI / 8, 0], true);
  k.add("accent", "oct", [0, 4.05, 0], [0.74, 0.1, 0.74], [0, Math.PI / 8, 0]);
  k.box("woodDark", [0, 4.8, 0], [1.2, 0.12, 1.2], true);
  k.add("roof", "hip", [0, 5.15, 0], [1.9, 0.6, 1.9], undefined, true);

  // Slate paths from the pillar to every gate.
  const spots = [...HUB.gates.map((g) => hubGateSpot(g, 1.2)), ...SOUTH_GATES.map((g) => ({ x: g.along, z: H - 1.2 }))];
  spots.forEach((s, i) => {
    const d = Math.hypot(s.x, s.z) || 1;
    steppingStones(k, (s.x / d) * 2.0, (s.z / d) * 2.0, s.x, s.z, 1.5, 60 + i * 13, "stoneWarm");
  });

  for (const [x, z, sc] of HUB.pots) pot(k, x, z, sc, sc > 0.9);
  for (const [x, z] of HUB.lanterns) stoneLantern(k, x, z);

  // Beyond the north wall: Culture Street (left), the café (middle), Seoul (right).
  shopfront(k, { x: 0, z: -H - 3.2, w: 5.2, d: 4, h: 3.6, face: "+z" });
  shopfront(k, { x: -7.2, z: -H - 3.4, w: 4, d: 3.8, h: 3.2, face: "+z" });
  shopfront(k, { x: -3.6, z: -H - 6.2, w: 3.6, d: 3.4, h: 2.8, face: "+z" });
  for (let x = -9.6; x <= -4.2; x += 0.9) k.box("lantern", [x, 4.55 - 0.25 * Math.sin(((x + 9.6) / 5.4) * Math.PI), -H - 1.2], [0.22, 0.3, 0.22]);
  k.box("charcoal", [-6.9, 4.7, -H - 1.2], [5.8, 0.02, 0.02]);
  const towers: [number, number, number, number][] = [
    [5.6, -H - 4.2, 3.2, 6.5], [8.6, -H - 5.2, 2.8, 8.4], [11.2, -H - 3.8, 2.6, 5.4],
  ];
  for (const [x, z, w, h] of towers) {
    k.box("plaster", [x, h / 2, z], [w, h, w], true);
    k.box("charcoal", [x, h + 0.08, z], [w + 0.2, 0.16, w + 0.2]);
    for (let y = 1.6; y < h - 0.6; y += 1.3) k.box("paper", [x, y, z + w / 2 + 0.01], [w - 0.6, 0.5, 0.02]);
  }
  // Beyond the west wall: the great pines of Cluby's Memory Garden.
  pine(k, -H - 3.2, -5.6, 2.3);
  pine(k, -H - 5.0, -2.4, 2.8);
  pine(k, -H - 3.0, -0.8, 1.9);
  // The games gate-house: a roof over the west gate.
  hanokRoof(k, -H - 0.2, 4, 2.9, 1.2, 4.2, 0.8);
  // The academy for lessons, rising behind the east gate.
  hanokHouse(k, { x: H + 3.4, z: -3.5, w: 5.2, d: 9, h: 3.2, face: "-x", roofH: 1.5 });
  // Behind the south wall: the village and market we came from.
  hanokRoof(k, -6, H + 4, 2.4, 5, 4, 1.1);
  shopfront(k, { x: 6, z: H + 3.6, w: 4.6, d: 3.6, h: 3.4, face: "-z" });
  return k;
})();

/** Where a gate stands (on the wall's inner face) and which way it faces. */
function gatePose(g: HubGate): { x: number; z: number; rotY: number } {
  const s = hubGateSpot(g, 0.12);
  if (g.wall === "north") return { x: s.x, z: s.z, rotY: 0 };
  if (g.wall === "west") return { x: s.x, z: s.z, rotY: Math.PI / 2 };
  return { x: s.x, z: s.z, rotY: -Math.PI / 2 };
}

/** One arm per destination, turned toward it, stacked up the pillar. */
function Signpost() {
  const arms = [
    ...HUB.gates.map((g) => ({ id: g.id, sign: g.sign, ...hubGateSpot(g) })),
    ...SOUTH_GATES.map((g) => ({ id: g.id, sign: g.sign, x: g.along, z: H - 0.9 })),
  ].map((a, i) => ({ ...a, yaw: Math.atan2(a.x, a.z), y: 3.9 - i * 0.27 }));
  return (
    <>
      {arms.map((a) => (
        <group key={a.id} position={[0, a.y, 0]} rotation={[0, a.yaw - Math.PI / 2, 0]}>
          <group position={[0.82, 0, 0]}>
            <Signboard text={a.sign} w={0.95} h={0.24} aspect={4} />
          </group>
        </group>
      ))}
    </>
  );
}

export default function Hub({ cafeOpen, marketOpen }: { cafeOpen: boolean; marketOpen: boolean }) {
  const paving = useTiledTexture(paintPaving, H, H);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[H * 2, H * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[110, 110]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={HUB_KIT} />
      <Signpost />
      {HUB.gates.map((g) => {
        const pose = gatePose(g);
        const usable = g.kind === "link" || (g.kind === "room" && cafeOpen);
        return <Gate key={g.id} {...pose} open={usable} accent={usable} barred={g.kind === "future"} sign={g.sign} />;
      })}
      {SOUTH_GATES.map((g) => {
        const usable = g.id === "village" || marketOpen;
        return <Gate key={g.id} x={g.along} z={H + 0.08} rotY={Math.PI} open={usable} accent={usable} sign={g.sign} />;
      })}
    </group>
  );
}
