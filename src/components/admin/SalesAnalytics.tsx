import { useEffect, useState, useMemo, memo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, CreditCard, BarChart3, ArrowUpRight, ArrowDownRight, Download, AlertCircle, MessageCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import type { Enrollment } from "@/types/admin";
import { fetchAllPages } from "@/lib/fetchAllPages";

/*
 * Sales Analytics — group enrollments only.
 *
 * WHY IT SHOWED $0 EVERYWHERE (fixed 2026-09-28)
 * The enrollments read embedded `profiles(name,email)`. There is no foreign
 * key from `enrollments` to `profiles` (user_id points at auth.users), so
 * PostgREST refused the whole request, the error was never checked, and the
 * page rendered an empty list as "$0". Names now come from a separate
 * `profiles` read joined in the browser, and every read throws on error so a
 * failure shows as a failure, not as zero sales.
 *
 * MONEY
 * - Revenue = PAID + APPROVED, not deleted — the same rule as the dashboard's
 *   Group Revenue tile (useCollectedRevenue), so the two agree.
 * - Every enrollment so far is EGP, and the page used to print "$" in front
 *   of it. Amounts are shown in their own currency now, and totals are only
 *   summed within one currency — there is no exchange rate anywhere in the
 *   system, so adding EGP to USD would be a made-up number. The headline
 *   figures use the currency most enrollments are in; any other currency is
 *   listed on its own under Revenue by Currency.
 * - Outstanding = approved but not paid. That was `payment_status = UNPAID`
 *   only, which missed PENDING_PAYMENT — the one status actually in use.
 * - Months are placed by `payment_date`, falling back to `created_at`.
 *
 * Private students pay by bundle (student_bundles) and are not enrollments;
 * their money is on the Private Budgets tile and in My students.
 */

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 173 58% 39%))",
  "hsl(var(--chart-3, 197 37% 24%))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 27 87% 67%))",
  "hsl(12 76% 61%)",
];

type Row = Enrollment & { payment_date?: string | null; deleted_at?: string | null };

function money(n: number, currency: string): string {
  return `${Math.round(n).toLocaleString("en-US")} ${currency}`;
}

