// Light copy of a person (geometry only) for people far from the camera.
// See README.md. Usage: node lod.mjs IN.glb OUT.lod.glb   (light, past 6–10 m)
//                       node lod.mjs IN.glb OUT.far.glb far (lighter still, past 13–20 m)
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { prune, dequantize, simplifyPrimitive } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
const [, , inp, out, level = "light"] = process.argv;
const far = level === "far";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(inp);

// Share of triangles kept: lashes untouched (tiny, and the eyes find them), hair cards gently.
// The far copy is for people a few dozen pixels tall: an eighth of the body, a fifth of the hair.
const ratioFor = (n) =>
  far ? (/Eyelash/i.test(n) ? 0.5 : /Hair/i.test(n) ? 0.22 : /Body/i.test(n) ? 0.14 : 0.12) : /Eyelash/i.test(n) ? 1 : /Hair/i.test(n) ? 0.5 : /Body/i.test(n) ? 0.4 : 0.35;
// Largest shape change allowed, as a share of the person's size (≈1.8 m): 0.2 % near, 1.5 % far.
const errorFor = (n) => (far ? (/Hair/i.test(n) ? 0.03 : 0.015) : /Hair/i.test(n) ? 0.01 : 0.002);

await doc.transform(dequantize({ pattern: /^POSITION$/ }));
let before = 0;
let after = 0;
for (const mesh of doc.getRoot().listMeshes()) {
  const r = ratioFor(mesh.getName());
  for (const prim of mesh.listPrimitives()) {
    before += prim.getIndices().getCount() / 3;
    if (r < 1) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: r, error: errorFor(mesh.getName()), lockBorder: false });
    after += prim.getIndices().getCount() / 3;
  }
}
// Positions back to 16-bit normalised, the same numbers: the skins' inverse
// bind matrices already hold the files' quantisation, and the world swaps
// these geometries into the full model's skin.
for (const acc of doc.getRoot().listAccessors()) {
  const isPos = acc.listParents().some((p) => p.propertyType === "Primitive" && p.getAttribute("POSITION") === acc);
  if (!isPos || acc.getComponentType() !== 5126) continue;
  const a = acc.getArray();
  const q = new Int16Array(a.length);
  for (let i = 0; i < a.length; i++) q[i] = Math.round(Math.max(-1, Math.min(1, a[i])) * 32767);
  acc.setArray(q).setNormalized(true);
}
// Geometry only: the full model brings the textures. Keep every attribute (UVs!).
for (const m of doc.getRoot().listMaterials()) {
  m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);
}
for (const a of doc.getRoot().listAnimations()) a.dispose();
await doc.transform(prune({ keepAttributes: true, keepLeaves: false }));
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write(out, doc);
console.log(`${inp}: ${before} → ${after} triangles`);
