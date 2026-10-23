import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, CanvasTexture, Color, Float32BufferAttribute, type Group, type InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry, SphereGeometry } from "three";
import { REDUCED_MOTION } from "../systems/motion";
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
  zenith: "#7EA7D1",
  mid: "#F3D7B6",
  horizon: "#F8D8AC",
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

/**
 * Soft late-afternoon clouds: one painted canvas (a few overlapping warm-white
 * puffs with a peach underside), drawn as flat cards on a ring far out in the
 * sky. One draw call; they drift very slowly. They give the sky depth and
 * scale — the "real place" feeling — at almost no cost.
 */
const CLOUD_MATERIAL = (() => {
  let map: CanvasTexture | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext("2d");
    if (ctx) {
      const puff = (x: number, y: number, r: number, a: number) => {
        const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
        g.addColorStop(0, `rgba(255,250,242,${a})`);
        g.addColorStop(0.6, `rgba(255,240,224,${a * 0.55})`);
        g.addColorStop(1, "rgba(255,236,214,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      };
      const puffs: [number, number, number, number][] = [
        [70, 78, 42, 0.8], [110, 62, 52, 0.9], [155, 70, 46, 0.85], [195, 82, 34, 0.7], [128, 86, 44, 0.7], [45, 90, 26, 0.55], [222, 92, 22, 0.5],
      ];
      for (const [x, y, r, a] of puffs) puff(x, y, r, a);
      map = new CanvasTexture(c);
    }
  } catch {
    map = null;
  }
  return new MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: 0.85 });
})();
const CLOUD_PLANE = new PlaneGeometry(1, 0.5);
const CLOUDS: { a: number; y: number; s: number }[] = Array.from({ length: 11 }, (_, i) => ({
  a: (i / 11) * Math.PI * 2 + jitter(i * 5, 0.25),
  y: 20 + Math.abs(jitter(i * 9, 12)),
  s: 26 + Math.abs(jitter(i * 13, 14)),
}));

function Clouds() {
  const ref = useRef<InstancedMesh>(null);
  const spin = useRef<Group>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    CLOUDS.forEach((c, i) => {
      const r = 82;
      o.position.set(Math.sin(c.a) * r, c.y, Math.cos(c.a) * r);
      o.lookAt(0, c.y * 0.6, 0);
      o.scale.set(c.s, c.s, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame((_, dt) => {
    if (spin.current && !REDUCED_MOTION) spin.current.rotation.y += Math.min(dt, 0.1) * 0.004;
  });
  return (
    <group ref={spin}>
      <instancedMesh ref={ref} args={[CLOUD_PLANE, CLOUD_MATERIAL, CLOUDS.length]} renderOrder={-1} frustumCulled={false} dispose={null} />
    </group>
  );
}

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
  // Seoul is a city: its blocks of buildings stand where the tree rings would.
  if (id !== "seoul-journey") {
    ring(hx + 3.5, hz + 3.5, 4.2, 1.35);
    ring(hx + 9, hz + 9, 5.5, 1.8);
  }
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
      <Clouds />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
        <circleGeometry args={[96, 32]} />
        <primitive object={MAT.stone} attach="material" />
      </mesh>
      <Batch kit={kit} />
    </>
  );
}
