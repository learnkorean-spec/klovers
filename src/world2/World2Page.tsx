import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, X } from "lucide-react";
import World2Scene from "./World2Scene";
import ConvenienceStoreScene from "./ConvenienceStoreScene";
import type { VocabItem } from "./shared";

/** Each room AI Room Lab has proposed and a developer has built out: its own
 * concept image, 3D scene, camera framing and vocabulary. Adding a third
 * room (once a third AI Room Lab brief is picked) means one more entry here
 * plus one new Scene file — nothing else in this page changes. */
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
  },
];

/** Speaks the Korean word aloud with the browser's own TTS (ko-KR voice) —
 * no backend, no API key, works everywhere Web Speech is supported. Silently
 * does nothing where it isn't (older Safari/Firefox), rather than erroring. */
function speakKorean(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 0.85;
    window.speechSynthesis.speak(utter);
  } catch {
    // Best-effort: pronunciation audio is a bonus, never block the flashcard on it.
  }
}

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
 * Isolated from the live learner world (src/game/, /world): shows the real
 * concept image generated by Meta's Muse Image model via AI Room Lab
 * (generate-ai-room-concept, see public/assets/world2/concept-pojangmacha.jpg
 * and its generation record in the Project doc), then the same room built
 * out as an interactive 3D Three.js scene below it — the actual Meta →
 * build pipeline, not an aspirational label. Nothing here reads or writes
 * learner progress.
 */
export default function World2Page() {
  const navigate = useNavigate();
  const [activeVocab, setActiveVocab] = useState<VocabItem | null>(null);
  const [roomId, setRoomId] = useState(ROOMS[0].id);
  const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0];
  const selectRoom = (id: string) => {
    setRoomId(id);
    setActiveVocab(null);
  };
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

        <figure className="rounded-lg overflow-hidden border border-[#FFF9EC]/10">
          <img
            key={room.id}
            src={room.conceptImage}
            alt={room.conceptAlt}
            className="w-full h-auto block"
            loading="eager"
          />
          <figcaption className="px-3 py-2 text-xs text-[#FFF9EC]/60 bg-[#FFF9EC]/5">
            Real concept art generated by Meta's Muse Image model (via KLOVERS' AI Room Lab) —
            this is the design the 3D scene below was built from.
          </figcaption>
        </figure>

        <div className="relative h-[60vh] rounded-lg overflow-hidden border border-[#FFF9EC]/10">
          <Canvas
            key={room.id}
            shadows
            dpr={[1, 2]}
            gl={{ antialias: true }}
            camera={{ position: room.cameraPosition, fov: room.cameraFov }}
          >
            <Suspense fallback={null}>
              <SlowOrbit>
                <room.Scene onSelectVocab={setActiveVocab} />
              </SlowOrbit>
            </Suspense>
          </Canvas>
          {!activeVocab && (
            <div className="absolute top-3 left-3 right-3 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
              {room.hint}
            </div>
          )}
          {activeVocab && <VocabCard vocab={activeVocab} onClose={() => setActiveVocab(null)} />}
        </div>

        <div className="rounded-lg border border-[#FFF9EC]/10 bg-[#FFF9EC]/5 p-4 text-sm space-y-2">
          <p className="font-semibold">{room.title}</p>
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
