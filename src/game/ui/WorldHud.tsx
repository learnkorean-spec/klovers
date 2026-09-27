import type { ReactNode } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import { AVATARS, type AvatarId } from "../player/characters";
import Joystick from "./Joystick";

interface Line {
  title: string;
  line: string;
}

export interface Speech {
  name: string;
  ko?: string;
  text: string;
}

interface HudProps {
  lang: WorldLang;
  isTouch: boolean;
  onExit: () => void;
  avatar: AvatarId;
  onAvatar: (id: AvatarId) => void;
  /** Room name card, shown briefly after arriving in a room. */
  banner: (Line & { eyebrow?: string; number?: number }) | null;
  /** A gate that is shut, or a door to a world still ahead. */
  notice: Line | null;
  /** Admin preview: every world open (shown so it is never mistaken for progress). */
  preview: boolean;
  /** What Cluby is saying, if anything. */
  speech: Speech | null;
  /** The thing within reach and what using it does ("Inspect" …). */
  prompt: string | null;
  onInteract: () => void;
  /** Tutorial on its movement step: the joystick pulses. */
  showMoveHint: boolean;
  /** Under the way out: objective, help, the controls card. */
  side?: ReactNode;
  /** A one-time discovery note, shown under the room banner. */
  toast?: ReactNode;
  pointerLocked: boolean;
  /** A story moment is playing: only Skip is offered. */
  sequence: boolean;
  onSkip: () => void;
  /** Touch, portrait: a dismissible nudge toward landscape. */
  landscapeTip: boolean;
  onDismissTip: () => void;
}

/** The Klovers four-leaf clover, drawn (brand mark, not a stock icon). */
function CloverMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9" aria-hidden="true">
      <g fill="#FFFF00">
        <circle cx="17" cy="17" r="8" />
        <circle cx="31" cy="17" r="8" />
        <circle cx="17" cy="31" r="8" />
        <circle cx="31" cy="31" r="8" />
      </g>
      <circle cx="24" cy="24" r="3" fill="#2E2E2E" />
    </svg>
  );
}

const kbd = "min-w-6 rounded-md border border-ivory/30 bg-ivory/10 px-1.5 py-0.5 text-center font-display text-[11px] font-semibold text-ivory";

/**
 * DOM overlay above the canvas. Quiet by default: the way out and the
 * character picker at the top, and at the bottom only what matters right
 * now — a first-steps hint that fades once used, a prompt when something is
 * within reach, Cluby's line, a shut gate's note. Touch screens get a
 * joystick and one round button instead of any keyboard hints.
 * pointer-events stay off except on real controls, so clicks reach the scene.
 */
