import { useState } from "react";
import { AlertCircle } from "lucide-react";

interface OptimizedImageProps {
  src?: string;
  alt: string;
  caption?: string;
  className?: string;
  figureClassName?: string;
  isHero?: boolean;
  fallbackEmoji?: string;
}

/**
 * Optimized image component with lazy loading, error handling, and responsive behavior
 * Prevents layout shifts and provides graceful degradation for missing/broken images
 */
const OptimizedImage = ({
  src,
  alt,
  caption,
  className = "w-full object-cover",
  figureClassName = "mb-8 -mx-4 sm:mx-0",
  isHero = false,
  fallbackEmoji = "📖",
}: OptimizedImageProps) => {
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate URL format
  const isValidUrl = src && (src.startsWith("http://") || src.startsWith("https://"));

  if (!isValidUrl || imgError) {
    return (
      <figure className={figureClassName}>
        <div
          className={`
            w-full flex items-center justify-center
            ${isHero ? "aspect-[16/9] rounded-none sm:rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border" : "aspect-video bg-gradient-to-br from-muted/50 to-muted/20"}
            ${className}
          `}
        >
          <div className="text-center">
            {imgError ? (
              <>
                <AlertCircle className="h-12 w-12 mx-auto text-destructive/50 mb-2" />
                <p className="text-xs text-muted-foreground">Image unavailable</p>
              </>
            ) : (
              <span className="text-5xl">{fallbackEmoji}</span>
            )}
          </div>
        </div>
        {caption && (
          <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className={figureClassName}>
      <div className={`relative overflow-hidden ${isHero ? "rounded-none sm:rounded-2xl" : "rounded-xl"}`}>
        {isLoading && (
          <div className={`absolute inset-0 bg-muted animate-pulse ${isHero ? "aspect-[16/9]" : "aspect-video"}`} />
        )}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`
            ${className}
            ${isHero ? "rounded-none sm:rounded-2xl aspect-[16/9] shadow-md" : "rounded-xl shadow-md"}
            ${isLoading ? "opacity-0" : "opacity-100"}
            transition-opacity duration-300
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImgError(true);
            setIsLoading(false);
          }}
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-muted-foreground mt-2 text-center italic px-4 sm:px-0">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

export default OptimizedImage;
