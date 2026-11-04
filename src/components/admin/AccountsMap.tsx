import { useCallback, useEffect, useMemo, useState, useId, isValidElement, cloneElement, type ReactElement, type ReactNode } from "react";
import { Copy, ExternalLink, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Admin → Connectors (the accounts map).
 *
 * Re, 1 Oct 2026: one map of every account Klovers runs on, grouped by the
 * login that opens it — which email goes with GitHub, Vercel, Resend, GA4...
 *
 * The rows live in public.admin_accounts_map (admin-only RLS), NOT in this
 * file: anything written into src/ ships in the public JavaScript bundle,
 * admin route or not, and login emails do not belong there.
 *
 * Never passwords, keys or tokens. The editor refuses text that looks like
 * one (see looksLikeSecret) — the map says WHICH login, never the secret.
 */

type Status = "active" | "watch" | "closed";

interface AccountRow {
  id: string;
  service: string;
  login: string;
  detail: string;
  url: string | null;
  status: Status;
  sort_order: number;
  updated_at: string;
}

const NOT_RECORDED = "Login not recorded";

const STATUS_LABEL: Record<Status, string> = {
  active: "In use",
  watch: "Needs attention",
  closed: "Closed",
};

// Group lifecycle colours, same as the admin groups screen: green = running,
// yellow = needs attention, muted = closed.
const STATUS_DOT: Record<Status, string> = {
  active: "bg-klovers-green border border-charcoal",
  watch: "bg-klovers-yellow border border-charcoal",
  closed: "bg-muted-foreground/40",
};

// Things a login field must never contain. Cheap, deliberately broad.
const SECRET_PATTERNS = [
  /password|passwd|pwd\s*[:=]/i,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{8,}/, // Stripe keys
  /\bsbp_[A-Za-z0-9]{10,}/,                   // Supabase access token
  /\bre_[A-Za-z0-9]{16,}/,                    // Resend key
  /\bsk-[A-Za-z0-9_-]{16,}/,                  // OpenAI key
  /\bgh[pousr]_[A-Za-z0-9]{20,}/,             // GitHub token
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/, // JWT
];
const looksLikeSecret = (s: string) => SECRET_PATTERNS.some((re) => re.test(s));

const EMPTY: Omit<AccountRow, "id" | "updated_at"> = {
  service: "", login: "", detail: "", url: "", status: "active", sort_order: 100,
};

export default function AccountsMap() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [editing, setEditing] = useState<(Omit<AccountRow, "id" | "updated_at"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const db = supabase as any; // table is newer than the generated types

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db
      .from("admin_accounts_map")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("service", { ascending: true });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === "42P01" || code === "PGRST205") setMissingTable(true);
      else toast({ title: "Could not load the accounts map", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setMissingTable(false);
      setRows((data ?? []) as AccountRow[]);
    }
    setLoading(false);
  }, [db]);

  useEffect(() => { void load(); }, [load]);

  // One branch per login; closed accounts on their own branch at the end.
  // Filter: "github" keeps only the GitHub accounts, with their login on top.
  const q = query.trim().toLowerCase();
  const matches = useCallback(
    (r: AccountRow) => !q || [r.service, r.login, r.detail].some((v) => v.toLowerCase().includes(q)),
    [q],
  );

  const branches = useMemo(() => {
    const open = rows.filter((r) => r.status !== "closed" && matches(r));
    const map = new Map<string, AccountRow[]>();
    for (const r of open) {
      const key = r.login.trim() || NOT_RECORDED;
      map.set(key, [...(map.get(key) ?? []), r]);
    }
    const list = [...map.entries()].map(([login, items]) => ({
      login,
      items,
      order: Math.min(...items.map((i) => i.sort_order)),
      unknown: login === NOT_RECORDED,
    }));
    list.sort((a, b) => a.order - b.order);
    const closed = rows.filter((r) => r.status === "closed" && matches(r));
    return { list, closed };
  }, [rows, matches]);

  // Quick filters: one per platform family (first word of the name).
  const quick = useMemo(() => {
    const seen = new Set<string>();
    for (const r of rows) {
      if (r.status === "closed") continue;
      seen.add(r.service.split(/[\s·(]/)[0]);
    }
    return [...seen].filter(Boolean);
  }, [rows]);

  const counts = useMemo(() => {
    const open = rows.filter((r) => r.status !== "closed");
    return {
      total: open.length,
      logins: new Set(open.map((r) => r.login.trim()).filter(Boolean)).size,
      unknown: open.filter((r) => !r.login.trim()).length,
      watch: rows.filter((r) => r.status === "watch").length,
    };
  }, [rows]);

  const save = async () => {
    if (!editing) return;
    const payload = {
      service: editing.service.trim(),
      login: editing.login.trim(),
      detail: editing.detail.trim(),
      url: editing.url?.trim() || null,
      status: editing.status,
      sort_order: Number.isFinite(editing.sort_order) ? editing.sort_order : 100,
      updated_at: new Date().toISOString(),
    };
    if (!payload.service) {
      toast({ title: "Service name is required", variant: "destructive" });
      return;
    }
    if ([payload.login, payload.detail, payload.url ?? ""].some(looksLikeSecret)) {
      toast({
        title: "That looks like a password or key",
        description: "The map keeps only which login opens each account. Keep passwords and keys in a password manager.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = editing.id
      ? await db.from("admin_accounts_map").update(payload).eq("id", editing.id)
      : await db.from("admin_accounts_map").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Not saved", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(null);
    void load();
  };

  const remove = async () => {
    if (!editing?.id) return;
    if (!window.confirm(`Remove ${editing.service} from the map?`)) return;
    setSaving(true);
    const { error } = await db.from("admin_accounts_map").delete().eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Not removed", description: error.message, variant: "destructive" });
      return;
    }
    setEditing(null);
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading connectors
      </div>
    );
  }

  if (missingTable) {
    return (
      <div role="status" className="rounded-xl border-2 border-klovers-yellow bg-ivory p-5 text-sm text-charcoal">
        <p className="font-semibold">Connectors are not set up yet.</p>
        <p className="mt-1">It appears once the admin_accounts_map migration has been applied (Apply Migrations: plan, then apply).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Connectors</h2>
          <p className="text-sm text-muted-foreground">
            Which login opens which platform. Logins only: passwords and keys never go here.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Add account
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Chip>{counts.total} accounts</Chip>
        <Chip>{counts.logins} logins</Chip>
        {counts.unknown > 0 && <Chip tone="watch">{counts.unknown} without a recorded login</Chip>}
        {counts.watch > 0 && <Chip tone="watch">{counts.watch} need attention</Chip>}
      </div>

      <div className="space-y-2">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter: github, stripe, gmail..."
            className="pl-9 pr-9"
            aria-label="Filter accounts"
          />
          {query && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Clear filter"
              onClick={() => setQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quick.map((name) => {
            const on = q === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => setQuery(on ? "" : name)}
                aria-pressed={on}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  on ? "border-charcoal bg-klovers-yellow text-charcoal" : "border-border bg-background text-foreground hover:bg-muted",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {q && branches.list.length === 0 && branches.closed.length === 0 && (
        <p className="text-sm text-muted-foreground">No account matches "{query.trim()}".</p>
      )}

      {/* The map: hub → one branch per login → the accounts it opens */}
      <div className="relative" data-testid="accounts-tree">
        <div className="flex justify-center">
          <div className="relative z-10 rounded-full border-2 border-charcoal bg-klovers-yellow px-6 py-2 font-display text-lg font-bold text-charcoal shadow-sm">
            Klovers
          </div>
        </div>
        {/* trunk */}
        <div className="mx-auto h-6 w-0.5 bg-charcoal/60" aria-hidden />
        {/* bar the branches hang from (desktop) */}
        <div className="mx-[8%] hidden h-0.5 bg-charcoal/60 md:block" aria-hidden />

        <div className="grid gap-x-5 gap-y-8 pt-0 md:grid-cols-2 md:pt-6 xl:grid-cols-3">
          {branches.list.map((b) => (
            <Branch
              key={b.login}
              login={b.login}
              unknown={b.unknown}
              items={b.items}
              onEdit={(r) => setEditing({ ...r, url: r.url ?? "" })}
            />
          ))}
        </div>
      </div>

      {branches.closed.length > 0 && (
        <div className="rounded-xl border border-dashed border-muted-foreground/40 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Closed</p>
          <ul className="space-y-1.5">
            {branches.closed.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium line-through">{r.service}</span>
                  {r.detail && <span> · {r.detail}</span>}
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`Edit ${r.service}`}
                  onClick={() => setEditing({ ...r, url: r.url ?? "" })}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing?.id ? `Edit ${editing.service}` : "Add account"}</DialogTitle>
            <DialogDescription>Logins only. Passwords and keys stay in a password manager.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <Field label="Platform">
                <Input value={editing.service} onChange={(e) => setEditing({ ...editing, service: e.target.value })} placeholder="e.g. Stripe" />
              </Field>
              <Field label="Login (email or account name)">
                <Input
                  value={editing.login}
                  onChange={(e) => setEditing({ ...editing, login: e.target.value })}
                  placeholder="e.g. name@gmail.com"
                  autoComplete="off"
                />
              </Field>
              <Field label="What it is for">
                <Textarea rows={3} value={editing.detail} onChange={(e) => setEditing({ ...editing, detail: e.target.value })} />
              </Field>
              <Field label="Link">
                <Input value={editing.url ?? ""} onChange={(e) => setEditing({ ...editing, url: e.target.value })} placeholder="https://" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Status">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.status}
                    onChange={(e) => setEditing({ ...editing, status: e.target.value as Status })}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Order">
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value, 10) || 0 })}
                  />
                </Field>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            {editing?.id ? (
              <Button variant="ghost" size="sm" onClick={remove} disabled={saving}>
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            ) : <span />}
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Branch({
  login, unknown, items, onEdit,
}: { login: string; unknown: boolean; items: AccountRow[]; onEdit: (r: AccountRow) => void }) {
  return (
    <div className="relative">
      {/* drop line from the bar to this branch (desktop) */}
      <div className="absolute -top-6 left-1/2 hidden h-6 w-0.5 -translate-x-1/2 bg-charcoal/60 md:block" aria-hidden />
      <div
        className={cn(
          "rounded-xl border-2 bg-card p-4",
          unknown ? "border-klovers-yellow" : "border-charcoal",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Login</p>
        <div className="flex items-start justify-between gap-2">
          <p className={cn("break-all font-display text-sm font-bold", unknown ? "text-muted-foreground" : "text-foreground")}>
            {login}
          </p>
          {!unknown && (
            <button
              type="button"
              className="shrink-0 rounded p-1 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`Copy ${login}`}
              onClick={() => {
                void navigator.clipboard?.writeText(login).then(
                  () => toast({ title: "Copied", description: login }),
                  () => toast({ title: "Could not copy", variant: "destructive" }),
                );
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <ul className="mt-3 space-y-3 border-l-2 border-charcoal/40 pl-4">
          {items.map((r) => (
            <li key={r.id} className="relative">
              {/* twig from the branch line to the account */}
              <span className="absolute -left-4 top-2.5 h-0.5 w-3 bg-charcoal/40" aria-hidden />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", STATUS_DOT[r.status])} title={STATUS_LABEL[r.status]} />
                    {r.service}
                  </p>
                  {r.detail && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{r.detail}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-foreground hover:bg-muted"
                      aria-label={`Open ${r.service}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    className="rounded p-1 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Edit ${r.service}`}
                    onClick={() => onEdit(r)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const fieldId = useId();
  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId} className="text-xs">{label}</Label>
      {isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id: fieldId }) : children}
    </div>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "watch" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-1 font-medium",
        tone === "watch" ? "border-charcoal bg-klovers-yellow text-charcoal" : "border-border bg-muted text-foreground",
      )}
    >
      {children}
    </span>
  );
}
