import { useEffect, useRef } from "react";
import { WORLD_COPY, type WorldLang } from "../config/copy";
import type { ObjectiveId } from "../config/objectives";
import type { DiscoveryKey } from "../config/discoveries";
import { AVATARS, type AvatarId } from "../player/characters";
import { LICENSE_URL, MODEL_CHANGES, MODEL_CREDITS, OTHER_SOURCES } from "../config/credits";

/** First person ("eyes") or over the shoulder ("behind"). */
export type WorldView = "eyes" | "behind";

/**
 * First-visit onboarding pieces, all DOM (no 3D cost):
 *   WelcomeCard     — the first thing on a first visit; the world waits.
 *   ControlsCard    — the controls, taught one step at a time; used rows are
 *                     marked done and the card fades once moving and looking
 *                     have both happened. Reopened from the help button.
 *   ObjectiveChip   — the current objective, small, under the way out.
 *   DiscoveryToast  — a one-time note the first time something is reached.
 * Every string comes from config/copy (EN / MSA Arabic, gender-neutral).
 */

const cap = "rounded-md border border-charcoal/25 bg-white px-1.5 py-0.5 font-display text-[11px] font-bold text-charcoal";

export function WelcomeCard({
  lang,
  onStart,
  avatar,
  onAvatar,
  view,
  onView,
}: {
  lang: WorldLang;
  onStart: () => void;
  avatar: AvatarId;
  onAvatar: (id: AvatarId) => void;
  view: WorldView;
  onView: (v: WorldView) => void;
}) {
  const copy = WORLD_COPY[lang];
  const c = copy.onboarding;
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => btnRef.current?.focus(), []);
  const choice = (on: boolean) =>
    `min-h-10 flex-1 rounded-full border-2 px-3 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal ${
      on ? "border-charcoal bg-charcoal text-ivory" : "border-charcoal/25 text-charcoal hover:border-charcoal/60"
    }`;
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-charcoal/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="world-welcome-title"
        className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-ivory p-7 text-center text-charcoal shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 [@media(max-height:500px)]:gap-2 [@media(max-height:500px)]:p-4"
      >
        <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-klovers-yellow" />
        <h2 id="world-welcome-title" className="font-display text-2xl font-bold leading-tight [@media(max-height:500px)]:text-lg">
          {c.welcomeTitle}
        </h2>
        <p className="text-sm text-charcoal/80 [@media(max-height:500px)]:hidden">{c.welcomeLine}</p>
        {/* 1 · who walks; 2 · how the world is seen. */}
        <div role="group" aria-label={c.chooseAvatar} className="flex w-full flex-col gap-1.5">
          <p className="text-xs font-bold text-charcoal/60">
            <span className="me-1">1</span>
            {c.chooseAvatar}
          </p>
          <div className="flex gap-2">
            {(Object.keys(AVATARS) as AvatarId[]).map((id) => (
              <button key={id} type="button" aria-pressed={avatar === id} onClick={() => onAvatar(id)} className={choice(avatar === id)}>
                {AVATARS[id].name[lang]}
              </button>
            ))}
          </div>
        </div>
        <div role="group" aria-label={c.chooseView} className="flex w-full flex-col gap-1.5">
          <p className="text-xs font-bold text-charcoal/60">
            <span className="me-1">2</span>
            {c.chooseView}
          </p>
          <div className="flex gap-2">
            {(["eyes", "behind"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => onView(v)} className={choice(view === v)}>
                {v === "eyes" ? copy.view.eyesLong : copy.view.behindLong}
              </button>
            ))}
          </div>
        </div>
        <button
          ref={btnRef}
          type="button"
          onClick={onStart}
          className="mt-2 min-h-11 rounded-full border-2 border-charcoal bg-klovers-yellow px-8 text-sm font-bold text-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          {c.letsGo}
        </button>
      </div>
    </div>
  );
}

export type TutorialStep = "move" | "look" | "done";

/**
 * The controls card. `step` is what to try now: its row is highlighted,
 * rows already used are marked done, and the card leaves on its own after
 * "done". Opened again from help, it simply lists everything.
 */
