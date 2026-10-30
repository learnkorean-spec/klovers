import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, CanvasTexture, Color, Float32BufferAttribute, type Group, type InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry, ShaderMaterial, SphereGeometry, Vector3 } from "three";
import { REDUCED_MOTION } from "../systems/motion";
import { MAT } from "../config/materials";
import Batch from "./Batch";
import { Kit, jitter, tree } from "./kit";
import { pickQuality } from "../systems/quality";

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
/** Where the sun stands (World.tsx's sun light): the sky glows around it. */
export const SUN_DIR = new Vector3(14, 7.6, 4.5).normalize();

/**
 * The sky, painted per pixel (no bands between the dome's vertices): the
 * same zenith → mid → horizon colours, a warm glow round the low sun (a
 * broad halo and a soft core), a pale haze band along the horizon, and a
 * touch of dither so the gradient never steps on 8-bit screens.
 */
const SKY_MATERIAL = new ShaderMaterial({
  side: BackSide,
  depthWrite: false,
  fog: false,
  toneMapped: false,
  uniforms: {
    zenith: { value: new Color(SKY.zenith) },
    mid: { value: new Color(SKY.mid) },
    horizon: { value: new Color(SKY.horizon) },
    sunDir: { value: SUN_DIR },
    sunColor: { value: new Color("#FFE2B0") },
  },
  vertexShader: `
    varying vec3 vDir;
    void main() {
      vDir = normalize(position);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform vec3 zenith; uniform vec3 mid; uniform vec3 horizon; uniform vec3 sunDir; uniform vec3 sunColor;
    varying vec3 vDir;
    void main() {
      vec3 d = normalize(vDir);
      float t = max(d.y, 0.0);
      vec3 c = t < 0.1 ? mix(horizon, mid, t / 0.1) : mix(mid, zenith, pow(min(1.0, (t - 0.1) / 0.45), 0.8));
      float s = max(dot(d, sunDir), 0.0);
      c += sunColor * (pow(s, 6.0) * 0.22 + pow(s, 64.0) * 0.35);
      c = mix(c, horizon * 1.03, exp(-abs(d.y) * 18.0) * 0.45);
      c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
});

/**
 * Soft late-afternoon clouds: one painted canvas (a few overlapping warm-white
 * puffs with a peach underside), drawn as flat cards on a ring far out in the
 * sky. One draw call; they drift very slowly. They give the sky depth and
 * scale — the "real place" feeling — at almost no cost.
 */
/**
 * Soft late-afternoon clouds in three shapes (a long bank, a tall heap, a
 * small wisp), each painted once: sunlit warm-white tops over a peach-grey
 * shaded underside. Drawn as flat cards far out in the sky, one draw call
 * per shape; they drift very slowly.
 */
function cloudMaterial(variant: number): MeshBasicMaterial {
  let map: CanvasTexture | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      let seed = 11 + variant * 37;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return seed / 2147483647;
      };
      const shapes: { n: number; w: number; h: number; r: [number, number] }[] = [
        { n: 16, w: 380, h: 40, r: [34, 64] },
        { n: 13, w: 220, h: 80, r: [38, 78] },
        { n: 9, w: 300, h: 26, r: [20, 40] },
      ];
      const sh = shapes[variant % shapes.length];
      const puffs = Array.from({ length: sh.n }, (_, i) => {
        const fx = i / (sh.n - 1) - 0.5;
        const r = sh.r[0] + rnd() * (sh.r[1] - sh.r[0]);
        // Tallest in the middle of the cloud, flat along its base.
        const lift = (1 - Math.abs(fx) * 1.6) * sh.h;
        return { x: 256 + fx * sh.w + (rnd() - 0.5) * 30, y: 175 - Math.max(0, lift) * (0.6 + rnd() * 0.5), r };
      });
      // Shade first (the underside), then the sunlit body a little higher.
      for (const pass of [0, 1]) {
        for (const p of puffs) {
          const y = pass ? p.y - p.r * 0.18 : p.y + p.r * 0.12;
          const r = pass ? p.r * 0.92 : p.r;
          const g = ctx.createRadialGradient(p.x - r * 0.15, y - r * 0.2, r * 0.1, p.x, y, r);
          if (pass) {
            g.addColorStop(0, "rgba(255,252,246,0.95)");
            g.addColorStop(0.55, "rgba(255,243,228,0.75)");
            g.addColorStop(1, "rgba(255,236,214,0)");
          } else {
            g.addColorStop(0, "rgba(222,200,190,0.8)");
            g.addColorStop(0.6, "rgba(232,205,190,0.5)");
            g.addColorStop(1, "rgba(240,215,198,0)");
          }
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // A clean flat base fades the bottom softly.
      const fade = ctx.createLinearGradient(0, 170, 0, 230);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 170, 512, 86);
      ctx.globalCompositeOperation = "source-over";
      map = new CanvasTexture(c);
    }
  } catch {
    map = null;
  }
  return new MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false, opacity: 0.9 });
}
const CLOUD_MATERIALS = [0, 1, 2].map(cloudMaterial);
const CLOUD_PLANE = new PlaneGeometry(1, 0.5);
const CLOUDS: { a: number; y: number; s: number }[] = Array.from({ length: 15 }, (_, i) => ({
  a: (i / 15) * Math.PI * 2 + jitter(i * 5, 0.25),
  y: 13 + Math.abs(jitter(i * 9, 9)),
  s: 26 + Math.abs(jitter(i * 13, 14)),
}));

function CloudSet({ variant }: { variant: number }) {
  const ref = useRef<InstancedMesh>(null);
  const mine = useMemo(() => CLOUDS.filter((_, i) => i % 3 === variant), [variant]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    mine.forEach((c, i) => {
      const r = 82;
      o.position.set(Math.sin(c.a) * r, c.y, Math.cos(c.a) * r);
      o.lookAt(0, c.y * 0.6, 0);
      o.scale.set(c.s * (variant === 1 ? 0.8 : 1.15), c.s * (variant === 1 ? 0.8 : 1.15), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [mine, variant]);
  return <instancedMesh ref={ref} args={[CLOUD_PLANE, CLOUD_MATERIALS[variant], mine.length]} renderOrder={-1} frustumCulled={false} dispose={null} />;
}

function Clouds() {
  const spin = useRef<Group>(null);
  useFrame((_, dt) => {
    if (spin.current && !REDUCED_MOTION) spin.current.rotation.y += Math.min(dt, 0.1) * 0.004;
  });
  return (
    <group ref={spin}>
      {[0, 1, 2].map((v) => (
        <CloudSet key={v} variant={v} />
      ))}
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
  if (id === "seoul-namsan") {
    // On top of Namsan: Seoul spread out far below the lookout. The wooded
    // hill falls away under the terrace to the city floor 30 m down; then
    // apartment slabs and office blocks (windows painted by MAT.cityBlock)
    // out to the haze, taller downtown (north, behind the tower) and across
    // the Han river, which crosses the south with its bridges. Built at a
    // reduced scale (MAT.cityBlock's storeys are scaled to match) so the
    // whole city stays far below eye level inside the haze.
    const FLOOR = -30;
    const R0 = 30;
    const R1 = 88;
    const RIVER_Z = [56, 66] as const;
    const phone = pickQuality().maxTexture <= 1024;
    k.add("leafDark", "ballLow", [0, FLOOR, 0], [62, 56, 62]);
    // The city floor: streets every 10 m, boulevards every 30 m (MAT.cityGround).
    k.add("cityGround", "cyl", [0, FLOOR - 0.5, 0], [R1 * 2 + 30, 1, R1 * 2 + 30]);
    // Woods on the hillside: dark crowns in the slope.
    const woods = phone ? 60 : 110;
    for (let i = 0; i < woods; i++) {
      seed++;
      const a = jitter(seed, Math.PI);
      const t = Math.abs(jitter(seed * 3, 1));
      const r = 13 + t * 17;
      const y = FLOOR + 28 * Math.sqrt(Math.max(0, 1 - (r / 31) ** 2));
      const sz = 2.4 + Math.abs(jitter(seed * 5, 1)) * 1.6;
      // The crowns nearest the rail (seen from just above) are whole ragged
      // canopies; further down the slope one cheap clump each is enough.
      if (r < 19) k.add(i % 3 ? "farLeafDark" : "farLeaf", i % 2 ? "crownA" : "crownB", [Math.sin(a) * r, y - sz * 0.35, Math.cos(a) * r], [sz * 1.05, sz * 0.75, sz * 1.05], [0, a, 0]);
      else k.add(i % 3 ? "leafDark" : "leaf", "leafyLow", [Math.sin(a) * r, y, Math.cos(a) * r], [sz, sz * 0.8, sz], [0, a, 0]);
    }
    k.box("river", [0, FLOOR + 0.05, (RIVER_Z[0] + RIVER_Z[1]) / 2], [R1 * 2 + 20, 0.1, RIVER_Z[1] - RIVER_Z[0]]);
    // Bridges carry three of the north–south streets over the river.
    for (const bx of [-40, -10, 20]) {
      k.box("stoneWarm", [bx, FLOOR + 0.9, (RIVER_Z[0] + RIVER_Z[1]) / 2], [1.6, 0.3, RIVER_Z[1] - RIVER_Z[0] + 4]);
      for (let j = 0; j < 4; j++) k.box("stoneWarm", [bx, FLOOR + 0.4, RIVER_Z[0] + 1.2 + j * 2.5], [0.6, 0.9, 0.5]);
    }
    const inRiver = (z: number, m = 2) => z > RIVER_Z[0] - m && z < RIVER_Z[1] + m;
    // Some city blocks are parks: lawn and trees, no buildings.
    const park = (cx: number, cz: number) => jitter(cx * 31.7 + cz * 17.3 + 5, 1) > 0.56;
    for (let cx = -9; cx < 9; cx++) {
      for (let cz = -9; cz < 9; cz++) {
        const mx = cx * 10 + 5;
        const mz = cz * 10 + 5;
        const r = Math.hypot(mx, mz);
        if (r < R0 + 3 || r > R1 || inRiver(mz, 6) || !park(cx, cz)) continue;
        k.box("moss", [mx, FLOOR + 0.03, mz], [8.2, 0.06, 8.2]);
        const n = phone ? 4 : 7;
        for (let j = 0; j < n; j++) {
          const sd = cx * 97 + cz * 13 + j * 7;
          const sz = 1.3 + Math.abs(jitter(sd, 0.6));
          k.add(j % 3 ? "leaf" : "leafDark", "leafyLow", [mx + jitter(sd * 3, 3.4), FLOOR + sz * 0.45, mz + jitter(sd * 5, 3.4)], [sz, sz * 0.9, sz], [0, sd, 0]);
        }
      }
    }
    // Keep a footprint (half sizes hx, hz along world x, z) inside its city
    // block, clear of the streets and pavements; returns null if it can't.
    const fit = (x: number, hx: number): number | null => {
      const lo = Math.floor(x / 10) * 10;
      const mlo = lo % 30 === 0 ? 1.45 : 1.05;
      const mhi = (lo + 10) % 30 === 0 ? 1.45 : 1.05;
      const min = lo + mlo + hx;
      const max = lo + 10 - mhi - hx;
      if (min > max) return null;
      return Math.min(max, Math.max(min, x));
    };
    // Things on a roof, offset (lx, lz) in the block's own frame.
    const onRoof = (x: number, z: number, yaw: number, top: number, lx: number, lz: number) => {
      const c = Math.cos(yaw);
      const sn = Math.sin(yaw);
      return [x + c * lx + sn * lz, top, z - sn * lx + c * lz] as [number, number, number];
    };
    let placed = 0;
    for (let i = 0; i < 3000 && placed < 760; i++) {
      seed++;
      const a = jitter(seed, Math.PI);
      const r = R0 + Math.abs(jitter(seed * 3, 1)) * (R1 - R0);
      let x = Math.sin(a) * r;
      let z = Math.cos(a) * r;
      if (inRiver(z) || park(Math.floor(x / 10), Math.floor(z / 10))) continue;
      const downtown = (z < -30 && Math.abs(x) < 40) || (z > RIVER_Z[1] + 2 && Math.abs(x) < 45);
      const kind = Math.abs(jitter(seed * 5, 1));
      const quarter = Math.round(a / (Math.PI / 2));
      const yaw = quarter * (Math.PI / 2) + jitter(seed * 13, 0.06);
      let w: number, d: number, h: number;
      let slab = false;
      if (downtown && kind < 0.45) {
        w = 3 + kind * 3;
        d = w * (0.8 + Math.abs(jitter(seed * 9, 0.3)));
        h = 10 + Math.abs(jitter(seed * 7, 1)) * 12;
      } else if (kind < 0.6) {
        // Apartment slabs (아파트), long and thin.
        w = 5.5 + Math.abs(jitter(seed * 9, 1)) * 2.2;
        d = 1.3;
        h = 8 + Math.abs(jitter(seed * 7, 1)) * 7;
        slab = true;
      } else {
        w = 2 + Math.abs(jitter(seed * 9, 1)) * 2.4;
        d = w * (0.7 + Math.abs(jitter(seed * 11, 0.4)));
        h = 2.4 + Math.abs(jitter(seed * 7, 1)) * 4.5;
      }
      // Nearer the hill the blocks are lower, so the slope still reads.
      h *= 0.65 + 0.35 * Math.min(1, (r - R0) / 20);
      const turned = Math.abs(quarter) % 2 === 1;
      const ex = (turned ? d : w) / 2 + 0.15;
      const ez = (turned ? w : d) / 2 + 0.15;
      const fx = fit(x, ex);
      const fz = fit(z, ez);
      if (fx === null || fz === null || inRiver(fz)) continue;
      x = fx;
      z = fz;
      placed++;
      k.add("cityBlock", "box", [x, FLOOR + h / 2, z], [w, h, d], [0, yaw, 0]);
      // Rooftops: lift and stair houses on the apartment slabs; a plant room
      // or a water tank on most other roofs.
      const top = FLOOR + h;
      const roofKind = Math.abs(jitter(seed * 17, 1));
      if (slab) {
        for (const s of [-0.26, 0.26]) k.add("cityBlock", "box", onRoof(x, z, yaw, top + 0.45, s * w, 0), [0.7, 0.9, d * 0.8], [0, yaw, 0]);
      } else if (roofKind < 0.5) {
        const pw = Math.min(w * 0.4, 1.4);
        const pd = Math.min(d * 0.45, 1.2);
        k.add("cityBlock", "box", onRoof(x, z, yaw, top + 0.4, jitter(seed * 19, w * 0.18), jitter(seed * 23, d * 0.15)), [pw, 0.8, pd], [0, yaw, 0]);
      } else if (roofKind < 0.85 && !downtown) {
        k.add("steel", phone ? "cylLow" : "cyl", onRoof(x, z, yaw, top + 0.24, w * 0.22, -d * 0.18), [0.42, 0.48, 0.42]);
      }
    }
  } else if (id !== "seoul-journey" && id !== "seoul-market") {
    ring(hx + 3.5, hz + 3.5, 4.2, 1.35);
    ring(hx + 9, hz + 9, 5.5, 1.8);
  }
  // Far hills: soft rounded ridges, blued and faded by the haze.
  // (On Namsan they stand beyond the city, rising from its floor 30 m down.)
  const namsan = id === "seoul-namsan";
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + jitter(i, 0.15);
    const r = (namsan ? 100 : 70) + jitter(i * 7, namsan ? 4 : 10);
    const s = (namsan ? 46 : 30) + jitter(i * 3, 10);
    const base = namsan ? -30 : -s * 0.12;
    k.add("hill", "ridge", [Math.sin(a) * r, base, Math.cos(a) * r], [s, s * (namsan ? 0.75 : 0.5) + jitter(i * 11, 4), s * 0.7], [0, a, 0]);
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
      {/* Flat ground out to the hills — except on Namsan, where the city lies below. */}
      {id !== "seoul-namsan" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
          <circleGeometry args={[96, 32]} />
          <primitive object={MAT.stone} attach="material" />
        </mesh>
      )}
      <Batch kit={kit} />
    </>
  );
}
