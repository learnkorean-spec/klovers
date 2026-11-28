"""Build the whole Book 1: cover, contents, units 1-24 (global page numbers), answer key, closing pages."""
import json, re, subprocess, sys, base64
from pathlib import Path
import build as B
import pymupdf
ROOT = B.ROOT
KEY = json.load(open(ROOT / "answers_key.json"))
UNITS = [json.load(open(ROOT / f"units/{i:02d}.json")) for i in range(1, 25)]
n, e = B.n, B.e
CIRC = "①②③④⑤⑥"
GRAM = {1:"이에요/예요 · 은/는",2:"도 · -아요/어요",3:"에 · 에서",4:"이/가 · 에 있다/없다",5:"을/를",6:"مراجعة الوحدات ١ إلى ٥",
7:"الأعداد الصينية والكورية",8:"하고 · 와/과",9:"-ㅂ니다/습니다 · -ㅂ니까/습니까",10:"-(으)세요",11:"-았/었-",12:"مراجعة الوحدات ٦ إلى ١١",
13:"만 · 의",14:"안 · -지 않다",15:"그리고 · 그래서 · 하지만 · -지만",16:"에 (الوقت) · الساعة والتاريخ",17:"못",18:"مراجعة الوحدات ١٣ إلى ١٧",
19:"-(으)ㄹ까요? · -고 싶다",20:"-고 · -(으)ㄹ 거예요",21:"-아서/어서 · -(으)러 가다",22:"-아/어 주세요",23:"-(으)ㄹ 수 있다/없다",24:"مراجعة القواعد ١ إلى ٣٢"}

def kcell(a):  # Korean answer, left-to-right isolate
    return f'<span class="kko">{e(a)}</span>' if re.search(r"[ㄱ-힣]", a) else e(a)

def reading_answers(U):
    out = []
    for pg in U["pages"]:
        for b in pg:
            if b["type"] == "reading":
                out.append(" ".join(f'{n(i+1)}) {CIRC[q[2]]}' for i, q in enumerate(b["questions"])))
    return out

LABEL = {"quick": "اختبار قصير", "prac": "التدريب", "comp": "تدريب شامل", "test": "اختبار الوحدة"}
def answer_card(U):
    num = U["number"]; rows = ""
    secs = KEY.get(str(num), [])
    rd = reading_answers(U)
    def sec_html(label, groups):
        g = ""
        for gi, grp in enumerate(groups):
            cells = "".join(f'<span class="ak"><b>{n(i+1)}</b> {kcell(a)}</span>' for i, a in enumerate(grp))
            g += f'<div class="ag">{(n(gi+1)+") ") if len(groups)>1 else ""}{cells}</div>'
        return f'<div class="as"><div class="al">{label}</div>{g}</div>'
    order = ["quick", "prac", "comp"]
    for s in secs:
        if s["type"] in order: rows += sec_html(LABEL[s["type"]], s["groups"])
    if rd: rows += f'<div class="as"><div class="al">القراءة</div><div class="ag">' + " · ".join(rd) + "</div></div>"
    for s in secs:
        if s["type"] == "test":
            rows += sec_html(LABEL["test"], s["groups"])
            hs = ""
            for h in s["hints"]:
                if h[0] == "v":
                    hs += f'<span class="hn">المفردات: الأسئلة {n(h[1][0])} إلى {n(h[1][-1])}</span>'
                else:
                    hs += f'<span class="hn">القاعدة {n(h[1])}: الأسئلة ' + "، ".join(n(x) for x in h[2]) + "</span>"
            if hs: rows += f'<div class="hints"><b>لمعرفة ما يحتاج مراجعة:</b> {hs}</div>'
    return f'<div class="ac"><h3>الوحدة {n(num)} · {e(U["title"])}</h3>{rows}</div>'