export function ControlsCard({
  lang,
  isTouch,
  step,
  replay,
  onClose,
}: {
  lang: WorldLang;
  isTouch: boolean;
  step: TutorialStep;
  /** Opened from help: a plain reference card with a close button. */
  replay: boolean;
  onClose: () => void;
}) {
  const c = WORLD_COPY[lang].onboarding;
  const all = isTouch ? c.touch : c.desktop;
  // Taught one step at a time: only what to try now (moving comes with
  // running on a keyboard); the full list only when reopened from help.
  const show: string[] = replay ? all.map((r) => r.id) : step === "move" ? ["move", "run"] : ["look"];
  const rows = all.filter((r) => show.includes(r.id));
  const done = (id: string) => !replay && ((id === "move" && step !== "move") || (id === "look" && step === "done"));
  const active = (id: string) => !replay && id === step;
  const instruction = replay ? null : step === "move" ? c.stepMove : step === "look" ? c.stepLook : null;

  return (
    <div
      role="region"
      aria-label={c.controlsTitle}
      className={`pointer-events-auto ${
        replay
          ? "w-[min(20rem,calc(100vw-2rem))]"
          : // On a phone held sideways the middle of the screen is the view
            // itself (the egg, the person to meet): the first-steps card waits
            // low in the middle instead, between the joystick and the edge.
            "w-[min(16rem,calc(100vw-2rem))] [@media(max-height:500px)]:absolute [@media(max-height:500px)]:inset-x-0 [@media(max-height:500px)]:bottom-[max(0.75rem,env(safe-area-inset-bottom))] [@media(max-height:500px)]:mx-auto [@media(max-height:500px)]:p-2"
      } rounded-2xl bg-ivory/95 p-3 text-charcoal shadow-xl transition-opacity duration-700 motion-safe:animate-in motion-safe:fade-in ${
        step === "done" && !replay ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-1 pb-1.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/60">{c.controlsTitle}</p>
        <button type="button" onClick={onClose} className="min-h-8 rounded-full px-2 text-xs font-semibold text-charcoal/70 underline-offset-2 hover:underline">
          {c.close}
        </button>
      </div>
      {instruction && <p className="px-1 pb-2 text-sm font-bold">{instruction}</p>}
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li
            key={r.id}
            className={`flex items-center justify-between gap-3 rounded-xl px-2.5 py-1.5 text-sm transition-colors ${
              active(r.id) ? "bg-klovers-yellow/70 font-bold" : done(r.id) ? "text-charcoal/45" : ""
            }`}
          >
            <span className="flex items-center gap-2">
              {/* Progress mark: a small neon-green dot once a control is used. */}
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${done(r.id) ? "bg-klovers-green" : "bg-charcoal/15"}`}
              />
              {r.label}
            </span>
            <span className="flex flex-wrap justify-end gap-1" dir="ltr">
              {r.keys.map((k) => (
                <kbd key={k} className={cap}>
                  {k}
                </kbd>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {replay && (
        // CC BY credits for the 3D models used in the world.
        <details className="mt-2 text-[11px] text-charcoal/70">
          <summary className="cursor-pointer font-bold">{c.credits}</summary>
          <ul className="mt-1 flex flex-col gap-0.5" dir="ltr">
            {MODEL_CREDITS.map((m) => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {m.title}
                </a>{" "}
                , {m.author} ·{" "}
                <a href={LICENSE_URL} target="_blank" rel="noopener noreferrer" className="underline">
                  {m.license}
                </a>
              </li>
            ))}
            <li>{MODEL_CHANGES}</li>
            <li>{OTHER_SOURCES}</li>
          </ul>
        </details>
      )}
    </div>
  );
}

export function HelpButton({ lang, onClick }: { lang: WorldLang; onClick: () => void }) {
  const c = WORLD_COPY[lang].onboarding;
  return (
    <button
      type="button"
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      className="pointer-events-auto min-h-9 rounded-full bg-charcoal/85 px-4 text-xs font-bold text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-klovers-yellow"
    >
      {c.help}
    </button>
  );
}

export function ObjectiveChip({
  lang,
  objective,
  count,
  justDone,
  nudge = false,
}: {
  lang: WorldLang;
  objective: ObjectiveId | null;
  /** "1/2" style progress for objectives with parts. */
  count?: string;
  /** Briefly shows the finished objective instead of the next one. */
  justDone: ObjectiveId | null;
  /** The learner seems unsure (standing still on a first visit): a soft ring. */
  nudge?: boolean;
}) {
  const c = WORLD_COPY[lang].objective;
  const shown = justDone ?? objective;
  if (!shown) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex max-w-[16rem] items-start gap-2 rounded-2xl bg-charcoal/85 px-3 py-2 text-ivory ring-klovers-yellow/80 transition-shadow motion-safe:animate-in motion-safe:fade-in ${nudge ? "ring-2 motion-safe:animate-pulse" : "ring-0"}`}
    >
      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${justDone ? "bg-klovers-green" : "bg-klovers-yellow"}`} />
      <span className="flex flex-col">
        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ivory/60">
          {justDone ? c.done : c.label}
          {!justDone && count ? (
            <span className="rounded-full bg-ivory/15 px-1.5 py-px tracking-normal text-ivory/85" dir="ltr">
              {count}
            </span>
          ) : null}
        </span>
        <span className="text-sm font-semibold leading-snug">{c[shown]}</span>
      </span>
    </div>
  );
}

