/**
 * Small shared pieces for the Legacy Data screens: money formatting, status
 * chips, loading/empty/error states and a pager. Palette per the brand guard:
 * yellow = needs attention, klovers-green (always a fill, charcoal text) = done
 * or linked, muted = ignored, destructive only for real errors.
 */
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/admin-utils";
import { legacyErrorMessage } from "@/hooks/admin/useLegacyData";

export const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const ISSUE_CATEGORY_LABEL: Record<string, string> = {
  ambiguous_student: "Ambiguous Student",
  unknown_attendance_value: "Unknown Attendance Value",
  missing_price: "Missing Price",
  broken_source_formula: "Broken Source Formula",
  potential_duplicate: "Potential Duplicate",
  unlinked_account: "Unlinked Account",
  finance_conflict: "Finance Conflict",
  other: "Other",
};

/** EGP amount, or an em dash when the source has no figure. Never shows null as 0. */
export function egp(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return formatCurrency(Math.round(n * 100) / 100, "EGP");
}

export function monthText(label: string, month: number | null, year: number | null): string {
  const m = month ? MONTH_SHORT[month - 1] : label;
  return year ? `${m} ${year}` : `${m} (year not set)`;
}

const CHIP = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide";

export function AccountChip({ linked }: { linked: boolean }) {
  return linked
    ? <span className={`${CHIP} bg-klovers-green text-charcoal`}>Linked</span>
    : <span className={`${CHIP} bg-klovers-yellow text-charcoal`}>Unlinked</span>;
}

export function IssueStatusChip({ status }: { status: string }) {
  if (status === "resolved") return <span className={`${CHIP} bg-klovers-green text-charcoal`}>Resolved</span>;
  if (status === "ignored") return <span className={`${CHIP} bg-muted text-muted-foreground`}>Ignored</span>;
  return <span className={`${CHIP} bg-klovers-yellow text-charcoal`}>Open</span>;
}

export function PriceSourceChip({ source }: { source: string | null }) {
  if (!source) return <span className="text-muted-foreground">—</span>;
  return source === "explicit"
    ? <span className={`${CHIP} border border-foreground/30 bg-transparent`}>Written</span>
    : <span className={`${CHIP} bg-muted text-muted-foreground`}>Default 50</span>;
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function LoadingRows({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/50 p-4 text-sm">
      <p className="font-semibold text-destructive">Could not load legacy data</p>
      <p className="mt-1 text-muted-foreground">{legacyErrorMessage(error)}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm">
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 text-muted-foreground">{body}</p>}
    </div>
  );
}

export function Pager({
  page, pageCount, total, onPage,
}: { page: number; pageCount: number; total: number; onPage: (p: number) => void }) {
  if (pageCount <= 1) return <p className="pt-2 text-xs text-muted-foreground">{total} rows</p>;
  return (
    <div className="flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
      <span>{total} rows · page {page + 1} of {pageCount}</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

/** Provenance line shown to admins in drawers and detail rows. */
export function SourceLine({ file, sheet, row }: { file?: string | null; sheet?: string | null; row?: number | null }) {
  const parts = [file, sheet, row ? `row ${row}` : null].filter(Boolean);
  if (!parts.length) return null;
  return <span className="text-[11px] text-muted-foreground">{parts.join(" · ")}</span>;
}
