import numpy as np
import os
mh = os.environ.get('MH_DATA', 'mh/mhrepo/makehuman/data/')
V=[];groups={};cur=None
for line in open(mh+'3dobjs/base.obj'):
    if line.startswith('v '): V.append([float(x) for x in line.split()[1:4]])
    elif line.startswith('g '): cur=line.split()[1]
    elif line.startswith('f ') and cur:
        groups.setdefault(cur,set()).update(int(t.split('/')[0])-1 for t in line.split()[1:])
V=np.array(V)
def target(name):
    D=np.zeros_like(V)
    for line in open(mh+'targets/macrodetails/'+name+'.target'):
        if line.startswith('#') or not line.strip(): continue
        p=line.split(); D[int(p[0])]=[float(p[1]),float(p[2]),float(p[3])]
    return D
body=np.array(sorted(groups['body']))
def procrustes(X,Y):
    # similarity transform mapping Y onto X
    mx,my=X.mean(0),Y.mean(0); X0,Y0=X-mx,Y-my
    U,S,Wt=np.linalg.svd(Y0.T@X0); R=U@Wt
    if np.linalg.det(R)<0: U[:,-1]*=-1; R=U@Wt
    s=S.sum()/ (Y0**2).sum()
    return lambda P:(P-my)@R*s+mx
def head_shapes(g):
    C=V+target(f'caucasian-{g}-young'); A=V+target(f'asian-{g}-young')
    top=C[body,1].max(); head=body[C[body,1]>top-2.4]
    f=procrustes(C[head],A[head]); A2=f(A)
    eyes={s:C[sorted(groups[f'helper-{s}-eye'])].mean(0) for s in 'lr'}
    return C,A2,head,eyes,top
if __name__=='__main__':
    for g in ('male','female'):
        C,A2,head,eyes,top=head_shapes(g)
        d=np.linalg.norm(A2[head]-C[head],axis=1)
        print(g,'shape delta on head (dm): mean',d.mean().round(4),'p95',np.percentile(d,95).round(4),'max',d.max().round(4))
        # where is it biggest
        idx=head[np.argsort(-d)[:8]]
        print('  biggest at y-top', (top-C[idx,1]).round(2), 'z', C[idx,2].round(2))
        print('  eyes', eyes['l'].round(2), eyes['r'].round(2))
