import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom implements neither of these, and Radix's Popover/Command need both to
// mount. Without them any test that opens a combobox dies on the observer
// rather than on anything the component actually got wrong.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!("ResizeObserver" in globalThis)) {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
}

for (const method of ["hasPointerCapture", "setPointerCapture", "releasePointerCapture"] as const) {
  if (!(method in Element.prototype)) {
    Object.defineProperty(Element.prototype, method, { value: () => false, writable: true });
  }
}

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, "scrollIntoView", { value: () => {}, writable: true });
}

// jsdom implements neither the top layer nor the :modal/:fullscreen/:popover-open
// pseudo-classes, and asking it about one is pathological rather than merely
// unsupported. nwsapi resolves :modal through its isFullscreen() helper, which
// calls matchesNative() -> node.matches(':fullscreen') -> jsdom's
// Element.matches -> nwsapi again, recursing until the stack overflows. The
// overflow is swallowed by a try/catch inside floating-ui, so instead of an
// error the run silently burns CPU.
//
// @floating-ui/utils calls element.matches(':modal') from getContainingBlock(),
// which Radix's Popover reaches through Popper on every position update. Before
// this shim, opening one Popover in jsdom cost the Vitest worker ~30-90s of CPU
// (verified by profiling the worker from inside itself: nwsapi's `has` and
// `matchesNative` were the top two functions), which pushed whole test files
// past the 5s per-test timeout and past Vitest's 60s IPC timeout. A Dialog does
// not use Popper, which is why only the popover tests were affected.
//
// `false` is the correct answer here rather than a fudge: jsdom has no
// fullscreen element, no modal dialog and no popover top layer to report.
const TOP_LAYER_SELECTORS = new Set([":modal", ":fullscreen", ":popover-open"]);
const matchesNative = Element.prototype.matches;
Element.prototype.matches = function matches(this: Element, selectors: string) {
  if (typeof selectors === "string" && TOP_LAYER_SELECTORS.has(selectors.trim())) return false;
  return matchesNative.call(this, selectors);
};
