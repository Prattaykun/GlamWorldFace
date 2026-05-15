import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBreakdownChart } from "@/components/dashboard/score-chart";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import {
  ChevronLeft,
  Bot,
  Users,
  Calculator,
  User,
  Clock,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; entryId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { entryId } = await params;
  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: {
      contestant: { include: { user: { select: { name: true } } } },
      competition: { select: { title: true } },
    },
  });
  const name = entry?.contestant?.user?.name ?? "Contestant";
  const comp = entry?.competition?.title ?? "Competition";
  return { title: `Score Analysis: ${name} — ${comp} | Admin` };
}

export default async function AdminEntryScoreDetailPage({ params }: Props) {
  const { id: competitionId, entryId } = await params;

  const entry = await prisma.competitionEntry.findUnique({
    where: { id: entryId },
    include: {
      contestant: {
        include: { user: { select: { name: true, email: true } } },
      },
      competition: {
        select: {
          id: true,
          title: true,
          competitionType: true,
          status: true,
          scoringCriteria: true,
          scoringThresholds: true,
        },
      },
      juryScores: {
        include: {
          jury: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      systemScore: true,
    },
  });

  if (!entry || entry.competitionId !== competitionId) notFound();

  const c = entry.contestant;
  const comp = entry.competition;

  // ── Compute aggregated human scores ──
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

  // ── Final score formula explanation ──
  const hasHuman = !!humanAvg;
  const hasSystem = !!systemData;
  let formulaExplanation = "No scores available yet.";
  if (hasHuman && hasSystem) {
    formulaExplanation = `Final = (Human Avg ${humanAvg!.overall.toFixed(1)} × 1.0 + AI ${systemData!.overall.toFixed(1)} × 0.5) ÷ 1.5 = ${entry.finalScore?.toFixed(2) ?? "—"}`;
  } else if (hasHuman) {
    formulaExplanation = `Final = Human Avg ${humanAvg!.overall.toFixed(1)} (no AI score)`;
  } else if (hasSystem) {
    formulaExplanation = `Final = AI ${systemData!.overall.toFixed(1)} (no jury scores)`;
  }

  return (
    <Container className="py-12 max-w-5xl">
      {/* Back link */}
      <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href={`/admin/competitions/${competitionId}/entries`}>
          <ChevronLeft className="mr-1.5 size-4" />
          Back to Entries
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={comp.status} />
          <TypeBadge type={comp.competitionType} />
        </div>
        <div className="flex items-center gap-4 mb-2">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-border bg-muted">
            {c.profileImage ? (
              <Image src={c.profileImage} alt={c.user.name ?? ""} fill className="object-cover" sizes="56px" />
            ) : (
              <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                {(c.user.name ?? "?")[0].toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.user.name}</h1>
            <p className="text-sm text-muted-foreground">{c.user.email} · {comp.title}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Final Score Summary ── */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calculator className="size-4 text-primary" />
              Final Score Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {entry.finalScore !== null && (
                <div className="text-center">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Final Score</p>
                  <p className="text-5xl font-black text-primary">{entry.finalScore.toFixed(1)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">out of 10</p>
                </div>
              )}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-3">
                  {hasHuman && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1 gap-1.5">
                      <Users className="size-3" />
                      Human Avg: {humanAvg!.overall.toFixed(1)}/10
                      <span className="text-muted-foreground">
                        ({entry.juryScores.length} juror{entry.juryScores.length !== 1 ? "s" : ""})
                      </span>
                    </Badge>
                  )}
                  {hasSystem && (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 gap-1.5">
                      <Bot className="size-3" />
                      AI: {systemData!.overall.toFixed(1)}/10
                      <span className="text-muted-foreground">({sys!.modelName})</span>
                    </Badge>
                  )}
                </div>
                <div className="rounded-lg bg-muted/50 px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase tracking-wider">Formula</p>
                  <p className="text-sm font-mono">{formulaExplanation}</p>
                  {hasHuman && hasSystem && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Weight: Human jury × 1.0, AI system × 0.5, divided by 1.5 for normalized average.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Radar Chart ── */}
        {(hasHuman || hasSystem) && (
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-base">Score Breakdown — Radar View</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScoreBreakdownChart humanScores={humanAvg} systemScores={systemData} />
            </CardContent>
          </Card>
        )}

        {/* ── Individual Jury Scores ── */}
        {entry.juryScores.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4 text-primary" />
                Individual Jury Scores ({entry.juryScores.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Juror</th>
                      <th className="px-4 py-3 text-center font-medium">Present.</th>
                      <th className="px-4 py-3 text-center font-medium">Confid.</th>
                      <th className="px-4 py-3 text-center font-medium">Styling</th>
                      <th className="px-4 py-3 text-center font-medium">Profile</th>
                      <th className="px-4 py-3 text-center font-medium">Profess.</th>
                      <th className="px-4 py-3 text-center font-medium">Overall</th>
                      <th className="px-4 py-3 text-left font-medium">Comments</th>
                      <th className="px-4 py-3 text-right font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {entry.juryScores.map((js) => (
                      <tr key={js.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <User className="size-3.5 text-muted-foreground shrink-0" />
                            <div>
                              <p className="font-medium text-xs">{js.jury.name ?? "Unknown"}</p>
                              <p className="text-[10px] text-muted-foreground">{js.jury.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">{js.presentationScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono">{js.confidenceScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono">{js.stylingScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono">{js.profileScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono">{js.professionalismScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-primary">{js.overallScore.toFixed(1)}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {js.comments ? (
                            <div className="flex items-start gap-1">
                              <MessageSquare className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground line-clamp-2">{js.comments}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Clock className="size-3" />
                            {new Date(js.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── AI System Score Details ── */}
        {sys && (
          <Card>
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-purple-500" />
                AI System Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                  Model: {sys.modelName}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(sys.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Presentation", value: sys.presentationScore },
                  { label: "Confidence", value: sys.confidenceScore },
                  { label: "Styling", value: sys.stylingScore },
                  { label: "Profile Quality", value: sys.profileScore },
                  { label: "Professionalism", value: sys.professionalismScore },
                  { label: "Overall", value: sys.overallScore },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-bold mt-0.5">{item.value.toFixed(1)}</p>
                  </div>
                ))}
              </div>
              {sys.rawOutput && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Raw LLM Output
                  </summary>
                  <pre className="mt-2 rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto max-h-[200px] overflow-y-auto">
                    {sys.rawOutput}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Competition Scoring Config ── */}
        {(comp.scoringCriteria || comp.scoringThresholds) && (
          <Card>
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-base">Competition Scoring Config</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {comp.scoringCriteria && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Guidelines</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{comp.scoringCriteria}</p>
                </div>
              )}
              {comp.scoringThresholds && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Thresholds (JSON)</p>
                  <pre className="rounded-lg bg-muted p-3 text-xs font-mono overflow-x-auto">
                    {JSON.stringify(comp.scoringThresholds, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── No scores message ── */}
        {!hasHuman && !hasSystem && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No scores have been recorded for this entry yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  );
}
