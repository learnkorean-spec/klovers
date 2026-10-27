// Give npc-elizabeth (Ch26) the hair of npc-megan (Ch22), fitted to her own head.
// node transplant.mjs E.glb M.glb OUT.glb
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const [,, eIn, mIn, out] = process.argv;
const E = await io.read(eIn), M = await io.read(mIn);
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r] * b[c*4+k]; return o; };
function inv(a) { const o = new Array(16);
  const b00=a[0]*a[5]-a[1]*a[4], b01=a[0]*a[6]-a[2]*a[4], b02=a[0]*a[7]-a[3]*a[4], b03=a[1]*a[6]-a[2]*a[5], b04=a[1]*a[7]-a[3]*a[5], b05=a[2]*a[7]-a[3]*a[6];
  const b06=a[8]*a[13]-a[9]*a[12], b07=a[8]*a[14]-a[10]*a[12], b08=a[8]*a[15]-a[11]*a[12], b09=a[9]*a[14]-a[10]*a[13], b10=a[9]*a[15]-a[11]*a[13], b11=a[10]*a[15]-a[11]*a[14];
  const d = 1/(b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06);
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d; o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d; o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d; o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d; o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d; o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d; o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d; o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d; o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d; o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d; o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d; o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d; o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d; return o; }
const ap = (m, [x, y, z]) => [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
const apL = (m, [x, y, z]) => [m[0]*x+m[4]*y+m[8]*z, m[1]*x+m[5]*y+m[9]*z, m[2]*x+m[6]*y+m[10]*z];
const nrm = (v) => { const l = Math.hypot(...v) || 1; return v.map((c) => c / l); };
const bare = (n) => n.replace(/^mixamorig\d*:/, '');
const node = (doc, re) => doc.getRoot().listNodes().find((n) => re.test(n.getName()));
const toWorld = (n) => { const s = n.getSkin(); const e = []; s.getInverseBindMatrices().getElement(0, e); return mul(s.listJoints()[0].getWorldMatrix(), e); };
const read = (acc) => { const out = []; const el = []; for (let i = 0; i < acc.getCount(); i++) { acc.getElement(i, el); out.push([...el]); } return out; };
function worldPts(n) { const W = toWorld(n); const p = n.getMesh().listPrimitives()[0]; return { W, pos: read(p.getAttribute('POSITION')).map((v) => ap(W, v)), nor: read(p.getAttribute('NORMAL')).map((v) => nrm(apL(W, v))) }; }
const headY = (doc) => node(doc, /:Head$/).getWorldMatrix()[13];
// Scalp boxes: the body's vertices above the head joint (the skull, no hair).
function scalpBox(doc) {
  const b = worldPts(node(doc, /_Body$/)); const hy = headY(doc);
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9]; const verts = [];
  b.pos.forEach((p, i) => { if (p[1] < hy + 0.02) return; verts.push([p, b.nor[i]]); for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], p[c]); hi[c] = Math.max(hi[c], p[c]); } });
  return { lo, hi, verts };
}
const sE = scalpBox(E), sM = scalpBox(M);
console.log('scalp E', sE.lo.map(v=>v.toFixed(3)), sE.hi.map(v=>v.toFixed(3)), sE.verts.length);
console.log('scalp M', sM.lo.map(v=>v.toFixed(3)), sM.hi.map(v=>v.toFixed(3)), sM.verts.length);
// Fit per axis: centre x,z on the skull's middle, y on its top; scale by the skull's size.
const S = [0, 1, 2].map((c) => (sE.hi[c] - sE.lo[c]) / (sM.hi[c] - sM.lo[c]));
const cE = [(sE.lo[0] + sE.hi[0]) / 2, sE.hi[1], (sE.lo[2] + sE.hi[2]) / 2];
const cM = [(sM.lo[0] + sM.hi[0]) / 2, sM.hi[1], (sM.lo[2] + sM.hi[2]) / 2];
console.log('scale', S.map((v) => v.toFixed(3)));
const fit = (p) => p.map((v, c) => cE[c] + (v - cM[c]) * S[c]);
const fitN = (n) => nrm(n.map((v, c) => v / S[c]));
const hn = node(M, /_Hair$/); const hw = worldPts(hn);
const P = hw.pos.map(fit); const N = hw.nor.map(fitN);
// Keep every hair vertex at least 3 mm outside her scalp.
let pushed = 0;
const MARGIN = 0.003;
for (let i = 0; i < P.length; i++) {
  const p = P[i]; let best = null, bd = 1e9;
  for (const [v, n] of sE.verts) { const d = (p[0]-v[0])**2 + (p[1]-v[1])**2 + (p[2]-v[2])**2; if (d < bd) { bd = d; best = [v, n]; } }
  if (!best || bd > 0.03 ** 2) continue;
  const [v, n] = best; const h = (p[0]-v[0])*n[0] + (p[1]-v[1])*n[1] + (p[2]-v[2])*n[2];
  if (h < MARGIN) { for (let c = 0; c < 3; c++) p[c] += n[c] * (MARGIN - h); pushed++; }
}
console.log('hair verts', P.length, 'pushed out', pushed);
// Quantise into [-1, 1] and fold that into the new skin.
const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
for (const p of P) for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], p[c]); hi[c] = Math.max(hi[c], p[c]); }
const ctr = lo.map((v, c) => (v + hi[c]) / 2); const half = Math.max(...lo.map((v, c) => (hi[c] - v) / 2)) * 1.0001;
const T = [half,0,0,0, 0,half,0,0, 0,0,half,0, ctr[0],ctr[1],ctr[2],1];
const q = new Int16Array(P.length * 3);
P.forEach((p, i) => p.forEach((v, c) => { q[i*3+c] = Math.round(((v - ctr[c]) / half) * 32767); }));
const nq = new Int8Array(N.length * 3);
N.forEach((n, i) => n.forEach((v, c) => { nq[i*3+c] = Math.round(v * 127); }));
const buf = E.getRoot().listBuffers()[0];
const acc = (arr, type, norm) => E.createAccessor().setArray(arr).setType(type).setNormalized(norm).setBuffer(buf);
const src = hn.getMesh().listPrimitives()[0];
const copy = (a) => acc(a.getArray().slice(), a.getType(), a.getNormalized());
const prim = E.createPrimitive()
  .setAttribute('POSITION', acc(q, 'VEC3', true))
  .setAttribute('NORMAL', acc(nq, 'VEC3', true))
  .setAttribute('TEXCOORD_0', copy(src.getAttribute('TEXCOORD_0')))
  .setAttribute('JOINTS_0', copy(src.getAttribute('JOINTS_0')))
  .setAttribute('WEIGHTS_0', copy(src.getAttribute('WEIGHTS_0')))
  .setIndices(copy(src.getIndices()));
