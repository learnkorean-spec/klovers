import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
import fs from 'fs';
const [,, input, out] = process.argv;
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r] * b[c*4+k]; return o; };
const apply = (m, [x, y, z]) => [m[0]*x+m[4]*y+m[8]*z+m[12], m[1]*x+m[5]*y+m[9]*z+m[13], m[2]*x+m[6]*y+m[10]*z+m[14]];
const res = {}, mats = {};
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); if (!mesh) continue;
  const skin = node.getSkin();
  let M = node.getWorldMatrix(), check = null;
  if (skin) {
    const joints = skin.listJoints(); const ibm = skin.getInverseBindMatrices();
    const get = (j) => { const e = []; ibm.getElement(j, e); return mul(joints[j].getWorldMatrix(), e); };
    M = get(0); check = get(Math.min(5, joints.length - 1));
  }
  const pts = [];
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION'); const el = [];
    for (let i = 0; i < pos.getCount(); i++) { pos.getElement(i, el); pts.push(apply(M, el)); }
  }
  res[node.getName()] = pts; mats[node.getName()] = { M, diff: check ? Math.max(...M.map((v, i) => Math.abs(v - check[i]))) : 0 };
}
fs.writeFileSync(out, JSON.stringify({ pts: res, mats }));
console.log(Object.entries(mats).map(([k, v]) => `${k}: J·IBM agree within ${v.diff.toExponential(1)}`).join('\n'));
