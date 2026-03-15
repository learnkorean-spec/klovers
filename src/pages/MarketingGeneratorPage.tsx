import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Copy, Download, Sparkles, Image, Info, RefreshCw, Loader2, Palette,
  Grid3X3, Monitor, Smartphone, Zap, CheckCircle2, ChevronDown, ChevronUp, DownloadCloud, Brush,
  CalendarDays, ChevronLeft, ChevronRight, Plus, Wand2, FileDown, Trash2,
} from "lucide-react";

// ─── Brand canvas renderer (exact #FFFF00) ───
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + " ";
      cy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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
}

function renderBrandPost(
  canvas: HTMLCanvasElement,
  mainText: string,
  subtitle: string,
  extra: string,
  w: number,
  h: number,
  isUrgent = false,
) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const s = w / 1080; // scale factor

  // ── Background: pure brand yellow ──
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, w, h);

  // ── Diagonal black triangle (bottom-right corner) ──
  ctx.fillStyle = "#111111";
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h);
  ctx.lineTo(w, h * 0.42);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // ── Giant Korean watermark 한 (faint, behind everything) ──
  ctx.save();
  ctx.font = `900 ${Math.round(520 * s)}px 'Arial', sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.055)";
  ctx.textAlign = "center";
  ctx.fillText("한", w * 0.52, h * 0.72);
  ctx.restore();

  // ── Top-left accent bar ──
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, 16 * s, h * 0.62);

  // ── "KOREAN COURSE" eyebrow label ──
  const eyeSize = Math.round(28 * s);
  ctx.font = `bold ${eyeSize}px 'Arial', sans-serif`;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.letterSpacing = `${4 * s}px`;
  ctx.fillText("KOREAN COURSE", 48 * s, 72 * s);
  ctx.letterSpacing = "0px";

  // thin rule under eyebrow
  ctx.fillStyle = "#111111";
  ctx.fillRect(48 * s, 82 * s, 220 * s, 3 * s);

  // ── Main title — huge black ──
  const mainSize = Math.round(114 * s);
  ctx.font = `900 ${mainSize}px 'Arial Black', 'Impact', sans-serif`;
  ctx.fillStyle = "#000000";
  ctx.textAlign = "left";
  wrapText(ctx, mainText, 48 * s, h * 0.31, w * 0.58, mainSize * 1.12);

  // ── Schedule info lines ──
  const lines = subtitle.split("\n");
  const schedSize = Math.round(46 * s);
  ctx.font = `bold ${schedSize}px 'Arial', sans-serif`;
  ctx.fillStyle = "#111111";
  let lineY = h * 0.56;
  for (const line of lines) {
    // urgency line gets yellow highlight pill
    if (line.startsWith("🔴") || line.startsWith("⚡")) {
      ctx.save();
      ctx.fillStyle = "#111111";
      const pillW = ctx.measureText(line).width + 32 * s;
      const pillH = schedSize * 1.4;
      drawRoundedRect(ctx, 48 * s, lineY - schedSize * 0.85, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = "#FFFF00";
      ctx.fillText(line, 64 * s, lineY);
      ctx.restore();
    } else {
      ctx.fillText(line, 48 * s, lineY);
    }
    lineY += schedSize * 1.45;
  }

  // ── "Register Now →" CTA pill (on black diagonal) ──
  const ctaSize = Math.round(36 * s);
  ctx.font = `bold ${ctaSize}px 'Arial Black', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  const ctaText = "Register Now →";
  const ctaW = ctx.measureText(ctaText).width + 48 * s;
  const ctaH = ctaSize * 1.8;
  const ctaX = w * 0.55;
  const ctaY = h * 0.78;
  drawRoundedRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.fillStyle = "#111111";
  ctx.fillText(ctaText, ctaX + 24 * s, ctaY + ctaH * 0.65);

  // ── Limited seats burst (top-right) when urgent ──
  if (isUrgent) {
    ctx.save();
    ctx.translate(w * 0.88, h * 0.13);
    // draw 8-point star
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    const spikes = 8, outerR = 68 * s, innerR = 44 * s;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      i === 0 ? ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
               : ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#FFFF00";
    ctx.textAlign = "center";
    ctx.font = `bold ${Math.round(22 * s)}px 'Arial', sans-serif`;
    ctx.fillText("LIMITED", 0, -10 * s);
    ctx.fillText("SEATS", 0, 16 * s);
    ctx.restore();
  }

  // ── Bottom brand strip ──
  const stripH = 90 * s;
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, h - stripH, w, stripH);

  const tagSize = Math.round(28 * s);
  ctx.font = `bold ${tagSize}px 'Arial', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "left";
  ctx.fillText(extra, 48 * s, h - stripH / 2 + tagSize * 0.35);

  ctx.font = `900 ${Math.round(34 * s)}px 'Arial Black', 'Impact', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "right";
  ctx.fillText("KLOVERS", w - 36 * s, h - stripH / 2 + tagSize * 0.5);
  ctx.textAlign = "left";
}

