import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { ScoreBreakdownChart } from "@/components/dashboard/score-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, BarChart3 } from "lucide-react";
import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";

export const metadata: Metadata = { title: "My Results" };
export const dynamic = "force-dynamic";

export default async function ResultsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const contestant = await prisma.contestant.findUnique({
    where: { userId: session.user.id },
  });

  if (!contestant) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
        <p className="text-muted-foreground">
          Complete your{" "}
          <Link href="/dashboard/profile" className="text-primary underline">
            contestant profile
          </Link>{" "}
          to see results.
        </p>
      </div>
    );
  }

  // Fetch all approved competition entries with scores
  const entries = await prisma.competitionEntry.findMany({
    where: { contestantId: contestant.id, approved: true },
    include: {
      competition: true,
      juryScores: true,
      systemScore: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <BarChart3 className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
          <p className="text-sm text-muted-foreground">
            Detailed score breakdown for your competition entries.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed border-border">
          <Trophy className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p>You haven't been scored in any competitions yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {entries.map((entry) => {
            // Aggregate human jury scores
            let humanAvg: {
              presentation: number;
              confidence: number;
              styling: number;
              profileQuality: number;
              professionalism: number;
              overall: number;
            } | null = null;

            if (entry.juryScores.length > 0) {
              const count = entry.juryScores.length;
              const sum = entry.juryScores.reduce(
                (acc, s) => ({
                  presentation: acc.presentation + s.presentationScore,
                  confidence: acc.confidence + s.confidenceScore,
                  styling: acc.styling + s.stylingScore,
                  profileQuality: acc.profileQuality + s.profileScore,
                  professionalism: acc.professionalism + s.professionalismScore,
                  overall: acc.overall + s.overallScore,
                }),
                { presentation: 0, confidence: 0, styling: 0, profileQuality: 0, professionalism: 0, overall: 0 }
              );
              humanAvg = {
                presentation: Math.round((sum.presentation / count) * 10) / 10,
                confidence: Math.round((sum.confidence / count) * 10) / 10,
                styling: Math.round((sum.styling / count) * 10) / 10,
                profileQuality: Math.round((sum.profileQuality / count) * 10) / 10,
                professionalism: Math.round((sum.professionalism / count) * 10) / 10,
                overall: Math.round((sum.overall / count) * 10) / 10,
              };
            }

            const sys = entry.systemScore;
            const systemData = sys
              ? {
                  presentation: sys.presentationScore,
                  confidence: sys.confidenceScore,
                  styling: sys.stylingScore,
                  profileQuality: sys.profileScore,
                  professionalism: sys.professionalismScore,
                  overall: sys.overallScore,
                }
              : null;

            return (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <StatusBadge status={entry.competition.status} />
                        <TypeBadge type={entry.competition.competitionType} />
                      </div>
                      <CardTitle className="text-lg">
                        <Link
                          href={`/competitions/${entry.competitionId}`}
                          className="hover:text-primary hover:underline transition-colors"
                        >
                          {entry.competition.title}
                        </Link>
                      </CardTitle>
                    </div>
                    {entry.finalScore !== null && (
                      <div className="text-center sm:text-right">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Final Score
                        </p>
                        <p className="text-3xl font-bold text-primary">
                          {entry.finalScore.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Score pills */}
                  <div className="flex flex-wrap gap-3">
                    {humanAvg && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary gap-1.5 px-3 py-1">
                        Human Avg: {humanAvg.overall.toFixed(1)}/10
                        <span className="text-muted-foreground">
                          ({entry.juryScores.length} juror{entry.juryScores.length !== 1 ? "s" : ""})
                        </span>
                      </Badge>
                    )}
                    {systemData && (
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 gap-1.5 px-3 py-1">
                        AI Score: {systemData.overall.toFixed(1)}/10
                      </Badge>
                    )}
                  </div>

                  {/* Radar chart */}
                  {(humanAvg || systemData) && (
                    <ScoreBreakdownChart
                      humanScores={humanAvg}
                      systemScores={systemData}
                    />
                  )}

                  {!humanAvg && !systemData && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No scores available yet for this competition.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
