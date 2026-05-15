"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Trophy,
  BarChart3,
  Shield,
  LayoutDashboard,
  Gavel,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Contestant-only links ────────────────────────────────────
const contestantLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "My Profile", icon: User },
  { href: "/dashboard/competitions", label: "My Competitions", icon: Trophy },
  { href: "/dashboard/results", label: "Results", icon: BarChart3 },
];

// ── Admin-only links (no contestant links mixed in) ───────────
const adminLinks = [
  { href: "/admin", label: "Admin Overview", icon: Shield },
  { href: "/admin/competitions", label: "Competitions", icon: Trophy },
  { href: "/admin/users", label: "Users", icon: User },
];

// ── Jury-only links ──────────────────────────────────────────
const juryLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/jury", label: "Jury Dashboard", icon: Gavel },
];

// ── Public / unrecognised role ───────────────────────────────
const publicLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
];

function getLinks(role?: string) {
  switch (role) {
    case "ADMIN":
      return adminLinks;
    case "JURY":
      return juryLinks;
    case "CONTESTANT":
      return contestantLinks;
    default:
      return publicLinks;
  }
}

export function DashboardSidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const links = getLinks(role);

  const sectionLabel =
    role === "ADMIN" ? "Admin" : role === "JURY" ? "Jury" : "Dashboard";

  return (
    <nav className="sticky top-20 flex flex-col gap-1" aria-label="Sidebar navigation">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {sectionLabel}
      </p>
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard" || href === "/admin" || href === "/jury"
            ? pathname === href
            : pathname.startsWith(href);
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
