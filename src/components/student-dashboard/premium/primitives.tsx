import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BrandIconName } from "@/lib/dashboardProgress";

/**
 * Klovers icon library — the 20 1024px transparent PNGs Re uploaded to
 * public/assets/icons/library (24 Sep 2026). Every name the dashboard uses
 * maps onto one of them; several concepts share a drawing on purpose.
 */
const ICON_FILE: Record<BrandIconName, string> = {
  cluby: "01-klubi",
  "open-book": "02-learn", notebook: "14-practice", grammar: "14-practice",
  conversation: "03-conversation",
  flashcards: "04-flashcards", "hangul-card": "16-dictionary", vocabulary: "15-tips",
  controller: "05-games", puzzle: "05-games",
  "progress-path": "06-learning-path", passport: "10-journey-passport",
  "achievement-star": "07-achievements", success: "07-achievements",
  "reward-gift": "08-rewards", favourite: "08-rewards",
  hanok: "09-worlds", namsan: "09-worlds", "korea-map": "09-worlds", bibimbap: "09-worlds",
  hanbok: "09-worlds", subway: "09-worlds", "culture-fan": "09-worlds",
  streak: "11-daily-streak", calendar: "11-daily-streak",
  progress: "12-progress", placement: "12-progress",
  trophy: "13-goals", challenge: "13-goals",
  headphones: "17-listening", listening: "17-listening",
  speaking: "18-speaking",
  teacher: "19-live-classes", "small-group": "19-live-classes",
  locked: "20-settings",
};

/**
 * The source files are 1024px (~450 KB). In production they go through
 * Vercel's image optimizer (vercel.json → images; 320 is the smallest size
 * configured there) so each icon downloads as a small WebP/AVIF instead of
 * the full PNG; in local dev the original file is used.
 */
function iconSrc(file: string) {
  const path = `/assets/icons/library/${file}.png`;
  return import.meta.env.PROD ? `/_vercel/image?url=${encodeURIComponent(path)}&w=320&q=75` : path;
}

/**
 * One icon from the Klovers icon library.
 * Decorative by default — the text beside it carries the meaning. If a file
 * is missing the slot collapses instead of showing a broken-image glyph, so
 * the UI still reads correctly without any art (the "premium test").
 */
export function BrandIcon({
  name, className, label, eager = false,
}: { name: BrandIconName; className?: string; label?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden="true" className={cn("inline-block shrink-0", className)} />;
  const file = ICON_FILE[name];
  return (
    <img
      src={iconSrc(file)}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={96}
      height={96}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn("shrink-0 select-none object-contain", className)}
    />
  );
}

/**
 * Progress bar: charcoal track, neon (#39FF14) fill. Neon measures 1.7:1 on
 * ivory, so it is only ever drawn on the charcoal track (≈11:1) — never as
 * text and never straight on a light surface.
 */
export function ProgressBar({
  value, label, valueText, size = "md", tone = "live", className,
}: {
  value: number; label: string; valueText?: string; size?: "sm" | "md";
  tone?: "live" | "yellow"; className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText}
      className={cn("w-full overflow-hidden rounded-full bg-foreground", size === "sm" ? "h-2" : "h-3", className)}
    >
      <div
        className={cn(
          "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out",
          tone === "live" ? "bg-live-bright" : "bg-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Cluby with a short note. Latin notes use the handwriting face; Arabic never does. */
export function ClubyNote({
  text, lang, pose = "wave", className, size = "md", alt,
}: {
  text: string; lang: "en" | "ar"; pose?: "wave" | "star"; className?: string;
  size?: "sm" | "md"; alt: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn("flex items-end gap-1.5", className)}>
      <p
        className={cn(
          "relative rounded-2xl rounded-ee-sm bg-background border border-foreground/10 px-3 py-1.5 text-foreground leading-snug",
          lang === "ar" ? "font-sans text-sm font-semibold" : "font-script text-[15px]",
        )}
      >
        {text}
      </p>
      {!failed && (
        <img
          src={`/assets/cluby/cluby-${pose}.webp`}
          alt={alt}
          width={size === "sm" ? 48 : 88}
          height={size === "sm" ? 48 : 88}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className={cn(
            "shrink-0 select-none object-contain",
            size === "sm" ? "h-12 w-12" : "h-[88px] w-[88px]",
          )}
        />
      )}
    </div>
  );
}
