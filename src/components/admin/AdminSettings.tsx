import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock, Video } from "lucide-react";

const AdminSettings = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Zoom / Meet link setting
  const [zoomUrl, setZoomUrl] = useState("");
  const [zoomSaving, setZoomSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings" as any).select("value").eq("key", "zoom_meeting_url").maybeSingle()
      .then(({ data }) => { if (data) setZoomUrl((data as any).value || ""); });
  }, []);

  const saveZoomUrl = async () => {
    setZoomSaving(true);
    const { error } = await (supabase as any).from("app_settings").upsert(
      { key: "zoom_meeting_url", value: zoomUrl, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    setZoomSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Zoom link saved ✓" });
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

    // Verify current password by re-authenticating
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: "Error", description: "Not authenticated.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password: currentPassword,
    });

    if (signInError) {
      toast({ title: "Error", description: "Current password is incorrect.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Update password
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setLoading(false);
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
          Students will see a <strong>Join Class</strong> button on their dashboard starting 10 minutes before each session.
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

    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
    </Card>
    </div>
  );
};

export default AdminSettings;
