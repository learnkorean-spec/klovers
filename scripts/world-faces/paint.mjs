// Repaint npc-elizabeth's body map: skin to the same base tone as npc-megan's
// (the world then tints both the same way), and the scalp under her (new) hair
// in Megan's scalp-hair colour. node paint.mjs E.glb M.glb OUT.glb [maskOut.png]
// With M = "-" the skin is left as it is and only the scalp is painted
// (npc-brian, bald until he took npc-leonard's hair).
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [,, eIn, mIn, out, maskOut] = process.argv;
const E = await io.read(eIn), M = mIn === '-' ? null : await io.read(mIn);
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r] * b[c*4+k]; return o; };
const ap = (m, [x, y, z]) => [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
const node = (doc, re) => doc.getRoot().listNodes().find((n) => re.test(n.getName()));
const toWorld = (n) => { const s = n.getSkin(); const e = []; s.getInverseBindMatrices().getElement(0, e); return mul(s.listJoints()[0].getWorldMatrix(), e); };
const read = (acc) => { const o = []; const el = []; for (let i = 0; i < acc.getCount(); i++) { acc.getElement(i, el); o.push([...el]); } return o; };
const s2l = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const l2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
async function load(doc) {
  const body = node(doc, /_Body$/), hair = node(doc, /_Hair$/);
  const bp = body.getMesh().listPrimitives()[0];
  const W = toWorld(body), HW = toWorld(hair);
  const pos = read(bp.getAttribute('POSITION')).map((v) => ap(W, v));
  const uv = read(bp.getAttribute('TEXCOORD_0'));
  const idx = bp.getIndices().getArray();
  const hp = read(hair.getMesh().listPrimitives()[0].getAttribute('POSITION')).map((v) => ap(HW, v));
  const tex = bp.getMaterial().getBaseColorTexture();
  const img = sharp(Buffer.from(tex.getImage()));
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const headY = node(doc, /:Head$/).getWorldMatrix()[13];
  return { tex, pos, uv, idx, hp, data, w: info.width, h: info.height, headY };
}
function covered(m) {
  // Body vertices under the hair: on the head, with hair within 1.5 cm.
  const cell = 0.012, grid = new Map();
  const key = (p) => `${Math.floor(p[0] / cell)},${Math.floor(p[1] / cell)},${Math.floor(p[2] / cell)}`;
  for (const p of m.hp) { const k = key(p); (grid.get(k) ?? grid.set(k, []).get(k)).push(p); }
  return m.pos.map((p) => {
    if (p[1] < m.headY - 0.02) return false;
    const [gx, gy, gz] = [0, 1, 2].map((c) => Math.floor(p[c] / cell));
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      const l = grid.get(`${gx + a},${gy + b},${gz + c}`); if (!l) continue;
      for (const q of l) if ((p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2 < cell * cell) return true;
    }
    return false;
  });
}
function raster(m, keep) {
  // Mask (0/1) of the body's UV triangles; keep(i0,i1,i2) picks which.
  const mask = new Uint8Array(m.w * m.h);
  for (let t = 0; t < m.idx.length; t += 3) {
    const [a, b, c] = [m.idx[t], m.idx[t + 1], m.idx[t + 2]];
    if (!keep(a, b, c)) continue;
    const P = [a, b, c].map((i) => [m.uv[i][0] * m.w, m.uv[i][1] * m.h]);
    const x0 = Math.max(0, Math.floor(Math.min(P[0][0], P[1][0], P[2][0])) - 1), x1 = Math.min(m.w - 1, Math.ceil(Math.max(P[0][0], P[1][0], P[2][0])) + 1);
    const y0 = Math.max(0, Math.floor(Math.min(P[0][1], P[1][1], P[2][1])) - 1), y1 = Math.min(m.h - 1, Math.ceil(Math.max(P[0][1], P[1][1], P[2][1])) + 1);
    const d = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]);
    if (Math.abs(d) < 1e-9) continue;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const l1 = ((P[1][0] - px) * (P[2][1] - py) - (P[2][0] - px) * (P[1][1] - py)) / d;
      const l2 = ((P[2][0] - px) * (P[0][1] - py) - (P[0][0] - px) * (P[2][1] - py)) / d;
      const l3 = 1 - l1 - l2;
      const e = -0.02; // a hair of overlap so seams close
      if (l1 >= e && l2 >= e && l3 >= e) mask[y * m.w + x] = 1;
    }
  }
  return mask;
}
const isSkin = (r, g, b) => !(r < 0.1 || r < g || g < b * 0.8);
function stats(m, mask) {
  const s = [0, 0, 0]; let n = 0; const lum = [];
  for (let i = 0; i < mask.length; i++) if (mask[i]) {
    const [r, g, b] = [0, 1, 2].map((c) => s2l(m.data[i * 4 + c] / 255));
    if (!isSkin(r, g, b)) continue; s[0] += r; s[1] += g; s[2] += b; n++;
  }
  return s.map((v) => v / n);
}
function median(m, mask) {
  const cols = [[], [], []];
  for (let i = 0; i < mask.length; i++) if (mask[i]) for (let c = 0; c < 3; c++) cols[c].push(m.data[i * 4 + c]);
  return cols.map((a) => { a.sort((x, y) => x - y); return a[a.length >> 1]; });
}
const e = await load(E), mg = M && await load(M);
// Skin: the whole body island, minus the scalp, both bodies.
const ce = covered(e);
console.log('covered verts E', ce.filter(Boolean).length);
const bodyE = raster(e, () => true);
const scalpE = raster(e, (a, b, c) => ce[a] && ce[b] && ce[c]);
const skinE = stats(e, bodyE.map((v, i) => v && !scalpE[i]));
let skinM = skinE, hairMed = '-';
if (mg) {
  const cm = covered(mg), bodyM = raster(mg, () => true), scalpM = raster(mg, (a, b, c) => cm[a] && cm[b] && cm[c]);
  skinM = stats(mg, bodyM.map((v, i) => v && !scalpM[i]));
  hairMed = median(mg, scalpM);
}
const f = skinM.map((v, c) => v / skinE[c]);
// Megan's scalp colour is a mid brown that the world's skin tint (≈2× on
// these maps) turns grey-olive; paint a dark brown that lands near the hair
// dyes (#100D0C…#2B1F17) after that tint.
const hairCol = [30, 19, 14];
console.log('skin E', skinE.map((v) => v.toFixed(3)), 'skin M', skinM.map((v) => v.toFixed(3)), 'factor', f.map((v) => v.toFixed(2)), 'scalp colour M', hairMed, 'painted', hairCol);
// Feathered scalp mask: a few texels of soft edge.
const R = 6;
const soft = new Float32Array(e.w * e.h);
{ const tmp = new Float32Array(e.w * e.h);
  for (let y = 0; y < e.h; y++) { let acc = 0; for (let x = -R; x < e.w + R; x++) { if (x + R < e.w) acc += scalpE[y * e.w + x + R]; if (x - R - 1 >= 0) acc -= scalpE[y * e.w + x - R - 1]; if (x >= 0 && x < e.w) tmp[y * e.w + x] = acc / (2 * R + 1); } }
  for (let x = 0; x < e.w; x++) { let acc = 0; for (let y = -R; y < e.h + R; y++) { if (y + R < e.h) acc += tmp[(y + R) * e.w + x]; if (y - R - 1 >= 0) acc -= tmp[(y - R - 1) * e.w + x]; if (y >= 0 && y < e.h) soft[y * e.w + x] = acc / (2 * R + 1); } } }
