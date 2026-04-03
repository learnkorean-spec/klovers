import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, Play, Wrench, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Sparkles, Link, TrendingUp, AlertTriangle, PlusCircle } from "lucide-react";

// ── Types (mirrors seo-orchestration/index.ts) ────────────────────────────────

interface SeoAgentResult {
  score: number;
  top_fixes: string[];
  improved_description?: string;
}

interface KeywordAgentResult {
  primary_keyword: string;
  in_title: boolean;
  in_description: boolean;
  in_headings: boolean;
  in_intro: boolean;
  placement_score: number;
  suggestions: string[];
}

interface AltTextAgentResult {
  alt1_score: number;
  improved_alt1: string;
  alt2_score: number | null;
  improved_alt2: string | null;
}

interface ContentAgentResult {
  structure_score: number;
  word_count: number;
  heading_count: number;
  suggestions: string[];
}

interface MarketingAgentResult {
  cta_score: number;
  suggested_cta_text: string;
  suggested_cta_url: string;
  social_caption: string;
}

interface InternalLinkingResult {
  missing_link_score: number;
  links_to_posts: Array<{ target_slug: string; anchor_text: string }>;
  links_to_pages: Array<{ url: string; anchor_text: string }>;
}

interface RecommendedArticle {
  title: string;
  slug: string;
  target_keyword: string;
  search_intent: string;
  article_type: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

interface CannibalizationWarning {
  post_slugs: string[];
  shared_keyword: string;
  recommendation: string;
}

interface TopicCluster {
  cluster_name: string;
  pillar_slug: string | null;
  supporting_slugs: string[];
  gap: string | null;
}

interface TopicGapResult {
  recommended_articles: RecommendedArticle[];
  cannibalization_warnings: CannibalizationWarning[];
  topic_clusters: TopicCluster[];
}

interface AgentReport {
  id: string;
  title: string;
  slug: string;
  lang: string;
  agents_run: string[];
  seo?: SeoAgentResult;
  keyword?: KeywordAgentResult;
  alt_text?: AltTextAgentResult;
  content?: ContentAgentResult;
  marketing?: MarketingAgentResult;
  internal_links?: InternalLinkingResult;
}

interface OrchestratorSummary {
  total_posts: number;
  posts_analyzed: number;
  agents_invoked: number;
  ai_calls_made: number;
  avg_seo_score: number | null;
  posts_needing_work: number;
  fixes_applied: number;
  topic_gaps_found: number;
  cannibalization_warnings: number;
}

interface OrchestrationResponse {
  summary: OrchestratorSummary;
  report: AgentReport[];
  topic_gaps: TopicGapResult | null;
  errors?: string[];
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score, title }: { score: number | null | undefined; title?: string }) {
  if (score == null) return <span className="text-muted-foreground text-xs">—</span>;
  const color =
    score >= 8
      ? "bg-green-100 text-green-800 border-green-200"
      : score >= 5
      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
      : "bg-red-100 text-red-800 border-red-200";
  return (
    <span title={title} className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border ${color}`}>
      {score}/10
    </span>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
  ) : (
    <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
  );
}

// ── Post row (collapsible) ────────────────────────────────────────────────────

function PostRow({ item }: { item: AgentReport }) {
  const [open, setOpen] = useState(false);

  const hasIssues = item.agents_run.length > 0;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}

        <span className="flex-1 font-medium text-sm truncate">{item.title}</span>

        <Badge variant="outline" className="text-xs shrink-0">
          {item.lang.toUpperCase()}
        </Badge>

        {/* Agent presence indicators */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.seo && <ScoreBadge score={item.seo.score} title="SEO" />}
          {item.keyword && <ScoreBadge score={item.keyword.placement_score} title="Keyword placement" />}
          {item.alt_text && <ScoreBadge score={item.alt_text.alt1_score} title="Alt text" />}
          {item.content && <ScoreBadge score={item.content.structure_score} title="Content" />}
          {item.marketing && <ScoreBadge score={item.marketing.cta_score} title="Marketing" />}
        </div>

        {hasIssues ? (
          <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
        )}
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t bg-muted/20 px-4 py-4 grid gap-4 text-sm">
          {/* SEO Agent */}
          {item.seo && (
            <div>
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> SEO Analysis
                <ScoreBadge score={item.seo.score} />
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {item.seo.top_fixes.map((fix, i) => <li key={i}>{fix}</li>)}
              </ul>
              {item.seo.improved_description && (
                <div className="mt-2 p-2 rounded bg-background border text-xs">
                  <span className="font-medium text-foreground">Improved description: </span>
                  {item.seo.improved_description}
                </div>
              )}
            </div>
          )}

          {/* Keyword Agent */}
          {item.keyword && (
            <div>
              <p className="font-semibold mb-1">
                Keyword Placement — <span className="font-mono text-primary">"{item.keyword.primary_keyword}"</span>
                <span className="ml-2"><ScoreBadge score={item.keyword.placement_score} /></span>
              </p>
              <div className="flex flex-wrap gap-3 text-xs mb-2">
                <span className="flex items-center gap-1"><BoolBadge value={item.keyword.in_title} /> Title</span>
                <span className="flex items-center gap-1"><BoolBadge value={item.keyword.in_description} /> Description</span>
                <span className="flex items-center gap-1"><BoolBadge value={item.keyword.in_headings} /> Headings</span>
                <span className="flex items-center gap-1"><BoolBadge value={item.keyword.in_intro} /> Intro</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {item.keyword.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Alt Text Agent */}
          {item.alt_text && (
            <div>
              <p className="font-semibold mb-1">
                Alt Text <ScoreBadge score={item.alt_text.alt1_score} />
              </p>
              <div className="p-2 rounded bg-background border text-xs space-y-1">
                <p><span className="font-medium">Hero 1: </span>{item.alt_text.improved_alt1}</p>
                {item.alt_text.improved_alt2 && (
                  <p><span className="font-medium">Hero 2: </span>{item.alt_text.improved_alt2}</p>
                )}
              </div>
            </div>
          )}

          {/* Content Agent */}
          {item.content && (
            <div>
              <p className="font-semibold mb-1">
                Content Structure <ScoreBadge score={item.content.structure_score} />
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {item.content.word_count} words · {item.content.heading_count} headings
                </span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {item.content.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Marketing Agent */}
          {item.marketing && (
            <div>
              <p className="font-semibold mb-1">
                Marketing Copy <ScoreBadge score={item.marketing.cta_score} />
              </p>
              <div className="p-2 rounded bg-background border text-xs space-y-1">
                <p><span className="font-medium">CTA: </span>"{item.marketing.suggested_cta_text}" → {item.marketing.suggested_cta_url}</p>
                <p><span className="font-medium">Social: </span>{item.marketing.social_caption}</p>
              </div>
            </div>
          )}

          {/* Internal Linking Agent */}
          {item.internal_links && (
            <div>
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <Link className="h-3.5 w-3.5" /> Internal Links
                <ScoreBadge score={item.internal_links.missing_link_score} />
              </p>
              <div className="p-2 rounded bg-background border text-xs space-y-2">
                {item.internal_links.links_to_posts.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Link to posts:</p>
                    <ul className="space-y-0.5">
                      {item.internal_links.links_to_posts.map((l, i) => (
                        <li key={i} className="text-muted-foreground">
                          → <span className="font-mono text-primary">/{l.target_slug}</span> — "{l.anchor_text}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.internal_links.links_to_pages.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Link to pages:</p>
                    <ul className="space-y-0.5">
                      {item.internal_links.links_to_pages.map((l, i) => (
                        <li key={i} className="text-muted-foreground">
                          → <span className="font-mono text-primary">{l.url}</span> — "{l.anchor_text}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {item.agents_run.length === 0 && (
            <p className="text-green-600 text-sm font-medium">
              All checks passed — no improvements needed.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const cls =
    priority === "high"
      ? "bg-red-100 text-red-700 border-red-200"
      : priority === "medium"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-slate-100 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-semibold border ${cls} capitalize`}>
      {priority}
    </span>
  );
}

