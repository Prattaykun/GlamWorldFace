import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { Trophy, AlertCircle } from "lucide-react";
import { CompetitionsList } from "@/components/competitions/competitions-list";
import type { ParticipationState } from "@/components/competitions/competition-card";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Competitions | Dashboard",
  description: "Browse and join beauty pageant competitions.",
};

const PAGE_SIZE = 10;

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function DashboardCompetitionsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login");

  const role = session.user.role;
  // JURY users belong in the jury dashboard; redirect them there
  if (role === "JURY") redirect("/jury");
  // Admins can view but have no contestant profile; send them to admin area
  if (role === "ADMIN") redirect("/admin/competitions");

  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;
  const search = q?.trim() ?? "";

  // Find contestant profile for the current user
  const contestant = await prisma.contestant.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const where: any = {
    entries: {
      some: {
        contestantId: contestant?.id ?? "none",
      },
    },
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const [competitions, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: [{ status: "asc" }, { startDate: "desc" }],
      skip,
      take: PAGE_SIZE,
      include: {
        _count: { select: { entries: true } },
        // Load this contestant's entry (if any) for participation state
        entries: contestant
          ? {
              where: { contestantId: contestant.id },
              select: { id: true, approved: true },
              take: 1,
            }
          : false,
      },
    }),
    prisma.competition.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Map to CompetitionListItem shape
  const items = competitions.map((c) => {
    const entry = c.entries?.[0] ?? null;
    let participationState: ParticipationState = "not_joined";
    if (entry) {
      participationState = entry.approved ? "approved" : "pending";
    }
    // Strip the entries relation before passing to client (not serialisable shape needed)
    const { entries: _entries, ...rest } = c;
    void _entries;
    return { competition: rest, participationState };
  });

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Trophy className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Track your competition entries and view your status.
          </p>
        </div>
      </div>

      {/* No-profile notice (shown at page level for CONTESTANT without profile) */}
      {role === "CONTESTANT" && !contestant && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Complete your contestant profile first
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              You need to fill in your profile before you can join competitions.{" "}
              <Link
                href="/dashboard/profile"
                className="font-medium underline underline-offset-2"
              >
                Set up profile →
              </Link>
            </p>
          </div>
        </div>
      )}

      <CompetitionsList
        items={items}
        total={total}
        page={page}
        totalPages={totalPages}
        search={search}
        basePath="/dashboard/competitions"
        showParticipation={true}
        hasContestantProfile={!!contestant}
      />
    </section>
  );
}
