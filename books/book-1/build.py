#!/usr/bin/env python3
"""Klovers Book 1 generator (A0 style, brand yellow #FFFF00 only). Usage: python3 build.py 05  -> out/unit-05.pdf
Reads units/NN.json, writes HTML, prints to PDF with headless Chrome (A5)."""
import json, sys, subprocess, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent.parent
ICONS = REPO / "public/picture-library/icons"
LOGO = REPO / "public/klovers-logo.jpg"
AR = "٠١٢٣٤٥٦٧٨٩"
def n(x): return "".join(AR[int(c)] if c.isdigit() else c for c in str(x))
import re
def e(x):
    """escape and wrap every Korean run (with its attached - ( ) / ~ marks) in an isolated LTR span"""
    H="[가-힣ㄱ-ㅣ]"; T="[가-힣ㄱ-ㅣ/()~+\\-·]"
    pat=re.compile(r"[-+~(]*"+H+T+"*(?: "+H+T+"*)*")
    return pat.sub(lambda m:'<span class="kr">'+html.escape(m.group(0))+'</span>', x).replace("&","&amp;").replace("&amp;amp;","&amp;") if False else _wrap(x,pat)
def _wrap(x,pat):
    out=[];i=0
    for m in pat.finditer(x):
        out.append(html.escape(x[i:m.start()])); out.append('<span class="kr">'+html.escape(m.group(0))+'</span>'); i=m.end()
    out.append(html.escape(x[i:])); return "".join(out)

CSS = """
@font-face{font-family:Cairo;font-weight:400;src:url(fonts/cairo-arabic-400-normal.woff2)}
@font-face{font-family:Cairo;font-weight:700;src:url(fonts/cairo-arabic-700-normal.woff2)}
@font-face{font-family:KR;font-weight:400;src:url(fonts/noto-sans-kr-korean-400-normal.woff2)}
@font-face{font-family:KR;font-weight:700;src:url(fonts/noto-sans-kr-korean-700-normal.woff2)}
@page{size:148mm 210mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Cairo,KR,sans-serif;color:#1a1a1a;direction:rtl;background:#FFF9EC}
.page{width:148mm;height:210mm;background:#FFF9EC;position:relative;overflow:hidden;page-break-after:always;padding:15mm 11mm 17mm}
.hd{position:absolute;top:5mm;left:8mm;right:8mm;display:flex;justify-content:space-between;align-items:center;font-size:7.5pt;border-bottom:.3mm solid #1a1a1a;padding-bottom:1.5mm}
.hd .logo{display:flex;align-items:center;gap:2mm;font-weight:700}.hd img{width:7mm;height:7mm;border-radius:50%}
.ft{position:absolute;bottom:4mm;left:8mm;right:8mm;display:flex;justify-content:space-between;font-size:6.5pt;color:#555;border-top:.2mm solid #ccc;padding-top:1.5mm}
.kr{font-family:KR,Cairo;direction:ltr;unicode-bidi:isolate}
h1{font-size:20pt;margin:4mm 0 1mm}h2{font-size:12pt;margin:4mm 0 2mm}
.sub{font-size:9pt;color:#444;margin-bottom:3mm}
.box{background:#FFF9EC;border:.35mm solid #FFFF00;border-radius:3mm;padding:3mm 4mm;margin:2.5mm 0}
.tag{display:inline-block;background:#FFFF00;border-radius:1.5mm;font-size:7.5pt;font-weight:700;padding:.3mm 2mm;margin-left:2mm}
.goals li{font-size:9pt;margin:1mm 5mm 1mm 0}
.vg{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin-top:2mm}
.v{border:.35mm solid #FFFF00;border-radius:3mm;padding:2mm 1mm;text-align:center;background:#FFF9EC}
.v img{width:13mm;height:13mm;object-fit:contain;mix-blend-mode:multiply}
.v .k{font-size:12.5pt;font-weight:700}.v .a{font-size:8pt;color:#333}
table{width:100%;border-collapse:collapse;font-size:9pt}td,th{border:.3mm solid #1a1a1a;padding:1.6mm 2mm;text-align:right}th{background:#FFFF00}
.big{font-size:20pt;font-weight:700;text-align:center}
.dl{display:grid;grid-template-columns:1fr 1fr 12mm;direction:ltr;gap:3mm;margin:2.2mm 0;align-items:center;border-bottom:.2mm dotted #bbb;padding-bottom:2mm}
.who{min-width:11mm;font-size:8pt;font-weight:700;background:#FFFF00;border-radius:1.5mm;text-align:center;padding:.6mm}
.dk{font-family:KR,Cairo;font-size:10.5pt;font-weight:700;direction:ltr;text-align:left}.da{font-size:9pt;color:#333;direction:rtl;text-align:right}
.cl{margin-top:3mm;border:.35mm solid #1a1a1a;border-radius:3mm;padding:2.5mm 3.5mm;font-size:8.5pt;background:#FFF9EC}
.num{display:inline-block;min-width:5mm;text-align:center;background:#FFFF00;border-radius:1.5mm;font-size:8pt;font-weight:700;margin-left:1.5mm}
.ch{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm 5mm}.ch div{font-size:10.5pt;border-bottom:.2mm dotted #bbb;padding:1.2mm 0;display:flex;justify-content:space-between}
.fl{display:flex;gap:2mm;align-items:center;direction:ltr;margin:.9mm 0;font-size:10pt;border-bottom:.2mm dotted #bbb;padding:.5mm 0}.fl .ln{flex:1;border-bottom:.3mm solid #1a1a1a;height:4mm}.kko{direction:ltr;text-align:left;font-family:KR,Cairo;font-weight:700}.aar{direction:rtl;text-align:right}\n.opt{display:inline-block;margin-left:5mm;font-size:10pt}
"""