// ── Topic Gap Panel ───────────────────────────────────────────────────────────

function TopicGapPanel({ data }: { data: TopicGapResult }) {
  const [clusterOpen, setClusterOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Recommended articles */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-primary" />
            Recommended New Articles ({data.recommended_articles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {data.recommended_articles.map((a, i) => (
            <div key={i} className="flex flex-col gap-1 p-3 rounded-lg border bg-muted/30 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium leading-tight">{a.title}</p>
                <PriorityBadge priority={a.priority} />
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="font-mono bg-background border rounded px-1">{a.target_keyword}</span>
                <Badge variant="outline" className="text-xs">{a.article_type}</Badge>
                <Badge variant="outline" className="text-xs">{a.search_intent}</Badge>
                <span className="font-mono text-primary">/{a.slug}</span>
              </div>
              <p className="text-xs text-muted-foreground">{a.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cannibalization warnings */}
      {data.cannibalization_warnings.length > 0 && (
        <Card className="rounded-xl border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              Keyword Cannibalization ({data.cannibalization_warnings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {data.cannibalization_warnings.map((w, i) => (
              <div key={i} className="text-sm p-2 rounded border border-yellow-200 bg-background space-y-1">
                <p className="font-medium">"{w.shared_keyword}"</p>
                <p className="text-xs text-muted-foreground">Posts: {w.post_slugs.join(", ")}</p>
                <p className="text-xs">{w.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Topic clusters */}
      {data.topic_clusters.length > 0 && (
        <Card className="rounded-xl">
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            onClick={() => setClusterOpen((v) => !v)}
          >
            {clusterOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Topic Clusters ({data.topic_clusters.length})</span>
          </button>
          {clusterOpen && (
            <CardContent className="pt-0 border-t space-y-2">
              {data.topic_clusters.map((c, i) => (
                <div key={i} className="p-3 rounded-lg border bg-muted/30 text-sm space-y-1">
                  <p className="font-semibold">{c.cluster_name}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Pillar: <span className="font-mono text-foreground">{c.pillar_slug ?? "missing"}</span></p>
                    <p>Supporting: {c.supporting_slugs.join(", ") || "none"}</p>
                    {c.gap && <p className="text-yellow-700">Gap: {c.gap}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function SeoOrchestrationPanel() {
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<OrchestrationResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"posts" | "topics">("posts");

  async function runOrchestration(mode: "analyze" | "fix") {
    if (mode === "analyze") setLoading(true);
    else setFixing(true);

    try {
      const { data, error } = await supabase.functions.invoke("seo-orchestration", {
        body: { mode },
      });

      if (error) throw error;

      setResult(data as OrchestrationResponse);
      toast({
        title: mode === "analyze" ? "Analysis complete" : "Fixes applied",
        description:
          mode === "analyze"
            ? `${data.summary.posts_analyzed} posts analyzed across ${data.summary.ai_calls_made} AI call(s)`
            : `${data.summary.fixes_applied} posts updated`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message ?? "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setFixing(false);
    }
  }

  const summary = result?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            SEO Orchestration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Token-efficient multi-agent analysis: SEO quality, keyword placement, alt text,
            content structure, and marketing copy — only posts with gaps get AI attention.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={() => runOrchestration("analyze")} disabled={loading || fixing}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing…</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Run Analysis</>
            )}
          </Button>

          {result && (
            <Button
              variant="outline"
              onClick={() => runOrchestration("fix")}
              disabled={loading || fixing}
            >
              {fixing ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Applying…</>
              ) : (
                <><Wrench className="h-4 w-4 mr-2" /> Apply All Fixes</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Posts Scanned", value: summary.total_posts },
            { label: "Needing Work", value: summary.posts_needing_work },
            { label: "AI Calls", value: summary.ai_calls_made },
            { label: "Avg SEO", value: summary.avg_seo_score != null ? `${summary.avg_seo_score}/10` : "—" },
            { label: "Topic Gaps", value: summary.topic_gaps_found },
            { label: "Cannibalization", value: summary.cannibalization_warnings },
          ].map(({ label, value }) => (
            <Card key={label} className="rounded-xl">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Errors */}
      {result?.errors && result.errors.length > 0 && (
        <Card className="rounded-xl border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-destructive mb-2">Agent errors</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tab switcher */}
      {result && (
        <div className="flex gap-1 border-b">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            Post Analysis ({result.report.length})
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${activeTab === "topics" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Topic Intelligence
            {(result.summary.topic_gaps_found > 0 || result.summary.cannibalization_warnings > 0) && (
              <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5 py-0.5 leading-none">
                {result.summary.topic_gaps_found + result.summary.cannibalization_warnings}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Per-post report */}
      {result?.report && result.report.length > 0 && activeTab === "posts" && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">
            {result.report.length} post{result.report.length !== 1 ? "s" : ""} — click to expand details
          </p>
          {result.report.map((item) => (
            <PostRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Topic intelligence tab */}
      {result?.topic_gaps && activeTab === "topics" && (
        <TopicGapPanel data={result.topic_gaps} />
      )}

      {result?.topic_gaps == null && activeTab === "topics" && result != null && (
        <p className="text-sm text-muted-foreground text-center py-10">Topic analysis unavailable.</p>
      )}
    </div>
  );
}
