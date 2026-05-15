import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { Trophy } from "lucide-react";
import { CompetitionsList } from "@/components/competitions/competitions-list";

export const metadata: Metadata = {
  title: "Competitions",
  description: "Browse all beauty pageant competitions on GlamWorldFace.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function CompetitionsPage({ searchParams }: PageProps) {
  const session = await auth();

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const search = q?.trim() ?? "";

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      skip,
      take: PAGE_SIZE,
      include: { _count: { select: { entries: true } } },
    }),
    prisma.competition.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
            {session?.user
              ? "Browse and join beauty pageant competitions."
              : "Explore our beauty pageant competitions."}
          </p>
        </div>
      </div>

      <CompetitionsList
        items={competitions.map((c) => ({ competition: c }))}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        basePath="/competitions"
        showParticipation={false}
      />
    </Container>
  );
}
