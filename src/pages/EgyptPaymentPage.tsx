import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Copy, Upload, CheckCircle, Clock, Wallet } from "lucide-react";

const ACCOUNT_NUMBER = "00201010003084";

const METHODS = [
  { value: "vodafone_cash", label: "Vodafone Cash", icon: "📱" },
  { value: "instapay", label: "InstaPay", icon: "💳" },
  { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
] as const;

interface EnrollmentData {
  id: string;
  plan_type: string;
  duration: number;
  amount: number;
  currency: string;
  approval_status: string;
  due_at: string | null;
  classes_included: number;
}

const EgyptPaymentPage = () => {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("enrollments")
        .select("id, plan_type, duration, amount, currency, approval_status, due_at, classes_included")
        .eq("id", enrollmentId!)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        toast({ title: "Not found", description: "Enrollment not found.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setEnrollment(data as any);
      setLoading(false);
    };
    load();
  }, [enrollmentId, navigate]);

  const copyAccount = () => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    toast({ title: "Copied!", description: "Account number copied to clipboard." });
  };

  const handleSubmit = async () => {
    if (!enrollment || !paymentMethod || !paymentDate || !receiptFile) return;

    if (receiptFile.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }

    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowed.includes(receiptFile.type)) {
      toast({ title: "Invalid file", description: "Only JPG, PNG, or PDF allowed.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const ext = receiptFile.name.split(".").pop();
      const path = `${session.user.id}/${enrollment.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, receiptFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: rpcError } = await supabase.rpc("submit_egypt_payment", {
        _enrollment_id: enrollment.id,
        _payment_method: paymentMethod,
        _payment_date: paymentDate,
        _receipt_url: path,
        _tx_ref: txRef.trim(),
      } as any);
      if (rpcError) throw rpcError;

      setEnrollment((prev) => prev ? { ...prev, approval_status: "UNDER_REVIEW" } : null);
      toast({ title: "Payment submitted!", description: "Your payment is now under review." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </main>
      </div>
    );
  }

  if (!enrollment) return null;

  const isAlreadySubmitted = enrollment.approval_status !== "PENDING_PAYMENT";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-lg">
        {/* Order Summary */}
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
              <span className="font-medium text-foreground">{enrollment.duration} {enrollment.duration === 1 ? "Month" : "Months"} ({enrollment.classes_included} classes)</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-foreground">{enrollment.amount.toLocaleString()} EGP</span>
            </div>
            {enrollment.due_at && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Pay before: {new Date(enrollment.due_at).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Already submitted */}
        {isAlreadySubmitted ? (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              {enrollment.approval_status === "UNDER_REVIEW" && (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Payment Under Review</h2>
                  <p className="text-muted-foreground">Your receipt has been submitted. We'll review it shortly.</p>
                </>
              )}
              {enrollment.approval_status === "APPROVED" && (
                <>
                  <CheckCircle className="h-12 w-12 mx-auto text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Payment Approved!</h2>
                  <p className="text-muted-foreground">Your enrollment is active.</p>
                  <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                </>
              )}
              {enrollment.approval_status === "REJECTED" && (
                <>
                  <h2 className="text-xl font-semibold text-destructive">Payment Rejected</h2>
                  <p className="text-muted-foreground">Please contact support for assistance.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Payment Form */
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submit Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Account Number */}
              <div className="bg-muted rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Transfer to this account</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono font-bold text-foreground flex-1">{ACCOUNT_NUMBER}</code>
                  <Button variant="outline" size="sm" onClick={copyAccount}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
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
                <div className="flex items-center gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  />
                </div>
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
                disabled={!paymentMethod || !paymentDate || !receiptFile || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Submitting..." : "Submit Payment"}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EgyptPaymentPage;
