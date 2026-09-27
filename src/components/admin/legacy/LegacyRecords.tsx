/**
 * Legacy Data -> Sessions and Finance.
 *
 * Sessions lists every source record: monthly attendance with the ORIGINAL
 * status values, and yearly totals where only a total exists (no sessions are
 * invented from them).
 *
 * Finance keeps four things apart: price, session charge (value), amount
 * recorded as paid, and the balance the old sheet stated. Paid is never
 * derived from attendance.
 */
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ADMIN_PAGE_SIZE, exportCSV } from "@/lib/admin-utils";
import {
  LEGACY_YEARS, useLegacyAggregates, useLegacyMonthly, useLegacyStudents,
  type LegacyAggregate, type LegacyMonthlyRecord,
} from "@/hooks/admin/useLegacyData";
import {
  EmptyState, ErrorState, LoadingRows, Pager, PriceSourceChip, SourceLine, StatCard, egp, monthText,
} from "./legacyUi";

type YearFilter = "all" | "none" | string;

function useRecordData() {
  const students = useLegacyStudents();
  const monthly = useLegacyMonthly();
  const aggregates = useLegacyAggregates();
  const names = useMemo(() => new Map((students.data ?? []).map((s) => [s.id, s.display_name])), [students.data]);
  return {
    names,
    monthly: monthly.data ?? [],
    aggregates: aggregates.data ?? [],
    isLoading: students.isLoading || monthly.isLoading || aggregates.isLoading,
    error: students.error || monthly.error || aggregates.error,
    refetch: () => { students.refetch(); monthly.refetch(); aggregates.refetch(); },
  };
}

const yearMatch = (y: number | null, f: YearFilter) => f === "all" || (f === "none" ? y === null : y === Number(f));

const YearSelect = ({ value, onChange, withNone }: { value: YearFilter; onChange: (v: YearFilter) => void; withNone?: boolean }) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="md:w-36" aria-label="Year"><SelectValue /></SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All years</SelectItem>
      {LEGACY_YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
      {withNone && <SelectItem value="none">Year not set</SelectItem>}
    </SelectContent>
  </Select>
);

const SearchBox = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="relative md:w-64">
    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search student" className="pl-8" aria-label="Search student" />
  </div>
);

// ── Sessions ─────────────────────────────────────────────────────────────────────────────

