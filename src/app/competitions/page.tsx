import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CompetitionCard } from "@/components/competitions/competition-card";
import { Container } from "@/components/container";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Browse all beauty pageant competitions on GlamWorldFace.",
};

export const dynamic = "force-dynamic";

export default async function CompetitionsPage() {
  const session = await auth();

  const competitions = await prisma.competition.findMany({
    orderBy: [{ status: "asc" }, { startDate: "asc" }],
    include: { _count: { select: { entries: true } } },
  });

  // Group by status for display order: ACTIVE first, then UPCOMING, then COMPLETED
  const active = competitions.filter((c) => c.status === "ACTIVE");
  const upcoming = competitions.filter((c) => c.status === "UPCOMING");
  const completed = competitions.filter((c) => c.status === "COMPLETED");

  const renderSection = (
    title: string,
    items: typeof competitions
  ) =>
    items.length > 0 && (
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CompetitionCard key={c.id} competition={c} />
          ))}
        </div>
      </section>
    );

  return (
    <Container as="section" className="py-12 sm:py-16">
      {/* Page header */}
      <div className="mb-10 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Trophy className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            {session?.user ? "Join a competition and showcase your talent." : "Browse our beauty pageant competitions."}
          </p>
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-20 text-center">
          <Trophy className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No competitions yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {renderSection("Live Now", active)}
          {renderSection("Upcoming", upcoming)}
          {renderSection("Completed", completed)}
        </div>
      )}
    </Container>
  );
}
