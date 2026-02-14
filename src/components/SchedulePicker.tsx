import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Clock, Users, MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

interface SlotGroup {
  id: string;
  name: string;
  schedule_day: string | null;
  schedule_time: string | null;
  schedule_timezone: string | null;
  level: string | null;
  course_type: string | null;
  capacity: number;
  seats_left: number;
}

interface SchedulePickerProps {
  courseType: "group" | "private";
  userTimezone: string;
  onSelect: (groupId: string, groupName: string) => void;
  selectedGroupId?: string | null;
}

const DAY_ORDER: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  Friday: 5, Saturday: 6, Sunday: 7,
};

function timeDiffMinutes(time: string, target: string): number {
  const [h1, m1] = time.split(":").map(Number);
  const [h2, m2] = target.split(":").map(Number);
  return Math.abs((h1 * 60 + (m1 || 0)) - (h2 * 60 + (m2 || 0)));
}

const SchedulePicker = ({ courseType, userTimezone, onSelect, selectedGroupId }: SchedulePickerProps) => {
  const [slots, setSlots] = useState<SlotGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [clickedFullSlot, setClickedFullSlot] = useState<SlotGroup | null>(null);
  const [confirmed, setConfirmed] = useState<SlotGroup | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);

      // Fetch groups matching course_type with scheduling info
      const { data: groups, error } = await supabase
        .from("student_groups")
        .select("id, name, schedule_day, schedule_time, schedule_timezone, level, course_type, capacity")
        .eq("course_type", courseType);

      if (error || !groups) {
        console.error("Failed to fetch groups:", error);
        setSlots([]);
        setLoading(false);
        return;
      }

      // Count members per group from group_attendance (distinct users)
      const groupIds = groups.map((g: any) => g.id);
      
      // Get batch_members count per batch (batch_id = group concept)
      const { data: memberCounts } = await supabase
        .from("batch_members")
        .select("batch_id")
        .in("batch_id", groupIds);

      const countMap: Record<string, number> = {};
      if (memberCounts) {
        for (const m of memberCounts as any[]) {
          countMap[m.batch_id] = (countMap[m.batch_id] || 0) + 1;
        }
      }

      const enriched: SlotGroup[] = (groups as any[])
        .filter((g) => g.schedule_day && g.schedule_time)
        .map((g) => ({
          ...g,
          seats_left: Math.max(0, (g.capacity || 10) - (countMap[g.id] || 0)),
        }));

      setSlots(enriched);
      setLoading(false);

      // Restore confirmed state if selectedGroupId is set
      if (selectedGroupId) {
        const found = enriched.find((s) => s.id === selectedGroupId);
        if (found) setConfirmed(found);
      }
    };
    fetchSlots();
  }, [courseType, selectedGroupId]);

  const alternatives = useMemo(() => {
    if (!clickedFullSlot) return [];
    return slots
      .filter((s) => s.seats_left > 0 && s.level === clickedFullSlot.level && s.id !== clickedFullSlot.id)
      .sort((a, b) => {
        // Same timezone first
        const aTz = a.schedule_timezone === userTimezone ? 0 : 1;
        const bTz = b.schedule_timezone === userTimezone ? 0 : 1;
        if (aTz !== bTz) return aTz - bTz;
        // Closest time to 18:00
        const aDiff = timeDiffMinutes(a.schedule_time || "18:00", "18:00");
        const bDiff = timeDiffMinutes(b.schedule_time || "18:00", "18:00");
        if (aDiff !== bDiff) return aDiff - bDiff;
        // Earliest day
        return (DAY_ORDER[a.schedule_day || "Monday"] || 7) - (DAY_ORDER[b.schedule_day || "Monday"] || 7);
      })
      .slice(0, 6);
  }, [clickedFullSlot, slots, userTimezone]);

  const handleSlotClick = (slot: SlotGroup) => {
    if (slot.seats_left === 0) {
      setClickedFullSlot(slot);
      setShowAlternatives(true);
      return;
    }
    selectSlot(slot, false);
  };

  const selectSlot = async (slot: SlotGroup, isAlternative: boolean) => {
    setConfirmed(slot);
    setShowAlternatives(false);
    onSelect(slot.id, slot.name);

    // Upsert schedule preference
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from("student_schedule_preferences" as any)
        .upsert({
          user_id: session.user.id,
          group_id: slot.id,
          level: slot.level || "",
        } as any, { onConflict: "user_id" });

      // If alternative, notify admin
      if (isAlternative) {
        const userName = session.user.user_metadata?.name || session.user.email || "A student";
        await supabase.from("admin_notifications" as any).insert({
          message: `${userName} chose alternative slot "${slot.name}" (${slot.schedule_day} ${slot.schedule_time} ${slot.schedule_timezone})`,
          type: "alternative_slot",
          related_user_id: session.user.id,
          related_group_id: slot.id,
        } as any);
      }
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

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No schedule slots available for {courseType} classes right now.</p>
        <p className="text-sm mt-1">Please check back later or contact support.</p>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="bg-accent rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Selected: {confirmed.name}</p>
          <p className="text-sm text-muted-foreground">
            {confirmed.schedule_day} · {confirmed.schedule_time} · {confirmed.schedule_timezone}
          </p>
          <p className="text-xs text-muted-foreground">Pending payment approval</p>
          <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs" onClick={() => { setConfirmed(null); onSelect("", ""); }}>
            Change slot
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Pick your preferred class slot:</p>
      
      <div className="grid gap-3">
        {slots.map((slot) => (
          <button
            key={slot.id}
            type="button"
            onClick={() => handleSlotClick(slot)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              slot.seats_left === 0
                ? "border-border opacity-60 hover:border-destructive/50"
                : "border-border hover:border-primary hover:bg-accent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{slot.name}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {slot.schedule_day} · {slot.schedule_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {slot.schedule_timezone?.replace(/_/g, " ")}
                  </span>
                </div>
                {slot.level && <Badge variant="outline" className="text-xs">{slot.level}</Badge>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={slot.seats_left > 3 ? "secondary" : slot.seats_left > 0 ? "default" : "destructive"}>
                  <Users className="h-3 w-3 mr-1" />
                  {slot.seats_left > 0 ? `${slot.seats_left} seats` : "Full"}
                </Badge>
              </div>
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
              "{clickedFullSlot?.name}" is currently full. Choose an alternative slot below:
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
                  onClick={() => selectSlot(alt, true)}
                  className="w-full text-left p-3 rounded-lg border-2 border-border hover:border-primary hover:bg-accent transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{alt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alt.schedule_day} · {alt.schedule_time} · {alt.schedule_timezone?.replace(/_/g, " ")}
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
