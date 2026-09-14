import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, ArrowRight, AlertTriangle, Link2, Link2Off } from "lucide-react";
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
 * Re's ongoing 1:1 students, shown at the top of the Enrollments tab.
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

  const rows = useMemo<Row[]>(() => {
    const students = studentsQ.data ?? [];
    const balances = balancesQ.data;
    return students
      .filter((s) => s.status === "active")
      .map((student) => ({ student, balance: balances?.get(student.id) }));
  }, [studentsQ.data, balancesQ.data]);

  // No private students means no strip, rather than an empty card sitting above
  // the list on every load for someone who does not teach any.
  if (!studentsQ.isLoading && rows.length === 0) return null;

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
              <span className="text-xs font-normal text-muted-foreground">({rows.length})</span>
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
          Private students taught every week. Each one says whether she is also an account on the
          site — that is what decides whether a letter or a payment reminder can reach her. Edit
          them in Student Admin.
          {accounts && unlinked > 0 && (
            <>
              {" "}
              <span className="text-foreground">
                {unlinked} of {rows.length} {unlinked === 1 ? "has" : "have"} no address on file.
              </span>
            </>
          )}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {studentsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
