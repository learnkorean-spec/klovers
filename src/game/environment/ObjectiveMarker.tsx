import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, MeshBasicMaterial, RingGeometry, type Mesh } from "three";
import { PALETTE } from "../config/world";
import { REDUCED_MOTION } from "../systems/motion";

const ring = new RingGeometry(0.55, 0.66, 40);
const material = new MeshBasicMaterial({ color: new Color(PALETTE.yellow), transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false });

/**
 * The current objective's place: a thin Klovers-yellow ring on the ground
 * that breathes slowly. No arrow, no floating icon — something to notice.
 */
export default function ObjectiveMarker({ x, z }: { x: number; z: number }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current || REDUCED_MOTION) return;
    const k = (Math.sin(clock.elapsedTime * 2.2) + 1) / 2;
    ref.current.scale.setScalar(1 + k * 0.18);
    material.opacity = 0.45 + k * 0.4;
  });
  return <mesh ref={ref} geometry={ring} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.025, z]} renderOrder={2} dispose={null} />;
}
