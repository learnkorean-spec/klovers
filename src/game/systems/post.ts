import { DoubleSide, type Camera, type Material, type Mesh, type Object3D, type Scene, type WebGLRenderer, type WebGLRenderTarget } from "three";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";

/**
 * The desktop finish: soft contact shade (ambient occlusion) where things
 * meet — under eaves and benches, in corners, at the feet of people, walls
 * and pots. Phones skip it (systems/quality.ts), as they skip shadows.
 *
 * How: the scene is drawn exactly as without it (straight to the canvas,
 * tone-mapped per material, multisampled), then the shade is multiplied
 * over the finished picture. Drawing through an effect composer instead
 * tone-mapped everything, which the brand yellow (rings, markers, accents),
 * the sign boards, the sky and the clover deliberately are not — tried and
 * dropped 15 Oct 2026. So was a glow: in late-afternoon light every sunlit
 * wall is already "bright", and it hazed the whole picture.
 */
export interface Post {
  render: () => void;
  setSize: (w: number, h: number) => void;
  dispose: () => void;
}

/** GTAOPass's own steps, used one by one (three 0.181). */
interface GtaoInternals {
  _overrideVisibility: () => void;
  _restoreVisibility: () => void;
  _visibilityCache: Object3D[];
  _renderOverride: (r: WebGLRenderer, m: Material, t: WebGLRenderTarget, c: number, a: number) => void;
  _renderPass: (r: WebGLRenderer, m: Material, t: WebGLRenderTarget | null, c?: number, a?: number) => void;
  normalMaterial: Material;
  normalRenderTarget: WebGLRenderTarget;
  gtaoMaterial: Material & { uniforms: Record<string, { value: unknown }> };
  gtaoRenderTarget: WebGLRenderTarget;
  pdMaterial: Material & { uniforms: Record<string, { value: unknown }> };
  pdRenderTarget: WebGLRenderTarget;
  blendMaterial: Material & { uniforms: Record<string, { value: unknown }> };
}

const seeThrough = (m: Material) => m.transparent || m.alphaTest > 0 || !m.depthWrite;

/** Null when this three.js no longer has the steps used here: the world then draws as before. */
export function createPost(gl: WebGLRenderer, scene: Scene, camera: Camera & { near?: number; far?: number }, w: number, h: number): Post | null {
  const gtao = new GTAOPass(scene, camera, w, h);
  const g = gtao as unknown as GtaoInternals;
  if (typeof g._renderOverride !== "function" || typeof g._renderPass !== "function" || typeof g._overrideVisibility !== "function" || !g.blendMaterial) {
    gtao.dispose();
    return null;
  }
  gtao.updateGtaoMaterial({ radius: 0.8, distanceExponent: 1.5, thickness: 1.2, scale: 1, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });

  // Both faces, as the models are drawn: the scanned props are double-sided,
  // and seen from behind their faces were culled out of the depth, which
  // turned them solid black.
  g.normalMaterial.side = DoubleSide;

  // Hair cards, cut-out leaves, glass, rings and markers would shade as
  // solid boards: leave them out of the depth the shade is measured from.
  const hide = () => {
    g._overrideVisibility();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || !m.visible) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      if (mats.some(seeThrough)) {
        m.visible = false;
        g._visibilityCache.push(m);
      }
    });
  };

  const cam = camera as Camera & { near: number; far: number; projectionMatrix: unknown; projectionMatrixInverse: unknown; matrixWorld: unknown };
  const set = (u: Record<string, { value: unknown }>, k: string, v: unknown) => {
    const slot = u[k];
    if (!slot) return;
    const cur = slot.value as { copy?: (x: unknown) => void };
    if (cur && typeof cur.copy === "function") cur.copy(v);
    else slot.value = v;
  };

  // Checks only: ?post=ao shows the shade by itself.
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("post") === "ao") g.blendMaterial.blending = 0;

  return {
    render: () => {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      // Normals and depth, without the see-through things.
      hide();
      g._renderOverride(gl, g.normalMaterial, g.normalRenderTarget, 0x7777ff, 1.0);
      g._restoreVisibility();
      const u = g.gtaoMaterial.uniforms;
      set(u, "cameraNear", cam.near);
      set(u, "cameraFar", cam.far);
      set(u, "cameraProjectionMatrix", cam.projectionMatrix);
      set(u, "cameraProjectionMatrixInverse", cam.projectionMatrixInverse);
      set(u, "cameraWorldMatrix", cam.matrixWorld);
      g._renderPass(gl, g.gtaoMaterial, g.gtaoRenderTarget, 0xffffff, 1.0);
      set(g.pdMaterial.uniforms, "cameraProjectionMatrixInverse", cam.projectionMatrixInverse);
      g._renderPass(gl, g.pdMaterial, g.pdRenderTarget, 0xffffff, 1.0);
      // Multiply the shade over the finished picture (the blend is DstColor × shade).
      set(g.blendMaterial.uniforms, "intensity", 1);
      set(g.blendMaterial.uniforms, "tDiffuse", g.pdRenderTarget.texture);
      g._renderPass(gl, g.blendMaterial, null);
    },
    // Measured at CSS-pixel size (not × device pixel ratio): soft shade
    // needs no more, and it keeps the cost down.
    setSize: (sw, sh) => gtao.setSize(sw, sh),
    dispose: () => gtao.dispose(),
  };
}
