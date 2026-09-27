/**
 * WebGL support check. Deliberately free of three.js so the route shell can
 * run it before downloading the 3D bundle at all.
 */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    // Free the probe context straight away; browsers cap live contexts.
    (gl as WebGLRenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Touch-first device (no fine pointer): gets the joystick instead of key hints. */
export function isTouchFirst(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches;
  } catch {
    return false;
  }
}
