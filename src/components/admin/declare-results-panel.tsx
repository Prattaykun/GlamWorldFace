"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { declareResultsAction } from "@/app/actions/competition";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Trophy,
  Medal,
  Award,
  Loader2,
  GripVertical,
  Star,
  ChevronUp,
  ChevronDown,
  Megaphone,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryRow {
  id: string;
  rank: number | null;
  voteCount: number;
  finalScore: number | null;
  overallScore: number | null;
  contestant: {
    id: string;
    profileImage: string | null;
    user: { name: string | null };
    country: string | null;
  };
}

interface DeclareResultsPanelProps {
  competitionId: string;
  competitionType: "JURY" | "PUBLIC_VOTING";
  resultsAnnounced: boolean;
  entries: EntryRow[];
}

const RANK_ICONS = [
  { icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "1st Place" },
  { icon: Medal, color: "text-slate-400", bg: "bg-slate-400/10", label: "2nd Place" },
  { icon: Award, color: "text-amber-600", bg: "bg-amber-600/10", label: "3rd Place" },
];

export function DeclareResultsPanel({
  competitionId,
  competitionType,
  resultsAnnounced: initialAnnounced,
  entries: initialEntries,
}: DeclareResultsPanelProps) {
  // Sort by existing rank first, then by score desc, then name
  const sortedInitial = [...initialEntries].sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    const aScore = a.finalScore ?? a.overallScore ?? a.voteCount ?? 0;
    const bScore = b.finalScore ?? b.overallScore ?? b.voteCount ?? 0;
    return bScore - aScore;
  });

  const [ordered, setOrdered] = useState(sortedInitial);
  const [announced, setAnnounced] = useState(initialAnnounced);
  const [isPending, startTransition] = useTransition();

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    setOrdered((prev) => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const moveDown = (idx: number) => {
    if (idx === ordered.length - 1) return;
    setOrdered((prev) => {
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const save = (announce: boolean) => {
    const ranks: Record<string, number> = {};
    ordered.forEach((e, i) => { ranks[e.id] = i + 1; });

    startTransition(async () => {
      const result = await declareResultsAction(competitionId, ranks, announce);
      if (result?.error) {
        toast.error(result.error);
      } else {
        setAnnounced(announce);
        toast.success(
          announce
            ? "🏆 Results announced! Contestants can now see their positions."
            : "Ranks saved as draft."
        );
      }
    });
  };

  const scoreLabel = (entry: EntryRow) => {
    if (competitionType === "JURY") {
      const s = entry.finalScore ?? entry.overallScore;
      return s !== null ? `Score: ${s.toFixed(1)}` : "No score";
    }
    return `${entry.voteCount} vote${entry.voteCount !== 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {announced && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
          <Megaphone className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Results have been officially announced. Contestants can see their positions.
          </p>
        </div>
      )}

      {/* Instruction */}
      <p className="text-sm text-muted-foreground">
        Drag the ↕ handles or use the arrows to reorder contestants. The top position is
        1st place. Save as draft at any time; click <strong>Announce Results</strong> when ready to
        make positions visible to contestants.
      </p>

      {/* Ranked list */}
      <div className="space-y-2">
        {ordered.map((entry, idx) => {
          const rankInfo = idx < 3 ? RANK_ICONS[idx] : null;
          const RankIcon = rankInfo?.icon ?? Star;

          return (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 sm:p-4 transition-all",
                idx === 0 && "border-yellow-500/30 bg-yellow-500/5",
                idx === 1 && "border-slate-400/30 bg-slate-400/5",
                idx === 2 && "border-amber-600/30 bg-amber-600/5",
                idx > 2 && "border-border bg-card"
              )}
            >
              {/* Rank number */}
              <div className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                rankInfo ? `${rankInfo.bg} ${rankInfo.color}` : "bg-muted text-muted-foreground"
              )}>
                {idx < 3 ? (
                  <RankIcon className="size-4" />
                ) : (
                  <span>#{idx + 1}</span>
                )}
              </div>

              {/* Profile image */}
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {entry.contestant.profileImage ? (
                  <Image
                    src={entry.contestant.profileImage}
                    alt={entry.contestant.user.name ?? "Contestant"}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                    {(entry.contestant.user.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name / country / score */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{entry.contestant.user.name ?? "Unknown"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {entry.contestant.country && (
                    <span className="text-xs text-muted-foreground">{entry.contestant.country}</span>
                  )}
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    {scoreLabel(entry)}
                  </Badge>
                  {idx < 3 && rankInfo && (
                    <Badge className={cn("text-xs px-2 py-0 border-0", rankInfo.bg, rankInfo.color)}>
                      {rankInfo.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Move buttons */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0 || isPending}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === ordered.length - 1 || isPending}
                  className="rounded p-1 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>

              <GripVertical className="size-4 text-muted-foreground/40 shrink-0 hidden sm:block" />
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => save(false)}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save Draft Ranks
        </Button>

        <Button
          onClick={() => save(true)}
          disabled={isPending}
          className={cn(
            "w-full sm:w-auto",
            announced
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-primary hover:bg-primary/90"
          )}
        >
          {isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Megaphone className="mr-2 size-4" />
          )}
          {announced ? "Re-Announce Results" : "Announce Results"}
        </Button>
      </div>
    </div>
  );
}
