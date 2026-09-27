import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { isClubyAwake } from "@/lib/clubyAwake";
import { WORLD_COPY, type WorldLang } from "@/game/config/copy";
import type { Interactable } from "@/game/config/interactions";
import type { NoticeKey, RoomId } from "@/game/config/rooms";
import { DEFAULT_AVATAR, isAvatarId, type AvatarId } from "@/game/player/characters";
import { useWorldAccess } from "@/game/systems/useWorldAccess";
import { hasWebGL, isTouchFirst } from "@/game/systems/webgl";
import { loadWorldState, saveWorldState, type WorldState } from "@/game/systems/worldState";
import InteractionCard, { type CardKind } from "@/game/ui/InteractionCard";
import WorldHud, { type Speech } from "@/game/ui/WorldHud";
import { ControlsCard, DiscoveryToast, HelpButton, ObjectiveChip, WelcomeCard, type TutorialStep } from "@/game/ui/Onboarding";
import { currentObjective, type ObjectiveId } from "@/game/config/objectives";
import type { DiscoveryKey } from "@/game/config/discoveries";
// Type-only: erased at build time, so the 3D chunk stays lazy.
import type { SpeechKey, WorldApi } from "@/game/World";

const AVATAR_KEY = "klovers-world-avatar";

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
  const [speechKey, setSpeechKey] = useState<SpeechKey | null>(null);
  const [sequence, setSequence] = useState(false);
  const [card, setCard] = useState<{ kind: CardKind; notice?: NoticeKey; who?: "friend" | "minsu" } | null>(null);
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
    return r === "hangul-village" || r === "hub" ? r : "courtyard";
  });
  const [locked, setLocked] = useState(false);
  const api = useRef<WorldApi | null>(null);
  const bannerTimer = useRef<number>();

  // Cluby is shown only once he has really hatched (the dashboard's egg
  // stage, recorded per browser by lib/clubyAwake) — or in an admin preview.
  const clubyAwake = access.preview || (access.signedIn && isClubyAwake());

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
    },
    [],
  );

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
    if (id === "hub") complete("findHub");
    setRoom(id);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setRoom(null), 4200);
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
    if (!it || card || sequence) return;
    if (document.pointerLockElement) document.exitPointerLock();
    if (it.kind === "egg") {
      if (clubyAwake && !saved.hatchSeen) api.current?.hatch();
      else setCard({ kind: "egg" });
    } else if (it.kind === "letter") {
      setCard({ kind: "letter" });
      // Reading the sign counts only once the characters have been met, so
      // the objectives stay in their order.
      if (savedRef.current.objectivesDone.includes("meetCharacters")) complete("readSign");
    } else if (it.kind === "talk" && it.who) {
      setCard({ kind: "talk", who: it.who });
      const cur = savedRef.current;
      const met = cur.met.includes(it.who) ? cur.met : [...cur.met, it.who];
      if (met.includes("friend") && met.includes("minsu")) complete("meetCharacters", { met });
      else if (met !== cur.met) patch({ met });
    }
    else if (it.kind === "word") setCard({ kind: "word" });
    else if (it.kind === "locked") setCard({ kind: "locked", notice: it.notice });
    else if (it.kind === "link") {
      // Out to the site; the world reopens here (the Hub) on the way back.
      patch({ lastRoom: it.room });
      navigate(it.link === "games" ? "/games" : access.signedIn ? "/textbook" : "/courses");
    }
  }, [focus, card, sequence, clubyAwake, saved, patch, complete, navigate, access.signedIn]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || card) return;
      if (e.code === "KeyE" || e.code === "Enter" || e.code === "NumpadEnter") {
        if (sequence) api.current?.skip();
        else interact();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [interact, sequence, card]);

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
  const objective = currentObjective({ met: saved.met, done: saved.objectivesDone });
  const progress = useMemo(() => ({ met: saved.met, done: saved.objectivesDone }), [saved.met, saved.objectivesDone]);
  const objectiveCount = objective === "meetCharacters" ? `${saved.met.filter((m) => m === "friend" || m === "minsu").length}/2` : undefined;

  const promptLabel = !focus
    ? null
    : focus.kind === "link"
      ? copy.prompts[focus.link === "games" ? "games" : "lessons"]
      : copy.prompts[focus.kind];
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
                paused={card !== null || welcoming}
                objective={objective}
                progress={progress}
                onDiscover={discover}
              />
            </Suspense>
            {ready && (
              <WorldHud
                lang={lang}
                isTouch={isTouch}
                onExit={exit}
                avatar={avatar}
                onAvatar={chooseAvatar}
                banner={room ? { eyebrow: introBanner ? copy.worldTitle : undefined, title: copy.rooms[room].name, line: copy.rooms[room].line } : null}
                notice={null}
                preview={access.preview}
                speech={speech}
                prompt={card ? null : promptLabel}
                onInteract={interact}
                showMoveHint={saved.welcomed && tutorialStep === "move"}
                side={
                  saved.welcomed && !welcoming ? (
                    <div className="flex flex-col items-start gap-2">
                      <ObjectiveChip lang={lang} objective={objective} count={objectiveCount} justDone={justDone} />
                      {!showControls && <HelpButton lang={lang} onClick={() => setHelpOpen(true)} />}
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
                    {toast && !card && <DiscoveryToast lang={lang} discovery={toast} />}
                  </>
                }
                pointerLocked={locked}
                sequence={sequence}
                onSkip={() => api.current?.skip()}
                landscapeTip={isTouch && portrait && !tipDismissed && !card}
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
            {welcoming && (
              <WelcomeCard
                lang={lang}
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
                who={card.who}
                avatar={avatar}
                signedIn={access.signedIn}
                solved={saved.breadSign}
                onClose={() => setCard(null)}
                onGo={(href) => navigate(href)}
                onWordRight={() => {
                  if (!savedRef.current.breadSign) patch({ breadSign: true });
                  api.current?.celebrate();
                }}
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
