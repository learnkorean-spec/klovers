import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const DURATION_MAP: Record<number, number> = { 1: 4, 3: 12, 6: 24 };

const EnrollPage = () => {
  const [planType, setPlanType] = useState("");
  const [duration, setDuration] = useState("");
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });
  }, [navigate]);

  const classesIncluded = duration ? DURATION_MAP[Number(duration)] : 0;
  const unitPrice = amount && classesIncluded ? (Number(amount) / classesIncluded).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !userId) return;
    setLoading(true);

    // Upload receipt
    const filePath = `${userId}/${Date.now()}-${receiptFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, receiptFile);

    if (uploadError) {
      toast({ title: "Upload failed", description: "Could not upload receipt.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Store the file path (not a public URL) so receipts stay protected by RLS
    // Insert enrollment
    const { error: insertError } = await supabase.from("enrollments").insert({
      user_id: userId,
      plan_type: planType,
      duration: Number(duration),
      classes_included: classesIncluded,
      amount: Number(amount),
      unit_price: Number(unitPrice),
      tx_ref: txRef,
      receipt_url: filePath,
      status: "PENDING",
      payment_status: "UNPAID",
      payment_provider: "manual",
      approval_status: "PENDING",
      admin_review_required: true,
      sessions_total: classesIncluded,
      sessions_remaining: classesIncluded,
    } as any);

    if (insertError) {
      toast({ title: "Error", description: "Failed to submit enrollment.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Profile status is now managed server-side; no client update needed

    toast({ title: "Enrollment submitted!", description: "We'll review your payment shortly." });
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Enroll Now</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={planType} onValueChange={setPlanType}>
                <SelectTrigger><SelectValue placeholder="Plan type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group Classes</SelectItem>
                  <SelectItem value="private">Private Classes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month (4 classes)</SelectItem>
                  <SelectItem value="3">3 Months (12 classes)</SelectItem>
                  <SelectItem value="6">6 Months (24 classes)</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Amount paid"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="1"
              />

              {classesIncluded > 0 && amount && (
                <p className="text-sm text-muted-foreground">
                  Unit price: <span className="font-semibold text-foreground">${unitPrice}</span> per class ({classesIncluded} classes)
                </p>
              )}

              <Input
                placeholder="Transaction reference"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                required
              />

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Payment receipt *</label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !planType || !duration}>
                {loading ? "Submitting..." : "Submit Enrollment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EnrollPage;
