import { useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

const SRCSET_WIDTHS = [320, 480, 640, 828, 1080, 1200, 1920];

function optimizedUrl(src: string, width: number, quality = 75): string {
  if (!src.startsWith("http://") && !src.startsWith("https://")) return src;
  // Unsplash supports native resizing via URL params
  if (src.includes("images.unsplash.com")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality));
    url.searchParams.set("auto", "format");
    return url.toString();
  }
  return src;
}

function buildSrcSet(src: string, quality = 75): string {
  return SRCSET_WIDTHS.map((w) => `${optimizedUrl(src, w, quality)} ${w}w`).join(", ");
}

interface OptimizedImageProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  figureClassName?: string;
  isHero?: boolean;
  fallbackEmoji?: string;
  variant?: "hero" | "card";
  priority?: boolean;
  sizes?: string;
  quality?: number;
  /**
   * Rendered inside the reserved box instead of the emoji/"Image unavailable"
   * placeholder when there is no usable src or the image fails to load.
   * Same box, so no layout shift either way.
   */
  fallback?: ReactNode;
}

const DEFAULT_SIZES_HERO = "(max-width: 768px) 100vw, 720px";
const DEFAULT_SIZES_CARD = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

const OptimizedImage = ({
  src,
  alt,
  caption,
  className = "w-full object-cover",
  figureClassName = "mb-8 -mx-4 sm:mx-0",
  isHero = false,
  fallbackEmoji = "📖",
  variant,
  priority = false,
  sizes,
  quality = 75,
  fallback,
}: OptimizedImageProps) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isCard = variant === "card";
  const effectiveIsHero = variant === "hero" || (!variant && isHero);

  const effectiveSizes =
    sizes || (isCard ? DEFAULT_SIZES_CARD : effectiveIsHero ? DEFAULT_SIZES_HERO : DEFAULT_SIZES_HERO);

  // Root-relative paths ("/assets/blog/x.jpg") are legitimate same-origin
  // images, not just http(s) URLs — this check excluded them, so every post
  // whose hero_image is a local file (confirmed live for 36+ published
  // blog_posts rows via Supabase, e.g. hanbok-fashion.jpg, hangul-science.jpg,
  // seollal-new-year.jpg) silently rendered the 📖 fallback instead of the
  // real photo, on the blog list, the post page, and the homepage blog
  // teaser. srcSet degrades gracefully for these — optimizedUrl() already
  // returns non-http(s) sources unchanged, so it's a same URL repeated per
  // width descriptor rather than a crash.
  const isValidUrl = !!src && (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/"));
  const showFallback = !isValidUrl || imgError;

  // One persistent box, reused unchanged across loading / loaded / error.
  // Previously loading+loaded and error were two entirely different
  // subtrees (separate `<figure>{X}</figure>` returns), each reserving its
  // own aspect ratio independently. Confirmed via Lighthouse's
  // layout-shifts audit against production (2026-08-30): swapping between
  // them was the largest CLS contributor on article pages — the box
  // reappearing under new classes is not the same guarantee as the box
  // never disappearing. Reserving space on this one wrapper, and only ever
  // swapping its *contents*, removes the swap that caused the shift by
  // construction rather than by coincidence of matching classes.
  const aspectClass = effectiveIsHero ? "aspect-[16/9]" : "aspect-video";
  const roundedClass = effectiveIsHero ? "rounded-none sm:rounded-2xl" : "rounded-xl";

  const mediaBox = (
    <div className={`relative overflow-hidden w-full ${aspectClass} ${roundedClass} ${className}`}>
      {showFallback && fallback ? (
        fallback
      ) : showFallback ? (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${
            effectiveIsHero ? "from-muted/60 to-muted/30 border border-border" : "from-muted/50 to-muted/20"
          }`}
        >
          <div className="text-center">
            {imgError && !isCard ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-2" />
                <p className="text-xs text-muted-foreground">Image unavailable</p>
              </>
            ) : (
              <span className="text-5xl">{fallbackEmoji}</span>
            )}
          </div>
        </div>
      ) : (
        <>
          {isLoading && <div className="absolute inset-0 bg-muted animate-pulse" />}
          <img
            src={optimizedUrl(src!, effectiveIsHero ? 1200 : 640, quality)}
            srcSet={buildSrcSet(src!, quality)}
            sizes={effectiveSizes}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            referrerPolicy="no-referrer"
            {...(priority ? { fetchPriority: "high" as const } : {})}
            className={`absolute inset-0 w-full h-full object-cover shadow-md ${
              isLoading ? "opacity-0" : "opacity-100"
            } transition-opacity duration-300`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setImgError(true);
              setIsLoading(false);
            }}
          />
        </>
      )}
    </div>
  );

  if (isCard) {
    return mediaBox;
  }

  return (
    <figure className={figureClassName}>
      {mediaBox}
      {caption && (
        <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default OptimizedImage;
