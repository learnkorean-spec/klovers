import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Map as MapIcon, Maximize2, MessageCircle, Minimize2, Volume2, X } from "lucide-react";
import World2Scene, { DIALOGUE as CART_DIALOGUE } from "./World2Scene";
import ConvenienceStoreScene, { DIALOGUE as STORE_DIALOGUE } from "./ConvenienceStoreScene";
import EntranceScene from "./EntranceScene";
import PostFinish from "./PostFinish";
import { speakKorean, type DialogueLine, type VocabItem } from "./shared";

/** Each room AI Room Lab has proposed and a developer has built out: its own
 * concept image, 3D scene, camera framing and vocabulary. Adding a third
 * room (once a third AI Room Lab brief is picked) means one more entry here
 * plus one new Scene file — nothing else in this page changes.
 *
 * conceptImage/conceptAlt are kept as provenance (which AI Room Lab brief
 * this room was built from, see public/assets/world2/) but are no longer
 * rendered in the page itself — per Re's note 2026-11-01, the room should
 * read as an actual 3D world like the live /world game, not a generated
 * picture with a 3D scene bolted under it. The concept art still lives in
 * the repo and the Project doc for anyone writing up the pipeline. */
type Room = {
  id: string;
  label: string;
  conceptImage: string;
  conceptAlt: string;
  cameraPosition: [number, number, number];
  cameraFov: number;
  Scene: typeof World2Scene;
  hint: string;
  title: string;
  body: string;
  /** The room's "practice the conversation" exchange between Adam and
   * Lina — shown in the DialogueCard, line by line, Korean + English
   * reading + English translation. */
  dialogue: DialogueLine[];
};

const ROOMS: Room[] = [
  {
    id: "cart",
    label: "Street Cart",
    conceptImage: "/assets/world2/concept-pojangmacha.jpg",
    conceptAlt:
      "Meta Muse Image concept render: Adam and Lina at a lantern-lit Korean street food cart at dusk, with Cluby seated beside them",
    cameraPosition: [2.6, 1.9, 3.8],
    cameraFov: 42,
    Scene: World2Scene,
    hint: "Use WASD or the arrow keys to walk Adam around. Tap the skewers, tteokbokki, kimbap, or the menu board to learn the word.",
    title: "A warm Korean street food cart at dusk (포장마차)",
    body:
      "Adam orders at the counter, Lina points to the menu and explains, Cluby sits on a stool beside them. Tap a food item or the menu board above to hear and learn the word. Vocabulary: 어묵 (fish cake), 떡볶이 (spicy rice cakes), 김밥 (seaweed rice rolls), 주세요 (please give me), 얼마예요? (how much is it?).",
    dialogue: CART_DIALOGUE,
  },
  {
    id: "store",
    label: "Convenience Store",
    conceptImage: "/assets/world2/concept-convenience-store.jpg",
    conceptAlt:
      "Meta Muse Image concept render: Adam and Lina picking snacks in a late-night Korean convenience store, with Cluby curled up by the door",
    cameraPosition: [3.0, 2.1, 4.6],
    cameraFov: 44,
    Scene: ConvenienceStoreScene,
    hint: "Use WASD or the arrow keys to walk Adam around. Tap the shelf, fridge, checkout, or a price tag to learn the word.",
    title: "A late-night Korean convenience store (편의점)",
    body:
      "Adam picks snacks and drinks from the shelves, Lina helps him read the labels, Cluby curls up by the door. Tap the shelf, the fridge, the register, or a price tag above to hear and learn the word. Vocabulary: 과자 (snack), 음료수 (drink), 얼마예요? (how much is it?), 하나/둘 (one/two), 계산대 (checkout counter).",
    dialogue: STORE_DIALOGUE,
  },
];

/** The flashcard shown when a learner clicks a food/menu hotspot in the 3D
 * scene: the actual word they picked, not a generic vocab list — this is the
 * "move and learn" loop (click → reaction animation → word). */