// Face blend shapes: the hair moves with her face like it did on Megan's.
const Wm = hw.W;
for (const t of src.listTargets()) {
  const d = read(t.getAttribute('POSITION'));
  const dq = new Int16Array(d.length * 3);
  d.forEach((v, i) => { const w = apL(Wm, v).map((x, c) => (x * S[c]) / half); w.forEach((x, c) => { dq[i*3+c] = Math.round(Math.max(-1, Math.min(1, x)) * 32767); }); });
  const tt = E.createPrimitiveTarget(t.getName()).setAttribute('POSITION', acc(dq, 'VEC3', true));
  prim.addTarget(tt);
}
// Megan's hair material and maps.
const sm = src.getMaterial();
const tex = (t) => t && E.createTexture(t.getName()).setImage(t.getImage().slice()).setMimeType(t.getMimeType()).setURI('');
const mat = E.createMaterial('Ch26_hair2')
  .setAlphaMode(sm.getAlphaMode()).setAlphaCutoff(sm.getAlphaCutoff()).setDoubleSided(sm.getDoubleSided())
  .setBaseColorFactor(sm.getBaseColorFactor()).setRoughnessFactor(sm.getRoughnessFactor()).setMetallicFactor(sm.getMetallicFactor())
  .setBaseColorTexture(tex(sm.getBaseColorTexture())).setNormalTexture(tex(sm.getNormalTexture()));
prim.setMaterial(mat);
const old = node(E, /_Hair$/);
const oldMesh = old.getMesh();
const mesh = E.createMesh('Ch26_Hair').addPrimitive(prim);
mesh.setWeights(new Array(src.listTargets().length).fill(0));
mesh.setExtras({ ...(hn.getMesh().getExtras() || {}) });
// Joints by name in her skeleton, inverse binds from her bind pose.
const msk = hn.getSkin();
const byName = new Map(E.getRoot().listNodes().map((n) => [bare(n.getName()), n]));
const joints = msk.listJoints().map((j) => { const n = byName.get(bare(j.getName())); if (!n) throw new Error('no joint ' + j.getName()); return n; });
const ibmArr = new Float32Array(joints.length * 16);
joints.forEach((j, i) => ibmArr.set(mul(inv(j.getWorldMatrix()), T), i * 16));
const skin = E.createSkin('Ch26_Hair').setSkeleton(old.getSkin().getSkeleton()).setInverseBindMatrices(acc(ibmArr, 'MAT4', false));
joints.forEach((j) => skin.addJoint(j));
const oldSkin = old.getSkin();
old.setMesh(mesh).setSkin(skin);
oldMesh.dispose(); if (!E.getRoot().listNodes().some((n) => n.getSkin() === oldSkin)) oldSkin.dispose();
await E.transform(prune({ keepAttributes: true, keepLeaves: true }));
console.log('mesh extras', JSON.stringify(mesh.getExtras()).slice(0, 200));
await io.write(out, E);
console.log('wrote', out);
