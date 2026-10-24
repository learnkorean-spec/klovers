import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, Color, MeshBasicMaterial, PCFSoftShadowMap, PMREMGenerator, RingGeometry, Vector3, type Mesh, type Scene, type Texture, type WebGLRenderer } from "three";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { FOLIAGE_TIME, upgradeMaterialDetails } from "./config/materials";
import { REDUCED_MOTION } from "./systems/motion";
import { INTERACTABLES, nearbyInteractables, pickInteractable, type Interactable } from "./config/interactions";
import { ALLEY, CULTURE, findPortal, GARDEN, HUB, MARKET, ROOMS, SEOUL, tourSpot, VILLAGE, type NoticeKey, type Portal, type RoomId, type RoomLayout, type Spawn, type TourStop } from "./config/rooms";
import { CAMERA, PALETTE, PROPS, ROOM } from "./config/world";
import ThirdPersonCamera from "./camera/ThirdPersonCamera";
import { DISCOVERIES, type DiscoveryKey } from "./config/discoveries";
import { NPCS, FRIEND_SPOT, CAFE_FRIEND, CULTURE_FRIEND, SEOUL_FRIEND, ALLEY_FRIEND } from "./config/npcs";
import { objectiveTarget, type ObjectiveId, type ObjectiveProgress } from "./config/objectives";
import ObjectiveMarker from "./environment/ObjectiveMarker";
import Friend from "./npc/Friend";
import Npc from "./npc/Npc";
import ConversationCafe from "./environment/ConversationCafe";
import CultureStreet from "./environment/CultureStreet";
import SeoulJourney from "./environment/SeoulJourney";
import MemoryGarden from "./environment/MemoryGarden";
import SeoulMarket from "./environment/SeoulMarket";
import KloversHouse from "./environment/KloversHouse";
import HangulVillage from "./environment/HangulVillage";
import TourExhibit from "./environment/TourExhibit";
import type { WorldLang } from "./config/copy";
import Hub from "./environment/Hub";
import Lobby from "./environment/Lobby";
import VocabularyMarket from "./environment/VocabularyMarket";
import Cluby from "./player/Cluby";
import Player from "./player/Player";
import type { AvatarId } from "./player/characters";
import type { WorldAccess } from "./systems/access";
import { useMoveInput } from "./systems/input";
import { pickQuality } from "./systems/quality";
import { createCameraState, createPlayerState, type CameraState, type PlayerState } from "./systems/state";
import { createStoryState, HATCH, type StoryState } from "./systems/story";
import type { WorldState } from "./systems/worldState";
import Backdrop, { SKY } from "./environment/Backdrop";
import GroundWear from "./environment/GroundWear";
import { applyWatercolor, WATERCOLOR_SCREEN, watercolorMode } from "./systems/watercolor";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { createPost } from "./systems/post";

/**
 * Light colours (not brand colours): golden sun, warm sky bounce, earth
 * bounce, cool fill, and a sky a touch warmer than the brand ivory.
 */
const LIGHT = {
  /** Low golden sun: warm, but not orange — stone and plaster stay neutral. */
  sun: "#FFCC8E",
  skyBounce: "#FFE9CC",
  /** Warm, fairly light earth bounce: timber under the eaves stays readable. */
  groundBounce: "#A08466",
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
  "klovers-house": { hx: 9, hz: 8 },
  "culture-street": { hx: 10.5, hz: 15 },
  "seoul-journey": { hx: 15, hz: 14 },
  "memory-garden": { hx: 8.5, hz: 8.5 },
  "seoul-market": { hx: 7, hz: 13.5 },
};

/** Length of the fade to and from ivory on a room change, ms. */
export const FADE_MS = 350;

export type WorldNotice = NoticeKey;

/** Short things Cluby says (text lives in config/copy.ts, per language). */
export type SpeechKey =
  | "hello" | "found" | "follow" | "hangul-village" | "vocabulary-market" | "hub" | "klovers-house" | "wordRight" | "letters"
  | "talk-courtyard" | "talk-hangul-village" | "talk-vocabulary-market" | "talk-hub" | "talk-conversation-cafe" | "talk-klovers-house";

