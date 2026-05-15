"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Trophy,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompetitionCard, type ParticipationState } from "@/components/competitions/competition-card";
import type { Competition } from "@/generated/prisma/client";

// ── Types ─────────────────────────────────────────────────────

export interface CompetitionListItem {
  competition: Competition & { _count: { entries: number } };
  /** Only provided in the contestant dashboard view */
  participationState?: ParticipationState;
}

interface Props {
  items: CompetitionListItem[];
  total: number;
  page: number;
  totalPages: number;
  search: string;
  /** Base path for pagination links: "/competitions" or "/dashboard/competitions" */
  basePath: string;
  /** When true, shows participant-specific UI (join button, status indicators) */
  showParticipation?: boolean;
  hasContestantProfile?: boolean;
}

// ── Search bar ────────────────────────────────────────────────

function SearchBar({ defaultValue, basePath }: { defaultValue: string; basePath: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      setValue(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("q", next);
        params.set("page", "1");
      } else {
        params.delete("q");
        params.delete("page");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        id="competition-search"
        type="search"
        placeholder="Search competitions…"
        className="pl-9"
        value={value}
        onChange={handleChange}
        aria-label="Search competitions"
      />
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  search,
  basePath,
}: {
  page: number;
  totalPages: number;
  search: string;
  basePath: string;
}) {
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-2" aria-label="Pagination">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={page <= 1}
        asChild={page > 1}
      >
        {page > 1 ? (
          <Link href={buildHref(page - 1)}>
            <ChevronLeft className="size-4" />
            Previous
          </Link>
        ) : (
          <>
            <ChevronLeft className="size-4" />
            Previous
          </>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={page >= totalPages}
        asChild={page < totalPages}
      >
        {page < totalPages ? (
          <Link href={buildHref(page + 1)}>
            Next
            <ChevronRight className="size-4" />
          </Link>
        ) : (
          <>
            Next
            <ChevronRight className="size-4" />
          </>
        )}
      </Button>
    </nav>
  );
}

// ── Main export ───────────────────────────────────────────────

export function CompetitionsList({
  items,
  total,
  page,
  totalPages,
  search,
  basePath,
  showParticipation = false,
  hasContestantProfile = false,
}: Props) {
  return (
    <div className="space-y-6">
      {/* No-profile warning (contestant only) */}
      {showParticipation && !hasContestantProfile && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Complete your profile to join competitions
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
              Fill in your contestant profile before you can enter a competition.{" "}
              <Link href="/dashboard/profile" className="underline underline-offset-2">
                Go to profile →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <SearchBar defaultValue={search} basePath={basePath} />

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "No competitions found."
          : `${total} competition${total === 1 ? "" : "s"}`}
        {search && ` matching "${search}"`}
      </p>

      {/* Cards grid */}
      {items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ competition, participationState }) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              participation={
                showParticipation
                  ? {
                      state: participationState ?? "not_joined",
                      hasProfile: hasContestantProfile,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 py-20 text-center">
          <Trophy className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {search ? "No competitions match your search." : "No competitions yet."}
          </p>
          {search && (
            <Button variant="ghost" size="sm" className="mt-3" asChild>
              <Link href={basePath}>Clear search</Link>
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        search={search}
        basePath={basePath}
      />
    </div>
  );
}
