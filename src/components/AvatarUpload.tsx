import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  name: string;
  onUploaded: (url: string) => void;
}

const AvatarUpload = ({ userId, currentUrl, name, onUploaded }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { language } = useLanguage();
  const tr = (en: string, ar: string) => (language === "ar" ? ar : en);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB allowed.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    // Remove old file if exists
    await supabase.storage.from("avatars").remove([path]);

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      toast({ title: tr("Upload failed", "تعذّر رفع الصورة"), description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    // Save to profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", userId);

    if (updateErr) {
      toast({ title: tr("Error saving", "تعذّر الحفظ"), description: updateErr.message, variant: "destructive" });
    } else {
      toast({ title: tr("Photo updated!", "تم تحديث الصورة!") });
      onUploaded(publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="flex min-w-0 items-center gap-4">
      <button
        type="button"
        className="relative group shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={tr("Upload a profile photo", "رفع صورة الملف الشخصي")}
      >
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          {currentUrl && <AvatarImage src={currentUrl} alt={name} />}
          <AvatarFallback className="bg-primary/20 text-foreground text-lg font-semibold">
            {(name || "?").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="h-5 w-5 text-background animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-background" />
          )}
        </div>
        <span className="absolute -bottom-0.5 -end-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground sm:hidden" aria-hidden="true">
          <Camera className="h-3 w-3" />
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
      <div className="hidden min-w-0 sm:block">
        <p className="text-sm text-muted-foreground">{tr("Click to upload a profile photo", "اضغط لرفع صورة الملف الشخصي")}</p>
      </div>
    </div>
  );
};

export default AvatarUpload;