/** Commands the page can give the scene (HTML UI → 3D). */
export interface WorldApi {
  /** Play the hatch (only honoured when Cluby is really awake). */
  hatch: () => void;
  /** Skip the rest of a story moment. */
  skip: () => void;
  /** Cluby's happy hop and line after a right answer. */
  celebrate: (line?: SpeechKey) => void;
  /** Spoken to: Cluby turns to the learner, hops, and says his line here. */
  clubyTalk: () => void;
  /** The egg was inspected: its light answers (the egg stays still). */
  pulseEgg: () => void;
  /** Cluby points toward a place for a moment ("this way"). */
  point: (x: number, z: number) => void;
  /** Walk through an open gate now (E at the gate). */
  enter: (to: RoomId, arrive: string) => void;
  /** Tap-to-go: walk by itself to this thing (a tapped sign). */
  goTo: (it: Interactable) => void;
  /** Read a Klovers tour board: walk to it and frame it close; null lets the camera go. */
  tourTo: (stop: TourStop | null) => void;
  /** Where the learner is and which way the view looks (the minimap). */
  pose: () => { room: RoomId; x: number; z: number; yaw: number; camYaw: number };
}

export interface WorldProps {
  /** Cluby's Memory Garden: words in the learner's review schedule, and how many are reviewed and resting. */
  garden?: { words: number; reviewed: number };
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
  /** The learner has stood still a while (true), or moved again (false). */
  onIdle?: (idle: boolean) => void;
  /** The few usable things around the learner changed (tappable signs). */
  onNearby?: (list: Interactable[]) => void;
  /** The page's sign elements by id: moved over their things every frame. */
  beaconEls?: MutableRefObject<Map<string, HTMLElement>>;
  /** Tap-to-go arrived at this thing. */
  onArrive?: (id: string) => void;
  /** The market shop's thing last chosen (it hops; `at` changes each pick). */
  shopChosen?: { item: string; at: number } | null;
  /** A shop thing was pressed (clicked or tapped) in the scene. */
  onShopPress?: (item: string) => void;
  /** A chosen mission's marker (wins over the first-visit objective's). */
  marker?: { x: number; z: number } | null;
  /** "eyes": first person (the learner's own view); "behind": over the shoulder. */
  view?: "eyes" | "behind";
  /** The page's language: the tour boards are written in it. */
  lang?: WorldLang;
  /** A tour board was stood at and read (Hangul Village). */
  onTourSeen?: (stop: TourStop) => void;
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
      /** The live scene, for exporting a room's geometry to bake (scripts/world-bake). */
      scene: () => Scene | null;
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
  const sceneRef = useRef<Scene | null>(null);
  /** What the learner can use right now (drawn as a small ring under it). */
  const focusRef = useRef<Interactable | null>(null);
  /** The tour board being framed (its reading spot, and the distance to give back); let go when the learner walks off. */
  const tourFrame = useRef<{ x: number; z: number; distance: number } | null>(null);

  useEffect(() => {
    player.current.paused = !!props.paused;
  }, [props.paused]);

  useEffect(() => {
    const c = camera.current;
    c.pov = props.view === "eyes";
    // Switching back to behind: drop in behind the learner at once.
    c.snap = true;
  }, [props.view]);

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

  const celebrate = useCallback(
    (line: SpeechKey = "wordRight") => {
      const s = story.current;
      if (s.cluby.mode !== "follow") return;
      s.cluby.hopUntil = performance.now() + 1100;
      say(line, 2400);
    },
    [say],
  );

  const clubyTalk = useCallback(() => {
    const s = story.current;
    if (s.cluby.mode !== "follow") return;
    s.cluby.ackUntil = performance.now() + 1600;
    s.cluby.look = null;
    say(`talk-${roomRef.current}` as SpeechKey, 3000);
  }, [say]);

