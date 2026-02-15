import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { LogOut, Search, Download, Trash2, Check, X, Eye, Undo2, AlertCircle, Bell } from "lucide-react";
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

interface Lead {
  id: string; name: string; email: string; country: string; level: string; goal: string; status: string; created_at: string;
  plan_type: string; duration: string; schedule: string; timezone: string; source: string;
}

interface Enrollment {
  id: string; user_id: string; plan_type: string; duration: number; classes_included: number;
  amount: number; unit_price: number; tx_ref: string; receipt_url: string; status: string;
  payment_status: string; approval_status: string; payment_provider: string | null;
  admin_review_required: boolean; sessions_remaining: number;
  created_at: string; profiles?: { name: string; email: string } | null;
  currency?: string; due_at?: string | null; payment_date?: string | null; payment_method?: string | null;
}

interface AttendanceReq {
  id: string; user_id: string; request_date: string; status: string; created_at: string;
  profiles?: { name: string; email: string; credits: number } | null;
}

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "rejected", "lost"];

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceReqs, setAttendanceReqs] = useState<AttendanceReq[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; name: string; email: string; country: string; level: string; credits: number; status: string; created_at: string }[]>([]);
  const [search, setSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [userGroupMap, setUserGroupMap] = useState<Record<string, string>>({});
  const [studentByEmail, setStudentByEmail] = useState<Record<string, any>>({});
  const [studentFilter, setStudentFilter] = useState("all");
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchAll = async () => {
    setLeadsError(null);
    const [leadsRes, enrollRes, attendRes, profilesRes, studentsRes, batchMembersRes, groupsRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, email, credits, country, level, status, created_at"),
      supabase.from("students").select("status, used_classes, total_classes, email, full_name, group_name, remaining_classes, price_per_class"),
      supabase.from("batch_members").select("user_id, batch_id, member_status"),
      supabase.from("student_groups").select("id, name"),
    ]);

    const profileMap: Record<string, { name: string; email: string; credits: number; country: string; level: string; status: string; created_at: string }> = {};
    if (profilesRes.data) {
      (profilesRes.data as any[]).forEach((p) => { profileMap[p.user_id] = p; });
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

    const _studentByEmail: Record<string, any> = {};
    if (studentsRes.data) {
      (studentsRes.data as any[]).forEach((s: any) => { _studentByEmail[s.email?.toLowerCase()] = s; });
    }

    if (leadsRes.error) {
      const msg = `Leads query failed: ${leadsRes.error.message} (code: ${leadsRes.error.code})`;
      console.error(msg, leadsRes.error);
      setLeadsError(msg);
      toast({ title: "Leads query failed", description: leadsRes.error.message, variant: "destructive" });
    } else {
      const enrichedLeads = (leadsRes.data as Lead[]).map((lead) => {
        const matchingEnrollments = enrollRes.data
          ? (enrollRes.data as any[]).filter((e) => {
              const profile = profileMap[e.user_id];
              return profile && profile.email.toLowerCase() === lead.email.toLowerCase();
            })
          : [];

        let autoStatus = lead.status;
        if (matchingEnrollments.length > 0) {
          const hasApproved = matchingEnrollments.some((e: any) => e.approval_status === "APPROVED");
          const hasRejected = matchingEnrollments.some((e: any) => e.approval_status === "REJECTED");
          const hasPending = matchingEnrollments.some((e: any) =>
            ["PENDING", "PENDING_PAYMENT", "UNDER_REVIEW"].includes(e.approval_status)
          );
          if (hasApproved) autoStatus = "enrolled";
          else if (hasRejected && !hasPending) autoStatus = "rejected";
          else if (hasPending) autoStatus = "contacted";
        }
        return { ...lead, status: autoStatus };
      });
      setLeads(enrichedLeads);
    }

    if (enrollRes.data) setEnrollments((enrollRes.data as any[]).map((e) => ({ ...e, profiles: profileMap[e.user_id] || null })));
    if (attendRes.data) setAttendanceReqs((attendRes.data as any[]).map((a) => ({ ...a, profiles: profileMap[a.user_id] || null })));
    if (profilesRes.data) setProfiles(profilesRes.data as any[]);
    if (studentsRes.data) setStudentsData(studentsRes.data as any[]);
    setUserGroupMap(_userGroupMap);
    setStudentByEmail(_studentByEmail);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

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

      try {
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
              batch_id: groupId,
              user_id: enrollment.user_id,
              enrollment_id: enrollment.id,
              member_status: "active",
            } as any);
            toast({ title: "Assigned to group", description: (group as any)?.name });
          } else {
            await supabase.from("batch_members").insert({
              batch_id: groupId,
              user_id: enrollment.user_id,
              enrollment_id: enrollment.id,
              member_status: "waitlist",
            } as any);
            await supabase.from("admin_notifications" as any).insert({
              message: `Group "${(group as any)?.name}" full at approval time for ${enrollment.profiles?.name || "student"}. Needs reassignment.`,
              type: "waitlist",
              related_user_id: enrollment.user_id,
              related_group_id: groupId,
            } as any);
            toast({ title: "Warning", description: "Group full — student added to waitlist.", variant: "destructive" });
          }
        }
      } catch (err) {
        console.error("Group assignment error:", err);
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

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  // Computed badge counts
  const actionableEnrollments = enrollments.filter(e =>
    e.approval_status === "UNDER_REVIEW" ||
    e.approval_status === "PENDING_PAYMENT" ||
    (e.approval_status === "PENDING" && e.admin_review_required)
  ).length;
  const pendingAttendance = attendanceReqs.filter(a => a.status === "PENDING").length;

  // Student filter counts
  const confirmedCount = profiles.filter(p => p.status === "ACTIVE" && enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED")).length;
  const leadsProfileCount = profiles.filter(p => p.status === "NEW" || (!enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED"))).length;
  const stripeCount = profiles.filter(p => enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "stripe" && e.approval_status === "APPROVED")).length;
  const egyptCount = profiles.filter(p => enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "egypt_manual")).length;

  const studentFilterOptions = [
    { value: "all", label: `All (${profiles.length})` },
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
            leadsCount={leads.length}
            registeredCount={profiles.length}
            enrolledCount={enrollments.filter(e => e.approval_status === "APPROVED").length}
            activeCount={studentsData.filter(s => s.status === "student" && s.used_classes < s.total_classes).length}
            completedCount={studentsData.filter(s => s.used_classes >= s.total_classes && s.total_classes > 0).length}
          />

          <Tabs defaultValue="students">
            <TabsList className="w-full flex gap-2 overflow-x-auto whitespace-nowrap pb-2 h-auto bg-transparent p-0">
              <TabsTrigger value="students" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">
                Users ({profiles.length})
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
              <TabsTrigger value="notifications" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background gap-1.5">
                <Bell className="h-4 w-4" /> Alerts
              </TabsTrigger>
              <TabsTrigger value="blog" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">Blog</TabsTrigger>
            </TabsList>

            {/* STUDENTS TAB */}
            <TabsContent value="students">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Users</CardTitle>
                      <p className="text-xs text-muted-foreground">{profiles.length} total</p>
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
                        <Input placeholder="Search students..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9" />
                      </div>
                      <Button variant="outline" size={isMobile ? "icon" : "sm"} onClick={() => {
                        const data = profiles.filter(p => {
                          const matchesSearch = !studentSearch || p.name.toLowerCase().includes(studentSearch.toLowerCase()) || p.email.toLowerCase().includes(studentSearch.toLowerCase());
                          const matchesFilter = studentFilter === "all" ? true
                            : studentFilter === "confirmed" ? p.status === "ACTIVE" && enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED")
                            : studentFilter === "leads" ? p.status === "NEW" || !enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED")
                            : studentFilter === "stripe" ? enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "stripe" && e.approval_status === "APPROVED")
                            : studentFilter === "egypt" ? enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "egypt_manual")
                            : true;
                          return matchesSearch && matchesFilter;
                        });
                        const headers = ["Name", "Email", "Country", "Level", "Credits", "Status", "Joined"];
                        const rows = data.map(p => [p.name, p.email, p.country, p.level, p.credits, p.status, new Date(p.created_at).toLocaleDateString()]);
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
              ) : (
                <>
                  {(() => {
                     const filteredProfiles = profiles.filter(p => {
                       const matchesSearch = !studentSearch || p.name.toLowerCase().includes(studentSearch.toLowerCase()) || p.email.toLowerCase().includes(studentSearch.toLowerCase());
                       const matchesFilter = studentFilter === "confirmed" ? p.status === "ACTIVE" && enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED")
                         : studentFilter === "leads" ? p.status === "NEW" || (!enrollments.some(e => e.user_id === p.user_id && e.approval_status === "APPROVED"))
                         : studentFilter === "stripe" ? enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "stripe" && e.approval_status === "APPROVED")
                         : studentFilter === "egypt" ? enrollments.some(e => e.user_id === p.user_id && e.payment_provider === "egypt_manual")
                         : true;
                       return matchesSearch && matchesFilter;
                     });

                     if (filteredProfiles.length === 0) return <p className="text-muted-foreground text-center py-8">No students found.</p>;

                    return (
                      <div className="border rounded-xl max-h-[600px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
                              <TableHead className="py-3 px-3 font-semibold">Name</TableHead>
                              <TableHead className="py-3 px-3 font-semibold">Email</TableHead>
                              <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Country</TableHead>
                              <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Level</TableHead>
                              <TableHead className="py-3 px-3 font-semibold text-center">Credits</TableHead>
                              <TableHead className="py-3 px-3 font-semibold">Status</TableHead>
                              <TableHead className="py-3 px-3 hidden md:table-cell font-semibold">Source</TableHead>
                              <TableHead className="py-3 px-3 hidden sm:table-cell font-semibold">Joined</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProfiles.map((p) => {
                              const userEnrollments = enrollments.filter(e => e.user_id === p.user_id);
                              const source = userEnrollments.some(e => e.payment_provider === "stripe") ? "Stripe"
                                : userEnrollments.some(e => e.payment_provider === "egypt_manual") ? "Egypt"
                                : userEnrollments.some(e => e.payment_provider === "manual") ? "Manual"
                                : "—";
                              return (
                                <TableRow key={p.user_id} className="odd:bg-muted/30 hover:bg-muted/50 transition">
                                  <TableCell className="py-3 px-3 font-medium">{p.name || "—"}</TableCell>
                                  <TableCell className="py-3 px-3">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block max-w-[240px] truncate">{p.email}</span>
                                      </TooltipTrigger>
                                      <TooltipContent>{p.email}</TooltipContent>
                                    </Tooltip>
                                  </TableCell>
                                  <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{p.country || "—"}</TableCell>
                                  <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{p.level || "—"}</TableCell>
                                  <TableCell className="py-3 px-3 text-center font-mono">{p.credits}</TableCell>
                                  <TableCell className="py-3 px-3">
                                    <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                                  </TableCell>
                                  <TableCell className="py-3 px-3 hidden md:table-cell">
                                    <Badge variant="outline" className="text-xs">{source}</Badge>
                                  </TableCell>
                                  <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </>
              )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="enrollments">
              <Card className="rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Enrollments</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
              {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
                <Tabs defaultValue="under_review">
                  <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-3">
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
                  </div>

                  {(["pending_payment", "under_review", "pending", "approved", "rejected"] as const).map((tab) => {
                    const filtered = enrollments.filter((e) => {
                      if (tab === "pending_payment") return e.approval_status === "PENDING_PAYMENT";
                      if (tab === "under_review") return e.approval_status === "UNDER_REVIEW";
                      if (tab === "pending") return e.approval_status === "PENDING";
                      if (tab === "approved") return e.approval_status === "APPROVED";
                      return e.approval_status === "REJECTED";
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
                  const userEnrollment = enrollments.find(e => e.user_id === userId && e.approval_status === "APPROVED" && e.payment_status === "PAID");
                  const groupName = userGroupMap[userId];
                  const studentRecord = studentByEmail[email?.toLowerCase()];
                  const remainingClasses = studentRecord ? (studentRecord.total_classes - studentRecord.used_classes) : null;

                  return (
                    <Card key={userId}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-foreground">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {email}
                              {groupName && <> · <span className="font-medium text-foreground">Group: {groupName}</span></>}
                              {remainingClasses !== null && <> · Classes left: <span className="font-medium text-foreground">{remainingClasses}</span></>}
                              {userEnrollment && <> · Sessions left: {userEnrollment.sessions_remaining}</>}
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
                                    {a.status === "PENDING" && (
                                      <div className="flex items-center justify-end gap-1">
                                        <Button size="sm" onClick={() => handleAttendanceAction(a, "APPROVED")}>
                                          <Check className="h-4 w-4 mr-1" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAttendanceAction(a, "REJECTED")}>
                                          <X className="h-4 w-4 mr-1" /> Reject
                                        </Button>
                                      </div>
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
                        <SelectItem value="all">All</SelectItem>
                        {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                          <TableCell className="py-3 px-3 font-medium">{lead.name}</TableCell>
                          <TableCell className="py-3 px-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block max-w-[240px] truncate">{lead.email}</span>
                              </TooltipTrigger>
                              <TooltipContent>{lead.email}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{lead.country || "—"}</TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell">
                            {lead.plan_type ? <Badge variant="outline" className="text-xs">{lead.plan_type}</Badge> : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden md:table-cell text-muted-foreground">{lead.duration || "—"}</TableCell>
                          <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.schedule || "—"}</TableCell>
                          <TableCell className="py-3 px-3 hidden lg:table-cell text-xs text-muted-foreground">{lead.timezone || "—"}</TableCell>
                          <TableCell className="py-3 px-3">
                            <Badge variant={
                              lead.status === "enrolled" ? "default"
                              : lead.status === "rejected" ? "destructive"
                              : lead.status === "contacted" ? "secondary"
                              : "outline"
                            } className="text-xs">
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-3 hidden sm:table-cell text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="py-3 px-3">
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
          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminDashboard;
