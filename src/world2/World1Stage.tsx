import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Fog, PCFSoftShadowMap, PMREMGenerator, type Texture } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { FOLIAGE_TIME, upgradeMaterialDetails } from "../game/config/materials";
import { box } from "../game/config/world";
import { REDUCED_MOTION } from "../game/systems/motion";
import { pickQuality, type Quality } from "../game/systems/quality";
import Backdrop, { SKY } from "../game/environment/Backdrop";
import GroundWear from "../game/environment/GroundWear";

/**
 * World1's render stack, for World2.
 *
 * Re, 4 Nov 2026: "the quality is so bad, i need world 1 quality." Compared
 * side by side, the gap wasn't the props or the people (those already reuse
 * World1's own kit, textures and rigs) — it was everything *around* them.
 * Each World2 scene had built its own atmosphere: a dark purple fog starting
 * 7–9 m out, dim dusk-tuned lights, no sky at all (a void, or a flat plane),
 * and no image-based light. The live game wraps every room in the same
 * stack instead, and this file is that stack, copied rather than imported
 * (importing World.tsx would pull every World1 room into World2's bundle —
 * the same reason PostFinish.tsx is a copy of its PostDriver):
 *
 *  - the painted late-afternoon sky dome, clouds, tree ring and far hills
 *    (environment/Backdrop.tsx, reused as-is);
 *  - haze fog held back to 40–125 m and a matching background colour, so the
 *    horizon fades but the room itself stays crisp;
 *  - the exact light rig from World.tsx (warm sky/ground bounce 0.6, cool
 *    fill 0.42, golden sun 3.5 from the same direction the sky's sun glow
 *    sits in), with soft PCF shadows at the desktop/phone shadow-map size;
 *  - SkyLight: the photographed CC0 late-afternoon HDR sky as
 *    scene.environment, which lights every surface softly from all round
 *    and gives glossy things something to reflect — the single biggest
 *    reason World1 looks "rendered" rather than "lit";
 *  - GroundWear (worn paths on the floor), the foliage sway clock, and the
 *    phones' adaptive resolution;
 *  - the same two quality tiers (systems/quality.ts) for all of it.
 */

/** The live game's own quality tier for this device, chosen once. */
export function useWorld1Quality(): Quality {
  return useMemo(pickQuality, []);
}

/** Canvas props matching World.tsx's own <Canvas>. */
export function world1CanvasProps(quality: Quality) {
  return {
    shadows: quality.shadows ? ({ type: PCFSoftShadowMap } as const) : false,
    dpr: quality.dpr,
    gl: { antialias: true, powerPreference: "high-performance" as const },
  };
}

/** World.tsx's LIGHT constant, verbatim. */
const LIGHT = {
  sun: "#FFCC8E",
  skyBounce: "#FFE9CC",
  groundBounce: "#A08466",
  fill: "#C4D3EC",
  haze: SKY.horizon,
} as const;

/** World.tsx's SkyLight, verbatim. */
function SkyLight() {
  const { gl, scene } = useThree();
  useEffect(() => {
    let live = true;
    let env: Texture | null = null;
    upgradeMaterialDetails();
    new HDRLoader()
      .loadAsync("/assets/world/tex/sky_512.hdr")
      .then((hdr) => {
        if (!live) return;
        const pm = new PMREMGenerator(gl);
        env = pm.fromEquirectangular(hdr).texture;
        hdr.dispose();
        pm.dispose();
        scene.environment = env;
        scene.environmentIntensity = 0.45;
      })
      .catch(() => undefined);
    return () => {
      live = false;
      if (scene.environment === env) scene.environment = null;
      env?.dispose();
    };
  }, [gl, scene]);
  return null;
}

/**
 * The haze colour behind everything and the far fog, set on the scene itself.
 * (World.tsx declares these as <color attach="background"> / <fog attach>
 * directly under its Canvas; World2's places mount inside a <group>, where
 * those would attach to the group and silently do nothing.)
 */
function SceneAir() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const prevBg = scene.background;
    const prevFog = scene.fog;
    scene.background = new Color(LIGHT.haze);
    scene.fog = new Fog(LIGHT.haze, 40, 125);
    return () => {
      scene.background = prevBg;
      scene.fog = prevFog;
    };
  }, [scene]);
  return null;
}

/** World.tsx's FoliageClock, verbatim: the shared clock that sways leaves. */
function FoliageClock() {
  useFrame(({ clock }) => {
    if (!REDUCED_MOTION) FOLIAGE_TIME.value = clock.elapsedTime;
  });
  return null;
}

/** World.tsx's AdaptiveResolution, verbatim (phones only). */
function AdaptiveResolution({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const native = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const st = useRef({ dpr: Math.min(max, native), frames: 0, time: 0, skip: 2 });
  useFrame((_, dt) => {
    const s = st.current;
    s.frames += 1;
    s.time += Math.min(dt, 0.25);
    if (s.time < 2) return;
    const fps = s.frames / s.time;
    s.frames = 0;
    s.time = 0;
    if (s.skip > 0) {
      s.skip -= 1;
      return;
    }
    if (fps < 45 && s.dpr > 1.25) {
      s.dpr = Math.max(1.25, s.dpr - 0.25);
      setDpr(s.dpr);
    }
  });
  return null;
}

/**
 * Everything around a World2 place, as the live game draws it. Mount once
 * per scene, at the scene's root (outside any offset group, so the sky,
 * fog and sun sit in world space like World1's).
 *
 * `id` seeds the backdrop's tree ring/hills (any stable string); `hx`/`hz`
 * are how far past the place's own floor that ring stands; `floor` is the
 * walkable area GroundWear scuffs.
 */
export function World1Atmosphere({
  id,
  hx,
  hz,
  floor,
}: {
  id: string;
  hx: number;
  hz: number;
  floor: { cx: number; cz: number; w: number; d: number };
}) {
  const quality = useWorld1Quality();
  const extent = Math.max(hx, hz) + 2;
  const wear = useMemo(() => box(floor.cx, floor.cz, floor.w, floor.d), [floor.cx, floor.cz, floor.w, floor.d]);
  return (
    <>
      <SceneAir />
      <Backdrop id={id} hx={hx} hz={hz} />
      <hemisphereLight args={[LIGHT.skyBounce, LIGHT.groundBounce, 0.6]} />
      <directionalLight position={[-12, 6, -3]} intensity={0.42} color={LIGHT.fill} />
      <directionalLight
        castShadow={quality.shadows}
        position={[14, 7.6, 4.5]}
        intensity={3.5}
        color={LIGHT.sun}
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />
      <GroundWear bounds={wear} seed={id.length * 7} />
      <SkyLight />
      <FoliageClock />
      {quality.adaptive && <AdaptiveResolution max={quality.dpr[1]} />}
    </>
  );
}