  const pulseEgg = useCallback(() => {
    story.current.eggPulseUntil = performance.now() + 1600;
  }, []);

  const point = useCallback((x: number, z: number) => {
    const s = story.current;
    if (s.cluby.mode !== "follow") return;
    const at = { x, z };
    s.cluby.look = at;
    timers.current.push(window.setTimeout(() => {
      if (story.current.cluby.look === at) story.current.cluby.look = null;
    }, 2800));
  }, []);

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

  useEffect(() => {
    const pose = () => ({
      room: roomRef.current,
      x: player.current.position.x,
      z: player.current.position.z,
      yaw: player.current.yaw,
      camYaw: camera.current.yaw,
    });
    const goTo = (it: Interactable) => {
      const p = player.current;
      if (p.frozen || p.paused) return;
      const at = spotOf(it);
      p.autoTarget = { id: it.id, x: at.x, z: at.z, stop: Math.max(0.9, it.radius * 0.55) };
    };
    const tourTo = (stop: TourStop | null) => {
      const c = camera.current;
      const p = player.current;
      const b = stop ? VILLAGE.tour.find((x) => x.id === stop) : null;
      if (tourFrame.current) c.distance = tourFrame.current.distance;
      tourFrame.current = null;
      if (!b || roomRef.current !== "hangul-village") {
        c.focus = null;
        c.yawTarget = null;
        c.pitchTarget = null;
        return;
      }
      const at = tourSpot(b);
      // Its own id: arriving must not "use" the board again (tap-to-go
      // would, and that would put the board straight back down).
      p.autoTarget = { id: `reading-${b.id}`, x: at.x, z: at.z, stop: 0.3 };
      // Frame the board like a page held up to read: its middle, from a
      // little to one side (the learner stands in front of it), close.
      c.focus = { x: b.x, y: 1.5, z: b.z };
      c.yawTarget = Math.atan2(at.x - b.x, at.z - b.z) + (b.x < 0 ? -0.42 : 0.42);
      c.pitchTarget = 0.06;
      tourFrame.current = { x: at.x, z: at.z, distance: c.distance };
      c.distance = 3.3;
    };
    cb.current.onApi?.({ hatch, skip: finishHatch, celebrate, clubyTalk, pulseEgg, point, enter: (to, arrive) => travel({ to, arrive }), goTo, tourTo, pose });
  }, [hatch, finishHatch, celebrate, clubyTalk, pulseEgg, point, travel]);

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
      // Beside the learner (on the side the view opens to), never between
      // the learner and the camera.
      cl.x = spawn.x - Math.sin(spawn.yaw) * 0.25 - Math.cos(spawn.yaw) * 1.0;
      cl.z = spawn.z - Math.cos(spawn.yaw) * 0.25 + Math.sin(spawn.yaw) * 1.0;
      cl.look = null;
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        p.frozen = false;
        cb.current.onFade?.(false);
        cb.current.onRoomChange?.(roomId);
        // One Cluby line on the first visit to a place — never more.
        const sv = savedRef.current;
        const greetable = roomId === "hangul-village" || roomId === "vocabulary-market" || roomId === "hub" || roomId === "klovers-house";
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
      scene: () => sceneRef.current,
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

  const objectiveSpot = useMemo(
    () => (props.progress ? objectiveTarget(props.objective ?? null, roomId, props.progress) : null),
    [props.progress, props.objective, roomId],
  );

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
      {/*
        Haze held back to the far end (5 Oct 2026). At 28 the near plane sat
        close enough that the middle of a street was already milky, which
        flattened the depth the buildings were built to give; the horizon
        still fades, so a room keeps its air without losing its distance.
        camera.far is 120, so nothing visible is ever cut off.
      */}
      <fog attach="fog" args={[LIGHT.haze, 40, 125]} />
      <Backdrop id={roomId} hx={BACKDROP[roomId].hx} hz={BACKDROP[roomId].hz} />

