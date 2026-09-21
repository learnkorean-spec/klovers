import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ArrowRight, AlertTriangle, Link2, Link2Off, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyStudents, useBundleBalances } from "@/hooks/admin/useMyStudents";
import {
  formatMoney,
  formatWeeklySummary,
  SUBJECT_LABEL,
  type BundleBalance,
  type MyStudentWithClasses,
} from "@/types/students";

/**
 * Every student Re teaches, in one card, at the top of the Enrollments tab.
 *
 * Enrollments only ever contained people who signed up on the site: the table
 * requires an auth account (user_id is NOT NULL), and three of the five people
 * Re actually teaches every week had never made one. So this screen — the one
 * that answers "who is studying with me and who owes me money" — was reading
 * "3 approved" while five students were mid-bundle.
 *
 * They are not folded into the enrollment list, because they are not in that
 * pipeline: there is nothing to approve, no receipt to review, no class link to
 * send. They are shown beside it, read-only, so the tab stops lying about the
 * size of the business. Editing still happens in Student Admin, and the button
 * goes there rather than duplicating those controls here.
 *
 * Balances come from get_student_bundle_balances(), which counts confirmed
 * sessions — nothing here holds a running total that could drift.
 *
 * WHY EACH ROW NOW SAYS WHETHER SHE HAS AN ACCOUNT
 * ------------------------------------------------
 * Re looked at the enrollment list and at My Students and asked why the same
 * person is not connected. She was right to: the two screens showed the same
 * people as strangers, and nothing on either said whether they were the same
 * person at all. Three of five ARE linked (`teacher_students.user_id`) and it
 * was simply never displayed.
 *
 * Whether she has an account is not a cosmetic fact. It decides whether she can
 * be written to from "Write a letter", whether a payment reminder can ever
 * reach her, and whether her lessons and her enrolment are one history or two.
 * So it is stated plainly, per student, in the place where the two worlds sit
 * next to each other.
 *
 * Read directly rather than through useMyStudents, because `MyStudent` does not
 * carry `user_id` and widening that type would reach into the 95 KB manager
 * this file exists to stay out of.
 *
 * WHY GROUP STUDENTS ARE HERE TOO (2026-09-21)
 * --------------------------------------------
 * This card said "my ongoing students" and listed only the private ones, so
 * Aya — seated in Hangul · Friday, paid and approved — appeared on no screen
 * that answers "who are my students". The two kinds live in different tables
 * (`teacher_students` for 1:1, `pkg_group_members` for classes) and nothing
 * put them side by side, which is exactly why the headcount was wrong
 * wherever it was read.
 *
 * They stay in two sections rather than one merged list. A private student
 * has a bundle, a balance and money owed; a group student has a class, a
 * schedule and a seat. Flattening them would mean columns that are blank for
 * half the rows, and the question "how many private, how many in classes" is
 * one Re asks constantly. The count in the title is the total, because that
 * is the number she was missing.
 */

interface Props {
  /** Switches the admin dashboard to another tab. Same prop EnrollmentsTab already takes. */
  setAdminTab: (tab: string) => void;
}

type Row = {
  student: MyStudentWithClasses;
  balance: BundleBalance | undefined;
};

/** The account a private student is linked to, or null when there is none. */
type Account = { name: string | null; email: string | null };

