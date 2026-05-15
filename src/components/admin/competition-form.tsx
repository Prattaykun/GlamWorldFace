"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCompetitionAction, type CompetitionFormState } from "@/app/actions/competition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Bot, Info } from "lucide-react";
import { toast } from "sonner";

export function CompetitionForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<CompetitionFormState, FormData>(
    createCompetitionAction,
    null
  );

  const [type, setType] = useState<"JURY" | "PUBLIC_VOTING">("PUBLIC_VOTING");
  const [status, setStatus] = useState<"UPCOMING" | "ACTIVE" | "COMPLETED">("UPCOMING");

  useEffect(() => {
    if (state?.success) {
      toast.success("Competition created successfully!");
      router.push("/admin/competitions");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-4">
        {/* Title */}
        <div className="grid gap-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" name="title" placeholder="E.g., Global Beauty 2026" required />
          {state?.errors?.title && <p className="text-sm text-destructive">{state.errors.title[0]}</p>}
        </div>

        {/* Description */}
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" placeholder="Describe the competition..." className="min-h-[100px]" />
          {state?.errors?.description && <p className="text-sm text-destructive">{state.errors.description[0]}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Type */}
          <div className="grid gap-2">
            <Label htmlFor="competitionType">Type *</Label>
            <input type="hidden" name="competitionType" value={type} />
            <Select value={type} onValueChange={(val) => { if (val) setType(val as "JURY" | "PUBLIC_VOTING"); }}>
              <SelectTrigger id="competitionType">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC_VOTING">Public Voting</SelectItem>
                <SelectItem value="JURY">Jury Scoring</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.competitionType && <p className="text-sm text-destructive">{state.errors.competitionType[0]}</p>}
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="status">Status *</Label>
            <input type="hidden" name="status" value={status} />
            <Select value={status} onValueChange={(val) => { if (val) setStatus(val as "UPCOMING" | "ACTIVE" | "COMPLETED"); }}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPCOMING">Upcoming</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.status && <p className="text-sm text-destructive">{state.errors.status[0]}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start Date */}
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date *</Label>
            <Input id="startDate" name="startDate" type="datetime-local" required />
            {state?.errors?.startDate && <p className="text-sm text-destructive">{state.errors.startDate[0]}</p>}
          </div>

          {/* End Date */}
          <div className="grid gap-2">
            <Label htmlFor="endDate">End Date *</Label>
            <Input id="endDate" name="endDate" type="datetime-local" required />
            {state?.errors?.endDate && <p className="text-sm text-destructive">{state.errors.endDate[0]}</p>}
          </div>
        </div>

        {/* ── Scoring Configuration (only visible for JURY type) ── */}
        {type === "JURY" && (
          <div className="space-y-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
              <Bot className="size-4" />
              AI Scoring Configuration
            </div>

            <p className="text-xs text-muted-foreground">
              Configure how the AI scores contestants for this competition. These rules are
              injected into the LLM prompt and applied automatically when entries are approved.
            </p>

            {/* Scoring Criteria */}
            <div className="grid gap-2">
              <Label htmlFor="scoringCriteria">Scoring Guidelines</Label>
              <Textarea
                id="scoringCriteria"
                name="scoringCriteria"
                rows={4}
                placeholder={`Example:
• Focus heavily on international appeal and multilingual ability
• Contestants with verified pageant achievements should score higher on Confidence
• Professional tone in bio is critical — deduct points for informal writing
• Strong emphasis on fitness and wellness lifestyle`}
                className="min-h-[120px] resize-none text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Free-text guidelines the AI will follow when scoring each contestant. Be specific.
              </p>
              {state?.errors?.scoringCriteria && (
                <p className="text-sm text-destructive">{state.errors.scoringCriteria[0]}</p>
              )}
            </div>

            {/* Scoring Thresholds (JSON) */}
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="scoringThresholds">Scoring Thresholds (JSON)</Label>
                <span className="text-[10px] text-muted-foreground italic">optional, advanced</span>
              </div>
              <Textarea
                id="scoringThresholds"
                name="scoringThresholds"
                rows={6}
                placeholder={`{
  "minAge": 18,
  "maxAge": 30,
  "requiredGender": "Female",
  "focusAreas": ["fitness", "international appeal"],
  "categoryWeights": {
    "presentation": 1.5,
    "confidence": 1.0,
    "styling": 1.2,
    "profileQuality": 1.0,
    "professionalism": 1.3
  }
}`}
                className="min-h-[160px] resize-none font-mono text-xs"
              />
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0" />
                <span>
                  Structured rules as JSON. Supported fields: <code className="text-[10px] bg-muted px-1 rounded">minAge</code>,{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">maxAge</code>,{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">requiredGender</code>,{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">focusAreas</code> (array),{" "}
                  <code className="text-[10px] bg-muted px-1 rounded">categoryWeights</code> (object with category → multiplier).
                </span>
              </div>
              {state?.errors?.scoringThresholds && (
                <p className="text-sm text-destructive">{state.errors.scoringThresholds[0]}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Competition
        </Button>
      </div>
    </form>
  );
}
