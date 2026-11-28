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
  /** Set only on a seated, unpaid group row: the one a "mark paid" applies to. */
  enrollmentId?: string;
  currency?: string;
  /** True when marking it paid will email the student (see willEmailOnPaid). */
  emailsOnPaid?: boolean;
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
  currency?: string | null;
  matched_at?: string | null;
  approval_email_sent_at?: string | null;
  payment_email_sent_at?: string | null;
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

/**
 * Whether flipping this enrollment to PAID makes the database email the
 * student, from the live triggers: the approval email goes out when the row is
 * matched and has not had one; the payment-confirmed email when neither email
 * has been sent. Shown to Re before she confirms, so it is never a surprise.
 */
export function willEmailOnPaid(e: EnrollmentInput): boolean {
  if (e.approval_email_sent_at) return false;
  return !!e.matched_at || !e.payment_email_sent_at;
}

export function buildBoard(input: BoardInput): BoardRow[] {
  const seated = new Map<string, MemberInput>(); // enrollment_id -> active seat
  for (const m of input.members) {
    if (m.enrollment_id && m.member_status === "active") seated.set(m.enrollment_id, m);
  }

  const rows = new Map<string, BoardRow>();

  // 1. Private students first: their bundles are the record we prefer.
  // A student can hold more than one active bundle (an old one that ran out
  // and the one opened after it), so bundles are grouped per student and
  // added up. Keeping one row per bundle would hide classes, and keeping the
  // last one seen would silently drop the others.
  const bundleUsers = new Set<string>();
  const perStudent = new Map<string, BundleInput[]>();
  for (const b of input.bundles) {
    const key = b.user_id ?? b.student_id;
    if (b.user_id) bundleUsers.add(b.user_id);
    const list = perStudent.get(key) ?? [];
    list.push(b);
    perStudent.set(key, list);
  }
  for (const [key, list] of perStudent) {
    const first = list[0];
    const notes = list.map((b) => b.note).filter((n): n is string => !!n);
    const labels = [...new Set(list.map((b) => b.label || b.subject || "private"))];
    rows.set(key, {
      key,
      name: first.full_name,
      where: labels.join(" + "),
      kind: "private",
      // Paid only when every active bundle is paid.
      payment: list.every((b) => b.paid_on) ? "paid" : "unpaid",
      left: list.reduce((n, b) => n + b.remaining_classes, 0),
      total: list.reduce((n, b) => n + b.total_classes, 0),
      note: notes.join(" | "),
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
    const payment: PaymentState = cancelled ? "cancelled" : isPaid(pick.payment_status) ? "paid" : "unpaid";
    // Only a seated, approved, still-unpaid row can be marked paid.
    const markable =
      payment === "unpaid" &&
      seated.has(pick.id) &&
      (pick.approval_status ?? "").toUpperCase() === "APPROVED";
    rows.set(userId, {
      key: userId,
      name: input.profileNames[userId] ?? "—",
      where: seated.get(pick.id)?.group_name ?? "—",
      kind: "group",
      payment,
      left: pick.sessions_remaining ?? 0,
      total: pick.sessions_total ?? 0,
      note: "",
      ...(markable
        ? { enrollmentId: pick.id, currency: pick.currency ?? "EGP", emailsOnPaid: willEmailOnPaid(pick) }
        : {}),
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

/** Paid students with one class left or none, fewest first. Cancelled and unpaid rows are not renewals. */
export function renewalsSoon(rows: BoardRow[]): BoardRow[] {
  return rows
    .filter((r) => r.payment === "paid" && r.left <= 1)
    .sort((a, b) => a.left - b.left || a.name.localeCompare(b.name));
}

export interface GroupFill {
  id: string;
  name: string;
  filled: number;
  capacity: number;
  /** filled / capacity, 0 when capacity is missing. */
  rate: number;
}

/** Seats taken against capacity for each started, active group, emptiest first. Only members with status 'active' hold a seat. */
export function groupFill(
  groups: { id: string; name: string; capacity: number | null; is_active: boolean | null; start_date: string | null }[],
  members: { group_id: string; member_status: string | null }[],
): GroupFill[] {
  const taken = new Map<string, number>();
  for (const m of members) {
    if (m.member_status !== "active") continue;
    taken.set(m.group_id, (taken.get(m.group_id) ?? 0) + 1);
  }
  return groups
    // A group with no start date has not begun: its empty seats are not unused capacity yet.
    .filter((g) => g.is_active !== false && !!g.start_date)
    .map((g) => {
      const capacity = g.capacity ?? 0;
      const filled = taken.get(g.id) ?? 0;
      return { id: g.id, name: g.name, filled, capacity, rate: capacity > 0 ? filled / capacity : 0 };
    })
    .sort((a, b) => a.rate - b.rate || a.name.localeCompare(b.name));
}

export interface TrialConversion {
  attended: number;
  paid: number;
  /** paid / attended as a whole percent, 0 when nobody attended. */
  percent: number;
}

/**
 * Of the people who attended a free trial (distinct accounts), how many now
 * hold a PAID enrollment. Bookings without an account cannot be matched and
 * are left out, so this is a floor, not an exact figure.
 */
export function trialConversion(
  trials: { user_id: string | null; status: string }[],
  paidUserIds: Set<string>,
): TrialConversion {
  const attendedIds = new Set<string>();
  for (const t of trials) if (t.status === "confirmed_attendance" && t.user_id) attendedIds.add(t.user_id);
  let paid = 0;
  for (const id of attendedIds) if (paidUserIds.has(id)) paid++;
  const attended = attendedIds.size;
  return { attended, paid, percent: attended > 0 ? Math.round((paid / attended) * 100) : 0 };
}