const CANVAS_SIZES: Record<"1x1" | "4x5" | "story", [number, number]> = {
  "1x1": [1080, 1080],
  "4x5": [1080, 1350],
  "story": [1080, 1920],
};

function renderGroupToDataUrl(group: { level: string; day_name: string; start_time: string; duration_min: number; seats_left: number }, size: "1x1" | "4x5" | "story"): string {
  const [w, h] = CANVAS_SIZES[size];
  const canvas = document.createElement("canvas");
  const levelLabel = getLevelLabel(group.level);
  const mainText = levelLabel;
  const isUrgent = group.seats_left <= 5;
  const urgencyLine = group.seats_left <= 3 ? `\n🔴 Only ${group.seats_left} seats left!` : group.seats_left <= 6 ? `\n⚡ ${group.seats_left} seats available` : "";
  const subtitle = `${group.day_name} • ${group.start_time}\n${group.duration_min} min / session${urgencyLine}`;
  const extra = "#LearnKorean  #Klovers  #KoreanCourse";
  renderBrandPost(canvas, mainText, subtitle, extra, w, h, isUrgent);
  return canvas.toDataURL("image/png");
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  type GroupData,
  generateCaptions,
  generateAdCopy,
  getLevelLabel,
  getUrgencyLabel,
} from "@/lib/marketingEngine";
import MarketingPostsArchive from "@/components/admin/MarketingPostsArchive";
import CreatorHub from "@/components/admin/CreatorHub";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface GeneratedImages {
  "1x1"?: string;
  "4x5"?: string;
  story?: string;
}

