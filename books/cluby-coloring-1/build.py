"""Build a Klovers colouring storybook (Arabic, A4) as print-ready PDFs.
Usage: python3 build.py book1   -> out/<book>-digital.pdf and out/<book>-print.pdf"""
import sys, os, html, io, base64
import numpy as np
from PIL import Image
from doodles import place, doodle

ROOT = os.path.dirname(os.path.abspath(__file__))
F = f"file://{ROOT}/fonts"
AR = str.maketrans("0123456789", "٠١٢٣٤٥٦٧٨٩")
W, H = 210, 297
INK = "#2E2E2E"

def ar(n): return str(n).translate(AR)

CSS = f"""
<link rel="stylesheet" href="{F}/fontsource-cairo-5.3.0/400.css">
<link rel="stylesheet" href="{F}/fontsource-cairo-5.3.0/600.css">
<link rel="stylesheet" href="{F}/fontsource-cairo-5.3.0/700.css">
<link rel="stylesheet" href="{F}/fontsource-cairo-5.3.0/800.css">
<link rel="stylesheet" href="{F}/fontsource-noto-sans-kr-5.3.0/700.css">
<style>
@page {{ size: 210mm 297mm; margin: 0 }}
* {{ box-sizing: border-box; margin: 0; padding: 0 }}
html, body {{ background: #fff }}
body {{ font-family: Cairo, sans-serif; color: {INK}; direction: rtl }}
.page {{ width: 210mm; height: 297mm; position: relative; overflow: hidden; page-break-after: always; background: #fff }}
.page > svg.layer {{ position: absolute; inset: 0; width: 210mm; height: 297mm }}
.abs {{ position: absolute }}
.pic {{ object-fit: contain }}
.story {{ display: flex; align-items: center; justify-content: center; text-align: center;
  font-size: 15.5pt; font-weight: 700; line-height: 1.75; padding: 0 7mm; text-wrap: balance }}
[lang=ko] {{ font-family: "Noto Sans KR", sans-serif; direction: ltr; unicode-bidi: isolate; white-space: nowrap; display: inline-block }}
.pno {{ font-size: 13pt; font-weight: 700; text-align: center; line-height: 11mm }}
h1.t {{ font-size: 26pt; font-weight: 800; text-align: center; line-height: 1.5 }}
p.sub {{ font-size: 14pt; font-weight: 600; text-align: center; line-height: 1.7 }}
.blank {{ width: 210mm; height: 297mm; page-break-after: always }}
</style>"""

def rect(x0, y0, x1, y1, pad=0):
    return (x0 - pad, y0 - pad, x1 + pad, y1 + pad)

def frame(x, y, w, h, pad_out=4.5, pad_in=1.2, rx=6):
    """Colourable double-line band around a picture."""
    a = (f'<rect x="{x-pad_out}" y="{y-pad_out}" width="{w+2*pad_out}" height="{h+2*pad_out}" rx="{rx}" '
         f'fill="#fff" stroke="{INK}" stroke-width="0.8"/>'
         f'<rect x="{x-pad_in}" y="{y-pad_in}" width="{w+2*pad_in}" height="{h+2*pad_in}" rx="{rx-3}" '
         f'fill="#fff" stroke="{INK}" stroke-width="0.8"/>')
    # little clovers sitting on the band corners
    cr = (pad_out - pad_in) / 2 + pad_in
    for cx, cy in ((x - cr, y - cr), (x + w + cr, y - cr), (x - cr, y + h + cr), (x + w + cr, y + h + cr)):
        a += doodle("clover", cx, cy, 5.2, 0)
    return a

def page(svg_under, html_over="", svg_over=""):
    return (f'<section class="page"><svg class="layer" viewBox="0 0 {W} {H}">{svg_under}</svg>'
            f'{html_over}'
            + (f'<svg class="layer" viewBox="0 0 {W} {H}">{svg_over}</svg>' if svg_over else "")
            + '</section>')

