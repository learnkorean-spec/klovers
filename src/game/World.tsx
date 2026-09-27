import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PCFSoftShadowMap, type WebGLRenderer } from "three";
import { INTERACTABLES, nearestInteractable, type Interactable } from "./config/interactions";
import { findPortal, HUB, MARKET, ROOMS, VILLAGE, type NoticeKey, type Portal, type RoomId, type RoomLayout, type Spawn } from "./config/rooms";
import { CAMERA, PALETTE, PROPS, ROOM } from "./config/world";
import ThirdPersonCamera from "./camera/ThirdPersonCamera";
import { DISCOVERIES, type DiscoveryKey } from "./config/discoveries";
import { NPCS, FRIEND_SPOT } from "./config/npcs";
import { objectiveTarget, type ObjectiveId, type ObjectiveProgress } from "./config/objectives";
import ObjectiveMarker from "./environment/ObjectiveMarker";
import Friend from "./npc/Friend";
import Npc from "./npc/Npc";
import ConversationCafe from "./environment/ConversationCafe";
import HangulVillage from "./environment/HangulVillage";
import Hub from "./environment/Hub";
import Lobby from "./environment/Lobby";
import VocabularyMarket from "./environment/VocabularyMarket";
import Cluby from "./player/Cluby";
import Player from "./player/Player";
import type { AvatarId } from "./player/characters";
import type { WorldAccess } from "./systems/access";
import { useMoveInput } from "./systems/input";
import { pickQuality } from "./systems/quality";
import { createCameraState, createPlayerState, type PlayerState } from "./systems/state";
import { createStoryState, HATCH, type StoryState } from "./systems/story";
import type { WorldState } from "./systems/worldState";
import Backdrop, { SKY } from "./environment/Backdrop";
import GroundWear from "./environment/GroundWear";

/**
 * Light colours (not brand colours): golden sun, warm sky bounce, earth
 * bounce, cool fill, and a sky a touch warmer than the brand ivory.
 */
const LIGHT = {
  /** Low golden sun: warm, but not orange — stone and plaster stay neutral. */
  sun: "#FFD49E",
  skyBounce: "#FFE9CC",
  groundBounce: "#7E6249",
  fill: "#C4D3EC",
  /** Haze at the horizon: the sky dome's lowest colour. */
  haze: SKY.horizon,
} as const;

/** How far past its walls each room's buildings reach (tree ring, far hills). */
const BACKDROP: Record<RoomId, { hx: number; hz: number }> = {
  courtyard: { hx: 16.5, hz: 15 },
  "hangul-village": { hx: 11, hz: 16.5 },
  "vocabulary-market": { hx: 14.5, hz: 10.5 },
  hub: { hx: 17.5, hz: 18 },
  "conversation-cafe": { hx: 9, hz: 8 },
};

/** Length of the fade to and from ivory on a room change, ms. */
export const FADE_MS = 350;

export type WorldNotice = NoticeKey;

/** Short things Cluby says (text lives in config/copy.ts, per language). */
export type SpeechKey = "hello" | "found" | "follow" | "hangul-village" | "vocabulary-market" | "hub" | "wordRight";

/** Commands the page can give the scene (HTML UI → 3D). */
export interface WorldApi {
  /** Play the hatch (only honoured when Cluby is really awake). */
  hatch: () => void;
  /** Skip the rest of a story moment. */
  skip: () => void;
  /** Cluby's happy hop and line after a right answer. */
  celebrate: () => void;
}

export interface WorldProps {
  /** Fired after the first frame has rendered — the loading veil can lift. */
  onReady?: () => void;
  /** Fired the first time the learner looks around. */
  onFirstLook?: () => void;
  avatar: AvatarId;
  /** Worlds this learner may enter (real course level; admins preview all). */
  access: WorldAccess;
  /** Cluby has really hatched (dashboard egg stage), or an admin preview. */
  clubyAwake: boolean;
  /** What this browser has already seen in the world. */
  saved: WorldState;
  onSave?: (next: WorldState) => void;
  onApi?: (api: WorldApi) => void;
  /** Fade veil on (room change starting) / off (new room is showing). */
  onFade?: (visible: boolean) => void;
  /** The learner is now in this room (fires after the fade clears). */
  onRoomChange?: (room: RoomId) => void;
  /** Standing at a closed gate (notice key), or walked away from it (null). */
  onNotice?: (notice: WorldNotice | null) => void;
  /** The thing the learner is standing at, if any (E / the round button). */
  onFocus?: (it: Interactable | null) => void;
  /** A Cluby line to show, or null to clear. */
  onSpeech?: (key: SpeechKey | null) => void;
  /** A story moment has taken the controls (true) or given them back. */
  onSequence?: (active: boolean) => void;
  /** Learner moved for the first time (the move hint can fade). */
  onFirstMove?: () => void;
  /** A web-UI card is open: the learner stands still until it closes. */
  paused?: boolean;
  /** Room to open in (returning from the site's lessons or games). */
  startRoom?: RoomId;
  /** First-visit objectives: which one is current, and progress so far. */
  objective?: ObjectiveId | null;
  progress?: ObjectiveProgress;
  /** Walked up to something worth a short note (first time only; the page decides). */
  onDiscover?: (key: DiscoveryKey) => void;
}