      {/* Warm late-afternoon light: a low golden sun with soft shadows, a
          warm sky/ground bounce, and a faint cool fill from the other side
          so shadows keep their shape without going black. Two lights only.

          Rebalanced 5 Oct 2026. The ambient floor (0.8 bounce + 0.55 fill)
          sat close enough to the sun's 3.1 that lit and shaded faces barely
          differed, which is what "flat lighting" meant in this room. Dropping
          the floor and lifting the sun models the timber and the eaves, while
          the warm bounce keeps shade coloured instead of black. */}
      <hemisphereLight args={[LIGHT.skyBounce, LIGHT.groundBounce, 0.6]} />
      <directionalLight position={[-12, 6, -3]} intensity={0.42} color={LIGHT.fill} />
      <directionalLight
        key={roomId}
        castShadow={quality.shadows}
        position={[14, 7.6, 4.5]}
        intensity={3.5}
        color={LIGHT.sun}
        shadow-mapSize={[quality.shadowMap, quality.shadowMap]}
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
      {roomId === "hangul-village" && <HangulVillage marketOpen={access.open.has("vocabulary-market")} letters={saved.letters} />}
      {roomId === "hangul-village" && <TourExhibit lang={props.lang ?? "en"} player={player} onSeen={(s) => cb.current.onTourSeen?.(s)} />}
      {roomId === "vocabulary-market" && <VocabularyMarket nextOpen breadSign={saved.breadSign} words={saved.words} shopChosen={props.shopChosen} onShopPress={props.paused ? undefined : (item) => cb.current.onShopPress?.(item)} />}
      {roomId === "hub" && <Hub cafeOpen={access.open.has("conversation-cafe")} marketOpen={access.open.has("vocabulary-market")} cultureOpen={access.open.has("culture-street")} seoulOpen={access.open.has("seoul-journey")} gardenOpen={access.open.has("memory-garden")} />}
      {roomId === "seoul-market" && <SeoulMarket />}
      {roomId === "memory-garden" && <MemoryGarden words={props.garden?.words ?? 0} reviewed={props.garden?.reviewed ?? 0} />}
      {roomId === "conversation-cafe" && <ConversationCafe words={saved.words} />}
      {roomId === "culture-street" && <CultureStreet words={saved.words} />}
      {roomId === "seoul-journey" && <SeoulJourney words={saved.words} player={player} />}
      {roomId === "klovers-house" && <KloversHouse />}
      {/* The people of this room only; they leave with it. */}
      {NPCS.filter((n) => n.room === roomId).map((n) => (
        <Npc key={n.id} n={n} player={player} />
      ))}
      {roomId === "courtyard" && <Friend avatar={avatar} x={FRIEND_SPOT.x} z={FRIEND_SPOT.z} yaw={Math.atan2(-FRIEND_SPOT.x, -FRIEND_SPOT.z) + 0.5} player={player} />}
      {/* The other learner leads the café and Culture Street too (canon). */}
      {roomId === "conversation-cafe" && <Friend avatar={avatar} x={CAFE_FRIEND.x} z={CAFE_FRIEND.z} yaw={CAFE_FRIEND.yaw} player={player} />}
      {roomId === "culture-street" && <Friend avatar={avatar} x={CULTURE_FRIEND.x} z={CULTURE_FRIEND.z} yaw={CULTURE_FRIEND.yaw} player={player} />}
      {roomId === "seoul-journey" && <Friend avatar={avatar} x={SEOUL_FRIEND.x} z={SEOUL_FRIEND.z} yaw={SEOUL_FRIEND.yaw} player={player} />}
      {roomId === "seoul-market" && <Friend avatar={avatar} x={ALLEY_FRIEND.x} z={ALLEY_FRIEND.z} yaw={ALLEY_FRIEND.yaw} player={player} />}
      {props.marker ? <ObjectiveMarker x={props.marker.x} z={props.marker.z} /> : objectiveSpot ? <ObjectiveMarker x={objectiveSpot.x} z={objectiveSpot.z} /> : null}
      <FocusCue focus={focusRef} />
      <TourFrameWatcher frame={tourFrame} player={player} camera={camera} />
      {/* Frame priorities: player moves (−2), watchers read (−1.5), camera follows (−1). */}
      <Player input={input} player={player} camera={camera} layout={layout} avatar={avatar} onArrive={(id) => cb.current.onArrive?.(id)} />
      {/* On a first visit, he points toward the current objective; after
          that, he guides no one who already knows the way. */}
      <Cluby story={story} player={player} layout={layout} guide={objectiveSpot ?? (props.objective === undefined ? guideFor(roomId, access) : null)} interests={interestsIn(roomId)} />
      <ThirdPersonCamera player={player} camera={camera} layout={layout} onFirstLook={onFirstLook} />
      <PortalWatcher key={`p-${roomId}`} player={player} layout={layout} access={access} onDoor={travel} onNotice={(n) => cb.current.onNotice?.(n)} />
      <FocusWatcher
        key={`f-${roomId}`}
        room={roomId}
        player={player}
        story={story}
        access={access}
        focusRef={focusRef}
        onFocus={(it) => cb.current.onFocus?.(it)}
        onFirstMove={() => cb.current.onFirstMove?.()}
        onIdle={(idle) => cb.current.onIdle?.(idle)}
      />
      <DiscoveryWatcher key={`d-${roomId}`} room={roomId} player={player} onDiscover={(k) => cb.current.onDiscover?.(k)} />
      {props.beaconEls && (
        <BeaconWatcher key={`b-${roomId}`} room={roomId} player={player} view={camera} story={story} access={access} els={props.beaconEls} onNearby={(l) => cb.current.onNearby?.(l)} />
      )}
      <SkyLight />
      <FoliageClock />
      <Stats glRef={glRef} sceneRef={sceneRef} />
      {quality.adaptive && <AdaptiveResolution max={quality.dpr[1]} />}
      <WatercolorDriver />
      {quality.post && watercolorMode() === "off" && <PostDriver />}
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
  if (room === "culture-street") return { x: 0, z: -CULTURE.halfLength + 2.5 };
  if (room === "seoul-journey") return { x: SEOUL.subway.x + 0.4, z: SEOUL.subway.z + SEOUL.subway.d / 2 + 1.2 };
  if (room === "memory-garden") return { x: GARDEN.stone.x, z: GARDEN.stone.z + 1.05 };
  if (room === "seoul-market") return { x: -(ALLEY.stallX - 0.85), z: 5.5 };
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

/** Seconds of standing still before the learner counts as idle. */
const IDLE_AFTER = 10;

/**
 * Reports the one usable thing to offer (nearest, faced, steady — see
 * pickInteractable), the learner's first real move, and long pauses.
 * Cluby joins the candidates while he follows: turn to him to talk.
 */
function FocusWatcher({ room, player, story, access, focusRef, onFocus, onFirstMove, onIdle }: {
  room: RoomId;
  access: WorldAccess;
  player: MutableRefObject<PlayerState>;
  story: MutableRefObject<StoryState>;
  focusRef: MutableRefObject<Interactable | null>;
  onFocus: (it: Interactable | null) => void;
  onFirstMove: () => void;
  onIdle: (idle: boolean) => void;
}) {
  const current = useRef<string | null>(null);
  const start = useRef<{ x: number; z: number } | null>(null);
  const moved = useRef(false);
  const still = useRef({ t: 0, idle: false });
  const clubyIt = useRef<Interactable>({ id: "cluby", room, kind: "cluby", action: "talk", x: 0, z: 0, radius: 1.6, needsFacing: true, priority: -1 });
  useEffect(() => () => {
    focusRef.current = null;
  }, [focusRef]);
  useFrame((_, rawDt) => {
    const p = player.current;
    if (!moved.current) {
      start.current ??= { x: p.position.x, z: p.position.z };
      if (Math.hypot(p.position.x - start.current.x, p.position.z - start.current.z) > 1.5) {
        moved.current = true;
        onFirstMove();
      }
    }
    const w = still.current;
    if (Math.hypot(p.velocity.x, p.velocity.z) > 0.3 || p.paused || p.frozen) {
      w.t = 0;
      if (w.idle) {
        w.idle = false;
        onIdle(false);
      }
    } else {
      w.t += Math.min(rawDt, 0.1);
      if (!w.idle && w.t > IDLE_AFTER) {
        w.idle = true;
        onIdle(true);
      }
    }
    if (p.frozen) return;
    const s = story.current;
    const extra: Interactable[] = [];
    if (s.cluby.mode === "follow") {
      const c = clubyIt.current;
      c.room = room;
      c.x = s.cluby.x;
      c.z = s.cluby.z;
      extra.push(c);
    }
    let it = pickInteractable(room, p.position.x, p.position.z, p.yaw, current.current, (r) => access.open.has(r), extra) ?? null;
    // Once the egg has opened there is nothing more to do with it.
    if (it?.kind === "egg" && (s.egg === "open" || s.egg === "hatching")) it = null;
    focusRef.current = it;
    const id = it?.id ?? null;
    if (id === current.current) return;
    current.current = id;
    onFocus(it);
  }, -1.5);
  return null;
}

const CUE_GEO = new RingGeometry(0.42, 0.5, 40).rotateX(-Math.PI / 2);
const CUE_MAT = new MeshBasicMaterial({ color: new Color(PALETTE.yellow), transparent: true, opacity: 0.5, depthWrite: false, blending: AdditiveBlending, toneMapped: false });
const NPC_AT = new Map(NPCS.map((n) => [n.id, n]));

/**
 * In range of something usable: a thin yellow ring breathes on the ground
 * under it (under the person, for someone to talk to). Nothing far away is
 * marked — the cue only appears once the prompt does.
 */
function FocusCue({ focus }: { focus: MutableRefObject<Interactable | null> }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const it = focus.current;
    const show = it && it.kind !== "cluby" && it.kind !== "door" && it.kind !== "link" && it.kind !== "locked";
    m.visible = !!show;
    if (!show || !it) return;
    const who = it.npc ? NPC_AT.get(it.npc) : it.kind === "talk" && it.who === "friend" ? FRIEND_SPOT : null;
    m.position.set(who ? who.x : it.x, 0.03, who ? who.z : it.z);
    const k = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 3.2);
    m.scale.setScalar(it.kind === "egg" ? 3.4 : 1 + 0.08 * k);
    CUE_MAT.opacity = 0.28 + 0.3 * k;
  });
  return <mesh ref={ref} geometry={CUE_GEO} material={CUE_MAT} visible={false} renderOrder={3} />;
}

