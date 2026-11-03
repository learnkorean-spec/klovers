import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { createPost } from "../game/systems/post";

/**
 * The same soft ambient-occlusion finish the live /world game uses under
 * eaves, counters, stools and people's feet (systems/post.ts's GTAO pass) —
 * reused as-is, not reimplemented, so World2 picks up the one visual
 * signature that reads most as "the live game's finish" without pulling in
 * any of World1's own room/camera/collision/story code.
 *
 * Self-contained: needs only what useThree() already gives any R3F scene,
 * same as the live game's own PostDriver (World.tsx) this is copied from.
 * `createPost` already returns null (and this becomes a no-op) on a
 * three.js build that lacks the internal steps it needs, so there's no new
 * failure mode here beyond what the live game already tolerates.
 *
 * Mount one per Canvas, as a direct child (it needs no Suspense boundary).
 */
export default function PostFinish() {
  const { scene, gl, camera, size } = useThree();
  const post = useMemo(
    () => createPost(gl, scene, camera, size.width, size.height),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gl, scene, camera],
  );
  useEffect(() => post?.setSize(size.width, size.height), [post, size]);
  useEffect(() => () => post?.dispose(), [post]);
  // Positive priority takes over drawing; without the finish, R3F draws as before.
  useFrame(() => post?.render(), post ? 1 : 0);
  return null;
}