export const LegacySessions = () => {
  const d = useRecordData();
  const [q, setQ] = useState("");
  const [year, setYear] = useState<YearFilter>("all");
  const [view, setView] = useState<"monthly" | "yearly">("monthly");
  const [status, setStatus] = useState<"all" | "late" | "excluded">("all");
  const [page, setPage] = useState(0);

  const monthlyRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return d.monthly.filter((m) => m.record_kind === "session_month"
      && yearMatch(m.year, year)
      && (!needle || (d.names.get(m.legacy_student_id) ?? "").toLowerCase().includes(needle))
      && (status === "all" || (status === "late" ? m.late_count > 0 : m.excluded)));
  }, [d.monthly, d.names, q, year, status]);

  const yearlyRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return d.aggregates.filter((a) => yearMatch(a.year, year)
      && (!needle || (d.names.get(a.legacy_student_id) ?? "").toLowerCase().includes(needle)));
  }, [d.aggregates, d.names, q, year]);

  useEffect(() => { setPage(0); }, [q, year, view, status]);

  if (d.isLoading) return <LoadingRows />;
  if (d.error) return <ErrorState error={d.error} onRetry={d.refetch} />;
  if (d.monthly.length === 0 && d.aggregates.length === 0) {
    return <EmptyState title="No session records yet" body="They appear after an import is approved." />;
  }

  const rows: (LegacyMonthlyRecord | LegacyAggregate)[] = view === "monthly" ? monthlyRows : yearlyRows;
  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const start = page * ADMIN_PAGE_SIZE;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <SearchBox value={q} onChange={setQ} />
        <div className="grid grid-cols-3 gap-2 md:flex">
          <Select value={view} onValueChange={(v) => setView(v as typeof view)}>
            <SelectTrigger className="md:w-44" aria-label="Record type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly records</SelectItem>
              <SelectItem value="yearly">Yearly totals</SelectItem>
            </SelectContent>
          </Select>
          <YearSelect value={year} onChange={setYear} withNone={view === "monthly"} />
          {view === "monthly" && (
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="md:w-40" aria-label="Status filter"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All records</SelectItem>
                <SelectItem value="late">With Late</SelectItem>
                <SelectItem value="excluded">Excluded rows</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {rows.length === 0 ? <EmptyState title="Nothing matches these filters" /> : view === "monthly" ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead><TableHead>Month</TableHead>
                <TableHead>Original statuses</TableHead>
                <TableHead className="text-right">Counted</TableHead><TableHead className="text-right">Late</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(monthlyRows.slice(start, start + ADMIN_PAGE_SIZE)).map((m) => (
                <TableRow key={m.id} className={m.excluded ? "text-muted-foreground" : ""}>
                  <TableCell className="font-semibold">{d.names.get(m.legacy_student_id) ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{monthText(m.month_label, m.month, m.year)}</TableCell>
                  <TableCell className="max-w-[18rem] text-xs">
                    {m.raw_statuses.join(" | ") || "—"}
                    {m.excluded && <span className="block text-[11px]">Excluded: {m.exclude_reason}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{m.present_count ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{m.late_count || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell"><SourceLine file={m.origin_file} sheet={m.source_sheet} row={m.origin_row ?? m.source_row} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead><TableHead>Year</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Counted sessions</TableHead>
                <TableHead className="hidden md:table-cell">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(yearlyRows.slice(start, start + ADMIN_PAGE_SIZE)).map((a) => (
                <TableRow key={a.id} className={a.kind === "master_check" ? "text-muted-foreground" : ""}>
                  <TableCell className="font-semibold">{d.names.get(a.legacy_student_id) ?? "—"}</TableCell>
                  <TableCell>{a.year}</TableCell>
                  <TableCell>{a.kind === "yearly_total" ? "Yearly total" : "Master check (not counted)"}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.counted_sessions}</TableCell>
                  <TableCell className="hidden md:table-cell"><SourceLine sheet={a.source_sheet} row={a.source_row} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={page} pageCount={pageCount} total={rows.length} onPage={setPage} />
      <p className="text-xs text-muted-foreground">
        Present / 1 / In = counted. 0 / O / Absent / Cancel = not counted. Late = unresolved and never charged. Blank = no record.
      </p>
    </div>
  );
};

// ── Finance ──────────────────────────────────────────────────────────────────────────────

export const LegacyFinance = () => {
  const d = useRecordData();
  const [q, setQ] = useState("");
  const [year, setYear] = useState<YearFilter>("all");
  const [price, setPrice] = useState<"all" | "explicit" | "legacy_default">("all");
  const [page, setPage] = useState(0);

  const perYear = useMemo(() => {
    type Acc = { value: number; paid: number | null; explicit: number; fallback: number };
    const map = new Map<number | null, Acc>();
    const acc = (y: number | null) => {
      if (!map.has(y)) map.set(y, { value: 0, paid: null, explicit: 0, fallback: 0 });
      return map.get(y)!;
    };
    for (const a of d.aggregates) {
      if (a.kind !== "yearly_total") continue;
      const r = acc(a.year);
      r.value += a.session_value;
      if (a.price_source === "explicit") r.explicit++; else r.fallback++;
    }
    for (const m of d.monthly) {
      if (m.excluded) continue;
      const r = acc(m.year);
      r.value += m.session_charges ?? 0;
      if (m.recorded_paid !== null) r.paid = (r.paid ?? 0) + m.recorded_paid;
      if (m.record_kind === "session_month") {
        if (m.price_source === "explicit") r.explicit++; else if (m.price_source === "legacy_default") r.fallback++;
      }
    }
    return map;
  }, [d.aggregates, d.monthly]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return d.monthly.filter((m) => !m.excluded
      && yearMatch(m.year, year)
      && (price === "all" || m.price_source === price)
      && (!needle || (d.names.get(m.legacy_student_id) ?? "").toLowerCase().includes(needle)));
  }, [d.monthly, d.names, q, year, price]);

  useEffect(() => { setPage(0); }, [q, year, price]);

  if (d.isLoading) return <LoadingRows />;
  if (d.error) return <ErrorState error={d.error} onRetry={d.refetch} />;
  if (d.monthly.length === 0 && d.aggregates.length === 0) {
    return <EmptyState title="No finance records yet" body="They appear after an import is approved." />;
  }

  const pageCount = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const start = page * ADMIN_PAGE_SIZE;
  const years: (number | null)[] = [...LEGACY_YEARS, ...(perYear.has(null) ? [null] : [])];

  const download = () => exportCSV(
    ["Student", "Month", "Year", "Kind", "Price per class", "Price source", "Counted", "Late", "Session charges", "Recorded paid", "Stated balance", "Source sheet", "Source row"],
    rows.map((m) => [d.names.get(m.legacy_student_id) ?? "", m.month_label, m.year ?? "", m.record_kind,
      m.price_per_class, m.price_source ?? "", m.present_count, m.late_count, m.session_charges,
      m.recorded_paid, m.source_balance, m.source_sheet ?? "", m.origin_row ?? m.source_row]),
    "legacy-finance",
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {years.map((y) => {
          const r = perYear.get(y);
          return (
            <StatCard
              key={String(y)}
              label={y === null ? "Year not set" : String(y)}
              value={egp(r?.value ?? 0)}
              hint={`Session value · paid ${egp(r?.paid ?? null)} · ${r?.explicit ?? 0} written / ${r?.fallback ?? 0} default prices`}
            />
          );
        })}
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <SearchBox value={q} onChange={setQ} />
        <div className="grid grid-cols-2 gap-2 md:flex">
          <YearSelect value={year} onChange={setYear} withNone />
          <Select value={price} onValueChange={(v) => setPrice(v as typeof price)}>
            <SelectTrigger className="md:w-40" aria-label="Price source"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any price</SelectItem>
              <SelectItem value="explicit">Written price</SelectItem>
              <SelectItem value="legacy_default">Default 50 EGP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="md:ml-auto" onClick={download} disabled={rows.length === 0}>Export CSV</Button>
      </div>

      {rows.length === 0 ? <EmptyState title="Nothing matches these filters" /> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead><TableHead>Month</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Counted</TableHead>
                <TableHead className="text-right">Session charges</TableHead>
                <TableHead className="text-right">Recorded paid</TableHead>
                <TableHead className="hidden text-right md:table-cell">Stated balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(start, start + ADMIN_PAGE_SIZE).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-semibold">{d.names.get(m.legacy_student_id) ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {monthText(m.month_label, m.month, m.year)}
                    {m.record_kind === "finance_only" && <span className="block text-[11px] text-muted-foreground">Payment row only</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{m.price_per_class ?? "—"} <PriceSourceChip source={m.price_source} /></TableCell>
                  <TableCell className="text-right tabular-nums">{m.present_count ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{egp(m.session_charges)}</TableCell>
                  <TableCell className="text-right tabular-nums">{egp(m.recorded_paid)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">{egp(m.source_balance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pager page={page} pageCount={pageCount} total={rows.length} onPage={setPage} />
      <p className="text-xs text-muted-foreground">
        Session charges = counted sessions × price (value, not money received). Recorded paid comes only from the sheets’ payment
        columns. Stated balance is what the old sheet itself showed; it is not recalculated.
      </p>
    </div>
  );
};
