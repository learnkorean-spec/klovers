import { Suspense, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { useTiledTexture, paintPlanks, paintPaving } from "../game/environment/textures";
import {
  Learner,
  LearnerPlaceholder,
  Hotspot,
  Cluby,
  Player,
  FollowCamera,
  useLearnerReactions,
  type VocabItem,
  type DialogueLine,
} from "./shared";

/** How far Adam can actually walk in this room: clear of the counter's front
 * face (z≈0.3) and the alley wall behind it, inside the camera's frame. */
const ADAM_BOUNDS = { x: [-2.2, 2.2] as [number, number], z: [0.5, 3.2] as [number, number] };

export type { VocabItem };

/** A single clickable vocabulary item: the word said at the cart, what it
 * means, and how to say it. Clicking its hotspot in the 3D scene is the
 * "real learner data" trigger — a word the learner actually picked, not a
 * hover tooltip — so AI Room Lab's own vocabulary list drives the lesson. */
export const VOCAB: VocabItem[] = [
  { id: "eomuk", korean: "어묵", pronunciation: "eo-muk", arabic: "كعك السمك", english: "fish cake" },
  { id: "tteokbokki", korean: "떡볶이", pronunciation: "tteok-bok-ki", arabic: "توكبوكي (كعك الأرز الحار)", english: "spicy rice cakes" },
  { id: "gimbap", korean: "김밥", pronunciation: "gim-bap", arabic: "كيمباب (لفائف أرز بالأعشاب البحرية)", english: "seaweed rice rolls" },
  { id: "juseyo", korean: "주세요", pronunciation: "ju-se-yo", arabic: "من فضلك أعطني", english: "please give me" },
];

/** A short, real exchange between Adam and Lina ordering at the cart — the
 * "practice the conversation" feature. Reuses this room's own vocabulary
 * (떡볶이, 김밥, 주세요) plus 얼마예요? so the two words-in-isolation hotspots
 * and this back-and-forth reinforce each other. Friends ordering food
 * together, per canon — nothing romantic. */
export const DIALOGUE: DialogueLine[] = [
  { speaker: "lina", korean: "여기 뭐 먹을까?", reading: "yeo-gi mwo meo-geul-kka?", english: "What should we eat here?" },
  { speaker: "adam", korean: "떡볶이 하나 주세요.", reading: "tteok-bok-ki ha-na ju-se-yo.", english: "One tteokbokki, please." },
  { speaker: "lina", korean: "저는 김밥 주세요.", reading: "jeo-neun gim-bap ju-se-yo.", english: "I'll have gimbap, please." },
  { speaker: "adam", korean: "이거 얼마예요?", reading: "i-geo eol-ma-ye-yo?", english: "How much is this?" },
  { speaker: "lina", korean: "진짜 맛있겠다!", reading: "jin-jja ma-sit-get-da!", english: "This looks so good!" },
];

/**
 * KLOVERS World 2 — hackathon tech-demo scene: a Korean street-food cart at
 * dusk (포장마차), the room Meta's Muse Image/Spark designed in AI Room Lab.
 *
 * Deliberately isolated from src/game/* room logic (no production progression
 * or story-canon gating touched), but reuses the game's own RiggedBody
 * component for Adam and Lina — the same rigged, dyed, real-animation
 * characters the live KLOVERS World uses — rather than a crude standalone
 * GLB loader, so they stay pixel-for-pixel the same Adam and Lina.
 *
 * Palette: ivory #FFF9EC, KLOVERS yellow #FFFF00, charcoal #2E2E2E.
 */

/** The alley backdrop: a single wide, curved-feeling wall of hanok storefronts
 * directly behind the cart, close enough and wide enough to stay in frame
 * through the camera's gentle orbit (unlike scattered background props,
 * which can swing out of a narrow FOV) — gives the cart somewhere to stand
 * instead of a void, echoing the alley in the Meta concept image above it. */
function Alley() {
  const windowXs = useMemo(() => [-2.6, -1.9, -1.2, 1.2, 1.9, 2.6], []);
  return (
    <group position={[0, 0, -2.2]}>
      {/* dusk sky, well back and wide so it fills the frame at any orbit angle */}
      <mesh position={[0, 3, -4]}>
        <planeGeometry args={[26, 10]} />
        <meshBasicMaterial color="#2f2a3d" />
      </mesh>
      {/* storefront wall directly behind the cart */}
      <mesh position={[0, 1.4, 0]} receiveShadow>
        <boxGeometry args={[9, 2.8, 0.4]} />
        <meshStandardMaterial color="#2a2019" roughness={0.9} />
      </mesh>
      {/* roofline: a long low ridge along the top of the wall */}
      <mesh position={[0, 2.95, 0.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[9.4, 0.3, 0.9]} />
        <meshStandardMaterial color="#1a130f" roughness={0.9} />
      </mesh>
      {/* a row of warm, lit storefront windows, each with a thin dark frame so
          they read as windows rather than flat glowing cards */}
      {windowXs.map((x) => (
        <group key={x} position={[x, 1.45, 0.21]}>
          <mesh>
            <planeGeometry args={[0.42, 0.6]} />
            <meshStandardMaterial color="#1a130f" />
          </mesh>
          <mesh position={[0, 0, 0.005]}>
            <planeGeometry args={[0.34, 0.5]} />
            <meshStandardMaterial color="#FFD98A" emissive="#FFB23C" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
      {/* soft glow from the storefronts, picking out the characters' silhouettes against the wall */}
      {[-2.2, 2.2].map((x) => (
        <pointLight key={x} position={[x, 1.8, 1.2]} intensity={0.5} color="#FFB84D" distance={4} />
      ))}
    </group>
  );
}

/** The food cart itself: wooden counter, fabric awning on poles, hanging lights, a hand-drawn menu board.
 * The three food props and the menu board are click-to-learn hotspots:
 * `onSelectVocab` fires with the matching VocabItem (by id, found in VOCAB). */
function FoodCart({ onSelectVocab }: { onSelectVocab: (id: string) => void }) {
  const lights = useMemo(() => [-0.8, -0.3, 0.3, 0.8].map((x) => ({ x, y: 2.05 + 0.04 * Math.sin(x * 5), z: 0 })), []);
  // Real wood-plank grain (the same procedural painter the live game's maru
  // floors use — see textures.ts) instead of a flat color, so the counter,
  // stools and menu board don't read as plastic next to the photo above.
  const counterWood = useTiledTexture(paintPlanks, 2, 0.6);
  const stoolWood = useTiledTexture(paintPlanks, 1, 1);
  const boardWood = useTiledTexture(paintPlanks, 0.8, 1);
  return (
    <group>
      {/* counter */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.0, 0.6]} />
        <meshStandardMaterial map={counterWood} color="#c9a877" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[2.3, 0.05, 0.65]} />
        <meshStandardMaterial map={counterWood} color="#d8ba8e" roughness={0.75} />
      </mesh>
      {/* skewers tray (어묵): a wooden tray of upright skewer sticks, set
          toward the back-centre of the counter, clear of where the
          characters' hands rest. Click to learn the word. */}
      <Hotspot onSelect={() => onSelectVocab("eomuk")}>
        <group position={[-0.15, 1.05, -0.12]}>
          <mesh>
            <boxGeometry args={[0.38, 0.03, 0.22]} />
            <meshStandardMaterial color="#d9a441" roughness={0.6} />
          </mesh>
          {[-0.12, -0.04, 0.04, 0.12].map((sx) => (
            <mesh key={sx} position={[sx, 0.09, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
              <meshStandardMaterial color="#f0c24a" roughness={0.5} />
            </mesh>
          ))}
        </group>
      </Hotspot>
      {/* tteokbokki pot (떡볶이): a shallow bowl, red sauce visible. Click to learn the word. */}
      <Hotspot onSelect={() => onSelectVocab("tteokbokki")}>
        <group position={[0.25, 1.05, -0.12]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.11, 0.08, 24]} />
            <meshStandardMaterial color="#5a4a3a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
            <meshStandardMaterial color="#c43b2e" roughness={0.4} />
          </mesh>
        </group>
      </Hotspot>
      {/* kimbap tray (김밥): a few dark rice-roll cylinders lying on a board. Click to learn the word. */}
      <Hotspot onSelect={() => onSelectVocab("gimbap")}>
        <group position={[0.45, 1.04, -0.12]}>
          <mesh>
            <boxGeometry args={[0.26, 0.02, 0.18]} />
            <meshStandardMaterial color="#1f1f1f" roughness={0.4} />
          </mesh>
          {[-0.08, 0, 0.08].map((sx) => (
            <mesh key={sx} position={[sx, 0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.16, 12]} />
              <meshStandardMaterial color="#2a2a1a" roughness={0.5} />
            </mesh>
          ))}
        </group>
      </Hotspot>
      {/* awning poles */}
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.4]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
          <meshStandardMaterial color="#2E2E2E" roughness={0.6} />
        </mesh>
      ))}
      {/* fabric awning */}
      <mesh position={[0, 2.3, -0.2]} rotation={[0.18, 0, 0]}>
        <boxGeometry args={[2.6, 0.06, 1.4]} />
        <meshStandardMaterial color="#FFF9EC" roughness={0.9} />
      </mesh>
      {/* menu board — click to learn how to ask for something */}
      <Hotspot onSelect={() => onSelectVocab("juseyo")}>
        <mesh position={[-1.3, 1.3, -0.2]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.7, 0.04]} />
          <meshStandardMaterial map={boardWood} color="#6b4a30" roughness={0.8} />
        </mesh>
      </Hotspot>
      {/* three stools, tucked under the counter's overhang — set back from
          where Adam and Lina stand (z 1.1) so nothing clips their legs */}
      {[-1.1, -0.3, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.25, 1.5]} castShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.5, 16]} />
          <meshStandardMaterial map={stoolWood} color="#9a7249" roughness={0.8} />
        </mesh>
      ))}
      {/* hanging lights */}
      {lights.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]}>
          <sphereGeometry args={[0.04, 12, 10]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFD24C" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export default function World2Scene({
  onSelectVocab,
  activeDialogueSpeaker = null,
  dialogueTurnKey = -1,
}: {
  /** Fired when the learner clicks a food/menu hotspot, with the matching
   * VocabItem — the actual click is the "real learner data" driving the
   * reaction, not a timer or a hover. */
  onSelectVocab?: (vocab: VocabItem) => void;
  /** Who is "speaking" the dialogue line currently shown in the page's
   * DialogueCard, or null when it's closed — drives a one-off talk
   * animation on that character each time the line changes. */
  activeDialogueSpeaker?: "adam" | "lina" | null;
  /** Bumped by the page every time the displayed dialogue line changes, so
   * the talk animation retriggers even if the same speaker says two lines
   * in a row (speaker alone wouldn't change in that case). */
  dialogueTurnKey?: number;
}) {
  // Dressed-stone paving (same painter the live game's courtyards use)
  // instead of a flat plane, so the ground reads as a real street.
  const ground = useTiledTexture(paintPaving, 6, 6);
  // Shared with FoodCart's hotspots below: clicking a word plays a one-off
  // reaction on both learners (Lina "explains" it, Adam "reacts" to it) —
  // cross-fades back to idle automatically once the clip finishes.
  const { adamControl, linaControl, react } = useLearnerReactions();
  const adamRef = useRef<Group>(null);
  const handleSelect = (id: string) => {
    const vocab = VOCAB.find((v) => v.id === id);
    if (!vocab) return;
    react();
    onSelectVocab?.(vocab);
  };
  // Dialogue card playback: whoever is "speaking" the current line plays a
  // one-off "talk" clip, cross-fading back to idle on its own once done —
  // same mechanism `react()` above uses, just driven by the page instead of
  // a hotspot click.
  useEffect(() => {
    if (!activeDialogueSpeaker) return;
    const control = activeDialogueSpeaker === "adam" ? adamControl : linaControl;
    control.current.once = "talk";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogueTurnKey]);
  return (
    <group>
      {/* light dusk haze, far enough out that it only softens the alley wall,
          not the cart or characters in the foreground */}
      <fog attach="fog" args={["#2a2438", 7, 16]} />
      {/* World1's own lighting recipe (src/game/World.tsx's LIGHT constant):
          a hemisphere sky/ground bounce instead of flat ambient, a warm key
          light, and a faint cool fill so shadows keep their colour instead
          of going flat black — same technique, re-tuned down for dusk
          instead of World1's golden-afternoon brightness (Re, 3 Nov 2026:
          "make the lighting match World1"). */}
      <hemisphereLight args={["#FFE9CC", "#A08466", 0.45]} />
      <directionalLight position={[-6, 4, -2]} intensity={0.25} color="#C4D3EC" />
      <directionalLight
        position={[3, 5, 2.5]}
        intensity={1.7}
        color="#FFCC8E"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <pointLight position={[0, 2.1, 0.3]} intensity={0.9} color="#FFD24C" distance={4.5} />
      <Alley />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial map={ground} color="#8a7560" roughness={0.95} />
      </mesh>
      <FoodCart onSelectVocab={handleSelect} />
      <FollowCamera target={adamRef} control={adamControl} />
      <Suspense
        fallback={
          <>
            <LearnerPlaceholder x={-0.6} z={1.1} />
            <LearnerPlaceholder x={0.5} z={1.1} />
          </>
        }
      >
        {/* Adam — keyboard-controlled (arrow keys / WASD), starts ordering at
            the counter angled toward camera and Lina, then can walk around */}
        <Player
          avatar="adam"
          initial={{ x: -0.6, z: 1.1, rotY: Math.PI * 0.8 }}
          bounds={ADAM_BOUNDS}
          control={adamControl}
          exposedRef={adamRef}
        />
        {/* Lina beside him, pointing at the menu */}
        <Learner avatar="lina" x={0.5} z={1.1} rotY={Math.PI * 0.65} control={linaControl} />
      </Suspense>
      {/* Cluby sitting further right and back from Lina (x=0.5, z=1.1) —
          moved here from x=1.1/z=1.4 after Re flagged that, at some points
          in SlowOrbit's camera sway, Cluby's round silhouette landed
          directly over Lina's torso from this room's camera angle, reading
          as a broken/deformed body rather than two separate characters.
          This extra separation (Δx 1.1 vs 0.6, Δz 0.8 vs 0.3 before) keeps
          them visibly apart across the whole orbit range. */}
      <Cluby x={1.6} y={0.5} z={1.9} />
    </group>
  );
}