export default function MarketingGeneratorPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedContent, setGeneratedContent] = useState<Record<string, { captions: string[]; adCopy: ReturnType<typeof generateAdCopy> }>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, Set<string>>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImages>>({});
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, label: "" });

  // ── Calendar state (uses scheduled_social_posts — no migration needed) ──
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const [scheduledPosts, setScheduledPosts] = useState<Array<{
    id: string; course_title: string; caption: string; scheduled_at: string; status: string;
  }>>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("April 1 Course Launch");
  const [campaignStart, setCampaignStart] = useState("2026-03-17");
  const [campaignEnd, setCampaignEnd] = useState("2026-04-01");
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [distributing, setDistributing] = useState(false);

  const fetchScheduledPosts = useCallback(async () => {
    setCalLoading(true);
    const { data } = await supabase
      .from("scheduled_social_posts")
      .select("id, course_title, caption, scheduled_at, status")
      .order("scheduled_at", { ascending: true });
    setScheduledPosts(data || []);
    setCalLoading(false);
  }, []);

  const unschedulePost = async (postId: string) => {
    await supabase.from("scheduled_social_posts").delete().eq("id", postId);
    await fetchScheduledPosts();
    toast({ title: "Post removed from calendar" });
  };

  const autoDistributeCampaign = async () => {
    if (!campaignName || !campaignStart || !campaignEnd || !groups.length) {
      toast({ title: "Missing info", description: "Make sure groups are loaded and all fields are filled." });
      return;
    }
    setDistributing(true);

    // Build date+time slots (post 1 at 10:00, post 2 at 18:00 Cairo time)
    const times = ["08:00:00", "16:00:00", "12:00:00", "20:00:00", "06:00:00"];
    const slots: string[] = [];
    const cur = new Date(campaignStart);
    const end = new Date(campaignEnd);
    while (cur <= end) {
      const dateStr = cur.toISOString().split("T")[0];
      for (let o = 0; o < postsPerDay; o++) slots.push(`${dateStr}T${times[o] || "10:00:00"}+02:00`);
      cur.setDate(cur.getDate() + 1);
    }

    // Get current user UUID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Not logged in", variant: "destructive" }); setDistributing(false); return; }

    // Delete old campaign posts for this campaign name first
    await supabase.from("scheduled_social_posts").delete().eq("course_title", campaignName);

    // Generate and insert posts into slots
    const toInsert = slots.map((scheduled_at, i) => {
      const g = groups[i % groups.length];
      const captions = generateCaptions(g);
      return {
        scheduled_at,
        course_title: campaignName,
        caption: captions[i % captions.length] || captions[0],
        group_id: g.id,
        platforms: ["instagram", "facebook"],
        status: "pending",
        created_by: user.id,
        registration_url: "https://kloversegy.com/enroll",
      };
    });

    const { error } = await supabase.from("scheduled_social_posts").insert(toInsert);
    if (error) {
      toast({ title: "Error scheduling", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `✅ Scheduled ${toInsert.length} posts`, description: `${campaignName} — ${slots.length / postsPerDay} days, ${postsPerDay}/day` });
    }
    await fetchScheduledPosts();
    setDistributing(false);
  };

  const exportICS = () => {
    if (!scheduledPosts.length) return;
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Klovers//Marketing Calendar//EN",
      "CALSCALE:GREGORIAN",
      "X-WR-CALNAME:Klovers Marketing",
      "X-WR-TIMEZONE:Africa/Cairo",
    ];
    for (const p of scheduledPosts) {
      const d = p.scheduled_at.split("T")[0].replace(/-/g, "");
      const uid = `klovers-post-${p.id}@kloversegy.com`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${d}`,
        `DTEND;VALUE=DATE:${d}`,
        `SUMMARY:📱 ${p.course_title || p.caption.slice(0, 60)}`,
        `DESCRIPTION:${(p.caption || "").replace(/\n/g, "\\n").slice(0, 200)}`,
        `CATEGORIES:${p.course_title || "Marketing"}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "klovers-marketing.ics"; a.click();
    URL.revokeObjectURL(url);
  };

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pkgGroups, error: gErr } = await supabase
        .from("pkg_groups")
        .select("id, name, capacity, package_id, is_active")
        .eq("is_active", true);

      if (gErr) throw gErr;
      if (!pkgGroups?.length) { setGroups([]); setLoading(false); return; }

      const packageIds = [...new Set(pkgGroups.map(g => g.package_id))];
      const { data: packages } = await supabase
        .from("schedule_packages")
        .select("id, level, day_of_week, start_time, duration_min, capacity, is_active")
        .in("id", packageIds)
        .eq("is_active", true);

      const pkgMap = new Map((packages || []).map(p => [p.id, p]));

      const { data: members } = await supabase
        .from("pkg_group_members")
        .select("group_id, user_id, member_status")
        .eq("member_status", "active");

      const memberCounts = new Map<string, number>();
      (members || []).forEach(m => {
        memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1);
      });

      const result: GroupData[] = [];
      for (const g of pkgGroups) {
        const pkg = pkgMap.get(g.package_id);
        if (!pkg) continue;

        const activeMembers = memberCounts.get(g.id) || 0;
        const seatsLeft = g.capacity - activeMembers;
        if (seatsLeft <= 0) continue;

        result.push({
          id: g.id,
          name: g.name,
          level: pkg.level,
          day_name: DAY_NAMES[pkg.day_of_week] || "Unknown",
          start_time: formatTime(pkg.start_time),
          duration_min: pkg.duration_min,
          capacity: g.capacity,
          active_members: activeMembers,
          seats_left: seatsLeft,
          urgency_label: getUrgencyLabel(seatsLeft),
          package_id: g.package_id,
        });
      }

      result.sort((a, b) => a.seats_left - b.seats_left);
      setGroups(result.slice(0, 10));
    } catch (err: any) {
      toast({ title: "Error loading groups", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); fetchScheduledPosts(); }, [fetchGroups, fetchScheduledPosts]);

  function formatTime(timeStr: string): string {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function handleGenerate(group: GroupData) {
    const captions = generateCaptions(group);
    const adCopy = generateAdCopy(group);
    setGeneratedContent(prev => ({ ...prev, [group.id]: { captions, adCopy } }));

    supabase.from("marketing_posts").insert({
      group_id: group.id,
      headline: adCopy.headlines[0] || getLevelLabel(group.level),
      caption_text: captions.join("\n\n---\n\n"),
      ad_primary_text: adCopy.primaryTexts.join("\n\n"),
      description: adCopy.descriptions.join("\n"),
      status: "draft",
    }).then(({ error }) => {
      if (error) console.error("Failed to save post:", error.message);
    });

    return { captions, adCopy };
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  }

  function handleCanvasRender(group: GroupData, size: "1x1" | "4x5" | "story") {
    const dataUrl = renderGroupToDataUrl(group, size);
    setGeneratedImages(prev => ({
      ...prev,
      [group.id]: { ...(prev[group.id] || {}), [size]: dataUrl },
    }));
  }

  function handleBulkCanvasRender() {
    groups.forEach(group => {
      handleGenerate(group);
      const dataUrl = renderGroupToDataUrl(group, "1x1");
      setGeneratedImages(prev => ({
        ...prev,
        [group.id]: { ...(prev[group.id] || {}), "1x1": dataUrl },
      }));
    });
    toast({ title: "Done!", description: `${groups.length} brand-yellow images rendered instantly.` });
  }

  async function handleGenerateImage(group: GroupData, size: "1x1" | "4x5" | "story") {
    setGeneratingImages(prev => {
      const s = new Set(prev[group.id] || []);
      s.add(size);
      return { ...prev, [group.id]: s };
    });

    try {
      const { data, error } = await supabase.functions.invoke("generate-marketing-image", {
        body: {
          level: getLevelLabel(group.level),
          day_name: group.day_name,
          start_time: group.start_time,
          duration_min: group.duration_min,
          seats_left: group.seats_left,
          urgency_label: group.urgency_label,
          size,
          group_id: group.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedImages(prev => ({
        ...prev,
        [group.id]: { ...(prev[group.id] || {}), [size]: data.image_url },
      }));

      const imageField = size === "1x1" ? "image_url_1x1" : size === "4x5" ? "image_url_4x5" : "image_url_story";
      supabase.from("marketing_posts")
        .update({ [imageField]: data.image_url })
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ error }) => {
          if (error) console.error("Failed to update post image:", error.message);
        });

      return data.image_url;
    } catch (err: any) {
      toast({ title: "Image error", description: err.message, variant: "destructive" });
      return null;
    } finally {
      setGeneratingImages(prev => {
        const s = new Set(prev[group.id] || []);
        s.delete(size);
        return { ...prev, [group.id]: s };
      });
    }
  }

  async function handleBulkGenerate() {
    if (groups.length === 0) return;
    setBulkGenerating(true);
    const total = groups.length * 2; // content + 1x1 image per group
    let current = 0;

    try {
      for (const group of groups) {
        // Step 1: Generate text content
        setBulkProgress({ current: ++current, total, label: `Text: ${getLevelLabel(group.level)}` });
        handleGenerate(group);

        // Step 2: Generate 1x1 image
        setBulkProgress({ current: ++current, total, label: `Image: ${getLevelLabel(group.level)}` });
        await handleGenerateImage(group, "1x1");
      }

      toast({ title: "Bulk generation complete!", description: `${groups.length} groups processed with text + images.` });
    } catch (err: any) {
      toast({ title: "Bulk generation error", description: err.message, variant: "destructive" });
    } finally {
      setBulkGenerating(false);
      setBulkProgress({ current: 0, total: 0, label: "" });
    }
  }

  function downloadImage(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  }

  function downloadAllImages() {
    let count = 0;
    groups.forEach(g => {
      const imgs = generatedImages[g.id];
      if (!imgs) return;
      const slug = getLevelLabel(g.level).replace(/\s+/g, "-").toLowerCase();
      (["1x1", "4x5", "story"] as const).forEach(size => {
        if (imgs[size]) {
          setTimeout(() => downloadImage(imgs[size]!, `${slug}-${size}.png`), count * 300);
          count++;
        }
      });
    });
    if (count) toast({ title: "Downloading!", description: `${count} images` });
  }

  function copyAllCaptions() {
    const allText = groups
      .filter(g => generatedContent[g.id])
      .map(g => {
        const c = generatedContent[g.id];
        return `── ${getLevelLabel(g.level)} ──\n${c.captions[0]}`;
      })
      .join("\n\n═══════════\n\n");
    if (allText) copyToClipboard(allText, "All captions");
  }

  const isGenerating = (groupId: string) => (generatingImages[groupId]?.size || 0) > 0;
  const isSizeGenerating = (groupId: string, size: string) => generatingImages[groupId]?.has(size) || false;

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const hasContent = (id: string) => !!generatedContent[id];
  const hasImages = (id: string) => Object.keys(generatedImages[id] || {}).length > 0;

  // Collect all generated 1x1 images for grid preview
  const gridImages = groups
    .map(g => ({
      url: generatedImages[g.id]?.["1x1"],
      storyUrl: generatedImages[g.id]?.["story"],
      fbUrl: generatedImages[g.id]?.["4x5"] || generatedImages[g.id]?.["1x1"],
      label: getLevelLabel(g.level),
    }))
    .filter(img => img.url || img.storyUrl || img.fbUrl);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Marketing Generator</h1>
                <p className="text-xs text-muted-foreground">Auto-generate social posts, ad copy & AI images</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                  <p>Use "Generate All" for one-click bulk content + images. Expand cards for details. Grid preview shows how posts look side by side.</p>
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={fetchGroups}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="generator"><Sparkles className="h-4 w-4 mr-1.5" /> Auto Generator</TabsTrigger>
              <TabsTrigger value="creator"><Palette className="h-4 w-4 mr-1.5" /> Creator Hub</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1.5" /> Campaign Calendar</TabsTrigger>
              <TabsTrigger value="archive">📁 Archive</TabsTrigger>
            </TabsList>

            <TabsContent value="generator" className="space-y-6">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton key={i} className="h-48 rounded-2xl" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <Card className="rounded-2xl">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No groups with available seats found.
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Bulk Actions Bar */}
                  <Card className="rounded-2xl border-primary/30 bg-foreground">
                    <CardContent className="py-4 px-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary">{groups.length} groups with open seats</p>
                          <p className="text-xs text-background/60">Use "Brand Render" for instant exact-yellow images. "AI Generate" uses credits.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleBulkCanvasRender} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Brush className="h-4 w-4 mr-2" /> Brand Render All ⚡
                          </Button>
                          <Button variant="outline" onClick={handleBulkGenerate} disabled={bulkGenerating} className="border-background/20 text-background hover:bg-background/10">
                            {bulkGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {bulkProgress.label} ({bulkProgress.current}/{bulkProgress.total})
                              </>
                            ) : (
                              <><Zap className="h-4 w-4 mr-2" /> AI Generate All</>
                            )}
                          </Button>
                          {gridImages.length > 0 && (
                            <>
                              <Button variant="outline" size="sm" onClick={copyAllCaptions} className="border-background/20 text-background hover:bg-background/10">
                                <Copy className="h-4 w-4 mr-1" /> Copy All Captions
                              </Button>
                              <Button variant="outline" size="sm" onClick={downloadAllImages} className="border-background/20 text-background hover:bg-background/10">
                                <DownloadCloud className="h-4 w-4 mr-1" /> Download All
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {bulkGenerating && (
                        <div className="mt-3">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Group Cards */}
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map(group => {
                      const groupImages = generatedImages[group.id] || {};
                      const content = generatedContent[group.id];
                      const isExpanded = expandedCards.has(group.id);
                      const done = hasContent(group.id) && hasImages(group.id);

                      return (
                        <Card key={group.id} className={`rounded-2xl transition-all ${done ? "border-primary/30" : ""}`}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {done && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                <div>
                                  <CardTitle className="text-sm">{getLevelLabel(group.level)}</CardTitle>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {group.day_name} • {group.start_time} • {group.duration_min}min
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={`text-[10px] border ${group.urgency_label === "Last Seats" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/20 text-foreground border-border"}`}
                              >
                                {group.seats_left} left
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-0">
                            {/* Quick action row */}
                            <div className="flex flex-wrap gap-1.5">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleGenerate(group)}>
                                <Sparkles className="h-3 w-3 mr-1" /> Text
                              </Button>
                              {/* Brand canvas render buttons (exact yellow, instant) */}
                              {(["1x1", "4x5", "story"] as const).map(size => (
                                <Button key={`canvas-${size}`} size="sm"
                                  className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                                  onClick={() => { handleGenerate(group); handleCanvasRender(group, size); }}
                                >
                                  <Brush className="h-3 w-3 mr-1" />{size}
                                </Button>
                              ))}
                              {/* AI image buttons */}
                              {(["1x1", "4x5", "story"] as const).map(size => (
                                <Button key={`ai-${size}`} size="sm" variant="ghost" className="h-7 text-xs opacity-60"
                                  onClick={() => handleGenerateImage(group, size)}
                                  disabled={isSizeGenerating(group.id, size)}
                                  title="AI generate (uses credits)"
                                >
                                  {isSizeGenerating(group.id, size) ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Image className="h-3 w-3 mr-1" />
                                  )}
                                  AI {size}
                                </Button>
                              ))}
                            </div>

                            {/* Image thumbnails row */}
                            {Object.keys(groupImages).length > 0 && (
                              <div className="flex gap-2 py-1">
                                {(["1x1", "4x5", "story"] as const).map(size => {
                                  const url = groupImages[size];
                                  if (!url) return null;
                                  const aspectClass = size === "1x1" ? "aspect-square" : size === "4x5" ? "aspect-[4/5]" : "aspect-[9/16]";
                                  return (
                                    <div key={size} className="shrink-0">
                                      <div className={`${aspectClass} w-16 rounded-lg overflow-hidden border shadow-sm bg-muted cursor-pointer`}
                                        onClick={() => downloadImage(url, `${getLevelLabel(group.level).replace(/\s+/g, "-")}-${size}.png`)}
                                      >
                                        <img src={url} alt={`${size}`} className="w-full h-full object-cover" />
                                      </div>
                                      <span className="text-[9px] text-muted-foreground block text-center mt-0.5">{size}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Expandable content */}
                            {content && (
                              <Collapsible open={isExpanded} onOpenChange={() => toggleCard(group.id)}>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs justify-between">
                                    <span>View captions & ad copy</span>
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-3 pt-2">
                                  <Tabs defaultValue="captions">
                                    <TabsList className="h-auto bg-transparent p-0 gap-1.5">
                                      <TabsTrigger value="captions" className="rounded-full px-2.5 py-1 text-[10px] border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Captions</TabsTrigger>
                                      <TabsTrigger value="ads" className="rounded-full px-2.5 py-1 text-[10px] border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ad Copy</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="captions" className="space-y-2 mt-2">
                                      {content.captions.map((cap, i) => (
                                        <div key={i} className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-muted-foreground">Variation {i + 1}</span>
                                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => copyToClipboard(cap, `Caption ${i + 1}`)}>
                                              <Copy className="h-3 w-3 mr-1" /> Copy
                                            </Button>
                                          </div>
                                          <Textarea value={cap} readOnly className="text-xs min-h-[80px] resize-none" />
                                        </div>
                                      ))}
                                    </TabsContent>

                                    <TabsContent value="ads" className="space-y-2 mt-2">
                                      <div className="space-y-1.5">
                                        <h4 className="text-xs font-medium text-foreground">Primary Text</h4>
                                        {content.adCopy.primaryTexts.map((t, i) => (
                                          <div key={i} className="flex items-start gap-1.5">
                                            <Textarea value={t} readOnly className="text-xs min-h-[50px] resize-none flex-1" />
                                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => copyToClipboard(t, `Primary ${i + 1}`)}>
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="space-y-1.5">
                                        <h4 className="text-xs font-medium text-foreground">Headlines</h4>
                                        {content.adCopy.headlines.map((h, i) => (
                                          <div key={i} className="flex items-center gap-1.5">
                                            <code className="flex-1 bg-muted px-2 py-1.5 rounded text-xs text-foreground">{h}</code>
                                            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => copyToClipboard(h, `Headline ${i + 1}`)}>
                                              <Copy className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                        const allText = `PRIMARY TEXT:\n${content.adCopy.primaryTexts.join("\n\n")}\n\nHEADLINES:\n${content.adCopy.headlines.join("\n")}\n\nDESCRIPTIONS:\n${content.adCopy.descriptions.join("\n")}\n\nCTA: ${content.adCopy.cta}`;
                                        copyToClipboard(allText, "All ad copy");
                                      }}>
                                        <Copy className="h-3 w-3 mr-1" /> Copy All
                                      </Button>
                                    </TabsContent>
                                  </Tabs>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Platform Grid Preview */}
                  {gridImages.length > 0 && (
                    <div>
                      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" /> Grid Preview — How Your Posts Look Together
                        <Badge variant="outline" className="text-[10px]">{gridImages.length} images</Badge>
                      </h2>
                      <Tabs defaultValue="instagram" className="w-full">
                        <TabsList className="w-full justify-start">
                          <TabsTrigger value="instagram" className="text-xs gap-1.5">
                            <Grid3X3 className="h-3.5 w-3.5" /> Instagram
                          </TabsTrigger>
                          <TabsTrigger value="facebook" className="text-xs gap-1.5">
                            <Monitor className="h-3.5 w-3.5" /> Facebook
                          </TabsTrigger>
                          <TabsTrigger value="stories" className="text-xs gap-1.5">
                            <Smartphone className="h-3.5 w-3.5" /> Stories
                          </TabsTrigger>
                        </TabsList>

                        {/* Instagram 3x3 Grid */}
                        <TabsContent value="instagram">
                          <Card className="rounded-2xl">
                            <CardContent className="p-4">
                              <div className="bg-card border rounded-t-xl p-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
                                <div>
                                  <p className="text-xs font-bold text-foreground">klovers_academy</p>
                                  <p className="text-[10px] text-muted-foreground">{gridImages.filter(i => i.url).length} posts • 1.2K followers</p>
                                </div>
                              </div>
                              <div
                                className="grid gap-0.5 rounded-b-xl overflow-hidden border border-t-0 bg-border mx-auto"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.min(3, gridImages.filter(i => i.url).length)}, 1fr)`,
                                  maxWidth: Math.min(3, gridImages.filter(i => i.url).length) * 160,
                                }}
                              >
                                {gridImages.filter(i => i.url).slice(0, 9).map((img, i) => (
                                  <div key={i} className="aspect-square bg-muted overflow-hidden">
                                    <img src={img.url!} alt={img.label} className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1080 — How your grid looks on Instagram</p>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Facebook Timeline */}
                        <TabsContent value="facebook">
                          <Card className="rounded-2xl">
                            <CardContent className="p-4">
                              <div className="space-y-3 max-w-md mx-auto">
                                {gridImages.filter(i => i.fbUrl).slice(0, 4).map((img, i) => (
                                  <div key={i} className="bg-card border rounded-xl overflow-hidden">
                                    <div className="flex items-center gap-2 p-2.5">
                                      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">K</div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-foreground">KLovers Academy</p>
                                        <p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-foreground px-2.5 pb-1">{img.label}</p>
                                    <div className="aspect-[1200/630] bg-muted overflow-hidden">
                                      <img src={img.fbUrl!} alt={img.label} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex items-center justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground">
                                      <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center mt-2">Facebook timeline preview</p>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        {/* Stories Tray */}
                        <TabsContent value="stories">
                          <Card className="rounded-2xl">
                            <CardContent className="p-4">
                              <div className="flex gap-3 overflow-x-auto pb-2">
                                {gridImages.filter(i => i.storyUrl || i.url).slice(0, 6).map((img, i) => (
                                  <div key={i} className="shrink-0 space-y-1">
                                    <div className="w-20 rounded-xl overflow-hidden border-2 border-primary shadow-md">
                                      <div className="aspect-[9/16] bg-muted overflow-hidden">
                                        <img src={img.storyUrl || img.url!} alt={img.label} className="w-full h-full object-cover" />
                                      </div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground text-center truncate w-20">{img.label}</p>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[10px] text-muted-foreground text-center mt-2">Swipeable story sequence</p>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="creator">
              <CreatorHub />
            </TabsContent>

            {/* ── Campaign Calendar ── */}
            <TabsContent value="calendar" className="space-y-6">
              {/* Campaign auto-distributor */}
              <Card className="rounded-2xl border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /> Auto-Schedule Campaign
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Campaign Name</label>
                      <input
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={campaignName}
                        onChange={e => setCampaignName(e.target.value)}
                        placeholder="April 1 Course Launch"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Start Date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={campaignStart}
                        onChange={e => setCampaignStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">End Date</label>
                      <input
                        type="date"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={campaignEnd}
                        onChange={e => setCampaignEnd(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Posts per Day</label>
                      <input
                        type="number"
                        min={1} max={5}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={postsPerDay}
                        onChange={e => setPostsPerDay(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={autoDistributeCampaign} disabled={distributing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {distributing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      {distributing ? "Scheduling…" : "Auto-Distribute Posts"}
                    </Button>
                    <Button variant="outline" onClick={exportICS} disabled={!scheduledPosts.length}>
                      <FileDown className="h-4 w-4 mr-2" /> Export to Google Calendar (.ics)
                    </Button>
                    <Button variant="ghost" size="sm" onClick={fetchScheduledPosts} disabled={calLoading}>
                      <RefreshCw className={`h-4 w-4 ${calLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-Distribute takes your <strong>draft posts</strong> (from Creator Hub) and spreads them evenly across the date range.
                    Export .ics then open it in Google Calendar — all posts appear as all-day events.
                  </p>
                </CardContent>
              </Card>

              {/* Monthly calendar grid */}
              {(() => {
                const year = calendarMonth.getFullYear();
                const month = calendarMonth.getMonth();
                const monthName = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
                const firstDay = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date().toISOString().split("T")[0];

                // Map scheduled posts by date (scheduled_at is ISO timestamp)
                const byDate = new Map<string, typeof scheduledPosts>();
                for (const p of scheduledPosts) {
                  const key = p.scheduled_at.split("T")[0];
                  if (!byDate.has(key)) byDate.set(key, []);
                  byDate.get(key)!.push(p);
                }

                const cells: (number | null)[] = [
                  ...Array(firstDay).fill(null),
                  ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                ];
                // pad to full weeks
                while (cells.length % 7 !== 0) cells.push(null);

                return (
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{monthName}</CardTitle>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d; })}>
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(m => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d; })}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {calLoading ? (
                        <div className="grid grid-cols-7 gap-1">
                          {Array(35).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                        </div>
                      ) : (
                        <>
                          {/* Day headers */}
                          <div className="grid grid-cols-7 gap-1 mb-1">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                              <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
                            ))}
                          </div>
                          {/* Calendar cells */}
                          <div className="grid grid-cols-7 gap-1">
                            {cells.map((day, idx) => {
                              if (!day) return <div key={`empty-${idx}`} className="h-20 rounded-lg bg-muted/20" />;
                              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              const posts = byDate.get(dateStr) || [];
                              const isToday = dateStr === today;
                              const isCampaignDay = dateStr >= campaignStart && dateStr <= campaignEnd;
                              return (
                                <div
                                  key={dateStr}
                                  className={`h-20 rounded-lg p-1 border transition-colors ${
                                    isToday ? "border-primary bg-primary/5"
                                    : isCampaignDay ? "border-primary/20 bg-primary/5"
                                    : "border-border bg-card"
                                  }`}
                                >
                                  <div className={`text-[11px] font-bold mb-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{day}</div>
                                  <div className="space-y-0.5 overflow-hidden">
                                    {posts.slice(0, 2).map(p => (
                                      <div key={p.id} className="flex items-center gap-1 group">
                                        <span className="flex-1 text-[9px] leading-tight text-foreground bg-primary/20 rounded px-1 py-0.5 truncate">
                                          {p.course_title || p.caption.slice(0, 25)}
                                        </span>
                                        <button
                                          onClick={() => unschedulePost(p.id)}
                                          className="hidden group-hover:flex h-3 w-3 items-center justify-center text-destructive"
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    ))}
                                    {posts.length > 2 && (
                                      <div className="text-[9px] text-muted-foreground pl-1">+{posts.length - 2} more</div>
                                    )}
                                    {posts.length === 0 && isCampaignDay && (
                                      <div className="text-[9px] text-primary/50 pl-1">— open slot</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 mt-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/5 border border-primary inline-block" /> Today</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/5 border border-primary/20 inline-block" /> Campaign days</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-primary/20 inline-block" /> Scheduled post</span>
                        <span className="ml-auto font-medium text-foreground">{scheduledPosts.length} posts scheduled total</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Scheduled posts list */}
              {scheduledPosts.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Scheduled Posts ({scheduledPosts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {scheduledPosts.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <div className="w-24 text-xs font-mono text-muted-foreground shrink-0">{p.scheduled_at.split("T")[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.course_title || p.caption.slice(0, 60)}</p>
                            <p className="text-[10px] text-muted-foreground">{p.scheduled_at.split("T")[1]?.slice(0, 5)} Cairo</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {p.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => unschedulePost(p.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="archive">
              <MarketingPostsArchive />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
