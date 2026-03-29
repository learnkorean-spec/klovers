import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Copy, Upload, CheckCircle, Clock, Wallet, Eye, RefreshCw, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

const METHOD_DETAILS: Record<string, { label: string; value: string }> = {
  vodafone_cash: { label: "Send to Vodafone Cash number", value: "+201010003084" },
  instapay:      { label: "Transfer to bank account",     value: "00601121777560" },
};

const METHODS = [
  { value: "vodafone_cash", label: "Vodafone Cash", icon: "📱" },
  { value: "instapay", label: "InstaPay", icon: "💳" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
] as const;

const METHOD_LABELS: Record<string, string> = {
  vodafone_cash: "Vodafone Cash",
  instapay: "InstaPay",
  bank_transfer: "Bank Transfer",
};

interface EnrollmentData {
  id: string;
  plan_type: string;
  class_type: string | null;
  duration: number;
  amount: number;
  currency: string;
  approval_status: string;
  due_at: string | null;
  classes_included: number;
  receipt_url: string;
  payment_method: string | null;
  payment_date: string | null;
}

/* ── Order Summary sub-component ── */
const OrderSummary = ({ enrollment }: { enrollment: EnrollmentData }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="text-xl flex items-center gap-2">
        <Wallet className="h-5 w-5" /> Order Summary
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Plan</span>
        <span className="font-medium text-foreground capitalize">{enrollment.plan_type} Classes</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Duration</span>
        <span className="font-medium text-foreground">
          {enrollment.duration} {enrollment.duration === 1 ? "Month" : "Months"} ({enrollment.classes_included} classes)
        </span>
      </div>
      <div className="flex justify-between text-sm border-t border-border pt-2">
        <span className="font-semibold text-foreground">Total</span>
        <span className="font-bold text-lg text-foreground">{Math.round(enrollment.amount).toLocaleString()} EGP</span>
      </div>
      {enrollment.due_at && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Pay before: {new Date(enrollment.due_at).toLocaleString()}
        </div>
      )}
    </CardContent>
  </Card>
);

