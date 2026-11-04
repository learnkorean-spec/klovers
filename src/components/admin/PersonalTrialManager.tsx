/**
 * Personal Trial Lessons — availability + bookings for Reham's own 1:1
 * lessons (Hungarian, Arabic-for-foreigners, English).
 *
 * Separate from the Korean trial system (TrialClassesManager / trial_slots):
 * that one manages weekly recurring slots across multiple teachers and
 * group cohorts. This is one teacher offering specific dated time slots —
 * add a slot for "Tue 23 Dec, 5:00 PM", students book it, it's gone. Shared
 * across all three personal-teacher languages because it's the same
 * teacher's calendar either way (personal_trial_slots has no language
 * column — language lives on the booking, not the slot).
 *
 * personal_trial_slots / personal_trial_bookings have admin-only RLS in
 * both directions, so this reads/writes them directly as the signed-in
 * admin — no edge function needed here (that's only for the public side).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react";

interface SlotRow {
  id: string;
  slot_date: string;
  start_time: string;
  duration_min: number;
  timezone: string;
  capacity: number;
  is_active: boolean;
}

interface BookingRow {
  id: string;
  slot_id: string;
  language: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

const LANGUAGE_LABEL: Record<string, string> = {
  hungarian: "Hungarian",
  arabic: "Arabic",
  english: "English",
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const PersonalTrialManager = () => {
  const { toast } = useToast();

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [newCapacity, setNewCapacity] = useState("1");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [slotsRes, bookingsRes] = await Promise.all([
        supabase
          .from("personal_trial_slots")
          .select("id, slot_date, start_time, duration_min, timezone, capacity, is_active")
          .gte("slot_date", today)
          .order("slot_date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("personal_trial_bookings")
          .select("id, slot_id, language, name, email, whatsapp, notes, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);
      if (slotsRes.error) throw slotsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      setSlots((slotsRes.data ?? []) as SlotRow[]);
      setBookings((bookingsRes.data ?? []) as BookingRow[]);
    } catch (err) {
      toast({
        title: "Couldn't load personal trial lessons",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const bookedCountFor = (slotId: string) =>
    bookings.filter((b) => b.slot_id === slotId && b.status === "confirmed").length;

  const addSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !/^\d{1,2}:\d{2}$/.test(newTime)) {
      toast({ title: "Pick a date and a time like 17:00", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("personal_trial_slots").insert({
        slot_date: newDate,
        start_time: newTime.length === 4 ? `0${newTime}` : newTime,
        duration_min: Number(newDuration) || 30,
        capacity: Number(newCapacity) || 1,
      });
      if (error) throw error;
      toast({ title: "Slot added", description: `${newDate} at ${newTime}` });
      setNewDate("");
      setNewTime("");
      await load();
    } catch (err) {
      toast({
        title: "Couldn't add that slot",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slot: SlotRow) => {
    setBusyId(slot.id);
    try {
      const { error } = await supabase
        .from("personal_trial_slots")
        .update({ is_active: !slot.is_active })
        .eq("id", slot.id);
      if (error) throw error;
      await load();
    } catch (err) {
      toast({
        title: "Couldn't change that slot",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  const removeSlot = async (slot: SlotRow) => {
    setBusyId(slot.id);
    try {
      const { error } = await supabase.from("personal_trial_slots").delete().eq("id", slot.id);
      if (error) throw error;
      toast({ title: "Slot removed" });
      await load();
    } catch (err) {
      toast({
        title: "Couldn't remove that slot",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="h-4 w-4" />
            Personal trial lessons — Hungarian, Arabic, English
          </CardTitle>
          <CardDescription className="text-xs">
            One shared calendar for your own 1:1 lessons. Add specific dated time slots below; students pick one
            on the landing pages, or message you on WhatsApp if nothing matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={addSlot} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <Label htmlFor="pts-date" className="mb-1 block text-[11px] text-muted-foreground">
                  Date
                </Label>
                <Input id="pts-date" type="date" className="h-9 w-40" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pts-time" className="mb-1 block text-[11px] text-muted-foreground">
                  Start time
                </Label>
                <Input id="pts-time" className="h-9 w-28" placeholder="17:00" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pts-duration" className="mb-1 block text-[11px] text-muted-foreground">
                  Duration (min)
                </Label>
                <Input id="pts-duration" type="number" className="h-9 w-24" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pts-capacity" className="mb-1 block text-[11px] text-muted-foreground">
                  Capacity
                </Label>
                <Input id="pts-capacity" type="number" className="h-9 w-20" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} />
              </div>
              <Button type="submit" size="sm" className="h-9" disabled={saving}>
                {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
                Add slot
              </Button>
            </div>
          </form>

          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : slots.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <p className="text-sm font-medium">No upcoming slots</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                Add a few dated time slots above — students will see them on /learn-hungarian,
                /learn-english and /learn-arabic as soon as they're added.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => {
                const booked = bookedCountFor(slot.id);
                const full = booked >= slot.capacity;
                const busy = busyId === slot.id;
                return (
                  <div
                    key={slot.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                      slot.is_active ? "bg-background" : "border-dashed bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold tabular-nums">
                        {slot.slot_date} · {formatTime12h(slot.start_time)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {slot.duration_min} min · {slot.timezone}
                      </span>
                      <Badge variant={full ? "destructive" : "secondary"}>
                        {booked}/{slot.capacity} booked
                      </Badge>
                      {!slot.is_active && <Badge variant="outline">paused</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => toggleActive(slot)}>
                        {slot.is_active ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={busy}
                        onClick={() => removeSlot(slot)}
                        aria-label="Remove slot"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent bookings</CardTitle>
          <CardDescription className="text-xs">Most recent 50, across all three languages.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => {
                const slot = slots.find((s) => s.id === b.slot_id);
                return (
                  <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
                    <div>
                      <span className="font-semibold">{b.name}</span>{" "}
                      <Badge variant="secondary" className="ml-1">
                        {LANGUAGE_LABEL[b.language] ?? b.language}
                      </Badge>
                      {b.status === "cancelled" && (
                        <Badge variant="outline" className="ml-1">
                          cancelled
                        </Badge>
                      )}
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {slot ? `${slot.slot_date} · ${formatTime12h(slot.start_time)}` : "(slot no longer listed)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {b.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {b.email}
                        </span>
                      )}
                      {b.whatsapp && (
                        <a
                          href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Phone className="h-3 w-3" /> {b.whatsapp}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalTrialManager;
