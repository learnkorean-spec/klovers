import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle, Volume2, X } from "lucide-react";
import World2Scene, { DIALOGUE as CART_DIALOGUE } from "./World2Scene";
import ConvenienceStoreScene, { DIALOGUE as STORE_DIALOGUE } from "./ConvenienceStoreScene";
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
          className="text-[#FFF9EC]/50 hover:text-[#FFF9EC] shrink-0"
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
          className="text-[#FFF9EC]/50 hover:text-[#FFF9EC] shrink-0"
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

/** Camera gently orbits so the scene reads as a real 3D room, not a static render. */
function SlowOrbit({ children }: { children: React.ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.35;
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
  const [activeVocab, setActiveVocab] = useState<VocabItem | null>(null);
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  // null = dialogue card closed; otherwise the index of the line showing.
  const [dialogueIndex, setDialogueIndex] = useState<number | null>(null);
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];
  const currentLine = dialogueIndex !== null ? room.dialogue[dialogueIndex] : null;
  const selectRoom = (id: string) => {
    setRoomId(id);
    setActiveVocab(null);
    setDialogueIndex(null);
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
    setDialogueIndex((i) => (i === null ? null : Math.min(i + 1, room.dialogue.length - 1)));
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
        {/* Room switcher: each tab is a separate AI Room Lab brief, picked
            from its own A/B variants and built into its own scene — not a
            single room re-skinned. */}
        <div className="flex gap-2">
          {ROOMS.map((r) => (
            <button
              key={r.id}
              onClick={() => selectRoom(r.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                r.id === roomId
                  ? "bg-[#FFFF00] text-[#2E2E2E] border-[#FFFF00]"
                  : "bg-transparent text-[#FFF9EC]/80 border-[#FFF9EC]/20 hover:border-[#FFF9EC]/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="relative h-[75vh] rounded-lg overflow-hidden border border-[#FFF9EC]/10">
          <Canvas
            key={room.id}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ position: room.cameraPosition, fov: room.cameraFov }}
          >
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
            <div className="absolute top-3 left-3 right-3 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
              {room.hint}
            </div>
          )}
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
      </div>
    </div>
  );
}
