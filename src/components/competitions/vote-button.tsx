"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoteButtonProps {
  competitionId: string;
  contestantId: string;
  /** Whether the current user has already voted in this competition */
  hasVoted: boolean;
  /** Whether the user is the contestant themselves */
  isOwn: boolean;
  disabled?: boolean;
}

export function VoteButton({
  competitionId,
  contestantId,
  hasVoted: initialHasVoted,
  isOwn,
  disabled,
}: VoteButtonProps) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (hasVoted || isOwn || disabled) return;
    setLoading(true);

    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, contestantId }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to cast vote.");
        return;
      }

      setHasVoted(true);
      toast.success("Your vote has been cast! ❤️");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isOwn) return null;

  return (
    <Button
      variant={hasVoted ? "secondary" : "default"}
      size="sm"
      onClick={handleVote}
      disabled={loading || hasVoted || disabled}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart className={`size-4 ${hasVoted ? "fill-current" : ""}`} />
      )}
      {hasVoted ? "Voted" : "Vote"}
    </Button>
  );
}
