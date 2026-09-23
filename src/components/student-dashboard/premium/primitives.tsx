import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BrandIconName } from "@/lib/dashboardProgress";

/**
 * One icon from the Klovers icon library (public/assets/icons/library).
 * Decorative by default — the text beside it carries the meaning. If a file
 * is missing the slot collapses instead of showing a broken-image glyph, so
 * the UI still reads correctly without any art (the "premium test").
 */
export function BrandIcon({
  name, className, label, eager = false,
}: { name: BrandIconName; className?: string; label?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span aria-hidden="true" className={cn("inline-block shrink-0", className)} />;
  return (
    <img
      src={`/assets/icons/library/${name}.webp`}
      srcSet={`/assets/icons/library/${name}@2x.webp 2x`}
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
