import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft, Copy, Sparkles, Image, Info, RefreshCw, Loader2, Palette,
  Grid3X3, Monitor, Smartphone, Zap, CheckCircle2, ChevronDown, ChevronUp, DownloadCloud, Brush,
  CalendarDays, ChevronLeft, ChevronRight, Plus, Wand2, FileDown, Trash2, CalendarPlus,
  MessageCircle, CalendarClock,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  type GroupData,
  generateCaptions,
  generateAdCopy,
  generateWhatsAppMessage,
  generateStoryScript,
  getLevelLabel,
  getUrgencyLabel,
  generateMonthlyPlan,
  monthlyPostToPostData,
  type MonthlyPostType,
} from "@/lib/marketingEngine";
import { renderPost, type PostData, type TemplateName, type ColorTheme } from "@/lib/canvasRenderer";
import {
  type SlotPostDraft,
  getTeacherAvailability,
  getAvailableClassSlots,
  generatePostsFromAvailableSlots,
  saveGeneratedDrafts,
  formatTime12,
} from "@/lib/scheduleSlotEngine";
import MarketingPostsArchive from "@/components/admin/MarketingPostsArchive";
import CreatorHub from "@/components/admin/CreatorHub";

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
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface GeneratedImages {
  "1x1"?: string;
  "4x5"?: string;
  story?: string;
}

