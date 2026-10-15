import { useEffect, useMemo, useState } from "react";
import { MeshBasicMaterial, TextureLoader, type Texture } from "three";
import { pickQuality } from "../systems/quality";

/**
 * Light baked into a room's floor, once, in Blender (Cycles) from the
 * room's own drawn geometry and the world's own sun:
 *
 * - `ao`: how much of the sky each spot of floor sees — soft shade at the
 *   foot of walls, under benches and trees, round pots and beds. Used as the
 *   floor's ambient-occlusion map on every device (it dims only the sky and
 *   bounce light, never the sun).
 * - `shade`: the sun's shadows plus that soft shade, as one see-through
 *   layer — for phones only, which draw no real-time shadows. Computers
 *   already draw the sun's shadows live, so they would be doubled.
 *
 * Both are small greyscale images (≈15 KB together); nothing changes until
 * they have loaded, and nothing breaks if they cannot. Re-bake when a room's
 * layout changes (see scripts/world-bake/README.md).
 */
export function useBakedFloor(room: string): { ao: Texture | null; shade: Texture | null } {
  const [maps, setMaps] = useState<{ ao: Texture | null; shade: Texture | null }>({ ao: null, shade: null });
  useEffect(() => {
    let live = true;
    const loader = new TextureLoader();
    const load = (name: string) => loader.loadAsync(`/assets/world/tex/${room}_${name}.webp`).catch(() => null);
    const phone = !pickQuality().shadows;
    Promise.all([load("ao"), phone ? load("shade") : Promise.resolve(null)]).then(([ao, shade]) => {
      if (live) setMaps({ ao, shade });
      else {
        ao?.dispose();
        shade?.dispose();
      }
    });
    return () => {
      live = false;
    };
  }, [room]);
  useEffect(
    () => () => {
      maps.ao?.dispose();
      maps.shade?.dispose();
    },
    [maps],
  );
  return maps;
}

/** The phones' layer of baked shadow, laid just over the floor (under stepping stones, over gravel). */
export function BakedShade({ map, w, d }: { map: Texture; w: number; d: number }) {
  const material = useMemo(
    () => new MeshBasicMaterial({ color: "#1d140c", alphaMap: map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }),
    [map],
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={material} renderOrder={1}>
      <planeGeometry args={[w, d]} />
    </mesh>
  );
}
