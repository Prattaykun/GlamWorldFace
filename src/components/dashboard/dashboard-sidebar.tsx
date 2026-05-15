"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Trophy,
  BarChart3,
  Settings,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contestantLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/competitions", label: "Competitions", icon: Trophy },
  { href: "/dashboard/results", label: "Results", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Admin Overview", icon: Shield },
  { href: "/admin/competitions", label: "Competitions", icon: Trophy },
  { href: "/admin/users", label: "Users", icon: User },
];

const juryLinks = [
  { href: "/jury", label: "Jury Dashboard", icon: BarChart3 },
];

export function DashboardSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  let links = contestantLinks;
  if (role === "ADMIN") links = [...contestantLinks, ...adminLinks];
  else if (role === "JURY") links = [...contestantLinks, ...juryLinks];

  return (
    <nav className="sticky top-20 flex flex-col gap-1">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Dashboard
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
