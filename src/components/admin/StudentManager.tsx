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
import { Search, Download, Trash2, Plus, Edit, CheckCircle, Users, UserCheck, UserX, Settings } from "lucide-react";

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
}

// Legacy student from students table (for legacy CRUD tab)
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

interface StudentGroup {
  id: string;
  name: string;
  created_at: string;
}

const EMPTY_FORM: Omit<LegacyStudent, "id" | "remaining_classes" | "created_at"> = {
  full_name: "", email: "", phone: "", country: "", status: "lead",
  course_type: "", package_name: "", total_classes: 0, used_classes: 0,
  total_paid: 0, price_per_class: 0, payment_status: "pending", notes: "", group_name: "",
};

const StudentManager = () => {
  // Overview (single source of truth)
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

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
    if (error) {
      toast({ title: "Error loading overview", description: error.message, variant: "destructive" });
    }
    setOverviewRows((data as any[]) || []);
    setOverviewLoading(false);
  };

  const fetchLegacyStudents = async () => {
    setLegacyLoading(true);
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error loading students", description: error.message, variant: "destructive" });
    }
    setLegacyStudents(((data as any[]) || []).map(s => ({ ...s, group_name: s.group_name || "" })));
    setLegacyLoading(false);
  };

  useEffect(() => {
    fetchOverview();
    fetchLegacyStudents();
    fetchGroups();
  }, []);

  // === OVERVIEW TAB LOGIC ===
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

  // === LEGACY TAB LOGIC ===
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

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (s: LegacyStudent) => {
    setEditingId(s.id);
    setForm({
      full_name: s.full_name, email: s.email, phone: s.phone, country: s.country,
      status: s.status, course_type: s.course_type, package_name: s.package_name,
      total_classes: s.total_classes, used_classes: s.used_classes, total_paid: s.total_paid,
      price_per_class: s.price_per_class, payment_status: s.payment_status, notes: s.notes,
      group_name: s.group_name || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      full_name: form.full_name.trim(), email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(), country: form.country.trim(), status: form.status,
      course_type: form.course_type.trim(), package_name: form.package_name.trim(),
      total_classes: Number(form.total_classes) || 0, used_classes: Number(form.used_classes) || 0,
      total_paid: Number(form.total_paid) || 0, price_per_class: Number(form.price_per_class) || 0,
      payment_status: form.payment_status, notes: form.notes.trim(), group_name: form.group_name,
    };
    if (editingId) {
      const { error } = await supabase.from("students").update(payload as any).eq("id", editingId);
      if (error) toast({ title: "Error updating", description: error.message, variant: "destructive" });
      else toast({ title: "Student updated" });
    } else {
      const { error } = await supabase.from("students").insert(payload as any);
      if (error) {
        const msg = error.message?.includes("duplicate") ? "A student with this email already exists." : error.message;
        toast({ title: "Error adding student", description: msg, variant: "destructive" });
      } else toast({ title: "Student added" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchLegacyStudents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    else { toast({ title: "Student deleted" }); fetchLegacyStudents(); }
  };

  const handleMarkAttendance = async (studentId: string) => {
    setMarkingAttendance(studentId);
    const { data, error } = await supabase.rpc("mark_student_attendance", { _student_id: studentId } as any);
    if (error) {
      const msg = error.message?.includes("No remaining") ? "No remaining classes for this student." : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Attendance marked", description: `Remaining classes: ${data}` });
      fetchLegacyStudents();
    }
    setMarkingAttendance(null);
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

        {/* OVERVIEW TAB — single source of truth */}
        <TabsContent value="overview">
          {/* Stats */}
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

          {/* Toolbar */}
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

          {/* Table */}
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

        {/* LEGACY MANUAL STUDENTS TAB */}
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
            <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
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
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLegacy.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No students found.</TableCell>
                    </TableRow>
                  ) : filteredLegacy.map((s) => (
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
                        <span className="text-xs text-muted-foreground ml-1">({s.remaining_classes} left)</span>
                      </TableCell>
                      <TableCell className="text-right text-sm">${s.total_paid}</TableCell>
                      <TableCell>{paymentBadge(s.payment_status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleMarkAttendance(s.id)}
                            disabled={markingAttendance === s.id || s.remaining_classes <= 0} title="Mark Attendance">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(s)} title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" title="Delete"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this student.</AlertDialogDescription>
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Student" : "Add Student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email *</label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Country</label>
                <Input value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
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
                <Input value={form.course_type} onChange={(e) => setForm(f => ({ ...f, course_type: e.target.value }))} placeholder="e.g. Group, Private" />
              </div>
            </div>
            {form.status === "student" && (
              <div>
                <label className="text-sm font-medium text-foreground">Group Name</label>
                <Select value={form.group_name || "unassigned"} onValueChange={(v) => setForm(f => ({ ...f, group_name: v === "unassigned" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">— None —</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-foreground">Package Name</label>
              <Input value={form.package_name} onChange={(e) => setForm(f => ({ ...f, package_name: e.target.value }))} placeholder="e.g. 3-Month Group" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Total Classes</label>
                <Input type="number" min={0} value={form.total_classes} onChange={(e) => setForm(f => ({ ...f, total_classes: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Used Classes</label>
                <Input type="number" min={0} value={form.used_classes} onChange={(e) => setForm(f => ({ ...f, used_classes: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Remaining</label>
                <Input type="number" disabled value={Math.max(0, (Number(form.total_classes) || 0) - (Number(form.used_classes) || 0))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Total Paid</label>
                <Input type="number" min={0} value={form.total_paid} onChange={(e) => setForm(f => ({ ...f, total_paid: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Price / Class</label>
                <Input type="number" min={0} value={form.price_per_class} onChange={(e) => setForm(f => ({ ...f, price_per_class: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Payment Status</label>
                <Select value={form.payment_status} onValueChange={(v) => setForm(f => ({ ...f, payment_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : editingId ? "Update" : "Add Student"}</Button>
          </DialogFooter>
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
