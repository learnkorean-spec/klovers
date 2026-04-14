import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CalendarDays, ArrowLeft } from "lucide-react";
import { DAY_NAMES, DAY_ABBREV_TO_INDEX, formatTime12h } from "@/lib/calendarUrl";

interface TrialSlot {
  day_of_week: number;
  start_time: string;
  booked_count: number;
}

interface TrialSlotPickerProps {
  selectedDays: string[]; // ["Mon", "Tue", "Thu"]
  onSelect: (dayOfWeek: number, startTime: string) => void;
  onBack: () => void;
}

const MAX_TRIALS_PER_SLOT = 3;

const TrialSlotPicker = ({ selectedDays, onSelect, onBack }: TrialSlotPickerProps) => {
  const [slots, setSlots] = useState<TrialSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ day: number; time: string } | null>(null);

  const dayIndices = selectedDays.map((d) => DAY_ABBREV_TO_INDEX[d]).filter((v) => v !== undefined);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc("get_trial_availability");
        if (rpcError) throw rpcError;
        // Filter to only the days the student selected
        const filtered = (data || []).filter((s: TrialSlot) => dayIndices.includes(s.day_of_week));
        setSlots(filtered);
      } catch (err: any) {
        console.error("Failed to fetch trial slots:", err);
        setError("Could not load available times. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedDays.join(",")]);

  const availableSlots = slots.filter((s) => s.booked_count < MAX_TRIALS_PER_SLOT);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Go back
        </Button>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-8 space-y-3">
        <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No available slots on your selected days. Please go back and try different days.
        </p>
        <Button variant="outline" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Choose different days
        </Button>
      </div>
    );
  }

  // Group by day
  const byDay: Record<number, TrialSlot[]> = {};
  availableSlots.forEach((s) => {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = [];
    byDay[s.day_of_week].push(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-sm text-muted-foreground">Pick a time for your free class</p>
      </div>

      {Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([dayStr, daySlots]) => {
          const day = Number(dayStr);
          return (
            <div key={day}>
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {DAY_NAMES[day]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {daySlots
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((slot) => {
                    const isSelected = selected?.day === day && selected?.time === slot.start_time;
                    const spotsLeft = MAX_TRIALS_PER_SLOT - Number(slot.booked_count);
                    return (
                      <button
                        key={`${day}-${slot.start_time}`}
                        type="button"
                        onClick={() => setSelected({ day, time: slot.start_time })}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-sm transition-all hover:border-primary/60 ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border bg-card hover:bg-accent/50"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime12h(slot.start_time)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}

      <p className="text-xs text-muted-foreground text-center">
        All times are in Cairo time (GMT+2)
      </p>

      <Button
        type="button"
        size="lg"
        className="w-full gap-2 text-base font-bold h-13 mt-2"
        disabled={!selected}
        onClick={() => selected && onSelect(selected.day, selected.time)}
      >
        {selected
          ? `Book ${DAY_NAMES[selected.day]} at ${formatTime12h(selected.time)}`
          : "Select a time slot"}
      </Button>
    </div>
  );
};

export default TrialSlotPicker;
