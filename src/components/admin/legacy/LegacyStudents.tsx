/**
 * Legacy Data -> Students: searchable table of historical students, a detail
 * drawer, and the manual Link Account flow.
 *
 * A legacy student needs no account, email or password. Linking to a
 * registered account is always an explicit admin choice with a confirmation;
 * nothing is matched by name.
 */
import { useEffect, useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ADMIN_PAGE_SIZE } from "@/lib/admin-utils";
import {
  LEGACY_YEARS, legacyErrorMessage, searchAccounts, useLegacyAggregates, useLegacyIssues,
  useLegacyMonthly, useLegacyStudents, useLinkAccount, useUnlinkAccount,
  type AccountMatch, type LegacyStudentSummary,
} from "@/hooks/admin/useLegacyData";
import {
  AccountChip, EmptyState, ErrorState, ISSUE_CATEGORY_LABEL, IssueStatusChip, LoadingRows,
  Pager, PriceSourceChip, SourceLine, egp, monthText,
} from "./legacyUi";

type YearFilter = "all" | `${(typeof LEGACY_YEARS)[number]}`;

const sessionsIn = (s: LegacyStudentSummary, y: number) =>
  (s as unknown as Record<string, number>)[`sessions_${y}`] ?? 0;

const LegacyStudents = () => {
  const { data, isLoading, error, refetch } = useLegacyStudents();
  const [q, setQ] = useState("");
  const [year, setYear] = useState<YearFilter>("all");
  const [account, setAccount] = useState<"all" | "linked" | "unlinked">("all");
  const [issues, setIssues] = useState<"all" | "with" | "without">("all");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      if (needle && !s.display_name.toLowerCase().includes(needle)
        && !s.original_names.some((n) => n.toLowerCase().includes(needle))
        && !(s.linked_email ?? "").toLowerCase().includes(needle)) return false;
      if (year !== "all" && sessionsIn(s, Number(year)) === 0 && !s.years_active.includes(Number(year))) return false;
      if (account === "linked" && !s.auth_user_id) return false;
      if (account === "unlinked" && s.auth_user_id) return false;
      if (issues === "with" && s.open_issues === 0) return false;
      if (issues === "without" && s.open_issues > 0) return false;
      return true;
    });
  }, [data, q, year, account, issues]);

  useEffect(() => { setPage(0); }, [q, year, account, issues]);

  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const visible = rows.slice(page * ADMIN_PAGE_SIZE, (page + 1) * ADMIN_PAGE_SIZE);
  const selected = (data ?? []).find((s) => s.id === openId) ?? null;

  if (isLoading) return <LoadingRows />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if ((data ?? []).length === 0) {
    return <EmptyState title="No legacy students yet" body="They appear here after an import is approved in the Import tab." />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="relative md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, spelling or email" className="pl-8" aria-label="Search students" />
        </div>
        <div className="grid grid-cols-3 gap-2 md:flex">
          <Select value={year} onValueChange={(v) => setYear(v as YearFilter)}>
            <SelectTrigger className="md:w-32" aria-label="Year"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {LEGACY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={account} onValueChange={(v) => setAccount(v as typeof account)}>
            <SelectTrigger className="md:w-36" aria-label="Account status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="linked">Linked</SelectItem>
              <SelectItem value="unlinked">Unlinked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={issues} onValueChange={(v) => setIssues(v as typeof issues)}>
            <SelectTrigger className="md:w-40" aria-label="Issues"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any issues</SelectItem>
              <SelectItem value="with">With open issues</SelectItem>
              <SelectItem value="without">No open issues</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No students match these filters" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden lg:table-cell">Original name(s)</TableHead>
                  <TableHead className="hidden md:table-cell">Years active</TableHead>
                  {LEGACY_YEARS.map((y) => <TableHead key={y} className="hidden text-right xl:table-cell">{y}</TableHead>)}
                  <TableHead className="text-right">Total sessions</TableHead>
                  <TableHead className="text-right">Historical session value</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Recorded paid</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => setOpenId(s.id)}>
                    <TableCell className="font-semibold">
                      <button type="button" className="rounded-sm text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={(e) => { e.stopPropagation(); setOpenId(s.id); }}>
                        {s.display_name}
                      </button>
                    </TableCell>
                    <TableCell className="hidden max-w-[16rem] truncate text-muted-foreground lg:table-cell">{s.original_names.join(" | ")}</TableCell>
                    <TableCell className="hidden md:table-cell">{s.years_active.join(", ") || "—"}</TableCell>
                    {LEGACY_YEARS.map((y) => (
                      <TableCell key={y} className="hidden text-right tabular-nums xl:table-cell">{sessionsIn(s, y) || "—"}</TableCell>
                    ))}
                    <TableCell className="text-right tabular-nums">{s.total_sessions}</TableCell>
                    <TableCell className="text-right tabular-nums">{egp(s.historical_value)}</TableCell>
                    <TableCell className="hidden text-right tabular-nums md:table-cell">{egp(s.recorded_paid)}</TableCell>
                    <TableCell><AccountChip linked={!!s.auth_user_id} /></TableCell>
                    <TableCell className="text-right tabular-nums">{s.open_issues || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pager page={page} pageCount={pageCount} total={rows.length} onPage={setPage} />
        </>
      )}

      <LegacyStudentDrawer student={selected} onClose={() => setOpenId(null)} />
    </div>
  );
};

