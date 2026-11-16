import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Loader2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONVERSATIONS, POLLY_VOICE_BY_SPEAKER, VOICE_BY_SPEAKER } from "@/constants/conversations";

/**
 * Admin → Conversation audio.
 *
 * Generates the spoken Korean for a book conversation — the audio a QR code in
 * the printed book plays. One MP3 per line, so a learner can replay one line.
 *
 * Generate lesson 1 first and listen before doing the rest: a textbook's audio
 * is copied by the learner, so the intonation has to be approved, not assumed.
 */
type LineResult = { index: number; ok: boolean; url?: string; error?: string; voice?: string };
type RunState = { running: boolean; results?: LineResult[]; error?: string };

export default function ConversationAudio() {
  const [state, setState] = useState<Record<string, RunState>>({});

  /**
   * provider "polly" writes a preview (conversations/<code>/preview/…) with the
   * Amazon voices — the live audio the book's QR codes play is not touched.
   */
  const generate = async (code: string, provider: "openai" | "polly" = "openai") => {
    const convo = CONVERSATIONS.find((c) => c.code === code);
    if (!convo) return;
    const key = provider === "polly" ? `${code}:polly` : code;
    setState((s) => ({ ...s, [key]: { running: true } }));
    try {
      const { data, error } = await supabase.functions.invoke("conversation-audio", {
        body: {
          code,
          lines: convo.lines.map((l) => ({ who: l.who, ko: l.ko })),
          voices: VOICE_BY_SPEAKER,
          provider,
          ...(provider === "polly" ? { pollyVoices: POLLY_VOICE_BY_SPEAKER } : {}),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setState((s) => ({ ...s, [key]: { running: false, results: data.results } }));
    } catch (e) {
      setState((s) => ({
        ...s,
        [key]: { running: false, error: e instanceof Error ? e.message : String(e) },
      }));
    }
  };

  /** Copies the previewed Amazon lines over the live audio the QR plays. */
  const publish = async (code: string) => {
    const preview = state[`${code}:polly`];
    const indices = (preview?.results ?? []).filter((r) => r.ok && r.voice?.startsWith("polly:")).map((r) => r.index);
    const key = `${code}:publish`;
    setState((s) => ({ ...s, [key]: { running: true } }));
    try {
      const { data, error } = await supabase.functions.invoke("conversation-audio", {
        body: { action: "publish", code, indices },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setState((s) => ({ ...s, [key]: { running: false, results: data.results } }));
    } catch (e) {
      setState((s) => ({ ...s, [key]: { running: false, error: e instanceof Error ? e.message : String(e) } }));
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
          const preview = state[`${c.code}:polly`] || { running: false };
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generate(c.code, "polly")}
                    disabled={preview.running}
                    title="Amazon Polly voices (AWS credits). Writes a preview only — the live book audio is not changed."
                  >
                    {preview.running && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Try Amazon voices
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
                {preview.error && (
                  <p className="flex items-start gap-1.5 text-xs text-destructive">
                    <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {preview.error}
                  </p>
                )}

                {preview.results && (
                  <div className="space-y-2 rounded-md border border-dashed p-2 text-xs">
                    <p className="font-medium">Amazon voices — preview, not live yet</p>
                    {preview.results.map((r) => (
                      <div key={r.index} className="space-y-1">
                        <p className="text-muted-foreground">
                          <span lang="ko">{c.lines[r.index]?.who}</span> · line {r.index + 1}
                          {r.voice ? ` · ${r.voice}` : ""}
                        </p>
                        {r.ok && r.url ? (
                          <audio controls preload="none" src={`${r.url}?v=${Date.now()}`} className="h-8 w-full" />
                        ) : (
                          <p className="text-destructive">{r.error}</p>
                        )}
                      </div>
                    ))}
                    <PublishRow
                      count={preview.results.filter((r) => r.ok && r.voice?.startsWith("polly:")).length}
                      pub={state[`${c.code}:publish`]}
                      onPublish={() => publish(c.code)}
                    />
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

/** Two taps on purpose: the first arms, the second replaces the live audio. */
function PublishRow({ count, pub, onPublish }: { count: number; pub?: RunState; onPublish: () => void }) {
  const [armed, setArmed] = useState(false);
  if (!count) return null;
  const done = pub?.results?.filter((r) => r.ok).length ?? 0;
  return (
    <div className="space-y-1 border-t pt-2">
      {pub?.results ? (
        <p className="flex items-center gap-1.5 font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> {done} of {pub.results.length} lines are now live on the QR page
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={armed ? "destructive" : "secondary"}
            disabled={pub?.running}
            onClick={() => (armed ? onPublish() : setArmed(true))}
          >
            {pub?.running && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {armed ? `Yes — make these ${count} lines live` : `Approve & publish ${count} Amazon lines`}
          </Button>
          {armed && !pub?.running && (
            <button className="text-muted-foreground underline" onClick={() => setArmed(false)}>
              cancel
            </button>
          )}
        </div>
      )}
      {pub?.error && <p className="text-destructive">{pub.error}</p>}
      {pub?.results?.filter((r) => !r.ok).map((r) => (
        <p key={r.index} className="text-destructive">line {r.index + 1}: {r.error}</p>
      ))}
    </div>
  );
}
