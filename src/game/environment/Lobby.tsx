import type { MutableRefObject } from "react";
import { MAT } from "../config/materials";
import { PROPS, ROOM } from "../config/world";
import type { StoryState } from "../systems/story";
import Batch from "./Batch";
import CloverEgg from "./CloverEgg";
import { Kit, bed, gatehouse, grass, gutter, hanokHouse, noticeBoard, pine, planter, platform, pot, rock, shrub, steppingStones, stoneLantern, tree, wallRun } from "./kit";
import { Gate, Signboard } from "./parts";
import { paintMadang, useTiledTexture } from "./textures";

/**
 * Room 1 — the hanok courtyard where the two friends found the clover egg.
 *
 * Composition, front to back: the learner arrives on the south side; a
 * line of stepping stones leads to the egg on its octagonal platform (the
 * room's landmark); the path continues between two stone lanterns to the
 * open north gate — timber, one thin yellow line on its lintel, signed
 * 한글 마을 — the way into Hangul Village. Hanok halls close the east and
 * west sides, a tiled wall the south; a flowering tree in its bed, green
 * beds against the halls, pines, platforms and onggi pots give the corners
 * a use instead of emptiness. Everything but the egg and the gate is one
 * Kit, drawn as a few dozen instanced meshes.
 */
const { halfWidth: HW, halfDepth: HD } = ROOM;

const COURTYARD_KIT: Kit = (() => {
  const k = new Kit();
  // Halls on the east and west: their facades are the room's side walls.
  for (const side of [-1, 1] as const) {
    hanokHouse(k, { x: side * (HW + 2.3), z: -1.8, w: 4.6, d: 11, h: 2.6, face: side > 0 ? "-x" : "+x", roofH: 1.3 });
    wallRun(k, side * (HW + 0.2), 3.7, side * (HW + 0.2), HD + 0.4);
    wallRun(k, side * (HW + 0.2), -HD - 0.4, side * (HW + 0.2), -7.3);
  }
  // North wall either side of the gate; south wall behind the arrival point.
  wallRun(k, -HW - 0.4, -HD - 0.2, -1.85, -HD - 0.2);
  wallRun(k, 1.85, -HD - 0.2, HW + 0.4, -HD - 0.2);
  wallRun(k, -HW - 0.4, HD + 0.2, HW + 0.4, HD + 0.2);
  // Village roofs beyond the north wall: the promise of what is next.
  hanokHouse(k, { x: -6.5, z: -HD - 4.2, w: 6, d: 4.2, h: 2.4, face: "+z" });
  hanokHouse(k, { x: 6.8, z: -HD - 4.6, w: 5.4, d: 4.4, h: 2.8, face: "+z", roofH: 1.3 });
  // The path the eye follows: arrival → egg → gate, in pale dressed stone
  // on a darker bed of gravel, so the route reads from anywhere.
  k.box("gravel", [0, 0.006, (PROPS.eggPlinth.w / 2 + 0.6 + HD - 1.2) / 2], [1.25, 0.012, HD - 1.8 - PROPS.eggPlinth.w / 2], false);
  k.box("gravel", [0, 0.006, (-PROPS.eggPlinth.w / 2 - 0.6 - HD + 0.9) / 2], [1.25, 0.012, HD - 1.5 - PROPS.eggPlinth.w / 2], false);
  steppingStones(k, 0, PROPS.eggPlinth.w / 2 + 0.6, 0, HD - 1.2, 0.95, 3, "stoneWarm");
  steppingStones(k, 0, -PROPS.eggPlinth.w / 2 - 0.6, 0, -HD + 0.9, 0.95, 17, "stoneWarm");
  // Drip-line gravel along every wall foot.
  gutter(k, -HW + 0.27, -HD, -HW + 0.27, HD);
  gutter(k, HW - 0.27, -HD, HW - 0.27, HD);
  gutter(k, -HW, HD - 0.27, HW, HD - 0.27);
  gutter(k, -HW, -HD + 0.27, -1.9, -HD + 0.27);
  gutter(k, 1.9, -HD + 0.27, HW, -HD + 0.27);
  // Planting beds; the one flowering tree is the courtyard's second hero.
  for (const b of PROPS.beds) bed(k, b.x, b.z, b.w, b.d, Math.round(b.x * 7 + b.z), false);
  tree(k, -8.9, -7.9, 1.25, true, 5);
  shrub(k, -7.0, -7.7, 0.7, 9, "blossom");
  // Beyond the south wall and the halls: green crowns over the roofs.
  tree(k, -3.5, HD + 2.6, 1.3, false, 21);
  tree(k, 4.5, HD + 2.4, 1.15, false, 23);
  // Small life at the foot of walls and lanterns.
  for (const [gx, gz, gs] of [[-2.9, -6.0, 0.8], [2.9, -6.0, 0.8], [-3.7, 3.3, 0.7], [3.7, 3.3, 0.7], [-10.5, -4.3, 0.9], [10.5, 6.0, 0.9]] as const) grass(k, gx, gz, gs, gx * 3 + gz);
  rock(k, -9.6, 4.6, 0.9, 3);
  rock(k, -10.2, 5.4, 0.6, 8);
  for (const l of PROPS.lanterns) stoneLantern(k, l.x, l.z);
  for (const p of PROPS.platforms) platform(k, p.x, p.z, p.w, p.d);
  for (const t of PROPS.pines) pine(k, t.x, t.z, t.s);
  for (const t of PROPS.pots) pot(k, t.x, t.z, t.s);
  // A notice board against the east hall, and planters softening the south wall.
  noticeBoard(k, PROPS.board.x, PROPS.board.z, "-x");
  planter(k, -5.6, HD - 0.55, 3.2);
  planter(k, 5.6, HD - 0.55, 3.2);
  // The way on: the only yellow-marked gate in the room.
  gatehouse(k, 0, -HD - 0.02, 0, { open: true, accent: true });
  return k;
})();

export default function Lobby({ story }: { story: MutableRefObject<StoryState> }) {
  const paving = useTiledTexture(paintMadang, HW, HD);
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2, HD * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[90, 90]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={COURTYARD_KIT} />
      {/* The way on: the only yellow-framed opening in the room. */}
      <Gate x={0} z={-HD - 0.02} rotY={0} sign="한글 마을" />
      <group position={[PROPS.board.x - 0.05, 2.35, PROPS.board.z]} rotation={[0, -Math.PI / 2, 0]}>
        <Signboard text="게시판" w={0.9} h={0.3} aspect={3} />
      </group>
      <CloverEgg story={story} />
    </group>
  );
}