/** Where a thing really is (a person's line stands at the person). */
/** Walking well away from a framed tour board gives the camera back. */
function TourFrameWatcher({ frame, player, camera }: { frame: MutableRefObject<{ x: number; z: number; distance: number } | null>; player: MutableRefObject<PlayerState>; camera: MutableRefObject<CameraState> }) {
  useFrame(() => {
    const f = frame.current;
    if (!f) return;
    const p = player.current;
    if (p.autoTarget || Math.hypot(p.position.x - f.x, p.position.z - f.z) < 1.6) return;
    frame.current = null;
    const c = camera.current;
    c.distance = f.distance;
    c.focus = null;
    c.yawTarget = null;
    c.pitchTarget = null;
  }, -1.4);
  return null;
}

function spotOf(it: Interactable): { x: number; z: number } {
  const who = it.npc ? NPC_AT.get(it.npc) : it.kind === "talk" && it.who === "friend" ? FRIEND_SPOT : null;
  return who ? { x: who.x, z: who.z } : { x: it.x, z: it.z };
}

/**
 * Guidance: the few usable things nearby, each with a small tappable sign
 * floating over it (DOM, owned by the page). This lists them now and then
 * and moves the signs over their things every frame, without re-rendering.
 */
type HudRect = { l: number; t: number; r: number; b: number };

