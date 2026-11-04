import { Suspense, useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { useTiledTexture, paintPlanks } from "../game/environment/textures";
import {
  Learner,
  LearnerPlaceholder,
  Hotspot,
  Cluby,
  Player,
  FollowCamera,
  useLearnerReactions,
  companionOf,
  DEFAULT_PLAYER_AVATAR,
  type PlayableAvatar,
  type VocabItem,
  type DialogueLine,
} from "./shared";

/** How far the learner can walk here (in this scene's own local coordinates,
 * before the whole room is shifted -0.6 on x): clear of the shelf/fridge
 * front faces (z≈-1.15) and the checkout counter (z≈-0.03), inside the
 * camera's frame. */
const PLAYER_BOUNDS = { x: [-2.0, 2.3] as [number, number], z: [-0.9, 1.8] as [number, number] };

/**
 * KLOVERS World 2 — second hackathon room: a late-night Korean convenience
 * store (편의점/pyeonuijeom), "Variant A" from AI Room Lab's own two
 * candidates for the theme "a small late-night Korean convenience store
 * where Adam picks snacks and drinks and practices asking the price and
 * counting numbers at the register, Lina helping him read the labels,
 * Cluby curled up by the door" — picked over Variant B's daytime/open-door
 * version because its warm hanging lamp and glass night-lit entrance match
 * the dusk-street-cart room's own palette (ivory #FFF9EC, KLOVERS yellow
 * #FFFF00, charcoal #2E2E2E, plus the brief's own warm tan #FFE99A),
 * see public/assets/world2/concept-convenience-store.jpg and the brief
 * recorded in the Project doc. A developer (not AI Room Lab itself) built
 * this scene from that brief — the tool proposes, it doesn't auto-build.
 */
export type { VocabItem };

/** AI Room Lab's own vocabulary list for this room, used verbatim — the
 * generated brief named exactly these six items. */
export const VOCAB: VocabItem[] = [
  { id: "gwaja", korean: "과자", pronunciation: "gwa-ja", arabic: "بسكويت/سناكس", english: "snack" },
  { id: "eumnyosu", korean: "음료수", pronunciation: "eum-nyo-su", arabic: "مشروب", english: "drink" },
  { id: "eolmayeyo", korean: "얼마예요?", pronunciation: "eol-ma-ye-yo", arabic: "بكام ده؟", english: "how much is it?" },
  { id: "hana", korean: "하나", pronunciation: "ha-na", arabic: "واحد", english: "one" },
  { id: "dul", korean: "둘", pronunciation: "dul", arabic: "اتنين", english: "two" },
  { id: "gyesandae", korean: "계산대", pronunciation: "gye-san-dae", arabic: "الكاشير", english: "checkout counter" },
];

/** A short, real exchange between Adam and Lina picking snacks and paying —
 * reuses this room's own vocabulary (과자, 얼마예요?, 주세요) so the
 * words-in-isolation hotspots and this back-and-forth reinforce each other.
 * Friends shopping together, per canon — nothing romantic. */
export const DIALOGUE: DialogueLine[] = [
  { speaker: "adam", korean: "과자 어디 있어?", reading: "gwa-ja eo-di i-sseo?", english: "Where are the snacks?" },
  { speaker: "lina", korean: "저기 있어, 같이 가자.", reading: "jeo-gi i-sseo, ga-chi ga-ja.", english: "They're over there, let's go together." },
  { speaker: "adam", korean: "이거 얼마예요?", reading: "i-geo eol-ma-ye-yo?", english: "How much is this?" },
  { speaker: "lina", korean: "삼천 원이에요.", reading: "sam-cheon won-i-e-yo.", english: "It's 3,000 won." },
  { speaker: "adam", korean: "네, 이거 하나 주세요.", reading: "ne, i-geo ha-na ju-se-yo.", english: "Okay, one of these, please." },
];

/** Warm hanging lamp over the register, and the store's dark night window —
 * the two things that read "late-night" rather than "any store". */
function StoreShell() {
  return (
    <group position={[0, 0, -2.2]}>
      {/* dark street outside the window, well back so it fills the frame */}
      <mesh position={[0, 2.6, -3.6]}>
        <planeGeometry args={[22, 8]} />
        <meshBasicMaterial color="#141022" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 1.6, -1.6]} receiveShadow>
        <boxGeometry args={[9, 3.2, 0.3]} />
        <meshStandardMaterial color="#efe2c8" roughness={0.85} />
      </mesh>
      {/* glass entrance door, stage right, night outside visible through it */}
      <group position={[2.6, 1.3, -0.2]}>
        <mesh>
          <boxGeometry args={[1.1, 2.3, 0.06]} />
          <meshStandardMaterial color="#9fd6e8" transparent opacity={0.35} roughness={0.1} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[1.14, 2.34, 0.04]} />
          <meshStandardMaterial color="#2E2E2E" roughness={0.6} />
        </mesh>
      </group>
      {/* warm hanging lamp over the register — the room's signature light */}
      <mesh position={[1.6, 2.5, 0.3]}>
        <cylinderGeometry args={[0.16, 0.2, 0.22, 16]} />
        <meshStandardMaterial color="#FFF9EC" roughness={0.7} />
      </mesh>
      <mesh position={[1.6, 2.38, 0.3]}>
        <sphereGeometry args={[0.05, 12, 10]} />
        <meshStandardMaterial color="#FFFF00" emissive="#FFD24C" emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[1.6, 2.3, 0.3]} intensity={1.4} color="#FFD98A" distance={3.5} />
    </group>
  );
}

