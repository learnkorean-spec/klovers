import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getLevelShortLabel, type UiLanguage } from "@/constants/levels";
import { GraduationCap, Check, Loader2 } from "lucide-react";

/**
 * "Is this your level?" — asked once, before she picks a class time.
 *
 * `hold_my_seat` reads `profiles.course_level_key` at the moment of booking and
 * stamps it on the enrolment. Nothing had ever asked the student whether that
 * value was right: for most of them it is the guess they made in a dropdown at
 * signup, before their first Korean lesson. The real level is agreed out loud
 * during the trial, and until now it lived only in that conversation.
 *
 * When it shows — all three must hold:
 *   1. she has booked a trial at some point (this is a POST-trial question)
 *   2. she is not sitting in a group yet
 *   3. there is at least one level with an open class time
 *
 * Condition 2 is why this needs no `confirmed_at` column and no migration: the
 * banner retires itself the moment she takes a seat, which is the same moment
 * the answer stops being editable in practice.
 *
 * Failure is silent. A dashboard that renders nothing because a level lookup
 * threw is worse than a dashboard with no banner.
 */

const uiLanguage = (): UiLanguage => {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem("k-lovers-lang") === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
};

const LevelConfirmBanner = () => {
  const navigate = useNavigate();
  const lang = uiLanguage();
  const isAr = lang === "ar";

  const [show, setShow] = useState(false);
  const [levels, setLevels] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        if (!session) return;
        const uid = session.user.id;

        const [profileRes, trialRes, seatRes, pkgRes] = await Promise.all([
          supabase.from("profiles")
            .select("course_level_key, level").eq("user_id", uid).maybeSingle(),
          supabase.from("trial_bookings")
            .select("id", { count: "exact", head: true }).eq("user_id", uid),
          supabase.from("pkg_group_members")
            .select("id", { count: "exact", head: true })
            .eq("user_id", uid).eq("member_status", "active"),
          supabase.from("schedule_packages")
            .select("level").eq("is_active", true).not("level", "is", null),
        ]);

        if (cancelled) return;

        // 1. post-trial only  2. not seated yet
        if ((trialRes.count ?? 0) === 0) return;
        if ((seatRes.count ?? 0) > 0) return;

        // 3. only levels she could actually book into
        const open = Array.from(
          new Set(((pkgRes.data as { level: string }[]) ?? [])
            .map((p) => (p.level || "").trim())
            .filter(Boolean)),
        );
        if (open.length === 0) return;

        const profile = profileRes.data as { course_level_key?: string; level?: string } | null;
        const current = (profile?.course_level_key || profile?.level || "").trim();

        setLevels(open);
        setChosen(open.includes(current) ? current : "");
        setShow(true);
      } catch (err) {
        // Never take the dashboard down over a banner.
        console.error("[LevelConfirmBanner] could not load:", err);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const confirm = async () => {
    if (!chosen || saving) return;
    setSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) return;

      // Both columns. `course_level_key` is what hold_my_seat reads; `level` is
      // what assign_student_to_pkg_group still reads. They have disagreed on
      // real rows before, and a student who has just told us her level should
      // not leave here with two answers on file.
      const { error } = await supabase
        .from("profiles")
        .update({ course_level_key: chosen, level: chosen })
        .eq("user_id", uid);
      if (error) throw error;

      setConfirmed(true);
    } catch (err) {
      console.error("[LevelConfirmBanner] could not save:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="container mx-auto px-4 pt-4" dir={isAr ? "rtl" : "ltr"}>
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-5 w-5 mt-0.5 shrink-0 text-primary" aria-hidden="true" />

            {confirmed ? (
              <div className="flex-1">
                <p className="font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                  {isAr ? "تم تأكيد مستواك" : "Your level is confirmed"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr
                    ? "اختاري الآن الميعاد المناسب لكِ."
                    : "Now choose the class time that suits you."}
                </p>
                <Button className="mt-3" onClick={() => navigate("/enroll-now")}>
                  {isAr ? "اختاري ميعادك" : "Choose your time"}
                </Button>
              </div>
            ) : (
              <div className="flex-1">
                <p className="font-semibold">
                  {isAr ? "أكّدي مستواكِ" : "Confirm your level"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isAr
                    ? "هذا هو المستوى الذي ستُسجَّلين به. تأكّدي منه قبل اختيار ميعادك."
                    : "This is the level you will be enrolled at. Check it before you pick a class time."}
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:items-center">
                  <Select value={chosen} onValueChange={setChosen}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder={isAr ? "اختاري المستوى" : "Select your level"} />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((key) => (
                        <SelectItem key={key} value={key}>
                          {getLevelShortLabel(key, lang) || key}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={confirm} disabled={!chosen || saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin me-2" aria-hidden="true" />}
                    {isAr ? "تأكيد" : "Confirm"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LevelConfirmBanner;
