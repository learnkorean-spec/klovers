import { useEffect, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { BOUNDS, CAMERA, CAMERA_COLLIDERS, MAX_DT } from "../config/world";
import { isBlocked } from "../systems/collision";
import { damp } from "../systems/movement";
import type { CameraState, PlayerState } from "../systems/state";

interface CameraProps {
  player: MutableRefObject<PlayerState>;
  camera: MutableRefObject<CameraState>;
  /** Called once when the pointer is first locked or dragged (hides the hint). */
  onFirstLook?: () => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Orbit-follow camera behind the player.
 *
 * Mouse: click the scene to lock the pointer and look around freely (Esc
 * releases it — the browser's own rule). If pointer lock is refused, dragging
 * with the button held works too, as does a touch drag. Wheel zooms within
 * limits. The camera pulls in rather than pass through a wall or column.
 */
export default function ThirdPersonCamera({ player, camera, onFirstLook }: CameraProps) {
  const { camera: cam, gl } = useThree();
  const target = useRef(new Vector3());
  // Reused every frame — no per-frame allocations in the render loop.
  const desired = useRef(new Vector3());
  const dirRef = useRef(new Vector3());
  const initialised = useRef(false);
  const firstLook = useRef(onFirstLook);
  firstLook.current = onFirstLook;

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

    desired.current.set(p.x, p.y + CAMERA.targetHeight, p.z);
    if (!initialised.current) {
      target.current.copy(desired.current);
    } else {
      target.current.lerp(desired.current, damp(CAMERA.followSharpness, dt));
    }

    // Direction from the target back to the camera.
    const cosP = Math.cos(c.pitch);
    const dir = dirRef.current.set(Math.sin(c.yaw) * cosP, Math.sin(c.pitch), Math.cos(c.yaw) * cosP);

    // Walk out from the player until a wall or column would be hit.
    let free = c.distance;
    const step = 0.1;
    for (let d = step; d <= c.distance; d += step) {
      const x = target.current.x + dir.x * d;
      const z = target.current.z + dir.z * d;
      if (isBlocked(x, z, CAMERA.wallPadding, CAMERA_COLLIDERS, BOUNDS)) {
        free = Math.max(d - step, CAMERA.minDistance * 0.5);
        break;
      }
    }
    // Snap in immediately (never clip), ease back out gently.
    c.currentDistance = !initialised.current || free < c.currentDistance
      ? free
      : c.currentDistance + (free - c.currentDistance) * damp(4, dt);

    cam.position.copy(target.current).addScaledVector(dir, c.currentDistance);
    cam.lookAt(target.current);
    initialised.current = true;
  }, -1);

  return null;
}
