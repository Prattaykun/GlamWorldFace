import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { JuryScoringForm } from "@/components/jury/scoring-form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ExternalLink, User } from "lucide-react";

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
  return { title: `Score: ${comp?.title ?? "Competition"} | Jury` };
}

export default async function JuryCompetitionPage({ params }: Props) {
  const { competitionId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  // Verify jury assignment
  const assignment = await prisma.juryAssignment.findUnique({
    where: {
      competitionId_juryUserId: {
        competitionId,
        juryUserId: session.user.id,
      },
    },
  });

  if (!assignment) notFound();

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) notFound();

  // Get all approved entries with contestant data
  const entries = await prisma.competitionEntry.findMany({
    where: { competitionId, approved: true },
    include: {
      contestant: {
        include: {
          user: { select: { name: true } },
          images: { take: 3, orderBy: { createdAt: "asc" } },
        },
      },
      juryScores: {
        where: { juryId: session.user.id },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <Container className="py-12 max-w-5xl">
      <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/jury">
          <ChevronLeft className="mr-1.5 size-4" />
          Back to Jury Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-1">
          {competition.title}
        </h1>
        <p className="text-muted-foreground">
          Score {entries.length} approved contestant{entries.length !== 1 ? "s" : ""} below.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">
          No approved contestants to score yet.
        </p>
      ) : (
        <div className="space-y-8">
          {entries.map((entry, idx) => {
            const myScore = entry.juryScores[0] ?? null;
            const contestant = entry.contestant;

            return (
              <div
                key={entry.id}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Contestant header */}
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {contestant.profileImage ? (
                        <Image
                          src={contestant.profileImage}
                          alt={contestant.user.name ?? "Contestant"}
                          fill
                          unoptimized={contestant.profileImage.startsWith("/")}
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-lg font-bold text-muted-foreground">
                          {(contestant.user.name ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold">
                        #{idx + 1} {contestant.user.name ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {contestant.country ?? "Country not set"} · {contestant.occupation ?? "Occupation not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {myScore && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Scored: {myScore.overallScore.toFixed(1)}
                      </Badge>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/contestants/${contestant.id}`} target="_blank">
                        <User className="mr-1.5 size-3.5" />
                        View Profile
                        <ExternalLink className="ml-1.5 size-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Contestant quick info */}
                <div className="p-6 space-y-4">
                  {contestant.bio && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Bio</p>
                      <p className="text-sm text-foreground/80 line-clamp-3">{contestant.bio}</p>
                    </div>
                  )}

                  {/* Gallery thumbnails */}
                  {contestant.images.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {contestant.images.map((img) => (
                        <div key={img.id} className="relative size-20 shrink-0 rounded-lg overflow-hidden border border-border bg-muted">
                          <Image
                            src={img.imageUrl}
                            alt="Contestant image"
                            fill
                            unoptimized={img.imageUrl.startsWith("/")}
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {contestant.instagram && (
                    <a
                      href={`https://instagram.com/${contestant.instagram}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      @{contestant.instagram}
                      <ExternalLink className="size-3" />
                    </a>
                  )}

                  <Separator />

                  {/* Scoring form */}
                  <div>
                    <h3 className="text-base font-semibold mb-4">
                      {myScore ? "Update Your Scores" : "Submit Your Scores"}
                    </h3>
                    <JuryScoringForm
                      entryId={entry.id}
                      existing={
                        myScore
                          ? {
                              presentationScore: myScore.presentationScore,
                              confidenceScore: myScore.confidenceScore,
                              stylingScore: myScore.stylingScore,
                              profileScore: myScore.profileScore,
                              professionalismScore: myScore.professionalismScore,
                              comments: myScore.comments,
                            }
                          : null
                      }
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
