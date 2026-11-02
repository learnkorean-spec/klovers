import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, MeshBasicMaterial, PlaneGeometry, type InstancedMesh, type Object3D } from "three";

/**
 * A soft round contact shadow on the ground under a character: the cheap
 * way to stop people floating (real shadows only fall one way, and are off
 * on phones). One shared texture, material and plane for everyone — and one
 * draw for everyone: each character only carries an empty marker, and
 * <ShadowBlobs /> (mounted once in the scene) draws a blob at every marker
 * each frame. A busy room used to spend a draw call per person on these.
 */
const texture = (() => {
  try {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
    g.addColorStop(0, "rgba(46,36,28,0.55)");
    g.addColorStop(0.6, "rgba(46,36,28,0.22)");
    g.addColorStop(1, "rgba(46,36,28,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new CanvasTexture(c);
  } catch {
    return null;
  }
})();

const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
const plane = new PlaneGeometry(1, 1);

/** Every blob marker in the scene now. */
const markers = new Set<Object3D>();
/** More characters than any room holds (people + both learners + Cluby). */
const CAPACITY = 40;

/** Is it drawn: itself and every parent visible. */
function shown(o: Object3D | null): boolean {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

export default function ShadowBlob({ size = 0.9, stretch = 1 }: { size?: number; stretch?: number }) {
  const ref = useRef<Object3D>(null);
  useEffect(() => {
    const o = ref.current;
    if (!o) return;
    markers.add(o);
    return () => {
      markers.delete(o);
    };
  }, []);
  return <object3D ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[size, size * stretch, 1]} />;
}

/** The one draw for all the blobs (mount once, inside the Canvas). */
export function ShadowBlobs() {
  const ref = useRef<InstancedMesh>(null);
  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    let n = 0;
    for (const o of markers) {
      if (n >= CAPACITY) break;
      if (!shown(o)) continue;
      o.updateWorldMatrix(true, false);
      mesh.setMatrixAt(n++, o.matrixWorld);
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[plane, material, CAPACITY]} frustumCulled={false} renderOrder={1} dispose={null} />;
}
