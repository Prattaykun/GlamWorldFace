"use client";

import { Badge } from "@/components/ui/badge";
import type { CompetitionStatus, CompetitionType } from "@/generated/prisma/client";

const statusConfig: Record<
  CompetitionStatus,
  { label: string; className: string }
> = {
  UPCOMING: {
    label: "Upcoming",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const typeConfig: Record<CompetitionType, { label: string; className: string }> = {
  JURY: {
    label: "Jury",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  },
  PUBLIC_VOTING: {
    label: "Public Vote",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400",
  },
};

export function StatusBadge({ status }: { status: CompetitionStatus }) {
  const cfg = statusConfig[status];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: CompetitionType }) {
  const cfg = typeConfig[type];
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