// ── Detail drawer ────────────────────────────────────────────────────────────────────────

const LegacyStudentDrawer = ({ student, onClose }: { student: LegacyStudentSummary | null; onClose: () => void }) => {
  const monthly = useLegacyMonthly();
  const aggregates = useLegacyAggregates();
  const issues = useLegacyIssues();
  const unlink = useUnlinkAccount();
  const [linkOpen, setLinkOpen] = useState(false);

  const mine = useMemo(() => {
    if (!student) return null;
    return {
      monthly: (monthly.data ?? []).filter((m) => m.legacy_student_id === student.id),
      aggregates: (aggregates.data ?? []).filter((a) => a.legacy_student_id === student.id),
      issues: (issues.data ?? []).filter((i) => i.legacy_student_id === student.id),
    };
  }, [student, monthly.data, aggregates.data, issues.data]);

  const prices = useMemo(() => {
    const set = new Map<string, number>();
    for (const m of mine?.monthly ?? []) {
      if (m.price_per_class !== null && !m.excluded) {
        const k = `${m.price_per_class} (${m.price_source === "explicit" ? "written" : "default"})`;
        set.set(k, (set.get(k) ?? 0) + 1);
      }
    }
    for (const a of mine?.aggregates ?? []) {
      if (a.kind === "yearly_total" && a.price_per_session !== null) {
        const k = `${a.price_per_session} (${a.price_source === "explicit" ? "written" : "default"})`;
        set.set(k, (set.get(k) ?? 0) + 1);
      }
    }
    return Array.from(set.keys());
  }, [mine]);

  const doUnlink = async () => {
    if (!student) return;
    try {
      await unlink.mutateAsync(student.id);
      toast({ title: "Account unlinked", description: student.display_name });
    } catch (e) {
      toast({ title: "Could not unlink", description: legacyErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <Sheet open={!!student} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {student && mine && (
          <>
            <SheetHeader>
              <SheetTitle>{student.display_name}</SheetTitle>
              <SheetDescription>
                Original spellings: {student.original_names.join(" | ") || "—"}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-5 text-sm">
              <section className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AccountChip linked={!!student.auth_user_id} />
                    {student.auth_user_id
                      ? <span>{student.linked_name ?? "Account"} · {student.linked_email ?? "—"}</span>
                      : <span className="text-muted-foreground">No account. Not required.</span>}
                  </div>
                  {student.auth_user_id
                    ? <Button variant="outline" size="sm" onClick={doUnlink} disabled={unlink.isPending}>Unlink</Button>
                    : <Button size="sm" onClick={() => setLinkOpen(true)}>Link Account</Button>}
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-bold">Summary</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
                  <dt className="text-muted-foreground">Years active</dt><dd className="sm:col-span-2">{student.years_active.join(", ") || "—"}</dd>
                  {LEGACY_YEARS.map((y) => (
                    <FragmentRow key={y} label={`${y} sessions`} value={String(sessionsIn(student, y))} />
                  ))}
                  <FragmentRow label="Historical session charges" value={egp(student.historical_value)} />
                  <FragmentRow label="Recorded payments" value={egp(student.recorded_paid)} />
                  <FragmentRow label="Late (not charged)" value={String(student.late_unresolved)} />
                  <FragmentRow label="Historical prices" value={prices.join(", ") || "—"} />
                </dl>
                <p className="mt-2 text-xs text-muted-foreground">
                  Charges are sessions × price. They are not payments. Balances are shown only where the old sheet stated one.
                </p>
              </section>

              {mine.aggregates.length > 0 && (
                <section>
                  <h3 className="mb-2 font-bold">Yearly totals (no monthly detail exists)</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Year</TableHead><TableHead className="text-right">Sessions</TableHead>
                          <TableHead className="text-right">Value</TableHead><TableHead>Price</TableHead><TableHead>Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mine.aggregates.map((a) => (
                          <TableRow key={a.id} className={a.kind === "master_check" ? "text-muted-foreground" : ""}>
                            <TableCell>{a.year}{a.kind === "master_check" ? " (check only)" : ""}</TableCell>
                            <TableCell className="text-right tabular-nums">{a.counted_sessions}</TableCell>
                            <TableCell className="text-right tabular-nums">{egp(a.session_value)}</TableCell>
                            <TableCell>{a.kind === "master_check" ? "—" : <PriceSourceChip source={a.price_source} />}</TableCell>
                            <TableCell><SourceLine sheet={a.source_sheet} row={a.source_row} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              {mine.monthly.length > 0 && (
                <section>
                  <h3 className="mb-2 font-bold">Monthly records</h3>
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead><TableHead className="text-right">Counted</TableHead>
                          <TableHead className="text-right">Price</TableHead><TableHead className="text-right">Charges</TableHead>
                          <TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Stated balance</TableHead>
                          <TableHead>Original statuses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mine.monthly.map((m) => (
                          <TableRow key={m.id} className={m.excluded ? "text-muted-foreground line-through" : ""}>
                            <TableCell className="whitespace-nowrap">
                              {monthText(m.month_label, m.month, m.year)}
                              <div><SourceLine file={m.origin_file} sheet={m.source_sheet} row={m.origin_row ?? m.source_row} /></div>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {m.present_count ?? "—"}{m.late_count ? ` (+${m.late_count} late)` : ""}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {m.price_per_class ?? "—"} <PriceSourceChip source={m.price_source} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{egp(m.session_charges)}</TableCell>
                            <TableCell className="text-right tabular-nums">{egp(m.recorded_paid)}</TableCell>
                            <TableCell className="text-right tabular-nums">{egp(m.source_balance)}</TableCell>
                            <TableCell className="max-w-[14rem] truncate text-xs">{m.raw_statuses.join(" | ") || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 font-bold">Unresolved records</h3>
                {mine.issues.length === 0 ? (
                  <p className="text-muted-foreground">None.</p>
                ) : (
                  <ul className="space-y-2">
                    {mine.issues.map((i) => (
                      <li key={i.id} className="rounded-lg border p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <IssueStatusChip status={i.status} />
                          <span className="text-xs font-semibold">{ISSUE_CATEGORY_LABEL[i.category] ?? i.category}</span>
                          <SourceLine sheet={i.source_sheet} row={i.source_row} />
                        </div>
                        <p className="mt-1">{i.problem}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <LinkAccountDialog student={student} open={linkOpen} onOpenChange={setLinkOpen} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

const FragmentRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="tabular-nums sm:col-span-2">{value}</dd>
  </>
);

// ── Link Account ─────────────────────────────────────────────────────────────────────────

const LinkAccountDialog = ({
  student, open, onOpenChange,
}: { student: LegacyStudentSummary; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AccountMatch[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<AccountMatch | null>(null);
  const link = useLinkAccount();

  useEffect(() => {
    if (!open) { setQ(""); setResults(null); setPicked(null); }
  }, [open]);

  const runSearch = async () => {
    if (q.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await searchAccounts(q.trim()));
    } catch (e) {
      toast({ title: "Search failed", description: legacyErrorMessage(e), variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const confirm = async () => {
    if (!picked) return;
    try {
      await link.mutateAsync({ legacyStudentId: student.id, userId: picked.user_id });
      toast({ title: "Account linked", description: `${student.display_name} → ${picked.name}` });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Could not link", description: legacyErrorMessage(e), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {!picked ? (
          <>
            <DialogHeader>
              <DialogTitle>Link Account</DialogTitle>
              <DialogDescription>Search registered Klovers accounts by name or email. Nothing is matched automatically.</DialogDescription>
            </DialogHeader>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void runSearch(); }}>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" aria-label="Search accounts" autoFocus />
              <Button type="submit" disabled={searching || q.trim().length < 2}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Search"}
              </Button>
            </form>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {results === null ? null : results.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No accounts found.</p>
              ) : results.map((r) => {
                const taken = !!r.linked_legacy_student_id && r.linked_legacy_student_id !== student.id;
                return (
                  <button
                    key={r.user_id}
                    type="button"
                    disabled={taken}
                    onClick={() => setPicked(r)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <span>
                      <span className="font-semibold">{r.name}</span>
                      <span className="block text-xs text-muted-foreground">{r.email}</span>
                    </span>
                    {taken && <span className="text-xs text-muted-foreground">Already linked to {r.linked_legacy_name}</span>}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm link</DialogTitle>
              <DialogDescription>
                Link {student.display_name} to {picked.name} ({picked.email})?
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              The history stays admin-only; the student does not see it. This can be undone with Unlink.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setPicked(null)}>Back</Button>
              <Button onClick={confirm} disabled={link.isPending}>
                {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Link"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LegacyStudents;
