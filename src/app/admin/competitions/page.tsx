import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { Plus, Users, Settings, Trophy } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/competitions/status-badge";
import { EditCompetitionModal } from "@/components/admin/edit-competition-modal";

export const metadata = {
  title: "Manage Competitions | Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminCompetitionsPage() {
  const competitions = await prisma.competition.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { entries: true },
      },
    },
  });

  return (
    <Container className="py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Competitions Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all beauty pageants and review entries.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/competitions/create">
            <Plus className="mr-2 size-4" />
            New Competition
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {competitions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No competitions found. Create one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Dates</th>
                  <th className="px-6 py-4 font-medium text-right">Entries</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {competitions.map((comp) => (
                  <tr key={comp.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{comp.title}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={comp.status} />
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={comp.competitionType} />
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(comp.startDate).toLocaleDateString()} -{" "}
                      {new Date(comp.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-medium">
                        <Users className="size-3.5 text-muted-foreground" />
                        {comp._count.entries}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <EditCompetitionModal competition={comp} />
                        <Button asChild variant="secondary" size="sm" className="h-8 text-xs">
                          <Link href={`/admin/competitions/${comp.id}/entries`}>
                            <Settings className="mr-1.5 size-3" />
                            Manage
                          </Link>
                        </Button>
                        <Button asChild variant="default" size="sm" className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700">
                          <Link href={`/admin/competitions/${comp.id}/results`}>
                            <Trophy className="mr-1.5 size-3" />
                            Results
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Container>
  );
}
