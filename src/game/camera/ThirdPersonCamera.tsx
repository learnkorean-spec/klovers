import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { RoomLayout } from "../config/rooms";
import type { Box2 } from "../config/world";
import { CAMERA, MAX_DT } from "../config/world";
import { isBlocked } from "../systems/collision";
import { angleDelta, damp } from "../systems/movement";
import type { CameraState, PlayerState } from "../systems/state";

interface CameraProps {
  player: MutableRefObject<PlayerState>;
  camera: MutableRefObject<CameraState>;
  layout: RoomLayout;
  /** Called once when the pointer is first locked or dragged (hides the hint). */
  onFirstLook?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Passages the camera may back out through: every always-open gate (a
 * portal with no lock) continues 8 m past the wall, a little narrower than
 * the gate. Arriving just inside a gate, the camera then keeps its full
 * distance and frames the learner in the gateway instead of pressing in.
 */
function cameraOpenings(layout: RoomLayout): Box2[] {
  const b = layout.bounds;
  const out: Box2[] = [];
  for (const p of layout.portals) {
    if (p.lockedNotice) continue;
    const z = p.zone;
    const nx = (z.maxX - z.minX) / 2 - 0.2;
    const cx = (z.minX + z.maxX) / 2;
    const cz = (z.minZ + z.maxZ) / 2;
    const nz = (z.maxZ - z.minZ) / 2 - 0.2;
    if (z.maxZ >= b.maxZ - 1.2) out.push({ minX: cx - nx, maxX: cx + nx, minZ: b.maxZ - 1, maxZ: b.maxZ + 8 });
    else if (z.minZ <= b.minZ + 1.2) out.push({ minX: cx - nx, maxX: cx + nx, minZ: b.minZ - 8, maxZ: b.minZ + 1 });
    else if (z.maxX >= b.maxX - 1.2) out.push({ minX: b.maxX - 1, maxX: b.maxX + 8, minZ: cz - nz, maxZ: cz + nz });
    else if (z.minX <= b.minX + 1.2) out.push({ minX: b.minX - 8, maxX: b.minX + 1, minZ: cz - nz, maxZ: cz + nz });
  }
  return out;
}

function cameraBlocked(x: number, z: number, pad: number, layout: RoomLayout, openings: Box2[]): boolean {
  const b = layout.bounds;
  const outside = x < b.minX + pad || x > b.maxX - pad || z < b.minZ + pad || z > b.maxZ - pad;
  if (outside && !openings.some((o) => x > o.minX + pad && x < o.maxX - pad && z > o.minZ && z < o.maxZ)) return true;
  // Colliders only (bounds handled above, with the openings).
  return isBlocked(x, z, pad, layout.cameraColliders, { minX: -1e6, maxX: 1e6, minZ: -1e6, maxZ: 1e6 });
}

/**
 * Orbit-follow camera behind the player.
 *
 * Mouse: click the scene to lock the pointer and look around freely (Esc
 * releases it — the browser's own rule). If pointer lock is refused, dragging
 * with the button held works too, as does a touch drag. Wheel zooms within
 * limits. The camera pulls in rather than pass through a wall or column.
 */
export default function ThirdPersonCamera({ player, camera, layout, onFirstLook }: CameraProps) {
  const { camera: cam, gl, size } = useThree();
  const target = useRef(new Vector3());
  // Reused every frame — no per-frame allocations in the render loop.
  const desired = useRef(new Vector3());
  const dirRef = useRef(new Vector3());
  const initialised = useRef(false);
  const portrait = useRef(false);
  portrait.current = size.width < size.height;
  const openings = useMemo(() => cameraOpenings(layout), [layout]);
  const firstLook = useRef(onFirstLook);
  firstLook.current = onFirstLook;

  // Portrait phones see a narrow slice at the desktop FOV: widen it there.
  useEffect(() => {
    if (!("fov" in cam)) return;
    const persp = cam as typeof cam & { fov: number };
    persp.fov = size.width < size.height ? CAMERA.fovPortrait : size.height < 500 ? CAMERA.fovLandscapePhone : CAMERA.fov;
    cam.updateProjectionMatrix();
  }, [cam, size.width, size.height]);

  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let announced = false;

    const look = (dx: number, dy: number) => {
      const c = camera.current;
      c.yaw -= dx * CAMERA.mouseSensitivity;
      c.pitch = clamp(c.pitch + dy * CAMERA.mouseSensitivity, CAMERA.minPitch, CAMERA.maxPitch);
      if (!announced) {
        announced = true;
        firstLook.current?.();
      }
    };

    const locked = () => document.pointerLockElement === el;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0 && !locked()) {
        try {
          const req = el.requestPointerLock() as unknown as Promise<void> | undefined;
          // Chrome returns a promise that rejects if the user just left lock;
          // dragging still works, so the failure is harmless.
          req?.catch?.(() => undefined);
        } catch {
          /* pointer lock unsupported — drag fallback below */
        }
      }
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      // Capture keeps a drag alive past the canvas edge. It throws while the
      // pointer is being locked, which is fine: lock supersedes the drag.
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* locked or pointer already gone */
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (locked()) {
        look(e.movementX, e.movementY);
      } else if (dragging) {
        look(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = camera.current;
      c.distance = clamp(c.distance + e.deltaY * 0.004, CAMERA.minDistance, CAMERA.maxDistance);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    // Touch drags must rotate the camera, not scroll or zoom the page.
    el.style.touchAction = "none";

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("wheel", onWheel);
      if (document.pointerLockElement === el) document.exitPointerLock();
    };
  }, [gl, camera]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, MAX_DT);
    const c = camera.current;
    const p = player.current.position;

    if (c.focus) desired.current.set(c.focus.x, c.focus.y, c.focus.z);
    else desired.current.set(p.x - Math.sin(c.yaw) * CAMERA.lookAhead, p.y + CAMERA.targetHeight, p.z - Math.cos(c.yaw) * CAMERA.lookAhead);
    // Story reframing eases slowly; normal follow is brisk.
    const sharp = c.focus || c.yawTarget !== null ? 2.5 : CAMERA.followSharpness;
    if (c.yawTarget !== null) c.yaw += angleDelta(c.yaw, c.yawTarget) * damp(2.5, dt);
    if (c.pitchTarget !== null) c.pitch += (c.pitchTarget - c.pitch) * damp(2.5, dt);
    if (c.snap) {
      // After a teleport (room change) jump straight behind the player.
      initialised.current = false;
      c.snap = false;
    }
    if (!initialised.current) {
      target.current.copy(desired.current);
    } else {
      target.current.lerp(desired.current, damp(sharp, dt));
    }

    // Direction from the target back to the camera.
    const cosP = Math.cos(c.pitch);
    const dir = dirRef.current.set(Math.sin(c.yaw) * cosP, Math.sin(c.pitch), Math.cos(c.yaw) * cosP);

    // Walk out from the player until a wall or column would be hit.
    const want = c.distance * (portrait.current ? CAMERA.portraitDistance : 1);
    let free = want;
    const step = 0.1;
    for (let d = step; d <= want; d += step) {
      const x = target.current.x + dir.x * d;
      const z = target.current.z + dir.z * d;
      // Above eave height (≈ 3 m) the camera would sit inside the roofs that
      // overhang the walls, so it keeps further from them the higher it is.
      const y = target.current.y + dir.y * d;
      const pad = CAMERA.wallPadding + Math.max(0, y - 2.8) * 0.9;
      if (cameraBlocked(x, z, pad, layout, openings)) {
        free = Math.max(d - step, CAMERA.minDistance * 0.5);
        break;
      }
    }
    // Snap in immediately (never clip), ease back out gently.
    c.currentDistance = !initialised.current || free < c.currentDistance
      ? free
      : c.currentDistance + (free - c.currentDistance) * damp(4, dt);

    // Pulled in by a wall behind: tilt down a little so the learner stays
    // framed full-length instead of filling the screen. (Tilting only
    // shortens the horizontal reach, so it never re-enters the wall.)
    const squeeze = Math.max(0, 1 - c.currentDistance / Math.max(want, 0.001));
    if (squeeze > 0.02) {
      const p2 = Math.min(c.pitch + squeeze * 0.42, CAMERA.maxPitch + 0.1);
      const cp = Math.cos(p2);
      dir.set(Math.sin(c.yaw) * cp, Math.sin(p2), Math.cos(c.yaw) * cp);
    }
    cam.position.copy(target.current).addScaledVector(dir, c.currentDistance);
    cam.lookAt(target.current);
    initialised.current = true;
  }, -1);

  return null;
}
