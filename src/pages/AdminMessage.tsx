/**
 * /admin/message — write one letter to one student, from the Klovers domain.
 *
 * WHY THIS SCREEN EXISTS
 * ----------------------
 * Every other letter Klovers sends answers a question the system already knew
 * to ask: a seat was booked, a level came out, a payment landed. A school also
 * has to say things nobody wrote a template for — "the level I sent you
 * yesterday was wrong, it is Level 1", "Saturday's class moves an hour later",
 * "your receipt arrived".
 *
 * On 14 Sep there was no way to send one of those twice in the same day, and
 * the nearest working thing was a personal Gmail account. That is the wrong
 * sender: a student who gets school mail from a private address has no way to
 * tell it from anyone pretending to be the school, and the reply lands
 * somewhere the school does not read. PR #392 built the `admin_message`
 * template; this is the screen that means it can be used without an engineer.
 *
 * WHAT IS NOT ON THIS SCREEN, AND WHY
 * -----------------------------------
 * 1. No bulk send. One recipient, chosen by name, every time. Campaigns
 *    already exist for many-at-once (/admin?tab=campaigns) and they carry the
 *    unsubscribe rules and the pacing that a bulk send needs. A free-text box
 *    wired to a list is how a school mails the wrong 40 people at midnight.
 * 2. No rich formatting. The body is sent as plain text and escaped at the
 *    other end, so what is typed is what arrives. Blank line = new paragraph.
 *    That is the whole of it.
 * 3. No template picker. Everything else on this screen would then be a worse
 *    version of the screen that owns that template.
 *
 * THE CONFIRM STEP IS THE POINT
 * -----------------------------
 * Sending is the one action here and it cannot be taken back. So the button
 * does not send: it shows the recipient's real email address, the subject, and
 * the language, and a second, different button sends. The whole cost of the
 * step is one click, and it is paid on the one action that has no undo.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import AdminShell from "@/components/admin/AdminShell";
import { Mail, Send, Search, AlertTriangle, Check, X } from "lucide-react";

type Person = {
  id: string;
  name: string | null;
  email: string | null;
  language: string | null;
  unsubscribe_token: string | null;
  email_unsubscribed: boolean | null;
  status: string | null;
};

type LogRow = {
  id: string;
  to_email: string;
  to_name: string | null;
  status: string;
  error: string | null;
  created_at: string;
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * The same rule the template applies at the other end, so the preview is the
 * letter rather than an impression of it: blank line = paragraph, single
 * newline = line break. React escapes the text for us here; the edge function
 * escapes it for real on the way out.
 */
function paragraphs(body: string): string[][] {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split(/\n{2,}/)
    .map(b => b.trim())
    .filter(b => b.length > 0)
    .map(b => b.split("\n"));
}