export default function WorldHud(p: HudProps) {
  const copy = WORLD_COPY[p.lang];
  const h = copy.hints;


  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col p-4 md:p-6"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col items-start gap-2">
          <button
            type="button"
            onClick={p.onExit}
            className="pointer-events-auto min-h-11 whitespace-nowrap rounded-full border-2 border-charcoal bg-klovers-yellow px-4 text-sm font-bold text-charcoal shadow-md sm:px-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
          >
            {copy.exit}
          </button>
          {!p.sequence && p.side}
        </div>

        <div
          role="group"
          aria-label={copy.avatarLabel}
          className="pointer-events-auto flex items-center gap-1 rounded-full bg-charcoal/85 p-1 text-xs text-ivory sm:ps-3"
        >
          <span className="hidden pe-1 font-semibold sm:inline">{copy.avatarLabel}</span>
          {(Object.keys(AVATARS) as AvatarId[]).map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={p.avatar === id}
              onClick={(e) => {
                p.onAvatar(id);
                // Keep keyboard focus off the button so WASD stays with the scene.
                e.currentTarget.blur();
              }}
              className={`min-h-9 rounded-full px-4 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow ${
                p.avatar === id ? "bg-klovers-yellow text-charcoal" : "text-ivory hover:bg-ivory/10"
              }`}
            >
              {AVATARS[id].name[p.lang]}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-2 flex flex-col items-center gap-2">
        {p.preview && (
          <p className="rounded-full border border-klovers-yellow/60 bg-charcoal/85 px-3 py-1 text-xs font-semibold text-ivory">{copy.previewNote}</p>
        )}
        {p.landscapeTip && (
          <div className="pointer-events-auto flex max-w-sm items-center justify-between gap-3 rounded-2xl bg-charcoal/90 px-4 py-2.5 text-sm text-ivory">
            <span>{copy.landscapeTip}</span>
            <button type="button" onClick={p.onDismissTip} className="min-h-9 shrink-0 rounded-full bg-klovers-yellow px-3 text-xs font-bold text-charcoal">
              {copy.gotIt}
            </button>
          </div>
        )}
        {p.banner && (
          <div role="status" className="flex items-center gap-3 rounded-2xl bg-charcoal/85 py-2.5 pe-5 ps-3 text-ivory motion-safe:animate-in motion-safe:fade-in">
            {p.banner.number !== undefined && (
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-klovers-yellow font-display text-base font-bold text-charcoal">
                {p.banner.number}
              </span>
            )}
            <span className="flex flex-col items-start gap-0.5 text-start">
              {p.banner.eyebrow && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory/65">{p.banner.eyebrow}</span>}
              <span className="font-display text-base font-bold leading-tight sm:text-lg">{p.banner.title}</span>
              <span className="max-w-sm text-xs text-ivory/80 sm:text-sm">{p.banner.line}</span>
            </span>
          </div>
        )}
        {!p.sequence && p.toast}
      </div>

      <div className="flex-1" />

      <div className="mx-auto flex max-w-full flex-col items-center gap-2 pb-2">
        {p.speech && (
          <div role="status" aria-live="polite" className="max-w-md rounded-2xl bg-ivory px-5 py-2.5 text-center text-charcoal shadow-lg">
            <p className="text-[11px] font-bold uppercase tracking-wide text-charcoal/60">{p.speech.name}</p>
            {p.speech.ko && (
              <p lang="ko" className="font-ko text-xl font-bold">
                {p.speech.ko}
              </p>
            )}
            <p className="cluby-note">{p.speech.text}</p>
          </div>
        )}
        {p.notice && !p.sequence && (
          <div role="status" className="max-w-md rounded-2xl border-2 border-klovers-yellow bg-charcoal/90 px-5 py-2.5 text-center text-ivory">
            <p className="font-display text-base font-bold">{p.notice.title}</p>
            <p className="text-sm text-ivory/85">{p.notice.line}</p>
          </div>
        )}
        {p.prompt && !p.sequence && !p.isTouch && (
          <button
            type="button"
            onClick={p.onInteract}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-charcoal/90 px-4 py-2 text-sm font-semibold text-ivory ring-2 ring-klovers-yellow/70 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
          >
            {h.interact.keys.map((k) => (
              <kbd key={k} className={kbd}>
                {k}
              </kbd>
            ))}
            <span>{p.prompt}</span>
          </button>
        )}
      </div>

      {!p.isTouch && p.pointerLocked && !p.sequence && (
        <p className="absolute bottom-4 end-4 flex items-center gap-1.5 text-xs text-charcoal/70">
          <kbd className="rounded-md border border-charcoal/30 px-1.5 py-0.5 text-[11px] font-semibold">{h.esc.keys[0]}</kbd>
          <span>{h.esc.label}</span>
        </p>
      )}

      {p.isTouch && !p.sequence && <Joystick label={copy.joystick} pulse={p.showMoveHint} />}
      {p.isTouch && p.prompt && !p.sequence && (
        // The contextual action: a dark disc ringed in Klovers yellow with the
        // clover mark, and what it does written under it. Only when useful.
        <button
          type="button"
          onClick={p.onInteract}
          aria-label={p.prompt}
          style={{ bottom: "calc(1.75rem + env(safe-area-inset-bottom))", right: "calc(1.25rem + env(safe-area-inset-right))" }}
          className="pointer-events-auto absolute flex flex-col items-center gap-1.5 motion-safe:animate-in motion-safe:zoom-in-90"
        >
          <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-charcoal/70 shadow-lg ring-4 ring-klovers-yellow backdrop-blur-sm">
            <CloverMark />
          </span>
          <span className="rounded-full bg-charcoal/85 px-3 py-1 text-xs font-bold text-ivory">{p.prompt}</span>
        </button>
      )}
      {p.sequence && (
        <button
          type="button"
          onClick={p.onSkip}
          className="pointer-events-auto absolute bottom-6 end-6 min-h-11 rounded-full bg-charcoal/85 px-5 text-sm font-semibold text-ivory"
        >
          {copy.skip}
        </button>
      )}
    </div>
  );
}
