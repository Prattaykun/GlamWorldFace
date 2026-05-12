import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  Shield,
  Users,
  Trophy,
  BarChart3,
  Settings,
  Plus,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Manage competitions, users, and platform settings.",
};

export default async function AdminPage() {
  const session = await auth();

  // Server-side guard (backup for proxy)
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const adminCards = [
    {
      title: "Users",
      description: "Manage platform users and roles",
      icon: Users,
      count: "—",
      href: "/admin/users",
    },
    {
      title: "Competitions",
      description: "Create and manage competitions",
      icon: Trophy,
      count: "—",
      href: "/admin/competitions",
    },
    {
      title: "Analytics",
      description: "View platform statistics",
      icon: BarChart3,
      count: "—",
      href: "/admin/analytics",
    },
    {
      title: "Settings",
      description: "Platform configuration",
      icon: Settings,
      count: null,
      href: "/admin/settings",
    },
  ];

  return (
    <Container as="section" className="py-12 sm:py-16">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Manage competitions, users, and platform settings.
          </p>
        </div>
        <a
          href="/admin/competitions/new"
          className="hidden items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 sm:inline-flex"
        >
          <Plus className="size-4" />
          New Competition
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {adminCards.map((card) => (
          <div
            key={card.title}
            className="group relative rounded-xl border border-border/80 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <card.icon className="size-5 text-primary" />
              </div>
              {card.count && (
                <span className="ml-auto text-2xl font-bold text-primary">
                  {card.count}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
}
