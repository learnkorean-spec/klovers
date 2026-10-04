import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, Copy, ExternalLink, Palette, TriangleAlert } from "lucide-react";

/**
 * Admin → Brand. The brand sheet, kept where the work happens (Re, 5 Oct 2026).
 *
 * WHY THIS IS NOT AN <iframe>
 *
 * The obvious build is `<iframe src="/brand-sheet.html">`. It is the wrong one
 * here, and it fails in the worst possible way: vercel.json sets
 * `frame-src 'none'` in the Content-Security-Policy, so the frame loads on the
 * dev server and is BLOCKED in production. A reference screen that works
 * everywhere except the live site is worse than no screen. The panel therefore
 * renders the sheet's decisive rules natively, and links out for the rest.
 * scripts/lib/brand-sheet-panel.test.mjs fails if an iframe is ever added back.
 *
 * WHY IT REPEATS THE SHEET AT ALL
 *
 * Two copies of one fact drift. This panel is deliberately the SHORT form:
 * colour, Cluby, the two learners, the rules that decide whether a generated
 * image is usable, and the icon rule. The full sheet (fonts, the contrast
 * table, UI examples, Cluby's voice, the numbers) stays in
 * public/brand-sheet.html and is one click away. The two prompt lines below are
 * shared verbatim with that file and a test asserts they still match, so the
 * copy that matters cannot quietly disagree.
 *
 * SOURCES OF TRUTH, in order:
 *   colour ......... src/index.css (its own comment says so)
 *   characters ..... src/config/klovers-world.ts
 *   full sheet ..... public/brand-sheet.html
 */

/** The two lines to paste into an image prompt. Kept identical to brand-sheet.html. */
export const CLUBY_PROMPT =
  "Cluby: small mint-green realistic-cute 3D plush creature with soft felt-fur texture, round head, two short butter-yellow horns, pointed ears with pink inner ear, warm dark-brown eyes, ivory mini hanbok top, yellow wrap skirt with a sash bow, short mint-green tail with small spikes.";

export const LEARNERS_PROMPT =
  "Adam: a man in his early 20s, not Korean and not East Asian, wavy dark-brown hair, a Klovers-yellow tailored blazer over an ivory t-shirt, ivory trousers, white sneakers. Lina: a woman in her early 20s, not Korean and not East Asian, long wavy auburn-copper hair, light freckles, an ivory hanbok-inspired wrap top with white floral embroidery, a Klovers-yellow midi skirt with a yellow floral sash, ivory flats. Photorealistic people with natural skin texture and real fabric. Friends and study companions, never a couple.";

const BRAND_COLOURS = [
  { name: "Klovers Yellow", hex: "#FFFF00", role: "The ground — bands, highlights, the one action per screen." },
  { name: "Charcoal", hex: "#2E2E2E", role: "All text, and every strong surface. The only colour allowed on yellow or green." },
  { name: "Ivory", hex: "#FFF9EC", role: "The surface the eye rests on. Warmer than white, so the yellow glows." },
];

const STATUS_COLOURS = [
  { name: "correct · live", hex: "#0E7A4F", role: "Done, correct, a class happening now." },
  { name: "wrong", hex: "#B80000", role: "Wrong answers and missed classes — text or fill." },
  { name: "wrong-graphic", hex: "#FF3131", role: "Neon red, for a border, an x mark or a flash — never small text." },
  { name: "live-surface", hex: "#BFF0D9", role: "The calm “today, later” panel." },
  { name: "live-bright", hex: "#39FF14", role: "The neon. A fill and an edge only, never text on a light surface." },
];

const IMAGE_RULES = [
  "No text, no letters, no Hangul, no logos, no watermarks, no UI in the picture.",
  "One Namsan Tower at most.",
  "Adam and Lina are friends and study companions — never a couple: no hand-holding, no cheek-to-cheek, no arms around each other.",
  "Soft edges and clean empty space on one third, so the picture melts into the page colour. Never a hard framed rectangle.",
  "Yellow is the field and charcoal sits on it; the retired mint, peach and pink never come back as a surface.",
];

