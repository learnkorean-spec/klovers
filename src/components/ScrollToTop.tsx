import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useAnyBottomSlotActive } from "@/lib/bottomLayer";

const ScrollToTop = () => {
  const [visible, setVisible] = useState(false);
  // While a bottom bar is up (booking bar, consent, install prompt) the
  // WhatsApp bubble rises to bottom-28; this stacks above both instead of
  // sitting on the bar's buttons.
  const bottomBarUp = useAnyBottomSlotActive();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed ${bottomBarUp ? "bottom-48" : "bottom-6"} right-6 z-50 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
};

export default ScrollToTop;