/* ── Under Review confirmation block ── */
const UnderReviewBlock = ({
  enrollment,
  receiptFileName,
  onViewReceipt,
  viewingReceipt,
  onReplaceReceipt,
  replacing,
}: {
  enrollment: EnrollmentData;
  receiptFileName: string;
  onViewReceipt: () => void;
  viewingReceipt: boolean;
  onReplaceReceipt: (file: File) => void;
  replacing: boolean;
}) => {
  const [showReplace, setShowReplace] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);

  const handleReplace = () => {
    if (newFile) onReplaceReceipt(newFile);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Status badge */}
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 mx-auto text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Payment Under Review</h2>
        </div>

        {/* Submission details */}
        <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Payment Method</span>
            <span className="font-medium text-foreground">{METHOD_LABELS[enrollment.payment_method ?? ""] ?? enrollment.payment_method}</span>
          </div>
          {enrollment.payment_date && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Date</span>
              <span className="font-medium text-foreground">{new Date(enrollment.payment_date).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Receipt</span>
            <span className="font-medium text-foreground truncate max-w-[180px]">{receiptFileName}</span>
          </div>
        </div>

        {/* View receipt */}
        <Button variant="outline" className="w-full" onClick={onViewReceipt} disabled={viewingReceipt}>
          <Eye className="h-4 w-4 mr-2" />
          {viewingReceipt ? "Opening…" : "View Uploaded Receipt"}
        </Button>

        {/* Next-step messaging */}
        <div className="bg-accent/50 border border-border rounded-lg p-4 text-sm space-y-1">
          <p className="font-semibold text-foreground">What happens next?</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Our team will review your receipt within <strong className="text-foreground">24–48 hours</strong>.</li>
            <li>You'll receive an <strong className="text-foreground">email notification</strong> once approved.</li>
            <li>Your classes will be activated automatically after approval.</li>
          </ul>
        </div>

        {/* Replace receipt */}
        {!showReplace ? (
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground transition-colors w-full text-center"
            onClick={() => setShowReplace(true)}
          >
            Uploaded the wrong file? Replace receipt
          </button>
        ) : (
          <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-muted-foreground">
                This will replace your current receipt. The review timer will reset.
              </p>
            </div>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setNewFile(e.target.files?.[0] || null)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={!newFile || replacing}
                onClick={handleReplace}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                {replacing ? "Replacing…" : "Replace Receipt"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowReplace(false); setNewFile(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <Button className="w-full" onClick={() => window.location.href = "/dashboard"}>
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Payment Form sub-component ── */
const PaymentForm = ({
  enrollment,
  onSubmit,
  submitting,
}: {
  enrollment: EnrollmentData;
  onSubmit: (method: string, date: string, file: File, txRef: string) => void;
  submitting: boolean;
}) => {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const copyAccount = () => {
    const detail = METHOD_DETAILS[paymentMethod];
    if (!detail) return;
    navigator.clipboard.writeText(detail.value);
    toast({ title: "Copied!", description: `${detail.label} copied to clipboard.` });
  };

  const handleSubmit = () => {
    if (!paymentMethod || !paymentDate || !receiptFile) return;
    onSubmit(paymentMethod, paymentDate, receiptFile, txRef);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Submit Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Payment Method */}
        <div className="space-y-2">
          <Label>Payment Method *</Label>
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setPaymentMethod(m.value)}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  paymentMethod === m.value
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xl block">{m.icon}</span>
                <span className="text-xs font-medium text-foreground">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transfer details — shown only after method is selected */}
        {paymentMethod === "bank_transfer" && (
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-xs text-muted-foreground">Contact us on WhatsApp to get bank transfer details</p>
            <a
              href={WHATSAPP_BASE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2 rounded-lg transition-colors w-full justify-center"
            >
              💬 Contact us on WhatsApp
            </a>
          </div>
        )}
        {paymentMethod && paymentMethod !== "bank_transfer" && METHOD_DETAILS[paymentMethod] && (
          <div className="bg-muted rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{METHOD_DETAILS[paymentMethod].label}</p>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold text-foreground flex-1">{METHOD_DETAILS[paymentMethod].value}</code>
              <Button variant="outline" size="sm" type="button" onClick={copyAccount}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Payment Date */}
        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment Date *</Label>
          <Input
            id="paymentDate"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Receipt Upload */}
        <div className="space-y-2">
          <Label htmlFor="receipt">Receipt (JPG/PNG/PDF, max 5MB) *</Label>
          <Input
            id="receipt"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
          />
          {receiptFile && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Upload className="h-3 w-3" /> {receiptFile.name}
            </p>
          )}
        </div>

        {/* Transaction Reference */}
        <div className="space-y-2">
          <Label htmlFor="txRef">Transaction Reference (optional)</Label>
          <Input
            id="txRef"
            placeholder="e.g. transfer ID"
            value={txRef}
            onChange={(e) => setTxRef(e.target.value)}
            maxLength={100}
          />
        </div>

        <Button
          className="w-full"
          size="lg"
          type="button"
          disabled={!paymentMethod || !paymentDate || !receiptFile || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Submit Payment"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ── Main Page ── */
const EgyptPaymentPage = () => {
  useSEO({ title: "Complete Payment | Klovers Korean Academy", description: "Complete your enrollment payment to activate your Klovers Korean course." });
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(false);
  const [lastFileName, setLastFileName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      // Use SECURITY DEFINER RPC to bypass RLS — handles manual enrollments & email-matched users
      const { data: rows, error } = await supabase
        .rpc("get_enrollment_for_payment", { p_enrollment_id: enrollmentId! });

      const data = rows && rows.length > 0 ? rows[0] : null;

      if (error || !data) {
        toast({ title: "Not found", description: "Enrollment not found.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setEnrollment(data as any);
      if (data.receipt_url) {
        setLastFileName(data.receipt_url.split("/").pop() ?? "receipt");
      }
      setLoading(false);
    };
    load();
  }, [enrollmentId, navigate]);

  const uploadReceipt = useCallback(async (file: File, enrollId: string): Promise<string> => {
    if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5 MB)");
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) throw new Error("Only JPG, PNG, or PDF allowed");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop();
    const path = `${session.user.id}/${enrollId}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }, []);

  const handleSubmit = async (method: string, date: string, file: File, txRef: string) => {
    if (!enrollment) return;
    setSubmitting(true);
    try {
      const path = await uploadReceipt(file, enrollment.id);

      const { error: rpcError } = await supabase.rpc("submit_egypt_payment", {
        _enrollment_id: enrollment.id,
        _payment_method: method,
        _payment_date: date,
        _receipt_url: path,
        _tx_ref: txRef.trim(),
      } as any);
      if (rpcError) {
        // If status changed (e.g. admin already approved), refresh enrollment data
        if (rpcError.message?.includes("PENDING_PAYMENT")) {
          const { data: refreshed } = await supabase
            .from("enrollments")
            .select("id, plan_type, class_type, duration, amount, currency, approval_status, due_at, classes_included, receipt_url, payment_method, payment_date")
            .eq("id", enrollment.id)
            .single();
          if (refreshed) {
            setEnrollment(refreshed as any);
            toast({ title: "Status updated", description: refreshed.approval_status === "APPROVED" ? "This enrollment has already been approved!" : "Enrollment status has changed. Please review.", variant: "default" });
            return;
          }
        }
        throw rpcError;
      }

      setLastFileName(file.name);
      setEnrollment((prev) =>
        prev ? { ...prev, approval_status: "UNDER_REVIEW", payment_method: method, payment_date: date, receipt_url: path } : null
      );
      toast({ title: "Payment submitted!", description: "Your payment is now under review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewReceipt = async () => {
    if (!enrollment?.receipt_url) return;
    setViewingReceipt(true);
    try {
      const { data, error } = await supabase.storage.from("receipts").createSignedUrl(enrollment.receipt_url, 600);
      if (error || !data?.signedUrl) throw error ?? new Error("Could not generate link");
      window.open(data.signedUrl, "_blank", "noreferrer");
    } catch {
      toast({ title: "Error", description: "Could not open receipt. Please try again.", variant: "destructive" });
    } finally {
      setViewingReceipt(false);
    }
  };

  const handleReplaceReceipt = async (file: File) => {
    if (!enrollment) return;
    setReplacing(true);
    try {
      const path = await uploadReceipt(file, enrollment.id);

      const { error } = await supabase
        .from("enrollments")
        .update({ receipt_url: path } as any)
        .eq("id", enrollment.id);
      if (error) throw error;

      setLastFileName(file.name);
      setEnrollment((prev) => prev ? { ...prev, receipt_url: path } : null);
      toast({ title: "Receipt replaced", description: "Your new receipt has been uploaded." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setReplacing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </main>
      </div>
    );
  }

  if (!enrollment) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        <OrderSummary enrollment={enrollment} />

        {enrollment.approval_status === "PENDING_PAYMENT" && (
          <PaymentForm enrollment={enrollment} onSubmit={handleSubmit} submitting={submitting} />
        )}

        {enrollment.approval_status === "UNDER_REVIEW" && (
          <UnderReviewBlock
            enrollment={enrollment}
            receiptFileName={lastFileName}
            onViewReceipt={handleViewReceipt}
            viewingReceipt={viewingReceipt}
            onReplaceReceipt={handleReplaceReceipt}
            replacing={replacing}
          />
        )}

        {enrollment.approval_status === "APPROVED" && (
          <div className="space-y-4">
            {/* Success card */}
            <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-9 w-9 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">You're in! 🎉</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Your payment has been approved and your enrollment is now active. Welcome to Klovers!
                </p>
                <Button className="w-full sm:w-auto" onClick={() => navigate("/dashboard")}>
                  Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Upsell card — upgrade to private */}
            {enrollment.plan_type === "group" && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Upgrade Available</p>
                      <h3 className="font-bold text-foreground mb-1">Want faster results? Try Private.</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        1-on-1 sessions move 3× faster — personalized lessons, flexible schedule, instant feedback. Many students switch after their first month.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I just enrolled in a group class and I'm interested in upgrading to private sessions. Can you tell me more?")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                          Ask about Private →
                        </a>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground">
                          No thanks
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {enrollment.approval_status === "REJECTED" && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <h2 className="text-xl font-semibold text-destructive">Payment Rejected</h2>
              <p className="text-muted-foreground">Please contact support for assistance.</p>
              <a
                href={WHATSAPP_BASE}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] px-4 py-2 rounded-lg transition-colors"
              >
                💬 Contact us on WhatsApp
              </a>
            </CardContent>
          </Card>
        )}

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { icon: "🔒", title: "Secure Upload", desc: "Encrypted storage" },
            { icon: "⚡", title: "Fast Review", desc: "Within 24–48h" },
            { icon: "💬", title: "Need Help?", desc: "WhatsApp us" },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/50 border border-border rounded-xl p-3 text-center">
              <span className="text-xl block mb-1">{icon}</span>
              <p className="text-xs font-semibold text-foreground">{title}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* WhatsApp fallback */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Having trouble?{" "}
          <a
            href={WHATSAPP_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 font-semibold hover:underline"
          >
            WhatsApp us
          </a>{" "}
          and we'll help you complete your enrollment.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default EgyptPaymentPage;
