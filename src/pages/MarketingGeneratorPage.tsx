import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Copy, Download, Sparkles, Image, Info, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type GroupData,
  generateCaptions,
  generateAdCopy,
  getLevelLabel,
  getUrgencyLabel,
} from "@/lib/marketingEngine";
import { MarketingImageTemplate, MarketingImageFull, IMAGE_SIZES } from "@/components/admin/MarketingImageTemplates";
import { toPng } from "html-to-image";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function MarketingGeneratorPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, { captions: string[]; adCopy: ReturnType<typeof generateAdCopy> }>>({});
  const [generatingImages, setGeneratingImages] = useState<string | null>(null);
  const [imageDialog, setImageDialog] = useState<{ group: GroupData; size: "1x1" | "4x5" | "story" } | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch active pkg_groups with their schedule_packages
      const { data: pkgGroups, error: gErr } = await supabase
        .from("pkg_groups")
        .select("id, name, capacity, package_id, is_active")
        .eq("is_active", true);

      if (gErr) throw gErr;
      if (!pkgGroups?.length) { setGroups([]); setLoading(false); return; }

      // Fetch schedule_packages for these groups
      const packageIds = [...new Set(pkgGroups.map(g => g.package_id))];
      const { data: packages } = await supabase
        .from("schedule_packages")
        .select("id, level, day_of_week, start_time, duration_min, capacity, is_active")
        .in("id", packageIds)
        .eq("is_active", true);

      const pkgMap = new Map((packages || []).map(p => [p.id, p]));

      // Fetch active member counts
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

        const timeStr = pkg.start_time ? formatTime(pkg.start_time) : "TBD";

        result.push({
          id: g.id,
          name: g.name,
          level: pkg.level,
          day_name: DAY_NAMES[pkg.day_of_week] || "Unknown",
          start_time: timeStr,
          duration_min: pkg.duration_min,
          capacity: g.capacity,
          active_members: activeMembers,
          seats_left: seatsLeft,
          urgency_label: getUrgencyLabel(seatsLeft),
          package_id: g.package_id,
        });
      }

      // Sort by seats_left ascending (most urgent first)
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
    setExpandedGroup(group.id);
    toast({ title: "Content generated!", description: `3 captions + ad copy for ${getLevelLabel(group.level)}` });
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  }

  async function handleDownloadImage(group: GroupData, size: "1x1" | "4x5" | "story") {
    setGeneratingImages(group.id);
    try {
      // We need to render the full-size element off-screen
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      const { width, height } = IMAGE_SIZES[size];

      // Create the template HTML directly
      const el = document.createElement("div");
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.justifyContent = "space-between";
      el.style.padding = "64px";
      el.style.backgroundColor = "#ffffff";
      el.style.fontFamily = "Inter, system-ui, sans-serif";

      const level = getLevelLabel(group.level);
      const urgencyColor = group.urgency_label === "Last Seats" ? "#ef4444" : "#6941C6";

      el.innerHTML = `
        <div style="width:100%;text-align:center">
          <span style="background:${urgencyColor};color:#fff;padding:12px 32px;border-radius:999px;font-size:28px;font-weight:700;display:inline-block">
            ${group.urgency_label}
          </span>
        </div>
        <div style="text-align:center;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px">
          <h2 style="font-size:72px;font-weight:800;color:#1a1a1a;margin:0;letter-spacing:-1px">${level}</h2>
          <p style="font-size:36px;color:#666;margin:0">${group.day_name} • ${group.start_time}</p>
          <p style="font-size:28px;color:#888;margin:0">${group.duration_min} minutes per session</p>
          <div style="background:rgba(105,65,198,0.1);border-radius:16px;padding:20px 40px;margin-top:16px">
            <p style="font-size:36px;font-weight:700;color:#6941C6;margin:0">${group.seats_left} seat${group.seats_left !== 1 ? "s" : ""} left</p>
          </div>
        </div>
        <div style="text-align:center">
          <p style="font-size:28px;font-weight:600;color:#1a1a1a;margin:0 0 8px">Limited Seats Available</p>
          <p style="font-size:22px;color:#888;margin:0">klovers.lovable.app</p>
        </div>
      `;

      container.appendChild(el);

      const dataUrl = await toPng(el, { width, height, pixelRatio: 1 });

      // Upload to storage
      const blob = await (await fetch(dataUrl)).blob();
      const fileName = `${group.id}-${size}-${Date.now()}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("marketing-images")
        .upload(fileName, blob, { contentType: "image/png", upsert: true });

      if (uploadErr) throw uploadErr;

      // Also trigger download
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${getLevelLabel(group.level).replace(/\s+/g, "-")}-${size}.png`;
      a.click();

      document.body.removeChild(container);
      toast({ title: "Image downloaded!", description: `${size} image saved and uploaded.` });
    } catch (err: any) {
      toast({ title: "Error generating image", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImages(null);
    }
  }

  async function handleDownloadAll(group: GroupData) {
    for (const size of ["1x1", "4x5", "story"] as const) {
      await handleDownloadImage(group, size);
    }
  }

  const urgencyBadgeVariant = (label: string) => {
    if (label === "Last Seats") return "destructive";
    return "default";
  };

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
                <p className="text-xs text-muted-foreground">Auto-generate social posts, ad copy & images</p>
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
                  <p>Select a group and click "Generate Content" to create social media captions, Meta ad copy, and downloadable branded images. Copy text or download images to use on your platforms.</p>
                </TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" onClick={fetchGroups}>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
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
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map(group => (
                <Card key={group.id} className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{getLevelLabel(group.level)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.day_name} • {group.start_time} • {group.duration_min}min
                        </p>
                      </div>
                      <Badge variant={urgencyBadgeVariant(group.urgency_label)}>{group.urgency_label}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{group.active_members}/{group.capacity} enrolled</span>
                      <span className="font-medium text-primary">{group.seats_left} seats left</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => handleGenerate(group)}>
                        <Sparkles className="h-4 w-4 mr-1" /> Generate Content
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadAll(group)} disabled={generatingImages === group.id}>
                        <Download className="h-4 w-4 mr-1" /> {generatingImages === group.id ? "Generating..." : "Download Images"}
                      </Button>
                    </div>

                    {/* Image size buttons */}
                    <div className="flex gap-2">
                      {(["1x1", "4x5", "story"] as const).map(size => (
                        <Button key={size} size="sm" variant="ghost" className="text-xs"
                          onClick={() => handleDownloadImage(group, size)}
                          disabled={generatingImages === group.id}
                        >
                          <Image className="h-3 w-3 mr-1" /> {size}
                        </Button>
                      ))}
                    </div>

                    {/* Image previews */}
                    <div className="flex gap-2 overflow-x-auto py-2">
                      {(["1x1", "4x5", "story"] as const).map(size => (
                        <MarketingImageTemplate key={size} group={group} size={size} />
                      ))}
                    </div>

                    {/* Generated content */}
                    {expandedGroup === group.id && generatedContent[group.id] && (
                      <div className="space-y-4 mt-4 border-t pt-4">
                        <Tabs defaultValue="captions">
                          <TabsList className="h-auto bg-transparent p-0 gap-2">
                            <TabsTrigger value="captions" className="rounded-full px-3 py-1.5 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Captions</TabsTrigger>
                            <TabsTrigger value="ads" className="rounded-full px-3 py-1.5 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Ad Copy</TabsTrigger>
                          </TabsList>

                          <TabsContent value="captions" className="space-y-3 mt-3">
                            {generatedContent[group.id].captions.map((cap, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground font-medium">Variation {i + 1}</span>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => copyToClipboard(cap, `Caption ${i + 1}`)}>
                                    <Copy className="h-3 w-3 mr-1" /> Copy
                                  </Button>
                                </div>
                                <Textarea value={cap} readOnly className="text-sm min-h-[120px] resize-none" />
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="ads" className="space-y-4 mt-3">
                            {(() => {
                              const ad = generatedContent[group.id].adCopy;
                              return (
                                <>
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Primary Text</h4>
                                    {ad.primaryTexts.map((t, i) => (
                                      <div key={i} className="flex items-start gap-2">
                                        <Textarea value={t} readOnly className="text-sm min-h-[60px] resize-none flex-1" />
                                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(t, `Primary Text ${i + 1}`)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Headlines</h4>
                                    {ad.headlines.map((h, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{h}</code>
                                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(h, `Headline ${i + 1}`)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Descriptions</h4>
                                    {ad.descriptions.map((d, i) => (
                                      <div key={i} className="flex items-center gap-2">
                                        <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">{d}</code>
                                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(d, `Description ${i + 1}`)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Suggested CTA:</span>
                                    <Badge>{ad.cta}</Badge>
                                  </div>
                                  <Button size="sm" variant="outline" onClick={() => {
                                    const allText = `PRIMARY TEXT:\n${ad.primaryTexts.join("\n\n")}\n\nHEADLINES:\n${ad.headlines.join("\n")}\n\nDESCRIPTIONS:\n${ad.descriptions.join("\n")}\n\nCTA: ${ad.cta}`;
                                    copyToClipboard(allText, "All ad copy");
                                  }}>
                                    <Copy className="h-4 w-4 mr-1" /> Copy All Ad Copy
                                  </Button>
                                </>
                              );
                            })()}
                          </TabsContent>
                        </Tabs>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
