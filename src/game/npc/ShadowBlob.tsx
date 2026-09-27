import { CanvasTexture, MeshBasicMaterial, PlaneGeometry } from "three";

/**
 * A soft round contact shadow on the ground under a character: the cheap
 * way to stop people floating (real shadows only fall one way, and are off
 * on phones). One shared texture, material and plane for everyone.
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

export default function ShadowBlob({ size = 0.9, stretch = 1 }: { size?: number; stretch?: number }) {
  return (
    <mesh geometry={plane} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} scale={[size, size * stretch, 1]} renderOrder={1} dispose={null} />
  );
}