const AdminMessage = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

  const loadLogs = async () => {
    const { data, error } = await supabase
      .from("email_logs")
      .select("id,to_email,to_name,status,error,created_at")
      .eq("template", "admin_message")
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) throw new Error(error.message);
    setLogs((data ?? []) as LogRow[]);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id,name,email,language,unsubscribe_token,email_unsubscribed,status")
          .not("email", "is", null)
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw new Error(error.message);
        if (!alive) return;
        setPeople((data ?? []) as Person[]);
        await loadLogs();
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Unknown error.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 107 profiles today, 500 at the cap — small enough that the whole list is
  // already here and the filter is instant. A server-side search would add a
  // round trip per keystroke to save nothing.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return people
      .filter(p =>
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, people]);

  const pick = (p: Person) => {
    setSelected(p);
    setQuery("");
    setConfirming(false);
    // Her own recorded language, not a guess. It was a column default nobody
    // ever wrote until 14 Sep, so it is now worth trusting — and still worth
    // being able to override in one click.
    setLang(p.language === "en" ? "en" : "ar");
  };

  const ready = !!selected?.email && subject.trim().length > 0 && body.trim().length > 0;

  const send = async () => {
    if (!selected?.email || !ready) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          email: selected.email,
          name: selected.name || selected.email,
          language: lang,
          template: "admin_message",
          subject: subject.trim(),
          body,
          unsubscribe_token: selected.unsubscribe_token ?? undefined,
        },
      });
      if (error) throw new Error(error.message);
      // A 200 with `success: false` has never happened on this function, but
      // reading only `error` is exactly how three past bugs stayed invisible.
      if (data && (data as { error?: string }).error) {
        throw new Error((data as { error: string }).error);
      }
      toast({ title: "Sent", description: `${selected.name || selected.email} — ${subject.trim()}` });
      setSubject("");
      setBody("");
      setConfirming(false);
      await loadLogs();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Not sent",
        description: e instanceof Error ? e.message : "Unknown error.",
      });
    } finally {
      setSending(false);
    }
  };

  const preview = paragraphs(body);
  const isAr = lang === "ar";

  return (
    <AdminShell activeId="message">
      <main id="main-content">
        <div className="mx-auto w-full max-w-4xl px-5 py-8 space-y-6">

          <header className="space-y-1">
            <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
              <Mail className="h-7 w-7" /> Write a letter
            </h1>
            <p className="text-sm text-muted-foreground">
              One student, one message, sent from the Klovers address — signed by the domain and
              recorded in the email log like every other letter. For anything that already has a
              template, use the screen that owns it.
            </p>
          </header>

          {loadError && (
            <Card className="border-destructive">
              <CardContent className="p-5 text-sm">
                <span className="font-semibold text-destructive">Could not load.</span>{" "}
                <span className="text-muted-foreground">{loadError}</span>
              </CardContent>
            </Card>
          )}

          {loading && !loadError && <Skeleton className="h-40 rounded-lg" />}

          {!loading && !loadError && (
            <>
              {/* WHO */}
              <Card>
                <CardContent className="p-5 space-y-3">
                  <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground">TO</p>

                  {selected ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{selected.name || "(no name)"}</p>
                        <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {selected.status && <Badge variant="secondary">{selected.status}</Badge>}
                        {selected.email_unsubscribed && (
                          <Badge variant="outline" className="border-amber-500 text-amber-700">
                            <AlertTriangle className="mr-1 h-3 w-3" /> unsubscribed
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => { setSelected(null); setConfirming(false); }}
                        >
                          <X className="mr-1 h-3.5 w-3.5" /> Change
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={query}
                          onChange={e => setQuery(e.target.value)}
                          placeholder="Search by name or email…"
                          className="pl-9"
                        />
                      </div>
                      {query.trim() && matches.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Nobody matches that. Only people with an account are listed here.
                        </p>
                      )}
                      {matches.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => pick(p)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{p.name || "(no name)"}</span>
                            <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                          </span>
                          <Badge variant="outline" className="shrink-0">
                            {p.language === "en" ? "EN" : "AR"}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {selected?.email_unsubscribed && (
                    <p className="text-xs text-amber-700">
                      She has unsubscribed from Klovers email. A letter about her own class is still
                      a fair thing to send — a newsletter is not.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* WHAT */}
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground">MESSAGE</p>
                    <div className="flex gap-1">
                      {(["ar", "en"] as const).map(l => (
                        <Button
                          key={l}
                          size="sm"
                          variant={lang === l ? "default" : "outline"}
                          className="h-7 px-3 text-xs"
                          onClick={() => { setLang(l); setConfirming(false); }}
                        >
                          {l === "ar" ? "العربية" : "English"}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Input
                    value={subject}
                    onChange={e => { setSubject(e.target.value); setConfirming(false); }}
                    placeholder="Subject"
                    dir={isAr ? "rtl" : "ltr"}
                  />

                  <Textarea
                    value={body}
                    onChange={e => { setBody(e.target.value); setConfirming(false); }}
                    placeholder={isAr ? "اكتبي الرسالة هنا…" : "Write the message here…"}
                    dir={isAr ? "rtl" : "ltr"}
                    rows={10}
                    className="resize-y"
                  />

                  <p className="text-xs text-muted-foreground">
                    The greeting ({isAr ? `أهلاً ${selected?.name || "…"}` : `Hi ${selected?.name || "…"}`}),
                    the signature and the Klovers header are added automatically — no need to type them.
                    A blank line starts a new paragraph. Links and formatting are not supported: what is
                    typed is what arrives.
                  </p>
                </CardContent>
              </Card>

              {/* PREVIEW */}
              {preview.length > 0 && (
                <Card>
                  <CardContent className="p-5 space-y-3">
                    <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                      WHAT SHE WILL READ
                    </p>
                    <div
                      dir={isAr ? "rtl" : "ltr"}
                      className="rounded-lg border bg-muted/40 p-5 text-sm leading-relaxed"
                    >
                      <p className="mb-4 text-lg font-bold">
                        {isAr ? `أهلاً ${selected?.name || "…"} 👋` : `Hi ${selected?.name || "…"} 👋`}
                      </p>
                      {preview.map((lines, i) => (
                        <p key={i} className="mb-4 whitespace-pre-line">
                          {lines.join("\n")}
                        </p>
                      ))}
                      <p className="text-muted-foreground">
                        {isAr ? "ريهام الشرقاوي" : "Reham Elshrkawy"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SEND */}
              <Card className={confirming ? "border-foreground" : undefined}>
                <CardContent className="p-5 space-y-3">
                  {!confirming ? (
                    <Button
                      className="w-full"
                      disabled={!ready}
                      onClick={() => setConfirming(true)}
                    >
                      <Send className="mr-2 h-4 w-4" /> Review and send
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm">
                        This will send <span className="font-semibold">“{subject.trim()}”</span> to{" "}
                        <span className="font-semibold">{selected?.name || "—"}</span> at{" "}
                        <span className="font-mono text-xs">{selected?.email}</span>, in{" "}
                        {isAr ? "Arabic" : "English"}, from the Klovers address.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Email cannot be recalled once it is sent.
                      </p>
                      <div className="flex gap-2">
                        <Button className="flex-1" disabled={sending} onClick={() => { void send(); }}>
                          <Check className="mr-2 h-4 w-4" />
                          {sending ? "Sending…" : "Yes, send it"}
                        </Button>
                        <Button variant="outline" disabled={sending} onClick={() => setConfirming(false)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}
                  {!ready && !confirming && (
                    <p className="text-xs text-muted-foreground">
                      A recipient, a subject and a message are all needed before this can send.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* LOG */}
              <section className="space-y-3">
                <h2 className="text-xs font-bold tracking-[0.08em] text-muted-foreground">
                  LETTERS SENT FROM THIS SCREEN
                </h2>
                {logs.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-sm text-muted-foreground">
                      None yet. Anything sent here appears in the email log with everything else.
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0 divide-y">
                      {logs.map(l => (
                        <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{l.to_name || l.to_email}</p>
                            <p className="truncate text-xs text-muted-foreground">{l.to_email}</p>
                            {l.error && <p className="truncate text-xs text-destructive">{l.error}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={l.status === "sent" ? "secondary" : "outline"}
                              className={l.status === "sent" ? undefined : "border-destructive text-destructive"}>
                              {l.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{when(l.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </section>
            </>
          )}

        </div>
      </main>
    </AdminShell>
  );
};

export default AdminMessage;
