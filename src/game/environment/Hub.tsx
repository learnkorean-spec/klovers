import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { ACCENT, MAT } from "../config/materials";
import { PALETTE } from "../config/world";
import { HUB, hubGateSpot, type HubGate } from "../config/rooms";
import Batch from "./Batch";
import { Kit, bed, grass, gutter, hanokHouse, hanokRoof, noticeBoard, pine, platform, pot, shopfront, stoneLantern, tree, wallRun, gatehouse, flowers, pathStrip } from "./kit";
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

  // The landmark: a small hanok pavilion (jeongja) on a two-step stone base.
  // Under its roof, the wayfinding post names every destination, and the
  // map of KLOVERS World faces everyone arriving from the south.
  const S = HUB.post.size;
  k.add("stoneWarm", "oct", [0, 0.12, 0], [S + 0.3, 0.24, S + 0.3], [0, Math.PI / 8, 0], true);
  k.add("stoneWarm", "oct", [0, 0.34, 0], [S - 0.3, 0.2, S - 0.3], [0, Math.PI / 8, 0], true);
  k.add("woodLight", "oct", [0, 0.46, 0], [S - 0.5, 0.05, S - 0.5], [0, Math.PI / 8, 0]);
  const P = 1.45;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    k.add("stoneWarm", "oct", [sx * P, 0.56, sz * P], [0.38, 0.2, 0.38]);
    k.add("woodDark", "cyl", [sx * P, 2.2, sz * P], [0.26, 3.4, 0.26], undefined, true);
  }
  const TOP = 3.9;
  for (const sz of [-1, 1]) k.box("woodDark", [0, TOP - 0.1, sz * P], [2 * P + 0.4, 0.24, 0.2], true);
  for (const sx of [-1, 1]) k.box("woodDark", [sx * P, TOP - 0.1, 0], [0.2, 0.24, 2 * P + 0.4], true);
  // Bracket blocks at each post head, and a low rail between the back posts.
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodLight", [sx * P, TOP + 0.08, sz * P], [0.4, 0.16, 0.4]);
  for (const sx of [-1, 1]) k.box("woodDark", [sx * P, 0.95, 0], [0.08, 0.08, 2 * P]);
  // Lower roof, then a second, smaller tier on a timber drum: a double-eave
  // pavilion that rises clearly above every wall — the centre of the world.
  hanokRoof(k, 0, 0, TOP, 2 * P + 0.4, 2 * P + 0.4, 0.95);
  k.box("woodDark", [0, TOP + 1.35, 0], [1.5, 0.75, 1.5], true);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.box("woodLight", [sx * 0.72, TOP + 1.35, sz * 0.72], [0.12, 0.75, 0.12]);
  for (const sz of [-1, 1]) k.box("paper", [0, TOP + 1.37, sz * 0.76], [1.1, 0.42, 0.02]);
  for (const sx of [-1, 1]) k.box("paper", [sx * 0.76, TOP + 1.37, 0], [0.02, 0.42, 1.1]);
  hanokRoof(k, 0, 0, TOP + 1.72, 1.5, 1.5, 0.8);
  // The central post that carries the direction boards.
  k.add("woodDark", "oct", [0, 2.0, 0], [0.34, 3.1, 0.34], [0, Math.PI / 8, 0], true);
  // Flower beds at the four corners of the base, framing the landmark.
  for (const [bx, bz] of HUB.flowerBeds) {
    k.box("stoneWarm", [bx, 0.12, bz], [1.25, 0.24, 1.25], true);
    flowers(k, bx, bz, 0.95, bx * 2 + bz, 0.18);
  }

  // Paved paths from the pavilion to every gate: wide to the places that
  // are open (the way you came, the café, lessons, games), narrower to the
  // worlds still ahead. They answer "where does this lead?" at a glance.
  const R0 = 2.35;
  for (const g of HUB.gates) {
    const s = hubGateSpot(g, 0.5);
    const d = Math.hypot(s.x, s.z) || 1;
    pathStrip(k, (s.x / d) * R0, (s.z / d) * R0, s.x, s.z, g.kind === "future" ? 0.85 : 1.2, g.along * 7 + 3);
  }
  for (const g of SOUTH_GATES) {
    const d = Math.hypot(g.along, H - 0.5);
    pathStrip(k, (g.along / d) * R0, ((H - 0.5) / d) * R0, g.along, H - 0.5, 1.2, g.along * 5 + 11);
  }

  for (const [x, z, sc] of HUB.pots) pot(k, x, z, sc, sc > 0.9);
  for (const [x, z] of HUB.lanterns) stoneLantern(k, x, z);
  // Drip-line gravel along the walls.
  for (const s of [-1, 1]) {
    gutter(k, s * (H - 0.27), -H, s * (H - 0.27), H);
    gutter(k, -H, s * (H - 0.27), H, s * (H - 0.27));
  }
  // Beds and trees soften the square's edges; grass at the pavilion's foot.
  HUB.beds.forEach((b, i) => {
    bed(k, b.x, b.z, b.w, b.d, 30 + i * 7);
    if (b.tree) tree(k, b.x, b.z, 1.15, false, 40 + i);
  });
  for (const [gx, gz] of [[-1.9, 1.6], [1.9, -1.7], [-1.8, -1.6], [2.0, 1.5]] as const) grass(k, gx, gz, 0.8, gx * 5 + gz);
  // A sitting corner (bench, pine, lantern) and a notice board by the academy.
  platform(k, HUB.bench.x, HUB.bench.z, HUB.bench.w, HUB.bench.d);
  pine(k, HUB.benchPine.x, HUB.benchPine.z, 1.15);
  noticeBoard(k, HUB.board.x, HUB.board.z, "-x");

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
  // (Set well back: the camera may stand in either south gateway.)
  hanokRoof(k, -6, H + 6, 2.4, 5, 4, 1.1);
  shopfront(k, { x: 6, z: H + 6, w: 4.6, d: 3.6, h: 3.4, face: "-z" });
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
  ].map((a, i) => ({ ...a, yaw: Math.atan2(a.x, a.z), y: 3.25 - i * 0.29 }));
  return (
    <>
      {arms.map((a) => (
        <group key={a.id} position={[0, a.y, 0]} rotation={[0, a.yaw - Math.PI / 2, 0]}>
          <group position={[0.6, 0, 0]}>
            <Signboard text={a.sign} w={1.0} h={0.25} aspect={4} />
          </group>
        </group>
      ))}
    </>
  );
}

