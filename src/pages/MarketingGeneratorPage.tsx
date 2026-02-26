import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Copy, Download, Sparkles, Image, Info, RefreshCw, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type GroupData,
  generateCaptions,
  generateAdCopy,
  getLevelLabel,
  getUrgencyLabel,
} from "@/lib/marketingEngine";
import MarketingPostsArchive from "@/components/admin/MarketingPostsArchive";

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
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<Record<string, { captions: string[]; adCopy: ReturnType<typeof generateAdCopy> }>>({});
  const [generatingImages, setGeneratingImages] = useState<Record<string, Set<string>>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, GeneratedImages>>({});

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
    setExpandedGroup(group.id);

    // Save to marketing_posts
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

    toast({ title: "Content generated!", description: `3 captions + ad copy for ${getLevelLabel(group.level)}` });
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

      // Update marketing_posts with image URL
      const imageField = size === "1x1" ? "image_url_1x1" : size === "4x5" ? "image_url_4x5" : "image_url_story";
      supabase.from("marketing_posts")
        .update({ [imageField]: data.image_url })
        .eq("group_id", group.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ error }) => {
          if (error) console.error("Failed to update post image:", error.message);
        });

      toast({ title: "Image generated!", description: `${size} image for ${getLevelLabel(group.level)}` });
    } catch (err: any) {
      toast({ title: "Error generating image", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImages(prev => {
        const s = new Set(prev[group.id] || []);
        s.delete(size);
        return { ...prev, [group.id]: s };
      });
    }
  }

  async function handleGenerateAllImages(group: GroupData) {
    for (const size of ["1x1", "4x5", "story"] as const) {
      await handleGenerateImage(group, size);
    }
  }

  function downloadImage(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.target = "_blank";
    a.click();
  }

  const isGenerating = (groupId: string) => (generatingImages[groupId]?.size || 0) > 0;
  const isSizeGenerating = (groupId: string, size: string) => generatingImages[groupId]?.has(size) || false;

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
                  <p>Click "Generate Content" for captions & ad copy. Click image size buttons to generate AI-branded images. Download or copy anything you need.</p>
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
              {groups.map(group => {
                const groupImages = generatedImages[group.id] || {};
                const hasAnyImage = Object.keys(groupImages).length > 0;

                return (
                  <Card key={group.id} className="rounded-2xl">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{getLevelLabel(group.level)}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {group.day_name} • {group.start_time} • {group.duration_min}min
                          </p>
                        </div>
                        <Badge variant={group.urgency_label === "Last Seats" ? "destructive" : "default"}>
                          {group.urgency_label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>{group.active_members}/{group.capacity} enrolled</span>
                        <span className="font-medium text-primary">{group.seats_left} seats left</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => handleGenerate(group)}>
                          <Sparkles className="h-4 w-4 mr-1" /> Generate Content
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleGenerateAllImages(group)} disabled={isGenerating(group.id)}>
                          {isGenerating(group.id) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Image className="h-4 w-4 mr-1" />}
                          {isGenerating(group.id) ? "Generating..." : "Generate All Images"}
                        </Button>
                      </div>

                      {/* Individual image size buttons */}
                      <div className="flex gap-2">
                        {(["1x1", "4x5", "story"] as const).map(size => (
                          <Button key={size} size="sm" variant="ghost" className="text-xs"
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

                      {/* Generated images preview */}
                      {hasAnyImage && (
                        <div className="flex gap-3 overflow-x-auto py-2">
                          {(["1x1", "4x5", "story"] as const).map(size => {
                            const url = groupImages[size];
                            if (!url) return null;
                            const aspectClass = size === "1x1" ? "aspect-square" : size === "4x5" ? "aspect-[4/5]" : "aspect-[9/16]";
                            return (
                              <div key={size} className="shrink-0 space-y-1">
                                <div className={`${aspectClass} w-32 rounded-lg overflow-hidden border shadow-sm bg-muted`}>
                                  <img src={url} alt={`${getLevelLabel(group.level)} ${size}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-muted-foreground">{size}</span>
                                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                                    onClick={() => downloadImage(url, `${getLevelLabel(group.level).replace(/\s+/g, "-")}-${size}.png`)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Generated text content */}
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
                );
              })}
            </div>
          )}

          {/* Saved Posts Archive */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">📁 Saved Posts Archive</h2>
            <MarketingPostsArchive />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
