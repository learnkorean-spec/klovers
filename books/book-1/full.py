"""Build the whole Book 1: cover, contents, units 1-24 (global page numbers), answer key, closing pages."""
import json, re, subprocess, sys
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

def main():
    unit_pages = [(U, B.pages(U)) for U in UNITS]
    acards = [answer_card(U) for U in UNITS]
    # answer pages: 2 units per page by default
    apages = pack_cards(acards)
    ntoc = 1
    total = 1 + ntoc + sum(len(p) for _, p in unit_pages) + len(apages) + 2
    idx = 2; html = ""; start = {}
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
            html += B.frame(pg, idx, total, U["title"], U["number"]); idx += 1
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
    for i, pg in enumerate(body):
        low = [b for b in pg.get_text("blocks") if b[3] > 548 and "kloversegy" not in b[4] and "الصفحة" not in b[4] and "تعلّم" not in b[4] and "الكورية، ِع" not in b[4] and "ّبها" not in b[4] and "kloversegy" not in b[4].replace(" ","")]
        if low: print("OVERFLOW body page", i+2, low[0][4][:40].replace("\n", " "))
main()
