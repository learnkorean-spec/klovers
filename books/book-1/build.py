#!/usr/bin/env python3
"""Klovers Book 1 generator (A0 style). Usage: python3 build.py 05  -> out/unit-05.pdf
Reads units/NN.json, writes HTML, prints to PDF with headless Chrome (A5)."""
import json, sys, subprocess, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
REPO = ROOT.parent.parent
ICONS = REPO / "public/picture-library/icons"
LOGO = REPO / "public/klovers-logo.jpg"
AR = "٠١٢٣٤٥٦٧٨٩"
def n(x): return "".join(AR[int(c)] if c.isdigit() else c for c in str(x))
e = html.escape

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
.box{background:#FFF9EC;border:.35mm solid #FFEB00;border-radius:3mm;padding:3mm 4mm;margin:2.5mm 0}
.tag{display:inline-block;background:#FFEB00;border-radius:1.5mm;font-size:7.5pt;font-weight:700;padding:.3mm 2mm;margin-left:2mm}
.goals li{font-size:9pt;margin:1mm 5mm 1mm 0}
.vg{display:grid;grid-template-columns:repeat(4,1fr);gap:2.5mm;margin-top:2mm}
.v{border:.35mm solid #FFEB00;border-radius:3mm;padding:2mm 1mm;text-align:center;background:#FFF9EC}
.v img{width:13mm;height:13mm;object-fit:contain;mix-blend-mode:multiply}
.v .k{font-size:12.5pt;font-weight:700}.v .a{font-size:8pt;color:#333}
table{width:100%;border-collapse:collapse;font-size:9pt}td,th{border:.3mm solid #e6d8a0;padding:1.6mm 2mm;text-align:right}th{background:#FFF1A8}
.big{font-size:20pt;font-weight:700;text-align:center}
.dl{display:flex;gap:2mm;margin:1.8mm 0;align-items:flex-start}
.who{min-width:11mm;font-size:8pt;font-weight:700;background:#FFEB00;border-radius:1.5mm;text-align:center;padding:.6mm}
.dk{font-size:10.5pt;font-weight:700;direction:ltr;text-align:left}.da{font-size:8.5pt;color:#333}
.cl{margin-top:3mm;border:.35mm solid #1a1a1a;border-radius:3mm;padding:2.5mm 3.5mm;font-size:8.5pt;background:#fff7d6}
.num{display:inline-block;min-width:5mm;text-align:center;background:#FFEB00;border-radius:1.5mm;font-size:8pt;font-weight:700;margin-left:1.5mm}
.ch{display:grid;grid-template-columns:1fr 1fr;gap:1.5mm 5mm}.ch div{font-size:10.5pt;border-bottom:.2mm dotted #bbb;padding:1.2mm 0;display:flex;justify-content:space-between}
.opt{display:inline-block;margin-left:5mm;font-size:10pt}
"""

def frame(body, idx, total, title, u):
    return f'''<section class="page"><div class="hd"><span>الوحدة {n(u)} · {e(title)}</span>
<span class="logo">كلوفرز <img src="data:image/jpeg;base64,{LOGO_B64}"></span></div>{body}
<div class="ft"><span>تعلّم الكورية، عِشها، أحبّها.</span><span>الصفحة {n(idx)} من {n(total)}</span><span>kloversegy.com</span></div></section>'''

import base64
LOGO_B64 = base64.b64encode(LOGO.read_bytes()).decode()
def icon(f):
    return "data:image/jpeg;base64," + base64.b64encode((ICONS / f"{f}.jpg").read_bytes()).decode()

def pages(U):
    u = U["number"]; t = U["title"]; P = []
    goals = "".join(f"<li>{e(g)}</li>" for g in U["goals"])
    vg = "".join(f'<div class="v"><img src="{icon(i)}"><div class="k kr">{e(k)}</div><div class="a">{e(a)}</div></div>' for i,k,a in U["vocab"])
    P.append(f'<h1>{e(t)}</h1><p class="sub">{e(U["lead"])} {e(U["intro"])}</p>'
             f'<div class="box"><span class="tag">★</span><b>في نهاية هذه الوحدة</b><ul class="goals">{goals}</ul></div>'
             f'<h2>المفردات</h2><div class="vg">{vg}</div>')
    G = U["grammar"]
    rules = "".join(f'<tr><td>{e(a)}</td><td class="kr big" style="font-size:13pt">{e(b)}</td><td class="kr">{e(c)}</td></tr>' for a,b,c in G["rules"])
    ex = "".join(f'<tr><td class="kr" style="direction:ltr;text-align:left;font-weight:700">{e(k)}</td><td>{e(a)}</td></tr>' for k,a in G["examples"])
    P.append(f'<p class="sub">القاعدة {n(U["grammar_id"])}</p><h1>{e(G["name"])} <span class="kr">{e(G["particle"])}</span></h1>'
             f'<p class="sub">{e(G["explain"])}</p><p class="sub">{e(G["why"])}</p>'
             f'<table><tr><th>الاسم</th><th>الأداة</th><th>مثال</th></tr>{rules}</table>'
             f'<h2>الجمل</h2><table><tr><th>الجملة</th><th>المعنى</th></tr>{ex}</table>'
             f'<div class="cl"><span class="tag">انتباه</span>{e(G["note"])}</div>')
    D = U["dialogue"]
    lines = "".join(f'<div class="dl"><span class="who">{e(w)}</span><div><div class="dk kr">{e(k)}</div><div class="da">{e(a)}</div></div></div>' for w,k,a in D["lines"])
    P.append(f'<p class="sub">المحادثة</p><h1>{e(D["title"])}</h1><div class="box">{lines}</div>'
             f'<div class="cl"><span class="tag">ملاحظة كلوبي</span>{e(D["cluby"])}</div>')
    pr = U["practice"]
    ch = "".join(f'<div><span><span class="num">{n(i+1)}</span><span class="kr">{e(w)}</span></span><span><span class="opt kr">을</span><span class="opt kr">를</span></span></div>' for i,(w,_) in enumerate(pr["choose"]))
    qs = ""
    for i,(q,opts,_) in enumerate(pr["questions"]):
        qs += f'<p class="sub" style="margin-top:3mm"><span class="num">{n(i+1)}</span>{e(q)}</p><p>' + "".join(f'<span class="opt kr">{"①②③④"[j]} {e(o)}</span>' for j,o in enumerate(opts)) + "</p>"
    P.append(f'<h1>التدريب</h1><div class="box"><p class="sub"><span class="num">١</span><b>اختر <span class="kr">을</span> أو <span class="kr">를</span></b></p><div class="ch">{ch}</div></div>'
             f'<div class="box"><p class="sub"><span class="num">٢</span><b>قراءة: النص ثم الأسئلة</b></p><p class="kr" style="font-weight:700;font-size:10.5pt;white-space:pre-line;text-align:left">{e(pr["reading"])}</p>{qs}</div>')
    return P

def answers(U):
    pr = U["practice"]
    a1 = "، ".join(f'{n(i+1)}) {"을" if o==0 else "를"}' for i,(_,o) in enumerate(pr["choose"]))
    a2 = "، ".join(f'{n(i+1)}) {"①②③④"[o]}' for i,(_,_,o) in enumerate(pr["questions"]))
    return a1, a2

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
    print("wrote", pdf, "pages", total, "answers", answers(U))
