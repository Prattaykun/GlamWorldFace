"use client";

import { useActionState, useState, useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Shield,
  Users,
  Star,
  Eye,
  Gavel,
  Trash2,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { updateUserRoleAction, deleteUserAction, type UserActionState } from "@/app/actions/user";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ── Types ─────────────────────────────────────────────────────

type UserRole = "ADMIN" | "CONTESTANT" | "PUBLIC" | "JURY";

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  emailVerified: string | null;
  createdAt: string;
  hasContestant: boolean;
}

// ── Role config ────────────────────────────────────────────────

const ROLES: { value: UserRole; label: string; icon: React.ElementType; className: string }[] = [
  { value: "ADMIN",      label: "Admin",      icon: Shield,   className: "text-red-500 bg-red-500/10 border-red-500/20"     },
  { value: "CONTESTANT", label: "Contestant", icon: Star,     className: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { value: "JURY",       label: "Jury",       icon: Gavel,    className: "text-amber-500 bg-amber-500/10 border-amber-500/20"  },
  { value: "PUBLIC",     label: "Public",     icon: Eye,      className: "text-muted-foreground bg-muted border-border"       },
];

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLES.find((r) => r.value === role) ?? ROLES[3];
  return (
    <Badge variant="outline" className={cn("gap-1 text-xs font-semibold", cfg.className)}>
      <cfg.icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ── Role selector (inline form) ────────────────────────────────

function RoleSelector({ user, currentUserId }: { user: UserRow; currentUserId: string }) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    updateUserRoleAction,
    null
  );
  const isSelf = user.id === currentUserId;
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const handleSelect = (role: UserRole) => {
    if (role === selectedRole || isSelf) return;
    setSelectedRole(role);
    const fd = new FormData();
    fd.set("userId", user.id);
    fd.set("role", role);
    // Trigger via imperative form submit
    formAction(fd);
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isSelf || pending}
          render={
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1"
              disabled={isSelf || pending}
            />
          }
        >
          <RoleBadge role={selectedRole} />
          {!isSelf && (
            pending
              ? <Loader2 className="size-3 animate-spin text-muted-foreground" />
              : <ChevronDown className="size-3 text-muted-foreground" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-40">
          {ROLES.map((r) => (
            <DropdownMenuItem
              key={r.value}
              onClick={() => handleSelect(r.value)}
              className={cn("gap-2 text-xs", selectedRole === r.value && "bg-accent")}
            >
              <r.icon className="size-3.5" />
              {r.label}
              {selectedRole === r.value && <CheckCircle2 className="ml-auto size-3 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {state?.error && (
        <span className="text-[11px] text-destructive">{state.error}</span>
      )}
      {state?.success && !pending && (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      )}
    </div>
  );
}

// ── Delete dialog ─────────────────────────────────────────────

function DeleteUserDialog({
  user,
  open,
  onClose,
}: {
  user: UserRow;
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    deleteUserAction,
    null
  );

  // Auto-close on success
  if (state?.success && open) {
    onClose();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Delete User
          </SheetTitle>
          <SheetDescription>
            This will permanently delete{" "}
            <span className="font-semibold text-foreground">{user.name ?? user.email}</span>{" "}
            and all associated data (contestant profile, entries, votes). This cannot be undone.
          </SheetDescription>
        </SheetHeader>

        {state?.error && (
          <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={pending} className="flex-1">
            Cancel
          </Button>
          <form action={formAction} className="flex-1">
            <input type="hidden" name="userId" value={user.id} />
            <Button type="submit" variant="destructive" disabled={pending} className="w-full gap-2">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Delete permanently
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── User row ───────────────────────────────────────────────────

function UserTableRow({
  user,
  currentUserId,
}: {
  user: UserRow;
  currentUserId: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isSelf = user.id === currentUserId;
  const initials = (user.name ?? user.email)
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <tr className={cn("border-b border-border/60 transition-colors hover:bg-muted/30", isSelf && "bg-primary/3")}>
        {/* Avatar + name */}
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-3">
            <div className="relative size-8 shrink-0 overflow-hidden rounded-full bg-muted">
              {user.image ? (
                <Image src={user.image} alt={user.name ?? "User"} fill className="object-cover" sizes="32px" />
              ) : (
                <div className="flex size-full items-center justify-center text-xs font-bold text-muted-foreground">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name ?? "—"}
                {isSelf && <span className="ml-1.5 text-[10px] text-primary">(you)</span>}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </td>

        {/* Role */}
        <td className="px-3 py-3">
          <RoleSelector user={user} currentUserId={currentUserId} />
        </td>

        {/* Status */}
        <td className="hidden px-3 py-3 sm:table-cell">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {user.emailVerified ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3" /> Email Verified
              </span>
            ) : (
              <span className="text-amber-500">Email Unconfirmed</span>
            )}
            {user.hasContestant && (
              <span className="flex items-center gap-1">
                <Star className="size-3 text-purple-400" /> Has profile
              </span>
            )}
          </div>
        </td>

        {/* Joined */}
        <td className="hidden px-3 py-3 text-xs text-muted-foreground lg:table-cell">
          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
        </td>

        {/* Actions */}
        <td className="py-3 pl-3 pr-4 text-right">
          {!isSelf && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
              aria-label={`Delete ${user.name ?? user.email}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </td>
      </tr>

      {deleteOpen && (
        <DeleteUserDialog
          user={user}
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}

// ── Main users table ──────────────────────────────────────────

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();

  const PAGE_SIZE = 10;

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedUsers = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Reset page when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setSearch(e.target.value);
      setCurrentPage(1);
    });
  };

  const handleRoleFilterChange = (role: UserRole | "ALL") => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="user-search"
            placeholder="Search by name or email…"
            className="pl-9"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => handleRoleFilterChange("ALL")}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              roleFilter === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            All ({users.length})
          </button>
          {ROLES.map((r) => {
            const count = users.filter((u) => u.role === r.value).length;
            return (
              <button
                key={r.value}
                onClick={() => handleRoleFilterChange(r.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  roleFilter === r.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                {r.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Result count */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}{search || roleFilter !== "ALL" ? " matched" : " total"}
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                  Status
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Joined
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                    <Users className="mx-auto mb-2 size-8 text-muted-foreground/30" />
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <UserTableRow key={u.id} user={u} currentUserId={currentUserId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="gap-1.5"
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
