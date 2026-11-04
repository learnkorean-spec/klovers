import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Map as MapIcon,
  Maximize2,
  MessageCircle,
  Minimize2,
  Volume2,
  X,
} from "lucide-react";
import World2Scene, { DIALOGUE as CART_DIALOGUE, VOCAB as CART_VOCAB } from "./World2Scene";
import ConvenienceStoreScene, {
  DIALOGUE as STORE_DIALOGUE,
  VOCAB as STORE_VOCAB,
} from "./ConvenienceStoreScene";
import EntranceScene from "./EntranceScene";
import PostFinish from "./PostFinish";
import {
  DEFAULT_PLAYER_AVATAR,
  povMode,
  speakKorean,
  TouchPad,
  type DialogueLine,
  type PlayableAvatar,
  type VocabItem,
} from "./shared";

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
  /** The room's "practice the conversation" exchange between the player's
   * chosen character and Cluby — shown in the DialogueCard, line by line,
   * Korean + English reading + English translation. */
  dialogue: DialogueLine[];
  /** Every vocab hotspot this room has — used only to size the "Learned
   * X/Y" progress chip (see `learnedIds` in World2Page below), not to
   * render anything here; each room's own Scene still owns its own
   * hotspot placement and click handling. */
  vocab: VocabItem[];
};

const ROOMS: Room[] = [
  {
    id: "cart",
    label: "Street Cart",
    conceptImage: "/assets/world2/concept-pojangmacha.jpg",
    conceptAlt:
      "Meta Muse Image concept render: Adam and Lina at a lantern-lit Korean street food cart at dusk, with Cluby seated beside them",
    // Re, 4 Nov 2026: "game looks so bad" — found live on kloversegy.com/world2
    // that Cluby and the foreground stools sat closer to this camera than
    // anything else in the shot, so perspective blew them up into oversized,
    // frame-cropping shapes crowding the characters and the vocab card UI.
    // Tried pulling the camera back + narrowing the FOV first; it barely
    // helped (the near props shrink at nearly the same rate as everything
    // else when they're this close), so the actual fix is in World2Scene.tsx
    // itself: the stools moved behind the characters (z 1.5→0.85, nested at
    // the counter instead of standing proud of it) and Cluby moved off to
    // the side entirely, out of this camera's close foreground. Camera left
    // at its original framing.
    cameraPosition: [2.6, 1.9, 3.8],
    cameraFov: 42,
    Scene: World2Scene,
    hint: "Use WASD or the arrow keys to walk {player} around. Tap the skewers, tteokbokki, kimbap, or the menu board to learn the word.",
    title: "A warm Korean street food cart at dusk (포장마차)",
    body:
      "{player} orders at the counter while Cluby watches from a stool, calling out hints when a new word comes up. Tap a food item or the menu board above to hear and learn the word. Vocabulary: 어묵 (fish cake), 떡볶이 (spicy rice cakes), 김밥 (seaweed rice rolls), 주세요 (please give me), 얼마예요? (how much is it?).",
    dialogue: CART_DIALOGUE,
    vocab: CART_VOCAB,
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
    hint: "Use WASD or the arrow keys to walk {player} around. Tap the shelf, fridge, checkout, or a price tag to learn the word.",
    title: "A late-night Korean convenience store (편의점)",
    body:
      "{player} picks snacks and drinks from the shelves while Cluby curls up by the door, cheering {playerObj} on as new words come up. Tap the shelf, the fridge, the register, or a price tag above to hear and learn the word. Vocabulary: 과자 (snack), 음료수 (drink), 얼마예요? (how much is it?), 하나/둘 (one/two), 계산대 (checkout counter).",
    dialogue: STORE_DIALOGUE,
    vocab: STORE_VOCAB,
  },
];

/** Fills a room's `hint`/`body` template with whichever name/pronoun fits
 * the learner's current character choice — `{player}` (name) and
 * `{playerObj}` (object pronoun: "him"/"her"), so the copy stays correct
 * whichever of Adam/Lina the visitor is walking as (see `playerAvatar`
 * below and shared.tsx's `PlayableAvatar`).
 *
 * Re, 4 Nov 2026: dropped `{companion}` — the second human learner no
 * longer appears in any World2 scene (see shared.tsx's `PlayableAvatar`
 * doc comment), so no template references it any more. */
