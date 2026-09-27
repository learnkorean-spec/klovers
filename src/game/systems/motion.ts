/** The learner prefers reduced motion: sways and wobbles stay still. */
export const REDUCED_MOTION = (() => {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
})();
