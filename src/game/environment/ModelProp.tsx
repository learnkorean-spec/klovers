import { Suspense, useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Box3, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3, type BufferGeometry, type Material, type Mesh } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import AvatarBoundary from "../player/AvatarBoundary";

/**
 * A real, photographed/modelled object from public/assets/world/props
 * (Sketchfab, CC BY — credited in config/credits.ts), fitted to a size and
 * set on the ground (or on `y`). Nothing shows until it has loaded, and
 * nothing breaks if it cannot.
 */
const UP = new Vector3(0, 1, 0);

const extend = (l: GLTFLoader) => {
  l.setMeshoptDecoder(MeshoptDecoder);
};

export interface PropPlacement {
  x: number;
  z: number;
  y?: number;
  rotY?: number;
  /** Fit: the model's largest horizontal side becomes this many metres. */
  width?: number;
  /** Or: its height becomes this many metres. */
  height?: number;
}

/** Static sub-meshes of a model: geometry, material, and their place in the model. */
interface Part {
  geometry: BufferGeometry;
  material: Material | Material[];
  matrix: Matrix4;
}

const MIRROR_X = new Matrix4().makeScale(-1, 1, 1);

/** Whether a geometry is the loader's own (cached for the next visit), not a copy made here. */
function isShared(gltf: GLTF, g: BufferGeometry): boolean {
  let found = false;
  gltf.scene.traverse((o) => {
    if ((o as Mesh).geometry === g) found = true;
  });
  return found;
}

/**
 * Some models place a part with a mirroring transform (the KCISA small
 * gate: x scale −2.9). A plain mesh copes — three.js turns the faces round
 * when an object's matrix is mirrored — but instances cannot, so the faces
 * came out inside-out: lit from the wrong side, and solid black to the
 * contact shade. Build the mirror into a copy of the geometry instead, so
 * every instance matrix is an ordinary one.
 */
function unmirror(part: Part): Part {
  if (part.matrix.determinant() >= 0) return part;
  const geometry = part.geometry.clone();
  geometry.applyMatrix4(MIRROR_X);
  const index = geometry.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, b);
    }
    index.needsUpdate = true;
  }
  return { geometry, material: part.material, matrix: part.matrix.clone().multiply(MIRROR_X) };
}

/**
 * Every copy of a model is drawn together: one InstancedMesh per sub-mesh,
 * so twelve cabbages cost one draw call (two with shadows), not twelve.
 * Props are static, so matrices are written once.
 */
function Model({ name, at }: { name: string; at: PropPlacement[] }) {
  const gltf = useLoader(GLTFLoader, `/assets/world/props/${name}.glb`, extend) as GLTF;
  const base = useMemo(() => {
    gltf.scene.updateMatrixWorld(true);
    const box = new Box3().setFromObject(gltf.scene);
    const size = box.getSize(new Vector3());
    const parts: Part[] = [];
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) if (mat instanceof MeshStandardMaterial) mat.metalness = Math.min(mat.metalness, 0.2);
      parts.push(unmirror({ geometry: m.geometry, material: m.material, matrix: m.matrixWorld.clone() }));
    });
    return { box, size, parts };
  }, [gltf]);
  // Mirrored parts got geometry copies of their own: free them with the room.
  useEffect(() => () => base.parts.forEach((p) => !isShared(gltf, p.geometry) && p.geometry.dispose()), [base, gltf]);
  const meshes = useMemo(() => {
    // Where each copy goes: placed, turned, fitted to size, centred on x/z, feet on the floor.
    const placed = at.map((p) => {
      const s = p.height ? p.height / base.size.y : (p.width ?? 1) / Math.max(base.size.x, base.size.z);
      const fit = new Matrix4().compose(
        new Vector3(-(base.box.min.x + base.size.x / 2) * s, -base.box.min.y * s, -(base.box.min.z + base.size.z / 2) * s),
        new Quaternion(),
        new Vector3(s, s, s),
      );
      const place = new Matrix4().compose(new Vector3(p.x, p.y ?? 0, p.z), new Quaternion().setFromAxisAngle(UP, p.rotY ?? 0), new Vector3(1, 1, 1));
      return place.multiply(fit);
    });
    return base.parts.map((part) => {
      const im = new InstancedMesh(part.geometry, part.material, placed.length);
      placed.forEach((m, i) => im.setMatrixAt(i, new Matrix4().multiplyMatrices(m, part.matrix)));
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      im.castShadow = true;
      im.receiveShadow = true;
      return im;
    });
  }, [base, at]);
  // Only the instance buffers belong to these meshes; the model's geometry
  // and materials stay cached by the loader for the next visit.
  // R3F applies dispose={null} below as a property, which replaces each
  // mesh's own dispose(); call the class method directly (calling m.dispose()
  // threw on every room change once these props had loaded).
  useEffect(() => () => meshes.forEach((m) => InstancedMesh.prototype.dispose.call(m)), [meshes]);
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} dispose={null} />
      ))}
    </>
  );
}

export default function ModelProp({ name, at }: { name: string; at: PropPlacement[] }) {
  return (
    <AvatarBoundary fallback={null}>
      <Suspense fallback={null}>
        <Model name={name} at={at} />
      </Suspense>
    </AvatarBoundary>
  );
}
