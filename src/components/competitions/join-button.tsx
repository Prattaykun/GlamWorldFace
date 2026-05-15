"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { joinCompetitionAction, type JoinState } from "@/app/actions/competition";
import { Button } from "@/components/ui/button";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

export function JoinCompetitionButton({
  competitionId,
  alreadyJoined,
  hasProfile,
}: {
  competitionId: string;
  alreadyJoined: boolean;
  hasProfile: boolean;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<JoinState, FormData>(
    joinCompetitionAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("You've joined the competition! Awaiting admin approval.");
      router.refresh();
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  if (alreadyJoined) {
    return (
      <Button variant="secondary" disabled className="w-full sm:w-auto">
        <Trophy className="mr-2 size-4" />
        Already Joined
      </Button>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="competitionId" value={competitionId} />
      <Button
        type="submit"
        disabled={pending || !hasProfile}
        className="w-full sm:w-auto"
        title={!hasProfile ? "Complete your contestant profile first" : undefined}
      >
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trophy className="mr-2 size-4" />}
        {pending ? "Joining…" : "Join Competition"}
      </Button>
      {!hasProfile && (
        <p className="mt-2 text-xs text-muted-foreground">
          You need to complete your{" "}
          <a href="/dashboard/profile" className="underline">
            contestant profile
          </a>{" "}
          before joining.
        </p>
      )}
    </form>
  );
}
