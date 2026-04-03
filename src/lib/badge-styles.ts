/**
 * Centralised badge colour utilities — eliminates duplicated inline ternaries
 * across AdminDashboard (leads, enrollments, students) and ensures consistent
 * dark-mode support for all status badges.
 */

/** Lead CRM status → Tailwind className string */
export function getLeadStatusBadgeClass(status: string): string {
  switch (status) {
    case "enrolled":
      return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
    case "trial_booked":
      return "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800";
    case "rejected":
    case "lost":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
    case "contacted":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "new":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

/** Enrollment approval_status → shadcn Badge variant */
export function getApprovalBadgeVariant(
  status: string
): "default" | "destructive" | "secondary" | "outline" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  if (status === "UNDER_REVIEW" || status === "PENDING_PAYMENT") return "secondary";
  return "outline";
}

/** Student derived_status → shadcn Badge variant */
export function getDerivedStatusBadgeVariant(
  status: string
): "default" | "destructive" | "secondary" {
  if (status === "ACTIVE") return "default";
  if (status === "LOCKED") return "destructive";
  return "secondary";
}
