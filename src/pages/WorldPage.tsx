import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { isClubyAwake } from "@/lib/clubyAwake";
import { WORLD_COPY, type WorldLang } from "@/game/config/copy";
import { INTERACTABLES, shopOf, VILLAGE_LETTERS, type Interactable, type QuizId, type ShopId } from "@/game/config/interactions";
import { tourSpot, VILLAGE, type InfoId, type NoticeKey, type RoomId } from "@/game/config/rooms";
import { DEFAULT_AVATAR, isAvatarId, type AvatarId } from "@/game/player/characters";
import { useWorldAccess } from "@/game/systems/useWorldAccess";
import { hasWebGL, isTouchFirst } from "@/game/systems/webgl";
import { loadWorldState, saveWorldState, type WorldState } from "@/game/systems/worldState";
import InteractionCard, { type CardKind } from "@/game/ui/InteractionCard";
import DialogueBubble, { type Bubble } from "@/game/ui/DialogueBubble";
import WorldHud, { type Speech } from "@/game/ui/WorldHud";
import { ControlsCard, DiscoveryToast, FoundToast, HelpButton, LettersChip, ObjectiveChip, WayHint, WelcomeCard, type TutorialStep, type WorldView } from "@/game/ui/Onboarding";
import { cheer } from "@/game/systems/reactions";
import { MISSIONS, missionTarget, type MissionId } from "@/game/config/missions";
import { FullMap, MiniMap, MissionChip, MissionsButton, MissionsCard, type Pose } from "@/game/ui/MapAndMissions";
import { watercolorMode } from "@/game/systems/styleMode";
import { currentObjective, type ObjectiveId } from "@/game/config/objectives";
import type { DiscoveryKey } from "@/game/config/discoveries";
// Type-only: erased at build time, so the 3D chunk stays lazy.
import type { SpeechKey, WorldApi } from "@/game/World";

const AVATAR_KEY = "klovers-world-avatar";
const VIEW_KEY = "klovers-world-view";

/** Remembered view (first person by default) — a per-browser convenience. */
function readView(): WorldView {
  try {
    return localStorage.getItem(VIEW_KEY) === "behind" ? "behind" : "eyes";
  } catch {
    return "eyes";
  }
}

/** Each place's number on its arrival card (the order a learner meets them). */
/** A room's number on the road (the full map); Klovers House stands beside it, unnumbered. */
const ROOM_NUMBER: Partial<Record<RoomId, number>> = {
  courtyard: 1,
  "hangul-village": 2,
  "vocabulary-market": 3,
  hub: 4,
  "conversation-cafe": 5,
  "culture-street": 6,
  "seoul-journey": 7,
};


/** Where each Klovers House board leads on the site. */
const INFO_ROUTE: Record<InfoId, (signedIn: boolean) => string> = {
  about: () => "/about",
  courses: () => "/courses",
  trial: () => "/free-trial",
  placement: () => "/placement-test",
  textbook: (signedIn) => (signedIn ? "/textbook" : "/hangul-book"),
  shop: () => "/shop",
  games: () => "/games",
  blog: () => "/blog",
  topik: () => "/topik-exam-preparation",
  scholarships: () => "/scholarships",
};

/** Remembered character choice — a per-browser convenience only. */
function readAvatar(): AvatarId {
  try {
    const v = localStorage.getItem(AVATAR_KEY);
    return isAvatarId(v) ? v : DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
}

/**
 * /world — the KLOVERS World prototype.
 *
 * This shell is small and ships in its own route chunk. The 3D scene
 * (three.js + React Three Fiber, src/game/World.tsx) is a second lazy chunk
 * requested only after the WebGL check passes, so no other page ever pays
 * for it. If WebGL is missing or the scene throws, the learner gets a calm
 * message and a way back; the rest of the site is untouched.
 */
const World = lazy(() => import("@/game/World"));

interface BoundaryProps {
  fallback: (retry: () => void) => ReactNode;
  children: ReactNode;
}

/** Catches a failed chunk download or a WebGL error inside the scene only. */
class WorldBoundary extends Component<BoundaryProps, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("[KLOVERS World] scene failed to load", error);
  }
  retry = () => this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }));
  render() {
    if (this.state.failed) return this.props.fallback(this.retry);
    return <div key={this.state.attempt} className="absolute inset-0">{this.props.children}</div>;
  }
}

