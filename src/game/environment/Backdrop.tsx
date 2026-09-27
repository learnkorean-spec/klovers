import { useMemo } from "react";
import { BackSide, Color, Float32BufferAttribute, MeshBasicMaterial, SphereGeometry } from "three";
import { MAT } from "../config/materials";
import Batch from "./Batch";
import { Kit, jitter, tree } from "./kit";

/**
 * What lies beyond the walls, shared by every room: a warm late-afternoon
 * sky, a ring of broadleaf trees just past the rooftops, and low hills far
 * off in the haze. It is what turns "a floor with walls" into "a place in a
 * landscape" — the background layer of every view — for five draw calls.
 */

export const SKY = {
  zenith: "#A7C4DD",
  mid: "#F0D6B2",
  horizon: "#F7DDB6",
} as const;

/** One sky dome for all rooms: colours painted into the vertices. */
const SKY_GEOMETRY = (() => {
  const g = new SphereGeometry(100, 24, 16);
  const pos = g.getAttribute("position");
  const colors: number[] = [];
  const zen = new Color(SKY.zenith);
  const mid = new Color(SKY.mid);
  const hor = new Color(SKY.horizon);
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i) / 100);
    if (t < 0.1) c.copy(hor).lerp(mid, t / 0.1);
    else c.copy(mid).lerp(zen, Math.min(1, (t - 0.1) / 0.45) ** 0.8);
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return g;
})();
const SKY_MATERIAL = new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false, depthWrite: false, toneMapped: false });

const kits = new Map<string, Kit>();

/**
 * Trees on a rectangle just outside the room's built edge (hx × hz half
 * sizes), plus far hills. Built once per room and kept.
 */
function backdropKit(id: string, hx: number, hz: number): Kit {
  const hit = kits.get(id);
  if (hit) return hit;
  const k = new Kit();
  let seed = id.length * 13;
  const ring = (ox: number, oz: number, spacing: number, scale: number) => {
    const per = 2 * (ox + oz);
    const n = Math.floor((per * 2) / spacing);
    for (let i = 0; i < n; i++) {
      seed++;
      const d = (i / n) * per * 2;
      let x = -ox;
      let z = oz - (d - ox * 4 - oz * 2);
      if (d < ox * 2) {
        x = -ox + d;
        z = -oz;
      } else if (d < ox * 2 + oz * 2) {
        x = ox;
        z = -oz + (d - ox * 2);
      } else if (d < ox * 4 + oz * 2) {
        x = ox - (d - ox * 2 - oz * 2);
        z = oz;
      }
      tree(k, x + jitter(seed, 1.2), z + jitter(seed * 3, 1.2), scale * (1 + jitter(seed * 5, 0.25)), false, seed, true);
    }
  };
  ring(hx + 3.5, hz + 3.5, 4.2, 1.35);
  ring(hx + 9, hz + 9, 5.5, 1.8);
  // Far hills: soft rounded ridges, blued and faded by the haze.
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + jitter(i, 0.15);
    const r = 70 + jitter(i * 7, 10);
    const s = 30 + jitter(i * 3, 10);
    k.add("hill", "ballLow", [Math.sin(a) * r, -s * 0.12, Math.cos(a) * r], [s, s * 0.5 + jitter(i * 11, 4), s * 0.7], [0, a, 0]);
  }
  kits.set(id, k);
  return k;
}

export default function Backdrop({ id, hx, hz }: { id: string; hx: number; hz: number }) {
  const kit = useMemo(() => backdropKit(id, hx, hz), [id, hx, hz]);
  return (
    <>
      <mesh geometry={SKY_GEOMETRY} material={SKY_MATERIAL} renderOrder={-1} frustumCulled={false} dispose={null} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <circleGeometry args={[96, 32]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={kit} />
    </>
  );
}
