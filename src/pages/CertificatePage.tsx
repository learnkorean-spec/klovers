import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { getLevelByKey, mapLegacyLevel, type Level } from "@/constants/levels";

/**
 * WHAT THIS DOCUMENT MAY AND MAY NOT SAY
 * --------------------------------------
 * It used to read: "has successfully completed the Korean language program at
 * KLovers Korean Academy and achieved the level of" → "TOPIK 1 – Beginner",
 * over Reham's signature.
 *
 * Klovers cannot award a TOPIK band. TOPIK is awarded by NIIED on the strength
 * of a sat exam, and a term of roughly 36 contact hours is not the ~200 hours
 * a level is reckoned at (see the note at the top of `constants/levels.ts`).
 * So the certificate now certifies the only thing it can: that this student
 * completed this Klovers course, and which TOPIK band that course prepares
 * them toward. A line at the foot says outright that it is not a TOPIK result,
 * because a gold-bordered PNG with a signature on it will be shown to people
 * who did not read this file.
 */

/**
 * Old certificate links are in inboxes and chat histories, so every value this
 * page ever issued still has to resolve: bare CEFR, the old "TOPIK n / An"
 * pairs, and the pre-2026-04 level keys.
 */
const CEFR_TO_KEY: Record<string, string> = {
  A0: "hangul",
  "PRE-A1": "hangul",
  A1: "l1",
  A2: "l2",
  B1: "l3",
  B2: "l4",
  C1: "l5",
  C2: "l6",
};

const resolveLevel = (raw: string): Level | undefined => {
  const value = raw.trim();
  if (!value) return undefined;

  // Canonical key first: hangul, l1…l6.
  const direct = getLevelByKey(value);
  if (direct) return direct;

  // Bare CEFR, as the old dashboard button sent ("A0" was its default).
  const byCefr = CEFR_TO_KEY[value.toUpperCase()];
  if (byCefr) return getLevelByKey(byCefr);

  // "TOPIK 3 / B1" and friends.
  const topik = value.match(/TOPIK\s*([1-6])/i);
  if (topik) return getLevelByKey(`l${topik[1]}`);

  // foundation, level_1, beginner_2, …
  return mapLegacyLevel(value);
};

