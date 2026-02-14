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
import { toast } from "@/hooks/use-toast";
import { Search, Download, Trash2, Plus, Edit, CheckCircle, Users, UserCheck, UserX } from "lucide-react";

interface Student {
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
}

const EMPTY_FORM: Omit<Student, "id" | "remaining_classes" | "created_at"> = {
  full_name: "",
  email: "",
  phone: "",
  country: "",
  status: "lead",
  course_type: "",
  package_name: "",
  total_classes: 0,
  used_classes: 0,
  total_paid: 0,
  price_per_class: 0,
  payment_status: "pending",
  notes: "",
};

const StudentManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState<string | null>(null);

  const fetchStudents = async () => {
    // Fetch all three sources in parallel
    const [studentsRes, leadsRes, profilesRes] = await Promise.all([
      supabase.from("students").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);

    if (studentsRes.error) {
      toast({ title: "Error loading students", description: studentsRes.error.message, variant: "destructive" });
    }

    const existingStudents: Student[] = (studentsRes.data as any[]) || [];
    const existingEmails = new Set(existingStudents.map(s => s.email.toLowerCase()));

    // Add leads not already in students table
    const leadsData = (leadsRes.data as any[]) || [];
    const leadEntries: Student[] = leadsData
      .filter(l => !existingEmails.has(l.email.toLowerCase()))
      .map(l => {
        existingEmails.add(l.email.toLowerCase());
        return {
          id: l.id,
          full_name: l.name,
          email: l.email,
          phone: "",
          country: l.country || "",
          status: "lead",
          course_type: l.plan_type || "",
          package_name: l.duration || "",
          total_classes: 0,
          used_classes: 0,
          remaining_classes: 0,
          total_paid: 0,
          price_per_class: 0,
          payment_status: "pending",
          notes: `Source: ${l.source || "enroll"} | Schedule: ${l.schedule || "—"}`,
          created_at: l.created_at,
        };
      });

    // Add profiles (registered users) not already in students or leads
    const profilesData = (profilesRes.data as any[]) || [];
    const inactiveEntries: Student[] = profilesData
      .filter(p => !existingEmails.has(p.email.toLowerCase()))
      .map(p => {
        existingEmails.add(p.email.toLowerCase());
        return {
          id: p.id,
          full_name: p.name,
          email: p.email,
          phone: "",
          country: p.country || "",
          status: "inactive",
          course_type: "",
          package_name: "",
          total_classes: 0,
          used_classes: 0,
          remaining_classes: 0,
          total_paid: 0,
          price_per_class: 0,
          payment_status: "pending",
          notes: `Registered user (${p.status})`,
          created_at: p.created_at,
        };
      });

    setStudents([...existingStudents, ...leadEntries, ...inactiveEntries]);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, search, statusFilter]);

  const stats = useMemo(() => ({
    total: students.length,
    active: students.filter(s => s.status === "student").length,
    leads: students.filter(s => s.status === "lead").length,
    inactive: students.filter(s => s.status === "inactive").length,
  }), [students]);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      full_name: s.full_name,
      email: s.email,
      phone: s.phone,
      country: s.country,
      status: s.status,
      course_type: s.course_type,
      package_name: s.package_name,
      total_classes: s.total_classes,
      used_classes: s.used_classes,
      total_paid: s.total_paid,
      price_per_class: s.price_per_class,
      payment_status: s.payment_status,
      notes: s.notes,
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
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      status: form.status,
      course_type: form.course_type.trim(),
      package_name: form.package_name.trim(),
      total_classes: Number(form.total_classes) || 0,
      used_classes: Number(form.used_classes) || 0,
      total_paid: Number(form.total_paid) || 0,
      price_per_class: Number(form.price_per_class) || 0,
      payment_status: form.payment_status,
      notes: form.notes.trim(),
    };

    if (editingId) {
      const { error } = await supabase.from("students").update(payload as any).eq("id", editingId);
      if (error) {
        toast({ title: "Error updating", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Student updated" });
      }
    } else {
      const { error } = await supabase.from("students").insert(payload as any);
      if (error) {
        const msg = error.message?.includes("duplicate") ? "A student with this email already exists." : error.message;
        toast({ title: "Error adding student", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Student added" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchStudents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student deleted" });
      fetchStudents();
    }
  };

  const handleMarkAttendance = async (studentId: string) => {
    setMarkingAttendance(studentId);
    const { data, error } = await supabase.rpc("mark_student_attendance", {
      _student_id: studentId,
    } as any);
    if (error) {
      const msg = error.message?.includes("No remaining") ? "No remaining classes for this student." : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({ title: "Attendance marked", description: `Remaining classes: ${data}` });
      fetchStudents();
    }
    setMarkingAttendance(null);
  };

  const handleConvertToStudent = async (student: Student) => {
    const { error } = await supabase.from("students").update({ status: "student" } as any).eq("id", student.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Converted to student" });
      fetchStudents();
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Country", "Status", "Course", "Package", "Total Classes", "Used", "Remaining", "Total Paid", "Price/Class", "Payment", "Notes", "Created"];
    const rows = filtered.map(s => [
      s.full_name, s.email, s.phone, s.country, s.status, s.course_type, s.package_name,
      s.total_classes, s.used_classes, s.remaining_classes, s.total_paid, s.price_per_class,
      s.payment_status, s.notes, new Date(s.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
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

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading students...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserCheck className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold text-foreground">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Active Students</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
          <p className="text-2xl font-bold text-foreground">{stats.leads}</p>
          <p className="text-xs text-muted-foreground">Leads</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserX className="h-5 w-5 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
          <p className="text-xs text-muted-foreground">Inactive</p>
        </CardContent></Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="lead">Leads</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={openAdd} size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> CSV</Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Package</TableHead>
              <TableHead className="text-center">Classes</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">$/Class</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.email}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-sm">{s.package_name || "—"}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm">{s.used_classes}/{s.total_classes}</span>
                    <span className="text-xs text-muted-foreground ml-1">({s.remaining_classes} left)</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">${s.total_paid}</TableCell>
                  <TableCell className="text-right text-sm">${s.price_per_class}</TableCell>
                  <TableCell>{paymentBadge(s.payment_status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {s.status === "lead" && (
                        <Button variant="outline" size="sm" onClick={() => handleConvertToStudent(s)} title="Convert to Student">
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAttendance(s.id)}
                        disabled={markingAttendance === s.id || s.remaining_classes <= 0}
                        title="Mark Attendance"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)} title="Edit">
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" title="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {s.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently remove this student and all their attendance records.</AlertDialogDescription>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
};

export default StudentManager;
