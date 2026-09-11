/**
 * "Start date filled in automatically — check it": the marker an auto-filled
 * coverage_start must always carry until Re has actually reviewed it.
 *
 * Lives in its own file because two screens now draw it — My Students and the
 * confirm queue on /admin/today — and a session must never be charged against
 * an unreviewed start date on one screen while the other stays quiet about it.
 */
import { Badge } from "@/components/ui/badge";
import { ShieldAlert } from "lucide-react";

export const UnreviewedBadge = ({ className = "" }: { className?: string }) => (
  <Badge variant="outline" className={`text-[10px] border-amber-400 text-amber-700 ${className}`}>
    <ShieldAlert className="h-3 w-3 mr-1" /> start date not reviewed
  </Badge>
);

export default UnreviewedBadge;
