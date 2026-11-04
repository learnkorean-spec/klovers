import * as React from "react";

/**
 * Radix's Dialog/AlertDialog/Sheet content is documented to restore focus to
 * whatever element was focused right before it opened, once it closes (via
 * its `onCloseAutoFocus` callback). Live testing on kloversegy.com/admin
 * found that restore was NOT happening in practice — closing a dialog left
 * focus on <body>, stranding keyboard users at the top of the page instead
 * of back where they were.
 *
 * The first attempt at this fix (round 21) captured the trigger in a plain
 * `useEffect` on mount, reading `document.activeElement` at that point. That
 * doesn't work: Radix's own `FocusScope` (a descendant of this component, so
 * its effects run first - React fires child effects before parent effects)
 * already auto-focuses something inside the dialog by the time our effect
 * runs, so `document.activeElement` was already wrong - still inside the
 * dialog, not the real trigger. Re-tested live after shipping and confirmed
 * this: focus still landed on <body> after Escape, not the trigger.
 *
 * The fix: track the last focused element continuously via a capture-phase
 * `focusin` listener on `document`, skipping any element that's inside an
 * open dialog. That listener fires synchronously on the original trigger
 * click/focus, well before Radix's dialog even mounts - so by the time this
 * hook needs the value, it was already recorded correctly, independent of
 * effect ordering.
 */
let lastFocusOutsideDialog: HTMLElement | null = null;

if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && !target.closest('[role="dialog"], [role="alertdialog"]')) {
        lastFocusOutsideDialog = target;
      }
    },
    true,
  );
}

export function useRestoreFocusOnClose(onCloseAutoFocus?: (event: Event) => void) {
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    triggerRef.current = lastFocusOutsideDialog;
  }, []);

  return React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      if (!event.defaultPrevented) {
        const trigger = triggerRef.current;
        if (trigger && document.contains(trigger)) {
          event.preventDefault();
          trigger.focus();
        }
      }
    },
    [onCloseAutoFocus],
  );
}