declare global {
  interface Window {
    /** Probe for automated checks; set only with ?debug=1. */
    __kloversWorld?: {
      player: () => { x: number; z: number; yaw: number; animation: string };
      camera: () => { yaw: number; pitch: number; distance: number };
      room: () => RoomId;
      cluby: () => { mode: string; x: number; z: number };
      egg: () => string;
      /** Draw calls, triangles and live GPU objects of the last frame. */
      stats: () => { calls: number; triangles: number; geometries: number; textures: number };
      /** Jump to a room — only one this learner may already enter. */
      goto: (room: RoomId) => boolean;
      /** Stand the player at a point in the current room (checks only). */
      place: (x: number, z: number) => void;
    };
  }
}

/**
 * KLOVERS World — the 3D scene. This module and everything it imports
 * (three, @react-three/fiber) load only when /world is opened; the rest of
 * the site never downloads them. Only the current room is mounted: leaving
 * a room unmounts it and frees its GPU objects (shared materials and unit
 * geometries stay, being tiny and reused).
 */
export default function World(props: WorldProps) {
  const { onReady, onFirstLook, avatar, access, clubyAwake, saved } = props;
  const input = useMoveInput();
  const quality = useMemo(pickQuality, []);
  const player = useRef(createPlayerState());
  const camera = useRef(createCameraState());
  const hatchedHere = saved.hatchSeen && clubyAwake;
  const story = useRef<StoryState>(createStoryState(hatchedHere));
  const first = props.startRoom && props.startRoom !== "courtyard" ? props.startRoom : "courtyard";
  const [roomId, setRoomId] = useState<RoomId>(first);
  const roomRef = useRef(roomId);
  roomRef.current = roomId;
  const layout = ROOMS[roomId];
  // Opening somewhere other than the courtyard: arrive at that room's first gate.
  const arrival = useRef<Spawn | null>(first === "courtyard" ? null : Object.values(ROOMS[first].spawns)[0]);
  const cb = useRef(props);
  cb.current = props;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const timers = useRef<number[]>([]);
  const sequence = useRef<"none" | "hatch">("none");
  const glRef = useRef<WebGLRenderer | null>(null);

  useEffect(() => {
    player.current.paused = !!props.paused;
  }, [props.paused]);

  // Egg phase from real progress only: still, unless Cluby is really awake.
  useEffect(() => {
    const s = story.current;
    if (sequence.current !== "none") return;
    if (clubyAwake && saved.hatchSeen) {
      s.egg = "open";
      if (s.cluby.mode === "hidden") {
        s.cluby.mode = "follow";
        const p = player.current.position;
        s.cluby.x = p.x + 0.8;
        s.cluby.z = p.z + 0.8;
      }
    } else if (clubyAwake) s.egg = "stirring";
    else {
      s.egg = "dormant";
      s.cluby.mode = "hidden";
    }
  }, [clubyAwake, saved.hatchSeen]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const say = useCallback((key: SpeechKey, ms = 2600) => {
    cb.current.onSpeech?.(key);
    timers.current.push(window.setTimeout(() => cb.current.onSpeech?.(null), ms));
  }, []);

  /** End of the hatch: controls back, Cluby follows, remembered for next time. */
  const finishHatch = useCallback(() => {
    if (sequence.current !== "hatch") return;
    clearTimers();
    sequence.current = "none";
    const s = story.current;
    const c = camera.current;
    c.focus = null;
    c.yawTarget = null;
    c.pitchTarget = null;
    s.egg = "open";
    s.cluby.mode = "follow";
    s.cluby.look = null;
    player.current.frozen = false;
    cb.current.onSpeech?.(null);
    cb.current.onSequence?.(false);
    cb.current.onSave?.({ ...savedRef.current, hatchSeen: true });
  }, []);

  /** The hatch: ≈ 8 s, in-engine, skippable, with a hard fail-safe. */
  const hatch = useCallback(() => {
    const s = story.current;
    if (!cb.current.clubyAwake || roomRef.current !== "courtyard" || sequence.current !== "none" || s.egg === "open") return;
    sequence.current = "hatch";
    cb.current.onSequence?.(true);
    cb.current.onFocus?.(null);
    const p = player.current;
    p.frozen = true;
    p.velocity = { x: 0, z: 0 };
    const egg = PROPS.eggPlinth;
    const c = camera.current;
    // Frame the egg from the learner's side, swung a little off their
    // shoulder and higher, so the learner never hides the moment.
    c.focus = { x: egg.x * 0.7 + p.position.x * 0.3, y: 1.05, z: egg.z * 0.7 + p.position.z * 0.3 };
    c.yawTarget = Math.atan2(p.position.x - egg.x, p.position.z - egg.z) + 0.75;
    c.pitchTarget = 0.5;
    s.egg = "hatching";
    s.eggT0 = performance.now();
    // Where Cluby lands: beside the plinth, on the learner's side.
    const dx = p.position.x - egg.x;
    const dz = p.position.z - egg.z;
    const d = Math.hypot(dx, dz) || 1;
    s.cluby.x = egg.x + (dx / d) * 1.55 + (dz / d) * 0.6;
    s.cluby.z = egg.z + (dz / d) * 1.55 - (dx / d) * 0.6;
    const at = (ms: number, f: () => void) => timers.current.push(window.setTimeout(f, ms));
    at(HATCH.emergeAt, () => {
      s.cluby.mode = "emerge";
      s.cluby.t0 = performance.now();
      s.cluby.yaw = Math.atan2(dx, dz);
    });
    at(HATCH.helloAt, () => say("hello", HATCH.foundAt - HATCH.helloAt - 150));
    at(HATCH.foundAt, () => say("found", HATCH.followAt - HATCH.foundAt - 150));
    at(HATCH.followAt, () => {
      // "This way": toward the open north gate and Hangul Village.
      s.cluby.look = { x: 0, z: -ROOM.halfDepth };
      say("follow", HATCH.endAt - HATCH.followAt + 1200);
    });
    at(HATCH.endAt, () => {
      finishHatch();
      // He keeps pointing a moment longer, then just follows.
      const st = story.current;
      st.cluby.look = { x: 0, z: -ROOM.halfDepth };
      timers.current.push(window.setTimeout(() => (st.cluby.look = null), 1600));
    });
    at(HATCH.failSafeAt, finishHatch);
  }, [finishHatch, say]);

  const celebrate = useCallback(() => {
    const s = story.current;
    if (s.cluby.mode !== "follow") return;
    s.cluby.hopUntil = performance.now() + 1100;
    say("wordRight", 2200);
  }, [say]);

  useEffect(() => {
    cb.current.onApi?.({ hatch, skip: finishHatch, celebrate });
  }, [hatch, finishHatch, celebrate]);

  /** Walked into an open gate: fade out, swap rooms, fade back in. */
  const travel = useCallback((portal: Pick<Portal, "to" | "arrive">) => {
    player.current.frozen = true;
    cb.current.onNotice?.(null);
    cb.current.onFocus?.(null);
    cb.current.onFade?.(true);
    window.setTimeout(() => {
      arrival.current = ROOMS[portal.to].spawns[portal.arrive];
      setRoomId(portal.to);
    }, FADE_MS);
  }, []);

  // New room mounted: learner at the arrival point, camera behind, Cluby beside.
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
    const cl = story.current.cluby;
    if (cl.mode === "follow") {
      cl.x = spawn.x - Math.sin(spawn.yaw) * 0.9 + Math.cos(spawn.yaw) * 0.7;
      cl.z = spawn.z - Math.cos(spawn.yaw) * 0.9 - Math.sin(spawn.yaw) * 0.7;
      cl.look = null;
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        p.frozen = false;
        cb.current.onFade?.(false);
        cb.current.onRoomChange?.(roomId);
        // One Cluby line on the first visit to a place — never more.
        const sv = savedRef.current;
        const greetable = roomId === "hangul-village" || roomId === "vocabulary-market" || roomId === "hub";
        if (greetable && cl.mode === "follow" && !sv.greeted.includes(roomId)) {
          timers.current.push(window.setTimeout(() => say(roomId as SpeechKey, 3200), 900));
          cb.current.onSave?.({ ...sv, greeted: [...sv.greeted, roomId] });
        }
      }),
    );
  }, [roomId, say]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("debug")) return;
    const probe = window.__kloversWorld ?? ({} as NonNullable<Window["__kloversWorld"]>);
    Object.assign(probe, {
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
      cluby: () => ({ mode: story.current.cluby.mode, x: story.current.cluby.x, z: story.current.cluby.z }),
      egg: () => story.current.egg,
      stats: () => {
        const info = glRef.current?.info;
        return {
          calls: info?.render.calls ?? 0,
          triangles: info?.render.triangles ?? 0,
          geometries: info?.memory.geometries ?? 0,
          textures: info?.memory.textures ?? 0,
        };
      },
      place: (x: number, z: number) => {
        player.current.position.x = x;
        player.current.position.z = z;
      },
      goto: (room: RoomId) => {
        if (!cb.current.access.open.has(room) || room === roomRef.current) return false;
        const arrive = Object.keys(ROOMS[room].spawns)[0];
        travel({ to: room, arrive });
        return true;
      },
    });
    window.__kloversWorld = probe;
    return () => {
      delete window.__kloversWorld;
    };
  }, [travel]);

  return (
    <Canvas
      shadows={quality.shadows ? { type: PCFSoftShadowMap } : false}
      dpr={quality.dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: CAMERA.fov, near: 0.1, far: 120, position: [0, 3, 10] }}
      onCreated={() => {
        // Two frames: the first compiles shaders, the second is what shows.
        requestAnimationFrame(() => requestAnimationFrame(() => onReady?.()));
      }}
    >
      <color attach="background" args={[LIGHT.haze]} />
      <fog attach="fog" args={[LIGHT.haze, 28, 92]} />
      <Backdrop id={roomId} hx={BACKDROP[roomId].hx} hz={BACKDROP[roomId].hz} />

      {/* Warm late-afternoon light: a low golden sun with soft shadows, a
          warm sky/ground bounce, and a faint cool fill from the other side
          so shadows keep their shape without going black. Two lights only. */}
      <hemisphereLight args={[LIGHT.skyBounce, LIGHT.groundBounce, 0.72]} />
      <directionalLight position={[-9, 7, -8]} intensity={0.32} color={LIGHT.fill} />
      <directionalLight
        key={roomId}
        castShadow={quality.shadows}
        position={[13, 7.6, 8]}
        intensity={2.95}
        color={LIGHT.sun}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-layout.shadowExtent}
        shadow-camera-right={layout.shadowExtent}
        shadow-camera-top={layout.shadowExtent}
        shadow-camera-bottom={-layout.shadowExtent}
        shadow-camera-near={1}
        shadow-camera-far={40}
      />

      <GroundWear key={`w-${roomId}`} bounds={layout.bounds} seed={roomId.length * 7} />
      {roomId === "courtyard" && <Lobby story={story} />}
      {roomId === "hangul-village" && <HangulVillage marketOpen={access.open.has("vocabulary-market")} />}
      {roomId === "vocabulary-market" && <VocabularyMarket nextOpen breadSign={saved.breadSign} />}
      {roomId === "hub" && <Hub cafeOpen={access.open.has("conversation-cafe")} marketOpen={access.open.has("vocabulary-market")} />}
      {roomId === "conversation-cafe" && <ConversationCafe />}
      {/* The people of this room only; they leave with it. */}
      {NPCS.filter((n) => n.room === roomId).map((n) => (
        <Npc key={n.id} n={n} />
      ))}
      {roomId === "courtyard" && <Friend avatar={avatar} x={FRIEND_SPOT.x} z={FRIEND_SPOT.z} yaw={Math.atan2(-FRIEND_SPOT.x, -FRIEND_SPOT.z) + 0.5} />}
      {(() => {
        const t = props.progress ? objectiveTarget(props.objective ?? null, roomId, props.progress) : null;
        return t ? <ObjectiveMarker x={t.x} z={t.z} /> : null;
      })()}
      {/* Frame priorities: player moves (−2), watchers read (−1.5), camera follows (−1). */}
      <Player input={input} player={player} camera={camera} layout={layout} avatar={avatar} />
      <Cluby story={story} player={player} layout={layout} guide={guideFor(roomId, access)} interests={interestsIn(roomId)} />
      <ThirdPersonCamera player={player} camera={camera} layout={layout} onFirstLook={onFirstLook} />
      <PortalWatcher key={`p-${roomId}`} player={player} layout={layout} access={access} onDoor={travel} onNotice={(n) => cb.current.onNotice?.(n)} />
      <FocusWatcher
        key={`f-${roomId}`}
        room={roomId}
        player={player}
        story={story}
        access={access}
        onFocus={(it) => cb.current.onFocus?.(it)}
        onFirstMove={() => cb.current.onFirstMove?.()}
      />
      <DiscoveryWatcher key={`d-${roomId}`} room={roomId} player={player} onDiscover={(k) => cb.current.onDiscover?.(k)} />
      <Stats glRef={glRef} />
    </Canvas>
  );
}

