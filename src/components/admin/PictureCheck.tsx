import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, ClipboardCopy, HelpCircle, Loader2, ScanSearch, Square, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CHECK_SEED, type CheckStatus } from "@/constants/pictureCheckSeed";

/**
 * Picture check tab (Re, 18 Nov 2026: "a new tab in the lab room to check
 * which pictures must be changed and which is good to go"). Every picture
 * the site ships is listed with a verdict: Claude's first pass
 * (pictureCheckSeed.ts), then the AI re-check, then Re's own click, which
 * always wins. Verdicts are saved to storage so they follow her to any device.
 */

type Status = CheckStatus | "unchecked";
interface Review {
  status: CheckStatus;
  reason?: string;
  note?: string;
  by: "re" | "ai";
  at: string;
}
type Reviews = Record<string, Review>;

const REASONS: Record<string, string> = {
  "old-clay": "Old clay style",
  "old-3d": "Old glossy 3D style",
  "mixed-style": "Doesn't match the watercolor style",
  childish: "Too childish / cartoon",
  "fake-text": "Fake or broken letters",
  repetitive: "Same scene again (yellow outfits, same café)",
  "off-canon": "Characters look wrong",
  generic: "Nothing shows Korea",
  "lab-example": "Lab example picture",
  texture: "3D texture, not a picture",
  logo: "Logo",
  "source-sheet": "Source grid (already cut)",
  reference: "Character reference",
};

const STATUS_META: Record<Status, { label: string; className: string }> = {
  change: { label: "Must change", className: "bg-red-100 text-red-800 border-red-300" },
  check: { label: "Needs your eye", className: "bg-amber-100 text-amber-800 border-amber-300" },
  good: { label: "Good to go", className: "bg-green-100 text-green-800 border-green-300" },
  unchecked: { label: "Not checked", className: "bg-slate-100 text-slate-700 border-slate-300" },
  skip: { label: "Not a picture to judge", className: "bg-slate-50 text-slate-500 border-slate-200" },
};
const STATUS_ORDER: Status[] = ["change", "check", "unchecked", "good", "skip"];

function areaOf(path: string): string {
  if (path.startsWith("/picture-library/icons/")) return "Book icons";
  if (path.startsWith("/picture-library/scenes/")) return "Book & site scenes";
  if (path.startsWith("/picture-library/")) return "Book source sheets";
  if (path.startsWith("/assets/blog/")) return "Blog";
  if (path.startsWith("/assets/icons/")) return "Site icons";
  if (path.startsWith("/assets/cluby/") || path.startsWith("/assets/story/")) return "Cluby & story";
  if (path.startsWith("/book-covers/") || path.startsWith("/book-previews/") || path.startsWith("/book-photos/") || path.startsWith("/assets/shop/"))
    return "Books & shop";
  return "Other";
}

/** Shrinks a site picture to a JPEG data URL the checker can read. */
async function toDataUrl(src: string): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const k = Math.min(1, 768 / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  const x = c.getContext("2d")!;
  x.fillStyle = "#FFFFFF";
  x.fillRect(0, 0, c.width, c.height);
  x.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.85);
}

const PAGE = 60;

