import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Send, TestTube, Eye, RefreshCw, Mail } from "lucide-react";

const DEFAULT_SUBJECT = "Welcome to K-Lovers 🇰🇷";

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#8B5CF6;padding:32px 40px;text-align:center;">
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to K-Lovers! 🇰🇷</h1>
  </td></tr>
  <tr><td style="padding:40px;">
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">{{greeting}}</p>
    <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">Your account is set up and ready. Whether you're a complete beginner or brushing up your skills, we're here to guide you every step of the way.</p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="{{dashboard_url}}" style="background:#8B5CF6;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">Start Learning Korean →</a>
    </td></tr></table>
    <p style="color:#6B7280;font-size:14px;line-height:1.5;margin:0 0 8px;">Quick links:</p>
    <p style="margin:0 0 24px;">
      <a href="{{courses_url}}" style="color:#8B5CF6;text-decoration:none;font-size:14px;">Browse Courses</a> &nbsp;•&nbsp;
      <a href="{{dashboard_url}}" style="color:#8B5CF6;text-decoration:none;font-size:14px;">Your Dashboard</a>
    </p>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
    <p style="color:#6B7280;font-size:14px;margin:0;">Warm regards,<br><strong>Reham</strong>, Founder of K-Lovers</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

interface Campaign {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  created_at: string;
  queued: number;
  sent: number;
  failed: number;
}

interface SendRecord {
  id: string;
  email: string;
  status: string;
  error: string | null;
  attempts: number;
  sent_at: string | null;
}