def pno_box(n, y=276):
    svg = f'<circle cx="105" cy="{y+5.5}" r="7" fill="#fff" stroke="{INK}" stroke-width="0.8"/>'
    htm = f'<div class="abs pno" style="left:98mm;top:{y}mm;width:14mm">{ar(n)}</div>'
    return svg, htm, rect(98, y - 1.5, 112, y + 12.5)

def story_page(n, img, kind, text, seed):
    if kind == "scene":
        pw, ph = 184, 184 * 944 / 1680
        px, py = (W - pw) / 2, 52
    else:
        pw = ph = 146
        px, py = (W - pw) / 2, 34
    ty = py + ph + 12
    th = 30
    tx0, tx1 = 22, W - 22
    svg = frame(px, py, pw, ph)
    svg += (f'<rect x="{tx0}" y="{ty}" width="{tx1-tx0}" height="{th}" rx="8" fill="#fff" '
            f'stroke="{INK}" stroke-width="0.8" stroke-dasharray="2.2 1.6"/>')
    ps, ph_, pr = pno_box(n)
    excl = [rect(px, py, px + pw, py + ph, 6.5), rect(tx0, ty, tx1, ty + th, 2), pr]
    svg_d = place(excl, seed)
    htm = (f'<img class="abs pic" src="{ROOT}/{img}.png" style="left:{px}mm;top:{py}mm;width:{pw}mm;height:{ph}mm">'
           f'<div class="abs story" style="left:{tx0}mm;top:{ty}mm;width:{tx1-tx0}mm;height:{th}mm"><div>{text}</div></div>' + ph_)
    return page(svg_d + svg + ps, htm)

def heading_page(n, title, sub, body_svg, excl_extra, seed, body_html="", ty=16):
    svg_t = ""
    tb = rect(20, ty, 190, ty + (30 if sub else 16))
    ps, ph_, pr = pno_box(n)
    d = place([tb, pr] + excl_extra, seed)
    htm = (f'<h1 class="abs t" style="left:20mm;top:{ty}mm;width:170mm">{title}</h1>'
           + (f'<p class="abs sub" style="left:20mm;top:{ty+15}mm;width:170mm">{sub}</p>' if sub else "")
           + body_html + ph_)
    return page(d + svg_t + body_svg + ps, htm)

def name_page(n, seed):
    egg = doodle("egg", 105, 118, 62, 0)
    box = f'<rect x="35" y="196" width="140" height="34" rx="10" fill="#fff" stroke="{INK}" stroke-width="0.8"/>'
    line = f'<path d="M48,221 H162" stroke="{INK}" stroke-width="0.7" stroke-dasharray="1.6 1.8"/>'
    lbl = '<div class="abs sub" style="left:42mm;top:201mm;width:126mm;font-size:13pt;text-align:right">الاسم</div>'
    return heading_page(n, "هذا الكتاب ملك", "", egg + box + line, [rect(43, 50, 167, 186, 3), rect(35, 196, 175, 230, 2)], seed, lbl, ty=24)

def colour_test_page(n, seed):
    kinds = ["clover", "egg", "star", "heart"]
    cells = ""
    for r in range(4):
        for c in range(4):
            cells += doodle(kinds[(r + c) % 4], 45 + c * 40, 88 + r * 42, 15.5, 0)
    return heading_page(n, "صفحة تجربة الألوان", "تجربة الأقلام هنا أولًا، لمعرفة الألوان التي تظهر على ظهر الورقة.",
                        cells, [rect(22, 66, 188, 232, 2)], seed)

