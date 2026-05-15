import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/container";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { Calendar, Users, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Jury Dashboard" };
export const dynamic = "force-dynamic";

export default async function JuryDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const assignments = await prisma.juryAssignment.findMany({
    where: { juryUserId: session.user.id },
    include: {
      competition: {
        include: {
          _count: { select: { entries: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Container className="py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10">
          <Gavel className="size-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Jury Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Competitions you are assigned to score.
          </p>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 py-20 text-center">
          <Gavel className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            You have not been assigned to any competitions yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map(({ competition: c }) => {
            const start = new Date(c.startDate).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            });
            return (
              <div
                key={c.id}
                className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-5"
              >
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={c.status} />
                  <TypeBadge type={c.competitionType} />
                </div>
                <h2 className="text-base font-semibold leading-snug">{c.title}</h2>
                <div className="mt-auto flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" /> {start}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5" /> {c._count.entries} entries
                  </span>
                </div>
                <Button asChild size="sm">
                  <Link href={`/jury/${c.id}`}>Score Contestants</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
