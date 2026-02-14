import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string;
  name: string;
  onUploaded: (url: string) => void;
}

const AvatarUpload = ({ userId, currentUrl, name, onUploaded }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
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
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + "?t=" + Date.now();

    // Save to profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl } as any)
      .eq("user_id", userId);

    if (updateErr) {
      toast({ title: "Error saving", description: updateErr.message, variant: "destructive" });
    } else {
      toast({ title: "Photo updated!" });
      onUploaded(publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
        <Avatar className="h-16 w-16 border-2 border-primary/20">
          {currentUrl && <AvatarImage src={currentUrl} alt={name} />}
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
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
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
      <div>
        <p className="text-sm text-muted-foreground">Click to upload a profile photo</p>
      </div>
    </div>
  );
};

export default AvatarUpload;
