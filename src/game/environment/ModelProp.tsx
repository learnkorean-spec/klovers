import { Suspense, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Box3, MeshStandardMaterial, Vector3, type Group, type Mesh } from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import AvatarBoundary from "../player/AvatarBoundary";

/**
 * A real, photographed/modelled object from public/assets/world/props
 * (Sketchfab, CC BY — credited in config/credits.ts), fitted to a size and
 * set on the ground (or on `y`). Nothing shows until it has loaded, and
 * nothing breaks if it cannot.
 */
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

function Model({ name, at }: { name: string; at: PropPlacement[] }) {
  const gltf = useLoader(GLTFLoader, `/assets/world/props/${name}.glb`, extend) as GLTF;
  const base = useMemo(() => {
    const box = new Box3().setFromObject(gltf.scene);
    const size = box.getSize(new Vector3());
    gltf.scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      if (m.material instanceof MeshStandardMaterial) m.material.metalness = Math.min(m.material.metalness, 0.2);
    });
    return { box, size };
  }, [gltf]);
  const copies = useMemo(
    () =>
      at.map((p) => {
        const s = p.height ? p.height / base.size.y : (p.width ?? 1) / Math.max(base.size.x, base.size.z);
        const g = gltf.scene.clone(true) as Group;
        // Centre on x/z, feet on the floor.
        g.position.set(-(base.box.min.x + base.size.x / 2) * s, -base.box.min.y * s, -(base.box.min.z + base.size.z / 2) * s);
        g.scale.setScalar(s);
        return { p, g };
      }),
    [gltf, base, at],
  );
  return (
    <>
      {copies.map(({ p, g }, i) => (
        <group key={i} position={[p.x, p.y ?? 0, p.z]} rotation={[0, p.rotY ?? 0, 0]}>
          <primitive object={g} />
        </group>
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