/**
 * The map of KLOVERS World under the pavilion: painted once on a canvas —
 * the courtyard, the village street, the market, the square and the café,
 * joined by paths, with a small yellow dot for "you are here".
 */
function useMapTexture() {
  const tex = useMemo(() => {
    const w = 512;
    const h = 340;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#F1E3C4";
      ctx.fillRect(0, 0, w, h);
      // Paper edge.
      ctx.strokeStyle = "rgba(107,74,51,0.45)";
      ctx.lineWidth = 6;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      // Green land and a blue stream.
      ctx.fillStyle = "#B9C79A";
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.55, w * 0.44, h * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#9DB6C9";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(30, h * 0.2);
      ctx.bezierCurveTo(w * 0.3, h * 0.35, w * 0.2, h * 0.85, w * 0.45, h - 25);
      ctx.stroke();
      // Paths.
      ctx.strokeStyle = "#E9D9B6";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      const pts: [number, number][] = [[w * 0.32, h * 0.82], [w * 0.32, h * 0.45], [w * 0.5, h * 0.42], [w * 0.68, h * 0.62], [w * 0.5, h * 0.42], [w * 0.5, h * 0.18]];
      ctx.beginPath();
      ctx.moveTo(...pts[0]);
      for (const p of pts.slice(1)) ctx.lineTo(...p);
      ctx.stroke();
      // Places: little hanok roofs.
      const roof = (x: number, y: number, s: number) => {
        ctx.fillStyle = "#FFF9EC";
        ctx.fillRect(x - s * 0.7, y, s * 1.4, s * 0.8);
        ctx.fillStyle = PALETTE.charcoal;
        ctx.beginPath();
        ctx.moveTo(x - s, y + s * 0.1);
        ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.05, x - s * 0.35, y - s * 0.55);
        ctx.lineTo(x + s * 0.35, y - s * 0.55);
        ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.05, x + s, y + s * 0.1);
        ctx.closePath();
        ctx.fill();
      };
      roof(w * 0.32, h * 0.8, 22);
      roof(w * 0.26, h * 0.52, 16);
      roof(w * 0.38, h * 0.52, 16);
      roof(w * 0.68, h * 0.6, 20);
      roof(w * 0.5, h * 0.16, 20);
      roof(w * 0.5, h * 0.4, 26);
      // Trees.
      ctx.fillStyle = "#7D9A5B";
      for (const [tx, ty] of [[0.15, 0.6], [0.8, 0.4], [0.84, 0.72], [0.62, 0.25], [0.2, 0.35], [0.58, 0.82]]) {
        ctx.beginPath();
        ctx.arc(w * tx, h * ty, 11, 0, Math.PI * 2);
        ctx.fill();
      }
      // You are here: the one yellow mark.
      ctx.fillStyle = PALETTE.charcoal;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.47, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.yellow;
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.47, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

function MapBoard() {
  const map = useMapTexture();
  const z = 1.3;
  return (
    <group position={[0, 0, z]}>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} castShadow position={[x, 1.0, 0]}>
          <boxGeometry args={[0.09, 2.0, 0.09]} />
          <primitive object={MAT.woodDark} attach="material" />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.42, 0]}>
        <boxGeometry args={[1.62, 1.08, 0.07]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
      <mesh position={[0, 1.42, 0.037]}>
        <planeGeometry args={[1.48, 0.98]} />
        <meshStandardMaterial map={map} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.04, 0.02]}>
        <boxGeometry args={[1.8, 0.08, 0.26]} />
        <primitive object={MAT.roofSoft} attach="material" />
      </mesh>
    </group>
  );
}

