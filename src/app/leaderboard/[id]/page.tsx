import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { LeaderboardTable } from "@/components/competitions/leaderboard-table";
import { Trophy, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const comp = await prisma.competition.findUnique({
    where: { id },
    include: {
      entries: {
        where: { approved: true },
        include: { contestant: { include: { user: true } } },
        orderBy: [{ finalScore: "desc" }, { overallScore: "desc" }, { voteCount: "desc" }],
        take: 3,
      },
    },
  });

  if (!comp) return { title: "Leaderboard Not Found" };

  const title = `${comp.title} - Official Leaderboard`;
  
  // Construct a description mentioning the top 3
  let topText = "";
  if (comp.entries.length > 0) {
    const names = comp.entries.map((e, i) => `#${i + 1} ${e.contestant.user.name}`).join(", ");
    topText = ` Current leaders: ${names}.`;
  }
  const description = `View the official leaderboard and results for ${comp.title}.${topText} See who is winning the GlamWorldFace pageant!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: comp.coverImage ? [{ url: comp.coverImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: comp.coverImage ? [comp.coverImage] : undefined,
    },
  };
}

export default async function ShareableLeaderboardPage({ params }: Props) {
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

  const entries = competition.entries.map((entry, idx) => ({
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

  const end = new Date(competition.endDate).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  return (
    <Container as="section" className="py-12 sm:py-20 max-w-4xl">
      <div className="mb-6 flex">
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4">
          <Link href={`/competitions/${id}`}>
            <ChevronLeft className="mr-2 size-4" />
            Back to Competition
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center text-center mb-10 bg-card rounded-2xl border border-border p-8 sm:p-12 shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-yellow-500/10 mb-6">
          <Trophy className="size-8 text-yellow-500" />
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          <StatusBadge status={competition.status} />
          <TypeBadge type={competition.competitionType} />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
          Official Leaderboard
        </h1>
        <h2 className="text-xl font-medium sm:text-2xl text-foreground mb-4">
          {competition.title}
        </h2>
        
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          {competition.status === "COMPLETED" ? `Ended on ${end}` : `Ends on ${end}`}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <LeaderboardTable entries={entries} type={competition.competitionType} />
      </div>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Powered by GlamWorldFace</p>
      </div>
    </Container>
  );
}
