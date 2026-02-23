import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Clock, Users, CheckCircle2, AlertTriangle } from "lucide-react";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface SchedulePackage {
  id: string;
  level: string;
  day_of_week: number;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  is_active: boolean;
  seats_left: number;
}

interface SchedulePickerProps {
  courseType: "group" | "private";
  userTimezone: string;
  onSelect: (packageId: string, label: string) => void;
  selectedGroupId?: string | null;
  selectedLevel?: string;
}

function formatTime(t: string) {
  // t is "HH:MM:SS" or "HH:MM"
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function timeDiffMinutes(timeStr: string, targetHour: number): number {
  const [h, m] = timeStr.split(":").map(Number);
  return Math.abs((h * 60 + (m || 0)) - targetHour * 60);
}

const SchedulePicker = ({
  courseType,
  userTimezone,
  onSelect,
  selectedGroupId,
  selectedLevel,
}: SchedulePickerProps) => {
  const [packages, setPackages] = useState<SchedulePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState<SchedulePackage | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [clickedFull, setClickedFull] = useState<SchedulePackage | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);

      // Build query for schedule_packages filtered by level
      let query = (supabase as any)
        .from("schedule_packages")
        .select("*")
        .eq("is_active", true);

      if (selectedLevel) {
        query = query.eq("level", selectedLevel);
      }

      const { data: pkgs, error } = await query;

      if (error || !pkgs) {
        console.error("Failed to fetch schedule_packages:", error);
        setPackages([]);
        setLoading(false);
        return;
      }

      // Count active members per package (via pkg_groups → pkg_group_members)
      const pkgIds = (pkgs as any[]).map((p: any) => p.id);

      // Get groups for these packages
      const { data: groups } = await (supabase as any)
        .from("pkg_groups")
        .select("id, package_id, capacity")
        .in("package_id", pkgIds);

      const groupList = (groups as any[]) || [];
      const groupIds = groupList.map((g: any) => g.id);

      // Count active members per group
      let memberCounts: Record<string, number> = {};
      if (groupIds.length > 0) {
        const { data: members } = await (supabase as any)
          .from("pkg_group_members")
          .select("group_id")
          .in("group_id", groupIds)
          .eq("member_status", "active");

        for (const m of (members as any[]) || []) {
          memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
        }
      }

      // Compute seats_left per package: capacity - total active members across all its groups
      const pkgMemberCount: Record<string, number> = {};
      for (const g of groupList) {
        pkgMemberCount[g.package_id] = (pkgMemberCount[g.package_id] || 0) + (memberCounts[g.id] || 0);
      }

      const enriched: SchedulePackage[] = (pkgs as any[]).map((p: any) => ({
        ...p,
        seats_left: Math.max(0, (p.capacity || 5) - (pkgMemberCount[p.id] || 0)),
      }));

      // Sort by day_of_week then time
      enriched.sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
        return a.start_time.localeCompare(b.start_time);
      });

      setPackages(enriched);
      setLoading(false);

      // Restore confirmed state
      if (selectedGroupId) {
        const found = enriched.find((p) => p.id === selectedGroupId);
        if (found) setConfirmed(found);
      }
    };
    fetch();
  }, [selectedLevel, selectedGroupId]);

  const alternatives = useMemo(() => {
    if (!clickedFull) return [];
    return packages
      .filter((p) => p.seats_left > 0 && p.level === clickedFull.level && p.id !== clickedFull.id)
      .sort((a, b) => {
        const aTz = a.timezone === userTimezone ? 0 : 1;
        const bTz = b.timezone === userTimezone ? 0 : 1;
        if (aTz !== bTz) return aTz - bTz;
        return timeDiffMinutes(a.start_time, 18) - timeDiffMinutes(b.start_time, 18);
      })
      .slice(0, 6);
  }, [clickedFull, packages, userTimezone]);

  const handleClick = (pkg: SchedulePackage) => {
    if (pkg.seats_left === 0) {
      setClickedFull(pkg);
      setShowAlternatives(true);
      return;
    }
    selectPackage(pkg, false);
  };

  const selectPackage = async (pkg: SchedulePackage, isAlternative: boolean) => {
    setConfirmed(pkg);
    setShowAlternatives(false);
    const label = `${DAY_NAMES[pkg.day_of_week]} · ${formatTime(pkg.start_time)} · ${pkg.duration_min}min · ${pkg.timezone}`;
    onSelect(pkg.id, label);

    const scheduleFields = {
      level: pkg.level || "",
      package_id: pkg.id,
      preferred_day: DAY_NAMES[pkg.day_of_week],
      preferred_time: formatTime(pkg.start_time),
      timezone: pkg.timezone,
    };

    // Persist preference and trigger group assignment
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Assign to group via unified RPC
      await (supabase as any).rpc("assign_student_to_group", {
        _package_id: pkg.id,
        _user_id: session.user.id,
      });

      await (supabase as any)
        .from("student_package_preferences")
        .upsert({
          user_id: session.user.id,
          level: pkg.level || "",
          package_id: pkg.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      // Also update the user's latest PENDING enrollment with schedule data
      const { data: pendingEnrollments } = await (supabase as any)
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .in("status", ["PENDING", "PENDING_PAYMENT"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (pendingEnrollments && pendingEnrollments.length > 0) {
        await (supabase as any)
          .from("enrollments")
          .update(scheduleFields)
          .eq("id", pendingEnrollments[0].id);
      }

      if (isAlternative) {
        const userName = session.user.user_metadata?.name || session.user.email || "A student";
        await (supabase as any).from("admin_notifications").insert({
          message: `${userName} chose alternative schedule package (${DAY_NAMES[pkg.day_of_week]} ${formatTime(pkg.start_time)} ${pkg.timezone})`,
          type: "alternative_slot",
          related_user_id: session.user.id,
        });
      }
    } else {
      // Not logged in — persist to localStorage draft for post-login sync
      try {
        const raw = localStorage.getItem("enroll_draft");
        const draft = raw ? JSON.parse(raw) : {};
        Object.assign(draft, scheduleFields, { packageId: pkg.id, days: DAY_NAMES[pkg.day_of_week] });
        localStorage.setItem("enroll_draft", JSON.stringify(draft));
      } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No schedule slots available{selectedLevel ? ` for ${selectedLevel}` : ""} right now.</p>
        <p className="text-sm mt-1">Please check back later or contact support.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="bg-accent rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            {DAY_NAMES[confirmed.day_of_week]} · {formatTime(confirmed.start_time)}
          </p>
          <p className="text-sm text-muted-foreground">
            {confirmed.duration_min} min · {confirmed.timezone.replace(/_/g, " ")}
          </p>
          <p className="text-xs text-muted-foreground">Pending payment approval</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 h-7 text-xs"
            onClick={() => { setConfirmed(null); onSelect("", ""); }}
          >
            Change slot
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Pick your preferred class slot (1 day · 90 min · 18:00 Cairo default):</p>

      <div className="grid gap-3">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => handleClick(pkg)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              pkg.seats_left === 0
                ? "border-border opacity-60 hover:border-destructive/50"
                : "border-border hover:border-primary hover:bg-accent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">
                  {DAY_NAMES[pkg.day_of_week]}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(pkg.start_time)} · {pkg.duration_min}min
                  </span>
                  <span className="text-xs">{pkg.timezone.replace(/_/g, " ")}</span>
                </div>
                {pkg.level && (
                  <Badge variant="outline" className="text-xs">{pkg.level}</Badge>
                )}
              </div>
              <Badge
                variant={
                  pkg.seats_left > 3 ? "secondary"
                  : pkg.seats_left > 0 ? "default"
                  : "destructive"
                }
              >
                <Users className="h-3 w-3 mr-1" />
                {pkg.seats_left > 0 ? `${pkg.seats_left} seats` : "Full"}
              </Badge>
            </div>
          </button>
        ))}
      </div>

      {/* Alternatives Dialog */}
      <Dialog open={showAlternatives} onOpenChange={setShowAlternatives}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Slot Full
            </DialogTitle>
            <DialogDescription>
              {clickedFull && (
                <>"{DAY_NAMES[clickedFull.day_of_week]} {formatTime(clickedFull.start_time)}" is full. Choose an alternative:</>
              )}
            </DialogDescription>
          </DialogHeader>

          {alternatives.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No alternative slots available at the same level. Please contact support.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => selectPackage(alt, true)}
                  className="w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {DAY_NAMES[alt.day_of_week]} · {formatTime(alt.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {alt.duration_min}min · {alt.timezone.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" /> {alt.seats_left} seats
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulePicker;
