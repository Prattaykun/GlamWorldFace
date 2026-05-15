import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
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
  Trophy,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ competitionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitionId } = await params;
  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { title: true },
  });
  return {
    title: `My Scores: ${comp?.title ?? "Competition"} | Dashboard`,
  };
}

export default async function ContestantScoreAnalysisPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { competitionId } = await params;

  const contestant = await prisma.contestant.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!contestant) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>
          Complete your{" "}
          <Link href="/dashboard/profile" className="text-primary underline">
            contestant profile
          </Link>{" "}
          to see score analysis.
        </p>
      </div>
    );
  }

  const entry = await prisma.competitionEntry.findFirst({
    where: { contestantId: contestant.id, competitionId },
    include: {
      competition: true,
      juryScores: {
        include: {
          jury: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      systemScore: true,
    },
  });

  if (!entry) notFound();

  const comp = entry.competition;
  const isJury = comp.competitionType === "JURY";

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

  const hasHuman = !!humanAvg;
  const hasSystem = !!systemData;
  const hasAnyScores = hasHuman || hasSystem;

  // ── Strongest & weakest categories ──
  function getStrengthInsight(scores: typeof humanAvg) {
    if (!scores) return null;
    const cats = [
      { name: "Presentation", val: scores.presentation },
      { name: "Confidence", val: scores.confidence },
      { name: "Styling", val: scores.styling },
      { name: "Profile Quality", val: scores.profileQuality },
      { name: "Professionalism", val: scores.professionalism },
    ];
    const sorted = [...cats].sort((a, b) => b.val - a.val);
    return { strongest: sorted[0], weakest: sorted[sorted.length - 1] };
  }

  const humanInsight = getStrengthInsight(humanAvg);
  const aiInsight = getStrengthInsight(systemData);

  return (
    <section className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" className="-ml-2 text-muted-foreground hover:text-foreground">
        <Link href="/dashboard/competitions">
          <ChevronLeft className="mr-1.5 size-4" />
          My Competitions
        </Link>
      </Button>

      {/* Header */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={comp.status} />
          <TypeBadge type={comp.competitionType} />
          {entry.approved && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              <ShieldCheck className="mr-1 size-3" />
              Approved
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-1">
          Score Analysis
        </h1>
        <p className="text-sm text-muted-foreground">{comp.title}</p>
      </div>

      {/* Results announced banner */}
      {comp.resultsAnnounced && entry.rank && (
        <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 p-5">
          <Trophy className={cn("size-8 shrink-0", entry.rank === 1 ? "text-yellow-500" : entry.rank === 2 ? "text-slate-400" : entry.rank === 3 ? "text-amber-600" : "text-muted-foreground")} />
          <div>
            <p className="font-bold text-lg">Official Position: #{entry.rank}</p>
            <p className="text-sm text-muted-foreground">Results have been officially announced.</p>
          </div>
        </div>
      )}

      {!isJury ? (
        /* ── Public Voting competitions ── */
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <p className="text-4xl font-black text-primary">{entry.voteCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">total vote{entry.voteCount !== 1 ? "s" : ""} received</p>
          </CardContent>
        </Card>
      ) : !hasAnyScores ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Bot className="mx-auto mb-3 size-10 text-muted-foreground/40" />
            <p className="font-medium">No scores available yet</p>
            <p className="text-sm mt-1">Jury scoring and AI analysis are still pending for this competition.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Final Score Card ── */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="size-4 text-primary" />
                Final Score
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                {entry.finalScore !== null && (
                  <div className="text-center">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Final</p>
                    <p className="text-5xl font-black text-primary">{entry.finalScore.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">out of 10</p>
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {hasHuman && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1 gap-1.5">
                        <Users className="size-3" />
                        Jury Avg: {humanAvg!.overall.toFixed(1)}/10
                        <span className="text-muted-foreground">
                          ({entry.juryScores.length} juror{entry.juryScores.length !== 1 ? "s" : ""})
                        </span>
                      </Badge>
                    )}
                    {hasSystem && (
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 gap-1.5">
                        <Bot className="size-3" />
                        AI: {systemData!.overall.toFixed(1)}/10
                      </Badge>
                    )}
                  </div>

                  {/* Insight cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {humanInsight && (
                      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Jury Strongest</p>
                        <p className="text-sm font-medium mt-0.5">{humanInsight.strongest.name}: {humanInsight.strongest.val.toFixed(1)}</p>
                      </div>
                    )}
                    {humanInsight && (
                      <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">Jury Needs Work</p>
                        <p className="text-sm font-medium mt-0.5">{humanInsight.weakest.name}: {humanInsight.weakest.val.toFixed(1)}</p>
                      </div>
                    )}
                    {aiInsight && (
                      <div className="rounded-lg bg-purple-500/5 border border-purple-500/10 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-semibold">AI Strongest</p>
                        <p className="text-sm font-medium mt-0.5">{aiInsight.strongest.name}: {aiInsight.strongest.val.toFixed(1)}</p>
                      </div>
                    )}
                    {aiInsight && (
                      <div className="rounded-lg bg-rose-500/5 border border-rose-500/10 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">AI Needs Work</p>
                        <p className="text-sm font-medium mt-0.5">{aiInsight.weakest.name}: {aiInsight.weakest.val.toFixed(1)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Radar Chart ── */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-base">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ScoreBreakdownChart humanScores={humanAvg} systemScores={systemData} />
            </CardContent>
          </Card>

          {/* ── Individual Jury Feedback ── */}
          {entry.juryScores.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" />
                  Jury Feedback ({entry.juryScores.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border">
                {entry.juryScores.map((js, idx) => (
                  <div key={js.id} className="p-5 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{js.jury.name ?? "Anonymous Juror"}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {new Date(js.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase">Overall</p>
                        <p className="text-xl font-bold text-primary">{js.overallScore.toFixed(1)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { l: "Present.", v: js.presentationScore },
                        { l: "Confid.", v: js.confidenceScore },
                        { l: "Styling", v: js.stylingScore },
                        { l: "Profile", v: js.profileScore },
                        { l: "Profess.", v: js.professionalismScore },
                      ].map((item) => (
                        <div key={item.l} className="text-center rounded-md bg-muted/50 py-1.5">
                          <p className="text-[9px] text-muted-foreground">{item.l}</p>
                          <p className="text-sm font-semibold">{item.v.toFixed(1)}</p>
                        </div>
                      ))}
                    </div>
                    {js.comments && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2.5">
                        <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground leading-relaxed">{js.comments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ── AI Score Card ── */}
          {sys && (
            <Card className="lg:col-span-2">
              <CardHeader className="border-b border-border bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="size-4 text-purple-500" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">
                  Model: {sys.modelName}
                </Badge>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Presentation", value: sys.presentationScore },
                    { label: "Confidence", value: sys.confidenceScore },
                    { label: "Styling", value: sys.stylingScore },
                    { label: "Profile Quality", value: sys.profileScore },
                    { label: "Professionalism", value: sys.professionalismScore },
                    { label: "Overall", value: sys.overallScore },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-muted/50 px-4 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className={cn("text-lg font-bold mt-0.5", item.label === "Overall" && "text-purple-500")}>{item.value.toFixed(1)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