def frame(body, idx, total, title, u):
    return f'''<section class="page"><div class="hd"><span>الوحدة {n(u)} · {e(title)}</span>
<span class="logo">كلوفرز <img src="data:image/jpeg;base64,{LOGO_B64}"></span></div>{body}
<div class="ft"><span>تعلّم الكورية، عِشها، أحبّها.</span><span>الصفحة {n(idx)} من {n(total)}</span><span>kloversegy.com</span></div></section>'''

import base64
LOGO_B64 = base64.b64encode(LOGO.read_bytes()).decode()
def icon(f):
    return "data:image/jpeg;base64," + base64.b64encode((ICONS / f"{f}.jpg").read_bytes()).decode()

def blk(b):
    t=b["type"]
    if t=="title":
        return (f'<p class="sub">{e(b["kicker"])}</p>' if b.get("kicker") else "")+f'<h1>{e(b["h1"])}</h1>'+(f'<p class="sub">{e(b["sub"])}</p>' if b.get("sub") else "")
    if t=="text": return f'<p class="sub">{e(b["text"])}</p>'
    if t=="goals":
        return f'<div class="box"><span class="tag">★</span><b>{e(b.get("title","في نهاية هذه الوحدة"))}</b><ul class="goals">'+"".join(f"<li>{e(g)}</li>" for g in b["items"])+"</ul></div>"
    if t=="vocab":
        vg="".join(f'<div class="v"><img src="{icon(i)}"><div class="k kr">{e(k)}</div><div class="a">{e(a)}</div></div>' if i else f'<div class="v"><div class="k kr" style="margin-top:4mm">{e(k)}</div><div class="a">{e(a)}</div></div>' for i,k,a in b["items"])
        return f'<h2>{e(b.get("title","المفردات"))}</h2><div class="vg">{vg}</div>'
    if t=="table":
        cols=list(range(len(b["head"])))
        if not b.get("keep"):  # rule: Korean columns on the left, Arabic columns on the right
            iko=[c for c in cols if all(r[c].startswith("ko:") for r in b["rows"])]
            cols=iko+[c for c in cols if c not in iko]
        heads=[b["head"][c] for c in cols]; rws=[[r[c] for c in cols] for r in b["rows"]]
        head="".join(f"<th>{e(h)}</th>" for h in heads)
        rows=""
        for r in rws:
            rows+="<tr>"+"".join((f'<td class="kko">{e(c[3:])}</td>' if c.startswith("ko:") else f'<td class="aar">{e(c)}</td>') for c in r)+"</tr>"
        return (f'<h2>{e(b["title"])}</h2>' if b.get("title") else "")+f'<table style="direction:ltr"><tr>{head}</tr>{rows}</table>'
    if t=="dialogue":
        lines="".join(f'<div class="dl"><div class="dk">{e(k)}</div><div class="da">{e(a)}</div><span class="who">{e(w)}</span></div>' for w,k,a in b["lines"])
        return f'<div class="box">{lines}</div>'
    if t=="note":
        return f'<div class="cl"><span class="tag">{e(b.get("tag","ملاحظة"))}</span>{e(b["text"])}</div>'
    if t=="fill":
        items="".join(f'<div class="fl"><span class="num">{n(i+1)}</span><span class="kr">{e(x)}</span></div>' for i,x in enumerate(b["items"], b.get("start",0)))
        return f'<div class="box"><p class="sub"><span class="num">{n(b["no"])}</span><b>{e(b["title"])}</b></p>'+(f'<p class="sub kr" style="direction:ltr;text-align:left">{e(b["hint"])}</p>' if b.get("hint") else "")+f'{items}</div>'
    if t=="choose":
        ch="".join(f'<div><span><span class="num">{n(i+1)}</span><span class="kr">{e(w)}</span></span><span>'+"".join(f'<span class="opt kr">{e(o)}</span>' for o in opts)+'</span></div>' for i,(w,opts) in enumerate(b["items"]))
        return f'<div class="box"><p class="sub"><span class="num">{n(b["no"])}</span><b>{e(b["title"])}</b></p><div class="ch">{ch}</div></div>'
    if t=="reading":
        qs=""
        for i,(q,opts,_) in enumerate(b["questions"]):
            qs+=f'<p class="sub" style="margin-top:3mm"><span class="num">{n(i+1)}</span>{e(q)}</p><p>'+"".join(f'<span class="opt kr">{"①②③④"[j]} {e(o)}</span>' for j,o in enumerate(opts))+"</p>"
        return f'<div class="box"><p class="sub"><span class="num">{n(b["no"])}</span><b>{e(b.get("title","قراءة: النص ثم الأسئلة"))}</b></p><p class="kr" style="font-weight:700;font-size:10.5pt;white-space:pre-line;text-align:left">{e(b["text"])}</p>{qs}</div>'
    if t=="translate":
        items="".join(f'<div class="fl"><span class="num">{n(i+1)}</span><span>{e(x)}</span><span class="ln"></span></div>' for i,x in enumerate(b["items"], b.get("start",0)))
        return f'<div class="box"><p class="sub"><span class="num">{n(b["no"])}</span><b>{e(b["title"])}</b></p>{items}</div>'
    raise ValueError(t)

