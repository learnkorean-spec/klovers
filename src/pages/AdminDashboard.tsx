import { lazy, Suspense, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { LogOut, Search, Download, Trash2, Check, X, Eye, Undo2, AlertCircle, Bell, ChevronLeft, ChevronRight, Pencil, Mail, Eraser, Sparkles, Settings, BarChart3, RefreshCw, Users, FileCheck, Copy, Clock, Tag, UserPlus, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
// Lazy-load heavy tab components — each loads only when its tab is first opened
const BlogManager = lazy(() => import("@/components/admin/BlogManager"));
const StudentManager = lazy(() => import("@/components/admin/StudentManager"));
const LifecycleFunnel = lazy(() => import("@/components/admin/LifecycleFunnel"));
const GroupAttendanceManager = lazy(() => import("@/components/admin/GroupAttendanceManager"));
const AdminNotifications = lazy(() => import("@/components/admin/AdminNotifications"));
const AdminAttendancePanel = lazy(() => import("@/components/admin/AdminAttendancePanel"));
const GroupMatcher = lazy(() => import("@/components/admin/GroupMatcher"));
const TeacherAvailabilityManager = lazy(() => import("@/components/admin/TeacherAvailabilityManager"));
const StudentPreferenceDashboard = lazy(() => import("@/components/admin/StudentPreferenceDashboard"));
const BulkEmailManager = lazy(() => import("@/components/admin/BulkEmailManager"));
const ScheduleOptionsManager = lazy(() => import("@/components/admin/ScheduleOptionsManager"));
const SchedulingManager = lazy(() => import("@/components/admin/SchedulingManager"));
const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
const PlacementTestsManager = lazy(() => import("@/components/admin/PlacementTestsManager"));
const SalesAnalytics = lazy(() => import("@/components/admin/SalesAnalytics"));
const SessionAttendanceManager = lazy(() => import("@/components/admin/SessionAttendanceManager"));
const StudentHealthPanel = lazy(() => import("@/components/admin/StudentHealthPanel"));
const PromoCodesManager = lazy(() => import("@/components/admin/PromoCodesManager"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

interface Lead {
  id: string; name: string; email: string; country: string; level: string; goal: string; status: string; created_at: string;
  plan_type: string; duration: string; schedule: string; timezone: string; source: string; user_id: string | null;
}

interface Enrollment {
  id: string; user_id: string; plan_type: string; duration: number; classes_included: number;
  amount: number; unit_price: number; tx_ref: string; receipt_url: string; status: string;
  payment_status: string; approval_status: string; payment_provider: string | null;
  admin_review_required: boolean; sessions_remaining: number;
  created_at: string; profiles?: { name: string; email: string; level?: string } | null;
  currency?: string; due_at?: string | null; payment_date?: string | null; payment_method?: string | null;
  preferred_days?: string[] | null; preferred_day?: string | null; preferred_time?: string | null; timezone?: string | null;
  level?: string | null; package_id?: string | null;
}

interface AttendanceReq {
  id: string; user_id: string; request_date: string; status: string; created_at: string;
  profiles?: { name: string; email: string; credits: number } | null;
}

interface OverviewRow {
  user_id: string;
  name: string;
  email: string;
  country: string;
  level: string;
  joined_at: string;
  enrollment_id: string | null;
  payment_status: string | null;
  approval_status: string | null;
  payment_method: string | null;
  payment_provider: string | null;
  sessions_total: number;
  sessions_remaining: number;
  enrollment_created_at: string | null;
  plan_type: string | null;
  duration: number | null;
  amount: number | null;
  currency: string | null;
  derived_status: string;
  source_label: string;
  unit_price: number | null;
  negative_sessions: number;
  amount_due: number;
}

const STATUS_OPTIONS = ["new", "trial_booked", "contacted", "enrolled", "rejected", "lost"];
const PAGE_SIZE = 25;

import { normalizeLevel, LEVEL_SELECT_OPTIONS } from "@/constants/levels";

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceReqs, setAttendanceReqs] = useState<AttendanceReq[]>([]);
  const [overviewRows, setOverviewRows] = useState<OverviewRow[]>([]);
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("confirmed");
  const [planFilter, setPlanFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState("students");
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const [sendingReminder, setSendingReminder] = useState<Set<string>>(new Set());
  const [sendingNameEmails, setSendingNameEmails] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Enrollment | null>(null);
  const [rejectReason, setRejectReason] = useState<"payment_not_received" | "time_slots_unavailable" | "other">("payment_not_received");
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [userGroupMap, setUserGroupMap] = useState<Record<string, string>>({});
  const [studentFilter, setStudentFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [studentSort, setStudentSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "", dir: "asc" });
  const [leadsSort, setLeadsSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "created_at", dir: "desc" });
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [studentPage, setStudentPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [leadsByEmail, setLeadsByEmail] = useState<Record<string, any>>({});
  const [showLegacyEnrollments, setShowLegacyEnrollments] = useState(false);
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleWeekdays, setScheduleWeekdays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
      const { error } = await supabase.rpc("admin_manual_enroll", {
        p_user_id: enrollTarget.user_id,
        p_plan_type: enrollForm.plan_type,
        p_duration: parseInt(enrollForm.duration),
        p_classes_included: sessions,
        p_amount: amount,
        p_currency: enrollForm.currency,
        p_level: enrollForm.level || null,
        p_group_id: enrollForm.plan_type === "group" && enrollForm.group_id ? enrollForm.group_id : null,
      });
      if (error) throw error;
      const desc = enrollForm.plan_type === "private"
        ? `${enrollTarget.name} enrolled as private — assign slot via matcher.`
        : `${enrollTarget.name} added to group with ${sessions} sessions.`;
      toast({ title: "Enrolled!", description: desc });
      setManualEnrollOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setEnrollSaving(false);
    }
  }

  const fetchAll = async () => {
    setLeadsError(null);
    const [leadsRes, enrollRes, attendRes, overviewRes, _batchSkip, _groupsSkip, weekdaysRes, profilesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("attendance_requests").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("admin_student_overview").select("*"),
      Promise.resolve({ data: [] }), // legacy batch_members — no longer used
      Promise.resolve({ data: [] }), // legacy student_groups — no longer used
      supabase.from("schedule_options").select("label, sort_order").eq("category", "weekday").eq("is_active", true).order("sort_order"),
      supabase.from("profiles").select("user_id, name, email, level, country"),
    ]);

    if (weekdaysRes.data && (weekdaysRes.data as any[]).length > 0) {
      setScheduleWeekdays((weekdaysRes.data as any[]).map((r: any) => r.label));
    }

    // Build profile map: first from direct profiles table, then enrich with overview
    const profileMap: Record<string, { name: string; email: string; level?: string }> = {};
    const overviewByEmail: Record<string, any> = {};
    const leadsByEmail: Record<string, any> = {};

    // Index leads by email for level fallback
    if (leadsRes.data) {
      (leadsRes.data as any[]).forEach((l: any) => {
        if (l.email) leadsByEmail[l.email.toLowerCase()] = l;
      });
      setLeadsByEmail(leadsByEmail);
    }

    // Index direct profiles (always available for admin)
    if (profilesRes.data) {
      (profilesRes.data as any[]).forEach((p: any) => {
        const leadLevel = leadsByEmail[p.email?.toLowerCase()]?.level;
        profileMap[p.user_id] = {
          name: p.name,
          email: p.email,
          // Use profile level if set, otherwise fall back to lead level
          level: (p.level && p.level.trim() !== "") ? p.level : (leadLevel || ""),
        };
      });
    }

    // Enrich/override with admin_student_overview data
    if (overviewRes.data) {
      (overviewRes.data as any[]).forEach((r: any) => {
        const existingLevel = profileMap[r.user_id]?.level;
        profileMap[r.user_id] = {
          name: r.name || profileMap[r.user_id]?.name,
          email: r.email || profileMap[r.user_id]?.email,
          level: (r.level && r.level.trim() !== "") ? r.level : (existingLevel || ""),
        };
        overviewByEmail[r.email?.toLowerCase()] = r;
      });
    }

    // Legacy group mapping removed — groups now managed via pkg_groups
    const _userGroupMap: Record<string, string> = {};

    if (leadsRes.error) {
      const msg = `Leads query failed: ${leadsRes.error.message} (code: ${leadsRes.error.code})`;
      console.error(msg, leadsRes.error);
      setLeadsError(msg);
      toast({ title: "Leads query failed", description: leadsRes.error.message, variant: "destructive" });
    } else {
      // Derive lead status from overview (single source of truth)
      const enrichedLeads = (leadsRes.data as Lead[]).map((lead) => {
        const ov = overviewByEmail[lead.email.toLowerCase()];
        let autoStatus = lead.status;
        if (ov) {
          if (["ACTIVE", "COMPLETED", "LOCKED"].includes(ov.derived_status)) {
            autoStatus = "enrolled";
          } else if (ov.enrollment_id) {
            autoStatus = "contacted";
          }
        }
        return { ...lead, status: autoStatus };
      });
      setLeads(enrichedLeads);
    }

    if (enrollRes.data) {
      const enrichedEnrollments = (enrollRes.data as any[]).map((e) => ({
        ...e,
        profiles: profileMap[e.user_id] || null,
      }));
      setEnrollments(enrichedEnrollments);

      // Enrollment level/days are read-only — no admin editing needed
    }
    if (attendRes.data) {
      const overviewMap: Record<string, any> = {};
      if (overviewRes.data) {
        (overviewRes.data as any[]).forEach((r: any) => { overviewMap[r.user_id] = r; });
      }
      setAttendanceReqs((attendRes.data as any[]).map((a) => {
        const ov = overviewMap[a.user_id];
        return {
          ...a,
          profiles: profileMap[a.user_id]
            ? { ...profileMap[a.user_id], credits: ov?.sessions_remaining ?? 0 }
            : null,
        };
      }));
    }
    if (overviewRes.data) setOverviewRows(overviewRes.data as any[]);
    setUserGroupMap(_userGroupMap);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // Level-related state removed — enrollment.level is read-only source of truth

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("leads").update({ status: newStatus } as any).eq("id", id);
    if (error) { toast({ title: "Error", description: "Failed to update status.", variant: "destructive" }); }
    else { setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }); }
    else { setLeads((prev) => prev.filter((l) => l.id !== id)); toast({ title: "Deleted" }); }
  };

  const handleDeleteStudent = async (userId: string) => {
    const { error } = await supabase.from("profiles").delete().eq("user_id", userId);
    if (error) { toast({ title: "Error", description: "Failed to delete student.", variant: "destructive" }); return; }
    setOverviewRows((prev) => prev.filter((r) => r.user_id !== userId));
    toast({ title: "Deleted", description: "Student record removed." });
  };

  const handleDeduplicateLeads = async () => {
    // Group leads by lowercase email, keep the newest (first in array since sorted desc)
    const emailMap: Record<string, typeof leads> = {};
    for (const l of leads) {
      const key = l.email.toLowerCase().trim();
      if (!emailMap[key]) emailMap[key] = [];
      emailMap[key].push(l);
    }
    const dupeIds: string[] = [];
    for (const [, group] of Object.entries(emailMap)) {
      if (group.length <= 1) continue;
      // Keep the first (newest by created_at desc), delete rest
      for (let i = 1; i < group.length; i++) {
        dupeIds.push(group[i].id);
      }
    }
    if (dupeIds.length === 0) {
      toast({ title: "No duplicates", description: "All leads are unique." });
      return;
    }
    const { error } = await supabase.from("leads").delete().in("id", dupeIds);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setLeads((prev) => prev.filter((l) => !dupeIds.includes(l.id)));
      toast({ title: "Duplicates removed", description: `Deleted ${dupeIds.length} duplicate lead(s).` });
    }
  };

  const handleEditLead = async () => {
    if (!editingLeadId) return;
    const { error } = await supabase.from("leads").update({
      name: editForm.name,
      email: editForm.email,
      country: editForm.country || "",
      plan_type: editForm.plan_type || "",
      duration: editForm.duration || "",
      schedule: editForm.schedule || "",
      timezone: editForm.timezone || "",
      status: editForm.status || "new",
    } as any).eq("id", editingLeadId);
    if (error) {
      toast({ title: "Error", description: "Failed to update lead.", variant: "destructive" });
      return;
    }
    setLeads((prev) => prev.map((l) => l.id === editingLeadId ? { ...l, ...editForm } : l));
    setEditingLeadId(null);
    setEditForm({});
    toast({ title: "Lead updated" });
  };

  const startEditLead = (lead: Lead) => {
    setEditingLeadId(lead.id);
    setEditForm({ ...lead });
  };

  const cancelEditLead = () => {
    setEditingLeadId(null);
    setEditForm({});
  };

  const handleSendNameCollectionEmails = async () => {
    setSendingNameEmails(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-name-collection-email");
      if (error) throw error;
      toast({ title: "Done!", description: `Name request emails sent: ${data?.sent ?? 0} · Skipped: ${data?.skipped ?? 0}` });
    } catch (err: any) {
      toast({ title: "Error sending name emails", description: err.message, variant: "destructive" });
    } finally {
      setSendingNameEmails(false);
    }
  };

  const handleLinkLeadsByEmail = async () => {
    // Find unlinked leads and match them to profiles by email
    const unlinked = leads.filter(l => !l.user_id);
    if (unlinked.length === 0) {
      toast({ title: "All leads already linked" });
      return;
    }
    let linked = 0;
    // Get all profiles for matching
    const { data: profiles } = await supabase.from("profiles").select("user_id, email");
    if (!profiles) return;
    const profileByEmail: Record<string, string> = {};
    for (const p of profiles as any[]) {
      if (p.email) profileByEmail[p.email.toLowerCase().trim()] = p.user_id;
    }
    for (const lead of unlinked) {
      const userId = profileByEmail[lead.email.toLowerCase().trim()];
      if (userId) {
        const { error } = await supabase.from("leads").update({ user_id: userId } as any).eq("id", lead.id);
        if (!error) linked++;
      }
    }
    toast({ title: `Linked ${linked} lead(s)`, description: `${unlinked.length - linked} remain unlinked.` });
    fetchAll();
  };

  const confirmedEmails = useMemo(() => {
    const emails = new Set<string>();
    overviewRows.forEach((r) => {
      if (r.payment_status === "PAID" && r.approval_status === "APPROVED" && r.email) {
        emails.add(r.email.toLowerCase());
      }
    });
    return emails;
  }, [overviewRows]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
      const isConfirmed = l.status === "enrolled" || confirmedEmails.has(l.email.toLowerCase());
      const matchesPlan = planFilter === "all" || l.plan_type === planFilter;
      if (statusFilter === "confirmed") return matchesSearch && isConfirmed && matchesPlan;
      if (statusFilter === "all") return matchesSearch && matchesPlan;
      return matchesSearch && l.status === statusFilter && matchesPlan;
    });
  }, [leads, search, statusFilter, planFilter, confirmedEmails]);

  const statusCounts = useMemo(() =>
    leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>),
    [leads]
  );

  const sortedLeads = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (leadsSort.col === "name") {
        const cmp = (a.name || "").localeCompare(b.name || "");
        return leadsSort.dir === "asc" ? cmp : -cmp;
      }
      if (leadsSort.col === "country") {
        const cmp = (a.country || "").localeCompare(b.country || "");
        return leadsSort.dir === "asc" ? cmp : -cmp;
      }
      // default: created_at
      const cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return leadsSort.dir === "asc" ? cmp : -cmp;
    });
  }, [filtered, leadsSort]);

  const exportCSV = () => {
    const headers = ["Name", "Email", "Country", "Level", "Plan", "Duration", "Schedule", "Timezone", "Source", "Status", "Goal", "Date"];
    const rows = sortedLeads.map((l) => [l.name, l.email, l.country, l.level, l.plan_type, l.duration, l.schedule, l.timezone, l.source, l.status, l.goal, new Date(l.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      let resubmitLink: string | undefined;
      if (rejectReason === "time_slots_unavailable") {
        const token = crypto.randomUUID().replace(/-/g, "");
        await (supabase as any).from("schedule_resubmission_requests").insert({
          enrollment_id: rejectTarget.id,
          user_id: rejectTarget.user_id,
          email: rejectTarget.profiles?.email || "",
          token,
        });
        resubmitLink = `${window.location.origin}/resubmit-schedule?token=${token}`;
      }
      await handleEnrollmentAction(rejectTarget, "REJECTED");
      await supabase.functions.invoke("send-confirmation-email", {
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
      toast({ title: "Rejected & notified", description: `Email sent to ${rejectTarget.profiles?.email}` });
      setRejectTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to reject or send email.", variant: "destructive" });
    } finally {
      setRejecting(false);
    }
  };

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

  const handleEnrollmentAction = async (enrollment: Enrollment, action: "APPROVED" | "REJECTED") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const updates: any = {
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
    }

    const editedPrice = editingUnitPrice[enrollment.id];
    if (editedPrice && action === "APPROVED") {
      const price = Number(editedPrice);
      if (isNaN(price)) {
        toast({ title: "Invalid price", description: "Unit price must be a valid number.", variant: "destructive" });
        return;
      }
      if (price <= 0) {
        toast({ title: "Invalid price", description: "Unit price must be greater than zero.", variant: "destructive" });
        return;
      }
      if (price > 10000) {
        toast({ title: "Invalid price", description: "Unit price seems too high. Please verify.", variant: "destructive" });
        return;
      }
      updates.unit_price = price;
    }

    // Level and days are read-only from enrollment — no admin editing

    const { error } = await supabase.from("enrollments").update(updates).eq("id", enrollment.id);
    if (error) { toast({ title: "Error", description: "Failed to update enrollment.", variant: "destructive" }); return; }

    if (action === "APPROVED") {
      const { error: creditError } = await supabase.rpc("add_credits", {
        _user_id: enrollment.user_id,
        _amount: enrollment.classes_included,
      });
      if (creditError) {
        toast({ title: "Error", description: "Failed to add credits.", variant: "destructive" });
        return;
      }

      // Group enrollments: just approve — admin will match via Matcher tab
    }

    toast({ title: `Enrollment ${action.toLowerCase()}` });
    fetchAll();
  };

  const handleRevertEnrollment = async (enrollment: Enrollment) => {
    const { error } = await supabase.rpc("revert_enrollment", {
      _enrollment_id: enrollment.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment reverted to pending, credits deducted." });
    fetchAll();
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to delete enrollment.", variant: "destructive" });
      return;
    }
    toast({ title: "Enrollment deleted" });
    fetchAll();
  };

  const handleAttendanceAction = async (req: AttendanceReq, action: "APPROVED" | "REJECTED") => {
    if (action === "APPROVED") {
      const { data, error } = await supabase.rpc("approve_attendance_request", {
        _request_id: req.id,
      } as any);
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to approve.", variant: "destructive" });
        return;
      }
      toast({ title: "Attendance approved", description: `Sessions remaining: ${data}` });
    } else {
      const { error } = await supabase.rpc("reject_attendance_request", {
        _request_id: req.id,
      } as any);
      if (error) {
        toast({ title: "Error", description: error.message || "Failed to reject.", variant: "destructive" });
        return;
      }
      toast({ title: "Attendance rejected" });
    }
    fetchAll();
  };

  const handleRevertAttendance = async (req: AttendanceReq) => {
    const { error } = await supabase.rpc("revert_attendance_request" as any, {
      _request_id: req.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to revert.", variant: "destructive" });
      return;
    }
    toast({ title: "Reverted to pending", description: req.status === "APPROVED" ? "Session restored." : "Request is pending again." });
    fetchAll();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  // Computed badge counts
  const actionableEnrollments = enrollments.filter(e =>
    e.approval_status === "UNDER_REVIEW" ||
    e.approval_status === "PENDING_PAYMENT" ||
    (e.approval_status === "PENDING" && e.admin_review_required)
  ).length;
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

  // Filtered + searched users from view
  const filteredUsers = useMemo(() => {
    return overviewRows.filter(u => {
      const matchesSearch = !studentSearch || u.name?.toLowerCase().includes(studentSearch.toLowerCase()) || u.email?.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesFilter = studentFilter === "confirmed" ? ["ACTIVE", "COMPLETED", "LOCKED"].includes(u.derived_status)
        : studentFilter === "leads" ? u.derived_status === "LEAD"
        : studentFilter === "stripe" ? u.source_label === "Stripe"
        : studentFilter === "egypt" ? u.source_label === "Egypt"
        : studentFilter === "overdue" ? u.amount_due > 0
        : true;
      const matchesLevel = levelFilter === "all" || normalizeLevel(u.level || "") === levelFilter;
      return matchesSearch && matchesFilter && matchesLevel;
    });
  }, [overviewRows, studentSearch, studentFilter, levelFilter]);

  // Sorted users (after filter, before pagination)
  const sortedUsers = useMemo(() => {
    if (!studentSort.col) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      const v = (x: typeof a) =>
        studentSort.col === "sessions_remaining" ? x.sessions_remaining
        : studentSort.col === "amount_due" ? x.amount_due
        : studentSort.col === "joined_at" ? new Date(x.joined_at).getTime()
        : studentSort.col === "attendance_pct" ? (x.sessions_total > 0 ? (x.sessions_total - x.sessions_remaining) / x.sessions_total : -1)
        : 0;
      return studentSort.dir === "asc" ? v(a) - v(b) : v(b) - v(a);
    });
  }, [filteredUsers, studentSort]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE));
  const pagedUsers = sortedUsers.slice(studentPage * PAGE_SIZE, (studentPage + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setStudentPage(0); }, [studentSearch, studentFilter, levelFilter]);

  const overdueCount = overviewRows.filter(u => u.amount_due > 0).length;
  const studentFilterOptions = [
    { value: "all", label: `All (${overviewRows.length})` },
    { value: "confirmed", label: `Confirmed (${confirmedCount})` },
    { value: "leads", label: `Leads (${leadsProfileCount})` },
    { value: "stripe", label: `Stripe (${stripeCount})` },
    { value: "egypt", label: `Egypt Manual (${egyptCount})` },
    { value: "overdue", label: `Overdue (${overdueCount})` },
  ];

  const legacyEnrollmentCount = useMemo(() =>
    enrollments.filter(e => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0))).length,
    [enrollments]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const TAB_CLS = "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border border-border data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:border-primary bg-background gap-1.5 h-auto";
  const TAB_GROUP_LABEL = "text-[10px] font-bold text-muted-foreground uppercase tracking-widest self-center shrink-0 pr-1";

  return (
    <TooltipProvider>
      <div id="main-content" className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-6">
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage students, enrollments & content</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/marketing")}><Sparkles className="h-4 w-4 mr-2" /> Marketing</Button>
              <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          {leadsError && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="mt-0.5 shrink-0">⚠️</span>
              <div className="flex-1">
                <p className="font-medium">Data load error</p>
                <p className="text-xs mt-0.5 opacity-80">{leadsError}</p>
              </div>
              <button
                onClick={() => { setLeadsError(null); fetchAll(); }}
                className="shrink-0 text-xs underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          <LifecycleFunnel
            leadsCount={lifecycleLeads}
            registeredCount={overviewRows.length}
            enrolledCount={lifecycleConfirmedTotal}
            activeCount={lifecycleActive}
            completedCount={lifecycleCompleted + lifecycleLocked}
            pendingCount={actionableEnrollments}
            onPendingClick={() => setAdminTab("enrollments")}
          />

          <StudentHealthPanel overviewRows={overviewRows} />

          {/* Pending enrollments alert */}
          {actionableEnrollments > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors"
              onClick={() => { setAdminTab("enrollments"); setTimeout(() => document.getElementById("admin-tabs-root")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80); }}
            >
              <Bell className="h-5 w-5 text-amber-600 shrink-0 animate-pulse" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                  {actionableEnrollments} enrollment{actionableEnrollments > 1 ? "s" : ""} need{actionableEnrollments === 1 ? "s" : ""} your attention
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Pending payment or under review — click to open Enrollments tab</p>
              </div>
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 shrink-0">View →</span>
            </div>
          )}

          <Suspense fallback={<TabLoader />}>
          <Tabs id="admin-tabs-root" value={adminTab} onValueChange={setAdminTab}>
            <TabsList className="w-full h-auto bg-card border border-border rounded-2xl p-3 flex flex-col gap-2">
              {/* Operations row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={TAB_GROUP_LABEL}>Ops</span>
                <TabsTrigger value="students" className={TAB_CLS}>
                  <Users className="h-3.5 w-3.5" /> Users
                  <span className="opacity-60">({overviewRows.length})</span>
                </TabsTrigger>
                <TabsTrigger value="enrollments" className={TAB_CLS}>
                  <FileCheck className="h-3.5 w-3.5" /> Enrollments
                  {actionableEnrollments > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{actionableEnrollments}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="leads" className={TAB_CLS}>
                  <Users className="h-3.5 w-3.5" /> CRM Leads
                </TabsTrigger>
                <TabsTrigger value="manage" className={TAB_CLS}>Manage</TabsTrigger>
                <TabsTrigger value="sales" className={TAB_CLS}>
                  <BarChart3 className="h-3.5 w-3.5" /> Sales
                </TabsTrigger>
                <TabsTrigger value="promos" className={TAB_CLS}>
                  <Tag className="h-3.5 w-3.5" /> Promos
                </TabsTrigger>
              </div>

              <div className="w-full h-px bg-border" />

              {/* Learning row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={TAB_GROUP_LABEL}>Learn</span>
                <TabsTrigger value="group-attendance" className={TAB_CLS}>
                  Groups
                  {pendingAttendance > 0 && (
                    <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[9px] rounded-full">{pendingAttendance}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="group-matcher" className={TAB_CLS}>Matcher</TabsTrigger>
                <TabsTrigger value="placement-tests" className={TAB_CLS}>Placement Tests</TabsTrigger>
                <TabsTrigger value="session-attendance" className={TAB_CLS}>
                  <FileCheck className="h-3.5 w-3.5" /> Attendance
                </TabsTrigger>
                <TabsTrigger value="preferences" className={TAB_CLS}>
                  <BarChart3 className="h-3.5 w-3.5" /> Preferences
                </TabsTrigger>
              </div>

              <div className="w-full h-px bg-border" />

              {/* Content & Config row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={TAB_GROUP_LABEL}>Content</span>
                <TabsTrigger value="blog" className={TAB_CLS}>Blog</TabsTrigger>
                <TabsTrigger value="campaigns" className={TAB_CLS}>
                  <Mail className="h-3.5 w-3.5" /> Campaigns
                </TabsTrigger>
                <div className="w-px h-4 bg-border mx-1 self-center" />
                <span className={TAB_GROUP_LABEL}>Config</span>
                <TabsTrigger value="notifications" className={TAB_CLS}>
                  <Bell className="h-3.5 w-3.5" /> Alerts
                </TabsTrigger>
                <TabsTrigger value="scheduling" className={TAB_CLS}>Scheduling</TabsTrigger>
                <TabsTrigger value="availability" className={TAB_CLS}>
                  <Clock className="h-3.5 w-3.5" /> Availability
                </TabsTrigger>
                <TabsTrigger value="settings" className={TAB_CLS}>
                  <Settings className="h-3.5 w-3.5" /> Settings
                </TabsTrigger>
              </div>
            </TabsList>

            {/* STUDENTS TAB */}
            <TabsContent value="students">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Users</CardTitle>
                      <p className="text-xs text-muted-foreground">{filteredUsers.length} of {overviewRows.length}</p>
                    </div>
                    {/* Responsive student filters */}
                    {isMobile ? (
                      <Select value={studentFilter} onValueChange={setStudentFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {studentFilterOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
                        {studentFilterOptions.map(opt => (
                          <Button
                            key={opt.value}
                            variant={studentFilter === opt.value ? "default" : "outline"}
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => setStudentFilter(opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}
                    {/* Search + Level filter + Export */}
                    <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
                      </div>
                      <Select value={levelFilter} onValueChange={setLevelFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Levels</SelectItem>
                          {LEVEL_SELECT_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => {
                        const headers = ["Name", "Email", "Country", "Level", "Remaining Sessions", "Status", "Source", "Joined"];
                        const rows = filteredUsers.map(u => [u.name, u.email, u.country, u.level, u.sessions_remaining, u.derived_status, u.source_label, new Date(u.joined_at).toLocaleDateString()]);
                        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
                        URL.revokeObjectURL(url);
                      }}>
                        <Download className="h-4 w-4" />
                        {!isMobile && <span className="ml-1">Export CSV</span>}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : sortedUsers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No students found.</p>
              ) : (
                <>
                  <div className="border rounded-xl overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                          <TableHead className="py-3 px-3 font-semibold">Name</TableHead>
                          <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                          <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Country</TableHead>
                          <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Level</TableHead>
                          <TableHead
                            className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "sessions_remaining", dir: s.col === "sessions_remaining" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Remaining {studentSort.col === "sessions_remaining" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead
                            className="py-3 px-3 font-semibold text-center cursor-pointer select-none hover:text-primary hidden sm:table-cell"
                            onClick={() => setStudentSort(s => ({ col: "attendance_pct", dir: s.col === "attendance_pct" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Attend% {studentSort.col === "attendance_pct" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead className="py-3 px-3 font-semibold text-center">Negative</TableHead>
                          <TableHead
                            className="py-3 px-3 font-semibold text-right cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "amount_due", dir: s.col === "amount_due" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Amount Due {studentSort.col === "amount_due" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                          <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Source</TableHead>
                          <TableHead
                            className="py-3 px-3 hidden sm:table-cell font-semibold cursor-pointer select-none hover:text-primary"
                            onClick={() => setStudentSort(s => ({ col: "joined_at", dir: s.col === "joined_at" && s.dir === "asc" ? "desc" : "asc" }))}
                          >
                            Joined {studentSort.col === "joined_at" ? (studentSort.dir === "asc" ? "↑" : "↓") : "↕"}
                          </TableHead>
                          <TableHead className="py-3 px-3 w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedUsers.map((u) => (
                          <TableRow key={u.user_id} className={cn("group odd:bg-muted/30 hover:bg-muted/50 transition cursor-pointer", selectedStudentId === u.user_id && "ring-2 ring-primary/40")} onClick={() => setSelectedStudentId(selectedStudentId === u.user_id ? null : (u.enrollment_id ? u.user_id : null))}>
                            <TableCell className="py-3 px-3 font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>{u.name || "—"}</span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-primary"
                                  title="Manually enroll"
                                  onClick={e => { e.stopPropagation(); openManualEnroll(u); }}
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3">
                              <div className="flex items-center gap-1 max-w-[240px]">
                                <span className="truncate flex-1 text-sm">{u.email}</span>
                                <button
                                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.email); toast({ title: "Copied" }); }}
                                >
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{u.country || "—"}</TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{u.level || "—"}</TableCell>
                            <TableCell className="py-3 px-3 text-center font-mono">{u.sessions_remaining}</TableCell>
                            <TableCell className="py-3 px-3 text-center hidden sm:table-cell">
                              {u.sessions_total > 0 ? (() => {
                                const pct = Math.round(((u.sessions_total - u.sessions_remaining) / u.sessions_total) * 100);
                                return (
                                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${pct >= 80 ? "bg-green-100 text-green-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                                    {pct}%
                                  </span>
                                );
                              })() : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="py-3 px-3 text-center font-mono">{u.negative_sessions > 0 ? <span className="text-destructive">{u.negative_sessions}</span> : "—"}</TableCell>
                            <TableCell className="py-3 px-3 text-right font-mono">{u.amount_due > 0 ? <span className="text-destructive">{u.currency === "EGP" ? "LE" : "$"}{Math.round(u.amount_due).toLocaleString()}</span> : "—"}</TableCell>
                            <TableCell className="py-3 px-3">
                              <Badge variant={u.derived_status === "ACTIVE" ? "default" : u.derived_status === "LOCKED" ? "destructive" : "secondary"} className="text-xs">{u.derived_status}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell">
                              <Badge variant="outline" className="text-xs">{u.source_label}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                            <TableCell className="py-3 px-3 w-10" onClick={(e) => e.stopPropagation()}>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete student?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete {u.name || u.email}'s profile. This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteStudent(u.user_id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-muted-foreground">
                        Page {studentPage + 1} of {totalPages} · {sortedUsers.length} results
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage === 0} onClick={() => setStudentPage(p => p - 1)}>
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={studentPage >= totalPages - 1} onClick={() => setStudentPage(p => p + 1)}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
                </CardContent>
              </Card>

              {/* Attendance Panel */}
              {selectedStudentId && (() => {
                const student = overviewRows.find(u => u.user_id === selectedStudentId);
                if (!student || !student.enrollment_id) return null;
                return (
                  <AdminAttendancePanel
                    enrollmentId={student.enrollment_id}
                    userId={student.user_id}
                    studentName={student.name || student.email}
                    sessionsRemaining={student.sessions_remaining}
                    negativeSessions={student.negative_sessions}
                    amountDue={student.amount_due}
                    currency={student.currency}
                    derivedStatus={student.derived_status}
                    onClose={() => setSelectedStudentId(null)}
                    onUpdated={fetchAll}
                  />
                );
              })()}
            </TabsContent>

            <TabsContent value="enrollments">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <CardTitle className="text-base">Enrollments</CardTitle>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showLegacyEnrollments}
                          onChange={(e) => setShowLegacyEnrollments(e.target.checked)}
                          className="rounded"
                        />
                        Show Legacy ({legacyEnrollmentCount})
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={async () => {
                          const { data, error } = await supabase.rpc("backfill_missing_enrollments" as any);
                          if (error) {
                            toast({ title: "Backfill failed", description: error.message, variant: "destructive" });
                          } else {
                            const result = data as any;
                            toast({ title: "Backfill complete", description: `Fixed: ${result?.fixed ?? 0}, Remaining: ${result?.remaining ?? 0}` });
                            fetchAll();
                          }
                        }}
                      >
                        Backfill Missing
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
              {loading ? (
                <div className="space-y-2 py-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="under_review">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name, email or plan…" value={enrollmentSearch} onChange={(e) => setEnrollmentSearch(e.target.value)} className="pl-9" />
                  </div>
                  {(() => {
                    const missing = enrollments.filter(e => e.currency === "EGP" && !e.payment_method && (e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW"));
                    if (missing.length === 0) return null;
                    return (
                      <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2.5 mb-3">
                        <span className="text-sm text-amber-800 font-medium flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          {missing.length} Egypt enrollment{missing.length > 1 ? "s" : ""} missing payment method
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0"
                          disabled={missing.some(e => sendingReminder.has(e.id))}
                          onClick={async () => { for (const e of missing) await handleSendPaymentMethodReminder(e); }}
                        >
                          Notify All ({missing.length})
                        </Button>
                      </div>
                    );
                  })()}
                  <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3 h-auto bg-transparent p-0 w-full">
                    {[
                      { value: "under_review", label: "Under Review", count: enrollments.filter(e => e.approval_status === "UNDER_REVIEW").length },
                      { value: "pending_payment", label: "Pending Payment", count: enrollments.filter(e => e.approval_status === "PENDING_PAYMENT").length },
                      { value: "pending", label: "Pending", count: enrollments.filter(e => e.approval_status === "PENDING").length },
                      { value: "approved", label: "Approved", count: enrollments.filter(e => e.approval_status === "APPROVED").length },
                      { value: "rejected", label: "Rejected", count: enrollments.filter(e => e.approval_status === "REJECTED").length },
                    ].map(t => (
                      <TabsTrigger key={t.value} value={t.value} className="shrink-0 rounded-full px-4 py-2 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                        {t.label} ({t.count})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(["pending_payment", "under_review", "pending", "approved", "rejected"] as const).map((tab) => {
                    const isLegacy = (e: Enrollment) => (!e.level || e.level.trim() === '') && (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0));
                    const filtered = enrollments.filter((e) => {
                      const matchesTab = tab === "pending_payment" ? e.approval_status === "PENDING_PAYMENT"
                        : tab === "under_review" ? e.approval_status === "UNDER_REVIEW"
                        : tab === "pending" ? e.approval_status === "PENDING"
                        : tab === "approved" ? e.approval_status === "APPROVED"
                        : e.approval_status === "REJECTED";
                      if (!matchesTab) return false;
                      const isActionable = e.approval_status === "PENDING_PAYMENT" || e.approval_status === "UNDER_REVIEW";
                      if (!showLegacyEnrollments && isLegacy(e) && !isActionable) return false;
                      if (enrollmentSearch) {
                        const q = enrollmentSearch.toLowerCase();
                        const name = e.profiles?.name?.toLowerCase() ?? "";
                        const email = e.profiles?.email?.toLowerCase() ?? "";
                        const plan = e.plan_type?.toLowerCase() ?? "";
                        if (!name.includes(q) && !email.includes(q) && !plan.includes(q)) return false;
                      }
                      return true;
                    });
                    return (
                      <TabsContent key={tab} value={tab} className="space-y-4">
                        {filtered.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">No {tab} enrollments.</p>
                        ) : filtered.map((e) => (
                          <Card key={e.id}>
                            <CardContent className="pt-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">{e.profiles?.name || "Unknown"} — {e.profiles?.email}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {e.plan_type} · {e.duration}mo · {e.classes_included} classes · {e.currency === 'EGP' ? `${Math.round(e.amount).toLocaleString()} EGP` : `$${Math.round(e.amount)}`} · Ref: {e.tx_ref || '—'}
                                    {e.payment_method && <> · <span className="font-medium">{e.payment_method === 'vodafone_cash' ? 'Vodafone Cash' : e.payment_method === 'instapay' ? 'InstaPay' : e.payment_method === 'bank_transfer' ? 'Bank Transfer' : e.payment_method}</span></>}
                                    {e.currency === 'EGP' && !e.payment_method && (e.approval_status === 'PENDING_PAYMENT' || e.approval_status === 'UNDER_REVIEW') && (
                                      <span className="inline-flex items-center gap-1.5 ml-2">
                                        <Badge variant="outline" className="text-xs border-amber-400 text-amber-700 bg-amber-50">
                                          ⚠ Missing payment method
                                        </Badge>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-6 text-xs border-amber-400 text-amber-700 hover:bg-amber-50"
                                          disabled={sendingReminder.has(e.id)}
                                          onClick={() => handleSendPaymentMethodReminder(e)}
                                        >
                                          {sendingReminder.has(e.id) ? "Sending…" : "Send Reminder"}
                                        </Button>
                                      </span>
                                    )}
                                    {e.payment_date && <> · Paid: {e.payment_date}</>}
                                    {e.due_at && e.approval_status === 'PENDING_PAYMENT' && <> · Due: {new Date(e.due_at).toLocaleString()}</>}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Unit price:</span>
                                    {editingUnitPrice[e.id] !== undefined ? (
                                      <Input
                                        type="number"
                                        className="h-7 w-24"
                                        min="0.01"
                                        max="10000"
                                        step="0.01"
                                        value={editingUnitPrice[e.id]}
                                        onChange={(ev) => setEditingUnitPrice((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-foreground">${Math.round(e.unit_price)}</span>
                                    )}
                                  </div>
                                  {/* Editable Level & Preferred Days for pending enrollments */}
                                  {e.plan_type === "group" && (
                                    <div className="space-y-2 pt-2 border-t border-border">
                                      {/* Read-only Level badge */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground shrink-0">Level:</span>
                                        {(() => {
                                          const profileEmail = e.profiles?.email?.toLowerCase() ?? "";
                                          const leadLvl = profileEmail && leadsByEmail[profileEmail]?.level?.trim()
                                            ? normalizeLevel(leadsByEmail[profileEmail].level)
                                            : "";
                                          const resolvedLevel = (e.level?.trim() ? normalizeLevel(e.level) : null)
                                            ?? leadLvl
                                            ?? "";
                                          return resolvedLevel ? (
                                            <Badge variant="outline">{resolvedLevel.replace(/_/g, " ")}</Badge>
                                          ) : (
                                            <Badge variant="destructive" className="text-xs">Missing level</Badge>
                                          );
                                        })()}
                                      </div>
                                      {/* Read-only Preferred day (single) with legacy fallback */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm text-muted-foreground shrink-0">Day:</span>
                                        {(() => {
                                          const day = e.preferred_day || (e.preferred_days && e.preferred_days.length > 0 ? e.preferred_days[0] : null);
                                          return day ? (
                                            <Badge variant="secondary" className="text-xs">{day}</Badge>
                                          ) : (
                                            <span className="text-xs text-muted-foreground italic">Not set</span>
                                          );
                                        })()}
                                        {e.preferred_time && (
                                          <span className="text-xs text-muted-foreground">· {e.preferred_time}</span>
                                        )}
                                        {e.timezone && (
                                          <span className="text-xs text-muted-foreground">· {e.timezone.replace(/_/g, " ")}</span>
                                        )}
                                      </div>
                                      {/* Missing schedule warning + resubmission button */}
                                      {(!e.level || (!e.preferred_day && (!e.preferred_days || e.preferred_days.length === 0))) && (
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" /> Legacy / Missing registration schedule
                                          </Badge>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-xs"
                                            onClick={async () => {
                                              const token = crypto.randomUUID().replace(/-/g, "");
                                              const { error: insertErr } = await (supabase as any)
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
                                            }}
                                          >
                                            Request Resubmission
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {/* Show existing preferences for approved enrollments */}
                                  {e.approval_status === "APPROVED" && (e.preferred_day || (e.preferred_days && e.preferred_days.length > 0)) && (
                                    <p className="text-xs text-muted-foreground">
                                      📅 {e.preferred_day || e.preferred_days?.join(", ")} {e.preferred_time ? `· ${e.preferred_time}` : ""}
                                    </p>
                                  )}
                                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={e.payment_provider === "stripe" ? "default" : "secondary"}>
                                    {e.payment_provider === "stripe" ? "Stripe" : "Manual"}
                                  </Badge>
                                  <Badge variant={e.approval_status === "APPROVED" ? "default" : e.approval_status === "REJECTED" ? "destructive" : "secondary"}>
                                    {e.approval_status}
                                  </Badge>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!e.receipt_url || e.receipt_url.length === 0}
                                    className={e.receipt_url && e.receipt_url.length > 0
                                      ? "border-green-400 text-green-700 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-950/30"
                                      : "opacity-50 cursor-not-allowed"
                                    }
                                    title={e.receipt_url && e.receipt_url.length > 0 ? "View payment receipt" : "No receipt uploaded yet"}
                                    onClick={async () => {
                                      if (!e.receipt_url || e.receipt_url.length === 0) return;
                                      if (e.receipt_url.startsWith("stripe:")) {
                                        toast({ title: "Stripe payment", description: "This enrollment was paid via Stripe — no manual receipt." });
                                        return;
                                      }
                                      if (e.receipt_url.startsWith("http")) {
                                        window.open(e.receipt_url, "_blank");
                                        return;
                                      }
                                      const { data, error } = await supabase.storage
                                        .from("receipts")
                                        .createSignedUrl(e.receipt_url, 600);
                                      if (error || !data?.signedUrl) {
                                        toast({ title: "Error", description: "Could not load receipt.", variant: "destructive" });
                                        return;
                                      }
                                      window.open(data.signedUrl, "_blank");
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {e.receipt_url && e.receipt_url.length > 0 ? "Receipt ✓" : "No Receipt"}
                                  </Button>
                                   {(e.approval_status === "PENDING" || e.approval_status === "UNDER_REVIEW" || e.approval_status === "PENDING_PAYMENT") && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => setEditingUnitPrice((prev) => ({ ...prev, [e.id]: String(e.unit_price) }))}>
                                        <Pencil className="h-4 w-4 mr-1" /> Edit
                                      </Button>
                                      {e.plan_type === "group" ? (
                                        <Button size="sm" onClick={async () => {
                                          await handleEnrollmentAction(e, "APPROVED");
                                          setAdminTab("group-matcher");
                                        }}>
                                          <Check className="h-4 w-4 mr-1" /> Approve & Match
                                        </Button>
                                      ) : (
                                        <Button size="sm" onClick={() => handleEnrollmentAction(e, "APPROVED")}>
                                          <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                      )}
                                      <Button size="sm" variant="destructive" onClick={() => { setRejectTarget(e); setRejectReason("payment_not_received"); setRejectNote(""); }}>
                                        <X className="h-4 w-4 mr-1" /> Reject
                                      </Button>
                                    </>
                                   )}
                                  {e.approval_status === "APPROVED" && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="outline">
                                          <Undo2 className="h-4 w-4 mr-1" /> Revert
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Revert approval?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will move the enrollment back to Pending and deduct {e.classes_included} credits from the student.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleRevertEnrollment(e)}>Revert</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete enrollment?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete this enrollment record for {e.profiles?.name || "this student"}.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteEnrollment(e.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
                </CardContent>
              </Card>
            </TabsContent>


            {/* LEADS TAB */}
            <TabsContent value="leads">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Our Students</CardTitle>
                    <p className="text-xs text-muted-foreground">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed (Paid) ({confirmedEmails.size})</SelectItem>
                        <SelectItem value="all">All ({leads.length})</SelectItem>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s} ({statusCounts[s] ?? 0})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                      <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Plan type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleDeduplicateLeads}>
                      <Eraser className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Deduplicate</span>}
                    </Button>
                    <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleLinkLeadsByEmail}>
                      <Sparkles className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Link All</span>}
                    </Button>
                    <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={handleSendNameCollectionEmails} disabled={sendingNameEmails}>
                      <Mail className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">{sendingNameEmails ? "Sending…" : "Request Names"}</span>}
                    </Button>
                    <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={exportCSV}>
                      <Download className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Export CSV</span>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">

              {/* Abandoned Checkouts — reached step 4 but didn't pay */}
              {(() => {
                const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                const abandoned = leads.filter(l =>
                  l.plan_type &&
                  l.user_id &&
                  !confirmedEmails.has(l.email.toLowerCase()) &&
                  l.status !== "enrolled" &&
                  new Date(l.created_at) > cutoff
                ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);
                if (abandoned.length === 0) return null;
                return (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{abandoned.length} Abandoned Checkout{abandoned.length > 1 ? "s" : ""}</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400 ml-1">— reached checkout but didn't pay</span>
                    </div>
                    <div className="space-y-2">
                      {abandoned.map(l => {
                        const hoursAgo = Math.round((Date.now() - new Date(l.created_at).getTime()) / 3600000);
                        const timeLabel = hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`;
                        const waMsg = encodeURIComponent(`Hi ${l.name.split(" ")[0]}! 👋 We noticed you were almost done enrolling in Klovers Korean. Your spot is still available — would you like to complete your ${l.plan_type} class enrollment? 🇰🇷`);
                        const waLink = `https://wa.me/?text=${waMsg}`;
                        return (
                          <div key={l.id} className="flex items-center justify-between bg-white dark:bg-background border border-amber-100 dark:border-amber-900/40 rounded-lg px-3 py-2 gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{l.email}</p>
                            </div>
                            <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground shrink-0">
                              <span className="capitalize">{l.plan_type} · {l.duration}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeLabel}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                                onClick={() => { navigator.clipboard.writeText(`Hi ${l.name.split(" ")[0]}! 👋 We noticed you were almost done enrolling. Your spot is still available — complete your ${l.plan_type} class enrollment: https://kloversegy.com/enroll-now`); toast({ title: "Copied!", description: "Follow-up message copied to clipboard" }); }}>
                                <Copy className="h-3 w-3 mr-1" />Copy
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                                <a href={`mailto:${l.email}?subject=Your Korean class spot is waiting!&body=Hi ${l.name.split(" ")[0]},%0A%0AWe noticed you were almost done enrolling in Klovers Korean. Your spot is still available!%0A%0AComplete your enrollment: https://kloversegy.com/enroll-now%0A%0ABest,%0AKlovers Team`} target="_blank" rel="noreferrer">
                                  <Mail className="h-3 w-3 mr-1" />Email
                                </a>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Lead Conversion Summary */}
              {leads.length > 0 && (() => {
                const sourceMap: Record<string, { total: number; converted: number }> = {};
                leads.forEach(l => {
                  const src = l.source || "unknown";
                  if (!sourceMap[src]) sourceMap[src] = { total: 0, converted: 0 };
                  sourceMap[src].total++;
                  if (l.user_id || l.status === "enrolled") sourceMap[src].converted++;
                });
                const totalNew = leads.filter(l => l.status === "new").length;
                const staleNew = leads.filter(l => l.status === "new" && new Date(l.created_at) < new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)).length;
                const funnelNew = leads.filter(l => l.status === "new").length;
                const funnelContacted = leads.filter(l => l.status === "contacted").length;
                const funnelEnrolled = leads.filter(l => l.status === "enrolled" || confirmedEmails.has(l.email?.toLowerCase())).length;
                const funnelMax = Math.max(funnelNew, 1);
                return (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    {/* Source pills */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sourceMap).sort((a, b) => b[1].total - a[1].total).slice(0, 6).map(([src, { total, converted }]) => (
                        <span key={src} className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-background border border-border rounded-full px-2.5 py-1">
                          <span className="text-foreground capitalize">{src}</span>
                          <span className="text-muted-foreground">{total}</span>
                          <span className="text-emerald-600 font-bold">{total > 0 ? Math.round((converted / total) * 100) : 0}%</span>
                        </span>
                      ))}
                    </div>
                    {/* Follow-up alert */}
                    {staleNew > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span><strong>{staleNew}</strong> new lead{staleNew > 1 ? "s" : ""} older than 3 days with no follow-up</span>
                      </div>
                    )}
                    {/* Mini funnel */}
                    <div className="flex items-center gap-3 text-xs">
                      {[
                        { label: "New", count: funnelNew, color: "bg-blue-500" },
                        { label: "Contacted", count: funnelContacted, color: "bg-amber-500" },
                        { label: "Enrolled", count: funnelEnrolled, color: "bg-emerald-500" },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold text-foreground">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round((count / leads.length) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {leadsError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Query Error</AlertTitle>
                  <AlertDescription>{leadsError}</AlertDescription>
                </Alert>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-5 w-24 hidden md:block" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 && !leadsError ? (
                <p className="text-muted-foreground text-center py-12">No leads found.</p>
              ) : !leadsError ? (
                <div className="border rounded-xl max-h-[600px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                        <TableHead
                          className="py-3 px-3 font-semibold cursor-pointer select-none hover:text-primary"
                          onClick={() => setLeadsSort(s => ({ col: "name", dir: s.col === "name" && s.dir === "asc" ? "desc" : "asc" }))}
                        >Name {leadsSort.col === "name" ? (leadsSort.dir === "asc" ? "↑" : "↓") : "↕"}</TableHead>
                        <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                        <TableHead
                          className="py-3 px-3 hidden md:table-cell font-semibold cursor-pointer select-none hover:text-primary"
                          onClick={() => setLeadsSort(s => ({ col: "country", dir: s.col === "country" && s.dir === "asc" ? "desc" : "asc" }))}
                        >Country {leadsSort.col === "country" ? (leadsSort.dir === "asc" ? "↑" : "↓") : "↕"}</TableHead>
                        <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Plan</TableHead>
                        <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Duration</TableHead>
                        <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Schedule</TableHead>
                        <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Goal</TableHead>
                        <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                        <TableHead className="py-3 px-3 hidden sm:table-cell font-semibold">Linked</TableHead>
                        <TableHead
                          className="py-3 px-3 hidden sm:table-cell font-semibold cursor-pointer select-none hover:text-primary"
                          onClick={() => setLeadsSort(s => ({ col: "created_at", dir: s.col === "created_at" && s.dir === "asc" ? "desc" : "asc" }))}
                        >Date {leadsSort.col === "created_at" ? (leadsSort.dir === "asc" ? "↑" : "↓") : "↕"}</TableHead>
                        <TableHead className="py-3 px-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLeads.map((lead) => (
                        <TableRow key={lead.id} className="group odd:bg-muted/30 hover:bg-muted/50 transition">
                          <TableCell className="py-3 px-3 font-medium">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.name || ""} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" />
                            ) : lead.name}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.email || ""} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm" />
                            ) : (
                              <div className="flex items-center gap-1 max-w-[220px]">
                                <span className="truncate flex-1 text-sm">{lead.email}</span>
                                <button
                                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(lead.email); toast({ title: "Copied" }); }}
                                >
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.country || ""} onChange={(e) => setEditForm(f => ({ ...f, country: e.target.value }))} className="h-8 text-sm" />
                            ) : lead.country || "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell">
                            {editingLeadId === lead.id ? (
                              <Select value={editForm.plan_type || ""} onValueChange={(v) => setEditForm(f => ({ ...f, plan_type: v }))}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="group">group</SelectItem>
                                  <SelectItem value="private">private</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : lead.plan_type ? <Badge variant={lead.plan_type === "private" ? "default" : "secondary"} className="text-xs capitalize">{lead.plan_type}</Badge> : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.duration || ""} onChange={(e) => setEditForm(f => ({ ...f, duration: e.target.value }))} className="h-8 text-sm w-20" />
                            ) : lead.duration || "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground">
                            {editingLeadId === lead.id ? (
                              <div className="flex flex-wrap gap-1 min-w-[160px]">
                                {scheduleWeekdays.map((day) => {
                                  const currentDays = (editForm.schedule || "").split("/").map(s => s.trim()).filter(Boolean);
                                  const selected = currentDays.includes(day);
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      onClick={() => {
                                        const days = (editForm.schedule || "").split("/").map(s => s.trim()).filter(Boolean);
                                        const next = selected ? days.filter(d => d !== day) : [...days, day];
                                        setEditForm(f => ({ ...f, schedule: next.join("/") }));
                                      }}
                                      className={`px-2 py-0.5 rounded text-xs border transition-all ${selected ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                                    >
                                      {day.slice(0, 3)}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : lead.schedule || "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground max-w-[120px] truncate">
                            {lead.goal || "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            {editingLeadId === lead.id ? (
                              <Select value={editForm.status || "new"} onValueChange={(v) => setEditForm(f => ({ ...f, status: v }))}>
                                <SelectTrigger className="h-8 text-sm w-28"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge className={`text-xs border ${
                                lead.status === "enrolled" ? "bg-green-100 text-green-700 border-green-200"
                                : lead.status === "trial_booked" ? "bg-violet-100 text-violet-700 border-violet-200"
                                : lead.status === "rejected" || lead.status === "lost" ? "bg-red-100 text-red-700 border-red-200"
                                : lead.status === "contacted" ? "bg-blue-100 text-blue-700 border-blue-200"
                                : "bg-muted text-muted-foreground border-border"
                              }`}>
                                {lead.status === "trial_booked" ? "🎁 Trial Booked" : lead.status}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden sm:table-cell">
                            {lead.user_id ? (
                              <Badge variant="default" className="text-xs">Linked</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Unlinked</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              {editingLeadId === lead.id ? (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleEditLead}>
                                    <Check className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditLead}>
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditLead(lead)}>
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete lead?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete {lead.name}'s record.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(lead.id)}>Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MANAGE STUDENTS TAB */}
            <TabsContent value="manage">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Manage Students</CardTitle></CardHeader>
                <CardContent className="pt-0"><StudentManager /></CardContent>
              </Card>
            </TabsContent>

            {/* PROMO CODES TAB */}
            <TabsContent value="promos">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Promo Codes</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <Suspense fallback={<TabLoader />}>
                    <PromoCodesManager />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP ATTENDANCE TAB */}
            <TabsContent value="group-attendance">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Group Attendance</CardTitle></CardHeader>
                <CardContent className="pt-0">
                  <GroupAttendanceManager
                    overviewRows={overviewRows}
                    selectedStudentId={selectedStudentId}
                    onStudentSelect={setSelectedStudentId}
                    attendanceReqs={attendanceReqs}
                    onAttendanceAction={handleAttendanceAction}
                    onRevertAttendance={handleRevertAttendance}
                    userGroupMap={userGroupMap}
                    onUpdated={fetchAll}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* GROUP MATCHER TAB */}
            <TabsContent value="group-matcher">
              <GroupMatcher />
            </TabsContent>

            {/* NOTIFICATIONS TAB */}
            <TabsContent value="notifications">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
                <CardContent className="pt-0"><AdminNotifications /></CardContent>
              </Card>
            </TabsContent>

            {/* BLOG TAB */}
            <TabsContent value="blog">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Blog Manager</CardTitle></CardHeader>
                <CardContent className="pt-0"><BlogManager /></CardContent>
              </Card>
            </TabsContent>

            {/* CAMPAIGNS TAB */}
            <TabsContent value="campaigns">
              <div className="space-y-6">
                <BulkEmailManager />
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
                  <CardContent><SchedulingManager /></CardContent>
                </Card>
                <Card className="rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base">Schedule Preference Options</CardTitle>
                    <p className="text-sm text-muted-foreground">Edit the weekdays, time windows, and start date options shown to students during enrollment.</p>
                  </CardHeader>
                  <CardContent><ScheduleOptionsManager /></CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* PLACEMENT TESTS TAB */}
            <TabsContent value="placement-tests">
              <PlacementTestsManager />
            </TabsContent>

            {/* TEACHER AVAILABILITY TAB */}
            <TabsContent value="availability">
              <TeacherAvailabilityManager />
            </TabsContent>

            {/* STUDENT PREFERENCES TAB */}
            <TabsContent value="preferences">
              <StudentPreferenceDashboard />
            </TabsContent>

            {/* SALES ANALYTICS TAB */}
            <TabsContent value="sales">
              <SalesAnalytics />
            </TabsContent>

            {/* SETTINGS TAB */}
            <TabsContent value="session-attendance">
              <SessionAttendanceManager />
            </TabsContent>
            <TabsContent value="settings">
              <AdminSettings />
            </TabsContent>
          </Tabs>
          </Suspense>
        </div>
      </div>
      {/* Rejection reason dialog */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Reject Enrollment</h3>
            <p className="text-sm text-muted-foreground">{rejectTarget.profiles?.name || "Unknown"} — {rejectTarget.profiles?.email}</p>

            <div className="space-y-2">
              <p className="text-sm font-medium">Reason *</p>
              <div className="space-y-2">
                {([
                  { value: "payment_not_received", label: "💳 Payment not received", desc: "We couldn't confirm the transfer." },
                  { value: "time_slots_unavailable", label: "📅 Time slots unavailable", desc: "Student gets a link to pick new available slots." },
                  { value: "other", label: "✏️ Other", desc: "Provide a note below." },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRejectReason(opt.value)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${rejectReason === opt.value ? "border-destructive bg-destructive/5" : "border-border hover:border-destructive/40"}`}
                  >
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium">Additional note (optional)</p>
              <textarea
                className="w-full border border-border rounded-lg p-2 text-sm resize-none h-20 bg-background text-foreground"
                placeholder="e.g. Please re-enroll with a clearer receipt."
                value={rejectNote}
                onChange={ev => setRejectNote(ev.target.value)}
                maxLength={300}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmReject} disabled={rejecting}>
                {rejecting ? "Rejecting…" : "Confirm Reject & Notify"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Manual Enroll Dialog */}
      <Dialog open={manualEnrollOpen} onOpenChange={setManualEnrollOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manually Enroll — {enrollTarget?.name}</DialogTitle>
            <DialogDescription>{enrollTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Plan type */}
            <div className="space-y-1">
              <Label>Plan Type</Label>
              <div className="flex gap-2">
                {(["group", "private"] as const).map(pt => (
                  <button
                    key={pt}
                    onClick={() => setEnrollForm(f => ({ ...f, plan_type: pt, group_id: "" }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      enrollForm.plan_type === pt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {pt === "group" ? "👥 Group" : "👤 Private"}
                  </button>
                ))}
              </div>
              {enrollForm.plan_type === "private" && (
                <p className="text-xs text-muted-foreground">Private enrollment — assign a slot via the Matcher after saving.</p>
              )}
            </div>

            {/* Duration + Sessions */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Duration</Label>
                <Select
                  value={enrollForm.duration}
                  onValueChange={v => setEnrollForm(f => ({ ...f, duration: v, sessions: SESSIONS_BY_DURATION[v] ?? f.sessions }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 month</SelectItem>
                    <SelectItem value="3">3 months</SelectItem>
                    <SelectItem value="6">6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1">
                <Label>Sessions</Label>
                <Input
                  type="number"
                  min="1"
                  value={enrollForm.sessions}
                  onChange={e => setEnrollForm(f => ({ ...f, sessions: e.target.value }))}
                />
              </div>
            </div>

            {/* Amount + Currency */}
            <div className="flex gap-3">
              <div className="flex-1 space-y-1">
                <Label>Amount paid</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="Enter amount..."
                  value={enrollForm.amount}
                  onChange={e => setEnrollForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="w-28 space-y-1">
                <Label>Currency</Label>
                <Select value={enrollForm.currency} onValueChange={v => setEnrollForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EGP">EGP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Group — only for group plan */}
            {enrollForm.plan_type === "group" && (
              <div className="space-y-1">
                <Label>Group *</Label>
                <Select value={enrollForm.group_id} onValueChange={v => setEnrollForm(f => ({ ...f, group_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select group..." /></SelectTrigger>
                  <SelectContent>
                    {pkgGroups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Level */}
            <div className="space-y-1">
              <Label>Level</Label>
              <Select value={enrollForm.level || "__none__"} onValueChange={v => setEnrollForm(f => ({ ...f, level: v === "__none__" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select level..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not set —</SelectItem>
                  <SelectItem value="foundation">Foundation</SelectItem>
                  <SelectItem value="level_1">Level 1</SelectItem>
                  <SelectItem value="level_2">Level 2</SelectItem>
                  <SelectItem value="level_3">Level 3</SelectItem>
                  <SelectItem value="level_4">Level 4</SelectItem>
                  <SelectItem value="level_5">Level 5</SelectItem>
                  <SelectItem value="level_6">Level 6</SelectItem>
                  <SelectItem value="A2 Elementary">A2 Elementary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea value={enrollForm.notes} onChange={e => setEnrollForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Payment reference, special notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualEnrollOpen(false)}>Cancel</Button>
            <Button
              onClick={handleManualEnroll}
              disabled={enrollSaving || (enrollForm.plan_type === "group" && !enrollForm.group_id) || !enrollForm.amount}
            >
              {enrollSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Enroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AdminDashboard;
