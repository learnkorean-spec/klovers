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
  Grid3X3, Monitor, Smartphone, Zap, CheckCircle2, ChevronDown, ChevronUp, DownloadCloud,
} from "lucide-react";
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

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

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
                  <Card className="rounded-2xl border-primary/20 bg-primary/5">
                    <CardContent className="py-4 px-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{groups.length} groups with open seats</p>
                          <p className="text-xs text-muted-foreground">Generates text + 1x1 images only (saves credits). Use buttons per group for 4x5 / Story.s credits). Use buttons per group for 4x5 / Story.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={handleBulkGenerate} disabled={bulkGenerating}>
                            {bulkGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {bulkProgress.label} ({bulkProgress.current}/{bulkProgress.total})
                              </>
                            ) : (
                              <>
                            <Zap className="h-4 w-4 mr-2" /> Generate All (Text + 1x1 Only)
                              </>
                            )}
                          </Button>
                          {gridImages.length > 0 && (
                            <>
                              <Button variant="outline" size="sm" onClick={copyAllCaptions}>
                                <Copy className="h-4 w-4 mr-1" /> Copy All Captions
                              </Button>
                              <Button variant="outline" size="sm" onClick={downloadAllImages}>
                                <DownloadCloud className="h-4 w-4 mr-1" /> Download All Images
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
                              <Badge variant={group.urgency_label === "Last Seats" ? "destructive" : "secondary"} className="text-[10px]">
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
                              {(["1x1", "4x5", "story"] as const).map(size => (
                                <Button key={size} size="sm" variant="ghost" className="h-7 text-xs"
                                  onClick={() => handleGenerateImage(group, size)}
                                  disabled={isSizeGenerating(group.id, size)}
                                >
                                  {isSizeGenerating(group.id, size) ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Image className="h-3 w-3 mr-1" />
                                  )}
                                  {size}
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

            <TabsContent value="archive">
              <MarketingPostsArchive />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}