/** A back-wall unit of snack shelves, four rows deep, each row a slightly
 * different warm tone so it reads as stocked rather than one flat slab.
 * The whole unit is the "과자" (snack) hotspot. */
function SnackShelves({ onSelect }: { onSelect: () => void }) {
  const rows = useMemo(() => [0.35, 0.75, 1.15, 1.55], []);
  return (
    <Hotspot onSelect={onSelect} hitCenter={[-1.5, 1.0, -1.4]} hitSize={[1.8, 2.1, 0.6]}>
      <group position={[-1.5, 0, -1.4]}>
        {/* frame */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 2.0, 0.5]} />
          <meshStandardMaterial color="#c9a877" roughness={0.85} />
        </mesh>
        {/* shelf rows with small bright snack-bag blocks */}
        {rows.map((y, r) => (
          <group key={y} position={[0, y, 0.22]}>
            <mesh>
              <boxGeometry args={[1.6, 0.03, 0.42]} />
              <meshStandardMaterial color="#5a4a3a" roughness={0.7} />
            </mesh>
            {[-0.6, -0.3, 0, 0.3, 0.6].map((x, i) => (
              <mesh key={x} position={[x, 0.09, 0]}>
                <boxGeometry args={[0.22, 0.16, 0.08]} />
                <meshStandardMaterial
                  color={["#FFFF00", "#FF8A3D", "#4FB8E0", "#F25C5C", "#8FD6B4"][(r + i) % 5]}
                  roughness={0.5}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Hotspot>
  );
}

/** A glass-front drink fridge, cool-lit, stocked with bottle rows. The
 * "음료수" (drink) hotspot. */
function DrinkFridge({ onSelect }: { onSelect: () => void }) {
  const rows = useMemo(() => [0.45, 0.95, 1.45], []);
  return (
    <Hotspot onSelect={onSelect} hitCenter={[-0.1, 1.0, -1.4]} hitSize={[1.4, 2.1, 0.7]}>
      <group position={[-0.1, 0, -1.4]}>
        {/* The box is 0.55 deep, so its own front face sits at local z=0.275.
            The bottle rows and point light below used to sit at z=0.2 and
            z=0.4 respectively — *inside* that solid box — so the opaque
            box face hid every bottle completely, leaving only its own lit
            front face showing through the glass: a flat glowing blank
            panel (Re flagged this, 3 Nov). Pulling the rows (0.32) and
            glass (0.4) in front of that face, with the light (0.33) just
            behind the glass, actually shows the stocked shelves now. */}
        {/* Re, 4 Nov 2026: found live that this read as a flat glowing white
            panel, not a fridge — metalness 0.2 + roughness 0.5 caught a
            sharp specular highlight from the room's key light right behind
            the glass, blowing the whole front face out to white and washing
            the bottle rows out with it. Matte (metalness 0, roughness 0.9)
            diffuses that highlight instead of mirroring it. */}
        <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 2.0, 0.55]} />
          <meshStandardMaterial color="#d7dde2" roughness={0.9} metalness={0} />
        </mesh>
        {rows.map((y) => (
          <group key={y} position={[0, y, 0.32]}>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => (
              <mesh key={x} position={[x, 0, 0]}>
                <cylinderGeometry args={[0.055, 0.055, 0.32, 10]} />
                <meshStandardMaterial color={["#4FB8E0", "#8FD6B4", "#FFFF00", "#F2E200", "#FF8A3D"][i % 5]} roughness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
        <pointLight position={[0, 1.4, 0.33]} intensity={0.12} color="#bfe6ef" distance={1.5} />
        {/* glass front — in front of the bottles now, so they're actually
            visible through it instead of hidden behind the fridge's own
            opaque body. Lower opacity (0.3→0.18) and roughness up (0.1→0.4)
            — a mirror-smooth, fairly opaque pane on top of the (now matte)
            body was still enough to haze the bottles behind it. */}
        <mesh position={[0, 1.0, 0.4]}>
          <boxGeometry args={[1.12, 1.8, 0.02]} />
          <meshStandardMaterial color="#bfe6ef" transparent opacity={0.18} roughness={0.4} />
        </mesh>
      </group>
    </Hotspot>
  );
}

/** The checkout register: counter + small screen + a basket of snacks by
 * the till. The "계산대" (checkout counter) hotspot — and where Adam
 * practices asking the price and counting. */
function Checkout({ onSelect }: { onSelect: () => void }) {
  const counterWood = useTiledTexture(paintPlanks, 1.4, 0.4);
  return (
    <Hotspot onSelect={onSelect} hitCenter={[1.5, 0.9, -0.3]} hitSize={[1.6, 1.8, 0.7]}>
      <group position={[1.5, 0, -0.3]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 1.1, 0.55]} />
          <meshStandardMaterial map={counterWood} color="#3a342c" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[1.56, 0.05, 0.6]} />
          <meshStandardMaterial color="#2a251f" roughness={0.5} />
        </mesh>
        {/* register screen, tilted toward the learner */}
        <group position={[0.15, 1.3, 0]} rotation={[-0.3, -0.4, 0]}>
          <mesh>
            <boxGeometry args={[0.26, 0.2, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.017]}>
            <planeGeometry args={[0.22, 0.16]} />
            <meshStandardMaterial color="#8FD6B4" emissive="#4FB8E0" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* a small basket of snacks by the till */}
        <mesh position={[-0.55, 1.18, 0.05]}>
          <cylinderGeometry args={[0.14, 0.11, 0.12, 16]} />
          <meshStandardMaterial color="#c9a877" roughness={0.8} />
        </mesh>
      </group>
    </Hotspot>
  );
}

/** The shared "얼마예요?"/number-counting moment: two small price tags
 * stuck to the shelf edge — a second, distinct hotspot from the shelf
 * itself so "how much is it?" and "one/two" live where a learner would
 * actually look for a price, not buried inside the snack shelf. */
function PriceTags({ onSelectPrice, onSelectCount }: { onSelectPrice: () => void; onSelectCount: () => void }) {
  // SnackShelves' frame box front face sits at world z = -1.15 (shelf group
  // z=-1.4, box depth 0.5). These tags need to clear that by a visible
  // margin or the shelf's own raycast hit wins every click.
  return (
    <group position={[-1.5, 1.0, -1.0]}>
      <Hotspot onSelect={onSelectPrice} hitCenter={[-0.5, 0, 0]} hitSize={[0.4, 0.3, 0.3]}>
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, 0.08]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial color="#FFF9EC" />
        </mesh>
      </Hotspot>
      <Hotspot onSelect={onSelectCount} hitCenter={[0.5, 0, 0]} hitSize={[0.4, 0.3, 0.3]}>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -0.06]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshStandardMaterial color="#FFE99A" />
        </mesh>
      </Hotspot>
    </group>
  );
}

export default function ConvenienceStoreScene({
  playerAvatar = DEFAULT_PLAYER_AVATAR,
  onSelectVocab,
  activeDialogueSpeaker = null,
  dialogueTurnKey = -1,
}: {
  /** Which canon learner the visitor is walking as this visit — same
   * contract as World2Scene's cart room; see shared.tsx's `PlayableAvatar`. */
  playerAvatar?: PlayableAvatar;
  /** Fired when the learner clicks a shelf/fridge/register hotspot, with the
   * matching VocabItem — same contract as World2Scene's cart room. */
  onSelectVocab?: (vocab: VocabItem) => void;
  /** Who is "speaking" the dialogue line currently shown in the page's
   * DialogueCard, or null when it's closed — same contract as World2Scene. */
  activeDialogueSpeaker?: "adam" | "lina" | null;
  /** Bumped by the page on every dialogue-line change, same as World2Scene. */
  dialogueTurnKey?: number;
}) {
  const floor = useTiledTexture(paintPlanks, 5, 3);
  const { adamControl, linaControl, playerControl, companionControl, react } = useLearnerReactions(playerAvatar);
  const companionAvatar = companionOf(playerAvatar);
  const playerRef = useRef<Group>(null);
  const handleSelect = (id: string) => {
    const vocab = VOCAB.find((v) => v.id === id);
    if (!vocab) return;
    react();
    onSelectVocab?.(vocab);
  };
  useEffect(() => {
    if (!activeDialogueSpeaker) return;
    const control = activeDialogueSpeaker === "adam" ? adamControl : linaControl;
    control.current.once = "talk";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogueTurnKey]);
  // "하나" and "둘" are two separate vocab items in AI Room Lab's own brief —
  // one price tag alternates between them on each click rather than picking
  // just one, so both numbers stay reachable from a single hotspot.
  const nextCount = useRef<"hana" | "dul">("hana");
  const handleCount = () => {
    handleSelect(nextCount.current);
    nextCount.current = nextCount.current === "hana" ? "dul" : "hana";
  };
  return (
    // Shelf (-1.5) to Cluby by the door (2.3) spans further than the cart
    // room did, so the whole scene is shifted left to keep it centered on
    // the camera's default look-at (the origin) instead of re-deriving a
    // custom camera target.
    <group position={[-0.6, 0, 0]}>
      {/* Same hemisphere + warm key + cool fill recipe as World1's own
          lighting (src/game/World.tsx's LIGHT constant) — see World2Scene's
          own comment for the full rationale. */}
      {/* Re, 4 Nov 2026 ("yes fix"): a late-night store should stay dimmer
          than the dusk street cart, but it was reading as flat dark rather
          than moodily lit — stepped every light up by roughly the same
          proportion as the cart room's own brightness pass, keeping the
          store noticeably darker than the cart but no longer murky. */}
      <hemisphereLight args={["#FFE9CC", "#A08466", 0.55]} />
      <directionalLight position={[-6, 4, -2]} intensity={0.32} color="#C4D3EC" />
      <directionalLight
        position={[2, 5, 3]}
        intensity={1.7}
        color="#FFCC8E"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <StoreShell />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial map={floor} color="#7a6a52" roughness={0.9} />
      </mesh>
      <SnackShelves onSelect={() => handleSelect("gwaja")} />
      <DrinkFridge onSelect={() => handleSelect("eumnyosu")} />
      <Checkout onSelect={() => handleSelect("gyesandae")} />
      <PriceTags onSelectPrice={() => handleSelect("eolmayeyo")} onSelectCount={handleCount} />
      <FollowCamera target={playerRef} control={playerControl} />
      <Suspense
        fallback={
          <>
            <LearnerPlaceholder x={0.5} z={0.9} />
            <LearnerPlaceholder x={1.3} z={0.6} />
          </>
        }
      >
        {/* The learner's own character — keyboard-controlled (arrow keys /
            WASD), starts at the shelf reaching for a snack, then can walk
            around the store */}
        <Player
          avatar={playerAvatar}
          initial={{ x: 0.5, z: 0.9, rotY: -Math.PI * 0.55 }}
          bounds={PLAYER_BOUNDS}
          control={playerControl}
          exposedRef={playerRef}
        />
        {/* The companion beside them, pointing at the label */}
        <Learner avatar={companionAvatar} x={1.15} z={0.75} rotY={-Math.PI * 0.4} control={companionControl} />
      </Suspense>
      {/* Cluby curled up by the door, per the brief */}
      <Cluby x={2.3} y={0.12} z={0.9} />
    </group>
  );
}
