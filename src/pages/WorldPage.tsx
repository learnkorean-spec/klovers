import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { isClubyAwake } from "@/lib/clubyAwake";
import { WORLD_COPY, type WorldLang } from "@/game/config/copy";
import type { Interactable } from "@/game/config/interactions";
import type { RoomId } from "@/game/config/rooms";
import { DEFAULT_AVATAR, isAvatarId, type AvatarId } from "@/game/player/characters";
import { useWorldAccess } from "@/game/systems/useWorldAccess";
import { hasWebGL, isTouchFirst } from "@/game/systems/webgl";
import { loadWorldState, saveWorldState, type WorldState } from "@/game/systems/worldState";
import InteractionCard, { type CardKind } from "@/game/ui/InteractionCard";
import WorldHud, { type Speech } from "@/game/ui/WorldHud";
// Type-only: erased at build time, so the 3D chunk stays lazy.
import type { SpeechKey, WorldApi, WorldNotice } from "@/game/World";

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
  const [gateNotice, setGateNotice] = useState<WorldNotice | null>(null);
  const [focus, setFocus] = useState<Interactable | null>(null);
  const [speechKey, setSpeechKey] = useState<SpeechKey | null>(null);
  const [sequence, setSequence] = useState(false);
  const [card, setCard] = useState<CardKind | null>(null);
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

  const save = useCallback((next: WorldState) => {
    setSaved(next);
    saveWorldState(next);
  }, []);

  // Room name card: shown for a few seconds after each arrival.
  const arrive = useCallback((id: RoomId) => {
    setRoom(id);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setRoom(null), 4200);
  }, []);
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
      else setCard("egg");
    } else if (it.kind === "letter") setCard("letter");
    else if (it.kind === "word") setCard("word");
    else if (it.kind === "link") navigate(it.link === "games" ? "/games" : access.signedIn ? "/textbook" : "/courses");
  }, [focus, card, sequence, clubyAwake, saved.hatchSeen, navigate, access.signedIn]);

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

  // What to show at the bottom: a shut gate, or a future door within reach.
  const noticeKey = gateNotice ?? (focus?.kind === "locked" ? focus.notice ?? null : null);
  const promptLabel = !focus || focus.kind === "locked"
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
                onReady={() => setReady(true)}
                onFirstLook={() => setLooked(true)}
                onFirstMove={() => setMoved(true)}
                avatar={avatar}
                access={access}
                clubyAwake={clubyAwake}
                saved={saved}
                onSave={save}
                onApi={(a) => (api.current = a)}
                onFade={setFading}
                onRoomChange={arrive}
                onNotice={setGateNotice}
                onFocus={setFocus}
                onSpeech={setSpeechKey}
                onSequence={setSequence}
                paused={card !== null}
              />
            </Suspense>
            {ready && (
              <WorldHud
                lang={lang}
                isTouch={isTouch}
                onExit={exit}
                avatar={avatar}
                onAvatar={chooseAvatar}
                banner={room ? { title: copy.rooms[room].name, line: copy.rooms[room].line } : null}
                notice={noticeKey ? { title: copy.notices[noticeKey].title, line: copy.notices[noticeKey].line } : null}
                preview={access.preview}
                speech={speech}
                prompt={card ? null : promptLabel}
                onInteract={interact}
                showMoveHint={!moved}
                showLookHint={moved && !looked}
                pointerLocked={locked}
                sequence={sequence}
                onSkip={() => api.current?.skip()}
              />
            )}
            {card && (
              <InteractionCard
                lang={lang}
                kind={card}
                signedIn={access.signedIn}
                solved={saved.breadSign}
                onClose={() => setCard(null)}
                onGo={(href) => navigate(href)}
                onWordRight={() => {
                  if (!saved.breadSign) save({ ...saved, breadSign: true });
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
