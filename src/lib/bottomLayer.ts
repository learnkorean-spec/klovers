import { useEffect, useState } from "react";

/**
 * One bottom-anchored overlay at a time.
 *
 * Four components used to pin themselves to the bottom of the viewport with
 * no knowledge of each other: HomeExitNudge (fixed bottom-0, z-50),
 * StickyEnrollBar (fixed bottom-0, z-40 - directly underneath it),
 * InstallPrompt (fixed bottom-20, z-200 - above both) and
 * InterviewBannerChip (fixed bottom-32). On the homepage all four could be
 * up simultaneously, and the nudge painted straight over the enrol bar with
 * half its text showing. A visitor reading four competing asks generally
 * answers none of them.
 *
 * The WhatsApp bubble is deliberately NOT in here. It sits on the right edge
 * rather than across the bottom, it is support rather than a pitch, and it is
 * the one thing that should always be reachable. Two floating elements is the
 * intended maximum: WhatsApp, plus whichever of these wins.
 *
 * Priority is the array below, highest first:
 * 1. exitNudge - the visitor is leaving; this is the last ask.
 * 2. stickyBar - the standing ask while they read.
 * 3. installPrompt - useful, but it is not why anyone came to the page.
 * 4. interviewChip - a feature promo, and the one to sacrifice.
 *
 * In practice the chip now appears only once the enrol bar has been
 * dismissed. That is the intended trade, not an oversight: if the chip should
 * outrank the bar instead, swap the two entries here and nothing else
 * changes.
 *
 * installPrompt is the one slot whose component is mounted app-wide rather
 * than on the homepage only (App.tsx). Everywhere except the homepage it is
 * the sole claimant and so is unaffected by this ordering; on the homepage it
 * waits for the enrol bar, which the visitor can dismiss. It is ranked below
 * the bar because the bar is the ask the business is actually making, and
 * because neither of them times out on its own - whichever wins holds the
 * slot until dismissed.
 *
 * Module-level state rather than a React context on purpose - this is a
 * single global layer, the components are mounted in four different places
 * in the tree, and wrapping the app in a provider to coordinate four
 * booleans would be the heavier change.
 */
export type BottomSlot = "exitNudge" | "stickyBar" | "installPrompt" | "interviewChip";

const PRIORITY: BottomSlot[] = ["exitNudge", "stickyBar", "installPrompt", "interviewChip"];

const claimed = new Set<BottomSlot>();
const listeners = new Set<() => void>();

const winner = (): BottomSlot | null => PRIORITY.find((s) => claimed.has(s)) ?? null;

const notify = () => listeners.forEach((l) => l());

/**
 * Declare that this slot wants the bottom of the screen. Returns true only
 * when it both wants it and outranks everything else currently asking.
 *
 * Call it unconditionally, like any hook, and gate the render on the result:
 *
 * const allowed = useBottomSlot("stickyBar", visible && !dismissed);
 * if (!allowed) return null;
 */
export const useBottomSlot = (slot: BottomSlot, wantsToShow: boolean): boolean => {
  const [active, setActive] = useState<BottomSlot | null>(winner);

  useEffect(() => {
    const listener = () => setActive(winner());
    listeners.add(listener);
    // The winner may already have changed between this component's first
    // render and this effect running - re-read rather than trusting state.
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (wantsToShow) claimed.add(slot);
    else claimed.delete(slot);
    notify();
    // Releasing on unmount matters: a component that leaves the tree while
    // holding the slot would otherwise block everything below it forever.
    return () => {
      claimed.delete(slot);
      notify();
    };
  }, [slot, wantsToShow]);

  return wantsToShow && active === slot;
};

/**
 * True whenever ANY bottom slot currently holds the floor, regardless of
 * which one. For consumers that are not themselves one of the four slots but
 * still need to react to "something is pinned to the bottom of the screen
 * right now" â€” e.g. HeroSection's proof strip, which is positioned relative
 * to the hero section rather than the viewport and so has no way to detect a
 * fixed, viewport-pinned overlay like HomeExitNudge without this.
 *
 * Added 22 Sep 2026 after exactly that: on a short viewport where the hero
 * still fills the screen, HomeExitNudge (fixed bottom-0 of the viewport)
 * painted straight over the hero's stats strip (absolute bottom-0 of the
 * section) â€” the two had no way to know about each other.
 */
export const useAnyBottomSlotActive = (): boolean => {
  const [active, setActive] = useState<boolean>(() => winner() !== null);

  useEffect(() => {
    const listener = () => setActive(winner() !== null);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return active;
};


/**
 * True whenever ANY bottom slot currently holds the floor, regardless of
 * which one. For consumers that are not themselves one of the four slots but
 * still need to react to "something is pinned to the bottom of the screen
 * right now" -- e.g. HeroSection's proof strip, which is positioned relative
 * to the hero section rather than the viewport and so has no way to detect a
 * fixed, viewport-pinned overlay like HomeExitNudge without this.
 *
 * Added 22 Sep 2026 after exactly that: on a short viewport where the hero
 * still fills the screen, HomeExitNudge (fixed bottom-0 of the viewport)
 * painted straight over the hero's stats strip (absolute bottom-0 of the
 * section) -- the two had no way to know about each other.
 */
export const useAnyBottomSlotActive = (): boolean => {
  const [active, setActive] = useState<boolean>(() => winner() !== null);

  useEffect(() => {
    const listener = () => setActive(winner() !== null);
    listeners.add(listener);
    listener();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return active;
};
