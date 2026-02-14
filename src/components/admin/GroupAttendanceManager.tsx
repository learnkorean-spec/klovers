import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Check, RefreshCw, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Group {
  id: string;
  name: string;
}

interface Session {
  id: string;
  group_id: string;
  session_date: string;
  created_at: string;
}

interface AttendanceRow {
  id: string;
  session_id: string;
  user_id: string;
  status: string;
  source: string;
  admin_approved: boolean;
  // joined
  student_name?: string;
  student_email?: string;
}

const STATUS_OPTIONS = ["present", "absent", "late", "excused"] as const;

const GroupAttendanceManager = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load groups
  useEffect(() => {
    supabase.from("student_groups").select("id, name").order("name").then(({ data }) => {
      if (data) setGroups(data);
    });
  }, []);

  // Load sessions when group changes
  useEffect(() => {
    if (!selectedGroup) { setSessions([]); return; }
    supabase
      .from("group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false })
      .then(({ data }) => {
        if (data) setSessions(data as Session[]);
      });
  }, [selectedGroup]);

  // Load attendance when session changes
  useEffect(() => {
    if (!selectedSession) { setAttendanceRows([]); return; }
    loadAttendance(selectedSession);
  }, [selectedSession]);

  const loadAttendance = async (sessionId: string) => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("group_attendance")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at");

    if (error || !rows) {
      toast({ title: "Error loading attendance", description: error?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Enrich with profile names
    const userIds = rows.map((r: any) => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string }> = {};
    (profiles || []).forEach((p: any) => { profileMap[p.user_id] = { name: p.name, email: p.email }; });

    setAttendanceRows(
      (rows as any[]).map((r) => ({
        ...r,
        student_name: profileMap[r.user_id]?.name || "Unknown",
        student_email: profileMap[r.user_id]?.email || "",
      }))
    );
    setLoading(false);
  };

  const createSession = async () => {
    if (!selectedGroup || !sessionDate) return;
    setCreating(true);

    // 1. Insert session
    const { data: session, error: sessionErr } = await supabase
      .from("group_sessions")
      .insert({ group_id: selectedGroup, session_date: sessionDate } as any)
      .select()
      .single();

    if (sessionErr) {
      toast({
        title: "Error",
        description: sessionErr.message.includes("duplicate")
          ? "Session already exists for this date"
          : sessionErr.message,
        variant: "destructive",
      });
      setCreating(false);
      return;
    }

    // 2. Find students in this group
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) { setCreating(false); return; }

    const { data: students } = await supabase
      .from("students")
      .select("email")
      .eq("group_name", group.name);

    if (students && students.length > 0) {
      // Map student emails to user_ids via profiles
      const emails = students.map((s: any) => s.email.toLowerCase());
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email");

      const matchedUserIds = (profiles || [])
        .filter((p: any) => emails.includes(p.email.toLowerCase()))
        .map((p: any) => p.user_id);

      if (matchedUserIds.length > 0) {
        const rows = matchedUserIds.map((uid: string) => ({
          session_id: (session as any).id,
          user_id: uid,
          status: "absent",
          source: "system",
          admin_approved: false,
        }));
        await supabase.from("group_attendance").insert(rows as any);
      }
    }

    toast({ title: "Session created" });
    // Refresh sessions list
    const { data: updatedSessions } = await supabase
      .from("group_sessions")
      .select("*")
      .eq("group_id", selectedGroup)
      .order("session_date", { ascending: false });
    if (updatedSessions) setSessions(updatedSessions as Session[]);
    setSelectedSession((session as any).id);
    setCreating(false);
  };

  const handleStatusChange = async (attId: string, newStatus: string) => {
    const { error } = await supabase
      .from("group_attendance")
      .update({ status: newStatus, source: "admin" } as any)
      .eq("id", attId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setAttendanceRows(prev =>
      prev.map(r => r.id === attId ? { ...r, status: newStatus, source: "admin" } : r)
    );
  };

  const handleApprove = async (attId: string) => {
    const { error } = await supabase.rpc("approve_group_attendance", {
      _attendance_id: attId,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Approved & class deducted" });
    setAttendanceRows(prev =>
      prev.map(r => r.id === attId ? { ...r, admin_approved: true, status: "present", source: "admin" } : r)
    );
  };

  return (
    <div className="space-y-4">
      {/* Session Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Group Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label>Group</Label>
              <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setSelectedSession(""); }}>
                <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={createSession} disabled={!selectedGroup || !sessionDate || creating}>
                <Plus className="h-4 w-4 mr-1" /> Create Session
              </Button>
            </div>
          </div>

          {/* Session Selector */}
          {sessions.length > 0 && (
            <div className="space-y-1">
              <Label>Session</Label>
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.session_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {selectedSession && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Attendance</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => loadAttendance(selectedSession)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Animated student avatars */}
            {!loading && attendanceRows.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-5">
                {attendanceRows.map((row, i) => (
                  <div
                    key={row.id + "-avatar"}
                    className="flex flex-col items-center gap-1 animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/30 transition-transform duration-200 hover:scale-110">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {(row.student_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground max-w-[56px] truncate text-center">
                      {row.student_name?.split(" ")[0] || "—"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : attendanceRows.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No students in this session.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Approved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{row.student_name}</p>
                            <p className="text-xs text-muted-foreground">{row.student_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.status}
                            onValueChange={(v) => handleStatusChange(row.id, v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{row.source}</Badge>
                        </TableCell>
                        <TableCell>
                          {row.admin_approved ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!row.admin_approved && row.status === "present" && (
                            <Button size="sm" onClick={() => handleApprove(row.id)}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}
                          {!row.admin_approved && row.status !== "present" && (
                            <span className="text-xs text-muted-foreground">Set present first</span>
                          )}
                          {row.admin_approved && (
                            <span className="text-xs text-muted-foreground">Done</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GroupAttendanceManager;
