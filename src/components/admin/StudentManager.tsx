import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Search, Download, Trash2, Plus, Edit, Users, UserCheck, UserX, Settings, CalendarDays, Package, History, Loader2 } from "lucide-react";
import LegacyAttendancePanel from "./LegacyAttendancePanel";

// Overview row from admin_student_overview view
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

// Legacy student from students table
interface LegacyStudent {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  status: string;
  course_type: string;
  package_name: string;
  total_classes: number;
  used_classes: number;
  remaining_classes: number;
  total_paid: number;
  price_per_class: number;
  payment_status: string;
  notes: string;
  created_at: string;
  group_name: string;
}

interface StudentPackage {
  id: string;
  student_id: string;
  package_name: string;
  total_classes: number;
  used_classes: number;
  total_paid: number;
  price_per_class: number;
  payment_status: string;
  is_active: boolean;
  notes: string;
  created_at: string;
}

interface StudentGroup {
  id: string;
  name: string;
  created_at: string;
}

const COURSE_TYPES = [
  { value: "group", label: "Group" },
  { value: "private", label: "Private" },
];

const COURSE_LEVELS = [
  { value: "hangul", label: "Hangul (Level 0)" },
  { value: "beginner-1", label: "Beginner 1" },
  { value: "beginner-2", label: "Beginner 2" },
  { value: "intermediate-3", label: "Intermediate 3" },
  { value: "intermediate-4", label: "Intermediate 4" },
  { value: "advanced-5", label: "Advanced 5" },
  { value: "advanced-6", label: "Advanced 6" },
  { value: "reading-speaking", label: "Reading & Speaking" },
  { value: "topik", label: "TOPIK Preparation" },
];

const EMPTY_STUDENT_FORM = {
  full_name: "", email: "", phone: "", country: "", status: "lead",
  course_type: "", level: "", notes: "", group_name: "",
};

// Bundle options derived from pricing tiers
const BUNDLE_OPTIONS = [
  // Local
  { label: "Local Group 1mo", classType: "group", duration: 1, classes: 4, amount: 25 },
  { label: "Local Group 3mo", classType: "group", duration: 3, classes: 12, amount: 70 },
  { label: "Local Group 6mo", classType: "group", duration: 6, classes: 24, amount: 130 },
  { label: "Local Private 1mo", classType: "private", duration: 1, classes: 4, amount: 50 },
  { label: "Local Private 3mo", classType: "private", duration: 3, classes: 12, amount: 140 },
  { label: "Local Private 6mo", classType: "private", duration: 6, classes: 24, amount: 250 },
  // Regional
  { label: "Regional Group 1mo", classType: "group", duration: 1, classes: 4, amount: 40 },
  { label: "Regional Group 3mo", classType: "group", duration: 3, classes: 12, amount: 110 },
  { label: "Regional Group 6mo", classType: "group", duration: 6, classes: 24, amount: 200 },
  { label: "Regional Private 1mo", classType: "private", duration: 1, classes: 4, amount: 80 },
  { label: "Regional Private 3mo", classType: "private", duration: 3, classes: 12, amount: 220 },
  { label: "Regional Private 6mo", classType: "private", duration: 6, classes: 24, amount: 380 },
  // Global
  { label: "Global Group 1mo", classType: "group", duration: 1, classes: 4, amount: 60 },
  { label: "Global Group 3mo", classType: "group", duration: 3, classes: 12, amount: 170 },
  { label: "Global Group 6mo", classType: "group", duration: 6, classes: 24, amount: 300 },
  { label: "Global Private 1mo", classType: "private", duration: 1, classes: 4, amount: 120 },
  { label: "Global Private 3mo", classType: "private", duration: 3, classes: 12, amount: 330 },
  { label: "Global Private 6mo", classType: "private", duration: 6, classes: 24, amount: 580 },
  // Egypt EGP
  { label: "Egypt Group 1mo (EGP)", classType: "group", duration: 1, classes: 4, amount: 1200 },
  { label: "Egypt Group 3mo (EGP)", classType: "group", duration: 3, classes: 12, amount: 3300 },
  { label: "Egypt Group 6mo (EGP)", classType: "group", duration: 6, classes: 24, amount: 6100 },
  { label: "Egypt Private 1mo (EGP)", classType: "private", duration: 1, classes: 4, amount: 2350 },
  { label: "Egypt Private 3mo (EGP)", classType: "private", duration: 3, classes: 12, amount: 6600 },
  { label: "Egypt Private 6mo (EGP)", classType: "private", duration: 6, classes: 24, amount: 11750 },
];

