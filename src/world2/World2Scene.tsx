import { Suspense, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY, paintPlanks, paintPaving } from "../game/environment/textures";
import { Kit, pot, basket, shopfront, hanokHouse, bunting, tree, pine } from "../game/environment/kit";
import Batch from "../game/environment/Batch";
import { World1Atmosphere } from "./World1Stage";
import {
  LearnerPlaceholder,
  Hotspot,
  Cluby,
  Player,
  BackgroundFigure,
  FollowCamera,
  useLearnerReactions,
  DEFAULT_PLAYER_AVATAR,
  type PlayableAvatar,
  type VocabItem,
  type DialogueLine,
} from "./shared";

/** How far the learner can actually walk in this room: clear of the
 * counter's front face (z≈0.3) and the alley wall behind it, inside the
 * camera's frame. */
const PLAYER_BOUNDS = { x: [-2.2, 2.2] as [number, number], z: [0.5, 3.2] as [number, number] };

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

/** A short, real exchange ordering at the cart — the "practice the
 * conversation" feature. Reuses this room's own vocabulary (떡볶이, 김밥,
 * 주세요) plus 얼마예요? so the two words-in-isolation hotspots and this
 * back-and-forth reinforce each other.
 *
 * Re, 4 Nov 2026: rewritten from an Adam↔Lina exchange to player↔Cluby, now
 * that only one human renders in this room (see shared.tsx's
 * `PlayableAvatar` doc comment). Cluby hints and encourages — per his own
 * canon role (`give_hints`, never an all-knowing teacher) — he doesn't order
 * or eat anything himself. */
