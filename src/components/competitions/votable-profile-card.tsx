"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Loader2,
  MapPin,
  AtSign,
  Globe,
  Ruler,
  Users,
  Gavel,
  Star,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────

export interface VotableContestant {
  id: string;
  name: string | null;
  country: string | null;
  bio: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  bodyType: string | null;
  gender: string | null;
  instagram: string | null;
  portfolioUrl: string | null;
  profileImage: string | null;
  goals: string | null;
  achievements: string | null;
  personality: string | null;
  occupation: string | null;
  images: { id: string; imageUrl: string; imageType: string }[];
}

export interface VotableCompetition {
  id: string;
  title: string;
  competitionType: string;
  status: string;
}

export interface VotableProfileCardProps {
  contestant: VotableContestant;
  competition: VotableCompetition;
  /** Whether the viewing user has already voted in this competition */
  hasVoted: boolean;
  /** Whether the viewer is the contestant themselves */
  isOwn: boolean;
  /** Whether the viewer is signed in */
  isAuthenticated: boolean;
  /** contestantId to vote for */
  contestantId: string;
}

// ── Voted Ribbon ──────────────────────────────────────────────

function VotedRibbon({ animate }: { animate?: boolean }) {
  return (
    <div
      aria-label="You voted for this contestant"
      className={cn("voted-ribbon", animate && "voted-ribbon-enter")}
    >
      ✓ Voted
    </div>
  );
}

// ── Image Carousel ────────────────────────────────────────────