/** One seated student of a group class. */
type GroupStudent = {
  userId: string;
  name: string;
  email: string;
  groupName: string;
  /** "Friday 15:00 Cairo", or "" when the group has no schedule slot. */
  when: string;
  /** Seats with no enrolment get no first class date and no payment letter. */
  linkedToEnrolment: boolean;
  started: boolean;
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Why this student needs attention, or null when they do not.
 *
 * Only two things are worth interrupting for: nobody has recorded anything they
 * bought, or they have used everything they bought. A bundle with classes left
 * on it is simply running, and saying so in amber would train the eye to ignore
 * the colour.
 *
 * A missing account is deliberately NOT one of them. It is worth knowing and it
 * is shown, but it is not a fault: a private student who never signed up on the
 * site is a perfectly ordinary student, and colouring her amber every week for
 * it would be the fastest way to stop reading the amber.
 */
function attentionReason(row: Row): string | null {
  if (!row.balance) return "No bundle recorded — nothing has been paid for yet";
  if (row.balance.remaining_classes < 0) {
    return `${Math.abs(row.balance.remaining_classes)} class${
      Math.abs(row.balance.remaining_classes) === 1 ? "" : "es"
    } taken beyond the bundle — needs to pay`;
  }
  if (row.balance.remaining_classes === 0) return "Bundle finished — needs to renew";
  return null;
}

export default function OngoingStudentsStrip({ setAdminTab }: Props) {
  const studentsQ = useMyStudents();
  const balancesQ = useBundleBalances();
  const [accounts, setAccounts] = useState<Map<string, Account> | null>(null);
  const [groupStudents, setGroupStudents] = useState<GroupStudent[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: links, error: linkError } = await supabase
        .from("teacher_students")
        .select("id,user_id")
        .not("user_id", "is", null);
      // A failure here must not take the strip down with it: the bundles and
      // the schedule are the reason this card exists, and they are already
      // loaded. The account line is simply absent instead.
      if (linkError || !links || !alive) return;

      const userIds = [...new Set(links.map(l => l.user_id as string))];
      if (userIds.length === 0) {
        setAccounts(new Map());
        return;
      }

      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("user_id,name,email")
        .in("user_id", userIds);
      if (peopleError || !people || !alive) return;

      const byUser = new Map(
        people.map(p => [p.user_id as string, { name: p.name, email: p.email } as Account]),
      );
      const next = new Map<string, Account>();
      for (const link of links) {
        const account = byUser.get(link.user_id as string);
        if (account) next.set(link.id as string, account);
      }
      setAccounts(next);
    })();
    return () => { alive = false; };
  }, []);

  // The other half of the roster. Read here rather than through a shared hook
  // because nothing else needs it yet, and the alternative is widening a type
  // that lives inside the 104 KB manager this file exists to stay out of.
  useEffect(() => {
    let alive = true;
    (async () => {
      const [membersRes, groupsRes, pkgRes] = await Promise.all([
        supabase
          .from("pkg_group_members")
          .select("group_id,user_id,enrollment_id")
          .eq("member_status", "active"),
        (supabase as any).from("pkg_groups").select("id,name,package_id,start_date"),
        supabase.from("schedule_packages").select("id,day_of_week,start_time"),
      ]);
      // Same rule as above: a failure here leaves the section out, it does not
      // take the private list down with it.
      if (membersRes.error || groupsRes.error || pkgRes.error || !alive) return;

      const members = (membersRes.data ?? []) as Array<{ group_id: string; user_id: string; enrollment_id: string | null }>;
      if (members.length === 0) {
        setGroupStudents([]);
        return;
      }

      const { data: people, error: peopleError } = await supabase
        .from("profiles")
        .select("user_id,name,email")
        .in("user_id", [...new Set(members.map(m => m.user_id))]);
      if (peopleError || !alive) return;

      const byUser = new Map(
        ((people ?? []) as Array<{ user_id: string; name: string | null; email: string | null }>)
          .map(p => [p.user_id, p]),
      );
      const slots = new Map(
        ((pkgRes.data ?? []) as Array<{ id: string; day_of_week: number | null; start_time: string | null }>)
          .map(p => [p.id, p]),
      );
      const groups = new Map(
        ((groupsRes.data ?? []) as Array<{ id: string; name: string | null; package_id: string | null; start_date: string | null }>)
          .map(g => [g.id, g]),
      );

      const rows: GroupStudent[] = members.map(m => {
        const group = groups.get(m.group_id);
        const slot = group?.package_id ? slots.get(group.package_id) : undefined;
        const dow = slot?.day_of_week ?? null;
        const time = (slot?.start_time ?? "").slice(0, 5);
        return {
          userId: m.user_id,
          name: byUser.get(m.user_id)?.name || "Unnamed",
          email: byUser.get(m.user_id)?.email || "",
          groupName: group?.name || "Group",
          when: dow != null && time ? `${DAY_NAMES[dow]} ${time} Cairo` : "",
          linkedToEnrolment: !!m.enrollment_id,
          started: !!group?.start_date,
        };
      });
      rows.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));
      if (alive) setGroupStudents(rows);
    })();
    return () => { alive = false; };
  }, []);

  const rows = useMemo<Row[]>(() => {
    const students = studentsQ.data ?? [];
    const balances = balancesQ.data;
    return students
      .filter((s) => s.status === "active")
      .map((student) => ({ student, balance: balances?.get(student.id) }));
  }, [studentsQ.data, balancesQ.data]);

  const groupRows = groupStudents ?? [];
  const total = rows.length + groupRows.length;

  // Nobody at all means no strip, rather than an empty card sitting above the
  // list on every load.
  if (!studentsQ.isLoading && total === 0) return null;

  const needsAttention = rows.filter((r) => attentionReason(r) !== null).length;
  const unlinked = accounts
    ? rows.filter(r => !accounts.get(r.student.id)).length
    : 0;

  return (
    <Card className="rounded-2xl mb-4">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            My ongoing students
            {!studentsQ.isLoading && (
              <span className="text-xs font-normal text-muted-foreground">({total})</span>
            )}
            {needsAttention > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {needsAttention} need{needsAttention === 1 ? "s" : ""} attention
              </Badge>
            )}
          </CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7"
            onClick={() => setAdminTab("my-students")}
          >
            Student Admin
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Everyone currently studying — {rows.length} private and {groupRows.length} in a class.
          Private students say whether they are also an account on the site, which is what decides
          whether a letter or a payment reminder can reach them. Edit private students in Student
          Admin; class seats are managed on the group's card.
          {accounts && unlinked > 0 && (
            <>
              {" "}
              <span className="text-foreground">
                {unlinked} of the {rows.length} private {unlinked === 1 ? "has" : "have"} no address on file.
              </span>
            </>
          )}
        </p>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {studentsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {rows.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Private · {rows.length}
                </p>
                <ul className="space-y-2">
                  {rows.map(({ student, balance }) => {
                    const reason = attentionReason({ student, balance });
                    const account = accounts?.get(student.id);
                    return (
                      <li
                        key={student.id}
                        className={
                          "rounded-xl border px-3 py-2 space-y-1 " +
                          (reason
                            ? "border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/20"
                            : "bg-muted/30")
                        }
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-medium text-foreground">{student.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {SUBJECT_LABEL[student.subject]}
                          </span>
                          {balance && (
                            <span className="text-xs text-muted-foreground">
                              {balance.label} · {balance.used_classes} of {balance.total_classes} used ·{" "}
                              <span className="text-foreground">
                                {balance.remaining_classes} left
                              </span>{" "}
                              · {formatMoney(balance.total_price, balance.currency)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-muted-foreground/80">
                          {formatWeeklySummary(student.classes)}
                        </p>

                        {accounts && (
                          account ? (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Link2 className="h-3 w-3 shrink-0" />
                              Same person as{" "}
                              <span className="text-foreground">{account.name || "an account"}</span>
                              {account.email && <span className="text-muted-foreground/80">· {account.email}</span>}
                            </p>
                          ) : (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Link2Off className="h-3 w-3 shrink-0" />
                              No account and no address — cannot be emailed or reminded
                            </p>
                          )
                        )}

                        {reason && (
                          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            {reason}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {groupRows.length > 0 && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Users className="h-3 w-3" />
                  In a class · {groupRows.length}
                </p>
                <ul className="space-y-2">
                  {groupRows.map(s => (
                    <li key={`${s.groupName}-${s.userId}`} className="rounded-xl border bg-muted/30 px-3 py-2 space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.groupName}</span>
                        {!s.started && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            class not started
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/80">
                        {s.when || "no day or time set"}
                        {s.email && <span> · {s.email}</span>}
                      </p>
                      {!s.linkedToEnrolment && (
                        <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          Seat is not linked to an enrolment — she gets no first class date and no payment letter
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
