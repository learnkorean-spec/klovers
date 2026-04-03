// Shared canvas renderer — used by both CreatorHub and MarketingGeneratorPage

export interface PostData {
  id: string;
  mainText: string;
  subtitle: string;
  extraText: string;
}

export type TemplateName = "classic" | "character" | "minimal" | "gradient" | "neon" | "dark" | "editorial" | "klovers_bold" | "klovers_varsity" | "klovers_split";
export type ColorTheme = "yellow" | "midnight" | "coral" | "forest" | "lavender" | "sunset" | "ocean" | "mono";
export type FormatKey = "instagram" | "story" | "facebook" | "tiktok";

export interface FormatOption { label: string; w: number; h: number; }

export const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post", w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post", w: 1200, h: 630 },
  tiktok:    { label: "TikTok Cover", w: 1080, h: 1920 },
};

export const THEME_COLORS: Record<ColorTheme, { bg: string; text: string; accent: string; label: string; dot: string }> = {
  yellow:   { bg: "#FFFF00", text: "#1a1a1a", accent: "#333",    label: "Classic Yellow", dot: "#FFFF00" },
  midnight: { bg: "#1a1a2e", text: "#e0e0e0", accent: "#9b87f5", label: "Midnight",       dot: "#9b87f5" },
  coral:    { bg: "#ff6b6b", text: "#fff",    accent: "#ffeaa7", label: "Coral Reef",     dot: "#ff6b6b" },
  forest:   { bg: "#2d6a4f", text: "#d8f3dc", accent: "#95d5b2", label: "Forest",         dot: "#2d6a4f" },
  lavender: { bg: "#e8d5f5", text: "#2d1b4e", accent: "#9b59b6", label: "Lavender",       dot: "#e8d5f5" },
  sunset:   { bg: "#ff7f50", text: "#fff",    accent: "#ffe0b2", label: "Sunset",         dot: "#ff7f50" },
  ocean:    { bg: "#0077b6", text: "#caf0f8", accent: "#90e0ef", label: "Ocean",          dot: "#0077b6" },
  mono:     { bg: "#f5f5f5", text: "#222",    accent: "#888",    label: "Monochrome",     dot: "#ccc" },
};

export const TEMPLATE_META: { key: TemplateName; label: string; desc: string; isKlovers?: boolean }[] = [
  { key: "klovers_bold",    label: "⚡ Bold",    desc: "Attention — Yellow frame + K badge",    isKlovers: true },
  { key: "klovers_varsity", label: "🏆 Varsity", desc: "Interest — Dark typographic layout",    isKlovers: true },
  { key: "klovers_split",   label: "✂ Split",    desc: "Action — Yellow/black diagonal CTA",    isKlovers: true },
  { key: "classic",   label: "Classic Yellow", desc: "Bold yellow background" },
  { key: "character", label: "Character Art",  desc: "Illustrated overlay" },
  { key: "minimal",   label: "Minimal",        desc: "Clean with border inset" },
  { key: "gradient",  label: "Gradient",       desc: "Smooth color blend" },
  { key: "neon",      label: "Neon",           desc: "Dark with glow effects" },
  { key: "dark",      label: "Dark",           desc: "Elegant dark theme" },
  { key: "editorial", label: "Editorial",      desc: "Magazine-style layout" },
];

// ─── Canvas Helpers ───

export function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + rw - r, y);
  ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
  ctx.lineTo(x + rw, y + rh - r);
  ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
  ctx.lineTo(x + r, y + rh);
  ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 99) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
}

// ─── KLOVERS BRAND DESIGNS ───────────────────────────────────────────────────
// All use fixed zone fractions so preview (270px CSS / 1080px canvas) = download (1080px canvas)

