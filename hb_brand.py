import re, sys, json
p = 'src/pages/HangulBookPage.tsx'
s = open(p, encoding='utf-8').read()
orig = s

def need(a, b):
    global s
    if s.count(a) == 0:
        print('MISS', a[:70]); sys.exit(1)
    s = s.replace(a, b)

# 1. Taegeuk icon and ribbon: charcoal + yellow instead of flag blue/red
need('fill="#0047AB" />', 'fill="#2E2E2E" />')
need('fill="#C8102E" />', 'fill="#FFFF00" />')
need('stroke="#C8102E"', 'stroke="#2E2E2E"')
need('{["#0047AB","#C8102E",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB",Y,GL,"#C8102E","#0047AB"]',
     '{["#2E2E2E","#FFFF00",Y,GL,"#FFFF00","#2E2E2E",Y,GL,"#FFFF00","#2E2E2E",Y,GL,"#FFFF00","#2E2E2E"]')

# 2. Brand tokens
need('const GL   = "#F0FFF4";', 'const GL   = "#FFF9EC";')
need('const GD   = "#166534";', 'const GD   = "#2E2E2E";')
need('const BK   = "#111111";', 'const BK   = "#2E2E2E";')
need('const GOLD = "#D4AF37";', 'const GOLD = "#FFFF00";')
need('const CREAM = "#FAFAF8";', 'const CREAM = "#FFF9EC";')
need('const YL   = "#FFFDE7";', 'const YL   = "#FFF9EC";')
need('const T1   = "#111111";', 'const T1   = "#2E2E2E";')
need('const KIDS_PINK = "#FFF5F5";', 'const KIDS_PINK = "#FFF9EC";')
need('const KIDS_RED  = "#E94B4B";', 'const KIDS_RED  = "#2E2E2E";')
need('const KIDS_GREEN= "#3FB984";', 'const KIDS_GREEN= "#2E2E2E";')
need('const KIDS_BLUE = "#4D9EE8";', 'const KIDS_BLUE = "#2E2E2E";')
need('const KIDS_YELL = "#FFC93C";', 'const KIDS_YELL = "#FFFF00";')
need('const KIDS_PURPLE="#9B6BC9";', 'const KIDS_PURPLE="#2E2E2E";')
need('const KIDS_ORANGE="#FF8C42";', 'const KIDS_ORANGE="#2E2E2E";')

# 3. Remaining off-palette literals
HEX = {
 '0047AB':'2E2E2E','C8102E':'2E2E2E','166534':'2E2E2E','20B2AA':'2E2E2E','D2691E':'2E2E2E',
 '7B1A3A':'2E2E2E','92400E':'2E2E2E','22C55E':'2E2E2E','4ADE80':'2E2E2E','111111':'2E2E2E',
 '0A0800':'2E2E2E','2A2A2A':'2E2E2E','2A1A0E':'2E2E2E','1A1A1A':'2E2E2E','1A0E08':'2E2E2E','0D0804':'2E2E2E',
 'FBBF24':'FFFF00','D4AF37':'FFFF00','FFC93C':'FFFF00','FF8C42':'FFFF00','A8E690':'FFFF00',
 'FFFDF3':'FFF9EC','FFFEF0':'FFF9EC','FEF9EC':'FFF9EC','FFFDF8':'FFF9EC','FFF8F1':'FFF9EC',
 'FFF8E1':'FFF9EC','FFF5F5':'FFF9EC','FFE2C0':'FFF9EC','FFD7D7':'FFF9EC','FBD9D9':'FFF9EC',
 'FAD9E8':'FFF9EC','F5FAFE':'FFF9EC','F0F4FF':'FFF9EC','E5D8F0':'FFF9EC','D7EFD0':'FFF9EC',
 'D6E9F8':'FFF9EC','F0FFF4':'FFF9EC','FFFDE7':'FFF9EC','FAFAF8':'FFF9EC','7ED957':'FFF9EC',
 'E94B4B':'2E2E2E','3FB984':'2E2E2E','4D9EE8':'2E2E2E','9B6BC9':'2E2E2E',
}
def hexsub(m):
    h = m.group(1).upper()
    return '#' + HEX[h] if h in HEX else m.group(0)
s = re.sub(r'#([0-9a-fA-F]{6})\b', hexsub, s)
s = re.sub(r'#(111|222)\b(?![0-9a-fA-F])', '#2E2E2E', s)

