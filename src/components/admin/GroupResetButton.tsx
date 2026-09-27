/**
 * "Reset group" — put an EMPTY paused group back on the waiting list.
 *
 * Paused keeps a group's start date so Resume is one click. That is right for
 * a class that stopped with students in it, and wrong for one that never got
 * any: it sits there "started Saturday 26 September", paused, with 0 members,
 * and nobody can be seated into it because the membership guard refuses a
 * group that is inactive AND has a start date.
 *
 * Reset returns it to exactly what a never-started group looks like:
 * start_date = NULL and is_active = true, i.e. "waiting" — back in the list of
 * times students can be placed into, filling up again from zero. Its slot,
 * room link, capacity and book stay as they are.
 *
 * Refused (nothing changes) when:
 *   - anyone is still seated in it (checked again at click time, not only
 *     from what the card last loaded), or
 *   - any of its class dates carries attendance or a class charge. Those rows
 *     cascade from pkg_group_sessions, so deleting the dates would delete
 *     history; a group with history is resumed, not reset.
 * Empty generated class dates are removed so the calendar does not keep dates
 * for a class that has not started.
 *
 * Kept in its own file on purpose — see the note at the top of
 * GroupsToStart.tsx about whole-file rewrites.
 */
import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface Props {
  groupId: string;
  title: string;
  onDone: () => void | Promise<void>;
}

export default function GroupResetButton({ groupId, title, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    try {
      const { count: seated, error: mErr } = await db
        .from("pkg_group_members")
        .select("user_id", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("member_status", "active");
      if (mErr) throw mErr;
      if ((seated ?? 0) > 0) {
        throw new Error(`${seated} student${seated === 1 ? " is" : "s are"} still in this group. Remove them first, or use Resume.`);
      }

      const { data: sessions, error: sErr } = await db
        .from("pkg_group_sessions")
        .select("id")
        .eq("group_id", groupId);
      if (sErr) throw sErr;
      const ids = ((sessions ?? []) as { id: string }[]).map((s) => s.id);

      if (ids.length > 0) {
        const [att, chg] = await Promise.all([
          db.from("pkg_attendance").select("session_id", { count: "exact", head: true }).in("session_id", ids),
          db.from("pkg_class_charges").select("session_id", { count: "exact", head: true }).in("session_id", ids),
        ]);
        if (att.error) throw att.error;
        if (chg.error) throw chg.error;
        if ((att.count ?? 0) > 0 || (chg.count ?? 0) > 0) {
          throw new Error("This group has attendance or class charges on its dates. It keeps its history — use Resume instead.");
        }
        const { error: dErr } = await db.from("pkg_group_sessions").delete().eq("group_id", groupId);
        if (dErr) throw dErr;
      }

      const { error: uErr } = await db
        .from("pkg_groups")
        .update({ start_date: null, is_active: true })
        .eq("id", groupId);
      if (uErr) throw uErr;

      // Best-effort audit line; the reset itself has already succeeded.
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.id) {
        await db.from("admin_audit_log").insert({
          admin_id: userData.user.id,
          action: "group_reset_to_waiting",
          field: `pkg_groups:${groupId}`,
          old_value: "paused, empty",
          new_value: `waiting (start_date cleared${ids.length ? `, ${ids.length} empty class dates removed` : ""})`,
        });
      }

      toast({
        title: `${title} is back on the waiting list`,
        description: "No start date, open for new students. Its time, room link and book are unchanged.",
      });
      setOpen(false);
      await onDone();
    } catch (e: unknown) {
      toast({
        title: "Could not reset the group",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={busy}>
        Reset group
        <RotateCcw className="ml-1.5 h-4 w-4" aria-hidden="true" />
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              It has no students, so it goes back to the waiting list: no start date, and students can be placed into this
              time again. Its day, time, room link, capacity and book stay the same.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void reset(); }}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
