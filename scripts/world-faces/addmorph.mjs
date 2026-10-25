// Adds face blend shapes (morph.py output: bind-space deltas) to a body glb as
// glTF morph targets in each mesh's own local (quantised) space, normalised int16.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';
const [,, input, morphJson, output] = process.argv;
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(input);
const { names, meshes } = JSON.parse(fs.readFileSync(morphJson, 'utf8'));
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c*4+r] += a[k*4+r] * b[c*4+k]; return o; };
function inv3(m) { // inverse of the 3x3 linear part of a column-major 4x4
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const A = e*i - f*h, B = -(d*i - f*g), C = d*h - e*g, det = a*A + b*B + c*C;
  return [A/det, (c*h - b*i)/det, (b*f - c*e)/det, B/det, (a*i - c*g)/det, (c*d - a*f)/det, C/det, (b*g - a*h)/det, (a*e - b*d)/det]; // row-major
}
const buffer = doc.getRoot().listBuffers()[0];
let added = 0;
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh(); const deltas = mesh && meshes[node.getName()]; if (!deltas) continue;
  const skin = node.getSkin(); const e0 = []; skin.getInverseBindMatrices().getElement(0, e0);
  const R = inv3(mul(skin.listJoints()[0].getWorldMatrix(), e0));
  let k0 = 0;
  for (const prim of mesh.listPrimitives()) {
    const n = prim.getAttribute('POSITION').getCount();
    for (let t = 0; t < names.length; t++) {
      const q = new Int16Array(n * 3);
      for (let i = 0; i < n; i++) {
        const [x, y, z] = deltas[t][k0 + i];
        const l = [R[0]*x + R[1]*y + R[2]*z, R[3]*x + R[4]*y + R[5]*z, R[6]*x + R[7]*y + R[8]*z];
        for (let c = 0; c < 3; c++) q[i*3 + c] = Math.max(-32767, Math.min(32767, Math.round(l[c] * 32767)));
      }
      const acc = doc.createAccessor().setType('VEC3').setArray(q).setNormalized(true).setBuffer(buffer);
      prim.addTarget(doc.createPrimitiveTarget(names[t]).setAttribute('POSITION', acc));
    }
    k0 += n;
  }
  mesh.setWeights(names.map(() => 0));
  mesh.setExtras({ ...mesh.getExtras(), targetNames: names });
  added++;
}
await io.write(output, doc);
console.log('morphs on', added, 'meshes; bytes', fs.statSync(output).size, 'was', fs.statSync(input).size);
