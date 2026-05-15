"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Trophy, Users, Vote, ArrowRight, Star, Sparkles, Home, LayoutGrid, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"home" | "features" | "stats">("home");

  return (
    <>
      {/* ── Desktop & Tablet View (Standard Long Page) ── */}
      <div className="hidden sm:block">
        <HomeContent />
        <FeaturesContent />
        <StatsContent />
        <CtaContent />
      </div>

      {/* ── Mobile View (App-like Tabbed Interface) ── */}
      <div className="block sm:hidden h-[calc(100vh-4rem)] flex flex-col relative pb-16">
        <div className="flex-1 overflow-y-auto w-full">
          {activeTab === "home" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <HomeContent />
              <CtaContent />
            </div>
          )}
          {activeTab === "features" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <FeaturesContent />
            </div>
          )}
          {activeTab === "stats" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <StatsContent />
            </div>
          )}
        </div>

        {/* Bottom Tab Bar */}
        <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border flex items-center justify-around px-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home className="size-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === "features" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid className="size-5" />
            <span className="text-[10px] font-medium">Features</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === "stats" ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart2 className="size-5" />
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </div>
      </div>
    </>
  );
}

function HomeContent() {
  return (
    <section className="relative overflow-hidden sm:border-b border-border/40">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
      <div className="pointer-events-none absolute -top-40 right-0 size-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-0 size-60 rounded-full bg-accent/10 blur-3xl" />

      <Container className="relative py-16 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary sm:text-sm">
            <Sparkles className="size-3.5" />
            The Future of Beauty Pageants
          </div>

          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Where Beauty Meets{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Competition
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Join a world-class platform for beauty pageant competitions.
            Compete in Jury-scored events or Public Voting contests, build
            your profile, and rise through the ranks.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/competitions">
                Browse Competitions
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/auth/register">Join as Contestant</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FeaturesContent() {
  return (
    <section className="py-12 sm:py-24">
      <Container>
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            Everything You Need to Compete
          </h2>
          <p className="mt-3 text-muted-foreground">
            A complete platform designed for contestants, juries, and fans.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Crown className="size-5" />}
            title="Contestant Profiles"
            description="Build a stunning portfolio with photos, measurements, and social links. Showcase your best self to the world."
          />
          <FeatureCard
            icon={<Trophy className="size-5" />}
            title="Jury Competitions"
            description="Get evaluated by experts across presentation, confidence, styling, and professionalism categories."
          />
          <FeatureCard
            icon={<Vote className="size-5" />}
            title="Public Voting"
            description="Let the public decide! Authenticated one‑vote-per-competition system ensures fair outcomes."
          />
          <FeatureCard
            icon={<Star className="size-5" />}
            title="Live Leaderboards"
            description="Real-time rankings powered by jury scores or vote counts. Track your position as the competition unfolds."
          />
          <FeatureCard
            icon={<Users className="size-5" />}
            title="Community Driven"
            description="Connect with fellow contestants, share results, and grow your following through shareable profiles."
          />
          <FeatureCard
            icon={<Sparkles className="size-5" />}
            title="Shareable Results"
            description="Celebrate your achievements with dynamic winner cards and shareable rank badges on social media."
          />
        </div>
      </Container>
    </section>
  );
}

function StatsContent() {
  return (
    <section className="border-y border-border/40 bg-muted/30 py-12 sm:py-16">
      <Container>
        <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          <StatItem value="500+" label="Contestants" />
          <StatItem value="50+" label="Competitions" />
          <StatItem value="10K+" label="Votes Cast" />
          <StatItem value="25+" label="Countries" />
        </div>
      </Container>
    </section>
  );
}

function CtaContent() {
  return (
    <section className="py-12 sm:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 p-8 sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to Start Your Journey?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create your contestant profile today and compete in
              world-class beauty pageant competitions.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/competitions">View Competitions</Link>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Feature Card component ── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative rounded-xl border border-border/60 bg-card p-5 sm:p-6 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ── Stat Item component ── */
interface StatItemProps {
  value: string;
  label: string;
}

function StatItem({ value, label }: StatItemProps) {
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
