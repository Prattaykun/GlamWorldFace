import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { VotableProfileCard } from "@/components/competitions/votable-profile-card";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; competitionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, competitionId } = await params;

  const entry = await prisma.competitionEntry.findFirst({
    where: { contestantId: id, competitionId, approved: true },
    include: {
      contestant: { include: { user: { select: { name: true } } } },
      competition: { select: { title: true } },
    },
  });

  if (!entry) return { title: "Contestant" };

  const name = entry.contestant.user.name ?? "Contestant";
  const bio =
    entry.contestant.bio ??
    `Vote for ${name} in ${entry.competition.title} on GlamWorldFace.`;
  const image = entry.contestant.profileImage ?? "";

  return {
    title: `Vote for ${name} | ${entry.competition.title}`,
    description: bio,
    openGraph: {
      title: `Vote for ${name} | GlamWorldFace`,
      description: bio,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Vote for ${name} | GlamWorldFace`,
      description: bio,
      images: image ? [image] : [],
    },
  };
}

export default async function VotableEntryPage({ params }: Props) {
  const { id: contestantId, competitionId } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  // Load entry with full contestant + competition data
  const entry = await prisma.competitionEntry.findFirst({
    where: { contestantId, competitionId, approved: true },
    include: {
      contestant: {
        include: {
          user: { select: { name: true } },
          images: { orderBy: { createdAt: "asc" } },
        },
      },
      competition: {
        select: {
          id: true,
          title: true,
          competitionType: true,
          status: true,
        },
      },
    },
  });

  if (!entry) notFound();

  // Check if current user has voted in this competition
  const [userVote, isOwnEntry] = await Promise.all([
    userId && entry.competition.competitionType === "PUBLIC_VOTING"
      ? prisma.vote.findUnique({
          where: {
            competitionId_voterId: { competitionId, voterId: userId },
          },
        })
      : null,
    userId ? entry.contestant.userId === userId : false,
  ]);

  const c = entry.contestant;

  return (
    <Container as="section" className="py-8 sm:py-12">
      {/* Back nav */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" asChild>
          <Link href={`/competitions/${competitionId}`}>
            <ArrowLeft className="size-4" />
            Back to competition
          </Link>
        </Button>

        {/* Share button (client-side Web Share API) */}
        <ShareButton
          url={typeof window === "undefined" ? "" : window.location.href}
          name={c.user.name ?? "Contestant"}
        />
      </div>

      <VotableProfileCard
        contestant={{
          id: c.id,
          name: c.user.name,
          country: c.country,
          bio: c.bio,
          age: c.age,
          height: c.height,
          weight: c.weight,
          bodyType: c.bodyType,
          gender: c.gender,
          instagram: c.instagram,
          portfolioUrl: c.portfolioUrl,
          profileImage: c.profileImage,
          goals: c.goals,
          achievements: c.achievements,
          personality: c.personality,
          occupation: c.occupation,
          images: c.images,
        }}
        competition={entry.competition}
        hasVoted={!!userVote}
        isOwn={!!isOwnEntry}
        isAuthenticated={!!userId}
        contestantId={contestantId}
      />

      {/* Competition link footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Part of{" "}
          <Link
            href={`/competitions/${competitionId}`}
            className="font-medium text-primary hover:underline"
          >
            {entry.competition.title}
          </Link>
        </p>
      </div>
    </Container>
  );
}

// ── Inline share button (client component) ────────────────────
// Small enough to keep inline rather than a separate file

import { ShareButtonClient } from "@/components/competitions/share-button";

function ShareButton({ url: _url, name }: { url: string; name: string }) {
  // We render the client component here — it reads window.location.href itself
  return <ShareButtonClient name={name} />;
}
