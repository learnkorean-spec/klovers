import { useLayoutEffect, useMemo, useRef } from "react";
import { CanvasTexture, InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import type { Box2 } from "../config/world";
import { jitter } from "./kit";

/**
 * Soft wear on the paving: darker, warmer patches where feet and rain have
 * worked the stone — a band along every wall foot (where eaves drip and
 * shade sits) and a few loose patches in the open. It breaks up the big flat
 * floor into zones for one draw call and one 64 px texture, with no change
 * to collision or lighting.
 */

const WEAR = (() => {
  let map: CanvasTexture | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
      g.addColorStop(0, "rgba(84,60,38,0.5)");
      g.addColorStop(0.55, "rgba(84,60,38,0.24)");
      g.addColorStop(1, "rgba(84,60,38,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      map = new CanvasTexture(c);
    }
  } catch {
    map = null;
  }
  return new MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: true, polygonOffset: true, polygonOffsetFactor: -2 });
})();
const PLANE = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

interface Patch {
  x: number;
  z: number;
  sx: number;
  sz: number;
}

function patches(b: Box2, seed: number): Patch[] {
  const out: Patch[] = [];
  const w = b.maxX - b.minX;
  const d = b.maxZ - b.minZ;
  // Wall-foot bands: overlapping ovals stretched along each wall.
  const band = (x1: number, z1: number, x2: number, z2: number) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const n = Math.max(2, Math.round(len / 2.6));
    const alongX = Math.abs(x2 - x1) > Math.abs(z2 - z1);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const s = seed + i * 7 + x1 * 3 + z1;
      const l = 3.6 + jitter(s, 0.8);
      const t2 = 2.0 + jitter(s * 3, 0.5);
      out.push({ x: x1 + (x2 - x1) * t, z: z1 + (z2 - z1) * t, sx: alongX ? l : t2, sz: alongX ? t2 : l });
    }
  };
  band(b.minX, b.minZ + 0.5, b.maxX, b.minZ + 0.5);
  band(b.minX, b.maxZ - 0.5, b.maxX, b.maxZ - 0.5);
  band(b.minX + 0.5, b.minZ, b.minX + 0.5, b.maxZ);
  band(b.maxX - 0.5, b.minZ, b.maxX - 0.5, b.maxZ);
  // Loose patches in the open, kept off the very middle.
  const n = Math.round((w * d) / 30);
  for (let i = 0; i < n; i++) {
    const s = seed * 13 + i * 17;
    const x = b.minX + w * (0.5 + jitter(s, 0.42));
    const z = b.minZ + d * (0.5 + jitter(s * 5, 0.42));
    const r = 2.2 + jitter(s * 7, 0.9);
    out.push({ x, z, sx: r * (1 + jitter(s * 11, 0.3)), sz: r });
  }
  return out;
}

export default function GroundWear({ bounds, seed }: { bounds: Box2; seed: number }) {
  const ref = useRef<InstancedMesh>(null);
  const list = useMemo(() => patches(bounds, seed), [bounds, seed]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    list.forEach((p, i) => {
      o.position.set(p.x, 0.012, p.z);
      o.rotation.set(0, jitter(seed + i, 1.5), 0);
      o.scale.set(p.sx, 1, p.sz);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [list, seed]);
  return <instancedMesh ref={ref} args={[PLANE, WEAR, list.length]} renderOrder={1} dispose={null} />;
}
