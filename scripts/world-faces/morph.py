"""Face blend shapes for one body: each MakeHuman target set becomes a morph
target (bind-space deltas, metres) on the head, eyelashes and hair, mapped
the same way koface.py maps the Korean face shape."""
import json, os, sys, numpy as np
from scipy.spatial import cKDTree
from smooth import smooth_field
sys.path.insert(0, '.')
from mhface import V, head_shapes
MH = os.environ.get('MH_DATA', 'mh/mhrepo/makehuman/data/') + 'targets/'
def tgt(path):
    D = np.zeros_like(V)
    for line in open(MH + path):
        if line.startswith('#') or not line.strip(): continue
        p = line.split(); D[int(p[0])] = [float(p[1]), float(p[2]), float(p[3])]
    return D
# name: [(target, weight)] — each one a natural range of difference between people.
SHAPES = {
    'faceRound':  [('head/head-round.target', 1.0), ('head/head-oval.target', -1.0)],
    'jawWide':    [('chin/chin-width-incr.target', 1.0), ('head/head-square.target', 0.35)],
    'cheekbones': [('cheek/l-cheek-bones-incr.target', 1.0), ('cheek/r-cheek-bones-incr.target', 1.0)],
    'eyesBig':    [('eyes/l-eye-scale-incr.target', 1.0), ('eyes/r-eye-scale-incr.target', 1.0)],
    'noseWide':   [('nose/nose-scale-horiz-incr.target', 1.0), ('nose/nose-nostrils-width-incr.target', 0.6)],
    'mouthFull':  [('mouth/mouth-scale-horiz-incr.target', 0.6), ('mouth/mouth-upperlip-volume-incr.target', 0.8), ('mouth/mouth-lowerlip-volume-incr.target', 0.8)],
    'chinLong':   [('chin/chin-height-incr.target', 1.0), ('chin/chin-prominent-incr.target', 0.4)],
}
def run(model_json, gender, out_json):
    d = json.load(open(model_json))['pts']
    C, A2, head, eyes, top = head_shapes(gender)
    mh_mid = (eyes['l'] + eyes['r']) / 2; mh_ipd = np.linalg.norm(eyes['l'] - eyes['r'])
    L = np.array(d[[k for k in d if 'Eyelas' in k][0]])
    lm = np.array([L[L[:, 0] < 0].mean(0), L[L[:, 0] > 0].mean(0)])
    mx_mid = lm.mean(0); s = np.linalg.norm(lm[0] - lm[1]) / mh_ipd
    tree = cKDTree(C[head])
    out = {'names': list(SHAPES), 'meshes': {}}
    names = [n for n in d if any(k in n for k in ('Body', 'Eyelas', 'Hair'))]
    P = np.concatenate([np.array(d[n]) for n in names]); Q = (P - mx_mid) / s + mh_mid
    dist, idx = tree.query(Q, k=6)
    w = 1.0 / np.maximum(dist, 1e-4) ** 2; w /= w.sum(1, keepdims=True)
    fall = np.clip((Q[:, 1] - (mh_mid[1] - 1.55)) / 0.4, 0, 1)
    near = np.clip(1 - (dist[:, 0] - 0.25) / 0.35, 0, 1)
    k = (fall * near)[:, None] * s
    per = []
    for sh, parts in SHAPES.items():
        D = sum(tgt(p) * wt for p, wt in parts)
        disp = smooth_field(P, (D[head][idx] * w[..., None]).sum(1) * k)
        m = np.linalg.norm(disp, axis=1)
        print(f'{sh}: moved {(m > 1e-5).sum()} max {m.max()*1000:.1f} mm')
        per.append(np.round(disp, 6))
    o = 0
    for n in names:
        c = len(d[n]); out['meshes'][n] = [p[o:o+c].tolist() for p in per]; o += c
    json.dump(out, open(out_json, 'w'))
if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[3])