const SalesAnalytics = () => {
  const [enrollments, setEnrollments] = useState<Row[]>([]);
  const [leads, setLeads] = useState<{ id: string }[]>([]);
  const [profileCount, setProfileCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState("6");

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, lRes, pRes] = await Promise.all([
          fetchAllPages<Row>((f, t) =>
            supabase
              .from("enrollments")
              .select("id,user_id,plan_type,duration,classes_included,amount,currency,payment_status,approval_status,payment_provider,created_at,level,enrollment_status,sessions_remaining,sessions_total,unit_price,payment_date,deleted_at")
              .is("deleted_at", null)
              .order("id")
              .range(f, t) as never),
          fetchAllPages<{ id: string }>((f, t) => supabase.from("leads").select("id").order("id").range(f, t) as never),
          fetchAllPages<{ user_id: string; name: string | null; email: string | null }>((f, t) =>
            supabase.from("profiles").select("id,user_id,name,email").order("id").range(f, t) as never),
        ]);
        if (eRes.error) throw eRes.error;
        if (lRes.error) throw lRes.error;
        if (pRes.error) throw pRes.error;

        const profiles = (pRes.data ?? []) as { user_id: string; name: string | null; email: string | null }[];
        const byUser = new Map(profiles.map(p => [p.user_id, { name: p.name, email: p.email }]));
        const rows = ((eRes.data ?? []) as unknown as Row[]).map(e => ({
          ...e,
          profiles: (byUser.get(e.user_id) ?? null) as Row["profiles"],
        }));

        setEnrollments(rows);
        setLeads((lRes.data ?? []) as { id: string }[]);
        setProfileCount(profiles.length);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const months = parseInt(range);
  const now = new Date();

  const paidAll = useMemo(() =>
    enrollments.filter(e => e.payment_status === "PAID" && e.approval_status === "APPROVED"),
    [enrollments]
  );

  // The currency most paid enrollments are in. Headline totals use only this
  // one; see the note at the top.
  const currency = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of paidAll) counts.set(e.currency || "EGP", (counts.get(e.currency || "EGP") ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "EGP";
  }, [paidAll]);

  const paidEnrollments = useMemo(
    () => paidAll.filter(e => (e.currency || "EGP") === currency),
    [paidAll, currency]
  );

  const whenPaid = (e: Row) => parseISO(e.payment_date || e.created_at);

  // Revenue over time
  const revenueByMonth = useMemo(() => {
    const data: { month: string; revenue: number; count: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = subMonths(now, i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const label = format(d, "MMM yyyy");
      const inRange = paidEnrollments.filter(e => isWithinInterval(whenPaid(e), { start, end }));
      data.push({ month: label, revenue: inRange.reduce((s, e) => s + Number(e.amount), 0), count: inRange.length });
    }
    return data;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidEnrollments, months]);

  const activeStudents = paidAll.filter(e => (e.sessions_remaining ?? 0) > 0).length;

  const prevMonthActiveEnrollments = useMemo(() => {
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    return paidAll.filter(e => isWithinInterval(whenPaid(e), { start: lastMonthStart, end: lastMonthEnd })).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidAll]);

  const totalRevenue = paidEnrollments.reduce((s, e) => s + Number(e.amount), 0);
  const avgOrderValue = paidEnrollments.length > 0 ? totalRevenue / paidEnrollments.length : 0;

  const currentMonthRevenue = revenueByMonth[revenueByMonth.length - 1]?.revenue ?? 0;
  const prevMonthRevenue = revenueByMonth[revenueByMonth.length - 2]?.revenue ?? 0;
  const revenueGrowth = prevMonthRevenue > 0 ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : 0;

  // Plan breakdown with MoM
  const planBreakdown = useMemo(() => {
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const map: Record<string, { count: number; revenue: number; thisMonth: number; lastMonth: number }> = {};
    paidEnrollments.forEach(e => {
      const key = `${e.plan_type} – ${e.duration}mo`;
      if (!map[key]) map[key] = { count: 0, revenue: 0, thisMonth: 0, lastMonth: 0 };
      map[key].count++;
      map[key].revenue += Number(e.amount);
      const cd = whenPaid(e);
      if (isWithinInterval(cd, { start: thisMonthStart, end: thisMonthEnd })) map[key].thisMonth++;
      else if (isWithinInterval(cd, { start: lastMonthStart, end: lastMonthEnd })) map[key].lastMonth++;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paidEnrollments]);

  // Group vs Private pie
  const typePie = useMemo(() => {
    const group = paidEnrollments.filter(e => e.plan_type === "group");
    const priv = paidEnrollments.filter(e => e.plan_type === "private");
    return [
      { name: "Group", value: group.length, revenue: group.reduce((s, e) => s + Number(e.amount), 0) },
      { name: "Private", value: priv.length, revenue: priv.reduce((s, e) => s + Number(e.amount), 0) },
    ].filter(p => p.value > 0);
  }, [paidEnrollments]);

  // Provider pie
  const providerPie = useMemo(() => {
    const map: Record<string, number> = {};
    paidAll.forEach(e => {
      const p = e.payment_provider || "manual";
      map[p] = (map[p] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [paidAll]);

  // Conversion funnel
  const funnel = useMemo(() => ({
    leads: leads.length,
    registered: profileCount,
    enrolled: enrollments.length,
    active: paidAll.filter(e => e.enrollment_status === "active").length,
    completed: enrollments.filter(e => e.enrollment_status === "completed" || e.enrollment_status === "expired").length,
  }), [leads, profileCount, enrollments, paidAll]);

  const conversionRates = useMemo(() => [
    { stage: "Lead → Registered", rate: funnel.leads > 0 ? ((funnel.registered / funnel.leads) * 100).toFixed(1) : "0" },
    { stage: "Registered → Enrolled", rate: funnel.registered > 0 ? ((funnel.enrolled / funnel.registered) * 100).toFixed(1) : "0" },
    { stage: "Enrolled → Active", rate: funnel.enrolled > 0 ? ((funnel.active / funnel.enrolled) * 100).toFixed(1) : "0" },
  ], [funnel]);

  // Currency breakdown — every currency, each on its own
  const currencyBreakdown = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    paidAll.forEach(e => {
      const c = e.currency || "EGP";
      if (!map[c]) map[c] = { count: 0, revenue: 0 };
      map[c].count++;
      map[c].revenue += Number(e.amount);
    });
    return Object.entries(map).map(([cur, v]) => ({ currency: cur, ...v }));
  }, [paidAll]);

  // Outstanding: approved, not paid (UNPAID or PENDING_PAYMENT)
  const outstandingEnrollments = useMemo(() =>
    enrollments.filter(e => e.payment_status !== "PAID" && e.approval_status === "APPROVED"),
    [enrollments]
  );
  const outstandingTotal = outstandingEnrollments
    .filter(e => (e.currency || "EGP") === currency)
    .reduce((s, e) => s + Number(e.amount), 0);

  // At-risk for renewal pipeline (sessions_remaining ≤ 3 and > 0)
  const atRiskCount = useMemo(() =>
    paidEnrollments.filter(e => (e.sessions_remaining ?? 0) <= 3 && (e.sessions_remaining ?? 0) > 0).length,
    [paidEnrollments]
  );
  const avgUnitPrice = useMemo(() => {
    const withPrice = paidEnrollments.filter(e => e.unit_price && e.unit_price > 0);
    if (!withPrice.length) return 0;
    return withPrice.reduce((s, e) => s + (e.unit_price ?? 0), 0) / withPrice.length;
  }, [paidEnrollments]);

  // Avg sessions used %
  const avgSessionsUsed = useMemo(() => {
    const withSessions = paidAll.filter(e => e.sessions_total && e.sessions_total > 0);
    if (!withSessions.length) return 0;
    return withSessions.reduce((s, e) => {
      const total = e.sessions_total ?? 0;
      const used = total - (e.sessions_remaining ?? 0);
      return s + (used / total) * 100;
    }, 0) / withSessions.length;
  }, [paidAll]);

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}</div>;
  }

  if (error) {
    return (
      <Card className="rounded-2xl border-destructive" role="alert">
        <CardContent className="p-5 text-sm">
          <span className="font-semibold text-destructive">Could not load sales.</span>{" "}
          <span className="text-muted-foreground">{error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Range selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sales Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Group enrollments, in {currency}. Private bundles are in{" "}
            <Link to="/admin?tab=my-students" className="underline underline-offset-2 hover:text-foreground">My students</Link>.
          </p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={`rounded-2xl ${outstandingEnrollments.length > 0 ? "border-klovers-yellow" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`rounded-xl p-2 ${outstandingEnrollments.length > 0 ? "bg-klovers-yellow" : "bg-muted"}`}><AlertCircle className="h-4 w-4 text-charcoal" /></div>
              <span className="text-xs text-muted-foreground">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{money(outstandingTotal, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{outstandingEnrollments.length} approved, not paid yet</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-muted"><RefreshCw className="h-4 w-4 text-foreground" /></div>
              <span className="text-xs text-muted-foreground">Renewal Pipeline</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{money(atRiskCount * avgUnitPrice, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{atRiskCount} at-risk × avg price</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-muted"><BarChart3 className="h-4 w-4 text-foreground" /></div>
              <span className="text-xs text-muted-foreground">Avg Sessions Used</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{avgSessionsUsed.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">of total sessions per student</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-klovers-green"><DollarSign className="h-4 w-4 text-charcoal" /></div>
              <span className="text-xs text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{money(totalRevenue, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">paid · {paidEnrollments.length} enrollments</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-muted"><TrendingUp className="h-4 w-4 text-foreground" /></div>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{money(currentMonthRevenue, currency)}</p>
            <div className="flex items-center gap-1 mt-1">
              {revenueGrowth >= 0 ? <ArrowUpRight className="h-3 w-3 text-foreground" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <span className={`text-xs ${revenueGrowth >= 0 ? "text-muted-foreground" : "text-destructive"}`}>{Math.abs(revenueGrowth).toFixed(0)}% vs last month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-muted"><CreditCard className="h-4 w-4 text-foreground" /></div>
              <span className="text-xs text-muted-foreground">Avg Order</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{money(avgOrderValue, currency)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-muted"><Users className="h-4 w-4 text-foreground" /></div>
              <span className="text-xs text-muted-foreground">Paid Students</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{paidAll.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-xl p-2 bg-klovers-green"><BarChart3 className="h-4 w-4 text-charcoal" /></div>
              <span className="text-xs text-muted-foreground">Active Students</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{activeStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">vs {prevMonthActiveEnrollments} paid last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding list */}
      {outstandingEnrollments.length > 0 && (
        <Card className="rounded-2xl border-klovers-yellow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-foreground" />
              Approved, not paid yet ({outstandingEnrollments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="py-2 px-4">Student</TableHead>
                    <TableHead className="py-2 px-4">Amount</TableHead>
                    <TableHead className="py-2 px-4 hidden sm:table-cell">Days waiting</TableHead>
                    <TableHead className="py-2 px-4 text-right">Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingEnrollments.slice(0, 10).map(e => {
                    const daysSince = Math.floor((Date.now() - new Date(e.payment_date || e.created_at).getTime()) / 86400000);
                    const name = e.profiles?.name || e.profiles?.email || "—";
                    const email = e.profiles?.email || "";
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="py-2 px-4">
                          <p className="font-medium text-sm">{name}</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </TableCell>
                        <TableCell className="py-2 px-4">
                          <span className="font-mono text-sm font-semibold">{money(Number(e.amount), e.currency || "EGP")}</span>
                        </TableCell>
                        <TableCell className="py-2 px-4 hidden sm:table-cell">
                          <Badge variant={daysSince > 14 ? "destructive" : "secondary"} className="text-xs">
                            {daysSince}d
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-4 text-right">
                          {email && (
                            <a
                              href={`${WHATSAPP_BASE}?text=${encodeURIComponent(`Hi ${name}! This is a reminder about your pending payment for the Korean course. Please let us know if you need any help completing it.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-foreground underline-offset-2 hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue Over Time ({currency})</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => Number(v).toLocaleString("en-US")} />
              <Tooltip formatter={(v: number, _name: string, props: { payload?: { count?: number } }) => [`${money(v, currency)} (${props.payload?.count ?? 0} enrollments)`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Conversion Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0 md:justify-between">
            {[
              { label: "Leads", count: funnel.leads, color: "bg-muted text-foreground" },
              { label: "Registered", count: funnel.registered, color: "bg-muted text-foreground" },
              { label: "Enrolled", count: funnel.enrolled, color: "bg-klovers-yellow text-charcoal" },
              { label: "Active", count: funnel.active, color: "bg-klovers-green text-charcoal" },
              { label: "Completed", count: funnel.completed, color: "bg-muted text-foreground" },
            ].map((s, i, arr) => (
              <div key={s.label} className="flex items-center gap-2 md:gap-3">
                <div className="text-center">
                  <div className={`${s.color} rounded-xl px-4 py-2 text-lg font-bold min-w-[60px] tabular-nums`}>{s.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
                {i < arr.length - 1 && (
                  <div className="text-xs text-muted-foreground font-medium hidden md:block">→</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {conversionRates.map(cr => (
              <div key={cr.stage} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-lg font-bold text-foreground">{cr.rate}%</p>
                <p className="text-xs text-muted-foreground">{cr.stage}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Group vs Private</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typePie} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {typePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string, props: { payload?: { revenue?: number } }) => [`${v} enrollments (${money(props.payload?.revenue ?? 0, currency)})`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Payment Provider</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={providerPie} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {providerPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan breakdown table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Plan Breakdown ({currency})</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => {
            const headers = ["Plan", "Enrollments", `Revenue (${currency})`, "Avg", "MoM %"];
            const rows = planBreakdown.map(p => {
              const mom = p.lastMonth > 0 ? ((p.thisMonth - p.lastMonth) / p.lastMonth * 100).toFixed(0) + "%" : p.thisMonth > 0 ? "New" : "—";
              return [p.name, p.count, p.revenue, (p.revenue / p.count).toFixed(0), mom];
            });
            const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `plan-breakdown-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Enrollments</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg</TableHead>
                <TableHead className="text-right">MoM %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planBreakdown.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No paid enrollments yet.</TableCell></TableRow>
              )}
              {planBreakdown.map(p => {
                const mom = p.lastMonth > 0 ? ((p.thisMonth - p.lastMonth) / p.lastMonth * 100) : null;
                const momLabel = mom !== null ? `${mom >= 0 ? "+" : ""}${mom.toFixed(0)}%` : p.thisMonth > 0 ? "New" : "—";
                const momColor = mom !== null && mom < 0 ? "text-destructive" : "text-muted-foreground";
                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.count}</TableCell>
                    <TableCell className="text-right">{money(p.revenue, currency)}</TableCell>
                    <TableCell className="text-right">{money(p.revenue / p.count, currency)}</TableCell>
                    <TableCell className="text-right"><span className={momColor}>{momLabel}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency breakdown */}
      {currencyBreakdown.length > 1 && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Revenue by Currency</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {currencyBreakdown.map(c => (
                <div key={c.currency} className="p-3 rounded-xl bg-muted/50 text-center">
                  <p className="text-lg font-bold text-foreground">{money(c.revenue, c.currency)}</p>
                  <p className="text-xs text-muted-foreground">{c.count} enrollments</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default memo(SalesAnalytics);
