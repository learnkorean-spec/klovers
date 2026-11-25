import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearMipmapLinearFilter,
  Matrix4,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  SkinnedMesh,
  Vector3,
  type Bone,
  type Group,
  type Mesh,
  type Object3D,
} from "three";

/**
 * Klovers hair engine: grows a head of hair on a rigged person instead of
 * the model's own hair cards (a flat slab down Lina's back, chopped cards on
 * top, 26 Nov 2026).
 *
 * How: the skull is measured from the body's own head vertices; roots are
 * spread over the scalp inside a hairline found from the eyes; each lock
 * combs over the skull away from the parting, then falls under gravity,
 * sliding off the shoulders and down the back (the torso is measured too, so
 * the hair rests on her, not through her). Locks are clumps of thin ribbons
 * carrying a painted texture of fine strands, coloured root to tip, waved
 * below the ears, and lit with an anisotropic (Kajiya-Kay) sheen: the band
 * of light across real hair. The result is one skinned mesh on the body's
 * own skeleton: the top rides the head, the length rides the upper back.
 */

export interface HairStyle {
  /** Root, middle and tip colours (sRGB hex). */
  root: string;
  mid: string;
  tip: string;
  /** Lighter streaks on the outer layer (sRGB hex). */
  shine: string;
  /** How far below the shoulders the longest hair reaches (m). */
  length: number;
  /** Wave height (m) at the ends; 0 for straight hair. */
  wave: number;
  /** Wave length along the hair (m). */
  waveLength: number;
  /** Parting, sideways from the middle of the head (m, + = her left). */
  part: number;
  /** A few locks fall in front of the shoulders, framing the face. */
  frontLocks: boolean;
  /** Model meshes this hair replaces. */
  replaces: RegExp;
}

export const LINA_HAIR: HairStyle = {
  root: "#4A1D0F",
  mid: "#8A3F1E",
  tip: "#B66B37",
  shine: "#D98A4A",
  length: 0.3,
  wave: 0.014,
  waveLength: 0.11,
  part: 0.022,
  frontLocks: true,
  replaces: /Hair/,
};

/* ---------- small helpers ---------- */

/** Seeded random: the same hair every load. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ---------- the strand picture ---------- */

let strandTex: CanvasTexture | null = null;

/**
 * Fine hairs on a transparent card: hundreds of 1–3 px strands, each its own
 * brightness, some ending early so the ends thin out. Grey: the colour comes
 * from the lock (root to tip). Drawn once and shared.
 */
