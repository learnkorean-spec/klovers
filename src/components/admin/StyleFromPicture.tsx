import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, ImagePlus, Loader2, Wand2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Style 10, "make it like my picture" (Re, 13 Nov 2026: "make that i can
 * upload a picture and add a prompt to create similar style picture in style
 * 10"). Upload any picture as a STYLE reference, write what the new picture
 * should show, and Muse Image paints it in that style. The reference's
 * subject is never copied, only its look. Results stack up so different
 * prompts can be tried against one reference.
 */

const SIZES = [
  { id: "1024x1024", label: "Square 1:1" },
  { id: "1024x1536", label: "Portrait 2:3" },
  { id: "1536x1024", label: "Landscape 3:2" },
] as const;

interface Result {
  id: number;
  prompt: string;
  image?: string;
  style?: string;
  notes?: string[];
  status: "loading" | "done" | "error";
}

/** Shrink the upload to at most 1024 px on its long side, as JPEG, before sending it. */
function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't a picture this browser can open"));
      img.onload = () => {
        const k = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * k);
        c.height = Math.round(img.naturalHeight * k);
        const x = c.getContext("2d")!;
        x.fillStyle = "#FFFFFF";
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function save(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

let nextId = 1;

export default function StyleFromPicture({ headerAction }: { headerAction?: ReactNode }) {
  const [reference, setReference] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<string>("1024x1024");
  const [results, setResults] = useState<Result[]>([]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setReference(await shrink(file));
    } catch (e) {
      toast({ title: "Couldn't use that picture", description: e instanceof Error ? e.message : "", variant: "destructive" });
    }
  };

  const generate = async (text: string = prompt) => {
    if (!reference || !text.trim()) return;
    const id = nextId++;
    setResults((rs) => [{ id, prompt: text, status: "loading" }, ...rs]);
    const patch = (p: Partial<Result>) => setResults((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "style-copy", referenceImage: reference, prompt: text, size },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      patch({ image: data.imageDataUrl, style: data.style, notes: data.notes, status: "done" });
    } catch (e) {
      patch({ status: "error" });
      toast({ title: "Picture failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-20 w-16 shrink-0 rounded border bg-muted flex items-center justify-center overflow-hidden">
            {reference ? (
              <img src={reference} alt="Your style reference" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Style 10: Make it like my picture
          </CardTitle>
        </div>
        {headerAction}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a picture whose style you like, then write what the new picture should show. The new picture copies
          the look (technique, colours, lighting, texture, character proportions), not the subject. Keep the same
          picture and try as many prompts as you want.
        </p>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <div className="space-y-2">
            <Label>1. Style picture</Label>
            {reference ? (
              <div className="relative">
                <img src={reference} alt="Your style reference" className="w-full rounded-md border bg-white object-contain max-h-64" />
                <button
                  type="button"
                  aria-label="Remove the picture"
                  onClick={() => setReference(null)}
                  className="absolute top-1 right-1 rounded-full bg-white/90 border p-1 shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed text-sm text-muted-foreground hover:bg-muted/50"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  void onFile(e.dataTransfer.files?.[0]);
                }}
              >
                <ImagePlus className="h-6 w-6" />
                Click or drop a picture
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sfp-prompt">2. What should the new picture show?</Label>
            <Textarea
              id="sfp-prompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. two girls playing a Korean clapping game in a school playground"
            />
            <div className="flex flex-wrap items-center gap-2">
              {SIZES.map((s) => (
                <Button key={s.id} type="button" size="sm" variant={size === s.id ? "default" : "outline"} onClick={() => setSize(s.id)}>
                  {s.label}
                </Button>
              ))}
              <Button onClick={() => void generate()} disabled={!reference || !prompt.trim()} className="ml-auto">
                <Wand2 className="h-4 w-4 mr-2" /> Generate picture
              </Button>
            </div>
            {!reference && <p className="text-xs text-muted-foreground">Upload a style picture first.</p>}
          </div>
        </div>

        {results.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((r, n) => (
              <div key={r.id} className="space-y-2 rounded-md border p-2">
                <div className="flex min-h-48 items-center justify-center rounded bg-muted overflow-hidden">
                  {r.status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                  {r.status === "error" && <span className="text-xs text-destructive">Failed</span>}
                  {r.image && <img src={r.image} alt={r.prompt} className="w-full object-contain bg-white" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2" title={r.prompt}>
                  {r.prompt}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="outline" disabled={!r.image} onClick={() => r.image && save(r.image, `klovers-style10-${results.length - n}.png`)}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!reference || r.status === "loading"} onClick={() => void generate(r.prompt)}>
                    Again
                  </Button>
                </div>
                {r.style && (
                  <details className="text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer">Style it copied</summary>
                    <p className="mt-1">{r.style}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
