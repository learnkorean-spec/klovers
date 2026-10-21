import { Component, ReactNode, lazy, Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import "@/i18n/config";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, AlertCircle, Bell, Mail, Sparkles, Settings, BarChart3, Users, FileCheck, Clock, Tag, Loader2, Image, Palette, Trophy, TrendingUp, Link, BookOpen, GraduationCap, Volume2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, Lock, CalendarPlus } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useSearchParams } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { AdminKpiStrip } from "@/components/admin/AdminKpiStrip";

/** Same rule as the At-Risk Students KPI tile: active and running low. */
const isAtRiskRow = (u: { derived_status: string; sessions_remaining: number }) =>
  u.derived_status === "ACTIVE" && u.sessions_remaining > 0 && u.sessions_remaining <= AT_RISK_SESSION_THRESHOLD;

// Lazy-load heavy tab components — each loads only when its tab is first opened
const BlogManager = lazy(() => import("@/components/admin/BlogManager"));
const StudentManager = lazy(() => import("@/components/admin/StudentManager"));
const LifecycleFunnel = lazy(() => import("@/components/admin/LifecycleFunnel"));
const GroupAttendanceManager = lazy(() => import("@/components/admin/GroupAttendanceManager"));
const AdminNotifications = lazy(() => import("@/components/admin/AdminNotifications"));
const GroupMatcher = lazy(() => import("@/components/admin/GroupMatcher"));
const RecommendedSlotsPanel = lazy(() => import("@/components/admin/RecommendedSlotsPanel"));
const TeacherAvailabilityManager = lazy(() => import("@/components/admin/TeacherAvailabilityManager"));
const TeacherOnboardingManager = lazy(() => import("@/components/admin/TeacherOnboardingManager"));
const PersonalTrialManager = lazy(() => import("@/components/admin/PersonalTrialManager"));
const MyStudentsManager = lazy(() => import("@/components/admin/MyStudentsManager"));
const UpcomingPrivateClasses = lazy(() => import("@/components/admin/UpcomingPrivateClasses"));
const StudentPreferenceDashboard = lazy(() => import("@/components/admin/StudentPreferenceDashboard"));
const BulkEmailManager = lazy(() => import("@/components/admin/BulkEmailManager"));
const SchedulingManager = lazy(() => import("@/components/admin/SchedulingManager"));
const TrialClassesManager = lazy(() => import("@/components/admin/TrialClassesManager"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const PlacementTestsManager = lazy(() => import("@/components/admin/PlacementTestsManager"));
const SalesAnalytics = lazy(() => import("@/components/admin/SalesAnalytics"));
const SessionAttendanceManager = lazy(() => import("@/components/admin/SessionAttendanceManager"));
const StudentHealthPanel = lazy(() => import("@/components/admin/StudentHealthPanel"));
const PromoCodesManager = lazy(() => import("@/components/admin/PromoCodesManager"));
const SeoOrchestrationPanel = lazy(() => import("@/components/admin/SeoOrchestrationPanel"));
const ImageAuditPanel = lazy(() => import("@/components/admin/ImageAuditPanel"));
const LeadsPanel = lazy(() => import("@/components/admin/LeadsPanel").catch(() => import("@/components/admin/LeadsPanel")));
const LeagueUsersPanel = lazy(() => import("@/components/admin/LeagueUsersPanel"));
const LeadFunnelPanel = lazy(() => import("@/components/admin/LeadFunnelPanel"));
const BookAssignmentManager = lazy(() => import("@/components/admin/BookAssignmentManager"));
const PictureLibrary = lazy(() => import("@/components/admin/PictureLibrary"));
const BookPlanBoard = lazy(() => import("@/components/admin/BookPlanBoard"));
const ConversationAudio = lazy(() => import("@/components/admin/ConversationAudio"));
const BrandSheetPanel = lazy(() => import("@/components/admin/BrandSheetPanel"));
const AccountsMap = lazy(() => import("@/components/admin/AccountsMap"));
const TrialClassesTab = lazy(() => import("@/components/admin/TrialClassesTab"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

// Lead, Enrollment, AttendanceReq, OverviewRow — imported from @/types/admin

const STATUS_OPTIONS = ["new", "trial_booked", "contacted", "enrolled", "rejected", "lost"];

// Mobile tab names come from the sidebar's own labels, so a screen is called
// the same thing everywhere instead of an auto-capitalised id ("Seo Orchestration").
const TAB_LABELS: Record<string, string> = Object.fromEntries(
  [...ADMIN_NAV.primary, ...ADMIN_NAV.secondary, ...ADMIN_NAV.folded.flatMap((g) => g.items)].map((i) => [i.id, i.label]),
);

// Error boundary for lazy-loaded tab components
class TabErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { error: boolean; errorMsg: string }
> {
  state = { error: false, errorMsg: "" };
  static getDerivedStateFromError(error: Error) { return { error: true, errorMsg: error?.message || "Unknown error" }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[TabErrorBoundary] ${this.props.name} crashed:`, error, errorInfo);
    // Best-effort remote log. Table is created on demand — if it doesn't
    // exist in this env, silently skip so the fallback UI still renders.
    try {
      void supabase.from("admin_error_log" as never).insert({
        tab: this.props.name,
        message: error?.message?.slice(0, 500) ?? "Unknown error",
        stack: error?.stack?.slice(0, 4000) ?? null,
        component_stack: errorInfo?.componentStack?.slice(0, 4000) ?? null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        url: typeof window !== "undefined" ? window.location.href.slice(0, 500) : null,
      } as never).then(({ error: insertErr }) => {
        if (insertErr && insertErr.code !== "42P01") {
          // 42P01 = relation does not exist; expected if table not yet deployed.
          console.warn("[TabErrorBoundary] remote log failed:", insertErr.message);
        }
      });
    } catch {
      /* ignore — logging must never throw */
    }
  }
  render() {
    if (this.state.error) {
      return (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load <strong>{this.props.name}</strong>.
            </p>
            <p className="text-xs text-destructive/80 font-mono max-w-md mx-auto break-all">
              {this.state.errorMsg}
            </p>
            <Button variant="outline" size="sm" onClick={() => this.setState({ error: false, errorMsg: "" })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

import { normalizeLevel, LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import type { Lead, Enrollment, AttendanceReq, OverviewRow } from "@/types/admin";
import { ClassLinkDialog } from "@/components/admin/dialogs/ClassLinkDialog";
import { ReceiptModal } from "@/components/admin/dialogs/ReceiptModal";
import { RejectEnrollmentDialog } from "@/components/admin/dialogs/RejectEnrollmentDialog";
import { ManualEnrollDialog } from "@/components/admin/dialogs/ManualEnrollDialog";
import { formatTime, ADMIN_PAGE_SIZE as PAGE_SIZE, MAX_UNIT_PRICE, AT_RISK_SESSION_THRESHOLD, REFERRAL_CONVERSION_BONUS_PCT, REFERRAL_CLICK_BONUS_PCT, REFERRAL_MAX_BONUS_PCT } from "@/lib/admin-utils";
import type { ProfileEntry } from "@/hooks/admin/useProfiles";
import { StudentsTab } from "@/components/admin/tabs/StudentsTab";
import { EnrollmentsTab } from "@/components/admin/tabs/EnrollmentsTab";
import { useStudentOverview, buildOverviewByEmail } from "@/hooks/admin/useStudentOverview";
import { useLeads } from "@/hooks/admin/useLeads";
import { useEnrollments } from "@/hooks/admin/useEnrollments";
import { useAttendanceRequests } from "@/hooks/admin/useAttendanceRequests";
import { useReferralStats } from "@/hooks/admin/useReferralStats";
import { useTrialStats } from "@/hooks/admin/useTrialStats";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ADMIN_NAV } from "@/components/admin/AdminShell";

const AdminDashboard = () => {
  const { t } = useTranslation("admin");
  const queryClient = useQueryClient();

  // ── React Query: shared data (cached, deduplicated) ───────────────────────
  const { data: overviewRows = [], isLoading: overviewLoading } = useStudentOverview();
  const overviewByEmail = useMemo(() => buildOverviewByEmail(overviewRows), [overviewRows]);

  // Build profileMap from overviewRows (already fetched) instead of a separate
  // 5000-row profiles query. Eliminates one full-table scan on every page load.
  const profileMap = useMemo<Record<string, ProfileEntry>>(() => {
    const map: Record<string, ProfileEntry> = {};
    for (const r of overviewRows) {
      map[r.user_id] = {
        user_id: r.user_id,
        name: r.name,
        email: r.email,
        level: r.level ?? null,
        country: r.country ?? null,
      };
    }
    return map;
  }, [overviewRows]);

  const { data: leads = [], isLoading: leadsLoading, error: leadsQueryError } = useLeads({ overviewByEmail });
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useEnrollments({ profileMap });
  const { data: attendanceReqs = [], isLoading: attendanceLoading } = useAttendanceRequests({ profileMap, overviewRows });
  const { data: referralStats = { total: 0, thisMonth: 0, totalClicks: 0, clicksThisMonth: 0, perUser: [] } } = useReferralStats();
  const { data: trialStats = { pending: 0, upcoming: 0, thisWeek: 0, total: 0 } } = useTrialStats();

  // Lead count: "new" status = hasn't been contacted yet
  const newLeadsCount = useMemo(() => leads.filter(l => (l.status ?? "new") === "new").length, [leads]);

  // Needed by the visibleStudentCols useState initializer below — must be declared first
  // to avoid a temporal-dead-zone ReferenceError on the very first render.
  const isMobile = useIsMobile();

  // Students table column visibility — persisted
  type StudentCol = "country" | "level" | "attendance" | "source" | "joined";
  const ALL_STUDENT_COLS: StudentCol[] = ["country", "level", "attendance", "source", "joined"];
  const STUDENT_COL_LABELS: Record<StudentCol, string> = {
    country: "Country", level: "Level", attendance: "Attendance %", source: "Source", joined: "Joined",
  };
  const [visibleStudentCols, setVisibleStudentCols] = useState<Set<StudentCol>>(() => {
    try {
      const raw = localStorage.getItem("admin:studentCols");
      if (raw) return new Set(JSON.parse(raw) as StudentCol[]);
    } catch { /* ignore */ }
    return new Set(isMobile ? ["attendance"] : ALL_STUDENT_COLS);
  });
  useEffect(() => {
    try { localStorage.setItem("admin:studentCols", JSON.stringify(Array.from(visibleStudentCols))); } catch { /* ignore */ }
  }, [visibleStudentCols]);
  const toggleStudentCol = useCallback((c: StudentCol) => {
    setVisibleStudentCols(prev => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  }, []);

  // Hero "Insights" collapsed by default — restore last choice from localStorage
  const [insightsOpen, setInsightsOpen] = useState<boolean>(() => {
    try { return localStorage.getItem("admin:insightsOpen") === "1"; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem("admin:insightsOpen", insightsOpen ? "1" : "0"); } catch { /* ignore */ }
  }, [insightsOpen]);


  const loading = leadsLoading || enrollmentsLoading || overviewLoading || attendanceLoading;
  const leadsError = leadsQueryError?.message ?? null;

  /** Targeted refetch — replaces the old monolithic invalidateAll(). */
  const invalidateAll = useCallback(() => {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin"] }),
      queryClient.invalidateQueries({ queryKey: ["trial-admin"] }),
      queryClient.invalidateQueries({ queryKey: ["lead_events"] }),
      queryClient.invalidateQueries({ queryKey: ["lead_funnel"] }),
      queryClient.invalidateQueries({ queryKey: ["lead_funnel_prev"] }),
      queryClient.invalidateQueries({ queryKey: ["enrollments_sources"] }),
    ]);
  }, [queryClient]);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [studentSearch, setStudentSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const adminTab = searchParams.get("tab") ?? "students";
  const setAdminTab = useCallback((tab: string) => {
    setSearchParams({ tab }, { replace: true });
    // Immediately re-fetch trial stats when navigating to trials tab
    // so the badge reflects the live DB count without waiting for staleTime.
    if (tab === "trials") {
      queryClient.invalidateQueries({ queryKey: ["admin", "trial-stats"] });
    }
  }, [setSearchParams, queryClient]);
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const [sendingReminder, setSendingReminder] = useState<Set<string>>(new Set());
  const [rejectTarget, setRejectTarget] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState<"payment_not_received" | "time_slots_unavailable" | "other">("payment_not_received");
  const [classLinkTarget, setClassLinkTarget] = useState<Enrollment | null>(null);
  const [classLinkUrl, setClassLinkUrl] = useState("");
  const [classLinkSendToGroup, setClassLinkSendToGroup] = useState(false);
  const [classLinkSlotDay, setClassLinkSlotDay] = useState("");
  const [classLinkSlotTime, setClassLinkSlotTime] = useState("");
  const [classLinkSlotTimezone, setClassLinkSlotTimezone] = useState("Africa/Cairo");
  const [classLinkFirstClassDate, setClassLinkFirstClassDate] = useState("");
  const [isSendingClassLink, setIsSendingClassLink] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ url: string; isPdf: boolean; studentName: string } | null>(null);
  const [receiptModalLoading, setReceiptModalLoading] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  // `?filter=` lets a KPI tile (e.g. At-Risk Students) open this list pre-filtered.
  const urlStudentFilter = searchParams.get("filter");
  const [studentFilter, setStudentFilter] = useState(urlStudentFilter ?? "all");
  useEffect(() => {
    if (urlStudentFilter) setStudentFilter(urlStudentFilter);
  }, [urlStudentFilter]);
  const [levelFilter, setLevelFilter] = useState("all");
  const [studentSort, setStudentSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "joined_at", dir: "desc" });
  const [studentPage, setStudentPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showLegacyEnrollments, setShowLegacyEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [enrollmentPage, setEnrollmentPage] = useState(0);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);
  const [sendingResend, setSendingResend] = useState<Set<string>>(new Set());
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  // Derived leadsByEmail map for level fallback
  const leadsByEmail = useMemo(() => {
    const map: Record<string, Lead> = {};
    for (const l of leads) if (l.email) map[l.email.toLowerCase()] = l;
    return map;
  }, [leads]);

  // ── Manual Enroll ────────────────────────────────────────────────────────
  const SESSIONS_BY_DURATION: Record<string, string> = { "1": "4", "3": "12", "6": "24" };

  const [pkgGroups, setPkgGroups] = useState<{ id: string; name: string }[]>([]);
  const [manualEnrollOpen, setManualEnrollOpen] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState<OverviewRow | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    plan_type: "group",
    duration: "1",
    sessions: "4",
    amount: "",
    currency: "EGP",
    group_id: "",
    level: "",
    notes: "",
  });
  const [enrollSaving, setEnrollSaving] = useState(false);

  useEffect(() => {
    supabase.from("pkg_groups").select("id, name").eq("is_active", true).order("name")
      .then(({ data }) => { if (data) setPkgGroups(data); });
  }, []);

  function openManualEnroll(u: OverviewRow) {
    setEnrollTarget(u);
    setEnrollForm({ plan_type: "group", duration: "1", sessions: "4", amount: "", currency: "EGP", group_id: "", level: u.level || "", notes: "" });
    setManualEnrollOpen(true);
  }

  async function handleManualEnroll() {
    if (!enrollTarget) return;
    if (enrollForm.plan_type === "group" && !enrollForm.group_id) {
      toast({ title: "Select a group", variant: "destructive" }); return;
    }
    const sessions = parseInt(enrollForm.sessions) || 4;
    const amount = parseFloat(enrollForm.amount);
    if (isNaN(amount) || amount < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" }); return;
    }
    setEnrollSaving(true);
    try {
      const txRef = "manual_" + crypto.randomUUID().replace(/-/g, "");
      const { data: enrollment, error } = await supabase
        .from("enrollments")
        .insert({
          user_id: enrollTarget.user_id,
          plan_type: enrollForm.plan_type,
          duration: parseInt(enrollForm.duration),
          classes_included: sessions,
          sessions_remaining: sessions,
          sessions_total: sessions,
          amount,
          // The DB trigger also sets this for manual rows; sending it keeps the types honest.
          unit_price: sessions > 0 ? amount / sessions : 0,
          currency: enrollForm.currency,
          payment_provider: "manual",
          payment_status: "PAID",
          status: "APPROVED",
          approval_status: "APPROVED",
          tx_ref: txRef,
          receipt_url: "manual",
          reviewed_at: new Date().toISOString(),
          level: enrollForm.level || null,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (enrollForm.plan_type === "group" && enrollForm.group_id) {
        const { error: gmError } = await supabase
          .from("pkg_group_members")
          .insert({ group_id: enrollForm.group_id, user_id: enrollTarget.user_id, enrollment_id: enrollment.id, member_status: "active" });
        if (gmError) throw gmError;
      }
      const desc = enrollForm.plan_type === "private"
        ? `${enrollTarget.name} enrolled as private — assign slot via matcher.`
        : `${enrollTarget.name} added to group with ${sessions} sessions.`;
      toast({ title: "Enrolled!", description: desc });
      setManualEnrollOpen(false);
      invalidateAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrollSaving(false);
    }
  }

  // fetchAll replaced by React Query hooks — see useLeads, useEnrollments, etc.
  // invalidateAll() triggers targeted cache refresh instead of re-fetching everything.

  const handleDeleteStudent = async (userId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) { toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" }); return; }
    // Enrollments, attendance, funnel and KPI counts all depend on this
    // profile, so refresh every admin query, not only the student list.
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast({ title: "Deleted", description: "Student record removed." });
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      let resubmitLink: string | undefined;
      if (rejectReason === "time_slots_unavailable") {
        const token = crypto.randomUUID().replace(/-/g, "");
        const { error: resubErr } = await supabase.from("schedule_resubmission_requests").insert({
          enrollment_id: rejectTarget.id,
          user_id: rejectTarget.user_id,
          email: rejectTarget.profiles?.email || "",
          token,
        });
        // No saved request means the link in the email would lead nowhere.
        if (resubErr) throw resubErr;
        resubmitLink = `${window.location.origin}/resubmit-schedule?token=${token}`;
      }
      // Reject first, and only tell the student if it actually saved.
      const rejected = await handleEnrollmentAction(rejectTarget, "REJECTED");
      if (!rejected) return;
      const { error: emailError } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "rejection",
          email: rejectTarget.profiles?.email,
          name: rejectTarget.profiles?.name ?? "Student",
          language: "ar",
          rejection_reason: rejectReason,
          rejection_note: rejectNote.trim() || undefined,
          resubmit_link: resubmitLink,
        },
      });
      if (emailError) {
        toast({ title: "Rejected", description: "Enrollment rejected, but the notification email failed to send. Check Resend logs.", variant: "destructive" });
      } else {
        toast({ title: "Rejected & notified", description: `Email sent to ${rejectTarget.profiles?.email}` });
      }
      setRejectTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to reject or send email.", variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  };

  // Stable callbacks so memoized hero children don't re-render on every tick.

  // View a receipt URL stored on an enrollment — handles stripe: sentinel,
  // plain http(s) URLs, and storage object keys (resolved via signed URL).
  const handleViewReceipt = useCallback(async (e: Enrollment) => {
    if (!e.receipt_url || e.receipt_url.length === 0) return;
    if (e.receipt_url.startsWith("stripe:")) {
      toast({ title: "Stripe payment", description: "Paid via Stripe — no manual receipt to view." });
      return;
    }
    setReceiptModalLoading(true);
    let url = e.receipt_url;
    if (!e.receipt_url.startsWith("http")) {
      const { data, error } = await supabase.storage
        .from("receipts")
        .createSignedUrl(e.receipt_url, 3600);
      if (error || !data?.signedUrl) {
        toast({ title: "Error", description: "Could not load receipt.", variant: "destructive" });
        setReceiptModalLoading(false);
        return;
      }
      url = data.signedUrl;
    }
    const isPdf = e.receipt_url.toLowerCase().endsWith(".pdf");
    const studentName = e.profiles?.name || e.profiles?.email || "Unknown";
    setReceiptModal({ url, isPdf, studentName });
    setReceiptModalLoading(false);
  }, []);

  // Request schedule resubmission — inserts a token row and copies link.
  const handleRequestResubmission = useCallback(async (e: Enrollment) => {
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error: insertErr } = await supabase
      .from("schedule_resubmission_requests")
      .insert({
        enrollment_id: e.id,
        user_id: e.user_id,
        email: e.profiles?.email || "",
        token,
      });
    if (insertErr) {
      toast({ title: "Error", description: insertErr.message, variant: "destructive" });
      return;
    }
    const link = `${window.location.origin}/resubmit-schedule?token=${token}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Link copied!", description: "Send this link to the student to update their schedule." });
  }, []);

  const handleSendPaymentMethodReminder = async (e: Enrollment) => {
    setSendingReminder(prev => new Set(prev).add(e.id));
    try {
      await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "payment_method_reminder",
          email: e.profiles?.email,
          name: e.profiles?.name ?? "Student",
          enrollment_id: e.id,
          language: "ar",
        },
      });
      toast({ title: "Reminder sent", description: `Email sent to ${e.profiles?.email}` });
    } catch {
      toast({ title: "Error", description: "Failed to send reminder.", variant: "destructive" });
    } finally {
      setSendingReminder(prev => { const s = new Set(prev); s.delete(e.id); return s; });
    }
  };

  const handleResendPaymentEmail = useCallback(async (e: Enrollment) => {
    const key = `pay-${e.id}`;
    if (sendingResend.has(key)) return;
    setSendingResend(prev => new Set(prev).add(key));
    try {
      const { error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "payment_confirmed",
          email: e.profiles?.email,
          name: e.profiles?.name ?? "Student",
          language: "ar",
          plan_type: e.plan_type,
          duration: e.duration,
          sessions_total: e.sessions_total,
          amount: e.amount,
          currency: e.currency ?? "EGP",
          tx_ref: e.tx_ref,
        },
      });
      if (error) {
        toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Payment email resent", description: `Sent to ${e.profiles?.email}` });
      }
    } finally {
      setSendingResend(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [sendingResend]);

  const handleResendApprovalEmail = useCallback(async (e: Enrollment) => {
    const key = `appr-${e.id}`;
    if (sendingResend.has(key)) return;
    setSendingResend(prev => new Set(prev).add(key));
    try {
      const { error } = await supabase.functions.invoke("send-confirmation-email", {
        body: {
          template: "approval",
          email: e.profiles?.email,
          name: e.profiles?.name ?? "Student",
          language: "ar",
          plan_type: e.plan_type,
          duration: e.duration,
          sessions_total: e.sessions_total,
          amount: e.amount,
          currency: e.currency ?? "EGP",
        },
      });
      if (error) {
        toast({ title: "Failed to resend", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Approval email resent", description: `Sent to ${e.profiles?.email}` });
      }
    } finally {
      setSendingResend(prev => { const s = new Set(prev); s.delete(key); return s; });
    }
  }, [sendingResend]);

  const handleSendClassLink = async () => {
    if (!classLinkTarget || !classLinkUrl.trim()) return;
    // Reject javascript: and data: URLs to prevent XSS/phishing
    const urlLower = classLinkUrl.trim().toLowerCase();
    if (urlLower.startsWith("javascript:") || urlLower.startsWith("data:")) {
      toast({ title: "Invalid URL", description: "Please enter a valid https:// link.", variant: "destructive" });
      return;
    }
    setIsSendingClassLink(true);

    const recipients: { email: string; name: string; language?: string }[] = [];

    if (classLinkSendToGroup) {
      // Find the group this enrollment belongs to, then collect all active member emails
      const { data: memberRow } = await supabase
        .from("pkg_group_members")
        .select("group_id")
        .eq("enrollment_id", classLinkTarget.id)
        .maybeSingle();

      if (memberRow?.group_id) {
        const { data: groupMembers } = await supabase
          .from("pkg_group_members")
          .select("user_id")
          .eq("group_id", memberRow.group_id)
          .eq("member_status", "active");

        if (groupMembers && groupMembers.length > 0) {
          const userIds = groupMembers.map((m: { user_id: string }) => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("email, name, timezone")
            .in("user_id", userIds);

          if (profiles) {
            for (const p of profiles) {
              if (p.email && p.name) {
                const tz = p.timezone || "";
                const lang = tz.startsWith("Asia/") || tz.startsWith("Europe/") || tz.startsWith("America/") ? "en" : "ar";
                recipients.push({ email: p.email, name: p.name, language: lang });
              }
            }
          }
        }
      }

      if (recipients.length === 0) {
        toast({ title: "No group members found", description: "This enrollment has no active group members.", variant: "destructive" });
        setIsSendingClassLink(false);
        return;
      }
    } else {
      const email = classLinkTarget.profiles?.email;
      const name = classLinkTarget.profiles?.name ?? "Student";
      if (!email) {
        toast({ title: "No email found", description: "This enrollment has no email address.", variant: "destructive" });
        setIsSendingClassLink(false);
        return;
      }
      const tz = classLinkTarget.timezone || "";
      const lang = tz.startsWith("Asia/") || tz.startsWith("Europe/") || tz.startsWith("America/") ? "en" : "ar";
      recipients.push({ email, name, language: lang });
    }

    // Resend enforces 10 requests/second. On 14 Sep 2026 a 21-recipient admin
    // send fired every call at once and 8/21 came back `429 rate_limit_exceeded`
    // on the first try (all 8 recovered on a manual retry that time — see
    // EmailDeliveryPanel.tsx). "Send to whole group" here can hit the same
    // wall with nobody watching to retry it by hand, so this sends in small
    // batches with a short pause between them, and retries a single 429'd
    // call once before counting it as a real failure.
    const isRateLimited = async (error: unknown): Promise<boolean> => {
      if (!error) return false;
      const err = error as { context?: Response; message?: string };
      if (err.context && typeof err.context.json === "function") {
        try {
          const body = await err.context.clone().json();
          if (typeof body?.error === "string" && /429|rate_limit_exceeded/i.test(body.error)) return true;
        } catch {
          // Not JSON, or the body was already consumed — fall through.
        }
      }
      return typeof err.message === "string" && /429|rate_limit_exceeded/i.test(err.message);
    };

    const sendClassLinkTo = async (r: { email: string; name: string; language?: string }) => {
      const body = {
        template: "class_link",
        email: r.email,
        name: r.name,
        language: r.language,
        class_link_url: classLinkUrl.trim(),
        slot_day: classLinkSlotDay.trim() || undefined,
        slot_time: classLinkSlotTime.trim() || undefined,
        slot_timezone: classLinkSlotTimezone || undefined,
      };
      let { error } = await supabase.functions.invoke("send-confirmation-email", { body });
      if (error && (await isRateLimited(error))) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        ({ error } = await supabase.functions.invoke("send-confirmation-email", { body }));
      }
      return error;
    };

    let sent = 0;
    let failed = 0;
    const CLASS_LINK_BATCH_SIZE = 5;
    for (let i = 0; i < recipients.length; i += CLASS_LINK_BATCH_SIZE) {
      const batch = recipients.slice(i, i + CLASS_LINK_BATCH_SIZE);
      const results = await Promise.all(batch.map(sendClassLinkTo));
      for (const error of results) { if (error) failed++; else sent++; }
      if (i + CLASS_LINK_BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    setIsSendingClassLink(false);

    // Stamp class_link_sent_at and first_class_date on the enrollment
    const stampData: Record<string, unknown> = { class_link_sent_at: new Date().toISOString() };
    if (classLinkFirstClassDate) stampData.first_class_date = new Date(classLinkFirstClassDate).toISOString();
    await supabase.from("enrollments").update(stampData).eq("id", classLinkTarget.id);
    invalidateAll();

    setClassLinkTarget(null);
    setClassLinkUrl("");
    setClassLinkSendToGroup(false);
    setClassLinkSlotDay("");
    setClassLinkSlotTime("");
    setClassLinkSlotTimezone("Africa/Cairo");
    setClassLinkFirstClassDate("");

    if (failed > 0) {
      toast({ title: `Sent ${sent}, failed ${failed}`, variant: "destructive" });
    } else {
      toast({ title: `Class link sent to ${sent} student${sent !== 1 ? "s" : ""}` });
    }
  };

  // Resolves true only when the change was actually saved, so callers never
  // email a student or navigate on the strength of a failed update.
  const handleEnrollmentAction = async (enrollment: Enrollment, action: "APPROVED" | "REJECTED"): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    // Block approval until matcher has placed the student (matched_at is set by the
    // matcher functions and is the authoritative signal that placement is complete).
    if (action === "APPROVED" && !enrollment.matched_at) {
      toast({
        title: "Cannot approve yet",
        description: "Assign the student to a class slot first (run the Matcher tab), then approve.",
        variant: "destructive",
      });
      return false;
    }

    // Block approval for manual/Egypt payments that have no receipt on file.
    const isManualPayment = enrollment.payment_provider === "egypt_manual" || enrollment.payment_provider === "manual";
    const hasReceipt = enrollment.receipt_url && enrollment.receipt_url.trim() !== "" && enrollment.receipt_url !== "manual";
    if (action === "APPROVED" && isManualPayment && !hasReceipt) {
      toast({
        title: "Receipt required",
        description: "Cannot approve — no payment receipt has been uploaded. Ask the student to submit their receipt first.",
        variant: "destructive",
      });
      return false;
    }

    const updates: Record<string, unknown> = {
      status: action,
      approval_status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    };

    if (action === "APPROVED" && (enrollment.payment_provider === "manual" || enrollment.payment_provider === "egypt_manual")) {
      updates.payment_status = "PAID";
    }
    if (action === "REJECTED") {
      updates.payment_status = "UNPAID";
      updates.enrollment_status = "cancelled";
      updates.sessions_remaining = 0;
    }

    const editedPrice = editingUnitPrice[enrollment.id];
    if (editedPrice && action === "APPROVED") {
      const price = Number(editedPrice);
      if (isNaN(price)) {
        toast({ title: "Invalid price", description: "Unit price must be a valid number.", variant: "destructive" });
        return false;
      }
      if (price <= 0) {
        toast({ title: "Invalid price", description: "Unit price must be greater than zero.", variant: "destructive" });
        return false;
      }
      if (price > MAX_UNIT_PRICE) {
        toast({ title: "Invalid price", description: "Unit price seems too high. Please verify.", variant: "destructive" });
        return false;
      }
      updates.unit_price = price;
    }

    // Level and days are read-only from enrollment — no admin editing

    if (action === "APPROVED") {
      // Single atomic RPC: updates enrollment + adds credits in one transaction.
      // If either step fails, both roll back — no half-approved state.
      const { error: approveError } = await supabase.rpc("approve_enrollment", {
        _enrollment_id: enrollment.id,
        _admin_id: session.user.id,
        _unit_price: updates.unit_price != null ? Number(updates.unit_price) : null,
      });
      if (approveError) {
        toast({ title: "Error", description: approveError.message || "Failed to approve enrollment.", variant: "destructive" });
        return false;
      }
    } else {
      const { error } = await supabase.from("enrollments").update(updates).eq("id", enrollment.id);
      if (error) { toast({ title: "Error", description: "Failed to update enrollment.", variant: "destructive" }); return false; }
    }

    toast({ title: `Enrollment ${action.toLowerCase()}` });
    invalidateAll();
    return true;
  };

  const handleBulkApprove = async () => {
    if (selectedEnrollmentIds.size === 0) return;
    setBulkApproving(true);
    const { data: { session: bulkSession } } = await supabase.auth.getSession();
    if (!bulkSession) { setBulkApproving(false); return; }
    const ids = Array.from(selectedEnrollmentIds);
    let succeeded = 0;
    let failed = 0;
    for (const id of ids) {
      const enrollment = enrollments.find(e => e.id === id);
      if (!enrollment) continue;
      // Only undecided enrollments can be bulk-approved: a selection can
      // outlive the tab, search or filter it was made under.
      if (enrollment.approval_status === "APPROVED" || enrollment.approval_status === "REJECTED") { failed++; continue; }
      // Skip enrollments not yet placed by the matcher
      if (!enrollment.matched_at) { failed++; continue; }
      // Skip manual-payment enrollments missing a receipt
      const isManual = enrollment.payment_provider === "egypt_manual" || enrollment.payment_provider === "manual";
      const hasReceipt = enrollment.receipt_url && enrollment.receipt_url.trim() !== "" && enrollment.receipt_url !== "manual";
      if (isManual && !hasReceipt) { failed++; continue; }
      try {
        const { error } = await supabase.rpc("approve_enrollment", {
          _enrollment_id: id,
          _admin_id: bulkSession.user.id,
          _unit_price: null,
        });
        if (error) { failed++; continue; }
        succeeded++;
      } catch { failed++; }
    }
    setBulkApproving(false);
    setSelectedEnrollmentIds(new Set());
    toast({
      title: `Bulk approve complete`,
      description: `${succeeded} approved${failed > 0 ? `, ${failed} failed` : ""}`,
      variant: failed > 0 ? "destructive" : "default",
    });
    invalidateAll();
  };

  const handleRevertEnrollment = async (enrollment: Enrollment) => {
    const { error } = await supabase.rpc("revert_enrollment", {
      _enrollment_id: enrollment.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment reverted to pending, credits deducted." });
    invalidateAll();
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to delete enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment deleted" });
    invalidateAll();
  };

  const handleAttendanceAction = async (req: AttendanceReq, action: "APPROVED" | "REJECTED") => {
    if (action === "APPROVED") {
      const { data, error } = await supabase.rpc("approve_attendance_request", {
        _request_id: req.id,
      });
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to approve.", variant: "destructive" });
        return;
      }
      const newRemaining = typeof data === "number" ? data : null;
      toast({ title: "Attendance approved", description: `Sessions remaining: ${newRemaining ?? "?"}` });

      // Notify student when they cross into the LOCKED threshold for the first time
      if (newRemaining !== null && newRemaining <= 0 && req.profiles?.email) {
        void supabase.functions.invoke("send-confirmation-email", {
          body: {
            template: "sessions_exhausted",
            email: req.profiles.email,
            name: req.profiles.name ?? "Student",
            language: "ar",
            sessions_remaining: newRemaining,
          },
        });
      }
    } else {
      const { error } = await supabase.rpc("reject_attendance_request", {
        _request_id: req.id,
      });
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to reject.", variant: "destructive" });
        return;
      }
      toast({ title: "Attendance rejected" });
    }
    invalidateAll();
  };

  const handleRevertAttendance = async (req: AttendanceReq) => {
    const { error } = await supabase.rpc("revert_attendance_request", {
      _request_id: req.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert.", variant: "destructive" });
      return;
    }
    toast({ title: "Reverted to pending", description: req.status === "APPROVED" ? "Session restored." : "Request is pending again." });
    invalidateAll();
  };

  // Computed badge counts
  // Deleted rows are closed, never actionable. Without this a row closed by
  // soft-delete kept the "Action needed" banner lit forever (13 Sep 2026
  // hold-a-place row, still counted on 18 Oct).
  const actionableEnrollments = enrollments.filter(e => !(e as { deleted_at?: string | null }).deleted_at && (
    e.approval_status === "UNDER_REVIEW" ||
    e.approval_status === "PENDING_PAYMENT" ||
    (e.approval_status === "PENDING" && e.admin_review_required)
  )).length;
  const pendingAttendance = attendanceReqs.filter(a => a.status === "PENDING").length;

  // === UNIFIED DATASET from DB view ===
  const lifecycleLeads = overviewRows.filter(u => u.derived_status === "LEAD").length;
  const lifecycleActive = overviewRows.filter(u => u.derived_status === "ACTIVE").length;
  const lifecycleCompleted = overviewRows.filter(u => u.derived_status === "COMPLETED").length;
  const lifecycleLocked = overviewRows.filter(u => u.derived_status === "LOCKED").length;
  const lifecycleConfirmedTotal = overviewRows.filter(u => ["ACTIVE", "COMPLETED", "LOCKED"].includes(u.derived_status)).length;

  const confirmedCount = lifecycleConfirmedTotal;
  const leadsProfileCount = lifecycleLeads;
  const stripeCount = overviewRows.filter(u => u.source_label === "Stripe").length;
  const egyptCount = overviewRows.filter(u => u.source_label === "Egypt").length;

  // Debounced search values so typing doesn't lag the filter
  const debouncedStudentSearch = useDebouncedValue(studentSearch, 200);
  const debouncedEnrollmentSearch = useDebouncedValue(enrollmentSearch, 200);

  // Filtered + searched users from view
  const filteredUsers = useMemo(() => {
    const q = debouncedStudentSearch.toLowerCase();
    return overviewRows.filter(u => {
      const matchesSearch = !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesFilter = studentFilter === "confirmed" ? ["ACTIVE", "COMPLETED", "LOCKED"].includes(u.derived_status)
        : studentFilter === "leads" ? u.derived_status === "LEAD"
        : studentFilter === "stripe" ? u.source_label === "Stripe"
        : studentFilter === "egypt" ? u.source_label === "Egypt"
        : studentFilter === "overdue" ? u.amount_due > 0
        : studentFilter === "atrisk" ? isAtRiskRow(u)
        // These three match the dashboard tiles one for one (AdminKpiStrip,
        // LifecycleFunnel link here with ?filter=…).
        : studentFilter === "active" ? u.derived_status === "ACTIVE"
        : studentFilter === "locked" ? u.derived_status === "LOCKED"
        : studentFilter === "completed" ? u.derived_status === "COMPLETED"
        : true;
      const matchesLevel = levelFilter === "all" || normalizeLevel(u.level || "") === levelFilter;
      return matchesSearch && matchesFilter && matchesLevel;
    });
  }, [overviewRows, debouncedStudentSearch, studentFilter, levelFilter]);

  // Sorted users (after filter, before pagination)
  const sortedUsers = useMemo(() => {
    if (!studentSort.col) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const v = (x: typeof a) =>
        studentSort.col === "sessions_remaining" ? x.sessions_remaining
        : studentSort.col === "amount_due" ? x.amount_due
        : studentSort.col === "remaining_balance" ? x.remaining_balance
        : studentSort.col === "joined_at" ? new Date(x.joined_at).getTime()
        : studentSort.col === "attendance_pct" ? (x.sessions_total > 0 ? (x.sessions_total - x.sessions_remaining) / x.sessions_total : -1)
        : 0;
      return studentSort.dir === "asc" ? v(a) - v(b) : v(b) - v(a);
    });
  }, [filteredUsers, studentSort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const pagedUsers = sortedUsers.slice(studentPage * PAGE_SIZE, (studentPage + 1) * PAGE_SIZE);

  // Reset pages when filters change (debounced so fast typing doesn't thrash)
  useEffect(() => { setStudentPage(0); }, [debouncedStudentSearch, studentFilter, levelFilter]);
  useEffect(() => { setEnrollmentPage(0); }, [debouncedEnrollmentSearch]);

  const overdueCount = overviewRows.filter(u => u.amount_due > 0).length;
  const atRiskCount = overviewRows.filter(isAtRiskRow).length;
  const studentFilterOptions = [
    { value: "all", label: `All (${overviewRows.length})` },
    { value: "confirmed", label: `Confirmed (${confirmedCount})` },
    { value: "leads", label: `Leads (${leadsProfileCount})` },
    { value: "stripe", label: `Stripe (${stripeCount})` },
    { value: "egypt", label: `Egypt Manual (${egyptCount})` },
    { value: "overdue", label: `Outstanding Balance (${overdueCount})` },
    { value: "atrisk", label: `At-Risk (${atRiskCount})` },
    { value: "active", label: `Active (${lifecycleActive})` },
    { value: "locked", label: `Locked (${lifecycleLocked})` },
    { value: "completed", label: `Completed (${lifecycleCompleted})` },
  ];

  const legacyEnrollmentCount = useMemo(() =>
    enrollments.filter(e => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0))).length,
    [enrollments]
  );

  const TAB_CLS = "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium border border-border/60 data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-primary data-[state=active]:shadow-sm bg-background hover:bg-muted transition-colors gap-1.5 h-auto";

  // EVERY value that has a <TabsContent> below must appear in exactly one group.
  // A tab missing from here is not merely ungrouped - `activeGroup` falls back
  // to "ops", so the link opens the Operations pill row, `inActiveGroup` is
  // false for the tab that was actually asked for, and its own pill is never
  // drawn. The visitor asked for one screen and got a different one, with
  // nothing to explain it. Five tabs were in that state: session-attendance
  // (the one labelled "Attendance"), books, trial-books, campaigns and manage.
  // The last four were made visible in the sidebar by #266 without being given
  // a group, so they were findable and still went to the wrong place.
  // The assertion under this list fails loudly if it happens again.
  const TAB_GROUPS: { id: string; label: string; icon: typeof Users; tabs: string[] }[] = [
    { id: "ops",     label: "Operations", icon: BarChart3, tabs: ["students", "enrollments", "leads", "trials", "personal-trials", "lead-funnel", "sales", "promos", "manage"] },
    { id: "learn",   label: "Learning",   icon: Users,     tabs: ["my-students", "placement-tests", "preferences", "availability", "teacher-onboarding", "group-matcher", "group-attendance", "session-attendance", "league-users"] },
    { id: "content", label: "Content",    icon: Sparkles,  tabs: ["blog", "seo-orchestration", "image-audit", "campaigns", "books", "trial-books", "book-plan", "pictures", "brand", "conversation-audio"] },
    { id: "config",  label: "Config",     icon: Settings,  tabs: ["notifications", "scheduling", "settings", "connectors"] },
  ];

  // Development-only. A tab that is linked but ungrouped fails silently in
  // production - it just shows the wrong screen - so say it out loud here,
  // where the person adding the tab is looking.
  if (import.meta.env.DEV && !TAB_GROUPS.some(g => g.tabs.includes(adminTab))) {
    console.warn(
      `[admin] tab "${adminTab}" belongs to no TAB_GROUPS entry, so the Operations ` +
      `group will open instead of it. Add it to a group in AdminDashboard.tsx.`
    );
  }

  const activeGroup = TAB_GROUPS.find(g => g.tabs.includes(adminTab))?.id ?? "ops";
  const [tabGroup, setTabGroup] = useState<string>(activeGroup);
  useEffect(() => { setTabGroup(activeGroup); }, [activeGroup]);
  const currentGroup = useMemo(() => TAB_GROUPS.find(g => g.id === tabGroup), [tabGroup]);
  const inActiveGroup = useCallback((tab: string) => !!currentGroup?.tabs.includes(tab), [currentGroup]);

  // Alt+1..4 jump between groups; ignore if user is typing in an input.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      const idx = ["1", "2", "3", "4"].indexOf(e.key);
      if (idx < 0) return;
      const group = TAB_GROUPS[idx];
      if (!group) return;
      e.preventDefault();
      setTabGroup(group.id);
      setAdminTab(group.tabs[0]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setAdminTab]);

  return (
    <TooltipProvider>
      {/* Skip to main content — keyboard / screen reader shortcut */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        Skip to main content
      </a>
      <div id="main-content">

        <div className="px-4 md:px-6 py-6 space-y-6" aria-live="polite" aria-atomic="false">
          {leadsError && (
            <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-medium">{t("common.dataLoadError")}</p>
                <p className="text-xs mt-0.5 opacity-80">{leadsError}</p>
              </div>
              <button
                onClick={() => invalidateAll()}
                className="shrink-0 text-xs underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          <AdminKpiStrip
            overviewRows={overviewRows}
            actionableEnrollments={actionableEnrollments}
            isLoading={overviewLoading}
          />

          <LifecycleFunnel pendingCount={actionableEnrollments} />

          {/* Collapsible Insights — student health + referral program */}
          {(overviewRows.length > 0 || referralStats.total > 0 || referralStats.totalClicks > 0) && (
            <Collapsible open={insightsOpen} onOpenChange={setInsightsOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card hover:bg-muted/50 px-4 py-2.5 text-sm transition-colors">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">Insights</span>
                  <span className="text-xs text-muted-foreground">
                    Student health · Referrals ({referralStats.total})
                  </span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", insightsOpen && "rotate-180")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-6 pt-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                <StudentHealthPanel overviewRows={overviewRows} />
                {(referralStats.total > 0 || referralStats.totalClicks > 0) && (
            <div className="rounded-2xl border border-border bg-card px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-pink-100 dark:bg-pink-900/30 shrink-0">
                  <Tag className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Referral Program</p>
                  <p className="font-semibold text-sm text-foreground">
                    {referralStats.total} conversion{referralStats.total !== 1 ? "s" : ""} · {referralStats.totalClicks} link click{referralStats.totalClicks !== 1 ? "s" : ""}
                    {referralStats.thisMonth > 0 && <span className="text-green-600 dark:text-green-400 ml-2">· +{referralStats.thisMonth} this month</span>}
                    {referralStats.clicksThisMonth > 0 && <span className="text-blue-600 dark:text-blue-400 ml-1">· {referralStats.clicksThisMonth} click{referralStats.clicksThisMonth !== 1 ? "s" : ""} this month</span>}
                  </p>
                </div>
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">{referralStats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Friends Enrolled</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">+{REFERRAL_CONVERSION_BONUS_PCT}% each</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">{Math.max(0, referralStats.totalClicks - referralStats.total)}</p>
                  <p className="text-[10px] text-muted-foreground">Link-Only Visitors</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">+{REFERRAL_CLICK_BONUS_PCT}% each</p>
                </div>
                <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                  <p className="text-lg font-bold text-foreground">{referralStats.perUser.length}</p>
                  <p className="text-[10px] text-muted-foreground">Active Referrers</p>
                  <p className="text-[10px] text-muted-foreground">max {REFERRAL_MAX_BONUS_PCT}% bonus</p>
                </div>
              </div>

              {/* Per-user breakdown table */}
              {referralStats.perUser.length > 0 && (
                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Top referrers</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/40">
                          <th className="text-start pb-1.5 font-medium">User</th>
                          <th className="text-center pb-1.5 font-medium">Enrolled</th>
                          <th className="text-center pb-1.5 font-medium">Clicks</th>
                          <th className="text-end pb-1.5 font-medium">Bonus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referralStats.perUser.slice(0, 10).map((u) => (
                          <tr key={u.userId} className="border-b border-border/20 last:border-0">
                            <td className="py-1.5 font-mono text-muted-foreground">{u.userId.slice(0, 8)}...</td>
                            <td className="py-1.5 text-center text-foreground">{u.conversions}</td>
                            <td className="py-1.5 text-center text-foreground">{u.clicks}</td>
                            <td className="py-1.5 text-end">
                              <span className={`font-semibold ${u.bonusPercent >= 10 ? "text-green-600 dark:text-green-400" : u.bonusPercent > 0 ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}>
                                +{u.bonusPercent}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">
                    Formula: (enrolled x {REFERRAL_CONVERSION_BONUS_PCT}%) + (click-only visitors x {REFERRAL_CLICK_BONUS_PCT}%), capped at {REFERRAL_MAX_BONUS_PCT}%. Stacks with the 20% promo code for up to {REFERRAL_MAX_BONUS_PCT + 20}% total.
                  </p>
                </div>
              )}
            </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Unified "Action needed" bar — stacks quick-actions into one row */}
          {actionableEnrollments > 0 && (
            <div role="status" aria-label="Action items requiring attention" className="rounded-xl border border-amber-400/60 bg-gradient-to-r from-amber-50 to-amber-100/30 dark:from-amber-950/25 dark:to-amber-900/10 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-400/30">
                <Bell className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                  Action needed ({actionableEnrollments})
                </span>
              </div>
              <div className="divide-y divide-amber-400/20">
                <button
                  type="button"
                  onClick={() => { setAdminTab("enrollments"); setTabGroup("ops"); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-start hover:bg-amber-100/60 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <FileCheck className="h-4 w-4 text-amber-600 shrink-0" />
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-semibold text-amber-900 dark:text-amber-200">{actionableEnrollments}</span>
                    <span className="text-amber-800 dark:text-amber-300"> enrollment{actionableEnrollments > 1 ? "s" : ""} pending review or payment</span>
                  </div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">Review →</span>
                </button>
              </div>
            </div>
          )}

          <Suspense fallback={<TabLoader />}>
          <Tabs id="admin-tabs-root" value={adminTab} onValueChange={setAdminTab}>
            {/* Two-level navigation: group selector + contextual tabs */}
            <div className="w-full bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Group selector */}
              <div className="flex items-center gap-1 p-2 bg-muted/40 border-b border-border/60 overflow-x-auto">
                {TAB_GROUPS.map((g, idx) => {
                  const GroupIcon = g.icon;
                  const isActive = tabGroup === g.id;
                  const hasAlert =
                    (g.id === "ops" && actionableEnrollments > 0) ||
                    (g.id === "learn" && pendingAttendance > 0);
                  return (
                    <Tooltip key={g.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => setTabGroup(g.id)}
                          className={cn(
                            "relative shrink-0 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                            isActive
                              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                          )}
                        >
                          <GroupIcon className="h-3.5 w-3.5" />
                          {g.label}
                          {hasAlert && (
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">
                        Alt+{idx + 1}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              {/* Mobile tab selector (< sm) */}
              {isMobile && currentGroup && (
                <div className="p-3 border-b border-border/60 bg-background">
                  <Select value={adminTab} onValueChange={setAdminTab}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentGroup.tabs.map(t => (
                        <SelectItem key={t} value={t}>
                          {TAB_LABELS[t] ?? t.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <TabsList className={cn(
                "w-full h-auto bg-transparent border-0 rounded-none p-3 flex-wrap items-center gap-1.5 justify-start",
                isMobile ? "hidden" : "flex"
              )}>
                {inActiveGroup("students") && (
                  <TabsTrigger value="students" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Users
                    <span className="opacity-60">({overviewRows.length})</span>
                  </TabsTrigger>
                )}
                {inActiveGroup("enrollments") && (
                  <TabsTrigger value="enrollments" className={TAB_CLS}>
                    <FileCheck className="h-3.5 w-3.5" /> Enrollments
                    {actionableEnrollments > 0 && (
                      <span className="relative inline-flex">
                        <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{actionableEnrollments}</Badge>
                        <span className="absolute inset-0 rounded-full bg-destructive/60 animate-ping" />
                      </span>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("leads") && (
                  <TabsTrigger value="leads" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> New Leads
                    {newLeadsCount > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{newLeadsCount}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("trials") && (
                  <TabsTrigger value="trials" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Trial Classes
                    {trialStats.pending > 0 && (
                      <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{trialStats.pending}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("personal-trials") && (
                  <TabsTrigger value="personal-trials" className={TAB_CLS}>
                    <CalendarPlus className="h-3.5 w-3.5" /> Personal Trials
                  </TabsTrigger>
                )}
                {inActiveGroup("lead-funnel") && (
                  <TabsTrigger value="lead-funnel" className={TAB_CLS}>
                    <TrendingUp className="h-3.5 w-3.5" /> Funnel Analytics
                  </TabsTrigger>
                )}
                {inActiveGroup("manage") && (
                  <TabsTrigger value="manage" className={TAB_CLS}>
                    <Package className="h-3.5 w-3.5" /> Student Admin
                  </TabsTrigger>
                )}
                {inActiveGroup("sales") && (
                  <TabsTrigger value="sales" className={TAB_CLS}>
                    <BarChart3 className="h-3.5 w-3.5" /> Sales
                  </TabsTrigger>
                )}
                {inActiveGroup("promos") && (
                  <TabsTrigger value="promos" className={TAB_CLS}>
                    <Tag className="h-3.5 w-3.5" /> Promos
                  </TabsTrigger>
                )}
                {inActiveGroup("my-students") && (
                  <TabsTrigger value="my-students" className={TAB_CLS}>
                    <GraduationCap className="h-3.5 w-3.5" /> My Students
                  </TabsTrigger>
                )}
                {inActiveGroup("placement-tests") && (
                  <TabsTrigger value="placement-tests" className={TAB_CLS}>Placement Tests</TabsTrigger>
                )}
                {inActiveGroup("preferences") && (
                  <TabsTrigger value="preferences" className={TAB_CLS}>
                    <BarChart3 className="h-3.5 w-3.5" /> Preferences
                  </TabsTrigger>
                )}
                {inActiveGroup("availability") && (
                  <TabsTrigger value="availability" className={TAB_CLS}>
                    <Clock className="h-3.5 w-3.5" /> Group Availability
                  </TabsTrigger>
                )}
                {inActiveGroup("teacher-onboarding") && (
                  <TabsTrigger value="teacher-onboarding" className={TAB_CLS}>
                    <GraduationCap className="h-3.5 w-3.5" /> Teacher Onboarding
                  </TabsTrigger>
                )}
                {inActiveGroup("group-matcher") && (
                  <TabsTrigger value="group-matcher" className={TAB_CLS}>Matcher</TabsTrigger>
                )}
                {inActiveGroup("group-attendance") && (
                  <TabsTrigger value="group-attendance" className={TAB_CLS}>
                    <Users className="h-3.5 w-3.5" /> Groups
                    {pendingAttendance > 0 && (
                      <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{pendingAttendance}</Badge>
                    )}
                  </TabsTrigger>
                )}
                {inActiveGroup("session-attendance") && (
                  <TabsTrigger value="session-attendance" className={TAB_CLS}>
                    <FileCheck className="h-3.5 w-3.5" /> Attendance
                  </TabsTrigger>
                )}
                {inActiveGroup("league-users") && (
                  <TabsTrigger value="league-users" className={TAB_CLS}>
                    <Trophy className="h-3.5 w-3.5" /> Leagues
                  </TabsTrigger>
                )}
                {inActiveGroup("books") && (
                  <TabsTrigger value="books" className={TAB_CLS}>
                    <BookOpen className="h-3.5 w-3.5" /> Books
                  </TabsTrigger>
                )}
                {inActiveGroup("trial-books") && (
                  <TabsTrigger value="trial-books" className={TAB_CLS}>
                    <Clock className="h-3.5 w-3.5" /> Trial Books
                  </TabsTrigger>
                )}
                {inActiveGroup("book-plan") && (
                  <TabsTrigger value="book-plan" className={TAB_CLS}>
                    <BookOpen className="h-3.5 w-3.5" /> Book Plan
                  </TabsTrigger>
                )}
                {inActiveGroup("pictures") && (
                  <TabsTrigger value="pictures" className={TAB_CLS}>
                    <Image className="h-3.5 w-3.5" /> Pictures
                  </TabsTrigger>
                )}
                {inActiveGroup("brand") && (
                  <TabsTrigger value="brand" className={TAB_CLS}>
                    <Palette className="h-3.5 w-3.5" /> Brand
                  </TabsTrigger>
                )}
                {inActiveGroup("conversation-audio") && (
                  <TabsTrigger value="conversation-audio" className={TAB_CLS}>
                    <Volume2 className="h-3.5 w-3.5" /> Book audio
                  </TabsTrigger>
                )}
                {inActiveGroup("blog") && (
                  <TabsTrigger value="blog" className={TAB_CLS}>Blog</TabsTrigger>
                )}
                {inActiveGroup("seo-orchestration") && (
                  <TabsTrigger value="seo-orchestration" className={TAB_CLS}>
                    <Sparkles className="h-3.5 w-3.5" /> SEO AI
                  </TabsTrigger>
                )}
                {inActiveGroup("image-audit") && (
                  <TabsTrigger value="image-audit" className={TAB_CLS}>
                    <Image className="h-3.5 w-3.5" /> Images
                  </TabsTrigger>
                )}
                {inActiveGroup("campaigns") && (
                  <TabsTrigger value="campaigns" className={TAB_CLS}>
                    <Mail className="h-3.5 w-3.5" /> Campaigns
                  </TabsTrigger>
                )}
                {inActiveGroup("notifications") && (
                  <TabsTrigger value="notifications" className={TAB_CLS}>
                    <Bell className="h-3.5 w-3.5" /> Alerts
                  </TabsTrigger>
                )}
                {inActiveGroup("scheduling") && (
                  <TabsTrigger value="scheduling" className={TAB_CLS}>Scheduling</TabsTrigger>
                )}
                {inActiveGroup("settings") && (
                  <TabsTrigger value="settings" className={TAB_CLS}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </TabsTrigger>
                )}
                {inActiveGroup("connectors") && (
                  <TabsTrigger value="connectors" className={TAB_CLS}>
                    <Lock className="h-3.5 w-3.5" /> Connectors
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* STUDENTS TAB */}
            <TabsContent value="students">
              <TabErrorBoundary name="Students">
              <StudentsTab
                overviewRows={overviewRows}
                filteredUsers={filteredUsers}
                sortedUsers={sortedUsers}
                pagedUsers={pagedUsers}
                totalPages={totalPages}
                studentPage={studentPage}
                setStudentPage={setStudentPage}
                studentFilter={studentFilter}
                setStudentFilter={setStudentFilter}
                levelFilter={levelFilter}
                setLevelFilter={setLevelFilter}
                studentSearch={studentSearch}
                setStudentSearch={setStudentSearch}
                studentSort={studentSort}
                setStudentSort={setStudentSort}
                selectedStudentId={selectedStudentId}
                setSelectedStudentId={setSelectedStudentId}
                visibleStudentCols={visibleStudentCols}
                toggleStudentCol={toggleStudentCol}
                studentFilterOptions={studentFilterOptions}
                loading={loading}
                setAdminTab={setAdminTab}
                onDeleteStudent={handleDeleteStudent}
                onManualEnroll={openManualEnroll}
                invalidateAll={invalidateAll}
              />
            </TabErrorBoundary>
            </TabsContent>

            {/* ENROLLMENTS TAB */}
            <TabsContent value="enrollments">
              <TabErrorBoundary name="Enrollments">
              <EnrollmentsTab
                enrollments={enrollments}
                loading={loading}
                enrollmentSearch={enrollmentSearch}
                setEnrollmentSearch={setEnrollmentSearch}
                debouncedEnrollmentSearch={debouncedEnrollmentSearch}
                enrollmentPage={enrollmentPage}
                setEnrollmentPage={setEnrollmentPage}
                selectedEnrollmentIds={selectedEnrollmentIds}
                setSelectedEnrollmentIds={setSelectedEnrollmentIds}
                bulkApproving={bulkApproving}
                handleBulkApprove={handleBulkApprove}
                showLegacyEnrollments={showLegacyEnrollments}
                setShowLegacyEnrollments={setShowLegacyEnrollments}
                legacyEnrollmentCount={legacyEnrollmentCount}
                showOverdueOnly={showOverdueOnly}
                setShowOverdueOnly={setShowOverdueOnly}
                editingUnitPrice={editingUnitPrice}
                setEditingUnitPrice={setEditingUnitPrice}
                sendingReminder={sendingReminder}
                onSendPaymentMethodReminder={handleSendPaymentMethodReminder}
                sendingResend={sendingResend}
                onResendPaymentEmail={handleResendPaymentEmail}
                onResendApprovalEmail={handleResendApprovalEmail}
                onEnrollmentAction={handleEnrollmentAction}
                onReject={(en) => { setRejectTarget(en); setRejectReason("payment_not_received"); setRejectNote(""); }}
                onRevert={handleRevertEnrollment}
                onDelete={handleDeleteEnrollment}
                onViewReceipt={handleViewReceipt}
                onRequestResubmission={handleRequestResubmission}
                onSendClassLink={(en) => { setClassLinkTarget(en); setClassLinkUrl(""); setClassLinkSendToGroup(false); }}
                setAdminTab={setAdminTab}
                leadsByEmail={leadsByEmail}
                invalidateAll={invalidateAll}
              />
            </TabErrorBoundary>
            </TabsContent>
            <TabsContent value="leads">
              <TabErrorBoundary name="Leads">
                <Suspense fallback={<TabLoader />}>
                  <LeadsPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* PERSONAL TRIAL LESSONS TAB — Hungarian, Arabic, English (Reham's own 1:1 lessons) */}
            <TabsContent value="personal-trials">
              <TabErrorBoundary name="Personal Trials">
                <Suspense fallback={<TabLoader />}>
                  <PersonalTrialManager />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* TRIAL CLASSES TAB */}
            <TabsContent value="trials">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Trial Classes</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Trial Classes">
                    <Suspense fallback={<TabLoader />}>
                      <TrialClassesManager />
                    </Suspense>
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LEAD FUNNEL TAB */}
            <TabsContent value="lead-funnel">
              <TabErrorBoundary name="Lead Funnel">
                <Suspense fallback={<TabLoader />}>
                  <LeadFunnelPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* MANAGE STUDENTS TAB */}
            <TabsContent value="manage">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Student Admin</CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Create / edit student records, assign packages, and manage legacy attendance. For the high-level overview use
                    <button
                      type="button"
                      onClick={() => setAdminTab("students")}
                      className="underline underline-offset-2 hover:text-foreground ml-1"
                    >
                      Users →
                    </button>
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Student Manager">
                    <StudentManager />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROMO CODES TAB */}
            <TabsContent value="promos">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Promo Codes</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Promo Codes">
                    <Suspense fallback={<TabLoader />}>
                      <PromoCodesManager />
                    </Suspense>
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP ATTENDANCE TAB */}
            <TabsContent value="group-attendance">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Group Attendance</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Group Attendance">
                    <GroupAttendanceManager
                      overviewRows={overviewRows}
                      selectedStudentId={selectedStudentId}
                      onStudentSelect={setSelectedStudentId}
                      attendanceReqs={attendanceReqs}
                      onAttendanceAction={handleAttendanceAction}
                      onRevertAttendance={handleRevertAttendance}
                      onUpdated={invalidateAll}
                    />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP MATCHER TAB */}
            <TabsContent value="group-matcher" className="space-y-4">
              <TabErrorBoundary name="Recommended Slots">
                <RecommendedSlotsPanel />
              </TabErrorBoundary>
              <TabErrorBoundary name="Group Matcher">
                <GroupMatcher />
              </TabErrorBoundary>
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Notifications">
                    <AdminNotifications />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* BLOG TAB */}
            <TabsContent value="blog">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Blog Manager</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <TabErrorBoundary name="Blog Manager">
                    <BlogManager />
                  </TabErrorBoundary>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SEO ORCHESTRATION TAB */}
            <TabsContent value="seo-orchestration">
              <TabErrorBoundary name="SEO">
                <SeoOrchestrationPanel />
              </TabErrorBoundary>
            </TabsContent>

            {/* IMAGE AUDIT TAB */}
            <TabsContent value="image-audit">
              <TabErrorBoundary name="Image audit">
              <ImageAuditPanel />
              </TabErrorBoundary>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns">
              <div className="space-y-6">
                <TabErrorBoundary name="Email Campaigns">
                  <BulkEmailManager />
                </TabErrorBoundary>
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" /> Profile Completion Reminders
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Send automated emails to students with incomplete profiles, prompting them to fill in missing information on their dashboard.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={async () => {
                        try {
                          toast({ title: "Sending reminders…", description: "Scanning for incomplete profiles." });
                          const { data, error } = await supabase.functions.invoke("send-profile-reminders");
                          if (error) throw error;
                          toast({ title: "Done!", description: `Sent: ${data?.sent || 0}, Skipped (complete): ${data?.skipped || 0}` });
                        } catch (err: any) {
                          toast({ title: "Error", description: err.message, variant: "destructive" });
                        }
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" /> Send Profile Reminder Emails
                    </Button>
                  </CardContent>
                </Card>

                {/* Trial Interest Confirmation Campaign */}
                              </div>
            </TabsContent>


            {/* SCHEDULING TAB */}
            <TabsContent value="scheduling">
              <div className="space-y-6">
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Scheduling Operations</CardTitle>
                    <p className="text-sm text-muted-foreground">Manage packages, groups, waitlists, and notifications.</p>
                  </CardHeader>
                  <CardContent>
                    <TabErrorBoundary name="Scheduling Manager">
                      <SchedulingManager />
                    </TabErrorBoundary>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PLACEMENT TESTS TAB */}
            <TabsContent value="placement-tests">
              <TabErrorBoundary name="Placement Tests">
                <PlacementTestsManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* MY STUDENTS TAB — Re's ongoing 1:1 students. Their classes block
                trial times automatically. Distinct from the Students tab, which
                lists people registered on the site. */}
            <TabsContent value="my-students">
              <TabErrorBoundary name="My Students">
                <UpcomingPrivateClasses />
                <MyStudentsManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* GROUP AVAILABILITY TAB — feeds the group-course matcher via the
                teacher_availability table. Unrelated to trial availability. */}
            <TabsContent value="availability">
              <TabErrorBoundary name="Teacher Availability">
                <TeacherAvailabilityManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* TEACHER ONBOARDING TAB — roster + per-course checklist for
                every teacher the platform is bringing on, across every
                course level. Unrelated to Availability (one teacher's hours). */}
            <TabsContent value="teacher-onboarding">
              <TabErrorBoundary name="Teacher Onboarding">
                <TeacherOnboardingManager />
              </TabErrorBoundary>
            </TabsContent>

            {/* STUDENT PREFERENCES TAB */}
            <TabsContent value="preferences">
              <TabErrorBoundary name="Student Preferences">
                <StudentPreferenceDashboard />
              </TabErrorBoundary>
            </TabsContent>

            {/* LEAGUE USERS TAB */}
            <TabsContent value="league-users">
              <TabErrorBoundary name="League Users">
                <Suspense fallback={<TabLoader />}>
                  <LeagueUsersPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* BOOKS TAB */}
            <TabsContent value="books">
              <TabErrorBoundary name="Book Assignments">
                <Suspense fallback={<TabLoader />}>
                  <BookAssignmentManager />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* BOOK CONVERSATION AUDIO TAB */}
            <TabsContent value="conversation-audio">
              <TabErrorBoundary name="Conversation Audio">
                <Suspense fallback={<TabLoader />}>
                  <ConversationAudio />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* BOOK PLAN TAB */}
            <TabsContent value="book-plan">
              <TabErrorBoundary name="Book Plan">
                <Suspense fallback={<TabLoader />}>
                  <BookPlanBoard />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* PICTURE LIBRARY TAB */}
            <TabsContent value="pictures">
              <TabErrorBoundary name="Picture Library">
                <Suspense fallback={<TabLoader />}>
                  <PictureLibrary />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* BRAND SHEET TAB */}
            <TabsContent value="brand">
              <TabErrorBoundary name="Brand Sheet">
                <Suspense fallback={<TabLoader />}>
                  <BrandSheetPanel />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* TRIAL BOOKS TAB */}
            <TabsContent value="trial-books">
              <TabErrorBoundary name="Trial Books">
                <Suspense fallback={<TabLoader />}>
                  <TrialClassesTab />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>

            {/* SALES ANALYTICS TAB */}
            <TabsContent value="sales">
              <TabErrorBoundary name="Sales Analytics">
                <SalesAnalytics />
              </TabErrorBoundary>
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="session-attendance">
              <TabErrorBoundary name="Session Attendance">
                <SessionAttendanceManager />
              </TabErrorBoundary>
            </TabsContent>
            <TabsContent value="settings">
              <TabErrorBoundary name="Settings">
                <AdminSettings />
              </TabErrorBoundary>
            </TabsContent>

            {/* CONNECTORS TAB (accounts map) — which login opens which platform (admin-only table) */}
            <TabsContent value="connectors">
              <TabErrorBoundary name="Connectors">
                <Suspense fallback={<TabLoader />}>
                  <AccountsMap />
                </Suspense>
              </TabErrorBoundary>
            </TabsContent>
          </Tabs>
          </Suspense>
        </div>
      </div>
      {/* Send Class Link dialog */}
      <ClassLinkDialog
        target={classLinkTarget}
        classLinkUrl={classLinkUrl}
        setClassLinkUrl={setClassLinkUrl}
        sendToGroup={classLinkSendToGroup}
        setSendToGroup={setClassLinkSendToGroup}
        slotDay={classLinkSlotDay}
        setSlotDay={setClassLinkSlotDay}
        slotTime={classLinkSlotTime}
        setSlotTime={setClassLinkSlotTime}
        slotTimezone={classLinkSlotTimezone}
        setSlotTimezone={setClassLinkSlotTimezone}
        firstClassDate={classLinkFirstClassDate}
        setFirstClassDate={setClassLinkFirstClassDate}
        isSending={isSendingClassLink}
        onSend={handleSendClassLink}
        onClose={() => { setClassLinkTarget(null); setClassLinkUrl(""); setClassLinkSendToGroup(false); setClassLinkSlotDay(""); setClassLinkSlotTime(""); setClassLinkSlotTimezone("Africa/Cairo"); setClassLinkFirstClassDate(""); }}
      />

      {/* Receipt preview modal */}
      <ReceiptModal
        receiptModal={receiptModal}
        onClose={() => setReceiptModal(null)}
      />

      {/* Rejection reason dialog — uses proper Dialog for focus trap + Escape handling */}
      <RejectEnrollmentDialog
        target={rejectTarget}
        reason={rejectReason}
        setReason={setRejectReason}
        note={rejectNote}
        setNote={setRejectNote}
        rejecting={rejecting}
        onConfirm={handleConfirmReject}
        onClose={() => setRejectTarget(null)}
      />
      {/* Manual Enroll Dialog */}
      <ManualEnrollDialog
        open={manualEnrollOpen}
        onOpenChange={setManualEnrollOpen}
        enrollTarget={enrollTarget}
        enrollForm={enrollForm}
        setEnrollForm={setEnrollForm}
        pkgGroups={pkgGroups}
        enrollSaving={enrollSaving}
        onEnroll={handleManualEnroll}
      />
    </TooltipProvider>
  );
};

export default AdminDashboard;