export const DIALOGUE: DialogueLine[] = [
  { speaker: "cluby", korean: "저기 봐! 떡볶이야. 맵지만 진짜 맛있어!", reading: "jeo-gi bwa! tteok-bok-ki-ya. maep-ji-man jin-jja ma-si-sseo!", english: "Look over there! That's tteokbokki. It's spicy but really good!" },
  { speaker: "player", korean: "떡볶이 하나 주세요.", reading: "tteok-bok-ki ha-na ju-se-yo.", english: "One tteokbokki, please." },
  { speaker: "cluby", korean: "잘했어! 이제 '얼마예요?'라고 물어봐.", reading: "jal-hae-sseo! i-je 'eol-ma-ye-yo?' ra-go mu-reo-bwa.", english: "Well done! Now ask 'how much is it?'." },
  { speaker: "player", korean: "이거 얼마예요?", reading: "i-geo eol-ma-ye-yo?", english: "How much is this?" },
  { speaker: "cluby", korean: "우와, 김밥도 진짜 맛있겠다!", reading: "u-wa, gim-bap-do jin-jja ma-sit-get-da!", english: "Wow, the gimbap looks really good too!" },
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

/** The street behind the cart: two market shopfronts either side of a hanok
 * house, bunting overhead and trees at the ends — World1's own building kit,
 * so the cart stands in a real place rather than against a flat wall. */
function Alley() {
  const street = useMemo(() => {
    const k = new Kit();
    // Local to the Alley group (z = -2.2): fronts face the camera (+z).
    shopfront(k, { x: -3.3, z: -1.0, w: 3.0, d: 2.0, h: 2.6, face: "+z" });
    hanokHouse(k, { x: 0, z: -1.5, w: 3.4, d: 3.0, h: 2.3, face: "+z" });
    shopfront(k, { x: 3.3, z: -1.0, w: 3.0, d: 2.0, h: 2.6, face: "+z" });
    bunting(k, -4.6, 0.4, 4.6, 0.4, 3.1, 3);
    tree(k, -6.0, 0.2, 0.95, true, 4);
    pine(k, 6.0, 0.0, 0.9);
    tree(k, 6.6, 2.6, 0.8, false, 7);
    return k;
  }, []);
  return (
    <group position={[0, 0, -2.2]}>
      {/* Re, 4 Nov 2026 ("i need world 1 quality"): this used to be a
          painted dusk-sky plane and a single flat dark box for a wall, with
          glowing window cards. Now it's a real street built from the live
          game's own building pieces (kit.ts's shopfront/hanokHouse/bunting,
          the same ones SeoulMarket/VocabularyMarket use), drawn through the
          same Batch — tiled roofs, timber columns, paper windows, a canopy
          over each shop — under the shared World1 sky (World1Stage.tsx). */}
      <Batch kit={street} />
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
      <Hotspot onSelect={() => onSelectVocab("eomuk")} hitCenter={[-0.15, 1.12, -0.12]} hitSize={[0.5, 0.35, 0.4]}>
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
      <Hotspot onSelect={() => onSelectVocab("tteokbokki")} hitCenter={[0.25, 1.08, -0.12]} hitSize={[0.4, 0.3, 0.4]}>
        <group position={[0.25, 1.05, -0.12]}>
          <mesh>
            <cylinderGeometry args={[0.14, 0.11, 0.08, 24]} />
            <meshStandardMaterial color="#5a4a3a" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.02, 24]} />
            <meshStandardMaterial color="#c43b2e" roughness={0.4} />
          </mesh>
          {/* a wisp of steam — a couple of soft, faint cones rising off the
              pot, the detail that most reads "hot food" at a glance */}
          {[-0.03, 0.04].map((sx, i) => (
            <mesh key={i} position={[sx, 0.22 + i * 0.03, 0]} rotation={[0, 0, sx * 2]}>
              <coneGeometry args={[0.025, 0.22, 8]} />
              <meshStandardMaterial color="#FFF9EC" transparent opacity={0.16} depthWrite={false} />
            </mesh>
          ))}
        </group>
      </Hotspot>
      {/* kimbap tray (김밥): a few dark rice-roll cylinders lying on a board. Click to learn the word. */}
      <Hotspot onSelect={() => onSelectVocab("gimbap")} hitCenter={[0.45, 1.07, -0.12]} hitSize={[0.4, 0.3, 0.4]}>
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
      <Hotspot onSelect={() => onSelectVocab("juseyo")} hitCenter={[-1.3, 1.3, -0.2]} hitSize={[0.65, 0.85, 0.35]}>
        <mesh position={[-1.3, 1.3, -0.2]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.5, 0.7, 0.04]} />
          <meshStandardMaterial map={boardWood} color="#6b4a30" roughness={0.8} />
        </mesh>
      </Hotspot>
      {/* Two stools, off to the sides of where Adam and Lina stand, clear
          of the camera's direct line to the characters. Re, 4 Nov 2026:
          "game looks so bad" — three of these, spread across x -1.1/-0.3/1.1
          at z=1.5, sat directly in front of the characters, closest to
          camera, and read as a wall of oversized barrels blocking the shot
          (moving them back along z barely helped: at this scale and
          distance they still overlapped the characters' silhouettes
          dead-on). Two, pushed out to the sides (x ±1.8) and shrunk a
          little, sit beside the counter the way stools actually would,
          instead of standing in the way of the one shot everyone sees. */}
      {[-1.8, 1.8].map((x) => (
        <mesh key={x} position={[x, 0.21, 0.6]} castShadow>
          <cylinderGeometry args={[0.15, 0.13, 0.42, 16]} />
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
  playerAvatar = DEFAULT_PLAYER_AVATAR,
  onSelectVocab,
  activeDialogueSpeaker = null,
  dialogueTurnKey = -1,
}: {
  /** Which canon learner the visitor is walking as this visit — Adam or
   * Lina; the only human rendered in this room. See shared.tsx's doc
   * comment on `PlayableAvatar`. */
  playerAvatar?: PlayableAvatar;
  /** Fired when the learner clicks a food/menu hotspot, with the matching
   * VocabItem — the actual click is the "real learner data" driving the
   * reaction, not a timer or a hover. */
  onSelectVocab?: (vocab: VocabItem) => void;
  /** Who is "speaking" the dialogue line currently shown in the page's
   * DialogueCard, or null when it's closed — drives a one-off "talk" clip
   * on the player, or a little reaction hop on Cluby, each time the line
   * changes. */
  activeDialogueSpeaker?: "player" | "cluby" | null;
  /** Bumped by the page every time the displayed dialogue line changes, so
   * the talk animation retriggers even if the same speaker says two lines
   * in a row (speaker alone wouldn't change in that case). */
  dialogueTurnKey?: number;
}) {
  // Dressed-stone paving (same painter the live game's courtyards use)
  // instead of a flat plane, so the ground reads as a real street.
  const ground = useTiledTexture(paintPaving, 8, 8);
  // Render-quality pass, 4 Nov 2026 — see EntranceScene.tsx's matching
  // comment: the same real photographed stone floor World1's rooms already
  // use, upgraded in place once it downloads.
  const groundPhoto = usePhotoFloor("paving", 8, 8);
  // Re, 4 Nov 2026 ("make it as world1, that's not the same"): a couple of
  // real market-goods props (kit.ts's own basket/pot, the same pieces
  // VocabularyMarket.tsx uses) off to the sides — clear of the player's
  // walk bounds and the counter's hotspots — so the alley reads as a
  // stocked street-food corner, not an empty counter against a wall.
  const sceneKit = useMemo(() => {
    const k = new Kit();
    basket(k, -2.6, 2.0, 1.1, "fruitRed");
    pot(k, 2.6, 2.1, 0.85);
    return k;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Shared with FoodCart's hotspots below: clicking a word plays a one-off
  // reaction (the player waves, Cluby hops) — cross-fades/decays back to
  // idle automatically on its own.
  const { playerControl, clubyReact, react } = useLearnerReactions();
  const playerRef = useRef<Group>(null);
  const handleSelect = (id: string) => {
    const vocab = VOCAB.find((v) => v.id === id);
    if (!vocab) return;
    react();
    onSelectVocab?.(vocab);
  };
  // Dialogue card playback: whoever is "speaking" the current line plays a
  // one-off "talk" clip (player) or reaction hop (Cluby) — same mechanism
  // `react()` above uses, just driven by the page instead of a hotspot click.
  useEffect(() => {
    if (!activeDialogueSpeaker) return;
    if (activeDialogueSpeaker === "player") {
      playerControl.current.once = "talk";
    } else {
      clubyReact.current.pulse = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogueTurnKey]);
  return (
    <group>
      {/* Re, 4 Nov 2026 ("i need world 1 quality"): the live game's own
          sky, landscape, haze and light rig (World1Stage.tsx) — replaces
          this room's old dusk fog and dim, hand-tuned lights. */}
      <World1Atmosphere id="w2-cart" hx={10} hz={10} floor={{ cx: 0, cz: 1.85, w: 4.4, d: 2.7 }} />
      <Alley />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          key={groundPhoto ? "photo" : "painted"}
          map={groundPhoto?.map ?? ground}
          normalMap={groundPhoto?.normal ?? null}
          roughnessMap={groundPhoto?.rough ?? null}
          color={groundPhoto ? "#F4EBDD" : "#ffffff"}
          roughness={groundPhoto ? 1 : 0.95}
          onBeforeCompile={floorBreakup}
          customProgramCacheKey={FLOOR_BREAKUP_KEY}
        />
      </mesh>
      <FoodCart onSelectVocab={handleSelect} />
      <Batch kit={sceneKit} />
      <FollowCamera target={playerRef} control={playerControl} />
      <Suspense fallback={<LearnerPlaceholder x={-0.1} z={1.1} />}>
        {/* The learner's own character — keyboard-controlled (arrow keys /
            WASD), starts ordering at the counter angled toward camera. Re,
            4 Nov 2026: "student must choose a character and move with one
            only" — re-centred (was x=-0.6, offset to leave room for the
            companion that stood at x=0.5) now that this is the only human
            in the scene. */}
        <Player
          avatar={playerAvatar}
          initial={{ x: -0.1, z: 1.1, rotY: Math.PI * 0.8 }}
          bounds={PLAYER_BOUNDS}
          control={playerControl}
          exposedRef={playerRef}
        />
      </Suspense>
      {/* Cluby, left of the counter, clear of the camera's near field.
          Previously on the right (x=1.6, z=1.9, elevated to y=0.5 to sit
          "on a stool") to keep clear of Lina's torso during SlowOrbit's
          camera sway — but at z=1.9 it was also the single nearest thing to
          the old tight camera, so perspective blew it up into an oversized
          shape overlapping the vocab-card UI (Re, 4 Nov 2026: "game looks so
          bad"). Moving it to the opposite side entirely (left, away from the
          UI card's own corner) solves the same silhouette-overlap problem
          without relying on being close to camera, and grounds it like every
          other room's Cluby instead of floating on an invisible stool.
          Now also the dialogue/reaction partner (see `clubyReact` above),
          since the companion learner that used to stand opposite the player
          is gone from this scene entirely. */}
      <Cluby x={-1.6} y={0} z={1.3} reactRef={clubyReact} />
      {/* Re, 4 Nov 2026: "add more people" — two unnamed passersby near the
          alley storefronts, clear of the player's own walk bounds (x±2.2,
          z 0.5–3.2) and the counter's footprint, so the street reads as
          lived-in without crowding the one learner this scene is about. See
          `BackgroundFigure`'s own doc comment for why these are generic,
          never named canon characters. */}
      <BackgroundFigure x={-2.9} z={-1.3} rotY={2.4} toneIndex={0} />
      <BackgroundFigure x={2.8} z={-1.6} rotY={-2.1} toneIndex={2} scale={0.96} />
    </group>
  );
}