function LoadingVeil({ lang, visible, onExit }: { lang: WorldLang; visible: boolean; onExit: () => void }) {
  const copy = WORLD_COPY[lang];
  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-charcoal px-6 text-center text-ivory transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* The dormant egg, drawn in CSS: ivory shell, green clover mark. */}
      <div
        aria-hidden="true"
        className="relative h-24 w-[4.5rem] animate-pulse bg-ivory shadow-[0_0_40px_-8px_rgba(255,255,0,0.35)] motion-reduce:animate-none"
        style={{ borderRadius: "50% 50% 46% 46% / 60% 60% 40% 40%" }}
      >
        <span className="absolute left-1/2 top-[55%] grid -translate-x-1/2 -translate-y-1/2 grid-cols-2 gap-px">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-klovers-green" />
          ))}
        </span>
      </div>
      <p className="font-display text-xl font-bold">{copy.loadingTitle}</p>
      <p className="max-w-sm text-sm text-ivory/75">{copy.loadingLine}</p>
      {/* Always a way out, even if the scene never finishes loading. */}
      <button
        type="button"
        onClick={onExit}
        tabIndex={visible ? 0 : -1}
        className="mt-2 text-sm font-semibold text-ivory underline underline-offset-4"
      >
        {copy.exit}
      </button>
    </div>
  );
}

