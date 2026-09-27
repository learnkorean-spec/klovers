/**
 * Data access for the Legacy Data admin screen (historical students 2022-2025).
 *
 * Everything here reads the legacy_* tables and views created by
 * 20260928020000_legacy_data.sql. They are admin-only by RLS; every write goes
 * through an admin-only function (link, unlink, issue status, stage, commit,
 * rollback). Nothing here touches the live student, attendance or payment
 * tables.
 *
 * The generated Supabase types predate these tables, so calls are cast at the
 * call site, as elsewhere in the admin.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LegacyPayload, MonthYearMap } from "@/lib/legacy/normalizeLegacyWorkbook";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const LEGACY_YEARS = [2022, 2023, 2024, 2025] as const;

export interface LegacyStudentSummary {
  id: string;
  display_name: string;
  name_key: string;
  original_names: string[];
  auth_user_id: string | null;
  linked_at: string | null;
  linked_name: string | null;
  linked_email: string | null;
  years_active: number[];
  sessions_2022: number;
  sessions_2023: number;
  sessions_2024: number;
  sessions_2025: number;
  total_sessions: number;
  historical_value: number;
  recorded_paid: number | null;
  late_unresolved: number;
  open_issues: number;
}

export interface LegacyYearSummary {
  year: number | null;
  unique_students: number;
  counted_sessions: number;
  historical_value: number;
  recorded_paid: number | null;
  late_unresolved: number;
  unresolved_records: number;
}

export interface LegacyMonthlyRecord {
  id: string;
  legacy_student_id: string;
  record_kind: "session_month" | "finance_only";
  month_label: string;
  month: number | null;
  year: number | null;
  price_per_class: number | null;
  price_source: "explicit" | "legacy_default" | null;
  present_count: number | null;
  late_count: number;
  session_charges: number | null;
  source_session_charges: number | null;
  recorded_paid: number | null;
  source_balance: number | null;
  raw_statuses: string[];
  currency: string;
  excluded: boolean;
  exclude_reason: string | null;
  original_student_name: string | null;
  origin_file: string | null;
  origin_row: number | null;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
  import_batch_id: string | null;
  imported_at: string;
}

export interface LegacyAggregate {
  id: string;
  legacy_student_id: string;
  year: number;
  kind: "yearly_total" | "master_check";
  counted_sessions: number;
  session_value: number;
  price_per_session: number | null;
  price_source: string;
  late_unresolved: number;
  recorded_paid: number | null;
  currency: string;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
  import_batch_id: string | null;
  imported_at: string;
}

export type LegacyIssueStatus = "open" | "resolved" | "ignored";

export interface LegacyIssue {
  id: string;
  category: string;
  status: LegacyIssueStatus;
  legacy_student_id: string | null;
  student_label: string | null;
  year: number | null;
  month_label: string | null;
  source_file: string | null;
  source_sheet: string | null;
  source_row: number | null;
  problem: string;
  suggested_action: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface LegacyBatch {
  id: string;
  source_file: string;
  file_sha256: string;
  month_year_map: Record<string, number>;
  status: "staged" | "committed" | "rolled_back" | "discarded";
  summary: Record<string, unknown>;
  commit_result: Record<string, unknown> | null;
  created_at: string;
  committed_at: string | null;
  rolled_back_at: string | null;
}

export interface AccountMatch {
  user_id: string;
  name: string;
  email: string;
  linked_legacy_student_id: string | null;
  linked_legacy_name: string | null;
}

const KEY = ["admin", "legacy"] as const;

const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v));

// numeric columns arrive as strings from PostgREST; normalise once here.
function toStudent(r: Record<string, unknown>): LegacyStudentSummary {
  return {
    ...(r as unknown as LegacyStudentSummary),
    original_names: (r.original_names as string[]) ?? [],
    years_active: (r.years_active as number[]) ?? [],
    historical_value: num(r.historical_value),
    recorded_paid: numOrNull(r.recorded_paid),
  };
}

function toMonthly(r: Record<string, unknown>): LegacyMonthlyRecord {
  return {
    ...(r as unknown as LegacyMonthlyRecord),
    price_per_class: numOrNull(r.price_per_class),
    session_charges: numOrNull(r.session_charges),
    source_session_charges: numOrNull(r.source_session_charges),
    recorded_paid: numOrNull(r.recorded_paid),
    source_balance: numOrNull(r.source_balance),
    raw_statuses: (r.raw_statuses as string[]) ?? [],
  };
}

function toAggregate(r: Record<string, unknown>): LegacyAggregate {
  return {
    ...(r as unknown as LegacyAggregate),
    session_value: num(r.session_value),
    price_per_session: numOrNull(r.price_per_session),
    recorded_paid: numOrNull(r.recorded_paid),
  };
}

export function useLegacyStudents() {
  return useQuery<LegacyStudentSummary[]>({
    queryKey: [...KEY, "students"],
    queryFn: async () => {
      const { data, error } = await db.from("legacy_student_summary").select("*").order("display_name");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(toStudent);
    },
    staleTime: 60 * 1000,
  });
}

export function useLegacyYearSummary() {
  return useQuery<LegacyYearSummary[]>({
    queryKey: [...KEY, "years"],
    queryFn: async () => {
      const { data, error } = await db.from("legacy_year_summary").select("*").order("year");
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        ...(r as unknown as LegacyYearSummary),
        historical_value: num(r.historical_value),
        recorded_paid: numOrNull(r.recorded_paid),
      }));
    },
    staleTime: 60 * 1000,
  });
}

/** All monthly records (a few hundred rows at most), newest year first. */
export function useLegacyMonthly() {
  return useQuery<LegacyMonthlyRecord[]>({
    queryKey: [...KEY, "monthly"],
    queryFn: async () => {
      const { data, error } = await db
        .from("legacy_monthly_records")
        .select("*")
        .order("year", { ascending: false, nullsFirst: false })
        .order("month", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(toMonthly);
    },
    staleTime: 60 * 1000,
  });
}

export function useLegacyAggregates() {
  return useQuery<LegacyAggregate[]>({
    queryKey: [...KEY, "aggregates"],
    queryFn: async () => {
      const { data, error } = await db.from("legacy_year_aggregates").select("*").order("year").limit(5000);
      if (error) throw error;
      return ((data ?? []) as Record<string, unknown>[]).map(toAggregate);
    },
    staleTime: 60 * 1000,
  });
}

export function useLegacyIssues() {
  return useQuery<LegacyIssue[]>({
    queryKey: [...KEY, "issues"],
    queryFn: async () => {
      const { data, error } = await db
        .from("legacy_issues")
        .select("id, category, status, legacy_student_id, student_label, year, month_label, source_file, source_sheet, source_row, problem, suggested_action, resolution_note, resolved_at, created_at")
        .order("created_at", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data ?? []) as LegacyIssue[];
    },
    staleTime: 30 * 1000,
  });
}

export function useLegacyBatches() {
  return useQuery<LegacyBatch[]>({
    queryKey: [...KEY, "batches"],
    queryFn: async () => {
      const { data, error } = await db
        .from("legacy_import_batches")
        .select("id, source_file, file_sha256, month_year_map, status, summary, commit_result, created_at, committed_at, rolled_back_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as LegacyBatch[];
    },
  });
}

function useInvalidateLegacy() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export async function searchAccounts(query: string): Promise<AccountMatch[]> {
  const { data, error } = await db.rpc("fn_legacy_search_accounts", { p_query: query });
  if (error) throw error;
  return (data ?? []) as AccountMatch[];
}

export function useLinkAccount() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async ({ legacyStudentId, userId }: { legacyStudentId: string; userId: string }) => {
      const { error } = await db.rpc("fn_legacy_link_account", {
        p_legacy_student_id: legacyStudentId,
        p_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUnlinkAccount() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async (legacyStudentId: string) => {
      const { error } = await db.rpc("fn_legacy_unlink_account", { p_legacy_student_id: legacyStudentId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useSetIssueStatus() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: LegacyIssueStatus; note?: string }) => {
      const { error } = await db.rpc("fn_legacy_set_issue_status", {
        p_issue_id: id,
        p_status: status,
        p_note: note ?? null,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useStageBatch() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async (input: {
      sourceFile: string;
      sha256: string;
      monthYearMap: MonthYearMap;
      payload: LegacyPayload;
    }): Promise<Record<string, unknown>> => {
      const { data, error } = await db.rpc("fn_legacy_stage_batch", {
        p_source_file: input.sourceFile,
        p_file_sha256: input.sha256,
        p_month_year_map: input.monthYearMap,
        p_payload: input.payload,
      });
      if (error) throw error;
      return (data ?? {}) as Record<string, unknown>;
    },
    onSuccess: invalidate,
  });
}

export function useCommitBatch() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async (batchId: string): Promise<Record<string, unknown>> => {
      const { data, error } = await db.rpc("fn_legacy_commit_batch", { p_batch_id: batchId });
      if (error) throw error;
      return (data ?? {}) as Record<string, unknown>;
    },
    onSuccess: invalidate,
  });
}

export function useRollbackBatch() {
  const invalidate = useInvalidateLegacy();
  return useMutation({
    mutationFn: async ({ batchId, force = false }: { batchId: string; force?: boolean }) => {
      const { data, error } = await db.rpc("fn_legacy_rollback_batch", { p_batch_id: batchId, p_force: force });
      if (error) throw error;
      return (data ?? {}) as Record<string, unknown>;
    },
    onSuccess: invalidate,
  });
}

/** Readable text for the errors the legacy functions raise on purpose. */
export function legacyErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (msg.includes("admin_only")) return "Admin access is required.";
  if (msg.includes("account_already_linked_to")) return `That account is already linked to ${msg.split("account_already_linked_to:")[1]?.trim() ?? "another legacy student"}.`;
  if (msg.includes("already_linked")) return "This student is already linked. Unlink first.";
  if (msg.includes("account_not_found")) return "That account no longer exists.";
  if (msg.includes("batch_has_linked_students")) return "This import has students linked to accounts. Unlink them first.";
  if (msg.includes("batch_not_staged")) return "This import is no longer waiting for approval.";
  if (msg.includes("relation") && msg.includes("does not exist")) return "The Legacy Data tables are not installed yet (migration pending).";
  return msg;
}
