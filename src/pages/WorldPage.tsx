import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { WORLD_COPY, type WorldLang } from "@/game/config/copy";
import type { RoomId } from "@/game/config/rooms";
import { DEFAULT_AVATAR, isAvatarId, type AvatarId } from "@/game/player/characters";
import { hasWebGL, isTouchFirst } from "@/game/systems/webgl";
import WorldHud from "@/game/ui/WorldHud";
// Type-only: erased at build time, so the 3D chunk stays lazy.
import type { WorldNotice } from "@/game/World";

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
  const [avatar, setAvatar] = useState<AvatarId>(readAvatar);
  const [fading, setFading] = useState(false);
  const [room, setRoom] = useState<RoomId | null>(null);
  const [notice, setNotice] = useState<WorldNotice | null>(null);
  const bannerTimer = useRef<number>();

  const chooseAvatar = useCallback((id: AvatarId) => {
    setAvatar(id);
    try {
      localStorage.setItem(AVATAR_KEY, id);
    } catch {
      /* private mode: the choice lasts for this visit only */
    }
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
                avatar={avatar}
                onFade={setFading}
                onRoomChange={arrive}
                onNotice={setNotice}
              />
            </Suspense>
            {ready && (
              <WorldHud
                lang={lang}
                showLookHint={!looked}
                isTouch={isTouch}
                onExit={exit}
                avatar={avatar}
                onAvatar={chooseAvatar}
                banner={room ? { title: copy.rooms[room].name, line: copy.rooms[room].line } : null}
                notice={notice ? { title: copy.notices[notice].title, line: copy.notices[notice].line } : null}
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