export default function PictureCheck() {
  const [paths, setPaths] = useState<string[]>(() => Object.keys(CHECK_SEED));
  const [reviews, setReviews] = useState<Reviews>({});
  const [loaded, setLoaded] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("change");
  const [area, setArea] = useState("all");
  const [reason, setReason] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);
  const dirty = useRef(false);

  // Pictures added after the first pass come from the build's manifest.
  useEffect(() => {
    fetch("/picture-manifest.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: unknown) => {
        if (Array.isArray(list)) setPaths((ps) => Array.from(new Set([...ps, ...list.map(String)])).sort());
      })
      .catch(() => {});
    supabase.functions
      .invoke("generate-ai-room-concept", { body: { mode: "picture-reviews-load" } })
      .then(({ data }) => setReviews((data?.reviews as Reviews) ?? {}))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Save a moment after the last change.
  useEffect(() => {
    if (!loaded || !dirty.current) return;
    const t = setTimeout(async () => {
      dirty.current = false;
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "picture-reviews-save", reviews },
      });
      if (error || data?.error) toast({ title: "Couldn't save the checks", description: String(error?.message ?? data?.error), variant: "destructive" });
    }, 1500);
    return () => clearTimeout(t);
  }, [reviews, loaded]);

  const verdict = useCallback(
    (p: string): { status: Status; reason: string; note?: string; by?: string } => {
      const r = reviews[p];
      if (r) return { status: r.status, reason: r.reason ?? "", note: r.note, by: r.by };
      const s = CHECK_SEED[p];
      if (s) return { status: s[0], reason: s[1], by: "claude" };
      return { status: "unchecked", reason: "" };
    },
    [reviews],
  );

  const setReview = (p: string, r: Omit<Review, "at">) => {
    dirty.current = true;
    setReviews((rs) => ({ ...rs, [p]: { ...r, at: new Date().toISOString() } }));
  };

  const counts = useMemo(() => {
    const c: Record<Status, number> = { change: 0, check: 0, good: 0, unchecked: 0, skip: 0 };
    for (const p of paths) c[verdict(p).status]++;
    return c;
  }, [paths, verdict]);

  const areas = useMemo(() => Array.from(new Set(paths.map(areaOf))).sort(), [paths]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return paths
      .filter((p) => {
        const v = verdict(p);
        if (statusFilter !== "all" && v.status !== statusFilter) return false;
        if (area !== "all" && areaOf(p) !== area) return false;
        if (reason !== "all" && v.reason !== reason) return false;
        return !q || p.toLowerCase().includes(q);
      })
      .sort((a, b) => STATUS_ORDER.indexOf(verdict(a).status) - STATUS_ORDER.indexOf(verdict(b).status) || a.localeCompare(b));
  }, [paths, verdict, statusFilter, area, reason, query]);

  useEffect(() => setShown(PAGE), [statusFilter, area, reason, query]);

  const aiCheck = async (p: string) => {
    setBusy((b) => ({ ...b, [p]: true }));
    try {
      const image = await toDataUrl(p);
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "picture-check", image, where: `${areaOf(p)}: ${p}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReview(p, { status: data.status, reason: data.reason, note: data.note, by: "ai" });
    } catch (e) {
      toast({ title: "AI check failed", description: `${p}: ${e instanceof Error ? e.message : "unknown error"}`, variant: "destructive" });
    } finally {
      setBusy((b) => ({ ...b, [p]: false }));
    }
  };

  // Re-checks what is on screen, one at a time, never overriding Re's own click.
  const aiCheckShown = async () => {
    stopRef.current = false;
    setRunning(true);
    for (const p of list.slice(0, shown)) {
      if (stopRef.current) break;
      const v = verdict(p);
      if (v.by === "re" || v.status === "skip") continue;
      await aiCheck(p);
    }
    setRunning(false);
  };

  const copyChangeList = async () => {
    const rows = paths
      .filter((p) => verdict(p).status === "change")
      .map((p) => {
        const v = verdict(p);
        return `${p}\t${REASONS[v.reason] ?? v.reason}${v.note ? ` (${v.note})` : ""}`;
      });
    await navigator.clipboard.writeText(rows.join("\n"));
    toast({ title: `Copied ${rows.length} pictures to change`, description: "Paste it to Claude with \"execute skill picture\"." });
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ScanSearch className="h-4 w-4" /> Picture check: what must change, what is good to go
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every picture on the site, with a verdict. Your own click always wins and is saved for every device. Use
          "AI check" to judge a picture again against today's style (watercolor icons, real-looking adult photos in
          Korea, the real Cluby, no fake letters).
        </p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-full border px-3 py-1 text-sm ${STATUS_META[s].className} ${statusFilter === s ? "ring-2 ring-offset-1 ring-foreground/40" : ""}`}
            >
              {STATUS_META[s].label}: <b>{counts[s]}</b>
            </button>
          ))}
          <button type="button" onClick={() => setStatusFilter("all")} className={`rounded-full border px-3 py-1 text-sm ${statusFilter === "all" ? "ring-2 ring-offset-1 ring-foreground/40" : ""}`}>
            All: <b>{paths.length}</b>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area">
            <option value="all">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select className="h-9 rounded-md border bg-background px-2 text-sm" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason">
            <option value="all">Any reason</option>
            {Object.entries(REASONS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <Input className="h-9 w-48" placeholder="Search file name" value={query} onChange={(e) => setQuery(e.target.value)} />
          <span className="text-sm text-muted-foreground">{list.length} shown</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {running ? (
              <Button size="sm" variant="outline" onClick={() => (stopRef.current = true)}>
                <Square className="h-3.5 w-3.5 mr-1" /> Stop
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => void aiCheckShown()} disabled={!list.length}>
                <ScanSearch className="h-3.5 w-3.5 mr-1" /> AI check the {Math.min(shown, list.length)} on screen
              </Button>
            )}
            <Button size="sm" onClick={() => void copyChangeList()} disabled={!counts.change}>
              <ClipboardCopy className="h-3.5 w-3.5 mr-1" /> Copy the "must change" list
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded && (
          <p className="text-sm text-muted-foreground flex items-center gap-2 mb-3">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your saved checks…
          </p>
        )}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {list.slice(0, shown).map((p) => {
            const v = verdict(p);
            return (
              <div key={p} className={`rounded-md border p-2 space-y-1.5 bg-background ${v.status === "change" ? "border-red-300" : ""}`}>
                <a href={p} target="_blank" rel="noreferrer" className="block">
                  <img src={p} alt={p} loading="lazy" className="h-32 w-full rounded bg-white object-contain" />
                </a>
                <p className="text-[11px] text-muted-foreground truncate" title={p}>{p.split("/").slice(-2).join("/")}</p>
                <Badge variant="outline" className={`text-[11px] ${STATUS_META[v.status].className}`}>
                  {STATUS_META[v.status].label}
                  {v.by && v.status !== "unchecked" ? ` · ${v.by === "re" ? "you" : v.by === "ai" ? "AI" : "Claude"}` : ""}
                </Badge>
                {(v.reason || v.note) && (
                  <p className="text-[11px] leading-snug">
                    {REASONS[v.reason] ?? v.reason}
                    {v.note ? <span className="text-muted-foreground"> {v.note}</span> : null}
                  </p>
                )}
                <div className="flex gap-1">
                  <Button size="icon" variant={v.status === "good" && v.by === "re" ? "default" : "outline"} className="h-7 w-7" title="Good to go"
                    onClick={() => setReview(p, { status: "good", reason: "", by: "re" })}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant={v.status === "change" && v.by === "re" ? "destructive" : "outline"} className="h-7 w-7" title="Must change"
                    onClick={() => setReview(p, { status: "change", reason: v.reason && v.reason !== "lab-example" ? v.reason : "", by: "re" })}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-7 w-7" title="Not sure, look later"
                    onClick={() => setReview(p, { status: "check", reason: v.reason, by: "re" })}>
                    <HelpCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 ml-auto text-xs" disabled={busy[p]} onClick={() => void aiCheck(p)}>
                    {busy[p] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "AI check"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {shown < list.length && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>
              Show more ({list.length - shown} left)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