// BOLD — AIDA: ATTENTION. Stop the scroll. Maximum visual impact.
function renderKloversBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, _isPortrait: boolean) {
  const pad = 44 * S;
  const topH = Math.round(h * 0.09);
  const botH = Math.round(h * 0.20);
  const botY = h - botH;

  // ── Yellow background ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, w, h);

  // ── Decorative faint "K" watermark (latin — always renders) ──
  ctx.save();
  ctx.font = `900 ${Math.round(h * 0.60)}px 'Inter', 'Segoe UI Black', sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.045)";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText("K", w + 10 * S, h * 0.86);
  ctx.textBaseline = "alphabetic";
  ctx.restore();

  // ── Black top bar ──
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, topH);
  ctx.font = `700 ${Math.round(20 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("KLOVERS KOREAN ACADEMY", w / 2, topH * 0.72);
  ctx.textAlign = "left";

  // ── Eyebrow zone (h*0.09 – h*0.21) — clearly above headline ──
  const eyeY = h * 0.155;
  ctx.font = `700 ${Math.round(16 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.fillText("KOREAN COURSE", pad, eyeY);
  ctx.fillRect(pad, eyeY + 6 * S, 44 * S, 3 * S);

  // ── K circle badge — right-aligned, same eyebrow zone ──
  const bR = 30 * S;
  const bx = w - pad - bR;
  const by = h * 0.155;
  ctx.fillStyle = "#111111";
  ctx.beginPath(); ctx.arc(bx, by, bR, 0, Math.PI * 2); ctx.fill();
  ctx.font = `900 ${Math.round(22 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", bx, by);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

  // ── ATTENTION: Massive headline — starts at h*0.27, well below eyebrow ──
  const hlMax = w - pad * 2;
  const hlSize = Math.min(96 * S, hlMax / 5.2);
  ctx.font = `900 ${hlSize}px 'Inter', 'Segoe UI Black', sans-serif`;
  ctx.fillStyle = "#111111";
  wrapText(ctx, post.mainText, pad, h * 0.27, hlMax, hlSize * 1.10, 2);

  // ── Divider (FIXED) ──
  ctx.fillStyle = "#111111";
  ctx.fillRect(pad, h * 0.57, 44 * S, 3 * S);

  // ── Subtitle (FIXED zone) ──
  ctx.font = `400 ${Math.round(26 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#222222";
  wrapText(ctx, post.subtitle, pad, h * 0.615, w - pad * 2, 34 * S, 3);

  // ── Black bottom bar ──
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, botY, w, botH);

  // ── Yellow CTA pill ──
  const ctaH = 52 * S, ctaW = 220 * S;
  const ctaY = botY + (botH - ctaH) * 0.38;
  ctx.fillStyle = "#FFFF00";
  rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = `700 ${Math.round(18 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  ctx.fillText("Register Now →", pad + ctaW / 2, ctaY + ctaH * 0.67);
  ctx.textAlign = "left";

  // ── Website ──
  ctx.font = `400 ${Math.round(14 * S)}px 'Inter', sans-serif`;
  ctx.fillStyle = "rgba(255,255,0,0.5)";
  ctx.textAlign = "right";
  ctx.fillText("kloversegy.com", w - pad, botY + botH * 0.80);
  ctx.textAlign = "left";
}

// VARSITY — AIDA: INTEREST / DESIRE. Build credibility. "What's in it for me?"
function renderKloversVarsity(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, _isPortrait: boolean) {
  const pad = 36 * S;

  // ── Black background ──
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, w, h);

  // ── Subtle yellow radial glow ──
  const grd = ctx.createRadialGradient(w * 0.55, h * 0.32, 0, w * 0.55, h * 0.32, w * 0.65);
  grd.addColorStop(0, "rgba(255,220,0,0.10)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);

  // ── Yellow left accent bar ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, 5 * S, h);

  // ── KLOVERS eyebrow ──
  ctx.font = `900 ${20 * S}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.fillText("KLOVERS", pad, h * 0.075);

  // ── Yellow thick rule ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, h * 0.105, w * 0.38, 4 * S);

  // ── "KOREAN COURSE" label ──
  ctx.font = `400 ${16 * S}px 'Inter', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.fillText("KOREAN COURSE", pad, h * 0.165);

  // ── INTEREST: Large white headline (FIXED start, max 2 lines) ──
  const hlSize = Math.min(76 * S, (w - pad * 2) / 6);
  ctx.font = `900 ${hlSize}px 'Inter', 'Segoe UI Black', sans-serif`;
  ctx.fillStyle = "#ffffff";
  wrapText(ctx, post.mainText, pad, h * 0.26, w - pad * 2, hlSize * 1.08, 2);

  // ── Yellow divider (FIXED) ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(pad, h * 0.57, w - pad * 2, 2 * S);

  // ── Subtitle (FIXED zone) ──
  ctx.font = `400 ${24 * S}px 'Inter', sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  wrapText(ctx, post.subtitle, pad, h * 0.625, w - pad * 2, 32 * S, 3);

  // ── Yellow bottom strip ──
  const stripH = 56 * S;
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, h - stripH, w, stripH);

  // CTA text in strip
  ctx.font = `700 ${18 * S}px 'Inter', sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.fillText("Register Now →", pad, h - stripH + stripH * 0.67);

  // Website right-aligned
  ctx.font = `400 ${14 * S}px 'Inter', sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.textAlign = "right";
  ctx.fillText("kloversegy.com", w - pad, h - stripH + stripH * 0.67);
  ctx.textAlign = "left";
}

// SPLIT — AIDA: ACTION. Drive registration. Clear next step.
function renderKloversSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, S: number, isPortrait: boolean) {
  if (!isPortrait) {
    // Square / Landscape: yellow LEFT / black RIGHT with diagonal
    const splitX = w * 0.43;
    const slant = h * 0.08;

    // Yellow left
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
    ctx.lineTo(splitX, h); ctx.lineTo(0, h);
    ctx.closePath(); ctx.fill();

    // Black right
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.moveTo(splitX + slant, 0); ctx.lineTo(w, 0);
    ctx.lineTo(w, h); ctx.lineTo(splitX, h);
    ctx.closePath(); ctx.fill();

    // Yellow diagonal accent line
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.moveTo(splitX + slant + 8 * S, 0); ctx.lineTo(splitX + 8 * S, h);
    ctx.stroke();

    // LEFT: Large K (centered)
    const lCx = splitX * 0.5;
    ctx.font = `900 ${Math.round(splitX * 0.48)}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", lCx, h * 0.40);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // LEFT: KLOVERS label (well below K, no overlap)
    ctx.font = `700 ${Math.round(18 * S)}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("KLOVERS", lCx, h * 0.70);
    ctx.textAlign = "left";

    // RIGHT: eyebrow
    const rLeft = splitX + slant + 22 * S;
    const rW = w - rLeft - 22 * S;
    ctx.font = `600 ${17 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.65)";
    ctx.fillText("ENROLL TODAY", rLeft, h * 0.19);
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(rLeft, h * 0.21, 36 * S, 2 * S);

    // RIGHT: ACTION headline (FIXED, max 2 lines)
    const hlSize = Math.min(52 * S, rW / 5.5);
    ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "#ffffff";
    wrapText(ctx, post.mainText, rLeft, h * 0.30, rW, hlSize * 1.08, 2);

    // RIGHT: subtitle (FIXED zone)
    ctx.font = `400 ${20 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.80)";
    wrapText(ctx, post.subtitle, rLeft, h * 0.60, rW, 27 * S, 2);

    // RIGHT: CTA pill (FIXED)
    const ctaH = 50 * S, ctaW = Math.min(rW * 0.90, 220 * S);
    const ctaX = rLeft + (rW - ctaW) / 2;
    const ctaY = h * 0.74;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = `700 ${18 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("Register Now →", ctaX + ctaW / 2, ctaY + ctaH * 0.67);
    ctx.textAlign = "left";

    // RIGHT: website
    ctx.font = `400 ${14 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.40)";
    ctx.textAlign = "center";
    ctx.fillText("kloversegy.com", rLeft + rW / 2, h * 0.91);
    ctx.textAlign = "left";

  } else {
    // Portrait (Stories / TikTok): yellow TOP / black BOTTOM with diagonal
    const splitY = h * 0.40;
    const slant = w * 0.10;
    const pad = 36 * S;

    // Yellow top
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, splitY + slant);

    // Black bottom
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
    ctx.lineTo(w, h); ctx.lineTo(0, h);
    ctx.closePath(); ctx.fill();

    // Diagonal accent
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2 * S;
    ctx.beginPath();
    ctx.moveTo(0, splitY + 14 * S); ctx.lineTo(w, splitY + slant + 14 * S);
    ctx.stroke();

    // TOP: K badge
    const bR = 26 * S;
    ctx.fillStyle = "#111111";
    ctx.beginPath(); ctx.arc(pad + bR, pad + bR, bR, 0, Math.PI * 2); ctx.fill();
    ctx.font = `900 ${17 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFF00";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", pad + bR, pad + bR);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // TOP: headline
    const hlSize = Math.min(76 * S, (w - pad * 2) / 5);
    ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    wrapText(ctx, post.mainText, pad, h * 0.19, w - pad * 2, hlSize * 1.08, 2);

    // BOTTOM: subtitle (FIXED zone)
    ctx.font = `400 ${24 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    wrapText(ctx, post.subtitle, pad, h * 0.60, w - pad * 2, 32 * S, 3);

    // BOTTOM: CTA pill
    const ctaH = 56 * S, ctaW = w - pad * 2;
    const ctaY = h * 0.74;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = `700 ${20 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("Register Now →", w / 2, ctaY + ctaH * 0.67);
    ctx.textAlign = "left";

    // Website
    ctx.font = `400 ${15 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.45)";
    ctx.textAlign = "center";
    ctx.fillText("kloversegy.com", w / 2, h * 0.90);
    ctx.textAlign = "left";
  }
}

// ─── Mascot preload ───

let _mascot: HTMLImageElement | null = null;
let _mascotLoaded = false;

export function preloadMascot() {
  if (_mascot) return;
  _mascot = new Image();
  _mascot.onload = () => { _mascotLoaded = true; };
  _mascot.src = "/klovers-mascot.png";
}

// ─── Main Canvas Renderer ───

export function renderPost(
  canvas: HTMLCanvasElement,
  post: PostData,
  template: TemplateName,
  theme: ColorTheme,
  format: FormatKey,
  bgImage?: HTMLImageElement | null,
) {
  const fmt = FORMATS[format];
  const scale = canvas.width / fmt.w;
  const ctx = canvas.getContext("2d")!;
  const c = THEME_COLORS[theme];
  const w = canvas.width;
  const h = canvas.height;
  const isPortrait = h > w;
  const isDark = template === "neon" || template === "dark";

  ctx.clearRect(0, 0, w, h);

  // ─── Klovers brand designs ────────────────────────────────
  if (template === "klovers_bold")    { renderKloversBold(ctx, post, w, h, scale, isPortrait);    return; }
  if (template === "klovers_varsity") { renderKloversVarsity(ctx, post, w, h, scale, isPortrait); return; }
  if (template === "klovers_split")   { renderKloversSplit(ctx, post, w, h, scale, isPortrait);   return; }

  // ─── PHOTO SPLIT LAYOUT ───────────────────────────────────
  if (bgImage) {
    if (isPortrait) {
      const splitY = h * 0.44;
      const slant = w * 0.07;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let pw = w, ph = w / pR;
      if (ph < splitY + slant) { ph = splitY + slant; pw = ph * pR; }
      const px = (w - pw) / 2;
      ctx.drawImage(bgImage, px, 0, pw, ph);
      const fadeGrad = ctx.createLinearGradient(0, splitY * 0.5, 0, splitY + slant);
      fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
      fadeGrad.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = fadeGrad; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
      ctx.lineTo(w, h); ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = c.bg; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, splitY - 5 * scale); ctx.lineTo(w, splitY + slant - 5 * scale);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
      ctx.restore();

      const tLeft = 40 * scale;
      const tTop  = splitY + slant + 26 * scale;
      const tW    = w - 80 * scale;

      ctx.fillStyle = "#1a1a1a";
      ctx.font = `700 ${14 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KOREAN COURSE", tLeft, tTop + 16 * scale);
      ctx.fillRect(tLeft, tTop + 24 * scale, 52 * scale, 3 * scale);

      const mSize = Math.min(82 * scale, tW * 0.2);
      ctx.font = `900 ${mSize}px 'Inter', 'Segoe UI', sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      wrapText(ctx, post.mainText, tLeft, tTop + 56 * scale, tW, mSize * 1.12, 2);

      if (post.subtitle) {
        const sSize = mSize * 0.46;
        ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        // FIXED position — not computed from headline
        wrapText(ctx, post.subtitle, tLeft, h * 0.72, tW, sSize * 1.45, 3);
      }

      const ctaY = h - 72 * scale;
      ctx.fillStyle = "#1a1a1a";
      rRect(ctx, tLeft, ctaY, 174 * scale, 42 * scale, 21 * scale);
      ctx.fill();
      ctx.font = `bold ${14 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("Register Now →", tLeft + 87 * scale, ctaY + 28 * scale);
      ctx.textAlign = "start";

      if (post.extraText) {
        ctx.fillStyle = "#1a1a1a88";
        ctx.font = `${12 * scale}px 'Inter', sans-serif`;
        ctx.fillText(post.extraText, tLeft, h - 22 * scale);
      }

    } else {
      const splitX = w * 0.47;
      const slant  = h * 0.05;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
      ctx.lineTo(splitX, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let ph = h, pw = h * pR;
      if (pw < splitX + slant) { pw = splitX + slant; ph = pw / pR; }
      ctx.drawImage(bgImage, 0, (h - ph) / 2, pw, ph);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(splitX - 4 * scale, 0); ctx.lineTo(splitX + slant - 4 * scale, h);
      ctx.lineTo(splitX + slant, h); ctx.lineTo(splitX, 0);
      ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, h); ctx.lineTo(splitX + slant, h);
      ctx.closePath(); ctx.fillStyle = c.bg; ctx.fill();
      ctx.restore();

      const tLeft = splitX + slant + 28 * scale;
      const tW    = w - tLeft - 28 * scale;
      const tTop  = h * 0.13;

      ctx.fillStyle = "#1a1a1a";
      ctx.font = `700 ${13 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KOREAN COURSE", tLeft, tTop);
      ctx.fillRect(tLeft, tTop + 8 * scale, 48 * scale, 3 * scale);

      const mSize = Math.min(62 * scale, tW * 0.2);
      ctx.font = `900 ${mSize}px 'Inter', 'Segoe UI', sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      wrapText(ctx, post.mainText, tLeft, tTop + 32 * scale, tW, mSize * 1.15, 2);

      if (post.subtitle) {
        const sSize = mSize * 0.46;
        ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        // FIXED position
        wrapText(ctx, post.subtitle, tLeft, h * 0.62, tW, sSize * 1.45, 3);
      }

      const logoY = h - 38 * scale;
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(tLeft + 16 * scale, logoY, 15 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("K", tLeft + 16 * scale, logoY + 5 * scale);
      ctx.textAlign = "start";
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${12 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KLOVERS", tLeft + 38 * scale, logoY + 5 * scale);
    }
    return;
  }

  // ─── CHARACTER TEMPLATE (mascot) ─────────────────────────
  if (template === "character") {
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, h);

    if (_mascotLoaded && _mascot) {
      // Left black panel, right mascot
      const panelW = w * 0.52;
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, panelW, h);

      // Draw mascot right side
      const mh = h, mw = mh * (_mascot.width / _mascot.height);
      ctx.drawImage(_mascot, panelW - mw * 0.15, 0, mw, mh);

      const pad = 36 * scale;
      ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      ctx.fillText("KLOVERS ACADEMY", pad, h * 0.12);

      const hlSize = Math.min(64 * scale, panelW / 6);
      ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, post.mainText, pad, h * 0.24, panelW - pad * 2, hlSize * 1.08, 2);

      if (post.subtitle) {
        ctx.font = `400 ${14 * scale}px 'Inter', sans-serif`;
        ctx.fillStyle = "rgba(255,255,0,0.8)";
        // FIXED zone
        wrapText(ctx, post.subtitle, pad, h * 0.58, panelW - pad * 2, 21 * scale, 3);
      }

      const ctaH = 40 * scale, ctaW = 160 * scale;
      const ctaY = h * 0.76;
      ctx.fillStyle = "#FFFF00";
      rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.font = `700 ${13 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";
      ctx.fillText("Register Now →", pad + ctaW / 2, ctaY + ctaH * 0.67);
      ctx.textAlign = "left";
    } else {
      // Fallback without mascot — use fixed safe zones
      ctx.save();
      ctx.font = `900 ${Math.round(h * 0.55)}px serif`;
      ctx.fillStyle = "rgba(0,0,0,0.06)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("K", w / 2, h * 0.5);
      ctx.textBaseline = "alphabetic";
      ctx.restore();

      const pad = 44 * scale;
      ctx.font = `700 ${Math.round(18 * scale)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      ctx.fillText("KLOVERS ACADEMY", pad, h * 0.155);

      const hlSize = Math.min(88 * scale, (w - pad * 2) / 6);
      ctx.font = `900 ${Math.round(hlSize)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111";
      wrapText(ctx, post.mainText, pad, h * 0.27, w - pad * 2, Math.round(hlSize * 1.08), 2);

      if (post.subtitle) {
        ctx.font = `400 ${Math.round(hlSize * 0.42)}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, pad, h * 0.60, w - pad * 2, Math.round(hlSize * 0.42 * 1.45), 3);
      }

      const ctaH = Math.round(52 * scale), ctaW = Math.round(220 * scale);
      const ctaY = h * 0.75;
      ctx.fillStyle = "#111111";
      rRect(ctx, pad, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.font = `700 ${Math.round(18 * scale)}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      ctx.textAlign = "center";
      ctx.fillText("Register Now →", pad + ctaW / 2, ctaY + ctaH * 0.67);
      ctx.textAlign = "left";
    }
    return;
  }

  // ─── NO-PHOTO LAYOUTS (classic, minimal, gradient, neon, dark, editorial) ──
  const isBrand = !isDark && template !== "minimal";

  // Background
  if (template === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c.bg); grad.addColorStop(1, c.accent);
    ctx.fillStyle = grad;
  } else if (template === "neon") {
    ctx.fillStyle = "#0a0a0a";
  } else if (template === "dark") {
    ctx.fillStyle = "#1a1a1a";
  } else {
    ctx.fillStyle = c.bg;
  }
  ctx.fillRect(0, 0, w, h);

  // Diagonal triangle accent (bottom-right) — brand only
  if (isBrand) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h); ctx.lineTo(w, h * 0.42); ctx.lineTo(w, h);
    ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
    ctx.restore();
  }

  // Decorative K watermark (Latin — always renders, no overlap)
  if (isBrand) {
    ctx.save();
    ctx.font = `900 ${Math.round(h * 0.60)}px 'Inter', 'Segoe UI Black', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.045)";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillText("K", w + 10 * scale, h * 0.86);
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.restore();
  }

  // Left accent bar
  ctx.fillStyle = isDark ? c.accent : "#1a1a1a";
  ctx.fillRect(38 * scale, 38 * scale, 5 * scale, h * 0.2);

  if (template === "minimal") {
    ctx.strokeStyle = c.text; ctx.lineWidth = 3 * scale;
    const m = 30 * scale; ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  }

  // Editorial: left black panel
  if (template === "editorial") {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, w * 0.08, h);
    ctx.fillStyle = c.bg;
  }

  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 24 * scale; }

  // Text layout — all positions FIXED as fractions of h with proper safe zones
  const pad    = 44 * scale;  // Standard 44px safe margin (4% of 1080px)
  const tLeft  = template === "editorial" ? pad * 2 : pad;
  const tW     = w - tLeft - pad;  // Ensure text never extends beyond right margin
  const eyeColor = isDark ? (template === "neon" ? c.accent : "#aaa") : "#1a1a1a";

  // Eyebrow at FIXED h*0.155 (upper eyebrow zone)
  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
  ctx.fillStyle = eyeColor;
  ctx.font = `700 ${Math.round(20 * scale)}px 'Inter', sans-serif`;
  ctx.fillText("KOREAN COURSE", tLeft, h * 0.155);
  ctx.fillStyle = eyeColor;
  ctx.fillRect(tLeft, h * 0.155 + 8 * scale, 44 * scale, 3 * scale);

  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 18 * scale; }

  // Headline at FIXED h*0.27 (well-separated from eyebrow, max 2 lines)
  const mSize = Math.min(isPortrait ? 96 * scale : 80 * scale, tW * 0.15);
  ctx.font = `900 ${Math.round(mSize)}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.fillStyle = isDark ? "#fff" : "#1a1a1a";
  wrapText(ctx, post.mainText, tLeft, h * 0.27, tW, Math.round(mSize * 1.12), 2);

  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

  // Subtitle at FIXED h*0.60 — position never depends on headline
  if (post.subtitle) {
    const sSize = Math.round(mSize * 0.42);
    ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
    ctx.fillStyle = isDark ? "#bbb" : "#333";
    wrapText(ctx, post.subtitle, tLeft, h * 0.60, tW, Math.round(sSize * 1.45), 3);
  }

  // CTA pill at FIXED position (h*0.75)
  const ctaH  = Math.round(52 * scale);
  const ctaW  = Math.round(220 * scale);
  const ctaY  = h * 0.75;
  const ctaBg = isDark ? c.accent : "#1a1a1a";
  ctx.fillStyle = ctaBg;
  rRect(ctx, tLeft, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = `bold ${Math.round(18 * scale)}px 'Inter', sans-serif`;
  ctx.fillStyle = isDark ? "#1a1a1a" : "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("Register Now →", tLeft + ctaW / 2, ctaY + ctaH * 0.67);
  ctx.textAlign = "left";

  // Footer strip with hashtags (h*0.88–h*1.0)
  ctx.fillStyle = isDark ? "#111" : "#1a1a1a";
  ctx.fillRect(0, h * 0.88, w, h * 0.12);
  ctx.font = `bold ${Math.round(16 * scale)}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(post.extraText || "#LearnKorean #Klovers", w / 2, h * 0.94);
  ctx.textAlign = "left";
}
