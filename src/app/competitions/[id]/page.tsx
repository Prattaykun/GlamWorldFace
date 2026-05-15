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

          <TabsContent value="contestants" className="mt-6">
            {competition.entries.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No approved contestants yet.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {competition.entries.map((entry) => {
                  const isOwn = entry.contestant.userId === userId;
                  const name = entry.contestant.user.name ?? "Unknown";
                  return (
                    <div
                      key={entry.id}
                      className="relative overflow-hidden flex flex-col gap-0 rounded-2xl border border-border/80 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                      {/* Profile image */}
                      <Link
                        href={`/contestants/${entry.contestantId}/vote/${id}`}
                        className="relative block aspect-[3/4] w-full overflow-hidden bg-muted"
                      >
                        {entry.contestant.profileImage ? (
                          <Image
                            src={entry.contestant.profileImage}
                            alt={name}
                            fill
                            unoptimized={entry.contestant.profileImage.startsWith("/")}
                            className="object-cover transition-transform duration-500 hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-5xl font-black text-primary/30">
                            {name[0].toUpperCase()}
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
                        {/* Name on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="font-semibold leading-tight">{name}</p>
                          {entry.contestant.country && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {entry.contestant.country}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-2 border-t border-border/60 p-3">
                        {/* Vote count */}
                        {competition.competitionType === "PUBLIC_VOTING" && (
                          <span className="text-xs text-muted-foreground">
                            ❤️ {entry.voteCount.toLocaleString()} vote{entry.voteCount !== 1 ? "s" : ""}
                          </span>
                        )}

                        <div className="ml-auto flex items-center gap-2">
                          <Link
                            href={`/contestants/${entry.contestantId}/vote/${id}`}
                            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            View →
                          </Link>
                          {/* Vote button (only for public voting, active, and authenticated non-owners) */}
                          {competition.competitionType === "PUBLIC_VOTING" &&
                            competition.status === "ACTIVE" &&
                            userId &&
                            !isOwn && (
                              <VoteButton
                                competitionId={id}
                                contestantId={entry.contestantId}
                                hasVoted={hasVotedAlready}
                                isOwn={isOwn}
                              />
                            )}
                        </div>
                      </div>
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