const ICON_RULES = [
  "One Cluby, and always the 3D plush — never the flat 2D set in public/assets/characters/.",
  "klobi-reading and game-klobi-thumbsup are excluded and still to be redrawn in 3D.",
  "student-boy-thumbsup and student-girl-heart are illustrated faces, so they break the standing rule. Replace those two files with photographs of Adam and Lina and keep the same file names — the 23 call sites then need no edit at all.",
  "An icon sits on a rounded tile at about 80% of it, with the same corner radius along a row.",
  "Lucide line icons only for tiny functional glyphs. Never emoji as UI.",
];

function PromptBlock({ label, line }: { label: string; line: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(line);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({
        title: "Couldn't copy automatically",
        description: "Select the text and press Ctrl+C.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Button size="sm" variant="outline" onClick={copy} className="h-8 shrink-0">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy the line"}
        </Button>
      </div>
      <code className="block whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground">
        {line}
      </code>
    </div>
  );
}

function Swatch({ hex, name, role }: { hex: string; name: string; role: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border p-3">
      <span
        className="h-12 w-12 shrink-0 rounded-lg border border-charcoal/20"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-foreground">{name}</span>
          <code className="text-xs text-muted-foreground">{hex}</code>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((r) => (
        <li key={r} className="flex gap-2 text-sm leading-relaxed text-foreground">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-charcoal/60" aria-hidden="true" />
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}

export default function BrandSheetPanel() {
  return (
    <div className="space-y-6">
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Brand sheet — the reference
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            The short form, kept beside the work it governs. It answers one question:{" "}
            <em>is this picture, icon or colour a Klovers one?</em> The full sheet — fonts, the
            contrast table, UI examples, Cluby&rsquo;s voice and the approved numbers — is the
            page below.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild variant="outline">
            <a href="/brand-sheet.html" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Open the full brand sheet
            </a>
          </Button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Colour comes from <code>src/index.css</code> and characters from{" "}
            <code>src/config/klovers-world.ts</code>; both outrank this screen and the HTML page.
            This screen is embedded rather than framed on purpose: the Content-Security-Policy sets{" "}
            <code>frame-src &lsquo;none&rsquo;</code>, so an iframe would load in development and be
            blocked on the live site.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl bg-charcoal text-ivory">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-ivory">
            Standing rule — the theme is always the real scenes
          </CardTitle>
          <p className="text-sm text-ivory/75">
            One theme, and it is photographic. There is <strong>no size exception</strong>: a 40px
            trust badge is the same theme as a 1600px hero, so an illustrated or anime face is out
            even where it is small enough to read as decoration.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-ivory/85">
          <p>
            This is why the two illustrated trust icons are a break rather than a style choice. The
            same sentence retires the flat 2D Cluby set in <code>public/assets/characters/</code>{" "}
            and the drawn blog covers. The Book A-0 cover being illustrated does not license an
            illustrated style in the product — it is source material for the characters, not a
            style.
          </p>
          <p className="text-xs text-ivory/65">
            Re, 5 Oct 2026. Canon: <code>src/config/klovers-world.ts</code> &rarr;{" "}
            <code>visualSystem.standingRule</code>, which wins if this screen, the HTML sheet and
            the story bible ever disagree.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Colour</CardTitle>
          <p className="text-sm text-muted-foreground">
            Three brand colours plus status colours that never count toward them.{" "}
            <code>src/index.css</code> is the source of truth.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {BRAND_COLOURS.map((c) => (
              <Swatch key={c.hex} hex={c.hex} name={c.name} role={c.role} />
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status — moment-only, never decoration
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {STATUS_COLOURS.map((c) => (
                <Swatch key={c.name} hex={c.hex} name={c.name} role={c.role} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Retired — no new use:</span>
            {["#FFF000", "#25D366", "#BEEFCB mint", "#FFB7A1 peach", "#FF4FD8 pink"].map((h) => (
              <Badge key={h} variant="outline" className="font-normal">
                {h}
              </Badge>
            ))}
          </div>
          <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              The HTML sheet is a step behind on one colour: its palette block still shows the pink{" "}
              <code>#FF4FD8</code> for wrong answers, which the neon red <code>#FF3131</code>{" "}
              replaced on 1 Oct 2026. Where the two disagree, this screen and{" "}
              <code>src/index.css</code> are right.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Cluby — one mascot, always the 3D plush</CardTitle>
          <p className="text-sm text-muted-foreground">
            A small plush dragon in a mini hanbok. Not a pet, and never a second look-alike
            mascot.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <PromptBlock label="Paste into every Cluby prompt" line={CLUBY_PROMPT} />
          <RuleList
            items={[
              "Only the 3D plush: mint-green felt fur, warm dark-brown eyes, two butter-yellow horns, the ivory hanbok top and yellow wrap skirt.",
              "Never the flat 2D cartoon set in public/assets/characters/ — it is off-model for the site.",
              "offmodel-green-eyes.webp is kept for reference only: green eyes are wrong.",
              "“Klobi” is a retired spelling. Older files still carry it; do not add more.",
            ]}
          />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">People — KLOVERS REAL</CardTitle>
          <p className="text-sm text-muted-foreground">
            The two learners on the site are Adam and Lina. Every human picture is a photograph of
            these two — no third person, no generic stock face.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <PromptBlock label="Paste into every Adam & Lina prompt" line={LEARNERS_PROMPT} />
          <RuleList
            items={[
              "Photorealistic people with natural skin texture and real fabric — the approved style.",
              "Never anime, manga, cartoon, comic or flat-vector faces.",
              "Friends and study companions. The canon forbids romantic framing by default.",
              "A real photograph of real Klovers students, with consent, beats a generated one.",
            ]}
          />
          <p className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              The style here is settled by the standing rule above. What is <em>not</em> settled is
              narrower: the canon fixes only that the two are{" "}
              <code>not Korean and not East Asian</code>, so their features and skin tone are still
              Re&rsquo;s decision and no prompt should invent them.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">In every generated image</CardTitle>
        </CardHeader>
        <CardContent>
          <RuleList items={IMAGE_RULES} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Icons</CardTitle>
        </CardHeader>
        <CardContent>
          <RuleList items={ICON_RULES} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">What is still breaking these rules</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kept current on purpose. A list that still names things already fixed is worse than no
            list: it teaches whoever reads it to stop trusting it.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>A drawn cover on 17 blog posts.</strong> Same rule, seventeen files, all in{" "}
            <code>public/assets/blog/</code>. The pack's template puts no people in a blog cover at
            all, which removes the who-is-this-character question instead of answering it.
          </p>
          <p className="text-muted-foreground">
            <strong>Fixed, and no longer listed here:</strong> every 2D drawing of Cluby — the flat
            set the game hub drew from <code>public/assets/characters/</code>, and the four flat
            mascot icons (<code>klobi-reading</code>, <code>klobi-headphones</code>,{" "}
            <code>game-klobi-thumbsup</code>, <code>game-klobi-han</code>), now 3D plush renders at
            the same file names; the two illustrated trust icons (<code>student-boy-thumbsup</code>{" "}
            and <code>student-girl-heart</code>, now photographs); the nine small sites those two
            used at 14 to 24px; the three cartoon brand files (<code>klovers-mascot.png</code>, its
            byte-identical twin <code>klovers-characters.png</code>, and{" "}
            <code>characters/hanbok-pair.jpg</code>), retired by one real portrait that also saves 3
            MB; and 87 MB of dead art, including the anime figures that sat inlined in the code
            itself.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
