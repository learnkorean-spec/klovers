import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
await MeshoptDecoder.ready; await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder });
const doc = await io.read(process.argv[2]);
for (const m of doc.getRoot().listMeshes()) { for (const p of m.listPrimitives()) for (const t of p.listTargets()) p.removeTarget(t); m.setWeights([]); m.setExtras({}); }
await doc.transform(prune({ keepAttributes: true }));
await io.write(process.argv[3], doc);