function Notice({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-charcoal px-6 text-center text-ivory">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="max-w-md text-sm text-ivory/80">{line}</p>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}

const WorldPage = () => {
  const { language } = useLanguage();
  const lang: WorldLang = language === "ar" ? "ar" : "en";
  const copy = WORLD_COPY[lang];
  const navigate = useNavigate();
  const location = useLocation();

  useSEO({ title: copy.seoTitle, description: copy.seoDescription, canonical: "https://kloversegy.com/world", noindex: true });

  const webgl = useMemo(() => hasWebGL(), []);
  const isTouch = useMemo(() => isTouchFirst(), []);
  const [ready, setReady] = useState(false);
  const [looked, setLooked] = useState(false);
  const [moved, setMoved] = useState(false);
  const [avatar, setAvatar] = useState<AvatarId>(readAvatar);
  const access = useWorldAccess();
  const [saved, setSaved] = useState<WorldState>(loadWorldState);
  const [fading, setFading] = useState(false);
  const [room, setRoom] = useState<RoomId | null>(null);
  const [focus, setFocus] = useState<Interactable | null>(null);
  /** Guidance: the few usable things nearby, each with a tappable sign. */
  const [nearby, setNearby] = useState<Interactable[]>([]);
  const beaconEls = useRef(new Map<string, HTMLElement>());
  const [speechKey, setSpeechKey] = useState<SpeechKey | null>(null);
  const [sequence, setSequence] = useState(false);
  const [card, setCard] = useState<{ kind: CardKind; notice?: NoticeKey; quiz?: QuizId; shop?: ShopId; shopPick?: string } | null>(null);
  /** The shop thing last chosen: it hops in the scene. */
  const [shopChosen, setShopChosen] = useState<{ item: string; at: number } | null>(null);
  // A person's line or a word: shown over the world without stopping it.
  const [bubble, setBubble] = useState<(Bubble & { at: string }) | null>(null);
  const [found, setFound] = useState<{ text: string; ko?: string } | null>(null);
  const foundTimer = useRef<number>();
  const [way, setWay] = useState(false);
  const wayShown = useRef(false);
  const wayTimer = useRef<number>();
  const [idle, setIdle] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomId>("courtyard");
  const [helpOpen, setHelpOpen] = useState(false);
  // Returning learners who finished the tutorial never see it again unasked.
  const [tutorialGone, setTutorialGone] = useState(() => loadWorldState().tutorialDone);
  const [justDone, setJustDone] = useState<ObjectiveId | null>(null);
  const [toast, setToast] = useState<DiscoveryKey | null>(null);
  const toastTimer = useRef<number>();
  const doneTimer = useRef<number>();
  const [tipDismissed, setTipDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("klovers-world-landscape-tip") === "1";
    } catch {
      return false;
    }
  });
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  // Where to open: back where the learner left for the site's lessons or
  // games (only rooms open to everyone), else the courtyard. Read once.
  const [startRoom] = useState<RoomId>(() => {
    const r = loadWorldState().lastRoom;
    return r === "hangul-village" || r === "hub" || r === "klovers-house" ? r : "courtyard";
  });
  const [locked, setLocked] = useState(false);
  const api = useRef<WorldApi | null>(null);
  const bannerTimer = useRef<number>();

  // Cluby is shown only once he has really hatched (the dashboard's egg
  // stage, recorded per browser by lib/clubyAwake) — or in an admin preview.
  const clubyAwake = access.preview || (access.signedIn && isClubyAwake());

  const [view, setView] = useState<WorldView>(readView);
  const chooseView = useCallback((v: WorldView) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* private mode: this visit only */
    }
  }, []);

  const chooseAvatar = useCallback((id: AvatarId) => {
    setAvatar(id);
    try {
      localStorage.setItem(AVATAR_KEY, id);
    } catch {
      /* private mode: the choice lasts for this visit only */
    }
  }, []);

  // An admin preview never writes anything: it is a look, not progress.
  // Always merged onto the latest state, so two quick saves never undo each other.
  const savedRef = useRef(saved);
  const save = useCallback(
    (next: WorldState) => {
      savedRef.current = next;
      setSaved(next);
      if (!access.preview) saveWorldState(next);
    },
    [access.preview],
  );
  const patch = useCallback((p: Partial<WorldState>) => save({ ...savedRef.current, ...p }), [save]);

  /** Mark objectives done; the chip shows "complete" for a moment. */
  const complete = useCallback(
    (id: ObjectiveId, extra: Partial<WorldState> = {}) => {
      const cur = savedRef.current;
      if (cur.objectivesDone.includes(id)) {
        if (Object.keys(extra).length) patch(extra);
        return;
      }
      patch({ ...extra, objectivesDone: [...cur.objectivesDone, id] });
      setJustDone(id);
    },
    [patch],
  );

  // "Objective complete" stays a moment once nothing covers it (a talk card
  // may still be open when the objective finishes).
  useEffect(() => {
    if (!justDone || card) return;
    window.clearTimeout(doneTimer.current);
    doneTimer.current = window.setTimeout(() => setJustDone(null), 3200);
  }, [justDone, card]);

  const discover = useCallback(
    (k: DiscoveryKey) => {
      if (savedRef.current.discovered.includes(k)) return;
      patch({ discovered: [...savedRef.current.discovered, k] });
      setToast(k);
      window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(null), 5200);
    },
    [patch],
  );
  useEffect(
    () => () => {
      window.clearTimeout(toastTimer.current);
      window.clearTimeout(doneTimer.current);
      window.clearTimeout(foundTimer.current);
      window.clearTimeout(wayTimer.current);
    },
    [],
  );

  /** A small "found" note that fades on its own. */
  const note = useCallback((text: string, ko?: string) => {
    setFound({ text, ko });
    window.clearTimeout(foundTimer.current);
    foundTimer.current = window.setTimeout(() => setFound(null), 2600);
  }, []);

  /* ── Missions and the map ── */
  const [missionsOpen, setMissionsOpen] = useState(false);
  /** The tour board the camera is framing (read up close), if any. */
  const readingRef = useRef<string | null>(null);
  const [reading, setReading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const activeMission = saved.mission ? MISSIONS.find((m) => m.id === saved.mission?.id) ?? null : null;
  const isOpenRoom = useCallback((r: RoomId) => access.open.has(r), [access.open]);
  const pose = useCallback((): Pose | null => api.current?.pose() ?? null, []);
  const stepsLeft = useMemo(
    () => new Set(activeMission ? activeMission.steps.filter((id) => !(saved.mission?.done ?? []).includes(id)) : []),
    [activeMission, saved.mission],
  );
  const targetRef = useRef<{ x: number; z: number } | null>(null);
  /** The place of the next thing the mission needs (the full map marks it). */
  const missionRoom = useMemo(() => {
    if (!activeMission) return null;
    const next = activeMission.steps.find((id) => stepsLeft.has(id));
    return next ? (INTERACTABLES.find((i) => i.id === next)?.room ?? null) : null;
  }, [activeMission, stepsLeft]);
  const [marker, setMarker] = useState<{ x: number; z: number } | null>(null);
  const remaining = useRef(0);
  /** A card or the map is open: the race clock waits (set where `paused` is known). */
  const pausedRef = useRef(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const startMission = useCallback(
    (id: MissionId) => {
      const m = MISSIONS.find((x) => x.id === id);
      if (!m) return;
      patch({ mission: { id, done: [] } });
      remaining.current = m.seconds ?? 0;
      setTimeLeft(m.seconds ?? null);
      setMissionsOpen(false);
    },
    [patch],
  );
  const stopMission = useCallback(() => {
    patch({ mission: null });
    setTimeLeft(null);
    targetRef.current = null;
    setMarker(null);
  }, [patch]);

  /** Something was used: if it is a step of the mission being played, tick it off. */
  const markStep = useCallback(
    (id: string) => {
      const cur = savedRef.current.mission;
      if (!cur) return;
      const m = MISSIONS.find((x) => x.id === cur.id);
      if (!m || !m.steps.includes(id) || cur.done.includes(id)) return;
      const done = [...cur.done, id];
      if (done.length < m.steps.length) {
        patch({ mission: { id: cur.id, done } });
        return;
      }
      const best = { ...savedRef.current.bestTimes };
      if (m.seconds) {
        const t = Math.max(1, Math.round(m.seconds - remaining.current));
        best[m.id] = Math.min(best[m.id] ?? Infinity, t);
      }
      const finished = savedRef.current.missionsDone.includes(m.id) ? savedRef.current.missionsDone : [...savedRef.current.missionsDone, m.id];
      patch({ mission: null, missionsDone: finished, bestTimes: best });
      setTimeLeft(null);
      targetRef.current = null;
      setMarker(null);
      note(`${copy.missionUi.complete} · ${copy.missions[m.id].title}`);
      api.current?.celebrate();
    },
    [patch, note, copy],
  );

  // Four times a second: where the mission marker points, and the race clock
  // (it runs only in the race's own place, and stops while a card is open).
  useEffect(() => {
    if (!activeMission) return;
    let last = performance.now();
    const t = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const p = api.current?.pose();
      if (!p) return;
      const done = savedRef.current.mission?.done ?? [];
      const tg = missionTarget(activeMission, done, p.room, p.x, p.z, isOpenRoom);
      targetRef.current = tg;
      setMarker((old) => (tg && old && Math.abs(old.x - tg.x) < 0.05 && Math.abs(old.z - tg.z) < 0.05 ? old : tg ? { x: tg.x, z: tg.z } : null));
      if (activeMission.seconds && p.room === activeMission.room && !document.hidden) {
        if (!pausedRef.current) remaining.current -= dt;
        setTimeLeft(Math.max(0, Math.ceil(remaining.current)));
        if (remaining.current <= 0) {
          patch({ mission: null });
          setTimeLeft(null);
          targetRef.current = null;
          setMarker(null);
          note(copy.missionUi.timeUp);
        }
      }
    }, 250);
    return () => window.clearInterval(t);
  }, [activeMission, isOpenRoom, patch, note, copy]);

  /** A market word met: its stall sign goes up (exploration only). */
  const learnWord = useCallback(
    (ko: string) => {
      const cur = savedRef.current;
      if (cur.words.includes(ko)) return;
      patch({ words: [...cur.words, ko] });
      note(copy.found.word, ko);
    },
    [patch, note, copy],
  );

  /** A shop thing chosen: its word is learned, it hops, Cluby is pleased. */
  const pickShop = useCallback(
    (ko: string) => {
      learnWord(ko);
      setShopChosen({ item: ko, at: performance.now() });
      api.current?.celebrate();
    },
    [learnWord],
  );

  /** One of the village's three letters found; all three: Cluby is delighted. */
  const findLetter = useCallback(
    (l: string) => {
      const cur = savedRef.current;
      if (cur.letters.includes(l)) return;
      const letters = [...cur.letters, l];
      patch({ letters });
      if (VILLAGE_LETTERS.every((v) => letters.includes(v))) api.current?.celebrate("letters");
      else note(copy.found.letter, l);
    },
    [patch, note, copy],
  );

  /** After the egg: name where the path goes next, and Cluby points there. */
  const showWay = useCallback(() => {
    if (wayShown.current) return;
    wayShown.current = true;
    api.current?.point(0, -9);
    setWay(true);
    window.clearTimeout(wayTimer.current);
    wayTimer.current = window.setTimeout(() => setWay(false), 4500);
  }, []);

  // Consume the resume point once, so a later fresh visit starts at the gate.
  useEffect(() => {
    if (startRoom !== "courtyard") patch({ lastRoom: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onResize = () => setPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Room name card: shown for a few seconds after each arrival.
  const [introBanner, setIntroBanner] = useState(false);
  const arrive = useCallback((id: RoomId, intro = false) => {
    setIntroBanner(intro);
    setCurrentRoom(id);
    setBubble(null);
    setWay(false);
    if (id === "hub") complete("findHub");
    setRoom(id);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setRoom(null), 2800);
  }, [complete]);
  useEffect(() => () => window.clearTimeout(bannerTimer.current), []);

  // Where to return: the page the learner came from, else the games hub.
  const from = (location.state as { from?: string } | null)?.from;
  const exit = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock();
    navigate(from && from.startsWith("/") && !from.startsWith("/world") ? from : "/games");
  }, [from, navigate]);

  /** Use whatever is within reach (E, Enter, the prompt, or the round button). */
  const interact = useCallback(() => {
    const it = focus;
    if (card || sequence) return;
    // E again on what is already open puts the note away.
    if (bubble) {
      setBubble(null);
      if (!it || it.id === bubble.at) return;
    }
    if (!it) return;
    markStep(it.id);
    if (document.pointerLockElement && it.kind !== "say" && it.kind !== "learn" && it.kind !== "talk" && it.kind !== "cluby") document.exitPointerLock();
    if (it.npc) cheer(it.npc, 1200);
    switch (it.kind) {
      case "egg":
        api.current?.pulseEgg();
        if (clubyAwake && !saved.hatchSeen) api.current?.hatch();
        else setCard({ kind: "egg" });
        break;
      case "letter":
        setCard({ kind: "letter" });
        if (it.letter) findLetter(it.letter);
        // Reading the sign counts only once the characters have been met, so
        // the objectives stay in their order.
        if (savedRef.current.objectivesDone.includes("meetCharacters")) complete("readSign");
        break;
      case "learn":
        if (it.learn) setBubble({ kind: "learn", id: it.learn, at: it.id });
        if (it.word) learnWord(it.word);
        if (it.letter) findLetter(it.letter);
        break;
      case "quiz":
        if (it.quiz) setCard({ kind: "quiz", quiz: it.quiz });
        if (it.letter) findLetter(it.letter);
        break;
      case "say":
        if (it.say) setBubble({ kind: "say", id: it.say, at: it.id });
        break;
      case "info":
        if (it.info) setBubble({ kind: "info", id: it.info, at: it.id });
        break;
      case "tour":
        // Read: walk up and hold the board close; again lets it go.
        if (it.tour) {
          const again = readingRef.current === it.tour;
          readingRef.current = again ? null : it.tour;
          setReading(!again);
          api.current?.tourTo(again ? null : it.tour);
        }
        break;
      case "talk":
        if (it.who) {
          setBubble({ kind: "talk", who: it.who, at: it.id });
          const cur = savedRef.current;
          const met = cur.met.includes(it.who) ? cur.met : [...cur.met, it.who];
          if (met.includes("friend") && met.includes("minsu")) complete("meetCharacters", { met });
          else if (met !== cur.met) patch({ met });
        }
        break;
      case "cluby":
        api.current?.clubyTalk();
        break;
      case "word":
        // Once the sign is back up, the baker simply thanks the learner.
        if (savedRef.current.breadSign) setBubble({ kind: "say", id: "baker", at: it.id });
        else setCard({ kind: "word" });
        break;
      case "shop":
        setCard({ kind: "shop", shop: it.shop });
        break;
      case "locked":
        setCard({ kind: "locked", notice: it.notice });
        break;
      case "door":
        if (it.to && it.arrive) api.current?.enter(it.to, it.arrive);
        break;
      case "link":
        // Out to the site; the world reopens here on the way back.
        if (document.pointerLockElement) document.exitPointerLock();
        patch({ lastRoom: it.room });
        navigate(it.href ?? (it.link === "games" ? "/games" : access.signedIn ? "/textbook" : "/courses"));
        break;
    }
  }, [focus, card, sequence, bubble, clubyAwake, saved, patch, complete, navigate, access.signedIn, findLetter, learnWord, markStep]);

  // A Klovers House board: out to that page; the world reopens in the house.
  const openInfo = useCallback(
    (id: InfoId) => {
      if (document.pointerLockElement) document.exitPointerLock();
      patch({ lastRoom: "klovers-house" });
      navigate(INFO_ROUTE[id](access.signedIn));
    },
    [patch, navigate, access.signedIn],
  );

  // Tap-to-go: arriving at a tapped sign uses the thing at once.
  const focusNow = useRef(focus);
  focusNow.current = focus;
  const interactNow = useRef(interact);
  interactNow.current = interact;
  const arrived = useCallback((id: string) => {
    window.setTimeout(() => {
      if (focusNow.current?.id === id) interactNow.current();
    }, 160);
  }, []);

  // ── The Klovers tour: an exhibition along the village street (environment/TourExhibit) ──
  /** Standing at a board counts it as read; all six read, the tour is done. */
  const tourSeen = useCallback(
    (stop: string) => {
      const cur = savedRef.current;
      if (cur.tourSeen.includes(stop)) return;
      const seen = [...cur.tourSeen, stop];
      patch({ tourSeen: seen, tourDone: cur.tourDone || seen.length >= VILLAGE.tour.length });
    },
    [patch],
  );
  /** The yellow marker walks the learner from board to board until all are read (a mission's marker wins). */
  const nextBoard = currentRoom === "hangul-village" && !saved.tourDone ? VILLAGE.tour.find((b) => !saved.tourSeen.includes(b.id)) : undefined;
  const tourMarker = useMemo(() => (nextBoard ? tourSpot(nextBoard) : null), [nextBoard]);
  useEffect(() => {
    if (currentRoom !== "hangul-village") {
      readingRef.current = null;
      setReading(false);
    }
  }, [currentRoom]);
  // Reading ends when the learner walks off (the camera lets go by itself).
  useEffect(() => {
    if (!reading) return;
    const t = window.setInterval(() => {
      const p = api.current?.pose();
      const b = VILLAGE.tour.find((x) => x.id === readingRef.current);
      if (!p || !b) return;
      const at = tourSpot(b);
      if (Math.hypot(p.x - at.x, p.z - at.z) > 1.8) {
        readingRef.current = null;
        setReading(false);
      }
    }, 300);
    return () => window.clearInterval(t);
  }, [reading]);

  // Walking away from a person or a word puts its note away.
  useEffect(() => {
    if (bubble && focus?.id !== bubble.at) setBubble(null);
  }, [focus, bubble]);

  // The hatch has just ended in the courtyard: the way on is named once.
  const wasSequence = useRef(false);
  useEffect(() => {
    if (wasSequence.current && !sequence && currentRoom === "courtyard") showWay();
    wasSequence.current = sequence;
  }, [sequence, currentRoom, showWay]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || card) return;
      if (e.code === "KeyM" && !missionsOpen) {
        setMapOpen((v) => !v);
        return;
      }
      if (mapOpen || missionsOpen) return;
      if (e.code === "KeyE" || e.code === "Enter" || e.code === "NumpadEnter") {
        if (sequence) api.current?.skip();
        else interact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interact, sequence, card, mapOpen, missionsOpen]);

  useEffect(() => {
    const onLock = () => setLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onLock);
    return () => document.removeEventListener("pointerlockchange", onLock);
  }, []);

  // The world is full-screen: stop the page behind it from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const backButton = (label: string) => (
    <button
      type="button"
      onClick={exit}
      className="min-h-11 rounded-full border-2 border-ivory px-5 text-sm font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ivory"
    >
      {label}
    </button>
  );

  // Onboarding: welcome once, then the controls taught one at a time.
  const welcoming = ready && !saved.welcomed && !sequence;
  pausedRef.current = card !== null || welcoming || missionsOpen || mapOpen;
  const tutorialStep: TutorialStep = saved.tutorialDone ? "done" : !moved ? "move" : !looked ? "look" : "done";
  useEffect(() => {
    if (tutorialStep === "done" && !saved.tutorialDone && saved.welcomed) patch({ tutorialDone: true });
  }, [tutorialStep, saved.tutorialDone, saved.welcomed, patch]);
  useEffect(() => {
    if (!saved.tutorialDone || tutorialGone) return;
    // Let the finished card fade out, then take it away.
    const t = window.setTimeout(() => setTutorialGone(true), 900);
    return () => window.clearTimeout(t);
  }, [saved.tutorialDone, tutorialGone]);
  const showControls = helpOpen || (saved.welcomed && !tutorialGone && !room && !card);
  const marketOpen = access.open.has("vocabulary-market");
  const objective = currentObjective({ met: saved.met, done: saved.objectivesDone }, marketOpen);
  const progress = useMemo(() => ({ met: saved.met, done: saved.objectivesDone }), [saved.met, saved.objectivesDone]);
  const objectiveCount = objective === "meetCharacters" ? `${saved.met.filter((m) => m === "friend" || m === "minsu").length}/2` : undefined;

  /** A sign's words: the verb, and what or who it is. */
  const signText = (it: Interactable): { verb: string; sub?: string; subKo?: boolean } => {
    const verb = copy.prompts[it.kind === "word" && saved.breadSign ? "talk" : it.action];
    if (it.kind === "learn" && it.learn) return { verb, sub: (copy.learn[it.learn] as { ko: string }).ko, subKo: true };
    if ((it.kind === "quiz" || it.kind === "letter") && it.letter) return { verb, sub: it.letter, subKo: true };
    if (it.kind === "quiz" && it.quiz) return { verb, sub: copy.quiz[it.quiz].ko, subKo: true };
    if (it.kind === "say" && it.say) return { verb, sub: copy.say[it.say].name };
    if (it.kind === "info" && it.info) return { verb, sub: copy.info[it.info].title };
    if (it.kind === "tour" && it.tour) return { verb, sub: VILLAGE.tour.find((b) => b.id === it.tour)?.sign, subKo: true };
    if (it.kind === "link" && it.href) return { verb, sub: VILLAGE.tourLinks.find((l) => l.href === it.href)?.sign, subKo: true };
    if (it.kind === "talk" && it.who) return { verb, sub: it.who === "minsu" ? copy.names.minsu : copy.names[avatar === "lina" ? "adam" : "lina"] };
    if ((it.kind === "door" || it.kind === "locked") && it.to) return { verb, sub: copy.rooms[it.to]?.name };
    return { verb };
  };

  const promptLabel = !focus || (bubble && bubble.at === focus.id)
    ? null
    : copy.prompts[focus.kind === "word" && saved.breadSign ? "talk" : focus.action];
  // Standing still on a first visit: the objective gently asks for attention,
  // and on a touch screen the joystick pulses again.
  const nudge = idle && objective !== null && !card && !bubble;
  const speech: Speech | null = speechKey
    ? { name: copy.clubyName, ko: "ko" in copy.speech[speechKey] ? (copy.speech[speechKey] as { ko: string }).ko : undefined, text: copy.speech[speechKey].text }
    : null;

  return (
    <main
      id="main-content"
      aria-label={copy.seoTitle}
      className="fixed inset-0 z-[90] overflow-hidden bg-charcoal"
    >
      <h1 className="sr-only">{copy.seoTitle}</h1>
      {!webgl ? (
        <Notice title={copy.noWebglTitle} line={copy.noWebglLine}>
          {backButton(copy.backToGames)}
        </Notice>
      ) : (
        <>
          <WorldBoundary
            fallback={(retry) => (
              <Notice title={copy.errorTitle} line={copy.errorLine}>
                <button
                  type="button"
                  onClick={() => {
                    setReady(false);
                    retry();
                  }}
                  className="min-h-11 rounded-full bg-klovers-yellow px-5 text-sm font-bold text-charcoal"
                >
                  {copy.retry}
                </button>
                {backButton(copy.backToGames)}
              </Notice>
            )}
          >
            <Suspense fallback={null}>
              <World
                onReady={() => {
                  setReady(true);
                  // First thing seen: the world's name, then where one stands
                  // (after the welcome card on a first visit).
                  if (savedRef.current.welcomed) arrive(startRoom, true);
                }}
                onFirstLook={() => setLooked(true)}
                onFirstMove={() => setMoved(true)}
                onIdle={setIdle}
                startRoom={startRoom}
                avatar={avatar}
                access={access}
                clubyAwake={clubyAwake}
                saved={saved}
                onSave={(next) => patch({ hatchSeen: next.hatchSeen, greeted: next.greeted })}
                onApi={(a) => (api.current = a)}
                onFade={setFading}
                onRoomChange={arrive}
                onFocus={setFocus}
                onSpeech={setSpeechKey}
                onSequence={setSequence}
                paused={card !== null || welcoming || missionsOpen || mapOpen}
                objective={objective}
                progress={progress}
                onDiscover={discover}
                onNearby={setNearby}
                beaconEls={beaconEls}
                onArrive={arrived}
                view={view}
                marker={marker ?? tourMarker}
                lang={lang}
                onTourSeen={tourSeen}
                shopChosen={shopChosen}
                onShopPress={(item) => {
                  // Pressed in the scene: open the shop with that thing chosen.
                  if (card || sequence || welcoming) return;
                  if (document.pointerLockElement) document.exitPointerLock();
                  setBubble(null);
                  pickShop(item);
                  setCard({ kind: "shop", shop: shopOf(item), shopPick: item });
                }}
              />
            </Suspense>
            {/* Guidance: a small sign over each thing nearby — tap (or click)
                to walk there and use it. The one already in reach has the
                round button instead. */}
            {ready && !card && !bubble && !sequence && !welcoming && !reading && (
              <div
                className="pointer-events-none absolute inset-0 z-[6] overflow-hidden"
                dir="ltr"
                // A phone held upright: the top of the screen is the HUD's, so
                // signs never float over the buttons and chips there.
                style={isTouch && portrait ? { clipPath: "inset(15rem 0 0 0)" } : undefined}
              >
                {nearby
                  .filter((it) => it.id !== focus?.id)
                  .map((it) => {
                    const t = signText(it);
                    return (
                      <button
                        key={it.id}
                        type="button"
                        ref={(el) => {
                          if (el) beaconEls.current.set(it.id, el);
                          else beaconEls.current.delete(it.id);
                        }}
                        style={{ visibility: "hidden" }}
                        aria-label={`${copy.goTo} ${t.sub ?? t.verb}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.blur();
                          api.current?.goTo(it);
                        }}
                        className="pointer-events-auto absolute left-0 top-0 flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full border-2 border-klovers-yellow bg-charcoal/85 py-1 pe-3 ps-1 text-xs font-bold text-ivory shadow-lg will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
                      >
                        <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-klovers-yellow motion-safe:animate-pulse" style={{ margin: "0 0.25rem" }} />
                        <span dir={lang === "ar" ? "rtl" : "ltr"}>{t.verb}</span>
                        {t.sub && (
                          <span lang={t.subKo ? "ko" : undefined} dir={t.subKo ? "ltr" : lang === "ar" ? "rtl" : "ltr"} className={`font-normal text-ivory/80 ${t.subKo ? "font-ko" : ""}`}>
                            {t.sub}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            )}
            {/* Draft watercolour preview (?style=wc / wcall): paper grain over the scene. */}
            {watercolorMode() !== "off" && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-[5] opacity-20 mix-blend-multiply"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.55  0 0 0 0 0.47  0 0 0 0 0.38  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\"), radial-gradient(ellipse at center, rgba(255,250,240,0) 55%, rgba(170,140,110,0.22) 100%)",
                }}
              />
            )}
            {ready && (
              <WorldHud
                lang={lang}
                isTouch={isTouch}
                onExit={exit}
                avatar={avatar}
                onAvatar={chooseAvatar}
                view={view}
                onView={chooseView}
                banner={room ? { eyebrow: introBanner ? copy.worldTitle : undefined, number: ROOM_NUMBER[room], title: copy.rooms[room].name, line: copy.rooms[room].line } : null}
                notice={null}
                preview={access.preview}
                speech={speech}
                prompt={card ? null : promptLabel}
                onInteract={interact}
                showMoveHint={(saved.welcomed && tutorialStep === "move") || nudge}
                side={
                  saved.welcomed && !welcoming ? (
                    // On a short screen a word or a person's line takes the side
                    // column's place for a moment, so the two never overlap.
                    <div className={`flex flex-col items-start gap-2 ${bubble ? "max-sm:hidden [@media(max-height:500px)]:hidden" : ""}`}>
                      {/* On a phone held upright, clear of the controls on the other side. */}
                      <div className="max-sm:max-w-[calc(100vw-12.5rem)]">
                      {activeMission ? (
                        <MissionChip
                          lang={lang}
                          id={activeMission.id}
                          count={activeMission.steps.length - stepsLeft.size}
                          total={activeMission.steps.length}
                          timeLeft={timeLeft}
                          onOpen={() => setMissionsOpen(true)}
                        />
                      ) : (
                        <ObjectiveChip lang={lang} objective={objective} count={objectiveCount} justDone={justDone} nudge={nudge} />
                      )}
                      </div>
                      {currentRoom === "hangul-village" && <LettersChip lang={lang} letters={VILLAGE_LETTERS} found={saved.letters} />}
                      <div className="flex flex-wrap items-center gap-2">
                        <MissionsButton lang={lang} onClick={() => setMissionsOpen(true)} />
                        {!showControls && <HelpButton lang={lang} onClick={() => setHelpOpen(true)} />}
                      </div>
                    </div>
                  ) : null
                }
                toast={
                  <>
                    {showControls && (
                      <ControlsCard
                        lang={lang}
                        isTouch={isTouch}
                        step={helpOpen ? "done" : tutorialStep}
                        replay={helpOpen}
                        onClose={() => {
                          setHelpOpen(false);
                          if (!saved.tutorialDone) {
                            setTutorialGone(true);
                            patch({ tutorialDone: true });
                          }
                        }}
                      />
                    )}
                    {bubble && !card && <DialogueBubble lang={lang} bubble={bubble} avatar={avatar} clubyHere={clubyAwake && saved.hatchSeen} onClose={() => setBubble(null)} onOpenInfo={openInfo} />}
                    {found && !card && <FoundToast text={found.text} ko={found.ko} />}
                    {way && !card && !bubble && <WayHint lang={lang} ko="한글 마을" name={copy.rooms["hangul-village"].name} />}
                    {toast && !card && !bubble && <DiscoveryToast lang={lang} discovery={toast} />}
                  </>
                }
                pointerLocked={locked}
                sequence={sequence}
                onSkip={() => api.current?.skip()}
                landscapeTip={isTouch && portrait && !tipDismissed && !card && !bubble}
                onDismissTip={() => {
                  setTipDismissed(true);
                  try {
                    sessionStorage.setItem("klovers-world-landscape-tip", "1");
                  } catch {
                    /* fine: this visit only */
                  }
                }}
              />
            )}
            {/* The walking map: a round radar that turns with the view. On a
                phone it sits under the top-right controls (the joystick owns
                the bottom-left); on a computer, bottom-left. */}
            {ready && !welcoming && !card && !missionsOpen && !mapOpen && !sequence && (
              <div
                // Phone: bottom right, above the round button (the joystick owns
                // the bottom left, the HUD the top). Computer: bottom left.
                className={`pointer-events-none absolute z-[11] ${isTouch ? (portrait ? "bottom-[11.5rem] end-4" : "end-4 top-[7.4rem]") : "bottom-5 left-5"}`}
                
              >
                <MiniMap lang={lang} showKey={!isTouch} size={isTouch ? (portrait ? 96 : 110) : 184} pose={pose} isOpen={isOpenRoom} steps={stepsLeft} target={() => targetRef.current} onOpen={() => setMapOpen(true)} />
              </div>
            )}
            {mapOpen && <FullMap lang={lang} pose={pose} isOpen={isOpenRoom} missionRoom={missionRoom} onClose={() => setMapOpen(false)} />}
            {missionsOpen && (
              <MissionsCard
                lang={lang}
                isOpen={isOpenRoom}
                active={activeMission?.id ?? null}
                done={saved.missionsDone}
                best={saved.bestTimes}
                onStart={startMission}
                onStop={() => {
                  stopMission();
                  setMissionsOpen(false);
                }}
                onClose={() => setMissionsOpen(false)}
              />
            )}
            {welcoming && (
              <WelcomeCard
                lang={lang}
                avatar={avatar}
                onAvatar={chooseAvatar}
                view={view}
                onView={chooseView}
                onStart={() => {
                  patch({ welcomed: true });
                  arrive(room ?? startRoom, true);
                }}
              />
            )}
            {card && (
              <InteractionCard
                lang={lang}
                kind={card.kind}
                notice={card.notice}
                quiz={card.quiz}
                shop={card.shop}
                shopPick={card.shopPick}
                onShopPick={pickShop}
                onShopPaid={() => api.current?.celebrate()}
                signedIn={access.signedIn}
                solved={saved.breadSign}
                onClose={() => {
                  const was = card.kind;
                  setCard(null);
                  if (was === "egg" && currentRoom === "courtyard") showWay();
                }}
                onGo={(href) => navigate(href)}
                onWordSeen={learnWord}
                onWordRight={() => {
                  if (!savedRef.current.breadSign) complete("helpBaker", { breadSign: true });
                  cheer("m-keeper-1", 2200);
                  api.current?.celebrate();
                }}
                onQuizRight={() => api.current?.celebrate()}
              />
            )}
            {/* Room change: a short fade to ivory while the next room mounts. */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-[15] bg-ivory transition-opacity duration-300 ${fading ? "opacity-100" : "opacity-0"}`}
            />
          </WorldBoundary>
          <LoadingVeil lang={lang} visible={!ready} onExit={exit} />
        </>
      )}
    </main>
  );
};

export default WorldPage;
