import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { LeaderboardTable } from "@/components/competitions/leaderboard-table";
import { VoteButton } from "@/components/competitions/vote-button";
import { JoinCompetitionButton } from "@/components/competitions/join-button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({ where: { id }, select: { title: true } });
  return { title: competition?.title ?? "Competition" };
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  // Fetch competition with entries
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      entries: {
        where: { approved: true },
        include: {
          contestant: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
        orderBy: [
          { finalScore: "desc" },
          { overallScore: "desc" },
          { voteCount: "desc" },
        ],
      },
    },
  });

  if (!competition) notFound();

  // User-specific data
  const [contestant, userVote, userEntry] = await Promise.all([
    userId ? prisma.contestant.findUnique({ where: { userId } }) : null,
    userId && competition.competitionType === "PUBLIC_VOTING"
      ? prisma.vote.findUnique({
          where: { competitionId_voterId: { competitionId: id, voterId: userId } },
        })
      : null,
    userId
      ? prisma.competitionEntry.findFirst({
          where: { competitionId: id, contestant: { userId } },
        })
      : null,
  ]);

  const isContestant = userRole === "CONTESTANT";
  const hasVotedAlready = !!userVote;

  // Build leaderboard entries
  const leaderboardEntries = competition.entries.map((entry, idx) => ({
    rank: idx + 1,
    contestantId: entry.contestantId,
    name: entry.contestant.user.name,
    country: entry.contestant.country,
    profileImage: entry.contestant.profileImage,
    score:
      competition.competitionType === "JURY"
        ? (entry.finalScore ?? entry.overallScore)
        : entry.voteCount,
  }));

  const start = new Date(competition.startDate).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  const end = new Date(competition.endDate).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Container as="section" className="py-12 sm:py-16">
      {/* ── Header ── */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={competition.status} />
          <TypeBadge type={competition.competitionType} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">{competition.title}</h1>

        {competition.description && (
          <p className="max-w-2xl text-muted-foreground">{competition.description}</p>
        )}

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <Calendar className="size-4" />
            {start} – {end}
          </span>
          <span className="flex items-center gap-2">
            <Users className="size-4" />
            {competition.entries.length} approved contestant{competition.entries.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Join button for contestants */}
        {isContestant && competition.status !== "COMPLETED" && (
          <div className="pt-2">
            <JoinCompetitionButton
              competitionId={id}
              alreadyJoined={!!userEntry}
              hasProfile={!!contestant}
            />
          </div>
        )}

        {/* Sign-in prompt for unauthenticated public */}
        {!userId && competition.status === "ACTIVE" && (
          <p className="text-sm text-muted-foreground">
            <a href="/auth/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </a>{" "}
            to vote or join this competition.
          </p>
        )}
      </div>

      <Separator />

      {/* ── Tabs: Contestants / Leaderboard ── */}
      <div className="mt-8">
        <Tabs defaultValue="contestants">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="contestants" className="flex-1 sm:flex-none">
              <Users className="mr-2 size-4" />
              Contestants
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex-1 sm:flex-none">
              <Trophy className="mr-2 size-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* ── Contestants Tab ── */}
          <TabsContent value="contestants" className="mt-6">
            {competition.entries.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No approved contestants yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {competition.entries.map((entry) => {
                  const isOwn = entry.contestant.userId === userId;
                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4"
                    >
                      {/* Avatar + name */}
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                          {entry.contestant.profileImage ? (
                            <Image
                              src={entry.contestant.profileImage}
                              alt={entry.contestant.user.name ?? "Contestant"}
                              fill
                              unoptimized={entry.contestant.profileImage.startsWith("/")}
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-sm font-bold text-muted-foreground">
                              {(entry.contestant.user.name ?? "?")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/contestants/${entry.contestant.id}`} className="truncate font-medium hover:text-primary hover:underline transition-colors block">
                            {entry.contestant.user.name ?? "Unknown"}
                          </Link>
                          {entry.contestant.country && (
                            <p className="text-xs text-muted-foreground">{entry.contestant.country}</p>
                          )}
                        </div>
                      </div>

                      {/* Vote count or score */}
                      {competition.competitionType === "PUBLIC_VOTING" && (
                        <p className="text-xs text-muted-foreground">
                          {entry.voteCount.toLocaleString()} vote{entry.voteCount !== 1 ? "s" : ""}
                        </p>
                      )}

                      {/* Vote button */}
                      {competition.competitionType === "PUBLIC_VOTING" &&
                        competition.status === "ACTIVE" &&
                        userId && (
                          <div className="mt-auto">
                            <VoteButton
                              competitionId={id}
                              contestantId={entry.contestantId}
                              hasVoted={hasVotedAlready}
                              isOwn={isOwn}
                            />
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Leaderboard Tab ── */}
          <TabsContent value="leaderboard" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <a
                href={`/leaderboard/${id}`}
                className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
              >
                View Full Shareable Leaderboard →
              </a>
            </div>
            <LeaderboardTable entries={leaderboardEntries} type={competition.competitionType} />
          </TabsContent>
        </Tabs>
      </div>
    </Container>
  );
}
