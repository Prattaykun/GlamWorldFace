import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, UserPlus } from "lucide-react";
import { UsersTable } from "@/components/admin/users-table";
import { AddUserModal } from "@/components/admin/add-user-modal";

export const metadata: Metadata = {
  title: "Users | Admin",
  description: "Manage platform users and roles.",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      contestant: { select: { id: true } },
    },
  });

  // Serialise to plain objects for the client component
  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role as "ADMIN" | "CONTESTANT" | "PUBLIC" | "JURY",
    emailVerified: u.emailVerified?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    hasContestant: !!u.contestant,
  }));

  const roleCounts = {
    ADMIN: rows.filter((u) => u.role === "ADMIN").length,
    CONTESTANT: rows.filter((u) => u.role === "CONTESTANT").length,
    JURY: rows.filter((u) => u.role === "JURY").length,
    PUBLIC: rows.filter((u) => u.role === "PUBLIC").length,
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Users</h1>
            <p className="text-sm text-muted-foreground">
              {rows.length} registered user{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Add User Modal */}
        <AddUserModal />
      </div>

      {/* Quick role breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { role: "CONTESTANT", label: "Contestants", color: "text-purple-500", bg: "bg-purple-500/10" },
            { role: "ADMIN",      label: "Admins",      color: "text-red-500",    bg: "bg-red-500/10"    },
            { role: "JURY",       label: "Jury",        color: "text-amber-500",  bg: "bg-amber-500/10"  },
            { role: "PUBLIC",     label: "Public",      color: "text-sky-500",    bg: "bg-sky-500/10"    },
          ] as const
        ).map(({ role, label, color, bg }) => (
          <div
            key={role}
            className="flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-4"
          >
            <div className={`flex size-8 items-center justify-center rounded-lg ${bg}`}>
              <UserPlus className={`size-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{roleCounts[role]}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Users table */}
      <UsersTable users={rows} currentUserId={session.user.id} />
    </section>
  );
}
