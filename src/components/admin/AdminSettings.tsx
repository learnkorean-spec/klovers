import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock, Video, Bell } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Zoom / Meet link setting
  const [zoomUrl, setZoomUrl] = useState("");
  const [zoomSaving, setZoomSaving] = useState(false);

  // Reminder trigger
  const [reminderSending, setReminderSending] = useState<"24h" | "1h" | null>(null);

  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "zoom_meeting_url").maybeSingle()
      .then(({ data }) => { if (data) setZoomUrl(data.value || ""); });
  }, []);

  const saveZoomUrl = async () => {
    setZoomSaving(true);
    try {
      const { error } = await supabase.from("app_settings").upsert(
        { key: "zoom_meeting_url", value: zoomUrl, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Zoom link saved" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
    } finally {
      setZoomSaving(false);
    }
  };

  const sendReminders = async (type: "24h" | "1h") => {
    setReminderSending(type);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-class-reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast({
        title: `${type} reminders sent ✓`,
        description: `${json.sent} email${json.sent !== 1 ? "s" : ""} sent`,
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setReminderSending(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Not authenticated.", variant: "destructive" });
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session.user.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Password updated", description: "Your password has been changed successfully." });
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      }
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to update password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">

      {/* Zoom / Meet link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4" />
            Class Meeting Link (Zoom / Google Meet)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Students see a <strong>Join Class</strong> button on their dashboard starting 10 min before each session.
          </p>
          <Input
            type="url"
            placeholder="https://zoom.us/j/... or meet.google.com/..."
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
          />
          <Button onClick={saveZoomUrl} disabled={zoomSaving} className="w-full">
            {zoomSaving ? "Saving..." : "Save Meeting Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Class Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Class Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reminders run automatically: <strong>24h</strong> before (daily at 10 AM Cairo) and <strong>1h</strong> before (every 30 min). Use these buttons to send manually.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              disabled={reminderSending !== null}
              onClick={() => sendReminders("24h")}
            >
              {reminderSending === "24h" ? "Sending..." : "Send 24h Reminders"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={reminderSending !== null}
              onClick={() => sendReminders("1h")}
            >
              {reminderSending === "1h" ? "Sending..." : "Send 1h Reminders"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4" aria-label="Change password">
            <div>
              <label htmlFor="current-password" className="text-sm font-medium text-foreground">Current Password</label>
              <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1" autoComplete="current-password" />
            </div>
            <div>
              <label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1" autoComplete="new-password" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">Confirm New Password</label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1" autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default memo(AdminSettings);
