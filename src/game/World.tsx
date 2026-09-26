import { useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { PCFSoftShadowMap } from "three";
import { CAMERA, PALETTE } from "./config/world";
import ThirdPersonCamera from "./camera/ThirdPersonCamera";
import Lobby from "./environment/Lobby";
import Player from "./player/Player";
import { useMoveInput } from "./systems/input";
import { createCameraState, createPlayerState } from "./systems/state";

export interface WorldProps {
  /** Fired after the first frame has rendered — the loading veil can lift. */
  onReady?: () => void;
  /** Fired the first time the learner looks around (hides the look hint). */
  onFirstLook?: () => void;
}

declare global {
  interface Window {
    /** Read-only probe for automated checks; set only with ?debug=1. */
    __kloversWorld?: {
      player: () => { x: number; z: number; yaw: number; animation: string };
      camera: () => { yaw: number; pitch: number; distance: number };
    };
  }
}

/**
 * KLOVERS World — the 3D scene. This module and everything it imports
 * (three, @react-three/fiber) load only when /world is opened; the rest of
 * the site never downloads them.
 */
export default function World({ onReady, onFirstLook }: WorldProps) {
  const input = useMoveInput();
  const player = useRef(createPlayerState());
  const camera = useRef(createCameraState());

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    window.__kloversWorld = {
      player: () => ({
        x: player.current.position.x,
        z: player.current.position.z,
        yaw: player.current.yaw,
        animation: player.current.animation,
      }),
      camera: () => ({
        yaw: camera.current.yaw,
        pitch: camera.current.pitch,
        distance: camera.current.currentDistance,
      }),
    };
    return () => {
      delete window.__kloversWorld;
    };
  }, []);

  return (
    <Canvas
      shadows={{ type: PCFSoftShadowMap }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: CAMERA.fov, near: 0.1, far: 120, position: [0, 3, 10] }}
      onCreated={() => {
        // Two frames: the first compiles shaders, the second is what shows.
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      }}
    >
      <color attach="background" args={[PALETTE.ivory]} />
      <fog attach="fog" args={[PALETTE.ivory, 22, 60]} />

      <hemisphereLight args={[PALETTE.ivory, PALETTE.woodDark, 1.2]} />
      <directionalLight
        castShadow
        position={[8, 14, 6]}
        intensity={1.8}
        color={PALETTE.white}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />

      <Lobby />
      {/* Mount order matters only for readability: frame priorities make the
          player move (−2) before the camera follows (−1). */}
      <Player input={input} player={player} camera={camera} />
      <ThirdPersonCamera player={player} camera={camera} onFirstLook={onFirstLook} />
    </Canvas>
  );
}
