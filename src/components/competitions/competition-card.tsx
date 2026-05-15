import Link from "next/link";
import { Calendar, Users } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import type { Competition } from "@/generated/prisma/client";

interface CompetitionCardProps {
  competition: Competition & { _count: { entries: number } };
}

export function CompetitionCard({ competition: c }: CompetitionCardProps) {
  const start = new Date(c.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const end = new Date(c.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/competitions/${c.id}`}
      className="group flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={c.status} />
        <TypeBadge type={c.competitionType} />
      </div>

      {/* Title */}
      <div>
        <h2 className="text-base font-semibold leading-snug group-hover:text-primary transition-colors">
          {c.title}
        </h2>
        {c.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {c.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="mt-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {start} – {end}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {c._count.entries} entrant{c._count.entries !== 1 ? "s" : ""}
        </span>
      </div>
    </Link>
  );
}
