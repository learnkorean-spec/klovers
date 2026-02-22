import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { LogOut, Search, Download, Trash2, Check, X, Eye, Undo2, AlertCircle, Bell, ChevronLeft, ChevronRight, Pencil, Mail } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import BlogManager from "@/components/admin/BlogManager";
import StudentManager from "@/components/admin/StudentManager";
import LifecycleFunnel from "@/components/admin/LifecycleFunnel";
import GroupAttendanceManager from "@/components/admin/GroupAttendanceManager";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminAttendancePanel from "@/components/admin/AdminAttendancePanel";
import GroupMatcher from "@/components/admin/GroupMatcher";

import BulkEmailManager from "@/components/admin/BulkEmailManager";

import ScheduleOptionsManager from "@/components/admin/ScheduleOptionsManager";
import SchedulingManager from "@/components/admin/SchedulingManager";

interface Lead {
  id: string; name: string; email: string; country: string; level: string; goal: string; status: string; created_at: string;
  plan_type: string; duration: string; schedule: string; timezone: string; source: string;
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

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "rejected", "lost"];
const PAGE_SIZE = 25;

/** Normalize a level label to snake_case (e.g. "Beginner 1" → "beginner_1") */
const normalizeLevel = (label: string): string =>
  label.trim().toLowerCase().replace(/\s+/g, "_");

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
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const [userGroupMap, setUserGroupMap] = useState<Record<string, string>>({});
  const [studentFilter, setStudentFilter] = useState("all");
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [studentPage, setStudentPage] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [leadsByEmail, setLeadsByEmail] = useState<Record<string, any>>({});
  const [showLegacyEnrollments, setShowLegacyEnrollments] = useState(false);
  const [scheduleWeekdays, setScheduleWeekdays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchAll = async () => {
    setLeadsError(null);
    const [leadsRes, enrollRes, attendRes, overviewRes, batchMembersRes, groupsRes, weekdaysRes, profilesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("admin_student_overview" as any).select("*"),
      supabase.from("batch_members").select("user_id, batch_id, member_status"),
      supabase.from("student_groups").select("id, name"),
      supabase.from("schedule_options" as any).select("label, sort_order").eq("category", "weekday").eq("is_active", true).order("sort_order"),
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

    const groupNameMap: Record<string, string> = {};
    if (groupsRes.data) {
      (groupsRes.data as any[]).forEach((g: any) => { groupNameMap[g.id] = g.name; });
    }
    const _userGroupMap: Record<string, string> = {};
    if (batchMembersRes.data) {
      (batchMembersRes.data as any[]).forEach((bm: any) => {
        if (bm.member_status === "active" && groupNameMap[bm.batch_id]) {
          _userGroupMap[bm.user_id] = groupNameMap[bm.batch_id];
        }
      });
    }

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

  const exportCSV = () => {
    const headers = ["Name", "Email", "Country", "Level", "Plan", "Duration", "Schedule", "Timezone", "Source", "Status", "Date"];
    const rows = filtered.map((l) => [l.name, l.email, l.country, l.level, l.plan_type, l.duration, l.schedule, l.timezone, l.source, l.status, new Date(l.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c || ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
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

      // === AUTO-MATCH TO SLOT based on level + preferred days ===
      if (enrollment.plan_type === "group") {
        try {
          const { data: matchedSlotId, error: matchErr } = await supabase
            .rpc("match_enrollment_to_slot", { _enrollment_id: enrollment.id } as any);
          if (matchErr) {
            console.error("Auto-match error:", matchErr);
          } else if (matchedSlotId) {
            // Get slot details for toast
            const { data: slotData } = await supabase
              .from("matching_slots" as any)
              .select("day, time, course_level")
              .eq("id", matchedSlotId)
              .maybeSingle();
            const slotInfo = slotData ? `${(slotData as any).day} ${(slotData as any).time} (${(slotData as any).course_level})` : "a slot";
            toast({ title: "Auto-matched", description: `Student assigned to ${slotInfo}` });
          } else {
            toast({ title: "No slot match", description: "No matching slot found for student's level/preferences. Manual assignment needed.", variant: "destructive" });
          }
        } catch (err) {
          console.error("Auto-match error:", err);
        }
      }

      // === Package-based group assignment (new flow) ===
      try {
        const { data: assignResult, error: assignErr } = await supabase
          .rpc("assign_student_to_pkg_group" as any, {
            _user_id: enrollment.user_id,
            _enrollment_id: enrollment.id,
          } as any);

        if (assignErr) {
          console.error("Package assignment error:", assignErr);
        } else if (assignResult) {
          const result = assignResult as string;
          if (result.startsWith("assigned:")) {
            toast({ title: "Assigned to group", description: result.replace("assigned:", "") });
          } else if (result === "waitlisted") {
            toast({ title: "Waitlisted", description: "All groups full — student added to waitlist.", variant: "destructive" });
          } else if (result === "no_preference") {
            // Fall back to legacy schedule_preferences assignment
            const { data: pref } = await supabase
              .from("student_schedule_preferences" as any)
              .select("group_id")
              .eq("user_id", enrollment.user_id)
              .maybeSingle();

            if (pref && (pref as any).group_id) {
              const groupId = (pref as any).group_id;
              const { data: group } = await supabase
                .from("student_groups")
                .select("capacity, name")
                .eq("id", groupId)
                .single();
              const { count: memberCount } = await supabase
                .from("batch_members")
                .select("id", { count: "exact", head: true })
                .eq("batch_id", groupId);
              const seatsLeft = (group as any)?.capacity - (memberCount || 0);
              if (seatsLeft > 0) {
                await supabase.from("batch_members").insert({
                  batch_id: groupId, user_id: enrollment.user_id,
                  enrollment_id: enrollment.id, member_status: "active",
                } as any);
                toast({ title: "Assigned to group (legacy)", description: (group as any)?.name });
              } else {
                await supabase.from("batch_members").insert({
                  batch_id: groupId, user_id: enrollment.user_id,
                  enrollment_id: enrollment.id, member_status: "waitlist",
                } as any);
                toast({ title: "Warning", description: "Group full — student waitlisted.", variant: "destructive" });
              }
            }
          }
        }
      } catch (err) {
        console.error("Group assignment error:", err);
      }

      // === GROUP MATCHING CHECK ===
      if (enrollment.plan_type === "group") {
        try {
          const { data: unmatchedRaw } = await supabase
            .from("enrollments")
            .select("id, user_id, preferred_days, preferred_start")
            .eq("approval_status", "APPROVED")
            .eq("plan_type", "group")
            .is("matched_batch_id", null)
            .not("preferred_days", "is", null);

          if (unmatchedRaw && unmatchedRaw.length >= 3) {
            // Check for clusters of 3+ sharing at least 1 day + same start
            const unmatched = unmatchedRaw as any[];
            const clusterMap: Record<string, any[]> = {};
            for (const e of unmatched) {
              const days = e.preferred_days || [];
              const start = e.preferred_start || "";
              const key = `${[...days].sort().join(",")}|${start}`;
              if (!clusterMap[key]) clusterMap[key] = [];
              clusterMap[key].push(e);
            }

            // Merge overlapping clusters (same start, shared day)
            const keys = Object.keys(clusterMap);
            for (let i = 0; i < keys.length; i++) {
              const [daysA, startA] = keys[i].split("|");
              const daysAArr = daysA.split(",");
              for (let j = i + 1; j < keys.length; j++) {
                const [daysB, startB] = keys[j].split("|");
                if (startA !== startB) continue;
                const daysBArr = daysB.split(",");
                if (daysAArr.some((d) => daysBArr.includes(d))) {
                  clusterMap[keys[i]].push(...clusterMap[keys[j]]);
                  delete clusterMap[keys[j]];
                }
              }
            }

            for (const [key, members] of Object.entries(clusterMap)) {
              // Deduplicate
              const unique = [...new Map(members.map((m: any) => [m.id, m])).values()];
              if (unique.length >= 3) {
                const [daysStr, start] = key.split("|");
                await supabase.from("admin_notifications" as any).insert({
                  message: `${unique.length} students ready for a group: ${daysStr.replace(/,/g, ", ")} / ${start}`,
                  type: "group_match_ready",
                } as any);
              }
            }
          }
        } catch (err) {
          console.error("Group matching check error:", err);
        }
      }
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
        : true;
      return matchesSearch && matchesFilter;
    });
  }, [overviewRows, studentSearch, studentFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice(studentPage * PAGE_SIZE, (studentPage + 1) * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setStudentPage(0); }, [studentSearch, studentFilter]);

  const studentFilterOptions = [
    { value: "all", label: `All (${overviewRows.length})` },
    { value: "confirmed", label: `Confirmed (${confirmedCount})` },
    { value: "leads", label: `Leads (${leadsProfileCount})` },
    { value: "stripe", label: `Stripe (${stripeCount})` },
    { value: "egypt", label: `Egypt Manual (${egyptCount})` },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-6">
            <div>
              <h1 className="text-lg font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">Manage students, enrollments & content</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
          <LifecycleFunnel
            leadsCount={lifecycleLeads}
            registeredCount={overviewRows.length}
            enrolledCount={lifecycleConfirmedTotal}
            activeCount={lifecycleActive}
            completedCount={lifecycleCompleted + lifecycleLocked}
          />

          <Tabs defaultValue="students">
            <TabsList className="w-full flex gap-2 overflow-x-auto whitespace-nowrap pb-2 h-auto bg-transparent p-0">
              <TabsTrigger value="students" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">
                Users ({overviewRows.length})
              </TabsTrigger>
              <TabsTrigger value="enrollments" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                Enrollments
                {actionableEnrollments > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">{actionableEnrollments}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="attendance" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                Attendance
                {pendingAttendance > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-[10px] rounded-full">{pendingAttendance}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="leads" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Our Students</TabsTrigger>
              <TabsTrigger value="manage" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Manage</TabsTrigger>
              <TabsTrigger value="group-attendance" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Groups</TabsTrigger>
              <TabsTrigger value="group-matcher" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Matcher</TabsTrigger>
              <TabsTrigger value="notifications" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                <Bell className="h-4 w-4" /> Alerts
              </TabsTrigger>
              
              <TabsTrigger value="scheduling" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Scheduling</TabsTrigger>
              <TabsTrigger value="blog" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Blog</TabsTrigger>
              <TabsTrigger value="campaigns" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                <Mail className="h-4 w-4" /> Campaigns
              </TabsTrigger>
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
                    {/* Search + Export */}
                    <div className={`flex gap-2 ${isMobile ? "flex-col" : "flex-row"}`}>
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search by name or email..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
                      </div>
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
                <p className="text-muted-foreground text-center py-8">Loading...</p>
              ) : filteredUsers.length === 0 ? (
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
                          <TableHead className="py-3 px-3 font-semibold text-center">Remaining</TableHead>
                          <TableHead className="py-3 px-3 font-semibold text-center">Negative</TableHead>
                          <TableHead className="py-3 px-3 font-semibold text-right">Amount Due</TableHead>
                          <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                          <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Source</TableHead>
                          <TableHead className="py-3 px-3 hidden sm:table-cell font-semibold">Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedUsers.map((u) => (
                          <TableRow key={u.user_id} className={cn("odd:bg-muted/30 hover:bg-muted/50 transition cursor-pointer", selectedStudentId === u.user_id && "ring-2 ring-primary/40")} onClick={() => setSelectedStudentId(selectedStudentId === u.user_id ? null : (u.enrollment_id ? u.user_id : null))}>
                            <TableCell className="py-3 px-3 font-medium">{u.name || "—"}</TableCell>
                            <TableCell className="py-3 px-3">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[240px] truncate">{u.email}</span>
                                </TooltipTrigger>
                                <TooltipContent>{u.email}</TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{u.country || "—"}</TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{u.level || "—"}</TableCell>
                            <TableCell className="py-3 px-3 text-center font-mono">{u.sessions_remaining}</TableCell>
                            <TableCell className="py-3 px-3 text-center font-mono">{u.negative_sessions > 0 ? <span className="text-destructive">{u.negative_sessions}</span> : "—"}</TableCell>
                            <TableCell className="py-3 px-3 text-right font-mono">{u.amount_due > 0 ? <span className="text-destructive">{u.currency === "EGP" ? "LE" : "$"}{u.amount_due.toLocaleString()}</span> : "—"}</TableCell>
                            <TableCell className="py-3 px-3">
                              <Badge variant={u.derived_status === "ACTIVE" ? "default" : u.derived_status === "LOCKED" ? "destructive" : "secondary"} className="text-xs">{u.derived_status}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden md:table-cell">
                              <Badge variant="outline" className="text-xs">{u.source_label}</Badge>
                            </TableCell>
                            <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4">
                      <p className="text-xs text-muted-foreground">
                        Page {studentPage + 1} of {totalPages} · {filteredUsers.length} results
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
                        Show Legacy
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
              {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
                <Tabs defaultValue="under_review">
                  <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3 h-auto bg-transparent p-0 w-full">
                    {[
                      { value: "under_review", label: "Under Review", count: enrollments.filter(e => e.approval_status === "UNDER_REVIEW").length },
                      { value: "pending_payment", label: "Pending Payment", count: enrollments.filter(e => e.approval_status === "PENDING_PAYMENT").length },
                      { value: "pending", label: "Pending", count: enrollments.filter(e => e.approval_status === "PENDING").length },
                      { value: "approved", label: "Approved", count: enrollments.filter(e => e.approval_status === "APPROVED").length },
                      { value: "rejected", label: "Rejected", count: enrollments.filter(e => e.approval_status === "REJECTED").length },
                    ].map(t => (
                      <TabsTrigger key={t.value} value={t.value} className="shrink-0 rounded-full px-4 py-2 text-xs border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">
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
                      if (!showLegacyEnrollments && isLegacy(e)) return false;
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
                                    {e.plan_type} · {e.duration}mo · {e.classes_included} classes · {e.currency === 'EGP' ? `${e.amount.toLocaleString()} EGP` : `$${e.amount}`} · Ref: {e.tx_ref || '—'}
                                    {e.payment_method && <> · <span className="font-medium">{e.payment_method === 'vodafone_cash' ? 'Vodafone Cash' : e.payment_method === 'instapay' ? 'InstaPay' : e.payment_method === 'bank_transfer' ? 'Bank Transfer' : e.payment_method}</span></>}
                                    {e.payment_date && <> · Paid: {e.payment_date}</>}
                                    {e.due_at && e.approval_status === 'PENDING_PAYMENT' && <> · Due: {new Date(e.due_at).toLocaleString()}</>}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">Unit price:</span>
                                    {e.approval_status === "PENDING" && e.admin_review_required ? (
                                      <Input
                                        type="number"
                                        className="h-7 w-24"
                                        min="0.01"
                                        max="10000"
                                        step="0.01"
                                        value={editingUnitPrice[e.id] ?? String(e.unit_price)}
                                        onChange={(ev) => setEditingUnitPrice((prev) => ({ ...prev, [e.id]: ev.target.value }))}
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-foreground">${e.unit_price}</span>
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
                                            ?? (e.profiles?.level?.trim() ? normalizeLevel(e.profiles.level) : null)
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
                                  {e.receipt_url && e.receipt_url.length > 0 && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        if (e.receipt_url.startsWith("stripe:")) {
                                          toast({ title: "Stripe receipt", description: "This enrollment was paid via Stripe." });
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
                                      <Eye className="h-4 w-4 mr-1" /> Receipt
                                    </Button>
                                  )}
                                  {(e.approval_status === "PENDING" && e.admin_review_required || e.approval_status === "UNDER_REVIEW") && (
                                    <>
                                      <Button size="sm" onClick={() => handleEnrollmentAction(e, "APPROVED")}>
                                        <Check className="h-4 w-4 mr-1" /> Approve
                                      </Button>
                                      <Button size="sm" variant="destructive" onClick={() => handleEnrollmentAction(e, "REJECTED")}>
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

            {/* ATTENDANCE TAB */}
            <TabsContent value="attendance" className="space-y-4">
              {attendanceReqs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No attendance requests.</p>
              ) : (() => {
                const byUser: Record<string, { name: string; email: string; requests: typeof attendanceReqs }> = {};
                attendanceReqs.forEach((a) => {
                  const key = a.user_id;
                  if (!byUser[key]) {
                    byUser[key] = {
                      name: (a as any).profiles?.name || "Unknown",
                      email: (a as any).profiles?.email || "",
                      requests: [],
                    };
                  }
                  byUser[key].requests.push(a);
                });

                return Object.entries(byUser).map(([userId, { name, email, requests }]) => {
                  const pendingCount = requests.filter(r => r.status === "PENDING").length;
                  const approvedCount = requests.filter(r => r.status === "APPROVED").length;
                  const rejectedCount = requests.filter(r => r.status === "REJECTED").length;
                  const groupName = userGroupMap[userId];
                  const overviewRecord = overviewRows.find(o => o.user_id === userId);
                  const remainingSessions = overviewRecord?.sessions_remaining ?? null;

                  return (
                    <Card key={userId}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {email}
                              {groupName && <> · <span className="font-medium text-foreground">Group: {groupName}</span></>}
                              {remainingSessions !== null && <> · Sessions left: <span className="font-medium text-foreground">{remainingSessions}</span></>}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary">{requests.length} total</Badge>
                            {approvedCount > 0 && <Badge variant="default">{approvedCount} approved</Badge>}
                            {pendingCount > 0 && <Badge variant="outline" className="border-yellow-500 text-yellow-600">{pendingCount} pending</Badge>}
                            {rejectedCount > 0 && <Badge variant="destructive">{rejectedCount} rejected</Badge>}
                          </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="py-2 px-3">Date</TableHead>
                                <TableHead className="py-2 px-3">Submitted</TableHead>
                                <TableHead className="py-2 px-3">Status</TableHead>
                                <TableHead className="py-2 px-3 text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {requests.map((a) => (
                                <TableRow key={a.id} className="even:bg-muted/30 hover:bg-muted/50">
                                  <TableCell className="py-2 px-3 font-medium text-foreground">{a.request_date}</TableCell>
                                  <TableCell className="py-2 px-3 text-muted-foreground text-xs">
                                    {new Date(a.created_at).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell className="py-2 px-3">
                                    <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                                      {a.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-2 px-3 text-right">
                                    {a.status === "PENDING" ? (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button size="sm" onClick={() => handleAttendanceAction(a, "APPROVED")}>
                                          <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAttendanceAction(a, "REJECTED")}>
                                          <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                      </div>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => handleRevertAttendance(a)}>
                                        <Undo2 className="h-4 w-4 mr-1" /> Undo
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
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
                      <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Filter status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed (Paid)</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                    <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={exportCSV}>
                      <Download className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Export CSV</span>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">

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
                        <TableHead className="py-3 px-3 font-semibold">Name</TableHead>
                        <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                        <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Country</TableHead>
                        <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Plan</TableHead>
                        <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Duration</TableHead>
                        <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Schedule</TableHead>
                        <TableHead className="py-3 px-3 hidden lg:table-cell font-semibold">Timezone</TableHead>
                        <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                        <TableHead className="py-3 px-3 hidden sm:table-cell font-semibold">Date</TableHead>
                        <TableHead className="py-3 px-3 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((lead) => (
                        <TableRow key={lead.id} className="odd:bg-muted/30 hover:bg-muted/50 transition">
                          <TableCell className="py-3 px-3 font-medium">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.name || ""} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" />
                            ) : lead.name}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.email || ""} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8 text-sm" />
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[240px] truncate">{lead.email}</span>
                                </TooltipTrigger>
                                <TooltipContent>{lead.email}</TooltipContent>
                              </Tooltip>
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
                          <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground">
                            {editingLeadId === lead.id ? (
                              <Input value={editForm.timezone || ""} onChange={(e) => setEditForm(f => ({ ...f, timezone: e.target.value }))} className="h-8 text-sm" />
                            ) : lead.timezone || "—"}
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
                              <Badge variant={
                                lead.status === "enrolled" ? "default"
                                : lead.status === "rejected" ? "destructive"
                                : lead.status === "contacted" ? "secondary"
                                : "outline"
                              } className="text-xs">
                                {lead.status}
                              </Badge>
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

            {/* GROUP ATTENDANCE TAB */}
            <TabsContent value="group-attendance">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4"><CardTitle className="text-base">Group Attendance</CardTitle></CardHeader>
                <CardContent className="pt-0"><GroupAttendanceManager /></CardContent>
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
              <BulkEmailManager />
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
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard;
