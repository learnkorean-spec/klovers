import { useEffect, useMemo } from "react";
import { Euler, Matrix4, Quaternion, Vector3, type BufferGeometry, type Material } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Static furniture built from many small hand-made shapes (a table's top,
 * edge band, pedestal and foot; a chair's legs, seat, cushion and slats)
 * drawn as one mesh per finish instead of one per shape. Each piece keeps
 * its exact geometry — only the draw calls go: a café of four tables for
 * two was ≈95 calls on a phone, as many as a whole room should cost.
 *
 * Only for parts that never move or change finish on their own.
 */

export interface Piece {
  geo: BufferGeometry;
  mat: Material;
  p: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
}

/** A place in a parent's frame: position, yaw-pitch-roll and scale (a group's transform). */
export interface Frame {
  p: [number, number, number];
  r?: [number, number, number];
  s?: [number, number, number];
}

const _m = new Matrix4();
const _q = new Quaternion();
const _e = new Euler();
const _v = new Vector3();
const _s = new Vector3();

function matrixOf(f: Frame, out: Matrix4): Matrix4 {
  _e.set(...(f.r ?? [0, 0, 0]));
  _q.setFromEuler(_e);
  return out.compose(_v.set(...f.p), _q, _s.set(...(f.s ?? [1, 1, 1])));
}

/**
 * Collects pieces in nested frames, like nested <group>s: `at(frame, fn)`
 * places everything `fn` adds inside that frame.
 */
export class Pieces {
  readonly list: { geo: BufferGeometry; mat: Material; m: Matrix4 }[] = [];
  private stack: Matrix4[] = [new Matrix4()];

  at(f: Frame, fn: () => void): this {
    const m = this.stack[this.stack.length - 1].clone().multiply(matrixOf(f, new Matrix4()));
    this.stack.push(m);
    fn();
    this.stack.pop();
    return this;
  }

  add(piece: Piece): this {
    const m = this.stack[this.stack.length - 1].clone().multiply(matrixOf(piece, _m));
    this.list.push({ geo: piece.geo, mat: piece.mat, m });
    return this;
  }

  /** One geometry per finish, in the frame the pieces were collected in. */
  build(): { geo: BufferGeometry; mat: Material }[] {
    const byMat = new Map<Material, BufferGeometry[]>();
    for (const { geo, mat, m } of this.list) {
      const g = geo.clone().applyMatrix4(m);
      // Same attributes on every piece, or they cannot be merged.
      for (const name of Object.keys(g.attributes)) if (name !== "position" && name !== "normal" && name !== "uv") g.deleteAttribute(name);
      const l = byMat.get(mat) ?? [];
      l.push(g);
      byMat.set(mat, l);
    }
    const out: { geo: BufferGeometry; mat: Material }[] = [];
    for (const [mat, geos] of byMat) {
      const indexed = geos.some((g) => g.index);
      const ready = indexed ? geos.map((g) => (g.index ? g : withIndex(g))) : geos;
      const merged = mergeGeometries(ready, false);
      geos.forEach((g) => g.dispose());
      if (merged) {
        merged.computeBoundingSphere();
        out.push({ geo: merged, mat });
      }
    }
    return out;
  }
}

function withIndex(g: BufferGeometry): BufferGeometry {
  const n = g.getAttribute("position").count;
  g.setIndex(Array.from({ length: n }, (_, i) => i));
  return g;
}

/** Draws what `build` returns; the merged geometries are freed with the room (the materials are shared, so kept). */
export default function Merged({ build, castShadow = false, receiveShadow = false }: { build: () => Pieces; castShadow?: boolean; receiveShadow?: boolean }) {
  const parts = useMemo(() => build().build(), [build]);
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);
  return (
    <>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geo} castShadow={castShadow} receiveShadow={receiveShadow}>
          <primitive object={p.mat} attach="material" />
        </mesh>
      ))}
    </>
  );
}
