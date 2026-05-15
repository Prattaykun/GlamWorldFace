"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  LogOut,
  Shield,
  LayoutDashboard,
  User,
  Trophy,
  BarChart3,
  Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SiteLogo } from "@/components/site-logo";
import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Role-specific dashboard links shown in the mobile drawer
function getDashboardLinks(role?: string) {
  switch (role) {
    case "ADMIN":
      return [
        { href: "/admin", label: "Admin Overview", icon: Shield },
        { href: "/admin/competitions", label: "Competitions", icon: Trophy },
        { href: "/admin/users", label: "Users", icon: User },
      ];
    case "JURY":
      return [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/jury", label: "Jury Dashboard", icon: Gavel },
      ];
    case "CONTESTANT":
      return [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/dashboard/profile", label: "My Profile", icon: User },
        { href: "/dashboard/competitions", label: "My Competitions", icon: Trophy },
        { href: "/dashboard/results", label: "Results", icon: BarChart3 },
      ];
    default:
      return [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ];
  }
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const dashboardLinks = getDashboardLinks(user?.role);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SiteLogo />
        </SheetHeader>

        <Separator />

        {/* Public nav items */}
        <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Auth section */}
        <div className="p-4">
          {user ? (
            <div className="space-y-3">
              {/* User info */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <Avatar className="size-9">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Role-specific dashboard links */}
              <div className="flex flex-col gap-1">
                {dashboardLinks.map(({ href, label, icon: Icon }) => {
                  const active =
                    href === "/dashboard" || href === "/admin" || href === "/jury"
                      ? pathname === href
                      : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
