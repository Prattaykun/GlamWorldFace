import Link from "next/link";
import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Shield,
  Users,
  Trophy,
  Plus,
  CheckCircle2,
  Clock,
  Activity,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Manage competitions, users, and platform settings.",
};

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Live counts
  const [userCount, competitionCount, pendingEntries, activeCompetitions] =
    await Promise.all([
      prisma.user.count(),
      prisma.competition.count(),
      prisma.competitionEntry.count({ where: { approved: false } }),
      prisma.competition.count({ where: { status: "ACTIVE" } }),
    ]);

  const statCards = [
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Competitions",
      value: competitionCount,
      icon: Trophy,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      label: "Live Now",
      value: activeCompetitions,
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Entries",
      value: pendingEntries,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const actionCards = [
    {
      title: "Manage Competitions",
      description: "Create, edit, and manage all competitions. Approve or reject contestant entries.",
      icon: Trophy,
      href: "/admin/competitions",
      cta: "Go to Competitions",
    },
    {
      title: "Manage Users",
      description: "View all registered users, change roles, and manage access.",
      icon: Users,
      href: "/admin/users",
      cta: "Go to Users",
    },
  ];

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Platform overview and management
            </p>
          </div>
        </div>

        <Link
          href="/admin/competitions/create"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30 active:scale-95"
        >
          <Plus className="size-4" />
          New Competition
        </Link>
      </div>

      {/* Live stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-4"
          >
            <div className={`flex size-9 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`size-4 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending entries alert */}
      {pendingEntries > 0 && (
        <Link
          href="/admin/competitions"
          className="flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 transition-colors hover:bg-amber-500/12"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Clock className="size-4 text-amber-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-amber-700 dark:text-amber-300">
              {pendingEntries} entry {pendingEntries === 1 ? "needs" : "need"} approval
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Click to review pending competition entries
            </p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-amber-500" />
        </Link>
      )}

      {/* Quick-access action cards */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {actionCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <card.icon className="size-5 text-primary" />
                </div>
                <ChevronRight className="ml-auto size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <div>
                <h3 className="font-semibold transition-colors group-hover:text-primary">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                {card.cta} →
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Platform health */}
      <div className="rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <CheckCircle2 className="size-4 text-emerald-500" />
          Platform Status
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active competitions</span>
            <span className="font-medium">{activeCompetitions}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending approvals</span>
            <span className={`font-medium ${pendingEntries > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
              {pendingEntries}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