def pages(U):
    return ["".join(blk(b) for b in pg) for pg in U["pages"]]

def answers(U):
    out=[]
    for pg in U["pages"]:
        for b in pg:
            if b["type"]=="choose":
                out.append(f'{n(b["no"])}) '+"، ".join(f'{n(i+1)} {o[1]}' for i,o in enumerate(b["items"])) if False else None)
    return None

if __name__ == "__main__":
    num = sys.argv[1]
    U = json.load(open(ROOT / f"units/{num}.json"))
    P = pages(U); total = len(P)
    body = "".join(frame(p, i+1, total, U["title"], U["number"]) for i,p in enumerate(P))
    out = ROOT / "out"; out.mkdir(exist_ok=True)
    h = out / f"unit-{num}.html"
    h.write_text(f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{body}</body></html>', encoding="utf-8")
    # fonts are referenced relatively: copy html next to fonts via symlink
    link = out / "fonts"
    if not link.exists(): link.symlink_to(ROOT / "fonts")
    pdf = out / f"unit-{num}.pdf"
    subprocess.run(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--no-pdf-header-footer",
                    f"--print-to-pdf={pdf}", h.as_uri()], check=True, capture_output=True)
    print("wrote", pdf, "pages", total)
    try:
        import pymupdf
        for i,pg in enumerate(pymupdf.open(pdf)):
            low=[b for b in pg.get_text("blocks") if b[3]>548 and "kloversegy" not in b[4] and "الصفحة" not in b[4] and "تعلّم" not in b[4]]
            if low: print("  OVERFLOW page", i+1, low[0][4][:40].replace("\n"," "))
    except ImportError: pass
