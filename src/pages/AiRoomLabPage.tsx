import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
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

export default function AiRoomLabPage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);
  const [variants, setVariants] = useState<RoomVariant[]>([]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setVariants([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { prompt },
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
              Generate two candidate KLOVERS World room concepts from a theme, powered by
              Meta's Model API (Muse Image + Muse Spark)
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Describe a room theme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "a small Hongdae street-food stall for ordering snacks" or "a quiet reading nook for practicing greetings"'
              rows={3}
              disabled={loading}
            />
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
              This proposes two design directions for a new learning room. Nothing is added to
              the live world automatically — a developer picks a variant and builds it in, per
              KLOVERS' story canon.
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
