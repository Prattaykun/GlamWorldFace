import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trophy, MapPin, AtSign, Globe, Info, Ruler, Eye, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const contestant = await prisma.contestant.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  if (!contestant) return { title: "Contestant Not Found" };

  const name = contestant.user.name || "Contestant Profile";
  const bio = contestant.bio || `View ${name}'s profile and competition results on GlamWorldFace.`;
  const image = contestant.profileImage || "/placeholder-avatar.png";

  return {
    title: `${name}`,
    description: bio,
    openGraph: {
      title: `${name} | GlamWorldFace`,
      description: bio,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | GlamWorldFace`,
      description: bio,
      images: [image],
    },
  };
}

export default async function ContestantProfilePage({ params }: Props) {
  const { id } = await params;

  const contestant = await prisma.contestant.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      images: {
        orderBy: { createdAt: "asc" },
      },
      entries: {
        where: { approved: true },
        include: {
          competition: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!contestant) notFound();

  const name = contestant.user.name || "Unknown Contestant";
  const faceImages = contestant.images.filter((img) => img.imageType === "FACE");
  const bodyImages = contestant.images.filter((img) => img.imageType === "FULL_BODY");

  // Determine a 'best rank' safely by picking the entry with the highest score/votes or best existing rank.
  // We'll just highlight entries with high votes or scores as achievements.
  const achievements = contestant.entries.map(e => {
    let text = "";
    if (e.competition.competitionType === "JURY" && e.overallScore) {
      text = `Score: ${e.overallScore.toFixed(1)}`;
    } else if (e.competition.competitionType === "PUBLIC_VOTING" && e.voteCount > 0) {
      text = `${e.voteCount.toLocaleString()} Votes`;
    }
    return { ...e, statText: text };
  });

  return (
    <Container as="article" className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* ── Header / Hero Profile ── */}
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-left">
          {/* Avatar */}
          <div className="relative size-40 shrink-0 overflow-hidden rounded-full border-4 border-background bg-muted shadow-xl sm:size-52">
            {contestant.profileImage ? (
              <Image
                src={contestant.profileImage}
                alt={name}
                fill
                unoptimized={contestant.profileImage.startsWith("/")}
                className="object-cover"
                sizes="(max-width: 640px) 160px, 208px"
                priority
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-primary/10 text-6xl font-bold text-primary">
                {name[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 pt-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{name}</h1>
              {contestant.country && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-lg text-muted-foreground md:justify-start">
                  <MapPin className="size-5 text-primary" />
                  {contestant.country}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              {contestant.instagram && (
                <a
                  href={`https://instagram.com/${contestant.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-muted"
                >
                  <AtSign className="size-4 text-pink-600 dark:text-pink-400" />
                  @{contestant.instagram}
                </a>
              )}
              {contestant.portfolioUrl && (
                <a
                  href={contestant.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium hover:bg-muted"
                >
                  <Globe className="size-4 text-blue-600 dark:text-blue-400" />
                  Portfolio
                </a>
              )}
            </div>

            {contestant.bio && (
              <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground md:mx-0">
                {contestant.bio}
              </p>
            )}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="grid gap-10 md:grid-cols-[1fr_300px]">
          {/* ── Left Column: Media & Competitions ── */}
          <div className="space-y-10">
            
            {/* Face Images */}
            {faceImages.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                  <UserIcon className="size-5 text-primary" /> Portfolios (Face)
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {faceImages.map((img) => (
                    <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                      <Image
                        src={img.imageUrl}
                        alt="Face image"
                        fill
                        unoptimized={img.imageUrl.startsWith("/")}
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Body Images */}
            {bodyImages.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                  <UserIcon className="size-5 text-primary" /> Portfolios (Full Body)
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {bodyImages.map((img) => (
                    <div key={img.id} className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
                      <Image
                        src={img.imageUrl}
                        alt="Full body image"
                        fill
                        unoptimized={img.imageUrl.startsWith("/")}
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Competitions */}
            <section>
              <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
                <Trophy className="size-5 text-yellow-500" /> Competitions
              </h2>
              {achievements.length === 0 ? (
                <p className="text-muted-foreground bg-muted/50 p-6 rounded-xl border border-dashed border-border text-center">
                  Has not entered any competitions yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {achievements.map((entry) => (
                    <Link
                      key={entry.id}
                      href={`/competitions/${entry.competitionId}`}
                      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <StatusBadge status={entry.competition.status} />
                        <TypeBadge type={entry.competition.competitionType} />
                      </div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {entry.competition.title}
                      </h3>
                      {entry.statText && (
                        <div className="mt-auto pt-4">
                          <Badge variant="secondary" className="bg-primary/10 text-primary">
                            {entry.statText}
                          </Badge>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* ── Right Column: Physical Stats ── */}
          <div>
            <Card className="sticky top-24 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
                  <Info className="size-5 text-primary" /> Physical Attributes
                </h3>
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground flex items-center gap-1.5"><Ruler className="size-4" /> Height</dt>
                    <dd className="font-medium">{contestant.height ? `${contestant.height} cm` : "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Weight</dt>
                    <dd className="font-medium">{contestant.weight ? `${contestant.weight} kg` : "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Age</dt>
                    <dd className="font-medium">{contestant.age ? `${contestant.age} yrs` : "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Gender</dt>
                    <dd className="font-medium capitalize">{contestant.gender || "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground">Body Type</dt>
                    <dd className="font-medium capitalize">{contestant.bodyType || "—"}</dd>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-2">
                    <dt className="text-muted-foreground flex items-center gap-1.5"><Eye className="size-4" /> Eye Color</dt>
                    <dd className="font-medium capitalize">{contestant.eyeColor || "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Hair Color</dt>
                    <dd className="font-medium capitalize">{contestant.hairColor || "—"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
