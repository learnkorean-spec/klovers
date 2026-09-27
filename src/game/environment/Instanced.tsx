import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, ConeGeometry, CylinderGeometry, InstancedMesh, Object3D, type BufferGeometry, type Material } from "three";

/**
 * One draw call for many copies of the same shape and finish.
 *
 * Rooms describe repeated parts (house walls, roofs, posts, lamps, chairs)
 * as plain transform lists; this turns each list into a single InstancedMesh
 * built on a shared unit geometry. Static: matrices are written once.
 */

export interface Part {
  p: [number, number, number];
  /** Scale of the unit shape (metres for a unit box). */
  s: [number, number, number];
  r?: [number, number, number];
}

/** Unit shapes, shared by every instanced list in every room. */
export const UNIT = {
  box: new BoxGeometry(1, 1, 1),
  /** Four-sided pyramid turned 45° → a square hip roof (base half-size 0.5). */
  hipRoof: (() => {
    const g: BufferGeometry = new ConeGeometry(Math.SQRT1_2, 1, 4);
    g.rotateY(Math.PI / 4);
    return g;
  })(),
  cylinder: new CylinderGeometry(0.5, 0.5, 1, 16),
} as const;

interface Props {
  parts: Part[];
  material: Material;
  geometry?: BufferGeometry;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export default function Instanced({ parts, material, geometry = UNIT.box, castShadow = false, receiveShadow = false }: Props) {
  const ref = useRef<InstancedMesh>(null);
  const o = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    parts.forEach((part, i) => {
      o.position.set(...part.p);
      o.rotation.set(...(part.r ?? [0, 0, 0]));
      o.scale.set(...part.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [parts, o]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, parts.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      // Shared unit geometry and material: never dispose them with this mesh.
      dispose={null}
    />
  );
}
