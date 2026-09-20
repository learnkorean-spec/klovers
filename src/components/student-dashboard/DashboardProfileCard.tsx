import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import JourneyStepper from "@/components/JourneyStepper";
import AvatarUpload from "@/components/AvatarUpload";
import { useLanguage } from "@/contexts/LanguageContext";

// Named DashboardProfileCard (not ProfileCard) to avoid colliding with any
// other "profile card" concept elsewhere in the app — this one is specific
// to the student dashboard's name/avatar/journey-stage header block. Moved
// out of StudentDashboard.tsx as part of splitting that page into
// per-component files; behavior and markup are unchanged.
export const DashboardProfileCard = ({
  userId, avatarUrl, displayName, enrollmentCount, journeyStage,
  onAvatarUploaded, onNameUpdated,
}: {
  userId: string; avatarUrl: string; displayName: string; enrollmentCount: number;
  journeyStage: number; onAvatarUploaded: (url: string) => void; onNameUpdated: (name: string) => void;
}) => {
  const { t, tPlural } = useLanguage();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(displayName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingName) setNameValue(displayName);
  }, [displayName, editingName]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === displayName) {
      setEditingName(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name: nameValue.trim() }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ title: t("dashboardPage.errorTitle"), description: t("dashboardPage.couldNotUpdateName"), variant: "destructive" });
      return;
    }
    toast({ title: t("dashboardPage.nameUpdated") });
    onNameUpdated(nameValue.trim());
    setEditingName(false);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4 mb-4">
          <AvatarUpload userId={userId} currentUrl={avatarUrl} name={displayName} onUploaded={onAvatarUploaded} />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  className="h-8 w-[180px] max-w-full text-sm"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSaveName} disabled={saving} aria-label={t("dashboardPage.saveNameAria")}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setEditingName(false); setNameValue(displayName); }} aria-label={t("dashboardPage.cancelEditAria")}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <p className="font-semibold text-foreground text-lg truncate" title={displayName} dir="auto">{displayName}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { setNameValue(displayName); setEditingName(true); }} aria-label={t("dashboardPage.editNameAria")}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{tPlural("dashboardPage.activePackage", enrollmentCount)}</p>
          </div>
        </div>
        <JourneyStepper currentStage={journeyStage} />
      </CardContent>
    </Card>
  );
};

export default DashboardProfileCard;
