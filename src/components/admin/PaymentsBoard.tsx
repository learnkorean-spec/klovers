/**
 * "Payments & classes" tab: who has paid and how many classes each student has
 * left, in one place. Read-only. The rules live in src/lib/paymentsBoard.ts.
 *
 * Arabic, RTL. Rows are stacked cards (not a table) so it never needs a
 * horizontal scroll on a phone.
 */
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllPages } from "@/lib/fetchAllPages";
import {
  boardTiles,
  buildBoard,
  type BoardInput,
  type BoardRow,
} from "@/lib/paymentsBoard";

async function loadBoard(): Promise<BoardRow[]> {
  // Every query reads all of its rows (PostgREST silently stops at 1000) and
  // all of them start together: names come from profiles directly rather than
  // after the enrollments, so there is no second round trip on a phone.
  const [enr, mem, grp, stu, bun, prof, bal] = await Promise.all([
    fetchAllPages((from, to) =>
      supabase
        .from("enrollments")
        .select("id, user_id, payment_status, approval_status, enrollment_status, sessions_remaining, sessions_total, created_at")
        .is("deleted_at", null)
        .order("id")
        .range(from, to),
    ),
    fetchAllPages((from, to) =>
      supabase
        .from("pkg_group_members")
        .select("enrollment_id, user_id, member_status, group_id")
        .eq("member_status", "active")
        .order("group_id").order("user_id")
        .range(from, to),
    ),
    fetchAllPages((from, to) => supabase.from("pkg_groups").select("id, name").order("id").range(from, to)),
    fetchAllPages((from, to) =>
      supabase.from("teacher_students").select("id, full_name, user_id, subject").eq("status", "active").order("id").range(from, to),
    ),
    fetchAllPages((from, to) =>
      supabase.from("student_bundles").select("id, student_id, label, paid_on, note").eq("status", "active").order("id").range(from, to),
    ),
    fetchAllPages((from, to) => supabase.from("profiles").select("user_id, name").order("id").range(from, to)),
    supabase.rpc("get_student_bundle_balances"),
  ]);
  // One failing source fails the whole board: half the students with
  // confident-looking totals is worse than saying it could not load.
  const failed = [
    ["enrollments", enr], ["group members", mem], ["groups", grp],
    ["students", stu], ["bundles", bun], ["profiles", prof], ["balances", bal],
  ].find(([, r]) => (r as { error: unknown }).error);
  if (failed) throw new Error(`Could not read ${failed[0]}`);

  const groupName = new Map((grp.data ?? []).map((g) => [g.id as string, g.name as string]));
  const students = new Map((stu.data ?? []).map((s) => [s.id as string, s]));
  const bundleMeta = new Map((bun.data ?? []).map((b) => [b.id as string, b]));

  const profileNames: Record<string, string> = {};
  for (const p of prof.data ?? []) if (p.user_id) profileNames[p.user_id] = p.name ?? "";

  const bundles: BoardInput["bundles"] = [];
  for (const b of (bal.data ?? []) as Array<{
    student_id: string; bundle_id: string; label: string | null;
    total_classes: number; remaining_classes: number;
  }>) {
    const s = students.get(b.student_id);
    if (!s) continue; // bundle of an inactive student
    const meta = bundleMeta.get(b.bundle_id);
    bundles.push({
      student_id: s.id as string,
      user_id: (s.user_id as string | null) ?? null,
      full_name: s.full_name as string,
      subject: (s.subject as string | null) ?? null,
      label: b.label,
      total_classes: b.total_classes,
      remaining_classes: b.remaining_classes,
      paid_on: (meta?.paid_on as string | null) ?? null,
      note: (meta?.note as string | null) ?? null,
    });
  }

  return buildBoard({
    enrollments: (enr.data ?? []) as BoardInput["enrollments"],
    members: (mem.data ?? []).map((m) => ({
      enrollment_id: m.enrollment_id as string | null,
      user_id: m.user_id as string | null,
      member_status: m.member_status as string | null,
      group_name: groupName.get(m.group_id as string) ?? null,
    })),
    profileNames,
    bundles,
  });
}

const PAY_LABEL = { paid: "مدفوع", unpaid: "غير مدفوع", cancelled: "ملغي" } as const;
const PAY_CLS = {
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  unpaid: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-muted text-muted-foreground border-border",
} as const;

function Tile({ label, value, tone, cls = "" }: { label: string; value: number; tone?: string; cls?: string }) {
  return (
    <Card className={cls}>
      <CardContent className="p-3 text-center">
        <div className={`text-2xl font-bold ${tone ?? ""}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

export default function PaymentsBoard() {
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "payments-board"],
    queryFn: loadBoard,
    staleTime: 30_000,
  });

  if (isLoading) return <p dir="rtl" className="p-4 text-sm text-muted-foreground">جاري التحميل…</p>;
  if (error || !data) {
    return (
      <div dir="rtl" role="alert" className="space-y-2 p-4 text-sm">
        <p className="text-red-600">تعذر تحميل البيانات، فمش هنعرض أرقام ناقصة.</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>حاول تاني</Button>
      </div>
    );
  }

  const t = boardTiles(data);
  const max = Math.max(1, ...data.map((r) => r.total));
  const updated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div dir="rtl" lang="ar" className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{updated && `آخر تحديث ${updated}`}</span>
        <Button size="sm" variant="outline" disabled={isFetching} onClick={() => refetch()}>
          {isFetching ? "جاري التحديث…" : "تحديث"}
        </Button>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        <Tile cls="col-span-2" label="طلاب نشطين" value={t.active} />
        <Tile cls="col-span-2" label="دفعوا" value={t.paid} tone="text-emerald-700" />
        <Tile cls="col-span-2" label="لم يدفعوا" value={t.unpaid} tone={t.unpaid ? "text-red-600" : ""} />
        <Tile cls="col-span-3 sm:col-span-2" label="محتاجين باقة جديدة" value={t.needBundle} tone={t.needBundle ? "text-red-600" : ""} />
        <Tile cls="col-span-3 sm:col-span-2" label="باقي حصة واحدة" value={t.oneLeft} tone={t.oneLeft ? "text-amber-600" : ""} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">الحصص المتبقية لكل طالب</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5">
            {data.map((r) => (
              <li key={r.key} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 truncate sm:w-36">{r.name}</span>
                <div
                  role="img"
                  aria-label={`${r.name}: باقي ${r.left} من ${r.total} حصة`}
                  className="h-3 flex-1 rounded bg-muted"
                >
                  <div
                    className={`h-3 rounded ${r.left <= 0 ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.max(r.left <= 0 ? 4 : 0, (r.left / max) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-end tabular-nums" aria-hidden="true">{r.left}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {data.map((r) => (
          <li key={r.key}>
            <Card className={r.payment === "cancelled" ? "opacity-60" : ""}>
              <CardContent className="space-y-1 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{r.where}</div>
                  </div>
                  <Badge variant="outline" className={`shrink-0 ${PAY_CLS[r.payment]}`}>{PAY_LABEL[r.payment]}</Badge>
                </div>
                <div className="text-sm">
                  باقي <b className={r.left <= 0 ? "text-red-600" : ""}>{r.left}</b> من {r.total} حصة
                </div>
                {r.note && <p className="line-clamp-2 break-words text-xs text-muted-foreground">{r.note}</p>}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