/** Four small leaves on the pavilion's peak: the KLOVERS clover, the one yellow up high. */
function CloverFinial() {
  return (
    <group position={[0, 7.35, 0]}>
      {[[0.09, 0.09], [-0.09, 0.09], [0.09, -0.09], [-0.09, -0.09]].map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, 0]} rotation={[0, 0, Math.PI / 4]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <primitive object={ACCENT} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 6]} />
        <primitive object={MAT.woodDark} attach="material" />
      </mesh>
    </group>
  );
}

export default function Hub({ cafeOpen, marketOpen }: { cafeOpen: boolean; marketOpen: boolean }) {
  const paving = useTiledTexture(paintPaving, H, H);
  // Gates open and shut with the learner's real access, so they are a kit of
  // their own, rebuilt only when access changes.
  const gates = useMemo(() => {
    const k = new Kit();
    for (const g of HUB.gates) {
      const pose = gatePose(g);
      const usable = g.kind === "link" || (g.kind === "room" && cafeOpen);
      gatehouse(k, pose.x, pose.z, pose.rotY, { open: usable, accent: usable, barred: g.kind === "future" });
    }
    for (const g of SOUTH_GATES) {
      const usable = g.id === "village" || marketOpen;
      gatehouse(k, g.along, H + 0.08, Math.PI, { open: usable, accent: usable });
    }
    return k;
  }, [cafeOpen, marketOpen]);
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
      <MapBoard />
      <CloverFinial />
      <group position={[HUB.board.x - 0.05, 2.35, HUB.board.z]} rotation={[0, -Math.PI / 2, 0]}>
        <Signboard text="게시판" w={0.9} h={0.3} aspect={3} />
      </group>
      <Batch kit={gates} />
      {HUB.gates.map((g) => (
        <Gate key={g.id} {...gatePose(g)} sign={g.sign} />
      ))}
      {SOUTH_GATES.map((g) => (
        <Gate key={g.id} x={g.along} z={H + 0.08} rotY={Math.PI} sign={g.sign} />
      ))}
    </group>
  );
}
