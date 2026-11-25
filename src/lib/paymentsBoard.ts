/**
 * Payments & classes board: one list of every active student with whether they
 * have paid and how many classes they have left.
 *
 * The data lives in two places that never met on one screen:
 *   - group students: `enrollments` (+ `pkg_group_members` for the group)
 *   - private / My students: `teacher_students` + their active `student_bundles`
 *
 * Rules, all learned the hard way (26 Nov 2026):
 *   - A student in both worlds is shown once, deduped by user_id, and the
 *     bundle record wins (Naira has a bundle AND legacy enrollment rows).
 *   - A stale enrollment (PENDING_PAYMENT, nothing left, no group seat) is an
 *     abandoned signup, not a student. It is dropped.
 *   - `students.total_paid` is never used: it double counts (Aya Arafa).
 *   - Bundle balance = total_classes minus counted sessions, which is exactly
 *     what get_student_bundle_balances() returns, so we use that.
 *
 * Pure functions only, so the rules are testable without a database.
 */

export type PaymentState = "paid" | "unpaid" | "cancelled";

export interface BoardRow {
  /** user_id when there is one, otherwise the teacher_students id. */
  key: string;
  name: string;
  /** Group name or private/bundle label. */
  where: string;
  kind: "group" | "private";
  payment: PaymentState;
  left: number;
  total: number;
  note: string;
}

export interface EnrollmentInput {
  id: string;
  user_id: string | null;
  payment_status: string | null;
  approval_status: string | null;
  enrollment_status: string | null;
  sessions_remaining: number | null;
  sessions_total: number | null;
  created_at: string;
}

export interface MemberInput {
  enrollment_id: string | null;
  user_id: string | null;
  member_status: string | null;
  group_name: string | null;
}

export interface BundleInput {
  student_id: string;
  user_id: string | null;
  full_name: string;
  subject: string | null;
  label: string | null;
  total_classes: number;
  remaining_classes: number;
  paid_on: string | null;
  note: string | null;
}

export interface BoardInput {
  enrollments: EnrollmentInput[];
  members: MemberInput[];
  /** user_id -> display name */
  profileNames: Record<string, string>;
  bundles: BundleInput[];
}

const isPaid = (s: string | null) => (s ?? "").toUpperCase() === "PAID";

export function buildBoard(input: BoardInput): BoardRow[] {
  const seated = new Map<string, MemberInput>(); // enrollment_id -> active seat
  for (const m of input.members) {
    if (m.enrollment_id && m.member_status === "active") seated.set(m.enrollment_id, m);
  }

  const rows = new Map<string, BoardRow>();

  // 1. Private students first: their bundle is the record we prefer.
  const bundleUsers = new Set<string>();
  for (const b of input.bundles) {
    const key = b.user_id ?? b.student_id;
    if (b.user_id) bundleUsers.add(b.user_id);
    rows.set(key, {
      key,
      name: b.full_name,
      where: b.label || (b.subject ?? "private"),
      kind: "private",
      payment: b.paid_on ? "paid" : "unpaid",
      left: b.remaining_classes,
      total: b.total_classes,
      note: b.note ?? "",
    });
  }

  // 2. Group students, one row per user, skipping anyone a bundle already covers.
  const byUser = new Map<string, EnrollmentInput[]>();
  for (const e of input.enrollments) {
    if (!e.user_id || bundleUsers.has(e.user_id)) continue;
    if ((e.approval_status ?? "").toUpperCase() === "REJECTED") continue;
    const stale =
      (e.payment_status ?? "").toUpperCase() === "PENDING_PAYMENT" &&
      (e.sessions_remaining ?? 0) === 0 &&
      !seated.has(e.id);
    if (stale) continue;
    const list = byUser.get(e.user_id) ?? [];
    list.push(e);
    byUser.set(e.user_id, list);
  }

  for (const [userId, list] of byUser) {
    // Prefer a seated, paid row; then any seated; then the newest.
    const pick = [...list].sort((a, b) => {
      const score = (e: EnrollmentInput) =>
        (seated.has(e.id) ? 2 : 0) + (isPaid(e.payment_status) ? 1 : 0);
      return score(b) - score(a) || b.created_at.localeCompare(a.created_at);
    })[0];
    const cancelled = (pick.enrollment_status ?? "active") === "cancelled";
    rows.set(userId, {
      key: userId,
      name: input.profileNames[userId] ?? "—",
      where: seated.get(pick.id)?.group_name ?? "—",
      kind: "group",
      payment: cancelled ? "cancelled" : isPaid(pick.payment_status) ? "paid" : "unpaid",
      left: pick.sessions_remaining ?? 0,
      total: pick.sessions_total ?? 0,
      note: "",
    });
  }

  // Fewest classes left first, cancelled at the bottom.
  return [...rows.values()].sort((a, b) => {
    const ca = a.payment === "cancelled" ? 1 : 0;
    const cb = b.payment === "cancelled" ? 1 : 0;
    return ca - cb || a.left - b.left || a.name.localeCompare(b.name);
  });
}

export function boardTiles(rows: BoardRow[]) {
  const active = rows.filter((r) => r.payment !== "cancelled");
  return {
    active: active.length,
    paid: active.filter((r) => r.payment === "paid").length,
    unpaid: active.filter((r) => r.payment === "unpaid").length,
    needBundle: active.filter((r) => r.left <= 0).length,
    oneLeft: active.filter((r) => r.left === 1).length,
  };
}
