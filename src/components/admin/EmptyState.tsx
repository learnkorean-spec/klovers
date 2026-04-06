import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message = "No results found.", icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground" role="status">
      {icon ?? <Inbox className="h-10 w-10 mb-3 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
