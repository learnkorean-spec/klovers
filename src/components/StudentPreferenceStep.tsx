import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface StudentPreferenceStepProps {
  onBack: () => void;
  onNext: (preferredDay: number, preferredTime: string) => void;
  loading: boolean;
  userLevel?: string;
}

const StudentPreferenceStep = ({
  onBack,
  onNext,
  loading,
  userLevel,
}: StudentPreferenceStepProps) => {
  const [availableTimes, setAvailableTimes] = useState<{ day: number; dayName: string; time: string }[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(true);
  const [preferredDay, setPreferredDay] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchAvailableTimes();
  }, []);

  const fetchAvailableTimes = async () => {
    try {
      setLoadingTimes(true);
      // Get all available teacher times
      const { data, error } = await supabase
        .from("teacher_availability")
        .select("day_of_week, start_time")
        .eq("is_available", true)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;

      const times = (data || []).map((slot: any) => ({
        day: slot.day_of_week,
        dayName: DAYS[slot.day_of_week],
        time: slot.start_time,
      }));

      setAvailableTimes(times);

      // Auto-select first if available
      if (times.length > 0) {
        setPreferredDay(times[0].day.toString());
      }
    } catch (error) {
      console.error("Error fetching available times:", error);
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive",
      });
    } finally {
      setLoadingTimes(false);
    }
  };

  // Filter available times for the selected day
  const timesForDay = availableTimes.filter(
    (t) => t.day.toString() === preferredDay
  );

  const handleNext = () => {
    setFormError("");

    if (!preferredDay) {
      setFormError("Please select a day");
      return;
    }

    if (!preferredTime) {
      setFormError("Please select a time");
      return;
    }

    onNext(parseInt(preferredDay), preferredTime);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Preferred Schedule
          </CardTitle>
          <CardDescription>
            Tell us when you'd like to attend classes. This helps us create schedules based on student demand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Day Selection */}
          <div className="space-y-3">
            <Label className="font-semibold">Which day do you prefer?</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DAYS.map((day, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={preferredDay === idx.toString() ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    setPreferredDay(idx.toString());
                    setPreferredTime(""); // Reset time when day changes
                  }}
                  disabled={loadingTimes}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {loadingTimes ? (
            <div className="text-center text-muted-foreground py-4">Loading available times...</div>
          ) : timesForDay.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                No times available for {DAYS[parseInt(preferredDay)]} yet. Please choose another day.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="time-select" className="font-semibold">
                What time works best?
              </Label>
              <Select value={preferredTime} onValueChange={setPreferredTime}>
                <SelectTrigger id="time-select">
                  <SelectValue placeholder="Select a time..." />
                </SelectTrigger>
                <SelectContent>
                  {timesForDay.map((slot) => (
                    <SelectItem key={slot.time} value={slot.time}>
                      {slot.time} ({parseInt(slot.time) >= 12 ? "PM" : "AM"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error message */}
          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
            <p className="font-semibold mb-1">Why we're asking:</p>
            <p>
              Your preference helps us understand which time slots are most in demand. If your preferred time isn't available yet, we may create it based on student requests!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          disabled={loading || loadingTimes || !preferredDay || !preferredTime}
          className="gap-2"
        >
          Continue to Payment
        </Button>
      </div>
    </div>
  );
};

export default StudentPreferenceStep;