const outData = Buffer.from(e.data);
let painted = 0;
for (let i = 0; i < bodyE.length; i++) {
  if (!bodyE[i]) continue;
  const rgb = [0, 1, 2].map((c) => s2l(e.data[i * 4 + c] / 255));
  // Skin to Megan's base tone, every texel scaled alike (lips, brows and shading keep their relation).
  let o = rgb.map((v, c) => Math.min(1, v * f[c]));
  // Scalp: hair colour, keeping a little of the texture's own grain.
  const k = Math.min(1, Math.max(0, soft[i] * 2 - 0.35));
  if (k > 0) {
    const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    const grain = Math.min(1.35, Math.max(0.7, Math.sqrt(lum / Math.max(1e-3, skinE[1] * 0.6))));
    const hc = hairCol.map((v) => s2l(v / 255) * grain);
    o = o.map((v, c) => v * (1 - k) + hc[c] * k); painted++;
  }
  for (let c = 0; c < 3; c++) outData[i * 4 + c] = Math.round(l2s(o[c]) * 255);
}
console.log('painted scalp texels', painted);
const webp = await sharp(outData, { raw: { width: e.w, height: e.h, channels: 4 } }).removeAlpha().webp({ quality: 88 }).toBuffer();
console.log('body map bytes', e.tex.getImage().byteLength, '→', webp.length);
e.tex.setImage(new Uint8Array(webp));
if (maskOut) await sharp(outData, { raw: { width: e.w, height: e.h, channels: 4 } }).resize(1024).png().toFile(maskOut);
await io.write(out, E);
console.log('wrote', out);
