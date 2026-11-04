import * as React from "react";

/**
 * Radix's Dialog/AlertDialog/Sheet content is documented to restore focus to
 * whatever element was focused right before it opened, once it closes (via
 * its `onCloseAutoFocus` callback). Live testing on kloversegy.com/admin
 * found that restore was NOT happening in practice — closing a dialog left
 * focus on <body>, stranding keyboard users at the top of the page instead
 * of back where they were.
 *
 * Two earlier attempts at this fix (round 21, then a same-day follow-up)
 * both captured the trigger in a `useRef` set by a mount-time `useEffect`,
 * and both failed live re-testing for the same underlying reason, only
 * found by re-testing on production with real admin access:
 *
 * `DialogContent` (this wrapper) is NOT actually remounted each time the
 * dialog opens. Callers write `<Dialog open={x}><DialogContent>...` with
 * `DialogContent` always present in the JSX - Radix's `Dialog.Root` always
 * renders its children, and it's Radix's own internal `Presence`/`Portal`
 * machinery *inside* `DialogPrimitive.Content` (a layer below this wrapper)
 * that decides whether anything actually exists in the DOM. So this
 * wrapper component mounts exactly once, the first time its parent
 * renders - almost always before the dialog has ever been opened - and a
 * `useEffect(() => {...}, [])` inside it only ever runs that one time,
 * capturing a stale (often null, or whatever had focus at page load)
 * value forever. Every later open/close cycle read that same stale ref.
 *
 * The fix: don't capture into a per-mount ref at all. Track the last
 * focused element continuously in a module-level variable via a
 * capture-phase `focusin` listener on `document` (registered once,
 * independent of any component's mount/unmount lifecycle), skipping any
 * element that's inside an open dialog - and read that live value
 * directly when closing, not a value captured earlier.
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
  return React.useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      if (!event.defaultPrevented) {
        const trigger = lastFocusOutsideDialog;
        if (trigger && document.contains(trigger)) {
          event.preventDefault();
          trigger.focus();
        }
      }
    },
    [onCloseAutoFocus],
  );
}