function ImageCarousel({
  images,
  name,
}: {
  images: { id: string; imageUrl: string; imageType: string }[];
  name: string | null;
}) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  if (total === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + total) % total);
  const next = () => setIdx((i) => (i + 1) % total);

  return (
    <div className="relative h-full w-full bg-muted">
      {/* Main carousel image */}
      <Image
        key={images[idx].id}
        src={images[idx].imageUrl}
        alt={`${name ?? "Contestant"} — photo ${idx + 1}`}
        fill
        priority={idx === 0}
        unoptimized={images[idx].imageUrl.startsWith("/")}
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, 500px"
      />
      {/* Type label */}
      <span className="absolute bottom-3 left-3 z-10 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white capitalize">
        {images[idx].imageType === "FACE" ? "Face" : images[idx].imageType === "FULL_BODY" ? "Full Body" : "Profile"}
      </span>

      {/* Prev/next arrows (only when multiple images) */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-90"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-md transition-all hover:bg-black/60 active:scale-90"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {total > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-1.5 drop-shadow-md">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setIdx(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/80"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Vote Section ──────────────────────────────────────────────

function VoteSection({
  contestant,
  competition,
  hasVoted: initialHasVoted,
  isOwn,
  isAuthenticated,
  contestantId,
  onVoted,
}: VotableProfileCardProps & { onVoted: () => void }) {
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);
  const isActive = competition.status === "ACTIVE";
  const isPublicVoting = competition.competitionType === "PUBLIC_VOTING";

  const handleVote = async () => {
    if (!isAuthenticated) {
      // Store return URL in sessionStorage then redirect to login
      sessionStorage.setItem("returnAfterLogin", window.location.href);
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    if (hasVoted || isOwn || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competitionId: competition.id,
          contestantId,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to cast vote.");
        return;
      }

      setHasVoted(true);
      onVoted();
      // Mobile-friendly bottom toast
      toast.success(`💖 Thanks! You voted for ${contestant.name ?? "her"}!`, {
        duration: 4000,
        position: "bottom-center",
        classNames: {
          toast:
            "!rounded-2xl !shadow-2xl !border-primary/20 !bg-background !text-foreground",
          title: "!text-base !font-semibold",
        },
      });
    } catch {
      toast.error("Network error — please try again.", {
        position: "bottom-center",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't show vote section for jury competitions
  if (!isPublicVoting) return null;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 transition-all",
        hasVoted
          ? "bg-emerald-500/8 border border-emerald-500/20"
          : "bg-primary/5 border border-primary/10"
      )}
    >
      {hasVoted ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </div>
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            You&apos;ve voted for {contestant.name?.split(" ")[0] ?? "her"}!
          </p>
          <p className="text-xs text-muted-foreground">
            Your vote has been recorded. Thank you for participating!
          </p>
        </div>
      ) : isOwn ? (
        <p className="text-center text-sm text-muted-foreground">
          This is your own entry — you can&apos;t vote for yourself.
        </p>
      ) : !isActive ? (
        <p className="text-center text-sm text-muted-foreground">
          This competition is {competition.status.toLowerCase()} — voting is closed.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground">
            {isAuthenticated
              ? "Support this contestant by casting your vote!"
              : "Sign in to vote for this contestant."}
          </p>
          <Button
            size="lg"
            className="w-full gap-2 text-base font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
            onClick={handleVote}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Heart className="size-5" />
            )}
            {loading
              ? "Casting vote…"
              : isAuthenticated
                ? "Vote for her ❤️"
                : "Sign in to vote"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export function VotableProfileCard(props: VotableProfileCardProps) {
  const { contestant, competition, hasVoted: initialHasVoted } = props;
  const [showRibbonAnimate, setShowRibbonAnimate] = useState(false);
  const [voted, setVoted] = useState(initialHasVoted);
  const ribbonRef = useRef(false);

  // Track when vote just happened to trigger entrance animation
  useEffect(() => {
    if (voted && !ribbonRef.current && !initialHasVoted) {
      ribbonRef.current = true;
      setShowRibbonAnimate(true);
    }
  }, [voted, initialHasVoted]);

  const handleVoted = () => setVoted(true);

  const allImages = [
    ...(contestant.profileImage
      ? [{ id: "profile", imageUrl: contestant.profileImage, imageType: "FACE" }]
      : []),
    ...contestant.images,
  ];

  // Deduplicate (profile image might also be in images array)
  const uniqueImages = allImages.filter(
    (img, i, arr) => arr.findIndex((x) => x.imageUrl === img.imageUrl) === i
  );

  const isJury = competition.competitionType === "JURY";

  return (
    <div className="mx-auto w-full max-w-md lg:max-w-none">
      {/* ── Mobile: single column card ── */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl shadow-black/5 lg:hidden">
        {/* Voted ribbon */}
        {voted && <VotedRibbon animate={showRibbonAnimate} />}

        {/* Hero image */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-muted group">
          {uniqueImages.length > 0 ? (
            <ImageCarousel images={uniqueImages} name={contestant.name} />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-8xl font-black text-primary/30">
              {(contestant.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
          {/* Name overlay on hero */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5 z-20 pb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
              {contestant.name ?? "Contestant"}
            </h1>
            {contestant.country && (
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/90 drop-shadow">
                <MapPin className="size-3.5" />
                {contestant.country}
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="space-y-5 p-5">
          {/* Competition + type badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              {isJury ? (
                <Gavel className="size-3 text-purple-500" />
              ) : (
                <Users className="size-3 text-sky-500" />
              )}
              {isJury ? "Jury" : "Public Vote"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                competition.status === "ACTIVE"
                  ? "border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : competition.status === "UPCOMING"
                    ? "border-blue-500/20 text-blue-600 dark:text-blue-400"
                    : "text-muted-foreground"
              )}
            >
              {competition.status === "ACTIVE"
                ? "🟢 Live"
                : competition.status === "UPCOMING"
                  ? "🔵 Upcoming"
                  : "⚫ Closed"}
            </Badge>
            <span className="ml-auto text-xs text-muted-foreground line-clamp-1 max-w-[140px]" title={competition.title}>
              {competition.title}
            </span>
          </div>

          {/* Bio */}
          {contestant.bio && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {contestant.bio}
            </p>
          )}

          {/* Key stats chips */}
          <div className="flex flex-wrap gap-2">
            {contestant.age && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                🎂 {contestant.age} yrs
              </span>
            )}
            {contestant.height && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                <Ruler className="size-3" /> {contestant.height} cm
              </span>
            )}
            {contestant.bodyType && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                ✨ {contestant.bodyType}
              </span>
            )}
            {contestant.occupation && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                💼 {contestant.occupation}
              </span>
            )}
          </div>

          {/* Goals or achievements snippet */}
          {contestant.goals && (
            <div className="rounded-xl bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
              <p className="mb-1 font-semibold text-foreground">Goals & Aspirations</p>
              {contestant.goals}
            </div>
          )}

          {/* Social links */}
          <div className="flex flex-wrap gap-2">
            {contestant.instagram && (
              <a
                href={`https://instagram.com/${contestant.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <AtSign className="size-3.5 text-pink-500" />
                @{contestant.instagram}
              </a>
            )}
            {contestant.portfolioUrl && (
              <a
                href={contestant.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Globe className="size-3.5 text-blue-500" />
                Portfolio
              </a>
            )}
          </div>


          {/* Vote section */}
          <VoteSection {...props} onVoted={handleVoted} hasVoted={voted} />
        </div>
      </div>

      {/* ── Desktop: two-column layout ── */}
      <div className="relative hidden overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl shadow-black/5 lg:grid lg:grid-cols-[420px_1fr]">
        {/* Voted ribbon */}
        {voted && <VotedRibbon animate={showRibbonAnimate} />}

        {/* Left: hero image */}
        <div className="relative min-h-[600px] overflow-hidden bg-muted group">
          {uniqueImages.length > 0 ? (
            <ImageCarousel images={uniqueImages} name={contestant.name} />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-[120px] font-black text-primary/20">
              {(contestant.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
        </div>

        {/* Right: details + vote */}
        <div className="flex flex-col gap-6 overflow-y-auto p-8">
          {/* Header */}
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1 text-xs">
                {isJury ? (
                  <Gavel className="size-3 text-purple-500" />
                ) : (
                  <Users className="size-3 text-sky-500" />
                )}
                {isJury ? "Jury" : "Public Vote"}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  competition.status === "ACTIVE"
                    ? "border-emerald-500/20 text-emerald-600"
                    : "text-muted-foreground"
                )}
              >
                {competition.status === "ACTIVE" ? "🟢 Live" : competition.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{contestant.name}</h1>
            {contestant.country && (
              <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4 text-primary" />
                {contestant.country}
              </p>
            )}
          </div>

          {/* Bio */}
          {contestant.bio && (
            <p className="leading-relaxed text-muted-foreground">{contestant.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Age", value: contestant.age ? `${contestant.age} yrs` : null },
              { label: "Height", value: contestant.height ? `${contestant.height} cm` : null },
              { label: "Body Type", value: contestant.bodyType },
              { label: "Occupation", value: contestant.occupation },
            ]
              .filter((s) => s.value)
              .map((s) => (
                <div key={s.label} className="rounded-xl bg-muted/50 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-sm font-medium capitalize">{s.value}</p>
                </div>
              ))}
          </div>

          {/* Goals */}
          {contestant.goals && (
            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 text-sm">
              <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
                <Info className="size-3.5 text-primary" />
                Goals & Aspirations
              </p>
              <p className="leading-relaxed text-muted-foreground">{contestant.goals}</p>
            </div>
          )}


          {/* Social */}
          <div className="flex flex-wrap gap-2">
            {contestant.instagram && (
              <a
                href={`https://instagram.com/${contestant.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <AtSign className="size-3.5 text-pink-500" />
                @{contestant.instagram}
              </a>
            )}
            {contestant.portfolioUrl && (
              <a
                href={contestant.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Globe className="size-3.5 text-blue-500" />
                Portfolio
              </a>
            )}
            <Link
              href={`/contestants/${contestant.id}`}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              Full Profile →
            </Link>
          </div>

          {/* Vote section */}
          <div className="mt-auto">
            <VoteSection {...props} onVoted={handleVoted} hasVoted={voted} />
          </div>
        </div>
      </div>
    </div>
  );
}