export function DiscoveryToast({ lang, discovery }: { lang: WorldLang; discovery: DiscoveryKey }) {
  const d = WORLD_COPY[lang].discoveries[discovery];
  return (
    <div role="status" className="max-w-sm rounded-2xl border-s-4 border-klovers-yellow bg-ivory/95 px-4 py-2.5 text-charcoal shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
      <p className="font-display text-sm font-bold">{d.title}</p>
      <p className="text-sm text-charcoal/80">{d.line}</p>
    </div>
  );
}

/**
 * The village's three discoverable letters: one dot each, filled once found.
 * Exploration feedback only; it counts nothing anywhere else.
 */
export function LettersChip({ lang, letters, found }: { lang: WorldLang; letters: readonly string[]; found: string[] }) {
  const c = WORLD_COPY[lang].found;
  const n = letters.filter((l) => found.includes(l)).length;
  return (
    <div role="status" aria-label={`${c.lettersLabel} ${n}/${letters.length}`} className="flex items-center gap-2 rounded-full bg-charcoal/85 px-3 py-1.5 text-ivory">
      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ivory/65 max-sm:hidden">{c.lettersLabel}</span>
      <span className="flex items-center gap-1.5" dir="ltr">
        {letters.map((l) => {
          const got = found.includes(l);
          return (
            <span
              key={l}
              lang="ko" dir="ltr"
              className={`flex h-5 w-5 items-center justify-center rounded-full border font-ko text-[11px] font-bold sm:h-6 sm:w-6 sm:text-xs ${got ? "border-klovers-yellow bg-klovers-yellow text-charcoal" : "border-ivory/40 text-transparent"}`}
            >
              {got ? l : "·"}
            </span>
          );
        })}
      </span>
    </div>
  );
}

/** A small "found" note (a new word, a new letter), then gone. */
export function FoundToast({ text, ko }: { text: string; ko?: string }) {
  return (
    <div role="status" className="flex items-center gap-2 rounded-full bg-charcoal/90 px-4 py-2 text-sm font-semibold text-ivory shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
      <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-klovers-green" />
      <span>{text}</span>
      {ko && (
        <span lang="ko" dir="ltr" className="font-ko font-bold text-klovers-yellow">
          {ko}
        </span>
      )}
    </div>
  );
}

/** Where the path goes next, named once, then gone (no "go to room 2"). */
export function WayHint({ lang, ko, name }: { lang: WorldLang; ko: string; name: string }) {
  const c = WORLD_COPY[lang];
  return (
    <div role="status" className="flex items-center gap-2 rounded-full bg-charcoal/80 px-4 py-1.5 text-ivory motion-safe:animate-in motion-safe:fade-in">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ivory/60">{c.wayEyebrow}</span>
      <span lang="ko" dir="ltr" className="font-ko text-base font-bold leading-tight">
        {ko}
      </span>
      <span className="text-sm text-ivory/85">{name}</span>
    </div>
  );
}