const BulkEmailManager = () => {
  const [name, setName] = useState("Welcome Campaign");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [htmlBody, setHtmlBody] = useState(DEFAULT_HTML);
  const [audience, setAudience] = useState<"new" | "all">("new");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ queued: 0, sent: 0, failed: 0 });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);
  const [detailSends, setDetailSends] = useState<SendRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoadingHistory(true);
    const { data: camps } = await supabase
      .from("email_campaigns" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!camps || camps.length === 0) {
      setCampaigns([]);
      setLoadingHistory(false);
      return;
    }

    // Get counts for each campaign
    const campaignList: Campaign[] = [];
    for (const c of camps as any[]) {
      const { data: sends } = await supabase
        .from("email_sends" as any)
        .select("status")
        .eq("campaign_id", c.id);

      const counts = { queued: 0, sent: 0, failed: 0 };
      if (sends) {
        for (const s of sends as any[]) {
          if (s.status === "queued") counts.queued++;
          else if (s.status === "sent") counts.sent++;
          else if (s.status === "failed") counts.failed++;
        }
      }
      campaignList.push({ ...c, ...counts });
    }
    setCampaigns(campaignList);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleTestSend = async () => {
    setTestSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "test",
            subject,
            html_body: htmlBody,
          }),
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Test send failed");
      toast({ title: "Test email sent!", description: "Check your admin inbox." });
    } catch (err: any) {
      toast({ title: "Test failed", description: err.message, variant: "destructive" });
    } finally {
      setTestSending(false);
    }
  };

  const handleSend = async () => {
    setShowConfirm(false);
    setSending(true);
    setProgress({ queued: 0, sent: 0, failed: 0 });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // 1. Create campaign
      const { data: campaign, error: campErr } = await supabase
        .from("email_campaigns" as any)
        .insert({ name, subject, html_body: htmlBody, created_by: session.user.id } as any)
        .select()
        .single();
      if (campErr || !campaign) throw new Error(campErr?.message || "Failed to create campaign");

      const campaignId = (campaign as any).id;

      // 2. Get target users
      let users: { user_id: string; email: string; name: string }[] = [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, email, name");
      if (!profiles) throw new Error("Failed to fetch users");

      if (audience === "new") {
        // Only users who haven't received any campaign with this name
        const { data: existingSends } = await supabase
          .from("email_sends" as any)
          .select("user_id, campaign_id");

        // Get campaign IDs with same name
        const { data: sameName } = await supabase
          .from("email_campaigns" as any)
          .select("id")
          .eq("name", name);

        const sameNameIds = new Set((sameName as any[] || []).map((c: any) => c.id));
        sameNameIds.delete(campaignId); // exclude current

        const alreadySent = new Set<string>();
        if (existingSends) {
          for (const s of existingSends as any[]) {
            if (sameNameIds.has(s.campaign_id)) alreadySent.add(s.user_id);
          }
        }
        users = (profiles as any[]).filter(p => !alreadySent.has(p.user_id));
      } else {
        users = profiles as any[];
      }

      if (users.length === 0) {
        toast({ title: "No users to send to", description: "All users already received this campaign.", variant: "destructive" });
        setSending(false);
        return;
      }

      // 3. Enqueue sends
      const sends = users.map(u => ({
        campaign_id: campaignId,
        user_id: u.user_id,
        email: u.email,
        status: "queued",
      }));

      // Insert in chunks of 100
      for (let i = 0; i < sends.length; i += 100) {
        await supabase.from("email_sends" as any).insert(sends.slice(i, i + 100) as any);
      }

      setProgress({ queued: users.length, sent: 0, failed: 0 });

      // 4. Process in batches with polling
      let remaining = true;
      while (remaining) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-email-campaign`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: "process", campaign_id: campaignId }),
          }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Processing failed");

        setProgress({
          queued: result.queued || 0,
          sent: result.sent || 0,
          failed: result.failed || 0,
        });

        remaining = (result.queued || 0) > 0;
        if (remaining) await new Promise(r => setTimeout(r, 2000));
      }

      toast({ title: "Campaign sent!", description: `${progress.sent} emails delivered.` });
      fetchCampaigns();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const viewDetail = async (campaign: Campaign) => {
    setDetailCampaign(campaign);
    const { data } = await supabase
      .from("email_sends" as any)
      .select("id, email, status, error, attempts, sent_at")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: false });
    setDetailSends((data as any[]) || []);
  };

  const total = progress.queued + progress.sent + progress.failed;
  const pct = total > 0 ? Math.round(((progress.sent + progress.failed) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* CREATE CAMPAIGN */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" /> New Campaign
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Welcome Campaign" />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Welcome to K-Lovers" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>HTML Body</Label>
            <Textarea
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              rows={10}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as "new" | "all")}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Only users who haven't received this (recommended)</SelectItem>
                <SelectItem value="all">All users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowPreview(true)} disabled={sending}>
              <Eye className="h-4 w-4 mr-1" /> Preview
            </Button>
            <Button variant="outline" onClick={handleTestSend} disabled={testSending || sending}>
              <TestTube className="h-4 w-4 mr-1" /> {testSending ? "Sending..." : "Test Send"}
            </Button>
            <Button onClick={() => setShowConfirm(true)} disabled={sending || !name || !subject || !htmlBody}>
              <Send className="h-4 w-4 mr-1" /> Send Campaign
            </Button>
          </div>

          {sending && (
            <div className="space-y-2 pt-2">
              <Progress value={pct} className="h-3" />
              <div className="flex gap-3 text-sm">
                <span className="text-muted-foreground">Queued: {progress.queued}</span>
                <span className="text-green-600">Sent: {progress.sent}</span>
                <span className="text-destructive">Failed: {progress.failed}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAMPAIGN HISTORY */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Campaign History</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchCampaigns} disabled={loadingHistory}>
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Queued</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{c.queued}</TableCell>
                    <TableCell className="text-green-600">{c.sent}</TableCell>
                    <TableCell className="text-destructive">{c.failed}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => viewDetail(c)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* PREVIEW DIALOG */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div
            className="border rounded-lg overflow-auto"
            dangerouslySetInnerHTML={{
              __html: htmlBody
                .replace(/\{\{greeting\}\}/g, "Hi there,")
                .replace(/\{\{dashboard_url\}\}/g, "#")
                .replace(/\{\{courses_url\}\}/g, "#"),
            }}
          />
        </DialogContent>
      </Dialog>

      {/* CONFIRM DIALOG */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send "{subject}" to {audience === "all" ? "all" : "eligible"} users.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>Send Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DETAIL DIALOG */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{detailCampaign?.name} — Details</DialogTitle>
          </DialogHeader>
          <div className="flex gap-3 mb-4">
            <Badge variant="secondary">Queued: {detailCampaign?.queued}</Badge>
            <Badge className="bg-green-100 text-green-700">Sent: {detailCampaign?.sent}</Badge>
            {(detailCampaign?.failed ?? 0) > 0 && (
              <Badge variant="destructive">Failed: {detailCampaign?.failed}</Badge>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detailSends.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.email}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "sent" ? "default" : s.status === "failed" ? "destructive" : "secondary"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.attempts}</TableCell>
                  <TableCell className="text-xs text-destructive max-w-[200px] truncate">{s.error || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkEmailManager;
