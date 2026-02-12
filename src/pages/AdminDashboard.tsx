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
import { LogOut, Search, Download, Trash2, Check, X, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Lead {
  id: string; name: string; email: string; country: string; level: string; goal: string; status: string; created_at: string;
}

interface Enrollment {
  id: string; user_id: string; plan_type: string; duration: number; classes_included: number;
  amount: number; unit_price: number; tx_ref: string; receipt_url: string; status: string;
  payment_status: string; approval_status: string; payment_provider: string | null;
  admin_review_required: boolean;
  created_at: string; profiles?: { name: string; email: string } | null;
}

interface AttendanceReq {
  id: string; user_id: string; request_date: string; status: string; created_at: string;
  profiles?: { name: string; email: string; credits: number } | null;
}

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "lost"];

const AdminDashboard = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceReqs, setAttendanceReqs] = useState<AttendanceReq[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [editingUnitPrice, setEditingUnitPrice] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const fetchAll = async () => {
    const [leadsRes, enrollRes, attendRes, profilesRes] = await Promise.all([
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, name, email, credits"),
    ]);

    const profileMap: Record<string, { name: string; email: string; credits: number }> = {};
    if (profilesRes.data) {
      (profilesRes.data as any[]).forEach((p) => { profileMap[p.user_id] = p; });
    }

    if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
    if (enrollRes.data) setEnrollments((enrollRes.data as any[]).map((e) => ({ ...e, profiles: profileMap[e.user_id] || null })));
    if (attendRes.data) setAttendanceReqs((attendRes.data as any[]).map((a) => ({ ...a, profiles: profileMap[a.user_id] || null })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Leads ---
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
    const headers = ["Name", "Email", "Country", "Level", "Goal", "Status", "Date"];
    const rows = filtered.map((l) => [l.name, l.email, l.country, l.level, l.goal, l.status, new Date(l.created_at).toLocaleDateString()]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // --- Enrollments ---
  const handleEnrollmentAction = async (enrollment: Enrollment, action: "APPROVED" | "REJECTED") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const updates: any = {
      status: action,
      approval_status: action,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
    };

    if (action === "APPROVED" && enrollment.payment_provider === "manual") {
      updates.payment_status = "PAID";
    }
    if (action === "REJECTED") {
      updates.payment_status = "UNPAID";
    }

    // Validate and apply edited unit_price
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
    }

    toast({ title: `Enrollment ${action.toLowerCase()}` });
    fetchAll();
  };

  // --- Attendance ---
  const handleAttendanceAction = async (req: AttendanceReq, action: "APPROVED" | "REJECTED") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("attendance_requests").update({
      status: action, reviewed_at: new Date().toISOString(), reviewed_by: session.user.id,
    } as any).eq("id", req.id);

    if (error) { toast({ title: "Error", description: "Failed to update.", variant: "destructive" }); return; }

    if (action === "APPROVED") {
      // Deduct credit atomically via RPC
      const { error: creditError } = await supabase.rpc("deduct_credit", {
        _user_id: req.user_id,
      });
      if (creditError) {
        toast({ title: "Error", description: "Insufficient credits or failed to deduct.", variant: "destructive" });
        return;
      }
    }

    toast({ title: `Attendance ${action.toLowerCase()}` });
    fetchAll();
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>

        <Tabs defaultValue="enrollments">
          <TabsList>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
          </TabsList>

          <TabsContent value="enrollments" className="space-y-4">
            {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> : (
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">Pending Review</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                {(["pending", "approved", "rejected"] as const).map((tab) => {
                  const filtered = enrollments.filter((e) => {
                    if (tab === "pending") return e.admin_review_required && e.approval_status === "PENDING";
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
                                  {e.plan_type} · {e.duration}mo · {e.classes_included} classes · ${e.amount} · Ref: {e.tx_ref}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (e.receipt_url.startsWith("stripe:")) {
                                      toast({ title: "Stripe receipt", description: "This enrollment was paid via Stripe." });
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
                                {e.approval_status === "PENDING" && e.admin_review_required && (
                                  <>
                                    <Button size="sm" onClick={() => handleEnrollmentAction(e, "APPROVED")}>
                                      <Check className="h-4 w-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleEnrollmentAction(e, "REJECTED")}>
                                      <X className="h-4 w-4 mr-1" /> Reject
                                    </Button>
                                  </>
                                )}
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
          </TabsContent>

          {/* ATTENDANCE TAB */}
          <TabsContent value="attendance" className="space-y-4">
            {attendanceReqs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No attendance requests.</p>
            ) : (
              attendanceReqs.map((a) => (
                <Card key={a.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{(a as any).profiles?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">Date: {a.request_date} · Credits: {(a as any).profiles?.credits ?? 0}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                          {a.status}
                        </Badge>
                        {a.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => handleAttendanceAction(a, "APPROVED")}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleAttendanceAction(a, "REJECTED")}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* LEADS TAB */}
          <TabsContent value="leads" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
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
              <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
            </div>

            {loading ? (
              <p className="text-muted-foreground text-center py-12">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No leads found.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Country</TableHead>
                      <TableHead className="hidden md:table-cell">Level</TableHead>
                      <TableHead className="hidden lg:table-cell">Goal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.email}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.country}</TableCell>
                        <TableCell className="hidden md:table-cell">{lead.level}</TableCell>
                        <TableCell className="hidden lg:table-cell">{lead.goal}</TableCell>
                        <TableCell>
                          <Select value={lead.status} onValueChange={(v) => handleStatusChange(lead.id, v)}>
                            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
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
            )}
            <p className="text-xs text-muted-foreground text-center">{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
