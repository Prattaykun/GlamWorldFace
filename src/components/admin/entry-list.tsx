"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { approveEntryAction } from "@/app/actions/competition";
import { triggerSystemScoreAction, assignJuryAction } from "@/app/actions/jury";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, X, Bot, Loader2, UserPlus, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import type { CompetitionType } from "@/generated/prisma/client";

type EntryData = {
  id: string;
  approved: boolean;
  overallScore: number | null;
  finalScore: number | null;
  voteCount: number;
  contestant: {
    id: string;
    profileImage: string | null;
    user: { name: string | null; email: string };
  };
};

type JuryMember = {
  id: string;
  juryUser: { name: string | null; email: string };
};

interface EntryListProps {
  entries: EntryData[];
  competitionId: string;
  competitionType: CompetitionType;
  assignedJurors: JuryMember[];
}

export function EntryList({
  entries: initialEntries,
  competitionId,
  competitionType,
  assignedJurors: initialJurors,
}: EntryListProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [jurors, setJurors] = useState(initialJurors);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [juryEmail, setJuryEmail] = useState("");
  const [assigningJury, setAssigningJury] = useState(false);

  const handleApprove = async (id: string, approve: boolean) => {
    setLoadingId(`approve-${id}`);
    try {
      await approveEntryAction(id, approve);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, approved: approve } : e))
      );
      if (approve) {
        toast.success("Entry approved! AI scoring will run automatically.");
      } else {
        toast.success("Entry rejected.");
      }
    } catch {
      toast.error("Failed to update entry status.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleSystemScore = async (id: string) => {
    setLoadingId(`score-${id}`);
    try {
      const result = await triggerSystemScoreAction(id, true);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AI system score generated! Reloading…");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to generate system score.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleAssignJury = async () => {
    if (!juryEmail.trim()) return;
    setAssigningJury(true);
    try {
      const result = await assignJuryAction(competitionId, juryEmail.trim());
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Jury member ${juryEmail} assigned!`);
        setJuryEmail("");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to assign jury.");
    } finally {
      setAssigningJury(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Jury Assignment Section (only for JURY competitions) */}
      {competitionType === "JURY" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <UserPlus className="size-4 text-purple-500" />
            Assigned Jurors ({jurors.length})
          </h3>

          {jurors.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {jurors.map((j) => (
                <Badge
                  key={j.id}
                  variant="secondary"
                  className="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                >
                  {j.juryUser.name ?? j.juryUser.email}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              type="email"
              value={juryEmail}
              onChange={(e) => setJuryEmail(e.target.value)}
              placeholder="Enter jury member's email…"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAssignJury();
                }
              }}
            />
            <Button
              size="sm"
              onClick={handleAssignJury}
              disabled={assigningJury || !juryEmail.trim()}
              className="shrink-0"
            >
              {assigningJury ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <UserPlus className="mr-1.5 size-3.5" />
              )}
              Assign
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            The user must already have the JURY role. Set it via the database if needed.
          </p>
        </div>
      )}

      {/* Entries Table */}
      {entries.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No entries found for this competition.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Contestant</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">
                  {competitionType === "JURY" ? "Final Score" : "Votes"}
                </th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.id} className="transition-colors hover:bg-muted/30">
                  {/* Contestant Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {entry.contestant.profileImage ? (
                          <Image
                            src={entry.contestant.profileImage}
                            alt={entry.contestant.user.name ?? "Contestant"}
                            fill
                            unoptimized={entry.contestant.profileImage.startsWith("/")}
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                            {(entry.contestant.user.name ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{entry.contestant.user.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.contestant.user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    {entry.approved ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                        Pending
                      </Badge>
                    )}
                  </td>

                  {/* Score / Votes */}
                  <td className="px-6 py-4 font-medium">
                    {competitionType === "JURY" ? (
                      entry.finalScore !== null ? (
                        <span className="text-primary">{entry.finalScore.toFixed(1)}</span>
                      ) : entry.overallScore !== null ? (
                        <span className="text-muted-foreground">{entry.overallScore.toFixed(1)} (legacy)</span>
                      ) : (
                        <span className="text-muted-foreground font-normal">Not scored</span>
                      )
                    ) : (
                      entry.voteCount.toLocaleString()
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Approve / Reject */}
                      {!entry.approved ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                          onClick={() => handleApprove(entry.id, true)}
                          disabled={loadingId !== null}
                        >
                          {loadingId === `approve-${entry.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleApprove(entry.id, false)}
                          disabled={loadingId !== null}
                        >
                          {loadingId === `approve-${entry.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                          Revoke
                        </Button>
                      )}

                      {/* AI System Score Re-trigger (JURY & Approved) */}
                      {competitionType === "JURY" && entry.approved && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 gap-1"
                            onClick={() => handleSystemScore(entry.id)}
                            disabled={loadingId !== null}
                            title="Re-generate AI score (overrides previous)"
                          >
                            {loadingId === `score-${entry.id}` ? <Loader2 className="size-3.5 animate-spin" /> : <Bot className="size-3.5" />}
                            Re-score AI
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                          >
                            <Link href={`/admin/competitions/${competitionId}/entries/${entry.id}`}>
                              <BarChart3 className="size-3.5" />
                              Scores
                            </Link>
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
