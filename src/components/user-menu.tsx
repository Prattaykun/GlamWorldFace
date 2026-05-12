"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, LayoutDashboard, Shield, User } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu() {
  const { data: session, status } = useSession();

  // Loading skeleton
  if (status === "loading") {
    return (
      <div className="size-8 animate-pulse rounded-full bg-muted" />
    );
  }

  // Not authenticated → show sign in
  if (!session?.user) {
    return (
      <>
        {/* Desktop */}
        <Button
          variant="default"
          size="sm"
          className="hidden md:inline-flex"
          asChild
        >
          <Link href="/auth/login">Sign In</Link>
        </Button>
        {/* Mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          asChild
        >
          <Link href="/auth/login">Login</Link>
        </Button>
      </>
    );
  }

  // Authenticated → show avatar dropdown
  const user = session.user;
  const isAdmin = user.role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            aria-label="User menu"
          />
        }
      >
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Link href="/dashboard" className="flex w-full items-center gap-2">
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link href="/dashboard/profile" className="flex w-full items-center gap-2">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        {isAdmin && (
          <DropdownMenuItem>
            <Link href="/admin" className="flex w-full items-center gap-2">
              <Shield className="size-4" />
              Admin Panel
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <form action={signOutAction}>
          <DropdownMenuItem>
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-destructive"
            >
              <LogOut className="size-4" />
              Sign Out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