# 4. Emoji data icons -> Klovers icons (unmapped emoji render nothing)
V = '️'
ICON_MAP = {
 '\U0001F524':'flashcard-ga', '\U0001F3AC':'game-chat-smile', '\U0001F451':'palace-blossoms',
 '\U0001F4DA':'books-stack', '\U0001F4D6':'klobi-reading', '\U0001F3C6':'badge-blossom',
 '\U0001F4AA':'growth-chart', '\U0001F5E3'+V:'chat-annyeong', '\U0001F3D7'+V:'game-hangeul-spelling',
 '✏'+V:'game-checklist-pencil', '\U0001F4DC':'diploma-scroll', '\U0001F393':'diploma-scroll',
 '✅':'calendar-check', '\U0001F5FA'+V:'game-korea-map', '\U0001F338':'hanok-cherry-tree',
 '\U0001F3DB'+V:'palace-blossoms', '\U0001F3D4'+V:'game-korea-map', '\U0001F3AF':'lightbulb-sprout',
 '\U0001F5D3'+V:'calendar-blossom', '\U0001F4C5':'calendar-blossom', '⏱'+V:'game-time-dates',
 '\U0001F50A':'klobi-headphones', '\U0001F3A4':'klobi-headphones', '✍'+V:'game-checklist-pencil',
 '\U0001F5BC'+V:'flashcard-ga', '\U0001F522':'game-time-dates', '\U0001F31F':'badge-blossom',
 '\U0001F389':'badge-blossom', '\U0001F517':'game-particle-puzzle', '\U0001F9E0':'lightbulb-sprout',
 '\U0001F1F0\U0001F1F7':'flag-korea', '\U0001F30D':'globe-plane', '\U0001F310':'globe-plane',
 '\U0001F44B':'chat-annyeonghaseyo', '\U0001F64B':'chat-annyeonghaseyo', '\U0001F35C':'bibimbap',
 '\U0001F52C':'lightbulb-sprout', '\U0001F382':'calendar-blossom', '\U0001F469‍\U0001F3EB':'student-girl-heart',
 '\U0001F3D9'+V:'namsan-tower', '\U0001F4D3':'books-stack', '\U0001F511':'lightbulb-sprout',
}
body = '{\n' + ''.join('  %s: "%s",\n' % (json.dumps(k), v) for k, v in ICON_MAP.items()) + '}'
helper = '''
/* Emoji in the book data are shown as Klovers icons (brand guard, 27 Sep
   2026). An emoji with no matching Klovers icon is not drawn at all. */
const BOOK_ICON_MAP: Record<string, KloverIconName> = ''' + body + ''';
function BookIcon({ e }: { e?: string }) {
  const name = e ? BOOK_ICON_MAP[e] : undefined;
  if (!name) return null;
  return <KloverIcon name={name} className="inline-block h-[1.4em] w-[1.4em] align-middle" />;
}
'''
need('import KloverIcon from "@/components/KloverIcon";', 'import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";')
need('/* ─── Brand tokens', helper + '\n/* ─── Brand tokens')
n0 = len(re.findall(r'\{(item|r|c|b|s|v|it)\.(icon|emoji)\}', s))
s = re.sub(r'\{(item|r|c|b|s|v|it)\.(icon|emoji)\}', r'<BookIcon e={\1.\2} />', s)
print('icon sites', n0)
if n0 != 17: sys.exit(1)

# 5. Word pictures: Korean word tiles instead of random stock photos
start = s.index('// Map each English word/phrase to a single safe-search keyword')
end = s.index('const LESSON_WORDS')
tile = '''// 27 Sep 2026 (brand guard): the word pictures used random stock photos
// (loremflickr) with an emoji fallback. Now each word is a Korean word tile
// in the palette, so nothing off-brand or unrelated appears in the book.
function WordIllustration({ k, alt, size = 64 }: { k: string; alt: string; size?: number }) {
  return (
    <div
      role="img"
      aria-label={alt}
      lang="ko"
      style={{ width:`${size}px`, height:`${size}px`, display:"flex", alignItems:"center", justifyContent:"center",
        background:"#FFF9EC", border:"2px solid #2E2E2E", borderRadius:"6px", color:"#2E2E2E",
        fontFamily:"'Noto Sans KR', sans-serif", fontWeight:800, fontSize:`${Math.round(size*0.3)}px`, lineHeight:1.1, textAlign:"center", padding:"2px" }}
    >
      {k}
    </div>
  );
}

'''
s = s[:start] + tile + s[end:]
need('<WordIllustration emoji={w.emoji} en={w.en} alt={isAr ? w.ar : w.en} size={56} />',
     '<WordIllustration k={w.k} alt={isAr ? w.ar : w.en} size={56} />')

open(p, 'w', encoding='utf-8').write(s)
print('ok', len(orig), len(s))
