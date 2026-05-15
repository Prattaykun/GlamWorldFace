"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, Loader2, Bot, Info } from "lucide-react";
import { editCompetitionAction, type CompetitionFormState } from "@/app/actions/competition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Competition } from "@/generated/prisma/client";

interface EditCompetitionModalProps {
  competition: Competition & {
    juryAssignments?: { juryUser: { email: string } }[];
  };
}

export function EditCompetitionModal({ competition }: EditCompetitionModalProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CompetitionFormState, FormData>(
    editCompetitionAction,
    null
  );
  
  const [type, setType] = useState<"JURY" | "PUBLIC_VOTING">(
    competition.competitionType as "JURY" | "PUBLIC_VOTING"
  );

  useEffect(() => {
    if (state?.success) {
      toast.success("Competition updated successfully.");
      setOpen(false);
    }
  }, [state]);

  const startDateStr = new Date(competition.startDate).toISOString().slice(0, 16);
  const endDateStr = new Date(competition.endDate).toISOString().slice(0, 16);
  
  // Format existing JSON if present
  let initialThresholds = "";
  if (competition.scoringThresholds) {
    initialThresholds = JSON.stringify(competition.scoringThresholds, null, 2);
  }

  const initialJuryEmails = competition.juryAssignments
    ?.map((a) => a.juryUser.email)
    .join(", ") || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
            <Edit2 className="size-4" />
            <span className="sr-only">Edit Competition</span>
          </Button>
        }
      />
      
      <DialogContent className="max-w-2xl bg-background/80 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Competition</DialogTitle>
          <DialogDescription>
            Update the competition details, status, and timeline.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-6 py-4">
          <input type="hidden" name="id" value={competition.id} />
          
          {state?.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              {state.error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Competition Title</Label>
              <Input
                key={competition.title}
                id="title"
                name="title"
                defaultValue={competition.title}
                placeholder="e.g. Miss World 2026"
                required
              />
              {state?.errors?.title && (
                <p className="text-xs text-destructive">{state.errors.title[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={competition.description || ""}
                placeholder="Describe the competition..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="competitionType">Competition Type</Label>
                <input type="hidden" name="competitionType" value={type} />
                <Select value={type} onValueChange={(val) => setType(val as "JURY" | "PUBLIC_VOTING")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC_VOTING">Public Voting</SelectItem>
                    <SelectItem value="JURY">Jury Scoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={competition.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ACTIVE">Active (Live)</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time</Label>
                <Input
                  key={startDateStr}
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  defaultValue={startDateStr}
                  required
                />
                {state?.errors?.startDate && (
                  <p className="text-xs text-destructive">{state.errors.startDate[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time</Label>
                <Input
                  key={endDateStr}
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  defaultValue={endDateStr}
                  required
                />
                {state?.errors?.endDate && (
                  <p className="text-xs text-destructive">{state.errors.endDate[0]}</p>
                )}
              </div>
            </div>

            {/* ── Scoring Configuration (only visible for JURY type) ── */}
            {type === "JURY" && (
              <div className="space-y-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                  <Bot className="size-4" />
                  AI Scoring Configuration & Jury Assignment
                </div>

                <div className="grid gap-2 mb-4">
                  <Label htmlFor="juryEmails">Jury Member Emails</Label>
                  <Textarea
                    key={initialJuryEmails}
                    id="juryEmails"
                    name="juryEmails"
                    defaultValue={initialJuryEmails}
                    rows={2}
                    placeholder="jury1@example.com, jury2@example.com"
                    className="resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Comma-separated emails of users who have the JURY role.
                  </p>
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
                    defaultValue={competition.scoringCriteria || `Example:
• Focus heavily on international appeal and multilingual ability
• Contestants with verified pageant achievements should score higher on Confidence
• Professional tone in bio is critical — deduct points for informal writing
• Strong emphasis on fitness and wellness lifestyle`}
                    rows={4}
                    placeholder="Enter scoring criteria here..."
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
                    defaultValue={initialThresholds || `{
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
                    rows={6}
                    placeholder="Enter JSON threshold settings here..."
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

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-w-24">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