EXTRA_CSS = """
.page.op{padding:0;background:#FFF9EC}.op .bg{position:absolute;top:0;left:0;width:100%;height:auto;display:block}
.op .otop{position:absolute;top:5mm;left:8mm;right:8mm;display:flex;justify-content:space-between;align-items:center;z-index:2}
.op .okick{background:#FFFF00;color:#1a1a1a;font-weight:800;font-size:9pt;padding:1mm 4mm;border-radius:5mm}
.op .ologo{background:rgba(255,255,255,.92);border-radius:5mm;padding:.8mm 3mm;font-weight:800;font-size:8pt;display:flex;gap:1.5mm;align-items:center}.op .ologo img{height:5mm;border-radius:50%}
.op .obot{position:absolute;left:0;right:0;top:106mm;bottom:12mm;padding:0 12mm;color:#1a1a1a;display:flex;flex-direction:column;justify-content:flex-start}
.op .obot h1{margin:0 0 4mm;font-size:30pt;line-height:1.25;color:#1a1a1a;border-bottom:1mm solid #FFFF00;padding-bottom:3mm}
.op .osub{margin:0 0 5mm;font-size:11pt;line-height:1.8;color:#444}
.op .ogoals{margin:0 0 6mm;padding:4mm 5mm;list-style:none;font-size:10.5pt;line-height:1.9;background:#fff;border:.4mm solid #1a1a1a;border-radius:3mm}.op .ogoals li{position:relative;padding-right:5mm}
.op .ogoals li:before{content:"";position:absolute;right:0;top:2.3mm;width:2.2mm;height:2.2mm;border-radius:50%;background:#FFFF00;border:.3mm solid #1a1a1a}
.op .opills{display:flex;gap:2.5mm;flex-wrap:wrap}.op .opills span{background:#FFFF00;border:.3mm solid #1a1a1a;border-radius:5mm;padding:.8mm 3.5mm;font-size:8.5pt;font-weight:700}
.op .oft{position:absolute;bottom:0;left:0;right:0;height:9mm;display:flex;justify-content:space-between;align-items:center;padding:0 8mm;font-size:6.5pt;color:#555;border-top:.2mm solid #1a1a1a;z-index:3}

.ac{border:.3mm solid #1a1a1a;border-radius:2.5mm;padding:1.6mm 2.6mm;margin:1.6mm 0;font-size:8pt;background:#FFF9EC}
.ac h3{margin:0 0 1mm;font-size:9.5pt;background:#FFFF00;display:inline-block;padding:.3mm 2mm;border-radius:1.5mm}
.as{margin:.5mm 0}.al{font-weight:700;font-size:7.5pt;color:#444}
.ag{display:flex;flex-wrap:wrap;gap:.6mm 3.2mm;direction:ltr}
.ak{direction:ltr;white-space:nowrap}.ak b{background:#FFFF00;border-radius:1mm;padding:0 1mm;font-size:7pt}
.hints{margin-top:1mm;border-top:.2mm dotted #999;padding-top:.8mm;font-size:7.2pt}.hn{margin-left:3mm;white-space:nowrap}
.toc td,.toc th{font-size:7.6pt;padding:.35mm 2mm;line-height:1.25}.toc td.ko{font-family:KR,Cairo;direction:ltr;text-align:left;font-weight:700}
.end{text-align:center;margin-top:38mm}.end h2{font-size:22pt}.cr{font-size:9.5pt;line-height:1.9;margin-top:10mm}
"""

def simple_frame(body, idx, total, head):
    return f'''<section class="page"><div class="hd"><span>{e(head)}</span>
<span class="logo">كلوفرز <img src="data:image/jpeg;base64,{B.LOGO_B64}"></span></div>{body}
<div class="ft"><span>تعلّم الكورية، عِشها، أحبّها.</span><span>الصفحة {n(idx)} من {n(total)}</span><span>kloversegy.com</span></div></section>'''


