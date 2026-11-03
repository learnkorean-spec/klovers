import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONVERSATIONS, VOICE_BY_SPEAKER } from "@/constants/conversations";

/**
 * Admin → Conversation audio.
 *
 * Generates the spoken Korean for a book conversation — the audio a QR code in
 * the printed book plays. One MP3 per line, so a learner can replay one line.
 *
 * Generate lesson 1 first and listen before doing the rest: a textbook's audio
 * is copied by the learner, so the intonation has to be approved, not assumed.
 */
type LineResult = { index: number; ok: boolean; url?: string; error?: string };
type RunState = { running: boolean; results?: LineResult[]; error?: string };

export default function ConversationAudio() {
  const [state, setState] = useState<Record<string, RunState>>({});

  const generate = async (code: string) => {
    const convo = CONVERSATIONS.find((c) => c.code === code);
    if (!convo) return;
    setState((s) => ({ ...s, [code]: { running: true } }));
    try {
      const { data, error } = await supabase.functions.invoke("conversation-audio", {
        body: {
          code,
          lines: convo.lines.map((l) => ({ who: l.who, ko: l.ko })),
          voices: VOICE_BY_SPEAKER,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setState((s) => ({ ...s, [code]: { running: false, results: data.results } }));
    } catch (e) {
      setState((s) => ({
        ...s,
        [code]: { running: false, error: e instanceof Error ? e.message : String(e) },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Volume2 className="h-5 w-5" /> Conversation audio
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The Korean a book QR code plays. One MP3 per line, one voice per
          character. Generate lesson 1 and listen before running the rest — the
          learner copies whatever they hear.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONVERSATIONS.map((c) => {
          const run = state[c.code] || { running: false };
          const made = run.results?.filter((r) => r.ok).length ?? 0;
          const failed = run.results?.filter((r) => !r.ok) ?? [];
          return (
            <Card key={c.code}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold" lang="ar" dir="rtl">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      الحصة {c.lesson} · {c.lines.length} سطر
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                    /c/{c.code}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => generate(c.code)}
                    disabled={run.running}
                  >
                    {run.running && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {run.results ? "Generate again" : "Generate audio"}
                  </Button>
                  <a
                    href={`/c/${c.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" /> Open the page
                  </a>
                </div>

                {run.error && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {run.error}
                  </p>
                )}

                {run.results && (
                  <div className="space-y-1 text-xs">
                    <p className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      {made} of {run.results.length} lines written
                    </p>
                    {failed.map((f) => (
                      <p key={f.index} className="text-destructive">
                        line {f.index + 1}: {f.error}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