def trace_page(n, word, meaning, title, seed):
    wide = len(word) > 1
    cw, chh = (58, 30) if wide else (38, 30)
    cols = 3 if wide else 4
    gx0 = (W - cols * cw - (cols - 1) * 4) / 2
    svg = ""
    # model word, big and solid
    svg += (f'<rect x="55" y="54" width="100" height="56" rx="10" fill="#fff" stroke="{INK}" stroke-width="0.8"/>'
            f'<text x="105" y="96" text-anchor="middle" font-family="Noto Sans KR" font-weight="700" '
            f'font-size="40" fill="#fff" stroke="{INK}" stroke-width="0.9">{word}</text>')
    for r in range(4):
        for c in range(cols):
            x = gx0 + c * (cw + 4); y = 128 + r * (chh + 5)
            svg += (f'<rect x="{x}" y="{y}" width="{cw}" height="{chh}" rx="5" fill="#fff" stroke="{INK}" stroke-width="0.6"/>'
                    f'<path d="M{x+3},{y+chh/2} H{x+cw-3}" stroke="#b9b9b9" stroke-width="0.35" stroke-dasharray="1 1.4"/>')
            if r < 3:
                svg += (f'<text x="{x+cw/2}" y="{y+chh/2+8}" text-anchor="middle" font-family="Noto Sans KR" '
                        f'font-weight="700" font-size="22" fill="none" stroke="#9a9a9a" stroke-width="0.55" '
                        f'stroke-dasharray="1.3 1.1">{word}</text>')
    mean = f'<div class="abs sub" style="left:20mm;top:112mm;width:170mm;font-size:13pt">{meaning}</div>'
    excl = [rect(55, 54, 155, 110, 3), rect(20, 111, 190, 124), rect(gx0, 128, W - gx0, 128 + 4 * (chh + 5) - 5, 3)]
    return heading_page(n, title, "تتبُّع الخطوط المنقَّطة، ثم كتابة الكلمة في المربعات الفارغة.", svg, excl, seed, mean, ty=12)

def decorate_page(n, seed):
    egg = ('<g transform="translate(105,158) scale(1.72)" stroke="#2E2E2E" stroke-width="0.55" stroke-linejoin="round">'
           '<path d="M0,-47 C27,-47 41,-6 41,14 C41,37 22,48 0,48 C-22,48 -41,37 -41,14 C-41,-6 -27,-47 0,-47 Z" fill="#fff"/></g>')
    egg += doodle("clover", 105, 175, 9, 0)
    return heading_page(n, "بيضة للتزيين", "رسم نقوش جديدة على بيضة كلوبي، ثم تلوينها بأجمل الألوان.",
                        egg, [rect(34, 76, 176, 242, 3)], seed)

def certificate_page(n, seed):
    svg = (f'<rect x="24" y="30" width="162" height="220" rx="12" fill="#fff" stroke="{INK}" stroke-width="0.9"/>'
           f'<rect x="28" y="34" width="154" height="212" rx="9" fill="#fff" stroke="{INK}" stroke-width="0.6"/>'
           f'<path d="M50,138 H160 M50,166 H160" stroke="{INK}" stroke-width="0.6" stroke-dasharray="1.6 1.8"/>')
    htm = (f'<h1 class="abs t" style="left:28mm;top:44mm;width:154mm;font-size:30pt">تهانينا</h1>'
           f'<p class="abs sub" style="left:34mm;top:66mm;width:142mm">اكتمل الكتاب الأول:<br>كلوبي والبيضة المضيئة</p>'
           f'<p class="abs sub" style="left:34mm;top:124mm;width:142mm;text-align:right">الاسم</p>'
           f'<p class="abs sub" style="left:34mm;top:152mm;width:142mm;text-align:right">التاريخ</p>'
           f'<p class="abs sub" style="left:34mm;top:176mm;width:142mm;font-size:13pt">كلمتان كوريتان جديدتان: '
           f'<span lang="ko">알</span> و<span lang="ko">안녕</span></p>'
           f'<img class="abs pic" src="{ROOT}/wave.png" style="left:82mm;top:192mm;width:46mm;height:46mm">')
    ps, ph_, pr = pno_box(n)
    d = place([rect(24, 30, 186, 250, 1.5), pr], seed)
    return page(d + svg + ps, htm + ph_)

# ---------------- colour pages (cover / back) ----------------
Y, IV, GR = "#FFFF00", "#FFF9EC", "#39FF14"

