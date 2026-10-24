import json, os, sys, numpy as np
from scipy.spatial import cKDTree
sys.path.insert(0, '.')
from mhface import V, groups, target, body, head_shapes
mh = os.environ.get('MH_DATA', 'mh/mhrepo/makehuman/data/') + 'targets/'
def tgt(path):
    D = np.zeros_like(V)
    for line in open(mh + path):
        if line.startswith('#') or not line.strip(): continue
        p = line.split(); D[int(p[0])] = [float(p[1]), float(p[2]), float(p[3])]
    return D
# Realistic, moderate East Asian features (no caricature).
FEATURES = [
    ('eyes/l-eye-epicanthus-in.target', 0.7), ('eyes/r-eye-epicanthus-in.target', 0.7),
    ('eyes/l-eye-eyefold-down.target', 0.5), ('eyes/r-eye-eyefold-down.target', 0.5),
    ('nose/nose-hump-decr.target', 0.5), ('nose/nose-scale-depth-decr.target', 0.3),
    ('nose/nose-flaring-incr.target', 0.2),
]
def field(gender, strength=1.0, race=1.0):
    C, A2, head, eyes, top = head_shapes(gender)
    D = (A2 - C) * race
    for p, w in FEATURES: D = D + tgt(p) * w
    D *= strength
    eyemid = (eyes['l'] + eyes['r']) / 2
    ipd = np.linalg.norm(eyes['l'] - eyes['r'])
    return C, D, head, eyemid, ipd
def apply(model_json, prefix, gender, out_json, strength=1.0, race=1.0):
    d = json.load(open(model_json))['pts']
    C, D, head, mh_mid, mh_ipd = field(gender, strength, race)
    L = np.array(d[[k for k in d if 'Eyelas' in k][0]])
    lm = np.array([L[L[:, 0] < 0].mean(0), L[L[:, 0] > 0].mean(0)])
    mx_mid = lm.mean(0); mx_ipd = np.linalg.norm(lm[0] - lm[1])
    s = mx_ipd / mh_ipd  # metres per MH unit
    tree = cKDTree(C[head])
    out = {}
    for name, pts in d.items():
        if not any(k in name for k in ('Body', 'Eyelas', 'Hair')): continue
        P = np.array(pts)
        Q = (P - mx_mid) / s + mh_mid
        dist, idx = tree.query(Q, k=6)
        w = 1.0 / np.maximum(dist, 1e-4) ** 2; w /= w.sum(1, keepdims=True)
        disp = (D[head][idx] * w[..., None]).sum(1)
        # Only the head: full above the chin, fading out down the neck; nothing far from the head.
        ey = mh_mid[1]
        fall = np.clip((Q[:, 1] - (ey - 1.55)) / 0.4, 0, 1)
        near = np.clip(1 - (dist[:, 0] - 0.25) / 0.35, 0, 1)
        Pn = P + disp * s * (fall * near)[:, None]
        moved = np.linalg.norm(Pn - P, axis=1)
        out[name] = Pn.tolist()
        print(f'{name}: {len(P)} verts, moved {int((moved > 1e-5).sum())}, max {moved.max()*1000:.1f} mm, mean of moved {moved[moved>1e-5].mean()*1000 if (moved>1e-5).any() else 0:.1f} mm')
    json.dump(out, open(out_json, 'w'))
if __name__ == '__main__':
    apply(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], float(sys.argv[5]) if len(sys.argv) > 5 else 1.0, float(sys.argv[6]) if len(sys.argv) > 6 else 1.0)
