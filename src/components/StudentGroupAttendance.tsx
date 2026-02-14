import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface SessionRow {
  attendance_id: string;
  session_id: string;
  session_date: string;
  group_name: string;
  status: string;
  source: string;
  admin_approved: boolean;
}

const StudentGroupAttendance = () => {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get all attendance records for this user
    const { data: attendance, error } = await supabase
      .from("group_attendance")
      .select("id, session_id, status, source, admin_approved")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error || !attendance || attendance.length === 0) {
      setLoading(false);
      return;
    }

    // Get session details
    const sessionIds = [...new Set((attendance as any[]).map(a => a.session_id))];
    const { data: sessions } = await supabase
      .from("group_sessions")
      .select("id, session_date, group_id")
      .in("id", sessionIds);

    // Get group names
    const groupIds = [...new Set((sessions || []).map((s: any) => s.group_id))];
    const { data: groups } = await supabase
      .from("student_groups")
      .select("id, name")
      .in("id", groupIds);

    const sessionMap: Record<string, { session_date: string; group_id: string }> = {};
    (sessions || []).forEach((s: any) => { sessionMap[s.id] = s; });
    const groupMap: Record<string, string> = {};
    (groups || []).forEach((g: any) => { groupMap[g.id] = g.name; });

    const result: SessionRow[] = (attendance as any[]).map(a => {
      const sess = sessionMap[a.session_id];
      return {
        attendance_id: a.id,
        session_id: a.session_id,
        session_date: sess?.session_date || "",
        group_name: sess ? (groupMap[sess.group_id] || "") : "",
        status: a.status,
        source: a.source,
        admin_approved: a.admin_approved,
      };
    });

    setRows(result.sort((a, b) => b.session_date.localeCompare(a.session_date)));
    setLoading(false);
  };

  const markPresent = async (attendanceId: string) => {
    const { error } = await supabase
      .from("group_attendance")
      .update({ status: "present", source: "student" } as any)
      .eq("id", attendanceId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Marked as present", description: "Waiting for admin approval" });
    setRows(prev =>
      prev.map(r => r.attendance_id === attendanceId ? { ...r, status: "present", source: "student" } : r)
    );
  };

  if (loading) return null;
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Group Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.attendance_id}>
                  <TableCell className="font-medium">{r.session_date}</TableCell>
                  <TableCell>{r.group_name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      r.status === "present" ? "default"
                      : r.status === "late" ? "secondary"
                      : r.status === "excused" ? "outline"
                      : "destructive"
                    }>
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.admin_approved ? (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {!r.admin_approved && r.status !== "present" ? (
                      <Button size="sm" variant="outline" onClick={() => markPresent(r.attendance_id)}>
                        Mark Present
                      </Button>
                    ) : r.status === "present" && !r.admin_approved ? (
                      <span className="text-xs text-muted-foreground">Awaiting approval</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentGroupAttendance;
