import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Sparkles, Download, Images } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface DesignBrief {
  roomName: string;
  vocabularyFocus: string[];
  keyProps: string[];
  colorPalette: string[];
  learnerAction: string;
}

interface RoomVariant {
  label: "A" | "B";
  imageDataUrl: string;
  designBrief: DesignBrief;
}

interface BatchIdea {
  book: string;
  theme: string;
  extraCharacter: string;
}

interface CoverResult {
  theme: string;
  extraCharacter?: string;
  imageDataUrl: string;
  designBrief: DesignBrief;
}

// The 10 book-cover ideas drafted with Re on 2 Nov 2026 — each pairs a scene
// from KLOVERS' existing world/books with ONE new original supporting
// character, so the cover set stops reusing just Adam + Lina over and over.
// Editable in the textarea below before generating; this is only the
// starting default.
const DEFAULT_IDEAS: BatchIdea[] = [
  {
    book: "Conversation Cafe",
    theme:
      "a cozy hanok cafe where Adam and Lina order coffee and pastries at the counter and practice drink and dessert words, Cluby napping by the window",
    extraCharacter: "a friendly Korean barista standing behind the counter, taking their order",
  },
  {
    book: "Convenience store",
    theme:
      "a small late-night Korean convenience store where Adam picks snacks and drinks from the shelves and practices asking the price, Lina helping him read the labels",
    extraCharacter: "an older Korean shopkeeper behind the register, handing back change",
  },
  {
    book: "Hangul from Zero",
    theme:
      "a warm, bright classroom nook where Lina writes a Hangul letter on a small board and Adam watches closely",
    extraCharacter: "a new Korean teacher standing beside the board, pointing at the letter",
  },
  {
    book: "Street food / Hongdae",
    theme:
      "a cheerful Hongdae street-food cart at dusk where Adam orders a snack and practices counting and ordering words, Cluby curled up nearby",
    extraCharacter: "a warm street-food vendor behind the cart, handing Adam a wrapped snack",
  },
  {
    book: "Vocabulary Market",
    theme:
      "a lively Korean market alley where Lina shops for fruit and flowers and practices naming them",
    extraCharacter: "two different market stall owners in the background, a fruit seller and a flower seller",
  },
  {
    book: "Culture Street",
    theme:
      "a traditional hanbok rental shop where Adam tries on a hanbok jacket and practices clothing words",
    extraCharacter: "a hanbok shop owner helping him tie the sash",
  },
  {
    book: "Namsan Tower",
    theme:
      "Namsan Tower's love-lock wall at golden hour, where Adam and Lina hang a lock together and practice friendship words",
    extraCharacter: "a passing Korean tourist offering to take their photo",
  },
  {
    book: "Trial Guide",
    theme:
      "a warm welcome scene where Adam and Lina greet someone arriving for their very first Korean class",
    extraCharacter: "a new student arriving at the door for their first trial class, different look from Adam and Lina",
  },
  {
    book: "Conversation Cafe (Level 2)",
    theme:
      "a Seoul subway platform where Lina asks for directions and practices place and direction words",
    extraCharacter: "a helpful Korean stranger pointing toward a subway map",
  },
  {
    book: "Cluby Coloring",
    theme:
      "a bright party scene where Cluby is the center of attention, balloons and a small cake nearby",
    extraCharacter: "two Korean children playing happily with Cluby",
  },
];

function ideasToText(ideas: BatchIdea[]): string {
  return ideas.map((i) => `${i.theme} :: ${i.extraCharacter}`).join("\n");
}

function parseIdeasText(text: string): { theme: string; extraCharacter?: string }[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [theme, extraCharacter] = line.split("::").map((s) => s.trim());
      return extraCharacter ? { theme, extraCharacter } : { theme };
    });
}