/**
 * Where Cluby points when the learner stands still: the next meaningful
 * place in each room (only somewhere this learner can actually go).
 */
function guideFor(room: RoomId, access: WorldAccess): { x: number; z: number } | null {
  if (room === "courtyard") return { x: 0, z: -ROOM.halfDepth };
  if (room === "hangul-village") return access.open.has("vocabulary-market") ? { x: 0, z: -VILLAGE.halfLength } : { x: VILLAGE.halfWidth, z: VILLAGE.hubLaneZ };
  if (room === "vocabulary-market") return { x: 0, z: -MARKET.halfDepth };
  if (room === "hub") return access.open.has("conversation-cafe") ? { x: 0, z: -HUB.half } : { x: HUB.half, z: -3.5 };
  return null;
}

const INTEREST_CACHE = new Map<RoomId, { x: number; z: number }[]>();
function interestsIn(room: RoomId) {
  let v = INTEREST_CACHE.get(room);
  if (!v) INTEREST_CACHE.set(room, (v = INTERACTABLES.filter((i) => i.room === room).map((i) => ({ x: i.x, z: i.z }))));
  return v;
}

interface WatcherProps {
  player: MutableRefObject<PlayerState>;
  layout: RoomLayout;
  access: WorldAccess;
  onDoor: (portal: Portal) => void;
  onNotice: (notice: WorldNotice | null) => void;
}

