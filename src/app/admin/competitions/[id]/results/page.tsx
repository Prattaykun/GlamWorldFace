import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { DeclareResultsPanel } from "@/components/admin/declare-results-panel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const comp = await prisma.competition.findUnique({ where: { id }, select: { title: true } });
  return { title: `Declare Results: ${comp?.title ?? "Competition"} | Admin` };
}

export default async function AdminCompetitionResultsPage({ params }: Props) {
  const { id } = await params;

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

  // Map entries to the expected format
  const mappedEntries = competition.entries.map((e) => ({
    id: e.id,
    rank: e.rank,
    voteCount: e.voteCount,
    finalScore: e.finalScore,
    overallScore: e.overallScore,
    contestant: {
      id: e.contestant.id,
      profileImage: e.contestant.profileImage,
      country: e.contestant.country,
      user: {
        name: e.contestant.user.name,
      },
    },
  }));

  return (
    <Container className="py-12 max-w-4xl">
      {/* Back link */}
      <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href={`/admin/competitions/${id}/entries`}>
          <ChevronLeft className="mr-1.5 size-4" />
          Back to Entries
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={competition.status} />
          <TypeBadge type={competition.competitionType} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-1">
          Declare Results: {competition.title}
        </h1>
        <p className="text-muted-foreground">
          Review the final standings and announce the winners.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {mappedEntries.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No approved entries to rank.
          </div>
        ) : (
          <DeclareResultsPanel
            competitionId={competition.id}
            competitionType={competition.competitionType}
            resultsAnnounced={competition.resultsAnnounced}
            entries={mappedEntries}
          />
        )}
      </div>
    </Container>
  );
}
