import { Trophy, Medal } from "lucide-react";
import Image from "next/image";
import type { CompetitionType } from "@/generated/prisma/client";

interface LeaderboardEntry {
  rank: number;
  contestantId: string;
  name: string | null;
  country: string | null;
  profileImage: string | null;
  score: number | null;      // overallScore (jury) or voteCount (public)
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  type: CompetitionType;
}

const rankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="size-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="size-5 text-slate-400" />;
  if (rank === 3) return <Medal className="size-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
};

export function LeaderboardTable({ entries, type }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        No entries have been approved yet. Check back soon!
      </p>
    );
  }

  const scoreLabel = type === "JURY" ? "Score" : "Votes";

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Header */}
      <div className="grid grid-cols-[3rem_1fr_6rem] items-center border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Rank</span>
        <span>Contestant</span>
        <span className="text-right">{scoreLabel}</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div
            key={entry.contestantId}
            className="grid grid-cols-[3rem_1fr_6rem] items-center gap-2 px-4 py-3"
          >
            {/* Rank */}
            <div className="flex items-center justify-center">
              {rankIcon(entry.rank)}
            </div>

            {/* Contestant */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted border border-border">
                {entry.profileImage ? (
                  <Image
                    src={entry.profileImage}
                    alt={entry.name ?? "Contestant"}
                    fill
                    unoptimized={entry.profileImage.startsWith("/")}
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                    {(entry.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{entry.name ?? "Unknown"}</p>
                {entry.country && (
                  <p className="truncate text-xs text-muted-foreground">{entry.country}</p>
                )}
              </div>
            </div>

            {/* Score */}
            <div className="text-right">
              <span className="text-sm font-semibold tabular-nums">
                {entry.score !== null
                  ? type === "JURY"
                    ? entry.score.toFixed(1)
                    : entry.score.toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