/**
 * Checks, after the player moves, whether a gate zone was entered or left.
 * An open gate starts the trip; a gate into a locked world stays shut.
 */
function PortalWatcher({ player, layout, access, onDoor, onNotice }: WatcherProps) {
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
    // A gate into a locked world simply stays shut; it can be inspected (E).
    if (hit.lockedNotice && !access.open.has(hit.to)) return;
    onDoor(hit);
  }, -1.5);
  return null;
}

/** Reports the nearest usable thing, and the learner's first real move. */
function FocusWatcher({ room, player, story, access, onFocus, onFirstMove }: {
  room: RoomId;
  access: WorldAccess;
  player: MutableRefObject<PlayerState>;
  story: MutableRefObject<StoryState>;
  onFocus: (it: Interactable | null) => void;
  onFirstMove: () => void;
}) {
  const current = useRef<string | null>(null);
  const start = useRef<{ x: number; z: number } | null>(null);
  const moved = useRef(false);
  useFrame(() => {
    const p = player.current;
    if (!moved.current) {
      start.current ??= { x: p.position.x, z: p.position.z };
      if (Math.hypot(p.position.x - start.current.x, p.position.z - start.current.z) > 1.5) {
        moved.current = true;
        onFirstMove();
      }
    }
    if (p.frozen) return;
    let it = nearestInteractable(room, p.position.x, p.position.z, undefined, (r) => access.open.has(r)) ?? null;
    // Once the egg has opened there is nothing more to do with it.
    if (it?.kind === "egg" && (story.current.egg === "open" || story.current.egg === "hatching")) it = null;
    const id = it?.id ?? null;
    if (id === current.current) return;
    current.current = id;
    onFocus(it);
  }, -1.5);
  return null;
}

/** Notices the first step into a discovery spot in this room. */
function DiscoveryWatcher({ room, player, onDiscover }: { room: RoomId; player: MutableRefObject<PlayerState>; onDiscover: (k: DiscoveryKey) => void }) {
  const seen = useRef(new Set<string>());
  const spots = useMemo(() => DISCOVERIES.filter((d) => d.room === room), [room]);
  useFrame(() => {
    const p = player.current.position;
    for (const d of spots) {
      if (seen.current.has(d.key)) continue;
      if (Math.hypot(p.x - d.x, p.z - d.z) < d.radius) {
        seen.current.add(d.key);
        onDiscover(d.key);
      }
    }
  });
  return null;
}

/** Hands the renderer to the debug probe (draw calls, GPU memory). */
function Stats({ glRef }: { glRef: MutableRefObject<WebGLRenderer | null> }) {
  const gl = useThree((s) => s.gl);
  glRef.current = gl;
  return null;
}