/**
 * Where the page's own controls sit over the 3D view, in the signs' layer
 * coordinates: every interactive element (pointer-events-auto) outside the
 * signs' layer — the top buttons and toggles, objective and mission chips,
 * the controls card, the map, the joystick. Whole-screen overlays (a card's
 * backdrop) are skipped: they cover everything anyway.
 */
function hudRects(layer: HTMLElement | null, w: number, h: number): HudRect[] {
  if (!layer || !layer.parentElement) return [];
  const base = layer.getBoundingClientRect();
  const out: HudRect[] = [];
  layer.parentElement.querySelectorAll<HTMLElement>(".pointer-events-auto").forEach((e) => {
    if (layer.contains(e) || e.tagName === "CANVAS") return;
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.width * r.height > w * h * 0.5) return;
    out.push({ l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top });
  });
  return out;
}

function BeaconWatcher({ room, player, view, story, access, els, onNearby }: {
  room: RoomId;
  player: MutableRefObject<PlayerState>;
  view: MutableRefObject<CameraState>;
  story: MutableRefObject<StoryState>;
  access: WorldAccess;
  els: MutableRefObject<Map<string, HTMLElement>>;
  onNearby: (list: Interactable[]) => void;
}) {
  const { camera, size } = useThree();
  const list = useRef<Interactable[]>([]);
  const key = useRef("");
  const t = useRef(0);
  const v = useMemo(() => new Vector3(), []);
  const report = useRef(onNearby);
  report.current = onNearby;
  const hud = useRef<{ t: number; rects: HudRect[] }>({ t: 0, rects: [] });
  useEffect(() => () => report.current([]), []);
  useFrame((_, dt) => {
    const p = player.current;
    t.current -= dt;
    if (t.current <= 0) {
      t.current = 0.3;
      const egg = story.current.egg;
      const l = p.frozen
        ? []
        : nearbyInteractables(room, p.position.x, p.position.z, (r) => access.open.has(r), 4, 10, INTERACTABLES, view.current.yaw).filter((it) => !(it.kind === "egg" && (egg === "open" || egg === "hatching")));
      const k = l.map((i) => i.id).join(",");
      if (k !== key.current) {
        key.current = k;
        list.current = l;
        report.current(l);
      }
    }
    // The screen's own controls (buttons, cards, the map, the joystick):
    // a sign never covers them. Measured every few frames, not every frame.
    const any = els.current.values().next().value as HTMLElement | undefined;
    if (any && (hud.current.t -= dt) <= 0) {
      hud.current.t = 0.25;
      hud.current.rects = hudRects(any.parentElement, size.width, size.height);
    }
    // Signs never sit on top of each other: a later one steps up a line.
    const placed: { x: number; y: number; w: number }[] = [];
    for (const it of list.current) {
      const el = els.current.get(it.id);
      if (!el) continue;
      const at = spotOf(it);
      const h = it.npc || it.kind === "talk" ? 2.15 : it.kind === "egg" ? 1.9 : it.kind === "door" || it.kind === "locked" || it.kind === "link" || it.kind === "tour" ? 2.6 : 1.7;
      v.set(at.x, h, at.z).project(camera);
      const sx = (v.x * 0.5 + 0.5) * size.width;
      let sy = (-v.y * 0.5 + 0.5) * size.height;
      const w = el.offsetWidth || 110;
      for (let k = 0; k < placed.length; k++) {
        const o = placed[k];
        if (Math.abs(o.x - sx) < (o.w + w) / 2 + 6 && Math.abs(o.y - sy) < 40) {
          sy = o.y - 42;
          k = -1;
        }
      }
      // Over a control: step just below it if there is room, else wait hidden.
      const hh = el.offsetHeight || 36;
      for (let pass = 0; pass < 3; pass++) {
        const hit = hud.current.rects.find((r) => sx + w / 2 > r.l - 4 && sx - w / 2 < r.r + 4 && sy > r.t - 4 && sy - hh < r.b + 4);
        if (!hit) break;
        sy = hit.b + hh + 6;
      }
      const blocked = hud.current.rects.some((r) => sx + w / 2 > r.l - 4 && sx - w / 2 < r.r + 4 && sy > r.t - 4 && sy - hh < r.b + 4);
      const off = blocked || v.z > 1 || sx - w / 2 < 4 || sx + w / 2 > size.width - 4 || sy < 70 || sy > size.height - 8;
      if (!off) placed.push({ x: sx, y: sy, w });
      el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, -100%)`;
      el.style.visibility = off ? "hidden" : "visible";
    }
  }, -0.5);
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

/**
 * Draft watercolour finish (?style=wc / ?style=wcall): re-applied now and
 * then, so whatever a room change mounts is painted too. Off by default.
 */
function WatercolorDriver() {
  const { scene, gl, camera, size } = useThree();
  const mode = useMemo(watercolorMode, []);
  const t = useRef(0);
  const composer = useMemo(() => {
    if (mode === "off") return null;
    const c = new EffectComposer(gl);
    // Painted on the finished (tone-mapped, display) image, so paper white
    // stays white instead of being tone-mapped to grey.
    c.addPass(new RenderPass(scene, camera));
    c.addPass(new OutputPass());
    const pass = new ShaderPass(WATERCOLOR_SCREEN);
    c.addPass(pass);
    return { c, pass };
  }, [mode, gl, scene, camera]);
  useEffect(() => {
    if (!composer) return;
    composer.c.setSize(size.width, size.height);
    const dpr = gl.getPixelRatio();
    composer.pass.uniforms.resolution.value = [size.width * dpr, size.height * dpr];
  }, [composer, size, gl]);
  useEffect(() => () => composer?.c.dispose(), [composer]);
  // Positive priority: this frame callback takes over drawing (preview only).
  useFrame((_, dt) => {
    if (!composer) return;
    t.current -= dt;
    if (t.current <= 0) {
      t.current = 1;
      applyWatercolor(scene, mode);
    }
    composer.c.render();
  }, mode === "off" ? 0 : 1);
  return null;
}

/** The desktop finish (systems/post.ts): takes over drawing when it is on. */
function PostDriver() {
  const { scene, gl, camera, size } = useThree();
  const post = useMemo(() => createPost(gl, scene, camera, size.width, size.height), [gl, scene, camera]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => post?.setSize(size.width, size.height), [post, size]);
  useEffect(() => () => post?.dispose(), [post]);
  // Positive priority takes over drawing; without the finish, R3F draws as before.
  useFrame(() => post?.render(), post ? 1 : 0);
  return null;
}

/**
 * Real sky light: a photographed late-afternoon sky (Poly Haven, CC0) lights
 * every surface softly from all around and gives glossy things something to
 * reflect. The painted backdrop stays the visible sky. Loaded after the
 * first frame; nothing changes if it cannot load.
 */
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

/** Advances the shared clock that sways the leaves; still when the person asks for less motion. */
function FoliageClock() {
  useFrame(({ clock }) => {
    if (!REDUCED_MOTION) FOLIAGE_TIME.value = clock.elapsedTime;
  });
  return null;
}

/**
 * Phones: start sharp, then step the pixel ratio down (to 1.25 at least)
 * while the world runs under ~45 frames a second, measured over 2-second
 * windows; never back up, so it doesn't flicker between sharp and soft.
 */
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
    // The first windows include loading and shader compiling: ignore them.
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

/** Hands the renderer to the debug probe (draw calls, GPU memory). */
function Stats({ glRef, sceneRef }: { glRef: MutableRefObject<WebGLRenderer | null>; sceneRef: MutableRefObject<Scene | null> }) {
  const gl = useThree((s) => s.gl);
  glRef.current = gl;
  sceneRef.current = useThree((s) => s.scene);
  return null;
}