def render_pdf(pages_html, name):
    out = ROOT / "out"; h = out / f"{name}.html"
    h.write_text(f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>{B.CSS}{EXTRA_CSS}</style></head><body>{pages_html}</body></html>', encoding="utf-8")
    pdf = out / f"{name}.pdf"
    subprocess.run(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={pdf}",h.as_uri()],check=True,capture_output=True)
    return pymupdf.open(pdf)

def pack_cards(cards):
    head = '<h1 class="h1" style="margin:0 0 1mm">مفتاح الإجابات</h1><p class="sub">راجعي إجاباتك هنا بعد الحل.</p>'
    d = render_pdf("".join(simple_frame(head + c, i+1, 99, "x") for i, c in enumerate(cards)) , "measure")
    hts = []; start = None; limit = None
    for pg in d:
        bl = [b for b in pg.get_text("blocks")]
        body = [b for b in bl if 50 < b[1] and b[3] < 556 and "kloversegy" not in b[4].replace(" ", "") and "الكورية، ِع" not in b[4] and "ّبها" not in b[4] and "الصفحة" not in b[4]]
        ft = [b for b in bl if b[1] > 540]
        top = min(b[1] for b in body); bot = max(b[3] for b in body)
        hts.append(bot)
        limit = min(b[1] for b in ft) if ft else 548
    # bottoms measured from page top with one card; card height = bottom - first_card_top
    first_top = None
    d2 = render_pdf(simple_frame(head, 1, 99, "x"), "measure0")
    t0 = [b for b in d2[0].get_text("blocks") if 50 < b[1] and b[3] < 556 and "kloversegy" not in b[4].replace(" ","") and "ّبها" not in b[4] and "الصفحة" not in b[4] and "الكورية، ِع" not in b[4]]
    base = max(b[3] for b in t0)
    heights = [h - base for h in hts]
    avail = limit - base - 16
    pages = []; cur = ""; used = 0
    for c, h in zip(cards, heights):
        if cur and used + h + 5 > avail: pages.append(cur); cur = ""; used = 0
        cur += c; used += h + 5
    if cur: pages.append(cur)
    return pages

def atoms_of(U):
    """Flatten a unit into atoms: a title is glued to the next block, a note to the previous one."""
    flat = [b for pg in U["pages"] for b in pg]
    atoms = []; i = 0
    while i < len(flat):
        grp = [flat[i]]; i += 1
        if grp[0]["type"] == "title" and i < len(flat) and flat[i]["type"] != "title":
            grp.append(flat[i]); i += 1
        while i < len(flat) and flat[i]["type"] == "note":
            grp.append(flat[i]); i += 1
        atoms.append(grp)
    return atoms

GAP = 7
SPLIT = {"table": ("rows", 1), "fill": ("items", 1), "translate": ("items", 1), "choose": ("items", 2), "dialogue": ("lines", 1), "vocab": ("items", 4)}
def body_blocks(pg):
    return [b for b in pg.get_text("blocks") if 35 < b[1] < 566 and "ّبها" not in b[4] and "الكورية، ِع" not in b[4] and "الصفحة" not in b[4] and "kloversegy" not in b[4].replace(" ", "")]

def split_block(b, k):
    key, _ = SPLIT[b["type"]]
    b1 = dict(b); b2 = dict(b)
    b1[key] = b[key][:k]; b2[key] = b[key][k:]
    if b["type"] in ("fill", "translate", "choose"): b2["start"] = b.get("start", 0) + k
    if b["type"] == "table" and b.get("title"): b2["title"] = b["title"] + " (تابع)"
    if b["type"] == "table" and not b.get("title"): b2["title"] = "(تابع)"
    if b["type"] == "vocab": b2["title"] = b.get("title", "المفردات") + " (تابع)"
    if b["type"] in ("fill", "translate", "choose"): b2["title"] = b["title"] + " (تابع)"
    return b1, b2

def prepare(U):
    """Return (unit copy without the opener title/goals, goals list, sub text)."""
    pages = [list(p) for p in U["pages"]]
    sub = ""; goals = []
    first = pages[0]
    keep = []
    for b in first:
        if b["type"] == "title" and not sub and b.get("h1") == U["title"]: sub = b.get("sub", ""); continue
        if b["type"] == "goals": goals = b["items"]; continue
        keep.append(b)
    pages[0] = keep
    out = []
    for pg in pages:
        npg = []
        for b in pg:
            npg.append(b)
            if b["type"] == "title" and b.get("kicker") == "المحادثة":
                npg.append({"type": "scene", "file": f"b1d_{U['number']:02d}.jpg", "qr": f"https://kloversegy.com/c/b1-{U['number']}"})
        if npg: out.append(npg)
    V = sum(len(b["items"]) for pg in out for b in pg if b["type"] == "vocab")
    return dict(U, pages=out), goals, sub, V

def opener_page(U, goals, sub, nvocab):
    n_ = U["number"]
    img = None
    if img is not None:
        src = "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode()
    else:
        src = B.scene_img(f"b1s_{n_:02d}.jpg")
    g = "".join(f"<li>{e(x)}</li>" for x in goals)
    sub_html = f'<p class="osub">{e(sub)}</p>' if sub else ""
    pills = f'<span>القواعد: {e(GRAM[n_])}</span>' + (f'<span>المفردات: {n(nvocab)} كلمة</span>' if nvocab else "")
    def make(idx, total):
        return f'''<section class="page op"><img class="bg" src="{src}">
<div class="otop"><span class="okick">الوحدة {n(n_)}</span><span class="ologo">كلوفرز <img src="data:image/jpeg;base64,{B.LOGO_B64}"></span></div>
<div class="obot"><h1>{e(U["title"])}</h1>{sub_html}{('<ul class="ogoals">'+g+'</ul>') if g else ''}<div class="opills">{pills}</div></div>
<div class="oft"><span>تعلّم الكورية، عِشها، أحبّها.</span><span>الصفحة {n(idx)} من {n(total)}</span><span>kloversegy.com</span></div></section>'''
    return make

UFAC = {}
def reflow(units, safe=1.0):
    flat = [(U, b) for U in units for pg in U["pages"] for b in pg]
    html = "".join(B.frame(B.blk(b), i+1, 99, U["title"], U["number"]) for i, (U, b) in enumerate(flat))
    d = render_pdf(html, "measure_units")
    assert len(d) == len(flat)
    probe = render_pdf(B.frame("<p>x</p>", 1, 99, "x", 1), "measure_probe")
    top = min(b[1] for b in body_blocks(probe[0])); limit = 548; cap = limit - top
    H = {}
    for k, pg in enumerate(d):
        bb = body_blocks(pg); imgs = [im["bbox"][3] for im in pg.get_image_info() if 40 < im["bbox"][1] and im["bbox"][3] < 566]
        ys = [b[3] for b in bb] + imgs
        H[k] = (max(ys) - top) if ys else 0
    OVER = 12
    result = {}; fills = []; k = 0
    for U in units:
        blocks = []
        for pg in U["pages"]:
            for b in pg: blocks.append((b, H[k])); k += 1
        # atoms: title glued to next block, notes glued to previous
        atoms = []; i = 0
        while i < len(blocks):
            grp = [blocks[i]]; i += 1
            if grp[0][0]["type"] == "title" and i < len(blocks) and blocks[i][0]["type"] != "title":
                grp.append(blocks[i]); i += 1
                if grp[-1][0]["type"] == "scene" and i < len(blocks):
                    grp.append(blocks[i]); i += 1
            while i < len(blocks) and blocks[i][0]["type"] == "note":
                grp.append(blocks[i]); i += 1
            atoms.append(grp)
        def pack(atoms, scale):
            scale = scale * UFAC.get(U["number"], 1.0)
            pages = []; useds = []; cur = []; used = 0
            def flush():
                nonlocal cur, used
                if cur: pages.append(cur); useds.append(used)
                cur = []; used = 0
            queue = list(atoms)
            while queue:
                atom = queue.pop(0)
                h = sum(x[1] for x in atom) + 3 * (len(atom) - 1)
                if used + h + GAP <= cap * 0.94 * scale:
                    cur += [x[0] for x in atom]; used += h + GAP; continue
                space = cap * safe * scale - used - GAP
                done = False
                for j in range(len(atom) - 1, -1, -1):
                    blk_, bh = atom[j]
                    if blk_["type"] not in SPLIT: continue
                    key, step = SPLIT[blk_["type"]]; nitems = len(blk_[key])
                    rows = nitems / step
                    per = (bh - OVER) / max(rows, 1)
                    before = sum(x[1] for x in atom[:j]) + 3 * j
                    avail = space - before - OVER
                    kr = int(avail // per); kk = kr * step
                    if nitems - kk < 2 * step: kk = nitems - 2 * step; kr = kk // step
                    if kr >= 2 and nitems - kk >= step:
                        b1, b2 = split_block(blk_, kk)
                        h1 = OVER + kr * per; h2 = OVER + (rows - kr) * per
                        cur += [x[0] for x in atom[:j]] + [b1]; used += before + h1 + GAP
                        flush()
                        queue.insert(0, [(b2, h2)] + atom[j+1:]); done = True
                    break
                if done: continue
                if not cur:
                    cur += [x[0] for x in atom]; used += h + GAP; flush(); continue
                flush(); queue.insert(0, atom)
            flush()
            return pages, useds
        pages, useds = pack(atoms, 1.0)
        p = len(pages)
        Z = 1.0
        if p > 1 and useds[-1] < cap * 0.6:
            for z in (0.97, 0.94, 0.91, 0.88, 0.85, 0.82):
                pg2, us2 = pack(atoms, 1 / z)
                if len(pg2) < p:
                    pages, useds, Z = pg2, us2, z; p = len(pages); break
        if p > 1:
            scale = min(1.0, (sum(useds) / p) / (cap * 0.94) * 1.12)
            for sc in (scale, min(1.0, scale * 1.06), min(1.0, scale * 1.12), 1.0):
                pg2, us2 = pack(atoms, sc)
                if len(pg2) <= p: pages, useds = pg2, us2; break
        fills.extend(u / cap for u in useds)
        out_pages = []
        for pg, us in zip(pages, useds):
            notes = ""
            if us * Z < cap * 0.6:
                notes = ('<div class="box" style="flex:1 1 auto;margin-top:4mm;display:flex;flex-direction:column"><p class="sub"><b>مساحة للكتابة: ملاحظاتي وكلماتي الجديدة</b></p>'
                         '<div style="flex:1;overflow:hidden;min-height:20mm">' + '<div style="height:8.4mm;border-bottom:.3mm solid #cfc7b2"></div>' * 30 + '</div></div>')
                us = cap * 0.9 / Z
            hh = min(cap * 0.955, us * Z * 1.3) / Z
            hmm = hh / 2.835
            st = "display:flex;flex-direction:column;justify-content:space-between;min-height:%.1fmm" % hmm if (len(pg) > 1 or notes) else ""
            if Z != 1.0: st += (";" if st else "") + "zoom:%.2f" % Z
            out_pages.append(f'<div style="{st}">' + "".join(f"<div>{B.blk(b)}</div>" for b in pg) + notes + "</div>")
        result[U["number"]] = out_pages
    print("avg fill %.0f%%, pages under 60%%: %d of %d" % (100 * sum(fills) / len(fills), sum(f < .6 for f in fills), len(fills)))
    return result

def main():
    SAFE = float(sys.argv[1]) if len(sys.argv) > 1 else 0.97
    PREP = [prepare(U) for U in UNITS]
    RF = reflow([p[0] for p in PREP], SAFE)
    unit_pages = [(U, [opener_page(U, g, sb, nv)] + RF[U["number"]]) for U, (_, g, sb, nv) in zip(UNITS, PREP)]
    acards = [answer_card(U) for U in UNITS]
    # answer pages: 2 units per page by default
    apages = pack_cards(acards)
    ntoc = 1
    total = 1 + ntoc + sum(len(p) for _, p in unit_pages) + len(apages) + 2
    idx = 2; html = ""; start = {}; OPS = set()
    # contents
    start_page = 1 + ntoc + 1
    rows = ""; p = start_page
    for U, P in unit_pages:
        start[U["number"]] = p
        g = GRAM[U["number"]]
        gcell = f'<td class="ko">{e(g)}</td>' if re.search("[\u3131-\uD7A3]", g) and not re.search("[\u0600-\u06FF]", g) else f'<td>{e(g)}</td>'
        rows += f'<tr><td>{n(U["number"])}</td><td>{e(U["title"])}</td>{gcell}<td>{n(p)}</td></tr>'
        p += len(P)
    ans_start = p
    rows += f'<tr><td></td><td>مفتاح الإجابات</td><td></td><td>{n(ans_start)}</td></tr>'
    toc = f'<h1 class="h1" style="margin:0 0 2mm">المحتويات</h1><table class="toc"><tr><th>الوحدة</th><th>الموضوع</th><th>القواعد</th><th>الصفحة</th></tr>{rows}</table>'
    html += simple_frame(toc, idx, total, "المحتويات"); idx += 1
    for U, P in unit_pages:
        for pg in P:
            if callable(pg): OPS.add(idx)
            html += pg(idx, total) if callable(pg) else B.frame(pg, idx, total, U["title"], U["number"]); idx += 1
    for ap in apages:
        html += simple_frame(f'<h1 class="h1" style="margin:0 0 1mm">مفتاح الإجابات</h1><p class="sub">راجعي إجاباتك هنا بعد الحل.</p>{ap}', idx, total, "مفتاح الإجابات"); idx += 1
    html += simple_frame('<div class="end"><h2>نهاية المستوى ١</h2><p class="sub">٣٢ قاعدة، وأول محادثات حقيقية مع لينا وآدم.<br>المستوى ٢ يأخذنا إلى مقهى المحادثة: جمل أطول، وخطط، ووصف، وقصص.</p></div>', idx, total, "نهاية المستوى ١"); idx += 1
    html += simple_frame('<div class="cr"><h2>حقوق النشر</h2><p><b>الكورية · المستوى ١: أول محادثة</b><br>الكتاب الكوري للمبتدئين<br>الطبعة الأولى، ٢٠٢٦<br>الناشر: كلوفرز · kloversegy.com<br>التأليف والإعداد: ريهام الشرقاوي<br>الصوتيات: متاحة للطلاب في لوحة الطالب على الموقع.</p><p>© كلوفرز ٢٠٢٦. جميع الحقوق محفوظة. لا يجوز نسخ هذا الكتاب أو أي جزء منه أو نشره أو توزيعه بأي وسيلة، ورقية أو إلكترونية، دون إذن كتابي من الناشر. هذا الكتاب مخصص للاستخدام التعليمي لطلاب كلوفرز.</p></div>', idx, total, "حقوق النشر")
    assert idx == total, (idx, total)
    out = ROOT / "out"
    h = out / "book-1-body.html"
    h.write_text(f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>{B.CSS}{EXTRA_CSS}</style></head><body>{html}</body></html>', encoding="utf-8")
    body_pdf = out / "book-1-body.pdf"
    subprocess.run(["google-chrome","--headless=new","--no-sandbox","--disable-gpu","--no-pdf-header-footer",f"--print-to-pdf={body_pdf}",h.as_uri()],check=True,capture_output=True)
    body = pymupdf.open(body_pdf)
    cover = pymupdf.open(ROOT / "assets/cover.pdf")
    book = pymupdf.open(); book.insert_pdf(cover); book.insert_pdf(body)
    book.save(out / "book-1.pdf")
    print("pages", len(book), "expected", total)
    soft = []
    for pi, pg in enumerate(book):
        for im in pg.get_image_info():
            bw = (im["bbox"][2]-im["bbox"][0])/72; bh = (im["bbox"][3]-im["bbox"][1])/72
            if bw < 0.3 or bh < 0.3 or (im["width"], im["height"]) == (420, 276): continue
            dpi = min(im["width"]/bw, im["height"]/bh)
            if dpi < 150: soft.append((pi+1, im["width"], im["height"], round(dpi)))
    print("BLURRY IMAGES (<150dpi):", soft if soft else "none")
    bad_units = set()
    for i, pg in enumerate(body):
        if i + 2 in OPS: continue
        low = [b for b in pg.get_text("blocks") if b[3] > 548 and "kloversegy" not in b[4] and "الصفحة" not in b[4] and "تعلّم" not in b[4] and "الكورية، ِع" not in b[4] and "ّبها" not in b[4] and "kloversegy" not in b[4].replace(" ","")]
        if low:
            print("OVERFLOW body page", i+2, low[0][4][:40].replace("\n", " "))
            for un, st in start.items():
                if st <= i + 2 < st + len(dict((U["number"], P) for U, P in unit_pages)[un]): bad_units.add(un)
    return bad_units
for it in range(5):
    bad = main()
    if not bad: break
    print("iteration", it, "overflow units", sorted(bad))
    for un in bad: UFAC[un] = UFAC.get(un, 1.0) * 0.93
