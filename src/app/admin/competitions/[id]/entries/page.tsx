import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { EntryList } from "@/components/admin/entry-list";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const comp = await prisma.competition.findUnique({ where: { id }, select: { title: true } });
  return { title: `Entries: ${comp?.title ?? "Competition"} | Admin` };
}

export default async function AdminCompetitionEntriesPage({ params }: Props) {
  const { id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          contestant: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      juryAssignments: {
        include: {
          juryUser: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!competition) notFound();

  // Map to the simplified type expected by the client component
  const mappedEntries = competition.entries.map((e) => ({
    id: e.id,
    approved: e.approved,
    overallScore: e.overallScore,
    finalScore: e.finalScore,
    voteCount: e.voteCount,
    contestant: {
      id: e.contestant.id,
      profileImage: e.contestant.profileImage,
      user: {
        name: e.contestant.user.name,
        email: e.contestant.user.email,
      },
    },
  }));

  const mappedJurors = competition.juryAssignments.map((a) => ({
    id: a.id,
    juryUser: {
      name: a.juryUser.name,
      email: a.juryUser.email,
    },
  }));

  return (
    <Container className="py-12">
      {/* Back link */}
      <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/admin/competitions">
          <ChevronLeft className="mr-1.5 size-4" />
          Back to Competitions
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={competition.status} />
          <TypeBadge type={competition.competitionType} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl mb-1">
          {competition.title}
        </h1>
        <p className="text-muted-foreground">
          Manage {competition.entries.length} contestant entries
          {competition.competitionType === "JURY" &&
            ` · ${competition.juryAssignments.length} juror${competition.juryAssignments.length !== 1 ? "s" : ""} assigned`}
          .
        </p>
      </div>

      <EntryList
        entries={mappedEntries}
        competitionId={id}
        competitionType={competition.competitionType}
        assignedJurors={mappedJurors}
      />
    </Container>
  );
}