function toGCalUrl(post: { scheduled_at: string; course_title: string | null; caption: string | null }) {
  const start = new Date(post.scheduled_at);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(post.course_title || "Marketing Post")}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent((post.caption || "").slice(0, 500))}&sf=true&output=xml`;
}

// ─── Monthly Draft Types & Design Config ───────────────────────────────────

interface MonthlyDraftPost {
  id: string;
  day: number;
  postType: MonthlyPostType;
  caption: string;
  mainText: string;
  subtitle: string;
  extraText: string;
  approved: boolean;
  scheduledDate: string;
}

const DESIGN_CONFIG: Record<1 | 2 | 3, { template: TemplateName; theme: ColorTheme; name: string; desc: string }> = {
  1: { template: "klovers_bold",    theme: "yellow",   name: "Bold",  desc: "Attention — Yellow/Black" },
  2: { template: "klovers_varsity", theme: "midnight", name: "Dark",  desc: "Interest — Dark/Gold" },
  3: { template: "klovers_split",   theme: "yellow",   name: "Split", desc: "Action — Split Yellow/Black" },
};

const PostPreview = memo(function PostPreview({
  post, template, theme, size = 270,
}: { post: PostData; template: TemplateName; theme: ColorTheme; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 1080; canvas.height = 1080;
    renderPost(canvas, post, template, theme, "instagram");
  }, [post.mainText, post.subtitle, post.extraText, template, theme]);
  return <canvas ref={ref} style={{ width: size, height: size, display: "block" }} className="rounded-lg" />;
});

const DesignThumb = memo(function DesignThumb({ template, theme }: { template: TemplateName; theme: ColorTheme }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = 1080; canvas.height = 1080;
    renderPost(canvas, { id: "thumb", mainText: "Korean Class", subtitle: "Monday 6:00 PM", extraText: "#LearnKorean" }, template, theme, "instagram");
  }, [template, theme]);
  return <canvas ref={ref} style={{ width: 80, height: 80, display: "block" }} className="rounded-md" />;
});

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
    id: string; course_title: string | null; caption: string | null; scheduled_at: string; status: string | null;
  }>>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [campaignName, setCampaignName] = useState("April 1 Course Launch");
  const [campaignStart, setCampaignStart] = useState("2026-03-17");
  const [campaignEnd, setCampaignEnd] = useState("2026-04-01");
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [distributing, setDistributing] = useState(false);

  // Edit post dialog
  const [editingPost, setEditingPost] = useState<{
    id: string; course_title: string | null; caption: string | null; status: string | null; scheduled_at: string;
  } | null>(null);

  // Add post manually
  const [addingPostDate, setAddingPostDate] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ course_title: "", caption: "", time: "10:00" });

  // Campaign filter
  const [campaignFilter, setCampaignFilter] = useState("all");

  // ── Slot-based Auto Generator state ──
  const [slotDrafts, setSlotDrafts] = useState<SlotPostDraft[]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [slotsFound, setSlotsFound] = useState<number | null>(null);
  const [hasTeacherAvailability, setHasTeacherAvailability] = useState<boolean | null>(null);
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [draftCampaignName, setDraftCampaignName] = useState(`Class Openings — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`);

  // WhatsApp dialog
  const [whatsappGroup, setWhatsappGroup] = useState<GroupData | null>(null);

  // Reschedule dialog
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleShift, setRescheduleShift] = useState(7);

  // ── Monthly 30-post AIDA draft state ──
  const [selectedDesign, setSelectedDesign] = useState<1 | 2 | 3>(1);
  const [monthlyDrafts, setMonthlyDrafts] = useState<MonthlyDraftPost[]>([]);
  const [editingDraft, setEditingDraft] = useState<MonthlyDraftPost | null>(null);
  const [editDraftText, setEditDraftText] = useState({ mainText: "", subtitle: "", extraText: "" });
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [savingMonthly, setSavingMonthly] = useState(false);

  const fetchScheduledPosts = useCallback(async () => {
    setCalLoading(true);
    // Fetch posts from 60 days ago up to 90 days ahead for calendar display
    const from = new Date(); from.setDate(from.getDate() - 60);
    const to = new Date(); to.setDate(to.getDate() + 90);
    const { data } = await supabase
      .from("scheduled_social_posts")
      .select("id, course_title, caption, scheduled_at, status")
      .gte("scheduled_at", from.toISOString())
      .lte("scheduled_at", to.toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(500);
    setScheduledPosts(data || []);
    setCalLoading(false);
  }, []);

  const campaignNames = useMemo(() =>
    [...new Set(scheduledPosts.map(p => p.course_title).filter(Boolean))] as string[],
    [scheduledPosts]
  );

  const filteredScheduledPosts = useMemo(() =>
    campaignFilter === "all" ? scheduledPosts : scheduledPosts.filter(p => p.course_title === campaignFilter),
    [scheduledPosts, campaignFilter]
  );

  const saveEditedPost = async () => {
    if (!editingPost) return;
    const { error } = await supabase.from("scheduled_social_posts").update({
      caption: editingPost.caption,
      status: editingPost.status,
      course_title: editingPost.course_title,
    }).eq("id", editingPost.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setScheduledPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...editingPost } : p));
    setEditingPost(null);
    toast({ title: "Post updated" });
  };

  const addPostManually = async () => {
    if (!addingPostDate || !newPost.caption) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("scheduled_social_posts").insert({
      scheduled_at: `${addingPostDate}T${newPost.time}:00+02:00`,
      course_title: newPost.course_title || null,
      caption: newPost.caption,
      platforms: ["instagram", "facebook"],
      status: "pending",
      created_by: user.id,
      registration_url: `https://kloversegy.com/enroll?utm_source=social&utm_medium=post&utm_campaign=${encodeURIComponent(newPost.course_title || campaignName)}`,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Post added" });
    setAddingPostDate(null);
    setNewPost({ course_title: "", caption: "", time: "10:00" });
    fetchScheduledPosts();
  };

  const markAsPosted = async (id: string) => {
    const { error } = await supabase.from("scheduled_social_posts").update({ status: "published" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setScheduledPosts(prev => prev.map(p => p.id === id ? { ...p, status: "published" } : p));
    toast({ title: "Marked as posted ✓" });
  };

  const unschedulePost = async (postId: string) => {
    await supabase.from("scheduled_social_posts").delete().eq("id", postId);
    await fetchScheduledPosts();
    toast({ title: "Post removed from calendar" });
  };

  const rescheduleCampaign = async () => {
    const posts = scheduledPosts.filter(p => p.course_title === campaignFilter);
    if (!posts.length) return;
    try {
      await Promise.all(posts.map(p => {
        const d = new Date(p.scheduled_at);
        d.setDate(d.getDate() + rescheduleShift);
        return supabase.from("scheduled_social_posts").update({ scheduled_at: d.toISOString() }).eq("id", p.id);
      }));
      await fetchScheduledPosts();
      setRescheduleOpen(false);
      toast({ title: `Rescheduled ${posts.length} posts by ${rescheduleShift > 0 ? "+" : ""}${rescheduleShift} days` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
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
        registration_url: `https://kloversegy.com/enroll?utm_source=social&utm_medium=post&utm_campaign=${encodeURIComponent(campaignName)}`,
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
        `SUMMARY:📱 ${p.course_title || (p.caption || "").slice(0, 60)}`,
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
      setGroups(result);
    } catch (err: any) {
      toast({ title: "Error loading groups", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSlotDrafts = useCallback(async () => {
    setSlotLoading(true);
    try {
      const availability = await getTeacherAvailability();
      setHasTeacherAvailability(availability.length > 0);
      if (!availability.length) { setSlotsFound(0); setSlotDrafts([]); setSlotLoading(false); return; }
      const openSlots = await getAvailableClassSlots(availability);
      setSlotsFound(openSlots.length);
      const drafts = generatePostsFromAvailableSlots(openSlots);
      setSlotDrafts(drafts);
    } catch (err: any) {
      toast({ title: "Error loading schedule", description: err.message, variant: "destructive" });
    } finally {
      setSlotLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); fetchScheduledPosts(); fetchSlotDrafts(); }, [fetchGroups, fetchScheduledPosts, fetchSlotDrafts]);

  async function handleSaveAllDraftsToCalendar(approved?: boolean) {
    const draftsToSave = approved
      ? slotDrafts.filter(d => d.approved)
      : slotDrafts;
    if (!draftsToSave.length) {
      toast({ title: "Nothing to save", description: approved ? "Approve some drafts first." : "Generate drafts first." });
      return;
    }
    setSavingDrafts(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Not logged in", variant: "destructive" }); setSavingDrafts(false); return; }
    const { saved, errors } = await saveGeneratedDrafts(draftsToSave, draftCampaignName, user.id);
    toast({ title: `${saved} draft${saved !== 1 ? "s" : ""} added to Calendar`, description: errors ? `${errors} failed.` : "Open Campaign Calendar to review." });
    await fetchScheduledPosts();
    setSavingDrafts(false);
  }

  function toggleDraftApproval(id: string) {
    setSlotDrafts(prev => prev.map(d => d.id === id ? { ...d, approved: !d.approved } : d));
  }

  function approveAllDrafts() {
    setSlotDrafts(prev => prev.map(d => ({ ...d, approved: true })));
  }

  // ── Monthly 30-post functions ──

  function generateMonthlyDrafts() {
    if (!groups.length) {
      toast({ title: "No groups loaded", description: "Wait for groups to load first.", variant: "destructive" });
      return;
    }
    const today = new Date();
    const posts = generateMonthlyPlan(groups, 10, "KLOVERS10");
    const drafts: MonthlyDraftPost[] = posts.map((post, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const pd = monthlyPostToPostData(post);
      return {
        ...pd,
        day: post.day,
        postType: post.postType,
        caption: post.caption,
        approved: false,
        scheduledDate: d.toISOString().split("T")[0],
      };
    });
    setMonthlyDrafts(drafts);
    toast({ title: "30 posts generated!", description: "Choose your design and bulk download or save to calendar." });
  }

  async function handleBulkDownload() {
    if (!monthlyDrafts.length) {
      toast({ title: "No posts", description: "Generate 30 posts first." });
      return;
    }
    setBulkDownloading(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const design = DESIGN_CONFIG[selectedDesign];
      for (const post of monthlyDrafts) {
        const canvas = document.createElement("canvas");
        canvas.width = 1080; canvas.height = 1080;
        renderPost(canvas, { id: post.id, mainText: post.mainText, subtitle: post.subtitle, extraText: post.extraText }, design.template, design.theme, "instagram");
        const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), "image/png"));
        zip.file(`day-${String(post.day).padStart(2, "0")}-${post.postType}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klovers-posts-${new Date().toISOString().slice(0, 7)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "ZIP downloaded!", description: `${monthlyDrafts.length} PNG posts in one file.` });
    } catch (err: any) {
      toast({ title: "Download error", description: err.message, variant: "destructive" });
    } finally {
      setBulkDownloading(false);
    }
  }

  function downloadSinglePost(post: MonthlyDraftPost) {
    const design = DESIGN_CONFIG[selectedDesign];
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1080;
    renderPost(canvas, { id: post.id, mainText: post.mainText, subtitle: post.subtitle, extraText: post.extraText }, design.template, design.theme, "instagram");
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `day-${String(post.day).padStart(2, "0")}-${post.postType}.png`;
    a.click();
  }

  async function saveMonthlyDraftsToCalendar() {
    if (!monthlyDrafts.length) return;
    setSavingMonthly(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: "Not logged in", variant: "destructive" }); setSavingMonthly(false); return; }
    const monthLabel = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const toInsert = monthlyDrafts.map(d => ({
      scheduled_at: `${d.scheduledDate}T10:00:00+02:00`,
      course_title: `Monthly Plan — ${monthLabel}`,
      caption: d.caption,
      platforms: ["instagram", "facebook"],
      status: "pending",
      created_by: user.id,
      registration_url: "https://kloversegy.com/enroll",
    }));
    const { error } = await supabase.from("scheduled_social_posts").insert(toInsert);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSavingMonthly(false); return; }
    toast({ title: `${monthlyDrafts.length} posts added to Calendar!`, description: "Open Campaign Calendar to review." });
    await fetchScheduledPosts();
    setSavingMonthly(false);
  }

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
                <h1 className="text-lg font-bold text-foreground">Marketing</h1>
                <p className="text-xs text-muted-foreground">Campaign calendar, post generator & creative studio</p>
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
                  <p>Start with Campaign Calendar to plan your schedule, then use Auto Generator to bulk-create posts, or Creator Hub for custom designs.</p>
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={fetchGroups}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <Tabs defaultValue="creator" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="creator"><Palette className="h-4 w-4 mr-1.5" /> Creator Hub</TabsTrigger>
              <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1.5" /> Campaign Calendar</TabsTrigger>
              <TabsTrigger value="archive">📁 Archive</TabsTrigger>
            </TabsList>

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
                  {campaignName && (
                    <p className="text-[11px] text-muted-foreground bg-muted/60 rounded-lg px-3 py-1.5 font-mono truncate">
                      🔗 {`https://kloversegy.com/enroll?utm_source=social&utm_medium=post&utm_campaign=${encodeURIComponent(campaignName)}`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={autoDistributeCampaign} disabled={distributing} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {distributing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                      {distributing ? "Scheduling…" : "Auto-Distribute Posts"}
                    </Button>
                    <Button variant="outline" onClick={() => { exportICS(); setTimeout(() => window.open("https://calendar.google.com/calendar/r/settings/export", "_blank"), 600); }} disabled={!scheduledPosts.length}>
                      <CalendarPlus className="h-4 w-4 mr-2" /> Export + Open Google Calendar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={exportICS} disabled={!scheduledPosts.length} title="Download .ics only">
                      <FileDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={fetchScheduledPosts} disabled={calLoading}>
                      <RefreshCw className={`h-4 w-4 ${calLoading ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-Distribute generates posts for all active groups and spreads them across the selected date range at 08:00 and 16:00 Cairo time.
                    <strong> Export + Open Google Calendar</strong> downloads the .ics file and opens Google Calendar — make sure you're signed in as <strong>reham.elshrkawy@gmail.com</strong>, then go to Settings → Import & Export → Import to load all posts.
                    Or click the <CalendarPlus className="inline h-3 w-3 mx-0.5" /> icon next to any individual post to add it directly.
                  </p>
                </CardContent>
              </Card>

              {/* Campaign filter bar */}
              {scheduledPosts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Filter by campaign:</span>
                  <select
                    className="rounded-lg border border-border px-2 py-1.5 text-xs bg-background"
                    value={campaignFilter}
                    onChange={e => setCampaignFilter(e.target.value)}
                  >
                    <option value="all">All ({scheduledPosts.length})</option>
                    {campaignNames.map(n => (
                      <option key={n} value={n}>{n} ({scheduledPosts.filter(p => p.course_title === n).length})</option>
                    ))}
                  </select>
                  {campaignFilter !== "all" && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(true)}>
                        <CalendarClock className="h-3.5 w-3.5 mr-1" /> Reschedule
                      </Button>
                      <Button variant="destructive" size="sm" onClick={async () => {
                        await supabase.from("scheduled_social_posts").delete().eq("course_title", campaignFilter);
                        await fetchScheduledPosts();
                        setCampaignFilter("all");
                        toast({ title: `Deleted "${campaignFilter}"` });
                      }}>
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Campaign
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Post status KPI bar */}
              {(() => {
                const monthStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}`;
                const monthPosts = scheduledPosts.filter(p => p.scheduled_at.startsWith(monthStr));
                if (!monthPosts.length) return null;
                const pending = monthPosts.filter(p => p.status === "pending").length;
                const published = monthPosts.filter(p => p.status === "published").length;
                const skipped = monthPosts.filter(p => p.status === "skipped").length;
                return (
                  <div className="flex flex-wrap gap-2">
                    {pending > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <CalendarDays className="h-3.5 w-3.5" /> Pending: {pending}
                      </div>
                    )}
                    {published > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Published: {published}
                      </div>
                    )}
                    {skipped > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                        ❌ Skipped: {skipped}
                      </div>
                    )}
                  </div>
                );
              })()}

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
                for (const p of filteredScheduledPosts) {
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
                                  className={`relative group h-20 rounded-lg p-1 border transition-colors ${
                                    isToday ? "border-primary bg-primary/5"
                                    : isCampaignDay ? "border-primary/20 bg-primary/5"
                                    : "border-border bg-card"
                                  }`}
                                >
                                  <div className={`text-[11px] font-bold mb-0.5 ${isToday ? "text-primary" : "text-foreground"}`}>{day}</div>
                                  <button
                                    className="opacity-0 group-hover:opacity-100 absolute top-0.5 right-0.5 h-4 w-4 flex items-center justify-center rounded bg-primary/20 hover:bg-primary/40 transition-opacity"
                                    onClick={(e) => { e.stopPropagation(); setNewPost({ course_title: campaignName, caption: "", time: "10:00" }); setAddingPostDate(dateStr); }}
                                  >
                                    <Plus className="h-2.5 w-2.5 text-primary" />
                                  </button>
                                  <div className="space-y-0.5 overflow-hidden">
                                    {posts.slice(0, 2).map(p => (
                                      <div key={p.id} className="flex items-center gap-1 group/chip">
                                        <button
                                          className="flex-1 text-[9px] leading-tight text-foreground bg-primary/20 rounded px-1 py-0.5 truncate text-left hover:bg-primary/30 transition-colors"
                                          onClick={() => setEditingPost(p)}
                                        >
                                          {p.course_title || (p.caption || "").slice(0, 25)}
                                        </button>
                                        <button
                                          onClick={() => unschedulePost(p.id)}
                                          className="hidden group-hover/chip:flex h-3 w-3 items-center justify-center text-destructive"
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
                        <span className="ml-auto font-medium text-foreground">{filteredScheduledPosts.length} posts{campaignFilter !== "all" ? ` in "${campaignFilter}"` : " scheduled total"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Scheduled posts list */}
              {filteredScheduledPosts.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Scheduled Posts ({filteredScheduledPosts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filteredScheduledPosts.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                          <div className="w-24 text-xs font-mono text-muted-foreground shrink-0">{p.scheduled_at.split("T")[0]}</div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingPost(p)}>
                            <p className="text-sm font-medium truncate hover:text-primary transition-colors">{p.course_title || (p.caption || "").slice(0, 60)}</p>
                            <p className="text-[10px] text-muted-foreground">{p.scheduled_at.split("T")[1]?.slice(0, 5)} Cairo — click to edit</p>
                          </div>
                          <Badge className={`text-[10px] shrink-0 border ${
                            p.status === "published" ? "bg-green-100 text-green-700 border-green-200" :
                            p.status === "skipped" ? "bg-muted text-muted-foreground border-border" :
                            "bg-amber-100 text-amber-700 border-amber-200"
                          }`}>
                            {p.status}
                          </Badge>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="icon"
                                className={`h-7 w-7 shrink-0 ${p.status === "published" ? "text-green-500" : "text-muted-foreground hover:text-green-500"}`}
                                onClick={() => p.status !== "published" && markAsPosted(p.id)}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{p.status === "published" ? "Posted ✓" : "Mark as posted"}</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => window.open(toGCalUrl(p), "_blank")}>
                                <CalendarPlus className="h-3.5 w-3.5 text-blue-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add to Google Calendar</TooltipContent>
                          </Tooltip>
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
      {/* Edit post dialog */}
      <Dialog open={!!editingPost} onOpenChange={open => { if (!open) setEditingPost(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Scheduled Post</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Campaign / Title</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm mt-1 bg-background"
                value={editingPost?.course_title || ""}
                onChange={e => setEditingPost(p => p ? { ...p, course_title: e.target.value } : p)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Caption</label>
              <Textarea
                className="mt-1 text-sm min-h-[140px]"
                value={editingPost?.caption || ""}
                onChange={e => setEditingPost(p => p ? { ...p, caption: e.target.value } : p)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm mt-1 bg-background"
                value={editingPost?.status || "pending"}
                onChange={e => setEditingPost(p => p ? { ...p, status: e.target.value } : p)}
              >
                <option value="pending">pending</option>
                <option value="published">published</option>
                <option value="skipped">skipped</option>
              </select>
            </div>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(editingPost?.caption || ""); toast({ title: "Copied" }); }}>
              <Copy className="h-3 w-3 mr-1" /> Copy Caption
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingPost(null)}>Cancel</Button>
            <Button onClick={saveEditedPost}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add post manually dialog */}
      <Dialog open={!!addingPostDate} onOpenChange={open => { if (!open) setAddingPostDate(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Post — {addingPostDate}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Campaign / Title</label>
              <input
                className="w-full rounded-lg border border-border px-3 py-2 text-sm mt-1 bg-background"
                value={newPost.course_title}
                onChange={e => setNewPost(p => ({ ...p, course_title: e.target.value }))}
                placeholder={campaignName}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Time (Cairo)</label>
              <input
                type="time"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm mt-1 bg-background"
                value={newPost.time}
                onChange={e => setNewPost(p => ({ ...p, time: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Caption</label>
              <Textarea
                className="mt-1 text-sm min-h-[100px]"
                value={newPost.caption}
                onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
                placeholder="Write your caption here…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAddingPostDate(null)}>Cancel</Button>
            <Button onClick={addPostManually} disabled={!newPost.caption}>Add Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* WhatsApp broadcast dialog */}
      <Dialog open={!!whatsappGroup} onOpenChange={open => { if (!open) setWhatsappGroup(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📱 WhatsApp Broadcast — {whatsappGroup && getLevelLabel(whatsappGroup.level)}</DialogTitle>
          </DialogHeader>
          {whatsappGroup && (
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl px-4 py-3 text-sm whitespace-pre-line border border-green-200 dark:border-green-800 leading-relaxed">
                {generateWhatsAppMessage(whatsappGroup)}
              </div>
              <p className="text-xs text-muted-foreground">Copy and paste into WhatsApp Broadcast, Status, or Stories.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWhatsappGroup(null)}>Close</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => { if (whatsappGroup) copyToClipboard(generateWhatsAppMessage(whatsappGroup), "WhatsApp message"); }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule campaign dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reschedule Campaign</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Shift all posts in <strong>"{campaignFilter}"</strong> by:
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={rescheduleShift}
                onChange={e => setRescheduleShift(Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">days (negative = move earlier)</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button onClick={rescheduleCampaign}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
