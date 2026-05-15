"use client";

import { useActionState, useEffect, useState } from "react";
import { createUserAction, type UserActionState } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X, UserPlus, Shield, Star, Gavel, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "CONTESTANT", label: "Contestant", icon: Star, color: "text-purple-500", bg: "bg-purple-500/10" },
  { value: "JURY", label: "Jury", icon: Gavel, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "ADMIN", label: "Admin", icon: Shield, color: "text-red-500", bg: "bg-red-500/10" },
  { value: "PUBLIC", label: "Public", icon: Eye, color: "text-muted-foreground", bg: "bg-muted" },
];

export function AddUserModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState<UserActionState, FormData>(
    createUserAction,
    null
  );

  const [selectedRole, setSelectedRole] = useState("CONTESTANT");

  // Close modal automatically on success
  useEffect(() => {
    if (state?.success) {
      setIsOpen(false);
    }
  }, [state]);

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <UserPlus className="size-4" />
        Add User
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Glassmorphism Backdrop */}
          <div
            className="absolute inset-0 bg-background/40 backdrop-blur-md transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all sm:p-8 animate-in fade-in zoom-in-95"
            role="dialog"
            aria-modal="true"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-muted/50 p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Add New User</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a new user and assign their platform role.
              </p>
            </div>

            <form action={formAction} className="space-y-5">
              {state?.error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {state.error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g. Jane Doe"
                  required
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. jane@example.com"
                  required
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="bg-background/50 backdrop-blur-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Platform Role</Label>
                <input type="hidden" name="role" value={selectedRole} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setSelectedRole(r.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 p-3 transition-all",
                        selectedRole === r.value
                          ? `border-primary bg-primary/10 ring-1 ring-primary`
                          : "bg-background/50 hover:bg-accent/50"
                      )}
                    >
                      <r.icon
                        className={cn(
                          "size-5",
                          selectedRole === r.value ? r.color : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selectedRole === r.value ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={pending} className="w-full gap-2 shadow-lg">
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Plus className="size-4" />
                  )}
                  {pending ? "Creating User..." : "Create User"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
