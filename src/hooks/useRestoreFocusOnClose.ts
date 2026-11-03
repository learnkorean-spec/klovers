import * as React from "react";

/**
 * Radix's Dialog/AlertDialog/Sheet content is documented to restore focus to
 * whatever element was focused right before it opened, once it closes (via
 * its `onCloseAutoFocus` callback). Live testing on kloversegy.com/admin
 * found that restore was NOT happening in practice — closing a dialog left
 * focus on <body>, stranding keyboard users at the top of the page instead
 * of back where they were.
 *
 * This hook captures the triggering element explicitly when the dialog
 * content mounts, and restores focus to it on close itself — only when
 * nothing else (a caller-supplied `onCloseAutoFocus`) already handled it.
 */
export function useRestoreFocusOnClose(onCloseAutoFocus?: (event: Event) => void) {
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