export default function AiRoomLabPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const [variants, setVariants] = useState<RoomVariant[]>([]);
  const [useCharacters, setUseCharacters] = useState(true);

  const [batchText, setBatchText] = useState(ideasToText(DEFAULT_IDEAS));
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const [covers, setCovers] = useState<CoverResult[]>([]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVariants([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { prompt, useCharacters },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTheme(data.theme);
      setVariants(data.variants || []);
    } catch (e) {
      toast({
        title: "Generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAllCovers = async () => {
    const items = parseIdeasText(batchText);
    if (items.length === 0) return;
    setBatchLoading(true);
    setCovers([]);
    setBatchProgress({ done: 0, total: items.length });
    try {
      // One function call generates the whole batch (the edge function runs
      // each theme sequentially server-side so we stay under the Meta Model
      // API's rate limit); we just show a progress estimate while we wait.
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { batch: items, useCharacters },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCovers(data.covers || []);
      setBatchProgress({ done: items.length, total: items.length });
      toast({
        title: `${data.covers?.length ?? 0} book covers generated`,
        description: "All text-free — ready to drop a title on top of any of them.",
      });
    } catch (e) {
      toast({
        title: "Batch generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto flex items-center gap-3 py-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">AI Room Lab</h1>
            <p className="text-xs text-muted-foreground">
              Generate candidate KLOVERS World room concepts and book-cover photos, powered by
              Meta's Model API (Muse Image + Muse Spark)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Images className="h-4 w-4" /> Generate all book covers at once
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              One line per cover idea: <code>scene theme :: new supporting character</code>.
              Each line renders as one clean, title-free portrait photo (no text, no signage, no
              labels anywhere) sized for a book cover, with empty space at top and bottom to drop
              a title on later. The character after <code>::</code> is a brand-new original
              person (never Adam, Lina, or Cluby) so the set stops repeating the same two faces —
              edit, remove, or add lines freely before generating.
            </p>
            <Textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              rows={12}
              disabled={batchLoading}
              className="font-mono text-xs"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-characters-batch"
                checked={useCharacters}
                onCheckedChange={(v) => setUseCharacters(v === true)}
                disabled={batchLoading || loading}
              />
              <Label htmlFor="use-characters-batch" className="text-sm font-normal cursor-pointer">
                Use KLOVERS characters (Adam, Lina, Cluby) from their real reference art
              </Label>
            </div>
            <Button onClick={generateAllCovers} disabled={batchLoading || !batchText.trim()}>
              {batchLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating {batchProgress?.total ?? ""} covers… this can take a few minutes
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate all {parseIdeasText(batchText).length} covers
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              An internal concept batch for a human to review and pick from — nothing is added to
              the live site or any book automatically.
            </p>
          </CardContent>
        </Card>

        {covers.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              {covers.length} book-cover concepts
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {covers.map((c, i) => (
                <Card key={i}>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center justify-between gap-2">
                      <span>{c.designBrief?.roomName ?? `Cover ${i + 1}`}</span>
                      <Badge variant="secondary" className="shrink-0">#{i + 1}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <img
                      src={c.imageDataUrl}
                      alt={`Book cover concept: ${c.designBrief?.roomName ?? c.theme}`}
                      className="w-full rounded-md border"
                    />
                    <a
                      href={c.imageDataUrl}
                      download={`klovers-cover-${i + 1}-${(c.designBrief?.roomName ?? "cover").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" /> Download image
                      </Button>
                    </a>
                    <p className="text-xs text-muted-foreground">{c.theme}</p>
                    {c.extraCharacter && (
                      <p className="text-xs text-muted-foreground italic">
                        New character: {c.extraCharacter}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Describe a single room theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "a small Hongdae street-food stall for ordering snacks" or "a quiet reading nook for practicing greetings"'
              rows={3}
              disabled={loading}
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="use-characters"
                checked={useCharacters}
                onCheckedChange={(v) => setUseCharacters(v === true)}
                disabled={loading}
              />
              <Label htmlFor="use-characters" className="text-sm font-normal cursor-pointer">
                Use KLOVERS characters (Adam, Lina, Cluby) in the image, from their real
                reference art
              </Label>
            </div>
            <Button onClick={generate} disabled={loading || !prompt.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating two variants…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate room concepts
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              This proposes two design directions for a new learning room — an internal concept
              sketch for a developer to review and build for real, not a final asset. Nothing is
              added to the live world automatically, per KLOVERS' story canon.
            </p>
          </CardContent>
        </Card>

        {variants.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">
              Variants for: <span className="text-foreground">{theme}</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {variants.map((v) => (
                <Card key={v.label}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Variant {v.label}</CardTitle>
                    <Badge variant="secondary">{v.designBrief.roomName}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <img
                      src={v.imageDataUrl}
                      alt={`Room concept variant ${v.label}: ${v.designBrief.roomName}`}
                      className="w-full rounded-md border"
                    />
                    <a
                      href={v.imageDataUrl}
                      download={`klovers-room-${v.label}-${v.designBrief.roomName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`}
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="h-4 w-4 mr-2" /> Download image
                      </Button>
                    </a>
                    <div className="text-sm">
                      <p className="font-medium">Learner practices:</p>
                      <p className="text-muted-foreground">{v.designBrief.learnerAction}</p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Vocabulary:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.designBrief.vocabularyFocus.map((word) => (
                          <Badge key={word} variant="outline">{word}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">Key props:</p>
                      <p className="text-muted-foreground">{v.designBrief.keyProps.join(", ")}</p>
                    </div>
                    <div className="flex gap-1">
                      {v.designBrief.colorPalette.map((c) => (
                        <div
                          key={c}
                          className="h-6 w-6 rounded border"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
