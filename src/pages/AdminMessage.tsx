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
 * WHO IS IN THE LIST
 * ------------------
 * Everyone Klovers holds an email address for, from all three places it keeps
 * one: `profiles` (107), `leads` (127) and `trial_bookings` (60), merged on the
 * lowercased address. The first version read `profiles` alone, and 21 people
 * — someone who asked about a trial and never made an account — were simply
 * unreachable from this screen without anyone being told why. A row is tagged
 * by where it was found, because "student" and "asked once in August" are
 * different people to write to.
 *
 * Only `profiles` carries a language, so a lead gets Arabic by default (one
 * click to change). Since migration 20260916113000 a LEAD also carries its own
 * `unsubscribe_token` and `email_unsubscribed`, and both are read here — until
 * then a lead who had opted out looked identical to one who never had, on the
 * one screen where a person decides whether to write to her. A trial booking
 * still has neither, so its footer falls back to the public unsubscribe page,
 * which is what that page is for.
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

type Source = "student" | "lead" | "trial";

type Person = {
  /** The lowercased email. It is what the three tables are merged on. */
  id: string;
  name: string | null;
  email: string;
  language: string | null;
  unsubscribe_token: string | null;
  email_unsubscribed: boolean | null;
  status: string | null;
  source: Source;
};

