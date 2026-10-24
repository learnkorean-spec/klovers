import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';
const [,, input, newJson, output] = process.argv;
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const target = JSON.parse(fs.readFileSync(newJson, 'utf8'));
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r] * b[c*4+k]; return o; };
function inv(m) { // general 4x4 inverse (column-major)
  const a = m, o = new Array(16);
  const b00=a[0]*a[5]-a[1]*a[4], b01=a[0]*a[6]-a[2]*a[4], b02=a[0]*a[7]-a[3]*a[4], b03=a[1]*a[6]-a[2]*a[5], b04=a[1]*a[7]-a[3]*a[5], b05=a[2]*a[7]-a[3]*a[6];
  const b06=a[8]*a[13]-a[9]*a[12], b07=a[8]*a[14]-a[10]*a[12], b08=a[8]*a[15]-a[11]*a[12], b09=a[9]*a[14]-a[10]*a[13], b10=a[9]*a[15]-a[11]*a[13], b11=a[10]*a[15]-a[11]*a[14];
  const det = b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06, d = 1/det;
  o[0]=(a[5]*b11-a[6]*b10+a[7]*b09)*d; o[1]=(a[2]*b10-a[1]*b11-a[3]*b09)*d; o[2]=(a[13]*b05-a[14]*b04+a[15]*b03)*d; o[3]=(a[10]*b04-a[9]*b05-a[11]*b03)*d;
  o[4]=(a[6]*b08-a[4]*b11-a[7]*b07)*d; o[5]=(a[0]*b11-a[2]*b08+a[3]*b07)*d; o[6]=(a[14]*b02-a[12]*b05-a[15]*b01)*d; o[7]=(a[8]*b05-a[10]*b02+a[11]*b01)*d;
  o[8]=(a[4]*b10-a[5]*b08+a[7]*b06)*d; o[9]=(a[1]*b08-a[0]*b10-a[3]*b06)*d; o[10]=(a[12]*b04-a[13]*b02+a[15]*b00)*d; o[11]=(a[9]*b02-a[8]*b04-a[11]*b00)*d;
  o[12]=(a[5]*b07-a[4]*b09-a[6]*b06)*d; o[13]=(a[0]*b09-a[1]*b07+a[2]*b06)*d; o[14]=(a[13]*b01-a[12]*b03-a[14]*b00)*d; o[15]=(a[8]*b03-a[9]*b01+a[10]*b00)*d;
  return o;
}
const apply = (m, [x, y, z]) => [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
let changed = 0, requant = 0;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh || !target[node.getName()]) continue;
  const skin = node.getSkin(); const joints = skin.listJoints(); const ibmAcc = skin.getInverseBindMatrices();
  const e0 = []; ibmAcc.getElement(0, e0); const M = mul(joints[0].getWorldMatrix(), e0); const Mi = inv(M);
  const pts = target[node.getName()]; let k = 0;
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION');
    const n = pos.getCount();
    // New positions in the mesh's current local (normalised) space, as floats.
    const local = new Float32Array(n * 3);
    for (let i = 0; i < n; i++, k++) { const l = apply(Mi, pts[k]); local.set(l, i * 3); changed++; }
    if (!pos.getNormalized()) { pos.setArray(local); continue; }
    // Re-quantise: one uniform scale and an offset so everything fits [-1, 1] again,
    // and fold that transform T into this mesh's own skin: IBM' = IBM · T.
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { const v = local[i*3+c]; lo[c] = Math.min(lo[c], v); hi[c] = Math.max(hi[c], v); }
    const ctr = lo.map((v, c) => (v + hi[c]) / 2);
    const half = Math.max(...lo.map((v, c) => (hi[c] - v) / 2)) * 1.0001;
    const q = new Int16Array(n * 3);
    for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) q[i*3+c] = Math.round(((local[i*3+c] - ctr[c]) / half) * 32767);
    pos.setArray(q); pos.setNormalized(true);
    const T = [half,0,0,0, 0,half,0,0, 0,0,half,0, ctr[0],ctr[1],ctr[2],1];
    const ibm = ibmAcc.clone(); const el = [];
    for (let j = 0; j < ibm.getCount(); j++) { ibm.getElement(j, el); ibm.setElement(j, mul(el, T)); }
    skin.setInverseBindMatrices(ibm);
    requant++;
  }
}
await io.write(output, doc);
console.log("wrote", output, "vertices", changed, "requantised meshes", requant, 'bytes', fs.statSync(output).size, 'was', fs.statSync(input).size);
