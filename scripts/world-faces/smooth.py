"""Smooths a face reshape: the per-vertex displacement taken from MakeHuman
by nearest neighbours is noisy at the lips and nostrils (neighbouring
vertices moved millimetres apart, crumpling the lips so the teeth showed
through). Each vertex takes the Gaussian-weighted average displacement of
everything within a few millimetres, across the head, eyelashes and hair."""
import json, sys, numpy as np
from scipy.spatial import cKDTree
def smooth_field(P, D, sigma=0.005, k=48, passes=2):
    tree = cKDTree(P)
    dist, idx = tree.query(P, k=k)
    w = np.exp(-(dist / sigma) ** 2 / 2)
    w /= w.sum(1, keepdims=True)
    for _ in range(passes):
        D = (D[idx] * w[..., None]).sum(1)
    return D
def meshes(d): return [k for k in d if any(s in k for s in ('Body', 'Eyelas', 'Hair'))]
if __name__ == '__main__':
    orig = json.load(open(sys.argv[1]))['pts']; cur = json.load(open(sys.argv[2]))['pts']
    names = meshes(orig)
    P = np.concatenate([np.array(orig[n]) for n in names]); C = np.concatenate([np.array(cur[n]) for n in names])
    D = smooth_field(P, C - P)
    out, k = {}, 0
    for n in names:
        m = len(orig[n]); out[n] = (P[k:k+m] + D[k:k+m]).tolist(); k += m
    json.dump(out, open(sys.argv[3], 'w'))
    print('max change from unsmoothed (mm):', (np.linalg.norm(D - (C - P), axis=1).max() * 1000).round(2))
