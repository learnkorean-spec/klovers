import { useEffect, useRef } from "react";
import { NO_INPUT, type MoveInput } from "./movement";

/**
 * Keyboard state read once per frame (a ref, never React state, so holding a
 * key does not re-render anything).
 *
 * Matched on KeyboardEvent.code — the physical key — not .key, so WASD works
 * the same on an Arabic, AZERTY or any other keyboard layout.
 */
const BINDINGS: Record<string, keyof MoveInput> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "run",
  ShiftRight: "run",
};

export function useMoveInput() {
  const state = useRef<MoveInput>({ ...NO_INPUT });

  useEffect(() => {
    const set = (e: KeyboardEvent, down: boolean) => {
      const action = BINDINGS[e.code];
      if (!action) return;
      // Ignore keys typed into a form field, should the HUD ever gain one.
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      state.current[action] = down;
      // Arrow keys would otherwise scroll the page behind the canvas.
      if (e.code.startsWith("Arrow")) e.preventDefault();
    };
    const onDown = (e: KeyboardEvent) => set(e, true);
    const onUp = (e: KeyboardEvent) => set(e, false);
    // Losing focus (alt-tab) must not leave a key "stuck" down.
    const reset = () => {
      state.current = { ...NO_INPUT };
    };
    const onVisibility = () => {
      if (document.hidden) reset();
    };

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", reset);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return state;
}
