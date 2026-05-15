import Link from "next/link";
import { Calendar, Users, CheckCircle2, Clock, Trophy, ExternalLink } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { JoinCompetitionButton } from "@/components/competitions/join-button";
import type { Competition } from "@/generated/prisma/client";

export type ParticipationState = "not_joined" | "pending" | "approved";

interface CompetitionCardProps {
  competition: Competition & { _count: { entries: number } };
  /** When provided (contestant dashboard view), shows participation status and join CTA */
  participation?: {
    state: ParticipationState;
    hasProfile: boolean;
  };
}

function ParticipationIndicator({ state }: { state: ParticipationState }) {
  if (state === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="size-3" /> Participating
      </span>
    );
  }
  if (state === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        <Clock className="size-3" /> Pending Approval
      </span>
    );
  }
  return null;
}

export function CompetitionCard({ competition: c, participation }: CompetitionCardProps) {
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

  const canJoin =
    participation?.state === "not_joined" &&
    (c.status === "ACTIVE" || c.status === "UPCOMING");

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={c.status} />
        <TypeBadge type={c.competitionType} />
        {participation && <ParticipationIndicator state={participation.state} />}
      </div>

      {/* Title + Description */}
      <div className="flex-1">
        <h2 className="text-base font-semibold leading-snug transition-colors group-hover:text-primary">
          {c.title}
        </h2>
        {c.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {c.description}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" />
          {start} – {end}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {c._count.entries} entrant{c._count.entries !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
        <Link
          href={`/competitions/${c.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <ExternalLink className="size-3.5" />
          View details
        </Link>

        {/* Contestant-specific CTAs */}
        {canJoin && (
          <JoinCompetitionButton
            competitionId={c.id}
            alreadyJoined={false}
            hasProfile={participation!.hasProfile}
          />
        )}

        {participation?.state === "approved" && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" /> Participating
          </span>
        )}

        {participation?.state === "pending" && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <Clock className="size-3.5" /> Awaiting approval
          </span>
        )}

        {/* Public (no participation context) — just a subtle CTA */}
        {!participation && (
          <Link
            href={`/competitions/${c.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <Trophy className="size-3.5" />
            Join
          </Link>
        )}
      </div>
    </div>
  );
}
