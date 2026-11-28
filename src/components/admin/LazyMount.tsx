import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders its children only once the spot is near the viewport.
 *
 * Today mounted every section at once, about 65 requests that all queued on
 * the same auth lock, so the cards below the fold slowed the ones she looks at
 * first (20+ seconds to fill in). Sections wrapped here start their queries
 * when she scrolls toward them. Without IntersectionObserver (old browsers,
 * tests) the children mount immediately.
 */
export default function LazyMount({
  children, minHeight = 160, margin = "600px",
}: { children: ReactNode; minHeight?: number; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, margin]);

  if (shown) return <>{children}</>;
  return <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
