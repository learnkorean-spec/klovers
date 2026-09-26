import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PCFSoftShadowMap } from "three";
import { findPortal, ROOMS, type Portal, type RoomId, type RoomLayout, type Spawn } from "./config/rooms";
import { CAMERA, PALETTE } from "./config/world";
import ThirdPersonCamera from "./camera/ThirdPersonCamera";
import HangulVillage from "./environment/HangulVillage";
import Lobby from "./environment/Lobby";
import Player from "./player/Player";
import type { AvatarId } from "./player/characters";
import { useMoveInput } from "./systems/input";
import { createCameraState, createPlayerState, type PlayerState } from "./systems/state";

/** Length of the fade to and from ivory on a room change, ms. */
export const FADE_MS = 350;

export type WorldNotice = Extract<Portal, { kind: "closed" }>["notice"];

export interface WorldProps {
  /** Fired after the first frame has rendered — the loading veil can lift. */
  onReady?: () => void;
  /** Fired the first time the learner looks around (hides the look hint). */
  onFirstLook?: () => void;
  avatar: AvatarId;
  /** Fade veil on (room change starting) / off (new room is showing). */
  onFade?: (visible: boolean) => void;
  /** The learner is now in this room (fires after the fade clears). */
  onRoomChange?: (room: RoomId) => void;
  /** Standing at a closed gate (notice key), or walked away from it (null). */
  onNotice?: (notice: WorldNotice | null) => void;
}

declare global {
  interface Window {
    /** Read-only probe for automated checks; set only with ?debug=1. */
    __kloversWorld?: {
      player: () => { x: number; z: number; yaw: number; animation: string };
      camera: () => { yaw: number; pitch: number; distance: number };
      room: () => RoomId;
    };
  }
}

/**
 * KLOVERS World — the 3D scene. This module and everything it imports
 * (three, @react-three/fiber) load only when /world is opened; the rest of
 * the site never downloads them.
 */
export default function World({ onReady, onFirstLook, avatar, onFade, onRoomChange, onNotice }: WorldProps) {
  const input = useMoveInput();
  const player = useRef(createPlayerState());
  const camera = useRef(createCameraState());
  const [roomId, setRoomId] = useState<RoomId>("courtyard");
  const roomRef = useRef(roomId);
  roomRef.current = roomId;
  const layout = ROOMS[roomId];
  const arrival = useRef<Spawn | null>(null);
  const callbacks = useRef({ onFade, onRoomChange, onNotice });
  callbacks.current = { onFade, onRoomChange, onNotice };

  /** Walked into an open gate: fade out, swap rooms, fade back in. */
  const travel = useCallback((portal: Extract<Portal, { kind: "door" }>) => {
    player.current.frozen = true;
    callbacks.current.onNotice?.(null);
    callbacks.current.onFade?.(true);
    window.setTimeout(() => {
      arrival.current = ROOMS[portal.to].spawns[portal.arrive];
      setRoomId(portal.to);
    }, FADE_MS);
  }, []);

  // New room mounted: place the learner at the arrival point, camera behind.
  useLayoutEffect(() => {
    const spawn = arrival.current;
    if (!spawn) return;
    arrival.current = null;
    const p = player.current;
    p.position.set(spawn.x, 0, spawn.z);
    p.velocity = { x: 0, z: 0 };
    p.yaw = spawn.yaw;
    p.animation = "idle";
    const c = camera.current;
    c.yaw = spawn.yaw + Math.PI;
    c.pitch = CAMERA.startPitch;
    c.snap = true;
    // Two frames so the new room is drawn before the veil lifts.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        p.frozen = false;
        callbacks.current.onFade?.(false);
        callbacks.current.onRoomChange?.(roomId);
      }),
    );
  }, [roomId]);

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
      room: () => roomRef.current,
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
        key={roomId}
        castShadow
        position={[8, 14, 6]}
        intensity={1.8}
        color={PALETTE.white}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-layout.shadowExtent}
        shadow-camera-right={layout.shadowExtent}
        shadow-camera-top={layout.shadowExtent}
        shadow-camera-bottom={-layout.shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />

      {roomId === "courtyard" ? <Lobby /> : <HangulVillage />}
      {/* Mount order matters only for readability: frame priorities make the
          player move (−2) before the camera follows (−1). */}
      <Player input={input} player={player} camera={camera} layout={layout} avatar={avatar} />
      <ThirdPersonCamera player={player} camera={camera} layout={layout} onFirstLook={onFirstLook} />
      <PortalWatcher key={roomId} player={player} layout={layout} onDoor={travel} onNotice={(n) => callbacks.current.onNotice?.(n)} />
    </Canvas>
  );
}

interface WatcherProps {
  player: MutableRefObject<PlayerState>;
  layout: RoomLayout;
  onDoor: (portal: Extract<Portal, { kind: "door" }>) => void;
  onNotice: (notice: WorldNotice | null) => void;
}

/** Checks, after the player moves, whether a gate zone was entered or left. */
function PortalWatcher({ player, layout, onDoor, onNotice }: WatcherProps) {
  const current = useRef<string | null>(null);
  useFrame(() => {
    const p = player.current;
    if (p.frozen) return;
    const hit = findPortal(p.position.x, p.position.z, layout.portals);
    const id = hit?.id ?? null;
    if (id === current.current) return;
    const left = current.current;
    current.current = id;
    if (!hit) {
      if (left) onNotice(null);
      return;
    }
    if (hit.kind === "door") onDoor(hit);
    else onNotice(hit.notice);
  }, -1.5);
  return null;
}