function VocabCard({ vocab, onClose }: { vocab: VocabItem; onClose: () => void }) {
  return (
    <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:right-3 md:w-72 rounded-lg border border-[#FFF9EC]/15 bg-[#2E2E2E]/95 backdrop-blur p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-[#FFF9EC]">{vocab.korean}</p>
          <p className="text-xs text-[#FFF9EC]/60 mt-0.5">{vocab.pronunciation}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-[#FFF9EC]/50 hover:text-[#FFF9EC] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-sm text-[#FFF9EC]/80 mt-2">{vocab.english}</p>
      <p dir="rtl" className="text-sm text-[#FFF9EC]/80 mt-1">{vocab.arabic}</p>
      <Button
        size="sm"
        onClick={() => speakKorean(vocab.korean)}
        className="mt-3 bg-[#FFFF00] text-[#2E2E2E] hover:bg-[#FFFF00]/90"
      >
        <Volume2 className="h-3.5 w-3.5 mr-1.5" />
        Hear it
      </Button>
    </div>
  );
}

/** The "practice the conversation" card: a short, real back-and-forth
 * between Adam and Lina, shown one line at a time — Korean, its English
 * reading (romanization), and the English translation — distinct from the
 * single-word VocabCard above. Clicking a speaker's line also plays a
 * one-off "talk" animation on that character in the scene (see
 * activeDialogueSpeaker/dialogueTurnKey wiring in World2Page below). */
function DialogueCard({
  line,
  index,
  total,
  onPrev,
  onNext,
  onClose,
}: {
  line: DialogueLine;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const speakerLabel = line.speaker === "adam" ? "Adam" : "Lina";
  return (
    <div className="absolute inset-x-3 bottom-3 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-96 rounded-lg border border-[#FFF9EC]/15 bg-[#2E2E2E]/95 backdrop-blur p-4 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFFF00] text-[#2E2E2E]">
            {speakerLabel}
          </span>
          <span className="text-xs text-[#FFF9EC]/50">
            {index + 1} / {total}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-[#FFF9EC]/50 hover:text-[#FFF9EC] shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xl font-bold text-[#FFF9EC] mt-2">{line.korean}</p>
      <p className="text-xs text-[#FFF9EC]/60 mt-0.5">{line.reading}</p>
      <p className="text-sm text-[#FFF9EC]/80 mt-2">{line.english}</p>
      <div className="flex items-center justify-between mt-3">
        <Button
          size="sm"
          variant="ghost"
          onClick={onPrev}
          disabled={index === 0}
          className="text-[#FFF9EC] hover:bg-[#FFF9EC]/10 disabled:opacity-30 px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => speakKorean(line.korean)}
          className="bg-[#FFFF00] text-[#2E2E2E] hover:bg-[#FFFF00]/90"
        >
          <Volume2 className="h-3.5 w-3.5 mr-1.5" />
          Hear it
        </Button>
        {index === total - 1 ? (
          <Button size="sm" variant="ghost" onClick={onClose} className="text-[#FFF9EC] hover:bg-[#FFF9EC]/10 px-2">
            Done
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onNext} className="text-[#FFF9EC] hover:bg-[#FFF9EC]/10 px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/** Small top-down schematic of the three places in World 2 — the entrance
 * courtyard and its two gates — with the learner's current location
 * highlighted and every node clickable for instant fast-travel. Re, 3 Nov
 * 2026: "must have... a map" alongside the arrow-key movement already in
 * every room; this is deliberately a schematic (three dots and two paths),
 * not a literal top-down render of the 3D scenes, since the whole layout is
 * just "a courtyard with a gate left and a gate right" — a real minimap
 * would show the same three dots at far more code for no added clarity. */
function MapOverlay({
  view,
  onGo,
  onClose,
}: {
  view: string;
  onGo: (id: string) => void;
  onClose: () => void;
}) {
  const nodes: { id: string; label: string; x: number; y: number }[] = [
    { id: "cart", label: "Street Cart", x: 18, y: 20 },
    { id: "store", label: "Convenience Store", x: 82, y: 20 },
    { id: "entrance", label: "Entrance", x: 50, y: 78 },
  ];
  return (
    <div className="absolute top-14 right-3 w-48 rounded-lg border border-[#FFF9EC]/15 bg-[#2E2E2E]/95 backdrop-blur p-3 shadow-xl">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-[#FFF9EC]/80">Map</p>
        <button
          onClick={onClose}
          aria-label="Close map"
          className="text-[#FFF9EC]/50 hover:text-[#FFF9EC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <svg viewBox="0 0 100 100" className="w-full h-28">
        <line x1={50} y1={78} x2={18} y2={20} stroke="#FFF9EC" strokeOpacity={0.25} strokeWidth={1.5} />
        <line x1={50} y1={78} x2={82} y2={20} stroke="#FFF9EC" strokeOpacity={0.25} strokeWidth={1.5} />
        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={n.id === view ? 6 : 4.5}
            fill={n.id === view ? "#FFFF00" : "#FFF9EC"}
            fillOpacity={n.id === view ? 1 : 0.55}
            className="cursor-pointer"
            onClick={() => onGo(n.id)}
          />
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-1 mt-1">
        {nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => onGo(n.id)}
            className={`text-[9px] leading-tight text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded ${
              n.id === view ? "text-[#FFFF00] font-semibold" : "text-[#FFF9EC]/70 hover:text-[#FFF9EC]"
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Full-screen toggle for the Canvas's wrapping div, using the browser's own
 * Fullscreen API (same mechanism any web game uses — no extra dependency).
 * Re asked "why not a full screen" after reviewing World2 on a laptop: the
 * 3D view previously only ever filled 75% of viewport height inside the page
 * layout (header, tabs, info panel above/below it still visible). This lets
 * the learner expand just the 3D canvas to the whole screen and back, while
 * the embedded (75vh) view stays the default so the page still reads fine
 * without ever entering fullscreen (e.g. on a device that blocks it). */
function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.current?.requestFullscreen().catch(() => {
        // Some mobile browsers (notably iOS Safari) don't support the
        // Fullscreen API on arbitrary elements at all — fail silently
        // rather than throwing, the embedded 75vh view still works fine.
      });
    }
  };
  return { ref, isFullscreen, toggle };
}

/** Camera gently orbits so the scene reads as a real 3D room, not a static
 * render. Amplitude was 0.35 rad (~20°) — wide enough that, combined with
 * Cluby standing close to Lina in World2Scene, the sway could carry Cluby's
 * silhouette directly over Lina's from this room's camera angle (Re flagged
 * this as the body "not looking well" — two separate characters reading as
 * one broken one). Narrowed to 0.12 rad (~7°): still a visible, living sway,
 * but far too small a swing for a stationary NPC's position to cross another
 * stationary NPC's from the camera's point of view. */
function SlowOrbit({ children }: { children: React.ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.12;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * KLOVERS World 2 — hackathon preview page, route /world2.
 *
 * Isolated from the live learner world (src/game/, /world): each room was
 * designed by Meta's Muse Image model via AI Room Lab, then built out as an
 * interactive 3D Three.js scene by a developer from that brief — the actual
 * Meta → build pipeline, not an aspirational label — but the page itself
 * reads like the live /world game (full 3D scene, no generated picture
 * pasted above it). The source concept art stays in
 * public/assets/world2/concept-*.jpg and the Project doc for anyone writing
 * up how the pipeline worked. Nothing here reads or writes learner progress.
 */
export default function World2Page() {
  const navigate = useNavigate();
  const { ref: stageRef, isFullscreen, toggle: toggleFullscreen } = useFullscreen<HTMLDivElement>();
  const [activeVocab, setActiveVocab] = useState<VocabItem | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  // "entrance" (the landing courtyard, two gates) or a Room's id — the
  // learner always lands in the entrance first, the way the live /world
  // game always lands you in its own Hub before you pick a direction.
  const [view, setView] = useState<string>("entrance");
  // null = dialogue card closed; otherwise the index of the line showing.
  const [dialogueIndex, setDialogueIndex] = useState<number | null>(null);
  const room = view === "entrance" ? null : ROOMS.find((r) => r.id === view) ?? null;
  const currentLine = room && dialogueIndex !== null ? room.dialogue[dialogueIndex] : null;
  const goTo = (id: string) => {
    setView(id);
    setActiveVocab(null);
    setDialogueIndex(null);
    setMapOpen(false);
  };
  // A hotspot click and the dialogue card both use the bottom-of-canvas
  // overlay slot, so opening one closes the other rather than stacking.
  const selectVocab = (vocab: VocabItem) => {
    setDialogueIndex(null);
    setActiveVocab(vocab);
  };
  const openDialogue = () => {
    setActiveVocab(null);
    setDialogueIndex(0);
  };
  const closeDialogue = () => setDialogueIndex(null);
  const prevLine = () => setDialogueIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
  const nextLine = () =>
    setDialogueIndex((i) => (i === null || !room ? null : Math.min(i + 1, room.dialogue.length - 1)));
  return (
    <div className="min-h-screen bg-[#2E2E2E] text-[#FFF9EC]">
      <div className="sticky top-0 z-20 bg-[#2E2E2E]/90 backdrop-blur border-b border-[#FFF9EC]/10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 py-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#FFF9EC] hover:bg-[#FFF9EC]/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              KLOVERS World 2
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFFF00] text-[#2E2E2E]">
                Hackathon preview
              </span>
            </h1>
            <p className="text-xs text-[#FFF9EC]/70">
              Generated with Meta Muse Image · built into an interactive 3D scene with Three.js
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-4">
        {/* Entrance + room switcher: "Entrance" is the landing courtyard
            (two gates); each room tab is a separate AI Room Lab brief,
            picked from its own A/B variants and built into its own scene —
            not a single room re-skinned. */}
        <div className="flex gap-2">
          <button
            onClick={() => goTo("entrance")}
            className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              view === "entrance"
                ? "bg-[#FFFF00] text-[#2E2E2E] border-[#FFFF00]"
                : "bg-transparent text-[#FFF9EC]/80 border-[#FFF9EC]/20 hover:border-[#FFF9EC]/40"
            }`}
          >
            Entrance
          </button>
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => goTo(r.id)}
              className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                r.id === view
                  ? "bg-[#FFFF00] text-[#2E2E2E] border-[#FFFF00]"
                  : "bg-transparent text-[#FFF9EC]/80 border-[#FFF9EC]/20 hover:border-[#FFF9EC]/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {room ? (
          <>
            <div
              ref={stageRef}
              className={`relative overflow-hidden border border-[#FFF9EC]/10 bg-[#2E2E2E] ${
                isFullscreen ? "h-screen w-screen" : "h-[75vh] rounded-lg"
              }`}
            >
              <Canvas
                key={room.id}
                shadows
                dpr={[1, 2]}
                gl={{ antialias: true }}
                camera={{ position: room.cameraPosition, fov: room.cameraFov }}
              >
                <PostFinish />
                <Suspense fallback={null}>
                  <SlowOrbit>
                    <room.Scene
                      onSelectVocab={selectVocab}
                      activeDialogueSpeaker={currentLine?.speaker ?? null}
                      dialogueTurnKey={dialogueIndex ?? -1}
                    />
                  </SlowOrbit>
                </Suspense>
              </Canvas>
              {!activeVocab && !currentLine && (
                <div className="absolute top-3 left-3 right-14 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
                  {room.hint}
                </div>
              )}
              <button
                onClick={() => setMapOpen((o) => !o)}
                aria-label="Map"
                aria-pressed={mapOpen}
                className="absolute top-3 right-14 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="absolute top-3 right-3 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {mapOpen && <MapOverlay view={view} onGo={goTo} onClose={() => setMapOpen(false)} />}
              {activeVocab && <VocabCard vocab={activeVocab} onClose={() => setActiveVocab(null)} />}
              {currentLine && (
                <DialogueCard
                  line={currentLine}
                  index={dialogueIndex ?? 0}
                  total={room.dialogue.length}
                  onPrev={prevLine}
                  onNext={nextLine}
                  onClose={closeDialogue}
                />
              )}
            </div>

            <div className="rounded-lg border border-[#FFF9EC]/10 bg-[#FFF9EC]/5 p-4 text-sm space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{room.title}</p>
                <Button
                  size="sm"
                  onClick={openDialogue}
                  className="shrink-0 bg-[#FFFF00] text-[#2E2E2E] hover:bg-[#FFFF00]/90"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                  Practice the conversation
                </Button>
              </div>
              <p className="text-[#FFF9EC]/80">{room.body}</p>
              <p className="text-[#FFF9EC]/50 text-xs">
                This is a hackathon tech-demo page, separate from the live KLOVERS World learner
                experience — it does not touch production rooms, progression, or story canon gating.
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              ref={stageRef}
              className={`relative overflow-hidden border border-[#FFF9EC]/10 bg-[#2E2E2E] ${
                isFullscreen ? "h-screen w-screen" : "h-[75vh] rounded-lg"
              }`}
            >
              <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 2.2, 10.5], fov: 52 }}>
                <PostFinish />
                <Suspense fallback={null}>
                  <EntranceScene onEnterRoom={(id) => goTo(id)} />
                </Suspense>
              </Canvas>
              <div className="absolute top-3 left-3 right-14 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
                Use WASD or the arrow keys to walk Adam through a gate, or just click one.
              </div>
              <button
                onClick={() => setMapOpen((o) => !o)}
                aria-label="Map"
                aria-pressed={mapOpen}
                className="absolute top-3 right-14 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="absolute top-3 right-3 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {mapOpen && <MapOverlay view={view} onGo={goTo} onClose={() => setMapOpen(false)} />}
            </div>

            <div className="rounded-lg border border-[#FFF9EC]/10 bg-[#FFF9EC]/5 p-4 text-sm space-y-2">
              <p className="font-semibold">KLOVERS World 2 — the entrance</p>
              <p className="text-[#FFF9EC]/80">
                Adam and Lina are waiting at the gate. Walk through 포장마차 (the street cart) or
                편의점 (the convenience store) with the arrow keys, or click one, to start learning.
              </p>
              <p className="text-[#FFF9EC]/50 text-xs">
                This is a hackathon tech-demo page, separate from the live KLOVERS World learner
                experience — it does not touch production rooms, progression, or story canon gating.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