const SOURCE_LABEL: Record<Source, string> = {
  student: "student",
  lead: "lead",
  trial: "trial",
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

/**
 * Resend enforces 10 requests/second. On 14 Sep 2026 a 21-recipient batch
 * sent through this screen's earlier bulk-send path fired every call at
 * once; 8 of the 21 came back `429 rate_limit_exceeded` on the first try
 * (all 8 recovered on a manual retry that time — see
 * EmailDeliveryPanel.tsx / claude/EMAIL_SYSTEM_AUDIT_2026-09-14.md). Bulk
 * sending was later removed from this screen in favour of Campaigns, but a
 * single send here can still land inside someone else's burst (another
 * admin sending, a cron reminder firing), so a lone 429 still gets one
 * automatic retry before it is ever shown to the admin as a failure.
 */
async function isRateLimitedError(error: unknown): Promise<boolean> {
  if (!error) return false;
  const err = error as { context?: Response; message?: string };
  if (err.context && typeof err.context.json === "function") {
    try {
      const body = await err.context.clone().json();
      if (typeof body?.error === "string" && /429|rate_limit_exceeded/i.test(body.error)) return true;
    } catch {
      // Not JSON, or the body was already consumed — fall through to the
      // message check below.
    }
  }
  return typeof err.message === "string" && /429|rate_limit_exceeded/i.test(err.message);
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
        // Three reads, not one. Order matters only for the merge below.
        const [profileRes, leadRes, trialRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("name,email,language,unsubscribe_token,email_unsubscribed,status,created_at")
            .not("email", "is", null)
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("leads")
            .select("name,email,status,created_at,unsubscribe_token,email_unsubscribed")
            .not("email", "is", null)
            .order("created_at", { ascending: false })
            .limit(1000),
          supabase
            .from("trial_bookings")
            .select("name,email,status,created_at")
            .not("email", "is", null)
            .order("created_at", { ascending: false })
            .limit(1000),
        ]);
        if (profileRes.error) throw new Error(profileRes.error.message);
        if (leadRes.error) throw new Error(leadRes.error.message);
        if (trialRes.error) throw new Error(trialRes.error.message);
        if (!alive) return;

        // A profile wins over a lead and a lead over a trial booking, because
        // the profile is the only row that knows her language. Same person,
        // best record. Both of the first two carry an unsubscribe token and an
        // opt-out flag of their own.
        const byEmail = new Map<string, Person>();
        type Row = {
          name?: string | null;
          email?: string | null;
          status?: string | null;
          language?: string | null;
          unsubscribe_token?: string | null;
          email_unsubscribed?: boolean | null;
        };
        const add = (row: Row, source: Source, extra?: Partial<Person>) => {
          const email = (row.email ?? "").trim();
          const key = email.toLowerCase();
          if (!key) return;
          const existing = byEmail.get(key);
          if (existing) {
            // Keep the stronger record, but take a name from the weaker one
            // when the stronger has none — a lead row is often the only place
            // the name was ever typed.
            if (!existing.name && row.name) existing.name = row.name;
            // An opt-out anywhere is an opt-out. If the same address said no
            // as a lead and the profile row has not been flagged, the honest
            // reading is still "she asked us to stop".
            if (!existing.email_unsubscribed && row.email_unsubscribed) {
              existing.email_unsubscribed = true;
            }
            return;
          }
          byEmail.set(key, {
            id: key,
            name: row.name ?? null,
            email,
            language: null,
            unsubscribe_token: null,
            email_unsubscribed: null,
            status: row.status ?? null,
            source,
            ...extra,
          });
        };
        ((profileRes.data ?? []) as Row[]).forEach(r =>
          add(r, "student", {
            language: r.language ?? null,
            unsubscribe_token: r.unsubscribe_token ?? null,
            email_unsubscribed: r.email_unsubscribed ?? null,
          }));
        ((leadRes.data ?? []) as Row[]).forEach(r =>
          add(r, "lead", {
            unsubscribe_token: r.unsubscribe_token ?? null,
            email_unsubscribed: r.email_unsubscribed ?? null,
          }));
        ((trialRes.data ?? []) as Row[]).forEach(r => add(r, "trial"));

        setPeople(
          [...byEmail.values()].sort((a, b) =>
            (a.name || a.email).localeCompare(b.name || b.email, "en")),
        );
        await loadLogs();
      } catch (e) {
        if (alive) setLoadError(e instanceof Error ? e.message : "Unknown error.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // ~128 people today — small enough that the whole list is already here and
  // the filter is instant. A server-side search would add a round trip per
  // keystroke to save nothing.
  //
  // The list shows with NO query typed, which is the point: the first version
  // showed nothing until something was typed, so the only way to write to
  // someone was to already know their name. A list you can scroll is also how
  // you notice the person you meant was never in it.
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(p =>
      (p.name ?? "").toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q));
  }, [query, people]);

  const pick = (p: Person) => {
    setSelected(p);
    setQuery("");
    setConfirming(false);
    // Her own recorded language, not a guess. It was a column default nobody
    // ever wrote until 14 Sep, so it is now worth trusting — and still worth
    // being able to override in one click.
    // A lead has no recorded language at all, so Arabic is the default and
    // the toggle is one click away.
    setLang(p.language === "en" ? "en" : "ar");
  };

  const ready = !!selected && subject.trim().length > 0 && body.trim().length > 0;

  const send = async () => {
    if (!selected || !ready) return;
    setSending(true);
    try {
      const requestBody = {
        email: selected.email,
        name: selected.name || selected.email,
        language: lang,
        template: "admin_message",
        subject: subject.trim(),
        body,
        unsubscribe_token: selected.unsubscribe_token ?? undefined,
      };
      let { data, error } = await supabase.functions.invoke("send-confirmation-email", {
        body: requestBody,
      });
      // See isRateLimitedError above: one automatic retry for a 429 before it
      // reaches the admin as a failure — the fix for the 14 Sep incident.
      if (error && (await isRateLimitedError(error))) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        ({ data, error } = await supabase.functions.invoke("send-confirmation-email", {
          body: requestBody,
        }));
      }
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
                        <Badge variant="secondary">{SOURCE_LABEL[selected.source]}</Badge>
                        {selected.status && <Badge variant="outline">{selected.status}</Badge>}
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
                          placeholder="Filter by name or email…"
                          className="pl-9"
                          // Chrome read this box as an address field and covered
                          // the list with its own saved-email popup. It is not an
                          // address field: nothing here is ever typed to be
                          // submitted as the admin's own details.
                          name="klovers-recipient-filter"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                          data-lpignore="true"
                          data-1p-ignore="true"
                        />
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {matches.length} of {people.length} — everyone Klovers has an email for,
                        whether or not they ever made an account.
                      </p>

                      {matches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nobody matches that.</p>
                      ) : (
                        <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-1">
                          {matches.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => pick(p)}
                              className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                            >
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{p.name || "(no name)"}</span>
                                <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-1">
                                {p.email_unsubscribed && (
                                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                                    unsub
                                  </Badge>
                                )}
                                <Badge variant="secondary">{SOURCE_LABEL[p.source]}</Badge>
                                <Badge variant="outline">{p.language === "en" ? "EN" : "AR"}</Badge>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
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
                        This will send <span className="font-semibold">"{subject.trim()}"</span> to{" "}
                        <span className="font-semibold">{selected?.name || "—"}</span> at{" "}
                        <span className="font-mono text-xs">{selected?.email}</span>, in{" "}
                        {isAr ? "Arabic" : "English"}, from the Klovers address.
                      </p>
                      {selected?.email_unsubscribed && (
                        <p className="text-sm font-semibold text-amber-700">
                          She has unsubscribed. Send this only if it is about her own class.
                        </p>
                      )}
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