function fillNames(text: string, playerAvatar: PlayableAvatar): string {
  const playerName = playerAvatar === "adam" ? "Adam" : "Lina";
  const playerObj = playerAvatar === "adam" ? "him" : "her";
  return text.replaceAll("{player}", playerName).replaceAll("{playerObj}", playerObj);
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
 * one-off "talk" animation (or, for Cluby, a little reaction hop) on that
 * character in the scene (see activeDialogueSpeaker/dialogueTurnKey wiring
 * in World2Page below). */
function DialogueCard({
  line,
  index,
  total,
  playerName,
  onPrev,
  onNext,
  onClose,
}: {
  line: DialogueLine;
  index: number;
  total: number;
  /** "Adam" or "Lina" — whichever the visitor is currently walking as, so a
   * `line.speaker === "player"` line is labelled with their actual name
   * rather than a generic "Player". */
  playerName: string;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const speakerLabel = line.speaker === "player" ? playerName : "Cluby";
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

/** Lets the visitor choose which canon learner they're walking as this
 * visit — Adam or Lina, the other stands in as a companion throughout the
 * entrance and both rooms. Re, 4 Nov 2026: "the visitor is either lena or
 * adam" — World2 previously always made Adam the walkable character with
 * Lina as a fixed companion everywhere, unlike the live /world game, which
 * already lets the learner pick which of the two they play as (see
 * src/game/environment/Onboarding.tsx's WelcomeCard / characters.ts). Kept
 * as a visible, always-switchable pair of pills (not a one-time modal)
 * rather than an onboarding step, so it's visible at a glance, doesn't
 * block the first render, and can be changed mid-visit without losing any
 * progress (the "Learned X/Y" tracking is keyed by room+vocab id, not by
 * which character is walking). */
function CharacterPicker({
  playerAvatar,
  onChange,
}: {
  playerAvatar: PlayableAvatar;
  onChange: (avatar: PlayableAvatar) => void;
}) {
  const pill = (active: boolean) =>
    `text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
      active
        ? "bg-[#FFFF00] text-[#2E2E2E] border-[#FFFF00]"
        : "bg-transparent text-[#FFF9EC]/80 border-[#FFF9EC]/20 hover:border-[#FFF9EC]/40"
    }`;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#FFF9EC]/60">Playing as:</span>
      <button onClick={() => onChange("adam")} aria-pressed={playerAvatar === "adam"} className={pill(playerAvatar === "adam")}>
        Adam
      </button>
      <button onClick={() => onChange("lina")} aria-pressed={playerAvatar === "lina"} className={pill(playerAvatar === "lina")}>
        Lina
      </button>
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
 * up how the pipeline worked. This page tracks a per-visit "Learned X/Y"
 * progress chip (see `learnedIds`/`dialogueSeen` below) entirely in local
 * component state — nothing is written to Supabase or any real learner
 * progress table; it resets on reload, same as everything else here.
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
  // "has the learner actually seen this yet" — keyed `${roomId}:${vocabId}`
  // so the two rooms' own vocab ids (already distinct) never collide, kept
  // for the whole visit (not reset on switching rooms) so the "Learned
  // X/Y" chip below reflects real progress, not just the room on screen.
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set());
  const [dialogueSeen, setDialogueSeen] = useState<Set<string>>(new Set());
  // Mirrors the `povMode` singleton in shared.tsx (see FollowCamera's doc
  // comment there) purely so this button's own icon re-renders on toggle;
  // FollowCamera reads `povMode.firstPerson` directly every frame.
  const [firstPerson, setFirstPerson] = useState(false);
  // Which canon learner the visitor is walking as this visit — see
  // CharacterPicker's doc comment above.
  const [playerAvatar, setPlayerAvatar] = useState<PlayableAvatar>(DEFAULT_PLAYER_AVATAR);
  const togglePov = () => {
    povMode.firstPerson = !povMode.firstPerson;
    setFirstPerson(povMode.firstPerson);
  };
  // Never leave the next page (or a later remount) stuck in first-person.
  useEffect(() => () => {
    povMode.firstPerson = false;
  }, []);
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
    if (room) {
      const key = `${room.id}:${vocab.id}`;
      setLearnedIds((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    }
  };
  const openDialogue = () => {
    setActiveVocab(null);
    setDialogueIndex(0);
    if (room) setDialogueSeen((prev) => (prev.has(room.id) ? prev : new Set(prev).add(room.id)));
  };
  const closeDialogue = () => setDialogueIndex(null);
  const prevLine = () => setDialogueIndex((i) => (i === null ? null : Math.max(i - 1, 0)));
  const nextLine = () =>
    setDialogueIndex((i) => (i === null || !room ? null : Math.min(i + 1, room.dialogue.length - 1)));
  return (
    // World2 is an English-narrated hackathon tech demo (hint text, room
    // descriptions, dialogue/vocab cards) — explicitly LTR so it renders
    // correctly even when the site's own dir is "rtl" for an Arabic-locale
    // visitor (confirmed live on kloversegy.com: without this, English
    // paragraphs right-align and wrap oddly, e.g. trailing punctuation
    // lands at the start of a line). The vocab card's own Arabic
    // translation line already sets its own dir="rtl" locally, so it's
    // unaffected by this page-level override.
    <div dir="ltr" className="min-h-screen bg-[#2E2E2E] text-[#FFF9EC]">
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
        {/* Overall progress across both rooms — visible from the entrance
            too, so a learner sees where they stand before picking a gate,
            not only once they're already inside a room. */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-[#FFF9EC]/60">
            Learned {ROOMS.reduce((n, r) => n + r.vocab.filter((v) => learnedIds.has(`${r.id}:${v.id}`)).length, 0)}/
            {ROOMS.reduce((n, r) => n + r.vocab.length, 0)} words total across both places
          </p>
          <CharacterPicker playerAvatar={playerAvatar} onChange={setPlayerAvatar} />
        </div>
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
                  {/* Re, 4 Nov 2026: "fix and make it as possible same
                      looking and function of world1" — the live /world
                      game never idly moves its own camera or scene; it only
                      moves when the learner does (ThirdPersonCamera, driven
                      by real player input). World2 used to wrap every room
                      in a constant slow sway ("SlowOrbit") "so the scene
                      reads as a real 3D room, not a static render" — but
                      that meant every hotspot's on-screen position was
                      always slowly drifting, on top of already being a
                      small target (see Hotspot's own hitSize/hitCenter fix
                      in shared.tsx), making them harder to hit than they
                      needed to be. Removed: the room now holds still except
                      when the learner actually moves, same as World1. */}
                  <room.Scene
                    playerAvatar={playerAvatar}
                    onSelectVocab={selectVocab}
                    activeDialogueSpeaker={currentLine?.speaker ?? null}
                    dialogueTurnKey={dialogueIndex ?? -1}
                  />
                </Suspense>
              </Canvas>
              {!activeVocab && !currentLine && (
                <div className="absolute top-3 left-3 right-14 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
                  {fillNames(room.hint, playerAvatar)}
                </div>
              )}
              <button
                onClick={() => setMapOpen((o) => !o)}
                aria-label="Map"
                aria-pressed={mapOpen}
                className="absolute top-3 right-24 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={togglePov}
                aria-label={firstPerson ? "Switch to third-person view" : "Switch to first-person (character POV) view"}
                aria-pressed={firstPerson}
                className="absolute top-3 right-14 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {firstPerson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="absolute top-3 right-3 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {mapOpen && <MapOverlay view={view} onGo={goTo} onClose={() => setMapOpen(false)} />}
              <TouchPad />
              {activeVocab && <VocabCard vocab={activeVocab} onClose={() => setActiveVocab(null)} />}
              {currentLine && (
                <DialogueCard
                  line={currentLine}
                  index={dialogueIndex ?? 0}
                  total={room.dialogue.length}
                  playerName={playerAvatar === "adam" ? "Adam" : "Lina"}
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF9EC]/10 text-[#FFF9EC]/80">
                  Learned {room.vocab.filter((v) => learnedIds.has(`${room.id}:${v.id}`)).length}/
                  {room.vocab.length} words
                </span>
                {dialogueSeen.has(room.id) && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF9EC]/10 text-[#FFF9EC]/80">
                    ✓ Conversation practiced
                  </span>
                )}
              </div>
              <p className="text-[#FFF9EC]/80">{fillNames(room.body, playerAvatar)}</p>
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
                  <EntranceScene playerAvatar={playerAvatar} onEnterRoom={(id) => goTo(id)} />
                </Suspense>
              </Canvas>
              <div className="absolute top-3 left-3 right-14 md:right-auto md:max-w-xs rounded-md bg-[#2E2E2E]/80 backdrop-blur px-3 py-2 text-xs text-[#FFF9EC]/80 pointer-events-none">
                {fillNames("Use WASD or the arrow keys to walk {player} through a gate, or just click one.", playerAvatar)}
              </div>
              <button
                onClick={() => setMapOpen((o) => !o)}
                aria-label="Map"
                aria-pressed={mapOpen}
                className="absolute top-3 right-24 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={togglePov}
                aria-label={firstPerson ? "Switch to third-person view" : "Switch to first-person (character POV) view"}
                aria-pressed={firstPerson}
                className="absolute top-3 right-14 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {firstPerson ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                className="absolute top-3 right-3 rounded-md bg-[#2E2E2E]/80 backdrop-blur p-2 text-[#FFF9EC]/80 hover:text-[#FFF9EC] hover:bg-[#2E2E2E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              {mapOpen && <MapOverlay view={view} onGo={goTo} onClose={() => setMapOpen(false)} />}
              <TouchPad />
            </div>

            <div className="rounded-lg border border-[#FFF9EC]/10 bg-[#FFF9EC]/5 p-4 text-sm space-y-2">
              <p className="font-semibold">KLOVERS World 2 — the entrance</p>
              <p className="text-[#FFF9EC]/80">
                {fillNames(
                  "You're walking as {player}, with Cluby close by. Walk through 포장마차 (the street cart) or 편의점 (the convenience store) with the arrow keys, or click one, to start learning.",
                  playerAvatar,
                )}
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