function strandTexture(): CanvasTexture | null {
  if (strandTex) return strandTex;
  if (typeof document === "undefined") return null;
  const W = 512;
  const H = 1024;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) return null;
  const r = rng(7);
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = "round";
  for (let i = 0; i < 900; i++) {
    const x0 = r() * W;
    const end = H * (0.72 + r() * 0.28);
    const lum = Math.round(150 + r() * 105);
    const a = 0.55 + r() * 0.45;
    ctx.strokeStyle = `rgba(${lum},${lum},${lum},${a.toFixed(2)})`;
    ctx.lineWidth = 1 + r() * 2.2;
    const amp = 1 + r() * 3;
    const ph = r() * 6.28;
    ctx.beginPath();
    for (let y = 0; y <= end; y += 16) {
      const x = x0 + Math.sin(y / 90 + ph) * amp;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // the same strand repeated at the wrap so the card tiles sideways
    if (x0 < 8 || x0 > W - 8) {
      ctx.beginPath();
      const shift = x0 < 8 ? W : -W;
      ctx.moveTo(x0 + shift, 0);
      ctx.lineTo(x0 + shift, end);
      ctx.stroke();
    }
  }
  // the ends thin out: fade the last fifth of the card
  // (destination-in clears whatever the fill does not cover: fill it all)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.62, "rgba(0,0,0,1)");
  g.addColorStop(0.85, "rgba(0,0,0,0.55)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  const t = new CanvasTexture(cv);
  t.flipY = false;
  t.wrapS = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearMipmapLinearFilter;
  t.anisotropy = 8;
  strandTex = t;
  return t;
}

/* ---------- the material ---------- */

/**
 * Hair light: soft wrapped diffuse from the lock's outward normal (one mass,
 * not shredded cards) and two Kajiya-Kay highlights along the strand
 * direction: a narrow white band and a wider coloured one below it.
 */
function hairMaterial(): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    map: strandTexture(),
    vertexColors: true,
    roughness: 0.82,
    metalness: 0,
    side: DoubleSide,
    alphaTest: 0.38,
    transparent: false,
  });
  mat.alphaToCoverage = true;
  mat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      // both faces of a ribbon keep the lock's outward normal
      .replace("#include <normal_fragment_begin>", "#undef DOUBLE_SIDED\n#include <normal_fragment_begin>\n#define DOUBLE_SIDED")
      .replace(
        "#include <opaque_fragment>",
        `#if NUM_DIR_LIGHTS > 0 && defined( USE_MAP )
{
  vec3 hp = -vViewPosition;
  vec3 hq0 = dFdx( hp );
  vec3 hq1 = dFdy( hp );
  vec2 hst0 = dFdx( vMapUv );
  vec2 hst1 = dFdy( vMapUv );
  vec3 hN = normalize( normal );
  vec3 hT = cross( hq1, hN ) * hst0.y + cross( hN, hq0 ) * hst1.y;
  hT = normalize( hT + 1e-6 );
  vec3 hV = normalize( vViewPosition );
  float hMask = texture2D( map, vMapUv ).r;
  for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
    vec3 hL = directionalLights[ i ].direction;
    vec3 hH = normalize( hL + hV );
    vec3 t1 = normalize( hT + hN * 0.10 );
    vec3 t2 = normalize( hT - hN * 0.16 );
    float d1 = dot( t1, hH );
    float d2 = dot( t2, hH );
    float s1 = pow( sqrt( max( 0.0, 1.0 - d1 * d1 ) ), 110.0 );
    float s2 = pow( sqrt( max( 0.0, 1.0 - d2 * d2 ) ), 26.0 );
    float wrapL = clamp( dot( hN, hL ) * 0.6 + 0.4, 0.0, 1.0 );
    // light through the hair from behind (rim of copper when backlit) and a soft wrap so shade is never black
    float back = pow( clamp( dot( -hV, hL ), 0.0, 1.0 ), 4.0 );
    vec3 Lc = directionalLights[ i ].color;
    outgoingLight += Lc * wrapL * ( s1 * 0.08 + s2 * 0.3 * diffuseColor.rgb ) * hMask;
    outgoingLight += Lc * diffuseColor.rgb * ( back * 0.35 + clamp( 0.5 - 0.5 * dot( hN, hL ), 0.0, 1.0 ) * 0.10 );
  }
}
#endif
#include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => "klovers-hair-engine";
  return mat;
}

/* ---------- measuring the body ---------- */

interface Measure {
  /** Head centre (skull) and the skull's radius in a direction. */
  c: Vector3;
  skull: (d: Vector3) => number;
  /** Head + face, for keeping hair off the face. */
  headR: (d: Vector3) => number;
  eyeY: number;
  chinY: number;
  shoulderY: number;
  /** Torso: radius at height y toward angle a (around the torso's axis). */
  torso: (y: number, a: number) => number;
  axis: (y: number) => [number, number];
  torsoTop: number;
  torsoBottom: number;
}

const AZ = 72;
const EL = 36;

function dirIndex(d: Vector3) {
  const az = Math.atan2(d.x, d.z); // 0 = front
  const el = Math.asin(Math.max(-1, Math.min(1, d.y)));
  const i = Math.round(((az + Math.PI) / (2 * Math.PI)) * AZ) % AZ;
  const j = Math.max(0, Math.min(EL - 1, Math.round(((el + Math.PI / 2) / Math.PI) * (EL - 1))));
  return j * AZ + i;
}

/** Radius of a cloud of points around `c`, per direction, filled and smoothed. */
function radial(points: Vector3[], c: Vector3, fallback: number): (d: Vector3) => number {
  const grid = new Float32Array(AZ * EL).fill(-1);
  const d = new Vector3();
  for (const p of points) {
    d.subVectors(p, c);
    const l = d.length();
    if (l < 1e-5) continue;
    d.divideScalar(l);
    const k = dirIndex(d);
    if (l > grid[k]) grid[k] = l;
  }
  // fill holes from neighbours, then smooth twice
  for (let pass = 0; pass < 12; pass++) {
    for (let j = 0; j < EL; j++)
      for (let i = 0; i < AZ; i++) {
        const k = j * AZ + i;
        if (grid[k] >= 0) continue;
        let s = 0;
        let n = 0;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jj = j + dj;
          if (jj < 0 || jj >= EL) continue;
          const v = grid[jj * AZ + ((i + di + AZ) % AZ)];
          if (v >= 0) {
            s += v;
            n++;
          }
        }
        if (n) grid[k] = s / n;
      }
  }
  for (let k = 0; k < grid.length; k++) if (grid[k] < 0) grid[k] = fallback;
  for (let pass = 0; pass < 2; pass++) {
    const copy = grid.slice();
    for (let j = 0; j < EL; j++)
      for (let i = 0; i < AZ; i++) {
        let s = copy[j * AZ + i] * 2;
        let n = 2;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const jj = j + dj;
          if (jj < 0 || jj >= EL) continue;
          s += copy[jj * AZ + ((i + di + AZ) % AZ)];
          n++;
        }
        // never smaller than the farthest point: smoothing must not sink into the skull
        grid[j * AZ + i] = Math.max(copy[j * AZ + i], s / n);
      }
  }
  return (dir: Vector3) => grid[dirIndex(dir)];
}

function measure(root: Group, body: SkinnedMesh, shirt: SkinnedMesh | null, lashes: SkinnedMesh | null, bones: Record<string, number>): Measure | null {
  const v = new Vector3();
  const head: Vector3[] = [];
  const torsoPts: Vector3[] = [];
  const torsoBones = new Set(["Spine", "Spine1", "Spine2", "Neck", "Hips", "LeftShoulder", "RightShoulder"].map((n) => bones[n]).filter((x) => x !== undefined));
  const collect = (m: SkinnedMesh, wantHead: boolean) => {
    const si = m.geometry.getAttribute("skinIndex");
    const sw = m.geometry.getAttribute("skinWeight");
    const pos = m.geometry.getAttribute("position");
    // a mesh's own skeleton may list bones in another order: map by bone
    const toBody = m.skeleton.bones.map((b) => body.skeleton.bones.indexOf(b));
    for (let i = 0; i < pos.count; i++) {
      let hw = 0;
      let tw = 0;
      for (let k = 0; k < 4; k++) {
        const b = toBody[si.getComponent(i, k)];
        const w = sw.getComponent(i, k);
        if (b === bones.Head) hw += w;
        if (torsoBones.has(b)) tw += w;
      }
      if (hw < 0.5 && tw < 0.85) continue;
      m.getVertexPosition(i, v);
      v.applyMatrix4(m.matrixWorld);
      if (hw >= 0.5 && wantHead) head.push(v.clone());
      else if (tw >= 0.85) torsoPts.push(v.clone());
    }
  };
  collect(body, true);
  if (shirt) collect(shirt, false);
  if (head.length < 50 || torsoPts.length < 50) return null;

  let eyeY = NaN;
  let eyeZ = NaN;
  if (lashes) {
    const p = lashes.geometry.getAttribute("position");
    let sy = 0;
    let sz = 0;
    for (let i = 0; i < p.count; i++) {
      lashes.getVertexPosition(i, v);
      v.applyMatrix4(lashes.matrixWorld);
      sy += v.y;
      sz += v.z;
    }
    eyeY = sy / p.count;
    eyeZ = sz / p.count;
  }
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  for (const p of head) {
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minZ = Math.min(minZ, p.z);
  }
  if (!Number.isFinite(eyeY)) {
    eyeY = lerp(minY, maxY, 0.62);
    eyeZ = minZ + 0.18;
  }
  const top = maxY;
  // skull: centred between the ears, half way from the eyes to the crown, set back from the eyes
  const c = new Vector3((minX + maxX) / 2, eyeY + (top - eyeY) * 0.35, eyeZ - 0.085);
  const skullPts = head.filter((p) => p.y > eyeY - 0.03);
  const skull = radial(skullPts, c, 0.09);
  const headR = radial(head, c, 0.1);
  // chin: the lowest head point in front of the neck
  let chinY = eyeY - 0.12;
  for (const p of head) if (p.z > eyeZ - 0.05 && p.y < chinY + 0.04 && Math.abs(p.x - c.x) < 0.03) chinY = Math.min(chinY, p.y);

  // torso slices
  let tTop = -Infinity;
  let tBot = Infinity;
  for (const p of torsoPts) {
    tTop = Math.max(tTop, p.y);
    tBot = Math.min(tBot, p.y);
  }
  const SL = 0.02;
  const nS = Math.max(2, Math.ceil((tTop - tBot) / SL) + 1);
  const ax = new Float32Array(nS * 2);
  const axN = new Float32Array(nS);
  for (const p of torsoPts) {
    const s = Math.round((p.y - tBot) / SL);
    ax[s * 2] += p.x;
    ax[s * 2 + 1] += p.z;
    axN[s]++;
  }
  let lastX = c.x;
  let lastZ = c.z;
  for (let s = nS - 1; s >= 0; s--) {
    if (axN[s]) {
      lastX = ax[s * 2] / axN[s];
      lastZ = ax[s * 2 + 1] / axN[s];
    }
    ax[s * 2] = lastX;
    ax[s * 2 + 1] = lastZ;
  }
  const NA = 48;
  const rad = new Float32Array(nS * NA).fill(-1);
  for (const p of torsoPts) {
    const s = Math.round((p.y - tBot) / SL);
    const a = Math.atan2(p.x - ax[s * 2], p.z - ax[s * 2 + 1]);
    const k = Math.round(((a + Math.PI) / (2 * Math.PI)) * NA) % NA;
    const r = Math.hypot(p.x - ax[s * 2], p.z - ax[s * 2 + 1]);
    for (const ds of [-1, 0, 1]) {
      const ss = s + ds;
      if (ss >= 0 && ss < nS) rad[ss * NA + k] = Math.max(rad[ss * NA + k], r);
    }
  }
  for (let s = 0; s < nS; s++)
    for (let pass = 0; pass < NA; pass++) {
      let filled = true;
      for (let k = 0; k < NA; k++) {
        if (rad[s * NA + k] >= 0) continue;
        const a = rad[s * NA + ((k + 1) % NA)];
        const b = rad[s * NA + ((k + NA - 1) % NA)];
        if (a >= 0 || b >= 0) rad[s * NA + k] = Math.max(a, b);
        else filled = false;
      }
      if (filled) break;
    }
  for (let k = 0; k < rad.length; k++) if (rad[k] < 0) rad[k] = 0.1;
  const slice = (y: number) => Math.max(0, Math.min(nS - 1, Math.round((y - tBot) / SL)));
  const torso = (y: number, a: number) => {
    const s = slice(y);
    const k = Math.round(((a + Math.PI) / (2 * Math.PI)) * NA) % NA;
    return Math.max(rad[s * NA + k], rad[s * NA + ((k + 1) % NA)], rad[s * NA + ((k + NA - 1) % NA)]);
  };
  const axis = (y: number): [number, number] => {
    const s = slice(y);
    return [ax[s * 2], ax[s * 2 + 1]];
  };
  // shoulders: the top of the torso away from the neck
  let shoulderY = -Infinity;
  for (const p of torsoPts) if (Math.abs(p.x - c.x) > 0.12 && Math.abs(p.x - c.x) < 0.17) shoulderY = Math.max(shoulderY, p.y);
  if (!Number.isFinite(shoulderY)) shoulderY = chinY - 0.08;
  return { c, skull, headR, eyeY, chinY, shoulderY, torso, axis, torsoTop: tTop, torsoBottom: tBot };
}

/* ---------- growing ---------- */

interface Strand {
  pts: Vector3[];
  nor: Vector3[];
  /** Index where the lock leaves the skull. */
  fall: number;
  layer: number;
  width: number;
  tone: number;
  u0: number;
}

const _d = new Vector3();

function onSkull(m: Measure, p: Vector3, lift: number, out: Vector3) {
  _d.subVectors(p, m.c).normalize();
  return out.copy(m.c).addScaledVector(_d, m.skull(_d) + lift);
}

/** Hairline height at an angle round the head (0 = front). */
function hairlineY(m: Measure, az: number) {
  const a = Math.abs(az);
  const pts: [number, number][] = [
    [0, 0.058],
    [0.5, 0.05],
    [1.0, 0.036],
    [1.45, 0.03],
    [1.75, 0.035],
    [2.2, -0.02],
    [2.7, -0.07],
    [Math.PI, -0.085],
  ];
  for (let i = 1; i < pts.length; i++) {
    if (a <= pts[i][0]) {
      const t = (a - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
      return m.eyeY + lerp(pts[i - 1][1], pts[i][1], t * t * (3 - 2 * t));
    }
  }
  return m.eyeY - 0.085;
}

/** Push a point out of the head and torso (with a margin). */
function collide(m: Measure, p: Vector3, margin: number) {
  _d.subVectors(p, m.c);
  const l = _d.length();
  if (l > 1e-6 && p.y > m.chinY - 0.05) {
    _d.divideScalar(l);
    const r = m.headR(_d) + margin;
    if (l < r) p.copy(m.c).addScaledVector(_d, r);
  }
  if (p.y < m.torsoTop + 0.01 && p.y > m.torsoBottom) {
    const [axx, axz] = m.axis(p.y);
    const dx = p.x - axx;
    const dz = p.z - axz;
    const l2 = Math.hypot(dx, dz);
    const a = Math.atan2(dx, dz);
    const r = m.torso(p.y, a) + margin;
    if (l2 < r) {
      const k = l2 > 1e-6 ? r / l2 : 0;
      p.x = axx + (l2 > 1e-6 ? dx * k : 0);
      p.z = axz + (l2 > 1e-6 ? dz * k : -r);
    }
  }
}

function grow(m: Measure, style: HairStyle, dense: boolean): Strand[] {
  const r = rng(1234);
  const strands: Strand[] = [];
  const STEP = 0.012;
  const guides = dense ? 280 : 160;
  const perGuide = dense ? 4 : 3;
  const crown = new Vector3(m.c.x + style.part * 0.4, 0, m.c.z - 0.035);
  const tipBase = m.shoulderY - style.length;

  // roots: a Fibonacci spread over the upper head, kept inside the hairline
  const roots: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const N = guides * 3;
  for (let i = 0; i < N && roots.length < guides; i++) {
    const y = 1 - (i / (N - 1)) * 1.35; // from the top down to below the equator
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * golden;
    const d = new Vector3(Math.sin(th) * rr, y, Math.cos(th) * rr);
    const p = m.c.clone().addScaledVector(d, m.skull(d));
    const az = Math.atan2(d.x, d.z);
    if (p.y < hairlineY(m, az)) continue;
    roots.push(p);
  }
  // a soft, full hairline: extra roots just inside it, all the way round
  const lineN = dense ? 60 : 40;
  const frontN = dense ? 26 : 16;
  for (let i = 0; i < lineN + frontN; i++) {
    // the first roots go all the way round; the rest crowd the front hairline (forehead and temples)
    const az = i < lineN ? -Math.PI + ((i + 0.5) / lineN) * Math.PI * 2 : -1.25 + ((i - lineN + 0.5) / frontN) * 2.5;
    const hy = hairlineY(m, az) + 0.004;
    // walk up from below until the skull is above the hairline
    const d = new Vector3();
    for (let el = -0.9; el < 1.4; el += 0.02) {
      d.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      const p = m.c.clone().addScaledVector(d, m.skull(d));
      if (p.y >= hy) {
        roots.push(p);
        break;
      }
    }
  }

  for (let g = 0; g < roots.length; g++) {
    const groot = roots[g];
    const az0 = Math.atan2(groot.x - m.c.x, groot.z - m.c.z);
    const isFrontLock = style.frontLocks && Math.cos(az0) > 0.2 && Math.abs(Math.sin(az0)) > 0.72 && groot.y < m.eyeY + 0.07 && r() < 0.7;
    const lenJit = (r() - 0.5) * 0.12;
    const backness = Math.max(0, -Math.cos(az0));
    // V-shaped ends: longest down the middle of the back, shorter layers at the sides
    const tipY = tipBase + lenJit - backness * 0.035 + (isFrontLock ? 0.07 : 0) + (1 - backness) * 0.03;

    for (let c = 0; c < perGuide; c++) {
      const layer = c === 0 ? 0 : c < perGuide - 1 ? 1 : 2;
      const lift = 0.004 + layer * 0.0055 + r() * 0.003;
      // each lock ends at its own height: ragged, uneven ends instead of one cut line
      const endJit = (r() - 0.35) * 0.09 + (layer === 2 ? 0.02 : 0);
      const p = groot.clone();
      p.x += (r() - 0.5) * 0.016;
      p.z += (r() - 0.5) * 0.016;
      p.y += (r() - 0.5) * 0.01;
      onSkull(m, p, lift, p);
      const pts: Vector3[] = [p.clone()];
      const nor: Vector3[] = [];
      const dir = new Vector3();
      const tmp = new Vector3();
      let fall = -1;
      const vel = new Vector3();
      const steerZ = isFrontLock ? 0.5 : -0.75;
      const steerX = isFrontLock ? Math.sign(p.x - m.c.x) * 0.1 : -Math.sign(p.x - m.c.x) * 0.05;
      for (let k = 0; k < 140; k++) {
        const cur = pts[pts.length - 1];
        if (fall < 0) {
          _d.subVectors(cur, m.c).normalize();
          const azc = Math.atan2(cur.x - m.c.x, cur.z - m.c.z);
          const fr = Math.max(0, Math.cos(azc));
          const sx = cur.x - (m.c.x + style.part) >= 0 ? 1 : -1;
          if (isFrontLock) {
            // framing the face: out to the side and down, in front of the ear
            dir.set(sx * 0.7, -1.0, -0.4);
          } else {
            // front half: swept from the parting to the side and back (off the face);
            // back half: out from the crown and down
            tmp.set(cur.x - crown.x, 0, cur.z - crown.z);
            if (tmp.lengthSq() > 1e-6) tmp.normalize();
            dir.set(lerp(tmp.x * 0.6, sx * 0.75, fr), lerp(-1.0, -0.25, fr), lerp(tmp.z * 0.6, -1.0, fr));
          }
          dir.addScaledVector(_d, -dir.dot(_d)).normalize();
          const next = cur.clone().addScaledVector(dir, STEP);
          onSkull(m, next, lift + k * 0.0006, next);
          // leaves the skull below the temples / ears, or at the nape
          // (in front of the ears hair stays on the head, swept back, so it never falls over the face)
          const azn = Math.abs(Math.atan2(next.x - m.c.x, next.z - m.c.z));
          if (((next.y < m.eyeY + 0.005 && (azn > 1.75 || isFrontLock)) || k > 60) || (next.y < m.eyeY - 0.07)) {
            fall = pts.length;
            vel.subVectors(next, cur).normalize();
          }
          pts.push(next);
        } else {
          // lift off slightly at the start of the fall: volume at the sides
          const s = (pts.length - fall) * STEP;
          vel.y -= 0.35;
          vel.z += steerZ * (s < 0.25 ? 0.25 : 0.06);
          vel.x += steerX * (s < 0.2 ? 0.3 : 0.05);
          vel.normalize();
          const next = cur.clone().addScaledVector(vel, STEP);
          collide(m, next, 0.006 + lift * 1.1);
          vel.subVectors(next, cur).normalize();
          pts.push(next);
          if (next.y < tipY + endJit) break;
        }
      }
      if (pts.length < 6) continue;
      if (fall < 0) fall = pts.length - 1;
      // waves below the ears, growing toward the ends; locks wave together
      // neighbouring locks wave together (phase from where they grow), each a little its own
      const ph = groot.x * 38 + groot.z * 22 + groot.y * 15 + r() * 0.5;
      const amp = style.wave * (0.7 + r() * 0.6);
      for (let i = fall; i < pts.length; i++) {
        const s = (i - fall) * STEP;
        const ramp = smooth(0, 0.18, s);
        const t = new Vector3().subVectors(pts[Math.min(i + 1, pts.length - 1)], pts[Math.max(i - 1, 0)]).normalize();
        const out = outward(m, pts[i], tmp);
        const sideV = new Vector3().crossVectors(t, out).normalize();
        const w = Math.sin((s / style.waveLength) * Math.PI * 2 + ph);
        pts[i].addScaledVector(sideV, w * amp * ramp).addScaledVector(out, Math.cos((s / style.waveLength) * Math.PI * 2 + ph) * amp * 0.25 * ramp);
        collide(m, pts[i], 0.005 + lift);
      }
      // smooth the path a little
      for (let pass = 0; pass < 4; pass++)
        for (let i = 1; i < pts.length - 1; i++) {
          if (i < fall - 1) continue;
          pts[i].lerp(tmp.addVectors(pts[i - 1], pts[i + 1]).multiplyScalar(0.5), 0.5);
        }
      for (const q of pts) nor.push(outward(m, q, new Vector3()));
      strands.push({
        pts,
        nor,
        fall,
        layer,
        width: layer === 0 ? 0.03 + r() * 0.01 : 0.017 + r() * 0.01,
        tone: 0.88 + r() * 0.24 + (layer === 2 ? 0.06 : 0) - (layer === 0 ? 0.14 : 0),
        u0: r(),
      });
    }
  }
  return strands;
}

/** Out from the head (above the chin) or from the torso's axis (below), blended between. */
function outward(m: Measure, p: Vector3, out: Vector3) {
  const h = out.subVectors(p, m.c).normalize();
  const hx = h.x;
  const hy = h.y;
  const hz = h.z;
  const [axx, axz] = m.axis(p.y);
  const tx = p.x - axx;
  const tz = p.z - axz;
  const tl = Math.hypot(tx, tz) || 1;
  const t = smooth(m.chinY, m.shoulderY - 0.04, p.y); // 1 near the head, 0 down the back
  out.set(lerp(tx / tl, hx, t), lerp(0.35, hy, t), lerp(tz / tl, hz, t));
  return out.normalize();
}

/* ---------- building the mesh ---------- */

/**
 * The body's rest pose is not its bind pose (Mixamo's centimetre bones):
 * a vertex shown at P under bones blended by `hw` is stored at the inverse
 * of that blend, so that skinning puts it back at P.
 */
type ToBind = (p: Vector3, n: Vector3 | null, hw: number) => void;

function bindSpace(b: SkinnedMesh, head: number, upper: number): ToBind {
  b.skeleton.update();
  const bm = b.skeleton.boneMatrices;
  const H = new Matrix4().fromArray(bm, head * 16);
  const U = new Matrix4().fromArray(bm, upper * 16);
  const wrap = (m: Matrix4) => new Matrix4().copy(b.bindMatrixInverse).multiply(m).multiply(b.bindMatrix);
  const Hm = wrap(H);
  const Um = wrap(U);
  const M = new Matrix4();
  const toLocal = new Matrix4().copy(b.matrixWorld).invert();
  let lastW = -1;
  return (p, n, hw) => {
    if (hw !== lastW) {
      lastW = hw;
      for (let i = 0; i < 16; i++) M.elements[i] = Hm.elements[i] * hw + Um.elements[i] * (1 - hw);
      M.invert();
    }
    p.applyMatrix4(toLocal).applyMatrix4(M);
    if (n) n.transformDirection(toLocal).transformDirection(M);
  };
}

function build(m: Measure, style: HairStyle, strands: Strand[], toBind: ToBind, head: number, upper: number): BufferGeometry {
  // grown at 1.2 cm steps, drawn at 2.4 cm (the ends and the turn off the skull kept)
  for (const s of strands) {
    const keep = s.pts.map((_, i) => i % 2 === 0 || i === s.pts.length - 1 || i === s.fall);
    s.pts = s.pts.filter((_, i) => keep[i]);
    s.nor = s.nor.filter((_, i) => keep[i]);
    s.fall = keep.slice(0, s.fall + 1).filter(Boolean).length - 1;
  }
  let nv = 0;
  let ni = 0;
  for (const s of strands) {
    nv += s.pts.length * 2;
    ni += (s.pts.length - 1) * 6;
  }
  const pos = new Float32Array(nv * 3);
  const nor = new Float32Array(nv * 3);
  const uv = new Float32Array(nv * 2);
  const col = new Float32Array(nv * 3);
  const si = new Uint16Array(nv * 4);
  const sw = new Float32Array(nv * 4);
  const idx = new Uint32Array(ni);
  const cRoot = new Color(style.root);
  const cMid = new Color(style.mid);
  const cTip = new Color(style.tip);
  const cShine = new Color(style.shine);
  const col3 = new Color();
  const t = new Vector3();
  const sideV = new Vector3();
  const a = new Vector3();
  const nrm = new Vector3();
  let v = 0;
  let ii = 0;
  for (const s of strands) {
    const n = s.pts.length;
    let len = 0;
    const along: number[] = [0];
    for (let i = 1; i < n; i++) {
      len += s.pts[i].distanceTo(s.pts[i - 1]);
      along.push(len);
    }
    const base = v;
    const streak = s.layer === 2 && s.u0 > 0.72;
    for (let i = 0; i < n; i++) {
      const f = along[i] / len;
      t.subVectors(s.pts[Math.min(i + 1, n - 1)], s.pts[Math.max(i - 1, 0)]).normalize();
      sideV.crossVectors(t, s.nor[i]).normalize();
      // a lock is narrow at the root, fullest at the middle, tapering to the ends
      const w = s.width * (0.55 + 0.45 * smooth(0, 0.12, f)) * (1 - 0.55 * smooth(0.55, 1, f));
      // skinning: the head carries the top, the upper back the length
      const hw = i <= s.fall ? 1 : smooth(m.shoulderY - 0.02, m.chinY + 0.01, s.pts[i].y);
      for (let e = 0; e < 2; e++) {
        a.copy(s.pts[i]).addScaledVector(sideV, (e ? 0.5 : -0.5) * w);
        nrm.copy(s.nor[i]);
        toBind(a, nrm, hw);
        pos.set([a.x, a.y, a.z], v * 3);
        nor.set([nrm.x, nrm.y, nrm.z], v * 3);
        uv.set([s.u0 + e * (s.layer === 0 ? 0.5 : 0.3), Math.min(0.999, along[i] / Math.max(len, 0.25))], v * 2);
        // colour: dark roots, warm middle, light ends; deeper layers darker (self-shadowing)
        if (f < 0.25) col3.copy(cRoot).lerp(cMid, smooth(0, 0.25, f));
        else col3.copy(cMid).lerp(cTip, smooth(0.25, 1, f));
        if (streak) col3.lerp(cShine, 0.35 * smooth(0.1, 0.5, f));
        col3.multiplyScalar(s.tone);
        col.set([col3.r, col3.g, col3.b], v * 3);
        si.set([head, upper, 0, 0], v * 4);
        sw.set([hw, 1 - hw, 0, 0], v * 4);
        v++;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const p0 = base + i * 2;
      idx.set([p0, p0 + 1, p0 + 2, p0 + 1, p0 + 3, p0 + 2], ii);
      ii += 6;
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("normal", new BufferAttribute(nor, 3));
  geo.setAttribute("uv", new BufferAttribute(uv, 2));
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.setAttribute("skinIndex", new BufferAttribute(si, 4));
  geo.setAttribute("skinWeight", new BufferAttribute(sw, 4));
  geo.setIndex(new BufferAttribute(idx, 1));
  geo.computeBoundingSphere();
  return geo;
}

/** An opaque cap under the hair, hair-coloured: no scalp shows between the locks. */
function cap(m: Measure, style: HairStyle, toBind: ToBind, head: number): BufferGeometry {
  const NA = 128;
  const NE = 48;
  const pos: number[] = [];
  const nor: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const keep: boolean[] = [];
  const c = new Color(style.root).multiplyScalar(0.9);
  const d = new Vector3();
  const p = new Vector3();
  const nm = new Vector3();
  for (let j = 0; j < NE; j++) {
    const el = lerp(-0.45, Math.PI / 2, j / (NE - 1));
    for (let i = 0; i < NA; i++) {
      const az = (i / NA) * Math.PI * 2 - Math.PI;
      d.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      p.copy(m.c).addScaledVector(d, m.skull(d) + 0.0035);
      keep.push(p.y > hairlineY(m, az) + 0.007);
      nm.copy(d);
      const q = p.clone();
      toBind(q, nm, 1);
      pos.push(q.x, q.y, q.z);
      nor.push(nm.x, nm.y, nm.z);
      col.push(c.r, c.g, c.b);
      uv.push(0.5, 0.02);
    }
  }
  for (let j = 0; j < NE - 1; j++)
    for (let i = 0; i < NA; i++) {
      const a = j * NA + i;
      const b = j * NA + ((i + 1) % NA);
      const a2 = a + NA;
      const b2 = b + NA;
      if (keep[a] && keep[b] && keep[a2] && keep[b2]) idx.push(a, b, a2, b, b2, a2);
    }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  geo.setAttribute("color", new BufferAttribute(new Float32Array(col), 3));
  geo.setAttribute("uv", new BufferAttribute(new Float32Array(uv), 2));
  const n = pos.length / 3;
  geo.setAttribute("skinIndex", new BufferAttribute(new Uint16Array(n * 4).map((_, k) => (k % 4 === 0 ? head : 0)), 4));
  geo.setAttribute("skinWeight", new BufferAttribute(new Float32Array(n * 4).map((_, k) => (k % 4 === 0 ? 1 : 0)), 4));
  geo.setIndex(idx);
  geo.computeBoundingSphere();
  return geo;
}

/* ---------- entry ---------- */

/** One head of hair per loaded model: every copy of the person shares it. */
const grown = new WeakMap<object, { hair: BufferGeometry; cap: BufferGeometry } | null>();
let sharedMat: MeshStandardMaterial | null = null;
let capMat: MeshStandardMaterial | null = null;

/**
 * Replace a person's own hair with grown hair. Call on the freshly cloned,
 * un-animated person (rest pose). `key` is anything shared by every copy of
 * the same model (its loaded body geometry) so the hair is grown once.
 */
export function growHair(root: Group, style: HairStyle, dense: boolean) {
  root.updateMatrixWorld(true);
  let body: SkinnedMesh | null = null;
  let shirt: SkinnedMesh | null = null;
  let lashes: SkinnedMesh | null = null;
  const old: Object3D[] = [];
  root.traverse((o) => {
    const m = o as SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    if (/_Body$/.test(m.name)) body = m;
    else if (/Shirt|Sweater|Suit|Top/.test(m.name) && !shirt) shirt = m;
    else if (/eyela/i.test(m.name)) lashes = m;
    else if (style.replaces.test(m.name)) old.push(m);
  });
  const b = body as SkinnedMesh | null;
  if (!b) return;
  const bones: Record<string, number> = {};
  b.skeleton.bones.forEach((bone: Bone, i) => {
    const n = bone.name.replace(/^mixamorig\d*:?/, "");
    bones[n] = i;
  });
  if (bones.Head === undefined || bones.Spine2 === undefined) return;

  let geos = grown.get(b.geometry);
  if (geos === undefined) {
    b.skeleton.update();
    const m = measure(root, b, shirt, lashes, bones);
    if (m) {
      const strands = grow(m, style, dense);
      const toBind = bindSpace(b, bones.Head, bones.Spine2);
      geos = { hair: build(m, style, strands, toBind, bones.Head, bones.Spine2), cap: cap(m, style, bindSpace(b, bones.Head, bones.Spine2), bones.Head) };
    } else geos = null;
    grown.set(b.geometry, geos);
  }
  if (!geos) return;
  for (const o of old) o.removeFromParent();
  if (!sharedMat) sharedMat = hairMaterial();
  if (!capMat) capMat = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });
  const add = (geo: BufferGeometry, mat: MeshStandardMaterial, name: string) => {
    const mesh = new SkinnedMesh(geo, mat);
    mesh.name = name;
    mesh.position.copy(b.position);
    mesh.quaternion.copy(b.quaternion);
    mesh.scale.copy(b.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    b.parent?.add(mesh);
    mesh.bind(b.skeleton, b.bindMatrix);
    return mesh as Mesh;
  };
  add(geos.cap, capMat, "GrownHairCap");
  add(geos.hair, sharedMat, "GrownHair");
}
