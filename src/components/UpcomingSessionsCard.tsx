import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Loader2 } from "lucide-react";

interface UpcomingSession {
  session_id: string;
  session_date: string;
  group_name: string;
  start_time: string;
  duration_min: number;
  timezone: string;
  level: string;
  attendance_status: string | null;
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string) {
  const date = new Date(d + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function daysUntil(d: string) {
  const diff = Math.ceil((new Date(d + "T12:00:00").getTime() - Date.now()) / 86400000);
  return diff;
}

const UpcomingSessionsCard = () => {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const { data, error } = await (supabase as any).rpc("get_student_upcoming_sessions", {
        p_user_id: session.user.id,
      });

      if (!error && data) setSessions(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) return null;

  const next = sessions[0];
  const days = daysUntil(next.session_date);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Upcoming Classes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Next class highlight */}
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Next Class</p>
              <p className="font-bold text-foreground text-lg">{formatDate(next.session_date)}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(next.start_time)} · {next.duration_min} min · {next.timezone}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{next.group_name} · {next.level}</p>
            </div>
            <Badge className={days === 0 ? "bg-green-500" : days === 1 ? "bg-yellow-500" : "bg-primary"}>
              {days === 0 ? "Today!" : days === 1 ? "Tomorrow" : `In ${days} days`}
            </Badge>
          </div>
        </div>

        {/* Remaining sessions */}
        {sessions.slice(1).map(s => (
          <div key={s.session_id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent/30 transition-colors">
            <div>
              <p className="text-sm font-medium text-foreground">{formatDate(s.session_date)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(s.start_time)} · {s.group_name}</p>
            </div>
            <span className="text-xs text-muted-foreground">In {daysUntil(s.session_date)}d</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingSessionsCard;
