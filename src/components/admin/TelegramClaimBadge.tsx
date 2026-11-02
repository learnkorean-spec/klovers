/**
 * Re, 2 Nov 2026 (Today screen): "add if they confirmed on telegram or not
 * so i confirm next to them" — the confirm strips (PrivateClassesToConfirm,
 * and the identical inline copy in MyStudentsManager) only ever showed the
 * class and the Confirm/Did-not-happen buttons, with no idea whether the
 * student had already answered the Telegram after-class ask for that exact
 * session. One small badge, shared so both strips read it the same way.
 *
 * This is purely informational — a claim, never a confirmation. Tapping
 * Telegram never sets outcome/counted; only the buttons next to this badge
 * do that.
 */
import { Check, X, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StudentClassSession } from "@/types/students";

interface TelegramClaimBadgeProps {
  /** The scheduled row for this occurrence, if the weekly generator has one — null means nothing to read a claim off of at all. */
  scheduledRow: StudentClassSession | null;
}

export const TelegramClaimBadge = ({ scheduledRow }: TelegramClaimBadgeProps) => {
  if (!scheduledRow) return null;

  if (scheduledRow.student_confirmed_at) {
    return (
      <Badge variant="default" className="text-xs gap-1">
        <Check className="h-3 w-3" /> Said yes on Telegram
      </Badge>
    );
  }

  if (scheduledRow.student_declined_at) {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <X className="h-3 w-3" /> Said no on Telegram
      </Badge>
    );
  }

  // Asked and silent is worth a different badge than never asked — the same
  // distinction AdminToday already draws for trial attendance (asked vs not).
  if (scheduledRow.telegram_asked_at) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Clock className="h-3 w-3" /> Asked, no reply
      </Badge>
    );
  }

  return null;
};
