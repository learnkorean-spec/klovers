import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reset for the AI Room Lab tools (Re, 13 Nov 2026: "make all tools here can
 * be reset"). Generated pictures cost Meta credit, so a reset needs a second
 * click within a few seconds instead of wiping them on one stray click.
 */
export default function ResetButton({ onReset, label = "Reset" }: { onReset: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <Button
      type="button"
      size="sm"
      variant={armed ? "destructive" : "outline"}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onReset();
        } else {
          setArmed(true);
        }
      }}
    >
      <RotateCcw className="h-3.5 w-3.5 mr-1" />
      {armed ? "Click again to reset" : label}
    </Button>
  );
}