const EMPTY_PACKAGE_FORM = {
  package_name: "", total_classes: 0, total_paid: 0, payment_status: "paid", used_classes: 0,
};

const StudentManager = () => {
  // Overview
  const [overviewRows, setOverviewRows] = useState<OverviewRow[]>([]);
  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewFilter, setOverviewFilter] = useState("all");
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Legacy students CRUD
  const [legacyStudents, setLegacyStudents] = useState<LegacyStudent[]>([]);
  const [legacySearch, setLegacySearch] = useState("");
  const [legacyStatusFilter, setLegacyStatusFilter] = useState("all");
  const [legacyGroupFilter, setLegacyGroupFilter] = useState("all");
  const [legacyLoading, setLegacyLoading] = useState(true);

  // Student dialog (add/edit student info)
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentForm, setStudentForm] = useState(EMPTY_STUDENT_FORM);
  const [saving, setSaving] = useState(false);
  const [lookingUpEmail, setLookingUpEmail] = useState(false);
  const [mergedEnrollment, setMergedEnrollment] = useState<any>(null);

  // Package dialog (add new package to student)
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [packageStudentId, setPackageStudentId] = useState<string | null>(null);
  const [packageStudentName, setPackageStudentName] = useState("");
  const [packageForm, setPackageForm] = useState(EMPTY_PACKAGE_FORM);
  const [savingPackage, setSavingPackage] = useState(false);

  // Package history dialog
  const [packagesDialogOpen, setPackagesDialogOpen] = useState(false);
  const [packagesForStudent, setPackagesForStudent] = useState<StudentPackage[]>([]);
  const [packagesStudentName, setPackagesStudentName] = useState("");
  const [packagesLoading, setPackagesLoading] = useState(false);

  // Attendance panel
  const [attendancePackage, setAttendancePackage] = useState<{
    packageId: string; studentId: string; studentName: string;
    packageName: string; totalClasses: number; pricePerClass: number;
  } | null>(null);

  // Groups
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [manageGroupsOpen, setManageGroupsOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const fetchGroups = async () => {
    const { data } = await supabase.from("student_groups").select("*").order("name") as { data: StudentGroup[] | null };
    setGroups(data || []);
  };

  const fetchOverview = async () => {
    setOverviewLoading(true);
    const { data, error } = await supabase.from("admin_student_overview" as any).select("*");
    if (error) toast({ title: "Error loading overview", description: error.message, variant: "destructive" });
    setOverviewRows((data as any[]) || []);
    setOverviewLoading(false);
  };

  const fetchLegacyStudents = async () => {
    setLegacyLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Error loading students", description: error.message, variant: "destructive" });
    setLegacyStudents(((data as any[]) || []).map(s => ({ ...s, group_name: s.group_name || "" })));
    setLegacyLoading(false);
  };

  useEffect(() => { fetchOverview(); fetchLegacyStudents(); fetchGroups(); }, []);

  // === OVERVIEW TAB ===
  const filteredOverview = useMemo(() => {
    return overviewRows.filter(u => {
      const matchesSearch = !overviewSearch ||
        u.name?.toLowerCase().includes(overviewSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(overviewSearch.toLowerCase());
      const matchesFilter = overviewFilter === "all" ? true
        : overviewFilter === "active" ? u.derived_status === "ACTIVE"
        : overviewFilter === "lead" ? u.derived_status === "LEAD"
        : overviewFilter === "completed" ? u.derived_status === "COMPLETED"
        : overviewFilter === "locked" ? u.derived_status === "LOCKED"
        : overviewFilter === "stripe" ? u.source_label === "Stripe"
        : overviewFilter === "egypt" ? u.source_label === "Egypt"
        : true;
      return matchesSearch && matchesFilter;
    });
  }, [overviewRows, overviewSearch, overviewFilter]);

  const overviewStats = useMemo(() => ({
    total: overviewRows.length,
    active: overviewRows.filter(u => u.derived_status === "ACTIVE").length,
    leads: overviewRows.filter(u => u.derived_status === "LEAD").length,
    completed: overviewRows.filter(u => ["COMPLETED", "LOCKED"].includes(u.derived_status)).length,
  }), [overviewRows]);

  // === LEGACY TAB ===
  const filteredLegacy = useMemo(() => {
    return legacyStudents.filter((s) => {
      const matchSearch = !legacySearch ||
        s.full_name.toLowerCase().includes(legacySearch.toLowerCase()) ||
        s.email.toLowerCase().includes(legacySearch.toLowerCase());
      const matchStatus = legacyStatusFilter === "all" || s.status === legacyStatusFilter;
      const matchGroup = legacyGroupFilter === "all" || s.group_name === legacyGroupFilter || (legacyGroupFilter === "unassigned" && !s.group_name);
      return matchSearch && matchStatus && matchGroup;
    });
  }, [legacyStudents, legacySearch, legacyStatusFilter, legacyGroupFilter]);

  // === STUDENT CRUD ===
  const openAddStudent = () => {
    setEditingStudentId(null);
    setStudentForm(EMPTY_STUDENT_FORM);
    setMergedEnrollment(null);
    setStudentDialogOpen(true);
  };

  const openEditStudent = (s: LegacyStudent) => {
    setEditingStudentId(s.id);
    setStudentForm({
      full_name: s.full_name, email: s.email, phone: s.phone, country: s.country,
      status: s.status, course_type: s.course_type, level: "", notes: s.notes,
      group_name: s.group_name || "",
    });
    setMergedEnrollment(null);
    setStudentDialogOpen(true);
  };

  // Auto-lookup existing data when email is entered in Add mode
  const handleEmailBlur = async () => {
    if (editingStudentId) return; // skip for edit mode
    const email = studentForm.email.trim().toLowerCase();
    if (!email || !email.includes("@")) return;

    setLookingUpEmail(true);
    const mergedFields: string[] = [];

    try {
      // Query all three sources in parallel
      const [profileRes, enrollmentRes, leadRes] = await Promise.all([
        supabase.from("profiles").select("name, country, level").eq("email", email).maybeSingle(),
        supabase.from("admin_student_overview" as any).select("*").eq("email", email).maybeSingle(),
        supabase.from("leads").select("*").eq("email", email).maybeSingle(),
      ]);

      const profile = profileRes.data as any;
      const enrollment = enrollmentRes.data as any;
      const lead = leadRes.data as any;

      setStudentForm(prev => {
        const updated = { ...prev };

        // From profile
        if (profile) {
          if (!updated.full_name && profile.name) { updated.full_name = profile.name; mergedFields.push("name"); }
          if (!updated.country && profile.country) { updated.country = profile.country; mergedFields.push("country"); }
          if (!updated.level && profile.level) { updated.level = profile.level; mergedFields.push("level"); }
        }

        // From lead
        if (lead) {
          if (!updated.full_name && lead.name) { updated.full_name = lead.name; mergedFields.push("name"); }
          if (!updated.country && lead.country) { updated.country = lead.country; mergedFields.push("country"); }
        }

        // From enrollment
        if (enrollment) {
          if (!updated.course_type && enrollment.plan_type) { updated.course_type = enrollment.plan_type; mergedFields.push("course type"); }
          if (enrollment.payment_status === "PAID" && enrollment.approval_status === "APPROVED") {
            updated.status = "student";
            mergedFields.push("status→student");
          }
        }

        return updated;
      });

      // Store enrollment data for use on save
      setMergedEnrollment(enrollment);

      if (mergedFields.length > 0) {
        toast({ title: "Data found!", description: `Auto-filled: ${[...new Set(mergedFields)].join(", ")}` });
      }
    } catch (err) {
      console.error("Email lookup error:", err);
    } finally {
      setLookingUpEmail(false);
    }
  };

  const handleSaveStudent = async () => {
    if (!studentForm.full_name.trim() || !studentForm.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const email = studentForm.email.trim().toLowerCase();

    // Build base payload
    const payload: any = {
      full_name: studentForm.full_name.trim(), email,
      phone: studentForm.phone.trim(), country: studentForm.country.trim(),
      status: studentForm.status, course_type: studentForm.course_type.trim(),
      notes: studentForm.notes.trim(), group_name: studentForm.group_name,
    };

    // Enrich with enrollment data when adding (not editing)
    if (!editingStudentId && mergedEnrollment) {
      const e = mergedEnrollment;
      if (e.sessions_total) payload.total_classes = e.sessions_total;
      if (e.amount) payload.total_paid = Number(e.amount);
      if (e.unit_price) payload.price_per_class = Number(e.unit_price);
      if (e.plan_type && !payload.course_type) payload.course_type = e.plan_type;
      if (e.plan_type && e.duration) payload.package_name = `${e.plan_type} ${e.duration}mo`;
      if (e.payment_status === "PAID") payload.payment_status = "paid";
    }

    if (editingStudentId) {
      const { error } = await supabase.from("students").update(payload).eq("id", editingStudentId);
      if (error) toast({ title: "Error updating", description: error.message, variant: "destructive" });
      else toast({ title: "Student updated" });
    } else {
      const { data: existing } = await supabase
        .from("students").select("id").eq("email", email).maybeSingle();

      if (existing) {
        const { error } = await supabase.from("students").update(payload).eq("id", (existing as any).id);
        if (error) toast({ title: "Error updating", description: error.message, variant: "destructive" });
        else toast({ title: "Student merged", description: "Existing record updated with enrollment data." });
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) toast({ title: "Error adding student", description: error.message, variant: "destructive" });
        else toast({ title: "Student added", description: mergedEnrollment ? "Enrollment data merged." : undefined });
      }

      // Sync lead status to enrolled
      await supabase.from("leads").update({ status: "enrolled" } as any).eq("email", email).neq("status", "enrolled");
    }

    setSaving(false);
    setStudentDialogOpen(false);
    setMergedEnrollment(null);
    fetchLegacyStudents();
  };

  // === PACKAGE CRUD ===
  const openAddPackage = (student: LegacyStudent) => {
    setPackageStudentId(student.id);
    setPackageStudentName(student.full_name);
    setPackageForm(EMPTY_PACKAGE_FORM);
    setPackageDialogOpen(true);
  };

  const handleSavePackage = async () => {
    if (!packageStudentId) return;
    const totalClasses = Number(packageForm.total_classes) || 0;
    const totalPaid = Number(packageForm.total_paid) || 0;
    const pricePerClass = totalClasses > 0 ? Math.round((totalPaid / totalClasses) * 100) / 100 : 0;

    setSavingPackage(true);

    // Deactivate existing active packages for this student
    await supabase
      .from("student_packages" as any)
      .update({ is_active: false } as any)
      .eq("student_id", packageStudentId)
      .eq("is_active", true);

    const usedClasses = Number(packageForm.used_classes) || 0;

    // Insert new active package
    const { error } = await supabase
      .from("student_packages" as any)
      .insert({
        student_id: packageStudentId,
        package_name: packageForm.package_name.trim(),
        total_classes: totalClasses,
        used_classes: usedClasses,
        total_paid: totalPaid,
        price_per_class: pricePerClass,
        payment_status: packageForm.payment_status,
        is_active: true,
      } as any);

    if (error) {
      toast({ title: "Error adding package", description: error.message, variant: "destructive" });
    } else {
      // Sync students table with the new package info
      await supabase.from("students").update({
        package_name: packageForm.package_name.trim(),
        total_classes: totalClasses,
        used_classes: usedClasses,
        total_paid: totalPaid,
        price_per_class: pricePerClass,
        payment_status: packageForm.payment_status,
      } as any).eq("id", packageStudentId);

      toast({ title: "Package added", description: `New package for ${packageStudentName}` });
      fetchLegacyStudents();
    }
    setSavingPackage(false);
    setPackageDialogOpen(false);
  };

  // === PACKAGE HISTORY ===
  const openPackageHistory = async (student: LegacyStudent) => {
    setPackagesStudentName(student.full_name);
    setPackagesLoading(true);
    setPackagesDialogOpen(true);

    const { data, error } = await supabase
      .from("student_packages" as any)
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setPackagesForStudent((data as any[]) || []);
    setPackagesLoading(false);
  };

  const openAttendanceForPackage = (pkg: StudentPackage, studentName: string) => {
    setAttendancePackage({
      packageId: pkg.id,
      studentId: pkg.student_id,
      studentName,
      packageName: pkg.package_name,
      totalClasses: pkg.total_classes,
      pricePerClass: pkg.price_per_class,
    });
    setPackagesDialogOpen(false);
  };

  // === STUDENT ACTIONS ===
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    else { toast({ title: "Student deleted" }); fetchLegacyStudents(); }
  };

  const handleGroupChange = async (studentId: string, groupName: string) => {
    const value = groupName === "unassigned" ? "" : groupName;
    const { error } = await supabase.from("students").update({ group_name: value } as any).eq("id", studentId);
    if (error) toast({ title: "Error assigning group", description: error.message, variant: "destructive" });
    else {
      setLegacyStudents(prev => prev.map(s => s.id === studentId ? { ...s, group_name: value } : s));
      toast({ title: "Group updated" });
    }
  };

  const handleAddGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    const { error } = await supabase.from("student_groups").insert({ name } as any);
    if (error) {
      const msg = error.message?.includes("duplicate") ? "Group name already exists." : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else { toast({ title: "Group added" }); setNewGroupName(""); fetchGroups(); }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const { error } = await supabase.from("student_groups").delete().eq("id", groupId);
    if (error) toast({ title: "Error deleting group", description: error.message, variant: "destructive" });
    else { toast({ title: "Group deleted" }); fetchGroups(); }
  };

  const exportOverviewCSV = () => {
    const headers = ["Name", "Email", "Country", "Level", "Remaining Sessions", "Status", "Source", "Joined"];
    const rows = filteredOverview.map(u => [u.name, u.email, u.country, u.level, u.sessions_remaining, u.derived_status, u.source_label, new Date(u.joined_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `students-overview-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "student": return <Badge variant="default">Student</Badge>;
      case "lead": return <Badge variant="secondary">Lead</Badge>;
      case "inactive": return <Badge variant="destructive">Inactive</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const paymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="default">Paid</Badge>;
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "manual": return <Badge variant="outline">Manual</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="w-full flex gap-2 h-auto bg-transparent p-0">
          <TabsTrigger value="overview" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">
            Students Overview ({overviewRows.length})
          </TabsTrigger>
          <TabsTrigger value="legacy" className="shrink-0 rounded-full px-4 py-2 text-sm border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary bg-background">
            Legacy Manual ({legacyStudents.length})
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Card><CardContent className="pt-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{overviewStats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <UserCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-foreground">{overviewStats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold text-foreground">{overviewStats.leads}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 text-center">
              <UserX className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold text-foreground">{overviewStats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed/Locked</p>
            </CardContent></Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={overviewSearch} onChange={(e) => setOverviewSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={overviewFilter} onValueChange={setOverviewFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="egypt">Egypt</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportOverviewCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
          </div>

          {overviewLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filteredOverview.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No students found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Country</TableHead>
                    <TableHead className="hidden md:table-cell">Level</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Source</TableHead>
                    <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOverview.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{u.country || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{u.level || "—"}</TableCell>
                      <TableCell className="text-center font-mono">{u.sessions_remaining}</TableCell>
                      <TableCell>
                        <Badge variant={u.derived_status === "ACTIVE" ? "default" : u.derived_status === "LOCKED" ? "destructive" : "secondary"} className="text-xs">
                          {u.derived_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">{u.source_label}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{new Date(u.joined_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* LEGACY MANUAL TAB */}
        <TabsContent value="legacy">
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or email..." value={legacySearch} onChange={(e) => setLegacySearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={legacyStatusFilter} onValueChange={setLegacyStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={legacyGroupFilter} onValueChange={setLegacyGroupFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Groups" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setManageGroupsOpen(true)} title="Manage Groups">
              <Settings className="h-4 w-4 mr-1" /> Groups
            </Button>
            <Button onClick={openAddStudent} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </div>

          {legacyLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-center">Classes</TableHead>
                    <TableHead className="text-center">Remaining</TableHead>
                    <TableHead className="text-center">Negative</TableHead>
                    <TableHead className="text-right">Amount Due</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLegacy.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground py-8">No students found.</TableCell>
                    </TableRow>
                  ) : filteredLegacy.map((s) => {
                    // Cross-reference with admin_student_overview for consistent data
                    const overview = overviewRows.find(o => o.email?.toLowerCase() === s.email?.toLowerCase());
                    const remaining = overview ? overview.sessions_remaining : (s.total_classes - s.used_classes);
                    const negativeSessions = overview ? (overview.negative_sessions || 0) : Math.max(0, -remaining);
                    const amountDue = overview ? (overview.amount_due || 0) : (negativeSessions * s.price_per_class);
                    const currency = overview?.currency === "EGP" ? "LE" : "$";
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.full_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                        <TableCell>{statusBadge(s.status)}</TableCell>
                        <TableCell>
                          {s.status === "student" ? (
                            <Select value={s.group_name || "unassigned"} onValueChange={(v) => handleGroupChange(s.id, v)}>
                              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue placeholder="Assign group" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">— None —</SelectItem>
                                {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{s.package_name || "—"}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm">{s.used_classes}/{s.total_classes}</span>
                        </TableCell>
                        <TableCell className={`text-center font-mono ${remaining < 0 ? "text-destructive font-semibold" : ""}`}>
                          {remaining}
                        </TableCell>
                        <TableCell className={`text-center font-mono ${negativeSessions > 0 ? "text-destructive font-semibold" : ""}`}>
                          {negativeSessions > 0 ? negativeSessions : "—"}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${amountDue > 0 ? "text-destructive font-semibold" : ""}`}>
                          {amountDue > 0 ? `${currency}${amountDue.toLocaleString()}` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm">${s.total_paid}</TableCell>
                        <TableCell>{paymentBadge(s.payment_status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openPackageHistory(s)} title="View Packages">
                              <History className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openAddPackage(s)} title="Add Package">
                              <Package className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditStudent(s)} title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently remove this student and all their packages.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(s.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Attendance Panel */}
          {attendancePackage && (
            <div className="mt-4">
              <LegacyAttendancePanel
                packageId={attendancePackage.packageId}
                studentId={attendancePackage.studentId}
                studentName={attendancePackage.studentName}
                packageName={attendancePackage.packageName}
                totalClasses={attendancePackage.totalClasses}
                pricePerClass={attendancePackage.pricePerClass}
                onClose={() => setAttendancePackage(null)}
                onUpdated={() => { fetchLegacyStudents(); }}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Student Dialog */}
      <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStudentId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input value={studentForm.full_name} onChange={(e) => setStudentForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email * {lookingUpEmail && <Loader2 className="inline h-3 w-3 animate-spin ml-1" />}</label>
                <Input type="email" value={studentForm.email} onChange={(e) => setStudentForm(f => ({ ...f, email: e.target.value }))} onBlur={handleEmailBlur} />
                {!editingStudentId && <p className="text-xs text-muted-foreground mt-0.5">Tab out to auto-lookup existing data</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={studentForm.phone} onChange={(e) => setStudentForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Country</label>
                <Input value={studentForm.country} onChange={(e) => setStudentForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={studentForm.status} onValueChange={(v) => setStudentForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Course Type</label>
                <Select value={studentForm.course_type || "none"} onValueChange={(v) => setStudentForm(f => ({ ...f, course_type: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {COURSE_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Level</label>
                <Select value={studentForm.level || "none"} onValueChange={(v) => setStudentForm(f => ({ ...f, level: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Select —</SelectItem>
                    {COURSE_LEVELS.map(cl => <SelectItem key={cl.value} value={cl.value}>{cl.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Group Name</label>
                <Select value={studentForm.group_name || "unassigned"} onValueChange={(v) => setStudentForm(f => ({ ...f, group_name: v === "unassigned" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">— None —</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea value={studentForm.notes} onChange={(e) => setStudentForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStudent} disabled={saving}>{saving ? "Saving..." : editingStudentId ? "Update" : "Add Student"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Package Dialog */}
      <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Package — {packageStudentName}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium text-foreground">Select Bundle</label>
              <Select onValueChange={(v) => {
                const bundle = BUNDLE_OPTIONS[Number(v)];
                if (bundle) {
                  setPackageForm({
                    package_name: bundle.label,
                    total_classes: bundle.classes,
                    total_paid: bundle.amount,
                    payment_status: "paid",
                    used_classes: 0,
                  });
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Choose a bundle..." /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {BUNDLE_OPTIONS.map((b, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {b.label} — ${b.amount} ({b.classes} classes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Package Name</label>
              <Input value={packageForm.package_name} onChange={(e) => setPackageForm(f => ({ ...f, package_name: e.target.value }))} placeholder="Auto-filled from bundle" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Total Classes</label>
                <Input type="number" min={0} value={packageForm.total_classes} onChange={(e) => setPackageForm(f => ({ ...f, total_classes: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Extra (unpaid)</label>
                <Input type="number" min={0} value={packageForm.used_classes} onChange={(e) => setPackageForm(f => ({ ...f, used_classes: Number(e.target.value) }))} placeholder="0" />
                <p className="text-xs text-muted-foreground mt-0.5">Classes attended but not paid</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Total Paid</label>
                <Input type="number" min={0} value={packageForm.total_paid} onChange={(e) => setPackageForm(f => ({ ...f, total_paid: Number(e.target.value) }))} />
              </div>
            </div>
            {Number(packageForm.used_classes) > 0 && (
              <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                {packageForm.used_classes} extra unpaid session{Number(packageForm.used_classes) !== 1 ? "s" : ""} — Amount due: $
                {(Number(packageForm.used_classes) * (Number(packageForm.total_classes) > 0 ? Math.round((Number(packageForm.total_paid) / Number(packageForm.total_classes)) * 100) / 100 : 0)).toFixed(2)}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Price / Class</label>
                <Input type="number" disabled value={Number(packageForm.total_classes) > 0 ? Math.round((Number(packageForm.total_paid) / Number(packageForm.total_classes)) * 100) / 100 : 0} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Payment Status</label>
                <Select value={packageForm.payment_status} onValueChange={(v) => setPackageForm(f => ({ ...f, payment_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePackage} disabled={savingPackage}>{savingPackage ? "Saving..." : "Add Package"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Package History Dialog */}
      <Dialog open={packagesDialogOpen} onOpenChange={setPackagesDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Packages — {packagesStudentName}</DialogTitle>
          </DialogHeader>
          {packagesLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : packagesForStudent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No packages found.</p>
          ) : (
            <div className="space-y-3">
              {packagesForStudent.map((pkg) => {
                const remaining = pkg.total_classes - pkg.used_classes;
                const extra = remaining < 0 ? Math.abs(remaining) : 0;
                const due = extra * pkg.price_per_class;
                return (
                  <Card key={pkg.id} className={pkg.is_active ? "border-primary/30" : "opacity-70"}>
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{pkg.package_name || "Unnamed"}</span>
                          {pkg.is_active ? (
                            <Badge variant="default" className="text-xs">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Previous</Badge>
                          )}
                          {paymentBadge(pkg.payment_status)}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openAttendanceForPackage(pkg, packagesStudentName)}>
                          <CalendarDays className="h-3.5 w-3.5 mr-1" /> Dates
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Total</span>
                          <p className="font-medium text-foreground">{pkg.total_classes}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Used</span>
                          <p className="font-medium text-foreground">{pkg.used_classes}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Remaining</span>
                          <p className={`font-medium ${remaining < 0 ? "text-destructive" : "text-foreground"}`}>{remaining}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Paid</span>
                          <p className="font-medium text-foreground">${pkg.total_paid}</p>
                        </div>
                      </div>
                      {extra > 0 && (
                        <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                          {extra} extra session{extra !== 1 ? "s" : ""} — Amount due: ${due.toFixed(2)}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Added: {new Date(pkg.created_at).toLocaleDateString()}
                        {pkg.price_per_class > 0 && ` • $${pkg.price_per_class}/class`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manage Groups Dialog */}
      <Dialog open={manageGroupsOpen} onOpenChange={setManageGroupsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="New group name..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddGroup()} />
              <Button size="sm" onClick={handleAddGroup}><Plus className="h-4 w-4" /></Button>
            </div>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No groups yet.</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {groups.map(g => (
                  <div key={g.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm text-foreground">{g.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{g.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>Students assigned to this group will become unassigned.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteGroup(g.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManager;
