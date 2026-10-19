import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  telegramStartUrl,
  useTelegramLinkCode,
  type TelegramLinkRow,
  type TelegramLinkTarget,
} from "@/hooks/admin/useTelegramLinks";

/**
 * Linked → a small "Telegram ✓" badge.
 * Not linked → a button that copies the student's personal bot link, ready to
 * paste into WhatsApp/Telegram. The student taps it, presses Start, and the
 * badge flips to linked (Re also gets a Telegram notice).
 */
export const TelegramLinkButton = ({
  target,
  link,
  studentName,
}: {
  target: TelegramLinkTarget;
  link: TelegramLinkRow | undefined;
  studentName: string;
}) => {
  const getCode = useTelegramLinkCode();

  if (link?.chat_id) {
    return (
      <Badge
        variant="outline"
        className="text-[10px] bg-sky-50 text-sky-900 border-sky-300 dark:bg-sky-950/30 dark:text-sky-200"
        title={link.tg_username ? `@${link.tg_username}` : "Linked to Telegram"}
      >
        <Send className="h-3 w-3 mr-1" /> Telegram ✓
      </Badge>
    );
  }

  const copy = async () => {
    try {
      const code = link?.link_code ?? (await getCode.mutateAsync(target));
      const url = telegramStartUrl(code);
      const message =
        `أهلاً ${studentName} 👋\n` +
        `اضغط على اللينك ده واضغط Start عشان توصلك مواعيد الحصص والتنبيهات على تيليجرام:\n${url}`;
      await navigator.clipboard.writeText(message);
      toast({
        title: "Telegram invite copied",
        description: `Paste it to ${studentName}. It flips to "Telegram ✓" once they press Start.`,
      });
    } catch (e) {
      toast({ title: "Could not create the link", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8"
      onClick={copy}
      disabled={getCode.isPending}
      title="Copy this student's personal Telegram link"
    >
      <Send className="h-3.5 w-3.5 mr-1" /> Telegram
    </Button>
  );
};