const CertificatePage = () => {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Your Certificate", description: "Your Klovers course completion certificate.", noindex: true });

  const { t } = useLanguage();
  const [params] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("Student");
  const [loading, setLoading] = useState(true);
  const rawLevel = decodeURIComponent(params.get("level") || "");
  const level = resolveLevel(rawLevel);

  // The course completed. Hangul has no TOPIK band, so it states its length
  // instead — the fact that makes it a course rather than a warm-up.
  const courseLine = level
    ? level.topik
      ? level.name
      : `${level.name} · ${level.sessions ?? 4} classes`
    : "Korean course";

  // What that course prepares them for. Never what it certifies.
  const preparesLine = level
    ? level.topik
      ? `a course preparing toward TOPIK ${level.topik}`
      : "reading and writing the Korean alphabet"
    : "";

  useEffect(() => {
    const loadName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = params.get("uid") || session.user.id;
      const { data } = await supabase.from("profiles").select("name").eq("user_id", uid).maybeSingle();
      if (data?.name) setName(data.name);
      setLoading(false);
    };
    loadName();
  }, [params]);

  useEffect(() => {
    if (loading) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas text only uses a web font that is already loaded, so wait for the
    // brand faces (Poppins / Inter / Noto Sans KR) before drawing. If a face
    // fails to load, draw anyway with the fallback rather than never.
    let cancelled = false;
    const draw = () => {
    const W = 1200, H = 850;
    canvas.width = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Gold border outer
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    // Gold border inner
    ctx.strokeStyle = "rgba(255,255,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    // Corner ornaments
    const corners = [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]];
    corners.forEach(([x, y]) => {
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top badge / logo area
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.arc(W / 2, 110, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "800 40px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("K", W / 2, 126);

    // Title
    ctx.fillStyle = "#FFFF00";
    ctx.font = "700 15px Poppins, sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("K L O V E R S   K O R E A N   A C A D E M Y", W / 2, 186);

    ctx.letterSpacing = "0px";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 210);

    // Divider
    const grad = ctx.createLinearGradient(100, 0, W - 100, 0);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.5, "#FFFF00");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 230);
    ctx.lineTo(W - 100, 230);
    ctx.stroke();

    // "This certifies that"
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 18px Inter, sans-serif";
    ctx.fillText("This is to certify that", W / 2, 285);

    // Student name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${name.length > 20 ? 44 : 56}px Poppins, sans-serif`;
    ctx.fillText(name, W / 2, 360);

    // Underline name
    const nameW = ctx.measureText(name).width;
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameW / 2, 374);
    ctx.lineTo(W / 2 + nameW / 2, 374);
    ctx.stroke();

    // Completion — a course, at this academy. Not a band, not an award.
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "italic 18px Inter, sans-serif";
    ctx.fillText("has successfully completed, at KLovers Korean Academy,", W / 2, 428);

    // Level badge background — manual rounded rect (roundRect not supported in older Safari/Firefox)
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Measure before drawing: "Hangul Foundation · 4 classes" is a good deal
    // wider than "Level 1", and a fixed 320px badge clipped it.
    ctx.font = "700 22px Poppins, sans-serif";
    const badgeW = Math.max(320, ctx.measureText(courseLine).width + 72);
    ctx.fillStyle = "#FFFF00";
    rr(W / 2 - badgeW / 2, 462, badgeW, 64, 12);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.fillText(courseLine, W / 2, 501);

    // What the course prepares them toward — deliberately below the badge and
    // in the quieter style, because it is context, not the award.
    if (preparesLine) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = "italic 17px Inter, sans-serif";
      ctx.fillText(preparesLine, W / 2, 556);
    }

    // Divider
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 588);
    ctx.lineTo(W - 100, 588);
    ctx.stroke();

    // Date + signature area
    const dateStr = new Date().toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "14px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Issued: ${dateStr}`, 120, 632);

    ctx.textAlign = "right";
    ctx.fillText("kloversegy.com", W - 120, 632);

    // Signature line
    ctx.textAlign = "center";
    ctx.strokeStyle = "rgba(255,255,0,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, 688);
    ctx.lineTo(W / 2 + 120, 688);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "700 16px Poppins, sans-serif";
    ctx.fillText("Reham", W / 2, 712);

    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText("Founder & Lead Instructor · KLovers Academy", W / 2, 730);

    // Says the quiet part out loud. This PNG will be forwarded to people who
    // never saw the page it came from, and it must not be mistaken for a TOPIK
    // result awarded by NIIED.
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText(
      "Certifies completion of a Klovers course. It is not a TOPIK result — TOPIK is awarded by NIIED.",
      W / 2,
      782
    );

    // Korean text watermark
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#FFFF00";
    ctx.font = "700 200px 'Noto Sans KR', sans-serif";
    ctx.fillText("한국어", W / 2, H / 2 + 60);
    ctx.restore();
    };

    Promise.allSettled([
      document.fonts.load("800 56px Poppins"),
      document.fonts.load("700 22px Poppins"),
      document.fonts.load("14px Inter"),
      document.fonts.load("italic 18px Inter"),
      document.fonts.load("700 200px 'Noto Sans KR'", "한국어"),
    ]).then(() => {
      if (!cancelled) draw();
    });
    return () => {
      cancelled = true;
    };
  }, [loading, name, courseLine, preparesLine]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `klovers-certificate-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <h1 className="text-foreground text-2xl font-bold mb-2">{t("certificatePage.pageTitle")}</h1>
      <p className="text-muted-foreground text-sm mb-6">{t("certificatePage.pageSubtitle")}</p>

      {loading ? (
        <div className="text-muted-foreground">{t("certificatePage.generating")}</div>
      ) : (
        <>
          <canvas
            ref={canvasRef}
            className="rounded-xl shadow-2xl max-w-full"
            style={{ border: "2px solid rgba(255,255,0,0.3)" }}
          />
          <Button onClick={download} className="mt-6 gap-2 text-base font-bold px-8" size="lg">
            <Download className="h-5 w-5" /> {t("certificatePage.downloadPng")}
          </Button>
          <p className="text-muted-foreground text-xs mt-3">{t("certificatePage.rightClickHint")}</p>
        </>
      )}
    </div>
  );
};

export default CertificatePage;
