import { Container } from "@/components/container";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  User,
  Trophy,
  BarChart3,
  Settings,
  Crown,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your contestant profile, competitions, and results.",
};

export default async function DashboardPage() {
  const session = await auth();

  // Server-side guard (backup for proxy)
  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user;
  const isContestant = user.role === "CONTESTANT";

  const dashboardCards = [
    {
      title: "My Profile",
      description: "View and edit your contestant profile",
      icon: User,
      href: "/dashboard/profile",
    },
    {
      title: "Competitions",
      description: isContestant
        ? "Browse and join competitions"
        : "View available competitions",
      icon: Trophy,
      href: "/competitions",
    },
    {
      title: "Results",
      description: "View your competition results and rankings",
      icon: BarChart3,
      href: "/dashboard/results",
    },
    {
      title: "Settings",
      description: "Account preferences and notifications",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <Container as="section" className="py-12 sm:py-16">
      {/* Welcome section */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Welcome, {user.name?.split(" ")[0] ?? "there"}!
            </h1>
            <p className="text-sm text-muted-foreground">
              {isContestant
                ? "Manage your profile and track your competitions"
                : "Explore competitions and get started"}
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div className="mt-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          {user.role === "ADMIN"
            ? "Admin"
            : user.role === "CONTESTANT"
              ? "Contestant"
              : "Public User"}
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="group relative rounded-xl border border-border/80 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
              <card.icon className="size-5 text-primary" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {card.description}
            </p>
          </a>
        ))}
      </div>

      {/* Quick stats placeholder */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Activity</h2>
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-16">
          <p className="text-sm text-muted-foreground">
            Your competition activity will appear here…
          </p>
        </div>
      </div>
    </Container>
  );
}
