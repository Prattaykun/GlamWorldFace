"use client";

import { useActionState, useEffect } from "react";
import { submitJuryScoreAction, type JuryScoreState } from "@/app/actions/jury";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface ExistingScores {
  presentationScore: number;
  confidenceScore: number;
  stylingScore: number;
  profileScore: number;
  professionalismScore: number;
  comments: string | null;
}

export function JuryScoringForm({
  entryId,
  existing,
}: {
  entryId: string;
  existing: ExistingScores | null;
}) {
  const [state, action, pending] = useActionState<JuryScoreState, FormData>(
    submitJuryScoreAction,
    null
  );

  useEffect(() => {
    if (state?.success) toast.success("Scores submitted successfully!");
    if (state?.error) toast.error(state.error);
  }, [state]);

  const categories = [
    { name: "presentationScore", label: "Presentation", hint: "Clarity, structure, appeal of bio" },
    { name: "confidenceScore", label: "Confidence", hint: "Strength of goals & self-description" },
    { name: "stylingScore", label: "Styling", hint: "Quality indicators from profile & persona" },
    { name: "profileScore", label: "Profile Quality", hint: "Completeness and detail of fields" },
    { name: "professionalismScore", label: "Professionalism", hint: "Tone, grammar, coherence" },
  ] as const;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="entryId" value={entryId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map(({ name, label, hint }) => (
          <div key={name} className="space-y-1.5">
            <Label htmlFor={name}>{label}</Label>
            <Input
              id={name}
              name={name}
              type="number"
              min={1}
              max={10}
              step={0.5}
              required
              defaultValue={existing ? existing[name] : ""}
              placeholder="1–10"
            />
            <p className="text-[10px] text-muted-foreground">{hint}</p>
            {state?.errors?.[name] && (
              <p className="text-xs text-destructive">{state.errors[name][0]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="comments">Comments (optional)</Label>
        <Textarea
          id="comments"
          name="comments"
          rows={3}
          defaultValue={existing?.comments ?? ""}
          placeholder="Additional feedback for this contestant..."
          className="resize-none"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="min-w-32">
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send className="mr-2 size-4" />
              {existing ? "Update Scores" : "Submit Scores"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
