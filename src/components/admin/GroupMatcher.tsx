import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays, Clock, Globe, Plus, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UnmatchedEnrollment {
  id: string;
  user_id: string;
  plan_type: string;
  preferred_days: string[] | null;
  preferred_start: string | null;
  preferred_time: string | null;
  timezone: string | null;
  duration: number;
  name?: string;
  email?: string;
}

interface Cluster {
  key: string;
  days: string[];
  start: string;
  members: UnmatchedEnrollment[];
}

const GroupMatcher = () => {
  const [enrollments, setEnrollments] = useState<UnmatchedEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const fetchUnmatched = async () => {
    setLoading(true);

    // Get approved group enrollments without a matched batch
    const { data: rawEnrollments, error } = await supabase
      .from("enrollments")
      .select("id, user_id, plan_type, preferred_days, preferred_start, preferred_time, timezone, duration")
      .eq("approval_status", "APPROVED")
      .eq("plan_type", "group")
      .is("matched_batch_id", null)
      .not("preferred_days", "is", null);

    if (error) {
      console.error("Failed to fetch unmatched enrollments:", error);
      setLoading(false);
      return;
    }

    // Get profile names
    const userIds = [...new Set((rawEnrollments as any[]).map((e: any) => e.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, email")
      .in("user_id", userIds);

    const profileMap: Record<string, { name: string; email: string }> = {};
    if (profiles) {
      (profiles as any[]).forEach((p: any) => {
        profileMap[p.user_id] = { name: p.name, email: p.email };
      });
    }

    const enriched: UnmatchedEnrollment[] = (rawEnrollments as any[])
      .filter((e: any) => e.preferred_days && e.preferred_days.length > 0 && e.preferred_start)
      .map((e: any) => ({
        ...e,
        name: profileMap[e.user_id]?.name || "Unknown",
        email: profileMap[e.user_id]?.email || "",
      }));

    setEnrollments(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnmatched();
  }, []);

  // Cluster by overlapping days + same preferred_start
  const clusters = useMemo(() => {
    const clusterMap: Record<string, UnmatchedEnrollment[]> = {};

    for (const enrollment of enrollments) {
      const days = enrollment.preferred_days || [];
      const start = enrollment.preferred_start || "";
      // Create a key from sorted days + start
      const dayKey = [...days].sort().join(",");
      const key = `${dayKey}|${start}`;

      if (!clusterMap[key]) clusterMap[key] = [];
      clusterMap[key].push(enrollment);
    }

    // Also try to find overlapping clusters (share at least 1 day + same start)
    const mergedClusters: Cluster[] = [];
    const processed = new Set<string>();

    const keys = Object.keys(clusterMap);
    for (let i = 0; i < keys.length; i++) {
      if (processed.has(keys[i])) continue;

      const [daysStr, start] = keys[i].split("|");
      const days = daysStr.split(",");
      let members = [...clusterMap[keys[i]]];

      // Merge with other clusters that share at least 1 day and same start
      for (let j = i + 1; j < keys.length; j++) {
        if (processed.has(keys[j])) continue;
        const [otherDaysStr, otherStart] = keys[j].split("|");
        if (otherStart !== start) continue;
        const otherDays = otherDaysStr.split(",");
        const overlap = days.some((d) => otherDays.includes(d));
        if (overlap) {
          members.push(...clusterMap[keys[j]]);
          processed.add(keys[j]);
          // Add unique days
          otherDays.forEach((d) => { if (!days.includes(d)) days.push(d); });
        }
      }

      processed.add(keys[i]);

      // Deduplicate members by enrollment id
      const seen = new Set<string>();
      members = members.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      mergedClusters.push({
        key: keys[i],
        days: days.sort(),
        start,
        members,
      });
    }

    // Sort: ready clusters (3+) first
    return mergedClusters.sort((a, b) => b.members.length - a.members.length);
  }, [enrollments]);

  const handleCreateGroup = async (cluster: Cluster) => {
    setCreating(cluster.key);
    try {
      const groupName = `${cluster.days.join("/")} – ${cluster.start} (Auto)`;

      // Create student_groups entry
      const { data: group, error: groupError } = await supabase
        .from("student_groups")
        .insert({
          name: groupName,
          schedule_day: cluster.days[0],
          course_type: "group",
          capacity: Math.max(cluster.members.length, 5),
          level: "",
        } as any)
        .select("id")
        .single();

      if (groupError || !group) {
        throw new Error(groupError?.message || "Failed to create group");
      }

      const groupId = (group as any).id;

      // Insert batch_members for each student
      const batchInserts = cluster.members.map((m) => ({
        batch_id: groupId,
        user_id: m.user_id,
        enrollment_id: m.id,
        member_status: "active",
      }));

      const { error: batchError } = await supabase
        .from("batch_members")
        .insert(batchInserts as any);

      if (batchError) {
        throw new Error(batchError.message);
      }

      // Update enrollments with matched_batch_id
      const enrollmentIds = cluster.members.map((m) => m.id);
      const { error: updateError } = await supabase
        .from("enrollments")
        .update({
          matched_batch_id: groupId,
          matched_at: new Date().toISOString(),
        } as any)
        .in("id", enrollmentIds);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Send group match emails to all members
      for (const member of cluster.members) {
        try {
          await supabase.functions.invoke("send-confirmation-email", {
            body: {
              email: member.email,
              name: member.name,
              template: "group_match",
              group_name: groupName,
              group_days: cluster.days.join(", "),
            },
          });
        } catch (emailErr) {
          console.error(`Failed to send group email to ${member.email}:`, emailErr);
        }
      }

      toast({ title: "Group created!", description: `"${groupName}" with ${cluster.members.length} students. Emails sent!` });
      fetchUnmatched();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCreating(null);
    }
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading unmatched enrollments...</p>;
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No unmatched group enrollments</p>
        <p className="text-sm mt-1">All approved group students have been matched or have no schedule preferences.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Group Matcher</h3>
          <p className="text-sm text-muted-foreground">
            {enrollments.length} unmatched student{enrollments.length !== 1 ? "s" : ""} with schedule preferences
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUnmatched}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {clusters.map((cluster) => {
          const isReady = cluster.members.length >= 3;
          return (
            <Card key={cluster.key} className={isReady ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {cluster.days.join(", ")}
                    </CardTitle>
                    <Badge variant={isReady ? "default" : "secondary"}>
                      {cluster.start}
                    </Badge>
                  </div>
                  <Badge variant={isReady ? "default" : "outline"} className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {cluster.members.length} student{cluster.members.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {cluster.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                      <div>
                        <p className="font-medium text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {m.preferred_time || "—"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {m.timezone?.replace(/_/g, " ") || "—"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {m.duration}mo
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {isReady && (
                  <Button
                    className="w-full"
                    onClick={() => handleCreateGroup(cluster)}
                    disabled={creating === cluster.key}
                  >
                    {creating === cluster.key ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                    ) : (
                      <><Plus className="h-4 w-4 mr-2" /> Create Group ({cluster.members.length} students)</>
                    )}
                  </Button>
                )}
                {!isReady && (
                  <p className="text-xs text-muted-foreground text-center">
                    Need {3 - cluster.members.length} more student{3 - cluster.members.length !== 1 ? "s" : ""} to form a group
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GroupMatcher;
