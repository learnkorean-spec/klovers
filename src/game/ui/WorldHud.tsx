import { WORLD_COPY, type WorldLang } from "../config/copy";

interface HudProps {
  lang: WorldLang;
  showLookHint: boolean;
  isTouch: boolean;
  onExit: () => void;
}

/**
 * DOM overlay above the canvas: the way out, the controls, and a one-time
 * look hint. pointer-events stay off except on real controls, so clicks fall
 * through to the scene.
 */
export default function WorldHud({ lang, showLookHint, isTouch, onExit }: HudProps) {
  const copy = WORLD_COPY[lang];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onExit}
          className="pointer-events-auto min-h-11 rounded-full border-2 border-charcoal bg-klovers-yellow px-5 text-sm font-bold text-charcoal shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          {copy.exit}
        </button>
      </div>

      <div className="mx-auto flex max-w-full flex-col items-center gap-2">
        {showLookHint && !isTouch && (
          <p role="status" className="rounded-full bg-klovers-yellow px-4 py-1.5 text-sm font-semibold text-charcoal">
            {copy.lookHint}
          </p>
        )}
        {isTouch && (
          <p className="max-w-md rounded-2xl bg-charcoal/85 px-4 py-2 text-center text-xs text-ivory">{copy.touchNote}</p>
        )}
        <ul
          aria-label={lang === "ar" ? "مفاتيح التحكم" : "Controls"}
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl bg-charcoal/85 px-4 py-2.5 text-xs text-ivory"
        >
          {copy.controls.map((c) => (
            <li key={c.label} className="flex items-center gap-1.5">
              {c.keys.map((k) => (
                <kbd
                  key={k}
                  className="min-w-6 rounded-md border border-ivory/30 bg-ivory/10 px-1.5 py-0.5 text-center font-display text-[11px] font-semibold text-ivory"
                >
                  {k}
                </kbd>
              ))}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