def _bake_cover_scene(src_path, out_w_mm=210, out_h_mm=297, dpi=150):
    """
    Load the scene image, resize to A4 at dpi, then bake two gradients
    directly into the JPEG pixels — no CSS gradient over an <img> in the PDF
    (avoids the Chromium soft-mask / tiling-pattern bug).

      top:    ivory #FFF9EC fully opaque at row 0,
              fades to fully transparent by 76mm
      bottom: charcoal #2E2E2E at 0% opacity at 222mm,
              ramps up to 80% opacity at 297mm (page bottom)
    """
    px_w = round(out_w_mm / 25.4 * dpi)
    px_h = round(out_h_mm / 25.4 * dpi)
    fade_top_px  = round(76  / out_h_mm * px_h)   # ivory gone by 76 mm
    fade_bot_px  = round(222 / out_h_mm * px_h)   # charcoal starts at 222 mm

    img = Image.open(src_path).convert("RGB")
    img = img.resize((px_w, px_h), Image.LANCZOS)
    arr = np.array(img, dtype=float)

    ivory = np.array([255, 249, 236], dtype=float)   # #FFF9EC
    char  = np.array([ 46,  46,  46], dtype=float)   # #2E2E2E

    # top gradient: alpha 1->0 over rows 0..fade_top_px
    alphas_top = np.linspace(1.0, 0.0, fade_top_px)
    for y in range(fade_top_px):
        a = alphas_top[y]
        arr[y] = arr[y] * (1.0 - a) + ivory * a

    # bottom gradient: alpha 0->0.80 over rows fade_bot_px..px_h
    span = px_h - fade_bot_px
    alphas_bot = np.linspace(0.0, 0.80, span)
    for y in range(fade_bot_px, px_h):
        a = alphas_bot[y - fade_bot_px]
        arr[y] = arr[y] * (1.0 - a) + char * a

    baked = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    buf = io.BytesIO()
    baked.save(buf, "JPEG", quality=88, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def cover(cfg):
    """
    Branded Klovers cover for the coloring book (A4 210x297 mm).

    Layout (top to bottom):
      0 mm         : scene fills the full page (full-bleed)
      8-25 mm      : K disc lockup (yellow disc 17mm dia, centred at x=105mm)
      25-30 mm     : brand name below disc
      34-78 mm     : title (19mm, yellow + charcoal stroke)
      80-96 mm     : badge line (12.5mm, same treatment)
      100-106 mm   : subtitle (3.6mm, ivory halo)
      ~222mm->     : charcoal fade (baked into scene JPEG)
      269-277 mm   : yellow strip (8mm)
      277-297 mm   : charcoal footer bar with white brand name
    """
    # -- bake the scene (both gradients embedded in JPEG) ---------------------
    scene_uri = _bake_cover_scene(cfg["cover_img"])

    # -- SVG layer: opaque shapes only -- NO CSS gradient over the image ------
    svg = (
        # charcoal footer bar
        f'<rect x="0" y="277" width="210" height="20" fill="{INK}"/>'
        # yellow strip just above footer
        f'<rect x="0" y="269" width="210" height="8" fill="{Y}"/>'
        # K disc -- yellow circle, centred at top
        f'<circle cx="105" cy="16.5" r="8.5" fill="{Y}"/>'
        # K letter in disc -- charcoal, Cairo 800
        f'<text x="105" y="21.3" text-anchor="middle" dominant-baseline="auto" '
        f'font-family="Cairo,sans-serif" font-weight="800" font-size="11" fill="{INK}">K</text>'
    )

    # -- HTML layer -----------------------------------------------------------
    title_style = (
        f"color:{Y};"
        f"-webkit-text-stroke:1mm {INK};"
        f"paint-order:stroke fill;"
        f"font-weight:800;"
        f"text-align:center;"
        f"line-height:1.2;"
        f"font-family:Cairo,sans-serif"
    )
    badge_style = (
        f"color:{Y};"
        f"-webkit-text-stroke:0.7mm {INK};"
        f"paint-order:stroke fill;"
        f"font-weight:800;"
        f"text-align:center;"
        f"line-height:1.2;"
        f"font-family:Cairo,sans-serif"
    )
    halo = f"text-shadow:0 0 4mm {IV},0 0 6mm {IV},0 0 9mm {IV}"

    htm = (
        # full-bleed baked scene -- NO CSS gradient on top
        f'<img style="position:absolute;left:0;top:0;'
        f'width:210mm;height:297mm;object-fit:cover;z-index:0" src="{scene_uri}">'

        # brand name below K disc
        f'<div style="position:absolute;left:0;top:26mm;width:210mm;'
        f'text-align:center;font-size:3.4mm;font-weight:700;'
        f'letter-spacing:0.3mm;color:{INK};{halo};z-index:2">كلوفرز</div>'

        # title -- big yellow outlined
        f'<div style="position:absolute;left:6mm;top:34mm;width:198mm;'
        f'{title_style};font-size:19mm;z-index:2">'
        f'{cfg["title"]}</div>'

        # badge -- part name, slightly smaller
        f'<div style="position:absolute;left:6mm;top:68mm;width:198mm;'
        f'{badge_style};font-size:12.5mm;z-index:2">'
        f'{cfg["badge"]}</div>'

        # subtitle -- age / descriptor
        f'<div style="position:absolute;left:6mm;top:86mm;width:198mm;'
        f'text-align:center;font-size:3.6mm;font-weight:700;'
        f'color:{INK};{halo};z-index:2">'
        f'{cfg["cover_line"]}</div>'

        # tagline on yellow strip
        f'<div style="position:absolute;left:0;top:269.5mm;width:210mm;'
        f'text-align:center;font-size:3.1mm;font-weight:700;'
        f'color:{INK};line-height:7.5mm;z-index:2">'
        f'تعلّم الكورية. عِشها. أحبّها.</div>'

        # white brand name on charcoal footer
        f'<div style="position:absolute;left:0;top:277.5mm;width:210mm;'
        f'text-align:center;font-size:3.4mm;font-weight:800;'
        f'color:#fff;line-height:19mm;z-index:2">كلوفرز</div>'
    )

    return (
        f'<section class="page" style="overflow:hidden;position:relative">'
        f'<svg class="layer" style="position:absolute;inset:0;z-index:1" '
        f'viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">{svg}</svg>'
        f'{htm}'
        f'</section>'
    )

def back(cfg):
    d = place([rect(22, 40, 188, 250)], 12, fills=["#FFFFFF", Y, IV], rmin=6, rmax=12)
    svg = (f'<rect width="210" height="297" fill="{IV}"/>' + d +
           f'<rect x="22" y="40" width="166" height="210" rx="12" fill="#fff" stroke="{INK}" stroke-width="0.8"/>')
    items = "".join(f'<li style="margin-bottom:2.5mm">{x}</li>' for x in cfg["back_points"])
    htm = (f'<h1 class="abs t" style="left:30mm;top:52mm;width:150mm;font-size:22pt">{cfg["title"]}</h1>'
           f'<p class="abs sub" style="left:32mm;top:76mm;width:146mm;text-align:right;font-weight:600;font-size:13pt">{cfg["blurb"]}</p>'
           f'<ul class="abs" style="left:32mm;top:118mm;width:146mm;font-size:12.5pt;font-weight:600;line-height:1.7;padding-right:6mm">{items}</ul>'
           f'<img class="abs" src="{ROOT}/../klovers/public/assets/cluby/cluby-wave.webp" style="left:84mm;top:160mm;width:42mm;height:58mm;object-fit:contain">'
           f'<p class="abs sub" style="left:30mm;top:228mm;width:150mm;font-size:12pt">كلوفرز — أكاديمية محبي الكورية</p>')
    return f'<section class="page"><svg class="layer" viewBox="0 0 210 297">{svg}</svg>{htm}</section>'

# ---------------- books ----------------
BOOKS = {
    "book1": dict(
        title="كلوبي والبيضة المضيئة",
        badge="الكتاب الأول · قصة وتلوين",
        cover_img=f"{ROOT}/egg-teaser.png",
        cover_line="للأعمار من ٤ إلى ٧ سنوات",
        blurb="في ليلة هادئة، تجد لينا وآدم بيضة عاجية عليها ورقة برسيم خضراء. "
              "كل كلمة كورية يتعلمانها توقظ البيضة أكثر، حتى يخرج منها صديق صغير اسمه كلوبي.",
        back_points=["سبع صفحات من القصة للتلوين، حول كل صورة رسوم صغيرة للتلوين أيضًا",
                     "صفحتان لتعلُّم كتابة <span lang='ko'>알</span> و<span lang='ko'>안녕</span>",
                     "صفحة لتجربة الألوان، وبيضة للتزيين، وشهادة إتمام في آخر الكتاب",
                     "صفحات مطبوعة على وجه واحد، فلا تظهر الألوان على الصفحة التالية"],
        story=[
            ("lina", "scene", "تجلس لينا وحدها في ساحة بيت كوري قديم، ومعها كتاب ودفتر. اليوم تبدأ رحلتها مع اللغة الكورية."),
            ("well", "scene", "في الليل، تجد لينا وآدم بيضة عاجية بجوار البئر، وعليها ورقة برسيم خضراء بأربع ورقات."),
            ("egg0", "square", "البيضة ساكنة تمامًا. لا تتحرك ولا تضيء، كأنها تنتظر شيئًا."),
            ("egg1", "square", "تنطق لينا أول كلمة كورية حقيقية، فيظهر على البيضة شق صغير."),
            ("egg2", "square", "يكتب آدم أول جملة كاملة، فتتوهج البيضة بضوء أصفر دافئ."),
            ("hatch", "square", "بعد أول محادثة قصيرة تنكسر القشرة، ويخرج كلوبي ويقول أول كلمة له: <span lang='ko'>안녕</span>"),
            ("wave", "square", "كلوبي صديق جديد لا يتذكر من أين جاء. ستعود ذاكرته شيئًا فشيئًا كلما تعلّم أصدقاؤه أكثر."),
        ],
    ),
}

def build(key):
    cfg = BOOKS[key]
    pages = []  # (html, is_colour)
    n = 2
    pages.append(name_page(n, 100)); n += 1
    pages.append(colour_test_page(n, 101)); n += 1
    for i, (img, kind, text) in enumerate(cfg["story"]):
        pages.append(story_page(n, img, kind, text, 200 + i)); n += 1
    pages.append(trace_page(n, "알", "<span lang='ko'>알</span> تعني: بيضة", "كلمة كورية من القصة", 300)); n += 1
    pages.append(trace_page(n, "안녕", "<span lang='ko'>안녕</span> تعني: مرحبًا", "أول كلمة قالها كلوبي", 301)); n += 1
    pages.append(decorate_page(n, 302)); n += 1
    pages.append(certificate_page(n, 303)); n += 1
    head = f'<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">{CSS}</head><body>'
    blank = '<div class="blank"></div>'
    digital = head + cover(cfg) + "".join(pages) + back(cfg) + "</body></html>"
    # print edition: every inside page on its own sheet (blank back), cover + back cover
    printed = head + cover(cfg) + blank + "".join(p + blank for p in pages[:-1]) + pages[-1] + back(cfg) + "</body></html>"
    os.makedirs(f"{ROOT}/out", exist_ok=True)
    for name, doc in (("digital", digital), ("print", printed)):
        open(f"{ROOT}/out/{key}-{name}.html", "w").write(doc)
    return len(pages) + 2

if __name__ == "__main__":
    key = sys.argv[1] if len(sys.argv) > 1 else "book1"
    print(build(key), "pages")
